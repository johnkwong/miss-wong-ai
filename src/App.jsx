import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, ChevronLeft, AlertCircle, Sparkles, History, X, Globe, 
  Languages, Image as ImageIcon, GraduationCap, School, BookOpenCheck, 
  Users, Plus, Trash2, CheckCircle, Loader, Save, RotateCcw, ArrowRight, 
  ScanLine, Eye, Settings, Key, ExternalLink, EyeOff, ThumbsUp, Target, 
  PenTool, Zap, Brain, Edit2, FileJson, Download, ClipboardPaste, 
  ChevronRight, Database, HelpCircle, Lightbulb, CheckSquare, Square, 
  Heart, Share, Menu 
} from 'lucide-react';

// --- Utility: Safe Local Storage ---
const safeLocalStorage = {
  getItem: (key, fallback = '') => {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : fallback;
    } catch (e) {
      console.warn(`LocalStorage access denied for ${key}`);
      return fallback;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`LocalStorage write failed for ${key}`);
    }
  },
  getJSON: (key, fallback = []) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      const parsed = JSON.parse(item);
      if (key === 'essay_grader_history' && !Array.isArray(parsed)) {
        return fallback;
      }
      return parsed;
    } catch (e) {
      return fallback;
    }
  },
  clear: () => {
    try { localStorage.clear(); } catch (e) {}
  }
};

// --- Utility: Image Processing ---
const preprocessImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const MAX_WIDTH = 1200; 
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const contrastFactor = 1.3; 
          let contrastGray = (gray - 128) * contrastFactor + 128;
          contrastGray = Math.max(0, Math.min(255, contrastGray));
          
          data[i] = contrastGray;
          data[i + 1] = contrastGray;
          data[i + 2] = contrastGray;
        }
        
        ctx.putImageData(imageData, 0, 0);
        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64String.split(',')[1]);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = (err) => reject(err);
  });
};

