import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';

interface Project {
  _id: string;
  status: string;
  projectName: string;
  builderName: string;
  RERA_Number: string;
  ProjectType: string;
  Number_of_Floors: string;
  Flats_Per_Floor: string;
  Possession_Date: string;
  Open_Space: string;
  Carpet_Area_Percentage: string;
  Floor_to_Ceiling_Height: string;
  Commission_Percentage: string;
  POC_Name: string;
  POC_Contact: string;
  POC_Role: string;
  updatedAt: string;
}

interface ProjectListProps {
  onProjectSelect: (project: any) => void;
  onProjectCheckboxChange?: (project: any, checked: boolean) => void;
  selectedProjectIds?: Set<string>;
  agentEmail?: string;
}

export const ProjectList: React.FC<ProjectListProps> = ({ 
  onProjectSelect, 
  onProjectCheckboxChange,
  selectedProjectIds = new Set(),
  agentEmail 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!agentEmail) {
        console.log('ProjectList: No agent email provided.');
        setLoading(false);
        return;
      }
      try {
        // Use the StatusCount endpoint to fetch both drafts and submitted projects
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const apiUrl = `${API_BASE_URL}/api/verified/status-count/${encodeURIComponent(agentEmail)}`;
        console.log('ProjectList: Fetching projects from:', apiUrl);
        
        const response = await fetch(apiUrl);
        console.log('ProjectList: API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('ProjectList: Fetched projects data:', data);
          // Combine drafts and submitted projects
          const allProjects = [...(data.drafts || []), ...(data.submitted || [])];
          setProjects(allProjects);
        } else if (response.status === 404) {
          // No projects found - this is not an error, just empty list
          console.log('ProjectList: No projects found for this email');
          setProjects([]);
        } else {
          const errorText = await response.text();
          console.error('ProjectList: Error fetching projects. Status:', response.status, 'Response:', errorText);
          toast({
            title: 'Error fetching projects',
            description: 'Could not fetch the list of projects.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('ProjectList: An unexpected error occurred while fetching projects:', error);
        toast({
          title: 'Error',
          description: 'An error occurred while fetching projects.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [agentEmail]);

  if (loading) {
    return <p>Loading projects...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Submitted Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p>You have not submitted any projects yet.</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div 
                key={project._id} 
                className="border p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3 flex-1">
                    {onProjectCheckboxChange && (
                      <Checkbox
                        checked={selectedProjectIds.has(project._id)}
                        onCheckedChange={(checked) => {
                          onProjectCheckboxChange(project, checked as boolean);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{project.projectName}</h3>
                    <p className="text-sm text-gray-500">{project.builderName}</p>
                    <p className="text-xs text-gray-400">RERA: {project.RERA_Number}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={project.status === 'Submitted' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 