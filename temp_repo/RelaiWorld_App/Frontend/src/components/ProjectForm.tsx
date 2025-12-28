import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectBasics } from '@/components/forms/ProjectBasics';
import { ConstructionSpecs } from '@/components/forms/ConstructionSpecs';
import { UnitConfigurations } from '@/components/forms/UnitConfigurations';
import { BuilderReputation } from '@/components/forms/BuilderReputation';
import { FinancialCompliance } from '@/components/forms/FinancialCompliance';
import { SecondaryDetails } from '@/components/forms/SecondaryDetails';
import { toast } from '@/components/ui/use-toast';
import { API_BASE_URL } from '@/lib/api';
import { yyyymmddToDDMMYYYY, parseDDMMYYYY, formatDateDDMMYYYY } from '@/lib/utils';

interface FormData {
  basics?: any;
  construction?: any;
  units?: any;
  builder?: any;
  financial?: any;
  secondary?: any;
}

interface ProjectFormProps {
  initialData?: any;
  onSubmit?: (data: FormData) => void;
  isDraftMode?: boolean;
  reraNumber?: string; // Add RERA number for API calls
  agentData?: any;
  isViewMode?: boolean;
}

  // Normalize backend property data to frontend form structure
// Export this function so it can be reused in other components
export const normalizePropertyData = (property: any): FormData => {
  console.log('🔍 normalizePropertyData - Input property:', property);
  console.log('🔍 normalizePropertyData - Property keys:', Object.keys(property || {}));
    // Helper to format dates from various formats to YYYY-MM-DD
    const formatDate = (dateStr: string | undefined) => {
      if (!dateStr) return '';

      // Handle special values like "RTM" (Ready to Move)
      if (dateStr === 'RTM' || dateStr.toUpperCase() === 'RTM') {
        return 'RTM';
      }

      // Handle DD/MM/YY or DD/MM/YYYY format (common in India)
      // Checks for d/m/y format where separators are / or -
      const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
      const match = dateStr.match(dmyRegex);

      if (match) {
        let [_, day, month, year] = match;

        // Handle 2-digit year
        if (year.length === 2) {
          year = '20' + year;
        }

        // Pad month and day
        month = month.padStart(2, '0');
        day = day.padStart(2, '0');

        return `${year}-${month}-${day}`;
      }

      try {
        const date = new Date(dateStr);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return dateStr; // Return original value if not a valid date
        }

        // Use local date components to avoid timezone shifts (which toISOString() does)
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');

        return `${y}-${m}-${d}`;
      } catch {
        return dateStr; // Return original value if parsing fails
      }
    };

    // Helper to clean number strings (remove %, sq ft, commas, etc)
    const cleanNumber = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Extract the first valid number sequence (supports decimals)
      const match = str.match(/-?\d+(\.\d+)?/);
      return match ? match[0] : str;
    };

    // Helper to safely get property value with case-insensitive key lookup fallback
    const getProp = (obj: any, keys: string[]) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) return obj[key];
        // optional: check lowercase version of key in obj keys if strict match fails? 
        // For now, explicit list is safer and sufficient.
      }
      return '';
    };

    // Helper to map backend enum values to frontend values
    const mapProjectTypeToFrontend = (backendType: string) => {
      if (!backendType) return '';
      switch (backendType) {
        case 'Villa': return 'Villa';
        case 'Apartment': return 'Apartment';
        case 'Villa Apartment': return 'Villa Apartment';
        default: return 'Apartment';
      }
    };

    const mapCommunityTypeToFrontend = (backendType: string) => {
      if (!backendType) return '';
      const type = backendType.toLowerCase();
      // Match "Gated" or "Gated Community" -> "Gated Community"
      if (type === 'gated' || type === 'gated community') return 'Gated Community';
      if (type.includes('semi')) return 'Semi-Gated Community';
      if (type.includes('stand')) return 'Standalone';
      return 'Gated Community';
    };

    const mapConstructionStatusToFrontend = (backendStatus: string) => {
      if (!backendStatus) return 'Under Construction';
      const statusTrimmed = backendStatus.trim();
      const statusLower = statusTrimmed.toLowerCase();
      
      // Map database values to frontend values
      // New values: "Under Construction", "About to RTM", "RTM"
      if (statusTrimmed === 'RTM' || statusLower === 'rtm' ||
          statusLower === 'ready to move in' || statusLower === 'ready to move' || 
          statusLower === 'completed' || statusLower === 'ready') {
        return 'RTM';
      } else if (statusTrimmed === 'About to RTM' || statusLower === 'about to rtm') {
        return 'About to RTM';
      } else if (statusTrimmed === 'Under Construction' || statusLower === 'under construction' ||
                 statusLower === 'ongoing' || statusLower === 'on-going') {
        // Map old "Ongoing" to "Under Construction" for backward compatibility
        return 'Under Construction';
      } else if (statusLower === 'not started' || statusLower === 'planning' || statusLower === 'planning phase') {
        // Map "Not Started" to "Under Construction" (closest match)
        return 'Under Construction';
      }
      
      // Default to Under Construction
      return 'Under Construction';
    };

    const mapConstructionMaterialToFrontend = (backendMaterial: string) => {
      if (!backendMaterial) return '';
      // Database enum values match frontend values, but handle legacy values for backward compatibility
      switch (backendMaterial) {
        case 'Red Bricks': return 'Red Bricks';
        case 'Cement Bricks': return 'Cement Bricks';
        case 'Concrete': return 'Concrete';
        // Legacy mappings for backward compatibility
        case 'Brick':
        case 'brick':
          return 'Red Bricks';
        case 'Cement Brick':
        case 'Cement':
        case 'cement brick':
        case 'cement':
          return 'Cement Bricks';
        case 'RCC':
        case 'rcc':
          return 'Concrete';
        default: return 'Concrete';
      }
    };

    // Map backend configurations array to unitTypes structure
    const mapConfigurationsToUnitTypes = (configurations: any[]) => {
      if (!configurations || configurations.length === 0) {
        return { configurations: [] };
      }

      const unitTypes: any = {};

      // Helper function to normalize unit type format (add space before BHK)
      const normalizeUnitType = (type: string) => {
        if (!type) return '';
        // Convert '2BHK' to '2 BHK', '3.5BHK' to '3.5 BHK', etc.
        return type.replace(/(\d+\.?\d*)BHK/i, '$1 BHK');
      };

      configurations.forEach((config: any) => {
        const rawUnitType = config.type || '';
        if (!rawUnitType) return;

        // Normalize the unit type to match frontend format (with space)
        const unitType = normalizeUnitType(rawUnitType);

        if (!unitTypes[unitType]) {
          unitTypes[unitType] = {
            enabled: true,
            variants: []
          };
        }

        // Determine if this is a Villa or Apartment variant
        const isVilla = config.sizeSqFt || config.sizeSqYd;

        // Handle UDS - check multiple possible field names and handle 0 values
        let udsValue = '';
        if (config.uds !== undefined && config.uds !== null) {
          udsValue = String(config.uds);
          console.log(`mapConfigurationsToUnitTypes: Found uds=${config.uds} (type: ${typeof config.uds}), converted to "${udsValue}"`);
        } else if (config.UDS !== undefined && config.UDS !== null) {
          udsValue = String(config.UDS);
          console.log(`mapConfigurationsToUnitTypes: Found UDS=${config.UDS} (type: ${typeof config.UDS}), converted to "${udsValue}"`);
        } else {
          console.log(`mapConfigurationsToUnitTypes: No UDS found in config:`, config);
        }

        const variant: any = {
          parkingSlots: config.No_of_car_Parking || '',
          facing: config.facing || '',
          uds: udsValue,
          configSoldOutStatus: config.configSoldOutStatus || config.configsoldoutstatus || 'active'
        };

        if (isVilla) {
          variant.sizeSqFt = config.sizeSqFt || '';
          variant.sizeSqYd = config.sizeSqYd || '';
        } else {
          variant.size = config.sizeRange || '';
          variant.sizeUnit = config.sizeUnit || 'Sq ft';
        }

        unitTypes[unitType].variants.push(variant);
      });

      return { unitTypes, configurations };
    };

    // Map backend registration modes to frontend structure
    const mapRegistrationModes = (acceptedModes: any) => {
      if (!acceptedModes) {
        return {
          whatsappRegistration: 'no',
          emailRegistration: 'no',
          webFormRegistration: 'no',
          crmAppRegistration: 'no',
          duringSiteVisitRegistration: 'no',
          whatsappRegistrationDetails: '',
          emailRegistrationDetails: '',
          webFormRegistrationDetails: '',
          crmAppRegistrationDetails: ''
        };
      }

      // Handle array format (e.g., [{WhatsApp: {...}, Email: {...}}])
      let modes = acceptedModes;
      if (Array.isArray(acceptedModes) && acceptedModes.length > 0) {
        modes = acceptedModes[0];
      }

      return {
        whatsappRegistration: modes.WhatsApp?.enabled || 'no',
        whatsappRegistrationDetails: modes.WhatsApp?.details || '',
        emailRegistration: modes.Email?.enabled || 'no',
        emailRegistrationDetails: modes.Email?.details || '',
        webFormRegistration: modes.Web_Form?.enabled || 'no',
        webFormRegistrationDetails: modes.Web_Form?.details || '',
        crmAppRegistration: modes.CRM_App_Access?.enabled || 'no',
        crmAppRegistrationDetails: modes.CRM_App_Access?.details || '',
        duringSiteVisitRegistration: modes.During_Site_Visit || 'no'
      };
    };

    // Map backend POC data to frontend structure
    const mapPOCDetails = (property: any) => {
      // If pocDetails array exists, use it
      if (property.pocDetails && Array.isArray(property.pocDetails) && property.pocDetails.length > 0) {
        // Migrate old boolean CP values to new string format
        return property.pocDetails.map((poc: any) => {
          let pocCP = poc.pocCP || '';
          // Migrate old boolean values
          if (pocCP === true || pocCP === 'true') {
            pocCP = 'Accepting';
          } else if (pocCP === false || pocCP === 'false' || pocCP === '') {
            pocCP = '';
          }
          // Ensure it's one of the valid values
          if (pocCP && !['Accepting', 'On-boarded', 'Not-accepted'].includes(pocCP)) {
            pocCP = '';
          }
          return { ...poc, pocCP };
        });
      }

      // Check if person_to_confirm_registration exists (can be array or object)
      if (property.person_to_confirm_registration || property.Person_to_Confirm_Registration) {
        const pocData = property.Person_to_Confirm_Registration || property.person_to_confirm_registration;
        
        // Handle array format (e.g., [{name: "...", contact: ...}])
        if (Array.isArray(pocData) && pocData.length > 0) {
          return pocData.map((poc: any) => {
            let pocCP = property.POC_CP || property.cp || '';
            if (pocCP === true || pocCP === 'true') {
              pocCP = 'Accepting';
            } else if (pocCP === false || pocCP === 'false') {
              pocCP = '';
            }
            return {
              pocName: poc.name || '',
              pocContact: poc.contact || '',
              pocRole: property.POC_Role || '',
              pocCP: pocCP
            };
          });
        }
        
        // Handle object format
        if (pocData && typeof pocData === 'object' && !Array.isArray(pocData)) {
          const poc = pocData;
        if (poc.name || poc.contact) {
          // Migrate old boolean CP to string format
          let pocCP = property.POC_CP || property.cp || '';
          if (pocCP === true || pocCP === 'true') {
            pocCP = 'Accepting';
          } else if (pocCP === false || pocCP === 'false') {
            pocCP = '';
          }
          return [{
            pocName: poc.name || '',
            pocContact: poc.contact || '',
            pocRole: property.POC_Role || '',
            pocCP: pocCP
          }];
          }
        }
      }

      // Otherwise, check if individual POC fields exist (legacy format)
      if (property.POC_Name || property.POC_Contact || property.POC_Role) {
        // Migrate old boolean CP to string format
        let pocCP = property.POC_CP || property.cp || '';
        if (pocCP === true || pocCP === 'true') {
          pocCP = 'Accepting';
        } else if (pocCP === false || pocCP === 'false') {
          pocCP = '';
        }
        return [{
          pocName: property.POC_Name || '',
          pocContact: property.POC_Contact || '',
          pocRole: property.POC_Role || '',
          pocCP: pocCP
        }];
      }

      return [];
    };

    const mapPowerBackup = (val: string) => {
      if (!val) return '';
      const v = val.toLowerCase();
      if (v.includes('full')) return 'Full';
      if (v.includes('partial')) return 'Partial';
      if (v.includes('none')) return 'None';
      return val;
    };

    const unitsData = mapConfigurationsToUnitTypes(property.configurations || []);
    const registrationModes = mapRegistrationModes(property.Accepted_Modes_of_Lead_Registration);

    // Check if RERA Number starts with 'PRM/KA/RERA/'
    // Handle both uppercase (RERA_Number) and lowercase (rera_number) field names
    const reraNumber = property.RERA_Number || property.rera_number || '';
    const isPRMKARERA = reraNumber.startsWith('PRM/KA/RERA/') || false;

    // Helper to convert acres back to sqmt (for loading old data)
    const acresToSqmt = (acres: number | string): number => {
      const numValue = typeof acres === 'string' ? parseFloat(acres) : acres;
      if (isNaN(numValue) || numValue <= 0) return 0;
      return numValue * 4046.86; // 1 acre = 4046.86 square meters
    };

    // For PRM/KA/RERA/ projects, handle conversion when loading
    // Database stores acres, but form displays sqmt
    let totalLandAreaValue = property.Total_land_Area || '';
    let totalLandAreaSqmt = '';
    let openSpaceValue = cleanNumber(property.Open_Space);
    let openSpaceSqmt = '';
    
    if (isPRMKARERA && property.Total_land_Area) {
      const totalLandAreaNum = parseFloat(property.Total_land_Area);
      if (!isNaN(totalLandAreaNum)) {
        // Database stores acres, convert back to sqmt for display
        // If value is small (< 1000), it's likely in acres (saved data)
        if (totalLandAreaNum < 1000) {
          const sqmtValue = acresToSqmt(totalLandAreaNum);
          totalLandAreaSqmt = sqmtValue.toString();
          totalLandAreaValue = totalLandAreaNum.toFixed(4); // Keep acres for calculation
        } else {
          // Value is large, might be old sqmt data (shouldn't happen with new saves)
          // Convert to acres for consistency
          const acresValue = totalLandAreaNum / 4046.86;
          totalLandAreaSqmt = totalLandAreaNum.toString();
          totalLandAreaValue = acresValue.toFixed(4);
        }
      }
    }

    // For Open_Space, if it's a percentage (< 100), we can't convert back to sqmt
    // without knowing the total land area. So we'll keep it as percentage.
    // If it's a large number (> 100), it might be sqmt
    if (isPRMKARERA && property.Open_Space !== undefined && property.Open_Space !== null) {
      const openSpaceNum = parseFloat(property.Open_Space.toString());
      if (!isNaN(openSpaceNum)) {
        if (openSpaceNum > 100) {
          // Likely sqmt value - always set it for display
          openSpaceSqmt = openSpaceNum.toString();
          // Calculate percentage if we have total land area
          if (totalLandAreaSqmt) {
            const totalLandAreaSqmtNum = parseFloat(totalLandAreaSqmt);
            if (totalLandAreaSqmtNum > 0) {
              const percentage = (openSpaceNum / totalLandAreaSqmtNum) * 100;
              openSpaceValue = percentage.toFixed(2);
            }
          }
        } else {
          // Likely percentage (old data)
          openSpaceValue = openSpaceNum.toString();
          // Try to calculate sqmt from percentage if we have total land area
          if (totalLandAreaSqmt) {
            const totalLandAreaSqmtNum = parseFloat(totalLandAreaSqmt);
            if (totalLandAreaSqmtNum > 0) {
              const calculatedSqmt = (openSpaceNum / 100) * totalLandAreaSqmtNum;
              openSpaceSqmt = calculatedSqmt.toString();
            }
          }
          // If we can't calculate, leave openSpaceSqmt empty and let user re-enter
        }
      }
    }

    const result = {
      basics: {
        projectName: property.ProjectName || '',
        builderName: property.BuilderName || '',
        reraNumber: property.RERA_Number || property.rera_number || '',
        areaName: property.areaname || property.AreaName || property.areaName || '',
        projectType: mapProjectTypeToFrontend(property.property_type || property.Project_Type),
        communityType: mapCommunityTypeToFrontend(property.CommunityType),
        totalLandArea: totalLandAreaValue,
        totalLandAreaSqmt: totalLandAreaSqmt,
        numberOfTowers: property.Number_of_Towers || '',
        numberOfFloors: property.Number_of_Floors || '',
        flatsPerFloor: property.Number_of_Flats_Per_Floor || '',
        totalUnits: property.Total_Number_of_Units || '',
        // For launch date, convert to DD/MM/YYYY format for display (same as Possession Date)
        launchDate: (() => {
          // Check multiple possible field names: Project_Launch_Date, Launch_Date, project_launch_date, launch_date
          const dateStr = property.Project_Launch_Date || property.Launch_Date || property.project_launch_date || property.launch_date || '';
          
          if (!dateStr || dateStr.trim() === '') return '';
          
          // If already in DD/MM/YYYY format, return as is
          if (String(dateStr).match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            return dateStr;
          }
          
          // Handle timestamp format (e.g., "2025-12-08 00:00:00+00", "2025-12-08T00:00:00Z", or "2025-12-08T00:00:00+00:00")
          // Extract just the date part (YYYY-MM-DD) from timestamp
          let datePart = String(dateStr);
          if (datePart.includes(' ')) {
            // Format: "2025-12-08 00:00:00+00"
            datePart = datePart.split(' ')[0];
          } else if (datePart.includes('T')) {
            // Format: "2025-12-08T00:00:00Z" or "2025-12-08T00:00:00+00:00"
            datePart = datePart.split('T')[0];
          }
          
          // Also handle if there's a + or - timezone offset directly after the date
          if (datePart.includes('+') || datePart.includes('-')) {
            // Extract just the date part before the timezone
            const match = datePart.match(/^(\d{4}-\d{2}-\d{2})/);
            if (match) {
              datePart = match[1];
            }
          }
          
          // Convert from YYYY-MM-DD to DD/MM/YYYY
          try {
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Use the utility function to convert YYYY-MM-DD to DD/MM/YYYY
              const converted = yyyymmddToDDMMYYYY(datePart);
              if (converted && converted !== datePart) {
                return converted;
              }
            }
            // Try parsing as full date string (handles timestamps)
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const formatted = formatDateDDMMYYYY(date);
              if (formatted) {
                return formatted;
              }
            }
          } catch (e) {
            console.warn('Error parsing launch date:', dateStr, e);
          }
          
          // If all else fails, return the original string
          return dateStr;
        })(),
        // For possession date, convert to DD/MM/YYYY format for display (for all projects)
        possessionDate: (() => {
          const dateStr = property.Possession_Date || property.possession_date || '';
          
          // If date is null/empty and construction status is 'RTM' or 'Ready to Move in', return 'RTM'
          const constructionStatus = property.Construction_Status || property.construction_status || '';
          if ((!dateStr || dateStr === null || dateStr === '') && 
              (constructionStatus === 'RTM' || constructionStatus === 'Ready to Move in' || 
               constructionStatus.toLowerCase() === 'ready to move in')) {
            return 'RTM';
          }
          
          if (!dateStr || dateStr.trim() === '') return '';
          
          const dateStrUpper = String(dateStr).toUpperCase().trim();
          if (dateStrUpper === 'RTM') return 'RTM';
          
          // If already in DD/MM/YYYY format, return as is
          if (String(dateStr).match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            return dateStr;
          }
          
          // Handle timestamp format (e.g., "2026-11-25 00:00:00+00" or "2026-11-25T00:00:00Z")
          // Extract just the date part (YYYY-MM-DD) from timestamp
          let datePart = String(dateStr);
          if (datePart.includes(' ')) {
            // Format: "2026-11-25 00:00:00+00"
            datePart = datePart.split(' ')[0];
          } else if (datePart.includes('T')) {
            // Format: "2026-11-25T00:00:00Z"
            datePart = datePart.split('T')[0];
          }
          
          // Convert from YYYY-MM-DD to DD/MM/YYYY
          try {
            if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
              // Use the utility function to convert YYYY-MM-DD to DD/MM/YYYY
              const converted = yyyymmddToDDMMYYYY(datePart);
              if (converted && converted !== datePart) {
                return converted;
              }
            }
            // Try parsing as full date string (handles timestamps)
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const formatted = formatDateDDMMYYYY(date);
              if (formatted) {
                return formatted;
              }
            }
          } catch (e) {
            console.warn('Error parsing possession date:', dateStr, e);
          }
          
          // If all else fails, try to extract and format manually
          if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = datePart.split('-');
            return `${day}/${month}/${year}`;
          }
          
          return dateStr;
        })(),
        constructionStatus: mapConstructionStatusToFrontend(property.Construction_Status),
        openSpace: openSpaceValue,
        openSpaceSqmt: openSpaceSqmt,
        projectLocation: property.ProjectLocation || property.AreaName || '',
        buildingName: property.BuildingName || '',
        city: property.City || '',
        state: property.State || ''
      },
      construction: {
        priceSheetLink: property.pricesheet_link_1 || property.PriceSheetLink || property.Pricesheet_Link || '', // Added Pricesheet_Link
        brochureLink: property.ProjectBrochure || property.projectbrochure || '',
        // For PRM/KA/RERA/ projects, handle total buildup area conversion
        // Database stores sqft, but form displays sqmt
        ...(isPRMKARERA && (property.total_buildup_area || property.Total_Buildup_Area) ? (() => {
          const totalBuildupValue = property.total_buildup_area || property.Total_Buildup_Area || '';
          const totalBuildupNum = parseFloat(totalBuildupValue.toString().replace(/[^0-9.-]/g, ''));
          if (!isNaN(totalBuildupNum) && totalBuildupNum > 0) {
            // Database stores sqft, convert back to sqmt for display
            // 1 sqmt = 10.7639 sqft, so 1 sqft = 1/10.7639 sqmt
            const sqmtValue = totalBuildupNum / 10.7639;
            return { 
              totalBuildupArea: totalBuildupNum.toFixed(2), // Keep sqft for calculations
              totalBuildupAreaSqmt: sqmtValue.toString() // Convert to sqmt for display (keep as string for input field)
            };
          }
          return { totalBuildupArea: totalBuildupValue || '', totalBuildupAreaSqmt: '' };
        })() : { totalBuildupArea: property.total_buildup_area || property.Total_Buildup_Area || '', totalBuildupAreaSqmt: '' }),
        uds: property.uds || property.UDS || '',
        fsi: property.fsi || property.FSI || '',
        carpetAreaPercentage: cleanNumber(property.Carpet_area_Percentage),
        ceilingHeight: cleanNumber(property.Floor_to_Ceiling_Height),
        mainDoorHeight: getProp(property, ['main_door_height', 'Main_Door_Height']),
        pricePerSft: cleanNumber(property.Price_per_sft),
        powerBackup: mapPowerBackup(property.PowerBackup),
        passengerLifts: property.No_of_Passenger_lift || '',
        serviceLifts: property.No_of_Service_lift || '',
        visitorParking: (property.Visitor_Parking || '').toLowerCase(),
        groundVehicleMovement: (property.Ground_vehicle_Movement || '').toLowerCase(),
        constructionMaterial: mapConstructionMaterialToFrontend(property.Construction_Material),
        externalAmenities: property.External_Amenities || '',
        amenities: property.amenities || [],
        specifications: property.Specification || '',
        floorRiseCharges: property.Floor_Rise_Charges || property.floor_rise_charges || '',
        floorRiseAmountPerFloor: property.Floor_Rise_Amount_per_Floor || property.floor_rise_amount_per_floor || '',
        floorRiseApplicableAboveFloorNo: property.Floor_Rise_Applicable_Above_Floor_No || property.floor_rise_applicable_above_floor_no || '',
        facingCharges: property.Facing_Charges || property.facing_charges || '',
        preferentialLocationCharges: property.Preferential_Location_Charges || property.preferential_location_charges || '',
        preferentialLocationChargesConditions: property.Preferential_Location_Charges_Conditions || property.preferential_location_charges_conditions || ''
      },
      units: unitsData,
      builder: {
        builderAge: property.Builder_Age || property.builder_age || '',
        builderTotalProperties: property.Builder_Total_Properties || property.builder_total_properties || '',
        builderUpcomingProperties: property.Builder_Upcoming_Properties || property.builder_upcoming_properties || '',
        builderCompletedProperties: property.Builder_Completed_Properties || property.builder_completed_properties || '',
        builderOngoingProjects: property.Builder_Ongoing_Projects || property.builder_ongoing_projects || '',
        builderOriginCity: property.Builder_Origin_City || property.builder_origin_city || '',
        builderOperatingLocations: property.Builder_Operating_Locations || property.builder_operating_locations || []
      },
      financial: {
        baseProjectPrice: (() => {
          const value = getProp(property, ['BaseProjectPrice', 'Base Project Price', 'baseprojectprice']);
          console.log('🔍 Financial - baseProjectPrice:', value, '| property keys:', Object.keys(property).filter(k => k.toLowerCase().includes('base') && k.toLowerCase().includes('price')));
          // Handle 0 as a valid value - getProp returns '' if not found, so check for that
          return value !== '' ? value : '';
        })(),
        extraCarParkingAmount: (() => {
          const value = getProp(property, ['Amount_For_Extra_Car_Parking', 'Amount_For_Extra_Car_Parking']);
          console.log('🔍 Financial - extraCarParkingAmount:', value, '| raw property value:', property['Amount_For_Extra_Car_Parking']);
          // Handle 0 as a valid value - getProp returns '' if not found, so check for that
          return value !== '' ? value : '';
        })(),
        homeLoan: property.Home_Loan || property.Home_loan || '',
        homeLoanBanks: property.Available_Banks_for_Loan || property.available_banks_for_loan || [],
        previousComplaints: property.Previous_Complaints_on_Builder || property.previous_complaints_on_builder || 'no',
        complaintDetails: property.Complaint_Details || property.complaint_details || ''
      },
      secondary: {
        commissionPercentage: property.Commission_percentage || '',
        therePrice: property.What_is_there_Price || '',
        relaiPrice: property.What_is_Relai_Price || property.What_is_relai_price || property.What_is_relai_Price || '',
        payoutTimePeriod: property.After_agreement_of_sale_what_is_payout_time_period || '',
        leadRegistrationRequired: property.Is_Lead_Registration_Required_Before_Site_Visit || property.Is_lead_Registration_required_before_Site_visit || '',
        leadAcknowledgementTime: property.Turnaround_Time_for_Lead_Acknowledgement || '',
        validityPeriod: property.Is_There_Validity_Period_for_Registered_Lead || property.Is_there_validity_period_for_registered_lead || '',
        validityPeriodValue: property.Validity_Period_Value || property.validity_period_value || '',
        ...registrationModes,
        leadRegistrationNotes: property.Notes_Comments_on_Lead_Registration_Workflow || property.Notes_Comments_on_lead_registration_workflow || '',
        pocDetails: mapPOCDetails(property),
        projectBrochure: property.ProjectBrochure || '',
        contact: property.Contact || ''
      }
    };
    
    console.log('✅ normalizePropertyData - Normalized form data:', result);
    return result;
};

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  isDraftMode = false,
  reraNumber,
  agentData,
  isViewMode = false,
}) => {
  const [formData, setFormData] = useState<FormData>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [activeTab, setActiveTab] = useState<string>('basics');
  const navigate = useNavigate();

  // Update formData when initialData changes (e.g., when loading a draft)
  useEffect(() => {
    if (initialData) {
      console.log('ProjectForm: initialData changed, updating formData:', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  // Handle full property data fetched from ProjectBasics
  const handlePropertyFetched = (property: any) => {
    const normalizedData = normalizePropertyData(property);

    // Helper function to merge objects, preserving existing non-empty values
    const mergePreservingExisting = (existing: any, incoming: any) => {
      if (!existing) return incoming;
      if (!incoming) return existing;

      const merged = { ...existing };

      // Only update fields that are empty/null in the existing data
      Object.keys(incoming).forEach(key => {
        const existingValue = existing[key];
        const incomingValue = incoming[key];

        // Preserve existing value if it's not empty
        if (existingValue !== null && existingValue !== undefined && existingValue !== '') {
          merged[key] = existingValue;
        } else {
          merged[key] = incomingValue;
        }
      });

      return merged;
    };

    // Merge each section, preserving manual user edits
    setFormData(prev => ({
      basics: mergePreservingExisting(prev.basics, normalizedData.basics),
      construction: mergePreservingExisting(prev.construction, normalizedData.construction),
      units: normalizedData.units, // Units should be fully replaced as it's complex
      builder: mergePreservingExisting(prev.builder, normalizedData.builder),
      financial: mergePreservingExisting(prev.financial, normalizedData.financial),
      secondary: mergePreservingExisting(prev.secondary, normalizedData.secondary)
    }));

    // Clear validation errors for all populated fields
    setValidationErrors({
      basics: {},
      construction: {},
      units: {},
      builder: {},
      financial: {},
      secondary: {}
    });
  };

  const updateFormData = (section: keyof FormData, data: any) => {
    const newSectionData = {
      ...(formData[section] || {}),
      ...data,
    };

    if (section === 'units' && data.unitTypes) {
      const configurations = Object.entries(data.unitTypes)
        .filter(([, unitData]: [string, any]) => unitData.enabled && unitData.variants?.length > 0)
        .flatMap(([unitType, unitData]: [string, any]) =>
          (unitData.variants || []).map((variant: any) => {
            // Check if this is a Villa variant (has sizeSqFt/sizeSqYd) or Apartment variant (has size)
            const isVillaVariant = 'sizeSqFt' in variant || 'sizeSqYd' in variant;

            // Build configuration object based on project type
            const config: any = {
              type: unitType,
              No_of_car_Parking: variant.parkingSlots || '',
              configSoldOutStatus: variant.configSoldOutStatus || 'active'
            };

            // For Villa projects: include sizeSqFt, sizeSqYd, facing, and uds
            if (isVillaVariant) {
              config.sizeSqFt = variant.sizeSqFt || '';
              config.sizeSqYd = variant.sizeSqYd || '';
              config.facing = variant.facing || '';
              // Include UDS if it exists and is a valid number
              if (variant.uds !== undefined && variant.uds !== null && variant.uds !== '') {
                const udsNum = Number(variant.uds);
                if (!isNaN(udsNum)) {
                  config.uds = udsNum;
                }
              }
              // Explicitly set sizeUnit for Villa projects (backend expects it)
              config.sizeUnit = 'Sq ft';
            }
            // For Apartment projects: include sizeRange, sizeUnit, facing, and uds
            else {
              config.sizeRange = variant.size || '';
              config.sizeUnit = variant.sizeUnit || 'Sq ft';
              config.facing = variant.facing || '';
              // Include UDS if it exists and is a valid number
              if (variant.uds !== undefined && variant.uds !== null && variant.uds !== '') {
                const udsNum = Number(variant.uds);
                if (!isNaN(udsNum)) {
                  config.uds = udsNum;
                }
              }
            }

            return config;
          })
        );

      newSectionData.configurations = configurations;
    }

    setFormData((prev) => ({
      ...prev,
      [section]: newSectionData,
    }));

    // Clear validation error for the updated field
    if (validationErrors[section]) {
      const fieldName = Object.keys(data)[0];
      const newSectionErrors = { ...validationErrors[section] };
      delete newSectionErrors[fieldName];
      setValidationErrors((prev: any) => ({
        ...prev,
        [section]: newSectionErrors,
      }));
    }
  };

  // Convert form data to API format
  const convertToApiFormat = (formData: FormData) => {
    const basics = formData.basics || {};
    const construction = formData.construction || {};
    const units = formData.units || {};
    const builder = formData.builder || {};
    const financial = formData.financial || {};
    const secondary = formData.secondary || {};

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
        default:
          return 'Apartment';
      }
    };

    // Map CommunityType from frontend values to backend enum values
    const mapCommunityType = (communityType: string) => {
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

    // Map Construction_Status - Save exact frontend values: "Under Construction", "About to RTM", "RTM"
    // Note: Supabase enum must be updated to include these values (see update_construction_status_enum.sql)
    const mapConstructionStatus = (status: string) => {
      if (!status) return 'Under Construction';

      const statusTrimmed = status.trim();
      const statusLower = statusTrimmed.toLowerCase();
      
      // Save exact frontend values
      if (statusTrimmed === 'RTM' || statusLower === 'rtm') {
        return 'RTM';
      } else if (statusTrimmed === 'About to RTM' || statusLower === 'about to rtm') {
        return 'About to RTM';
      } else if (statusTrimmed === 'Under Construction' || statusLower === 'under construction') {
        return 'Under Construction';
      } else if (statusLower === 'not started' || statusLower === 'planning' || statusLower === 'planning phase') {
        return 'Not Started'; // Keep for backward compatibility
      } else if (statusLower === 'ongoing' || statusLower === 'on-going') {
        // Map old "Ongoing" to "Under Construction" for consistency
        return 'Under Construction';
      } else if (statusLower === 'ready to move in' || statusLower === 'ready to move' ||
                 statusLower === 'ready' || statusLower === 'completed') {
        // Map old "Ready to Move in" to "RTM" for consistency
        return 'RTM';
      }
      
      // Default to "Under Construction"
      return 'Under Construction';
    };

    // Map Construction_Material to backend enum values
    // Database enum: "Concrete", "Red Bricks", "Cement Bricks"
    const mapConstructionMaterial = (material: string) => {
      if (!material) return 'Concrete';

      // Direct match for database enum values
      if (material === 'Concrete' || material === 'Red Bricks' || material === 'Cement Bricks') {
        return material;
      }

      // Handle legacy and case variations
      switch (material.toLowerCase()) {
        case 'brick':
        case 'red bricks':
        case 'red brick':
          return 'Red Bricks';
        case 'cement brick':
        case 'cement bricks':
        case 'cement':
          return 'Cement Bricks';
        case 'concrete':
        case 'rcc':
          return 'Concrete';
        case 'steel':
        case 'steel frame':
        case 'wood':
        case 'timber':
          // Map unsupported materials to Concrete as fallback
          return 'Concrete';
        default:
          return 'Concrete';
      }
    };

    // Map External_Amenities to backend enum values
    const mapExternalAmenities = (amenities: string) => {
      if (!amenities) return '';

      // Convert to proper case and format
      const formatted = amenities
        .toLowerCase()
        .split(',')
        .map(item => item.trim())
        .map(item => {
          switch (item) {
            case 'clubhouse':
              return 'Clubhouse';
            case 'swimming pool':
            case 'pool':
              return 'Swimming Pool';
            case 'gym':
            case 'fitness center':
              return 'Gym';
            case 'kids play area':
            case 'playground':
            case 'play area':
              return 'Kids Play Area';
            case 'banquet hall':
            case 'banquet':
              return 'Banquet Hall';
            case 'guest rooms':
            case 'guest room':
              return 'Guest Rooms';
            case 'co working space':
            case 'coworking':
            case 'co-working':
              return 'Co working Space';
            case 'jogging track':
            case 'jogging':
              return 'Jogging Track';
            case 'sports facilities':
            case 'sports':
              return 'Sports Facilities';
            default:
              // For any other amenities, map to the closest match or skip
              return '';
          }
        })
        .filter(item => item !== '') // Remove empty items
        .join(', ');

      return formatted;
    };

    // Map unit types to match backend enum format
    const mapUnitType = (unitType: string) => {
      // Add space before BHK if missing
      if (unitType.includes('BHK') && !unitType.includes(' ')) {
        return unitType.replace('BHK', ' BHK');
      }
      return unitType;
    };

    // Check if RERA Number starts with 'PRM/KA/RERA/'
    const isPRMKARERA = basics.reraNumber?.startsWith('PRM/KA/RERA/') || false;

    // For PRM/KA/RERA/ projects:
    // - Total land area: Enter in sqmt → Convert to acres → Save as acres
    let totalLandAreaValue = basics.totalLandArea;
    if (isPRMKARERA) {
      if (basics.totalLandAreaSqmt) {
        // Extract numeric value from the sqmt input (remove any text like "sqmt")
        const sqmtValue = parseFloat(basics.totalLandAreaSqmt.toString().replace(/[^0-9.-]/g, ''));
        if (!isNaN(sqmtValue) && sqmtValue > 0) {
          // Convert sqmt to acres and save as acres
          const acresValue = sqmtValue / 4046.86;
          totalLandAreaValue = acresValue.toFixed(4);
        }
      } else if (basics.totalLandArea) {
        // If totalLandAreaSqmt is not set but totalLandArea is, check if it's already sqmt
        // (large number > 1000) or acres (small number < 1000)
        const numericValue = parseFloat(basics.totalLandArea.toString().replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericValue)) {
          if (numericValue > 1000) {
            // Already in sqmt, convert to acres
            const acresValue = numericValue / 4046.86;
            totalLandAreaValue = acresValue.toFixed(4);
          } else {
            // Already in acres, use as is
            totalLandAreaValue = numericValue.toString();
          }
        }
      }
    }

    // For PRM/KA/RERA/ projects, save percentage for Open_Space (not sqmt)
    // The percentage is already calculated and stored in basics.openSpace
    let openSpaceValue = basics.openSpace;
    if (isPRMKARERA) {
      // For PRM/KA/RERA/ projects, we always save the percentage
      // The percentage is calculated from openSpaceSqmt / totalLandAreaSqmt * 100
      // and stored in basics.openSpace
      if (basics.openSpace) {
        // Use the percentage value that's already calculated
        const percentageValue = parseFloat(basics.openSpace.toString().replace(/[^0-9.-]/g, ''));
        if (!isNaN(percentageValue) && percentageValue >= 0) {
          openSpaceValue = percentageValue;
        }
      } else if (basics.openSpaceSqmt && basics.totalLandAreaSqmt) {
        // If percentage is not set but we have both sqmt values, calculate it
        const openSpaceSqmtNum = parseFloat(basics.openSpaceSqmt.toString().replace(/[^0-9.-]/g, ''));
        const totalLandAreaSqmtNum = parseFloat(basics.totalLandAreaSqmt.toString().replace(/[^0-9.-]/g, ''));
        if (!isNaN(openSpaceSqmtNum) && !isNaN(totalLandAreaSqmtNum) && totalLandAreaSqmtNum > 0) {
          const percentage = (openSpaceSqmtNum / totalLandAreaSqmtNum) * 100;
          openSpaceValue = percentage;
        }
      }
    }

    return {
      // Project Basics
      ProjectName: basics.projectName,
      BuilderName: basics.builderName,
      RERA_Number: basics.reraNumber,
      areaname: basics.areaName,
      City: basics.city || '',
      State: basics.state || '',
      Project_Type: mapProjectType(basics.projectType),
      CommunityType: mapCommunityType(basics.communityType),
      Total_land_Area: totalLandAreaValue,
      Number_of_Towers: basics.numberOfTowers,
      Number_of_Floors: basics.numberOfFloors,
      Number_of_Flats_Per_Floor: basics.flatsPerFloor,
      Total_Number_of_Units: basics.totalUnits,
      // Convert DD/MM/YYYY to YYYY-MM-DD for database (same as Possession Date)
      Project_Launch_Date: (() => {
        const dateStr = basics.launchDate || '';
        if (!dateStr || dateStr.trim() === '') {
          return null;
        }
        
        // If already in DD/MM/YYYY format, convert to YYYY-MM-DD
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Parse directly from string to avoid timezone issues
          const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (match) {
            const [, day, month, year] = match;
            return `${year}-${month}-${day}`;
          }
        }
        
        // If already in YYYY-MM-DD format, return as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        
        // Try to parse as date and convert (using local date components to avoid timezone shifts)
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            // Use local date components instead of UTC to avoid timezone shifts
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch {}
        
        // If can't parse, return null to let backend handle it
        console.warn('Could not parse launch date:', dateStr);
        return null;
      })(),
      // Convert DD/MM/YYYY to YYYY-MM-DD for database (for all projects)
      Possession_Date: (() => {
        const dateStr = basics.possessionDate || '';
        if (!dateStr || dateStr.trim() === '') {
          return null;
        }
        
        const dateStrUpper = dateStr.toUpperCase().trim();
        if (dateStrUpper === 'RTM') {
          return 'RTM';
        }
        
        // If already in DD/MM/YYYY format, convert to YYYY-MM-DD
        if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
          // Parse directly from string to avoid timezone issues
          const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
          if (match) {
            const [, day, month, year] = match;
            return `${year}-${month}-${day}`;
          }
        }
        
        // If already in YYYY-MM-DD format, return as is
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        
        // Try to parse as date and convert (using local date components to avoid timezone shifts)
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            // Use local date components instead of UTC to avoid timezone shifts
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        } catch {}
        
        // If can't parse, return null to let backend handle it
        console.warn('Could not parse possession date:', dateStr);
        return null;
      })(),
      Construction_Status: mapConstructionStatus(basics.constructionStatus),
      Open_Space: openSpaceValue,
      ProjectLocation: basics.projectLocation,
      BuildingName: basics.buildingName,

      // Construction Specs
      pricesheet_link_1: construction.priceSheetLink, // Use pricesheet_link_1 for database field
      PriceSheetLink: construction.priceSheetLink, // Also send with capital P and S for backend compatibility
      // For PRM/KA/RERA/ projects: Enter in sqmt → Convert to sqft → Save as sqft
      total_buildup_area: (isPRMKARERA && construction.totalBuildupAreaSqmt) 
        ? (() => {
            const sqmtValue = parseFloat(construction.totalBuildupAreaSqmt.toString().replace(/[^0-9.-]/g, ''));
            if (!isNaN(sqmtValue) && sqmtValue > 0) {
              // Convert sqmt to sqft and save as sqft
              const sqftValue = sqmtValue * 10.7639;
              return sqftValue.toFixed(2);
            }
            return construction.totalBuildupArea;
          })()
        : construction.totalBuildupArea,
      uds: construction.uds,
      fsi: construction.fsi,
      Carpet_area_Percentage: construction.carpetAreaPercentage,
      Floor_to_Ceiling_Height: construction.ceilingHeight,
      main_door_height: construction.mainDoorHeight,
      Price_per_sft: construction.pricePerSft,
      PowerBackup: construction.powerBackup,
      No_of_Passenger_lift: construction.passengerLifts,
      No_of_Service_lift: construction.serviceLifts,
      Visitor_Parking: construction.visitorParking,
      Ground_vehicle_Movement: construction.groundVehicleMovement,
      Construction_Material: mapConstructionMaterial(construction.constructionMaterial),
      External_Amenities: mapExternalAmenities(construction.externalAmenities),
      Specification: construction.specifications,
      floor_rise_charges: construction.floorRiseCharges,
      floor_rise_amount_per_floor: construction.floorRiseAmountPerFloor,
      floor_rise_applicable_above_floor_no: construction.floorRiseApplicableAboveFloorNo,
      facing_charges: construction.facingCharges,
      preferential_location_charges: construction.preferentialLocationCharges,
      preferential_location_charges_conditions: construction.preferentialLocationChargesConditions,

      // Unit Configurations - map unit types to match backend enum format
      configurations: (units.configurations || []).map(config => ({
        ...config,
        type: mapUnitType(config.type),
        sizeUnit: config.sizeUnit || 'Sq ft',
        configsoldoutstatus: config.configSoldOutStatus || config.configsoldoutstatus || 'active'
      })),

      // Builder Reputation
      builder_age: builder.builderAge,
      builder_total_properties: builder.builderTotalProperties,
      builder_upcoming_properties: builder.builderUpcomingProperties,
      builder_completed_properties: builder.builderCompletedProperties,
      builder_ongoing_projects: builder.builderOngoingProjects,
      builder_origin_city: builder.builderOriginCity,
      builder_operating_locations: builder.builderOperatingLocations || [],

      // Financial & Compliance
      BaseProjectPrice: financial.baseProjectPrice,
      Amount_For_Extra_Car_Parking: financial.extraCarParkingAmount || 0,
      Home_loan: financial.homeLoan,
      available_banks_for_loan: financial.homeLoanBanks || [],
      previous_complaints_on_builder: financial.previousComplaints,
      complaint_details: financial.complaintDetails,

      // Commission & Payout
      Commission_percentage: secondary.commissionPercentage,
      What_is_there_Price: secondary.therePrice,
      What_is_relai_price: secondary.relaiPrice,
      After_agreement_of_sale_what_is_payout_time_period: secondary.payoutTimePeriod,

      // Lead Registration
      Is_lead_Registration_required_before_Site_visit: secondary.leadRegistrationRequired,
      Turnaround_Time_for_Lead_Acknowledgement: secondary.leadAcknowledgementTime,
      Is_there_validity_period_for_registered_lead: secondary.validityPeriod,
      validity_period_value: secondary.validityPeriodValue ? Number(secondary.validityPeriodValue) : undefined,
      person_to_confirm_registration: {
        name: secondary.pocDetails?.[0]?.pocName || '',
        contact: secondary.pocDetails?.[0]?.pocContact || '',
      },
      Accepted_Modes_of_Lead_Registration: {
        WhatsApp: {
          enabled: secondary.whatsappRegistration || 'no',
          details: secondary.whatsappRegistrationDetails || ''
        },
        Email: {
          enabled: secondary.emailRegistration || 'no',
          details: secondary.emailRegistrationDetails || ''
        },
        Web_Form: {
          enabled: secondary.webFormRegistration || 'no',
          details: secondary.webFormRegistrationDetails || ''
        },
        CRM_App_Access: {
          enabled: secondary.crmAppRegistration || 'no',
          details: secondary.crmAppRegistrationDetails || ''
        },
        During_Site_Visit: secondary.duringSiteVisitRegistration || 'no',
      },
      Notes_Comments_on_lead_registration_workflow: secondary.leadRegistrationNotes,

      // POC Information - use first POC from array
      POC_Name: secondary.pocDetails?.[0]?.pocName || '',
      POC_Contact: secondary.pocDetails?.[0]?.pocContact || '',
      POC_Role: secondary.pocDetails?.[0]?.pocRole || '',
      // CP is now a string: 'Accepting', 'On-boarded', 'Not-accepted'
      POC_CP: secondary.pocDetails?.[0]?.pocCP || '',
      // Store all POC details
      pocDetails: secondary.pocDetails || [],

      // Additional fields
      ProjectBrochure: construction.brochureLink || secondary.projectBrochure, // Get from Construction section first, fallback to Secondary
      Contact: secondary.contact,
      UserEmail: agentData?.email,
    };
  };

  // Comprehensive validation function - Only validate the three mandatory fields
  const validateAllRequiredFields = () => {
    const errors: any = {
      basics: {},
      construction: {},
      units: {},
      builder: {},
      financial: {},
      secondary: {},
    };
    const basics = formData.basics || {};

    // Only validate the three mandatory fields: Project Name, Builder Name, RERA Number
    if (!basics.projectName?.trim()) errors.basics.projectName = 'Project Name is required';
    if (!basics.builderName?.trim()) errors.basics.builderName = 'Builder Name is required';
    if (!basics.reraNumber?.trim()) errors.basics.reraNumber = 'RERA Number is required';

    // All other fields are optional - no validation needed

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateAllRequiredFields();
    console.log('Validation Errors:', validationErrors);

    // Check if there are any errors
    const hasErrors = Object.values(validationErrors).some(
      (sectionErrors: any) => Object.keys(sectionErrors).length > 0
    );

    if (hasErrors) {
      setValidationErrors(validationErrors);

      const errorSummary: string[] = [];
      Object.entries(validationErrors).forEach(([section, errors]: [string, any]) => {
        const errorCount = Object.keys(errors).length;
        if (errorCount > 0) {
          const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
          errorSummary.push(`${sectionName}: ${errorCount} field(s)`);
        }
      });

      const errorMessage = errorSummary.length > 0
        ? `Missing required fields in:\n${errorSummary.join('\n')}`
        : "Please fix the errors highlighted in red before submitting.";

      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      const apiData = convertToApiFormat(formData);

      // Set status to "Submitted" when completing long form
      (apiData as any).status = 'Submitted';

      console.log('Submitting API data:', JSON.stringify(apiData, null, 2));

      if (isDraftMode && reraNumber) {
        // Update existing draft in Supabase
        console.log('Updating draft with RERA:', reraNumber);

        const response = await fetch(`${API_BASE_URL}/api/properties/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        console.log('Update response status:', response.status);
        const result = await response.json();
        console.log('Update response:', result);

        if (response.ok) {
          // Create the submission object for local storage
          const newSubmission = {
            id: Date.now(),
            projectName: formData.basics?.projectName || 'N/A',
            builderName: formData.basics?.builderName || 'N/A',
            submissionType: 'Full Onboarding (Verified)',
            status: 'verified',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            details: {
              basics: formData.basics || {},
              construction: formData.construction || {},
              units: formData.units || {},
              financial: formData.financial || {},
              secondary: formData.secondary || {},
            },
          };

          // Save to localStorage
          const existingSubmissions = JSON.parse(localStorage.getItem('agentSubmissions') || '[]');
          const updatedSubmissions = [...existingSubmissions, newSubmission];
          localStorage.setItem('agentSubmissions', JSON.stringify(updatedSubmissions));

          if (onSubmit) {
            onSubmit(formData);
          }

          toast({
            title: "Success!",
            description: "Project verified and submitted successfully!",
          });

          // Force a hard redirect to agent dashboard to ensure state resets
          window.location.href = '/agent';
        } else {
          console.error('Verification failed:', result);
          // Log detailed validation errors if available
          if (result.errors) {
            console.error('Validation errors:', result.errors);
            alert(`Verification failed: ${result.message}\n\nValidation errors:\n${JSON.stringify(result.errors, null, 2)}`);
          } else {
            alert(`Verification failed: ${result.message || 'Unknown error'}`);
          }
        }
      } else {
        // Handle new project submission to Supabase
        console.log('Submitting new project');

        const response = await fetch(`${API_BASE_URL}/api/properties/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });

        console.log('Submission response status:', response.status);
        const result = await response.json();
        console.log('Submission response:', result);

        if (response.ok) {
          const newSubmission = {
            id: Date.now(),
            projectName: formData.basics?.projectName || 'N/A',
            builderName: formData.basics?.builderName || 'N/A',
            submissionType: 'Full Onboarding',
            status: 'submitted',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            details: {
              basics: formData.basics || {},
              construction: formData.construction || {},
              units: formData.units || {},
              financial: formData.financial || {},
              secondary: formData.secondary || {},
            },
          };

          const existingSubmissions = JSON.parse(localStorage.getItem('agentSubmissions') || '[]');
          const updatedSubmissions = [...existingSubmissions, newSubmission];
          localStorage.setItem('agentSubmissions', JSON.stringify(updatedSubmissions));

          if (onSubmit) {
            onSubmit(formData);
          }

          toast({
            title: "Success!",
            description: "Project submitted successfully!",
          });

          // Force a hard redirect to agent dashboard to ensure state resets
          window.location.href = '/agent';
        } else {
          console.error('Submission failed:', result);
          // Log detailed validation errors if available
          if (result.errors) {
            console.error('Validation errors:', result.errors);
            alert(`Submission failed: ${result.message}\n\nValidation errors:\n${JSON.stringify(result.errors, null, 2)}`);
          } else {
            alert(`Submission failed: ${result.message || 'Unknown error'}`);
          }
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit project. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    const tabOrder = ['basics', 'construction', 'units', 'builder', 'financial', 'secondary'];
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      setActiveTab(tabOrder[currentIndex + 1]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-xl font-bold text-gray-800">
          {isDraftMode ? 'Verify & Submit Project (From Draft)' : 'New Project Registration'}
        </CardTitle>
        {isDraftMode && (
          <p className="text-sm text-gray-600">
            This form has been pre-filled with data from your draft. Complete all required fields and verify the project to move it to the verified collection.
          </p>
        )}
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1">
            <TabsTrigger value="basics" className="text-xs sm:text-sm py-2">Project Basics</TabsTrigger>
            <TabsTrigger value="construction" className="text-xs sm:text-sm py-2">Construction</TabsTrigger>
            <TabsTrigger value="units" className="text-xs sm:text-sm py-2">Unit Config</TabsTrigger>
            <TabsTrigger value="builder" className="text-xs sm:text-sm py-2">Builder Reputation</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm py-2">Financial</TabsTrigger>
            <TabsTrigger value="secondary" className="text-xs sm:text-sm py-2">Secondary Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basics">
            <Card>
              <CardHeader>
                <CardTitle>Project Basics</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectBasics
                  data={formData.basics || {}}
                  onUpdate={(data) => updateFormData('basics', data)}
                  onPropertyFetched={handlePropertyFetched}
                  errors={validationErrors.basics}
                  isViewMode={isViewMode}
                  isDraftMode={isDraftMode}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="construction">
            <Card>
              <CardHeader>
                <CardTitle>Construction & Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ConstructionSpecs
                  data={formData.construction || {}}
                  onUpdate={(data) => updateFormData('construction', data)}
                  errors={validationErrors.construction}
                  isViewMode={isViewMode}
                  reraNumber={formData.basics?.reraNumber || ''}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="units">
            <Card>
              <CardHeader>
                <CardTitle>Unit Configurations</CardTitle>
              </CardHeader>
              <CardContent>
                <UnitConfigurations
                  data={formData.units || {}}
                  onUpdate={(data) => updateFormData('units', data)}
                  errors={validationErrors.units}
                  isViewMode={isViewMode}
                  projectType={formData.basics?.projectType || ''}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="builder">
            <Card>
              <CardHeader>
                <CardTitle>Builder Reputation</CardTitle>
              </CardHeader>
              <CardContent>
                <BuilderReputation
                  data={formData.builder || {}}
                  onUpdate={(data) => updateFormData('builder', data)}
                  errors={validationErrors.builder}
                  isViewMode={isViewMode}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="financial">
            <Card>
              <CardHeader>
                <CardTitle>Financial & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialCompliance
                  data={{
                    ...(formData.financial || {}),
                    // Include fields from other sections that FinancialCompliance needs
                    pricePerSft: formData.construction?.pricePerSft || '',
                    commissionPercentage: formData.secondary?.commissionPercentage || '',
                    carParkingCost: formData.financial?.extraCarParkingAmount || '',
                    payoutPeriod: formData.secondary?.payoutTimePeriod || ''
                  }}
                  onUpdate={(data) => {
                    // Split the update into appropriate sections
                    const financialUpdate: any = {};
                    const constructionUpdate: any = {};
                    const secondaryUpdate: any = {};
                    
                    if ('baseProjectPrice' in data) financialUpdate.baseProjectPrice = data.baseProjectPrice;
                    if ('extraCarParkingAmount' in data || 'carParkingCost' in data) {
                      financialUpdate.extraCarParkingAmount = data.carParkingCost || data.extraCarParkingAmount;
                    }
                    if ('homeLoan' in data) financialUpdate.homeLoan = data.homeLoan;
                    if ('homeLoanBanks' in data) financialUpdate.homeLoanBanks = data.homeLoanBanks;
                    if ('previousComplaints' in data) financialUpdate.previousComplaints = data.previousComplaints;
                    if ('complaintDetails' in data) financialUpdate.complaintDetails = data.complaintDetails;
                    
                    if ('pricePerSft' in data) constructionUpdate.pricePerSft = data.pricePerSft;
                    
                    if ('commissionPercentage' in data) secondaryUpdate.commissionPercentage = data.commissionPercentage;
                    if ('payoutPeriod' in data || 'payoutTimePeriod' in data) {
                      secondaryUpdate.payoutTimePeriod = data.payoutPeriod || data.payoutTimePeriod;
                    }
                    
                    if (Object.keys(financialUpdate).length > 0) updateFormData('financial', financialUpdate);
                    if (Object.keys(constructionUpdate).length > 0) updateFormData('construction', constructionUpdate);
                    if (Object.keys(secondaryUpdate).length > 0) updateFormData('secondary', secondaryUpdate);
                  }}
                  errors={validationErrors.financial}
                  isViewMode={isViewMode}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="secondary">
            <Card>
              <CardHeader>
                <CardTitle>Commission, Payout & Lead Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <SecondaryDetails
                  data={formData.secondary || {}}
                  onUpdate={(data) => updateFormData('secondary', data)}
                  errors={validationErrors.secondary}
                  isViewMode={isViewMode}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {!isViewMode && (
          <div className="flex justify-end gap-4 mt-6">
            {activeTab === 'secondary' ? (
              // Show Submit button only on Secondary Details page
              isDraftMode ? (
                <Button onClick={handleSubmit} disabled={isSubmitting} variant="outline">
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                </Button>
              )
            ) : (
              // Show Next button on all other pages
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};