import React from 'react';
import { ActivityLogItem } from '../types';
import { FileIcon } from './icons/FileIcon';
import { QuizIcon } from './icons/QuizIcon';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface DashboardStats {
  studySessions: number;
  questionsAsked: number;
  quizzesTaken: number;
  averageScore: number;
}

interface DashboardViewProps {
  stats: DashboardStats;
  activityLog: ActivityLogItem[];
  onNewSession: () => void;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
  <div className="bg-slate-800 p-6 rounded-lg flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <p className="text-slate-100 text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ stats, activityLog, onNewSession }) => {
  return (
    <div className="h-full bg-slate-800/50 rounded-lg p-6 overflow-y-auto">
      <h2 className="text-3xl font-bold text-slate-100 mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={FileIcon} title="Study Sessions" value={stats.studySessions} color="bg-cyan-600" />
        <StatCard icon={ChatBubbleIcon} title="Questions Asked" value={stats.questionsAsked} color="bg-indigo-600" />
        <StatCard icon={QuizIcon} title="Quizzes Taken" value={stats.quizzesTaken} color="bg-green-600" />
        <StatCard icon={CheckIcon} title="Average Score" value={`${stats.averageScore}%`} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Quick Actions</h3>
          <button 
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 px-4 rounded-md hover:bg-cyan-500 transition-colors"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>Start New Study Session</span>
          </button>
        </div>

        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">Recent Activity</h3>
          {activityLog.length > 0 ? (
            <ul className="space-y-4">
              {activityLog.map(item => (
                <li key={item.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    {item.type === 'study' ? <FileIcon className="h-5 w-5 text-cyan-400" /> : <QuizIcon className="h-5 w-5 text-green-400" />}
                  </div>
                  <div className="flex-grow">
                    <p className="text-slate-200">{item.details}</p>
                  </div>
                  <p className="text-slate-400 text-sm flex-shrink-0">{item.timestamp}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-slate-400 py-8">
              <p>No activity yet. Upload a document to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
