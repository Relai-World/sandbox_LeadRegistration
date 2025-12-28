import { Button } from "@/components/ui/button";
import { Building2, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="font-display font-bold text-2xl tracking-tight">Relai</span>
          </div>
          <Button onClick={() => window.location.href = "/api/login"}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-8">
            The Modern OS for <br />
            <span className="gradient-text">Real Estate Agents</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Manage properties, track leads, and close deals faster with our all-in-one platform designed for high-growth agencies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" onClick={() => window.location.href = "/api/login"}>
              Start for Free
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Property Management</h3>
              <p className="text-muted-foreground">Effortlessly manage your verified and unverified listings with our intuitive dashboard.</p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border border-border/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Lead Tracking</h3>
              <p className="text-muted-foreground">Capture leads and track their journey from initial contact to closing the deal.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Listings</h3>
              <p className="text-muted-foreground">Build trust with verified badges and comprehensive property documentation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
