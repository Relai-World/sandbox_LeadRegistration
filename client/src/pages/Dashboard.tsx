import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { useProperties } from "@/hooks/use-properties";
import { useLeads } from "@/hooks/use-leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Building2, TrendingUp, Users } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: properties, isLoading: loadingProps } = useProperties();
  const { data: leads, isLoading: loadingLeads } = useLeads();

  const stats = [
    {
      title: "Total Properties",
      value: properties?.length || 0,
      icon: Building2,
      description: "Active listings",
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Active Leads",
      value: leads?.filter(l => l.status !== 'closed').length || 0,
      icon: Users,
      description: "Potential buyers",
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      title: "Properties Sold",
      value: properties?.filter(p => p.status === 'sold').length || 0,
      icon: TrendingUp,
      description: "Closed deals",
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      title: "Conversion Rate",
      value: "12%",
      icon: Activity,
      description: "Leads to sales",
      color: "text-orange-600",
      bg: "bg-orange-100"
    }
  ];

  const chartData = [
    { name: 'Mon', leads: 4 },
    { name: 'Tue', leads: 3 },
    { name: 'Wed', leads: 7 },
    { name: 'Thu', leads: 5 },
    { name: 'Fri', leads: 9 },
    { name: 'Sat', leads: 6 },
    { name: 'Sun', leads: 4 },
  ];

  if (loadingProps || loadingLeads) {
    return (
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your agency today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Lead Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="leads" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {leads?.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                    {lead.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {lead.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.email}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    lead.status === 'new' ? 'bg-blue-500' : 
                    lead.status === 'contacted' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                </div>
              ))}
              {(!leads || leads.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No recent leads found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
