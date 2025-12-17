
import React, { useState } from 'react';
import { Message, ProjectGist } from '../types';
import { geminiService } from '../services/geminiService';

interface SubmissionFormProps {
  messages: Message[];
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ messages }) => {
  const [gist, setGist] = useState<ProjectGist | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const generateGist = async () => {
    if (messages.length < 2) return;
    setLoading(true);
    try {
      const data = await geminiService.extractGist(messages);
      setGist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, this would send a POST request
  };

  if (submitted) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold serif text-slate-800 mb-4">Proposal Received</h3>
          <p className="text-slate-600 mb-8 leading-relaxed">Your author profile and project gist have been forwarded to our acquisitions board. We typically respond within 7 business days.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-4 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-700 transition-colors shadow-lg"
          >
            Start New Consult
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-bold text-slate-800 serif mb-4">Official Submission</h2>
        <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">Prepare your manuscript proposal based on our consultation. We've automated the extraction of key details for your convenience.</p>
      </div>

      {!gist ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm text-center">
          <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
            <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2 serif">Ready to Package?</h3>
          <p className="text-slate-500 mb-8 max-w-xs mx-auto">Click below to automatically generate a project summary from our conversation history.</p>
          <button
            onClick={generateGist}
            disabled={loading || messages.length < 2}
            className="px-8 py-4 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-600 transition-all shadow-lg flex items-center space-x-2 mx-auto disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3 border-2 border-slate-900 border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate Submission Data</span>
              </>
            )}
          </button>
          {messages.length < 2 && (
            <p className="text-xs text-red-500 mt-4 font-medium">Please engage in a brief consult before submitting.</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm space-y-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Title</label>
              <input 
                type="text" 
                defaultValue={gist.title}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Genre</label>
              <input 
                type="text" 
                defaultValue={gist.genre}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Audience</label>
              <input 
                type="text" 
                defaultValue={gist.targetAudience}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Approx. Word Count</label>
              <input 
                type="text" 
                defaultValue={gist.wordCount}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Summary</label>
            <textarea 
              rows={4}
              defaultValue={gist.summary}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Author Note / Additional Detail</label>
            <textarea 
              rows={3}
              defaultValue={gist.authorNote}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-amber-500 text-slate-900 font-bold rounded-full hover:bg-amber-600 transition-all shadow-xl text-lg uppercase tracking-widest"
          >
            Send Proposal to Acquisitions
          </button>
        </form>
      )}
    </div>
  );
};

export default SubmissionForm;
