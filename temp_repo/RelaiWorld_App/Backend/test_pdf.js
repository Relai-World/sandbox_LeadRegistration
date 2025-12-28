const fetch = require('node-fetch');

async function testPDF() {
    const payload = {
        leadName: "Test Lead",
        leadMobile: "1234567890",
        projects: [
            {
                _id: "1",
                projectName: "Project A",
                builderName: "Builder A",
                RERA_Number: "RERA1",
                projectLocation: "Location A",
                pricePerSft: 5000,
                possessionDate: "2025-12-01",
                Project_Type: "Apartment",
                totalLandArea: "10 Acres",
                sizeRange: "1000-2000 sq.ft",
                priceRange: "50L - 1Cr",
                GRID_Score: 8.5,
                constructionStatus: "Ongoing"
            },
            {
                _id: "2",
                projectName: "Project B",
                builderName: "Builder B",
                RERA_Number: "RERA2",
                projectLocation: "Location B",
                pricePerSft: 6000,
                possessionDate: "2026-06-01",
                Project_Type: "Villa",
                totalLandArea: "5 Acres",
                sizeRange: "2000-3000 sq.ft",
                priceRange: "1.5Cr - 3Cr",
                GRID_Score: 9.0,
                constructionStatus: "Ready"
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:3000/api/pdf/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.log('Error:', text);
        } else {
            console.log('Success: PDF generated');
        }
    } catch (err) {
        console.error('Fetch failed:', err.message);
    }
}

testPDF();
