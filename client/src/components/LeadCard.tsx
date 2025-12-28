import { Lead } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface LeadCardProps {
  lead: Lead;
  onUpdateStatus: (id: number, status: string) => void;
}

export function LeadCard({ lead, onUpdateStatus }: LeadCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    await onUpdateStatus(lead.id, newStatus);
    setLoading(false);
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-700 border-blue-200",
    contacted: "bg-yellow-100 text-yellow-700 border-yellow-200",
    qualified: "bg-purple-100 text-purple-700 border-purple-200",
    closed: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary/20 hover:border-l-primary">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-foreground">{lead.name}</h4>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3" />
            {lead.createdAt ? format(new Date(lead.createdAt), "MMM d, yyyy") : "N/A"}
          </p>
        </div>
        <Select 
          value={lead.status} 
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger className={`w-[110px] h-8 text-xs font-medium border-0 ${statusColors[lead.status as keyof typeof statusColors]}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 mb-4">
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <Mail className="w-3.5 h-3.5" />
            <a href={`mailto:${lead.email}`}>{lead.email}</a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <Phone className="w-3.5 h-3.5" />
            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
          </div>
        )}
      </div>

      {lead.interest && (
        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground mb-3">
          Interested in: <span className="font-medium text-foreground">{lead.interest}</span>
        </div>
      )}

      {lead.notes && (
        <p className="text-xs text-muted-foreground italic border-t pt-2 mt-2">
          "{lead.notes}"
        </p>
      )}
    </Card>
  );
}
