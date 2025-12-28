import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LeadInfoModal } from '@/components/LeadInfoModal';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  Phone,
  FileText,
  MapPin,
  Calendar,
  Building2,
  Star,
  Eye,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  Loader2,
  Search,
  RefreshCw,
  Mail,
  MessageCircle,
  User,
  Home,
  ChevronDown,
  ChevronRight,
  Link,
  Copy,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShortlistedPropertyData {
  areaname?: string;
  buildername?: string;
  projectname?: string;
  rera_number?: string;
  price_per_sft?: number;
  possession_date?: string;
  pricesheet_link_1?: string;
  projectbrochure?: string;
  projectlocation?: string;
  project_type?: string;
  property_type?: string;
  total_land_area?: string | number;
  totalLandArea?: string | number;
  size_range?: string;
  price_range?: string;
  grid_score?: string | number;
  construction_status?: string;
  city?: string;
  state?: string;
  number_of_towers?: string;
  number_of_flats_per_floor?: string;
  project_launch_date?: string;
  floor_rise_charges?: string;
  open_space?: string;
  external_amenities?: string;
  floor_rise_amount_per_floor?: string;
  floor_rise_applicable_above_floor_no?: string;
  facing_charges?: string;
  preferential_location_charges?: string;
  preferential_location_charges_conditions?: string;
  no_of_passenger_lift?: string;
  visitor_parking?: string;
}

interface ShortlistedProperty {
  property?: ShortlistedPropertyData;
  propertyId?: number;
  configIndex?: number;
  propertyName?: string;
  configuration?: any;
  shortlistedAt?: string;
  rera_number?: string;
  projectname?: string;
  buildername?: string;
}

interface ClientRequirement {
  id: number;
  created_at: string;
  client_mobile: string;
  client_name?: string;
  requirement_number: number;
  requirement_name: string;
  preferences: {
    budget_min?: number;
    budget_max?: number;
    location?: string;
    property_type?: string;
    bedrooms?: string;
    area_min?: number;
    area_max?: number;
    amenities?: string[];
    notes?: string;
  };
  matched_properties: any[];
  shortlisted_properties: ShortlistedProperty[];
  site_visits: any[];
  updated_at: string;
}

interface LeadRegistrationProps {
  agentData?: any;
}

interface PocData {
  poc_name: string;
  poc_contact: string;
  poc_role: string;
  projectname: string;
  buildername: string;
  grid_score?: string | number;
  price_range?: string;
  size_range?: string;
  project_type?: string;
  areaname?: string;
  city?: string;
  state?: string;
  number_of_towers?: string;
  number_of_flats_per_floor?: string;
  price_per_sft?: string;
  project_launch_date?: string;
  floor_rise_charges?: string;
  open_space?: string;
  external_amenities?: string;
  floor_rise_amount_per_floor?: string;
  floor_rise_applicable_above_floor_no?: string;
  facing_charges?: string;
  preferential_location_charges?: string;
  preferential_location_charges_conditions?: string;
  no_of_passenger_lift?: string;
  visitor_parking?: string;
}

