# Pet Passport: Pet-friendly route planner

This directory contains the **Pet Passport** application, a demo of an AI Agent using the Model Context Protocol (MCP) to combine data analysis and real-world location services.

## Demo Overview

Pet Passport helps users plan a perfect day out with their dog based on breed popularity in New York City. The agent uses a "Macro-to-Micro" reasoning chain:
1.  **Strategic Discovery (BigQuery):** Identifies the NYC Zip Code with the highest population for a specific breed.
2.  **Local Execution (Maps):** Uses that Zip Code as a location bias to find "pet friendly cafes" and "dog parks".
3.  **Itinerary Generation:** Combines the data to create a "Pet Passport" itinerary.

The agent is built using the `google-adk` framework and powered by `gemini-3.1`.

## Dataset

This demo uses the [NYC Dog Licensing Dataset](https://data.cityofnewyork.us/Health/NYC-Dog-Licensing-Dataset/nu7n-tubp) from NYC Open Data. It contains records of licensed dogs in New York City.

## Project Structure

```text
petpassport/
├── petpassport/
│   ├── __init__.py
│   ├── agent.py             # Agent definition using ADK
│   ├── tools.py             # MCP Tool configuration (BigQuery & Maps)
│   └── main.py              # FastAPI application exposing the agent
├── pyproject.toml           # Project dependencies
└── README.md                # This documentation
```

## Prerequisites

*   **Python 3.13+**
*   **Google Cloud Project** with access to BigQuery and Maps MCP endpoints.
*   **Environment Variables** (Store these in a `.env` file in the project root):
    *   `MAPS_API_KEY`: Your Google Maps API key.
    *   `GOOGLE_CLOUD_PROJECT`: Your Google Cloud project ID.

## Deployment Guide

Follow these steps to set up and run the demo.

### 1. Authenticate with Google Cloud

Set your active Google Cloud project and authenticate. This is required for the ADK to access BigQuery.

```bash
gcloud config set project [YOUR-PROJECT-ID]
gcloud auth application-default login --project [YOUR-PROJECT-ID]
```

*Note: If you encounter errors about a different project during authentication, you can bypass it by disabling the quota project and setting it manually:*
```bash
gcloud auth application-default login --disable-quota-project
gcloud auth application-default set-quota-project [YOUR-PROJECT-ID]
```

### 3. Configure Environment

Run the environment setup script. This script will:
*   Enable necessary Google Cloud APIs (Maps, BigQuery, remote MCP).
*   Create a restricted Google Maps Platform API Key.
*   Create a `.env` file with required environment variables.

```bash
chmod +x setup/setup_env.sh
./setup/setup_env.sh
```

### 4. Provision BigQuery

Run the setup script. This script automates the following:
*   Creates a Cloud Storage bucket.
*   Uploads the CSV data files.
*   Creates the `nyc_dogs` BigQuery dataset.
*   Loads the data into BigQuery table `licenses`.

```bash
chmod +x setup/setup_bigquery.sh
./setup/setup_bigquery.sh
```

## Installation

1.  Navigate to the project directory:
    ```bash
    cd examples/petpassport
    ```

2.  Create a virtual environment:
    ```bash
    python3 -m venv .venv
    ```

3.  Activate the virtual environment:
    ```bash
    source .venv/bin/activate
    ```

4.  Install dependencies:
    ```bash
    pip install google-adk==1.28.0 python-dotenv google-genai pillow
    ```

## Running the Application Locally

To run the application locally on your machine:

1.  **Install Uvicorn** (if not already installed):
    ```bash
    pip install uvicorn
    ```

2.  **Start the FastAPI server:**
    ```bash
    uvicorn petpassport.main:app --reload
    ```

3.  **Open the UI:**
    Navigate to `http://127.0.0.1:8000/ui/` in your browser to interact with the Pet Passport interface.

**Sample prompt:** "I have a Labrador Retriever. Where should we go in NYC?"

## Deploying to Cloud Run

To deploy the Pet Passport agent to Google Cloud Run:

1.  **Ensure you are in the project directory**:
    ```bash
    cd examples/petpassport
    ```

2.  **Deploy to Cloud Run**:
    Use the following pure `gcloud` command to build and deploy the application to Cloud Run. Replace `[YOUR-REGION]` with your desired region (e.g., `us-west1`).

    ```bash
    gcloud run deploy petpassport \
      --source petpassport \
      --region [YOUR-REGION] \
      --allow-unauthenticated \
      --labels dev-tutorial=google-mcp
    ```

    *Note: This command assumes you have the environment variables `MAPS_API_KEY` and `GOOGLE_CLOUD_PROJECT` set in your current shell.*

3.  **Permissions**:
    Ensure the Cloud Run service account has the following IAM roles:
    *   `BigQuery Data Viewer` and `BigQuery Job User` (to query BigQuery).
    *   `Storage Object Admin` on the bucket `pet-passport-data-$PROJECT_ID` (to upload PDFs).
