import { useState, useEffect, useRef, useCallback } from 'react';

export interface DropdownValues {
  projectNames: string[];
  builderNames: string[];
  reraNumbers: string[];
  cities: string[];
  states: string[];
}

export interface UsePropertyDropdownReturn {
  dropdownValues: DropdownValues;
  loading: boolean;
  fetchPropertyDetails: (
    projectName?: string,
    reraNumber?: string,
    onSuccess?: (propertyData: any) => void
  ) => Promise<void>;
}

export const usePropertyDropdown = (): UsePropertyDropdownReturn => {
  const [dropdownValues, setDropdownValues] = useState<DropdownValues>({
    projectNames: [],
    builderNames: [],
    reraNumbers: [],
    cities: [],
    states: []
  });
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef<number>(0);
  const latestRequestIdRef = useRef<number>(0);

  // Additional cities and states to always include in dropdowns
  const additionalCities = ['Bangalore'];
  const additionalStates = ['Karnataka'];

  // Fetch dropdown values on mount
  useEffect(() => {
    const fetchDropdownValues = async () => {
      try {
        const response = await fetch('/api/verified/dropdown-values');
        const result = await response.json();
        
        if (result.success) {
          // Merge database values with additional hardcoded values
          const mergedCities = [...new Set([...additionalCities, ...(result.data.cities || [])])].sort();
          const mergedStates = [...new Set([...additionalStates, ...(result.data.states || [])])].sort();
          
          setDropdownValues({
            ...result.data,
            cities: mergedCities,
            states: mergedStates
          });
        }
      } catch (error) {
        console.error('Error fetching dropdown values:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownValues();
  }, []);

  // Fetch property details by Project Name or RERA Number
  const fetchPropertyDetails = useCallback(
    async (
      projectName?: string,
      reraNumber?: string,
      onSuccess?: (propertyData: any) => void
    ) => {
      if (!projectName && !reraNumber) {
        console.log('fetchPropertyDetails - No projectName or reraNumber provided');
        return;
      }

      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;
      latestRequestIdRef.current = currentRequestId;

      try {
        const queryParam = projectName 
          ? `projectName=${encodeURIComponent(projectName)}`
          : `reraNumber=${encodeURIComponent(reraNumber!)}`;
        
        console.log('fetchPropertyDetails - Fetching with params:', queryParam);
        const response = await fetch(`/api/verified/property-details?${queryParam}`);
        console.log('fetchPropertyDetails - Response status:', response.status);
        
        const result = await response.json();
        console.log('fetchPropertyDetails - Response data:', result);
        
        // Check if this is still the latest request
        if (latestRequestIdRef.current !== currentRequestId) {
          console.log('fetchPropertyDetails - Outdated request, ignoring');
          return;
        }
        
        if (!response.ok) {
          console.error('fetchPropertyDetails - API error:', result.message || 'Unknown error');
          return;
        }
        
        if (result.success && result.data && onSuccess) {
          console.log('fetchPropertyDetails - Calling onSuccess with data');
          onSuccess(result.data);
        } else if (!result.success) {
          console.warn('fetchPropertyDetails - API returned success=false:', result.message);
        } else if (!result.data) {
          console.warn('fetchPropertyDetails - No data in response');
        }
      } catch (error) {
        console.error('fetchPropertyDetails - Exception caught:', error);
        console.error('fetchPropertyDetails - Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    },
    []
  );

  return {
    dropdownValues,
    loading,
    fetchPropertyDetails
  };
};
