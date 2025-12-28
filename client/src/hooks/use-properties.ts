import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertProperty, type Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProperties(filters?: { type?: string; status?: string; agentId?: string }) {
  const queryKey = filters 
    ? [api.properties.list.path, filters.type, filters.status, filters.agentId]
    : [api.properties.list.path];

  // Construct query string manually since fetch needs a string URL
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append("type", filters.type);
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.agentId) queryParams.append("agentId", filters.agentId);

  const url = `${api.properties.list.path}?${queryParams.toString()}`;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return api.properties.list.responses[200].parse(await res.json());
    },
  });
}

export function useProperty(id: number) {
  return useQuery({
    queryKey: [api.properties.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.properties.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch property");
      return api.properties.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertProperty) => {
      const res = await fetch(api.properties.create.path, {
        method: api.properties.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create property");
      }
      return api.properties.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      toast({ title: "Success", description: "Property listing created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertProperty>) => {
      const url = buildUrl(api.properties.update.path, { id });
      const res = await fetch(url, {
        method: api.properties.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update property");
      return api.properties.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      toast({ title: "Updated", description: "Property details updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.properties.delete.path, { id });
      const res = await fetch(url, { 
        method: api.properties.delete.method,
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete property");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      toast({ title: "Deleted", description: "Property removed from listings" });
    },
  });
}
