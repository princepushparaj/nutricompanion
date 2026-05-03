import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Droplets, 
  Settings2,
  BarChart2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface WaterTrackerProps {
  current: number;
  goal: number;
  onUpdate: (val: number) => void;
  onGoalUpdate: (val: number) => void;
  history: any[];
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({ 
  current, 
  goal, 
  onUpdate, 
  onGoalUpdate,
  history 
}) => {
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);

  const percentage = Math.min((current / goal) * 100, 100);

  const handleGoalSubmit = () => {
    onGoalUpdate(tempGoal);
    setShowGoalEdit(false);
  };

  const chartData = [...history].reverse().map(log => ({
    date: log.date,
    intake: log.waterIntakeMl,
    goal: log.waterGoalMl,
  }));

  return (
    <div className="glass-card p-8 h-full flex flex-col items-center relative overflow-hidden group">
      <div className="w-full flex justify-between items-center mb-10 relative z-10">
        <button 
          onClick={() => setShowHistory(true)}
          className="p-3 rounded-2xl bg-white/50 text-stone-400 hover:text-primary hover:bg-white/80 transition-all duration-300"
        >
          <BarChart2 size={20} />
        </button>
        <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Droplets className="text-blue-500" size={18} />
          </div>
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-500">Hydration</h3>
        </div>
        <button 
          onClick={() => setShowGoalEdit(true)}
          className="p-3 rounded-2xl bg-white/50 text-stone-400 hover:text-primary hover:bg-white/80 transition-all duration-300"
        >
          <Settings2 size={20} />
        </button>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-48 h-48 flex items-center justify-center animate-soft-float">
          <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-stone-100/50"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={552.9}
              initial={{ strokeDashoffset: 552.9 }}
              animate={{ strokeDashoffset: 552.9 - (552.9 * percentage) / 100 }}
              className="text-blue-500 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-serif italic text-primary"
            >
              {(current / 1000).toFixed(1)}L
            </motion.span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mt-2">Goal: {(goal / 1000).toFixed(1)}L</span>
          </div>
        </div>

        <div className="mt-12 flex gap-8">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onUpdate(Math.max(0, current - 250))}
            className="p-5 rounded-[2rem] bg-white/50 text-stone-600 hover:bg-white/80 transition-all shadow-sm border border-white/40"
          >
            <Minus size={24} />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onUpdate(current + 250)}
            className="p-5 rounded-[2rem] bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
          >
            <Plus size={24} />
          </motion.button>
        </div>
      </div>
      
      {/* Background wave effect */}
      <motion.div 
        initial={{ height: 0 }}
        animate={{ height: `${percentage}%` }}
        className="absolute bottom-0 left-0 right-0 bg-blue-400/5 transition-all duration-1000 ease-out pointer-events-none"
      />

      {/* Goal Edit Modal */}
      <AnimatePresence>
        {showGoalEdit && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-primary">Set Daily Goal</h3>
                <button onClick={() => setShowGoalEdit(false)} className="p-2 text-stone-400"><X size={20}/></button>
              </div>
              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">{(tempGoal / 1000).toFixed(1)}</span>
                  <span className="text-lg text-stone-400 ml-1">Liters</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="5000" 
                  step="100"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <button 
                  onClick={handleGoalSubmit}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-medium shadow-lg hover:bg-stone-700 transition-all"
                >
                  Save New Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl flex flex-col h-[500px]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif italic text-primary">Hydration History</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 text-stone-400"><X size={20}/></button>
              </div>
              
              <div className="flex-1 min-h-0 w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(str) => format(parseISO(str), 'EE')}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#A8A29E' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-2xl shadow-xl border-none text-[10px] space-y-1">
                              <p className="font-bold text-stone-400 uppercase tracking-tighter">
                                {format(parseISO(data.date), 'PPPP')}
                              </p>
                              <p className="text-blue-500 font-bold text-sm">
                                {(data.intake / 1000).toFixed(1)}L / {(data.goal / 1000).toFixed(1)}L
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="intake" radius={[10, 10, 10, 10]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.intake >= entry.goal ? '#3B82F6' : '#93C5FD'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {history.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl">
                    <div>
                      <p className="text-xs font-bold text-stone-800">{format(parseISO(log.date), 'MMM d, yyyy')}</p>
                      <p className="text-[10px] text-stone-400 uppercase mt-0.5">
                        {log.waterIntakeMl >= log.waterGoalMl ? 'Goal Met' : 'Incomplete'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{(log.waterIntakeMl / 1000).toFixed(1)}L</p>
                      <p className="text-[10px] text-stone-400">of {(log.waterGoalMl / 1000).toFixed(1)}L</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
