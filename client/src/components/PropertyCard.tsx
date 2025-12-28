import { Property } from "@shared/schema";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Banknote, Tag, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: number) => void;
}

export function PropertyCard({ property, onEdit, onDelete }: PropertyCardProps) {
  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    published: "bg-green-100 text-green-700",
    archived: "bg-orange-100 text-orange-700",
    sold: "bg-blue-100 text-blue-700",
  };

  const typeLabels = {
    verified_residential: "Verified Residential",
    unverified_residential: "Unverified Residential",
    commercial: "Commercial",
    plotting: "Plotting",
    commission_residential: "Commission Residential",
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {property.images && property.images.length > 0 ? (
          <img 
            src={property.images[0]} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Home className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className={cn("capitalize shadow-sm", statusColors[property.status as keyof typeof statusColors])}>
            {property.status}
          </Badge>
          <Badge variant="secondary" className="shadow-sm backdrop-blur-md bg-white/90">
            {typeLabels[property.type as keyof typeof typeLabels]}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-5 pb-2">
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-display font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {property.title}
          </h3>
          <p className="font-mono font-bold text-primary whitespace-nowrap">
            {property.price ? `$${property.price.toLocaleString()}` : "Price TBD"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{property.location || "No location set"}</span>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 pb-4">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {property.description || "No description provided."}
        </p>
      </CardContent>

      <CardFooter className="p-4 border-t border-border/50 flex justify-between bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Added {property.createdAt ? formatDistanceToNow(new Date(property.createdAt), { addSuffix: true }) : 'Recently'}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:text-primary hover:bg-primary/10"
            onClick={() => onEdit(property)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this listing?")) {
                onDelete(property.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
