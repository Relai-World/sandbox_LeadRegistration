const fetch = require('node-fetch');

// Test data for creating a new short-form onboarding draft
const testDraftData = {
  projectName: "Sunset Heights Phase 2",
  builderName: "Sunrise Developers",
  reraNumber: "P024000006",
  projectType: "Apartment",
  numberOfFloors: "25",
  flatsPerFloor: "8",
  possessionDate: "2026-06-30",
  openSpace: "35",
  carpetAreaPercent: "65",
  ceilingHeight: "12",
  groundVehicleMovement: "yes",
  wowFactorAmenity: "Rooftop Garden, Swimming Pool, Gym",
  extraCarParkingAmount: "300000",
  powerBackup: "Full",
  commissionPercentage: "2.5",
  payoutTimePeriod: "45",
  pocName: "Priya Sharma",
  pocNumber: "9876543210",
  pocRole: "Sales Manager",
  userEmail: "rishika@example.com",
  configurations: [
    {
      type: "2BHK",
      sizeRange: "1200",
      sizeUnit: "Sq ft",
      No_of_car_Parking: "1"
    },
    {
      type: "3BHK",
      sizeRange: "1800",
      sizeUnit: "Sq ft", 
      No_of_car_Parking: "2"
    }
  ]
};

async function createShortFormDraft() {
  try {
    console.log('🚀 Creating new short-form onboarding draft...');
    console.log('📧 Email:', testDraftData.userEmail);
    console.log('🏗️ Project:', testDraftData.projectName);
    
    const response = await fetch('http://localhost:3000/unverified/shortform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDraftData),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📄 Response Body:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ Draft created successfully!');
      console.log('🆔 Draft ID:', result.data._id);
      console.log('📅 Created at:', result.data.createdAt);
    } else {
      console.log('❌ Failed to create draft');
      console.log('💬 Error message:', result.message);
    }

  } catch (error) {
    console.error('🔥 Network or other error:', error.message);
  }
}

// Run the test
createShortFormDraft(); 