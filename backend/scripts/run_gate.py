import os
import scraper_engine
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path)

import argparse

if __name__ == "__main__":
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME", "loop")
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--stream', default='gate-cse', help='GATE Stream Slug (e.g. gate-cse, gate-ece)')
    parser.add_argument('--limit', type=int, default=None, help='Limit questions per topic')
    parser.add_argument('--subjects', type=str, default=None, help='Comma-separated subjects')
    parser.add_argument('--topics', type=str, default=None, help='Comma-separated topics')
    parser.add_argument('--ai', action='store_true', help='Enable AI Classification')
    args = parser.parse_args()
    
    slug = f"gate/{args.stream}"
    name = f"GATE {args.stream.split('-')[-1].upper()}"
    
    scraper_engine.scrape_exam(
        exam_slug=slug,
        exam_display_name=name,
        mongo_uri=MONGO_URI,
        db_name=DB_NAME,
        limit=args.limit,
        subjects=args.subjects,
        topics=args.topics,
        ai_enabled=args.ai
    )
