import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Phone, User, Calendar, Ruler, IndianRupee, Home, CheckCircle, Loader2, Star, Car, Trees, Building, Waves, Shield } from "lucide-react";
import heroImage from "@assets/relai_hero.png";

interface PropertyData {
  [key: string]: any;
}

interface ShareData {
  success: boolean;
  leadName: string;
  leadMobile: string;
  properties: PropertyData[];
  createdAt: string;
}

const SharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareData = async () => {
      try {
        const response = await fetch(`/api/share/${token}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result);
        } else {
          setError(result.message || "Failed to load property comparison");
        }
      } catch (err) {
        setError("Failed to load property comparison");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchShareData();
    }
  }, [token]);

  const isValidValue = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === '' || normalized === 'n/a' || normalized === 'na' || 
          normalized === '-' || normalized === '--' || normalized === '---' ||
          normalized === 'null' || normalized === 'undefined') {
        return false;
      }
    }
    return true;
  };

  const getValue = (obj: any, ...keys: string[]): string | null => {
    for (const key of keys) {
      const value = obj[key];
      if (isValidValue(value)) {
        return String(value);
      }
    }
    return null;
  };

  const formatPrice = (value: any): string | null => {
    if (!isValidValue(value)) return null;
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return String(value);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-container">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading property comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="error-container">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive text-lg">{error || "Link not found"}</p>
            <p className="text-muted-foreground mt-2">This comparison link may have expired or is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const basicInfoKeys = [
    'projectname', 'buildername', 'areaname', 'city', 'state', 'rera_number', 
    'project_type', 'communitytype', 'project_status', 'isavailable'
  ];

  const pricingKeys = [
    'baseprojectprice', 'price_per_sft', 'floor_rise_charges', 'floor_rise_amount_per_floor',
    'floor_rise_applicable_above_floor_no', 'facing_charges', 'preferential_location_charges',
    'preferential_location_charges_conditions', 'amount_for_extra_car_parking'
  ];

  const configurationKeys = [
    'bhk', 'sqfeet', 'sqyard', 'facing', 'carpet_area_percentage', 
    'floor_to_ceiling_height', 'main_door_height', 'uds', 'fsi'
  ];

  const projectDetailsKeys = [
    'total_land_area', 'number_of_towers', 'number_of_floors', 
    'number_of_flats_per_floor', 'total_number_of_units', 'open_space',
    'possession_date', 'project_launch_date', 'construction_status'
  ];

  const amenitiesKeys = [
    'powerbackup', 'no_of_passenger_lift', 'no_of_service_lift', 
    'visitor_parking', 'ground_vehicle_movement', 'no_of_car_parkings',
    'external_amenities', 'specification'
  ];

  const scoreKeys = [
    'GRID_Score', 'connectivity_score', 'amenities_score',
    'google_place_rating', 'google_place_user_ratings_total'
  ];

  const nearbyKeys = [
    'hospitals_count', 'shopping_malls_count', 'schools_count', 
    'restaurants_count', 'restaurants_above_4_stars_count', 'supermarkets_count',
    'it_offices_count', 'metro_stations_count', 'railway_stations_count'
  ];

  const getComparisonRows = (keys: string[]): { key: string; values: (string | null)[] }[] => {
    const rows: { key: string; values: (string | null)[] }[] = [];
    
    for (const key of keys) {
      const values = data.properties.map(prop => {
        const val = prop[key];
        if (key.toLowerCase().includes('price') || key === 'baseprojectprice') {
          return formatPrice(val);
        }
        return isValidValue(val) ? String(val) : null;
      });
      
      if (values.some(v => v !== null)) {
        rows.push({ key, values });
      }
    }
    
    return rows;
  };

  const renderComparisonTable = (title: string, keys: string[], icon: React.ReactNode) => {
    const rows = getComparisonRows(keys);
    if (rows.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse" data-testid={`table-${title.toLowerCase().replace(/\s/g, '-')}`}>
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="p-3 text-left font-medium border-r border-primary-foreground/20">Property</th>
                {data.properties.map((property, idx) => (
                  <th key={idx} className="p-3 text-left font-medium min-w-[180px]">
                    {getValue(property, 'projectname')?.substring(0, 25) || `Property ${idx + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={row.key} className={rowIdx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                  <td className="p-3 font-medium text-muted-foreground border-r">{formatLabel(row.key)}</td>
                  {row.values.map((value, colIdx) => (
                    <td key={colIdx} className="p-3" data-testid={`cell-${row.key}-${colIdx}`}>
                      {value || <span className="text-muted-foreground/50">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="relative">
        <div className="w-full">
          <img 
            src={heroImage} 
            alt="Relai Right Home Report" 
            className="w-full h-auto object-cover"
            data-testid="img-hero"
          />
        </div>
        <div className="bg-primary/95 text-primary-foreground py-4 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-primary-foreground/80">Personalized property comparison prepared for you</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span data-testid="text-lead-name">{data.leadName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  <span data-testid="text-lead-mobile">{data.leadMobile}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Properties Overview ({data.properties.length} Properties)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.properties.map((property, idx) => {
              const projectName = getValue(property, 'projectname');
              const builderName = getValue(property, 'buildername');
              const areaName = getValue(property, 'areaname', 'city');
              const price = formatPrice(getValue(property, 'baseprojectprice'));
              const sqft = getValue(property, 'sqfeet');
              const bhk = getValue(property, 'bhk');
              const possession = getValue(property, 'possession_date');
              const reraNumber = getValue(property, 'rera_number');
              const projectType = getValue(property, 'project_type');
              const gridScore = getValue(property, 'GRID_Score');
              const pricePerSft = getValue(property, 'price_per_sft');
              
              return (
                <Card key={idx} className="overflow-hidden" data-testid={`card-property-${idx}`}>
                  <CardHeader className="bg-primary/10 pb-3">
                    <CardTitle className="text-lg line-clamp-1" data-testid={`text-property-name-${idx}`}>
                      {projectName || `Property ${idx + 1}`}
                    </CardTitle>
                    {builderName && (
                      <p className="text-sm text-muted-foreground">By {builderName}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {areaName && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{areaName}</span>
                      </div>
                    )}
                    
                    {price && (
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{price}</span>
                        {pricePerSft && <span className="text-muted-foreground">({pricePerSft}/sft)</span>}
                      </div>
                    )}
                    
                    {sqft && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>{sqft} sq.ft</span>
                        {bhk && <span className="text-muted-foreground">| {bhk} BHK</span>}
                      </div>
                    )}
                    
                    {possession && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>Possession: {possession}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      {reraNumber && (
                        <Badge variant="secondary" className="text-xs">
                          RERA: {reraNumber}
                        </Badge>
                      )}
                      {projectType && (
                        <Badge variant="outline" className="text-xs">
                          {projectType}
                        </Badge>
                      )}
                      {gridScore && (
                        <Badge className="text-xs bg-green-600">
                          GRID: {gridScore}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-primary" />
            Comprehensive Property Comparison
          </h2>
          
          {renderComparisonTable("Basic Information", basicInfoKeys, <Building2 className="h-5 w-5 text-primary" />)}
          {renderComparisonTable("Pricing Details", pricingKeys, <IndianRupee className="h-5 w-5 text-primary" />)}
          {renderComparisonTable("Unit Configuration", configurationKeys, <Home className="h-5 w-5 text-primary" />)}
          {renderComparisonTable("Project Details", projectDetailsKeys, <Building className="h-5 w-5 text-primary" />)}
          {renderComparisonTable("Amenities & Features", amenitiesKeys, <Waves className="h-5 w-5 text-primary" />)}
          {renderComparisonTable("Scores & Ratings", scoreKeys, <Star className="h-5 w-5 text-primary" />)}
          {renderComparisonTable("Nearby Facilities Count", nearbyKeys, <MapPin className="h-5 w-5 text-primary" />)}
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Additional Property Details
          </h2>
          
          {data.properties.map((property, idx) => {
            const projectName = getValue(property, 'projectname');
            const builderName = getValue(property, 'buildername');
            const areaName = getValue(property, 'areaname');
            const googleRating = getValue(property, 'google_place_rating');
            const googleAddress = getValue(property, 'google_place_address');
            const mapsUrl = getValue(property, 'mobile_google_map_url', 'google_maps_location', 'projectlocation');
            const brochure = getValue(property, 'projectbrochure');
            
            const allKeys = Object.keys(property).filter(key => 
              !basicInfoKeys.includes(key) && 
              !pricingKeys.includes(key) && 
              !configurationKeys.includes(key) &&
              !projectDetailsKeys.includes(key) &&
              !amenitiesKeys.includes(key) &&
              !scoreKeys.includes(key) &&
              !nearbyKeys.includes(key) &&
              !key.includes('nearest_') &&
              !key.includes('google_place_raw') &&
              isValidValue(property[key])
            );
            
            return (
              <Card key={idx} className="mb-6" data-testid={`card-details-${idx}`}>
                <CardHeader>
                  <CardTitle>{projectName || `Property ${idx + 1}`}</CardTitle>
                  <div className="flex flex-wrap gap-2 text-muted-foreground text-sm">
                    {builderName && <span>{builderName}</span>}
                    {areaName && <span>| {areaName}</span>}
                    {googleRating && (
                      <span className="flex items-center gap-1">
                        | <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {googleRating}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {googleAddress && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-sm">{googleAddress}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    {mapsUrl && (
                      <a 
                        href={mapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <MapPin className="h-4 w-4" /> View on Google Maps
                      </a>
                    )}
                    {brochure && (
                      <a 
                        href={brochure} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Building2 className="h-4 w-4" /> View Brochure
                      </a>
                    )}
                  </div>
                  
                  {allKeys.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {allKeys.slice(0, 16).map(key => {
                        const value = property[key];
                        if (!isValidValue(value)) return null;
                        return (
                          <div key={key} className="text-sm">
                            <p className="text-muted-foreground">{formatLabel(key)}</p>
                            <p className="font-medium truncate" title={String(value)}>
                              {String(value).substring(0, 50)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>

      <footer className="bg-muted py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p className="font-medium">Powered by Relai World | www.relai.world</p>
          <p className="mt-1">This comparison was generated on {new Date(data.createdAt).toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          <p className="mt-2 text-xs">For the right home, trust Relai.</p>
        </div>
      </footer>
    </div>
  );
};

export default SharePage;
