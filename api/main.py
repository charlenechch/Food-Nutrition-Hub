# main.py
import os
import io
import json
import numpy as np
from typing import Optional, Dict, Any

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image

import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input as eff_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as rn_pre

import mysql.connector

# ---------- ENV ----------
AI_MODEL_PATH = os.getenv("MODEL_PATH")               # e.g. /app/effb0_best.keras
AI_MODEL2_PATH = os.getenv("SECOND_MODEL_PATH")       # e.g. /app/resnet50_best.keras
LABELS_PATH = os.getenv("LABELS_PATH", "/app/labels.json")

DB_CFG = {
    "host": os.getenv("MYSQLHOST"),
    "port": int(os.getenv("MYSQLPORT", "3306")),
    "user": os.getenv("MYSQLUSER"),
    "password": os.getenv("MYSQLPASSWORD"),
    "database": os.getenv("MYSQLDATABASE"),
}

IMG_SIZE = (224, 224)
THRESHOLD = 0.45  # if max prob < threshold -> "not confident"

# ---------- LOAD LABELS ----------
try:
    with open(LABELS_PATH, "r") as f:
        INDEX_TO_LABEL = json.load(f)
    # labels.json saved as { "0":"foo", "1":"bar", ... }
    CLASS_NAMES = [INDEX_TO_LABEL[str(i)] for i in range(len(INDEX_TO_LABEL))]
except Exception as e:
    print("!! Failed to load labels:", e)
    CLASS_NAMES = []

# ---------- LOAD MODELS (with custom_objects for Lambda preprocess) ----------
def load_model_safely(path: Optional[str], flavor: str):
    if not path or not os.path.exists(path):
        return None
    try:
        if flavor == "eff":
            return tf.keras.models.load_model(
                path,
                custom_objects={
                    "eff_pre": eff_pre,           # your Lambda(layer) name
                    "preprocess_input": eff_pre,  # Keras may look this up by raw name
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
            # try generic
            return tf.keras.models.load_model(path, compile=False)
    except Exception as e:
        print(f"!! load_model error for {path}: {e}")
        return None

eff_model = load_model_safely(AI_MODEL_PATH, "eff") if AI_MODEL_PATH else None
res_model = load_model_safely(AI_MODEL2_PATH, "rn") if AI_MODEL2_PATH else None
print(f"Loaded models -> Eff: {eff_model is not None}, Res: {res_model is not None}")

# ---------- DB ----------
def get_db():
    try:
        conn = mysql.connector.connect(**DB_CFG)
        return conn
    except Exception as e:
        print("!! DB connect error:", e)
        return None

# ---------- FASTAPI ----------
app = FastAPI(title="Food AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictOut(BaseModel):
    pred_class: Optional[str] = None
    confidence: float
    nutrition: Optional[Dict[str, Any]] = None
    tips: Optional[str] = None

def pil_to_array(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize(IMG_SIZE)
    arr = np.array(img).astype("float32")
    # DO NOT divide; preprocessing is inside the model via Lambda
    return arr

def run_models(img_arr: np.ndarray) -> (Optional[str], float):
    """
    Returns (class_name or None, confidence)
    If both models exist -> average logits; else use the single available.
    """
    x = img_arr[None, ...]  # [1,224,224,3]
    preds = []

    if eff_model is not None:
        p = eff_model.predict(x, verbose=0)
        preds.append(p)

    if res_model is not None:
        p = res_model.predict(x, verbose=0)
        preds.append(p)

    if not preds:
        return None, 0.0

    # Ensemble (average)
    p_avg = np.mean(preds, axis=0)  # [1, num_classes]
    idx = int(np.argmax(p_avg, axis=1)[0])
    conf = float(p_avg[0, idx])

    if not CLASS_NAMES:
        return None, conf

    if conf < THRESHOLD:
        return None, conf

    return CLASS_NAMES[idx], conf

def fetch_nutrition(name: str) -> Optional[Dict[str, Any]]:
    """
    Tries exact match on `name`, then fallback on `alternative LIKE`.
    Your columns: foodID, name, origin, category, foodType, difficulty, dietaryTags, description, image, prepTime,
                  culturalSignificance, traditionalPreparation, commonIngredients, alternative, altDescription,
                  healthTips, Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg, likes_count, liked_by
    """
    conn = get_db()
    if not conn:
        return None
    try:
        cur = conn.cursor(dictionary=True)

        # Exact name first
        cur.execute("""
            SELECT foodID, name, origin, foodType, difficulty, dietaryTags, description, image,
                   Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
                   healthTips, alternative, altDescription
            FROM foods
            WHERE LOWER(name) = LOWER(%s)
            LIMIT 1
        """, (name,))
        row = cur.fetchone()
        if row:
            return row

        # Then alternative list fallback (simple LIKE; tune as needed)
        cur.execute("""
            SELECT foodID, name, origin, foodType, difficulty, dietaryTags, description, image,
                   Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
                   healthTips, alternative, altDescription
            FROM foods
            WHERE LOWER(alternative) LIKE CONCAT('%', LOWER(%s), '%')
            LIMIT 1
        """, (name,))
        row = cur.fetchone()
        return row

    finally:
        try:
            cur.close()
            conn.close()
        except Exception:
            pass

@app.get("/health")
def health():
    return {
        "ok": True,
        "labels": len(CLASS_NAMES),
        "eff_model": eff_model is not None,
        "res_model": res_model is not None,
    }

@app.post("/predict", response_model=PredictOut)
async def predict(
    file: UploadFile = File(None),
    food_name: Optional[str] = Form(None),
    ingredients: Optional[str] = Form(None),
):
    # 1) If user typed a known food, fetch DB first (fast path)
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

    # 2) If image uploaded, run model
    if file is not None:
        img_bytes = await file.read()
        img = Image.open(io.BytesIO(img_bytes))
        arr = pil_to_array(img)

        pred_name, conf = run_models(arr)
        if not pred_name:
            # Not confident → return no class (frontend can show “Not sure”)
            return PredictOut(pred_class=None, confidence=conf, nutrition=None)

        info = fetch_nutrition(pred_name) or {}
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
        )

    # 3) No inputs
    return PredictOut(pred_class=None, confidence=0.0, nutrition=None)
