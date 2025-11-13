# ================================================================
# main.py  — Food Recognition Backend (EffNetB0 + ResNet50)
# CLEAN, BUG-FREE, DEPLOY-READY FOR RAILWAY
# ================================================================

import os
import io
import json
import numpy as np
from typing import Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input as eff_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as rn_pre

import mysql.connector


# ================================================================
# ENVIRONMENT VARIABLES
# ================================================================
AI_MODEL_PATH = os.getenv("MODEL_PATH")            # e.g. /app/effb0_best.keras
AI_MODEL2_PATH = os.getenv("SECOND_MODEL_PATH")    # e.g. /app/resnet50_best.keras
LABELS_PATH = os.getenv("LABELS_PATH", "/app/labels.json")

DB_CFG = {
    "host": os.getenv("MYSQLHOST"),
    "port": int(os.getenv("MYSQLPORT", "3306")),
    "user": os.getenv("MYSQLUSER"),
    "password": os.getenv("MYSQLPASSWORD"),
    "database": os.getenv("MYSQLDATABASE"),
}

IMG_SIZE = (224, 224)
THRESHOLD = 0.45  # minimum confidence for valid prediction


# ================================================================
# LABELS LOADING (FIXED)
# ================================================================
try:
    with open(LABELS_PATH, "r") as f:
        raw_labels = json.load(f)

    # If labels.json is an array ["Laksa","Mee",...]
    if isinstance(raw_labels, list):
        CLASS_NAMES = raw_labels
    else:
        # If labels.json is {"0":"Laksa",...}
        CLASS_NAMES = [raw_labels[str(i)] for i in range(len(raw_labels))]

    print("Loaded CLASS_NAMES:", CLASS_NAMES)

except Exception as e:
    print("!! ERROR loading labels:", e)
    CLASS_NAMES = []


# ================================================================
# SAFE MODEL LOADER (EfficientNet & ResNet) — FIXED for Lambda
# ================================================================
def load_model_safely(path: Optional[str], flavor: str):
    if not path or not os.path.exists(path):
        print(f"!! Model path missing: {path}")
        return None

    try:
        if flavor == "eff":
            return tf.keras.models.load_model(
                path,
                custom_objects={
                    "eff_pre": eff_pre,
                    "preprocess_input": eff_pre,  # required for Lambda
                },
                compile=False,
            )
        elif flavor == "rn":
            return tf.keras.models.load_model(
                path,
                custom_objects={
                    "rn_pre": rn_pre,
                    "preprocess_input": rn_pre,
                },
                compile=False,
            )
        return tf.keras.models.load_model(path, compile=False)

    except Exception as e:
        print(f"!! FAILED to load {flavor} model:", e)
        return None


eff_model = load_model_safely(AI_MODEL_PATH, "eff")
res_model = load_model_safely(AI_MODEL2_PATH, "rn")
print(f"[Models Loaded] EfficientNet={eff_model is not None}, ResNet={res_model is not None}")


# ================================================================
# DATABASE CONNECTION
# ================================================================
def get_db():
    try:
        return mysql.connector.connect(**DB_CFG)
    except Exception as e:
        print("!! DB connection failed:", e)
        return None


# ================================================================
# FASTAPI APP
# ================================================================
app = FastAPI(title="Food Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================================
# RESPONSE MODEL
# ================================================================
class PredictOut(BaseModel):
    pred_class: Optional[str]
    confidence: float
    nutrition: Optional[Dict[str, Any]] = None
    tips: Optional[str] = None


# ================================================================
# IMAGE HELPERS
# ================================================================
def pil_to_array(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize(IMG_SIZE)
    return np.array(img).astype("float32")  # no normalization — Lambda handles it


# ================================================================
# MODEL INFERENCE (ENSEMBLE)
# ================================================================
def run_models(arr: np.ndarray):
    x = arr[None, ...]  # shape (1,224,224,3)
    preds = []

    if eff_model is not None:
        preds.append(eff_model.predict(x, verbose=0))

    if res_model is not None:
        preds.append(res_model.predict(x, verbose=0))

    if not preds:
        print("!! No models loaded")
        return None, 0.0

    p_avg = np.mean(preds, axis=0)
    idx = int(np.argmax(p_avg))
    conf = float(p_avg[0][idx])

    if conf < THRESHOLD:
        return None, conf

    if not CLASS_NAMES:
        return None, conf

    return CLASS_NAMES[idx], conf


# ================================================================
# DATABASE LOOKUP
# ================================================================
def fetch_nutrition(name: str):
    conn = get_db()
    if not conn:
        return None

    try:
        cur = conn.cursor(dictionary=True)

        # 1. Exact food name
        cur.execute("""
            SELECT *
            FROM foods
            WHERE LOWER(name) = LOWER(%s)
            LIMIT 1
        """, (name,))
        row = cur.fetchone()
        if row:
            return row

        # 2. Try alternative matches
        cur.execute("""
            SELECT *
            FROM foods
            WHERE LOWER(alternative) LIKE CONCAT('%', LOWER(%s), '%')
            LIMIT 1
        """, (name,))
        return cur.fetchone()

    finally:
        try:
            cur.close()
            conn.close()
        except:
            pass


# ================================================================
# HEALTH CHECK
# ================================================================
@app.get("/health")
def health():
    return {
        "status": "ok",
        "labels_loaded": len(CLASS_NAMES),
        "eff_model": eff_model is not None,
        "res_model": res_model is not None,
    }


# ================================================================
# PREDICTION ENDPOINT
# ================================================================
@app.post("/predict", response_model=PredictOut)
async def predict(
    file: UploadFile = File(None),
    food_name: Optional[str] = Form(None),
    ingredients: Optional[str] = Form(None),
):

    # ------------------------------------------------------------
    # 1) IF USER TYPED A NAME → DIRECT DB LOOKUP
    # ------------------------------------------------------------
    if food_name and food_name.strip():
        info = fetch_nutrition(food_name.strip())
        if info:
            return PredictOut(
                pred_class=info.get("name"),
                confidence=1.0,
                nutrition={
                    "calories": info.get("Energy_kcal"),
                    "protein_g": info.get("Protein_g"),
                    "fat_g": info.get("Fat_g"),
                    "carbs_g": info.get("Carbohydrates_g"),
                    "fiber_g": info.get("Fiber_g"),
                    "vitaminC_mg": info.get("VitaminC_mg"),
                },
                tips=info.get("healthTips"),
            )

    # ------------------------------------------------------------
    # 2) IMAGE INFERENCE
    # ------------------------------------------------------------
    if file is not None:
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes))

        arr = pil_to_array(img)
        pred_class, conf = run_models(arr)

        if not pred_class:
            return PredictOut(pred_class=None, confidence=conf)

        info = fetch_nutrition(pred_class)
        nutrition = None
        if info:
            nutrition = {
                "calories": info.get("Energy_kcal"),
                "protein_g": info.get("Protein_g"),
                "fat_g": info.get("Fat_g"),
                "carbs_g": info.get("Carbohydrates_g"),
                "fiber_g": info.get("Fiber_g"),
                "vitaminC_mg": info.get("VitaminC_mg"),
            }

        return PredictOut(
            pred_class=pred_class,
            confidence=conf,
            nutrition=nutrition,
            tips=info.get("healthTips") if info else None,
        )

    # ------------------------------------------------------------
    # 3) NOTHING PROVIDED
    # ------------------------------------------------------------
    return PredictOut(pred_class=None, confidence=0.0)
