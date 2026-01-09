import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';

interface BuilderDataType {
  id: number;
  rera_builder_name: string | null;
  standard_builder_name: string | null;
  builder_age: string | null;
  builder_total_properties: string | null;
  builder_upcoming_properties: string | null;
  builder_completed_properties: string | null;
  builder_ongoing_projects: string | null;
  builder_origin_city: string | null;
  builder_operating_locations: string | null;
  previous_complaints_on_builder: string | null;
  project_names: string[] | null;
  rera_numbers: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProjectDisplayType {
  builder_id: number;
  builder_name: string;
  project_name: string;
  rera_number: string;
  index: number; // Index in the builder's array
}

interface BuilderFormData {
  id: number | null;
  rera_builder_name: string;
  standard_builder_name: string;
  builder_age: string;
  builder_total_properties: string;
  builder_upcoming_properties: string;
  builder_completed_properties: string;
  builder_ongoing_projects: string;
  builder_origin_city: string;
  builder_operating_locations: string;
  previous_complaints_on_builder: string;
}

interface ProjectFormData {
  builder_id: string;
  project_name: string;
  rera_number: string;
  isEdit: boolean;
  originalIndex?: number;
}

const initialBuilderFormData: BuilderFormData = {
  id: null,
  rera_builder_name: '',
  standard_builder_name: '',
  builder_age: '',
  builder_total_properties: '',
  builder_upcoming_properties: '',
  builder_completed_properties: '',
  builder_ongoing_projects: '',
  builder_origin_city: '',
  builder_operating_locations: '',
  previous_complaints_on_builder: '',
};

const initialProjectFormData: ProjectFormData = {
  builder_id: '',
  project_name: '',
  rera_number: '',
  isEdit: false,
};

interface BuilderDataProps {
  view?: 'builders' | 'projects';
}

const BuilderData: React.FC<BuilderDataProps> = ({ view = 'builders' }) => {
  const navigate = useNavigate();
  const [builders, setBuilders] = useState<BuilderDataType[]>([]);
  const [unverifiedProjects, setUnverifiedProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Builder Form State
  const [isBuilderFormOpen, setIsBuilderFormOpen] = useState(false);
  const [builderFormData, setBuilderFormData] = useState<BuilderFormData>(initialBuilderFormData);
  const [isBuilderEditMode, setIsBuilderEditMode] = useState(false);

  // Project Form State
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectFormData, setProjectFormData] = useState<ProjectFormData>(initialProjectFormData);

  // Delete Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'builder' | 'project'; id: number; index?: number } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const getAuthHeaders = useCallback(() => {
    const authData = localStorage.getItem('authData');
    if (!authData) return null;
    const { userData } = JSON.parse(authData);
    return {
      'Content-Type': 'application/json',
      'x-user-email': userData.email,
      'x-user-id': userData.id.toString(),
    };
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('authData');
    setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
    setTimeout(() => navigate('/admin'), 2000);
  }, [navigate]);

  const fetchBuilders = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/builder-data`, { headers });
      if (response.status === 401 || response.status === 403) return handleAuthError();
      const data = await response.json();
      setBuilders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, getAuthHeaders, handleAuthError]);

  const fetchUnverifiedProjects = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/properties`, { headers });
      const data = await response.json();
      if (data.success) {
        setUnverifiedProjects(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching unverified projects:', err);
    }
  }, [API_BASE_URL, getAuthHeaders]);

  useEffect(() => {
    fetchBuilders();
    fetchUnverifiedProjects();
  }, [fetchBuilders, fetchUnverifiedProjects]);

  // Flatten projects and combine with Unverified_Properties
  const allProjects = useMemo(() => {
    const projectsMap = new Map<string, ProjectDisplayType>();

    // 1. Process projects from builder_data arrays (Legacy/Master)
    builders.forEach(builder => {
      const names = builder.project_names || [];
      const reras = builder.rera_numbers || [];
      names.forEach((name, i) => {
        const rera = (reras[i] || '').trim();
        if (name || rera) {
          const key = rera || `${builder.id}-${name}`;
          projectsMap.set(key, {
            builder_id: builder.id,
            builder_name: builder.standard_builder_name || builder.rera_builder_name || 'Unknown',
            project_name: name,
            rera_number: rera,
            index: i
          });
        }
      });
    });

    // 2. Process projects from Unverified_Properties (Direct Rows)
    unverifiedProjects.forEach(p => {
      const rera = (p.rera_number || '').trim();
      if (rera) {
        // Find builder ID if possible
        const builder = builders.find(b =>
          (b.standard_builder_name && b.standard_builder_name === p.buildername) ||
          (b.rera_builder_name && b.rera_builder_name === p.buildername)
        );

        projectsMap.set(rera, {
          builder_id: builder?.id || 0,
          builder_name: p.buildername || 'Unknown',
          project_name: p.projectname,
          rera_number: rera,
          index: -1 // Indicates it's a direct row, not in array
        });
      }
    });

    return Array.from(projectsMap.values());
  }, [builders, unverifiedProjects]);

  // --- Handlers ---

  const handleOpenBuilderForm = (builder?: BuilderDataType) => {
    if (builder) {
      setBuilderFormData({
        id: builder.id,
        rera_builder_name: builder.rera_builder_name || '',
        standard_builder_name: builder.standard_builder_name || '',
        builder_age: builder.builder_age || '',
        builder_total_properties: builder.builder_total_properties || '',
        builder_upcoming_properties: builder.builder_upcoming_properties || '',
        builder_completed_properties: builder.builder_completed_properties || '',
        builder_ongoing_projects: builder.builder_ongoing_projects || '',
        builder_origin_city: builder.builder_origin_city || '',
        builder_operating_locations: builder.builder_operating_locations || '',
        previous_complaints_on_builder: builder.previous_complaints_on_builder || '',
      });
      setIsBuilderEditMode(true);
    } else {
      setBuilderFormData(initialBuilderFormData);
      setIsBuilderEditMode(false);
    }
    setIsBuilderFormOpen(true);
  };

  const handleOpenProjectForm = (project?: ProjectDisplayType) => {
    if (project) {
      setProjectFormData({
        builder_id: project.builder_id.toString(),
        project_name: project.project_name,
        rera_number: project.rera_number,
        isEdit: true,
        originalIndex: project.index
      });
    } else {
      setProjectFormData(initialProjectFormData);
    }
    setIsProjectFormOpen(true);
  };

  const handleSubmitBuilder = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    try {
      setIsSubmitting(true);
      const url = isBuilderEditMode ? `${API_BASE_URL}/api/builder-data/${builderFormData.id}` : `${API_BASE_URL}/api/builder-data`;
      const method = isBuilderEditMode ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(builderFormData)
      });
      if (!response.ok) throw new Error('Failed to save builder');
      await fetchBuilders();
      setIsBuilderFormOpen(false);
      setMessage({ type: 'success', text: `Builder ${isBuilderEditMode ? 'updated' : 'created'} successfully` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving builder' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProject = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    const builder = builders.find(b => b.id === parseInt(projectFormData.builder_id));
    if (!builder) return;

    // Prepare data to save in Unverified_Properties
    const apiPayload: any = {
      ProjectName: projectFormData.project_name,
      BuilderName: builder.standard_builder_name || builder.rera_builder_name || 'Unknown Builder',
      RERA_Number: projectFormData.rera_number,
      UserEmail: (JSON.parse(localStorage.getItem('authData') || '{}').userData?.email) || 'system@relai.world',

      // Mandatory fields for Unverified_Properties (reverted to non-null defaults per DB constraints)
      Project_Type: '',
      CommunityType: '',
      Construction_Status: '',
      Construction_Material: '',
      Number_of_Towers: 0,
      Number_of_Floors: 0,
      Number_of_Flats_Per_Floor: 0,
      Total_Number_of_Units: 0,
      PowerBackup: '',
      Visitor_Parking: '',
      Ground_vehicle_Movement: '',

      // Pre-fill builder info from master list
      Builder_Origin_City: builder.builder_origin_city,
      Builder_Age: builder.builder_age,
      Builder_Total_Properties: builder.builder_total_properties,
      Builder_Upcoming_Properties: builder.builder_upcoming_properties,
      Builder_Completed_Properties: builder.builder_completed_properties,
      Builder_Ongoing_Projects: builder.builder_ongoing_projects,
      Builder_Operating_Locations: builder.builder_operating_locations,
      Previous_Complaints_on_Builder: builder.previous_complaints_on_builder || 'no',

      status: 'Unverified'
    };

    try {
      setIsSubmitting(true);
      // Save directly to Unverified_Properties table instead of builder_data arrays
      const response = await fetch(`${API_BASE_URL}/api/properties/save`, {
        method: 'POST',
        headers: {
          ...headers
        },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save project');
      }

      await fetchUnverifiedProjects();
      setIsProjectFormOpen(false);
      setMessage({ type: 'success', text: `Project ${projectFormData.isEdit ? 'updated' : 'added'} successfully in Unverified Projects` });
    } catch (err: any) {
      console.error('Error saving project:', err);
      setMessage({ type: 'error', text: err.message || 'Error saving project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
      if (itemToDelete.type === 'builder') {
        await fetch(`${API_BASE_URL}/api/builder-data/${itemToDelete.id}`, { method: 'DELETE', headers });
      } else {
        const builder = builders.find(b => b.id === itemToDelete.id);
        if (builder && itemToDelete.index !== undefined) {
          const project_names = builder.project_names?.filter((_, i) => i !== itemToDelete.index) || [];
          const rera_numbers = builder.rera_numbers?.filter((_, i) => i !== itemToDelete.index) || [];
          await fetch(`${API_BASE_URL}/api/builder-data/${builder.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ project_names, rera_numbers })
          });
        }
      }
      await fetchBuilders();
      setIsDeleteDialogOpen(false);
      setMessage({ type: 'success', text: 'Deleted successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting item' });
    }
  };

  const filteredBuilders = builders.filter(b =>
    b.standard_builder_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.rera_builder_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = allProjects.filter(p =>
    p.project_name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    p.builder_name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
    p.rera_number.toLowerCase().includes(projectSearchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {message && (
        <div className={`p-4 rounded-lg fixed top-4 right-4 z-50 shadow-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* --- Builder Section --- */}
      {view === 'builders' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Builder Data</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search builders..." className="pl-9 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Button onClick={() => handleOpenBuilderForm()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> Add Builder
              </Button>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Standard Name</TableHead>
                  <TableHead className="whitespace-nowrap">RERA Name</TableHead>
                  <TableHead className="whitespace-nowrap">Origin City</TableHead>
                  <TableHead className="whitespace-nowrap">Age</TableHead>
                  <TableHead className="whitespace-nowrap">Total Props</TableHead>
                  <TableHead className="whitespace-nowrap">Upcoming</TableHead>
                  <TableHead className="whitespace-nowrap">Completed</TableHead>
                  <TableHead className="whitespace-nowrap">Ongoing</TableHead>
                  <TableHead className="whitespace-nowrap">Operating Locations</TableHead>
                  <TableHead className="whitespace-nowrap">Complaints</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={11} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" /></TableCell></TableRow>
                ) : filteredBuilders.map(builder => (
                  <TableRow key={builder.id}>
                    <TableCell className="font-medium whitespace-nowrap">{builder.standard_builder_name || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.rera_builder_name || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_origin_city || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_age || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_total_properties || '0'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_upcoming_properties || '0'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_completed_properties || '0'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_ongoing_projects || '0'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{builder.builder_operating_locations || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{builder.previous_complaints_on_builder || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenBuilderForm(builder)} className="text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: 'builder', id: builder.id }); setIsDeleteDialogOpen(true); }} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* --- Projects Section --- */}
      {view === 'projects' && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Projects Data</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search projects..." className="pl-9 w-64" value={projectSearchTerm} onChange={e => setProjectSearchTerm(e.target.value)} />
              </div>
              <Button onClick={() => handleOpenProjectForm()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" /> Add Project
              </Button>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Builder Name</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>RERA Number</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project, i) => (
                  <TableRow key={`${project.builder_id}-${project.index}-${project.rera_number}-${i}`}>
                    <TableCell className="font-medium">{project.builder_name}</TableCell>
                    <TableCell>{project.project_name}</TableCell>
                    <TableCell className="font-mono text-xs">{project.rera_number}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenProjectForm(project)} className="text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setItemToDelete({ type: 'project', id: project.builder_id, index: project.index }); setIsDeleteDialogOpen(true); }} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* --- Builder Modal --- */}
      <Dialog open={isBuilderFormOpen} onOpenChange={setIsBuilderFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isBuilderEditMode ? 'Edit' : 'Add'} Builder</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>RERA Builder Name</Label>
              <Input value={builderFormData.rera_builder_name} onChange={e => setBuilderFormData({ ...builderFormData, rera_builder_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Standard Builder Name</Label>
              <Input value={builderFormData.standard_builder_name} onChange={e => setBuilderFormData({ ...builderFormData, standard_builder_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Origin City</Label>
              <Input value={builderFormData.builder_origin_city} onChange={e => setBuilderFormData({ ...builderFormData, builder_origin_city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Builder Age</Label>
              <Input value={builderFormData.builder_age} onChange={e => setBuilderFormData({ ...builderFormData, builder_age: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Total Properties</Label>
              <Input value={builderFormData.builder_total_properties} onChange={e => setBuilderFormData({ ...builderFormData, builder_total_properties: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Upcoming Properties</Label>
              <Input value={builderFormData.builder_upcoming_properties} onChange={e => setBuilderFormData({ ...builderFormData, builder_upcoming_properties: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Completed Properties</Label>
              <Input value={builderFormData.builder_completed_properties} onChange={e => setBuilderFormData({ ...builderFormData, builder_completed_properties: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ongoing Projects</Label>
              <Input value={builderFormData.builder_ongoing_projects} onChange={e => setBuilderFormData({ ...builderFormData, builder_ongoing_projects: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Operating Locations</Label>
              <Input value={builderFormData.builder_operating_locations} onChange={e => setBuilderFormData({ ...builderFormData, builder_operating_locations: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Previous Complaints on Builder</Label>
              <Textarea value={builderFormData.previous_complaints_on_builder} onChange={e => setBuilderFormData({ ...builderFormData, previous_complaints_on_builder: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuilderFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitBuilder} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 min-w-[100px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Project Modal --- */}
      <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{projectFormData.isEdit ? 'Edit' : 'Add'} Project</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Builder</Label>
              <Select value={projectFormData.builder_id} onValueChange={val => setProjectFormData({ ...projectFormData, builder_id: val })} disabled={projectFormData.isEdit}>
                <SelectTrigger><SelectValue placeholder="Choose a builder" /></SelectTrigger>
                <SelectContent>
                  {builders.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.rera_builder_name || b.standard_builder_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input value={projectFormData.project_name} onChange={e => setProjectFormData({ ...projectFormData, project_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>RERA Number</Label>
              <Input value={projectFormData.rera_number} onChange={e => setProjectFormData({ ...projectFormData, rera_number: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjectFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitProject} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 min-w-[100px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Delete AlertDialog --- */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the selected {itemToDelete?.type}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BuilderData;
