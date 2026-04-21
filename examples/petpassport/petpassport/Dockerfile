FROM python:3.13-slim

WORKDIR /app

# Install system dependencies (required for some Python packages)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
# The adk deploy command looks for requirements.txt in the agent directory
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Run using uvicorn pointing to main.py in the current directory
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
