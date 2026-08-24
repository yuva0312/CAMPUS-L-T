# Software Requirements Specification (SRS)

## AI-Based College Campus Lost & Found System

---

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to define the functional, non-functional, hardware, software, and architectural requirements for the **AI-Based College Campus Lost & Found System**. This document serves as a guide for system deployment, maintenance, and verification.

### 1.2 Scope
The system provides an automated, intelligent web platform for college campus students and administrative staff. It enables students to report lost and found items, leverages Natural Language Processing (NLP) with Sentence Transformers to perform semantic matching between lost and found item reports, enforces privacy redaction on sensitive found item details, and facilitates an ownership verification claim workflow under admin supervision.

---

## 2. System Architecture Overview

The system is designed using a 3-tier microservices architecture:

```
[ React 19 Frontend (Vite) ]  <--- HTTP REST API --->  [ Node.js / Express Backend ]
        (Port 5173)                                           (Port 5000)
                                                                  |
                                                                  +---> [ MongoDB Server ] (Port 27017)
                                                                  |
                                                                  +---> [ Python FastAPI AI Service ] (Port 8000)
                                                                        (Sentence Transformers NLP)
```

---

## 3. Detailed Prerequisites & System Requirements

### 3.1 Hardware Requirements
- **Processor**: Intel Core i3 / AMD Ryzen 3 or higher (Quad-core recommended for NLP embeddings)
- **RAM**: Minimum 4 GB (8 GB recommended for running Node, Python, and MongoDB concurrently)
- **Disk Space**: Minimum 2 GB free disk space for Node modules, Python PyTorch/Transformers packages, and local MongoDB storage.

### 3.2 Software Requirements
- **Operating System**: Windows 10/11 (64-bit), macOS, or Linux
- **Node.js Environment**: v18.0.0 or higher
- **Python Environment**: v3.10.0 or higher (v3.12 verified)
- **Database Engine**: MongoDB Server Community Edition (v6.0+) running locally on port `27017`
- **Web Browser**: Modern browser supporting ES6+, Flexbox/Grid, CSS Glassmorphism (Chrome 100+, Edge, Firefox, Safari)

---

## 4. Module Specifications & Dependencies

### 4.1 Frontend Module (`/frontend`)
- **React 19** (`react`, `react-dom`): Component-based UI logic
- **Vite 8**: Development server and optimized client bundle builder
- **React Router DOM 7**: Client-side single page application (SPA) routing & route protection
- **Axios**: Asynchronous HTTP request handler with authorization headers
- **Styling**: Pure CSS with curated HSL color palette, dark mode aesthetics, and micro-interactions

### 4.2 Backend REST API Module (`/backend`)
- **Node.js & Express.js**: RESTful server framework
- **Mongoose 8**: Object Data Modeling (ODM) layer for MongoDB
- **JSON Web Token (JWT)**: Stateless user session authentication
- **Bcrypt.js**: Salted password hashing (10 rounds)
- **CORS**: Cross-Origin Resource Sharing middleware
- **Axios**: Inter-service HTTP caller to Python AI microservice

### 4.3 AI Semantic Matching Service (`/ai-service`)
- **FastAPI & Uvicorn**: High-performance asynchronous Python web server
- **Sentence Transformers** (`all-MiniLM-L6-v2`): Generates 384-dimensional dense vector embeddings for semantic representation of text
- **Scikit-Learn & NumPy**: Cosine similarity computation between vector embeddings
- **Text Normalization & Preprocessing**: Custom token cleaning, lowercasing, and keyword boosting

---

## 5. Functional Requirements

### FR-1: Authentication & User Accounts
- **FR-1.1**: Students can register using their Full Name, Student Register ID, College Email, Phone Number, Department, and Academic Year.
- **FR-1.2**: Passwords must be securely hashed prior to database persistence.
- **FR-1.3**: JWT authentication tokens must be returned upon valid login and supplied in the `Authorization` header for protected endpoints.
- **FR-1.4**: Administrative accounts have permission to manage claims, inspect unredacted items, and approve/reject claims.

### FR-2: Lost & Found Item Reporting
- **FR-2.1**: Students can report lost items specifying item name, category, campus location, specific room/desk, lost date, lost time, time range, brand, color, unique marks, special features, damage, private description, and image URL.
- **FR-2.2**: Students and staff can report found items logging general and identification parameters.

### FR-3: AI Semantic Matching Engine
- **FR-3.1**: When a user selects a lost item, the backend queries the exact lost item by `_id`.
- **FR-3.2**: The backend retrieves active found candidate items and forwards the lost item text and found item text to the Python FastAPI microservice.
- **FR-3.3**: The AI service computes vector embeddings, evaluates cosine similarity, applies keyword boosting, and outputs a 0–100% Match Score and Match Level (`High Potential Match`, `Possible Match`, `Low Similarity`).
- **FR-3.4**: Match results are returned sorted from highest match score to lowest.

### FR-4: Privacy Protection & Redaction
- **FR-4.1**: Public listings and potential match results must redact sensitive fields (`brand`, `colour`, `uniqueMark`, `specialFeature`, `damage`, `privateDescription`, `imageUrl`) for non-owners to prevent fraudulent claims.

### FR-5: Ownership Verification & Claim Review
- **FR-5.1**: Students claiming a match must complete a verification questionnaire asking for specific item characteristics.
- **FR-5.2**: The system calculates a weighted verification score comparing submitted answers against hidden found item attributes.
- **FR-5.3**: Claims are placed in `pending` status. Claims are **never auto-approved** and require review by the Lost & Found Admin Team.
