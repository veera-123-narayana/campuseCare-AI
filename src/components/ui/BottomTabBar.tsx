import React from 'react';
import {
  LayoutDashboard,
  Building2,
  BellRing,
  Bot,
  Compass,
  SlidersHorizontal,
  Leaf,
} from 'lucide-react';
import { useCampus } from '../../context/CampusContext';

export interface BottomTabBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentPath,
  onNavigate,
  className = '',
}) => {
  const { activeAlertCount } = useCampus();

  const items = [
    {
      id: 'overview',
      path: '/',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'rooms',
      path: '/rooms',
      label: 'Rooms',
      icon: <Building2 className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'alerts',
      path: '/alerts',
      label: 'Alerts',
      icon: <BellRing className="w-5 h-5 shrink-0" />,
      badge: activeAlertCount > 0 ? activeAlertCount : undefined,
    },
    {
      id: 'assistant',
      path: '/assistant',
      label: 'Assistant',
      icon: <Bot className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'emergency',
      path: '/emergency',
      label: 'Emergency',
      icon: <Compass className="w-5 h-5 shrink-0" />,
      alertDot: true,
    },
    {
      id: 'demo',
      path: '/demo',
      label: 'Demo',
      icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t border-hairline z-40 px-2 flex items-center justify-around select-none [box-shadow:var(--shadow-popover)] print:hidden ${className}`}
    >
      {items.map((item) => {
        const isActive =
          item.path === '/'
            ? currentPath === '/'
            : currentPath.startsWith(item.path);

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.path)}
            aria-label={item.label}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'text-accent font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <div className="relative">
              {item.icon}
              {item.badge && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-status-orange text-white font-mono text-[9px] font-bold flex items-center justify-center leading-none">
                  {item.badge}
                </span>
              )}
              {item.alertDot && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-red ring-2 ring-surface" />
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-1 truncate">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
