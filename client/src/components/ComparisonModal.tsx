import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  authHeaders?: Record<string, string>;
  apiBaseUrl?: string;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  projectName,
  authHeaders = {},
  apiBaseUrl = '',
}) => {
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [verifiedData, setVerifiedData] = useState<any>(null);
  const [unifiedLoading, setUnifiedLoading] = useState(false);
  const [verifiedLoading, setVerifiedLoading] = useState(false);
  const [unifiedError, setUnifiedError] = useState<string | null>(null);
  const [verifiedError, setVerifiedError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectName) {
      fetchComparisonData();
    }
  }, [isOpen, projectName]);

  const fetchComparisonData = async () => {
    // Fetch Unified Data from Supabase
    setUnifiedLoading(true);
    setUnifiedError(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/admin/properties/mongodb/${encodeURIComponent(projectName)}`,
        {
          headers: authHeaders,
        }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch unified data');
      }
      
      setUnifiedData(data.data);
    } catch (error: any) {
      console.error('Error fetching unified data:', error);
      setUnifiedError(error.message || 'Failed to fetch unified data');
    } finally {
      setUnifiedLoading(false);
    }

    // Fetch Verified Properties data
    setVerifiedLoading(true);
    setVerifiedError(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/admin/properties/verified/${encodeURIComponent(projectName)}`,
        {
          headers: authHeaders,
        }
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch verified data');
      }
      
      setVerifiedData(data.data);
    } catch (error: any) {
      console.error('Error fetching verified data:', error);
      setVerifiedError(error.message || 'Failed to fetch verified data');
    } finally {
      setVerifiedLoading(false);
    }
  };

  // Fields to exclude from unified data display
  const excludedUnifiedFields = new Set([
    'google_place_id',
    'google_place_name', 
    'google_place_address',
    'google_place_location',
    'google_place_rating',
    'google_place_user_ratings_total',
    'google_maps_location',
    'google_place_raw_data',
    'hospitals_count',
    'shopping_malls_count',
    'schools_count',
    'restaurants_count',
    'restaurants_above_4_stars_count',
    'supermarkets_count',
    'it_offices_count',
    'metro_stations_count',
    'railway_stations_count',
    'nearest_hospitals',
    'nearest_shopping_malls',
    'nearest_schools',
    'nearest_restaurants',
    'high_rated_restaurants',
    'nearest_supermarkets',
    'nearest_it_offices',
    'nearest_metro_station',
    'nearest_railway_station',
    'nearest_orr_access',
    'connectivity_score',
    'amenities_score',
    'amenities_raw_data',
    'amenities_updated_at',
    'mobile_google_map_url',
    'GRID_Score',
    'isavailable',
    'configsoldoutstatus',
  ]);

  // Filter out excluded fields from unified data
  const filterUnifiedData = (data: any) => {
    if (!data) return null;
    const filtered: any = {};
    Object.entries(data).forEach(([key, value]) => {
      if (!excludedUnifiedFields.has(key)) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  const formatJSON = (data: any) => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  // Function to get all keys from unified data
  const getUnifiedDataKeys = (unified: any) => {
    if (!unified) return new Map();
    
    const keysMap = new Map<string, any>();
    
    Object.entries(unified).forEach(([key, value]) => {
      keysMap.set(key, value);
    });
    
    return keysMap;
  };

  // Function to format JSON with highlighting for new/different values (for verified data)
  const formatJSONWithHighlighting = (verifiedObj: any, unifiedObj: any): Array<{ text: string; highlight: boolean }> => {
    if (!verifiedObj) return [];
    
    const unifiedKeys = getUnifiedDataKeys(unifiedObj);
    
    const formatValue = (value: any, indent: number): string => {
      const spaces = '  '.repeat(indent);
      
      if (value === null) {
        return 'null';
      } else if (typeof value === 'string') {
        return `"${value}"`;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      } else if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map(item => `${spaces}  ${formatValue(item, indent + 1)}`).join(',\n');
        return `[\n${items}\n${spaces}]`;
      } else if (typeof value === 'object') {
        const entries = Object.entries(value).map(([k, v]) => {
          return `${spaces}  "${k}": ${formatValue(v, indent + 1)}`;
        }).join(',\n');
        return `{\n${entries}\n${spaces}}`;
      }
      return String(value);
    };

    const lines: Array<{ text: string; highlight: boolean }> = [];
    lines.push({ text: '{', highlight: false });

    const entries = Object.entries(verifiedObj);
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      const unifiedValue = unifiedKeys.get(key);
      
      // Highlight if value exists in verified but is null/undefined in unified
      const shouldHighlight = value !== null && 
                             value !== undefined && 
                             (unifiedValue === null || unifiedValue === undefined);
      
      const formattedValue = formatValue(value, 1);
      const comma = isLast ? '' : ',';
      lines.push({ 
        text: `  "${key}": ${formattedValue}${comma}`,
        highlight: shouldHighlight 
      });
    });

    lines.push({ text: '}', highlight: false });

    return lines;
  };

  // Function to format JSON with highlighting for unified data (left side)
  const formatUnifiedJSONWithHighlighting = (unifiedObj: any, verifiedObj: any): Array<{ text: string; highlight: boolean }> => {
    if (!unifiedObj) return [];
    
    const formatValue = (value: any, indent: number): string => {
      const spaces = '  '.repeat(indent);
      
      if (value === null) {
        return 'null';
      } else if (typeof value === 'string') {
        return `"${value}"`;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      } else if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map(item => `${spaces}  ${formatValue(item, indent + 1)}`).join(',\n');
        return `[\n${items}\n${spaces}]`;
      } else if (typeof value === 'object') {
        const entries = Object.entries(value).map(([k, v]) => {
          return `${spaces}  "${k}": ${formatValue(v, indent + 1)}`;
        }).join(',\n');
        return `{\n${entries}\n${spaces}}`;
      }
      return String(value);
    };

    const lines: Array<{ text: string; highlight: boolean }> = [];
    lines.push({ text: '{', highlight: false });

    const entries = Object.entries(unifiedObj);
    entries.forEach(([key, value], index) => {
      const isLast = index === entries.length - 1;
      const verifiedValue = verifiedObj?.[key];
      
      // Highlight if value is null/undefined in unified but exists in verified
      const shouldHighlight = (value === null || value === undefined) && 
                             verifiedValue !== null && 
                             verifiedValue !== undefined;
      
      const formattedValue = formatValue(value, 1);
      const comma = isLast ? '' : ',';
      lines.push({ 
        text: `  "${key}": ${formattedValue}${comma}`,
        highlight: shouldHighlight 
      });
    });

    lines.push({ text: '}', highlight: false });

    return lines;
  };

  const renderHighlightedJSON = () => {
    if (!verifiedData || verifiedLoading || verifiedError) return null;
    
    const highlightedLines = formatJSONWithHighlighting(verifiedData, unifiedData);
    
    return (
      <div className="text-xs font-mono whitespace-pre-wrap break-words">
        {highlightedLines.map((line, index) => (
          <div
            key={index}
            className={line.highlight ? 'bg-yellow-200 font-semibold' : ''}
          >
            {line.text}
          </div>
        ))}
      </div>
    );
  };

  const renderUnifiedHighlightedJSON = () => {
    if (!unifiedData || unifiedLoading || unifiedError) return null;
    
    // Filter out excluded fields before displaying
    const filteredUnifiedData = filterUnifiedData(unifiedData);
    const highlightedLines = formatUnifiedJSONWithHighlighting(filteredUnifiedData, verifiedData);
    
    return (
      <div className="text-xs font-mono whitespace-pre-wrap break-words">
        {highlightedLines.map((line, index) => (
          <div
            key={index}
            className={line.highlight ? 'bg-yellow-200 font-semibold' : ''}
          >
            {line.text}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Property Data Comparison - {projectName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(90vh-120px)]">
          {/* Unified Data Notepad */}
          <div className="flex flex-col border rounded-lg overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-blue-900">
                Unified Data (Supabase)
              </h3>
              <p className="text-xs text-blue-700">Master property data</p>
            </div>
            <ScrollArea className="flex-1 p-4 bg-white">
              {unifiedLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : unifiedError ? (
                <div className="text-red-600 p-4 bg-red-50 rounded">
                  <p className="font-semibold">Error:</p>
                  <p className="text-sm">{unifiedError}</p>
                </div>
              ) : (
                renderUnifiedHighlightedJSON()
              )}
            </ScrollArea>
          </div>

          {/* Unverified Properties Notepad */}
          <div className="flex flex-col border rounded-lg overflow-hidden">
            <div className="bg-green-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-green-900">
                Unverified_Properties (Supabase)
              </h3>
              <p className="text-xs text-green-700">Agent property submissions</p>
            </div>
            <ScrollArea className="flex-1 p-4 bg-white">
              {verifiedLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : verifiedError ? (
                <div className="text-orange-600 p-4 bg-orange-50 rounded">
                  <p className="font-semibold">Error:</p>
                  <p className="text-sm">{verifiedError}</p>
                </div>
              ) : (
                renderHighlightedJSON()
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
