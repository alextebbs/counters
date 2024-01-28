#!/bin/bash

# Usage: ./curl-api.sh POST /counter data.json

# Method
METHOD=$1

# File containing the JSON data
JSON=$2

# API endpoint URL
ENDPOINT=$3

# Check if the file exists
if [ ! -f "$JSON" ]; then
    echo "Error: File $JSON does not exist."
    exit 1
fi

# Send the POST request with the JSON data from the file
curl -X $METHOD -H "Content-Type: application/json" -d @"$JSON" http://localhost:8080$API_ENDPOINT
