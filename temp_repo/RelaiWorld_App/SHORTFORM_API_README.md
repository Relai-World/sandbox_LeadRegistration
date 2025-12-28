# Short Form API Integration

This document explains how to integrate with the short form API endpoint for submitting project data.

## API Endpoint

**URL:** `http://localhost:3000/unverified/shortform`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Request Body Format

The API expects the following JSON structure:

```json
{
  "RERA_Number": "P02400000001",
  "ProjectName": "Cloud 9 Residences",
  "BuilderName": "Urban Rise Developers",
  "BuildingType": "Apartment",
  "Numbger_of_Floors": 25,
  "Number_of_Flats_Per_Floor": 8,
  "Possession_Date": "2025-12-31",
  "Open_Space": 70,
  "Carpet_area_Percentage": 75,
  "Floor_to_Ceiling_Height": 10,
  "PowerBackip": "Full",
  "Ground_vehicle_Movement": "yes",
  "Commision_percentage": 2.5,
  "Price_per_sft": 8500,
  "After_agreement_of_sale_what_is_payout_time_period": 30,
  "Amount_For_Extra_Car_Parking": 250000,
  "configurations": [
    {
      "type": "2 BHK",
      "sizeRange": 1200,
      "sizeUnit": "Sq ft",
      "No_of_car_Parking": 1
    }
  ],
  "POC_Name": "John Doe",
  "POC_Contact": 9876543210,
  "POC_Role": "Sales Manager",
  "UserEmail": "agent@example.com"
}
```

## Field Descriptions

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `RERA_Number` | String | Unique RERA registration number | "P02400000001" |
| `ProjectName` | String | Name of the project | "Cloud 9 Residences" |
| `BuilderName` | String | Name of the builder/developer | "Urban Rise Developers" |
| `BuildingType` | String | Type of building | "Apartment" or "Villas" |
| `Numbger_of_Floors` | Number | Total number of floors | 25 |
| `Number_of_Flats_Per_Floor` | Number | Number of flats per floor | 8 |
| `Possession_Date` | String | Expected possession date (YYYY-MM-DD) | "2025-12-31" |
| `Open_Space` | Number | Open space percentage | 70 |
| `Carpet_area_Percentage` | Number | Carpet area percentage | 75 |
| `Floor_to_Ceiling_Height` | Number | Floor to ceiling height in feet | 10 |
| `PowerBackip` | String | Power backup type | "Full", "Partial", or "None" |
| `Ground_vehicle_Movement` | String | Ground vehicle movement allowed | "yes", "no", or "partial" |
| `Commision_percentage` | Number | Commission percentage | 2.5 |
| `Price_per_sft` | Number | Price per square foot | 8500 |
| `After_agreement_of_sale_what_is_payout_time_period` | Number | Payout time period in days | 30 |
| `Amount_For_Extra_Car_Parking` | Number | Extra car parking amount | 250000 |
| `configurations` | Array | Unit configurations (see below) | - |
| `POC_Name` | String | Point of contact name | "John Doe" |
| `POC_Contact` | Number | Point of contact phone number | 9876543210 |
| `POC_Role` | String | Point of contact role | "Sales Manager" |
| `UserEmail` | String | User's email address | "agent@example.com" |

### Unit Configurations

The `configurations` array contains unit type details:

```json
{
  "type": "2 BHK",
  "sizeRange": 1200,
  "sizeUnit": "Sq ft",
  "No_of_car_Parking": 1
}
```

**Supported Unit Types:**
- "1 BHK"
- "2BHK"
- "2.5 BHK"
- "3 BHK"
- "3.5 BHK"
- "4 BHK"
- "4.5 BHK"
- "5 BHK"
- "Commercial"
- "Plotting"

## Frontend Integration

The frontend component `ShortFormOnboarding` has been updated to include API submission functionality. Key features:

1. **Form Validation**: Validates required fields before submission
2. **Data Transformation**: Converts frontend form data to API format
3. **Error Handling**: Displays appropriate error messages
4. **Loading States**: Shows loading indicator during submission

### Usage Example

```tsx
<ShortFormOnboarding 
  agentData={{ email: "agent@example.com" }}
  onDraftSaved={(draftData) => console.log('Draft saved:', draftData)}
  onSubmitSuccess={(response) => console.log('Submitted:', response)}
/>
```

## Testing

### Using the Test Script

1. Install dependencies:
```bash
npm install node-fetch
```

2. Run the test script:
```bash
node test_shortform_api.js
```

### Using cURL

```bash
curl -X POST http://localhost:3000/unverified/shortform \
  -H "Content-Type: application/json" \
  -d @sample_shortform_data.json
```

## Response Format

### Success Response (201)
```json
{
  "message": "Short form project saved successfully",
  "data": {
    "_id": "...",
    "RERA_Number": "P02400000001",
    "ProjectName": "Cloud 9 Residences",
    // ... other fields
  }
}
```

### Error Response (400/409/500)
```json
{
  "message": "Error description"
}
```

## Common Error Codes

- **400**: Missing required fields or invalid data
- **409**: Project with this RERA number already exists
- **500**: Internal server error

## Backend Implementation

The API is implemented in:
- **Controller**: `Backend/src/Controller/UnVerifiedResidentialController.js`
- **Route**: `Backend/src/Routes/UnVerifiedResidentialRoutes.js`
- **Model**: `Backend/src/Model/UnVerifiedResidentialModel.js`

The endpoint automatically:
1. Validates required fields
2. Checks for duplicate RERA numbers
3. Calculates total units and base project price
4. Saves to MongoDB
5. Returns success/error response 