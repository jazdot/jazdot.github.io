import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, PenTool, Bot, Book, LogIn, LogOut, BrainCircuit, Trophy, Loader2, X, Edit2, Trash2, Search, PlayCircle, Timer, Bookmark, Sun, Moon, Monitor, Share2, Volume2, VolumeX, Maximize, Minimize, RotateCcw, Calculator, Menu, Star, ChevronDown } from 'lucide-react';
import { useCatStore } from './catStore';
import { paperLoaders, getAllQuestions, type Question } from '../data/cat_db';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, query, getDocs, limit } from './firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- IndexedDB Helpers ---
const DB_NAME = 'CatMaesterDB';
const STORE_NAME = 'mockTests';
const FORMULA_STORE = 'formulas';
const GENERATED_Q_STORE = 'generatedQuestions';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FORMULA_STORE)) {
        db.createObjectStore(FORMULA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(GENERATED_Q_STORE)) {
        db.createObjectStore(GENERATED_Q_STORE, { keyPath: ['subject', 'batchId'] });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveMockTest = async (test: any) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(test);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getMockTests = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const saveGeneratedBatch = async (subject: string, batchId: number, questions: Question[]) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(GENERATED_Q_STORE, 'readwrite');
    const store = tx.objectStore(GENERATED_Q_STORE);
    store.put({ subject, batchId, questions, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getGeneratedBatches = async (subject: string): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(GENERATED_Q_STORE, 'readonly');
    const store = tx.objectStore(GENERATED_Q_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result.filter(batch => batch.subject === subject));
    };
    req.onerror = () => reject(req.error);
  });
};

const deleteGeneratedBatch = async (subject: string, batchId: number) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(GENERATED_Q_STORE, 'readwrite');
    const req = tx.objectStore(GENERATED_Q_STORE).delete([subject, batchId]);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(tx.error);
  });
};

const saveFormula = async (formula: any) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMULA_STORE, 'readwrite');
    tx.objectStore(FORMULA_STORE).put(formula);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getFormulas = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMULA_STORE, 'readonly');
    const req = tx.objectStore(FORMULA_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const deleteFormula = async (id: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMULA_STORE, 'readwrite');
    const req = tx.objectStore(FORMULA_STORE).delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};

