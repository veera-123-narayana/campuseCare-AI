/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CampusProvider } from './context/CampusContext';
import { Sidebar } from './components/ui/Sidebar';
import { BottomTabBar } from './components/ui/BottomTabBar';
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
import { SimulationBanner } from './components/ui/SimulationBanner';
import { useCampus } from './context/CampusContext';

const SCENARIO_KEY_MAP: Record<string, string> = {
  '1': 'normal-class',
  '2': 'started-late',
  '3': 'class-not-confirmed',
  '4': 'unexpected-occupancy',
  '5': 'high-temperature',
  '6': 'sensor-offline',
  '7': 'camera-offline',
  '8': 'energy-waste',
  '9': 'emergency-request',
};

function AppContent() {
  const { runScenario, isSimulationMode } = useCampus();
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

  // Keyboard shortcuts 1-9 to fire scenarios when not in an input/textarea
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in form field
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const scenarioId = SCENARIO_KEY_MAP[e.key];
      if (scenarioId) {
        e.preventDefault();
        runScenario(scenarioId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runScenario]);

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
      {/* 232px Collapsible Sidebar on md+, hidden on mobile */}
      <Sidebar className="hidden md:flex" currentPath={currentPath} onNavigate={navigateTo} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Simulation Mode Banner across top of pages when active */}
        <SimulationBanner currentPath={currentPath} onNavigate={navigateTo} />

        {/* 56px TopBar */}
        <TopBar currentPath={currentPath} onNavigate={navigateTo} />

        {/* Global Command Palette (Cmd/Ctrl + K) */}
        <CommandPalette onNavigate={navigateTo} />

        {/* Content Container: max-width 1320px, centered, 32px padding desktop, 16px mobile + pb-20 for bottom tab bar */}
        <main className="flex-1 overflow-y-auto">
          {currentPath === '/design' ? (
            <DesignSpecimenPage />
          ) : (
            <div className="max-w-[1320px] mx-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
              {renderCurrentView()}
            </div>
          )}
        </main>

        {/* Mobile Bottom Tab Bar */}
        <BottomTabBar currentPath={currentPath} onNavigate={navigateTo} />
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
