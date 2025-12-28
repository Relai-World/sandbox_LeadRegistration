import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';

interface BuilderDataType {
  id: number;
  rera_number: string | null;
  rera_builder_name: string | null;
  standard_builder_name: string | null;
  project_name: string | null;
  builder_age: string | null;
  builder_total_properties: string | null;
  builder_upcoming_properties: string | null;
  builder_completed_properties: string | null;
  builder_ongoing_projects: string | null;
  builder_origin_city: string | null;
  builder_operating_locations: string | null;
  previous_complaints_on_builder: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
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
  project_name: string;
  rera_number: string;
}

const initialFormData: FormData = {
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
  project_name: '',
  rera_number: '',
};

const BuilderData: React.FC = () => {
  const navigate = useNavigate();
  const [builders, setBuilders] = useState<BuilderDataType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [builderToDelete, setBuilderToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  const getAuthHeaders = useCallback((): Record<string, string> | null => {
    try {
      const storedAuth = localStorage.getItem('authData');
      if (!storedAuth) {
        return null;
      }
      
      const authData = JSON.parse(storedAuth);
      if (!authData.isAuthenticated || !authData.userData) {
        return null;
      }
      
      const { email, id } = authData.userData;
      if (!email || !id) {
        return null;
      }
      
      return {
        'Content-Type': 'application/json',
        'x-user-email': email,
        'x-user-id': id.toString(),
      };
    } catch (error) {
      console.error('Error parsing auth data:', error);
      return null;
    }
  }, []);

  const handleAuthError = useCallback(() => {
    localStorage.removeItem('authData');
    setMessage({ type: 'error', text: 'Session expired. Please log in again.' });
    setTimeout(() => {
      navigate('/admin');
    }, 2000);
  }, [navigate]);


  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleOpenForm = (builder?: BuilderDataType) => {
    if (builder) {
      setFormData({
        id: builder.id,
        rera_number: builder.rera_number || '',
        rera_builder_name: builder.rera_builder_name || '',
        standard_builder_name: builder.standard_builder_name || '',
        project_name: builder.project_name || '',
        builder_age: builder.builder_age || '',
        builder_total_properties: builder.builder_total_properties || '',
        builder_upcoming_properties: builder.builder_upcoming_properties || '',
        builder_completed_properties: builder.builder_completed_properties || '',
        builder_ongoing_projects: builder.builder_ongoing_projects || '',
        builder_origin_city: builder.builder_origin_city || '',
        builder_operating_locations: builder.builder_operating_locations || '',
        previous_complaints_on_builder: builder.previous_complaints_on_builder || '',
      });
      setIsEditMode(true);
    } else {
      setFormData(initialFormData);
      setIsEditMode(false);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData(initialFormData);
    setIsEditMode(false);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.rera_number.trim()) {
      setMessage({ type: 'error', text: 'RERA Number is required' });
      return;
    }

    if (!formData.rera_builder_name.trim()) {
      setMessage({ type: 'error', text: 'RERA Builder Name is required' });
      return;
    }

    if (!formData.standard_builder_name.trim()) {
      setMessage({ type: 'error', text: 'Builder Name is required' });
      return;
    }

    if (!formData.project_name.trim()) {
      setMessage({ type: 'error', text: 'Project Name is required' });
      return;
    }

    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      handleAuthError();
      return;
    }

    try {
      setIsSubmitting(true);
      
      const url = isEditMode 
        ? `${API_BASE_URL}/api/builder-data/${formData.id}`
        : `${API_BASE_URL}/api/builder-data`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: authHeaders,
        credentials: 'include',
        body: JSON.stringify({
          rera_builder_name: formData.rera_builder_name,
          standard_builder_name: formData.standard_builder_name,
          builder_age: formData.builder_age || null,
          builder_total_properties: formData.builder_total_properties || null,
          builder_upcoming_properties: formData.builder_upcoming_properties || null,
          builder_completed_properties: formData.builder_completed_properties || null,
          builder_ongoing_projects: formData.builder_ongoing_projects || null,
          builder_origin_city: formData.builder_origin_city || null,
          builder_operating_locations: formData.builder_operating_locations || null,
          previous_complaints_on_builder: formData.previous_complaints_on_builder || null,
          project_name: formData.project_name || null,
          rera_number: formData.rera_number || null,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save builder');
      }

      const result = await response.json();
      
      if (isEditMode) {
        setBuilders(prev => prev.map(b => 
          b.id === formData.id ? { 
            ...b, 
            ...result.data,
            rera_number: formData.rera_number,
            project_name: formData.project_name
          } : b
        ));
      } else {
        if (result.data) {
          const newBuilder: BuilderDataType = {
            ...result.data,
            rera_number: formData.rera_number,
            project_name: formData.project_name
          };
          setBuilders(prev => [newBuilder, ...prev]);
        }
      }

      setMessage({ 
        type: 'success', 
        text: isEditMode ? 'Builder updated successfully' : 'Builder created successfully' 
      });
      handleCloseForm();
    } catch (error) {
      console.error('Error saving builder:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save builder' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setBuilderToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!builderToDelete) return;

    const authHeaders = getAuthHeaders();
    if (!authHeaders) {
      handleAuthError();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/builder-data/${builderToDelete}`, {
        method: 'DELETE',
        headers: authHeaders,
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        handleAuthError();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete builder');
      }

      setBuilders(prev => prev.filter(b => b.id !== builderToDelete));
      setMessage({ type: 'success', text: 'Builder deleted successfully' });
    } catch (error) {
      console.error('Error deleting builder:', error);
      setMessage({ type: 'error', text: 'Failed to delete builder' });
    } finally {
      setIsDeleteDialogOpen(false);
      setBuilderToDelete(null);
    }
  };

  const filteredBuilders = builders.filter(builder => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (builder.rera_number?.toLowerCase().includes(searchLower)) ||
      (builder.standard_builder_name?.toLowerCase().includes(searchLower)) ||
      (builder.project_name?.toLowerCase().includes(searchLower)) ||
      (builder.builder_origin_city?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Builder Data</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search builders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button onClick={() => handleOpenForm()} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredBuilders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No builders found matching your search' : 'No builders added yet. Click "Add New" to create a builder.'}
            </div>
          ) : (
            <Table className="min-w-[1400px]">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">
                    RERA Number <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">
                    Builder Name <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">
                    Project Name <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Builder Age</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Total Properties</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Upcoming Properties</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Completed Properties</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Ongoing Projects</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Origin City</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Operating Locations</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap max-w-[200px]">Previous Complaints</TableHead>
                  <TableHead className="font-semibold text-gray-700 whitespace-nowrap w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuilders.map((builder, index) => (
                  <TableRow 
                    key={builder.id}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <TableCell className="font-medium whitespace-nowrap">{builder.rera_number || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.standard_builder_name || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.project_name || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_age || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_total_properties || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_upcoming_properties || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_completed_properties || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_ongoing_projects || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_origin_city || '-'}</TableCell>
                    <TableCell className="whitespace-nowrap">{builder.builder_operating_locations || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={builder.previous_complaints_on_builder || ''}>
                      {builder.previous_complaints_on_builder || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(builder)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(builder.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Builder' : 'Add New Builder'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the builder information below.' : 'Fill in the builder details below.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-2">
                <Label htmlFor="rera_number">
                  RERA Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rera_number"
                  value={formData.rera_number}
                  onChange={(e) => handleInputChange('rera_number', e.target.value)}
                  placeholder="Enter RERA number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rera_builder_name">
                  RERA Builder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rera_builder_name"
                  value={formData.rera_builder_name}
                  onChange={(e) => handleInputChange('rera_builder_name', e.target.value)}
                  placeholder="Enter RERA builder name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="standard_builder_name">
                  Builder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="standard_builder_name"
                  value={formData.standard_builder_name}
                  onChange={(e) => handleInputChange('standard_builder_name', e.target.value)}
                  placeholder="Enter builder name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_name">
                  Project Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="builder_age">Builder Age</Label>
                  <Input
                    id="builder_age"
                    value={formData.builder_age}
                    onChange={(e) => handleInputChange('builder_age', e.target.value)}
                    placeholder="e.g., 15 years"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="builder_total_properties">Builder Total Properties</Label>
                  <Input
                    id="builder_total_properties"
                    value={formData.builder_total_properties}
                    onChange={(e) => handleInputChange('builder_total_properties', e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="builder_upcoming_properties">Builder Upcoming Properties</Label>
                  <Input
                    id="builder_upcoming_properties"
                    value={formData.builder_upcoming_properties}
                    onChange={(e) => handleInputChange('builder_upcoming_properties', e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="builder_completed_properties">Builder Completed Properties</Label>
                  <Input
                    id="builder_completed_properties"
                    value={formData.builder_completed_properties}
                    onChange={(e) => handleInputChange('builder_completed_properties', e.target.value)}
                    placeholder="e.g., 30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="builder_ongoing_projects">Builder Ongoing Projects</Label>
                <Input
                  id="builder_ongoing_projects"
                  value={formData.builder_ongoing_projects}
                  onChange={(e) => handleInputChange('builder_ongoing_projects', e.target.value)}
                  placeholder="e.g., 15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="builder_origin_city">Builder Origin City</Label>
                <Input
                  id="builder_origin_city"
                  value={formData.builder_origin_city}
                  onChange={(e) => handleInputChange('builder_origin_city', e.target.value)}
                  placeholder="e.g., Mumbai"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="builder_operating_locations">Builder Operating Locations</Label>
                <Input
                  id="builder_operating_locations"
                  value={formData.builder_operating_locations}
                  onChange={(e) => handleInputChange('builder_operating_locations', e.target.value)}
                  placeholder="e.g., Mumbai, Pune, Bangalore"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="previous_complaints_on_builder">Previous Complaints on Builder</Label>
                <Textarea
                  id="previous_complaints_on_builder"
                  value={formData.previous_complaints_on_builder}
                  onChange={(e) => handleInputChange('previous_complaints_on_builder', e.target.value)}
                  placeholder="Enter any previous complaints or notes about the builder"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Update Builder' : 'Create Builder'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the builder record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BuilderData;