// --- Real AI Generation via Gemini ---
const generateQuestionsAPI = async (subject: 'QA' | 'VARC' | 'DILR', topic?: string, retries = 2): Promise<Question[]> => {
  console.log(`[AI] Generating new batch for ${subject}${topic ? ` on ${topic}` : ''} via Gemini...`);
  
  // IMPORTANT: This key is likely invalid. Replace with your actual key or use environment variables.
  const GEMINI_API_KEY = "AIzaSyA0Os43E1UjN0AOjpYax-dA7v8X_L7jjP4"; 
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `
    You are an expert examiner and content creator for the Indian Common Admission Test (CAT) for IIMs. 
    Generate 5 highly challenging, unique, and strictly syllabus-aligned questions for the section: ${subject}. 
    The difficulty, tone, and trickiness MUST perfectly mimic actual CAT past year papers (PYQs).
    ${topic ? `\nCRITICAL: The questions MUST be strictly focused on the specific topic: ${topic}.` : ''}
    ${subject === 'VARC' ? `
    CRITICAL VARC INSTRUCTIONS:
    - If generating Reading Comprehension, the 'context' field MUST contain a highly complex, dense, and intellectually stimulating passage of exactly 500 to 600 words, mimicking the exact standard of actual CAT exam passages.
    - Topics should be drawn from philosophy, sociology, history, evolutionary biology, economics, or literature.
    - The questions MUST test deep critical reasoning (Inference, Central Idea, Tone, Weakening/Strengthening arguments, Double Negatives). Do NOT ask direct factual questions.` : ''}
    ${subject === 'DILR' ? `
    CRITICAL DILR INSTRUCTIONS:
    - If generating a set, the 'context' field MUST contain a highly complex logic puzzle, intricate data table, seating arrangement, or tournament scenario exactly like real CAT DILR sets. The constraints must be interlocked and require a matrix to solve.` : ''}
    ${subject === 'QA' ? `
    CRITICAL QA INSTRUCTIONS:
    - Questions should test conceptual clarity and clever application of fundamentals rather than tedious calculations.
    - Focus on Arithmetic, Algebra, Geometry, and Number Systems as per recent CAT trends.` : ''}
    
    CRITICAL INSTRUCTION: You must respond ONLY with a raw JSON array. Do not include markdown formatting (like \`\`\`json), explanations, or any other text. 
    
    The JSON objects must strictly follow this TypeScript interface:
    {
      id: string; // generate a unique string like "gen_${subject.toLowerCase()}_<random>"
      text: string; // The question text. Use $...$ or $$...$$ for Math LaTeX if QA.
      type: 'MCQ' | 'TITA';
      options?: string[]; // Array of 4 strings if MCQ, omit if TITA
      correct?: number; // 0, 1, 2, or 3 representing the index of the correct option if MCQ
      tita_answer?: string; // String answer if TITA, omit if MCQ
      explanation: string; // Detailed step-by-step solution
      section: '${subject}';
      context?: string; // Optional: Passage for VARC or Data table for DILR. (Group questions with the same context if generating a DILR set or Reading Comprehension).
      difficulty?: 'Easy' | 'Medium' | 'Hard'; // Assign an overall difficulty level.
      hint?: string; // Optional: A specific exact sentence or phrase from the context that contains the answer or provides a strong hint. MUST be an exact substring of the context.
    }
  `;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.7, // Balances creativity with strict formatting
          }
        })
      });

      if (!response.ok) {
        let errorBody = 'No details available. This might be a CORS or network issue.';
        try {
          const errorData = await response.json();
          errorBody = errorData?.error?.message || JSON.stringify(errorData);
        } catch {}
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
      }

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) throw new Error("No response generated from AI.");

      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedQuestions: Question[] = JSON.parse(rawText);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error("AI returned invalid structure (not an array).");
      }

      console.log(`[AI] Generation complete for ${subject}.`, parsedQuestions);
      return parsedQuestions;

    } catch (error) {
      console.error(`[AI] Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(res => setTimeout(res, 1500 * attempt));
    }
  }
  throw new Error("AI generation failed after multiple retries.");
};


const renderLatex = (text: string, highlightText?: string | null) => {
  if (!text) return '';
  
  let result = '';
  const processTextPart = (str: string) => {
    let textPart = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Basic Markdown
    textPart = textPart.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    textPart = textPart.replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>');
    
    // Unwrapped Math symbols fallback (fixes missing symbols outside $ tags)
    textPart = textPart.replace(/\\sqrt\s*{([^}]+)}/g, '√$1');
    textPart = textPart.replace(/\\sqrt\s*(\d+)/g, '√$1');
    textPart = textPart.replace(/\\frac\s*{([^}]+)}\s*{([^}]+)}/g, '($1/$2)');
    textPart = textPart.replace(/\\pi/gi, 'π');
    textPart = textPart.replace(/\\alpha/gi, 'α');
    textPart = textPart.replace(/\\beta/gi, 'β');
    textPart = textPart.replace(/\\theta/gi, 'θ');
    textPart = textPart.replace(/\\Delta/g, 'Δ');
    textPart = textPart.replace(/\\times/gi, '×');
    textPart = textPart.replace(/\\div/gi, '÷');
    textPart = textPart.replace(/\\pm/gi, '±');
    textPart = textPart.replace(/\\sum/gi, '∑');
    textPart = textPart.replace(/\\infty/gi, '∞');
    textPart = textPart.replace(/\\approx/gi, '≈');
    textPart = textPart.replace(/\\cdot/gi, '·');
    textPart = textPart.replace(/\\circ/gi, '°');
    textPart = textPart.replace(/\\ge/g, '≥');
    textPart = textPart.replace(/\\le/g, '≤');
    textPart = textPart.replace(/\\neq/g, '≠');
    textPart = textPart.replace(/\^2/g, '²');
    textPart = textPart.replace(/\^3/g, '³');
    
    textPart = textPart.replace(/=>/g, '<strong class="text-[hsl(var(--accent))] mx-1">⇒</strong>');

    // Highlight "Correct Option" or "Answer" statements
    textPart = textPart.replace(/(The correct option is [A-D]\.?|(?:Therefore|Hence),? option [A-D] is the correct answer\.?|Option [A-D] is the correct answer\.?|(?:Therefore|Hence),? (?:[A-D]|\d+(?:\.\d+)?) is the correct answer\.?)/gi, (match) => {
      return `<br/><br/><span class="inline-block px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold shadow-sm">${match}</span>`;
    });

    // Elegant formatting for logic/math explanations (breaks down walls of text automatically)
    textPart = textPart.replace(/(^|\.\s+)(Given|Now|Also|Therefore|Hence|Thus|Step \d+:?|Case \d+:?),?\s+/gi, (match, p1, p2) => {
      const prefix = p1.includes('.') ? '.<br/><br/>' : ''; 
      const hasComma = match.includes(',');
      const capP2 = p2.charAt(0).toUpperCase() + p2.slice(1);
      return `${prefix}<strong class="text-[hsl(var(--accent))] opacity-90">${capP2}${hasComma ? ',' : ''}</strong> `;
    });

    textPart = textPart.replace(/\n/g, '<br/>');
    return textPart;
  };

  if (!(window as any).katex) {
    result = processTextPart(text);
  } else {
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    result = parts.map(part => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        try { return (window as any).katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }); } catch(e) { return part; }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        try { return (window as any).katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false }); } catch(e) { return part; }
      }
      return processTextPart(part);
    }).join('');
  }

  if (highlightText && highlightText.trim() !== '') {
    const escapedHighlight = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const htmlEscapedHighlight = escapedHighlight.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const regex = new RegExp(`(${htmlEscapedHighlight})(?![^<]*>)`, 'gi');
    result = result.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-500/40 text-inherit rounded px-1 shadow-sm transition-all duration-300">$1</mark>');
  }

  return result;
};

// --- Pinch Zoom Image Component ---
const PinchZoomImage = ({ src, alt }: { src: string, alt: string }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const startDist = useRef<number | null>(null);
  const startScale = useRef<number>(1);
  const lastPan = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      startDist.current = dist;
      startScale.current = scale;
      lastPan.current = null;
    } else if (e.touches.length === 1 && scale > 1) {
      e.stopPropagation();
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startDist.current !== null) {
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.max(1, Math.min(startScale.current * (dist / startDist.current), 5));
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && scale > 1 && lastPan.current) {
      e.stopPropagation();
      const deltaX = e.touches[0].clientX - lastPan.current.x;
      const deltaY = e.touches[0].clientY - lastPan.current.y;
      setPosition(prev => ({ x: prev.x + deltaX / scale, y: prev.y + deltaY / scale }));
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    startDist.current = null;
    lastPan.current = null;
    if (scale <= 1) {
        setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div className="relative w-full flex justify-center my-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50" style={{ touchAction: scale > 1 ? 'none' : 'pan-x pan-y', overflow: 'hidden' }}>
      <img 
        src={src} 
        alt={alt} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={() => { setScale(scale > 1 ? 1 : 2); setPosition({ x: 0, y: 0 }); }}
        style={{ 
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`, 
          transition: startDist.current || lastPan.current ? 'none' : 'transform 0.2s ease-out',
          transformOrigin: 'center'
        }}
        className="max-w-full object-contain cursor-zoom-in"
      />
      {scale > 1 && (
        <button 
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// --- Render Context Helper ---
const renderTable = (lines: string[], key: number, highlightText?: string | null) => {
  let isHeader = true;
  return (
    <div key={`tbl_${key}`} className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full">
      <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-900">
        <tbody>
          {lines.map((line, idx) => {
            // Check if it's the markdown separator row (e.g. |---|---|)
            if (line.match(/^\|[\s\-:|]+\|$/)) {
              isHeader = false;
              return null;
            }
            // Extract cell content, slicing off the start and end pipes
            const cells = line.split('|').slice(1, -1);
            return (
              <tr key={idx} className="border-b last:border-b-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {cells.map((cell, cIdx) => (
                  isHeader ? (
                    <th key={cIdx} className="border-r last:border-r-0 border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span dangerouslySetInnerHTML={{ __html: renderLatex(cell.trim(), highlightText) }} />
                    </th>
                  ) : (
                    <td key={cIdx} className="border-r last:border-r-0 border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400 align-top">
                      <span dangerouslySetInnerHTML={{ __html: renderLatex(cell.trim(), highlightText) }} />
                    </td>
                  )
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const renderContextWithImages = (text: string, highlightText?: string | null) => {
  if (!text) return null;
  const parts = text.split(/(!\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      return <PinchZoomImage key={`img_${i}`} alt={imgMatch[1]} src={imgMatch[2]} />;
    }
    
    const lines = part.split('\n');
    const blocks: React.ReactNode[] = [];
    let currentText = '';
    let tableLines: string[] = [];
    let inTable = false;

    const flushText = () => {
      if (currentText) {
        blocks.push(<span key={`txt_${blocks.length}`} dangerouslySetInnerHTML={{ __html: renderLatex(currentText, highlightText) }} />);
        currentText = '';
      }
    };

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          flushText();
          inTable = true;
        }
        tableLines.push(line);
      } else {
        if (inTable) {
          blocks.push(renderTable(tableLines, blocks.length, highlightText));
          tableLines = [];
          inTable = false;
        }
        currentText += lines[j] + (j === lines.length - 1 ? '' : '\n');
      }
    }
    
    if (inTable) {
      blocks.push(renderTable(tableLines, blocks.length, highlightText));
    }
    flushText();

    return <Fragment key={`frag_${i}`}>{blocks}</Fragment>;
  });
};

// --- Flashcard Component ---
const Flashcard = ({ formula, onEdit, onDelete, onUpdate }: { formula: any, onEdit: () => void, onDelete: () => void, onUpdate: (f: any) => void }) => {
  const [flipped, setFlipped] = useState(false);
  
  const handleRate = (e: React.MouseEvent, performance: number) => {
    e.stopPropagation();
    let { reps = 0, interval = 1, ease = 2.5 } = formula;
    if (performance >= 3) {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.round(interval * ease);
      reps += 1;
      ease = ease + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
    } else {
      reps = 0;
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    }
    const nextReview = Date.now() + interval * 86400000;
    onUpdate({ ...formula, reps, interval, ease, nextReview, lastPerformance: performance });
    setFlipped(false);
  };

  const isDue = !formula.nextReview || formula.nextReview <= Date.now();
  const mastery = formula.reps > 4 ? 'Mastered' : formula.reps > 0 ? 'Learning' : 'New';

  return (
    <div className="relative w-full h-64 cursor-pointer group" style={{ perspective: '1000px' }} onClick={() => setFlipped(!flipped)}>
      <div className="absolute top-4 right-4 flex gap-2 z-10 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-500 hover:text-[hsl(var(--accent))] bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/10 transition-colors"><Edit2 size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-500 hover:text-rose-500 bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/10 transition-colors"><Trash2 size={16} /></button>
      </div>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         <span className={`text-xs font-bold px-2 py-1 rounded ${mastery === 'Mastered' ? 'bg-emerald-500/20 text-emerald-500' : mastery === 'Learning' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-rose-500/20 text-rose-500'}`}>{mastery}</span>
         {isDue && <span className="text-xs font-bold px-2 py-1 rounded bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]">Due</span>}
         {formula.isOfficial && <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Official</span>}
      </div>
      <m.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl flex flex-col justify-center items-center p-6 text-center overflow-y-auto" style={{ backfaceVisibility: 'hidden' }}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">{renderContextWithImages(formula.front)}</h3>
          {formula.topic && <div className="absolute bottom-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{formula.topic}</div>}
        </div>
        {/* Back */}
        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-sm bg-[hsl(var(--accent))] border-[hsl(var(--accent))] flex flex-col justify-between items-center p-6 text-center overflow-y-auto" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="flex-1 flex items-center justify-center text-lg font-medium text-white leading-relaxed whitespace-pre-wrap">{renderContextWithImages(formula.back)}</div>
          <div className="flex gap-2 w-full mt-4">
             <button onClick={(e) => handleRate(e, 1)} className="flex-1 bg-rose-500/20 hover:bg-rose-500/40 text-white py-2 rounded-lg text-sm font-bold transition-colors">Hard</button>
             <button onClick={(e) => handleRate(e, 3)} className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/40 text-white py-2 rounded-lg text-sm font-bold transition-colors">Good</button>
             <button onClick={(e) => handleRate(e, 5)} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-white py-2 rounded-lg text-sm font-bold transition-colors">Easy</button>
          </div>
        </div>
      </m.div>
    </div>
  );
};
// -------------------------

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[7000] flex items-center justify-center">
      <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-500 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">{cancelText}</button>
          <button onClick={onConfirm} className={`flex-1 px-4 py-2 rounded-xl font-bold text-white transition-all ${isDestructive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[hsl(var(--accent))] hover:opacity-90'}`}>{confirmText}</button>
        </div>
      </m.div>
    </div>
  );
};

const ActivationModal = ({ isOpen, onClose, onActivate, error }: { isOpen: boolean, onClose: () => void, onActivate: (key: string) => void, error: string }) => {
  const [key, setKey] = useState('');
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[8000] flex items-center justify-center">
      <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold mb-2">Activation Required</h3>
        <p className="text-slate-500 mb-6 text-sm">You've completed your first free mock test. Please enter an activation key to unlock more tests.</p>
        <input 
          type="text" 
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter activation key"
          className={`w-full bg-white dark:bg-slate-800 border-2 rounded-xl px-4 py-3 mb-2 focus:outline-none transition-colors ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-[hsl(var(--accent))]'}`}
        />
        {error && <p className="text-rose-500 text-xs mb-4">{error}</p>}
        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={() => onActivate(key)} className="flex-1 px-4 py-2 rounded-xl font-bold text-white bg-[hsl(var(--accent))] hover:opacity-90 transition-all">Activate</button>
        </div>
      </m.div>
    </div>
  );
};

export default function CatMaester() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);
  const [paperList, setPaperList] = useState<{id: string, title: string}[]>([]);
  
  // Zustand Global State
  const { user, progress, login, logout, addResult, addTopicResult, toggleBookmark, updateBookmarkNote, clearHistory, updateSkillRating, updatePracticeStreak, setWholeProgress, setActivated } = useCatStore();
  
  // Mock State
  const [mockPhase, setMockPhase] = useState<'select' | 'confirm' | 'test' | 'result' | 'review'>('select');
  const [timeLeft, setTimeLeft] = useState(7200);
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [sectionTimes, setSectionTimes] = useState<Record<string, number>>({});
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [taggedQuestions, setTaggedQuestions] = useState<Record<string, string>>({});
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [savedTests, setSavedTests] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [newFormula, setNewFormula] = useState({ front: '', back: '' });
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [practiceSubject, setPracticeSubject] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceFilterTopic, setPracticeFilterTopic] = useState<string | null>(null);
  const [practiceFilterBookmark, setPracticeFilterBookmark] = useState(false);
  const [practiceFilterDifficulty, setPracticeFilterDifficulty] = useState<string | null>(null);
  const [practiceRefreshTrigger, setPracticeRefreshTrigger] = useState(0);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number | string>>({});
  const [prefetchedBatch, setPrefetchedBatch] = useState<{ subject: string, topic?: string, questions: Question[] } | null>(null);
  const isPrefetching = useRef<string>('');
  const [practiceFilterAIBatch, setPracticeFilterAIBatch] = useState<number | null>(null);
  const [aiBatchesList, setAiBatchesList] = useState<any[]>([]);
  const [isAiBatchDropdownOpen, setIsAiBatchDropdownOpen] = useState(false);
  const [isDifficultyDropdownOpen, setIsDifficultyDropdownOpen] = useState(false);
  const [isAiTopicMode, setIsAiTopicMode] = useState(false);
  const [aiTopicFocus, setAiTopicFocus] = useState('');
  const [aiQuestionFeedback, setAiQuestionFeedback] = useState<Record<string, number>>(() => {
    try { const saved = localStorage.getItem('cat-maester-ai-feedback'); return saved ? JSON.parse(saved) : {}; }
    catch { return {}; }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastAnswerStatus, setLastAnswerStatus] = useState<'correct' | 'incorrect' | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [formulaSearch, setFormulaSearch] = useState('');
  const [formulaTopicFilter, setFormulaTopicFilter] = useState('All');
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showDesktopPalette, setShowDesktopPalette] = useState(true);
  const [showClearHistoryConfirmationModal, setShowClearHistoryConfirmationModal] = useState(false);
  const [passageWidth, setPassageWidth] = useState(50);
  const isDragging = useRef(false);
  const [qotd, setQotd] = useState<Question | null>(null);
  const [pendingUnfinishedTest, setPendingUnfinishedTest] = useState<any>(null);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('cat-maester-theme') as 'light' | 'dark' | 'system') || 'system'
  );
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [questionRatings, setQuestionRatings] = useState<Record<string, number>>(() => {
    try { const saved = localStorage.getItem('cat-maester-question-ratings'); return saved ? JSON.parse(saved) : {}; } 
    catch { return {}; }
  });
  const [, setKatexLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isExamMode, setIsExamMode] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const handleAiQuestionRating = (questionId: string, rating: number) => {
    setAiQuestionFeedback(prev => {
      const newFeedback = { ...prev, [questionId]: rating };
      // Also save to local storage for persistence without cloud sync
      localStorage.setItem('cat-maester-ai-feedback', JSON.stringify(newFeedback));
      return newFeedback;
    });
  };

  const handleCalcClick = (val: string) => {
    if (val === 'C') setCalcExpr('');
    else if (val === '=') {
      try {
        const result = new Function('return ' + calcExpr)();
        setCalcExpr(String(Math.round(result * 10000) / 10000));
      } catch {
        setCalcExpr('Error');
      }
    } else if (val === 'sqrt') {
      try {
        const result = Math.sqrt(new Function('return ' + calcExpr)());
        setCalcExpr(String(Math.round(result * 10000) / 10000));
      } catch {
        setCalcExpr('Error');
      }
    } else {
      if (calcExpr === 'Error') setCalcExpr(val);
      else setCalcExpr(prev => prev + val);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode:", err.message));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      let clientX = 0;
      if ('touches' in e) clientX = e.touches[0].clientX;
      else clientX = e.clientX;
      
      const newWidth = (clientX / window.innerWidth) * 100;
      setPassageWidth(Math.max(20, Math.min(newWidth, 80)));
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.classList.remove('select-none');
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const handleDragStart = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    isDragging.current = true;
    document.body.classList.add('select-none');
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    if ((window as any).katex) { setKatexLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
    script.onload = () => setKatexLoaded(true);
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (activeTab === 'practice' && !isGenerating) {
      getGeneratedBatches(practiceSubject).then(setAiBatchesList).catch(console.error);
    }
  }, [activeTab, practiceSubject, isGenerating]);


  const audioCtxRef = useRef<any>(null);
  const playTickSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.05;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    // Try to resume an unfinished test from localStorage
    try {
      const savedStateJSON = localStorage.getItem('cat-maester-active-test');
      if (savedStateJSON) {
        if (window.confirm('An unfinished mock test was found. Would you like to resume?')) {
          const savedState = JSON.parse(savedStateJSON);
          setCurrentTest(savedState.currentTest);
          setSelectedAnswers(savedState.selectedAnswers || {});
          setMarkedForReview(savedState.markedForReview || {});
          setTimeLeft(savedState.timeLeft || 7200);
          setActiveSection(savedState.activeSection || '');
          setActiveQuestionIdx(savedState.activeQuestionIdx || 0);
          setSectionTimes(savedState.sectionTimes || {});
          setIsExamMode(savedState.isExamMode || false);
          setIsPaused(true);
          setMockPhase('test');
        } else {
          localStorage.removeItem('cat-maester-active-test');
        }
      }
    } catch (e) {
      console.error("Failed to load saved test state", e);
      localStorage.removeItem('cat-maester-active-test');
    }

    const loadSavedTests = async () => {
      try {
        const tests = await getMockTests();
        setSavedTests(tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error("Failed to load tests", e);
      }
    };
    loadSavedTests();
  }, [mockPhase]); // Refresh list when phase changes

  const updateQuestionRating = (questionId: string, userRating: number, isCorrect: boolean) => {
    const questionRating = questionRatings[questionId] || 1200;
    const K = 32;
    const expectedScoreForUser = 1 / (1 + Math.pow(10, (questionRating - userRating) / 400));
    const actualScoreForUser = isCorrect ? 1 : 0;
    
    const ratingChange = K * (actualScoreForUser - expectedScoreForUser);
    const newQuestionRating = Math.round(questionRating - ratingChange);
    
    setQuestionRatings(prev => {
      const newRatings = { ...prev, [questionId]: newQuestionRating };
      localStorage.setItem('cat-maester-question-ratings', JSON.stringify(newRatings));
      return newRatings;
    });
  };

  useEffect(() => {
    let timer: any;
    if (mockPhase === 'test' && timeLeft > 0 && !isPaused) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const nextTime = prev - 1;
          if (nextTime > 0 && nextTime <= 300 && isSoundEnabled) playTickSound();
          return nextTime;
        });
        setSectionTimes(prev => ({
          ...prev,
          [activeSection]: (prev[activeSection] || 0) + 1
        }));
      }, 1000);
    } else if (timeLeft <= 0 && mockPhase === 'test' && !isPaused) {
      if (isExamMode && currentTest) {
        const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
        const currIdx = sections.indexOf(activeSection);
        if (currIdx < sections.length - 1) {
          setActiveSection(sections[currIdx + 1]);
          setActiveQuestionIdx(0);
          setTimeLeft(2400);
        } else {
          handleSubmitMock();
        }
      } else {
        handleSubmitMock();
      }
    }
    return () => clearInterval(timer);
  }, [mockPhase, timeLeft, activeSection, isPaused, isSoundEnabled, isExamMode, currentTest]);

  useEffect(() => {
    if (mockPhase === 'test' && currentTest) {
      if (timeLeft % 5 !== 0) return; // Optimize by saving only every 5 seconds
      const activeTestData = {
        currentTest,
        selectedAnswers,
        markedForReview,
        timeLeft,
        activeSection,
        activeQuestionIdx,
        sectionTimes,
        isExamMode
      };
      localStorage.setItem('cat-maester-active-test', JSON.stringify(activeTestData));
    } else if (mockPhase !== 'test') {
      localStorage.removeItem('cat-maester-active-test');
    }
  }, [mockPhase, currentTest, selectedAnswers, markedForReview, timeLeft, activeSection, activeQuestionIdx, sectionTimes]);

  useEffect(() => {
    const fetchPracticeQuestions = async () => {
      const groupAndShuffle = (questions: Question[]) => {
        const groups = new Map<string, Question[]>();
        const isolated: Question[] = [];
        questions.forEach(q => {
          if (q.context) {
            if (!groups.has(q.context)) groups.set(q.context, []);
            groups.get(q.context)!.push(q);
          } else {
            isolated.push(q);
          }
        });
        const groupedArray = [...Array.from(groups.values()), ...isolated.map(q => [q])];
        groupedArray.sort(() => 0.5 - Math.random());
        return groupedArray.flat();
      };

      if (practiceFilterTopic) {
        const allQs = await getAllQuestions();
        const topicQIds = progress.topicStats?.[practiceFilterTopic]?.questionIds || [];
        setPracticeQuestions(groupAndShuffle(allQs.filter(q => topicQIds.includes(q.id))));
      } else if (practiceFilterBookmark) {
        const allQs = await getAllQuestions();
        const bookmarkedIds = progress.bookmarkedQuestions || [];
        setPracticeQuestions(groupAndShuffle(allQs.filter(q => bookmarkedIds.includes(q.id))));
      } else if (practiceFilterDifficulty) {
        const allQs = await getAllQuestions();
        const subjectQs = allQs.filter(q => q.section === practiceSubject);
        const filteredQs = subjectQs.filter(q => {
          const rating = questionRatings[q.id] || 1200;
          if (practiceFilterDifficulty === 'Easy') return rating < 1000;
          if (practiceFilterDifficulty === 'Medium') return rating >= 1000 && rating <= 1400;
          if (practiceFilterDifficulty === 'Hard') return rating > 1400;
          return true;
        });
        
        const groups = new Map<string, Question[]>();
        const isolated: Question[] = [];
        filteredQs.forEach(q => {
          if (q.context) {
            if (!groups.has(q.context)) groups.set(q.context, []);
            groups.get(q.context)!.push(q);
          } else {
            isolated.push(q);
          }
        });
        
        const groupedArray = [...Array.from(groups.values()), ...isolated.map(q => [q])];
        groupedArray.sort(() => 0.5 - Math.random());
        
        const selectedQs: Question[] = [];
        for (const g of groupedArray) {
          if (selectedQs.length >= 20) break;
          selectedQs.push(...g);
        }
        setPracticeQuestions(selectedQs);
      } else if (isAdaptive) {
        const allQs = await getAllQuestions();
        const subjectQs = allQs.filter(q => q.section === practiceSubject);
        const userRating = progress.skillRatings?.[practiceSubject] || 1200;
        
        const groups = new Map<string, Question[]>();
        const isolated: Question[] = [];
        subjectQs.forEach(q => {
          if (q.context) {
            if (!groups.has(q.context)) groups.set(q.context, []);
            groups.get(q.context)!.push(q);
          } else {
            isolated.push(q);
          }
        });

        const ratedGroups = [
          ...Array.from(groups.values()).map(g => {
            const avgRating = g.reduce((sum, q) => sum + (questionRatings[q.id] || 1200), 0) / g.length;
            return { qs: g, rating: avgRating };
          }),
          ...isolated.map(q => ({ qs: [q], rating: questionRatings[q.id] || 1200 }))
        ];

        ratedGroups.sort((a, b) => Math.abs(a.rating - userRating) - Math.abs(b.rating - userRating));

        const selectedGroups = ratedGroups.slice(0, 20).sort(() => 0.5 - Math.random());
        const selectedQs: Question[] = [];
        for (const g of selectedGroups) {
          if (selectedQs.length >= 20) break;
          selectedQs.push(...g.qs);
        }
        setPracticeQuestions(selectedQs);
      } else if (practiceFilterAIBatch !== null) {
        const existingBatches = await getGeneratedBatches(practiceSubject);
        const batch = existingBatches.find(b => b.batchId === practiceFilterAIBatch);
        if (batch) setPracticeQuestions(batch.questions);
        else setPracticeQuestions([]);
      } else if (isAiTopicMode && !aiTopicFocus.trim()) {
        setPracticeQuestions([]);
      } else {
        // New AI Generation Flow
        const loadAndGenerate = async () => {
          const topicPrompt = (isAiTopicMode && aiTopicFocus.trim()) ? aiTopicFocus.trim() : undefined;
          
          const doPrefetch = async () => {
            const signature = `${practiceSubject}_${topicPrompt || 'none'}_prefetch`;
            if (isPrefetching.current === signature) return;
            isPrefetching.current = signature;
            try {
              const prefetchedQs = await generateQuestionsAPI(practiceSubject, topicPrompt);
              if (prefetchedQs && prefetchedQs.length > 0) {
                setPrefetchedBatch({ subject: practiceSubject, topic: topicPrompt, questions: prefetchedQs });
              }
            } catch (e) {
              console.error("[AI] Prefetch failed", e);
            } finally {
              if (isPrefetching.current === signature) isPrefetching.current = '';
            }
          };
  
          if (prefetchedBatch && prefetchedBatch.subject === practiceSubject && prefetchedBatch.topic === topicPrompt) {
            setPracticeQuestions(prefetchedBatch.questions);
            const existingBatches = await getGeneratedBatches(practiceSubject);
            await saveGeneratedBatch(practiceSubject, existingBatches.length, prefetchedBatch.questions);
            setPrefetchedBatch(null);
            doPrefetch();
            return;
          }
  
          setIsGenerating(true);
          setGenerationError(null);
          setPracticeQuestions([]);
  
          try {
            const existingBatches = await getGeneratedBatches(practiceSubject);
            
            let newQuestions: Question[] = [];
            if (existingBatches.length > 0 && practiceRefreshTrigger === 0) {
              newQuestions = existingBatches[existingBatches.length - 1].questions;
            } else {
              newQuestions = await generateQuestionsAPI(practiceSubject, topicPrompt);
            }
            
            if (newQuestions && newQuestions.length > 0) {
              await saveGeneratedBatch(practiceSubject, existingBatches.length, newQuestions);
              setPracticeQuestions(newQuestions);
              doPrefetch();
            } else {
              throw new Error("AI failed to generate questions.");
            }
          } catch (err: any) {
            setGenerationError(err.message || "An unknown error occurred during question generation.");
          } finally {
            setIsGenerating(false);
          }
        };
        loadAndGenerate();
      }
      setPracticeAnswers({});
      setLastAnswerStatus(null);
      setActiveHint(null);
    };
    if (activeTab === 'practice') {
      fetchPracticeQuestions();
    }
  }, [activeTab, practiceSubject, practiceFilterTopic, practiceFilterBookmark, practiceFilterDifficulty, practiceFilterAIBatch, isAdaptive, isAiTopicMode, practiceRefreshTrigger]);

  useEffect(() => {
    const fetchQotd = async () => {
      const allQs = await getAllQuestions();
      if (allQs.length > 0) {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const randomIdx = seed % allQs.length;
        setQotd(allQs[randomIdx]);
      }
    };
    fetchQotd();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      if (theme === 'dark' || (theme === 'system' && mediaQuery.matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();
    localStorage.setItem('cat-maester-theme', theme);

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Memoize questions mapping and filtering to optimize re-renders during test/review
  const allQuestionsMapped = useMemo(() => {
    return currentTest?.questions?.map((q: any, i: number) => ({ ...q, originalIndex: i })) || [];
  }, [currentTest]);

  const activeSectionQuestions = useMemo(() => {
    return allQuestionsMapped.filter((q: any) => q.section === activeSection);
  }, [allQuestionsMapped, activeSection]);

  const filteredReviewQuestions = useMemo(() => {
    if (mockPhase !== 'review') return [];
    return activeSectionQuestions.filter((q: any) => {
      if (reviewFilter === 'all') return true;
      const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
      if (reviewFilter === 'unanswered') return !isAnswered;
      if (!isAnswered) return false;
      let isCorrect = false;
      if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
      else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'incorrect') return !isCorrect;
      return true;
    });
  }, [mockPhase, activeSectionQuestions, reviewFilter, selectedAnswers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      // Global shortcut to clear all progress and saved tests
      if (e.ctrlKey && e.shiftKey && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        setShowClearHistoryConfirmationModal(true);
      }

      // Shortcut to instantly reset current mock test (Alt + R)
      if (activeTab === 'mock' && mockPhase === 'test') {
        if (e.altKey && e.key.toLowerCase() === 'r') {
          e.preventDefault();
          if (window.confirm("Are you sure you want to instantly clear all progress and saved answers for this test?")) {
            setSelectedAnswers({});
            setMarkedForReview({});
            setSectionTimes({});
            const sections = Array.from(new Set(currentTest?.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
            setActiveSection(sections[0] || '');
            setActiveQuestionIdx(0);
            setTimeLeft(isExamMode ? 2400 : 7200);
          }
        }

        const q = activeSectionQuestions[activeQuestionIdx];
        if (q && q.type === 'MCQ' && ['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const optIdx = parseInt(e.key) - 1;
          if (q.options && optIdx < q.options.length) {
            setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: optIdx }));
          }
        }
      }

      if (activeTab === 'mock' && (mockPhase === 'test' || mockPhase === 'review')) {
         if (e.key === 'ArrowRight') {
             e.preventDefault();
             const maxIdx = mockPhase === 'test' ? activeSectionQuestions.length - 1 : filteredReviewQuestions.length - 1;
             if (activeQuestionIdx < maxIdx) setActiveQuestionIdx(prev => prev + 1);
         } else if (e.key === 'ArrowLeft') {
             e.preventDefault();
             if (activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
         }
      }

      if (activeTab === 'practice') {
        if (e.key === '1') {
          setPracticeSubject('QA'); setPracticeFilterTopic(null); setPracticeFilterBookmark(false); setPracticeFilterDifficulty(null); setIsAiTopicMode(false); setPracticeFilterAIBatch(null);
        } else if (e.key === '2') {
          setPracticeSubject('VARC'); setPracticeFilterTopic(null); setPracticeFilterBookmark(false); setPracticeFilterDifficulty(null); setIsAiTopicMode(false); setPracticeFilterAIBatch(null);
        } else if (e.key === '3') {
          setPracticeSubject('DILR'); setPracticeFilterTopic(null); setPracticeFilterBookmark(false); setPracticeFilterDifficulty(null); setIsAiTopicMode(false); setPracticeFilterAIBatch(null);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const subjects = ['QA', 'VARC', 'DILR'];
          const curr = subjects.indexOf(practiceSubject);
          const next = e.key === 'ArrowRight' ? (curr + 1) % subjects.length : (curr - 1 + subjects.length) % subjects.length;
          setPracticeSubject(subjects[next] as 'QA' | 'VARC' | 'DILR');
          setPracticeFilterTopic(null); setPracticeFilterBookmark(false); setPracticeFilterDifficulty(null); setIsAiTopicMode(false); setPracticeFilterAIBatch(null);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          let closestIdx = 0;
          let minDistance = Infinity;
          for(let i = 0; i < practiceQuestions.length; i++) {
             const el = document.getElementById(`practice-q-${i}`);
             if(el) {
                const rect = el.getBoundingClientRect();
                // Calculate distance to vertical center to see which question is currently focused on the screen
                const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
                if(distance < minDistance) {
                   minDistance = distance;
                   closestIdx = i;
                }
             }
          }
          const targetIdx = e.key === 'ArrowDown' 
              ? Math.min(closestIdx + 1, practiceQuestions.length - 1) 
              : Math.max(closestIdx - 1, 0);
          
          document.getElementById(`practice-q-${targetIdx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, mockPhase, currentTest, isExamMode, activeQuestionIdx, activeSectionQuestions, filteredReviewQuestions.length, practiceSubject, practiceQuestions.length]);

  useEffect(() => {
    if (activeTab === 'formula') {
      const loadFormulas = async () => {
        try {
          let f = await getFormulas();
          if (!f.some(form => form.isOfficial)) { // Seed official flashcards from formulas.json
            const formulasRaw = (await import('../data/formulas.json')).default || await import('../data/formulas.json');
            const defaultF: any[] = [];
            let idCounter = 1;
            if (formulasRaw && formulasRaw.topics) {
              formulasRaw.topics.forEach((topic: any) => {
                topic.flashcards?.forEach((card: any) => {
                  defaultF.push({
                    id: `official_${idCounter++}`,
                    front: card.question,
                    back: card.answer,
                    topic: topic.topic_name,
                    isOfficial: true,
                    reps: 0,
                    interval: 1,
                    ease: 2.5
                  });
                });
              });
              for (let df of defaultF) await saveFormula(df);
              f = await getFormulas();
            }
          }
          setFormulas(f);
        } catch (e) { console.error("Failed to load formulas", e); }
      };
      loadFormulas();
    }
  }, [activeTab]);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthOpen(false);
    } catch (error: any) {
      console.error("Authentication failed", error);
      alert(`Failed to sign in: ${error?.message || 'Unknown error'}\n\nTip: Make sure Google Sign-In is enabled in your Firebase console, and your current domain (e.g., localhost or jazdot.github.io) is added to the "Authorized Domains" list under Authentication Settings.`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    logout();
  };

  // Listen for Firebase Auth changes and Cloud Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsCloudSyncing(true);
        login(firebaseUser.displayName || 'Aspirant', firebaseUser.uid, firebaseUser.photoURL || undefined);
        
        // Fetch from Cloud
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.progress) setWholeProgress(data.progress);
            if (data.questionRatings) {
              setQuestionRatings(data.questionRatings);
              localStorage.setItem('cat-maester-question-ratings', JSON.stringify(data.questionRatings));
            }
            if (data.aiQuestionFeedback) {
              setAiQuestionFeedback(data.aiQuestionFeedback);
              localStorage.setItem('cat-maester-ai-feedback', JSON.stringify(data.aiQuestionFeedback));
            }
            if (data.formulas) {
              for (const f of data.formulas) {
                await saveFormula(f);
              }
              const updatedF = await getFormulas();
              setFormulas(updatedF);
            }
          }
        } catch (e) {
          console.error("Failed to load cloud data", e);
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        setIsCloudSyncing(false);
      }
    });
    return () => unsubscribe();
  }, [login, setWholeProgress]);

  // Auto-sync to cloud when data changes (debounced)
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    
    const syncToCloud = async () => {
      try {
        await setDoc(doc(db, 'users', uid), {
          displayName: user.name,
          photoURL: user.photoURL || null,
          progress,
          questionRatings,
          formulas,
          aiQuestionFeedback,
          lastSynced: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to sync to cloud", e);
      }
    };

    const timeoutId = setTimeout(syncToCloud, 5000);
    return () => clearTimeout(timeoutId);
  }, [progress, questionRatings, formulas, aiQuestionFeedback, user?.uid, user?.name, user?.photoURL]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const fetchLeaderboard = async () => {
        try {
          const q = query(collection(db, 'users'), limit(50));
          const querySnapshot = await getDocs(q);
          const leaders: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.progress?.skillRatings && data.displayName) {
              const qa = data.progress.skillRatings.QA || 1200;
              const varc = data.progress.skillRatings.VARC || 1200;
              const dilr = data.progress.skillRatings.DILR || 1200;
              const overall = Math.round((qa + varc + dilr) / 3);
              leaders.push({ uid: doc.id, name: data.displayName, photoURL: data.photoURL, qa, varc, dilr, overall });
            }
          });
          leaders.sort((a, b) => b.overall - a.overall);
          setLeaderboard(leaders.slice(0, 10)); // Display Top 10
        } catch (e) {
          console.error("Failed to fetch leaderboard", e);
        }
      };
      fetchLeaderboard();
    }
  }, [activeTab]);

  const handleTagTopic = (q: any, topic: string) => {
    if (!topic.trim()) return;
    const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
    let isCorrect = false;
    if (isAnswered) {
      if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
      else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
    }

    addTopicResult(topic.trim(), isCorrect, q.id);
    setTaggedQuestions(prev => ({ ...prev, [q.id]: topic.trim() }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartPastPaper = async (paperId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const loader = paperLoaders[paperId];
    if (!loader) return;
    
    const paper = await loader();

    
    const testObj = {
      id: paper.id + '_' + Date.now().toString(),
      date: new Date().toISOString(),
      title: paper.title || paper.id || 'Mock Test',
      questions: paper.questions || []
    };
    
    await saveMockTest(testObj);
    setCurrentTest(testObj);
    setMockPhase('confirm');
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const challengeId = params.get('challenge');
    if (challengeId && paperLoaders[challengeId]) {
      setActiveTab('mock');
      handleStartPastPaper(challengeId);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]); 

  useEffect(() => {
    if (activeTab === 'mock') {
      const papers = Object.keys(paperLoaders).map(id => ({
        id,
        title: id.replace(/_/g, ' ')
      }));
      setPaperList(papers);
    }
  }, [activeTab]);

  const startConfirmedTest = () => {
    if (progress.testsCompleted >= 1 && !progress.isActivated) {
      setShowActivationModal(true);
      return;
    }

    setTimeLeft(isExamMode ? 2400 : 7200);
    const sections = Array.from(new Set(currentTest?.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
    setActiveSection(sections[0] || '');
    setActiveQuestionIdx(0);
    setLastTestResult(null);
    setSelectedAnswers({});
    setMarkedForReview({});
    setSectionTimes({});
    setReviewFilter('all');
    setTaggedQuestions({});
    setIsPaused(false);
    setMockPhase('test');
  };

  const handleSubmitMock = async () => {
    let score = 0;
    let answeredCount = 0;
    let correctCount = 0;
    const sectionStats: Record<string, { correct: number, attempted: number, total: number, score: number }> = {};
    const testTopicStats: Record<string, { correct: number, attempted: number, total: number, score: number }> = {};

    const inferTopic = (q: any) => {
      if (taggedQuestions[q.id]) return taggedQuestions[q.id];
      for (const [topic, stat] of Object.entries(progress.topicStats || {})) {
        if (stat.questionIds?.includes(q.id)) return topic;
      }
      const text = (q.text + ' ' + (q.explanation || '') + ' ' + (q.context || '')).toLowerCase();
      if (q.section === 'VARC') {
        if (q.context) return 'Reading Comprehension';
        if (text.includes('jumbled') || text.includes('sequence') || text.includes('properly sequenced')) return 'Parajumbles';
        if (text.includes('summar') || text.includes('essence')) return 'Paragraph Summary';
        if (text.includes('odd one out') || text.includes('odd sentence')) return 'Odd One Out';
        return 'Verbal Ability';
      }
      if (q.section === 'DILR' || q.section === 'LRDI') {
        if (text.includes('arrangement') || text.includes('seated') || text.includes('row')) return 'Arrangements';
        if (text.includes('graph') || text.includes('table') || text.includes('chart') || text.includes('average')) return 'Data Interpretation';
        if (text.includes('tournament') || text.includes('match') || text.includes('player')) return 'Games & Tournaments';
        if (text.includes('venn') || text.includes('diagram')) return 'Venn Diagrams';
        return 'Logical Reasoning';
      }
      if (q.section === 'QA' || q.section === 'Quant') {
        if (text.includes('triangle') || text.includes('circle') || text.includes('radius') || text.includes('area') || text.includes('geometry')) return 'Geometry';
        if (text.includes('equation') || text.includes('roots') || text.includes('x^2') || text.includes('polynomial')) return 'Algebra';
        if (text.includes('profit') || text.includes('discount') || text.includes('interest') || text.includes('sell')) return 'Commercial Math';
        if (text.includes('speed') || text.includes('time') || text.includes('distance') || text.includes('km') || text.includes('train')) return 'Time, Speed & Distance';
        if (text.includes('log') || text.includes('logarithm')) return 'Logarithms';
        if (text.includes('probability') || text.includes('ways') || text.includes('arrange') || text.includes('chosen')) return 'Combinatorics';
        if (text.includes('ratio') || text.includes('proportion')) return 'Ratio & Proportion';
        return 'Arithmetic';
      }
      return 'General';
    };

    if (currentTest) {
      currentTest.questions?.forEach((q: any, idx: number) => {
        const sec = q.section;
        if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, attempted: 0, total: 0, score: 0 };
        sectionStats[sec].total++;

        const topic = inferTopic(q);
        if (!testTopicStats[topic]) testTopicStats[topic] = { correct: 0, attempted: 0, total: 0, score: 0 };
        testTopicStats[topic].total++;

        const answer = selectedAnswers[idx];
        if (answer !== undefined && String(answer).trim() !== '') {
          answeredCount++;
          sectionStats[sec].attempted++;
          testTopicStats[topic].attempted++;

          let isCorrect = false;
          let qScore = 0;
          if (q.type === 'MCQ') {
            if (answer === q.correct) { qScore = 3; isCorrect = true; }
            else { qScore = -1; }
          } else {
            if (String(answer).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()) { qScore = 3; isCorrect = true; }
          }
          
          score += qScore;
          sectionStats[sec].score += qScore;
          testTopicStats[topic].score += qScore;

          if (isCorrect) {
            correctCount++;
            sectionStats[sec].correct++;
            testTopicStats[topic].correct++;
          } else {
            const front = `[Auto-Generated]\n\nQ: ${q.text}`;
            const correctAnsStr = q.type === 'MCQ' ? q.options?.[q.correct as number] : q.tita_answer;
            const back = `Correct Answer: ${correctAnsStr}\n\nExplanation:\n${q.explanation}`;
            saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
          }
        }
      });

      const totalQuestions = currentTest.questions?.length || 0;
      const incorrectCount = answeredCount - correctCount;
      const unansweredCount = totalQuestions - answeredCount;
      const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
      const timeTaken = Object.values(sectionTimes).reduce((sum, t) => sum + t, 0);

      setLastTestResult({
        score,
        total: totalQuestions,
        answered: answeredCount,
        correct: correctCount,
        incorrect: incorrectCount,
        unanswered: unansweredCount,
        accuracy,
        sectionTimes,
        sectionStats,
        testTopicStats
      });

      setMockPhase('result');
      addResult(answeredCount, correctCount);

      // Wire up API call for global percentiles
      try {
        const response = await fetch('/api/submit-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: currentTest.id,
            user_id: user?.name || 'Anonymous',
            score: score,
            total_time: timeTaken
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setLastTestResult((prev: any) => prev ? {
             ...prev, 
             percentile: data.percentile, 
             averagePeerTime: data.average_peer_time 
          } : prev);
        }
      } catch (err) {
        console.error("Failed to sync mock test results", err);
      }
    }
  };

  // Zero-dependency SVG Donut Chart Calculation
  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.correct / progress.totalAttempted) * 100) : 0;

  // IRT Logistic Percentile Approximation
  const predictPercentile = (rating: number) => {
    const z = (rating - 1200) / 200;
    const p = 1 / (1 + Math.exp(-1.702 * z));
    return Math.max(1, Math.min(99.99, Number((p * 100).toFixed(2))));
  };
  const qaPercentile = predictPercentile(progress.skillRatings?.QA || 1200);
  const varcPercentile = predictPercentile(progress.skillRatings?.VARC || 1200);
  const dilrPercentile = predictPercentile(progress.skillRatings?.DILR || 1200);

  const formulaTopics = ['All', 'Custom (Mine)', ...Array.from(new Set(formulas.filter(f => f.isOfficial).map(f => f.topic)))];

  const filteredFormulas = formulas.filter(f => {
    const matchesSearch = f.front.toLowerCase().includes(formulaSearch.toLowerCase()) || f.back.toLowerCase().includes(formulaSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (formulaTopicFilter === 'All') return true;
    if (formulaTopicFilter === 'Custom (Mine)') return !f.isOfficial;
    return f.topic === formulaTopicFilter;
  });

  const hideNavigation = isFullscreen && activeTab === 'mock' && (mockPhase === 'test' || mockPhase === 'review');
  const testReviewClasses = hideNavigation 
    ? 'rounded-none border-none h-[100dvh] bg-[#f8fafc] dark:bg-[#020617]' 
    : 'fixed inset-0 z-[5000] md:relative md:inset-auto md:z-auto md:rounded-2xl h-[100dvh] md:h-[calc(100vh-12rem)] md:min-h-[600px] bg-[#f8fafc] dark:bg-[#020617] md:bg-white/60 md:dark:bg-white/5';

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className={`fixed inset-0 z-[1000] flex text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-500 ${activeTab === 'practice' && lastAnswerStatus === 'correct' ? 'bg-emerald-50 dark:bg-emerald-950/30' : activeTab === 'practice' && lastAnswerStatus === 'incorrect' ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-[#f8fafc] dark:bg-[#020617]'}`}
    >
      {/* Sidebar */}
        {!hideNavigation && !isSidebarCollapsed && (
          <nav className="w-20 md:w-64 bg-white/60 dark:bg-white/5 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/10 flex flex-col justify-between shrink-0 print:hidden">
        <div>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => navigate('/tools')} className="flex items-center gap-2 text-slate-500 hover:text-[hsl(var(--accent))] transition-colors text-[10px] md:text-xs font-bold tracking-widest uppercase">
                <ArrowLeft size={16} /> <span className="hidden md:inline">Back to Tools</span>
              </button>
              <button onClick={() => setIsSidebarCollapsed(true)} className="hidden md:block text-slate-500 hover:text-[hsl(var(--accent))] transition-colors" title="Collapse Sidebar">
                <Menu size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent))] text-white p-2 rounded-xl shadow-lg shadow-[hsl(var(--accent))]/30">
                <Book size={24} />
              </div>
              <div className="font-bold tracking-widest text-lg hidden md:block cursor-default">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">CAT Maester</span>
                <span style={{ color: 'hsl(var(--accent))' }}>.</span> 
              </div>
            </div>
          </div>
          
          <div className="px-3 mt-4 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'practice', icon: PenTool, label: 'Practice Subjects' },
              { id: 'mock', icon: Bot, label: 'Mock Tests' },
              { id: 'formula', icon: Book, label: 'Formula Hub' }
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5'}`}>
                <item.icon size={20} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-4">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full shadow-sm" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white font-bold">{user.name.charAt(0)}</div>
                )}
                <div className="flex-1 truncate hidden md:block">
                  <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Synced
                  </p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
                <LogOut size={20} />
                <span className="hidden md:inline font-medium">Log Out</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-[hsl(var(--accent))]/10 hover:text-[hsl(var(--accent))] transition-colors">
              <LogIn size={20} />
              <span className="hidden md:inline font-medium">Sign In to Sync</span>
            </button>
          )}
        </div>
        <div className="p-2 md:p-4 border-t border-slate-200/50 dark:border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-around gap-1 md:gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setTheme('light')} title="Light Mode" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Sun size={16} /></button>
            <button onClick={() => setTheme('system')} title="System Preference" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Monitor size={16} /></button>
            <button onClick={() => setTheme('dark')} title="Dark Mode" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Moon size={16} /></button>
          </div>
        </div>
          </nav>
        )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
          {!hideNavigation && (
            <header className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 p-4 sticky top-0 z-10 flex justify-between items-center px-6 print:hidden">
          <div className="flex items-center gap-4">
            {isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(false)} className="text-slate-500 hover:text-[hsl(var(--accent))] transition-colors" title="Expand Sidebar">
                <Menu size={24} />
              </button>
            )}
            <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md py-2 px-4 rounded-full border border-slate-200/50 dark:border-white/10">
            <div className="text-sm font-medium"><span className="text-slate-500">Accuracy: </span><span className="text-[hsl(var(--accent))] font-bold">{accuracy}%</span></div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <div className="text-sm font-medium"><span className="text-slate-500">Tests: </span><span className="text-[hsl(var(--accent))] font-bold">{progress.testsCompleted}</span></div>
          </div>
            </header>
          )}

          <div className={`${hideNavigation ? 'p-0 md:p-0' : 'p-4 md:p-8 lg:px-12'} mx-auto w-full flex-1 flex flex-col ${hideNavigation ? 'max-w-full' : 'max-w-[1920px]'}`}>
          <style>{`
            @media (min-width: 1024px) {
              .passage-container { width: ${passageWidth}% !important; flex: none !important; }
              .question-container { width: calc(${100 - passageWidth}% - 1rem) !important; flex: none !important; }
            }
          `}</style>
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 flex flex-col items-center shadow-sm">
                  <h3 className="text-lg font-bold mb-4 w-full text-left">Performance Overview</h3>
                  {/* Zero Dependency SVG Donut Chart */}
                  <svg viewBox="0 0 36 36" className="w-40 h-40 circular-chart text-emerald-500 drop-shadow-md">
                    <path className="text-rose-500 stroke-current stroke-[3]" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="stroke-current stroke-[3] transition-all duration-1000 ease-out" fill="none" strokeDasharray={`${accuracy}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="mt-6 flex gap-6 text-sm font-bold">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Correct</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> Incorrect</span>
                  </div>
                </div>
                
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Quick Stats</h3>
                    <button onClick={() => setShowClearHistoryConfirmationModal(true)} className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors border border-rose-500/20" title="Shortcut: Ctrl+Shift+Backspace">Clear History</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 h-[calc(100%-2rem)]">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center shadow-inner"><div className="text-slate-500 mb-2 text-sm font-medium uppercase tracking-wider">Attempted</div><div className="text-4xl font-black">{progress.totalAttempted}</div></div>
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center shadow-inner"><div className="text-slate-500 mb-2 text-sm font-medium uppercase tracking-wider">Correct</div><div className="text-4xl font-black text-emerald-500">{progress.correct}</div></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="lg:col-span-2 xl:col-span-3 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Predicted Percentile (IRT Model)</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold opacity-80">Quantitative Ability (QA)</span><span className="text-[hsl(var(--accent))] font-bold">{qaPercentile} PR</span></div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: `${qaPercentile}%` }} transition={{ duration: 1, delay: 0.2 }} className="bg-[hsl(var(--accent))] h-full rounded-full shadow-[0_0_10px_hsl(var(--accent))]"></m.div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold opacity-80">Verbal Ability (VARC)</span><span className="text-purple-500 font-bold">{varcPercentile} PR</span></div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: `${varcPercentile}%` }} transition={{ duration: 1, delay: 0.3 }} className="bg-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></m.div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold opacity-80">Data Interpretation (DILR)</span><span className="text-emerald-500 font-bold">{dilrPercentile} PR</span></div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: `${dilrPercentile}%` }} transition={{ duration: 1, delay: 0.4 }} className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></m.div></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div><div className="flex-1"><p className="text-sm font-bold">Mock Test 4</p><p className="text-slate-500 text-xs mt-0.5">Score: 42/45</p></div><span className="text-xs font-mono text-slate-400">2h ago</span></div>
                    <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))] shadow-[0_0_8px_hsl(var(--accent))]"></div><div className="flex-1"><p className="text-sm font-bold">QA Practice</p><p className="text-slate-500 text-xs mt-0.5">15 questions</p></div><span className="text-xs font-mono text-slate-400">1d ago</span></div>
                    <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div><div className="flex-1"><p className="text-sm font-bold">DILR Mock</p><p className="text-slate-500 text-xs mt-0.5">Score: 28/30</p></div><span className="text-xs font-mono text-slate-400">2d ago</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Elo Rating Over Time</h3>
                  {progress.skillHistory && progress.skillHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={progress.skillHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(d) => new Date(d).toLocaleDateString()} 
                          fontSize={10} 
                          tick={{ fill: 'currentColor', opacity: 0.6 }} 
                          axisLine={{ stroke: 'currentColor', opacity: 0.2 }} 
                          tickLine={{ stroke: 'currentColor', opacity: 0.2 }}
                        />
                        <YAxis domain={['dataMin - 50', 'dataMax + 50']} fontSize={10} tick={{ fill: 'currentColor', opacity: 0.6 }} axisLine={{ stroke: 'currentColor', opacity: 0.2 }} tickLine={{ stroke: 'currentColor', opacity: 0.2 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '0.5rem' }}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                          labelFormatter={(label) => new Date(label).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          formatter={(value: any) => [typeof value === 'number' ? Math.round(value) : value, 'Elo']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="skillRatings.QA" name="QA" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="skillRatings.VARC" name="VARC" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" animationBegin={200} />
                        <Line type="monotone" dataKey="skillRatings.DILR" name="DILR" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={1500} animationEasing="ease-out" animationBegin={400} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-slate-500 text-sm">
                      <p>Answer more questions in Practice Mode to see your Elo rating history.</p>
                    </div>
                  )}
                </div>

                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Trophy size={20} className="text-yellow-500" /> Global Leaderboard</h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ maxHeight: '250px', scrollbarWidth: 'thin' }}>
                    {leaderboard.length > 0 ? leaderboard.map((leader, i) => (
                      <div key={leader.uid} className={`flex items-center justify-between p-3 rounded-xl border ${leader.uid === user?.uid ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))]/30' : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/50 dark:border-white/5'}`}>
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-slate-400 w-4 text-center">{i + 1}</div>
                          {leader.photoURL ? (
                            <img src={leader.photoURL} alt={leader.name} className="w-8 h-8 rounded-full shadow-sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">{leader.name.charAt(0)}</div>
                          )}
                          <div>
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{leader.name} {leader.uid === user?.uid && <span className="text-[10px] bg-[hsl(var(--accent))] text-white px-1.5 py-0.5 rounded ml-1">You</span>}</div>
                            <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                              <span>QA: {leader.qa}</span>
                              <span>VARC: {leader.varc}</span>
                              <span>DILR: {leader.dilr}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xl font-black text-[hsl(var(--accent))]">{leader.overall}</div>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                        <Loader2 size={24} className="animate-spin text-[hsl(var(--accent))]" /> 
                        <span>Fetching Leaderboard...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {qotd && (
                <div className="mt-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-[hsl(var(--accent))]/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--accent))]/10 rounded-bl-full pointer-events-none"></div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BrainCircuit className="text-[hsl(var(--accent))]" size={20} /> Question of the Day</h3>
                  <div className="mb-4 flex gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{qotd.section}</span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{qotd.type}</span>
                  </div>
                  <div className="font-medium text-lg mb-6 max-w-4xl leading-relaxed text-slate-800 dark:text-slate-200">{renderContextWithImages(qotd.text)}</div>
                  <button onClick={() => {
                    setPracticeSubject((qotd.section as 'QA' | 'VARC' | 'DILR') || 'QA');
                    setPracticeFilterTopic(null);
                    setPracticeFilterBookmark(false);
                    setPracticeFilterDifficulty(null);
                    setIsAiTopicMode(false);
                    setPracticeFilterAIBatch(null);
                    setActiveTab('practice');
                  }} className="text-sm font-bold bg-[hsl(var(--accent))] text-white px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-all">
                    Solve in Practice Mode
                  </button>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Progress Over Time (Accuracy %)</h3>
                  {progress.history && progress.history.length > 0 ? (
                    <div className="h-40 flex items-end gap-2 w-full mt-4">
                      {progress.history.slice(-30).map((h, i) => {
                        const acc = h.attempted > 0 ? Math.round((h.correct / h.attempted) * 100) : 0;
                        return (
                          <div key={i} className="flex-1 bg-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/80 rounded-t-md relative group transition-all" style={{ height: `${Math.max(acc, 5)}%` }}>
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                               {acc}% ({new Date(h.date).toLocaleDateString()})
                             </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-500">Take some tests to see your progress!</div>
                  )}
                </div>
                
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Topic Performance</h3>
                  {progress.topicStats && Object.keys(progress.topicStats).length > 0 ? (
                    <div className="space-y-4 max-h-40 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                      {Object.entries(progress.topicStats)
                        .map(([topic, stat]) => ({ topic, acc: Math.round((stat.correct / stat.attempted) * 100) }))
                        .sort((a, b) => a.acc - b.acc)
                        .map(t => (
                          <div 
                            key={t.topic}
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors group"
                            onClick={() => {
                              setPracticeFilterTopic(t.topic);
                              setPracticeFilterDifficulty(null);
                              setIsAiTopicMode(false);
                              setPracticeFilterAIBatch(null);
                              setActiveTab('practice');
                            }}
                          >
                            <div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-[hsl(var(--accent))] transition-colors">{t.topic}</span><span className={`font-bold ${t.acc < 50 ? 'text-rose-500' : t.acc < 80 ? 'text-yellow-500' : 'text-emerald-500'}`}>{t.acc}%</span></div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <m.div initial={{ width: 0 }} animate={{ width: `${t.acc}%` }} className={`h-full rounded-full ${t.acc < 50 ? 'bg-rose-500' : t.acc < 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`}></m.div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-center text-slate-500 px-4 text-sm">Flag questions to specific topics during review to identify your weak areas here!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mock' && (
              <div className={`bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-sm overflow-hidden flex flex-col flex-1 ${mockPhase === 'test' || mockPhase === 'review' ? testReviewClasses : 'rounded-2xl min-h-[600px] lg:h-[calc(100vh-12rem)]'}`}>
              {mockPhase === 'select' && (
                <div className="flex flex-col md:flex-row w-full h-full flex-1">
                  <div className="p-8 flex flex-col flex-1 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-white/10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit size={24} className="text-[hsl(var(--accent))]" /> Official Past Papers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {paperList.map((paper) => (
                        <div key={paper.id} className="p-5 bg-white/60 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10 flex flex-col justify-between shadow-sm hover:border-[hsl(var(--accent))]/50 hover:shadow-md transition-all group">
                          <div className="mb-4">
                        <h4 className="font-bold text-lg">{paper.title || paper.id || 'Unnamed Paper'}</h4>
                        <p className="text-slate-500 text-sm">Past Paper</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => handleStartPastPaper(paper.id)} className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] hover:text-white px-4 py-2 rounded-lg font-bold transition-colors">
                              <PlayCircle size={18} /> Start Test
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); const url = new URL(window.location.href); url.searchParams.set('challenge', paper.id); navigator.clipboard.writeText(url.toString()); alert('Challenge URL copied to clipboard!'); }} className="w-full flex items-center justify-center gap-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors">
                              <Share2 size={18} /> Challenge Friend
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {savedTests.length > 0 && (
                    <div className="p-8 flex flex-col flex-1 bg-black/5 dark:bg-white/5">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Book size={24} className="text-[hsl(var(--accent))]" /> Saved Offline Tests</h3>
                        <button 
                          onClick={async () => {
                            if(window.confirm('Instantly clear all saved offline tests and their progress?')) {
                               try {
                                 const db = await initDB();
                                 const tx = db.transaction(STORE_NAME, 'readwrite');
                                 tx.objectStore(STORE_NAME).clear();
                                 setSavedTests([]);
                               } catch(e) {}
                            }
                          }}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors border border-rose-500/20 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ maxHeight: '350px', scrollbarWidth: 'thin' }}>
                        {savedTests.map(test => (
                          <div key={test.id} className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-white/10 flex justify-between items-center shadow-sm hover:border-[hsl(var(--accent))]/50 transition-colors">
                            <div>
                              <div className="font-bold text-sm">Mock Test ({test.questions?.length || 0} Qs)</div>
                              <div className="text-xs text-slate-500 mt-0.5">{new Date(test.date).toLocaleString()}</div>
                            </div>
                            <button onClick={() => { setCurrentTest(test); setSelectedAnswers({}); setMockPhase('confirm'); }} className="text-sm font-bold text-white bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 px-4 py-2 rounded-lg shadow-md active:scale-95 transition-all">Retake</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {mockPhase === 'confirm' && currentTest && (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                   <h2 className="text-3xl font-black mb-4">{currentTest.title}</h2>
                   <p className="text-slate-500 mb-8 max-w-lg">
                     You are about to start this mock test. The test contains {currentTest.questions?.length || 0} questions and you will have {isExamMode ? '40 minutes per section' : '120 minutes'} to complete it. Ensure you have a stable connection and are ready to begin.
                   </p>
                   <label className="flex items-center gap-2 cursor-pointer text-sm font-bold bg-white dark:bg-slate-800 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-[hsl(var(--accent))]/50 mb-8">
                     <input type="checkbox" checked={isExamMode} onChange={e => setIsExamMode(e.target.checked)} className="w-4 h-4 text-[hsl(var(--accent))] rounded border-slate-300 focus:ring-[hsl(var(--accent))]" />
                     Strict Sectional Timing (40 min / section)
                   </label>
                   <div className="flex gap-4">
                     <button onClick={() => setMockPhase('select')} className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                     <button onClick={startConfirmedTest} className="px-8 py-3 rounded-xl font-bold bg-[hsl(var(--accent))] text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Begin Test</button>
                   </div>
                </div>
              )}
              {mockPhase === 'test' && currentTest && (
                <div className="flex flex-col flex-1 h-full bg-slate-50/50 dark:bg-slate-900/50 relative">
                  <AnimatePresence>
                    {showCalculator && (
                      <m.div
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute top-20 right-4 md:right-20 z-[6000] w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
                        style={{ touchAction: "none" }}
                      >
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 flex justify-between items-center cursor-move border-b border-slate-200/50 dark:border-white/10">
                          <span className="font-bold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"><Calculator size={16} /> Calculator</span>
                          <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-4">
                          <div className="bg-white dark:bg-slate-950 p-3 rounded-xl text-right font-mono text-xl mb-4 overflow-x-auto min-h-[3.5rem] flex items-center justify-end border border-slate-200/50 dark:border-white/5 shadow-inner">
                            {calcExpr || '0'}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                              <button key={btn} onClick={() => handleCalcClick(btn)} className={`p-3 rounded-xl font-bold text-lg transition-colors shadow-sm active:scale-95 ${btn === '=' ? 'bg-[hsl(var(--accent))] text-white hover:opacity-90' : ['/','*','-','+'].includes(btn) ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:bg-slate-600 text-[hsl(var(--accent))]' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                {btn}
                              </button>
                            ))}
                            <button onClick={() => handleCalcClick('C')} className="col-span-2 p-2 rounded-xl font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-sm active:scale-95 transition-colors">Clear</button>
                            <button onClick={() => handleCalcClick('sqrt')} className="p-2 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[hsl(var(--accent))] shadow-sm active:scale-95 transition-colors">√</button>
                            <button onClick={() => setCalcExpr(prev => prev.slice(0, -1))} className="p-2 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[hsl(var(--accent))] shadow-sm active:scale-95 transition-colors">⌫</button>
                          </div>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {isPaused && (
                      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
                        <Timer size={48} className="text-[hsl(var(--accent))] mb-4 opacity-50" />
                        <h2 className="text-3xl font-black mb-2">Test Paused</h2>
                        <p className="text-slate-500 mb-8 max-w-md">Your timer has been stopped. The questions are hidden to maintain fairness. You can resume whenever you're ready.</p>
                        <button onClick={() => setIsPaused(false)} className="px-8 py-3 rounded-xl font-bold bg-[hsl(var(--accent))] text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Resume Test</button>
                      </m.div>
                    )}
                  </AnimatePresence>
                  <div className="flex justify-between items-center p-4 border-b border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0">
                    <h3 className="text-lg font-bold truncate pr-4">{currentTest.title || 'Mock Test Active'}</h3>
                    <div className="flex items-center gap-2 md:gap-4">
                      <button onClick={() => setShowMobilePalette(!showMobilePalette)} className="md:hidden bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm">Palette</button>
                      <button onClick={() => setShowDesktopPalette(!showDesktopPalette)} className="hidden md:block bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        {showDesktopPalette ? 'Hide Palette' : 'Show Palette'}
                      </button>
                      <button onClick={toggleFullscreen} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all hidden sm:block" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </button>
                      <button onClick={() => setShowCalculator(!showCalculator)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all hidden sm:block" title="Calculator">
                        <Calculator size={18} />
                      </button>
                      <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all hidden sm:block" title={isSoundEnabled ? "Mute Timer" : "Unmute Timer"}>
                        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Are you sure you want to instantly clear all progress and saved answers for this test?')) {
                          setSelectedAnswers({});
                          setMarkedForReview({});
                          setSectionTimes({});
                          const sections = Array.from(new Set(currentTest?.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                          setActiveSection(sections[0] || '');
                          setActiveQuestionIdx(0);
                          setTimeLeft(isExamMode ? 2400 : 7200);
                        }
                      }} className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold shadow-sm active:scale-95 transition-all text-sm hidden lg:block" title="Reset Test (Alt+R)">Reset</button>
                      <button onClick={() => setIsPaused(true)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm hidden lg:block">Pause</button>
                      <div className={`font-mono bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-1.5 rounded-lg font-bold text-sm md:text-lg flex items-center gap-1 md:gap-2 ${timeLeft < 300 ? 'text-rose-500' : 'text-[hsl(var(--accent))]'}`}>
                         <Timer size={18} /> {formatTime(timeLeft)}
                      </div>
                      <button onClick={() => setShowSubmitSummary(true)} className="bg-[hsl(var(--accent))] text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm md:text-base">Submit</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                    <m.div 
                      className="h-full bg-[hsl(var(--accent))] transition-all"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((Object.values(selectedAnswers).filter(v => v !== undefined && String(v).trim() !== '').length / (currentTest.questions?.length || 1)) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex bg-white/40 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 shrink-0 px-2 overflow-x-auto scrollbar-hide">
                     {Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))).map((sec: any) => (
                       <button 
                         key={sec} 
                         onClick={() => { 
                           if (!isExamMode) {
                             setActiveSection(sec); 
                             setActiveQuestionIdx(0); 
                           }
                         }}
                         className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeSection === sec ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} ${(isExamMode && activeSection !== sec) ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isExamMode && activeSection !== sec}
                       >
                         {sec}
                       </button>
                     ))}
                  </div>

                  <div className="flex flex-1 overflow-hidden relative">
                     <div 
                       className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6" 
                       style={{ scrollbarWidth: 'thin' }}
                       onTouchStart={(e) => { setTouchEndX(null); setTouchStartX(e.targetTouches[0].clientX); }}
                       onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
                       onTouchEnd={() => {
                         if (touchStartX === null || touchEndX === null) return;
                         const distance = touchStartX - touchEndX;
                         if (distance > 50 && activeQuestionIdx < activeSectionQuestions.length - 1) setActiveQuestionIdx(prev => prev + 1);
                         if (distance < -50 && activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                         setTouchStartX(null); setTouchEndX(null);
                       }}
                     >
                        {(() => {
                           const q = activeSectionQuestions[activeQuestionIdx];
                           if (!q) return <div className="p-8 text-center text-slate-500">No questions in this section.</div>;

                           return (
                             <div className={`mx-auto w-full pb-8 ${q.context ? 'max-w-full flex flex-col lg:flex-row lg:gap-0 gap-6 h-full' : 'max-w-5xl flex flex-col'}`}>
                                {q.context && (
                                  <>
                                    <div className="passage-container flex-1 lg:flex-none p-6 md:p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-base md:text-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-loose overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                      {q.difficulty && q.id.startsWith('gen_') && (
                                        <div className="mb-4 flex items-center gap-2">
                                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                                            q.difficulty === 'Hard' ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                            q.difficulty === 'Easy' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                            'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                          }`}>
                                            Difficulty: {q.difficulty}
                                          </span>
                                        </div>
                                      )}
                                    {renderContextWithImages(q.context)}
                                  </div>
                                    <div 
                                      className="hidden lg:flex w-4 shrink-0 cursor-col-resize items-center justify-center group select-none outline-none"
                                      onMouseDown={handleDragStart}
                                      onTouchStart={handleDragStart}
                                    >
                                      <div className="w-1 h-12 bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 rounded-full transition-colors"></div>
                                    </div>
                                  </>
                                )}
                                <div className={`question-container flex-1 ${q.context ? 'lg:flex-none overflow-y-auto pr-2 pb-16 md:pb-0' : ''} flex flex-col`} style={q.context ? { maxHeight: 'calc(100vh - 200px)' } : {}}>
                                  <div className="bg-white/60 dark:bg-white/5 p-4 md:p-6 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm mb-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="font-bold text-base md:text-lg">Question {activeQuestionIdx + 1} <span className="text-slate-400 text-xs md:text-sm font-normal">of {activeSectionQuestions.length}</span></p>
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                                  </div>
                                  <div className="font-medium mb-6 text-base md:text-lg leading-relaxed text-slate-800 dark:text-slate-200">{renderContextWithImages(q.text)}</div>
                                  <div className="space-y-3">
                                    {q.type === 'MCQ' ? q.options?.map((opt: string, oIdx: number) => (
                                      <label key={oIdx} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAnswers[q.originalIndex] === oIdx ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-[hsl(var(--accent))]/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                        <input type="radio" name={`q-${q.originalIndex}`} checked={selectedAnswers[q.originalIndex] === oIdx} onChange={() => setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: oIdx }))} className="hidden" />
                                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAnswers[q.originalIndex] === oIdx ? 'border-[hsl(var(--accent))]' : 'border-slate-400'}`}>
                                          {selectedAnswers[q.originalIndex] === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))]"></div>}
                                        </div>
                                        <span className="text-sm md:text-base leading-relaxed">{renderContextWithImages(opt)}</span>
                                      </label>
                                    )) : (
                                      <input 
                                        type="text" 
                                        value={(selectedAnswers[q.originalIndex] as string) || ''} 
                                        onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: e.target.value }))} 
                                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" 
                                        placeholder="Type your answer here..." 
                                      />
                                    )}
                                  </div>
                                </div>
                                
                                {q.context && activeSectionQuestions[activeQuestionIdx + 1]?.context !== q.context && (
                                  <div className="w-full flex justify-center items-center gap-3 pb-6 opacity-40 select-none">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                  </div>
                                )}

                                  <div className="mt-auto shrink-0 flex flex-col sm:flex-row justify-between gap-3 md:gap-4 pb-8 md:pb-0">
                                   <button 
                                     disabled={activeQuestionIdx === 0} 
                                     onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                     className="w-full sm:w-auto px-4 md:px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all order-2 sm:order-1 text-sm md:text-base"
                                   >
                                     Previous
                                   </button>
                                   <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
                                     <button 
                                       disabled={selectedAnswers[q.originalIndex] === undefined || selectedAnswers[q.originalIndex] === ''}
                                       onClick={() => setSelectedAnswers(prev => {
                                         const next = { ...prev };
                                         delete next[q.originalIndex];
                                         return next;
                                       })}
                                       className="px-2 md:px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-500 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs md:text-base"
                                     >
                                       Clear
                                     </button>
                                     <button 
                                       onClick={() => setMarkedForReview(prev => ({...prev, [q.originalIndex]: !prev[q.originalIndex]}))}
                                       className={`px-2 md:px-6 py-3 rounded-xl font-bold border-2 transition-all text-xs md:text-base ${markedForReview[q.originalIndex] ? 'border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-500 text-slate-600 dark:text-slate-400'}`}
                                     >
                                       Review
                                     </button>
                                     <button 
                                       disabled={activeQuestionIdx === activeSectionQuestions.length - 1} 
                                       onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                       className="col-span-2 sm:col-auto px-4 md:px-6 py-3 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                                     >
                                       Save & Next
                                     </button>
                                   </div>
                                  </div>
                                </div>
                             </div>
                           );
                        })()}
                     </div>

                     {/* Mobile Palette Overlay */}
                     {showMobilePalette && (
                       <div className="md:hidden absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowMobilePalette(false)}></div>
                     )}

                     <div className={`w-56 shrink-0 border-l border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-white/5 flex-col ${showMobilePalette ? 'flex absolute right-0 inset-y-0 z-50 shadow-2xl' : (showDesktopPalette ? 'hidden md:flex' : 'hidden md:hidden')}`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 font-bold flex justify-between items-center">
                          <span>Question Palette</span>
                          <button onClick={() => setShowMobilePalette(false)} className="md:hidden text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                           <div className="grid grid-cols-4 gap-2">
                             {(() => {
                                return activeSectionQuestions.map((q: any, idx: number) => {
                                  const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                                  const isMarked = markedForReview[q.originalIndex];
                                  const isCurrent = activeQuestionIdx === idx;
                                  
                                  let btnClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                                  if (isMarked) {
                                     if (isAnswered) {
                                        btnClass = 'bg-purple-500 border-purple-600 text-white relative overflow-hidden';
                                     } else {
                                        btnClass = 'bg-purple-500 border-purple-600 text-white';
                                     }
                                  } else if (isAnswered) {
                                     btnClass = 'bg-emerald-500 border-emerald-600 text-white';
                                  }
                                  if (isCurrent) {
                                     btnClass += ' ring-2 ring-[hsl(var(--accent))] ring-offset-2 dark:ring-offset-slate-900';
                                  }

                                  return (
                                    <button 
                                      key={idx}
                                      onClick={() => setActiveQuestionIdx(idx)}
                                      className={`aspect-square rounded-lg border flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${btnClass}`}
                                    >
                                      {idx + 1}
                                      {isMarked && isAnswered && (
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-tl-md"></div>
                                      )}
                                    </button>
                                  )
                                });
                             })()}
                           </div>
                        </div>
                        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-3 text-xs font-medium">
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600"></div> Answered</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div> Not Answered</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-purple-500 border border-purple-600"></div> Marked for Review</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-purple-500 border border-purple-600 relative overflow-hidden"><div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-tl-sm"></div></div> Answered & Marked</div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
              {mockPhase === 'result' && lastTestResult && (
                <div className="flex flex-col items-center justify-center flex-1 p-8 md:p-12">
                  <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto"><Trophy size={48} /></div>
                    <h2 className="text-3xl font-black mb-2">Test Completed!</h2>
                    <p className="text-slate-500 mb-8">Here's a summary of your performance for this session.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left mb-8 text-slate-800 dark:text-slate-200">
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Score</div><div className="text-3xl font-black">{lastTestResult.score} <span className="text-lg font-bold text-slate-400">/ {lastTestResult.total * 3}</span></div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Accuracy</div><div className="text-3xl font-black text-[hsl(var(--accent))]">{lastTestResult.accuracy}%</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Percentile</div><div className="text-3xl font-black text-blue-500">{lastTestResult.percentile ? `${lastTestResult.percentile} PR` : <Loader2 size={24} className="animate-spin mt-1" />}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Avg Peer Time</div><div className="text-3xl font-black text-indigo-500">{lastTestResult.averagePeerTime ? formatTime(lastTestResult.averagePeerTime) : <Loader2 size={24} className="animate-spin mt-1" />}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Answered</div><div className="text-3xl font-black">{lastTestResult.answered}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Correct</div><div className="text-3xl font-black text-emerald-500">{lastTestResult.correct}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Incorrect</div><div className="text-3xl font-black text-rose-500">{lastTestResult.incorrect}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Unanswered</div><div className="text-3xl font-black text-slate-500">{lastTestResult.unanswered}</div></div>
                    </div>
                    
                    <div className="mb-8 bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 text-left">
                      <h3 className="font-bold mb-4">Section Analysis</h3>
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                        {(() => {
                          const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                          const totalTime = sections.reduce((sum, sec) => sum + (lastTestResult.sectionTimes?.[sec] || 0), 0);
                          const secColors = ['#10b981', '#a855f7', '#3b82f6', '#f43f5e', '#f59e0b'];
                          let cumulativePercent = 0;
                          const conicStops = totalTime > 0 ? sections.map((sec, i) => {
                            const time = lastTestResult.sectionTimes?.[sec] || 0;
                            const pct = (time / totalTime) * 100;
                            const color = hoveredSection && hoveredSection !== sec ? secColors[i % secColors.length] + '40' : secColors[i % secColors.length];
                            const stop = `${color} ${cumulativePercent}% ${cumulativePercent + pct}%`;
                            cumulativePercent += pct;
                            return stop;
                          }).join(', ') : '#cbd5e1 0% 100%';

                          return (
                            <>
                              <div className="w-48 h-48 shrink-0 rounded-full shadow-md relative flex items-center justify-center transition-all duration-500" style={{ background: `conic-gradient(${conicStops})` }}>
                                <div className="w-32 h-32 bg-[#f8fafc] dark:bg-[#020617] rounded-full flex flex-col items-center justify-center shadow-inner z-10 transition-colors">
                                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Time</span>
                                  <span className="font-mono font-black text-lg">{formatTime(totalTime)}</span>
                                </div>
                              </div>
                              <div className="space-y-2 flex-1 w-full">
                                {sections.map((sec: any, i: number) => {
                                  const time = lastTestResult.sectionTimes?.[sec] || 0;
                                  const qCount = currentTest.questions?.filter((q: any) => q.section === sec).length || 1;
                                  const avg = Math.round(time / qCount);
                                  const color = secColors[i % secColors.length];
                                  return (
                                    <div 
                                      key={sec} 
                                      onMouseEnter={() => setHoveredSection(sec)}
                                      onMouseLeave={() => setHoveredSection(null)}
                                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl transition-all cursor-default ${hoveredSection === sec ? 'bg-white/60 dark:bg-white/10 shadow-sm scale-[1.02]' : hoveredSection ? 'opacity-40' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{sec}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-4 text-sm mt-2 sm:mt-0">
                                         <span className="text-slate-500">Total: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatTime(time)}</span></span>
                                         <span className="text-slate-500">Avg/Q: <span className="font-mono font-bold text-[hsl(var(--accent))]">{formatTime(avg)}</span></span>
                                         {lastTestResult.sectionStats?.[sec] && (
                                           <>
                                             <span className="text-slate-500 hidden xl:inline">Score: <span className="font-mono font-bold text-emerald-500">{lastTestResult.sectionStats[sec].score > 0 ? `+${lastTestResult.sectionStats[sec].score}` : lastTestResult.sectionStats[sec].score}</span></span>
                                             <span className="text-slate-500">Acc: <span className="font-mono font-bold text-blue-500">{lastTestResult.sectionStats[sec].attempted > 0 ? Math.round((lastTestResult.sectionStats[sec].correct / lastTestResult.sectionStats[sec].attempted) * 100) : 0}%</span></span>
                                           </>
                                         )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {lastTestResult.testTopicStats && Object.keys(lastTestResult.testTopicStats).length > 0 && (
                      <div className="mb-8 bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 text-left">
                        <h3 className="font-bold mb-4">Detailed Topic Analysis</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(lastTestResult.testTopicStats)
                            .sort(([, a]: any, [, b]: any) => b.score - a.score)
                            .map(([topic, stat]: any) => {
                               const acc = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
                               return (
                                 <div key={topic} className="bg-white/60 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-[hsl(var(--accent))]/50 transition-colors">
                                   <div className="flex justify-between items-start mb-3">
                                     <span className="font-bold text-slate-700 dark:text-slate-300 pr-2">{topic}</span>
                                     <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 ${acc < 50 && stat.attempted > 0 ? 'text-rose-500' : acc < 80 && stat.attempted > 0 ? 'text-yellow-500' : stat.attempted > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                       {stat.attempted > 0 ? `${acc}% Acc` : 'Skipped'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between text-sm text-slate-500">
                                     <span>Score: <strong className={stat.score > 0 ? 'text-emerald-500' : stat.score < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}>{stat.score > 0 ? `+${stat.score}` : stat.score}</strong></span>
                                     <span>Attempted: <strong>{stat.attempted}/{stat.total}</strong></span>
                                   </div>
                                 </div>
                               )
                            })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                      <button onClick={() => { 
                        setMockPhase('select'); 
                        setCurrentTest(null); 
                        setSelectedAnswers({}); 
                        setLastTestResult(null); 
                        setMarkedForReview({});
                      }} className="border px-8 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                        Back to Mock Tests
                      </button>
                      <button onClick={() => { 
                        setMockPhase('review'); 
                        const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                        setActiveSection(sections[0] || '');
                        setActiveQuestionIdx(0);
                        setReviewFilter('all');
                      }} className="border px-8 py-3 rounded-xl font-bold bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))] hover:text-white transition-all">
                        Review Answers
                      </button>
                      <button onClick={() => { 
                        setMockPhase('review'); 
                        const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                        setActiveSection(sections[0] || '');
                        setActiveQuestionIdx(0);
                        setReviewFilter('incorrect');
                      }} className="border px-8 py-3 rounded-xl font-bold bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all">
                        Review Incorrect
                      </button>
                    </div>
                  </m.div>
                </div>
              )}
              
              {mockPhase === 'review' && currentTest && (
                <div className="flex flex-col flex-1 h-full bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex justify-between items-center p-4 border-b border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0">
                    <h3 className="text-lg font-bold truncate pr-4">{currentTest.title} - Review</h3>
                    <div className="flex items-center gap-2 md:gap-4">
                      <button onClick={() => setShowMobilePalette(!showMobilePalette)} className="md:hidden bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm">Palette</button>
                      <button onClick={() => setShowDesktopPalette(!showDesktopPalette)} className="hidden md:block bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        {showDesktopPalette ? 'Hide Palette' : 'Show Palette'}
                      </button>
                      <button onClick={toggleFullscreen} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all hidden sm:block" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </button>
                      <select 
                        value={reviewFilter} 
                        onChange={(e) => { setReviewFilter(e.target.value as any); setActiveQuestionIdx(0); }}
                        className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        <option value="all">All Questions</option>
                        <option value="correct">Correct Only</option>
                        <option value="incorrect">Incorrect Only</option>
                        <option value="unanswered">Unanswered Only</option>
                      </select>
                      <button onClick={() => setMockPhase('result')} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm md:text-base whitespace-nowrap">Back <span className="hidden md:inline">to Results</span></button>
                    </div>
                  </div>
                  
                  <div className="flex bg-white/40 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 shrink-0 px-2 overflow-x-auto scrollbar-hide">
                     {Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))).map((sec: any) => (
                       <button 
                         key={sec} 
                         onClick={() => { setActiveSection(sec); setActiveQuestionIdx(0); }}
                         className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeSection === sec ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         {sec}
                       </button>
                     ))}
                  </div>

                  <div className="flex flex-1 overflow-hidden relative">
                     <div 
                       className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6" 
                       style={{ scrollbarWidth: 'thin' }}
                       onTouchStart={(e) => { setTouchEndX(null); setTouchStartX(e.targetTouches[0].clientX); }}
                       onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
                       onTouchEnd={() => {
                         if (touchStartX === null || touchEndX === null) return;
                         const distance = touchStartX - touchEndX;
                         if (distance > 50 && activeQuestionIdx < filteredReviewQuestions.length - 1) setActiveQuestionIdx(prev => prev + 1);
                         if (distance < -50 && activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                         setTouchStartX(null); setTouchEndX(null);
                       }}
                     >
                        {(() => {
                           const q = filteredReviewQuestions[activeQuestionIdx];
                           if (!q) return <div className="p-8 text-center text-slate-500">No questions match the current filter in this section.</div>;

                           return (
                             <div className={`mx-auto w-full pb-8 ${q.context ? 'max-w-full flex flex-col lg:flex-row lg:gap-0 gap-6 h-full' : 'max-w-5xl flex flex-col'}`}>
                                {q.context && (
                                  <>
                                    <div className="passage-container flex-1 lg:flex-none p-6 md:p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-base md:text-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-loose overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                      {q.difficulty && q.id.startsWith('gen_') && (
                                        <div className="mb-4 flex items-center gap-2">
                                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                                            q.difficulty === 'Hard' ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                            q.difficulty === 'Easy' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                            'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                          }`}>
                                            Difficulty: {q.difficulty}
                                          </span>
                                        </div>
                                      )}
                                      {renderContextWithImages(q.context)}
                                    </div>
                                    <div 
                                      className="hidden lg:flex w-4 shrink-0 cursor-col-resize items-center justify-center group select-none outline-none"
                                      onMouseDown={handleDragStart}
                                      onTouchStart={handleDragStart}
                                    >
                                      <div className="w-1 h-12 bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 rounded-full transition-colors"></div>
                                    </div>
                                  </>
                                )}
                                <div className={`question-container flex-1 ${q.context ? 'lg:flex-none overflow-y-auto pr-2 pb-16 md:pb-0' : ''} flex flex-col`} style={q.context ? { maxHeight: 'calc(100vh - 200px)' } : {}}>
                                  <div className="bg-white/60 dark:bg-white/5 p-4 md:p-6 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm mb-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="font-bold text-base md:text-lg">Question {activeQuestionIdx + 1} <span className="text-slate-400 text-xs md:text-sm font-normal">of {filteredReviewQuestions.length}</span></p>
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                                  </div>
                                  <div className="font-medium mb-6 text-base md:text-lg leading-relaxed text-slate-800 dark:text-slate-200">{renderContextWithImages(q.text)}</div>
                                  <div className="space-y-3">
                                    {q.type === 'MCQ' ? q.options?.map((opt: string, oIdx: number) => {
                                      const isSelected = selectedAnswers[q.originalIndex] === oIdx;
                                      const isCorrect = q.correct === oIdx;
                                      let borderClass = 'border-slate-200 dark:border-slate-700';
                                      let bgClass = '';
                                      if (isCorrect) {
                                        borderClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
                                      } else if (isSelected && !isCorrect) {
                                        borderClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/20';
                                      } else if (!isSelected && !isCorrect) {
                                        borderClass = 'border-slate-200 dark:border-slate-700 opacity-50 hover:opacity-100';
                                      }

                                      return (
                                        <div key={oIdx} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 transition-all ${borderClass} ${bgClass}`}>
                                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? (isCorrect ? 'border-emerald-500' : 'border-rose-500') : (isCorrect ? 'border-emerald-500' : 'border-slate-400')}`}>
                                            {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>}
                                          </div>
                                          <span className="text-sm md:text-base leading-relaxed">{renderContextWithImages(opt)}</span>
                                          {isCorrect && <span className="ml-auto text-emerald-500 font-bold text-sm hidden sm:inline">Correct</span>}
                                          {isSelected && !isCorrect && <span className="ml-auto text-rose-500 font-bold text-sm hidden sm:inline">Your Answer</span>}
                                        </div>
                                      )
                                    }) : (
                                      <div>
                                        <input 
                                          type="text" 
                                          disabled
                                          value={(selectedAnswers[q.originalIndex] as string) || ''} 
                                          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-lg focus:outline-none transition-colors" 
                                          placeholder="Not answered" 
                                        />
                                        <div className={`mt-3 font-bold ${String(selectedAnswers[q.originalIndex] || '').trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase() ? 'text-emerald-500' : 'text-rose-500'}`}>
                                           Correct Answer: {q.tita_answer}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                  <div className="mb-6 p-6 bg-[hsl(var(--accent))]/5 dark:bg-[hsl(var(--accent))]/10 rounded-xl border border-[hsl(var(--accent))]/20">
                                  <div className="font-bold flex items-center gap-2 mb-3 text-[hsl(var(--accent))]"><Book size={18} /> Explanation</div>
                                  <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{renderContextWithImages(q.explanation)}</div>
                                  </div>

                                  {q.context && filteredReviewQuestions[activeQuestionIdx + 1]?.context !== q.context && (
                                    <div className="w-full flex justify-center items-center gap-3 pb-6 opacity-40 select-none">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    </div>
                                  )}

                                  <div className="mt-auto shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 pb-8 md:pb-0">
                                   <div className="flex items-center gap-2 w-full sm:w-auto">
                                     {taggedQuestions[q.id] ? (
                                       <div className="bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] px-4 py-2 rounded-lg font-bold text-sm border border-[hsl(var(--accent))]/20">
                                         Flagged as: {taggedQuestions[q.id]}
                                       </div>
                                     ) : (
                                       <>
                                         <input 
                                           type="text" 
                                           placeholder="Flag topic (e.g. Algebra)" 
                                           className="flex-1 sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
                                           onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleTagTopic(q, e.currentTarget.value);
                                           }}
                                         />
                                         <button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              handleTagTopic(q, input.value);
                                            }}
                                            className="bg-[hsl(var(--accent))] text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-colors"
                                         >
                                           Flag
                                         </button>
                                       </>
                                     )}
                                   </div>
                                   <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                                     <button 
                                       disabled={activeQuestionIdx === 0} 
                                       onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                       className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                                     >
                                       Previous
                                     </button>
                                     <button 
                                       disabled={activeQuestionIdx === filteredReviewQuestions.length - 1} 
                                       onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                       className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                                     >
                                       Next
                                     </button>
                                   </div>
                                  </div>
                                </div>
                             </div>
                           );
                        })()}
                     </div>

                     {/* Mobile Palette Overlay */}
                     {showMobilePalette && (
                       <div className="md:hidden absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowMobilePalette(false)}></div>
                     )}

                     <div className={`w-56 shrink-0 border-l border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-white/5 flex-col ${showMobilePalette ? 'flex absolute right-0 inset-y-0 z-50 shadow-2xl' : 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 font-bold flex justify-between items-center">
                          <span>Question Palette</span>
                          <button onClick={() => setShowMobilePalette(false)} className="md:hidden text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                           <div className="grid grid-cols-4 gap-2">
                             {(() => {
                                return filteredReviewQuestions.map((q: any, idx: number) => {
                                  const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                                  let isCorrect = false;
                                  if (isAnswered) {
                                    if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
                                    else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                                  }
                                  const isCurrent = activeQuestionIdx === idx;
                                  
                                  let btnClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                                  if (isAnswered) {
                                     btnClass = isCorrect ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white';
                                  }
                                  if (isCurrent) {
                                     btnClass += ' ring-2 ring-[hsl(var(--accent))] ring-offset-2 dark:ring-offset-slate-900';
                                  }

                                  return (
                                    <button 
                                      key={idx}
                                      onClick={() => setActiveQuestionIdx(idx)}
                                      className={`aspect-square rounded-lg border flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${btnClass}`}
                                    >
                                      {activeSectionQuestions.findIndex((sq: any) => sq.originalIndex === q.originalIndex) + 1}
                                    </button>
                                  )
                                });
                             })()}
                           </div>
                        </div>
                        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-3 text-xs font-medium">
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600"></div> Correct</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-rose-500 border border-rose-600"></div> Incorrect</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div> Not Answered</div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="flex flex-col flex-1">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex flex-wrap gap-2 md:gap-3 pb-2">
                  {(['QA', 'VARC', 'DILR'] as const).map((subj, i) => (
                    <button key={subj} onClick={() => { setPracticeSubject(subj); setPracticeFilterTopic(null); setPracticeFilterBookmark(false); setPracticeFilterDifficulty(null); setIsAiTopicMode(false); setPracticeFilterAIBatch(null); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap ${practiceSubject === subj && !practiceFilterTopic && !practiceFilterBookmark && !practiceFilterDifficulty && !isAiTopicMode && practiceFilterAIBatch === null ? 'bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10'}`}>
                      {subj} Training <span className="opacity-50 text-xs ml-1 font-normal hidden sm:inline">[{i + 1}]</span>
                    </button>
                  ))}
                  {practiceFilterTopic && (
                    <button className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30 border border-[hsl(var(--accent))]">
                      {practiceFilterTopic} Focus
                    </button>
                  )}
                  <button onClick={() => { setPracticeFilterTopic(null); setPracticeFilterBookmark(true); setPracticeFilterDifficulty(null); setIsAiTopicMode(false); setPracticeFilterAIBatch(null); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${practiceFilterBookmark && !practiceFilterTopic ? 'bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10'}`}>
                    Bookmarks ({progress.bookmarkedQuestions?.length || 0})
                  </button>
                  
                  <div className="relative">
                    <button 
                      onClick={() => setIsDifficultyDropdownOpen(!isDifficultyDropdownOpen)}
                      className={`px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm focus:outline-none flex items-center gap-2 ${practiceFilterDifficulty !== null ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))]' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10'}`}
                    >
                      {practiceFilterDifficulty !== null ? `${practiceFilterDifficulty} Difficulty` : 'Any Difficulty'}
                      <ChevronDown size={16} className={`transition-transform ${isDifficultyDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isDifficultyDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsDifficultyDropdownOpen(false)}></div>
                          <m.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full mt-2 left-0 w-48 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                          >
                            <div className="flex flex-col">
                              {[
                                { value: null, label: 'Any Difficulty', color: 'text-slate-600 dark:text-slate-400' },
                                { value: 'Easy', label: 'Easy', color: 'text-emerald-500' },
                                { value: 'Medium', label: 'Medium', color: 'text-yellow-500' },
                                { value: 'Hard', label: 'Hard', color: 'text-rose-500' }
                              ].map(opt => (
                                <button
                                  key={opt.label}
                                  onClick={() => {
                                    setPracticeFilterTopic(null);
                                    setPracticeFilterBookmark(false);
                                    setPracticeFilterDifficulty(opt.value);
                                    setIsAiTopicMode(false);
                                    setPracticeFilterAIBatch(null);
                                    setIsDifficultyDropdownOpen(false);
                                  }}
                                  className={`text-left px-4 py-3 text-sm font-bold border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${practiceFilterDifficulty === opt.value ? 'bg-slate-50 dark:bg-slate-800/50' : ''} ${opt.color}`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </m.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {aiBatchesList.length > 0 && (
                    <div className="relative">
                      <button 
                        onClick={() => setIsAiBatchDropdownOpen(!isAiBatchDropdownOpen)}
                        className={`px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm focus:outline-none flex items-center gap-2 ${practiceFilterAIBatch !== null ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))]' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10'}`}
                      >
                        {practiceFilterAIBatch !== null ? `AI Batch #${practiceFilterAIBatch + 1}` : 'Saved AI Batches'}
                        <ChevronDown size={16} className={`transition-transform ${isAiBatchDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isAiBatchDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsAiBatchDropdownOpen(false)}></div>
                            <m.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
                            >
                              <div className="max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                {aiBatchesList.map((b) => (
                                  <div key={b.batchId} className="flex items-center justify-between p-3 border-b border-slate-200/50 dark:border-slate-700/50 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <div
                                      className="flex-1 cursor-pointer"
                                      onClick={() => {
                                        setPracticeFilterTopic(null);
                                        setPracticeFilterBookmark(false);
                                        setPracticeFilterDifficulty(null);
                                        setIsAiTopicMode(false);
                                        setIsAdaptive(false);
                                        setPracticeFilterAIBatch(b.batchId);
                                        setIsAiBatchDropdownOpen(false);
                                      }}
                                    >
                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                         {b.topic ? `AI: ${b.topic}` : `AI Batch #${b.batchId + 1}`}
                                      </p>
                                      <p className="text-xs text-slate-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Saved'}</p>
                                    </div>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (window.confirm("Delete this AI generated batch?")) {
                                          await deleteGeneratedBatch(b.subject, b.batchId);
                                          const updated = await getGeneratedBatches(practiceSubject);
                                          setAiBatchesList(updated);
                                          if (practiceFilterAIBatch === b.batchId) {
                                            setPracticeFilterAIBatch(null);
                                            setPracticeRefreshTrigger(prev => prev + 1);
                                          }
                                          if (updated.length === 0) setIsAiBatchDropdownOpen(false);
                                        }
                                      }}
                                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                      title="Delete Batch"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </m.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-2 text-sm font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-lg border border-orange-500/20 shadow-sm" title="Consecutive Correct Answers">
                    🔥 Streak: {progress.currentStreak || 0} <span className="opacity-50 font-normal ml-1"> (Max: {progress.maxStreak || 0})</span>
                    <AnimatePresence>
                      {(progress.currentStreak || 0) > 1 && progress.currentStreak === progress.maxStreak && (
                        <m.span 
                          key={progress.currentStreak}
                          initial={{ scale: 0.5, opacity: 0, y: 5 }}
                          animate={{ scale: [1, 1.2, 1], opacity: 1, y: 0 }}
                          className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[9px] rounded uppercase tracking-wider shadow-sm whitespace-nowrap"
                        >
                          New Best!
                        </m.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium whitespace-nowrap">
                    <input type="checkbox" checked={isAdaptive} onChange={(e) => { setIsAdaptive(e.target.checked); if(e.target.checked) { setIsAiTopicMode(false); setPracticeFilterAIBatch(null); } }} className="w-4 h-4 rounded text-[hsl(var(--accent))] bg-slate-100 border-slate-300 focus:ring-[hsl(var(--accent))] dark:bg-slate-700 dark:border-slate-600" />
                    <span className={isAdaptive ? 'text-[hsl(var(--accent))] font-bold' : 'text-slate-600 dark:text-slate-400'}>Adaptive Difficulty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium whitespace-nowrap">
                    <input type="checkbox" checked={isAiTopicMode} onChange={(e) => {
                      setIsAiTopicMode(e.target.checked);
                      if (e.target.checked) {
                        setPracticeFilterTopic(null);
                        setPracticeFilterBookmark(false);
                        setPracticeFilterDifficulty(null);
                        setIsAdaptive(false);
                        setPracticeFilterAIBatch(null);
                      }
                    }} className="w-4 h-4 rounded text-[hsl(var(--accent))] bg-slate-100 border-slate-300 focus:ring-[hsl(var(--accent))] dark:bg-slate-700 dark:border-slate-600" />
                    <span className={isAiTopicMode ? 'text-[hsl(var(--accent))] font-bold' : 'text-slate-600 dark:text-slate-400'}>AI Topic Focus</span>
                  </label>
                  <button onClick={toggleFullscreen} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all hidden sm:block" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isAiTopicMode && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 flex flex-col sm:flex-row gap-4 items-center bg-white/60 dark:bg-white/5 backdrop-blur-xl p-4 rounded-xl border border-[hsl(var(--accent))]/30 shadow-sm overflow-hidden"
                  >
                    <div className="flex-1 w-full relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="What topic do you want to practice? (e.g. Geometry, Syllogisms, Parajumbles...)" 
                        value={aiTopicFocus} 
                        onChange={e => setAiTopicFocus(e.target.value)} 
                        onKeyDown={e => { if (e.key === 'Enter' && !isGenerating && aiTopicFocus.trim()) setPracticeRefreshTrigger(prev => prev + 1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" 
                      />
                    </div>
                    <button 
                      onClick={() => setPracticeRefreshTrigger(prev => prev + 1)}
                      disabled={isGenerating || !aiTopicFocus.trim()}
                      className="w-full sm:w-auto bg-[hsl(var(--accent))] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isGenerating ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Bot size={18} /> Ask Maester</>}
                    </button>
                  </m.div>
                )}
              </AnimatePresence>

              {practiceQuestions.length > 0 && (
                <div className="mb-6 sticky top-[72px] z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600 dark:text-slate-400">Batch Progress</span>
                    <span className="text-[hsl(var(--accent))]">{Object.keys(practiceAnswers).length} / {practiceQuestions.length}</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <m.div 
                      className="h-full bg-[hsl(var(--accent))] transition-all duration-500" 
                      style={{ width: `${(Object.keys(practiceAnswers).length / practiceQuestions.length) * 100}%` }} 
                    />
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                    <m.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-16 h-16 border-4 border-slate-200/50 dark:border-white/10 rounded-full"
                      style={{ borderTopColor: "hsl(var(--accent))", boxShadow: "0 0 20px -5px hsl(var(--accent) / 0.5)" }}
                    />
                    <h3 className="text-xl font-bold mt-6 text-slate-800 dark:text-slate-200">Maester is Crafting New Challenges...</h3>
                    <p className="text-slate-500 max-w-md mt-2">Our AI is generating a unique set of questions for you. This may take a moment. Thank you for your patience.</p>
                  </div>
                ) : generationError ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-16 text-center">
                    <BrainCircuit size={48} className="mx-auto mb-4 text-rose-500/50" />
                    <h3 className="text-xl font-bold text-rose-500">Generation Failed</h3>
                    <p className="text-slate-500 max-w-md mt-2 mb-6">{generationError}</p>
                    <button onClick={() => setPracticeRefreshTrigger(prev => prev + 1)} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity">
                      Retry Generation
                    </button>
                  </div>
                ) : practiceQuestions.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
                    <p>
                      {isAiTopicMode && !aiTopicFocus.trim() 
                        ? "Enter a topic above and ask Maester to generate custom questions." 
                        : `No questions found ${practiceFilterTopic ? `for topic "${practiceFilterTopic}"` : practiceFilterBookmark ? 'in your bookmarks' : practiceFilterDifficulty ? `with "${practiceFilterDifficulty}" difficulty` : practiceFilterAIBatch !== null ? 'in this saved AI batch' : 'for this skill level'}.`
                      }
                    </p>
                  </div>
                ) : (() => {
                  const groups: { context?: string, qs: { q: Question, idx: number }[] }[] = [];
                  practiceQuestions?.forEach((q, idx) => {
                    if (groups.length > 0 && groups[groups.length - 1].context === q.context) {
                      groups[groups.length - 1].qs.push({ q, idx });
                    } else {
                      groups.push({ context: q.context, qs: [{ q, idx }] });
                    }
                  });

                  return groups.map((group, gIdx) => (
                    <Fragment key={`group_${gIdx}`}>
                      <m.div 
                        layout 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: Math.min(gIdx * 0.1, 0.5) }}
                        className={`flex flex-col ${group.context ? 'lg:flex-row lg:items-start lg:gap-0 gap-6' : 'gap-6'} w-full`}
                      >
                      {group.context && (
                        <>
                          <div className="passage-container lg:sticky lg:top-[140px] p-6 md:p-8 bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-2xl text-base md:text-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-loose border border-slate-200/50 dark:border-white/10 shadow-sm overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-160px)]" style={{ scrollbarWidth: 'thin' }}>
                            {group.qs[0].q.difficulty && group.qs[0].q.id.startsWith('gen_') && (
                              <div className="mb-4 flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                                  group.qs[0].q.difficulty === 'Hard' ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                  group.qs[0].q.difficulty === 'Easy' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                  'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                }`}>
                                  Passage Difficulty: {group.qs[0].q.difficulty}
                                </span>
                              </div>
                            )}
                            {renderContextWithImages(group.context, activeHint)}
                          </div>
                          <div 
                            className="hidden lg:flex w-4 shrink-0 cursor-col-resize items-center justify-center group select-none outline-none lg:sticky lg:top-[50vh]"
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                          >
                            <div className="w-1 h-12 bg-slate-300 dark:bg-slate-600 group-hover:bg-[hsl(var(--accent))] rounded-full transition-colors"></div>
                          </div>
                        </>
                      )}
                      <div className={`${group.context ? 'question-container' : 'w-full max-w-5xl mx-auto'} flex flex-col gap-6`}>
                        {group.qs.map(({ q, idx }) => (
                          <m.div layout key={q.id} id={`practice-q-${idx}`} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-sm">
                            <div className="flex justify-between items-start mb-6 gap-4">
                              <div className="flex-1">
                            <div className="flex gap-2 mb-3">
                              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                              {(() => {
                                const aiDifficulty = q.difficulty;
                                const rating = questionRatings[q.id] || 1200;
                                let diffText = 'Medium';
                                let diffColor = 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border border-yellow-500/20';
                                if (q.id.startsWith('gen_') && aiDifficulty) {
                                  diffText = aiDifficulty;
                                  if (aiDifficulty === 'Easy') diffColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
                                  else if (aiDifficulty === 'Hard') diffColor = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20';
                                } else {
                                  if (rating < 1000) { diffText = 'Easy'; diffColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'; }
                                  else if (rating > 1400) { diffText = 'Hard'; diffColor = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20'; }
                                }
                                return <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${diffColor}`}>{diffText}</span>;
                              })()}
                            </div>
                            <div className="font-medium text-lg leading-relaxed flex gap-2 text-slate-800 dark:text-slate-200">
                              <span>{idx + 1}.</span>
                              <div>{renderContextWithImages(q.text)}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => toggleBookmark(q.id)}
                            className={`p-2 shrink-0 rounded-lg transition-colors ${progress.bookmarkedQuestions?.includes(q.id) ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                            title="Bookmark Question"
                          >
                            <Bookmark size={20} fill={progress.bookmarkedQuestions?.includes(q.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {q.type === 'MCQ' ? q.options?.map((opt, oIdx) => {
                        const isAnswered = practiceAnswers[q.id] !== undefined;
                        const isSelected = practiceAnswers[q.id] === oIdx;
                        const isCorrect = q.correct === oIdx;
                        let borderClass = 'border-slate-200/50 dark:border-white/10 hover:border-[hsl(var(--accent))]/50';
                        let bgClass = 'bg-white/40 dark:bg-white/5';
                        
                        if (isAnswered) {
                          if (isCorrect) borderClass = 'border-emerald-500', bgClass = 'bg-emerald-500/10 dark:bg-emerald-500/20';
                          else if (isSelected) borderClass = 'border-rose-500', bgClass = 'bg-rose-500/10 dark:bg-rose-500/20';
                          else if (q.correct === oIdx) borderClass = 'border-emerald-500 border-dashed', bgClass = 'bg-emerald-500/5 dark:bg-emerald-500/10';
                          else borderClass = 'border-slate-200/50 dark:border-white/10 opacity-50';
                        }

                        return (
                          <label key={oIdx} className="relative cursor-pointer">
                            <input type="radio" name={`pq-${q.id}`} disabled={isAnswered} className="sr-only" onChange={() => {
                              const userRating = progress.skillRatings?.[practiceSubject] || 1200;
                              const isCorrect = oIdx === q.correct;

                              setPracticeAnswers(prev => ({ ...prev, [q.id]: oIdx }));
                              setLastAnswerStatus(isCorrect ? 'correct' : 'incorrect');
                              updateSkillRating(practiceSubject, questionRatings[q.id] || 1200, isCorrect);
                              updateQuestionRating(q.id, userRating, isCorrect);
                              updatePracticeStreak(isCorrect);
                              addResult(1, isCorrect ? 1 : 0);
                              if (!isCorrect) {
                                const front = `[Auto-Generated]\n\nQ: ${q.text}`;
                                const back = `Correct Answer: ${q.options?.[q.correct as number]}\\n\\nExplanation:\\n${q.explanation}`;
                                saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
                              }
                            }} />
                            <div className={`border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md ${borderClass} ${bgClass} leading-relaxed`}>{renderContextWithImages(opt)}</div>
                          </label>
                        );
                      }) : (
                        <div className="sm:col-span-2">
                           <input 
                              type="text" 
                              disabled={practiceAnswers[q.id] !== undefined} 
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value;
                                    const userRating = progress.skillRatings?.[practiceSubject] || 1200;
                                    setPracticeAnswers(prev => ({ ...prev, [q.id]: val }));
                                    const isCorrect = String(val).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                                    
                                    setLastAnswerStatus(isCorrect ? 'correct' : 'incorrect');
                                    updateSkillRating(practiceSubject, questionRatings[q.id] || 1200, isCorrect);
                                    updateQuestionRating(q.id, userRating, isCorrect);
                                    updatePracticeStreak(isCorrect);
                                    addResult(1, isCorrect ? 1 : 0);
                                    if (!isCorrect) {
                                      const front = `[Auto-Generated]\n\nQ: ${q.text}`;
                                      const back = `Correct Answer: ${q.tita_answer}\\n\\nExplanation:\\n${q.explanation}`;
                                      saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
                                    }
                                }
                              }} 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors disabled:opacity-50" 
                              placeholder="Type your answer and press Enter..." 
                           />
                           {practiceAnswers[q.id] !== undefined && (
                             <div className={`mt-2 text-sm font-bold ${practiceAnswers[q.id] === 'SKIPPED' ? 'text-slate-500' : String(practiceAnswers[q.id]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase() ? 'text-emerald-500' : 'text-rose-500'}`}>
                               Your Answer: {practiceAnswers[q.id] === 'SKIPPED' ? 'Skipped' : practiceAnswers[q.id]} | Correct: {q.tita_answer}
                             </div>
                           )}
                        </div>
                      )}
                      
                      <AnimatePresence>
                        {progress.bookmarkedQuestions?.includes(q.id) && (
                          <m.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden"
                          >
                            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/10 p-3 md:p-4 rounded-xl border border-amber-200/50 dark:border-amber-700/50">
                              <Edit2 size={16} className="text-amber-500 mt-1 shrink-0" />
                              <textarea
                                placeholder="Add a personalized note for future review..."
                                value={progress.bookmarkedNotes?.[q.id] || ''}
                                onChange={(e) => updateBookmarkNote(q.id, e.target.value)}
                                className="w-full bg-transparent border-none focus:outline-none text-sm text-slate-700 dark:text-slate-300 resize-none min-h-[40px] placeholder:text-amber-700/30 dark:placeholder:text-amber-300/30"
                              />
                            </div>
                          </m.div>
                        )}
                      </AnimatePresence>

                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          {q.hint && q.context && (
                            <button
                              onClick={() => setActiveHint(activeHint === q.hint ? null : (q.hint || null))}
                              className={`text-sm font-bold transition-colors flex items-center gap-1.5 ${activeHint === q.hint ? 'text-[hsl(var(--accent))]' : 'text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300'}`}
                            >
                              <span className="text-base">💡</span> {activeHint === q.hint ? 'Hide Hint' : 'Show Hint'}
                            </button>
                          )}
                        </div>
                        {practiceAnswers[q.id] === undefined && (
                          <button 
                            onClick={() => {
                              const userRating = progress.skillRatings?.[practiceSubject] || 1200;
                              setPracticeAnswers(prev => ({ ...prev, [q.id]: 'SKIPPED' }));
                              setLastAnswerStatus('incorrect');
                              updateSkillRating(practiceSubject, questionRatings[q.id] || 1200, false);
                              updateQuestionRating(q.id, userRating, false);
                              updatePracticeStreak(false);
                              addResult(1, 0);
                              const front = `[Auto-Generated]\n\nQ: ${q.text}`;
                              const back = `Correct Answer: ${q.type === 'MCQ' ? q.options?.[q.correct as number] : q.tita_answer}\n\nExplanation:\n${q.explanation}`;
                              saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
                            }}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          >
                            Skip & Reveal Answer
                          </button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {practiceAnswers[q.id] !== undefined && (
                        <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mt-6">
                          <div className={`p-5 rounded-xl border ${
                            practiceAnswers[q.id] === 'SKIPPED' ? 'bg-slate-500/5 border-slate-500/20' :
                            ((q.type === 'MCQ' && practiceAnswers[q.id] === q.correct) || 
                            (q.type !== 'MCQ' && String(practiceAnswers[q.id]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()))
                              ? 'bg-emerald-500/5 border-emerald-500/20' 
                              : 'bg-rose-500/5 border-rose-500/20'
                          }`}>
                            <div className={`font-bold flex items-center gap-2 mb-3 text-lg ${
                              practiceAnswers[q.id] === 'SKIPPED' ? 'text-slate-500 dark:text-slate-400' :
                              ((q.type === 'MCQ' && practiceAnswers[q.id] === q.correct) || 
                              (q.type !== 'MCQ' && String(practiceAnswers[q.id]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()))
                                ? 'text-emerald-500' 
                                : 'text-rose-500'
                            }`}>
                              {practiceAnswers[q.id] === 'SKIPPED' ? '⏭️ Skipped' :
                               ((q.type === 'MCQ' && practiceAnswers[q.id] === q.correct) || 
                              (q.type !== 'MCQ' && String(practiceAnswers[q.id]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()))
                                ? '✅ Correct!' : '❌ Incorrect!'}
                            </div>
                            <div className="font-bold flex items-center gap-2 mb-2 text-[hsl(var(--accent))]"><Book size={18} /> Coach&apos;s Explanation</div>
                            <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{renderContextWithImages(q.explanation)}</div>
                            
                            {q.id.startsWith('gen_') && (
                              <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/10">
                                <p className="text-xs font-bold text-slate-500 mb-2">Rate this AI-generated question:</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                      key={star} 
                                      onClick={() => handleAiQuestionRating(q.id, star)}
                                      className="text-slate-300 dark:text-slate-600 hover:text-yellow-400 transition-colors"
                                    >
                                      <Star size={20} className={`transition-colors ${aiQuestionFeedback[q.id] >= star ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </m.div>
                        ))}
                      </div>
                      </m.div>
                      {gIdx < groups.length - 1 && (
                        <div className="w-full flex justify-center items-center gap-3 py-2 opacity-40 select-none">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                        </div>
                      )}
                    </Fragment>
                  ));
                })()}
                {practiceQuestions.length > 0 && (
                  <div className="flex justify-center mt-8 pb-8">
                    {(() => {
                      const topicPrompt = (isAiTopicMode && aiTopicFocus.trim()) ? aiTopicFocus.trim() : undefined;
                      const isReady = prefetchedBatch && prefetchedBatch.subject === practiceSubject && prefetchedBatch.topic === topicPrompt;
                      const isNormalOrAiMode = !practiceFilterTopic && !practiceFilterBookmark && !practiceFilterDifficulty && !isAdaptive && practiceFilterAIBatch === null;
                      return (
                        <button 
                          onClick={() => {
                            setPracticeFilterAIBatch(null);
                            setPracticeRefreshTrigger(prev => prev + 1);
                          }}
                          className={`px-8 py-3 rounded-xl font-bold shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 ${isReady && isNormalOrAiMode ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))] hover:text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[hsl(var(--accent))]/50 hover:text-[hsl(var(--accent))]'}`}
                        >
                          <RotateCcw size={18} /> {isNormalOrAiMode && isReady ? 'Next Batch Ready ⚡' : 'Load Next Batch'}
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'formula' && (
            <div className="flex flex-col flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Interactive Formula Hub</h3>
                  <p className="text-slate-500">Master the official CAT formulas or add your own custom flashcards to IndexedDB.</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search formulas..." value={formulaSearch} onChange={e => setFormulaSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                  </div>
                  <button onClick={() => { setIsAddingFormula(!isAddingFormula); if (isAddingFormula) { setEditingFormulaId(null); setNewFormula({ front: '', back: '' }); } }} className="bg-[hsl(var(--accent))] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                    {isAddingFormula ? 'Cancel' : '+ Add'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {formulaTopics.map((topic: any) => (
                  <button 
                    key={topic} 
                    onClick={() => setFormulaTopicFilter(topic)} 
                    className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap text-sm transition-colors ${formulaTopicFilter === topic ? 'bg-[hsl(var(--accent))] text-white' : 'bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {isAddingFormula && (
                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 flex flex-col md:flex-row gap-4 mt-2">
                      <input type="text" placeholder="Front (e.g. Area of a Circle: $A = \pi r^2$)" value={newFormula.front} onChange={e => setNewFormula({...newFormula, front: e.target.value})} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                      <input type="text" placeholder="Back (e.g. $A = \pi r^2$)" value={newFormula.back} onChange={e => setNewFormula({...newFormula, back: e.target.value})} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                      <button onClick={async () => {
                        if(!newFormula.front || !newFormula.back) return;
                        const f = { id: editingFormulaId || Date.now().toString(), front: newFormula.front, back: newFormula.back };
                        await saveFormula(f);
                        if (editingFormulaId) {
                          setFormulas(formulas.map(form => form.id === editingFormulaId ? f : form));
                          setEditingFormulaId(null);
                        } else {
                          setFormulas([...formulas, f]);
                        }
                        setNewFormula({ front: '', back: '' });
                        setIsAddingFormula(false);
                      }} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all">
                        {editingFormulaId ? 'Update Offline' : 'Save Offline'}
                      </button>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {filteredFormulas.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Book size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No formulas found matching "{formulaSearch}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-fr">
                  {filteredFormulas.map((f) => (
                   <Flashcard key={f.id} formula={f} onEdit={() => {
                     setEditingFormulaId(f.id);
                     setNewFormula({ front: f.front, back: f.back });
                     setIsAddingFormula(true);
                   }} onDelete={async () => {
                     setFormulaToDelete(f.id);
                   }} onUpdate={async (updated) => {
                     await saveFormula(updated);
                     setFormulas(formulas.map(form => form.id === updated.id ? updated : form));
                   }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Submit Summary Modal */}
      <AnimatePresence>
        {showSubmitSummary && currentTest && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center">
            <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-6 md:p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Submit Test</h3>
                <button onClick={() => setShowSubmitSummary(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Questions:</span>
                  <span className="font-bold text-lg">{currentTest.questions?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><div className="w-3 h-3 rounded bg-emerald-500"></div> Answered:</span>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{currentTest.questions?.filter((q: any) => selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '').length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><div className="w-3 h-3 rounded bg-purple-500"></div> Marked for Review:</span>
                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{currentTest.questions?.filter((q: any) => markedForReview[q.originalIndex]).length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><div className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"></div> Not Answered:</span>
                  <span className="font-bold text-lg">{currentTest.questions?.filter((q: any) => selectedAnswers[q.originalIndex] === undefined || selectedAnswers[q.originalIndex] === '').length || 0}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowSubmitSummary(false)} className="flex-1 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Resume</button>
                <button onClick={() => { setShowSubmitSummary(false); handleSubmitMock(); }} className="flex-1 py-3 rounded-xl font-bold bg-[hsl(var(--accent))] text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Confirm Submit</button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] flex items-center justify-center">
            <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Sign In</h3>
                <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <p className="text-slate-500 mb-8 leading-relaxed">Sign in to securely sync your CAT prep progress, Elo ratings, and custom flashcards across all your devices.</p>
              <button onClick={handleAuth} disabled={isAuthenticating} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm font-bold">
                {isAuthenticating ? <Loader2 className="animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              <div className="mt-6 text-center text-xs text-slate-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Cloud Sync Loading Overlay */}
      <AnimatePresence>
        {isCloudSyncing && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9000] flex items-center justify-center">
            <div className="flex flex-col items-center text-center p-8 bg-white/10 dark:bg-slate-900/50 rounded-3xl border border-white/20 shadow-2xl">
              <Loader2 size={48} className="animate-spin text-[hsl(var(--accent))] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Syncing Cloud Data</h3>
              <p className="text-slate-300 text-sm max-w-xs">Please wait while we securely retrieve your progress and configurations...</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!pendingUnfinishedTest}
        title="Unfinished Test Found"
        message="You have an unfinished mock test saved locally. Would you like to resume it where you left off?"
        confirmText="Resume Test"
        cancelText="Discard"
        onConfirm={() => {
          setCurrentTest(pendingUnfinishedTest.currentTest);
          setSelectedAnswers(pendingUnfinishedTest.selectedAnswers || {});
          setMarkedForReview(pendingUnfinishedTest.markedForReview || {});
          setTimeLeft(pendingUnfinishedTest.timeLeft || 7200);
          setActiveSection(pendingUnfinishedTest.activeSection || '');
          setActiveQuestionIdx(pendingUnfinishedTest.activeQuestionIdx || 0);
          setSectionTimes(pendingUnfinishedTest.sectionTimes || {});
          setPendingUnfinishedTest(null);
          setIsPaused(true);
          setMockPhase('test');
        }}
        onCancel={() => {
          localStorage.removeItem('cat-maester-active-test');
          setPendingUnfinishedTest(null);
        }}
      />

      <ConfirmationModal 
        isOpen={showClearHistoryConfirmationModal}
        title="Clear All Progress & Saved Tests"
        message="Are you sure you want to clear your entire progress history, including all saved offline tests and unfinished attempts? This action cannot be undone."
        confirmText="Clear Everything"
        isDestructive={true}
        onConfirm={async () => { 
          clearHistory(); 
          localStorage.removeItem('cat-maester-active-test');
          setPendingUnfinishedTest(null);
          try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            setSavedTests([]);
          } catch(e) {}
          setShowClearHistoryConfirmationModal(false); 
        }}
        onCancel={() => setShowClearHistoryConfirmationModal(false)}
      />

      <ConfirmationModal 
        isOpen={!!formulaToDelete}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard?"
        confirmText="Delete"
        isDestructive={true}
        onConfirm={async () => {
          if (formulaToDelete) {
            await deleteFormula(formulaToDelete);
            setFormulas(formulas.filter(form => form.id !== formulaToDelete));
            setFormulaToDelete(null);
          }
        }}
        onCancel={() => setFormulaToDelete(null)}
      />

      <ActivationModal
        isOpen={showActivationModal}
        error={activationError}
        onClose={() => {
          setShowActivationModal(false);
          setActivationError('');
        }}
        onActivate={(key) => {
          if (key === 'p@ssw0rd') {
            setActivated();
            setActivationError('');
            setShowActivationModal(false);
          } else {
            setActivationError('Invalid activation key. Please try again.');
          }
        }}
      />
    </m.div>
  );
}