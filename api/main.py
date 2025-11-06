import io, os, json
from pathlib import Path
from urllib.parse import urlparse, unquote
from typing import Optional, Dict, Any, List

import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input as eff_pre
import mysql.connector

# ----------------- Config -----------------
BASE = Path(__file__).parent
MODEL_PATH = os.getenv("MODEL_PATH", str(BASE / "effb0_best.keras"))
LABELS_PATH = os.getenv("LABELS_PATH", str(BASE / "labels.json"))
IMG_SIZE = (224, 224)

MYSQL_URL = os.getenv("MYSQL_URL")  # e.g. mysql://root:pass@host:port/railway
if not MYSQL_URL:
    raise RuntimeError("MYSQL_URL not set – add it in Railway (link to your MySQL service).")

# ----------------- Load labels & model -----------------
with open(LABELS_PATH, "r") as f:
    labels = json.load(f)

# supports list or {index: name}
CLASS_NAMES = [labels[str(i)] for i in range(len(labels))] if isinstance(labels, dict) else labels

MODEL = tf.keras.models.load_model(
    MODEL_PATH,
    custom_objects={"eff_pre": eff_pre, "preprocess_input": eff_pre}
)

# ----------------- DB helpers -----------------
def _parse_mysql_url(url: str) -> Dict[str, Any]:
    u = urlparse(url)
    return {
        "host": u.hostname,
        "port": u.port or 3306,
        "user": unquote(u.username) if u.username else None,
        "password": unquote(u.password) if u.password else None,
        "database": u.path.lstrip("/") if u.path else None,
    }

DB_KW = _parse_mysql_url(MYSQL_URL)

def db_connect():
    # Railway MySQL works fine without SSL; add ssl_disabled=True if needed:
    return mysql.connector.connect(**DB_KW)

def fetch_food_by_name(name: str) -> Optional[Dict[str, Any]]:
    conn = db_connect()
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT foodID, name, origin, category, foodType, difficulty, dietaryTags,
                   description, image, prepTime, culturalSignificance, traditionalPreparation,
                   commonIngredients, alternative, altDescription, healthTips,
                   Energy_kcal, Protein_g, Fat_g, Carbohydrates_g, Fiber_g, VitaminC_mg,
                   likes_count, liked_by
            FROM food
            WHERE LOWER(name)=LOWER(%s)
            LIMIT 1
        """, (name,))
        row = cur.fetchone()
        return row
    finally:
        cur.close()
        conn.close()

# ----------------- FastAPI -----------------
app = FastAPI(title="SarawakEats AI", version="1.0")

# open to your domains; add your Vercel/localhost here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],             # tighten later if you like
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def prepare(img: Image.Image):
    img = img.convert("RGB").resize(IMG_SIZE)
    x = img_to_array(img)
    x = np.expand_dims(x, 0)  # eff_pre is INSIDE model; do not /255
    return x

@app.get("/health")
def health():
    return {"ok": True, "labels": len(CLASS_NAMES)}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or "image" not in file.content_type:
        raise HTTPException(400, "Please upload an image.")
    try:
        img_bytes = await file.read()
        pil = Image.open(io.BytesIO(img_bytes))
    except Exception:
        raise HTTPException(400, "Unreadable image.")

    x = prepare(pil)
    preds = MODEL.predict(x, verbose=0)[0]
    probs = tf.nn.softmax(preds).numpy()
    i = int(np.argmax(probs))
    food = CLASS_NAMES[i]
    confidence = float(probs[i])

    # DB lookup (exact name match)
    row = fetch_food_by_name(food)

    # build response for the wireframe
    nutrition = None
    if row:
        nutrition = {
            "calories": row.get("Energy_kcal"),
            "protein_g": row.get("Protein_g"),
            "fat_g": row.get("Fat_g"),
            "carbs_g": row.get("Carbohydrates_g"),
            "fiber_g": row.get("Fiber_g"),
            "vitaminC_mg": row.get("VitaminC_mg"),
            "portion_note": "Estimated portion: 1 medium serving (150 g)"
        }

    # tips (string or JSON stored)
    tips: List[str] = []
    if row and row.get("healthTips"):
        ht = str(row["healthTips"]).strip()
        if ht.startswith("["):
            try:
                tips = json.loads(ht)
            except Exception:
                tips = [ht]
        else:
            tips = [ht]

    # alternatives
    alternatives = []
    if row and (row.get("alternative") or row.get("altDescription")):
        alternatives.append({
            "name": row.get("alternative") or "Alternative",
            "calories": None,
            "note": row.get("altDescription") or ""
        })

    extra = None
    if row:
        extra = {
            "origin": row.get("origin"),
            "category": row.get("category"),
            "image": row.get("image"),
            "dietaryTags": row.get("dietaryTags"),
            "description": row.get("description"),
            "culturalSignificance": row.get("culturalSignificance"),
            "traditionalPreparation": row.get("traditionalPreparation"),
            "commonIngredients": row.get("commonIngredients"),
            "likes_count": row.get("likes_count"),
        }

    return {
        "food_name": food,
        "confidence": confidence,
        "nutrition": nutrition,
        "alternatives": alternatives,
        "tips": tips,
        "extra": extra
    }
