import { useEffect } from 'react';

/**
 * Hook to dynamically set the page title
 * @param title - The title to set. If not provided, uses default title
 */
export const usePageTitle = (title?: string) => {
  useEffect(() => {
    const defaultTitle = 'RELAI | Clear, Data-Backed Property Guidance';
    document.title = title || defaultTitle;
    
    // Update meta description if needed
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && title) {
      metaDescription.setAttribute('content', `${title} - Find verified properties with Relai`);
    }
    
    // Cleanup: restore default title when component unmounts
    return () => {
      document.title = defaultTitle;
    };
  }, [title]);
};

/**
 * Hook to set property-specific page title
 * Format: "{ProjectName}, {AreaName}, {City} | Relai"
 */
export const usePropertyPageTitle = (property?: {
  ProjectName?: string;
  projectname?: string;
  AreaName?: string;
  areaname?: string;
  City?: string;
  city?: string;
}) => {
  useEffect(() => {
    if (!property) {
      document.title = 'RELAI | Clear, Data-Backed Property Guidance';
      return;
    }

    const projectName = property.ProjectName || property.projectname || '';
    const areaName = property.AreaName || property.areaname || '';
    const city = property.City || property.city || '';

    // Build title: "ProjectName, AreaName, City | Relai"
    const titleParts: string[] = [];
    if (projectName) titleParts.push(projectName);
    if (areaName) titleParts.push(areaName);
    if (city) titleParts.push(city);
    
    const title = titleParts.length > 0 
      ? `${titleParts.join(', ')} | Relai`
      : 'RELAI | Clear, Data-Backed Property Guidance';
    
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const description = projectName && city
        ? `Explore ${projectName} in ${city}. ${areaName ? `Located in ${areaName}. ` : ''}Find verified RERA properties with Relai's expert guidance.`
        : 'Start Discovering smarter real estate with Relai. Buy RERA verified properties in Hyderabad with our expert real estate guidance, loan assistance and legal checks all in one place.';
      metaDescription.setAttribute('content', description);
    }
  }, [property]);
};










