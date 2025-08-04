#!/bin/bash

# Script to create favicon from an image using ImageMagick
# Usage: ./create-favicon.sh input-image.png

if [ -z "$1" ]; then
    echo "Usage: $0 <input-image>"
    exit 1
fi

INPUT="$1"
OUTPUT_DIR="client/public"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed."
    echo "Install with: brew install imagemagick"
    exit 1
fi

# Create multiple sizes
echo "Creating favicon files..."

# Create ICO with multiple sizes
convert "$INPUT" -resize 16x16 "$OUTPUT_DIR/favicon-16.png"
convert "$INPUT" -resize 32x32 "$OUTPUT_DIR/favicon-32.png"
convert "$INPUT" -resize 48x48 "$OUTPUT_DIR/favicon-48.png"
convert "$OUTPUT_DIR/favicon-16.png" "$OUTPUT_DIR/favicon-32.png" "$OUTPUT_DIR/favicon-48.png" "$OUTPUT_DIR/favicon.ico"

# Create PNG versions
convert "$INPUT" -resize 180x180 "$OUTPUT_DIR/apple-touch-icon.png"

# Clean up temporary files
rm "$OUTPUT_DIR/favicon-16.png" "$OUTPUT_DIR/favicon-32.png" "$OUTPUT_DIR/favicon-48.png"

echo "Favicon created successfully in $OUTPUT_DIR/"