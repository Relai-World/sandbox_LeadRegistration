import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PropertyCard } from "@/components/PropertyCard";
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty } from "@/hooks/use-properties";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Property, InsertProperty } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPropertySchema } from "@shared/schema";

// Form Schema
const propertyFormSchema = insertPropertySchema.extend({
  price: z.coerce.number().min(1, "Price is required"),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

export default function Properties() {
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  const { data: properties, isLoading } = useProperties();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const deleteMutation = useDeleteProperty();

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      price: 0,
      type: "unverified_residential",
      status: "draft",
      images: [],
    },
  });

  const handleOpenCreate = () => {
    setEditingProperty(null);
    form.reset({
      title: "",
      description: "",
      location: "",
      price: 0,
      type: "unverified_residential",
      status: "draft",
      images: [],
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (property: Property) => {
    setEditingProperty(property);
    form.reset({
      title: property.title,
      description: property.description || "",
      location: property.location || "",
      price: property.price || 0,
      type: property.type as any,
      status: property.status as any,
      images: property.images || [],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: PropertyFormData) => {
    try {
      if (editingProperty) {
        await updateMutation.mutateAsync({ id: editingProperty.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const filteredProperties = properties?.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(filter.toLowerCase()) || 
                          p.location?.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Properties</h1>
          <p className="text-muted-foreground mt-1">Manage your real estate listings</p>
        </div>
        <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search properties..." 
            className="pl-9 bg-muted/30 border-transparent focus:bg-background transition-colors"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-muted/30 border-transparent focus:bg-background">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="verified_residential">Verified Residential</SelectItem>
              <SelectItem value="unverified_residential">Unverified Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="plotting">Plotting</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[340px] bg-muted/20 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties?.map((property) => (
            <PropertyCard 
              key={property.id} 
              property={property} 
              onEdit={handleOpenEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
          {filteredProperties?.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
              <p>No properties found matching your criteria.</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProperty ? "Edit Property" : "Create New Listing"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" {...form.register("title")} placeholder="e.g. Luxury Villa in Downtown" />
                {form.formState.errors.title && <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Property Type</Label>
                <Select 
                  onValueChange={(val) => form.setValue("type", val as any)} 
                  defaultValue={form.getValues("type")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified_residential">Verified Residential</SelectItem>
                    <SelectItem value="unverified_residential">Unverified Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="plotting">Plotting</SelectItem>
                    <SelectItem value="commission_residential">Commission Residential</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  onValueChange={(val) => form.setValue("status", val as any)} 
                  defaultValue={form.getValues("status")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input type="number" id="price" {...form.register("price")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...form.register("location")} placeholder="City, Address" />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...form.register("description")} 
                  placeholder="Describe the property..." 
                  className="h-24"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Image URL (First image used as cover)</Label>
                <Input 
                  placeholder="https://images.unsplash.com/..." 
                  onChange={(e) => {
                    const val = e.target.value;
                    form.setValue("images", val ? [val] : []);
                  }}
                  defaultValue={form.getValues("images")?.[0]}
                />
                <p className="text-xs text-muted-foreground">For demo, paste an Unsplash URL directly.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingProperty ? "Save Changes" : "Create Listing"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
