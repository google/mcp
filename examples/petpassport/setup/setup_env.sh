#!/bin/bash

# Get Google Cloud Project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Could not determine Google Cloud Project ID."
    echo "Please run 'gcloud config set project <PROJECT_ID>' first."
    exit 1
fi

echo "Found Project ID: $PROJECT_ID"

# Enable necessary APIs
echo "Enabling APIs..."
for SERVICE in bigquery.googleapis.com mapstools.googleapis.com apikeys.googleapis.com; do
    if ! gcloud services enable "$SERVICE" --project=$PROJECT_ID; then
        echo "Error: Failed to enable $SERVICE."
        echo "Make sure you have the 'roles/serviceusage.serviceUsageAdmin' role."
        exit 1
    fi
done

# Enable MCP services
echo "Enabling MCP services..."
gcloud --quiet beta services mcp enable bigquery.googleapis.com --project=$PROJECT_ID \
    || { echo "Error: Failed to enable the bigquery MCP service."; exit 1; }
gcloud --quiet beta services mcp enable mapstools.googleapis.com --project=$PROJECT_ID \
    || { echo "Error: Failed to enable the mapstools MCP service."; exit 1; }

# Prompt for API Key
echo "----------------------------------------------------------------"
echo "Please create a Google Maps Platform API Key in the Cloud Console:"
echo "https://console.cloud.google.com/apis/credentials"
echo "----------------------------------------------------------------"
read -p "Enter your Google Maps Platform API Key: " MAPS_API_KEY

if [ -z "$MAPS_API_KEY" ]; then
    echo "Error: API Key cannot be empty."
    exit 1
fi

# Create .env file in project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ENV_FILE="$SCRIPT_DIR/../.env"

cat <<EOF > "$ENV_FILE"
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
MAPS_API_KEY=$MAPS_API_KEY
EOF

echo "Successfully created $ENV_FILE"
