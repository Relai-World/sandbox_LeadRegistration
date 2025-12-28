import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Building2, FileText, ArrowLeft, Loader2 } from 'lucide-react';

interface AgentData {
  email?: string;
  name?: string;
}

interface AgentReportsProps {
  agentData: AgentData;
}

// --- Interfaces to handle multiple data structures ---
interface FlatDetails {
  reraNumber?: string;
  projectType?: string;
  floors?: number | string;
  flatsPerFloor?: number | string;
  possessionDate?: string;
  openSpace?: string;
  carpetArea?: string;
  ceilingHeight?: string;
  commission?: string;
  pocName?: string;
  pocNumber?: string;
  pocRole?: string;
}

interface NestedDetails {
  basics?: {
    reraNumber?: string;
    projectType?: string;
    numberOfFloors?: string;
    flatsPerFloor?: string;
    possessionDate?: string;
    openSpace?: string;
  };
  construction?: {
    carpetAreaPercent?: string;
    ceilingHeight?: string;
  };
  secondary?: {
    commissionPercentage?: string;
    confirmationPersonName?: string;
    confirmationPersonContact?: string;
    confirmationPersonRole?: string;
  };
}

interface Submission {
  id: string; // Changed to string to accommodate MongoDB _id
  projectName: string;
  builderName: string;
  submissionType: string;
  status: string;
  date?: string; 
  time?: string;
  // Use a flexible details structure
  details?: { [key: string]: any };
}

/**
 * Corrects and formats a date/time to Indian Standard Time (IST).
 * This function includes a heuristic to fix dates that were saved in UTC
 * for early morning submissions in IST.
 */
const formatToIST = (dateStr?: string, timeStr?: string): string => {
    // Validate inputs - check for null, undefined, empty strings, or invalid values
    if (!dateStr || !timeStr || 
        dateStr === 'no' || timeStr === 'no' || 
        dateStr === 'null' || timeStr === 'null' ||
        dateStr === 'undefined' || timeStr === 'undefined' ||
        dateStr.trim() === '' || timeStr.trim() === '') {
        return "Invalid Date";
    }
    
    // 1. Create a preliminary date object from the stored strings.
    let date: Date;
    try {
        date = new Date(`${dateStr} ${timeStr}`);
        if (isNaN(date.getTime())) {
            return "Invalid Date";
        }
    } catch (error) {
        return "Invalid Date";
    }
    
    // 2. Apply a correction for timezone differences.
    // getTimezoneOffset() for IST (UTC+5:30) is -330.
    const timezoneOffsetInHours = new Date().getTimezoneOffset() / -60; // For IST, this is 5.5

    // If the local timezone is ahead of UTC and the time is in the early morning,
    // it's highly likely the stored UTC date is one day behind the actual local date.
    if (timezoneOffsetInHours > 0 && date.getHours() < timezoneOffsetInHours) {
        // Correct the date by adding one day.
        date.setDate(date.getDate() + 1);
    }
    
    // 3. Format the (now corrected) date object to display in IST.
    try {
        const dateOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Asia/Kolkata',
        };
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
        };
        
        const formattedDate = new Intl.DateTimeFormat('en-CA', dateOptions).format(date);
        const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date);

        return `${formattedDate} at ${formattedTime}`;
    } catch (error) {
        return "Invalid Date";
    }
};


