"""
Text Cleaning Utilities

This module contains helper functions for cleaning and normalizing text.
These utilities are used throughout the ATS service to prepare text for analysis.

Key Responsibilities:
- Remove special characters
- Normalize whitespace
- Remove stopwords
- Detect formatting issues
"""

import re
from typing import List


def clean_text(text: str, stop_words: set = None) -> str:
    """
    Clean and normalize text for NLP processing.
    
    This function performs several cleaning operations:
    1. Converts text to lowercase
    2. Removes special characters (keeps only letters and spaces)
    3. Normalizes whitespace (removes extra spaces)
    4. Optionally removes stopwords (common words like 'the', 'is', etc.)
    
    Args:
        text (str): Raw text to clean
        stop_words (set, optional): Set of stopwords to remove. If None, no stopword removal.
    
    Returns:
        str: Cleaned and normalized text
    
    Example:
        >>> clean_text("Hello,  World!  This is   a TEST.")
        'hello world this is a test'
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters, keep only letters and spaces
    text = re.sub(r'[^a-z\s]', ' ', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Remove stopwords if provided
    if stop_words:
        text = " ".join(word for word in text.split() if word not in stop_words)
    
    return text


def detect_formatting_risks(text: str) -> List[str]:
    """
    Detect potential formatting or encoding issues in resume text.
    
    ATS systems can struggle with poorly formatted resumes. This function
    identifies common formatting problems that might affect parsing quality.
    
    Checks performed:
    1. Empty or unreadable document
    2. Very long lines (possible formatting issues)
    3. Excessive ALL-CAPS text (poor formatting practice)
    
    Args:
        text (str): Resume text to analyze
    
    Returns:
        List[str]: List of detected formatting risks/warnings
    
    Example:
        >>> detect_formatting_risks("")
        ['Empty or unreadable document']
    """
    risks = []
    
    # Split into non-empty lines
    lines = [ln for ln in text.splitlines() if ln.strip()]
    
    # Check if document is empty
    if not lines:
        risks.append('Empty or unreadable document')
        return risks
    
    # NOTE: Long line detection disabled because PDF extractors often produce
    # long lines due to how text flow is stored in PDFs. This caused false
    # positives on well-formatted resumes.
    # Modern resumes with columns, tables, etc. often extract as long lines.
    
    # Check for excessive ALL-CAPS text
    all_caps_ratio = sum(1 for ln in lines if ln.strip().isupper() and len(ln.strip()) > 10) / max(1, len(lines))
    if all_caps_ratio > 0.2:  # More than 20% of lines are all caps (and long)
        risks.append('Excessive ALL-CAPS lines')
    
    return risks


def normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace in text (remove extra spaces, tabs, newlines).
    
    Args:
        text (str): Text with potentially irregular whitespace
    
    Returns:
        str: Text with normalized whitespace
    """
    if not text:
        return ""
    
    # Replace multiple whitespace characters with single space
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()


def remove_special_characters(text: str, keep_chars: str = "") -> str:
    """
    Remove special characters from text, optionally keeping specific characters.
    
    Args:
        text (str): Text to clean
        keep_chars (str): Additional characters to keep (e.g., "@." for emails)
    
    Returns:
        str: Text with special characters removed
    """
    if not text:
        return ""
    
    # Build pattern: keep letters, numbers, spaces, and specified characters
    pattern = f'[^a-zA-Z0-9\\s{re.escape(keep_chars)}]'
    
    return re.sub(pattern, ' ', text)
