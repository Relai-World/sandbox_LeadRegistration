const fs = require('fs');

// Read the corrected project data
const projectData = JSON.parse(fs.readFileSync('./corrected_project_data.json', 'utf8'));

async function testProjectSubmission() {
  try {
    console.log('Testing project submission with corrected data...');
    console.log('Project Name:', projectData.ProjectName);
    console.log('RERA Number:', projectData.RERA_Number);
    
    const response = await fetch('http://localhost:3000/api/unverified/shortform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Project submitted successfully!');
    } else {
      console.log('❌ Project submission failed!');
      console.log('Error details:', result);
    }
  } catch (error) {
    console.error('❌ Error testing project submission:', error.message);
  }
}

// Test the API
testProjectSubmission(); 