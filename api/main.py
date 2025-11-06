import os
import io
import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from tensorflow.keras.applications.efficientnet import preprocess_input as eff_pre
from tensorflow.keras.utils import custom_object_scope
import pymysql
from dotenv import load_dotenv

load_dotenv()

# ---------------------- FastAPI App ---------------------- #
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Change to your domain for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------- Load Model ---------------------- #
MODEL_PATH = "effb0_best.keras"

with custom_object_scope({"eff_pre": eff_pre, "preprocess_input": eff_pre}):
    model = tf.keras.models.load_model(MODEL_PATH)

IMG_SIZE = (224, 224)

# ---------------------- MySQL DB ---------------------- #
def get_db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQLHOST"),
        user=os.getenv("MYSQLUSER"),
        password=os.getenv("MYSQLPASSWORD"),
        database=os.getenv("MYSQLDATABASE"),
        port=int(os.getenv("MYSQLPORT", 3306)),
        cursorclass=pymysql.cursors.DictCursor,
    )

# ---------------------- Helper: Predict ---------------------- #
def predict_image(image: Image.Image):
    image = image.resize(IMG_SIZE)
    img_array = np.array(image)
    img_array = eff_pre(img_array)  # Manual preprocessing (to avoid Lambda issue)
    img_array = np.expand_dims(img_array, axis=0)

    predictions = model.predict(img_array)[0]
    class_idx = int(np.argmax(predictions))
    confidence = float(predictions[class_idx])

    return class_idx, confidence

# ---------------------- API ENDPOINT ---------------------- #
@app.post("/predict")
async def analyze_food(
    file: UploadFile = File(None),
    food_name: str = Form(None)
):

    # Case 1: Image provided → AI will detect class
    if file is not None:
        img_bytes = await file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        class_idx, confidence = predict_image(image)

        # Load labels.json
        import json
        with open("labels.json", "r") as f:
            labels = json.load(f)

        pred_class = labels[str(class_idx)]

        food_to_search = pred_class

    # Case 2: User typed manually
    elif food_name:
        food_to_search = food_name.strip()

    else:
        return {"error": "No image or food name provided"}

    # ---------------- Fetch Food Info From DB ---------------- #
    conn = get_db_connection()
    with conn.cursor() as cursor:
        sql = "SELECT * FROM foods WHERE name LIKE %s LIMIT 1"
        cursor.execute(sql, (f"%{food_to_search}%",))
        db_result = cursor.fetchone()
    conn.close()

    response = {
        "predicted_name": food_to_search,
        "confidence": confidence if file else None,
        "found_in_db": bool(db_result),
        "db_data": db_result
    }

    return response

@app.get("/")
def root():
    return {"message": "AI Nutrition FastAPI running!"}
