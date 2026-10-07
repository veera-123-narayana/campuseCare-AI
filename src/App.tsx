/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CampusProvider } from './context/CampusContext';
import { Sidebar } from './components/ui/Sidebar';
import { TopBar } from './components/ui/TopBar';
import { CommandPalette } from './components/ui/CommandPalette';

import { OverviewPage } from './pages/OverviewPage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { AlertsPage } from './pages/AlertsPage';
import { AssistantPage } from './pages/AssistantPage';
import { EmergencyPage } from './pages/EmergencyPage';
import { SustainabilityPage } from './pages/SustainabilityPage';
import { DemoPage } from './pages/DemoPage';
import { DesignSpecimenPage } from './pages/DesignSpecimenPage';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  // Render view corresponding to current route
  const renderCurrentView = () => {
    if (currentPath === '/' || currentPath === '') {
      return <OverviewPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/rooms') {
      return <RoomsPage onNavigate={navigateTo} />;
    }
    if (currentPath.startsWith('/rooms/')) {
      const roomId = currentPath.split('/')[2];
      return <RoomDetailPage roomId={roomId} onNavigate={navigateTo} />;
    }
    if (currentPath === '/alerts') {
      return <AlertsPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/assistant') {
      return <AssistantPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/emergency') {
      return <EmergencyPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/sustainability') {
      return <SustainabilityPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/demo') {
      return <DemoPage onNavigate={navigateTo} />;
    }
    if (currentPath === '/design') {
      return <DesignSpecimenPage />;
    }
    return <OverviewPage onNavigate={navigateTo} />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-ink font-sans antialiased">
      {/* 232px Collapsible Sidebar */}
      <Sidebar currentPath={currentPath} onNavigate={navigateTo} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 56px TopBar */}
        <TopBar currentPath={currentPath} onNavigate={navigateTo} />

        {/* Global Command Palette (Cmd/Ctrl + K) */}
        <CommandPalette onNavigate={navigateTo} />

        {/* Content Container: max-width 1320px, centered, 32px padding */}
        <main className="flex-1 overflow-y-auto">
          {currentPath === '/design' ? (
            <DesignSpecimenPage />
          ) : (
            <div className="max-w-[1320px] mx-auto p-8">
              {renderCurrentView()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CampusProvider>
      <AppContent />
    </CampusProvider>
  );
}
