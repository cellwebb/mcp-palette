#!/bin/bash

# Make sure build directory exists
mkdir -p build

# Download a blue square placeholder image
echo "Downloading placeholder icon..."
curl -s "https://via.placeholder.com/512x512/007BFF/FFFFFF" > build/icon.png

# Check if download was successful
if [ $? -eq 0 ] && [ -s build/icon.png ]; then
  echo "Successfully downloaded placeholder icon to build/icon.png"
else
  echo "Error downloading icon. Please create a 512x512 PNG icon manually and place it in the build directory."
  exit 1
fi
