"""
ATS Scorer Service

This module contains all scoring and similarity calculation logic.
It determines how well a resume matches a job description.

Key Responsibilities:
- Calculate semantic similarity between resume and job description
- Compute heuristic scores based on resume QUALITY (not just presence)
- Generate feedback and recommendations
- Normalize final scores to 0-100 range (realistic max ~90)

SCORING BREAKDOWN (v4 - Strict & Equal):
========================================

1. HEURISTIC SCORE (5 sections × 10 points = 50 max):
   
   | Section    | Max | How to Score High                      |
   |------------|-----|----------------------------------------|
   | Education  | 10  | Degree level (PhD=7, MS=6, BS=5) +     |
   |            |     | relevant field + top institution       |
   | Experience | 10  | Action verbs (3) + metrics (3) +       |
   |            |     | seniority (2) + top company (1)        |
   | Skills     | 10  | 26+ skills = 10, 21-25 = 9, etc.       |
   | Projects   | 10  | Tech stack (3) + impact (2) +          |
   |            |     | links (2) + multiple projects (1)      |
   | Contact    | 10  | Email (3) + Phone (2) + LinkedIn (2) + |
   |            |     | GitHub (2) + Portfolio (1)             |
   |------------|-----|----------------------------------------|
   | MAX TOTAL  | 50  |                                        |

2. RELEVANCE SCORE (0-50):
   - TF-IDF or SBERT similarity to job description
   - Low relevance (<0.3) penalized more harshly

3. FINAL SCORE (0-100 with realistic scaling):
   - WITHOUT JD: Heuristic × 2 × 0.98 = MAX 98
   - WITH JD:    (Heuristic + Relevance) × 0.98 = MAX 98
   
   Score Interpretation:
   - 95+ = Exceptional (nearly impossible)
   - 85-94 = Excellent (top ~5%)
   - 75-84 = Good
   - 65-74 = Average
   - <65 = Needs improvement
"""

from typing import Optional, Tuple, Dict, List, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.utils.text_cleaner import clean_text, detect_formatting_risks


def compute_relevance_tfidf(resume_text: str, job_text: str) -> float:
    """
    Calculate semantic similarity using TF-IDF (Term Frequency-Inverse Document Frequency).
    
    TF-IDF is a statistical method that measures how important a word is to a document.
    It works by:
    1. Converting both texts into numerical vectors
    2. Calculating cosine similarity between vectors
    3. Returning a score between 0 (no match) and 1 (perfect match)
    
    This is the fallback method when SBERT is not available.
    
    Args:
        resume_text (str): Full resume text
        job_text (str): Job description text
    
    Returns:
        float: Similarity score between 0.0 and 1.0
    
    Example:
        >>> compute_relevance_tfidf("Python developer with 5 years experience", 
        ...                          "Looking for Python developer")
        0.65  # High similarity due to matching keywords
    """
    try:
        # Create TF-IDF vectorizer with English stopword removal
        vect = TfidfVectorizer(stop_words='english')
        
        # Fit and transform both texts
        # Order: [job_description, resume]
        tfidf = vect.fit_transform([job_text or '', resume_text or ''])
        
        # Ensure we have at least 2 documents
        if tfidf.shape[0] < 2:
            return 0.0
        
        # Calculate cosine similarity between job description and resume
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0, 0]
        
        # Handle NaN values
        if np.isnan(sim):
            return 0.0
        
        return float(sim)
    
    except Exception:
        return 0.0


def ats_similarity_score_sbert(resume_text: str, jd_text: str, 
                                sbert_model=None, sbert_enabled: bool = False,
                                stop_words: set = None) -> float:
    """
    Calculate ATS similarity using SBERT (Sentence-BERT) or TF-IDF fallback.
    
    SBERT is a more advanced semantic similarity method that understands
    the meaning of sentences, not just keyword matching.
    
    When SBERT is not available (e.g., on Windows), falls back to TF-IDF.
    
    Args:
        resume_text (str): Full resume text
        jd_text (str): Job description text
        sbert_model: SBERT model instance (or None)
        sbert_enabled (bool): Whether SBERT is available
        stop_words (set): Set of stopwords for text cleaning
    
    Returns:
        float: Similarity score between 0.0 and 1.0
    """
    # If SBERT is not enabled, use TF-IDF fallback
    if not sbert_enabled or not sbert_model:
        return compute_relevance_tfidf(resume_text, jd_text)
    
    try:
        # Clean inputs (remove stopwords, special chars, etc.)
        resume_clean = clean_text(resume_text, stop_words)
        jd_clean = clean_text(jd_text, stop_words)
        
        # Ensure both texts have content
        if not resume_clean or not jd_clean:
            return 0.0
        
        # Generate embeddings (numerical representations of text meaning)
        resume_embedding = sbert_model.encode([resume_clean])
        jd_embedding = sbert_model.encode([jd_clean])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(resume_embedding, jd_embedding)[0][0]
        
        # Ensure similarity is between 0 and 1
        similarity = max(0.0, min(1.0, float(similarity)))
        
        return similarity
    
    except Exception as e:
        print(f"SBERT similarity calculation failed: {e}")
        # Fallback to TF-IDF
        return compute_relevance_tfidf(resume_text, jd_text)


