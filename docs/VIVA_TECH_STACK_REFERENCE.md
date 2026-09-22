# AI-Based College Campus Lost & Found System
## Final Technology Stack & Viva Quick Reference

---

### 1. Frontend Stack
* **React 19** – Modern component-based frontend framework
* **React DOM** – Rendering React UI components into the DOM
* **Vite 8** – Next-generation build tool and fast development server
* **React Router DOM 7** – Single Page Application (SPA) navigation and protected routing
* **Axios** – Promise-based HTTP client for API communication
* **CSS3** – Pure custom styling with HSL color variables
* **CSS Grid & Flexbox** – Responsive, adaptive layout structure
* **CSS Variables** – Dynamic theme customization (Dark/Light mode)
* **Visual FX** – Dark Mode, Glassmorphism (`backdrop-filter`), and responsive micro-animations

---

### 2. Backend Stack
* **Node.js** – Server-side JavaScript runtime environment
* **Express.js 4** – Minimalist web framework for building REST API endpoints
* **CORS** – Cross-Origin Resource Sharing middleware
* **Dotenv** – Environment variable management (`.env`)
* **jsonwebtoken (JWT)** – Token-based stateless authentication
* **bcryptjs** – Salted password hashing (10 rounds)

---

### 3. AI / Machine Learning Stack
* **Python 3.12** – AI service implementation language
* **FastAPI** – High-performance asynchronous microservice framework
* **Uvicorn** – Lightning-fast ASGI server for FastAPI
* **Pydantic** – Data validation and request schema definition
* **Sentence Transformers** – Natural Language Processing (NLP) framework for text embedding
* **all-MiniLM-L6-v2** – Pre-trained transformer model generating 384-dimensional dense vector embeddings
* **Scikit-learn** – TF-IDF vectorizer and cosine similarity calculation fallback
* **NumPy** – Vector dot-products, norm calculations, and linear algebra

---

### 4. Database & Data Layer
* **MongoDB** – NoSQL document database server
* **Mongoose 8** – Object Data Modeling (ODM) library for MongoDB
* **Data Schemas / Collections**:
  1. `User` – Student/admin profiles, roles, and hashed credentials
  2. `LostItem` – Reports submitted for lost items on campus
  3. `FoundItem` – Reports submitted for found items on campus
  4. `Match` – Computed AI similarity scores and candidate links
  5. `Claim` – Claim verification questionnaire workflow & handover status
  6. `Notification` – System alerts and status updates

---

### 5. Overall Architecture Matrix

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router DOM 7, Axios, CSS3 |
| **Backend** | Node.js, Express.js 4, CORS, Dotenv |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` |
| **AI / ML Microservice** | Python 3.12, FastAPI, Sentence Transformers, Scikit-learn, NumPy |
| **NLP Model** | `all-MiniLM-L6-v2` (384-D dense embeddings) |
| **Database Engine** | MongoDB, Mongoose 8 |
| **Communication Protocols** | REST API, JSON, HTTP / HTTPS |

---

### 6. Simple Architecture Flow

```
React 19 + Vite (Port 5173)
       ↓  REST API / JSON
Node.js + Express.js (Port 5000)
       ↓  Mongoose → MongoDB (Port 27017)
       ↓  HTTP Semantic Match Request
FastAPI + Python (Port 8000)
       ↓  Sentence Transformers / TF-IDF
AI Similarity Score (0 - 100%)
```

---

### 7. Most Important Technologies for Viva Presentation

* **React.js** – Builds the dynamic, interactive user interface.
* **Node.js + Express.js** – Handles backend REST APIs, authentication, and core business logic.
* **MongoDB + Mongoose** – Stores and manages application data documents.
* **FastAPI + Python** – Provides the high-performance AI semantic matching microservice.
* **Sentence Transformers** – Understands deep semantic meaning of lost and found text descriptions.
* **Scikit-learn** – Provides TF-IDF and cosine-similarity fallback matching.
* **JWT + bcryptjs** – Ensures secure password hashing and stateless token authentication.
