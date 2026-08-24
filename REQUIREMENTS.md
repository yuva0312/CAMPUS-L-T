# System Requirements & Specifications

## AI-Based Campus Lost & Found System

---

## 1. System Hardware & Software Prerequisites

| Component | Required Specification | Purpose |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11, macOS, or Linux | Platform runtime |
| **Node.js** | v18.0.0 or higher | Backend server runtime & Frontend package manager |
| **Python** | v3.10.0 or higher (v3.12 verified) | AI Semantic Similarity & Embedding service |
| **MongoDB Server** | MongoDB Community Edition (v6.0+) | Local Database Server (`mongodb://127.0.0.1:27017`) |
| **Web Browser** | Chrome, Edge, Firefox, or Safari (Modern) | Frontend user interface rendering |

---

## 2. Technology Stack & Dependencies

### 🟢 Backend Service (`/backend`)
- **Runtime**: Node.js & Express.js
- **Database ODM**: Mongoose (`^8.10.0`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken ^9.0.2`) & Password Hashing (`bcryptjs ^2.4.3`)
- **Utilities**: `cors`, `dotenv`, `axios`

### 🔵 Frontend Application (`/frontend`)
- **Framework**: React 19 (`^19.2.8`) & React DOM
- **Build Tool**: Vite (`^8.2.0`)
- **Routing**: React Router DOM (`^7.18.2`)
- **HTTP Client**: Axios (`^1.19.0`)
- **Styling**: Vanilla CSS (Custom Design Token System & Glassmorphism Aesthetics)

### 🐍 AI Matching Engine (`/ai-service`)
- **Framework**: FastAPI (`>=0.100.0`) & Uvicorn (`>=0.22.0`)
- **NLP / Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`)
- **Vector Math**: `scikit-learn` (Cosine Similarity) & `numpy`
- **Data Validation**: `pydantic` (`>=2.0.0`) & `python-dotenv`

---

## 3. Database Schema Requirements (`lost_and_found` Database)

| Collection Name | Key Fields | Purpose |
| :--- | :--- | :--- |
| **`users`** | `_id`, `fullName`, `studentId`, `email`, `phone`, `department`, `year`, `password`, `role` | Stores student & admin user accounts |
| **`lostitems`** | `_id`, `userId`, `itemName`, `category`, `location`, `lostDate`, `brand`, `colour`, `uniqueMark`, `status` | Stores reported lost items |
| **`founditems`** | `_id`, `reportedBy`, `itemName`, `category`, `location`, `foundDate`, `brand`, `colour`, `privateDescription`, `status` | Stores reported found items |
| **`matches`** | `_id`, `lostItemId`, `foundItemId`, `matchScore`, `matchLevel`, `status` | Stores AI-generated potential match records |
| **`claims`** | `_id`, `studentId`, `lostItemId`, `foundItemId`, `verificationAnswers`, `verificationScore`, `status` | Stores student claim verification requests |
| **`notifications`** | `_id`, `userId`, `title`, `message`, `type`, `read`, `createdAt` | Stores student status notifications |

---

## 4. Functional & Security Requirements

1. **User Management & Authentication**:
   - Secure student registration with unique Register Number / Student ID and college email verification.
   - Role-Based Access Control (Student vs Admin/Staff).

2. **Report Lost & Found Items**:
   - Structured forms capturing general parameters (item name, category, campus location, date/time range) and identification parameters (brand, color, unique marks, private descriptions).

3. **Smart AI Semantic Matching**:
   - Querying exact selected lost item by `_id`.
   - NLP preprocessing & Sentence Transformer embeddings calculation.
   - Cosine similarity calculation returning 0–100% Match Scores.
   - Match results sorted by highest similarity score.

4. **🔒 Privacy Protection Rule**:
   - Redacting private details (`brand`, `colour`, `uniqueMark`, `specialFeature`, `privateDescription`, `imageUrl`) from public candidate match listings to prevent fraudulent claims.

5. **Ownership Verification & Claim Workflow**:
   - Multi-question verification form (brand, color, exact location, date/time, special marks).
   - Weighted score calculation.
   - Mandatory manual review & approval by the Lost & Found Admin Team.
