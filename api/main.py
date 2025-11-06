import io, os, json
from pathlib import Path
from typing import List, Dict, Any

import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.efficientnet import preprocess_input as eff_pre  # MUST match training

# -------------------- Config --------------------
BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")

MYSQL_URL = os.getenv("MYSQL_URL")
if not MYSQL_URL:
    raise RuntimeError("Missing MYSQL_URL in api/.env")

MODEL_PATH = os.getenv("MODEL_PATH", str(BASE_DIR / "effb0_best.keras"))
LABELS_PATH = os.getenv("LABELS_PATH", str(BASE_DIR / "labels.json"))
IMG_SIZE = (224, 224)  # your training size

# DB engine
ENGINE = create_engine(MYSQL_URL, pool_pre_ping=True, future=True)

# Labels
with open(LABELS_PATH, "r") as f:
    CLASS_NAMES = json.load(f)  # e.g., ["Kolo Mee", "Laksa Sarawak", ...]
    # if it's a dict {idx: name}, normalize to list
    if isinstance(CLASS_NAMES, dict):
        CLASS_NAMES = [CLASS_NAMES[str(i)] for i in range(len(CLASS_NAMES))]

# Model (note: custom_objects required because you used Lambda eff_pre)
MODEL = tf.keras.models.load_model(
    MODEL_PATH,
    custom_objects={"eff_pre": eff_pre, "preprocess_input": eff_pre}
)

# -------------------- App -----------------------
app = FastAPI(title="SarawakEats Food AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # replace with your domain(s) in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------- Helpers --------------------
def prepare_image(pil_img: Image.Image) -> np.ndarray:
    pil_img = pil_img.convert("RGB").resize(IMG_SIZE)           # 224x224
    x = img_to_array(pil_img)
    # DO NOT /255 here because your model has an eff_pre Lambda inside
    x = np.expand_dims(x, axis=0)
    return x

def _parse_tips(tips_val) -> List[str]:
    if not tips_val:
        return []
    s = str(tips_val).strip()
    if not s:
        return []
    # If it looks like JSON array, parse; otherwise return single-item list
    if s.startswith("[") and s.endswith("]"):
        try:
            parsed = json.loads(s)
            return [str(t).strip() for t in parsed if str(t).strip()]
        except Exception:
            pass
    return [s]

def fetch_food_row(food_name: str) -> Dict[str, Any] | None:
    sql = text("""
        SELECT
            name,
            Energy_kcal,
            Protein_g,
            Fat_g,
            Carbohydrates_g,
            Fiber_g,
            healthTips,
            alternative,
            altDescription
        FROM food
        WHERE LOWER(name) = LOWER(:n)
        LIMIT 1
    """)
    with ENGINE.connect() as conn:
        row = conn.execute(sql, {"n": food_name}).mappings().first()
    return dict(row) if row else None

def build_response(food_name: str, confidence: float) -> Dict[str, Any]:
    row = fetch_food_row(food_name)

    nutrition = None
    tips = []
    alternatives = []

    if row:
        nutrition = {
            "calories": row.get("Energy_kcal"),
            "protein_g": row.get("Protein_g"),
            "fat_g": row.get("Fat_g"),
            "carbs_g": row.get("Carbohydrates_g"),
            "fiber_g": row.get("Fiber_g"),
            "portion_note": "Estimated portion: 1 medium serving (150 g)"  # tweak if you store this later
        }
        tips = _parse_tips(row.get("healthTips"))
        alt_name = (row.get("alternative") or "").strip()
        alt_desc = (row.get("altDescription") or "").strip()
        if alt_name or alt_desc:
            alternatives.append({"name": alt_name or "Alternative", "calories": None, "note": alt_desc})

    return {
        "food_name": food_name,
        "confidence": round(float(confidence), 4),
        "nutrition": nutrition,
        "alternatives": alternatives,    # always array
        "tips": tips                     # always array
    }

# ------------------- Routes ---------------------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or "image" not in file.content_type:
        raise HTTPException(status_code=400, detail="Please upload an image file")
    img_bytes = await file.read()
    try:
        image = Image.open(io.BytesIO(img_bytes))
    except Exception:
        raise HTTPException(status_code=400, detail="Unreadable image")

    x = prepare_image(image)
    # Model already contains eff_pre Lambda, so input should be raw RGB
    preds = MODEL.predict(x, verbose=0)  # shape (1, num_classes)
    probs = tf.nn.softmax(preds[0]).numpy()
    top_idx = int(np.argmax(probs))
    confidence = float(probs[top_idx])
    food_name = CLASS_NAMES[top_idx]

    return build_response(food_name, confidence)

@app.get("/health")
def health():
    # quick sanity checks (DB + model/labels)
    with ENGINE.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"ok": True, "labels": len(CLASS_NAMES)}
