#!/bin/bash
set -e

# Configuration
DOCKER_USER=$1
IMAGE_NAME="velo-repar-app"
TAG="latest"

if [ -z "$DOCKER_USER" ]; then
  echo "Usage: ./scripts/publish-docker.sh <your-docker-hub-username>"
  exit 1
fi

FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME:$TAG"

echo "🚀 Building and pushing $FULL_IMAGE_NAME..."

# Load .env variables for build arguments
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Build the image with necessary build args
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
  --build-arg NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
  --build-arg NEXT_PUBLIC_MAPTILER_KEY=$NEXT_PUBLIC_MAPTILER_KEY \
  -t $FULL_IMAGE_NAME .

echo "✅ Build complete. Pushing to Docker Hub..."

# Push to Docker Hub
docker push $FULL_IMAGE_NAME

echo "✨ Successfully pushed $FULL_IMAGE_NAME to Docker Hub!"
