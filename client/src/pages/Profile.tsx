import { Layout } from "@/components/Layout";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const form = useForm({
    defaultValues: {
      agencyName: "",
      phoneNumber: "",
      licenseNumber: "",
      role: "agent",
    }
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        agencyName: profile.agencyName || "",
        phoneNumber: profile.phoneNumber || "",
        licenseNumber: profile.licenseNumber || "",
        role: profile.role || "agent",
      });
    }
  }, [profile, form]);

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold text-foreground mb-8">Account Settings</h1>
        
        <div className="grid gap-8">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Managed via Replit Auth</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-4 border-muted">
                <AvatarImage src={user?.profileImageUrl || ""} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {user?.firstName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Replit Verified
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Details</CardTitle>
              <CardDescription>Update your agency and license information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="agencyName">Agency Name</Label>
                    <Input id="agencyName" {...form.register("agencyName")} placeholder="e.g. Prestige Realty" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input id="licenseNumber" {...form.register("licenseNumber")} placeholder="e.g. RE-123456" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input id="phoneNumber" {...form.register("phoneNumber")} placeholder="+1 (555) 000-0000" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" {...form.register("role")} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Contact admin to change role.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
