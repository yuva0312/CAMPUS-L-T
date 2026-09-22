# Project Abstract
## AI-Based College Campus Lost & Found System

---

### Abstract

In educational institutions, traditional methods for managing lost and found property—such as physical notice boards, manual logbooks, or informal social media channels—often suffer from low recovery rates, significant communication delays, privacy vulnerabilities, and high risk of fraudulent claims. To address these challenges, this project introduces the **AI-Based College Campus Lost & Found System**, an intelligent, automated, 3-tier web platform designed to streamline lost property recovery under administrative supervision.

The system is architected using a modern web stack comprising a **React 19** single-page application frontend, a **Node.js/Express** RESTful backend, a **MongoDB** document database, and an asynchronous **Python FastAPI** AI microservice. The core innovation of the platform lies in its AI-driven semantic matching engine. Utilizing Natural Language Processing (NLP) with pre-trained Sentence Transformers (`all-MiniLM-L6-v2`), the service converts unstructured lost and found item descriptions into 384-dimensional dense vector embeddings. By computing cosine similarity combined with domain-specific keyword boosting algorithms, the system generates accurate similarity match scores (0–100%) and match confidence levels (`High Potential`, `Possible`, `Low Similarity`), successfully mapping semantic synonyms such as *"canteen"* and *"cafeteria"*.

To safeguard student privacy and prevent illegitimate claims, the platform implements an automated attribute redaction layer that conceals sensitive identifying characteristics (e.g., brand, serial numbers, unique marks, color nuances, and images) from public view. Ownership verification is enforced through a dynamic, multi-question verification questionnaire that evaluates claimant answers against hidden found item parameters, generating a weighted confidence score. Final approval and physical item handover are managed strictly through an administrative verification portal. 

Experimental validation demonstrates that the proposed system drastically reduces item recovery turnaround time, eliminates fraudulent ownership claims, and provides campus communities with a secure, transparent, and scalable asset recovery ecosystem.

---

**Keywords**: *Artificial Intelligence, Natural Language Processing, Sentence Transformers, Cosine Similarity, Vector Embeddings, React 19, FastAPI, Express.js, MongoDB, Privacy Redaction, Ownership Verification.*
