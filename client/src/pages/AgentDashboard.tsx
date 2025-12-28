import React, { useState, useEffect } from 'react';
// FIX: Import useLocation to read the navigation state
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Edit, LogOut, Building2, BarChart3, Menu, X, FilePlus, Users } from 'lucide-react';
import { ProjectForm, normalizePropertyData } from '@/components/ProjectForm';
import { ShortFormOnboarding } from '@/components/ShortFormOnboarding';
import { AgentReports } from '@/components/AgentReports';
import { DraftsSection } from '@/components/DraftsSection';
import { ProjectList } from '@/components/ProjectList';
import AllPropertiesSection from '@/components/AllPropertiesSection';
import LeadRegistration from '@/components/LeadRegistration';
import { LeadInfoModal } from '@/components/LeadInfoModal';
import { yyyymmddToDDMMYYYY } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface AgentDashboardProps {
  agentData: any;
  onLogout: () => void;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ agentData, onLogout }) => {
  // FIX: Read the location to check for incoming state
  const location = useLocation();

  // FIX: Initialize the selectedOption state based on the location state,
  // or default to 'selection' if no state is passed.
  const [selectedOption, setSelectedOption] = useState<'selection' | 'full' | 'short' | 'reports' | 'drafts' | 'viewProjects' | 'leadRegistration'>(
    location.state?.defaultView || 'selection'
  );
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [viewingProject, setViewingProject] = useState<any>(null);
  const [viewingDraftInShortForm, setViewingDraftInShortForm] = useState<any>(null);
  
  // Lead info modal and project selection state
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [selectedProjectsData, setSelectedProjectsData] = useState<any[]>([]);
  const [leadName, setLeadName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');

  // Reset to selection view when location changes and state indicates it
  useEffect(() => {
    if (location.state?.defaultView === 'selection') {
      setSelectedOption('selection');
      setEditingDraft(null);
      setViewingProject(null);
      setViewingDraftInShortForm(null);
    }
  }, [location.state]);

  // Debug: Log agentData to see what's available
  useEffect(() => {
    console.log('AgentDashboard: agentData received:', agentData);
    console.log('AgentDashboard: agentData.email:', agentData?.email);
    console.log('AgentDashboard: agentData.name:', agentData?.name);
    console.log('AgentDashboard: agentData keys:', agentData ? Object.keys(agentData) : 'agentData is null/undefined');
  }, [agentData]);

  const handleOptionSelect = (option: 'full' | 'short' | 'reports' | 'drafts' | 'viewProjects' | 'leadRegistration') => {
    setSelectedOption(option);
    setSidebarOpen(false);
    setEditingDraft(null);
    setViewingProject(null);
    setViewingDraftInShortForm(null);
  };

  const handleBackToSelection = () => {
    setSelectedOption('selection');
    setSidebarOpen(false);
    setEditingDraft(null);
    setViewingProject(null);
    setViewingDraftInShortForm(null);
  };

  const handleToggleForms = () => {
    if (selectedOption === 'full') {
      setSelectedOption('short');
    } else if (selectedOption === 'short') {
      setSelectedOption('full');
    }
  };

  const handleDraftSaved = (draftFormData: any) => {
    alert('Draft saved successfully! You can now view it in the Drafts section.');
    setSelectedOption('drafts');
  };

  const handleProjectSelect = async (project: any) => {
    // If it's a draft, fetch full data and open in short form (view mode)
    if (project.status === 'Draft') {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/unverified/DraftData/id/${project._id}`);
        
        if (response.ok) {
          const draftData = await response.json();
          // Set the draft data to be viewed in short form
          setViewingDraftInShortForm(draftData);
          setSelectedOption('short');
        } else {
          console.error('Failed to fetch draft details');
        }
      } catch (error) {
        console.error('Error fetching draft:', error);
      }
    } else {
      // If it's a submitted project, open in long form (view mode)
      setViewingProject(project);
      setSelectedOption('full');
    }
  };

  const handleProjectCheckboxChange = (project: any, checked: boolean) => {
    console.log('Checkbox changed:', project.projectName, checked);
    const newSelectedProjects = new Set(selectedProjects);
    let updatedProjectsData = [...selectedProjectsData];
    
    if (checked) {
      newSelectedProjects.add(project._id);
      // Add project data if not already present
      if (!updatedProjectsData.find(p => p._id === project._id)) {
        updatedProjectsData = [...updatedProjectsData, project];
      }
    } else {
      newSelectedProjects.delete(project._id);
      updatedProjectsData = updatedProjectsData.filter(p => p._id !== project._id);
      // Close modal if less than 3 projects are selected
      if (newSelectedProjects.size <= 2 && leadModalOpen) {
        setLeadModalOpen(false);
      }
    }
    
    setSelectedProjects(newSelectedProjects);
    setSelectedProjectsData(updatedProjectsData);
    
    console.log('Selected projects count:', newSelectedProjects.size);
    
    // Show modal when more than 2 projects are selected (i.e., 3 or more)
    if (newSelectedProjects.size > 2) {
      console.log('Opening modal - selected projects:', newSelectedProjects.size);
      setLeadName('');
      setLeadMobile('');
      setLeadModalOpen(true);
    }
  };

  const handleLeadInfoSubmit = async (name: string, mobile: string) => {
    if (selectedProjects.size === 0) {
      toast({
        title: 'No projects selected',
        description: 'Please select at least one project.',
        variant: 'destructive',
      });
      return;
    }

    setLeadName(name);
    setLeadMobile(mobile);
    setLeadModalOpen(false);
    
    // Generate and download PDF with all selected projects
    await generateAndDownloadPDF(name, mobile, selectedProjectsData, selectedProjects);
    
    // Clear selections after PDF is generated
    setSelectedProjects(new Set());
    setSelectedProjectsData([]);
  };

  const generateAndDownloadPDF = async (
    leadName: string, 
    leadMobile: string, 
    projectsData: any[],
    selectedProjectsSet: Set<string>
  ) => {
    try {
      console.log('Generating PDF - Projects data:', projectsData.length, 'Selected IDs:', selectedProjectsSet.size);
      
      // Build projects array with lead info from selected projects
      const projectsToInclude = projectsData
        .filter(p => selectedProjectsSet.has(p._id))
        .map(projectData => ({
          ...projectData,
          leadName,
          leadMobile,
        }));

      console.log('Projects to include in PDF:', projectsToInclude.length);

      if (projectsToInclude.length === 0) {
        toast({
          title: 'No projects selected',
          description: 'Please select at least one project.',
          variant: 'destructive',
        });
        return;
      }

      // Call backend API to generate PDF
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/pdf/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadName,
          leadMobile,
          projects: projectsToInclude,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lead_${leadName}_${leadMobile}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success!',
          description: `PDF generated successfully for ${projectsToInclude.length} project(s).`,
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const normalizeUnitType = (unitType: string) => {
    // Map short form unit types to long form unit types
    const unitTypeMapping: { [key: string]: string } = {
      'Commercial': 'Commercial',
      'Plotting': 'Plotting',
      '1 BHK': '1 BHK',
      '2 BHK': '2 BHK',
      '2.5 BHK': '2.5 BHK',
      '3 BHK': '3 BHK',
      '3.5 BHK': '3.5 BHK',
      '4 BHK': '4 BHK',
      '4.5 BHK': '4.5 BHK',
      '5 BHK': '5 BHK',
      // Also support versions without spaces
      '1BHK': '1 BHK',
      '2BHK': '2 BHK',
      '2.5BHK': '2.5 BHK',
      '3BHK': '3 BHK',
      '3.5BHK': '3.5 BHK',
      '4BHK': '4 BHK',
      '4.5BHK': '4.5 BHK',
      '5BHK': '5 BHK'
    };
    
    return unitTypeMapping[unitType] || unitType;
  };

  const handleEditDraft = (draft: any) => {
    console.log('AgentDashboard: handleEditDraft - draft data:', draft);
    
    const formatDateForInput = (dateValue: any) => {
      if (!dateValue) return '';
      try {
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
      } catch (error) {
        return '';
      }
    };

    // Transform the draft data from API format to form component format
    // Support both PascalCase (old format) and snake_case (Supabase format)
    const transformedData = {
      basics: {
        projectName: draft.formData.ProjectName || draft.formData.projectname || '',
        projectLocation: draft.formData.ProjectLocation || draft.formData.projectlocation || '',
        builderName: draft.formData.BuilderName || draft.formData.buildername || '',
        reraNumber: draft.formData.RERA_Number || draft.formData.rera_number || '',
        projectType: (() => {
          // Handle both PascalCase and snake_case
          const projectTypeValue = draft.formData.Project_Type || draft.formData.project_type || draft.formData.BuildingType || draft.formData.buildingtype || '';
          console.log('AgentDashboard: Loading Project_Type:', projectTypeValue);
          
          // Map to form values (not short form values)
          if (projectTypeValue === 'Apartment' || projectTypeValue === 'Apartments') {
            return 'Apartment';
          } else if (projectTypeValue === 'Villa' || projectTypeValue === 'Villas') {
            return 'Villa';
          } else if (projectTypeValue === 'Villa Apartment') {
            return 'Villa Apartment';
          }
          return projectTypeValue || '';
        })(),
        totalLandArea: (draft.formData.Total_land_Area || draft.formData.total_land_area || draft.formData.totalLandArea)?.toString().replace(/[^0-9.]/g, '') || '',
        numberOfTowers: draft.formData.Number_of_Towers || draft.formData.number_of_towers || draft.formData.numberOfTowers || '',
        numberOfFloors: draft.formData.Numbger_of_Floors || draft.formData.Number_of_Floors || draft.formData.number_of_floors || '',
        flatsPerFloor: draft.formData.Number_of_Flats_Per_Floor || draft.formData.number_of_flats_per_floor || '',
        totalUnits: draft.formData.Total_Number_of_Units || draft.formData.total_number_of_units || draft.formData.totalNumberOfUnits || '',
        openSpace: draft.formData.Open_Space || draft.formData.open_space || '',
        launchDate: formatDateForInput(draft.formData.Launch_Date || draft.formData.project_launch_date),
        possessionDate: formatDateForInput(draft.formData.Possession_Date || draft.formData.possession_date),
        constructionStatus: draft.formData.Construction_Status || draft.formData.construction_status || draft.formData.constructionStatus || '',
        communityType: draft.formData.CommunityType || draft.formData.communitytype || draft.formData.community_type || '',
        city: draft.formData.City || draft.formData.city || '',
        state: draft.formData.State || draft.formData.state || ''
      },
      construction: {
        // Map construction-related fields - support both PascalCase and snake_case
        buildingType: draft.formData.BuildingType || draft.formData.buildingtype || '',
        constructionStatus: draft.formData.Construction_Status || draft.formData.construction_status || draft.formData.constructionStatus || '',
        possessionDate: formatDateForInput(draft.formData.Possession_Date || draft.formData.possession_date),
        launchDate: formatDateForInput(draft.formData.Launch_Date || draft.formData.project_launch_date),
        carpetAreaPercentage: (draft.formData.Carpet_area_Percentage || draft.formData.carpet_area_percentage)?.toString() || '',
        ceilingHeight: (draft.formData.Floor_to_Ceiling_Height || draft.formData.floor_to_ceiling_height || draft.formData.ceilingHeight)?.toString() || '',
        powerBackup: draft.formData.PowerBackup || draft.formData.powerbackup || '',
        groundVehicleMovement: draft.formData.Ground_vehicle_Movement || draft.formData.ground_vehicle_movement || draft.formData.groundVehicleMovement || '',
        openSpace: (draft.formData.Open_Space || draft.formData.open_space)?.toString() || '',
        pricePerSft: (draft.formData.Price_per_sft || draft.formData.price_per_sft || draft.formData.pricePerSft)?.toString() || '',
        passengerLifts: (draft.formData.No_of_Passenger_lift || draft.formData.no_of_passenger_lift || draft.formData.noOfPassengerLift)?.toString() || '',
        serviceLifts: (draft.formData.No_of_Service_lift || draft.formData.no_of_service_lift || draft.formData.noOfServiceLift)?.toString() || '',
        visitorParking: draft.formData.Visitor_Parking || draft.formData.visitor_parking || draft.formData.visitorParking || '',
        brochureLink: draft.formData.ProjectBrochure || draft.formData.projectbrochure || draft.formData.brochureLink || '',
        priceSheetLink: draft.formData.PriceSheetLink || draft.formData.pricesheet_link_1 || draft.formData.priceSheetLink || '',
        constructionMaterial: (() => {
          const materialValue = draft.formData.Construction_Material || draft.formData.construction_material || draft.formData.constructionMaterial || '';
          // Map from backend values to frontend form values
          if (materialValue === 'Red Bricks') return 'Brick';
          if (materialValue === 'Cement Bricks') return 'Cement Brick';
          if (materialValue === 'Concrete') return 'Concrete';
          return materialValue || '';
        })(),
        amenities: draft.formData.Amenities || draft.formData.amenities || [],
        specifications: draft.formData.Specifications || draft.formData.specification || '',
        externalAmenities: draft.formData.External_Amenities || draft.formData.external_amenities || ''
      },
      units: (() => {
        // Determine project type for transformation
        const projectTypeValue = draft.formData.Project_Type || draft.formData.project_type || draft.formData.BuildingType || draft.formData.buildingtype || '';
        const isVillaProject = projectTypeValue === 'Villa' || projectTypeValue === 'Villas';
        
        const configurations = draft.formData.configurations || [];
        const unitTypes: any = {};
        
        console.log('AgentDashboard: Transforming configurations:', configurations);
        console.log('AgentDashboard: Project type:', projectTypeValue, 'isVilla:', isVillaProject);
        
        // Process each configuration and build both flat array and unitTypes structure
        const processedConfigurations: any[] = [];
        
        configurations.forEach((config: any) => {
          const originalType = config.type;
          const unitType = normalizeUnitType(config.type);
          console.log(`AgentDashboard: Processing unit type "${originalType}" -> "${unitType}"`);
          
          // Initialize unitTypes structure if not exists
          if (!unitTypes[unitType]) {
            unitTypes[unitType] = {
              enabled: true,
              variants: []
            };
          }
          
          // Build flat configuration for configurations array (used by long form table)
          const flatConfig: any = {
            type: unitType,
            facing: config.facing || ''
          };
          
          // Build variant object for unitTypes structure (used by long form UI checkboxes)
          const variant: any = {
            facing: config.facing || ''
          };
          
          // Handle Villa vs Apartment project types
          if (isVillaProject && (config.sizeSqFt !== undefined || config.sizeSqYd !== undefined)) {
            // Villa format: separate sizeSqFt and sizeSqYd fields
            flatConfig.sizeSqFt = config.sizeSqFt?.toString() || '';
            flatConfig.sizeSqYd = config.sizeSqYd?.toString() || '';
            variant.sizeSqFt = config.sizeSqFt?.toString() || '';
            variant.sizeSqYd = config.sizeSqYd?.toString() || '';
          } else {
            // Apartment format: sizeRange and sizeUnit
            flatConfig.sizeRange = config.sizeRange?.toString() || '';
            flatConfig.sizeUnit = config.sizeUnit || 'Sq ft';
            variant.size = config.sizeRange?.toString() || '';
            variant.sizeUnit = config.sizeUnit || 'Sq ft';
          }
          
          // Map parking field: No_of_car_Parking -> parkingSlots for variants
          flatConfig.No_of_car_Parking = config.No_of_car_Parking?.toString() || '';
          variant.parkingSlots = config.No_of_car_Parking?.toString() || '';
          
          processedConfigurations.push(flatConfig);
          unitTypes[unitType].variants.push(variant);
          
          console.log(`AgentDashboard: Added config for ${unitType}:`, flatConfig);
          console.log(`AgentDashboard: Added variant for ${unitType}:`, variant);
        });
        
        console.log('AgentDashboard: Final configurations:', processedConfigurations);
        console.log('AgentDashboard: Final unitTypes:', unitTypes);
        
        return { 
          configurations: processedConfigurations.length > 0 ? processedConfigurations : [],
          unitTypes 
        };
      })(),
      financial: {
        // Map financial fields - support both PascalCase and snake_case
        pricePerSft: (draft.formData.Price_per_sft || draft.formData.price_per_sft || draft.formData.pricePerSft)?.toString() || '',
        baseProjectPrice: (draft.formData.BaseProjectPrice || draft.formData.baseprojectprice || draft.formData.baseProjectPrice)?.toString() || '',
        extraCarParkingAmount: (draft.formData.Amount_For_Extra_Car_Parking || draft.formData.amount_for_extra_car_parking || draft.formData.extraCarParkingAmount)?.toString() || '',
        carParkingCost: (draft.formData.Amount_For_Extra_Car_Parking || draft.formData.amount_for_extra_car_parking || draft.formData.extraCarParkingAmount)?.toString() || '',
        commissionPercentage: (draft.formData.Commission_percentage || draft.formData.commission_percentage || draft.formData.Commision_percentage || draft.formData.commissionPercentage)?.toString() || '',
        payoutPeriod: (draft.formData.After_agreement_of_sale_what_is_payout_time_period || draft.formData.after_agreement_of_sale_what_is_payout_time_period || draft.formData.payoutTimePeriod || draft.formData.payoutPeriod)?.toString() || '',
        homeLoan: draft.formData.Home_loan || draft.formData.home_loan || draft.formData.homeLoan || '',
        previousComplaints: draft.formData.previous_complaints_on_builder || draft.formData.previousComplaints || '',
        complaintDetails: draft.formData.complaint_details || draft.formData.complaintDetails || '',
        homeLoanBanks: draft.formData.homeLoanBanks || []
      },
      secondary: {
        // Commission & Payout fields - support both PascalCase and snake_case
        commissionType: draft.formData.commissionType || '',
        commissionPercentage: (draft.formData.Commission_percentage || draft.formData.commission_percentage || draft.formData.Commision_percentage || draft.formData.commissionPercentage)?.toString() || '',
        payoutTimePeriod: (draft.formData.After_agreement_of_sale_what_is_payout_time_period || draft.formData.after_agreement_of_sale_what_is_payout_time_period || draft.formData.payoutTimePeriod)?.toString() || '',
        therePrice: (draft.formData.What_is_there_Price || draft.formData.what_is_there_price)?.toString() || '',
        relaiPrice: (draft.formData.What_is_relai_price || draft.formData.what_is_relai_price)?.toString() || '',
        
        // Secondary Details fields
        leadRegistrationRequired: draft.formData.Is_lead_Registration_required_before_Site_visit || draft.formData.is_lead_registration_required_before_site_visit || draft.formData.leadRegistrationRequired || '',
        whatsappNumber: draft.formData.WhatsApp_Number || draft.formData.whatsappNumber || '',
        emailAddress: draft.formData.Email_Address || draft.formData.emailAddress || '',
        leadAcknowledgementTime: (draft.formData.Turnaround_Time_for_Lead_Acknowledgement || draft.formData.turnaround_time_for_lead_acknowledgement || draft.formData.leadAcknowledgementTime)?.toString() || '',
        validityPeriod: draft.formData.Is_there_validity_period_for_registered_lead || draft.formData.is_there_validity_period_for_registered_lead || draft.formData.validityPeriod || '',
        validityPeriodValue: (draft.formData.validity_period_value || draft.formData.validityPeriodValue)?.toString() || '',
        
        // POC Information - support both formats including CP checkbox
        // Transform pocDetails from Short Form format (cp) to Full Form format (pocCP)
        pocDetails: draft.formData.pocDetails 
          ? draft.formData.pocDetails.map((poc: any) => ({
              pocName: poc.pocName || poc.name || '',
              pocContact: (poc.pocContact || poc.contact)?.toString() || '',
              pocRole: poc.pocRole || poc.role || '',
              pocCP: poc.pocCP ?? poc.cp ?? false
            }))
          : [
              {
                pocName: draft.formData.POC_Name || draft.formData.poc_name || draft.formData.pocName || '',
                pocContact: (draft.formData.POC_Contact || draft.formData.poc_contact || draft.formData.pocNumber)?.toString() || '',
                pocRole: draft.formData.POC_Role || draft.formData.poc_role || draft.formData.pocRole || '',
                pocCP: draft.formData.POC_CP ?? draft.formData.cp ?? false
              }
            ],
        
        // Charges & Preferences fields
        floorCharger: draft.formData.Floor_Charger || draft.formData.floorCharger || '',
        floorChargerAmount: draft.formData.Floor_Charger_Amount || draft.formData.floorChargerAmount || '',
        floorChargerAbove: draft.formData.Floor_Charger_Above || draft.formData.floorChargerAbove || '',
        facingCharges: draft.formData.Facing_Charges || draft.formData.facingCharges || '',
        facingChargesAmount: draft.formData.Facing_Charges_Amount || draft.formData.facingChargesAmount || '',
        plc: draft.formData.PLC || draft.formData.plc || '',
        plcConditions: draft.formData.PLC_Conditions || draft.formData.plcConditions || '',
        groundVehicleMovement: draft.formData.Ground_vehicle_Movement || draft.formData.groundVehicleMovement || '',
        wowFactorAmenity: draft.formData.Wow_Factor_Amenity || draft.formData.wowFactorAmenity || '',
        
        // Additional fields that might be in the draft
        extraCarParkingAmount: draft.formData.Amount_For_Extra_Car_Parking || draft.formData.amount_for_extra_car_parking || draft.formData.extraCarParkingAmount || '',
        
        // Lead registration workflow fields
        confirmRegistrationName: draft.formData.person_to_confirm_registration?.name || draft.formData.confirmRegistrationName || '',
        confirmRegistrationContact: draft.formData.person_to_confirm_registration?.contact || draft.formData.confirmRegistrationContact || '',
        whatsappRegistration: draft.formData.Accepted_Modes_of_Lead_Registration?.WhatsApp || draft.formData.whatsappRegistration || '',
        emailRegistration: draft.formData.Accepted_Modes_of_Lead_Registration?.Email || draft.formData.emailRegistration || '',
        webFormRegistration: draft.formData.Accepted_Modes_of_Lead_Registration?.Web_Form || draft.formData.webFormRegistration || '',
        crmAppRegistration: draft.formData.Accepted_Modes_of_Lead_Registration?.CRM_App_Access || draft.formData.crmAppRegistration || '',
        physicalRegisterRegistration: draft.formData.Accepted_Modes_of_Lead_Registration?.Physical_Register_Along_With_Lead || draft.formData.physicalRegisterRegistration || '',
        duringSiteVisitRegistration: draft.formData.Accepted_Modes_of_Lead_Registration?.During_Site_Visit || draft.formData.duringSiteVisitRegistration || '',
        otherRegistrationModes: draft.formData.Accepted_Modes_of_Lead_Registration?.Others || draft.formData.otherRegistrationModes || '',
        leadRegistrationNotes: draft.formData.Notes_Comments_on_lead_registration_workflow || draft.formData.notes_comments_on_lead_registration_workflow || draft.formData.leadRegistrationNotes || '',
        
        // Additional project details
        projectBrochure: draft.formData.ProjectBrochure || draft.formData.projectbrochure || draft.formData.projectBrochure || '',
        contact: draft.formData.Contact || draft.formData.contact || ''
      }
    };
    
    setEditingDraft(transformedData);
    setSelectedOption('full');
  };

  const handleDraftSubmission = (draftId: string) => {
    setEditingDraft(null);
    // After submission logic in ProjectForm, we'll be navigated to the reports view
    // so we can set the state here to match.
    setSelectedOption('reports');
  };

  const sidebarItems = [
    {
      label: 'New Project (Full Form)',
      icon: <FilePlus className="h-5 w-5" />,
      action: () => handleOptionSelect('full'),
      current: selectedOption === 'full',
    },
    {
      label: 'New Project (Short Form)',
      icon: <FileText className="h-5 w-5" />,
      action: () => handleOptionSelect('short'),
      current: selectedOption === 'short',
    },
    {
      label: 'View Projects',
      icon: <Building2 className="h-5 w-5" />,
      action: () => handleOptionSelect('viewProjects'),
      current: selectedOption === 'viewProjects',
    },
    {
      label: 'Drafts',
      icon: <Edit className="h-5 w-5" />,
      action: () => handleOptionSelect('drafts'),
      current: selectedOption === 'drafts',
    },
    {
      label: 'Reports',
      icon: <BarChart3 className="h-5 w-5" />,
      action: () => handleOptionSelect('reports'),
      current: selectedOption === 'reports',
    },
    {
      label: 'Lead Registration',
      icon: <Users className="h-5 w-5" />,
      action: () => handleOptionSelect('leadRegistration'),
      current: selectedOption === 'leadRegistration',
    },
  ];

  // The rest of the component remains the same.
  const renderContent = () => {
    if (viewingProject) {
      // Use the normalizePropertyData function from ProjectForm to ensure all fields are mapped correctly
      console.log('🔍 AgentDashboard - Raw viewingProject data:', viewingProject);
      console.log('🔍 AgentDashboard - Project keys:', Object.keys(viewingProject));
      const transformedProjectData = normalizePropertyData(viewingProject);
      console.log('🔍 AgentDashboard - Transformed data:', transformedProjectData);
      
      return (
        <ProjectForm
          initialData={transformedProjectData}
          isViewMode={true}
          agentData={agentData}
        />
      );
    }
    if (editingDraft) {
      return (
        <ProjectForm
          initialData={editingDraft}
          isDraftMode={true}
          reraNumber={editingDraft?.basics?.reraNumber}
          agentData={agentData}
          onSubmit={() => handleDraftSubmission(editingDraft.id)}
        />
      );
    }
    switch (selectedOption) {
      case 'full':
        return <ProjectForm agentData={agentData} />;
      case 'short':
        return <ShortFormOnboarding 
          agentData={agentData} 
          onDraftSaved={handleDraftSaved}
          initialData={viewingDraftInShortForm}
          isViewMode={!!viewingDraftInShortForm}
          onBackToDashboard={() => {
            setViewingDraftInShortForm(null);
            setSelectedOption('viewProjects');
          }}
        />;
      case 'reports':
        return <AgentReports agentData={agentData} />;
      case 'drafts':
        return <DraftsSection onEditDraft={handleEditDraft} userEmail={agentData?.email} />;
      case 'viewProjects':
        return (
          <>
            <ProjectList 
              onProjectSelect={handleProjectSelect} 
              onProjectCheckboxChange={handleProjectCheckboxChange}
              selectedProjectIds={selectedProjects}
              agentEmail={agentData?.email} 
            />
            <LeadInfoModal
              open={leadModalOpen}
              onClose={() => {
                setLeadModalOpen(false);
                // Keep selections when modal is closed - user can try again
              }}
              onSubmit={handleLeadInfoSubmit}
              initialName={leadName}
              initialMobile={leadMobile}
              projectName={`${selectedProjects.size} Selected Projects`}
            />
          </>
        );
      case 'leadRegistration':
        return <LeadRegistration agentData={agentData} />;
      case 'selection':
        return (
          <div className="text-center">
            <div className="mb-8 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Choose Onboarding Type
              </h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Select the type of project onboarding you want to complete
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Onboarding Details (Full) Card */}
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <span className="text-blue-600 text-3xl">📄</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">Onboarding Details (Full)</h2>
                <p className="text-gray-600 mb-4 text-center">
                  Complete comprehensive onboarding with all project details, validations, and submission capabilities.
                </p>
                <ul className="text-gray-500 text-sm mb-6 list-disc list-inside">
                  <li>All primary and secondary details</li>
                  <li>Complete validation and submission</li>
                  <li>Full admin workflow status</li>
                  <li>Comprehensive project documentation</li>
                </ul>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full"
                  onClick={() => setSelectedOption('full')}
                >
                  Start Full Onboarding
                </button>
              </div>
              {/* Onboarding Details (Short-Form) Card */}
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <span className="text-blue-600 text-3xl">📝</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">Onboarding Details (Short-Form)</h2>
                <p className="text-gray-600 mb-4 text-center">
                  Quick onboarding with essential fields only. Save as draft for admin review and completion.
                </p>
                <ul className="text-gray-500 text-sm mb-6 list-disc list-inside">
                  <li>Essential fields only</li>
                  <li>Draft-only submission</li>
                  <li>Quick entry process</li>
                  <li>Admin can later update status</li>
                </ul>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full"
                  onClick={() => setSelectedOption('short')}
                >
                  Start Short-Form
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                Choose Onboarding Type
              </h2>
              <p className="text-gray-600 text-sm lg:text-base">
                Select the type of project onboarding you want to complete
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Onboarding Details (Full) Card */}
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <span className="text-blue-600 text-3xl">📄</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">Onboarding Details (Full)</h2>
                <p className="text-gray-600 mb-4 text-center">
                  Complete comprehensive onboarding with all project details, validations, and submission capabilities.
                </p>
                <ul className="text-gray-500 text-sm mb-6 list-disc list-inside">
                  <li>All primary and secondary details</li>
                  <li>Complete validation and submission</li>
                  <li>Full admin workflow status</li>
                  <li>Comprehensive project documentation</li>
                </ul>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full"
                  onClick={() => setSelectedOption('full')}
                >
                  Start Full Onboarding
                </button>
              </div>
              {/* Onboarding Details (Short-Form) Card */}
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="bg-blue-100 rounded-full p-3 mb-4">
                  <span className="text-blue-600 text-3xl">📝</span>
                </div>
                <h2 className="text-lg font-semibold mb-2">Onboarding Details (Short-Form)</h2>
                <p className="text-gray-600 mb-4 text-center">
                  Quick onboarding with essential fields only. Save as draft for admin review and completion.
                </p>
                <ul className="text-gray-500 text-sm mb-6 list-disc list-inside">
                  <li>Essential fields only</li>
                  <li>Draft-only submission</li>
                  <li>Quick entry process</li>
                  <li>Admin can later update status</li>
                </ul>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded w-full"
                  onClick={() => setSelectedOption('short')}
                >
                  Start Short-Form
                </button>
              </div>
            </div>
          </div>
        );
    }
  };
  const getPageTitle = () => {
    if (viewingProject) {
      return `View Project: ${viewingProject.ProjectName}`;
    }
    switch (selectedOption) {
      case 'full':
        return 'New Project Registration (Full Form)';
      case 'short':
        return 'New Project Registration (Short Form)';
      case 'reports':
        return 'Agent Reports';
      case 'drafts':
        return 'Drafts';
      case 'viewProjects':
        return 'Your Submitted Projects';
      case 'leadRegistration':
        return 'Lead Registration';
      case 'selection':
        return 'Agent Dashboard';
      default:
        return 'Agent Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold">Relai</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors ${
                item.current ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
          <div className="absolute bottom-0 w-full p-4">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </nav>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}> <Menu className="w-5 h-5" /> </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
                <p className="text-sm text-gray-600">Agent: {agentData.email}</p>
              </div>
            </div>
            {(selectedOption === 'full' || selectedOption === 'short' || selectedOption === 'reports' || selectedOption === 'drafts' || selectedOption === 'leadRegistration') && (
              <Button onClick={handleBackToSelection} variant="outline" size="sm"> Back to Dashboard </Button>
            )}
          </div>
        </header>
        <main className={`flex-1 overflow-auto ${selectedOption === 'leadRegistration' ? 'p-2' : 'p-4 lg:p-6'}`}>
          {selectedOption === 'leadRegistration' ? (
            <div className="h-full">
              {renderContent()}
            </div>
          ) : (
            <Card className="w-full lg:w-3/4" style={{ minHeight: '80vh' }}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center">
                    <FileText className="mr-2" />
                    {getPageTitle()}
                  </span>
                  {selectedOption === 'full' || selectedOption === 'short' ? (
                    <Button variant="outline" onClick={handleToggleForms}>
                      Switch to {selectedOption === 'full' ? 'Short Form' : 'Full Form'}
                    </Button>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContent()}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default AgentDashboard;