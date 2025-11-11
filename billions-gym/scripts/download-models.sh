#!/bin/bash

# Script to download face-api.js models
# Usage: bash scripts/download-models.sh

MODELS_DIR="public/models"
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js-models/master"

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# Models to download
models=(
    "tiny_face_detector_model-weights_manifest.json"
    "tiny_face_detector_model-shard1"
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-shard1"
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-shard1"
)

echo "Downloading face-api.js models..."
echo "Destination: $MODELS_DIR"
echo ""

# Download each model
for model in "${models[@]}"; do
    echo "Downloading $model..."
    curl -L -o "$MODELS_DIR/$model" "$BASE_URL/$model"
    if [ $? -eq 0 ]; then
        echo "✓ Downloaded $model"
    else
        echo "✗ Failed to download $model"
    fi
    echo ""
done

echo "Done! Models are available at: $MODELS_DIR"