def compute_heuristics(text: str, parsed_sections: dict, 
                       parsing_errors: List[str]) -> Tuple[float, List[str], Dict[str, float]]:
    """
    Compute heuristic score based on resume QUALITY - not just presence.
    
    EQUAL SCORING (v4 - Strict):
    ============================
    Each of 5 sections is scored 0-10 based on QUALITY.
    Nobody gets easy points just for having a section!
    
    | Section    | Max | How to Score High                      |
    |------------|-----|----------------------------------------|
    | Education  | 10  | Degree level + relevant field          |
    | Experience | 10  | Action verbs + metrics + depth         |
    | Skills     | 10  | Quantity (20+) + diversity             |
    | Projects   | 10  | Technical complexity + impact          |
    | Contact    | 10  | Complete (email + phone + LinkedIn)    |
    |------------|-----|----------------------------------------|
    | TOTAL      | 50  |                                        |
    
    Args:
        text (str): Full resume text
        parsed_sections (dict): Dictionary of extracted sections
        parsing_errors (List[str]): List of errors encountered during parsing
    
    Returns:
        Tuple containing:
        - score (float): Heuristic score (0-50)
        - feedback (List[str]): List of feedback messages
        - breakdown (Dict[str, float]): Score breakdown by component
    """
    from app.services.extractor import extract_skills_from_resume
    from app.services.parser import extract_contact_info
    
    score = 0.0
    feedback = []
    breakdown = {
        'education': 0,
        'experience': 0,
        'skills': 0,
        'projects': 0,
        'contact': 0,
        'parsingPenalty': 0
    }
    
    text_lower = text.lower()
    
    # ============================================
    # EDUCATION (0-10 points) - Quality based
    # ============================================
    education_text = parsed_sections.get('education', '') or ''
    edu_score = _score_education(education_text, text_lower)
    breakdown['education'] = round(edu_score, 1)
    score += edu_score
    
    if edu_score < 5:
        if edu_score == 0:
            feedback.append('Missing or undetected Education section')
        else:
            feedback.append('Education section lacks detail - include degree, field, and institution')
    
    # ============================================
    # EXPERIENCE (0-10 points) - Quality based
    # ============================================
    experience_text = parsed_sections.get('experience', '') or ''
    exp_score = _score_experience(experience_text, text_lower)
    breakdown['experience'] = round(exp_score, 1)
    score += exp_score
    
    if exp_score < 5:
        if exp_score == 0:
            feedback.append('Missing or undetected Experience section')
        else:
            feedback.append('Experience lacks impact - add action verbs (led, developed, increased) and quantified results (40%, $1M, 10K users)')
    
    # ============================================
    # SKILLS (0-10 points) - Quality based
    # ============================================
    all_skills = extract_skills_from_resume(text)
    skill_count = len(all_skills)
    skills_score = _score_skills(skill_count, all_skills)
    breakdown['skills'] = round(skills_score, 1)
    score += skills_score
    
    if skills_score < 5:
        feedback.append(f'Only {skill_count} technical skills detected - add more relevant technologies (target: 20+)')
    
    # ============================================
    # PROJECTS (0-10 points) - Quality based
    # ============================================
    projects_text = parsed_sections.get('projects', '') or ''
    proj_score = _score_projects(projects_text, text_lower)
    breakdown['projects'] = round(proj_score, 1)
    score += proj_score
    
    if proj_score < 5:
        if proj_score == 0:
            feedback.append('Missing Projects section - showcase your work with technical details')
        else:
            feedback.append('Projects need more detail - include tech stack, your role, and impact')
    
    # ============================================
    # CONTACT (0-10 points) - Completeness based
    # ============================================
    contact = extract_contact_info(text)
    contact_score = _score_contact(contact, text_lower)
    breakdown['contact'] = round(contact_score, 1)
    score += contact_score
    
    if contact_score < 5:
        feedback.append('Contact info incomplete - add email, phone, and LinkedIn/GitHub')
    
    # ============================================
    # PARSING PENALTY (-10 points max)
    # ============================================
    if parsing_errors:
        penalty = min(10, len(parsing_errors) * 5)
        breakdown['parsingPenalty'] = -penalty
        score -= penalty
        feedback.append('Parsing issues detected: ' + '; '.join(parsing_errors[:3]))
    
    # Clamp score to [0, 50]
    score = max(0.0, min(50.0, score))
    
    return score, feedback, breakdown


