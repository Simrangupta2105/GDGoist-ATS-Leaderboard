"""
Skill Extractor Service

This module extracts skills and keywords from resume text.
It focuses on identifying technical skills, tools, and technologies.

Key Responsibilities:
- Extract skills from a dedicated "Skills" section
- Extract skills from the ENTIRE resume text
- Parse comma/newline-separated skill lists
- Match against known technology keywords
"""

import re
from typing import List, Optional, Set


# Comprehensive list of technical skills and technologies
KNOWN_SKILLS: Set[str] = {
    # Programming Languages
    'python', 'java', 'javascript', 'typescript', 'c', 'c++', 'c#', 'go', 'golang',
    'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'lua',
    'haskell', 'elixir', 'clojure', 'dart', 'objective-c', 'assembly', 'fortran',
    'cobol', 'visual basic', 'vb.net', 'f#', 'groovy', 'julia',
    
    # Web Frontend
    'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less', 'tailwind', 'tailwindcss',
    'bootstrap', 'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs',
    'vue.js', 'svelte', 'nextjs', 'next.js', 'nuxt', 'nuxtjs', 'gatsby', 'jquery',
    'webpack', 'vite', 'parcel', 'rollup', 'babel', 'redux', 'mobx', 'zustand',
    'graphql', 'apollo', 'material-ui', 'mui', 'chakra', 'ant design', 'styled-components',
    
    # Web Backend
    'node', 'nodejs', 'node.js', 'express', 'expressjs', 'fastify', 'koa', 'nestjs',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', 'springboot', 'rails',
    'ruby on rails', 'laravel', 'symfony', 'asp.net', '.net', 'dotnet', '.net core',
    'gin', 'echo', 'fiber', 'actix', 'rocket', 'phoenix', 'phoenix framework',
    
    # Databases
    'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'sqlite', 'oracle', 'redis',
    'cassandra', 'dynamodb', 'elasticsearch', 'mariadb', 'couchdb', 'neo4j', 'firestore',
    'firebase', 'supabase', 'prisma', 'sequelize', 'typeorm', 'mongoose', 'knex',
    'influxdb', 'timescaledb', 'cockroachdb', 'planetscale',
    
    # Cloud & DevOps
    'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'google cloud platform',
    'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'circleci',
    'github actions', 'gitlab ci', 'travis ci', 'argo', 'helm', 'istio', 'prometheus',
    'grafana', 'datadog', 'splunk', 'new relic', 'cloudformation', 'pulumi', 'vagrant',
    'packer', 'consul', 'vault', 'nomad', 'serverless', 'lambda', 'ec2', 's3', 'rds',
    'cloudfront', 'route53', 'elastic beanstalk', 'ecs', 'eks', 'fargate', 'cloudwatch',
    
    # Data & ML
    'machine learning', 'ml', 'deep learning', 'neural networks', 'tensorflow', 'pytorch',
    'keras', 'scikit-learn', 'sklearn', 'pandas', 'numpy', 'scipy', 'matplotlib',
    'seaborn', 'plotly', 'jupyter', 'jupyter notebook', 'data science', 'data analysis',
    'data engineering', 'etl', 'spark', 'apache spark', 'pyspark', 'hadoop', 'hive',
    'kafka', 'airflow', 'dbt', 'snowflake', 'bigquery', 'redshift', 'databricks',
    'nlp', 'natural language processing', 'computer vision', 'opencv', 'llm',
    'langchain', 'hugging face', 'transformers', 'bert', 'gpt', 'openai', 'rag',
    
    # Mobile
    'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova',
    'swiftui', 'uikit', 'jetpack compose', 'android studio', 'xcode',
    
    # Testing
    'jest', 'mocha', 'chai', 'jasmine', 'playwright', 'cypress', 'selenium',
    'pytest', 'unittest', 'junit', 'testng', 'mockito', 'rspec', 'enzyme',
    'testing library', 'puppeteer', 'webdriver', 'postman', 'insomnia', 'k6', 'locust',
    'jmeter', 'load testing', 'unit testing', 'integration testing', 'e2e testing',
    
    # Version Control & Collaboration
    'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial', 'jira', 'confluence',
    'trello', 'asana', 'slack', 'notion', 'linear', 'figma', 'sketch', 'adobe xd',
    
    # Methodologies
    'agile', 'scrum', 'kanban', 'devops', 'devsecops', 'ci/cd', 'cicd', 'tdd',
    'bdd', 'microservices', 'soa', 'rest', 'restful', 'api', 'apis', 'oauth',
    'jwt', 'sso', 'saml', 'oidc', 'graphql', 'grpc', 'websocket', 'websockets',
    
    # Other
    'linux', 'unix', 'bash', 'shell', 'powershell', 'windows server', 'nginx',
    'apache', 'iis', 'rabbitmq', 'zeromq', 'celery', 'cron', 'systemd',
    'embedded', 'iot', 'raspberry pi', 'arduino', 'mqtt', 'blockchain', 'solidity',
    'web3', 'rust', 'wasm', 'webassembly', 'electron', 'tauri', 'pwa',
}


