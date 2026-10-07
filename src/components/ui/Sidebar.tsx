import React from 'react';
import {
  LayoutDashboard,
  Building2,
  BellRing,
  Bot,
  Compass,
  Leaf,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Layers,
  User,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';
import { UserRole } from '../../types';

export interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  className = '',
}) => {
  const {
    isSidebarCollapsed,
    toggleSidebar,
    currentUser,
    switchRole,
    activeAlertCount,
  } = useCampus();

  const navItems = [
    {
      id: 'overview',
      path: '/',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'rooms',
      path: '/rooms',
      label: 'Rooms',
      icon: <Building2 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'alerts',
      path: '/alerts',
      label: 'Alerts',
      icon: <BellRing className="w-4 h-4 shrink-0" />,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
      badgeColor: 'bg-status-orange-soft text-status-orange border-status-orange/30',
    },
    {
      id: 'assistant',
      path: '/assistant',
      label: 'Assistant',
      icon: <Bot className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'emergency',
      path: '/emergency',
      label: 'Emergency',
      icon: <Compass className="w-4 h-4 shrink-0" />,
      badge: 'RED',
      badgeColor: 'bg-status-red-soft text-status-red border-status-red/30',
    },
    {
      id: 'sustainability',
      path: '/sustainability',
      label: 'Sustainability',
      icon: <Leaf className="w-4 h-4 shrink-0" />,
      badge: 'SDG 11',
      badgeColor: 'bg-accent-soft text-accent border-accent/20',
    },
    {
      id: 'demo',
      path: '/demo',
      label: 'Demo Control',
      icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'design',
      path: '/design',
      label: 'Design Specimen',
      icon: <Layers className="w-4 h-4 shrink-0" />,
    },
  ];

  const roleCycle: UserRole[] = ['Admin / HOD', 'Faculty', 'Student'];

  const handleCycleRole = () => {
    const nextIdx = (roleCycle.indexOf(currentUser.role) + 1) % roleCycle.length;
    switchRole(roleCycle[nextIdx]);
  };

  const sidebarWidth = isSidebarCollapsed ? 'w-16' : 'w-[232px]';

  return (
    <aside
      className={`${sidebarWidth} shrink-0 bg-surface border-r border-hairline flex flex-col justify-between h-full select-none transition-all duration-200 z-30 ${className}`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-hairline flex items-center justify-between">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-[6px] bg-accent text-white dark:text-bg flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
                CC
              </div>
              <div className="truncate">
                <span className="text-[14px] font-bold tracking-tight text-ink block leading-none">
                  CAMPUSCARE
                </span>
                <span className="text-[9px] font-mono uppercase tracking-[0.08em] text-muted block mt-1">
                  SDG 11 CONTROL
                </span>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-[6px] bg-accent text-white dark:text-bg flex items-center justify-center font-bold text-xs tracking-wider">
              CC
            </div>
          )}

          {/* Collapse Icon Button */}
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-muted hover:text-ink p-1 rounded-[6px] hover:bg-surface-2 transition-colors cursor-pointer"
              title="Collapse to icon rail"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed rail expander button */}
        {isSidebarCollapsed && (
          <div className="p-2 flex justify-center border-b border-hairline">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-muted hover:text-ink p-1.5 rounded-[6px] hover:bg-surface-2 transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav aria-label="Sidebar" className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.path)}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`relative w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                } py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-accent-soft text-accent font-semibold'
                    : 'text-ink hover:bg-surface-2'
                }`}
              >
                {/* 2px accent bar on the left for active item */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-accent rounded-r" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-accent' : 'text-muted'}>
                    {item.icon}
                  </span>
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>

                {!isSidebarCollapsed && item.badge && (
                  <span
                    className={`font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-[4px] border ${
                      item.badgeColor || 'bg-surface-2 text-muted border-hairline'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Chip & Role Switcher at Bottom */}
      <div className="p-2.5 border-t border-hairline bg-surface-2/60">
        <button
          type="button"
          onClick={handleCycleRole}
          title="Click to switch role (Admin / HOD, Faculty, Student)"
          className={`w-full flex items-center ${
            isSidebarCollapsed ? 'justify-center p-1' : 'justify-between p-2'
          } rounded-[8px] bg-surface border border-hairline hover:border-muted/50 transition-colors cursor-pointer text-left`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-accent-soft text-accent border border-accent/20 flex items-center justify-center font-mono font-bold text-[11px] shrink-0">
              {currentUser.avatarInitials}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <span className="text-[12px] font-semibold text-ink block truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-muted uppercase tracking-wider block truncate mt-0.5">
                  {currentUser.role}
                </span>
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <span className="text-[10px] font-mono text-accent bg-accent-soft px-1.5 py-0.5 rounded border border-accent/20 shrink-0">
              Switch
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
