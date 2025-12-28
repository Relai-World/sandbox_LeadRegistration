import React, { useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Autocomplete } from '@/components/ui/autocomplete';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { usePropertyDropdown } from '@/hooks/usePropertyDropdown';
import { sqmtToAcres, formatDateDDMMYYYY, parseDDMMYYYY, ddmmYYYYToYYYYMMDD, yyyymmddToDDMMYYYY } from '@/lib/utils';

interface ProjectBasicsProps {
  data: any;
  onUpdate: (data: any) => void;
  onPropertyFetched?: (propertyData: any) => void;
  errors?: any;
  isViewMode?: boolean;
  isDraftMode?: boolean;
}

export const ProjectBasics: React.FC<ProjectBasicsProps> = ({ data, onUpdate, onPropertyFetched, errors = {}, isViewMode = false, isDraftMode = false }) => {
  const { dropdownValues, loading, fetchPropertyDetails } = usePropertyDropdown();

  // Memoize the property fetched handler to prevent unnecessary re-renders
  const handlePropertyFetched = useCallback((property: any) => {
    if (onPropertyFetched) {
      onPropertyFetched(property);
    } else {
      // Fallback to old behavior for backwards compatibility
      const updatedData: any = {};
      const fieldMapping: { [key: string]: string } = {
        'projectName': 'ProjectName',
        'builderName': 'BuilderName',
        'reraNumber': 'RERA_Number',
        'projectLocation': 'AreaName',
        'city': 'City',
        'state': 'State'
      };

      Object.entries(fieldMapping).forEach(([frontendKey, backendKey]) => {
        if (property[backendKey]) {
          updatedData[frontendKey] = property[backendKey];
        }
      });

      if (Object.keys(updatedData).length > 0) {
        onUpdate(updatedData);
      }
    }
  }, [onPropertyFetched, onUpdate]);

  // Fetch property details when Project Name or RERA Number changes
  // Only fetch if the value is in dropdown (meaning it's from properties collection)
  // Skip auto-fetch when editing a draft to prevent overwriting draft data
  useEffect(() => {
    // Don't auto-fetch when editing a draft - the draft data is already loaded
    if (isDraftMode) {
      return;
    }
    
    const hasValidProjectName = data.projectName && dropdownValues.projectNames.includes(data.projectName);
    const hasValidReraNumber = data.reraNumber && dropdownValues.reraNumbers.includes(data.reraNumber);
    
    // Only fetch once - prefer project name if both are present
    if (hasValidProjectName) {
      fetchPropertyDetails(data.projectName, undefined, handlePropertyFetched);
    } else if (hasValidReraNumber) {
      fetchPropertyDetails(undefined, data.reraNumber, handlePropertyFetched);
    }
  }, [data.projectName, data.reraNumber, dropdownValues.projectNames, dropdownValues.reraNumbers, fetchPropertyDetails, handlePropertyFetched, isDraftMode]);

  // Check if RERA Number starts with 'PRM/KA/RERA/'
  const isPRMKARERA = useMemo(() => {
    const reraNumber = data.reraNumber || '';
    return reraNumber.startsWith('PRM/KA/RERA/');
  }, [data.reraNumber]);

  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  // Handle Total Land Area input - convert from sqmt to acres if PRM/KA/RERA/
  const handleTotalLandAreaChange = (value: string) => {
    if (isPRMKARERA) {
      // Store the raw input value for display (allows user to type freely)
      // Extract numeric value for conversion
      const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      
      if (value === '') {
        // Clear both values when input is empty
        onUpdate({ 
          totalLandArea: '',
          totalLandAreaSqmt: ''
        });
      } else if (!isNaN(numericValue) && numericValue > 0) {
        // Valid number - convert to acres and store both values
        const acres = sqmtToAcres(numericValue);
        onUpdate({ 
          totalLandArea: acres.toFixed(4), // Store converted acres value
          totalLandAreaSqmt: value // Store original input (may include "sqmt" text)
        });
      } else {
        // Partial input (e.g., user typing "2" or "25")
        // Store the input as-is for display, but don't convert yet
        onUpdate({ 
          totalLandArea: '',
          totalLandAreaSqmt: value
        });
      }
    } else {
      onUpdate({ totalLandArea: value });
    }
  };

  // Handle Open Space input - convert from sqmt to acres and calculate percentage if PRM/KA/RERA/
  const handleOpenSpaceChange = (value: string) => {
    if (isPRMKARERA) {
      // Extract numeric value from input
      const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numericValue) && numericValue > 0) {
        const openSpaceAcres = sqmtToAcres(numericValue);
        const totalLandAreaAcres = parseFloat(data.totalLandArea) || 0;
        
        if (totalLandAreaAcres > 0) {
          const percentage = (openSpaceAcres / totalLandAreaAcres) * 100;
          onUpdate({ 
            openSpace: percentage.toFixed(2),
            openSpaceSqmt: numericValue.toString(), // Store original sqmt value
            openSpaceAcres: openSpaceAcres.toFixed(4) // Store converted acres value
          });
        } else {
          // Store values but don't calculate percentage yet
          onUpdate({ 
            openSpace: '',
            openSpaceSqmt: numericValue.toString(),
            openSpaceAcres: openSpaceAcres.toFixed(4)
          });
        }
      } else {
        onUpdate({ openSpace: value });
      }
    } else {
      onUpdate({ openSpace: value });
    }
  };

  // Recalculate open space percentage when total land area changes (for PRM/KA/RERA/)
  useEffect(() => {
    if (isPRMKARERA && data.openSpaceSqmt && data.totalLandArea) {
      const openSpaceSqmt = parseFloat(data.openSpaceSqmt);
      const totalLandAreaAcres = parseFloat(data.totalLandArea);
      
      if (!isNaN(openSpaceSqmt) && !isNaN(totalLandAreaAcres) && totalLandAreaAcres > 0) {
        const openSpaceAcres = sqmtToAcres(openSpaceSqmt);
        const percentage = (openSpaceAcres / totalLandAreaAcres) * 100;
        onUpdate({ openSpace: percentage.toFixed(2) });
      }
    }
  }, [data.totalLandArea, data.openSpaceSqmt, isPRMKARERA]);

  // Auto-set Construction Status based on Possession Date (for ALL projects)
  useEffect(() => {
    // Skip if user manually changed the status (we'll allow manual override)
    // Only auto-update when possession date changes
    if (!data.possessionDate || data.possessionDate.trim() === '') {
      return;
    }

    const possessionDateUpper = data.possessionDate.toUpperCase().trim();

    if (possessionDateUpper === 'RTM') {
      // If RTM, set status to RTM
      if (data.constructionStatus !== 'RTM') {
        onUpdate({ constructionStatus: 'RTM' });
      }
      return;
    }

    let possessionDateObj: Date | null = null;

    // Parse date - try DD/MM/YYYY format first (for all projects now)
    if (data.possessionDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      // DD/MM/YYYY format
      possessionDateObj = parseDDMMYYYY(data.possessionDate);
    } else {
      // Try YYYY-MM-DD format or other formats
      try {
        possessionDateObj = new Date(data.possessionDate);
        if (isNaN(possessionDateObj.getTime())) {
          possessionDateObj = null;
        }
      } catch {
        possessionDateObj = null;
      }
    }

    if (!possessionDateObj) {
      return; // Invalid or incomplete date, don't update status
    }

    // Calculate months difference from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    possessionDateObj.setHours(0, 0, 0, 0);

    // Calculate difference in days for more accurate calculation
    const daysDiff = Math.floor((possessionDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const monthsDiffWithDays = daysDiff / 30.44; // Average days per month
    const oneMonthInDays = 30.44; // Approximately 1 month

    let newStatus = 'Under Construction';

    // Updated logic based on requirements (applies to ALL projects):
    // 1. All past dates (including present date) and up to 1 month from today → 'RTM'
    // 2. All past dates (including present date) and 1 to 6 months from today → 'About to RTM'
    // Note: Since past dates are covered by both conditions, we prioritize RTM for past dates up to 1 month
    
    if (daysDiff <= oneMonthInDays) {
      // Past dates (including today) and up to 1 month from today → 'RTM'
      newStatus = 'RTM';
    } else if (daysDiff <= (6 * oneMonthInDays)) {
      // 1 to 6 months from today (or past dates in this range) → 'About to RTM'
      // Note: This also includes past dates that are more than 1 month ago but within 6 months
      newStatus = 'About to RTM';
    } else {
      // More than 6 months from today → 'Under Construction'
      newStatus = 'Under Construction';
    }

    // Only update if status has changed
    if (data.constructionStatus !== newStatus) {
      onUpdate({ constructionStatus: newStatus });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.possessionDate]);

  // Format date input as user types (DD/MM/YYYY)
  const formatDateInput = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // If empty or just 'RTM', return as is
    if (digits === '' || value.toUpperCase().includes('RTM')) {
      return value.toUpperCase() === 'RTM' ? 'RTM' : value;
    }
    
    // Format as DD/MM/YYYY
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
  };

  // Handle Possession Date input - format as DD/MM/YYYY for ALL projects
  const handlePossessionDateChange = (value: string) => {
    // Allow DD/MM/YYYY format with auto-formatting for ALL projects
    if (value === '' || value.toUpperCase() === 'RTM') {
      onUpdate({ possessionDate: value.toUpperCase() === 'RTM' ? 'RTM' : '' });
      return;
    }
    
    // Auto-format as user types
    const formatted = formatDateInput(value);
    
    // If it's a complete date (DD/MM/YYYY), validate and store
    if (formatted.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parsed = parseDDMMYYYY(formatted);
      if (parsed) {
        // Valid date, store it
        onUpdate({ possessionDate: formatted });
      } else {
        // Invalid date, but store formatted value for user to see
        onUpdate({ possessionDate: formatted });
      }
    } else {
      // Partial date, store formatted value for user to continue typing
      onUpdate({ possessionDate: formatted });
    }
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for date input (same as Launch Date)
  const getPossessionDateForInput = (): string => {
    if (!data.possessionDate || data.possessionDate.toUpperCase() === 'RTM') {
      return '';
    }
    
    // If already in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (data.possessionDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return ddmmYYYYToYYYYMMDD(data.possessionDate);
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (data.possessionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data.possessionDate;
    }
    
    // Try to parse and convert (using local date components to avoid timezone shifts)
    try {
      const date = new Date(data.possessionDate);
      if (!isNaN(date.getTime())) {
        // Use local date components instead of toISOString() to avoid timezone shifts
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {}
    
    return '';
  };

  // Get Launch Date for input (convert DD/MM/YYYY to YYYY-MM-DD for date input)
  const getLaunchDateForInput = (): string => {
    if (!data.launchDate || data.launchDate.trim() === '') {
      return '';
    }
    
    // If already in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (data.launchDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      return ddmmYYYYToYYYYMMDD(data.launchDate);
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (data.launchDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data.launchDate;
    }
    
    // Try to parse and convert (using local date components to avoid timezone shifts)
    try {
      const date = new Date(data.launchDate);
      if (!isNaN(date.getTime())) {
        // Use local date components instead of toISOString() to avoid timezone shifts
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {}
    
    return '';
  };

  // Handle Launch Date input change (YYYY-MM-DD format from date input)
  const handleLaunchDateInputChange = (value: string) => {
    if (!value) {
      onUpdate({ launchDate: '' });
      return;
    }
    
    // Convert YYYY-MM-DD to DD/MM/YYYY format for storage
    const formatted = yyyymmddToDDMMYYYY(value);
    onUpdate({ launchDate: formatted });
  };

  // Handle date input change (YYYY-MM-DD format from date input)
  const handlePossessionDateInputChange = (value: string) => {
    if (!value) {
      onUpdate({ possessionDate: '' });
      return;
    }
    
    // Convert YYYY-MM-DD to DD/MM/YYYY format for storage
    const formatted = yyyymmddToDDMMYYYY(value);
    onUpdate({ possessionDate: formatted });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Autocomplete
              value={data.projectName || ''}
              onValueChange={(value) => handleInputChange('projectName', value)}
              options={dropdownValues.projectNames}
              placeholder="e.g., Cloud 9"
              searchPlaceholder="Search project names..."
              emptyMessage="No projects found."
              disabled={isViewMode}
              error={!!errors.projectName}
            />
            {errors.projectName && <p className="text-red-500 text-xs mt-1">{errors.projectName}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="areaName">Area Name</Label>
            <Input
              id="areaName"
              placeholder="e.g., Gachibowli, Hitech City"
              value={data.areaName || ''}
              onChange={(e) => handleInputChange('areaName', e.target.value)}
              className={errors.areaName ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.areaName && <p className="text-red-500 text-xs mt-1">{errors.areaName}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectLocation">Project Location</Label>
            <Input
              id="projectLocation"
              placeholder="e.g., Gachibowli"
              value={data.projectLocation || ''}
              onChange={(e) => handleInputChange('projectLocation', e.target.value)}
              className={errors.projectLocation ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.projectLocation && <p className="text-red-500 text-xs mt-1">{errors.projectLocation}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Autocomplete
              value={data.city || ''}
              onValueChange={(value) => handleInputChange('city', value)}
              options={dropdownValues.cities}
              placeholder="Select or type city"
              searchPlaceholder="Search cities..."
              emptyMessage="No cities found."
              disabled={isViewMode}
              error={!!errors.city}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Autocomplete
              value={data.state || ''}
              onValueChange={(value) => handleInputChange('state', value)}
              options={dropdownValues.states}
              placeholder="Select or type state"
              searchPlaceholder="Search states..."
              emptyMessage="No states found."
              disabled={isViewMode}
              error={!!errors.state}
            />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="builderName">Builder Name *</Label>
            <Autocomplete
              value={data.builderName || ''}
              onValueChange={(value) => handleInputChange('builderName', value)}
              options={dropdownValues.builderNames}
              placeholder="e.g., Urban Rise"
              searchPlaceholder="Search builder names..."
              emptyMessage="No builders found."
              disabled={isViewMode}
              error={!!errors.builderName}
            />
            {errors.builderName && <p className="text-red-500 text-xs mt-1">{errors.builderName}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reraNumber">RERA Number *</Label>
            <Autocomplete
              value={data.reraNumber || ''}
              onValueChange={(value) => handleInputChange('reraNumber', value)}
              options={dropdownValues.reraNumbers}
              placeholder="e.g., P024000000XX"
              searchPlaceholder="Search RERA numbers..."
              emptyMessage="No RERA numbers found."
              disabled={isViewMode}
              error={!!errors.reraNumber}
            />
            {errors.reraNumber && <p className="text-red-500 text-xs mt-1">{errors.reraNumber}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectType">Project Type</Label>
            <Select onValueChange={(value) => handleInputChange('projectType', value)} value={data.projectType || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.projectType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Villa Apartment">Villa Apartment</SelectItem>
              </SelectContent>
            </Select>
            {errors.projectType && <p className="text-red-500 text-xs mt-1">{errors.projectType}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="communityType">Community Type</Label>
            <Select onValueChange={(value) => handleInputChange('communityType', value)} value={data.communityType || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.communityType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select community type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gated Community">Gated</SelectItem>
                <SelectItem value="Semi-Gated Community">Semi-gated</SelectItem>
                <SelectItem value="Standalone">Standalone</SelectItem>
              </SelectContent>
            </Select>
            {errors.communityType && <p className="text-red-500 text-xs mt-1">{errors.communityType}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Scale</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalLandArea">
              Total Land Area {isPRMKARERA ? '(sqmt)' : '(acres)'}
              {isPRMKARERA && data.totalLandArea && (
                <span className="text-xs text-gray-500 ml-2">
                  ({parseFloat(data.totalLandArea).toFixed(4)} acres)
                </span>
              )}
            </Label>
            <Input
              id="totalLandArea"
              type="string"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder={isPRMKARERA ? "e.g., 40468.6 sqmt" : "e.g., 10"}
              value={isPRMKARERA ? (data.totalLandAreaSqmt || '') : (data.totalLandArea || '')}
              onChange={(e) => handleTotalLandAreaChange(e.target.value)}
              className={errors.totalLandArea ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.totalLandArea && <p className="text-red-500 text-xs mt-1">{errors.totalLandArea}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numberOfTowers">Number of Towers</Label>
            <Input
              id="numberOfTowers"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 7"
              value={data.numberOfTowers || ''}
              onChange={(e) => handleInputChange('numberOfTowers', e.target.value)}
              className={errors.numberOfTowers ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.numberOfTowers && <p className="text-red-500 text-xs mt-1">{errors.numberOfTowers}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="numberOfFloors">Number of Floors</Label>
            <Input
              id="numberOfFloors"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 30"
              value={data.numberOfFloors || ''}
              onChange={(e) => handleInputChange('numberOfFloors', e.target.value)}
              className={errors.numberOfFloors ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.numberOfFloors && <p className="text-red-500 text-xs mt-1">{errors.numberOfFloors}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="flatsPerFloor">Flats Per Floor</Label>
            <Input
              id="flatsPerFloor"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 10"
              value={data.flatsPerFloor || ''}
              onChange={(e) => handleInputChange('flatsPerFloor', e.target.value)}
              className={errors.flatsPerFloor ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.flatsPerFloor && <p className="text-red-500 text-xs mt-1">{errors.flatsPerFloor}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="totalUnits">Total Units</Label>
            <Input
              id="totalUnits"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 2100"
              value={data.totalUnits || ''}
              onChange={(e) => handleInputChange('totalUnits', e.target.value)}
              className={errors.totalUnits ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.totalUnits && <p className="text-red-500 text-xs mt-1">{errors.totalUnits}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="openSpace">
              Open Space {isPRMKARERA ? '(sqmt)' : '(%)'}
              {isPRMKARERA && data.openSpace && (
                <span className="text-xs text-gray-500 ml-2">
                  ({data.openSpace}% | {data.openSpaceAcres || '0'} acres)
                </span>
              )}
            </Label>
            <Input
              id="openSpace"
              type={isPRMKARERA ? "text" : "number"}
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder={isPRMKARERA ? "e.g., 28327.6 sqmt" : "e.g., 70"}
              value={isPRMKARERA ? (data.openSpaceSqmt !== undefined && data.openSpaceSqmt !== null && data.openSpaceSqmt !== '' ? String(data.openSpaceSqmt) : '') : (data.openSpace !== undefined && data.openSpace !== null && data.openSpace !== '' ? String(data.openSpace) : '')}
              onChange={(e) => isPRMKARERA ? handleOpenSpaceChange(e.target.value) : handleInputChange('openSpace', e.target.value)}
              className={errors.openSpace ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.openSpace && <p className="text-red-500 text-xs mt-1">{errors.openSpace}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="launchDate">Launch Date</Label>
            <Input
              id="launchDate"
              type="date"
              value={getLaunchDateForInput()}
              onChange={(e) => handleLaunchDateInputChange(e.target.value)}
              className={errors.launchDate ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.launchDate && <p className="text-red-500 text-xs mt-1">{errors.launchDate}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="possessionDate">Possession Date</Label>
            {data.possessionDate === 'RTM' || data.possessionDate?.toUpperCase() === 'RTM' ? (
              <div className="flex gap-2">
                <Input
                  id="possessionDate"
                  type="text"
                  value="RTM"
                  className={`${errors.possessionDate ? 'border-red-500' : ''} bg-gray-50 font-medium`}
                  disabled
                  readOnly
                />
                {!isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onUpdate({ possessionDate: '' })}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <Input
                id="possessionDate"
                type="date"
                value={getPossessionDateForInput()}
                onChange={(e) => handlePossessionDateInputChange(e.target.value)}
                className={errors.possessionDate ? 'border-red-500' : ''}
                disabled={isViewMode}
              />
            )}
            {errors.possessionDate && <p className="text-red-500 text-xs mt-1">{errors.possessionDate}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="constructionStatus">Construction Status</Label>
            <Select onValueChange={(value) => handleInputChange('constructionStatus', value)} value={data.constructionStatus || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.constructionStatus ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="About to RTM">About to RTM</SelectItem>
                <SelectItem value="RTM">RTM</SelectItem>
                <SelectItem value="Under Construction">Under Construction</SelectItem>
              </SelectContent>
            </Select>
            {errors.constructionStatus && <p className="text-red-500 text-xs mt-1">{errors.constructionStatus}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};