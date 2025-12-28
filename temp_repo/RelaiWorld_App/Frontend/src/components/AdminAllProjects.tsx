import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, CheckCircle2, Loader2, Mail, Building2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComparisonModal } from '@/components/ComparisonModal';

interface Project {
  _id: string;
  ProjectName: string;
  BuilderName: string;
  RERA_Number: string;
  UserEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  ProjectType: string;
  Number_of_Floors: number;
  Flats_Per_Floor: number;
  Possession_Date: string | null;
  Open_Space: string;
  Carpet_Area_Percentage: string;
  Floor_to_Ceiling_Height: string;
  Commission_Percentage: string;
  POC_Name: string;
  POC_Contact: number;
  POC_Role: string;
  configurations?: any[];
}

interface AdminAllProjectsProps {
  adminUser?: any;
}

export const AdminAllProjects: React.FC<AdminAllProjectsProps> = ({ adminUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [emailFilter, setEmailFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentEmails, setAgentEmails] = useState<string[]>([]);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Use adminUser prop or fallback to useAuth
  const currentUser = adminUser || user;

  // Helper to get auth headers
  const getAuthHeaders = () => {
    if (!currentUser?.email || !currentUser?.id) {
      console.error('Missing user authentication data', { currentUser });
      return {};
    }
    return {
      'Content-Type': 'application/json',
      'x-user-email': currentUser.email,
      'x-user-id': currentUser.id,
    };
  };

  useEffect(() => {
    // Only fetch if we have user data
    if (currentUser?.email && currentUser?.id) {
      fetchAgentEmails();
      fetchProjects();
    }
  }, [currentUser?.email, currentUser?.id]);

  useEffect(() => {
    applyFilters();
  }, [projects, searchTerm, emailFilter, statusFilter]);

  const fetchAgentEmails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/agent-emails`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAgentEmails(data.emails);
      }
    } catch (error) {
      console.error('Error fetching agent emails:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to fetch agent emails. Please ensure you are logged in as an admin.',
        variant: 'destructive',
      });
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/properties`, {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch projects',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while fetching projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = projects;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.ProjectName?.toLowerCase().includes(searchLower) ||
        project.BuilderName?.toLowerCase().includes(searchLower) ||
        project.RERA_Number?.toLowerCase().includes(searchLower) ||
        project.UserEmail?.toLowerCase().includes(searchLower)
      );
    }

    if (emailFilter && emailFilter !== 'all') {
      filtered = filtered.filter(project => project.UserEmail === emailFilter);
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleVerify = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to verify "${projectName}"? This will move it to the verified properties table.`)) {
      return;
    }

    try {
      setVerifyingId(projectId);
      const response = await fetch(`${API_BASE_URL}/api/admin/properties/${projectId}/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: `${projectName} has been verified and moved to verified properties.`,
        });
        
        // Remove the verified project from the list
        setProjects(prevProjects => prevProjects.filter(p => p._id !== projectId));
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to verify project',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying project:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while verifying the project',
        variant: 'destructive',
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      'Submitted': 'bg-green-100 text-green-800',
      'Unverified': 'bg-yellow-100 text-yellow-800',
      'Draft': 'bg-gray-100 text-gray-800',
    };
    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';
  };

  const handleCompareClick = (projectName: string) => {
    setSelectedProjectName(projectName);
    setComparisonModalOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'Submitted').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agents</p>
                <p className="text-2xl font-bold text-purple-600">{agentEmails.length}</p>
              </div>
              <Mail className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by project, builder, RERA, or agent email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={emailFilter} onValueChange={setEmailFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filter by agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agentEmails.map(email => (
                  <SelectItem key={email} value={email}>
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Builder</TableHead>
                  <TableHead>RERA</TableHead>
                  <TableHead>Agent Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.ProjectName}</TableCell>
                      <TableCell>{project.BuilderName}</TableCell>
                      <TableCell>{project.RERA_Number}</TableCell>
                      <TableCell className="text-sm text-gray-600">{project.UserEmail}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(project.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCompareClick(project.ProjectName)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Compare
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleVerify(project._id, project.ProjectName)}
                            disabled={verifyingId === project._id || project.status !== 'Submitted'}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {verifyingId === project._id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verify
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        projectName={selectedProjectName}
        authHeaders={getAuthHeaders()}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
};
