// Test with the exact same data that's failing in the frontend
const testData = {
  "RERA_Number": "123456",
  "ProjectName": "ert",
  "BuilderName": "bn",
  "BuildingType": "Apartment",
  "Numbger_of_Floors": 1,
  "Number_of_Flats_Per_Floor": 1,
  "Possession_Date": "2025-06-09",
  "Open_Space": 1,
  "Carpet_area_Percentage": 11,
  "Floor_to_Ceiling_Height": 11,
  "PowerBackup": "Partial",
  "Ground_vehicle_Movement": "no",
  "Commision_percentage": 13,
  "Price_per_sft": 1000,
  "After_agreement_of_sale_what_is_payout_time_period": 23,
  "Amount_For_Extra_Car_Parking": 123,
  "configurations": [
    {
      "type": "3 BHK",
      "sizeRange": 234,
      "sizeUnit": "Sq ft",
      "No_of_car_Parking": 1
    }
  ],
  "POC_Name": "rty",
  "POC_Contact": 9999999999,
  "POC_Role": "fty",
  "UserEmail": "rishika@example.com"
};

async function debugAPI() {
  try {
    const fetch = await import('node-fetch');
    console.log('🔍 Debugging API with exact frontend data...');
    console.log('📤 Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch.default('http://localhost:3000/unverified/shortform', {
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
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

debugAPI(); 