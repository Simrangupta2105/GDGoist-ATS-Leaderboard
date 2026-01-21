"""
ATS Scoring Routes

This module contains all HTTP endpoint handlers for the ATS service.
Routes handle HTTP requests/responses but delegate all business logic to services.

Key Responsibilities:
- Accept HTTP requests
- Validate input data
- Call appropriate service functions
- Format and return HTTP responses
- Handle errors gracefully

Available Endpoints:
- GET  /health: Service health check
- POST /parse: Parse and score a resume
- POST /semantic-similarity: Calculate similarity between two texts
- POST /similarity: Direct similarity calculation (with metadata)
"""

from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional, Dict, Any
import traceback

from app.services.parser import safe_extract_text, find_section, extract_contact_info
from app.services.extractor import extract_skills_from_section, extract_skills_from_resume
from app.services.scorer import (
    ats_similarity_score_sbert,
    compute_heuristics,
    normalize_score,
    generate_white_box_feedback
)

# Import global configuration from app package
import app

# Create router
router = APIRouter()


@router.get('/health')
def health() -> Dict[str, Any]:
    """
    Health check endpoint.
    
    This endpoint is used to verify that the service is running and
    to check which similarity model is active (SBERT or TF-IDF).
    
    Returns:
        dict: Service status and model information
    
    Example Response:
        {
            "status": "ok",
            "sbert_enabled": false,
            "model": "TF-IDF"
        }
    """
    return {
        'status': 'ok',
        'sbert_enabled': app.SBERT_ENABLED,
        'model': 'all-MiniLM-L6-v2' if app.SBERT_ENABLED else 'TF-IDF'
    }


