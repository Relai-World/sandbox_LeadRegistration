import React, { useState, useEffect } from 'react';
import { Loader2, Edit, Eye, Trash2, MapPin, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';

interface Property {
  _id: string;
  S_No?: number;
  BuilderName?: string;
  ProjectName?: string;
  RERA_Number?: string;
  AreaName?: string;
  PriceSheet?: number;
  Possession_Date?: string;
  'Base Project Price'?: number;
  property_type?: string;
  GRID_Score?: number;
  connectivity_score?: number;
  amenities_score?: number;
  google_place_id?: string;
  google_place_name?: string;
  google_place_address?: string;
  google_place_location?: {
    lat: number;
    lng: number;
  };
  google_place_rating?: number;
  google_place_user_ratings_total?: number;
  google_maps_url?: string;
  mobile_google_map_url?: string;
  hospitals_count?: number;
  shopping_malls_count?: number;
  schools_count?: number;
  restaurants_count?: number;
  restaurants_above_4_stars_count?: number;
  supermarkets_count?: number;
  it_offices_count?: number;
  metro_stations_count?: number;
  railway_stations_count?: number;
  nearest_hospitals?: any[];
  nearest_shopping_malls?: any[];
  nearest_schools?: any[];
  nearest_restaurants?: any[];
  high_rated_restaurants?: any[];
  nearest_supermarkets?: any[];
  nearest_it_offices?: any[];
  nearest_metro_station?: any[];
  nearest_railway_station?: any[];
  nearest_orr_access?: any[];
  amenities_updated_at?: string;
  configurations?: any[];
  [key: string]: any;
}

const AllPropertiesSection: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchAllProperties();
    }
  }, [user]);

  const fetchAllProperties = async () => {
    try {
      setLoading(true);
      
      const userEmail = user?.email;
      
      if (!userEmail) {
        throw new Error('User not logged in');
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/properties/submitted/${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setProperties(result.data);
      } else {
        throw new Error(result.message || 'Failed to load properties');
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return 'N/A';
    return price.toLocaleString('en-IN');
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return date;
  };

  const formatNearestList = (items: any[] | undefined) => {
    if (!items || !Array.isArray(items) || items.length === 0) return <span className="text-gray-500">None</span>;
    return (
      <>
        {items.slice(0, 3).map((item, idx) => (
          <div key={idx} className="text-xs mb-1">
            <span className="font-medium">{item.name || 'N/A'}</span>
            {item.rating && <span className="text-gray-500"> ({item.rating}⭐)</span>}
            {item.distance && <span className="text-blue-600"> - {item.distance}km</span>}
          </div>
        ))}
      </>
    );
  };

  const formatConfigurations = (configs: any[] | undefined) => {
    if (!configs || !Array.isArray(configs) || configs.length === 0) return <span className="text-gray-500">None</span>;
    return (
      <>
        {configs.map((config, idx) => (
          <div key={idx} className="text-xs mb-1">
            <span className="font-semibold">{config.type || 'N/A'}</span>
            <span className="text-gray-600"> - {config.sizeRange} {config.sizeUnit}</span>
            {config.facing && <span className="text-blue-600"> ({config.facing})</span>}
            {config.BaseProjectPrice && <span className="text-green-600"> - ₹{formatPrice(Number(config.BaseProjectPrice))}</span>}
          </div>
        ))}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Your Submitted Projects
          </h1>
          <p className="text-gray-600 text-sm lg:text-base">
            Agent: {user?.email}
          </p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            You have not submitted any projects yet.
          </h3>
          <p className="text-gray-600 mb-6">
            Complete and submit a property form to see it here.
          </p>
          <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4 inline-block">
            💡 <strong>How it works:</strong><br/>
            1. Fill out the "New Project (Short Form)" to create a draft<br/>
            2. Click "Edit & Continue" from your Drafts<br/>
            3. Complete the full form and submit<br/>
            4. Your project will appear here with status "Submitted"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          Your Submitted Projects
        </h1>
        <p className="text-gray-600 text-sm lg:text-base">
          Total Properties: {properties.length} | Showing all submitted projects
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                {/* Basic Info */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap">S.No</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Builder Name</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Project Name</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">RERA Number</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[120px]">Area</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-right">Price/Sqft</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Possession</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-right min-w-[120px]">Base Price</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Type</TableHead>
                
                {/* Google Place Info */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[150px]">Place Name</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Address</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Location</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Rating</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Reviews</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Desktop Maps</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap">Mobile Maps</TableHead>
                
                {/* Scores */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">GRID Score</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Connectivity</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Amenities</TableHead>
                
                {/* Counts */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Hospitals</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Malls</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Schools</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Restaurants</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">4★ Restaurants</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Supermarkets</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">IT Offices</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Metro</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center">Railway</TableHead>
                
                {/* Nearest Facilities */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Hospitals</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Malls</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Schools</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Restaurants</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">High Rated Restaurants</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Supermarkets</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest IT Offices</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Metro</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">Nearest Railway</TableHead>
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[200px]">ORR Access</TableHead>
                
                {/* Configurations */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap min-w-[250px]">Configurations</TableHead>
                
                {/* Actions */}
                <TableHead className="font-semibold text-gray-700 whitespace-nowrap text-center sticky right-0 bg-gray-50">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property, index) => (
                <TableRow 
                  key={property._id || property.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Basic Info - Support both MongoDB (PascalCase) and Supabase (snake_case) */}
                  <TableCell className="font-medium text-gray-900">
                    {property.S_No || index + 1}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {property.BuilderName || property.buildername || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {property.ProjectName || property.projectname || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700 font-mono text-sm">
                    {property.RERA_Number || property.rera_number || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {property.AreaName || property.projectlocation || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">
                    {property.PriceSheet || property.price_per_sft ? `₹${formatPrice(property.PriceSheet || property.price_per_sft)}` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm">
                    {formatDate(property.Possession_Date || property.possession_date)}
                  </TableCell>
                  <TableCell className="text-right text-gray-700">
                    ₹{formatPrice(property['Base Project Price'] || property.baseprojectprice)}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {property.property_type || property.project_type || 'N/A'}
                  </TableCell>
                  
                  {/* Google Place Info */}
                  <TableCell className="text-gray-700 text-sm">
                    {property.google_place_name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-600 text-xs">
                    {property.google_place_address || 'N/A'}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {property.google_place_location && property.google_place_location.lat && property.google_place_location.lng ? (
                      <div>
                        <div>Lat: {Number(property.google_place_location.lat).toFixed(4)}</div>
                        <div>Lng: {Number(property.google_place_location.lng).toFixed(4)}</div>
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {property.google_place_rating 
                        ? `⭐ ${property.google_place_rating}` 
                        : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.google_place_user_ratings_total || '0'}
                  </TableCell>
                  <TableCell>
                    {property.google_maps_url && (
                      <a 
                        href={property.google_maps_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        title="Open in Desktop Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    {property.mobile_google_map_url && (
                      <a 
                        href={property.mobile_google_map_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-600 hover:text-green-800"
                        title="Open in Mobile Maps"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    )}
                  </TableCell>
                  
                  {/* Scores */}
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold ${
                      property.GRID_Score && Number(property.GRID_Score) >= 8 
                        ? 'bg-green-100 text-green-800' 
                        : property.GRID_Score && Number(property.GRID_Score) >= 6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {property.GRID_Score ? Number(property.GRID_Score).toFixed(1) : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                      {property.connectivity_score || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                      {property.amenities_score || 'N/A'}
                    </span>
                  </TableCell>
                  
                  {/* Counts */}
                  <TableCell className="text-center text-gray-700">
                    {property.hospitals_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.shopping_malls_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.schools_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.restaurants_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.restaurants_above_4_stars_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.supermarkets_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.it_offices_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.metro_stations_count || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">
                    {property.railway_stations_count || 0}
                  </TableCell>
                  
                  {/* Nearest Facilities */}
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_hospitals)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_shopping_malls)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_schools)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_restaurants)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.high_rated_restaurants)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_supermarkets)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_it_offices)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_metro_station)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_railway_station)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-h-32 overflow-y-auto">
                      {formatNearestList(property.nearest_orr_access)}
                    </div>
                  </TableCell>
                  
                  {/* Configurations */}
                  <TableCell>
                    <div className="max-h-40 overflow-y-auto">
                      {formatConfigurations(property.configurations)}
                    </div>
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="sticky right-0 bg-white">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-600">No properties found</p>
        </div>
      )}
    </div>
  );
};

export default AllPropertiesSection;
