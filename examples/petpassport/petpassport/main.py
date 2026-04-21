from google.adk.cli.fast_api import get_fast_api_app
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request, HTTPException, File, UploadFile
import os
import json
import shutil
from google.cloud import storage

# Create the standard ADK app in headless mode (web=False)
# auto_create_session=True is CRITICAL for custom UIs that generate random session IDs.
app = get_fast_api_app(agents_dir=".", web=False, auto_create_session=True)

# Mount custom static files
script_dir = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(script_dir, "static")

# Ensure the static directory exists
os.makedirs(static_dir, exist_ok=True)

from fastapi.responses import FileResponse

@app.get("/ui/")
async def get_ui_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    raise HTTPException(status_code=404, detail="index.html not found")

app.mount("/ui", StaticFiles(directory=static_dir), name="ui")
app.mount("/tmp", StaticFiles(directory="/tmp"), name="tmp")

PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'project_not_set')
BUCKET_NAME = f"pet-passport-data-{PROJECT_ID}"
print(f"BUCKET_NAME determined as: {BUCKET_NAME}")

import time

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        filename = f"upload_{int(time.time())}_{file.filename}"
        file_path = f"/tmp/{filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_storage_client():
    return storage.Client()

@app.get("/api/paths")
async def get_paths(user_id: str):
    try:
        client = get_storage_client()
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(f"user-{user_id}.json")
        
        if not blob.exists():
            return []
            
        content = blob.download_as_text()
        return json.loads(content)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/paths")
async def update_path(user_id: str, path_data: dict):
    try:
        client = get_storage_client()
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(f"user-{user_id}.json")
        
        paths = []
        if blob.exists():
            content = blob.download_as_text()
            paths = json.loads(content)
            
        path_id = path_data.get('id')
        updated = False
        for i, p in enumerate(paths):
            if p.get('id') == path_id:
                paths[i].update(path_data)
                updated = True
                break
                
        if not updated:
            paths.append(path_data)
            
        blob.upload_from_string(json.dumps(paths))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
