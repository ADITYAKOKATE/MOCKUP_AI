import argparse
import subprocess
import sys
import os

# Map exam names (keys) to their specific run scripts
# This makes it modular - just add new scripts here
SCRIPT_MAP = {
    "gate": "scripts/run_gate.py",
    "jee-main": "scripts/run_jee_main.py",
    "jee-advanced": "scripts/run_jee_advanced.py",
    "neet": "scripts/run_neet.py",
    "mht-cet": "scripts/run_mht_cet.py",
}

def run_script(script_path, extra_args=[]):
    if not os.path.exists(script_path):
        print(f"❌ Error: Script '{script_path}' not found.")
        return False
        
    cmd = ["python", script_path] + extra_args
    print(f"\n🚀 Running: {' '.join(cmd)}")
    
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Execution failed with code {e.returncode}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Super script to initialize run scripts.")
    
    parser.add_argument("--exam", type=str, choices=SCRIPT_MAP.keys(), help="The exam key to run script for")
    parser.add_argument("--all", action="store_true", help="Run ALL configured exam scripts sequentially")

    # Use parse_known_args to capture --stream or other flags intended for the underlying script
    args, unknown_args = parser.parse_known_args()

    # Ensure we are in backend/
    if not os.path.exists("scripts"):
        print("❌ Error: Run from backend directory.")
        sys.exit(1)

    # Prompt user for limit
    limit_arg = []
    try:
        user_input = input("Enter number of questions to save per topic (Press Enter for ALL): ").strip()
        if user_input:
            if not user_input.isdigit():
                 print("❌ Invalid input. Please enter an integer.")
                 sys.exit(1)
            limit_arg = ["--limit", user_input]
            print(f"👉 Setting limit to {user_input} questions per topic.")
        else:
            print("👉 Downloading ALL questions per topic.")
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled.")
        sys.exit(1)

    # --- AI Classification Prompt ---
    ai_arg = []
    if confirm_action("Do you want to use AI to calculate Difficulty/Importance? (Slows down process)"):
        ai_arg = ["--ai"]
        print("👉 AI Classification ENABLED.")
    else:
        print("👉 AI Classification DISABLED.")

    # --- Interactive Filter Logic ---
    subject_arg = []
    topic_arg = []

    if args.exam:
        try:
             # 1. Parse Metadata from constants.js
            metadata = parse_metadata()
            
            # Map simple exam keys (cli) to constant keys
            # SCRIPT_MAP keys: gate, jee-main, jee-advanced, neet, mht-cet
            # METADATA keys: GATE, JEE_MAIN, JEE_ADVANCED, NEET, MHT_CET (Inferred)
            EXAM_KEY_MAP = {
                "gate": "GATE",
                "jee-main": "JEE_MAIN",
                "jee-advanced": "JEE_ADVANCED",
                "neet": "NEET",
                "mht-cet": "MHT_CET" # Assuming this key exists in constants.js
            }
            
            const_key = EXAM_KEY_MAP.get(args.exam)
            exam_data = metadata.get(const_key, {}) if const_key else {}
            
            # --- Special Handling for GATE (Branch Selection) ---
            if const_key == "GATE":
                # Default map for slugs (Heuristic + Known overrides)
                BRANCH_SLUG_MAP = {
                    "CS": "gate-cse",
                    "DA": "gate-da", 
                    "EC": "gate-ece",
                    "EE": "gate-ee",
                    "ME": "gate-me",
                    "CE": "gate-ce",
                    "IN": "gate-in"
                }
                
                # Check if --stream is already passed in unknown_args (e.g. from npm script)
                target_branch = None
                if "--stream" in unknown_args:
                    try:
                        idx = unknown_args.index("--stream")
                        if idx + 1 < len(unknown_args):
                            stream_val = unknown_args[idx+1]
                            # Reverse lookup branch key from stream_val
                            for b_key, b_slug in BRANCH_SLUG_MAP.items():
                                if b_slug == stream_val:
                                    target_branch = b_key
                                    break
                            # Fallback if not found in map (maybe gate-pi ?)
                            if not target_branch and stream_val.startswith("gate-"):
                                target_branch = stream_val.split("-")[-1].upper()
                    except:
                        pass
                
                if target_branch:
                    print(f"\nGATE detected. Stream pre-selected: {target_branch}")
                    selected_branch = [target_branch]
                else:
                    print("\nGATE detected. Please select a Branch first:")
                    branches = sorted(list(exam_data.keys()))
                    selected_branch = select_items(branches, "Branches")
                
                if not selected_branch:
                    print("❌ No branch selected. Exiting.")
                    sys.exit(1)
                
                # We typically only scrape ONE branch at a time for GATE structure logic
                if len(selected_branch) > 1:
                    print("⚠️ Multiple branches selected. Using the first one for subject/topic context.")
                
                branch_key = selected_branch[0] # e.g. "CS"
                
                # 1. Update exam_data to point to the Branch's content (Subjects)
                exam_data = exam_data.get(branch_key, {})
                
                # 2. Add stream arg for run_gate.py if NOT ALREADY THERE
                slug = BRANCH_SLUG_MAP.get(branch_key, f"gate-{branch_key.lower()}")
                
                # Only append if not already in unknown_args
                if "--stream" not in unknown_args and f"--stream={slug}" not in unknown_args:
                    subject_arg.append(f"--stream={slug}")
                    print(f"👉 Target Stream: {slug}")
                else:
                    print(f"👉 Using provided stream: {slug}")

            # 2. Select Subjects
            # Now 'exam_data' holds the Subjects (Keys) directly (for JEE, NEET, and now GATE/CS)
            available_subjects = sorted(list(exam_data.keys()))
            selected_subjects = [] # Initialize here to prevent unbound error if user chooses No
            
            if available_subjects:
                if confirm_action("\nDo you want to download questions of specific subjects only?"):
                    selected_subjects = select_items(available_subjects, "Subjects")
                    if selected_subjects:
                        subject_arg = ["--subjects", ",".join(selected_subjects)]
                        print(f"👉 Selected Subjects: {', '.join(selected_subjects)}")

            # 3. Select Topics (Dependent on Subject Selection)
            # Only ask for topics if subjects were selected (OR if user wants to filter topics from ALL subjects?)
            # User request: "If the subjects selection is selected as no then the topic selection won't appear."
            
            if selected_subjects:
                # Gather all topics from selected subjects
                available_topics = set()
                for sub in selected_subjects:
                    # exam_data[sub] could be a list (JEE) or a dict (GATE)
                    content = exam_data.get(sub)
                    if isinstance(content, list):
                        # List of strings
                        available_topics.update(content)
                    elif isinstance(content, dict):
                        # Dict result (likely GATE subjects -> topics)
                        # Actually for GATE: GATE -> CS -> Algorithms -> [Topic List]
                        # So if user selected "CS" as a "Subject" (it's a branch), then next level is Actual Subjects.
                        # This mapping is getting tricky.
                        # Let's stick to the structure seen in JEE_MAIN for now as per user focus.
                        available_topics.update(content.keys())
                
                sorted_topics = sorted(list(available_topics))
                
                if sorted_topics:
                    if confirm_action("\nDo you want to download specific topics from the selected subjects?"):
                         selected_topics = select_items(sorted_topics, "Topics")
                         if selected_topics:
                             topic_arg = ["--topics", ",".join(selected_topics)]
                             print(f"👉 Selected Topics: {', '.join(selected_topics)}")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not parse interactive metadata. Running without filters. ({e})")

    # Combine args
    final_extra_args = unknown_args + limit_arg + subject_arg + topic_arg + ai_arg

    if args.all:
        print("🌟 Running ALL scripts...")
        for key, script_path in SCRIPT_MAP.items():
            run_script(script_path, final_extra_args)
            
    elif args.exam:
        script = SCRIPT_MAP[args.exam]
        run_script(script, final_extra_args)

