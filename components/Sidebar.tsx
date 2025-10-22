import React from 'react';
import { View } from '../App';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { QuizIcon } from './icons/QuizIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'chat', label: 'Study Buddy', icon: ChatBubbleIcon },
  { id: 'quiz', label: 'Quiz', icon: QuizIcon },
  { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon },
] as const;


const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  return (
    <nav className="w-64 bg-slate-800/50 rounded-lg p-4 flex flex-col gap-2">
      <ul>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'bg-cyan-600/20 text-cyan-300'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;