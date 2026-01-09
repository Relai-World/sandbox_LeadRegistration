import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, LogOut, Building2, BarChart3, Menu, X, FilePlus, Shield, HardHat } from 'lucide-react';
import { ProjectForm } from '@/components/ProjectForm';
import { ShortFormOnboarding } from '@/components/ShortFormOnboarding';
import { AgentReports } from '@/components/AgentReports';
import { DraftsSection } from '@/components/DraftsSection';
import { ProjectList } from '@/components/ProjectList';
import { AdminAllProjects } from '@/components/AdminAllProjects';
import BuilderData from '@/components/BuilderData';
import relaiLogo from '@/assets/relaiLogo.png';
import transLogo1 from '@/assets/transLogo1.png';
import { useAuth } from '@/hooks/useAuth';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<'allProjects' | 'full' | 'short' | 'reports' | 'drafts' | 'viewProjects' | 'builderData' | 'projectsData'>('allProjects');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [viewingProject, setViewingProject] = useState<any>(null);

  const handleOptionSelect = (option: 'allProjects' | 'full' | 'short' | 'reports' | 'drafts' | 'viewProjects' | 'builderData' | 'projectsData') => {
    setSelectedOption(option);
    setSidebarOpen(false);
    setEditingDraft(null);
    setViewingProject(null);
  };

  const handleToggleForms = () => {
    if (selectedOption === 'full') {
      setSelectedOption('short');
    } else if (selectedOption === 'short') {
      setSelectedOption('full');
    }
  };

  const handleProjectSelect = async (project: any) => {
    setViewingProject(project);
    setSelectedOption('full');
  };

  const handleEditDraft = (draft: any) => {
    setEditingDraft(draft);
    setSelectedOption('full');
  };

  const handleDraftSaved = (draftFormData: any) => {
    alert('Draft saved successfully!');
    setSelectedOption('drafts');
  };

  const menuItems = [
    { id: 'allProjects' as const, icon: Shield, label: 'All Projects (Admin)', description: 'View and verify all agent submissions' },
    { id: 'builderData' as const, icon: HardHat, label: 'Builder Data', description: 'Manage builder information' },
    { id: 'projectsData' as const, icon: Building2, label: 'Projects Data', description: 'Manage project information and RERA numbers' },
    { id: 'viewProjects' as const, icon: Building2, label: 'View Projects', description: 'View your submitted projects' },
    { id: 'full' as const, icon: FileText, label: 'New Project (Full Form)', description: 'Complete project onboarding' },
    { id: 'short' as const, icon: FilePlus, label: 'New Project (Short Form)', description: 'Quick project submission' },
    { id: 'drafts' as const, icon: FileText, label: 'Drafts', description: 'Continue saved drafts' },
    { id: 'reports' as const, icon: BarChart3, label: 'Reports', description: 'View submission analytics' },
  ];

  const renderContent = () => {
    switch (selectedOption) {
      case 'allProjects':
        return <AdminAllProjects adminUser={user} />;
      case 'builderData':
        return <BuilderData view="builders" />;
      case 'projectsData':
        return <BuilderData view="projects" />;
      case 'full':
        return (
          <ProjectForm
            agentData={user}
            initialData={editingDraft || viewingProject}
            isViewMode={!!viewingProject && !editingDraft}
          />
        );
      case 'short':
        return (
          <ShortFormOnboarding
            agentData={user}
            onDraftSaved={handleDraftSaved}
          />
        );
      case 'reports':
        return <AgentReports agentData={user} />;
      case 'drafts':
        return (
          <DraftsSection
            userEmail={user?.email}
            onEditDraft={handleEditDraft}
          />
        );
      case 'viewProjects':
        return (
          <ProjectList
            agentEmail={user?.email}
            onProjectSelect={handleProjectSelect}
          />
        );
      default:
        return <AdminAllProjects />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Logo Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={transLogo1} alt="Relai Logo" className="h-8 w-auto" />
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Admin Portal</h2>
                  <p className="text-xs text-gray-500">Property Management</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-600 truncate">{user?.email || 'admin'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleOptionSelect(item.id)}
                className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-colors ${selectedOption === item.id
                    ? 'bg-purple-100 text-purple-900'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedOption === item.id ? 'text-purple-600' : 'text-gray-500'}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${selectedOption === item.id ? 'text-purple-900' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                </div>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg lg:text-xl font-semibold text-gray-900">
                  {menuItems.find(item => item.id === selectedOption)?.label || 'Admin Dashboard'}
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  {menuItems.find(item => item.id === selectedOption)?.description}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