def _score_education(education_text: str, full_text: str) -> float:
    """
    Score education section based on quality (0-10).
    
    Scoring:
    - 0: Missing section
    - 2: Has section but minimal info
    - 5: Degree mentioned
    - 7: Degree + relevant field (CS, Engineering, etc.)
    - 9: Degree + field + recognized institution
    - 10: Graduate degree or top institution
    """
    if not education_text and 'education' not in full_text:
        return 0.0
    
    text = (education_text + ' ' + full_text).lower()
    score = 2.0  # Base for having section
    
    # Degree types (higher = better)
    if any(deg in text for deg in ['ph.d', 'phd', 'doctorate', 'doctoral']):
        score += 5.0
    elif any(deg in text for deg in ['master', 'm.s.', 'm.sc', 'mba', 'm.tech', 'mtech']):
        score += 4.0
    elif any(deg in text for deg in ['bachelor', 'b.s.', 'b.sc', 'b.tech', 'btech', 'b.e.', 'undergraduate']):
        score += 3.0
    elif any(deg in text for deg in ['diploma', 'associate', 'certificate']):
        score += 1.5
    
    # Relevant field
    relevant_fields = ['computer science', 'software', 'engineering', 'information technology',
                       'data science', 'artificial intelligence', 'machine learning', 'mathematics',
                       'electrical', 'electronics', 'cs', 'cse', 'it', 'ece']
    if any(field in text for field in relevant_fields):
        score += 1.5
    
    # Top institutions (partial list - add more as needed)
    top_schools = ['mit', 'stanford', 'iit', 'nit', 'iiit', 'bits', 'harvard', 'berkeley',
                   'carnegie mellon', 'georgia tech', 'caltech', 'oxford', 'cambridge']
    if any(school in text for school in top_schools):
        score += 1.0
    
    return min(10.0, score)


