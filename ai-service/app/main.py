import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from app.services.similarity_service import compare_descriptions

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Lost & Found AI Matching Service",
    description="FastAPI service for semantic similarity analysis between lost and found item reports.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MatchRequest(BaseModel):
    lost_text: str = Field(
        ...,
        example="I lost my black wrist watch near the canteen.",
        description="Text description or combined fields of the lost item."
    )
    found_text: str = Field(
        ...,
        example="A black watch was found close to the college cafeteria.",
        description="Text description or combined fields of the found item."
    )


@app.get("/health")
def health_check():
    """Health check endpoint to verify AI service status."""
    return {
        "status": "healthy",
        "service": "AI Match Service",
        "version": "1.0.0"
    }


@app.post("/api/match")
def compute_match(request: MatchRequest):
    """
    Perform semantic similarity matching between lost item and found item descriptions.
    Returns match score (0-100) and match level.
    NOTE: The AI service does NOT make final ownership decisions.
    """
    if not request.lost_text.strip() or not request.found_text.strip():
        raise HTTPException(status_code=400, detail="Both lost_text and found_text must be non-empty strings.")

    try:
        result = compare_descriptions(request.lost_text, request.found_text)
        return {
            "success": True,
            "matchScore": result["matchScore"],
            "matchLevel": result["matchLevel"],
            "details": result["details"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing AI match score: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
