import os
import dotenv
import google.auth
import json
import time
import datetime
from google.cloud import storage
import glob

from PIL import Image
from google import genai
from google.genai import types

from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams 

MAPS_MCP_URL = "https://mapstools.googleapis.com/mcp" 
BIGQUERY_MCP_URL = "https://bigquery.googleapis.com/mcp" 

PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'project_not_set')
BUCKET_NAME = f"pet-passport-data-{PROJECT_ID}" 

def get_maps_mcp_toolset():
    dotenv.load_dotenv()
    maps_api_key = os.getenv('MAPS_API_KEY', 'no_api_found')
    
    tools = MCPToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=MAPS_MCP_URL,
            headers={    
                "X-Goog-Api-Key": maps_api_key
            },
            timeout=30.0,          
            sse_read_timeout=300.0
        )
    )
    print("Maps MCP Toolset configured.")
    return tools


def get_bigquery_mcp_toolset():   
    credentials, project_id = google.auth.default(
            scopes=["https://www.googleapis.com/auth/bigquery"]
    )

    credentials.refresh(google.auth.transport.requests.Request())
    oauth_token = credentials.token
        
    HEADERS_WITH_OAUTH = {
        "Authorization": f"Bearer {oauth_token}",
        "x-goog-user-project": project_id
    }

    tools = MCPToolset(
        connection_params=StreamableHTTPConnectionParams(
            url=BIGQUERY_MCP_URL,
            headers=HEADERS_WITH_OAUTH,
            timeout=30.0,          
            sse_read_timeout=300.0
        )
    )
    print("BigQuery MCP Toolset configured.")
    return tools

def generate_pet_passport_photo(prompt: str, image_path: str = None) -> str:
    """
    Generates an image using gemini-3.1-flash-image-preview based on a prompt and a reference image.
    Use this to create photos of the user's dog in the suggested locations.
    
    Args:
        prompt: The text description of the image to generate.
        image_path: Optional. The path to the reference image of the dog. If not provided or invalid, the tool will attempt to find the most recent uploaded image in the ADK artifacts directory.
        
    Returns:
        The path to the saved image file.
    """
    client = genai.Client()
    output_path = f"/tmp/pet_passport_{int(time.time())}.png"
    
    # Logic to find the uploaded image in artifacts if not explicitly provided
    if not image_path or not os.path.exists(image_path):
        # Broad search in /app and /tmp for any uploaded image
        search_dirs = ["/app", "/tmp"]
        image_files = []
        
        for s_dir in search_dirs:
            if os.path.exists(s_dir):
                for root, dirs, files in os.walk(s_dir):
                    for file in files:
                        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                            image_files.append(os.path.join(root, file))
                            
        if image_files:
            # Sort by modification time, newest first
            image_files.sort(key=os.path.getmtime, reverse=True)
            image_path = image_files[0]
            print(f"Discovered image file at: {image_path}")
        else:
             raise ValueError("No uploaded image found in /app or /tmp. Please upload an image first.")
             
    try:
        image = Image.open(image_path)
        
        response = client.models.generate_content(
            model="gemini-3.1-flash-image-preview",
            contents=[prompt, image],
        )
        
        for part in response.parts:
            if part.inline_data is not None:
                generated_image = part.as_image()
                generated_image.save(output_path)
                
                # Upload to GCS and generate signed URL
                try:
                    storage_client = storage.Client()
                    bucket = storage_client.bucket(BUCKET_NAME)
                    blob_name = os.path.basename(output_path)
                    blob = bucket.blob(blob_name)
                    
                    blob.upload_from_filename(output_path)
                    
                    url = blob.generate_signed_url(
                        version="v4",
                        expiration=datetime.timedelta(hours=24),
                        method="GET",
                    )
                    return url
                except Exception as e:
                    print(f"Error uploading image to GCS: {e}")
                    # Fallback to returning local path if upload fails
                    return output_path
                
        raise ValueError("No image was returned by the model in the response parts.")
        
    except Exception as e:
        print(f"An error occurred during image generation: {e}")
        raise



def save_pet_passport(user_id: str, breed: str, postal_code: str, route_details: str, image_paths: list[str] = None) -> str:
    """
    Saves the generated pet passport itinerary to GCS for the user.
    
    Args:
        user_id: The ID of the user.
        breed: The dog breed.
        postal_code: The user's postal code.
        route_details: The itinerary details.
        image_paths: List of paths to generated images.
        
    Returns:
        A success message.
    """

    
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(f"user-{user_id}.json")
        
        paths = []
        if blob.exists():
            content = blob.download_as_text()
            paths = json.loads(content)
            
        new_path = {
            "id": f"path_{int(time.time())}",
            "breed": breed,
            "postal_code": postal_code,
            "route_details": route_details,
            "image_paths": image_paths or [],
            "walked": False,
            "rating": 0
        }
        paths.append(new_path)
        
        blob.upload_from_string(json.dumps(paths))
        return "Path saved successfully."
    except Exception as e:
        print(f"Error saving path: {e}")
        return f"Error saving path: {e}"
