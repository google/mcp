#!/bin/bash

# Load Project ID from .env file if it exists
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/../.env" ]; then
    PROJECT_ID=$(grep -E '^GOOGLE_CLOUD_PROJECT=' "$SCRIPT_DIR/../.env" | cut -d '=' -f 2)
fi

# Fallback to gcloud config if not found in .env
if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
fi

if [ -z "$PROJECT_ID" ]; then
    echo "Error: Could not determine Google Cloud Project ID."
    echo "Please set GOOGLE_CLOUD_PROJECT in your .env file or run 'gcloud config set project <PROJECT_ID>'."
    exit 1
fi

DATASET_NAME="nyc_dogs"
LOCATION="US"
BUCKET_NAME="gs://pet-passport-data-$PROJECT_ID"

echo "----------------------------------------------------------------"
echo "Pet Passport BigQuery Setup"
echo "Project: $PROJECT_ID"
echo "Dataset: $DATASET_NAME"
echo "Bucket:  $BUCKET_NAME"
echo "----------------------------------------------------------------"

# 1. Create Bucket if it doesn't exist
echo "Checking bucket $BUCKET_NAME..."
if gcloud storage buckets describe $BUCKET_NAME >/dev/null 2>&1; then
    echo "      Bucket already exists."
else
    echo "      Creating bucket $BUCKET_NAME..."
    gcloud storage buckets create $BUCKET_NAME --location=$LOCATION
fi

# 2. Download Data
CSV_URL="https://data.cityofnewyork.us/api/views/nu7n-tubp/rows.csv?accessType=DOWNLOAD"
mkdir -p "$SCRIPT_DIR/../data"
echo "Downloading NYC Dog Licensing dataset..."
curl -L "$CSV_URL" -o "$SCRIPT_DIR/../data/nyc_dog_licenses.csv"

# 3. Upload Data to Bucket
echo "Uploading data to $BUCKET_NAME..."
gcloud storage cp "$SCRIPT_DIR/../data/nyc_dog_licenses.csv" $BUCKET_NAME

# 4. Create Dataset
echo "Creating Dataset '$DATASET_NAME' if it doesn't exist..."
bq show "$PROJECT_ID:$DATASET_NAME" >/dev/null 2>&1
if [ $? -ne 0 ]; then
    bq mk --location=$LOCATION --dataset "$PROJECT_ID:$DATASET_NAME"
    echo "Dataset created."
else
    echo "Dataset already exists."
fi

# 5. Load Data from Bucket
echo "Loading data into BigQuery table 'licenses'..."
bq load --source_format=CSV --skip_leading_rows=1 --autodetect --max_bad_records=100 --replace \
    "$PROJECT_ID:$DATASET_NAME.licenses" "$BUCKET_NAME/nyc_dog_licenses.csv"

echo "----------------------------------------------------------------"
echo "Setup Complete!"
echo "----------------------------------------------------------------"
