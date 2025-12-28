
import React from 'react';
import { Bell, User } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-base lg:text-lg font-semibold text-gray-800">Agent Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
            </div>
            <span className="text-xs lg:text-sm font-medium text-gray-700 hidden sm:block">Agent Name</span>
          </div>
        </div>
      </div>
    </header>
  );
};
