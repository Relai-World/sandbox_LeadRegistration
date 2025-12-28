
import React, { useState } from 'react';
import { ProjectForm } from '@/components/ProjectForm';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('projects');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header with Menu */}
      <div className="lg:hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">Real Estate CRM</h1>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden lg:block">
          <Header />
        </div>
        
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {activeSection === 'projects' && (
            <div className="max-w-full">
              <div className="mb-4 lg:mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Project Management</h1>
                <p className="text-gray-600 text-sm lg:text-base">Create and manage real estate project details</p>
              </div>
              <ProjectForm />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
