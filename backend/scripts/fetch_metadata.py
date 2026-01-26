import os
import json
import requests
import random
import time
from bs4 import BeautifulSoup

# Configuration
# Slugs derived from backend/scripts/run_*.py files
EXAMS_CONFIG = [
    { "key": 'GATE', "branch": 'CS', "slug": 'gate/gate-cse' },
    { "key": 'GATE', "branch": 'DA', "slug": 'gate/gate-da' }, # Attempting gate-da based on user feedback/404, though package.json used gate-ai-da
    { "key": 'GATE', "branch": 'EC', "slug": 'gate/gate-ece' },
    { "key": 'GATE', "branch": 'EE', "slug": 'gate/gate-ee' },
    { "key": 'GATE', "branch": 'ME', "slug": 'gate/gate-me' },
    { "key": 'GATE', "branch": 'CE', "slug": 'gate/gate-ce' },
    { "key": 'JEE_MAIN', "branch": None, "slug": 'jee/jee-main' },
    { "key": 'JEE_ADVANCED', "branch": None, "slug": 'jee/jee-advanced' },
    { "key": 'NEET', "branch": None, "slug": 'medical/neet' },
    { "key": 'MHT_CET', "branch": None, "slug": 'jee/mht-cet' }
]

EXISTING_EXAMS = {
    "GATE": 'GATE',
    "JEE_MAIN": 'JEE Main',
    "JEE_ADVANCED": 'JEE Advanced',
    "NEET": 'NEET',
    "MHT_CET": 'MHT CET'
}

EXISTING_BRANCHES = {
    "CS": 'Computer Science and Information Technology',
    "DA": 'Data Science and Artificial Intelligence',
    "EC": 'Electronics and Communication Engineering',
    "EE": 'Electrical Engineering',
    "ME": 'Mechanical Engineering',
    "CE": 'Civil Engineering',
    "IN": 'Instrumentation Engineering',
    "CH": 'Chemical Engineering',
    "BT": 'Biotechnology'
}

def get_session():
    session = requests.Session()
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ]
    session.headers.update({
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://questions.examside.com/'
    })
    return session

def normalize_text(slug):
    return ' '.join(word.capitalize() for word in slug.split('-'))

def fetch_metadata(session, slug):
    url = f"https://questions.examside.com/past-years/{slug}"
    print(f"Fetching metadata from: {url}")
    
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            response = session.get(url, timeout=60) # Increased timeout
            if response.status_code != 200:
                print(f"❌ Failed to fetch {slug}: Status {response.status_code}")
                if response.status_code == 404:
                    return {} # Don't retry 404
                time.sleep(retry_delay)
                continue
                
            soup = BeautifulSoup(response.content, 'html.parser')
            hierarchy = {}
            
            links = soup.find_all('a', href=True)
            for link in links:
                href = link['href']
                if href.startswith('/'):
                    href = f"https://questions.examside.com{href}"
                
                # Helper to check if link belongs to this exam
                target_base = f"/past-years/{slug}/"
                
                if target_base in href:
                    parts = href.split(target_base)
                    if len(parts) > 1:
                        clean_path = parts[1]
                        path_segments = clean_path.strip('/').split('/')
                        
                        if len(path_segments) >= 2 and 'question' not in path_segments:
                            subject_slug = path_segments[0]
                            topic_slug = path_segments[1]
                            
                            subject = normalize_text(subject_slug)
                            topic = normalize_text(topic_slug)
                            
                            if subject not in hierarchy:
                                hierarchy[subject] = set()
                            hierarchy[subject].add(topic)
            
            sorted_hierarchy = {}
            for sub in sorted(hierarchy.keys()):
                sorted_hierarchy[sub] = sorted(list(hierarchy[sub]))
                
            print(f"✅ Extracted {len(sorted_hierarchy)} subjects for {slug}")
            return sorted_hierarchy
            
        except Exception as e:
            print(f"⚠️ Attempt {attempt + 1}/{max_retries} failed for {slug}: {e}")
            if attempt < max_retries - 1:
                sleep_time = retry_delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"   Retrying in {sleep_time:.1f}s...")
                time.sleep(sleep_time)
            else:
                print(f"❌ Error fetching {slug} after {max_retries} attempts.")
                return {}
    return {}

def main():
    session = get_session()
    METADATA = {}
    
    for config in EXAMS_CONFIG:
        data = fetch_metadata(session, config["slug"])
        
        exam = config["key"]
        branch = config["branch"]
        
        if exam not in METADATA:
            METADATA[exam] = {}
            
        if branch:
            METADATA[exam][branch] = data
        else:
            METADATA[exam] = data
            
        time.sleep(1) # Polite delay

    # Generate JS Content
    js_content = f"""const EXAMS = {json.dumps(EXISTING_EXAMS, indent=4)};

const BRANCHES = {json.dumps(EXISTING_BRANCHES, indent=4)};

const METADATA = {json.dumps(METADATA, indent=4)};

module.exports = {{ EXAMS, BRANCHES, METADATA }};
"""
    
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'utils', 'constants.js')
    
    with open(output_path, 'w') as f:
        f.write(js_content)
        
    print(f"✅ constants.js updated with scraped metadata at {output_path}")

if __name__ == "__main__":
    main()