// --- Utility: API Retry Logic ---
const fetchWithRetry = async (url, options, retries = 3, backoff = 1000) => {
  try {
    const response = await fetch(url, options);
    if ((response.status === 503 || response.status === 429) && retries > 0) {
      console.warn(`Server busy (${response.status}), retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Network error, retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

// --- Utility: Robust JSON Parser ---
const parseRobustJSON = (text) => {
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    console.warn("First JSON parse failed, attempting repairs...", e);
    cleanText = cleanText.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    try {
      return JSON.parse(cleanText);
    } catch (e2) {
      console.error("Second JSON parse failed", e2);
      throw new Error("AI output format error. Please try analyzing again.");
    }
  }
};

// --- Component: Install Guide Modal ---
const InstallModal = ({ isOpen, onClose }) => {
  const [os, setOs] = useState('unknown');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    } else {
      setOs('desktop');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Download size={24} className="text-slate-900" />
            Install App
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-600 text-sm mb-6">
          Install <strong>Miss Wong AI</strong> on your home screen for quick access.
        </p>

        {os === 'ios' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">1</span>
              <span>Tap the <strong className="text-blue-600">Share</strong> button.</span>
              <Share size={20} className="text-blue-500" />
            </div>
            <div className="w-px h-4 bg-slate-200 ml-4"></div>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">2</span>
              <span>Scroll down and select <strong className="text-slate-800">"Add to Home Screen"</strong>.</span>
              <Plus size={20} className="bg-slate-200 p-0.5 rounded text-slate-600" />
            </div>
          </div>
        )}

        {os === 'android' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">1</span>
              <span>Tap the <strong>Menu</strong> (three dots) icon.</span>
              <Menu size={20} className="text-slate-500" />
            </div>
            <div className="w-px h-4 bg-slate-200 ml-4"></div>
            <div className="flex items-center gap-4 text-sm text-slate-700">
              <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">2</span>
              <span>Select <strong className="text-slate-800">"Install App"</strong>.</span>
            </div>
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-all"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

// --- Component: Memo Style Tooltip ---
const ErrorTooltip = ({ original, correction, reason }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <span 
      ref={tooltipRef}
      className="relative inline-block cursor-pointer mx-1 align-baseline whitespace-pre-wrap"
      onClick={(e) => {
        e.stopPropagation(); 
        setIsOpen(!isOpen);
      }}
    >
      <span className="bg-red-50 text-red-500 line-through decoration-red-400 decoration-2 px-1 rounded-l border border-r-0 border-red-100 select-none opacity-80 text-[0.9em]">
        {original}
      </span>
      <span className="bg-emerald-50 text-emerald-700 font-bold px-1 rounded-r border border-l-0 border-emerald-200 border-b-2 border-b-emerald-400">
        {correction}
      </span>

      {reason && <sup className="text-emerald-500 ml-0.5"><HelpCircle size={10} className="inline"/></sup>}

      {isOpen && (
        <span 
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-48 sm:w-56 p-3 rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm shadow-2xl animate-in fade-in zoom-in duration-200 text-left leading-relaxed border border-yellow-200 z-[50]"
            style={{
                backgroundColor: '#fff9c4', 
                color: '#4b5563', 
                boxShadow: '4px 4px 10px rgba(0,0,0,0.15)', 
                minWidth: '180px'
            }}
            onClick={(e) => e.stopPropagation()} 
        >
          <span className="block font-bold text-yellow-800 mb-2 border-b border-yellow-600/20 pb-1 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Lightbulb size={12} className="text-yellow-600" />
            Teacher's Note
          </span>
          <span className="block font-serif italic text-sm mb-2">
            {reason}
          </span>
          <span className="block pt-2 border-t border-yellow-600/10 text-xs text-emerald-700 font-bold bg-yellow-100/50 -mx-3 -mb-3 p-2 rounded-b-sm whitespace-pre-wrap">
             ✓ {correction}
          </span>
          <span 
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
                width: 0, 
                height: 0, 
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid #fff9c4', 
                filter: 'drop-shadow(0px 2px 1px rgba(0,0,0,0.05))'
            }}
          ></span>
        </span>
      )}
    </span>
  );
};

export default function App() {
  // --- STATE ---
  const [userApiKey, setUserApiKey] = useState(() => safeLocalStorage.getItem('essay_grader_api_key'));
  const [essayLevel, setEssayLevel] = useState(() => safeLocalStorage.getItem('essay_grader_level', 'Primary'));
  const [selectedModel, setSelectedModel] = useState(() => safeLocalStorage.getItem('essay_grader_model', 'gemini-2.5-flash-preview-09-2025'));
  const [history, setHistory] = useState(() => safeLocalStorage.getJSON('essay_grader_history', []));
  
  // View State
  const [currentView, setCurrentView] = useState(() => {
     return safeLocalStorage.getItem('essay_grader_api_key') ? 'home' : 'settings';
  });
  
  const [historyFilter, setHistoryFilter] = useState('incomplete'); 
  const [viewSource, setViewSource] = useState('upload'); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [selectedUploadId, setSelectedUploadId] = useState(null);
  const [activeHistoryItem, setActiveHistoryItem] = useState(null);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') setDeferredPrompt(null);
      });
    } else {
      setShowInstallModal(true);
    }
  };

  useEffect(() => { safeLocalStorage.setItem('essay_grader_api_key', userApiKey); }, [userApiKey]);
  useEffect(() => { safeLocalStorage.setItem('essay_grader_level', essayLevel); }, [essayLevel]);
  useEffect(() => { safeLocalStorage.setItem('essay_grader_model', selectedModel); }, [selectedModel]);
  useEffect(() => { safeLocalStorage.setItem('essay_grader_history', JSON.stringify(history)); }, [history]);

  // --- Actions ---

  const handleImageUpload = (e) => {
    if (!userApiKey) { setCurrentView('settings'); return; }
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newUploads = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'idle',
        result: null,
        errorMsg: null
      }));
      
      setUploads(prev => {
        const updated = [...prev, ...newUploads];
        if (prev.length === 0) setSelectedUploadId(newUploads[0].id);
        return updated;
      });
      setViewSource('upload');
      
      // Force switch to preview if adding
      if (currentView !== 'scan-preview') {
          setCurrentView('scan-preview');
      } else if (uploads.length === 0) {
          setSelectedUploadId(newUploads[0].id);
      }
    }
    e.target.value = '';
  };

  const removeUpload = (id) => {
    setUploads(prev => {
      const newUploads = prev.filter(u => u.id !== id);
      if (newUploads.length === 0) setCurrentView('home');
      else if (selectedUploadId === id && newUploads.length > 0) setSelectedUploadId(newUploads[0].id);
      return newUploads;
    });
  };

  // --- UPDATED: Analyze Function with "Accept US, Prioritize UK" Prompt ---
  const analyzeSingleEssay = async (uploadItem) => {
    try {
      if (!userApiKey) throw new Error("API Key is missing. Please go to Settings.");
      const base64Data = await preprocessImage(uploadItem.file);

      let levelPrompt = "";
      switch (essayLevel) {
        case 'Primary': levelPrompt = "Student Level: Primary School. Criteria: Basic spelling, simple tenses. Tone: Very encouraging, simple words."; break;
        case 'University': levelPrompt = "Student Level: University. Criteria: Argumentation, academic vocabulary. Tone: Formal & critical."; break;
        case 'Secondary': default: levelPrompt = "Student Level: Secondary School. Criteria: Grammar, variety, structure. Tone: Constructive."; break;
      }

      const promptText = `
        You are an expert OCR and ESL English teacher.
        **STEP 1: OCR TRANSCRIPTION**
        Transcribe the English text EXACTLY as written, preserving all errors. Detect the student's name.
        **STEP 2: ANALYSIS**
        Analyze based on: ${levelPrompt}
        
        **IMPORTANT: LANGUAGE SETTINGS**
        1. **Feedback & Output:** Use **British English** (UK) for all your comments, suggestions, and corrections (e.g., use 'colour', 'organise', 'programme').
        2. **Grading Policy:** Accept **US English** spellings (e.g., 'color', 'organize', 'center') as **valid**. Do NOT mark US spelling as an error unless the student is inconsistent (mixing US/UK styles).
        3. **Correction Logic:** If you correct a sentence for other reasons (grammar/vocab), output the corrected version in British English, but do not purely "correct" US spelling to UK spelling if that was the only "mistake".

        **STEP 3: OUTPUT JSON**
        IMPORTANT: Return VALID JSON. Escape double quotes in strings.
        Return result in this JSON format:
        {
          "studentName": "Detected Name or 'Unknown'",
          "ocrText": "Raw transcription",
          "title": "Inferred Title",
          "score": 0-100,
          "diffText": "The complete essay text. BUT for every error found, replace the error with this specific pattern: {{{original_word|||corrected_word|||explanation_why}}}. Example: I {{{go|||went|||Use past tense}}} to school.",
          "correctedText": "Clean corrected version.",
          "comments": "Detailed feedback in British English.",
          "suggestions": ["Suggestion 1", "Suggestion 2"],
          "spellingErrors": ["wrong -> right", "mistake -> correction"], 
          "strengthSummary": "One short sentence highlighting the best part.",
          "improvementSummary": "One short sentence highlighting the main improvement."
        }
      `;

      // --- DIRECT API CALL ---
      const MODEL_NAME = selectedModel || 'gemini-2.5-flash-preview-09-2025';
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${userApiKey}`;
      
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: promptText },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };
      
      const response = await fetchWithRetry(
        API_URL,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        if (response.status === 404) throw new Error(`Model '${selectedModel}' not found. Check Settings.`);
        if (response.status === 400) throw new Error("Invalid API Key or Bad Request.");
        if (response.status === 403) throw new Error("API Key permissions denied.");
        if (response.status === 503) throw new Error("Server is busy (503). Please try again later.");
        
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) throw new Error("No response text from AI");

      const resultData = parseRobustJSON(textResponse);
      resultData.processedImageBase64 = base64Data;
      resultData.modelUsed = selectedModel;
      return resultData;

    } catch (error) {
      console.error("Analysis failed", error);
      throw error;
    }
  };

  const startBatchAnalysis = async () => {
    setIsAnalyzing(true);
    const itemsToProcess = uploads.filter(u => u.status === 'idle' || u.status === 'error');

    for (const item of itemsToProcess) {
      setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'analyzing', errorMsg: null } : u));
      setSelectedUploadId(item.id);

      try {
        const result = await analyzeSingleEssay(item);
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'done', result: result } : u));
        
        setHistory(prev => [{
          id: item.id,
          studentName: result.studentName,
          title: result.title || 'Untitled',
          score: result.score,
          date: new Date().toLocaleDateString(),
          level: essayLevel,
          model: result.modelUsed,
          status: 'incomplete', 
          ...result 
        }, ...prev]);

      } catch (err) {
        setUploads(prev => prev.map(u => u.id === item.id ? { ...u, status: 'error', errorMsg: err.message } : u));
      }
    }
    setIsAnalyzing(false);
  };
  
  const hasFinishedItems = uploads.some(u => u.status === 'done');

  const handleHistoryClick = (item) => {
    setActiveHistoryItem(item);
    setViewSource('history');
    setCurrentView('result');
  };

  const renderDiffText = (text) => {
    if (!text) return null;
    if (text.includes('{{{')) {
        // FIXED: Regex now uses [\s\S] to match across newlines inside the tag
        const parts = text.split(/(\{\{\{[\s\S]*?\}\}\})/g);
        return (
            <span className="leading-loose text-lg font-serif">
                {parts.map((part, index) => {
                    if (part.startsWith('{{{') && part.endsWith('}}}')) {
                        const content = part.substring(3, part.length - 3);
                        const [orig, corr, reason] = content.split('|||');
                        return <ErrorTooltip key={index} original={orig} correction={corr} reason={reason} />;
                    }
                    return <span key={index}>{part}</span>;
                })}
            </span>
        );
    } else {
        const parts = text.split(/(<\/?(?:del|ins)>)/g);
        return (
          <span className="leading-loose text-lg font-serif">
            {parts.map((part, index) => {
              if (part === '<del>') return null;
              if (part === '</del>') return null;
              if (part === '<ins>') return null;
              if (part === '</ins>') return null;
              if (!part) return null;
              if (text.includes('<del>') && text.includes('<ins>')) {
                 if (index > 0 && parts[index-1] === '<del>') return <span key={index} className="bg-red-50 text-red-500 line-through decoration-red-400 decoration-2 px-1 rounded-l border border-r-0 border-red-100 select-none opacity-80">{part}</span>;
                 if (index > 0 && parts[index-1] === '<ins>') return <span key={index} className="bg-emerald-50 text-emerald-700 font-bold px-1 rounded-r border border-l-0 border-emerald-200 border-b-2 border-b-emerald-400">{part}</span>;
              }
              return <span key={index}>{part}</span>;
            })}
          </span>
        );
    }
  };

  // --- Views ---

  const HomeView = () => {
    const displayedHistory = history.filter(item => {
        if (historyFilter === 'completed') return item.status === 'completed';
        return item.status !== 'completed';
    });

    return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header: Was bg-pink-500, now white with black text */}
      <header className="bg-white text-slate-900 p-6 rounded-b-3xl shadow-sm border-b border-slate-200 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Heart size={120} className="text-slate-900 transform rotate-12" />
        </div>
        <div className="flex justify-between items-start mb-2 relative z-10">
            <div className="flex items-center gap-2">
                <Globe size={20} className="text-slate-900" />
                <h1 className="text-2xl font-bold">Miss Wong’s AI Assistant</h1>
            </div>
            <div className="flex gap-2">
                {!isStandalone && (
                  <button onClick={handleInstallClick} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-900" title="Install">
                      <Download size={20} />
                  </button>
                )}
                <button onClick={() => setCurrentView('settings')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-900" title="Settings">
                    <Settings size={20} />
                </button>
            </div>
        </div>
        <p className="text-slate-500 text-sm mb-6 font-medium">Assist Miss Wong in her work with love ❤️.</p>
        {/* Level Selector: Was bg-white/20, now bg-slate-100 */}
        <div className="bg-slate-100 p-1 rounded-xl backdrop-blur-sm flex justify-between">
          {[
            { id: 'Primary', label: 'Primary', icon: <School size={16} /> },
            { id: 'Secondary', label: 'Secondary', icon: <BookOpenCheck size={16} /> },
            { id: 'University', label: 'University', icon: <GraduationCap size={16} /> },
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setEssayLevel(lvl.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${essayLevel === lvl.id ? 'bg-white text-slate-900 shadow-md transform scale-105 font-bold border border-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
            >
              {lvl.icon} {lvl.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History size={18} className="text-slate-900" /> History
          </h2>
        </div>

        {/* Filter Buttons: Was bg-pink-100, now bg-slate-200/50 */}
        <div className="flex mb-4 bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setHistoryFilter('incomplete')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${historyFilter === 'incomplete' 
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                        : 'text-slate-400 hover:text-slate-600'}`}
            >
                Incomplete
                {history.filter(i => i.status !== 'completed').length > 0 && 
                    <span className="bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{history.filter(i => i.status !== 'completed').length}</span>
                }
            </button>
            <button 
                onClick={() => setHistoryFilter('completed')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${historyFilter === 'completed' 
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                        : 'text-slate-400 hover:text-slate-600'}`}
            >
                <CheckCircle size={14} /> Completed
            </button>
        </div>

        <div className="space-y-3">
          {displayedHistory.length === 0 ? (
             <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center">
                <div className="bg-white p-4 rounded-full mb-3 shadow-sm border border-slate-100">
                  <ScanLine size={32} className="text-slate-200" />
                </div>
                {historyFilter === 'incomplete' ? "All caught up! No pending essays." : "No completed essays yet."}
             </div>
          ) : (
            displayedHistory.map((item) => (
                <button 
                  key={item?.id || Math.random()} 
                  onClick={() => handleHistoryClick(item)}
                  className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md hover:border-slate-300 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-bold text-slate-800 text-sm group-hover:text-slate-900 transition-colors">{item?.studentName || 'Unknown'}</h3>
                       <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${item?.level === 'University' ? 'bg-purple-50 text-purple-600 border border-purple-100' : item?.level === 'Secondary' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                        {item?.level || 'Secondary'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{item?.title || 'No Title'}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{item?.date || 'Today'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                      {item.status === 'completed' ? (
                          <div className="text-emerald-600 flex items-center gap-1 text-sm font-bold">
                              <CheckCircle size={16} /> Done
                          </div>
                      ) : (
                          <div className={`text-lg font-bold ${item?.score >= 80 ? 'text-green-600' : item?.score >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {item?.score || '-'}
                          </div>
                      )}
                      <ArrowRight size={14} className="text-slate-200 group-hover:text-slate-400 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
            ))
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="grid grid-cols-2 gap-4">
          {/* Scan Button: Was pink, now Black/Slate-900 */}
          <label className={`flex flex-col items-center justify-center bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl shadow-lg shadow-slate-200 cursor-pointer transition-transform active:scale-95 gap-2`}>
            <Camera size={28} />
            <span className="font-semibold">Scan</span>
            <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleImageUpload} />
          </label>
          {/* Upload Button: Was white/pink border, now white/slate border */}
          <label className={`flex flex-col items-center justify-center bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-900 py-4 rounded-2xl cursor-pointer transition-transform active:scale-95 gap-2`}>
            <ImageIcon size={28} />
            <span className="font-semibold">Upload</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
      </div>
    </div>
    );
  };

  const SettingsView = () => {
    const [tempKey, setTempKey] = useState(userApiKey);
    const [showKey, setShowKey] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [tempModel, setTempModel] = useState(selectedModel); 
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customModelInput, setCustomModelInput] = useState('');
    
    const isFirstSetup = !userApiKey;

    useEffect(() => {
        const presets = ['gemini-2.5-flash-preview-09-2025', 'gemini-3-pro-preview'];
        if (!presets.includes(selectedModel)) {
            setIsCustomMode(true);
            setCustomModelInput(selectedModel);
            setTempModel('custom');
        } else {
            setTempModel(selectedModel);
            setIsCustomMode(false);
        }
    }, []);

    const handleSaveKey = () => {
        if (!tempKey.trim()) {
            alert("Please enter a valid API Key.");
            return;
        }
        
        let finalModel = tempModel;
        if (isCustomMode) {
            if (!customModelInput.trim()) {
                alert("Please enter a Custom Model ID");
                return;
            }
            finalModel = customModelInput.trim();
        }

        setUserApiKey(tempKey);
        setSelectedModel(finalModel);
        setSaveStatus('Saved!');
        setTimeout(() => {
            setSaveStatus('');
            if (isFirstSetup) setCurrentView('home');
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10 border-b border-slate-100">
                {!isFirstSetup ? (
                    <button onClick={() => setCurrentView('home')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <ChevronLeft size={24} />
                    </button>
                ) : <div className="w-10"></div>}
                <div className="flex-1 text-center"><h1 className="font-bold text-slate-800">Settings</h1></div>
                <div className="w-10"></div>
            </header>
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="mb-6">
                    <button onClick={() => setCurrentView('data-management')} className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Database size={20} /></div>
                            <span className="font-bold text-slate-700">Manage Data</span>
                        </div>
                        <ChevronRight size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><Key size={24} /></div>
                        <h2 className="text-lg font-bold text-slate-800">API Configuration</h2>
                    </div>
                    <div className="mb-6">
                        <div className="relative">
                            <input 
                                type={showKey ? "text" : "password"}
                                value={tempKey}
                                onChange={(e) => setTempKey(e.target.value)}
                                placeholder="Paste API Key..."
                                className={`w-full p-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 bg-slate-50 text-slate-800 ${isFirstSetup && !tempKey ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'}`}
                            />
                            <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4 pt-4 border-t border-slate-100">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Brain size={24} /></div>
                        <h2 className="text-lg font-bold text-slate-800">AI Model</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 mb-4">
                        <button onClick={() => { setTempModel('gemini-2.5-flash-preview-09-2025'); setIsCustomMode(false); }} className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${tempModel === 'gemini-2.5-flash-preview-09-2025' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full"><Zap size={20} /></div>
                            <div><div className="font-bold text-slate-800">Flash (2.5 Preview)</div><div className="text-xs text-slate-500">Default. Fast & Efficient.</div></div>
                        </button>
                        <button onClick={() => { setTempModel('gemini-3-pro-preview'); setIsCustomMode(false); }} className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${tempModel === 'gemini-3-pro-preview' ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-full"><Brain size={20} /></div>
                            <div><div className="font-bold text-slate-800">Gemini 3 Pro</div><div className="text-xs text-slate-500">gemini-3-pro-preview</div></div>
                        </button>
                        <button onClick={() => { setTempModel('custom'); setIsCustomMode(true); }} className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${isCustomMode ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><Edit2 size={20} /></div>
                            <div><div className="font-bold text-slate-800">Custom</div><div className="text-xs text-slate-500">Enter specific model ID</div></div>
                        </button>
                    </div>

                    {isCustomMode && (
                        <div className="mb-6 animate-fade-in">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Custom Model ID</label>
                            <input type="text" value={customModelInput} onChange={(e) => setCustomModelInput(e.target.value)} placeholder="e.g. gemini-1.5-pro-latest" className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white text-slate-800 text-sm" />
                        </div>
                    )}

                    <div className="flex gap-3 mt-4">
                         {/* Save Button: Black/Slate-900 */}
                         <button onClick={handleSaveKey} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-all flex justify-center items-center gap-2 hover:bg-slate-800">
                            {saveStatus === 'Saved!' ? <CheckCircle size={20}/> : <Save size={20} />}
                            {saveStatus || (isFirstSetup ? 'Save & Start' : 'Save Settings')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const DataManagementView = () => {
    const [jsonInput, setJsonInput] = useState('');

    const handleExportData = () => {
        const dataStr = JSON.stringify(history, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `essay_grader_backup_${new Date().toISOString().slice(0,10)}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleImportFromText = () => {
        if (!jsonInput.trim()) return;
        try {
            const importedData = JSON.parse(jsonInput);
            if (!Array.isArray(importedData)) {
                alert("Invalid JSON: Must be an array []");
                return;
            }
            const sanitizedData = importedData.map(item => ({
                ...item,
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                date: item.date || new Date().toLocaleDateString(),
                level: item.level || 'Primary',
                studentName: item.studentName || 'Imported Student',
                score: item.score || 0,
                status: item.status || 'incomplete'
            }));
            setHistory(prev => [...sanitizedData, ...prev]);
            setJsonInput('');
            alert(`Imported ${sanitizedData.length} records successfully.`);
        } catch (err) {
            alert("JSON Parse Error. Please check format.");
        }
    };

    const clearAllHistory = () => {
        if (window.confirm('Delete ALL history? This cannot be undone.')) {
            setHistory([]);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10 border-b border-slate-100">
                <button onClick={() => setCurrentView('settings')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1 text-center"><h1 className="font-bold text-slate-800">Data Management</h1></div>
                <div className="w-10"></div>
            </header>
            <div className="p-6 flex-1 overflow-y-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ClipboardPaste size={24} /></div>
                        <h2 className="text-lg font-bold text-slate-800">Import Data</h2>
                    </div>
                    <div className="mb-4">
                        <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='Paste JSON array here: [{"studentName": "...", "score": 85...}]' className="w-full h-48 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-xs font-mono text-slate-600 resize-none" />
                    </div>
                    <button onClick={handleImportFromText} disabled={!jsonInput.trim()} className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${!jsonInput.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`}>
                        <FileJson size={20} /> Import JSON
                    </button>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Download size={24} /></div>
                        <h2 className="text-lg font-bold text-slate-800">Backup</h2>
                    </div>
                    <button onClick={handleExportData} className="w-full py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2">
                        <Download size={20} /> Export All History
                    </button>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <button onClick={clearAllHistory} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-red-100 transition-colors">
                        <Trash2 size={20} /> Clear All History
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const BatchPreviewView = () => {
    const currentUpload = uploads.find(u => u.id === selectedUploadId) || uploads[0];
    const pendingCount = uploads.filter(u => u.status === 'idle').length;
    
    return (
      <div className="flex flex-col h-full bg-slate-900">
        <div className="flex justify-between items-center p-4 text-white bg-slate-900 z-10">
          <button onClick={() => { if(!isAnalyzing) { setUploads([]); setCurrentView('home'); } }} className={`p-2 bg-white/10 rounded-full ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="font-semibold">Manager</h2>
            <span className="text-xs text-slate-400">{uploads.length} selected</span>
          </div>
          {hasFinishedItems ? (
             <button onClick={() => { setViewSource('upload'); setCurrentView('result'); }} className="px-3 py-1 bg-white text-slate-900 rounded-full text-xs font-bold animate-pulse">
               Results
             </button>
          ) : <div className="w-9"></div>}
        </div>
        <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
          {currentUpload && (
            <img src={currentUpload.preview} alt="Preview" className="max-w-full max-h-full object-contain" />
          )}
          {currentUpload?.status === 'done' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-white p-4 rounded-2xl flex flex-col items-center shadow-xl animate-bounce-in">
                <CheckCircle size={48} className="text-green-500 mb-2" />
                <span className="font-bold text-slate-800">Analyzed</span>
              </div>
            </div>
          )}
          {currentUpload?.status === 'error' && (
             <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {currentUpload.errorMsg || 'Error analyzing image'}
             </div>
          )}
        </div>
        <div className="h-24 bg-slate-800 p-2 flex gap-2 overflow-x-auto">
          {uploads.map(u => (
            <button key={u.id} onClick={() => setSelectedUploadId(u.id)} className={`relative flex-shrink-0 aspect-[3/4] h-full rounded-lg overflow-hidden border-2 transition-all ${selectedUploadId === u.id ? 'border-white scale-105' : 'border-transparent opacity-60'}`}>
              <img src={u.preview} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                 {u.status === 'analyzing' && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>}
                 {u.status === 'done' && <div className="bg-green-500 rounded-full p-0.5"><CheckCircle size={12} className="text-white"/></div>}
                 {u.status === 'error' && <div className="bg-red-500 rounded-full p-0.5"><AlertCircle size={12} className="text-white"/></div>}
              </div>
              {!isAnalyzing && (
                 <div onClick={(e) => { e.stopPropagation(); removeUpload(u.id); }} className="absolute top-0 right-0 p-1 bg-black/50 text-white hover:bg-red-500"><X size={10} /></div>
              )}
            </button>
          ))}
          {!isAnalyzing && (
            <label className="flex-shrink-0 aspect-[3/4] h-full rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-white hover:border-slate-400 cursor-pointer">
              <Plus size={20} />
              <span className="text-[10px] mt-1">Add</span>
              <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          {pendingCount > 0 ? (
            <button onClick={startBatchAnalysis} disabled={isAnalyzing} className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isAnalyzing ? 'bg-slate-700 text-slate-400' : 'bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'}`}>
              {isAnalyzing ? <><Loader className="animate-spin" size={20} /><span>Processing...</span></> : <><Sparkles size={20} /><span>Analyze {pendingCount} Essays</span></>}
            </button>
          ) : (
            // --- UPDATED: Button Disabled Logic ---
            <button 
                onClick={() => { if (hasFinishedItems) { setViewSource('upload'); setCurrentView('result'); } }} 
                disabled={!hasFinishedItems}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 ${hasFinishedItems ? 'bg-white text-black' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              <BookOpenCheck size={20} /> {hasFinishedItems ? 'View All Results' : 'No Completed Results'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const ResultView = () => {
    const [tab, setTab] = useState('diff'); 

    let displayItem = null;
    let finishedUploads = [];

    if (viewSource === 'history') {
        displayItem = { result: activeHistoryItem };
    } else {
        finishedUploads = uploads.filter(u => u.status === 'done');
        displayItem = finishedUploads.find(u => u.id === selectedUploadId) || finishedUploads[0];
    }

    if (!displayItem || !displayItem.result) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center">
                <AlertCircle size={48} className="text-slate-300 mb-4"/>
                <h3 className="text-lg font-bold text-slate-700">No Data Found</h3>
                <button onClick={() => { setUploads([]); setCurrentView('home'); }} className="mt-4 text-slate-900 font-semibold">Home</button>
            </div>
        )
    }

    const displayData = displayItem.result;
    const isHistoryMode = viewSource === 'history';
    const isCompleted = displayItem.result.status === 'completed';

    const markAsCompleted = () => {
        // Update history
        const updatedHistory = history.map(item => {
            const targetId = isHistoryMode ? activeHistoryItem.id : displayItem.id;
            if (item.id === targetId) {
                return { ...item, status: 'completed' };
            }
            return item;
        });
        
        setHistory(updatedHistory);
        
        if(!isHistoryMode) {
             const updatedUploads = uploads.map(u => 
                u.id === displayItem.id ? {...u, result: {...u.result, status: 'completed'}} : u
             );
             setUploads(updatedUploads);
        } else {
            setActiveHistoryItem({...activeHistoryItem, status: 'completed'});
        }

        setCurrentView('home');
    };

    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10 border-b border-slate-100">
          <button onClick={() => isHistoryMode ? setCurrentView('home') : setCurrentView('scan-preview')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 text-center">
             <h1 className="font-bold text-slate-800">{isHistoryMode ? 'Review' : 'Results'}</h1>
             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                 {isHistoryMode ? (displayItem.result?.level || 'Essay') : `${essayLevel} Level`}
             </span>
          </div>
          
          {/* --- Mark Completed Button --- */}
          {!isCompleted ? (
              <button 
                onClick={markAsCompleted}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shadow-md"
              >
                 <CheckSquare size={16} /> Mark Done
              </button>
          ) : (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold cursor-default">
                  <CheckCircle size={16} /> Completed
              </div>
          )}
        </header>

        {/* Student Selector */}
        {!isHistoryMode && finishedUploads.length > 0 && (
            <div className="bg-white border-b border-slate-100 p-2 flex gap-2 overflow-x-auto shadow-inner">
                {finishedUploads.map(u => (
                    <button key={u.id} onClick={() => setSelectedUploadId(u.id)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${selectedUploadId === u.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedUploadId === u.id ? 'bg-white text-slate-900' : 'bg-slate-100'}`}>
                            {u.result.studentName ? u.result.studentName.charAt(0) : '?'}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap max-w-[100px] truncate">{u.result.studentName || 'Unknown'}</span>
                    </button>
                ))}
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Read-Only Score Card: Was pink gradient, now Slate-900 */}
          <div className={`text-white p-6 rounded-2xl shadow-lg relative overflow-hidden bg-slate-900`}>
            <div className="absolute -right-6 -top-6 bg-white/10 w-32 h-32 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                 <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                    <Users size={12} />
                    {displayData.studentName || 'Unknown'}
                 </div>
                 <div className="flex items-end gap-2">
                    <div className="text-5xl font-bold tracking-tight">{displayData.score || '-'}</div>
                 </div>
              </div>
              <div>
                <p className="text-lg font-semibold opacity-90 truncate leading-snug">{displayData.title || 'No Title'}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] opacity-80">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-400 rounded-full"></div>Error</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-300 rounded-full"></div>Correction</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback (Read-Only) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-500" /> 
              Detailed Feedback
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {displayData.comments || "No comments available."}
            </p>
            
            {displayData.suggestions && displayData.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Suggestions</h4>
                    <ul className="space-y-2">
                    {displayData.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <div className="mt-1 min-w-[6px] h-[6px] rounded-full bg-slate-300 shrink-0"></div>
                        <span>{suggestion}</span>
                        </li>
                    ))}
                    </ul>
                </div>
            )}
          </div>

          {/* Content Tabs: Was pink underline, now Slate-900 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-visible">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              <button onClick={() => setTab('diff')} className={`flex-1 py-3 text-sm font-semibold transition-colors whitespace-nowrap px-4 ${tab === 'diff' ? 'text-slate-900 bg-slate-50 border-b-2 border-slate-900' : 'text-slate-500'}`}>
                Correction
              </button>
              <button onClick={() => setTab('clean')} className={`flex-1 py-3 text-sm font-semibold transition-colors whitespace-nowrap px-4 ${tab === 'clean' ? 'text-slate-900 bg-slate-50 border-b-2 border-slate-900' : 'text-slate-500'}`}>
                Clean Text
              </button>
              <button onClick={() => setTab('ocr')} className={`flex-1 py-3 text-sm font-semibold transition-colors whitespace-nowrap px-4 ${tab === 'ocr' ? 'text-slate-900 bg-slate-50 border-b-2 border-slate-900' : 'text-slate-500'}`}>
                 Raw OCR
              </button>
            </div>
            
            <div className="p-5 min-h-[200px]">
                 <>
                   {tab === 'diff' && (
                      <div className="prose prose-sm max-w-none text-slate-700">
                        {renderDiffText(displayData.diffText || displayData.correctedText)}
                      </div>
                   )}
                   {tab === 'clean' && (
                      <div className="prose prose-sm max-w-none text-slate-700">
                        <p className="whitespace-pre-wrap leading-loose text-justify font-sans">{displayData.correctedText}</p>
                      </div>
                   )}
                   {tab === 'ocr' && (
                      <div className="prose prose-sm max-w-none">
                         <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-xs text-slate-500 flex flex-col gap-2">
                             <div className="flex items-center gap-2 font-bold text-slate-700">
                                <ScanLine size={14} />
                                AI Vision (Preprocessed)
                             </div>
                             {displayData.processedImageBase64 ? (
                                <div className="rounded-lg overflow-hidden border border-slate-300 shadow-sm bg-black">
                                   <img src={`data:image/jpeg;base64,${displayData.processedImageBase64}`} className="w-full h-auto object-contain max-h-60" alt="AI Vision" />
                                </div>
                             ) : (
                                <div className="text-slate-400 italic">No image data available</div>
                             )}
                             <div className="mt-2 flex items-center gap-2 font-bold text-slate-700 border-t border-slate-200 pt-2">
                                <Eye size={14} />
                                OCR Text
                             </div>
                             <p className="whitespace-pre-wrap leading-loose text-slate-600 text-justify font-mono text-xs">
                                 {displayData.ocrText || "OCR data not available."}
                             </p>
                         </div>
                      </div>
                   )}
                 </>
            </div>
          </div>

          {/* Quick Summary Section (Bottom) */}
          <div className="grid grid-cols-1 gap-4">
             {/* Spelling Check */}
             <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                 <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                     <PenTool size={16} className="text-red-500" /> Spelling Check
                 </h4>
                 {(!displayData.spellingErrors || displayData.spellingErrors.length === 0) ? (
                    <div className="text-xs text-slate-400 italic">No spelling errors detected. Great job!</div>
                 ) : (
                    <div className="flex flex-wrap gap-2">
                        {displayData.spellingErrors.map((err, i) => (
                            <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-md border border-red-100">
                                {err}
                            </span>
                        ))}
                    </div>
                 )}
             </div>
             
             {/* One-Sentence Summaries */}
             <div className="grid grid-cols-1 gap-2">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100 flex gap-3 items-start">
                    <ThumbsUp size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <span className="block text-xs font-bold text-green-800 uppercase mb-1">Strength</span>
                        <p className="text-sm text-green-900 leading-snug">{displayData.strengthSummary || "N/A"}</p>
                    </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex gap-3 items-start">
                    <Target size={18} className="text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <span className="block text-xs font-bold text-orange-800 uppercase mb-1">To Improve</span>
                        <p className="text-sm text-orange-900 leading-snug">{displayData.improvementSummary || "N/A"}</p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto h-screen bg-slate-100 shadow-2xl overflow-hidden font-sans text-slate-900">
      {currentView === 'home' && <HomeView />}
      {currentView === 'scan-preview' && <BatchPreviewView />}
      {currentView === 'result' && <ResultView />}
      {currentView === 'settings' && <SettingsView />}
      {currentView === 'data-management' && <DataManagementView />}
    </div>
  );
}