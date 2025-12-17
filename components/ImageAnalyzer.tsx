
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis('');
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await geminiService.analyzeImage(image);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setAnalysis("We encountered an error analyzing your visual content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 h-full overflow-y-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800 serif mb-2">Visual Assessment</h2>
        <p className="text-slate-500">Upload cover concepts or manuscript illustrations for a professional critique.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="space-y-6">
          <div className={`relative border-2 border-dashed rounded-3xl p-4 flex flex-col items-center justify-center transition-all ${
            image ? 'border-amber-400 bg-amber-50/20' : 'border-slate-300 bg-white hover:border-slate-400'
          }`} style={{ minHeight: '400px' }}>
            {image ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={image} alt="Upload Preview" className="max-h-[380px] rounded-xl shadow-lg object-contain" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white p-2 rounded-full shadow-md hover:bg-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <label className="cursor-pointer">
                  <span className="bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm inline-block">Select Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
                <p className="text-xs text-slate-400">JPG, PNG or WEBP up to 10MB</p>
              </div>
            )}
          </div>
          
          <button
            onClick={startAnalysis}
            disabled={!image || loading}
            className="w-full bg-amber-500 text-slate-900 font-bold py-4 rounded-full shadow-lg hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-3 border-2 border-slate-900 border-t-transparent rounded-full" viewBox="0 0 24 24"></svg>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Request Professional Critique</span>
              </>
            )}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-semibold text-slate-800 serif">Expert Feedback</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto text-slate-600 leading-relaxed whitespace-pre-wrap">
            {analysis ? (
              <div className="prose prose-slate">
                {analysis}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Upload a visual asset and run the analysis to receive detailed editorial feedback.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
