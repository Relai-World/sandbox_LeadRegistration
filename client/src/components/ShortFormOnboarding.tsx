import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { usePropertyDropdown } from '@/hooks/usePropertyDropdown';

interface UnitConfiguration {
  sizeRange?: string;
  sizeUnit?: string;
  sizeSqFt?: string;
  sizeSqYd?: string;
  parkingSlots: string;
  facing: string;
  uds?: string;
  configSoldOutStatus?: string;
}

interface UnitConfigurations {
  [key: string]: {
    enabled: boolean;
    variants: UnitConfiguration[];
  };
}

interface FormData {
  projectName: string;
  builderName: string;
  reraNumber: string;
  projectType: string;
  isAvailable: string;
  numberOfFloors: string;
  possessionDate: string;
  openSpace: string;
  carpetAreaPercent: string;
  ceilingHeight: string;
  floorCharger: string;
  floorChargerAmount: string;
  floorChargerAbove: string;
  facingCharges: string;
  facingChargesAmount: string;
  plc: string;
  plcConditions: string;
  powerBackup: string;
  carParkingCost: string;
  pricePerSft: string;
  communityType: string;
  totalLandArea: string;
  numberOfTowers: string;
  totalUnits: string;
  brochureLink: string;
  priceSheetLink: string;
  projectLocation: string;
  city: string;
  state: string;
  groundVehicleMovement: string;
  wowFactorAmenity: string;
  commissionType: string;
  commissionPercentage: string;
  payoutPeriod: string;
  pocDetails: { name: string; contact: string; role: string; cp: string; }[];
  unitConfigurations: UnitConfigurations;
  acceptedModesOfLeadRegistration?: any;
}

interface ShortFormOnboardingProps {
  agentData: any;
  userEmail?: string;
  onDraftSaved?: (draftData: any) => void;
  onSubmitSuccess?: (response: any) => void;
  initialData?: any;
  isViewMode?: boolean;
  onBackToDashboard?: () => void;
}

// The API endpoint URL from your backend server
// It's best practice to store this in an environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';


// Helper function to normalize unit type format (add space before BHK)
const normalizeUnitType = (type: string) => {
  if (!type) return '';
  // Convert '2BHK' to '2 BHK', '3.5BHK' to '3.5 BHK', etc.
  return type.replace(/(\d+\.?\d*)BHK/i, '$1 BHK');
};

// Helper function to build unit configurations from API data
const buildUnitConfigurations = (apiConfigs: any[], projectType: string): UnitConfigurations => {
  const configs: UnitConfigurations = {};

  // Normalize project type to lowercase for case-insensitive comparison
  // Handle plural forms (Villas, Apartments) and compound types (Villa Apartment)
  const normalizedProjectType = projectType?.toLowerCase() || '';
  const isVillaProject = normalizedProjectType.includes('villa') || normalizedProjectType === 'stand-alone';

  console.log('buildUnitConfigurations - projectType:', projectType, 'normalized:', normalizedProjectType, 'isVilla:', isVillaProject);

  apiConfigs.forEach((config: any) => {
    const rawUnitType = config.type;
    if (!rawUnitType) return;

    // Normalize the unit type to match frontend format (with space)
    const unitType = normalizeUnitType(rawUnitType);

    if (!configs[unitType]) {
      configs[unitType] = {
        enabled: true,
        variants: []
      };
    }

    // Map based on project type - Villa has separate fields, Apartment has single size field
    if (isVillaProject && (config.sizeSqFt || config.sizeSqYd)) {
      configs[unitType].variants.push({
        sizeSqFt: config.sizeSqFt?.toString() || '',
        sizeSqYd: config.sizeSqYd?.toString() || '',
        parkingSlots: config.No_of_car_Parking?.toString() || '',
        facing: config.facing || '',
        uds: config.uds?.toString() || config.UDS?.toString() || '',
        configSoldOutStatus: config.configSoldOutStatus || config.configsoldoutstatus || 'active'
      });
    } else {
      configs[unitType].variants.push({
        sizeRange: config.sizeRange?.toString() || '',
        sizeUnit: config.sizeUnit || 'Sq ft',
        parkingSlots: config.No_of_car_Parking?.toString() || '',
        facing: config.facing || '',
        uds: config.uds?.toString() || config.UDS?.toString() || '',
        configSoldOutStatus: config.configSoldOutStatus || config.configsoldoutstatus || 'active'
      });
    }
  });

  return configs;
};

