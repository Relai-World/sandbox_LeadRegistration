import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, FileText, Calendar, Building2, Loader2 } from 'lucide-react';

interface ApiDraftData {
  _id: string;
  ProjectName: string;
  BuilderName: string;
  createdAt: string;
  status: string;
  RERA_Number: string;
  BuildingType: string;
  CommunityType: string;
  Total_Number_of_Units: number;
  Possession_Date: string;
  Construction_Status: string;
  Price_per_sft: number;
  Commission_percentage?: number;
  Commision_percentage?: number;
  UserEmail: string;
  // Add other fields as needed
}

interface DraftData {
  id: string;
  projectName: string;
  builderName: string;
  createdDate: string;
  status: 'draft' | 'submitted';
  formData: ApiDraftData;
}

interface DraftsSectionProps {
  userEmail?: string;
  onEditDraft: (draft: DraftData) => void;
}

export const DraftsSection: React.FC<DraftsSectionProps> = ({ userEmail, onEditDraft }) => {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('DraftsSection: userEmail received:', userEmail);
    console.log('DraftsSection: userEmail type:', typeof userEmail);
    console.log('DraftsSection: userEmail length:', userEmail?.length);

    if (userEmail && userEmail.trim() !== '') {
      console.log('DraftsSection: Valid userEmail, fetching drafts');
      fetchDrafts(userEmail);
    } else {
      console.log('DraftsSection: No valid userEmail provided, setting loading to false');
      setLoading(false);
    }
  }, [userEmail]);

  const fetchDrafts = async (email: string) => {
    try {
      console.log('DraftsSection: Fetching drafts for email:', email);
      setLoading(true);
      setError(null);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/properties/drafts/${encodeURIComponent(email)}`);

      console.log('DraftsSection: API response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch drafts: ${response.status}`);
      }

      const apiData: any[] = await response.json();
      console.log('DraftsSection: API data received:', apiData);

      // Transform Supabase API data to match our component's interface
      const transformedDrafts: DraftData[] = apiData.map((item) => ({
        id: item.id || item._id,
        projectName: item.projectname || item.ProjectName || 'Untitled Project',
        builderName: item.buildername || item.BuilderName || 'Unknown Builder',
        createdDate: new Date(item.createdat || item.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        status: item.status === 'Unverified' ? 'draft' : 'submitted',
        formData: {
          ...item,
          ProjectName: item.projectname || item.ProjectName,
          BuilderName: item.buildername || item.BuilderName,
          RERA_Number: item.rera_number || item.RERA_Number,
          Project_Type: item.project_type || item.Project_Type,
          Price_per_sft: item.price_per_sft || item.Price_per_sft
        }
      }));

      console.log('DraftsSection: Transformed drafts:', transformedDrafts);
      setDrafts(transformedDrafts);
    } catch (err) {
      console.error('Error fetching drafts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">Loading Drafts...</h3>
          <p className="text-gray-500">
            Please wait while we fetch your saved drafts.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-red-600 mb-2">Error Loading Drafts</h3>
          <p className="text-gray-500 mb-4">
            {error}
          </p>
          <Button 
            onClick={() => userEmail && fetchDrafts(userEmail)}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No Drafts Yet</h3>
          <p className="text-gray-500">
            Create a short-form onboarding to save your first draft.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Drafts</h2>
        <p className="text-gray-600">
          Manage your saved project drafts. Edit any draft to complete the full onboarding process.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drafts.map((draft) => (
          <Card key={draft.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <Badge variant="secondary" className="text-xs">
                    {draft.status === 'draft' ? 'Draft' : 'Submitted'}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg line-clamp-2">
                {draft.projectName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span className="truncate">{draft.builderName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Created: {draft.createdDate}</span>
                </div>
                {draft.formData.RERA_Number && (
                  <div className="text-sm text-gray-600">
                    RERA: {draft.formData.RERA_Number}
                  </div>
                )}
                {draft.formData.Price_per_sft && (
                  <div className="text-sm text-gray-600">
                    Price: ₹{draft.formData.Price_per_sft.toLocaleString()}/sq ft
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => onEditDraft(draft)}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  <Edit className="w-4 h-4" />
                  Edit & Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};