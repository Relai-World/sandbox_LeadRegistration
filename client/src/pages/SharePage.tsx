import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, Phone, User, Calendar, Ruler, IndianRupee, Home, CheckCircle, Loader2 } from "lucide-react";

interface PropertyData {
  projectname?: string;
  buildername?: string;
  areaname?: string;
  city?: string;
  rera_number?: string;
  project_type?: string;
  price_range?: string;
  price_per_sft?: string;
  size_range?: string;
  sqfeet?: string;
  configurations?: any;
  possession_date?: string;
  construction_status?: string;
  total_land_area?: string;
  number_of_towers?: string;
  total_units?: string;
  available_units?: string;
  grid_score?: string;
  external_amenities?: string;
  bank_approvals?: string;
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

  const getValue = (obj: any, ...keys: string[]): string => {
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "" && obj[key] !== "---") {
        return String(obj[key]);
      }
    }
    return "N/A";
  };

  const formatPrice = (value: any): string => {
    if (!value || value === "N/A" || value === "---") return "N/A";
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ""));
    if (isNaN(num)) return String(value);
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} Lac`;
    return num.toLocaleString("en-IN");
  };

  const getConfigurations = (property: PropertyData): string => {
    if (Array.isArray(property.configurations)) {
      return property.configurations.map((c: any) => c.type || c).join(", ") || "N/A";
    }
    return getValue(property, "configurations", "config") || "N/A";
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

  const comparisonMetrics = [
    { label: "Price Range", key: "price_range", format: "price" },
    { label: "Price/Sq Ft", key: "price_per_sft" },
    { label: "Size Range", key: "size_range" },
    { label: "GRID Score", key: "grid_score" },
    { label: "Location", key: "areaname" },
    { label: "Possession", key: "possession_date" },
    { label: "Status", key: "construction_status" },
    { label: "Towers", key: "number_of_towers" },
    { label: "Total Units", key: "total_units" },
    { label: "Available", key: "available_units" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Property Comparison</h1>
              <p className="text-primary-foreground/80">Curated properties for your review</p>
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
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Properties Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.properties.map((property, idx) => (
              <Card key={idx} className="overflow-hidden" data-testid={`card-property-${idx}`}>
                <CardHeader className="bg-primary/10 pb-3">
                  <CardTitle className="text-lg line-clamp-1" data-testid={`text-property-name-${idx}`}>
                    {getValue(property, "projectname", "projectName")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    By {getValue(property, "buildername", "builderName")}
                  </p>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{getValue(property, "areaname", "city", "projectlocation")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatPrice(getValue(property, "price_range", "priceRange"))}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span>{getValue(property, "size_range", "sizeRange", "sqfeet")} sq.ft</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{getConfigurations(property)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{getValue(property, "possession_date", "possessionDate")}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">
                      RERA: {getValue(property, "rera_number", "RERA_Number")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getValue(property, "project_type", "Project_Type")}
                    </Badge>
                    {getValue(property, "grid_score", "GRID_Score") !== "N/A" && (
                      <Badge className="text-xs bg-green-600">
                        GRID: {getValue(property, "grid_score", "GRID_Score")}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Property Comparison
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="table-comparison">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="p-3 text-left font-medium">Metric</th>
                  {data.properties.map((property, idx) => (
                    <th key={idx} className="p-3 text-left font-medium min-w-[180px]">
                      {getValue(property, "projectname", "projectName").substring(0, 20)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map((metric, rowIdx) => (
                  <tr key={metric.key} className={rowIdx % 2 === 0 ? "bg-muted/30" : "bg-background"}>
                    <td className="p-3 font-medium text-muted-foreground">{metric.label}</td>
                    {data.properties.map((property, colIdx) => {
                      let value = getValue(property, metric.key);
                      if (metric.format === "price") value = formatPrice(value);
                      return (
                        <td key={colIdx} className="p-3" data-testid={`cell-${metric.key}-${colIdx}`}>
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="text-xl font-semibold mb-4">Detailed Property Information</h2>
          
          {data.properties.map((property, idx) => (
            <Card key={idx} className="mb-6" data-testid={`card-details-${idx}`}>
              <CardHeader>
                <CardTitle>{getValue(property, "projectname", "projectName")}</CardTitle>
                <p className="text-muted-foreground">
                  {getValue(property, "buildername", "builderName")} | {getValue(property, "areaname", "city")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem label="RERA Number" value={getValue(property, "rera_number", "RERA_Number")} />
                  <DetailItem label="Project Type" value={getValue(property, "project_type", "Project_Type")} />
                  <DetailItem label="Price Range" value={formatPrice(getValue(property, "price_range"))} />
                  <DetailItem label="Price/Sq Ft" value={getValue(property, "price_per_sft")} />
                  <DetailItem label="Size Range" value={getValue(property, "size_range", "sqfeet")} />
                  <DetailItem label="Configurations" value={getConfigurations(property)} />
                  <DetailItem label="GRID Score" value={getValue(property, "grid_score")} />
                  <DetailItem label="Construction Status" value={getValue(property, "construction_status")} />
                  <DetailItem label="Possession Date" value={getValue(property, "possession_date")} />
                  <DetailItem label="Total Land Area" value={getValue(property, "total_land_area")} />
                  <DetailItem label="Number of Towers" value={getValue(property, "number_of_towers")} />
                  <DetailItem label="Total Units" value={getValue(property, "total_units")} />
                  <DetailItem label="Available Units" value={getValue(property, "available_units")} />
                  <DetailItem label="Units Sold" value={getValue(property, "units_sold")} />
                  <DetailItem label="Flats Per Floor" value={getValue(property, "number_of_flats_per_floor")} />
                  <DetailItem label="Floor Rise Charges" value={getValue(property, "floor_rise_charges")} />
                  <DetailItem label="Car Parking Charges" value={getValue(property, "car_parking_charges")} />
                  <DetailItem label="Maintenance Charges" value={getValue(property, "maintenance_charges")} />
                  <DetailItem label="Bank Approvals" value={getValue(property, "bank_approvals")} />
                </div>
                
                {getValue(property, "external_amenities", "amenities") !== "N/A" && (
                  <div className="mt-4">
                    <p className="font-medium text-muted-foreground mb-2">Amenities</p>
                    <p className="text-sm">{getValue(property, "external_amenities", "amenities")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="bg-muted py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>Powered by Relai World | www.relai.world</p>
          <p className="mt-1">This comparison was generated on {new Date(data.createdAt).toLocaleDateString()}</p>
        </div>
      </footer>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default SharePage;
