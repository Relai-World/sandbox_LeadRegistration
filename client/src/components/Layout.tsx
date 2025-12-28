import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const { data: profile } = useProfile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = profile?.role === "admin";

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Properties", href: "/properties", icon: Building2 },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Settings", href: "/profile", icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Relai</h1>
            <p className="text-xs text-muted-foreground font-medium">Real Estate OS</p>
          </div>
        </div>

        {profile && (
          <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3">
              <img 
                src={user?.profileImageUrl || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn(
                    "inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider",
                    isAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {profile?.role || "Agent"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "sidebar-link cursor-pointer",
                    isActive ? "sidebar-link-active" : "sidebar-link-inactive"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 fixed inset-y-0 z-50">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg">Relai</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8 min-h-screen">
        <div className="max-w-7xl mx-auto animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
