const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function inspect() {
    const templatePath = path.resolve(__dirname, 'RelaiWorld_App/Backend/template.pdf');
    if (!fs.existsSync(templatePath)) {
        console.error('Template not found at', templatePath);
        return;
    }
    const bytes = fs.readFileSync(templatePath);
    const doc = await PDFDocument.load(bytes);
    const pages = doc.getPages();
    pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        console.log(`Page ${i + 1}: ${width} x ${height}`);
    });
}

inspect();
