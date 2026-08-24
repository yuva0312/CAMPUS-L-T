# AI-Based Campus Lost & Found System

An intelligent, AI-driven Lost & Found web platform designed for college campuses. Built with React, Node.js/Express, Python FastAPI, Sentence Transformers NLP, and MongoDB.

---

## 🌟 Key Features

- 👤 **Student & Admin Authentication**: JWT authentication with Bcrypt password hashing.
- 📦 **Report Lost & Found Items**: Detailed reporting for lost items and found items across campus.
- ⚡ **AI Smart Match Engine**: Uses Python FastAPI + Sentence Transformers (`all-MiniLM-L6-v2`) and Cosine Similarity to compare item descriptions and compute 0–100% Match Scores.
- 🔒 **Privacy Protection System**: Private item details (brand, unique marks, private descriptions, photos) are redacted from public listings to prevent unauthorized/false claims.
- 📝 **Ownership Verification Workflow**: Multi-field verification questionnaire for students claiming found items, followed by Lost & Found Team review and approval.
- 📊 **Admin Dashboard**: Comprehensive dashboard for reviewing claims, managing items, and analyzing campus recovery statistics.

---

## 🛠️ System Architecture & Tech Stack

- **Frontend**: React 19, Vite 8, React Router DOM 7, Vanilla CSS (Glassmorphism & Dark Mode)
- **Backend API**: Node.js, Express.js, Mongoose ODM
- **Database**: MongoDB Server (`mongodb://127.0.0.1:27017/lost_and_found`)
- **AI Microservice**: Python 3.12, FastAPI, Uvicorn, Sentence Transformers, Scikit-Learn, NumPy

---

## 📋 System Requirements & Prerequisites

- **Node.js**: v18.0.0+
- **Python**: v3.10.0+
- **MongoDB**: MongoDB Community Server running locally on port `27017`

For complete requirements breakdown, see [REQUIREMENTS.md](./REQUIREMENTS.md).

---

## 🚀 How to Run the System Locally

### 1. Start MongoDB Service
Ensure MongoDB Community Server is running on host `127.0.0.1:27017`.

### 2. Start Backend API Server
```bash
cd backend
node server.js
```
*Server runs on:* `http://localhost:5000`

### 3. Start Python FastAPI AI Matching Service
```bash
cd ai-service
python -m app.main
```
*AI Service runs on:* `http://localhost:8000`

### 4. Start Frontend Application
```bash
cd frontend
node node_modules/vite/bin/vite.js
```
*Frontend runs on:* `http://localhost:5173`

---

## 🗄️ Database Configuration

Configuration is located in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lost_and_found
JWT_SECRET=supersecretjwtkey
```
