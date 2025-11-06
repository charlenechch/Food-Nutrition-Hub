# api/main.py
import os
import io
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from PIL import Image
import numpy as np
import tensorflow as tf

from sqlalchemy import create_engine, text

# ---------- ENV ----------
AI_LABELS_PATH = os.environ.get("LABELS_PATH", "labels.json")
AI_MODEL_PATH  = os.environ.get("MODEL_PATH",  "effb0_best.keras")

# DB via Railway: support DB_* or MYSQL_* sets
DB_HOST = os.environ.get("DB_HOST") or os.environ.get("MYSQLHOST")
DB_PORT = os.environ.get("DB_PORT") or os.environ.get("MYSQLPORT") or "3306"
DB_USER = os.environ.get("DB_USER") or os.environ.get("MYSQLUSER")
DB_PASS = os.environ.get("DB_PASSWORD") or os.environ.get("MYSQLPASSWORD")
DB_NAME = os.environ.get("DB_NAME") or os.environ.get("MYSQLDATABASE")

db_engine = None
if DB_HOST and DB_USER and DB_PASS and DB_NAME:
  db_engine = create_engine(
      f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
      pool_pre_ping=True,
      pool_recycle=280
  )

# ---------- MODEL ----------
eff_model = tf.keras.models.load_model(AI_MODEL_PATH)
IMG_SIZE = (224, 224)

import json
with open(AI_LABELS_PATH, "r") as f:
    INDEX_TO_LABEL = json.load(f)  # {"0":"Laksa",...}

def preprocess_pil(img: Image.Image) -> np.ndarray:
    img = img.convert("RGB").resize(IMG_SIZE)
    arr = tf.keras.preprocessing.image.img_to_array(img)
    from tensorflow.keras.applications.efficientnet import preprocess_input as eff_pre
    arr = eff_pre(arr)
    return np.expand_dims(arr, 0)

def predict_image(img: Image.Image) -> Dict[str, Any]:
    x = preprocess_pil(img)
    preds = eff_model.predict(x, verbose=0)[0]
    idx  = int(np.argmax(preds))
    label = INDEX_TO_LABEL.get(str(idx), f"class_{idx}")
    conf = float(preds[idx])
    return {"pred_class": label, "confidence": conf}

def fetch_food_row_by_name(name: str) -> Optional[Dict[str, Any]]:
    if not db_engine: return None
    with db_engine.connect() as conn:
        row = conn.execute(
            text("SELECT * FROM food WHERE LOWER(name)=LOWER(:n) LIMIT 1"),
            {"n": name}
        ).mappings().first()
        return dict(row) if row else None

app = FastAPI()

# CORS: allow your frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://food-nutrition-hub.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True, "labels": len(INDEX_TO_LABEL)}

class AltItem(BaseModel):
    name: str
    calories: Optional[float] = None
    note: Optional[str] = None

class PredictResponse(BaseModel):
    food_name: Optional[str] = None
    pred_class: Optional[str] = None
    confidence: Optional[float] = None
    nutrition: Optional[Dict[str, Any]] = None
    tips: Optional[List[str]] = None
    alternatives: Optional[List[AltItem]] = None
    portion_note: Optional[str] = None
    source: str = "ai"

@app.post("/predict", response_model=PredictResponse)
async def predict(
    image: UploadFile = File(...),
    food_name: Optional[str] = Form(None),
    ingredients: Optional[str] = Form(None),
):
    # read image
    raw = await image.read()
    img = Image.open(io.BytesIO(raw))
    pred = predict_image(img)

    # try to enrich with DB
    db_row = fetch_food_row_by_name(food_name or pred["pred_class"])
    if db_row:
        return {
            "food_name": db_row["name"],
            "pred_class": pred["pred_class"],
            "confidence": pred["confidence"],
            "nutrition": {
                "Energy_kcal": db_row["Energy_kcal"],
                "Protein_g": db_row["Protein_g"],
                "Fat_g": db_row["Fat_g"],
                "Carbohydrates_g": db_row["Carbohydrates_g"],
                "Fiber_g": db_row["Fiber_g"],
                "VitaminC_mg": db_row["VitaminC_mg"],
            },
            "tips": [db_row["healthTips"]] if db_row.get("healthTips") else [],
            "alternatives": [
                {"name": a.strip(), "note": db_row.get("altDescription")}
                for a in (db_row.get("alternative") or "").split(",")
                if a.strip()
            ],
            "portion_note": "Estimated portion: 1 medium serving (150 g)",
            "source": "ai+db",
        }

    # fallback: AI-only record
    return {
        "food_name": food_name,
        "pred_class": pred["pred_class"],
        "confidence": pred["confidence"],
        "nutrition": None,
        "tips": [],
        "alternatives": [],
        "portion_note": "Estimated portion: 1 medium serving (150 g)",
        "source": "ai",
    }
