
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const items = [
    { id: AppView.CHAT, label: 'Editorial Consult', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: AppView.IMAGE_ANALYSIS, label: 'Visual Review', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: AppView.SUBMISSION, label: 'Ready to Submit', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  return (
    <aside className="w-64 bg-[#0f172a] text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 serif text-amber-500">LUMINA</h1>
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Publishing House</p>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-amber-500 text-slate-900 font-semibold' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700">
          <p className="text-xs text-slate-400 mb-2">Need direct help?</p>
          <button className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors">Contact Agent</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
