import os
import scraper_engine
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path)

if __name__ == "__main__":
    MONGO_URI = os.getenv("MONGO_URI")
    DB_NAME = os.getenv("DB_NAME", "loop")
    
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=None, help='Limit questions per topic')
    parser.add_argument('--subjects', type=str, default=None, help='Comma-separated subjects')
    parser.add_argument('--topics', type=str, default=None, help='Comma-separated topics')
    parser.add_argument('--ai', action='store_true', help='Enable AI Classification')
    args = parser.parse_args()

    scraper_engine.scrape_exam(
        exam_slug="jee/jee-advanced",
        exam_display_name="JEE Advanced",
        mongo_uri=MONGO_URI,
        db_name=DB_NAME,
        limit=args.limit,
        subjects=args.subjects,
        topics=args.topics,
        ai_enabled=args.ai
    )
