import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
import pymongo
import os
import sys
import concurrent.futures
import json
import time
import logging
import random

# CONFIGURATION
MAX_THREADS = 5

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def get_session():
    """Create a requests session with retry logic and headers."""
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    
    # Random User Agents
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ]
    
    session.headers.update({
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://questions.examside.com/'
    })
    return session

def connect_db(mongo_uri, db_name):
    try:
        client = pymongo.MongoClient(mongo_uri)
        db = client[db_name]
        logger.info(f"✅ Engine Connected to DB: {db_name}")
        return db["questions"]
    except Exception as e:
        logger.error(f"❌ DB Connection Failed: {e}")
        sys.exit(1)

def retry_request(session, url, retries=5):
    """
    Infinite retry for network persistence.
    Loops until success or a non-network error occurs (meaning a persistent issue with the URL itself).
    """
    attempt = 0
    while True:
        try:
            attempt += 1
            resp = session.get(url, timeout=30)
            
            if resp.status_code == 429:
                wait_time = (2 ** min(attempt, 6)) + random.uniform(0, 1)
                logger.warning(f"⚠️ 429 Too Many Requests (Attempt {attempt}). Sleeping {wait_time:.2f}s...")
                time.sleep(wait_time)
                continue
            
            return resp
            
        except (requests.exceptions.RequestException, requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            # On network error, wait and retry indefinitely
            wait_time = (2 ** min(attempt, 6)) # Cap backoff at 64s
            if attempt % 5 == 0:
                 logger.warning(f"⚠️ Network error (Attempt {attempt}): {e}. Still retrying in {wait_time}s... (User interrupt to stop)")
            time.sleep(wait_time)
            # Continues loop...
            
        except Exception as e:
             logger.error(f"❌ Unexpected error fetching {url}: {e}")
             return None # Non-retriable error

def scrape_single_question(session, url):
    """
    Fetches a single question page and extracts content.
    Returns a dictionary or None.
    """
    try:
        response = retry_request(session, url)
        if not response or response.status_code != 200:
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # ... (rest of parsing logic is fine) ...
        # Copied from previous view_file content to preserve logic
        
        # 1. Extract Question Text
        q_component = soup.find('div', class_=lambda x: x and 'question-component' in x)
        if not q_component: return None
        q_div = q_component.find('div', class_=lambda x: x and 'question' in x)
        if not q_div: return None
        
        q_html = q_div.decode_contents().strip()
        q_text = q_div.get_text(strip=True)
        
        # 2. Extract Options
        options = []
        options_container = q_component.find('div', class_='options')
        if options_container:
            option_divs = options_container.find_all('div', role='button')
            for opt in option_divs:
                label_div = opt.find('div', class_=lambda x: x and 'rounded-[50%]' in x)
                label = label_div.get_text(strip=True) if label_div else "?"
                content_div = opt.find('div', class_=lambda x: x and 'grow' in x and 'question' in x)
                content_html = content_div.decode_contents().strip() if content_div else ""
                options.append({ "label": label, "html": content_html, "is_correct": False })
        
        # 3. Extract Correct Answer
        import re
        correct_ans = "Unknown"
        scripts = soup.find_all('script')
        for s in scripts:
            if not s.string: continue
            
            # 1. MSQ / MCQ patterns (List of options)
            # Fits: correct_options: ["A"] or correct_options: ["A", "B"]
            match_list = re.search(r'correct_options["\']?:\s*(\[[^\]]+\])', s.string)
            if match_list:
                try:
                    import json
                    # Raw string might be like: ['A', 'B'] or ["A"]
                    # We need to make it valid JSON (double quotes) if it uses single quotes
                    raw_list_str = match_list.group(1).replace("'", '"')
                    correct_list = json.loads(raw_list_str)
                    
                    if isinstance(correct_list, list) and len(correct_list) > 0:
                        if len(correct_list) > 1:
                            # It's an MSQ!
                            correct_ans = ",".join(correct_list) # Store as "A,B"
                        else:
                            correct_ans = correct_list[0] # Store as "A"
                        break
                except:
                    pass # Fallback to single regex if parsing fails

            # 2. Single MCQ fallback
            match = re.search(r'correctOption["\']?:\s*["\']([A-D])["\']', s.string) 
            if match and correct_ans == "Unknown":
                correct_ans = match.group(1)
                break
            
            # 3. NAT patterns (numeric)
            if correct_ans == "Unknown":
                match = re.search(r'(?:answer|correctAnswer)["\']?:\s*["\']?([0-9\.-]+)["\']?', s.string)
                if match:
                    correct_ans = match.group(1)
                    break
                
        # 4. Extract Explanation / Solution
        explanation = None
        for s in scripts:
            if not s.string: continue
            
            # Pattern: "solution":"...content..." or "explanation":"...content..."
            # Using dotall flag or similar isn't easy with simple regex on large minified string, 
            # but usually it's "solution":"<CONTENT>" where <CONTENT> is escaped.
            
            # We look for the specific SvelteKit key often seen: "solution": or "explanation":
            sol_match = re.search(r'(?:solution|explanation)["\']?:\s*["\'](.*?)["\']\s*[,}]', s.string)
            if sol_match:
                raw_expl = sol_match.group(1)
                try:
                    # Unescape unicode sequences like \u003C -> <
                    explanation = raw_expl.encode('utf-8').decode('unicode_escape')
                    # Clean up if it's HTML
                    explanation = explanation.replace(r'\/', '/') # Fix escaped slashes
                except:
                    explanation = raw_expl # Fallback
                break
        
        # 5. Extract Year
        year = None # Default
        for s in scripts:
            if not s.string: continue
            
            # Pattern: "year":2023 or "examYear":"2023"
            year_match = re.search(r'(?:year|examYear)["\']?:\s*["\']?(\d{4})["\']?', s.string)
            if year_match:
                try:
                    year = int(year_match.group(1))
                    break
                except: pass
                
        return {
            "question_html": q_html,
            "question_text": q_text,
            "options": options,
            "correct_answer": correct_ans,
            "explanation": explanation,
            "url": url,
            "year": year
        }
    except Exception as e:
        logger.warning(f"Failed to scrape question {url}: {e}")
        return None

def _scrape_topic_page(session, url, exam_name, col, limit=None, classifier=None):
    # Initial derivation from URL (fallback)
    parts = url.strip('/').split('/')
    slug_subject = parts[-2] if len(parts) > 1 else "General"
    slug_topic = parts[-1]
    
    # Default formatting
    subject = slug_subject.replace("-", " ").title()
    topic = slug_topic.replace("-", " ").title()
    
    logger.info(f"  📂 Scraping: {subject} / {topic} (Limit: {limit if limit else 'All'})")
    
    try:
        # 1. Fetch Topic Page to get Links
        resp = retry_request(session, url)
        if not resp:
             logger.error(f"    ❌ Failed to fetch topic page {topic}")
             return 0, 0

        soup = BeautifulSoup(resp.content, 'html.parser')
        
        question_links = []
        for a in soup.find_all('a', href=True):
            href = a['href']
            if '/question/' in href and not href.endswith('#'):
                full_link = f"https://questions.examside.com{href}" if href.startswith('/') else href
                if full_link not in question_links:
                    question_links.append(full_link)
        
        # question_links = list(set(question_links)) # REMOVED: Destroys order. Deduplication happens above.
        
        if not question_links:
            logger.warning(f"    ⚠️ No question links found for {topic}")
            return 0, 0 # Return counts

        logger.info(f"    ➡️ Found {len(question_links)} potential questions. Crawling...")
        
        new_count = 0
        skipped_count = 0
        
        for i, q_url in enumerate(question_links):
            # Check limit
            if limit and new_count >= limit:
                 logger.info(f"       🛑 Limit reached for topic ({limit}). Stopping.")
                 break

            # Check DB existance by URL first to save request
            if col.find_one({"url": q_url}):
                skipped_count += 1
                if (i+1) % 10 == 0: logger.info(f"       Skipped Q{i+1}/{len(question_links)} (Exists)")
                continue
                
            # Fetch details
            if (i+1) % 5 == 0: logger.info(f"       Fetching Q{i+1}/{len(question_links)}") 
            
            q_data = scrape_single_question(session, q_url)
            
            if q_data:
                # Clean HTML tags
                def clean_html(text):
                    if not text: return ""
                    
                    # 1. Remove specific comments
                    text = text.replace("<!-- HTML_TAG_START -->", "").replace("<!-- HTML_TAG_END -->", "")
                    
                    # 2. Parse HTML
                    soup_clean = BeautifulSoup(text, 'html.parser')

                    # 3. Flatten Block Elements
                    # List of block tags to unwrap/flatten (added 'br' to prevent forced breaks)
                    block_tags = ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'article', 'section', 'li', 'ul', 'ol', 'br']
                    
                    for tag in soup_clean.find_all(block_tags):
                        # Safety check: tag might have been removed or detached if nested? through previous unwraps
                        # Although find_all finds them, if we unwrap a parent, the child moves, but if we somehow detached it?
                        # The error "element is not part of a tree" implies no parent.
                        if tag.parent is None:
                            continue

                        # Determine if we should replace with space or newline?
                        # For continuous flow, space is better. 
                        # We append a space to the text content before unwrapping to prevent "EndStart" concatenation.
                        if tag.name == 'br':
                             # For BR, just replace with space
                             tag.replace_with(" ")
                             continue

                        if tag.string:
                            tag.string = f" {tag.string} "
                        else:
                            # If it has children, insert a space navigable string before/after
                            # check parent again just in case (insert_before relies on parent)
                            if tag.parent: 
                                tag.insert_before(" ")
                                tag.insert_after(" ")
                        
                        tag.unwrap()
                        
                    # 4. Convert back to string (now flattened)
                    # Use decode_contents to keep inner HTML (like <img>, <b>, <i>)
                    # Since we unwrapped the blocks, the container soup might just be a stream of tags.
                    # We can get the string representation.
                    flattened_html = str(soup_clean)
                    
                    # 5. Collapse multiple spaces
                    import re
                    flattened_html = re.sub(r'\s+', ' ', flattened_html).strip()
                    
                    return flattened_html

                clean_q = clean_html(q_data['question_html'])
                
                def format_option(opt_html):
                    # Check for image first
                    opt_soup = BeautifulSoup(opt_html, 'html.parser')
                    img_tag = opt_soup.find('img')
                    
                    # Check if there is actual text
                    text_content = opt_soup.get_text(strip=True)
                    has_text = len(text_content) > 0
                    
                    # If Image exists AND (No text OR text is just label like 'A'), return URL
                    # Actually, we should be careful. 
                    # If Text exists, we MUST return HTML (processed) to show both.
                    # If ONLY image, return URL for cleaner frontend handling.
                    
                    if img_tag and img_tag.get('src') and not has_text:
                        return img_tag.get('src')
                        
                    # Otherwise get text (preserving LaTeX AND HTML AND Images)
                    # clean_html flattens blocks but keeps imgs
                    text = clean_html(opt_html)
                    
                    # Heuristic: If option looks like TeX (contains backslashes or curly braces) 
                    # AND does NOT contain HTML tags (other than maybe br?), wrap it.
                    has_complex_tags = bool(opt_soup.find(['div', 'p', 'table', 'img']))
                    
                    if text and (r'\\' in text or '{' in text) and not text.strip().startswith('$') and not has_complex_tags:
                        # Use Display Mode ($$) only if text is long or has newlines
                        if len(text) > 150 or '\n' in text:
                            return f"$${text}$$"
                        return f"${text}$"
                    return text

                clean_opts = [format_option(o['html']) for o in q_data['options']]
                
                # Derive Branch
                # Derive Branch Dynamically
                branch = None 
                
                # Canonical Branch Mapping (Mirrors backend/utils/constants.js)
                BRANCH_MAPPING = {
                    "CSE": "CS", "CS": "CS",
                    "ECE": "EC", "EC": "EC",
                    "EE": "EE",
                    "ME": "ME",
                    "CE": "CE",
                    "DA": "DA",
                    "IN": "IN",
                    "CH": "CH",
                    "BT": "BT"
                }

                # Example: "GATE CSE" -> Branch: "CS"
                parts = exam_name.split()
                if len(parts) >= 2 and parts[0].upper() == "GATE":
                     raw_code = parts[1].upper()
                     branch = BRANCH_MAPPING.get(raw_code, raw_code) # Default to raw if not mapped
                     
                img_src = None
                img_soup = BeautifulSoup(q_data['question_html'], 'html.parser')
                img_tag = img_soup.find('img')
                if img_tag: img_src = img_tag.get('src')
                
                # Detect Question Type
                q_type = "MCQ"
                current_ans = q_data.get('correct_answer', 'Unknown')
                
                if not clean_opts:
                    q_type = "NAT" # Numerical Answer Type (No options)
                elif current_ans and "," in str(current_ans):
                    q_type = "MSQ" # Multiple Select Question

                # AI Classification
                difficulty = None 
                importance = None
                
                if classifier:
                    try:
                        # logger.info(f"       🤖 Classifying Q{new_count+1}...") # verbose off
                        d, i = classifier.classify(q_data['question_text'], q_data['options'], q_type, exam_name=exam_name)
                        difficulty = d
                        importance = i
                    except Exception as e:
                        logger.warning(f"AI Classification Error: {e}")

                doc = {
                    "question": clean_q,
                    "options": clean_opts,
                    "correctAnswer": q_data.get('correct_answer', 'Unknown'),
                    "explanation": clean_html(q_data.get('explanation')), # Clean/Format explanation too
                    "image": img_src,
                    "branch": branch,
                    "exam": exam_name,
                    "subject": subject,
                    "topic": topic,
                    "type": q_type,
                    "year": q_data.get('year'),
                    "difficulty": difficulty,
                    "importance": importance
                }
                
                try:
                    col.update_one({"question": clean_q}, {"$set": doc}, upsert=True)
                    new_count += 1
                    status_extras = ""
                    if classifier: status_extras = f" [AI: {difficulty}|{importance}]"
                    
                    if new_count % 5 == 0:
                        logger.info(f"       ✅ Saved {new_count} questions so far...{status_extras}")
                except Exception as e:
                    logger.warning(f"Error saving: {e}")
                    skipped_count += 1
            
            time.sleep(random.uniform(0.5, 1.5)) 
            
        logger.info(f"    ✅ [DONE] {topic}: Saved {new_count} new, Skipped {skipped_count}.")
        return new_count, skipped_count

    except Exception as e:
        logger.error(f"    ❌ Error scraping topic {topic}: {e}")
        return 0, 0