// Helper function to map backend property data to frontend form patch
const mapPropertyToFormPatch = (property: any): Partial<FormData> => {
  console.log('mapPropertyToFormPatch - Received property data:', property);
  console.log('mapPropertyToFormPatch - Available keys:', Object.keys(property));

  const patch: Partial<FormData> = {};

  // Basic fields
  if (property.ProjectName) patch.projectName = property.ProjectName;
  if (property.BuilderName) patch.builderName = property.BuilderName;
  if (property.RERA_Number) patch.reraNumber = property.RERA_Number;

  // Project Type mapping (Villa -> stand-alone, Apartment -> gated)
  // Normalize to lowercase for case-insensitive comparison
  // Handle plural forms (Villas, Apartments), compound types (Villa Apartment), and existing short-form values
  if (property.Project_Type || property.property_type) {
    const projectType = (property.Project_Type || property.property_type)?.toLowerCase() || '';
    console.log('mapPropertyToFormPatch - Original project type:', property.Project_Type || property.property_type, 'normalized:', projectType);

    // First check if it's already a short-form value (preserve as-is)
    if (projectType === 'stand-alone' || projectType === 'gated' || projectType === 'semi-gated') {
      patch.projectType = projectType;
    }
    // Check if the type contains 'villa' anywhere in the string (handles Villa, Villas, Villa Apartment, etc.)
    else if (projectType.includes('villa')) {
      patch.projectType = 'stand-alone';
    }
    // Check if the type contains 'apartment' anywhere (handles Apartment, Apartments, etc.)
    else if (projectType.includes('apartment')) {
      patch.projectType = 'gated';
    }
  }

  // Numeric fields
  if (property.Number_of_Floors) patch.numberOfFloors = property.Number_of_Floors.toString();
  if (property.Open_Space !== undefined && property.Open_Space !== null) {
    // Handle percentage symbol if present
    const openSpaceValue = String(property.Open_Space).replace('%', '');
    patch.openSpace = openSpaceValue;
  }
  if (property.Carpet_area_Percentage !== undefined && property.Carpet_area_Percentage !== null) {
    const carpetValue = String(property.Carpet_area_Percentage).replace('%', '');
    patch.carpetAreaPercent = carpetValue;
  }
  if (property.Floor_to_Ceiling_Height !== undefined && property.Floor_to_Ceiling_Height !== null) {
    const ceilingValue = String(property.Floor_to_Ceiling_Height).replace(/\s*ft\s*$/i, '');
    patch.ceilingHeight = ceilingValue;
  }
  if (property.Amount_For_Extra_Car_Parking !== undefined && property.Amount_For_Extra_Car_Parking !== null) {
    patch.carParkingCost = property.Amount_For_Extra_Car_Parking.toString();
  }
  if (property.Price_per_sft !== undefined && property.Price_per_sft !== null) {
    patch.pricePerSft = property.Price_per_sft.toString();
  }
  if (property.Commission_percentage !== undefined && property.Commission_percentage !== null) {
    const commissionValue = String(property.Commission_percentage).replace('%', '');
    patch.commissionPercentage = commissionValue;
  }
  if (property.After_agreement_of_sale_what_is_payout_time_period) {
    patch.payoutPeriod = property.After_agreement_of_sale_what_is_payout_time_period.toString();
  }

  // City and State
  if (property.City) patch.city = property.City;
  if (property.State) patch.state = property.State;

  // New fields
  if (property.CommunityType) patch.communityType = property.CommunityType;
  if (property.Total_land_Area) patch.totalLandArea = property.Total_land_Area;
  if (property.Number_of_Towers) patch.numberOfTowers = property.Number_of_Towers.toString();
  if (property.Total_Number_of_Units) patch.totalUnits = property.Total_Number_of_Units.toString();
  if (property.ProjectBrochure) patch.brochureLink = property.ProjectBrochure;
  if (property.PriceSheetLink) patch.priceSheetLink = property.PriceSheetLink;
  if (property.ProjectLocation) patch.projectLocation = property.ProjectLocation;

  // Date field - handle both ISO dates and string formats like "RTM"
  if (property.Possession_Date) {
    // Convert to string for consistent handling
    const possessionValue = String(property.Possession_Date);

    // Handle special values like "RTM" (Ready to Move)
    if (possessionValue === 'RTM' || possessionValue.toUpperCase() === 'RTM') {
      patch.possessionDate = 'RTM';
    } else {
      try {
        const possDate = new Date(property.Possession_Date);
        if (!isNaN(possDate.getTime())) {
          patch.possessionDate = possDate.toISOString().split('T')[0];
        } else {
          // If not a valid date, preserve the original value
          patch.possessionDate = possessionValue;
        }
      } catch (e) {
        console.log('mapPropertyToFormPatch - Could not parse possession date:', property.Possession_Date);
        patch.possessionDate = possessionValue;
      }
    }
  }

  // String fields
  if (property.PowerBackup) {
    const powerValue = property.PowerBackup.toLowerCase();
    // Ensure it matches the dropdown values
    if (['full', 'partial', 'none'].includes(powerValue)) {
      patch.powerBackup = powerValue;
    }
  }
  if (property.Ground_vehicle_Movement) {
    const vehicleValue = property.Ground_vehicle_Movement.toLowerCase();
    if (['yes', 'no'].includes(vehicleValue)) {
      patch.groundVehicleMovement = vehicleValue;
    }
  }
  if (property.Wow_Factor_Amenity) patch.wowFactorAmenity = property.Wow_Factor_Amenity;

  // POC Details
  if (property.pocDetails && property.pocDetails.length > 0) {
    patch.pocDetails = property.pocDetails.map((poc: any) => ({
      name: poc.name || '',
      contact: poc.contact?.toString() || '',
      role: poc.role || '',
      cp: poc.cp || false
    }));
    patch.pocDetails = [{
      name: property.POC_Name || '',
      contact: property.POC_Contact?.toString() || '',
      role: property.POC_Role || '',
      cp: property.POC_CP || property.cp || ''
    }];
  }

  // Registration Modes
  if (property.Accepted_Modes_of_Lead_Registration || property.accepted_modes_of_lead_registration) {
    patch.acceptedModesOfLeadRegistration = property.Accepted_Modes_of_Lead_Registration || property.accepted_modes_of_lead_registration;
  }

  // Unit Configurations
  if (property.configurations && property.configurations.length > 0) {
    const projectType = property.Project_Type || property.property_type || '';
    patch.unitConfigurations = buildUnitConfigurations(property.configurations, projectType);
  }

  console.log('mapPropertyToFormPatch - Generated patch:', patch);
  return patch;
};