const LeadRegistration: React.FC<LeadRegistrationProps> = ({ agentData }) => {
  const [leads, setLeads] = useState<ClientRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingLead, setEditingLead] = useState<ClientRequirement | null>(null);
  const [viewingLead, setViewingLead] = useState<ClientRequirement | null>(null);
  const [selectedLead, setSelectedLead] = useState<ClientRequirement | null>(null);
  const [pocDataMap, setPocDataMap] = useState<Record<string, PocData>>({});
  const [selectedPropertyKeys, setSelectedPropertyKeys] = useState<Set<string>>(new Set());
  const [zohoLeadNames, setZohoLeadNames] = useState<Record<string, string>>({});
  const [savedPropertyKeys, setSavedPropertyKeys] = useState<Set<string>>(new Set());
  const [savingPropertyKeys, setSavingPropertyKeys] = useState<Set<string>>(new Set());
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadMobile, setLeadMobile] = useState('');
  const [shareLinkModalOpen, setShareLinkModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [generatingShareLink, setGeneratingShareLink] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Set<number>>(new Set());
  const [leadStatuses, setLeadStatuses] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const STATUS_OPTIONS = [
    { value: 'yet_to_be_done', label: 'Yet to be done', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-700' },
  ];

  const toggleLeadExpansion = (leadId: number) => {
    setExpandedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const updateLeadStatus = (leadId: number, status: string) => {
    setLeadStatuses(prev => ({ ...prev, [leadId]: status }));
    // TODO: Save to backend when API is ready
  };

  // Server-side pagination
  const [totalLeads, setTotalLeads] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [formData, setFormData] = useState({
    client_mobile: '',
    requirement_name: '',
    preferences: {
      budget_min: '',
      budget_max: '',
      location: '',
      property_type: '',
      bedrooms: '',
      area_min: '',
      area_max: '',
      amenities: [] as string[],
      notes: ''
    }
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

  const fetchPocDetails = async (reraNumbers: string[]) => {
    if (reraNumbers.length === 0) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/lead-registration/poc-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rera_numbers: reraNumbers })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPocDataMap(prev => ({ ...prev, ...result.data }));
        }
      }
    } catch (err) {
      console.error('Error fetching POC details:', err);
    }
  };

  const fetchZohoLeadNames = async (mobileNumbers: string[]) => {
    if (mobileNumbers.length === 0) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/lead-registration/zoho-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_numbers: mobileNumbers })
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const result = JSON.parse(text);
          if (result.success && result.data && Object.keys(result.data).length > 0) {
            setZohoLeadNames(prev => ({ ...prev, ...result.data }));
          }
        } catch {
          // Silently ignore JSON parse errors - Zoho integration is optional
        }
      }
    } catch {
      // Silently ignore network errors - Zoho integration is optional
    }
  };

  const savePropertyRegistration = async (leadId: number, propertyKey: string, isChecked: boolean) => {
    try {
      setSavingPropertyKeys(prev => new Set(prev).add(propertyKey));

      // Here you would make an API call to save the registration status
      // For now, we'll just update the local state
      // TODO: Implement backend API endpoint to save registration status

      console.log(`${isChecked ? 'Registering' : 'Unregistering'} property ${propertyKey} for lead ${leadId}`);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isChecked) {
        setSavedPropertyKeys(prev => new Set(prev).add(propertyKey));
      } else {
        setSavedPropertyKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyKey);
          return newSet;
        });
      }

      setSavingPropertyKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyKey);
        return newSet;
      });

    } catch (err) {
      console.error('Error saving property registration:', err);
      setSavingPropertyKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(propertyKey);
        return newSet;
      });
    }
  };

  const togglePropertySelection = (propertyKey: string, leadId: number) => {
    setSelectedPropertyKeys(prev => {
      const newSet = new Set(prev);
      const isChecked = !newSet.has(propertyKey);

      if (isChecked) {
        if (newSet.size >= 5) {
          toast({
            title: 'Selection Limit Reached',
            description: 'You can select a maximum of 5 properties for the comparison report.',
            variant: 'destructive',
          });
          return prev;
        }
        newSet.add(propertyKey);
      } else {
        newSet.delete(propertyKey);
      }

      // Auto-save when checkbox is toggled
      savePropertyRegistration(leadId, propertyKey, isChecked);

      return newSet;
    });
  };

  const handleOpenReportModal = () => {
    if (selectedPropertyKeys.size < 2) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least 2 properties to generate a comparison report.',
        variant: 'destructive'
      });
      return;
    }
    
    // Extract lead IDs from selected property keys (format: leadId-propertyKey)
    const selectedLeadIds = new Set<number>();
    selectedPropertyKeys.forEach(key => {
      const leadId = parseInt(key.split('-')[0], 10);
      if (!isNaN(leadId)) {
        selectedLeadIds.add(leadId);
      }
    });
    
    // If all selected properties belong to the same lead, auto-fill lead info
    if (selectedLeadIds.size === 1) {
      const leadId = Array.from(selectedLeadIds)[0];
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setLeadName(lead.client_name || '');
        setLeadMobile(lead.client_mobile || '');
      } else {
        setLeadName('');
        setLeadMobile('');
      }
    } else {
      // Multiple leads selected, leave fields empty for manual entry
      setLeadName('');
      setLeadMobile('');
    }
    
    setLeadModalOpen(true);
  };

  const getSelectedPropertiesData = () => {
    const projects: any[] = [];
    const seenProjects = new Set<string>();

    // Use leads directly to get all selected properties regardless of search filter
    leads.forEach(lead => {
      const rawList = lead.shortlisted_properties ?? [];
      rawList.forEach(p => {
        const reraNumber = p.property?.rera_number || p.rera_number;
        const projectName = p.property?.projectname || p.projectname || p.propertyName;
        const builderName = p.property?.buildername || p.buildername;
        const key = reraNumber || projectName || '';

        if (key) {
          const propertyKey = `${lead.id}-${key}`;
          if (selectedPropertyKeys.has(propertyKey) && !seenProjects.has(key)) {
            seenProjects.add(key);
            const pocInfo = reraNumber ? pocDataMap[reraNumber] : null;
            projects.push({
              _id: key,
              projectName: projectName || 'N/A',
              builderName: builderName || 'N/A',
              RERA_Number: reraNumber || 'N/A',
              projectLocation: p.property?.projectlocation || 'N/A',
              pricePerSft: p.property?.price_per_sft || 0,
              possessionDate: p.property?.possession_date || 'N/A',
              Project_Type: pocInfo?.project_type || p.property?.project_type || p.property?.property_type || 'N/A',
              totalLandArea: p.property?.total_land_area || p.property?.totalLandArea || 'N/A',
              sizeRange: pocInfo?.size_range || p.property?.size_range || 'N/A',
              priceRange: pocInfo?.price_range || p.property?.price_range || 'N/A',
              GRID_Score: pocInfo?.grid_score || p.property?.grid_score || 'N/A',
              constructionStatus: p.property?.construction_status || 'N/A',
              areaname: pocInfo?.areaname || p.property?.areaname || '',
              city: pocInfo?.city || p.property?.city || '',
              state: pocInfo?.state || p.property?.state || '',
              number_of_towers: pocInfo?.number_of_towers || p.property?.number_of_towers || 'N/A',
              number_of_flats_per_floor: pocInfo?.number_of_flats_per_floor || p.property?.number_of_flats_per_floor || 'N/A',
              project_launch_date: pocInfo?.project_launch_date || p.property?.project_launch_date || 'N/A',
              floor_rise_charges: pocInfo?.floor_rise_charges || p.property?.floor_rise_charges || 'N/A',
              open_space: pocInfo?.open_space || p.property?.open_space || 'N/A',
              external_amenities: pocInfo?.external_amenities || p.property?.external_amenities || 'N/A',
              floor_rise_amount_per_floor: pocInfo?.floor_rise_amount_per_floor || p.property?.floor_rise_amount_per_floor || 'N/A',
              floor_rise_applicable_above_floor_no: pocInfo?.floor_rise_applicable_above_floor_no || p.property?.floor_rise_applicable_above_floor_no || 'N/A',
              facing_charges: pocInfo?.facing_charges || p.property?.facing_charges || 'N/A',
              preferential_location_charges: pocInfo?.preferential_location_charges || p.property?.preferential_location_charges || 'N/A',
              preferential_location_charges_conditions: pocInfo?.preferential_location_charges_conditions || p.property?.preferential_location_charges_conditions || 'N/A',
              no_of_passenger_lift: pocInfo?.no_of_passenger_lift || p.property?.no_of_passenger_lift || 'N/A',
              visitor_parking: pocInfo?.visitor_parking || p.property?.visitor_parking || 'N/A'
            });
          }
        }
      });
    });

    return projects;
  };

  const handleLeadInfoSubmit = async (name: string, mobile: string) => {
    if (selectedPropertyKeys.size === 0) {
      toast({
        title: 'No properties selected',
        description: 'Please select at least one property.',
        variant: 'destructive',
      });
      return;
    }

    console.log('Submitting lead info - Properties:', selectedPropertyKeys.size);

    setLeadName(name);
    setLeadMobile(mobile);
    setLeadModalOpen(false);

    // Generate and download PDF with all selected properties
    await generateAndDownloadPDF(name, mobile);

    // Clear selections after PDF is generated
    setSelectedPropertyKeys(new Set());
  };

  const generateAndDownloadPDF = async (leadName: string, leadMobile: string) => {
    try {
      const projectsToInclude = getSelectedPropertiesData();

      console.log('📄 Generating PDF - Projects to include:', projectsToInclude.length);
      console.log('📋 Projects data:', projectsToInclude);

      if (projectsToInclude.length === 0) {
        toast({
          title: 'No properties selected',
          description: 'Please select at least one property.',
          variant: 'destructive',
        });
        return;
      }

      // Call backend API to generate PDF
      console.log('🌐 Calling PDF API:', `${API_BASE_URL}/api/pdf/generate-pdf`);
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

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Lead_${leadName.replace(/\s/g, '_')}_${leadMobile}_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: 'Success!',
            description: `PDF generated successfully for ${projectsToInclude.length} project(s).`,
          });
        } else {
          // If response is not PDF, try to get error message
          const text = await response.text();
          console.error('Unexpected response type:', contentType, text);
          throw new Error('Server returned non-PDF response');
        }
      } else {
        // Try to get error message from response
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('PDF generation error:', errorData);
        } catch (e) {
          const text = await response.text();
          console.error('PDF generation error (non-JSON):', response.status, text);
          errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);

      let errorDetail = 'An unexpected error occurred.';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorDetail = 'Could not connect to the server. Please check if the backend is running and reachable.';
        console.warn('Network error detected. URL:', `${API_BASE_URL}/api/pdf/generate-pdf`);
      } else if (error instanceof Error) {
        errorDetail = error.message;
      }

      toast({
        title: 'Error generating PDF',
        description: errorDetail,
        variant: 'destructive',
      });
    }
  };

  const handleGenerateShareLink = async () => {
    if (selectedPropertyKeys.size < 2) {
      toast({
        title: 'Not enough properties',
        description: 'Please select at least 2 properties to generate a share link.',
        variant: 'destructive',
      });
      return;
    }

    // Extract lead info from selected properties
    const selectedLeadIds = new Set<number>();
    selectedPropertyKeys.forEach(key => {
      const leadId = parseInt(key.split('-')[0]);
      if (!isNaN(leadId)) selectedLeadIds.add(leadId);
    });

    let name = '';
    let mobile = '';
    
    if (selectedLeadIds.size === 1) {
      const leadId = Array.from(selectedLeadIds)[0];
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        name = lead.client_name || '';
        mobile = lead.client_mobile || '';
      }
    }

    if (!name || !mobile) {
      toast({
        title: 'Lead info required',
        description: 'Please use the Report button to enter lead details first.',
        variant: 'destructive',
      });
      setLeadModalOpen(true);
      return;
    }

    setGeneratingShareLink(true);
    
    try {
      // Get RERA numbers from selected properties
      const propertyReraNumbers: string[] = [];
      const seenReras = new Set<string>();
      
      leads.forEach(lead => {
        (lead.shortlisted_properties ?? []).forEach(p => {
          const reraNumber = p.property?.rera_number || p.rera_number;
          const projectName = p.property?.projectname || p.projectname || p.propertyName;
          const key = reraNumber || projectName || '';
          const propertyKey = `${lead.id}-${key}`;
          
          if (selectedPropertyKeys.has(propertyKey) && reraNumber && !seenReras.has(reraNumber)) {
            seenReras.add(reraNumber);
            propertyReraNumbers.push(reraNumber);
          }
        });
      });

      console.log('Generating share link for RERA numbers:', propertyReraNumbers);

      const response = await fetch(`${API_BASE_URL}/api/share/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: name,
          leadMobile: mobile,
          propertyReraNumbers,
          createdBy: agentData?.email || '',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShareLink(result.shareUrl);
        setShareLinkModalOpen(true);
        toast({
          title: 'Share link created!',
          description: 'You can now copy and share this link.',
        });
      } else {
        throw new Error(result.message || 'Failed to create share link');
      }
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: 'Error creating share link',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingShareLink(false);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareLinkCopied(true);
      setTimeout(() => setShareLinkCopied(false), 2000);
      toast({
        title: 'Copied!',
        description: 'Share link copied to clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy the link manually.',
        variant: 'destructive',
      });
    }
  };

  const getAllPropertyKeys = () => {
    const keys: string[] = [];
    filteredLeads.forEach(lead => {
      const rawList = lead.shortlisted_properties ?? [];
      const seen = new Set<string>();
      rawList.forEach(p => {
        const reraNumber = p.property?.rera_number || p.rera_number;
        const projectName = p.property?.projectname || p.projectname || p.propertyName;
        const key = reraNumber || projectName || '';
        if (key && !seen.has(key)) {
          seen.add(key);
          keys.push(`${lead.id}-${key}`);
        }
      });
    });
    return keys;
  };

  const toggleSelectAll = () => {
    const allKeys = getAllPropertyKeys();
    if (selectedPropertyKeys.size === allKeys.length && allKeys.length > 0) {
      setSelectedPropertyKeys(new Set());
    } else {
      setSelectedPropertyKeys(new Set(allKeys));
    }
  };

  // Fetch leads with server-side pagination (only one page at a time)
  const fetchLeads = async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching leads page ${page}...`);
      
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/lead-registration?${params}`, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.statusText}`);
      }

      const data = await response.json();
      const pageLeads = data.data || [];
      
      setLeads(pageLeads);
      setTotalLeads(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setCurrentPage(page);
      
      console.log(`✅ Loaded ${pageLeads.length} leads (page ${page} of ${data.pagination?.totalPages})`);

      // Fetch related data for current page only
      const reraNumbers: string[] = [];
      const mobileNumbers: string[] = [];
      pageLeads.forEach((lead: ClientRequirement) => {
        if (lead.client_mobile && !mobileNumbers.includes(lead.client_mobile)) {
          mobileNumbers.push(lead.client_mobile);
        }
        const shortlisted = lead.shortlisted_properties ?? [];
        shortlisted.forEach((prop: ShortlistedProperty) => {
          const reraNumber = prop.property?.rera_number || prop.rera_number;
          if (reraNumber && !reraNumbers.includes(reraNumber)) {
            reraNumbers.push(reraNumber);
          }
        });
      });

      if (reraNumbers.length > 0) {
        fetchPocDetails(reraNumbers);
      }
      if (mobileNumbers.length > 0) {
        fetchZohoLeadNames(mobileNumbers);
      }

    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred while fetching leads.';
      setError(errorMessage);
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1, searchTerm);
  }, []);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchLeads(newPage, searchTerm);
    }
  };

  // Handle search with debounce
  const handleSearch = () => {
    setCurrentPage(1);
    fetchLeads(1, searchTerm);
  };



  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('preferences.')) {
      const prefField = field.replace('preferences.', '');
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_mobile) {
      alert('Client mobile number is required');
      return;
    }

    try {
      const payload = {
        client_mobile: formData.client_mobile,
        requirement_name: formData.requirement_name,
        preferences: {
          budget_min: formData.preferences.budget_min ? parseFloat(formData.preferences.budget_min) : null,
          budget_max: formData.preferences.budget_max ? parseFloat(formData.preferences.budget_max) : null,
          location: formData.preferences.location,
          property_type: formData.preferences.property_type,
          bedrooms: formData.preferences.bedrooms,
          area_min: formData.preferences.area_min ? parseFloat(formData.preferences.area_min) : null,
          area_max: formData.preferences.area_max ? parseFloat(formData.preferences.area_max) : null,
          notes: formData.preferences.notes
        }
      };

      const url = editingLead
        ? `${API_BASE_URL}/api/lead-registration/${editingLead.id}`
        : `${API_BASE_URL}/api/lead-registration`;

      const method = editingLead ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save lead');
      }

      alert(editingLead ? 'Lead updated successfully!' : 'Lead created successfully!');
      resetForm();
      fetchLeads(currentPage, searchTerm); // Refresh current page
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      console.error('Error saving lead:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead registration?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/lead-registration/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      alert('Lead deleted successfully!');
      fetchLeads(currentPage, searchTerm); // Refresh current page
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      console.error('Error deleting lead:', err);
    }
  };

  const handleEdit = (lead: ClientRequirement) => {
    setEditingLead(lead);
    setFormData({
      client_mobile: lead.client_mobile,
      requirement_name: lead.requirement_name || '',
      preferences: {
        budget_min: lead.preferences?.budget_min?.toString() || '',
        budget_max: lead.preferences?.budget_max?.toString() || '',
        location: lead.preferences?.location || '',
        property_type: lead.preferences?.property_type || '',
        bedrooms: lead.preferences?.bedrooms || '',
        area_min: lead.preferences?.area_min?.toString() || '',
        area_max: lead.preferences?.area_max?.toString() || '',
        amenities: lead.preferences?.amenities || [],
        notes: lead.preferences?.notes || ''
      }
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setFormData({
      client_mobile: '',
      requirement_name: '',
      preferences: {
        budget_min: '',
        budget_max: '',
        location: '',
        property_type: '',
        bedrooms: '',
        area_min: '',
        area_max: '',
        amenities: [],
        notes: ''
      }
    });
    setEditingLead(null);
    setIsCreating(false);
  };

  // Server-side search - leads are already filtered
  const filteredLeads = leads;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `${(min / 100000).toFixed(1)}L - ${(max / 100000).toFixed(1)}L`;
    if (min) return `Min: ${(min / 100000).toFixed(1)}L`;
    if (max) return `Max: ${(max / 100000).toFixed(1)}L`;
    return 'Not specified';
  };

  if (viewingLead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Lead Details</h2>
          <Button variant="outline" onClick={() => setViewingLead(null)}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Requirement #{viewingLead.requirement_number}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Client Mobile</Label>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {viewingLead.client_mobile}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Requirement Name</Label>
                <p className="font-medium">{viewingLead.requirement_name || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-gray-500">Created At</Label>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(viewingLead.created_at)}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Last Updated</Label>
                <p className="font-medium">{formatDate(viewingLead.updated_at)}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Budget Range</Label>
                  <p className="font-medium">
                    {formatBudget(viewingLead.preferences?.budget_min, viewingLead.preferences?.budget_max)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Location</Label>
                  <p className="font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {viewingLead.preferences?.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Property Type</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {viewingLead.preferences?.property_type || 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Bedrooms</Label>
                  <p className="font-medium">{viewingLead.preferences?.bedrooms || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Area Range (sq ft)</Label>
                  <p className="font-medium">
                    {viewingLead.preferences?.area_min || viewingLead.preferences?.area_max
                      ? `${viewingLead.preferences?.area_min || 0} - ${viewingLead.preferences?.area_max || '...'} sq ft`
                      : 'Not specified'}
                  </p>
                </div>
              </div>
              {viewingLead.preferences?.notes && (
                <div className="mt-4">
                  <Label className="text-gray-500">Additional Notes</Label>
                  <p className="font-medium bg-gray-50 p-3 rounded-lg mt-1">
                    {viewingLead.preferences.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {viewingLead.matched_properties?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Matched Properties</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {viewingLead.shortlisted_properties?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Shortlisted</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {viewingLead.site_visits?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Site Visits</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => handleEdit(viewingLead)} variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={() => {
                  handleDelete(viewingLead.id);
                  setViewingLead(null);
                }}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingLead ? 'Edit Lead Registration' : 'New Lead Registration'}
          </h2>
          <Button variant="outline" onClick={resetForm}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_mobile">Client Mobile *</Label>
                  <Input
                    id="client_mobile"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.client_mobile}
                    onChange={(e) => handleInputChange('client_mobile', e.target.value)}
                    disabled={!!editingLead}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="requirement_name">Requirement Name</Label>
                  <Input
                    id="requirement_name"
                    placeholder="e.g., Primary Home Search"
                    value={formData.requirement_name}
                    onChange={(e) => handleInputChange('requirement_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget_min">Budget Min (in Rs)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      placeholder="e.g., 5000000"
                      value={formData.preferences.budget_min}
                      onChange={(e) => handleInputChange('preferences.budget_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_max">Budget Max (in Rs)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="e.g., 10000000"
                      value={formData.preferences.budget_max}
                      onChange={(e) => handleInputChange('preferences.budget_max', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Preferred Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Whitefield, Bangalore"
                      value={formData.preferences.location}
                      onChange={(e) => handleInputChange('preferences.location', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <select
                      id="property_type"
                      className="w-full p-2 border rounded-md"
                      value={formData.preferences.property_type}
                      onChange={(e) => handleInputChange('preferences.property_type', e.target.value)}
                    >
                      <option value="">Select type</option>
                      <option value="Apartment">Apartment</option>
                      <option value="Villa">Villa</option>
                      <option value="Plot">Plot</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Row House">Row House</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <select
                      id="bedrooms"
                      className="w-full p-2 border rounded-md"
                      value={formData.preferences.bedrooms}
                      onChange={(e) => handleInputChange('preferences.bedrooms', e.target.value)}
                    >
                      <option value="">Select bedrooms</option>
                      <option value="1 BHK">1 BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="2.5 BHK">2.5 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="3.5 BHK">3.5 BHK</option>
                      <option value="4 BHK">4 BHK</option>
                      <option value="4+ BHK">4+ BHK</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="area_min">Min Area (sq ft)</Label>
                    <Input
                      id="area_min"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.preferences.area_min}
                      onChange={(e) => handleInputChange('preferences.area_min', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="area_max">Max Area (sq ft)</Label>
                    <Input
                      id="area_max"
                      type="number"
                      placeholder="e.g., 2000"
                      value={formData.preferences.area_max}
                      onChange={(e) => handleInputChange('preferences.area_max', e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional requirements or notes..."
                    value={formData.preferences.notes}
                    onChange={(e) => handleInputChange('preferences.notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {editingLead ? 'Update Lead' : 'Create Lead'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Lead Registrations</h2>
          <p className="text-gray-500 text-sm">View leads with their shortlisted properties</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by mobile, name..."
              className="pl-10 w-56 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              data-testid="input-search-leads"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch} disabled={loading} data-testid="button-search">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchLeads(currentPage, searchTerm)} disabled={loading} data-testid="button-refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="button-new-lead">
            <Plus className="w-4 h-4 mr-1" />
            New Lead
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading leads...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 mb-3">{error}</p>
          <Button onClick={() => fetchLeads(1, searchTerm)} variant="outline">
            Try Again
          </Button>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">
              {searchTerm ? 'No leads found' : 'No lead registrations yet'}
            </p>
          </div>
        </div>
      ) : (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="overflow-auto h-full">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b sticky top-0 z-10">
                  <tr>
                    <th className="w-8 px-2"></th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Lead Name</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Mobile</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Properties</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeads.map((lead) => {
                    const rawShortlistedList = lead.shortlisted_properties ?? [];

                    const seenReraNumbers = new Set<string>();
                    const shortlistedList = rawShortlistedList.filter((property) => {
                      const reraNumber = property.property?.rera_number || property.rera_number;
                      const projectName = property.property?.projectname || property.projectname || property.propertyName;
                      const key = reraNumber || projectName || '';
                      if (!key || seenReraNumbers.has(key)) {
                        return false;
                      }
                      seenReraNumbers.add(key);
                      return true;
                    });

                    if (shortlistedList.length === 0) {
                      return null;
                    }

                    const isExpanded = expandedLeads.has(lead.id);

                    return (
                      <React.Fragment key={lead.id}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleLeadExpansion(lead.id)}
                          data-testid={`row-lead-${lead.id}`}
                        >
                          <td className="px-2 py-3 text-gray-500">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-400 italic text-sm">
                            {/* Empty until Zoho connected */}
                          </td>
                          <td className="px-3 py-3 text-gray-900 font-medium">
                            {lead.client_mobile}
                          </td>
                          <td className="px-3 py-3 text-gray-600">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                              {shortlistedList.length} {shortlistedList.length === 1 ? 'property' : 'properties'}
                            </span>
                          </td>
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={leadStatuses[lead.id] || 'yet_to_be_done'}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                              className={`text-xs font-medium px-2 py-1 rounded-md border-0 cursor-pointer ${
                                STATUS_OPTIONS.find(s => s.value === (leadStatuses[lead.id] || 'yet_to_be_done'))?.color || 'bg-gray-100 text-gray-700'
                              }`}
                              data-testid={`select-status-${lead.id}`}
                            >
                              {STATUS_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <div className="bg-gray-50 border-t border-b">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="w-8 px-2"></th>
                                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Project Name</th>
                                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">Builder Name</th>
                                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">RERA Number</th>
                                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">POC Name</th>
                                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">POC Contact</th>
                                      <th className="text-left px-3 py-2 font-medium text-gray-600 text-xs uppercase">POC Role</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {shortlistedList.map((property, propIndex) => {
                                      const reraNumber = property.property?.rera_number || property.rera_number;
                                      const projectName = property.property?.projectname || property.projectname || property.propertyName;
                                      const builderName = property.property?.buildername || property.buildername;
                                      const pocInfo = reraNumber ? pocDataMap[reraNumber] : null;
                                      const propertyKey = `${lead.id}-${reraNumber || projectName || propIndex}`;

                                      return (
                                        <tr key={`${lead.id}-${propIndex}`} className="hover:bg-gray-100 border-t border-gray-200">
                                          <td className="text-center px-2 py-2">
                                            <div className="flex items-center justify-center gap-1">
                                              <input
                                                type="checkbox"
                                                checked={selectedPropertyKeys.has(propertyKey)}
                                                onChange={() => togglePropertySelection(propertyKey, lead.id)}
                                                disabled={savingPropertyKeys.has(propertyKey)}
                                                className="w-4 h-4 rounded border-gray-300"
                                                data-testid={`checkbox-property-${propertyKey}`}
                                              />
                                              {savingPropertyKeys.has(propertyKey) && (
                                                <span className="text-xs text-blue-600">...</span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 text-gray-900 font-medium">
                                            {projectName || 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700">
                                            {builderName || 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 font-mono text-gray-600 text-xs">
                                            {reraNumber || 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700">
                                            {pocInfo?.poc_name || 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700">
                                            {pocInfo?.poc_contact || 'N/A'}
                                          </td>
                                          <td className="px-3 py-2 text-gray-700">
                                            {pocInfo?.poc_role || 'N/A'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <div className="px-4 py-3 border-t bg-gray-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600 font-medium flex items-center gap-3">
              <span>Page {currentPage} of {totalPages} ({totalLeads} total leads)</span>
              {selectedPropertyKeys.size > 0 && (
                <span className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {selectedPropertyKeys.size} Selected
                  </span>
                  {selectedPropertyKeys.size < 2 ? "(Select 2-5)" : "(Ready)"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  data-testid="button-first-page"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  data-testid="button-prev-page"
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  data-testid="button-last-page"
                >
                  Last
                </Button>
              </div>
              {selectedPropertyKeys.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPropertyKeys(new Set())}
                  className="text-gray-500"
                >
                  Clear
                </Button>
              )}
              <Button
                onClick={handleOpenReportModal}
                disabled={selectedPropertyKeys.size < 2}
                className={`${selectedPropertyKeys.size >= 2 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'} text-white`}
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Report ({selectedPropertyKeys.size})
              </Button>
              <Button
                onClick={handleGenerateShareLink}
                disabled={selectedPropertyKeys.size < 2 || generatingShareLink}
                className={`${selectedPropertyKeys.size >= 2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'} text-white`}
                size="sm"
                data-testid="button-share-link"
              >
                {generatingShareLink ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Link className="w-4 h-4 mr-2" />
                )}
                Share Link
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      <Dialog open={shareLinkModalOpen} onOpenChange={setShareLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Property Comparison</DialogTitle>
            <DialogDescription>
              Share this link with your client to view the property comparison.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Input
              value={shareLink}
              readOnly
              className="flex-1"
              data-testid="input-share-link"
            />
            <Button
              onClick={copyShareLink}
              size="icon"
              variant="outline"
              data-testid="button-copy-link"
            >
              {shareLinkCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            This link will show all {selectedPropertyKeys.size} selected properties with comparison details.
          </div>
        </DialogContent>
      </Dialog>
      
      <LeadInfoModal
        open={leadModalOpen}
        onClose={() => {
          setLeadModalOpen(false);
          // Keep selections when modal is closed - user can try again
        }}
        onSubmit={handleLeadInfoSubmit}
        initialName={leadName}
        initialMobile={leadMobile}
        projectName={`${selectedPropertyKeys.size} Selected Properties`}
      />
    </div>
  );
};

export default LeadRegistration;
