#!/usr/bin/env node

/**
 * PDF Generation Script for KudosCourts User Stories
 *
 * This script converts the user-stories-document.html file to a professional PDF
 * using Puppeteer for high-quality rendering.
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function generatePDF() {
  console.log("🚀 Starting PDF generation...");

  const htmlPath = path.join(__dirname, "user-stories-document.html");
  const outputPath = path.join(
    __dirname,
    "KudosCourts-User-Stories-Checkpoint-01.pdf",
  );

  // Check if HTML file exists
  if (!fs.existsSync(htmlPath)) {
    console.error("❌ Error: user-stories-document.html not found");
    process.exit(1);
  }

  console.log("📄 Reading HTML file...");
  const htmlContent = fs.readFileSync(htmlPath, "utf8");

  console.log("🌐 Launching browser...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    console.log("📝 Creating PDF...");
    const page = await browser.newPage();

    // Set content with base URL for relative paths
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });

    // Generate PDF with professional settings
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    console.log("✅ PDF generated successfully!");
    console.log(`📦 Output: ${outputPath}`);

    // Get file size
    const stats = fs.statSync(outputPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 File size: ${fileSizeInMB} MB`);
  } catch (error) {
    console.error("❌ Error generating PDF:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the generator
generatePDF().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
