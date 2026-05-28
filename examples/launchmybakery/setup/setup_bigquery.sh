#!/bin/bash

PROJECT_ID=$(gcloud config get-value project)
DATASET_NAME="mcp_bakery"
DATASET_DESCRIPTION="Dataset for MCP Bakery Demo"
LOCATION="US"

# Generate bucket name if not provided
if [ -z "$1" ]; then
    BUCKET_NAME="gs://mcp-bakery-data-$PROJECT_ID"
    echo "No bucket provided. Using default: $BUCKET_NAME"
else
    BUCKET_NAME=$1
fi

echo "----------------------------------------------------------------"
echo "MCP Bakery Demo Setup"
echo "Project: $PROJECT_ID"
echo "Dataset: $DATASET_NAME"
echo "Bucket:  $BUCKET_NAME"
echo "----------------------------------------------------------------"

# 1. Create Bucket if it doesn't exist
echo "[1/7] Checking bucket $BUCKET_NAME..."
if gcloud storage buckets describe $BUCKET_NAME >/dev/null 2>&1; then
    echo "      Bucket already exists."
else
    echo "      Creating bucket $BUCKET_NAME..."
    gcloud storage buckets create $BUCKET_NAME --location=$LOCATION
fi

# 2. Upload Data
echo "[2/7] Uploading data to $BUCKET_NAME..."
gcloud storage cp data/*.csv $BUCKET_NAME

# 3. Create Dataset
echo "[3/7] Creating Dataset '$DATASET_NAME'..."
if bq show "$PROJECT_ID:$DATASET_NAME" >/dev/null 2>&1; then
    echo "      Dataset already exists. Skipping creation."
else    
    bq mk --location=$LOCATION --dataset \
        --description "$DATASET_DESCRIPTION" \
        "$PROJECT_ID:$DATASET_NAME"
    echo "      Dataset created."
fi

# 4. Create Demographics Table
echo "[4/7] Setting up Table: demographics..."
bq query --use_legacy_sql=false \
"CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.demographics\` (
    zip_code STRING OPTIONS(description='5-digit US Zip Code'),
    city STRING OPTIONS(description='City name, e.g., Los Angeles'),
    neighborhood STRING OPTIONS(description='Common neighborhood name, e.g., Santa Monica, Silver Lake'),
    median_household_income INT64 OPTIONS(description='Median household income in USD'),
    total_population INT64 OPTIONS(description='Total population count in the zip code'),
    median_age FLOAT64 OPTIONS(description='Median age of residents'),
    bachelors_degree_pct FLOAT64 OPTIONS(description='Percentage of population 25+ with a Bachelors degree or higher'),
    foot_traffic_index FLOAT64 OPTIONS(description='Index of estimated foot traffic based on commercial density and mobility data')
)
OPTIONS(
    description='Census data by zip code for various California cities.'
);"

bq load --source_format=CSV --skip_leading_rows=1 --ignore_unknown_values=true --replace \
    "$PROJECT_ID:$DATASET_NAME.demographics" "$BUCKET_NAME/demographics.csv"

# 5. Create Bakery Prices Table
echo "[5/7] Setting up Table: bakery_prices..."
bq query --use_legacy_sql=false \
"CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.bakery_prices\` (
    store_name STRING OPTIONS(description='Name of the competitor bakery'),
    product_type STRING OPTIONS(description='Type of baked good, e.g., Sourdough Loaf, Croissant'),
    price FLOAT64 OPTIONS(description='Price per unit in USD'),
    region STRING OPTIONS(description='Geographic region, e.g., Los Angeles Metro, SF Bay Area'),
    is_organic BOOL OPTIONS(description='Whether the product is certified organic')
)
OPTIONS(
    description='Competitor pricing and product details for common baked goods.'
);"

bq load --source_format=CSV --skip_leading_rows=1 --replace \
    "$PROJECT_ID:$DATASET_NAME.bakery_prices" "$BUCKET_NAME/bakery_prices.csv"

# 6. Create Sales History Table
echo "[6/7] Setting up Table: sales_history_weekly..."
bq query --use_legacy_sql=false \
"CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.sales_history_weekly\` (
    week_start_date DATE OPTIONS(description='The start date of the sales week (Monday)'),
    store_location STRING OPTIONS(description='Location of the bakery branch'),
    product_type STRING OPTIONS(description='Product category: Sourdough Loaf, Croissant, etc.'),
    quantity_sold INT64 OPTIONS(description='Total units sold this week'),
    total_revenue FLOAT64 OPTIONS(description='Total revenue in USD for this week')
)
OPTIONS(
    description='Weekly sales performance history by store and product.'
);"

bq load --source_format=CSV --skip_leading_rows=1 --replace \
    "$PROJECT_ID:$DATASET_NAME.sales_history_weekly" "$BUCKET_NAME/sales_history_weekly.csv"

# 7. Create Foot Traffic Table
echo "[7/7] Setting up Table: foot_traffic..."
bq query --use_legacy_sql=false \
"CREATE OR REPLACE TABLE \`$PROJECT_ID.$DATASET_NAME.foot_traffic\` (
    zip_code STRING OPTIONS(description='5-digit US Zip Code'),
    time_of_day STRING OPTIONS(description='Time of day: morning, afternoon, evening'),
    foot_traffic_score FLOAT64 OPTIONS(description='Score of foot traffic (1-100)')
)
OPTIONS(
    description='Foot traffic scores by zip code and time of day.'
);"

bq load --source_format=CSV --skip_leading_rows=1 --replace \
    "$PROJECT_ID:$DATASET_NAME.foot_traffic" "$BUCKET_NAME/foot_traffic.csv"

echo "----------------------------------------------------------------"
echo "Setup Complete!"
echo "----------------------------------------------------------------"