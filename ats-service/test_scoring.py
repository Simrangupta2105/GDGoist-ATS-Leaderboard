import sys
sys.path.insert(0, '.')

from pdfminer.high_level import extract_text
from app.services.parser import find_section, extract_contact_info, preprocess_pdf_text
from app.services.scorer import compute_heuristics, normalize_score

pdf_path = r'C:\Users\Lenovo\Documents\Shubhranshu Resume.pdf'
text = extract_text(pdf_path)
processed = preprocess_pdf_text(text)

# Find sections
education = find_section(processed, ['education'])
experience = find_section(processed, ['experience', 'work experience', 'professional experience'])
skills = find_section(processed, ['skills', 'technical skills'])
projects = find_section(processed, ['projects', 'personal projects', 'side projects'])

parsed_sections = {
    'education': education,
    'experience': experience,
    'skills': skills,
    'projects': projects
}

print('=== NEW EQUAL SCORING (5 sections x 10 pts each) ===')
heuristic_score, feedback, breakdown = compute_heuristics(text, parsed_sections, [])

print(f"Education:  {breakdown['education']}/10")
print(f"Experience: {breakdown['experience']}/10")
print(f"Skills:     {breakdown['skills']}/10")
print(f"Projects:   {breakdown['projects']}/10")
print(f"Contact:    {breakdown['contact']}/10")
print(f"---")
print(f"Heuristic Total: {heuristic_score}/50")

final_score, sb = normalize_score(heuristic_score, None)
print(f"FINAL ATS SCORE: {final_score}/100 (max 98)")
print()
print("=== FEEDBACK ===")
for f in feedback:
    print(f"- {f}")
