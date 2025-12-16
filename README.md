# Food Nutrition Knowledge Hub (FNH)

The **Food Nutrition Knowledge Hub (FNH)** is a full-stack, AI-powered web platform designed to promote healthier dietary choices through food recognition, nutrition analysis, and community engagement. The system focuses on **local foods**, with particular emphasis on Sarawak/Malaysian cuisine, aligning with **UN SDG 3: Good Health & Well-Being**.

---

## 📌 Project Overview

Food Nutrition Hub enables users to:

* Explore local foods and recipes
* Analyse nutritional content using AI
* Upload food images for recognition
* Receive healthier ingredient suggestions
* Engage with a community knowledge hub
* Access administrative dashboards for data and content management

The platform integrates **web technologies**, **machine learning**, and **cloud services** into a scalable, modular architecture suitable for real-world deployment.

---

## 🧱 System Architecture

The system follows a **multi-tier architecture**:

### 1️⃣ Frontend (Client Layer)

* **Framework**: React + Vite
* **Styling**: Custom CSS
* **Features**:

  * Responsive UI (desktop & mobile)
  * Multi-language support (English & Bahasa Melayu)
  * Image upload & preview
  * Secure authentication flows

### 2️⃣ Backend (Application Layer)

* **Runtime**: Node.js
* **Framework**: Express.js
* **Responsibilities**:

  * RESTful API services
  * User authentication & session handling
  * Communication with database & AI services

### 3️⃣ Database (Data Layer)

* **Database**: MySQL
* **Stores**:

  * User accounts
  * Food & recipe data
  * Nutritional values
  * Logs & analytics metadata

### 4️⃣ AI / ML Microservice

* **Framework**: FastAPI (Python)
* **Models Used**:

  * CNN-based food image classifiers (EfficientNet, ResNet, VGG)
  * NLP models (GPT-4o Mini) for nutrition analysis & suggestions
* **Functions**:

  * Food recognition from images
  * Nutrition estimation & explanation

### 5️⃣ Deployment

* **Frontend**: Vercel
* **Backend & AI Services**: Railway
* **Database**: Railway MySQL

---

## ✨ Key Features

### 👤 User Features

* User registration & login
* Food image upload for recognition
* Nutrition breakdown (calories, protein, fat, carbs, etc.)
* Healthier ingredient alternatives
* Local food & recipe exploration
* Community-oriented food knowledge hub

### 🛠️ Admin Features

* Admin dashboard
* Food & recipe management
* Content moderation
* User management
* System logs & alerts (designed for scalability)

---

## 🧠 AI & Machine Learning

The AI module enhances user experience through:

* **Food Image Classification** using transfer-learned CNNs
* **Text-based Nutrition Reasoning** using LLMs
* **Hybrid Rule-based + AI Logic** to improve reliability

Models are designed to be modular, allowing future upgrades or replacements without affecting the core system.

---

## 🔐 Security & Best Practices

* Environment variables for sensitive credentials
* Secure API communication
* Input validation & error handling
* Role-based access control (Admin vs User)

---

## 🚀 Installation & Setup (Local Development)

### Prerequisites

* Node.js (v18+ recommended)
* Python (v3.9+)
* MySQL

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm start
```

### AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 📊 Future Enhancements

* Personalised nutrition recommendations
* User dietary profiles
* Gamification (badges, streaks)
* Advanced analytics dashboard
* Mobile app integration

---

## 👥 Team & Acknowledgements

This project was developed as part of an academic capstone project at **Swinburne University of Technology Sarawak**.

Special thanks to:

* Project supervisors and lecturers
* Development team members
* Community contributors and testers

---

## 📄 License

This project is developed for **educational purposes**. Commercial use requires further permission.

---

If you have any questions or would like to contribute, feel free to reach out! 🌱