def extract_skills_from_section(section_text: Optional[str]) -> List[str]:
    """
    Extract individual skills from a skills section.
    
    Skills sections in resumes typically list skills separated by:
    - Commas: "Python, Java, JavaScript"
    - Newlines: "Python\\nJava\\nJavaScript"
    - Bullets: "• Python • Java • JavaScript"
    - Semicolons: "Python; Java; JavaScript"
    
    This function:
    1. Splits the section by common delimiters
    2. Cleans up each skill (removes whitespace)
    3. Filters out invalid entries (too short or too long)
    
    Args:
        section_text (Optional[str]): Text from the skills section (or None if not found)
    
    Returns:
        List[str]: List of extracted skills
    
    Example:
        >>> extract_skills_from_section("Python, Java, React.js, Docker")
        ['Python', 'Java', 'React.js', 'Docker']
        
        >>> extract_skills_from_section("• Python\\n• Machine Learning\\n• AWS")
        ['Python', 'Machine Learning', 'AWS']
    """
    if not section_text:
        return []
    
    # Split by common delimiters:
    # - Newlines (\n)
    # - Commas (,)
    # - Semicolons (;)
    # - Bullet points (• or \u2022)
    # - Pipes (|)
    tokens = re.split(r'[\n,;•\u2022|]+', section_text)
    
    skills = []
    for t in tokens:
        # Clean up whitespace
        s = t.strip()
        
        # Filter: skill should be between 2 and 60 characters
        # This removes:
        # - Single characters (likely noise)
        # - Very long strings (likely full sentences, not skills)
        if 2 <= len(s) <= 60:
            skills.append(s)
    
    return skills


def extract_skills_from_resume(text: str) -> List[str]:
    """
    Extract technical skills from the ENTIRE resume text.
    
    This function matches words in the resume against a comprehensive
    list of known technical skills and technologies. This ensures we
    capture skills mentioned anywhere in the resume, not just in the
    skills section.
    
    Args:
        text (str): Full resume text
    
    Returns:
        List[str]: List of unique skills found (original casing)
    
    Example:
        >>> extract_skills_from_resume("I developed a React app using Python and AWS")
        ['React', 'Python', 'AWS']
    """
    if not text:
        return []
    
    found_skills = []
    text_lower = text.lower()
    
    # Find all known skills mentioned in the text
    for skill in KNOWN_SKILLS:
        # Use word boundary matching to avoid partial matches
        # e.g., "react" shouldn't match "reaction"
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            # Get the original casing from the text if possible
            match = re.search(pattern, text_lower)
            if match:
                # Find the matching text in original case
                start, end = match.start(), match.end()
                original_skill = text[start:end]
                found_skills.append(original_skill)
    
    # Deduplicate while preserving order
    return deduplicate_skills(found_skills)


def extract_keywords(text: str, min_length: int = 3, max_length: int = 30) -> List[str]:
    """
    Extract potential keywords from any text.
    
    This is a more general extraction function that can be used on
    any section of the resume (not just the skills section).
    
    It extracts words/phrases that:
    - Are between min_length and max_length characters
    - Don't contain special characters (except hyphens and dots)
    
    Args:
        text (str): Text to extract keywords from
        min_length (int): Minimum keyword length (default: 3)
        max_length (int): Maximum keyword length (default: 30)
    
    Returns:
        List[str]: List of extracted keywords
    
    Example:
        >>> extract_keywords("Experience with Python, TensorFlow, and AWS cloud")
        ['Experience', 'with', 'Python', 'TensorFlow', 'and', 'AWS', 'cloud']
    """
    if not text:
        return []
    
    # Split by whitespace and common punctuation
    # Keep hyphens and dots (for terms like "React.js", "C++", etc.)
    words = re.findall(r'[\w\.\-\+]+', text)
    
    keywords = []
    for word in words:
        # Filter by length
        if min_length <= len(word) <= max_length:
            keywords.append(word)
    
    return keywords


def normalize_skill(skill: str) -> str:
    """
    Normalize a skill name for comparison.
    
    Different resumes might write the same skill differently:
    - "JavaScript" vs "javascript" vs "JAVASCRIPT"
    - "React.js" vs "ReactJS" vs "React"
    
    This function normalizes skills to a standard format for comparison.
    
    Args:
        skill (str): Raw skill name
    
    Returns:
        str: Normalized skill name (lowercase, trimmed)
    
    Example:
        >>> normalize_skill("  JavaScript  ")
        'javascript'
        >>> normalize_skill("React.JS")
        'react.js'
    """
    if not skill:
        return ""
    
    # Convert to lowercase and remove extra whitespace
    normalized = skill.lower().strip()
    
    # Remove multiple spaces
    normalized = re.sub(r'\s+', ' ', normalized)
    
    return normalized


def deduplicate_skills(skills: List[str]) -> List[str]:
    """
    Remove duplicate skills from a list (case-insensitive).
    
    Args:
        skills (List[str]): List of skills (may contain duplicates)
    
    Returns:
        List[str]: List of unique skills (preserves original casing of first occurrence)
    
    Example:
        >>> deduplicate_skills(["Python", "Java", "python", "JavaScript"])
        ['Python', 'Java', 'JavaScript']
    """
    seen = set()
    unique_skills = []
    
    for skill in skills:
        normalized = normalize_skill(skill)
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_skills.append(skill)  # Keep original casing
    
    return unique_skills
