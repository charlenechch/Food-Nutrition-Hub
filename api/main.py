# main.py — Food Recognition API (EfficientNet)

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

# -------------------------------------------------
# ENVIRONMENT VARIABLES
# -------------------------------------------------
AI_MODEL_PATH = os.getenv("MODEL_PATH")
AI_MODEL2_PATH = os.getenv("SECOND_MODEL_PATH")      # optional
LABELS_PATH = os.getenv("LABELS_PATH", "/app/labels.json")

DB_CFG = {
    "host": os.getenv("MYSQLHOST"),
    "port": int(os.getenv("MYSQLPORT", "3306")),
    "user": os.getenv("MYSQLUSER"),
    "password": os.getenv("MYSQLPASSWORD"),
    "database": os.getenv("MYSQLDATABASE"),
}

IMG_SIZE = (224, 224)
THRESHOLD = 0.0  # confidence threshold


# -------------------------------------------------
# LOAD LABELS
# -------------------------------------------------
try:
    with open(LABELS_PATH, "r") as f:
        raw = json.load(f)

    if isinstance(raw, list):
        CLASS_NAMES = raw
    else:
        CLASS_NAMES = [raw[str(i)] for i in range(len(raw))]
    print("Loaded labels:", CLASS_NAMES)

except Exception as e:
    print("!! Failed to load labels:", e)
    CLASS_NAMES = []


# -------------------------------------------------
# SAFE MODEL LOADER
# -------------------------------------------------
def load_model_safely(path: Optional[str], flavor: str):
    if not path or not os.path.exists(path):
        print(f"!! Model missing at {path}")
        return None

    try:
        if flavor == "eff":
            return tf.keras.models.load_model(
                path,
                custom_objects={
                    "eff_pre": eff_pre,
                    "preprocess_input": eff_pre,
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
        else:
            return tf.keras.models.load_model(path, compile=False)
    except Exception as e:
        print(f"!! Error loading {flavor} model:", e)
        return None


eff_model = load_model_safely(AI_MODEL_PATH, "eff")
res_model = load_model_safely(AI_MODEL2_PATH, "rn")
print(f"Models Loaded → EfficientNet: {eff_model is not None}, ResNet: {res_model is not None}")


# -------------------------------------------------
# DATABASE HELPERS
# -------------------------------------------------
def get_db():
    try:
        return mysql.connector.connect(**DB_CFG)
    except Exception as e:
        print("!! DB connection failed:", e)
        return None


def fetch_nutrition(name: str):
    conn = get_db()
    if not conn:
        return None

    try:
        cur = conn.cursor(dictionary=True)

        # Exact match
        cur.execute(
            """
            SELECT *
            FROM food
            WHERE LOWER(name) = LOWER(%s)
            LIMIT 1
            """,
            (name,),
        )
        row = cur.fetchone()
        if row:
            return row

        # Alternative match
        cur.execute(
            """
            SELECT *
            FROM food
            WHERE LOWER(alternative) LIKE CONCAT('%', LOWER(%s), '%')
            LIMIT 1
            """,
            (name,),
        )
        row = cur.fetchone()
        return row

    finally:
        try:
            cur.close()
            conn.close()
        except:
            pass


# -------------------------------------------------
# FASTAPI SETUP
# -------------------------------------------------
app = FastAPI(title="Food Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# RESPONSE MODEL
# -------------------------------------------------
class PredictOut(BaseModel):
    pred_class: Optional[str]
    confidence: float

    nutrition: Optional[Dict[str, Any]] = None
    tips: Optional[str] = None

    image: Optional[str] = None
    origin: Optional[str] = None
    category: Optional[str] = None
    foodType: Optional[str] = None
    difficulty: Optional[str] = None
    alternative: Optional[str] = None
    altDescription: Optional[str] = None
    commonIngredients: Optional[str] = None


# -------------------------------------------------
# IMAGE PROCESSING + INFERENCE
# -------------------------------------------------
def pil_to_array(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize(IMG_SIZE)
    # If your model already has a Lambda( eff_pre ), keep raw floats:
    return np.array(img).astype("float32")


def run_models(arr: np.ndarray):
    # If preprocessing is inside the model, do NOT call eff_pre here.
    x = arr[None, ...]  # shape (1, 224, 224, 3)

    preds = []

    if eff_model is not None:
        preds.append(eff_model.predict(x, verbose=0))
    if res_model is not None:
        preds.append(res_model.predict(x, verbose=0))

    if not preds:
        return None, 0.0

    avg = np.mean(preds, axis=0)
    idx = int(np.argmax(avg))
    conf = float(avg[0][idx])

    if conf < THRESHOLD or not CLASS_NAMES:
        return None, conf

    return CLASS_NAMES[idx], conf


# -------------------------------------------------
# HEALTH CHECK
# -------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "labels_loaded": len(CLASS_NAMES),
        "eff_model": eff_model is not None,
        "res_model": res_model is not None,
    }


# -------------------------------------------------
# PREDICT ENDPOINT
# -------------------------------------------------
@app.post("/predict", response_model=PredictOut)
async def predict(
    file: UploadFile = File(None),
    food_name: Optional[str] = Form(None),
    ingredients: Optional[str] = Form(None),
):

    # 1) IMAGE INFERENCE (main use-case from frontend)
    if file is not None:
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes))

        arr = pil_to_array(img)
        pred_name, conf = run_models(arr)

        if not pred_name:
            # no confident prediction
            return PredictOut(pred_class=None, confidence=conf)

        info = fetch_nutrition(pred_name)
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
            pred_class=pred_name,
            confidence=conf,
            nutrition=nutrition,
            tips=info.get("healthTips") if info else None,
            image=info.get("image") if info else None,
            origin=info.get("origin") if info else None,
            category=info.get("category") if info else None,
            foodType=info.get("foodType") if info else None,
            difficulty=info.get("difficulty") if info else None,
            alternative=info.get("alternative") if info else None,
            altDescription=info.get("altDescription") if info else None,
            commonIngredients=info.get("commonIngredients") if info else None,
        )

    # 2) NO IMAGE → optional typed food name lookup
    if food_name and food_name.strip():
        info = fetch_nutrition(food_name.strip())
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
                pred_class=info.get("name"),
                confidence=1.0,
                nutrition=nutrition,
                tips=info.get("healthTips") if info else None,
                image=info.get("image") if info else None,
                origin=info.get("origin") if info else None,
                category=info.get("category") if info else None,
                foodType=info.get("foodType") if info else None,
                difficulty=info.get("difficulty") if info else None,
                alternative=info.get("alternative") if info else None,
                altDescription=info.get("altDescription") if info else None,
                commonIngredients=info.get("commonIngredients") if info else None,
            )

    # 3) No usable input
    return PredictOut(pred_class=None, confidence=0.0)
