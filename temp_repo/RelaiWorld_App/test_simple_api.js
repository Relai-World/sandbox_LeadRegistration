const fetch = require('node-fetch');

// Test with the exact same data that was failing
const testData = {
  "RERA_Number": "12345678",
  "ProjectName": "fgh",
  "BuilderName": "tgj",
  "BuildingType": "Apartment",
  "Numbger_of_Floors": 27,
  "Number_of_Flats_Per_Floor": 10,
  "Possession_Date": "2025-06-08",
  "Open_Space": 70,
  "Carpet_area_Percentage": 20,
  "Floor_to_Ceiling_Height": 10,
  "PowerBackup": "Partial",
  "Ground_vehicle_Movement": "no",
  "Commision_percentage": 2,
  "Price_per_sft": 1000,
  "After_agreement_of_sale_what_is_payout_time_period": 30,
  "Amount_For_Extra_Car_Parking": 23456,
  "configurations": [
    {
      "type": "3.5 BHK",
      "sizeRange": 2400,
      "sizeUnit": "Sq ft",
      "No_of_car_Parking": 4
    }
  ],
  "POC_Name": "rishi",
  "POC_Contact": 9381464897,
  "POC_Role": "Manager",
  "UserEmail": "rishika@example.com"
};

async function testAPI() {
  try {
    console.log('🔍 Testing API with exact frontend data...');
    console.log('📤 Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3000/unverified/shortform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed:', result.message);
      if (result.missingFields) {
        console.log('❌ Missing fields:', result.missingFields);
      }
      if (result.invalidConfig) {
        console.log('❌ Invalid config:', result.invalidConfig);
      }
      if (result.missingField) {
        console.log('❌ Missing field:', result.missingField);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testAPI(); 