def _score_experience(experience_text: str, full_text: str) -> float:
    """
    Score experience section based on quality (0-10).
    
    Scoring criteria:
    - Experience duration: 6+ months = up to 4 points
    - Action verbs: Led, developed, implemented, etc. = up to 2.5 points
    - Quantified achievements: %, $, numbers = up to 2 points
    - Seniority indicators: Senior, Lead, Manager = up to 1 point
    - Company recognition = up to 0.5 points
    """
    if not experience_text and 'experience' not in full_text:
        return 0.0
    
    text = (experience_text + ' ' + full_text).lower()
    score = 0.0
    
    import re
    
    # Experience Duration (up to 4 points) - KEY FACTOR
    # Look for patterns like "2 years", "6 months", "1.5 years", etc.
    duration_patterns = [
        r'(\d+\.?\d*)\s*(?:years?|yrs?)',
        r'(\d+\.?\d*)\s*(?:months?|mos?)',
    ]
    
    total_months = 0
    for pattern in duration_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            val = float(match)
            if 'year' in pattern or 'yr' in pattern:
                total_months += val * 12
            else:
                total_months += val
    
    # Duration scoring
    # Duration scoring (Max 4.0 points)
    found_duration = False
    if total_months >= 6:
        score += 4.0
        found_duration = True
    elif total_months >= 3:
        score += 3.0
        found_duration = True
    elif total_months >= 1:
        score += 2.0
        found_duration = True
    
    # Fallback: Date range detection if no explicit "X years" found
    if not found_duration:
        # Check for years (2010-2029)
        years = re.findall(r'20[12]\d', text)
        distinct_years = len(set(years))
        
        if distinct_years >= 2:
            score += 4.0  # Spans multiple years -> likely >6 months
        elif distinct_years == 1 and ('present' in text or 'current' in text):
            score += 4.0  # Year + Present -> likely >6 months
        elif distinct_years == 1:
            score += 2.5  # At least mentions a year
        elif len(text) > 200:
            score += 1.0  # Decent length description as fallback
    
    # Action verbs (up to 2.5 points)
    action_verbs = [
        'led', 'developed', 'implemented', 'designed', 'architected', 'built',
        'managed', 'created', 'optimized', 'improved', 'reduced', 'increased',
        'delivered', 'launched', 'mentored', 'scaled', 'automated', 'integrated',
        'deployed', 'spearheaded', 'established', 'transformed', 'pioneered'
    ]
    action_count = sum(1 for v in action_verbs if v in text)
    score += min(2.5, action_count * 0.35)
    
    # Quantified achievements (up to 2 points)
    metrics = re.findall(r'\d+%|\$\d+[kmb]?|\d+\s*(?:users|customers|clients|projects|applications|team|engineers|developers)', text)
    score += min(2.0, len(metrics) * 0.4)
    
    # Seniority (up to 1 point)
    seniority = ['senior', 'lead', 'principal', 'staff', 'architect', 'manager', 'director', 'head', 'vp', 'cto', 'ceo']
    seniority_count = sum(1 for s in seniority if s in text)
    score += min(1.0, seniority_count * 0.5)
    
    # Recognized companies (up to 0.5 points)
    top_companies = ['google', 'amazon', 'microsoft', 'meta', 'facebook', 'apple', 'netflix',
                     'uber', 'airbnb', 'stripe', 'linkedin', 'twitter', 'salesforce', 'adobe']
    if any(company in text for company in top_companies):
        score += 0.5
    
    return min(10.0, round(score, 1))


def _score_skills(skill_count: int, skills_list: List) -> float:
    """
    Score skills based on quantity and diversity (0-10).
    
    Scoring:
    - 0: 0.0
    - 1-5 skills: 2.0 + (count * 0.2)
    - 6-15 skills: 3.0 + (count - 5) * 0.4
    - 16-24 skills: 7.0 + (count - 15) * 0.3
    - 25+ skills: 10.0
    """
    if skill_count == 0:
        return 0.0
    
    if skill_count <= 5:
        return round(2.0 + (skill_count * 0.2), 1)
    elif skill_count <= 15:
        return round(3.0 + ((skill_count - 5) * 0.4), 1)
    elif skill_count < 25:
        return round(7.0 + ((skill_count - 15) * 0.3), 1)
    else:
        return 10.0


def _score_projects(projects_text: str, full_text: str) -> float:
    """
    Score projects section based on quality (0-10).
    
    Scoring criteria:
    - Presence of project descriptions
    - Technical stack mentions
    - Impact/results described
    - Links to GitHub/live demos
    """
    # Check for projects section or project-like content
    if not projects_text:
        # Try to find projects mentioned elsewhere
        project_indicators = ['github.com', 'project:', 'built a', 'created a', 'developed a', 'hackathon']
        if not any(ind in full_text for ind in project_indicators):
            return 0.0
        text = full_text
    else:
        text = projects_text + ' ' + full_text
    
    text_lower = text.lower()
    score = 2.0  # Base for having projects
    
    # Technical stack mentioned (up to 3 points)
    tech_indicators = ['react', 'node', 'python', 'javascript', 'typescript', 'java', 'golang', 'rust',
                       'aws', 'docker', 'kubernetes', 'mongodb', 'postgresql', 'api', 'machine learning',
                       'tensorflow', 'pytorch', 'database', 'microservices']
    tech_count = sum(1 for t in tech_indicators if t in text_lower)
    score += min(3.0, tech_count * 0.5)
    
    # Project impact/metrics (up to 2 points)
    import re
    impact_patterns = re.findall(r'\d+\s*(?:users|downloads|stars|forks|views)|deployed|production|live', text_lower)
    score += min(2.0, len(impact_patterns) * 0.5)
    
    # Links to work (up to 2 points)
    links = ['github.com', 'gitlab.com', 'bitbucket', 'herokuapp', 'vercel', 'netlify', 'http://', 'https://']
    link_count = sum(1 for l in links if l in text_lower)
    score += min(2.0, link_count * 0.7)
    
    # Multiple projects mentioned (up to 1 point)
    project_words = text_lower.count('project')
    if project_words >= 3:
        score += 1.0
    elif project_words >= 2:
        score += 0.5
    
    return min(10.0, score)


