import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useLeads, useCreateLead, useUpdateLead } from "@/hooks/use-leads";
import { LeadCard } from "@/components/LeadCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema } from "@shared/schema";
import { z } from "zod";

type LeadFormData = z.infer<typeof insertLeadSchema>;

export default function Leads() {
  const [filter, setFilter] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: leads, isLoading } = useLeads();
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      interest: "",
      notes: "",
      status: "new",
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    await createMutation.mutateAsync(data);
    setIsDialogOpen(false);
    form.reset();
  };

  const filteredLeads = leads?.filter(l => 
    l.name.toLowerCase().includes(filter.toLowerCase()) || 
    l.email?.toLowerCase().includes(filter.toLowerCase())
  );

  const columns = [
    { id: "new", title: "New Leads", color: "bg-blue-50 border-blue-200" },
    { id: "contacted", title: "Contacted", color: "bg-yellow-50 border-yellow-200" },
    { id: "qualified", title: "Qualified", color: "bg-purple-50 border-purple-200" },
    { id: "closed", title: "Closed", color: "bg-green-50 border-green-200" },
  ];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Leads Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track and manage your potential clients</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="mb-8 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search leads by name or email..." 
          className="pl-9 bg-card border-border/50"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-muted/20 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className={`rounded-xl border ${col.color} p-4 min-w-[280px]`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-foreground">{col.title}</h3>
                <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-foreground/70">
                  {filteredLeads?.filter(l => l.status === col.id).length || 0}
                </span>
              </div>
              
              <div className="space-y-3">
                {filteredLeads
                  ?.filter(l => l.status === col.id)
                  .map(lead => (
                    <LeadCard 
                      key={lead.id} 
                      lead={lead} 
                      onUpdateStatus={(id, status) => updateMutation.mutate({ id, status: status as any })}
                    />
                  ))
                }
                {filteredLeads?.filter(l => l.status === col.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/50 text-sm border-2 border-dashed border-black/5 rounded-lg">
                    No leads
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...form.register("name")} placeholder="John Doe" />
              {form.formState.errors.name && <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...form.register("email")} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} placeholder="+1 234..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest">Interested In</Label>
              <Input id="interest" {...form.register("interest")} placeholder="e.g. 3BHK in Downtown" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register("notes")} placeholder="Additional details..." />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>Add Lead</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