@router.post('/parse')
async def parse_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Parse and score a resume file.
    
    This is the main endpoint of the ATS service. It:
    1. Accepts a resume file (PDF or DOCX)
    2. Extracts text from the file
    3. Parses sections (education, experience, skills)
    4. Calculates heuristic score (resume structure quality)
    5. If job description provided, calculates relevance score
    6. Combines scores and generates feedback
    
    Args:
        file (UploadFile): Resume file (PDF or DOCX)
        job_description (str, optional): Job description text for relevance scoring
    
    Returns:
        dict: Complete ATS analysis including score, breakdown, and feedback
    
    Example Response:
        {
            "rawText": "John Doe\\nSoftware Engineer\\n...",
            "parsedSkills": ["Python", "JavaScript"],
            "parsingErrors": [],
            "atsScore": 85.5,
            "breakdown": {...},
            "feedback": [...],
            "contact": {"email": "john@example.com", "phone": "+1-555-1234"},
            "similarity_method": "TF-IDF",
            "model_info": {"sbert_enabled": false, "model_name": "TF-IDF"}
        }
    """
    try:
        # Step 1: Read file bytes
        data = await file.read()
        
        # Step 2: Extract text from file (PDF or DOCX)
        raw_text, parsing_errors = safe_extract_text(data, file.filename)
        
        # Step 3: Parse resume sections
        parsed = {}
        
        # Extract skills section
        skills_section = find_section(
            raw_text,
            ['skills', 'technical skills', 'skills & technologies']
        )
        parsed['skills'] = extract_skills_from_section(skills_section)
        
        # Also extract skills from full resume (used for scoring)
        all_skills = extract_skills_from_resume(raw_text)
        
        # Extract education section
        parsed['education'] = find_section(
            raw_text,
            ['education', 'academic', 'qualifications']
        )
        
        # Extract experience section
        parsed['experience'] = find_section(
            raw_text,
            ['experience', 'work experience', 'professional experience', 'employment']
        )
        
        # Step 4: Compute heuristic score (resume structure quality)
        heur_score, heur_feedback, heur_breakdown = compute_heuristics(
            raw_text,
            parsed,
            parsing_errors
        )
        
        # Step 5: Compute relevance score (if job description provided)
        relevance = None
        if job_description:
            relevance = ats_similarity_score_sbert(
                raw_text,
                job_description,
                sbert_model=app.sbert_model,
                sbert_enabled=app.SBERT_ENABLED,
                stop_words=app.STOP_WORDS
            )
        
        # Step 6: Normalize final score (0-100)
        final_score, norm_breakdown = normalize_score(heur_score, relevance)
        
        # Step 7: Extract contact information
        contact = extract_contact_info(raw_text)
        
        # Step 8: Generate detailed feedback
        feedback = generate_white_box_feedback(
            heur_feedback,
            relevance if relevance is not None else 0.0,
            parsed,
            contact,
            {**heur_breakdown, **norm_breakdown},
            sbert_enabled=app.SBERT_ENABLED
        )
        
        # Step 9: Build response
        result = {
            'rawText': raw_text,
            'parsedSkills': all_skills,  # Use full resume skills (matches scoring)
            'parsingErrors': parsing_errors,
            'atsScore': final_score,
            'breakdown': {**heur_breakdown, **norm_breakdown},
            'feedback': feedback,
            'contact': contact,
            'similarity_method': 'SBERT' if app.SBERT_ENABLED else 'TF-IDF',
            'model_info': {
                'sbert_enabled': app.SBERT_ENABLED,
                'model_name': 'all-MiniLM-L6-v2' if app.SBERT_ENABLED else 'TF-IDF'
            }
        }
        
        return result
    
    except Exception as e:
        # Log error and return error response
        traceback.print_exc()
        return {
            'error': 'Failed to parse',
            'detail': str(e)
        }


@router.post('/semantic-similarity')
async def semantic_similarity(
    text1: str = Form(...),
    text2: str = Form(...)
) -> Dict[str, Any]:
    """
    Calculate semantic similarity between two texts.
    
    This endpoint is useful for testing and debugging similarity calculations.
    It accepts any two texts and returns their similarity score.
    
    Args:
        text1 (str): First text
        text2 (str): Second text
    
    Returns:
        dict: Similarity score and method information
    
    Example Response:
        {
            "similarity": 0.75,
            "method": "TF-IDF",
            "model": "TF-IDF"
        }
    """
    try:
        # Calculate similarity using SBERT or TF-IDF
        similarity_score = ats_similarity_score_sbert(
            text1,
            text2,
            sbert_model=app.sbert_model,
            sbert_enabled=app.SBERT_ENABLED,
            stop_words=app.STOP_WORDS
        )
        
        return {
            'similarity': similarity_score,
            'method': 'SBERT' if app.SBERT_ENABLED else 'TF-IDF',
            'model': 'all-MiniLM-L6-v2' if app.SBERT_ENABLED else 'TF-IDF'
        }
    
    except Exception as e:
        traceback.print_exc()
        return {
            'error': 'Failed to calculate similarity',
            'detail': str(e),
            'similarity': 0.0
        }


@router.post('/similarity')
async def calculate_similarity(
    resume_text: str = Form(...),
    job_description: str = Form(...)
) -> Dict[str, Any]:
    """
    Direct similarity calculation with additional metadata.
    
    Similar to /semantic-similarity but specifically designed for
    resume-to-job-description matching and includes text length metadata.
    
    Args:
        resume_text (str): Resume text
        job_description (str): Job description text
    
    Returns:
        dict: Similarity score, method, and text length information
    
    Example Response:
        {
            "similarity_score": 0.75,
            "method": "TF-IDF",
            "model": "TF-IDF",
            "resume_length": 2500,
            "jd_length": 800
        }
    """
    try:
        # Calculate similarity
        similarity_score = ats_similarity_score_sbert(
            resume_text,
            job_description,
            sbert_model=app.sbert_model,
            sbert_enabled=app.SBERT_ENABLED,
            stop_words=app.STOP_WORDS
        )
        
        return {
            'similarity_score': similarity_score,
            'method': 'SBERT' if app.SBERT_ENABLED else 'TF-IDF',
            'model': 'all-MiniLM-L6-v2' if app.SBERT_ENABLED else 'TF-IDF',
            'resume_length': len(resume_text),
            'jd_length': len(job_description)
        }
    
    except Exception as e:
        traceback.print_exc()
        return {
            'error': 'Failed to calculate similarity',
            'detail': str(e)
        }