export const AgentReports: React.FC<AgentReportsProps> = ({ agentData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [agentSubmissions, setAgentSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    drafts: 0,
    thisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);


  useEffect(() => {
    const fetchReports = async (email: string) => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${API_BASE_URL}/api/verified/status-count/${email}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }
        const data = await response.json();

        // Combine drafts and submitted into one list
        const allSubmissions = [
          ...data.drafts.map((d: any) => ({
            id: d._id, // Use the MongoDB _id
            projectName: d.projectName,
            builderName: d.builderName,
            submissionType: 'Short Form',
            status: 'draft',
            date: new Date(d.updatedAt).toISOString().split('T')[0],
            time: new Date(d.updatedAt).toLocaleTimeString('en-US'),
            details: d,
          })),
          ...data.submitted.map((s: any) => ({
            id: s._id, // Use the MongoDB _id
            projectName: s.projectName,
            builderName: s.builderName,
            submissionType: 'Full Onboarding',
            status: 'submitted',
            date: new Date(s.updatedAt).toISOString().split('T')[0],
            time: new Date(s.updatedAt).toLocaleTimeString('en-US'),
            details: s,
          })),
        ];

        setAgentSubmissions(allSubmissions);
        
        // Calculate "This Week" count locally
        const thisWeekCount = allSubmissions.filter(s => {
          if (!s.date || 
              s.date === 'no' || s.date === 'null' || s.date === 'undefined' || 
              s.date.trim() === '' || isNaN(new Date(s.date).getTime())) {
            return false;
          }
          
          try {
            const submissionDate = new Date(s.date);
            if (isNaN(submissionDate.getTime())) return false;
            
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return submissionDate >= weekAgo;
          } catch (error) {
            return false;
          }
        }).length;

        setStats({
          total: data.total,
          submitted: data.submittedCount,
          drafts: data.draftsCount,
          thisWeek: thisWeekCount,
        });

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Failed to fetch agent reports:", err);
      } finally {
        setLoading(false);
      }
    };

    if (agentData?.email) {
      fetchReports(agentData.email);
    } else {
      setLoading(false);
      setError("Agent email is not available.");
    }
  }, [agentData]);

  const filteredSubmissions = agentSubmissions
    .filter(submission => {
      const projectName = submission.projectName || '';
      const builderName = submission.builderName || '';
      
      const matchesSearch = projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           builderName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !filterDate || submission.date === filterDate;
      const matchesStatus = !filterStatus || submission.status === filterStatus;
      return matchesSearch && matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by date descending with safe date parsing
      let dateA: Date, dateB: Date;
      
      try {
        // Check if date and time are valid before creating Date objects
        if (!a.date || !a.time || 
            a.date === 'no' || a.time === 'no' || 
            a.date === 'null' || a.time === 'null' ||
            a.date === 'undefined' || a.time === 'undefined' ||
            a.date.trim() === '' || a.time.trim() === '') {
          dateA = new Date(0); // Use epoch time for invalid dates
        } else {
          dateA = new Date(`${a.date} ${a.time}`);
          if (isNaN(dateA.getTime())) {
            dateA = new Date(0);
          }
        }
        
        if (!b.date || !b.time || 
            b.date === 'no' || b.time === 'no' || 
            b.date === 'null' || b.time === 'null' ||
            b.date === 'undefined' || b.time === 'undefined' ||
            b.date.trim() === '' || b.time.trim() === '') {
          dateB = new Date(0); // Use epoch time for invalid dates
        } else {
          dateB = new Date(`${b.date} ${b.time}`);
          if (isNaN(dateB.getTime())) {
            dateB = new Date(0);
          }
        }
      } catch (error) {
        // If any error occurs during date parsing, use epoch time
        dateA = new Date(0);
        dateB = new Date(0);
      }
      
      return dateB.getTime() - dateA.getTime();
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (submission: Submission) => setSelectedSubmission(submission);
  const handleBackToList = () => setSelectedSubmission(null);

  const getNormalizedDetails = (details: any) => {
    if (!details) return {};
    // This function now handles the flat structure from the new API
    return {
        reraNumber: details.RERA_Number,
        projectType: details.ProjectType,
        floors: details.Number_of_Floors,
        flatsPerFloor: details.Flats_Per_Floor,
        possessionDate: details.Possession_Date,
        openSpace: details.Open_Space,
        carpetArea: details.Carpet_Area_Percentage,
        ceilingHeight: details.Floor_to_Ceiling_Height,
        commission: details.Commission_Percentage,
        pocName: details.POC_Name,
        pocNumber: details.POC_Contact,
        pocRole: details.POC_Role,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-2">Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (selectedSubmission) {
    const details = getNormalizedDetails(selectedSubmission.details);
    const displayDateTime = formatToIST(selectedSubmission.date, selectedSubmission.time);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBackToList}><ArrowLeft className="w-4 h-4 mr-2" />Back to Reports</Button>
          <div><h2 className="text-2xl font-bold text-gray-900">Project Details</h2><p className="text-gray-600">{selectedSubmission.projectName}</p></div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-3">{selectedSubmission.projectName} <Badge className={getStatusColor(selectedSubmission.status)}>{selectedSubmission.status}</Badge> <Badge variant="outline">{selectedSubmission.submissionType}</Badge></CardTitle>
                <p className="text-sm text-gray-600 mt-1">Builder: {selectedSubmission.builderName}</p>
              </div>
              <div className="text-sm text-gray-500">Submitted on {displayDateTime}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Project Information</h3>
                <div className="space-y-3">
                  <div><label className="text-sm font-medium text-gray-600">RERA Number</label><p className="text-gray-900">{details.reraNumber || 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Project Type</label><p className="text-gray-900 capitalize">{details.projectType || 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Number of Floors</label><p className="text-gray-900">{details.floors || 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Flats Per Floor</label><p className="text-gray-900">{details.flatsPerFloor || 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Possession Date</label><p className="text-gray-900">{details.possessionDate || 'N/A'}</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-gray-900">Project Specifications</h3>
                <div className="space-y-3">
                  <div><label className="text-sm font-medium text-gray-600">Open Space</label><p className="text-gray-900">{details.openSpace ? `${details.openSpace}%` : 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Carpet Area %</label><p className="text-gray-900">{details.carpetArea ? `${details.carpetArea}%` : 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Ceiling Height</label><p className="text-gray-900">{details.ceilingHeight ? `${details.ceilingHeight} ft` : 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">Commission</label><p className="text-gray-900">{details.commission ? `${details.commission}%` : 'N/A'}</p></div>
                </div>
              </div>
              <div className="space-y-4 md:col-span-2">
                <h3 className="font-semibold text-lg text-gray-900">Point of Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><label className="text-sm font-medium text-gray-600">POC Name</label><p className="text-gray-900">{details.pocName || 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">POC Number</label><p className="text-gray-900">{details.pocNumber || 'N/A'}</p></div>
                  <div><label className="text-sm font-medium text-gray-600">POC Role</label><p className="text-gray-900">{details.pocRole || 'N/A'}</p></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-gray-900">My Reports</h2><p className="text-gray-600">Agent: {agentData?.name || 'Unknown Agent'}</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card onClick={() => setFilterStatus(null)} className={`cursor-pointer transition-shadow hover:shadow-md ${!filterStatus ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Projects</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div><Building2 className="w-8 h-8 text-blue-600" /></div></CardContent>
        </Card>
        <Card onClick={() => setFilterStatus('submitted')} className={`cursor-pointer transition-shadow hover:shadow-md ${filterStatus === 'submitted' ? 'ring-2 ring-green-500' : ''}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Submitted</p><p className="text-2xl font-bold text-green-600">{stats.submitted}</p></div><FileText className="w-8 h-8 text-green-600" /></div></CardContent>
        </Card>
        <Card onClick={() => setFilterStatus('draft')} className={`cursor-pointer transition-shadow hover:shadow-md ${filterStatus === 'draft' ? 'ring-2 ring-yellow-500' : ''}`}>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Drafts</p><p className="text-2xl font-bold text-yellow-600">{stats.drafts}</p></div><FileText className="w-8 h-8 text-yellow-600" /></div></CardContent>
        </Card>
        <Card>
            <CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">This Week</p><p className="text-2xl font-bold text-purple-600">{stats.thisWeek}</p></div><Calendar className="w-8 h-8 text-purple-600" /></div></CardContent>
        </Card>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input placeholder="Search projects or builders..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="md:w-auto" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === 'submitted' && 'Your Submitted Projects'}
            {filterStatus === 'draft' && 'Your Drafts'}
            {!filterStatus && 'All Your Submissions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-8"><FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No submissions found</p></div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const displayDateTime = formatToIST(submission.date, submission.time);
                return (
                  <div key={submission.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2"><h3 className="font-semibold text-gray-900">{submission.projectName}</h3><Badge className={getStatusColor(submission.status)}>{submission.status}</Badge><Badge variant="outline">{submission.submissionType}</Badge></div>
                      <p className="text-sm text-gray-600 mb-1">Builder: {submission.builderName}</p>
                      <p className="text-sm text-gray-500">{displayDateTime}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};