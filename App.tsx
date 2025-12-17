
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ImageAnalyzer from './components/ImageAnalyzer';
import SubmissionForm from './components/SubmissionForm';
import { Message, AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);

  const renderContent = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatWindow messages={messages} setMessages={setMessages} />;
      case AppView.IMAGE_ANALYSIS:
        return <ImageAnalyzer />;
      case AppView.SUBMISSION:
        return <SubmissionForm messages={messages} />;
      default:
        return <ChatWindow messages={messages} setMessages={setMessages} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-900">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight">
              {currentView === AppView.CHAT && "Editorial Consultant"}
              {currentView === AppView.IMAGE_ANALYSIS && "Visual Feedback Engine"}
              {currentView === AppView.SUBMISSION && "Project Packaging"}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-2">
              <img src="https://picsum.photos/seed/editor1/40/40" alt="Editor" className="w-8 h-8 rounded-full border-2 border-white" />
              <img src="https://picsum.photos/seed/editor2/40/40" alt="Editor" className="w-8 h-8 rounded-full border-2 border-white" />
            </div>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Consultation Active</span>
          </div>
        </header>

        <section className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40"></div>
          <div className="h-full relative z-0">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
