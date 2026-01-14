#!/bin/bash

# PDF Generation Script using Chrome
# Converts user-stories-document.html to PDF using Chrome's headless mode

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CHECKPOINT="${1:-07}"

BASE_HTML_FILE="$SCRIPT_DIR/user-stories-document.html"
HTML_FILE="$SCRIPT_DIR/user-stories-document-checkpoint-$CHECKPOINT.html"
OUTPUT_FILE="$SCRIPT_DIR/KudosCourts-User-Stories-Checkpoint-$CHECKPOINT.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

echo "🚀 Starting PDF generation..."

# Check if base HTML template exists
if [ ! -f "$BASE_HTML_FILE" ]; then
    echo "❌ Error: base HTML template not found at $BASE_HTML_FILE"
    exit 1
fi

# Generate checkpoint-specific HTML (derived from checkpoint + stories)
echo "🧩 Generating HTML for checkpoint $CHECKPOINT..."
node "$SCRIPT_DIR/generate-checkpoint-html.js" \
    --checkpoint "$CHECKPOINT" \
    --checkpoint-path "$SCRIPT_DIR/checkpoint-$CHECKPOINT.md" \
    --base-html "$BASE_HTML_FILE" \
    --out-html "$HTML_FILE" > /dev/null

echo "📄 HTML generated: $HTML_FILE"

# Check if Chrome exists
if [ ! -f "$CHROME" ]; then
    echo "❌ Error: Google Chrome not found at $CHROME"
    exit 1
fi

echo "🌐 Using Chrome for PDF generation..."

# Generate PDF using Chrome headless
"$CHROME" \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --print-to-pdf="$OUTPUT_FILE" \
    --print-to-pdf-no-header \
    --no-pdf-header-footer \
    "file://$HTML_FILE"

# Check if PDF was created
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "✅ PDF generated successfully!"
    echo "📦 Output: $OUTPUT_FILE"
    echo "📊 File size: $FILE_SIZE"
else
    echo "❌ Error: PDF generation failed"
    exit 1
fi