def confirm_action(prompt_text):
    while True:
        choice = input(f"{prompt_text} (y/n): ").strip().lower()
        if choice == 'y': return True
        if choice == 'n' or choice == '': return False

def select_items(items, label):
    print(f"\nAvailable {label}:")
    for i, item in enumerate(items):
        print(f"{i+1} : {item}")
    
    print(f"\nEnter the choices indices (comma separated, e.g., 1,2,5)")
    val = input(f"Choices: ").strip()
    if not val: return []
    
    selected = []
    try:
        indices = [int(x.strip()) for x in val.split(",") if x.strip().isdigit()]
        for idx in indices:
            if 1 <= idx <= len(items):
                selected.append(items[idx-1])
    except:
        print("Invalid input ignored.")
    
    return selected

def parse_metadata():
    # Rudimentary parser for backend/utils/constants.js
    # Returns a dict of dicts/lists mimicking the JSON structure
    import re
    import json
    
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "utils", "constants.js")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Extract the METADATA object content
    # Look for 'const METADATA = {' ... until end of object
    # This is hard with regex due to nested braces.
    # We will try to find the start and walk braces.
    
    start_match = re.search(r'const METADATA\s*=\s*\{', content)
    if not start_match: return {}
    
    start_idx = start_match.end() - 1 # Points to {
    
    brace_count = 0
    json_str = ""
    
    for i in range(start_idx, len(content)):
        char = content[i]
        json_str += char
        if char == '{': brace_count += 1
        elif char == '}': brace_count -= 1
        
        if brace_count == 0:
            break
            
    # Now clean up JS to valid JSON
    # 1. Quote keys: { key: -> { "key":
    # 2. Trailing commas allowed in JS but not JSON (simple regex fix or just eval?)
    # Eval is dangerous? It's our own code.
    # But this is python.
    # Regex replace keys:
    # matches key without quotes followed by colon
    
    # 1. Quote keys (alphanumeric starting)
    json_str = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1 "\2":', json_str)
    
    # 2. Remove trailing commas
    json_str = re.sub(r',\s*}', '}', json_str)
    json_str = re.sub(r',\s*]', ']', json_str)
    
    # 3. Handle single quotes to double quotes
    # (constants.js uses double quotes mostly, but just in case)
    # Be careful not to replace quotes inside strings.
    # Assuming standard simplified format for now
    
    try:
        return json.loads(json_str)
    except:
        # Fallback: The file seems correctly formatted with double quotes in the view_file output.
        # Just passing it might work if we strictly fixed keys.
        return json.loads(json_str) # Let it raise if fails


if __name__ == "__main__":
    main()
