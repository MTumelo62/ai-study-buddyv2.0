import React from 'react';
import { ClockIcon } from './icons/ClockIcon';

interface AnalyticsViewProps {
  totalStudyTime: number; // in seconds
}

const formatDuration = (totalSeconds: number): string => {
    totalSeconds = Math.floor(totalSeconds);
    if (totalSeconds < 60) return `${totalSeconds}s`;
  
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
  
    return parts.join(' ') || '0s';
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ totalStudyTime }) => {
  return (
    <div className="h-full bg-slate-800/50 rounded-lg p-6 overflow-y-auto">
      <h2 className="text-3xl font-bold text-slate-100 mb-6">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-cyan-600 mb-4">
                <ClockIcon className="h-8 w-8 text-white" />
            </div>
            <p className="text-slate-400 text-lg font-medium">Total Study Time</p>
            <p className="text-slate-100 text-5xl font-bold mt-2 tracking-tight">{formatDuration(totalStudyTime)}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg flex flex-col items-center justify-center text-center text-slate-500">
            <p>More analytics coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;