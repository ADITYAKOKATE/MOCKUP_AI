import os
import pymongo
from sentence_transformers import SentenceTransformer
from datetime import datetime
from bson import ObjectId

class MemoryService:
    def __init__(self, mongo_uri: str, db_name: str):
        self.client = pymongo.MongoClient(mongo_uri)
        self.db = self.client[db_name]
        
        # User Data & Performance Models
        self.users = self.db['users']
        self.user_profiles = self.db['userprofiles']
        self.performances = self.db['performances']
        
        # AI Specific Models
        self.chat_history_collection = self.db['aichathistories'] # Using the new Mongoose model collection
        self.user_memories = self.db['user_memories']
        
        # Load Embedding Model
        try:
            print("🧠 Loading Embedding Model (all-MiniLM-L6-v2)...", flush=True)
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ Embedding Model Loaded.", flush=True)
        except Exception as e:
            print(f"❌ Failed to load embedding model: {e}", flush=True)
            self.model = None

    def get_user_context(self, user_id: str):
        """Fetches User Profile and Performance Stats"""
        try:
            user_oid = ObjectId(user_id)
            
            print(f"🔍 [Context] Looking for UserID: {user_id} (OID: {user_oid})")
            
            # 1. Profile
            # Try specific profile first
            profile = self.user_profiles.find_one({"userId": user_oid})
            name = profile.get("name") if profile else None
            print(f"   - Profile Found: {bool(profile)}, Name in Profile: {name}")
            
            # If no name in profile, check core User collection for email fallback
            if not name:
                print("   - Name not in profile, checking 'users' collection...")
                user = self.users.find_one({"_id": user_oid}) # _id is usually OID in Mongoose
                if user:
                    print(f"   - User Found: {user.keys()}")
                    if "email" in user:
                        name = user["email"].split("@")[0] # Fallback to email prefix
                        print(f"   - Derived Name from Email: {name}")
                    else:
                        print(f"⚠️ User found but no email: {user.keys()}")
                else:
                    print("   - User NOT found in 'users' collection.")
                    # DEBUG: Diagnose DB state
                    print(f"   - [DB Debug] Current DB: {self.db.name}")
                    print(f"   - [DB Debug] Collections: {self.db.list_collection_names()}")
                    count = self.users.count_documents({})
                    print(f"   - [DB Debug] 'users' count: {count}")
                    if count > 0:
                        sample = self.users.find_one()
                        print(f"   - [DB Debug] Sample User ID: {sample.get('_id')} (Type: {type(sample.get('_id'))})")
                
            if not name:
                name = "Student"
                
            exams_list = [e.get("examType") for e in profile.get("exams", [])] if profile else []
            exams = ", ".join(exams_list)
            
            print(f"👤 [Context] Profile: {name}, Exams: {exams}")

            # 2. Performance (Weak Areas)
            # Fetch user performance
            perf = self.performances.find_one({"userId": user_oid})
            
            weak_areas = []
            strong_areas = []
            
            if perf:
                # The 'exams' field is a Map in Mongoose, which PyMongo returns as a dict
                exams_data = perf.get("exams", {})
                
                print(f"📊 [Context] Processing {len(exams_data)} exams from performance data.")
                
                for exam_name, exam_data in exams_data.items():
                    # Calculate Weak Areas based on Topic Stats
                    topic_stats = exam_data.get("topicStats", {})
                    
                    for topic_name, stats in topic_stats.items():
                         # In Mongoose Map, values are objects
                         total = stats.get("totalAttempted", 0)
                         strength = stats.get("strength", 0) # Use pre-calculated strength if available
                         accuracy = stats.get("accuracy", 0)
                         
                         if total > 0:
                             # Use Strength (0-100) if available, else fallback to accuracy
                             # User wants weak areas.
                             if strength < 50:
                                 weak_areas.append(f"{topic_name} ({exam_name})")
                             elif strength > 75:
                                 strong_areas.append(f"{topic_name} ({exam_name})")
                             
                             # Fallback logic if strength is 0 but accuracy is low
                             elif accuracy < 50 and strength == 0:
                                  weak_areas.append(f"{topic_name} ({exam_name})")
            else:
                print("⚠️ [Context] No Performance Document Found in DB")
            
            # De-duplicate
            weak_areas = list(set(weak_areas))
            strong_areas = list(set(strong_areas))

            weak_str = ", ".join(weak_areas[:5]) if weak_areas else "None detected yet"
            strong_str = ", ".join(strong_areas[:5]) if strong_areas else "None detected yet"
            
            print(f"📊 [Context] Weak: {weak_str} | Strong: {strong_str}")
            
            return {
                "name": name,
                "exams": exams,
                "weak_areas": weak_str, 
                "strong_areas": strong_str
            }
        except Exception as e:
            print(f"⚠️ Error fetching user context: {e}")
            return {"name": "Student", "exams": "Unknown", "weak_areas": "None", "strong_areas": "None"}

    def add_chat_message(self, user_id: str, role: str, content: str, emotion: str = "neutral"):
        """Stores chat history in aichathistories collection"""
        # Ensure user_id is properly formatted if referencing 'User' model
        try:
            user_oid = ObjectId(user_id)
        except:
            user_oid = user_id # Fallback if not valid ObjectId

        self.chat_history_collection.insert_one({
            "userId": user_oid,
            "role": role,
            "content": content,
            "emotion": emotion,
            "metadata": {},
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "__v": 0
        })

    def get_chat_history(self, user_id: str, limit: int = 10):
        """Retrieves recent chat history for a specific user"""
        try:
             user_oid = ObjectId(user_id)
        except:
             user_oid = user_id

        cursor = self.chat_history_collection.find({"userId": user_oid}).sort("createdAt", -1).limit(limit)
        history = list(cursor)
        
        # Map to simple format
        mapped_history = []
        for h in history[::-1]:
            mapped_history.append({
                "role": h.get("role"),
                "content": h.get("content"),
                "emotion": h.get("emotion", "neutral")
            })
        return mapped_history

    def store_memory(self, user_id: str, content: str):
        """Stores a long-term memory with vector embedding"""
        if not self.model:
            return
        
        embedding = self.model.encode(content).tolist()
        
        self.user_memories.insert_one({
            "user_id": user_id,
            "content": content,
            "embedding": embedding,
            "timestamp": datetime.utcnow()
        })
        print(f"💾 Memory Stored for {user_id}: {content[:30]}...")

    def retrieve_memories(self, user_id: str, query: str, limit: int = 3):
        """Semantic search for relevant memories"""
        if not self.model:
            return []
            
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            query_embedding = self.model.encode(query).tolist()
            
            candidates = list(self.user_memories.find({"user_id": user_id}).sort("timestamp", -1).limit(50))
            
            if not candidates:
                return []
            
            candidate_embeddings = [c['embedding'] for c in candidates]
            scores = cosine_similarity([query_embedding], candidate_embeddings)[0]
            
            ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
            
            return [mem['content'] for score, mem in ranked[:limit] if score > 0.4] 
            
        except Exception as e:
            print(f"❌ Retrieval Error: {e}")
            return []