export const ShortFormOnboarding: React.FC<ShortFormOnboardingProps> = ({ agentData, userEmail, onDraftSaved, onSubmitSuccess, initialData, isViewMode = false, onBackToDashboard }) => {

  // Transform initial data if provided
  const getInitialFormData = (): FormData => {
    if (initialData) {
      const data = initialData;
      return {
        projectName: data.ProjectName || '',
        builderName: data.BuilderName || '',
        reraNumber: data.RERA_Number || '',
        projectType: (() => {
          // Handle both old field name (BuildingType) and new field name (Project_Type)
          const projectTypeValue = data.Project_Type || data.BuildingType || '';
          if (projectTypeValue === 'Apartment' || projectTypeValue === 'Apartments') return 'gated';
          if (projectTypeValue === 'Villa' || projectTypeValue === 'Villas') return 'stand-alone';
          // If it's already in short form format, keep it
          if (['gated', 'semi-gated', 'stand-alone'].includes(projectTypeValue)) return projectTypeValue;
          return '';
        })(),
        isAvailable: data.isavailable || 'Active',
        numberOfFloors: data.Number_of_Floors?.toString() || '',
        possessionDate: (() => {
          if (!data.Possession_Date) return '';
          // Convert to string for consistent handling
          const possessionValue = String(data.Possession_Date);
          // Handle special values like "RTM"
          if (possessionValue === 'RTM' || possessionValue.toUpperCase() === 'RTM') {
            return 'RTM';
          }
          try {
            const date = new Date(data.Possession_Date);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
            return possessionValue; // Return original value if not a valid date
          } catch {
            return possessionValue; // Return original value if parsing fails
          }
        })(),
        openSpace: data.Open_Space?.toString() || '',
        carpetAreaPercent: data.Carpet_area_Percentage?.toString() || '',
        ceilingHeight: data.Floor_to_Ceiling_Height?.toString() || '',
        floorCharger: data.Floor_Charger || '',
        floorChargerAmount: data.Floor_Charger_Amount?.toString() || '',
        floorChargerAbove: data.Floor_Charger_Above?.toString() || '',
        facingCharges: data.Facing_Charges || '',
        facingChargesAmount: data.Facing_Charges_Amount?.toString() || '',
        plc: data.PLC || '',
        plcConditions: data.PLC_Conditions || '',
        powerBackup: data.PowerBackup || '',
        carParkingCost: data.Amount_For_Extra_Car_Parking?.toString() || '',
        pricePerSft: data.Price_per_sft?.toString() || '',
        communityType: data.CommunityType || '',
        totalLandArea: data.Total_land_Area || '',
        numberOfTowers: data.Number_of_Towers?.toString() || '',
        totalUnits: data.Total_Number_of_Units?.toString() || '',
        brochureLink: data.ProjectBrochure || '',
        priceSheetLink: data.PriceSheetLink || '',
        projectLocation: data.ProjectLocation || '',
        city: data.City || data.city || '',
        state: data.State || data.state || '',
        groundVehicleMovement: data.Ground_vehicle_Movement || '',
        wowFactorAmenity: data.Wow_Factor_Amenity || '',
        commissionType: data.commissionType || 'commission',
        commissionPercentage: data.Commission_percentage?.toString() || '',
        payoutPeriod: data.After_agreement_of_sale_what_is_payout_time_period?.toString() || '',
        pocDetails: data.pocDetails && data.pocDetails.length > 0
          ? data.pocDetails.map((poc: any) => ({
            name: poc.name || '',
            contact: poc.contact?.toString() || '',
            role: poc.role || '',
            cp: poc.cp || ''
          }))
          : (data.POC_Name || data.POC_Contact || data.POC_Role)
            ? [{ name: data.POC_Name || '', contact: data.POC_Contact?.toString() || '', role: data.POC_Role || '', cp: data.POC_CP || data.cp || '' }]
            : [{ name: '', contact: '', role: '', cp: '' }],
        unitConfigurations: buildUnitConfigurations(
          data.configurations || data.variants || [],
          data.Project_Type || data.BuildingType || ''
        ),
        acceptedModesOfLeadRegistration: data.Accepted_Modes_of_Lead_Registration || data.accepted_modes_of_lead_registration || null
      };
    }

    return {
      projectName: '',
      builderName: '',
      reraNumber: '',
      projectType: '',
      isAvailable: 'Active',
      numberOfFloors: '',
      possessionDate: '',
      openSpace: '',
      carpetAreaPercent: '',
      ceilingHeight: '',
      floorCharger: '',
      floorChargerAmount: '',
      floorChargerAbove: '',
      facingCharges: '',
      facingChargesAmount: '',
      plc: '',
      plcConditions: '',
      powerBackup: '',
      carParkingCost: '',
      pricePerSft: '',
      communityType: '',
      totalLandArea: '',
      numberOfTowers: '',
      totalUnits: '',
      brochureLink: '',
      priceSheetLink: '',
      projectLocation: '',
      city: '',
      state: '',
      groundVehicleMovement: 'no',
      wowFactorAmenity: '',
      commissionType: 'commission',
      commissionPercentage: '',
      payoutPeriod: '',
      pocDetails: [{ name: '', contact: '', role: '', cp: '' }],
      unitConfigurations: {},
      acceptedModesOfLeadRegistration: null
    };
  };

  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const unitTypes = ['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4.5 BHK', '5 BHK', '6 BHK'];

  // Use property dropdown hook for auto-population
  const { dropdownValues, loading: dropdownLoading, fetchPropertyDetails } = usePropertyDropdown();

  // Memoized property fetched handler
  const handlePropertyFetched = useCallback((property: any) => {
    console.log('handlePropertyFetched - Raw property data received:', property);
    console.log('handlePropertyFetched - Property data structure:', JSON.stringify(property, null, 2));
    const patch = mapPropertyToFormPatch(property);
    console.log('handlePropertyFetched - Applying patch to form:', patch);
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  // Fetch property details when dropdown selection changes
  useEffect(() => {
    const hasValidProjectName = formData.projectName && dropdownValues.projectNames.includes(formData.projectName);
    const hasValidReraNumber = formData.reraNumber && dropdownValues.reraNumbers.includes(formData.reraNumber);

    // Only fetch once - prefer project name if both are present
    if (hasValidProjectName) {
      fetchPropertyDetails(formData.projectName, undefined, handlePropertyFetched);
    } else if (hasValidReraNumber) {
      fetchPropertyDetails(undefined, formData.reraNumber, handlePropertyFetched);
    }
  }, [formData.projectName, formData.reraNumber, dropdownValues.projectNames, dropdownValues.reraNumbers, fetchPropertyDetails, handlePropertyFetched]);

  // Map Project_Type from frontend values to backend enum values
  const mapProjectType = (projectType: string) => {
    switch (projectType) {
      case 'Villa':
      case 'villa':
        return 'Villa';
      case 'Apartment':
      case 'apartment':
        return 'Apartment';
      case 'Villa Apartment':
      case 'villa apartment':
        return 'Villa'; // Default Villa Apartment to Villa
      case 'gated':
      case 'semi-gated':
        return 'Apartment'; // Short form uses gated/semi-gated for Apartment
      case 'stand-alone':
        return 'Villa'; // Short form uses stand-alone for Villa
      default:
        return 'Apartment';
    }
  };

  // Map CommunityType from frontend values to backend enum values
  const mapCommunityType = (communityType: string) => {
    if (!communityType) return undefined;
    switch (communityType) {
      case 'Gated':
      case 'Gated Community':
        return 'Gated Community';
      case 'Semi_Gated':
      case 'Semi-Gated':
      case 'Semi-Gated Community':
        return 'Semi-Gated Community';
      case 'Standalone':
      case 'Open Community':
      case 'Luxury Community':
      case 'Affordable Community':
        return 'Standalone';
      default:
        return 'Gated Community';
    }
  };

  const handleDeepChange = (update: Partial<FormData>) => {
    setFormData((prev: FormData) => ({ ...prev, ...update }));
    // Clear validation errors for updated fields
    const updatedFields = Object.keys(update);
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });
  };

  const validateField = (field: string, value: string): string => {
    console.log(`ShortFormOnboarding: validateField - Checking ${field} with value:`, value);

    switch (field) {
      case 'projectName':
        const projectNameError = value.trim() ? '' : 'Project name is required';
        console.log(`ShortFormOnboarding: validateField - projectName error:`, projectNameError);
        return projectNameError;
      case 'builderName':
        const builderNameError = value.trim() ? '' : 'Builder name is required';
        console.log(`ShortFormOnboarding: validateField - builderName error:`, builderNameError);
        return builderNameError;
      case 'reraNumber':
        const reraNumberError = value.trim() ? '' : 'RERA number is required';
        console.log(`ShortFormOnboarding: validateField - reraNumber error:`, reraNumberError);
        return reraNumberError;
      default:
        // All other fields are optional - no validation needed
        console.log(`ShortFormOnboarding: validateField - No validation for field:`, field);
        return '';
    }
  };

  const handleUnitConfigToggle = (unitType: string, enabled: boolean) => {
    const isVillaProject = mapProjectType(formData.projectType) === 'Villa';
    setFormData((prev: FormData) => {
      const newConfigs = { ...prev.unitConfigurations };
      if (enabled) {
        newConfigs[unitType] = {
          enabled: true,
          variants: newConfigs[unitType]?.variants || [
            isVillaProject
              ? { sizeSqFt: '', sizeSqYd: '', parkingSlots: '', facing: '', uds: '' }
              : { sizeRange: '', sizeUnit: 'Sq ft', parkingSlots: '', facing: '', uds: '' }
          ],
        };
      } else {
        delete newConfigs[unitType];
      }
      return { ...prev, unitConfigurations: newConfigs };
    });
  };

  const addUnitConfiguration = (unitType: string) => {
    const isVillaProject = mapProjectType(formData.projectType) === 'Villa';
    setFormData((prev: FormData) => ({
      ...prev,
      unitConfigurations: {
        ...prev.unitConfigurations,
        [unitType]: {
          ...prev.unitConfigurations[unitType],
          variants: [...(prev.unitConfigurations[unitType]?.variants || []),
          isVillaProject
            ? { sizeSqFt: '', sizeSqYd: '', parkingSlots: '', facing: '', uds: '' }
            : { sizeRange: '', sizeUnit: 'Sq ft', parkingSlots: '', facing: '', uds: '' }
          ]
        }
      }
    }));
  };

  const removeUnitConfiguration = (unitType: string, index: number) => {
    setFormData((prev: FormData) => ({
      ...prev,
      unitConfigurations: {
        ...prev.unitConfigurations,
        [unitType]: {
          ...prev.unitConfigurations[unitType],
          configurations: prev.unitConfigurations[unitType]?.variants.filter((_: UnitConfiguration, i: number) => i !== index) || []
        }
      }
    }));
  };

  const updateUnitConfiguration = (unitType: string, index: number, field: string, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      unitConfigurations: {
        ...prev.unitConfigurations,
        [unitType]: {
          ...prev.unitConfigurations[unitType],
          variants: prev.unitConfigurations[unitType]?.variants.map((config: UnitConfiguration, i: number) =>
            i === index ? { ...config, [field]: value } : config
          ) || []
        }
      }
    }));
  };

  const addPOC = () => {
    setFormData((prev: FormData) => ({
      ...prev,
      pocDetails: [...prev.pocDetails, { name: '', contact: '', role: '', cp: '' }]
    }));
  };

  const removePOC = (index: number) => {
    if (formData.pocDetails.length > 1) {
      setFormData((prev: FormData) => ({
        ...prev,
        pocDetails: prev.pocDetails.filter((_: any, i: number) => i !== index)
      }));
    }
  };

  const updatePOC = (index: number, field: 'name' | 'contact' | 'role' | 'cp', value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      pocDetails: prev.pocDetails.map((poc, i) =>
        i === index ? { ...poc, [field]: value } : poc
      )
    }));
  };

  /******************************************************************
   * 
   *  >>> CRITICAL CHANGE 1: Updating the API data conversion <<<
   * 
   *  This function now correctly maps the frontend state (formData)
   *  to the exact field names and data types your Mongoose schema expects.
   * 
   ******************************************************************/
  const convertToApiFormat = (data: FormData) => {
    // Debug UserEmail assignment
    console.log('ShortFormOnboarding: convertToApiFormat - userEmail prop:', userEmail);
    console.log('ShortFormOnboarding: convertToApiFormat - agentData?.email:', agentData?.email);
    console.log('ShortFormOnboarding: convertToApiFormat - agentData:', agentData);

    // Helper function to denormalize unit type format (remove space before BHK)
    const denormalizeUnitType = (type: string) => {
      if (!type) return '';
      // Convert '2 BHK' to '2BHK', '3.5 BHK' to '3.5BHK', etc.
      return type.replace(/(\d+\.?\d*)\s+BHK/i, '$1BHK');
    };

    // 1. Process Unit Configurations
    const configurations = [];
    const shortUnitConfigs = data.unitConfigurations || {};
    const isVillaProject = mapProjectType(data.projectType) === 'Villa';

    for (const unitType in shortUnitConfigs) {
      if (shortUnitConfigs[unitType]?.enabled) {
        const unitConfigs = shortUnitConfigs[unitType].variants || [];
        unitConfigs.forEach((config: UnitConfiguration) => {
          // For Villa projects, check sizeSqFt and sizeSqYd; for Apartments, check sizeRange
          const hasRequiredSize = isVillaProject
            ? (config.sizeSqFt?.trim() && config.sizeSqYd?.trim())
            : config.sizeRange?.trim();

          // Only require the size fields - parking slots can be empty (defaults to 1)
          if (hasRequiredSize) {
            const configObj: any = {
              type: denormalizeUnitType(unitType),
              No_of_car_Parking: config.parkingSlots?.trim() ? Number(config.parkingSlots) : 1
            };

            // Add Villa-specific fields or Apartment-specific fields
            if (isVillaProject) {
              configObj.sizeSqFt = Number(config.sizeSqFt);
              configObj.sizeSqYd = Number(config.sizeSqYd);
            } else {
              configObj.sizeRange = Number(config.sizeRange);
              configObj.sizeUnit = config.sizeUnit || 'Sq ft';
            }

            // Add facing if present
            if (config.facing) {
              configObj.facing = config.facing;
            }

            // Add UDS if present and is a valid number
            if (config.uds !== undefined && config.uds !== null && config.uds !== '') {
              const udsNum = Number(config.uds);
              if (!isNaN(udsNum)) {
                configObj.uds = udsNum;
              }
            }

            // Add config sold out status (default to 'active')
            configObj.configsoldoutstatus = config.configSoldOutStatus || 'active';

            configurations.push(configObj);
          }
        });
      }
    }

    // Add a default configuration if none were validly entered
    if (configurations.length === 0) {
      configurations.push({
        type: '2BHK',
        sizeRange: 1200,
        sizeUnit: 'Sq ft',
        No_of_car_Parking: 1,
      });
    }

    // 2. Assemble the final API payload using the correct field names
    const finalUserEmail = userEmail || agentData?.email;
    console.log('ShortFormOnboarding: convertToApiFormat - finalUserEmail:', finalUserEmail);

    const apiPayload = {
      // --- Project Information ---
      ProjectName: data.projectName.trim(),
      BuilderName: data.builderName.trim(),
      RERA_Number: data.reraNumber.trim(),
      Project_Type: mapProjectType(data.projectType),
      isavailable: data.isAvailable,
      Number_of_Floors: Number(data.numberOfFloors),
      Number_of_Flats_Per_Floor: data.numberOfFloors && data.totalUnits ? Math.ceil(Number(data.totalUnits) / Number(data.numberOfFloors)) : undefined,
      Possession_Date: data.possessionDate || null, // Convert empty string to null
      Open_Space: Number(data.openSpace),
      Carpet_area_Percentage: Number(data.carpetAreaPercent),
      Floor_to_Ceiling_Height: Number(data.ceilingHeight),

      // --- Charges & Preferences ---
      Ground_vehicle_Movement: data.groundVehicleMovement,
      Wow_Factor_Amenity: data.wowFactorAmenity.trim(),

      // --- Key Financials & Power ---
      Amount_For_Extra_Car_Parking: data.carParkingCost ? Number(data.carParkingCost) : undefined,
      BaseProjectPrice: undefined,
      PowerBackup: data.powerBackup.charAt(0).toUpperCase() + data.powerBackup.slice(1),

      // --- Commission & Payout ---
      Commission_percentage: data.commissionPercentage ? Number(data.commissionPercentage) : undefined,
      After_agreement_of_sale_what_is_payout_time_period: data.payoutPeriod ? Number(data.payoutPeriod) : undefined,

      // --- Unit Configurations ---
      configurations: configurations,

      // --- Point of Contact (filter once and reuse) ---
      ...(() => {
        const nonEmptyPOCs = data.pocDetails
          .filter(poc => poc.name.trim() || poc.contact.trim() || poc.role.trim())
          .map(poc => ({
            name: poc.name.trim(),
            contact: poc.contact.trim(),
            role: poc.role.trim(),
            cp: poc.cp || false
          }));

        const firstPOC = nonEmptyPOCs[0] || { name: '', contact: '', role: '', cp: false };

        return {
          pocDetails: nonEmptyPOCs,
          POC_Name: firstPOC.name || '',
          POC_Contact: firstPOC.contact && firstPOC.contact.length === 10 ? Number(firstPOC.contact) : undefined,
          POC_Role: firstPOC.role || '',
          POC_CP: firstPOC.cp || false
        };
      })(),

      // --- User Info ---
      UserEmail: finalUserEmail,

      // --- New mandatory/optional fields from short form ---
      CommunityType: mapCommunityType(data.communityType),
      Total_land_Area: data.totalLandArea || undefined,
      Number_of_Towers: data.numberOfTowers ? Number(data.numberOfTowers) : undefined,
      Total_Number_of_Units: data.totalUnits ? Number(data.totalUnits) : undefined,
      Price_per_sft: data.pricePerSft ? Number(data.pricePerSft) : undefined,
      ProjectBrochure: data.brochureLink || undefined,
      PriceSheetLink: data.priceSheetLink || undefined,
      ProjectLocation: data.projectLocation || undefined,
      City: data.city || undefined,
      State: data.state || undefined,

      // --- Additional fields (no defaults - only save what user enters) ---
      Construction_Status: undefined,
      No_of_Passenger_lift: undefined,
      No_of_Service_lift: undefined,
      Visitor_Parking: undefined,
      Construction_Material: undefined,
      Turnaround_Time_for_Lead_Acknowledgement: undefined,
      Is_there_validity_period_for_registered_lead: undefined,

      // --- Registration Modes (preserve existing if any) ---
      Accepted_Modes_of_Lead_Registration: data.acceptedModesOfLeadRegistration || {
        WhatsApp: {
          enabled: 'no',
          details: ''
        },
        Email: {
          enabled: 'no',
          details: ''
        },
        Web_Form: {
          enabled: 'no',
          details: ''
        },
        CRM_App_Access: {
          enabled: 'no',
          details: ''
        },
        During_Site_Visit: 'no'
      },
    };

    console.log('ShortFormOnboarding: convertToApiFormat - final apiPayload.UserEmail:', apiPayload.UserEmail);
    return apiPayload;
  };
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Only validate the three mandatory fields: projectName, builderName, reraNumber
    const requiredFields = [
      'projectName', 'builderName', 'reraNumber'
    ];

    console.log('ShortFormOnboarding: validateForm - formData:', formData);

    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof FormData] as string);
      if (error) {
        errors[field] = error;
        console.log(`ShortFormOnboarding: validateForm - Error for ${field}:`, error);
      }
    });

    // Unit configurations and POC details are now optional - no validation needed

    console.log('ShortFormOnboarding: validateForm - Final errors:', errors);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /******************************************************************
   * 
   *  >>> CRITICAL CHANGE 2: Updating the Submit Handler <<<
   * 
   *  This function now calls the correct API endpoint and sends the
   *  properly formatted data from `convertToApiFormat`.
   *  Error handling is enhanced to show backend validation messages.
   * 
   ******************************************************************/
  const handleSubmit = async () => {
    // Check if we have a valid user email
    const currentUserEmail = userEmail || agentData?.email;
    console.log('ShortFormOnboarding: handleSubmit - userEmail prop:', userEmail);
    console.log('ShortFormOnboarding: handleSubmit - agentData?.email:', agentData?.email);
    console.log('ShortFormOnboarding: handleSubmit - currentUserEmail:', currentUserEmail);
    console.log('ShortFormOnboarding: handleSubmit - agentData:', agentData);

    if (!currentUserEmail) {
      alert('User email is required. Please log in again.');
      return;
    }

    if (!validateForm()) {
      // Save as draft if validation fails
      try {
        await handleSaveDraft();
        alert('Some fields are invalid, but your progress has been saved as a draft.');
      } catch (e) {
        alert('Please fix the validation errors before submitting. (Draft could not be saved)');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const apiData = convertToApiFormat(formData);
      console.log('ShortFormOnboarding: Sending this payload to API:', JSON.stringify(apiData, null, 2));

      console.log('ShortFormOnboarding: API URL:', `${API_BASE_URL}/api/unverified/shortform`);
      console.log('ShortFormOnboarding: Using user email:', apiData.UserEmail);
      console.log('ShortFormOnboarding: UserEmail type:', typeof apiData.UserEmail);
      console.log('ShortFormOnboarding: UserEmail value:', apiData.UserEmail);

      // Make the API call to Supabase endpoint
      const response = await fetch(`${API_BASE_URL}/api/properties/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      console.log('ShortFormOnboarding: Response status:', response.status);
      console.log('ShortFormOnboarding: Response headers:', response.headers);

      const result = await response.json();
      console.log('ShortFormOnboarding: Response body:', result);

      if (response.ok) {
        let successMessage = 'Form submitted successfully!';

        if (result.unified_data_update) {
          if (result.unified_data_update.success) {
            if (result.unified_data_update.required) {
              successMessage += '\n\nCP status has been synced to verified properties database.';
            }
            console.log('ShortFormOnboarding: unified_data update:', result.unified_data_update);
          } else if (result.unified_data_update.message) {
            console.log('ShortFormOnboarding: unified_data status:', result.unified_data_update.message);
          }
        }

        alert(successMessage);
        if (onSubmitSuccess) {
          onSubmitSuccess(result.data);
        }
      } else {
        console.error('ShortFormOnboarding: API Error:', result);

        let errorMessage = result.message || `An error occurred (Status: ${response.status})`;

        if (result.unified_data_update && !result.unified_data_update.success) {
          console.error('ShortFormOnboarding: unified_data sync failed:', result.unified_data_update);
        }

        alert(`Submission Failed: ${errorMessage}`);

        if (result.errors) {
          console.error('ShortFormOnboarding: Detailed validation errors:', result.errors);
        }
      }
    } catch (error) {
      console.error('ShortFormOnboarding: Network or other error:', error);
      alert('Failed to submit form. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: string): string => {
    return validationErrors[fieldName] || '';
  };

  const isFieldValid = (fieldName: string): boolean => {
    return !validationErrors[fieldName];
  };

  const handleSaveDraft = async () => {
    // Check if we have a valid user email
    const currentUserEmail = userEmail || agentData?.email;
    if (!currentUserEmail) {
      alert('User email is required. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiData = convertToApiFormat(formData);
      // Add draft status
      (apiData as any).status = 'Unverified'; // This marks it as a draft

      console.log('Saving draft with payload:', JSON.stringify(apiData, null, 2));
      console.log('Using user email for draft:', apiData.UserEmail);

      const response = await fetch(`${API_BASE_URL}/api/properties/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (response.ok) {
        let successMessage = 'Draft saved successfully!';

        if (result.unified_data_update) {
          if (result.unified_data_update.success) {
            if (result.unified_data_update.required) {
              successMessage += '\n\nCP status has been synced to verified properties database.';
            }
            console.log('handleSaveDraft: unified_data update:', result.unified_data_update);
          } else if (result.unified_data_update.message) {
            console.log('handleSaveDraft: unified_data status:', result.unified_data_update.message);
          }
        }

        alert(successMessage);
        if (onDraftSaved) {
          onDraftSaved(result.data);
        }
      } else {
        console.error('API Error:', result);

        let errorMessage = result.message || `Failed to save draft (Status: ${response.status})`;

        if (result.rollback_needed && result.unified_data_update) {
          errorMessage += '\n\nNote: Your draft was saved but failed to sync to the verified database. Please try again.';
          console.error('handleSaveDraft: unified_data sync failed:', result.unified_data_update);
        }

        alert(`Draft Save Failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Network or other error:', error);
      alert('Failed to save draft. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // The JSX part remains largely the same.
  // ... [PASTED_JSX_OMITTED_FOR_BREVITY]
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isViewMode && onBackToDashboard && (
        <Button
          onClick={onBackToDashboard}
          variant="outline"
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
      )}
      <Card>
        <CardHeader><CardTitle>Project Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sf-projectName">Project Name *</Label>
            <Autocomplete
              value={formData.projectName}
              onValueChange={(value) => handleDeepChange({ projectName: value })}
              options={dropdownValues.projectNames}
              placeholder="e.g., Cloud 9"
              searchPlaceholder="Search project names..."
              emptyMessage="No projects found."
              disabled={isViewMode}
              error={!isFieldValid('projectName')}
            />
            {getFieldError('projectName') && (
              <p className="text-red-500 text-sm">{getFieldError('projectName')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-builderName">Builder Name *</Label>
            <Input disabled={isViewMode}
              id="sf-builderName"
              value={formData.builderName}
              onChange={(e) => handleDeepChange({ builderName: e.target.value })}
              placeholder="e.g., Urban Rise"
              className={!isFieldValid('builderName') ? 'border-red-500' : ''}
            />
            {getFieldError('builderName') && (
              <p className="text-red-500 text-sm">{getFieldError('builderName')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-reraNumber">RERA Number *</Label>
            <Autocomplete
              value={formData.reraNumber}
              onValueChange={(value) => handleDeepChange({ reraNumber: value })}
              options={dropdownValues.reraNumbers}
              placeholder="e.g., P024000000XX"
              searchPlaceholder="Search RERA numbers..."
              emptyMessage="No RERA numbers found."
              disabled={isViewMode}
              error={!isFieldValid('reraNumber')}
            />
            {getFieldError('reraNumber') && (
              <p className="text-red-500 text-sm">{getFieldError('reraNumber')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-projectType">Project Type</Label>
            <Select disabled={isViewMode} onValueChange={(v) => handleDeepChange({ projectType: v })} value={formData.projectType}>
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Villa Apartment">Villa Apartment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-isAvailable" className="flex items-center gap-2">
              Is Available
            </Label>
            <div className="flex items-center gap-3">
              <Switch
                id="sf-isAvailable"
                checked={formData.isAvailable === 'Active'}
                onCheckedChange={(checked) => handleDeepChange({ isAvailable: checked ? 'Active' : 'Inactive' })}
                disabled={isViewMode}
              />
              <span className="text-sm text-muted-foreground">
                {formData.isAvailable === 'Active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-numberOfFloors">Number of Floors</Label>
            <Input disabled={isViewMode}
              id="sf-numberOfFloors"
              type="text"
              inputMode="numeric"
              value={formData.numberOfFloors}
              onChange={(e) => handleDeepChange({ numberOfFloors: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 30"
              maxLength={3}
              className={!isFieldValid('numberOfFloors') ? 'border-red-500' : ''}
            />
            {getFieldError('numberOfFloors') && (
              <p className="text-red-500 text-sm">{getFieldError('numberOfFloors')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-communityType">Community Type</Label>
            <Select disabled={isViewMode} onValueChange={(v) => handleDeepChange({ communityType: v })} value={formData.communityType}>
              <SelectTrigger id="sf-communityType" className={!isFieldValid('communityType') ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select community type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gated Community">Gated</SelectItem>
                <SelectItem value="Semi-Gated Community">Semi-gated</SelectItem>
                <SelectItem value="Standalone">Standalone</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError('communityType') && (
              <p className="text-red-500 text-sm">{getFieldError('communityType')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-possessionDate">Possession Date</Label>
            {formData.possessionDate === 'RTM' || formData.possessionDate?.toUpperCase() === 'RTM' ? (
              <Input
                id="sf-possessionDate"
                type="text"
                value="RTM"
                className={`${!isFieldValid('possessionDate') ? 'border-red-500' : ''} bg-gray-50 font-medium`}
                disabled
                readOnly
              />
            ) : (
              <Input disabled={isViewMode}
                id="sf-possessionDate"
                type="date"
                value={formData.possessionDate}
                onChange={(e) => handleDeepChange({ possessionDate: e.target.value })}
                className={!isFieldValid('possessionDate') ? 'border-red-500' : ''}
              />
            )}
            {getFieldError('possessionDate') && (
              <p className="text-red-500 text-sm">{getFieldError('possessionDate')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-openSpace">Open Space (%)</Label>
            <Input disabled={isViewMode}
              id="sf-openSpace"
              type="text"
              inputMode="numeric"
              value={formData.openSpace}
              onChange={(e) => handleDeepChange({ openSpace: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 70"
              maxLength={3}
              className={!isFieldValid('openSpace') ? 'border-red-500' : ''}
            />
            {getFieldError('openSpace') && (
              <p className="text-red-500 text-sm">{getFieldError('openSpace')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-carpetAreaPercent">Carpet Area %</Label>
            <Input disabled={isViewMode}
              id="sf-carpetAreaPercent"
              type="text"
              inputMode="numeric"
              value={formData.carpetAreaPercent}
              onChange={(e) => handleDeepChange({ carpetAreaPercent: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 20"
              maxLength={3}
              className={!isFieldValid('carpetAreaPercent') ? 'border-red-500' : ''}
            />
            {getFieldError('carpetAreaPercent') && (
              <p className="text-red-500 text-sm">{getFieldError('carpetAreaPercent')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-ceilingHeight">Ceiling Height (ft)</Label>
            <Input disabled={isViewMode}
              id="sf-ceilingHeight"
              type="text"
              inputMode="numeric"
              value={formData.ceilingHeight}
              onChange={(e) => handleDeepChange({ ceilingHeight: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 10"
              maxLength={2}
              className={!isFieldValid('ceilingHeight') ? 'border-red-500' : ''}
            />
            {getFieldError('ceilingHeight') && (
              <p className="text-red-500 text-sm">{getFieldError('ceilingHeight')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-totalLandArea">Total Land Area (acres)</Label>
            <Input disabled={isViewMode}
              id="sf-totalLandArea"
              type="text"
              value={formData.totalLandArea}
              onChange={(e) => handleDeepChange({ totalLandArea: e.target.value })}
              placeholder="e.g., 5.5"
              className={!isFieldValid('totalLandArea') ? 'border-red-500' : ''}
            />
            {getFieldError('totalLandArea') && (
              <p className="text-red-500 text-sm">{getFieldError('totalLandArea')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-numberOfTowers">Number of Towers</Label>
            <Input disabled={isViewMode}
              id="sf-numberOfTowers"
              type="text"
              inputMode="numeric"
              value={formData.numberOfTowers}
              onChange={(e) => handleDeepChange({ numberOfTowers: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 3"
              maxLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-totalUnits">Total Units</Label>
            <Input disabled={isViewMode}
              id="sf-totalUnits"
              type="text"
              inputMode="numeric"
              value={formData.totalUnits}
              onChange={(e) => handleDeepChange({ totalUnits: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 500"
              maxLength={5}
              className={!isFieldValid('totalUnits') ? 'border-red-500' : ''}
            />
            {getFieldError('totalUnits') && (
              <p className="text-red-500 text-sm">{getFieldError('totalUnits')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-brochureLink">Brochure Link</Label>
            <Input disabled={isViewMode}
              id="sf-brochureLink"
              type="url"
              value={formData.brochureLink}
              onChange={(e) => handleDeepChange({ brochureLink: e.target.value })}
              placeholder="https://example.com/brochure.pdf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-priceSheetLink">Price Sheet Link</Label>
            <Input disabled={isViewMode}
              id="sf-priceSheetLink"
              type="url"
              value={formData.priceSheetLink}
              onChange={(e) => handleDeepChange({ priceSheetLink: e.target.value })}
              placeholder="https://example.com/pricesheet.pdf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-projectLocation">Project Location</Label>
            <Input disabled={isViewMode}
              id="sf-projectLocation"
              type="text"
              value={formData.projectLocation}
              onChange={(e) => handleDeepChange({ projectLocation: e.target.value })}
              placeholder="e.g., Whitefield, Bangalore"
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Autocomplete
              options={dropdownValues.cities}
              value={formData.city}
              onValueChange={(value) => handleDeepChange({ city: value })}
              placeholder="Select or type city"
              searchPlaceholder="Search cities..."
              emptyMessage="No cities found."
              disabled={isViewMode}
            />
          </div>
          <div className="space-y-2">
            <Label>State</Label>
            <Autocomplete
              options={dropdownValues.states}
              value={formData.state}
              onValueChange={(value) => handleDeepChange({ state: value })}
              placeholder="Select or type state"
              searchPlaceholder="Search states..."
              emptyMessage="No states found."
              disabled={isViewMode}
            />
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader><CardTitle>Key Financials & Power</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sf-pricePerSft">Price per Sft (₹)</Label>
            <Input disabled={isViewMode}
              id="sf-pricePerSft"
              type="text"
              inputMode="numeric"
              value={formData.pricePerSft}
              onChange={(e) => handleDeepChange({ pricePerSft: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 5000"
              maxLength={6}
              className={!isFieldValid('pricePerSft') ? 'border-red-500' : ''}
            />
            {getFieldError('pricePerSft') && (
              <p className="text-red-500 text-sm">{getFieldError('pricePerSft')}</p>
            )}
            <p className="text-xs text-gray-500">Range: ₹100 - ₹100,000 per sqft</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-carParkingCost">Amount for Extra Car Parking (₹)</Label>
            <Input disabled={isViewMode}
              id="sf-carParkingCost"
              type="text"
              inputMode="numeric"
              value={formData.carParkingCost}
              onChange={(e) => handleDeepChange({ carParkingCost: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 250000"
              maxLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-powerBackup">Power Backup</Label>
            <Select disabled={isViewMode} onValueChange={(v) => handleDeepChange({ powerBackup: v })} value={formData.powerBackup}>
              <SelectTrigger id="sf-powerBackup" className={!isFieldValid('powerBackup') ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select power backup type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full">Full</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError('powerBackup') && (
              <p className="text-red-500 text-sm">{getFieldError('powerBackup')}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-groundVehicleMovement">Ground Vehicle Movement</Label>
            <Select disabled={isViewMode} onValueChange={(v) => handleDeepChange({ groundVehicleMovement: v })} value={formData.groundVehicleMovement}>
              <SelectTrigger id="sf-groundVehicleMovement">
                <SelectValue placeholder="Select vehicle movement option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-commissionPercentage">Commission Percentage (%)</Label>
            <Input disabled={isViewMode}
              id="sf-commissionPercentage"
              type="text"
              inputMode="numeric"
              value={formData.commissionPercentage}
              onChange={(e) => handleDeepChange({ commissionPercentage: e.target.value.replace(/[^0-9.]/g, '') })}
              placeholder="e.g., 2.5"
              maxLength={5}
            />
            <p className="text-xs text-gray-500">Range: 0-100%</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sf-payoutPeriod">Payout Period (Days)</Label>
            <Input disabled={isViewMode}
              id="sf-payoutPeriod"
              type="text"
              inputMode="numeric"
              value={formData.payoutPeriod}
              onChange={(e) => handleDeepChange({ payoutPeriod: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="e.g., 30"
              maxLength={3}
            />
            <p className="text-xs text-gray-500">Range: 1-365 days</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Unit Configurations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {getFieldError('unitConfigurations') && (
            <p className="text-red-500 text-sm">{getFieldError('unitConfigurations')}</p>
          )}
          {unitTypes.map((unitType) => (
            <div key={unitType} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id={`unit-${unitType}`}
                  checked={formData.unitConfigurations[unitType]?.enabled || false}
                  onCheckedChange={(c) => handleUnitConfigToggle(unitType, c as boolean)}
                />
                <Label htmlFor={`unit-${unitType}`} className="font-medium">{unitType}</Label>
              </div>
              {formData.unitConfigurations[unitType]?.enabled && (
                <div>
                  <Label className="font-semibold">Unit Configurations</Label>
                  <div className="space-y-3 mt-3">
                    {(formData.unitConfigurations[unitType]?.variants || []).map((config: UnitConfiguration, i: number) => {
                      const isVillaProject = mapProjectType(formData.projectType) === 'Villa';
                      return (
                        <div key={i} className="border rounded-lg p-4 space-y-3">
                          {isVillaProject ? (
                            // Villa Project Layout: Separate Sq ft and Sq Yd fields
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`sizeSqFt-${unitType}-${i}`}>Size (Sq ft)</Label>
                                <Input disabled={isViewMode}
                                  id={`sizeSqFt-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.sizeSqFt || ''}
                                  placeholder="e.g., 1200"
                                  maxLength={5}
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'sizeSqFt', e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <p className="text-xs text-gray-500">Min: 100, Max: 10,000</p>
                                {config.sizeSqFt && parseInt(config.sizeSqFt) < 100 && (
                                  <p className="text-red-500 text-xs">Size must be at least 100</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`sizeSqYd-${unitType}-${i}`}>Size (Sq Yd)</Label>
                                <Input disabled={isViewMode}
                                  id={`sizeSqYd-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.sizeSqYd || ''}
                                  placeholder="e.g., 133"
                                  maxLength={5}
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'sizeSqYd', e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <p className="text-xs text-gray-500">Min: 10, Max: 2,000</p>
                                {config.sizeSqYd && parseInt(config.sizeSqYd) < 10 && (
                                  <p className="text-red-500 text-xs">Size must be at least 10</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`parkingSlots-${unitType}-${i}`}>Car Parking</Label>
                                <Input disabled={isViewMode}
                                  id={`parkingSlots-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.parkingSlots}
                                  placeholder="e.g., 1"
                                  maxLength={2}
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'parkingSlots', e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <p className="text-xs text-gray-500">Range: 1-10</p>
                                {config.parkingSlots && (parseInt(config.parkingSlots) < 1 || parseInt(config.parkingSlots) > 10) && (
                                  <p className="text-red-500 text-xs">Must be between 1 and 10</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`facing-${unitType}-${i}`}>Facing</Label>
                                <Select
                                  value={config.facing || ''}
                                  onValueChange={(value) => updateUnitConfiguration(unitType, i, 'facing', value)}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger id={`facing-${unitType}-${i}`}>
                                    <SelectValue placeholder="Select facing" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`uds-${unitType}-${i}`}>UDS</Label>
                                <Input disabled={isViewMode}
                                  id={`uds-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.uds || ''}
                                  placeholder="e.g., 500"
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'uds', e.target.value.replace(/[^0-9.]/g, ''))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`configSoldOutStatus-villa-${unitType}-${i}`} className="flex items-center gap-2">
                                  Config Available
                                </Label>
                                <div className="flex items-center gap-3">
                                  <Switch
                                    id={`configSoldOutStatus-villa-${unitType}-${i}`}
                                    checked={(config.configSoldOutStatus || 'active') === 'active'}
                                    onCheckedChange={(checked) => updateUnitConfiguration(unitType, i, 'configSoldOutStatus', checked ? 'active' : 'soldout')}
                                    disabled={isViewMode}
                                  />
                                  <span className="text-sm text-muted-foreground">
                                    {(config.configSoldOutStatus || 'active') === 'active' ? 'Active' : 'Sold Out'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Apartment Project Layout: Size Range and Size Unit fields
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                              <div className="space-y-2">
                                <Label htmlFor={`sizeRange-${unitType}-${i}`}>Size Range</Label>
                                <Input disabled={isViewMode}
                                  id={`sizeRange-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.sizeRange || ''}
                                  placeholder="e.g., 1200"
                                  maxLength={5}
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'sizeRange', e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <p className="text-xs text-gray-500">Min: 100, Max: 10,000</p>
                                {config.sizeRange && parseInt(config.sizeRange) < 100 && (
                                  <p className="text-red-500 text-xs">Size must be at least 100</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`sizeUnit-${unitType}-${i}`}>Size Unit</Label>
                                <Select
                                  value={config.sizeUnit || 'Sq ft'}
                                  onValueChange={(value) => updateUnitConfiguration(unitType, i, 'sizeUnit', value)}
                                >
                                  <SelectTrigger id={`sizeUnit-${unitType}-${i}`}>
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Sq ft">Sq ft</SelectItem>
                                    <SelectItem value="Sq Yd">Sq Yd</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`parkingSlots-${unitType}-${i}`}>Car Parking</Label>
                                <Input disabled={isViewMode}
                                  id={`parkingSlots-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.parkingSlots}
                                  placeholder="e.g., 1"
                                  maxLength={2}
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'parkingSlots', e.target.value.replace(/[^0-9]/g, ''))}
                                />
                                <p className="text-xs text-gray-500">Range: 1-10</p>
                                {config.parkingSlots && (parseInt(config.parkingSlots) < 1 || parseInt(config.parkingSlots) > 10) && (
                                  <p className="text-red-500 text-xs">Must be between 1 and 10</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`facing-${unitType}-${i}`}>Facing</Label>
                                <Select
                                  value={config.facing || ''}
                                  onValueChange={(value) => updateUnitConfiguration(unitType, i, 'facing', value)}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger id={`facing-${unitType}-${i}`}>
                                    <SelectValue placeholder="Select facing" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="North">North</SelectItem>
                                    <SelectItem value="East">East</SelectItem>
                                    <SelectItem value="West">West</SelectItem>
                                    <SelectItem value="South">South</SelectItem>
                                    <SelectItem value="North-East">North-East</SelectItem>
                                    <SelectItem value="North-West">North-West</SelectItem>
                                    <SelectItem value="South-East">South-East</SelectItem>
                                    <SelectItem value="South-West">South-West</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`uds-${unitType}-${i}`}>UDS</Label>
                                <Input disabled={isViewMode}
                                  id={`uds-${unitType}-${i}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={config.uds || ''}
                                  placeholder="e.g., 500"
                                  onChange={(e) => updateUnitConfiguration(unitType, i, 'uds', e.target.value.replace(/[^0-9.]/g, ''))}
                                />
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor={`configSoldOutStatus-${unitType}-${i}`} className="flex items-center gap-2">
                              Config Available
                            </Label>
                            <div className="flex items-center gap-3">
                              <Switch
                                id={`configSoldOutStatus-${unitType}-${i}`}
                                checked={(config.configSoldOutStatus || 'active') === 'active'}
                                onCheckedChange={(checked) => updateUnitConfiguration(unitType, i, 'configSoldOutStatus', checked ? 'active' : 'soldout')}
                                disabled={isViewMode}
                              />
                              <span className="text-sm text-muted-foreground">
                                {(config.configSoldOutStatus || 'active') === 'active' ? 'Active' : 'Sold Out'}
                              </span>
                            </div>
                          </div>
                          {(formData.unitConfigurations[unitType]?.variants.length || 0) > 1 && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeUnitConfiguration(unitType, i)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addUnitConfiguration(unitType)}
                      className="w-full flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Configuration
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Point of Contact (POC) Information</CardTitle>
          {!isViewMode && (
            <Button type="button" onClick={addPOC} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.pocDetails.map((poc, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">POC {index + 1}</h4>
                {!isViewMode && formData.pocDetails.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removePOC(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`pocName-${index}`}>POC Name</Label>
                  <Input
                    id={`pocName-${index}`}
                    placeholder="POC Name"
                    value={poc.name}
                    onChange={(e) => updatePOC(index, 'name', e.target.value)}
                    className={validationErrors[`pocDetails.${index}.name`] ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {validationErrors[`pocDetails.${index}.name`] && (
                    <p className="text-red-500 text-xs">{validationErrors[`pocDetails.${index}.name`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pocContact-${index}`}>POC Contact</Label>
                  <Input
                    id={`pocContact-${index}`}
                    type="tel"
                    placeholder="POC Contact"
                    value={poc.contact}
                    onChange={(e) => updatePOC(index, 'contact', e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={10}
                    className={validationErrors[`pocDetails.${index}.contact`] ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {validationErrors[`pocDetails.${index}.contact`] && (
                    <p className="text-red-500 text-xs">{validationErrors[`pocDetails.${index}.contact`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pocRole-${index}`}>POC Role</Label>
                  <Input
                    id={`pocRole-${index}`}
                    placeholder="POC Role"
                    value={poc.role}
                    onChange={(e) => updatePOC(index, 'role', e.target.value)}
                    className={validationErrors[`pocDetails.${index}.role`] ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {validationErrors[`pocDetails.${index}.role`] && (
                    <p className="text-red-500 text-xs">{validationErrors[`pocDetails.${index}.role`]}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor={`pocCP-${index}`}>CP Status</Label>
                <Select
                  value={poc.cp || ''}
                  onValueChange={(value) => updatePOC(index, 'cp', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger id={`pocCP-${index}`} className={validationErrors[`pocDetails.${index}.cp`] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select CP status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accepting">Accepting</SelectItem>
                    <SelectItem value="On-boarded">On-boarded</SelectItem>
                    <SelectItem value="Not-accepted">Not-accepted</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors[`pocDetails.${index}.cp`] && (
                  <p className="text-red-500 text-xs">{validationErrors[`pocDetails.${index}.cp`]}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {!isViewMode && (
        <div className="flex justify-center gap-4 pt-6">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Short Form'}
          </Button>
        </div>
      )}
    </div>
  );
};