def scrape_exam(exam_slug, exam_display_name, mongo_uri, db_name, limit=None, subjects=None, topics=None, ai_enabled=False):
    col = connect_db(mongo_uri, db_name)
    session = get_session()
    base_url = f"https://questions.examside.com/past-years/{exam_slug}"
    
    # Init AI Classifier
    classifier = None
    if ai_enabled:
        try:
            # Lazy import to avoid load if not needed
            sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
            from utils.ai_classifier import AiClassifier
            classifier = AiClassifier()
            logger.info("🚀 AI Classifier Initialized.")
        except Exception as e:
            logger.error(f"❌ Failed to init AI: {e}")

    # Process filters
    subject_filter = [s.strip().lower() for s in subjects.split(',')] if subjects else []
    topic_filter = [t.strip().lower() for t in topics.split(',')] if topics else []
    
    filter_msg = f" (Limit: {limit}"
    if subject_filter: filter_msg += f", Subjects: {len(subject_filter)}"
    if topic_filter: filter_msg += f", Topics: {len(topic_filter)}"
    filter_msg += ")"
    
    logger.info(f"🚀 [Engine] Starting Scrape: {exam_display_name}{filter_msg}")
    
    # Load metadata to drive the scrape deterministically
    metadata = parse_metadata()
    
    # Map exam_slug back to constant key
    # Simple heuristic or passed arg?
    # exam_display_name is like "JEE Main", "GATE CSE".
    # We can try to match against keys.
    
    constant_key = None
    branch_key = None
    
    # Determine Keys for Metadata Lookups
    if "GATE" in exam_display_name:
        constant_key = "GATE"
        # Extract branch from slug (gate/gate-cse -> CS) or name
        # Heuristic: Slug is reliable. gate/gate-cse
        slug_parts = exam_slug.split('/')
        if len(slug_parts) > 1:
            raw_stream = slug_parts[1].replace("gate-", "").upper()
            # Map raw stream to Branch Key (cse -> CS, ece -> EC, but fetch_metadata saved as CS, EC etc)
            # fetch_metadata used keys: CS, DA, EC, EE, ME, CE.
            # standard map:
            STREAM_TO_BRANCH = {
                "CSE": "CS", "AI": "DA", "DA": "DA", 
                "ECE": "EC", "EE": "EE", "ME": "ME", "CE": "CE", "IN": "IN"
            }
            branch_key = STREAM_TO_BRANCH.get(raw_stream, raw_stream) # Fallback to raw (e.g. CS)
            
    elif "JEE Main" in exam_display_name: constant_key = "JEE_MAIN"
    elif "JEE Advanced" in exam_display_name: constant_key = "JEE_ADVANCED"
    elif "NEET" in exam_display_name: constant_key = "NEET"
    elif "MHT CET" in exam_display_name: constant_key = "MHT_CET"

    target_data = {}
    if constant_key and constant_key in metadata:
        if branch_key:
             target_data = metadata[constant_key].get(branch_key, {})
        else:
             target_data = metadata[constant_key]
             
    if not target_data:
        logger.warning(f"⚠️ Could not find metadata in constants.js for {exam_display_name}. Falling back to Index Discovery.")
        # Fallback to old discovery method
        should_discover = True
    else:
        should_discover = False
        logger.info(f"✅ Loaded metadata for {exam_display_name}. constructing URLs from constants.js...")

    topic_urls = []

    if should_discover:
        # OLD METHOD: Discover from Index
        try:
            resp = session.get(base_url, timeout=30)
            soup = BeautifulSoup(resp.content, 'html.parser')
            links = soup.find_all('a', href=True)
            discovered_urls = set()
            for l in links:
                 href = l['href']
                 if href.startswith('/'): href = "https://questions.examside.com" + href
                 if href.startswith(base_url) and href != base_url: 
                     discovered_urls.add(href)
            topic_urls = list(discovered_urls)
            logger.info(f"Found {len(topic_urls)} topic links via Discovery.")
        except Exception as e:
            logger.error(f"Discovery failed: {e}")
            return
            
    else:
        # NEW METHOD: Construct from Metadata
        # target_data is Dict: { "Subject": ["Topic 1", "Topic 2"] }
        
        # Apply Filters HERE (Pre-construction)
        
        subjects_to_process = list(target_data.keys())
        
        # Filter Subjects
        if subject_filter:
            subjects_to_process = [
                s for s in subjects_to_process 
                if any(f in s.lower() for f in subject_filter)
            ]
            
        for subj in subjects_to_process:
            subj_topics = target_data[subj]
            
            # Slugify Subject: "General Aptitude" -> "general-aptitude"
            subj_slug = subj.lower().replace(" ", "-") # Simple slugify
            
            # Filter Topics
            topics_to_process = subj_topics
            if topic_filter:
                 topics_to_process = [
                    t for t in subj_topics 
                    if any(f in t.lower() for f in topic_filter)
                ]
            
            for topic_name in topics_to_process:
                # Slugify Topic: "Finite Automata..." -> "finite-automata..."
                # Handle special chars? Usually fetch_metadata capitalized simple slugs.
                # Assuming simple reverse works.
                topic_slug = topic_name.lower().replace(" ", "-")
                
                # Construct URL
                # Base: .../past-years/gate/gate-cse
                # Target: .../past-years/gate/gate-cse/general-aptitude/numerical-ability
                
                full_url = f"{base_url}/{subj_slug}/{topic_slug}"
                topic_urls.append(full_url)

    logger.info(f"Generated {len(topic_urls)} target topics.")

    # No need to filter again if we used metadata, but if we used discovery we need to filter?
    # Actually, the logic below was applying filters to `topic_urls`.
    # If we used metadata, we *already* filtered. 
    # Let's just keep the list as is.
    
    # However, if we used Discovery, we still need to filter.
    if should_discover:
        # ... (Old filtering logic) ...
        # Reuse existing filtering block but modify to run only if discovered
        filtered_topic_urls = []
        for t_url in topic_urls:
            # Derive info from URL (Same logic as _scrape_topic_page)
            parts = t_url.strip('/').split('/')
            slug_subject = parts[-2] if len(parts) > 1 else "General"
            slug_topic = parts[-1]
            
            derived_subject = slug_subject.replace("-", " ").title()
            derived_topic = slug_topic.replace("-", " ").title()
            
            if subject_filter:
                match = False
                for s in subject_filter:
                    if s in derived_subject.lower() or derived_subject.lower() in s:
                        match = True
                        break
                if not match: continue
                
            if topic_filter:
                match = False
                for t in topic_filter:
                    if t in derived_topic.lower() or derived_topic.lower() in t:
                        match = True
                        break
                if not match: continue
            
            filtered_topic_urls.append(t_url)
            
        topic_urls = filtered_topic_urls

    # Deduplicate while preserving order
    seen_urls = set()
    deduped_urls = []
    for url in topic_urls:
        if url not in seen_urls:
            deduped_urls.append(url)
            seen_urls.add(url)
    topic_urls = deduped_urls

    # Continue to scraping...
    logger.info(f"➡️ Proceeding with {len(topic_urls)} topics (Multithreading Enabled, Workers={MAX_THREADS}).")
    
    total_new = 0
    total_skipped = 0
    
    # Wrapper for threading to pass static args
    def scrape_wrapper(t_url):
        # Add random delay per thread to stagger requests slightly
        time.sleep(random.uniform(0.5, 2))
        return _scrape_topic_page(session, t_url, exam_display_name, col, limit=limit, classifier=classifier)

    # Parallel Execution
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        future_to_url = {executor.submit(scrape_wrapper, url): url for url in topic_urls}
        
        for future in concurrent.futures.as_completed(future_to_url):
            url = future_to_url[future]
            try:
                n, s = future.result()
                total_new += n
                total_skipped += s
            except Exception as exc:
                logger.error(f"Threw exception for {url}: {exc}")
        
    logger.info("="*50)
    logger.info(f"🏁 SCRAPE COMPLETE for {exam_display_name}")
    logger.info(f"   Total New Questions Saved: {total_new}")
    logger.info(f"   Total Skipped (Duplicates): {total_skipped}")
    logger.info("="*50)

def parse_metadata():
    import re
    import json
    
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "utils", "constants.js")
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        
        start_match = re.search(r'const METADATA\s*=\s*\{', content)
        if not start_match: return {}
        
        start_idx = start_match.end() - 1 
        brace_count = 0
        json_str = ""
        
        for i in range(start_idx, len(content)):
            char = content[i]
            json_str += char
            if char == '{': brace_count += 1
            elif char == '}': brace_count -= 1
            if brace_count == 0: break
                
        json_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1 "\2":', json_str)
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        return json.loads(json_str)
    except:
        return {}
