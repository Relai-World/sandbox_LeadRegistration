const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

async function extractPages() {
    const pdfPath = '/Users/rishikapatel/Onboarding_Netlify/attached_assets/Report_29 slides.pdf';
    const outputDir = '/Users/rishikapatel/Onboarding_Netlify/RelaiWorld_App/Backend/slides_images';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const existingPdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);

    for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
        const [page] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(page);

        const pdfPagePath = path.join(outputDir, `page_${i + 1}.pdf`);
        const jpgPagePath = path.join(outputDir, `page_${i + 1}.jpg`);

        fs.writeFileSync(pdfPagePath, await newPdf.save());

        try {
            execSync(`sips -s format jpeg "${pdfPagePath}" --out "${jpgPagePath}"`);
            fs.unlinkSync(pdfPagePath); // Clean up temp PDF
            console.log(`Extracted page ${i + 1}`);
        } catch (err) {
            console.error(`Failed to convert page ${i + 1}:`, err.message);
        }
    }
}

extractPages().catch(console.error);