def _score_contact(contact: dict, full_text: str) -> float:
    """
    Score contact information based on completeness (0-10).
    
    Scoring:
    - Email: 3 points
    - Phone: 2 points
    - LinkedIn: 2 points
    - GitHub: 2 points
    - Portfolio/Website: 1 point
    """
    score = 0.0
    
    # Email (3 points)
    if contact.get('email'):
        score += 3.0
    
    # Phone (2 points)
    if contact.get('phone'):
        score += 2.0
    
    # LinkedIn (2 points)
    if 'linkedin.com' in full_text or 'linkedin' in full_text:
        score += 2.0
    
    # GitHub (2 points)
    if 'github.com' in full_text or 'github' in full_text:
        score += 2.0
    
    # Portfolio/Website (1 point)
    portfolio_indicators = ['portfolio', 'website', '.com/', '.io/', 'vercel.app', 'netlify.app']
    if any(ind in full_text for ind in portfolio_indicators):
        score += 1.0
    
    return min(10.0, score)


def _compute_experience_depth(experience_section: str, full_text: str) -> float:
    """
    Compute experience depth score based on quality indicators.
    
    Looks for:
    - Action verbs (led, developed, implemented, etc.)
    - Quantified achievements (numbers, percentages)
    - Technical terms
    - Seniority indicators (lead, senior, architect, etc.)
    
    Returns:
        float: Score from 0-10
    """
    text_to_analyze = experience_section if experience_section else full_text
    text_lower = text_to_analyze.lower()
    
    score = 0.0
    
    # Action verbs indicate impactful experience (up to 3 points)
    action_verbs = [
        'led', 'developed', 'implemented', 'designed', 'architected',
        'managed', 'built', 'created', 'optimized', 'improved',
        'reduced', 'increased', 'delivered', 'launched', 'mentored',
        'scaled', 'automated', 'integrated', 'deployed', 'spearheaded'
    ]
    action_count = sum(1 for verb in action_verbs if verb in text_lower)
    score += min(3.0, action_count * 0.5)
    
    # Quantified achievements indicate measurable impact (up to 3 points)
    import re
    numbers = re.findall(r'\d+%|\$\d+|\d+\s*(?:users|customers|engineers|developers|team|projects|applications)', text_lower)
    score += min(3.0, len(numbers) * 0.75)
    
    # Seniority indicators (up to 2 points)
    seniority_terms = ['senior', 'lead', 'principal', 'staff', 'architect', 'manager', 'director', 'head of']
    seniority_count = sum(1 for term in seniority_terms if term in text_lower)
    score += min(2.0, seniority_count * 1.0)
    
    # Technical breadth - multiple technology mentions (up to 2 points)
    tech_terms = ['api', 'database', 'cloud', 'aws', 'gcp', 'azure', 'kubernetes', 'docker', 
                  'microservices', 'ci/cd', 'agile', 'scrum', 'testing', 'security']
    tech_count = sum(1 for term in tech_terms if term in text_lower)
    score += min(2.0, tech_count * 0.4)
    
    return min(10.0, score)


