import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { parseDietPlan } from '../services/gemini';
import { DietService } from '../services/firestore';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Image as ImageIcon,
  FileSearch,
  X
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

interface DietPlanManagerProps {
  onPlanCreated: () => void;
}

export const DietPlanManager: React.FC<DietPlanManagerProps> = ({ onPlanCreated }) => {
  const [inputText, setInputText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*') && file.type !== 'application/pdf') {
      setError("Please select an image or PDF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedFile({
        data: event.target?.result as string,
        mimeType: file.type,
        name: file.name
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (!inputText.trim() && !selectedFile) return;
    setIsParsing(true);
    setError(null);
    try {
      const parsed = await parseDietPlan(inputText, selectedFile || undefined);
      if (auth.currentUser) {
        await DietService.savePlan(auth.currentUser.uid, {
          name: parsed.planName || "Generated Plan",
          active: true
        }, parsed.items);
        onPlanCreated();
      }
    } catch (err) {
      setError("Failed to parse diet plan. Please try again.");
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-serif italic text-primary">Import Diet Plan</h3>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">AI-Powered Extraction</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-2xl bg-stone-50 text-stone-600 hover:bg-stone-100 transition-colors shadow-sm"
          >
            <Upload size={20} />
          </motion.button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,.pdf"
          />
        </div>
        
        {selectedFile && (
          <div className="mb-6 p-4 bg-white/50 border border-white/80 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-stone-800/20">
              {selectedFile.mimeType === 'application/pdf' ? <FileSearch size={18} /> : <ImageIcon size={18} />}
            </div>
            <span className="text-sm font-medium text-primary truncate flex-1">{selectedFile.name}</span>
            <button 
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-stone-100 rounded-full transition-all"
            >
              <X size={16} className="text-stone-400" />
            </button>
          </div>
        )}

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Or paste your routine here... e.g. 8am: Boiled egg..."
          className="w-full h-40 p-5 rounded-3xl bg-white/30 border border-transparent focus:bg-white/50 focus:border-accent/20 outline-none transition-all resize-none text-sm mb-6 placeholder:text-stone-400"
        />

        {error && (
          <div className="mb-6 flex items-center gap-3 text-red-500 text-xs bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
            <AlertCircle size={14} className="shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={isParsing || (!inputText.trim() && !selectedFile)}
          className="w-full py-5 bg-primary text-white rounded-3xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-stone-800/10 hover:bg-stone-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
        >
          {isParsing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Sparkles size={20} />
            </motion.div>
          ) : (
            <>
              <Sparkles size={20} />
              Build Smart Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface MealListItemProps {
  item: any;
  logged: boolean;
  onToggle: () => void;
}

export const MealListItem: React.FC<MealListItemProps> = ({ item, logged, onToggle }) => {
  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className={cn(
        "glass-interactive p-6 flex items-start gap-4 mb-4",
        logged ? "opacity-60 grayscale-[0.5]" : ""
      )}
      onClick={onToggle}
    >
      <div className="mt-1">
        <AnimatePresence mode="wait">
          {logged ? (
            <motion.div
              key="checked"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <CheckCircle2 className="text-green-500" size={26} />
            </motion.div>
          ) : (
            <motion.div
              key="unchecked"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="w-6.5 h-6.5 rounded-full border-2 border-stone-200"
            />
          )}
        </AnimatePresence>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <span className="text-[10px] uppercase tracking-widest text-accent font-bold">{item.mealType}</span>
          <span className="text-[10px] text-stone-400 flex items-center gap-1.5 font-bold uppercase">
            <Clock size={12} />
            {item.time}
          </span>
        </div>
        <h4 className="text-base font-serif italic text-primary mt-1.5">{item.description}</h4>
        
        {(item.calories || item.protein || item.carbs || item.fats) && (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {item.calories && (
              <span className="px-3 py-1 rounded-full bg-white/50 border border-white/80 text-[10px] font-bold text-stone-500 uppercase tracking-tight">
                {item.calories} kcal
              </span>
            )}
            <div className="flex gap-2">
              {item.protein && (
                <div className="flex flex-col">
                  <span className="text-[8px] text-stone-400 uppercase font-bold leading-none">Prot</span>
                  <span className="text-[11px] font-bold text-primary mt-0.5">{item.protein}g</span>
                </div>
              )}
              {item.carbs && (
                <div className="flex flex-col border-l border-stone-100 pl-2">
                  <span className="text-[8px] text-stone-400 uppercase font-bold leading-none">Carb</span>
                  <span className="text-[11px] font-bold text-primary mt-0.5">{item.carbs}g</span>
                </div>
              )}
              {item.fats && (
                <div className="flex flex-col border-l border-stone-100 pl-2">
                  <span className="text-[8px] text-stone-400 uppercase font-bold leading-none">Fat</span>
                  <span className="text-[11px] font-bold text-primary mt-0.5">{item.fats}g</span>
                </div>
              )}
            </div>
          </div>
        )}

        {item.prepTimeMinutes > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase tracking-wider">
            <Clock size={12} />
            Prep: {item.prepTimeMinutes}m
          </div>
        )}
      </div>
    </motion.div>
  );
};