def normalize_score(heuristics_score: float, 
                    relevance: Optional[float]) -> Tuple[float, Dict[str, float]]:
    """
    Normalize final ATS score to 0-100 range with REALISTIC scaling.
    
    SCORING BREAKDOWN (all scores out of 100):
    ==========================================
    
    1. HEURISTIC SCORE (max 50 points internally, scaled to 100):
       - Education section:     8 pts  (out of 50)
       - Experience section:   12 pts  (out of 50)
       - Skills section:        5 pts  (out of 50)
       - Skill Count Bonus:    10 pts  (out of 50) - based on # of tech skills
       - Experience Depth:     10 pts  (out of 50) - action verbs, metrics
       - Contact info:          5 pts  (out of 50)
       TOTAL HEURISTIC: 50 pts max
    
    2. RELEVANCE SCORE (max 50 points internally):
       - TF-IDF or SBERT similarity to job description
       - Score of 0.0-1.0 scaled to 0-50 points
    
    3. FINAL SCORE CALCULATION:
       - With JD:    (Heuristic + Relevance) × 0.92 = max ~92
       - Without JD: Heuristic × 2 × 0.90 = max ~90
       
    The 0.90-0.92 scaling ensures scores are REALISTIC:
       - 90+ = Exceptional (top 1%)
       - 80-89 = Excellent
       - 70-79 = Good
       - 60-69 = Average
       - Below 60 = Needs improvement
    
    Args:
        heuristics_score (float): Score from compute_heuristics (0-50)
        relevance (Optional[float]): Similarity score (0-1) or None
    
    Returns:
        Tuple containing:
        - total_score (float): Final score (0-100, realistic max ~92)
        - breakdown (Dict[str, float]): Score breakdown
    """
    # REALISTIC SCALING FACTORS
    SCALE_WITH_JD = 0.98     # Max ~98 with job description
    SCALE_WITHOUT_JD = 0.98  # Max ~98 without job description
    
    if relevance is None or relevance == 0.0:
        # No job description provided - stricter scaling
        # Heuristic doubled but then scaled down
        raw_total = heuristics_score * 2.0
        total = raw_total * SCALE_WITHOUT_JD
        breakdown = {
            'heuristics': round(heuristics_score * 2.0, 2),
            'relevance': 0.0,
            'scalingFactor': SCALE_WITHOUT_JD
        }
    else:
        # With job description - relevance has diminishing returns
        # Low relevance (<0.3) is penalized more harshly
        if relevance < 0.3:
            relevance_component = relevance * 35.0  # Max 10.5 for low match
        elif relevance < 0.6:
            relevance_component = 10.5 + (relevance - 0.3) * 45.0  # 10.5 to 24
        else:
            relevance_component = 24 + (relevance - 0.6) * 65.0  # 24 to 50
        
        raw_total = heuristics_score + relevance_component
        total = raw_total * SCALE_WITH_JD
        breakdown = {
            'heuristics': round(heuristics_score, 2),
            'relevance': round(relevance_component, 2),
            'scalingFactor': SCALE_WITH_JD
        }
    
    # Clamp to [0, 100]
    total = max(0.0, min(100.0, total))
    
    return round(total, 2), breakdown


def generate_white_box_feedback(feedback_items: List[str], relevance: float,
                                parsed_sections: dict, contact: dict,
                                breakdown_components: dict,
                                sbert_enabled: bool = False) -> List[str]:
    """
    Generate detailed, actionable feedback for the resume.
    
    "White box" means the feedback explains WHY the score is what it is,
    not just giving a number. This helps users improve their resumes.
    
    Args:
        feedback_items (List[str]): Initial feedback from heuristic scoring
        relevance (float): Relevance score (0-1)
        parsed_sections (dict): Extracted resume sections
        contact (dict): Extracted contact information
        breakdown_components (dict): Score breakdown
        sbert_enabled (bool): Whether SBERT was used
    
    Returns:
        List[str]: Comprehensive feedback messages
    """
    fb = []
    fb.extend(feedback_items)
    
    # Add relevance interpretation
    if relevance is not None:
        similarity_method = "SBERT" if sbert_enabled else "TF-IDF"
        fb.append(f'Relevance ({similarity_method}) = {round(relevance, 3)}')
        
        # Interpret relevance score
        if relevance < 0.3:
            fb.append('Low semantic match to job description - consider adding more relevant keywords and skills')
        elif relevance < 0.6:
            fb.append('Moderate semantic match to job description - good alignment with some improvement opportunities')
        else:
            fb.append('Excellent semantic match to job description - strong alignment with requirements')
    
    # Section summary
    for sec in ['education', 'experience', 'skills']:
        if parsed_sections.get(sec):
            fb.append(f'{sec.title()} section detected')
        else:
            fb.append(f'{sec.title()} section NOT detected - consider adding this section')
    
    # Contact information feedback
    if contact.get('email'):
        fb.append(f"Email found: {contact.get('email')}")
    else:
        fb.append('Email not found - add professional email address')
    
    if contact.get('phone'):
        fb.append(f"Phone found: {contact.get('phone')}")
    else:
        fb.append('Phone not found - add contact phone number')
    
    # Append breakdown summary
    fb.append('Score breakdown: ' + ', '.join([f"{k}:{v}" for k, v in breakdown_components.items()]))
    
    # Add SBERT-specific recommendations
    if sbert_enabled and relevance is not None:
        if relevance < 0.4:
            fb.append('Recommendation: Use more specific technical terms and industry keywords from the job description')
            fb.append('Recommendation: Align your experience descriptions with the job requirements more closely')
    
    return fb
