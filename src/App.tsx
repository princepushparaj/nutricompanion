/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Calendar, 
  PlusCircle, 
  TrendingUp, 
  User,
  Utensils,
  Droplets,
  Bell,
  LogIn,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
  Share2,
  Scale,
  Sparkles
} from 'lucide-react';
import { cn } from './lib/utils';
import { auth, signIn } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { format, startOfToday, isAfter, parse, differenceInMinutes, subMinutes, parseISO } from 'date-fns';
import { DietService, LogService, UserProfileService } from './services/firestore';
import { analyzeQuickMeal } from './services/gemini';
import { WaterTracker } from './components/WaterTracker';
import { BiometricsChart } from './components/BiometricsChart';
import { DietPlanManager, MealListItem } from './components/DietPlanManager';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Plus,
  Activity,
  Zap,
  Smartphone,
  Check,
  X
} from 'lucide-react';

// --- Notification Helpers ---

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

const sendNotification = (title: string, options?: NotificationOptions) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
};

// --- Subview Components ---

const Dashboard = ({ activePlan, activeItems, todayLog, onLogUpdate, userProfile, recentLogs, onQuickMeal, onLogActivity }: any) => {
  const today = format(new Date(), 'EEEE, do MMMM');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const nextMeal = useMemo(() => {
    if (!activeItems.length) return null;
    const now = new Date();
    return activeItems.find((item: any) => {
      const mealTime = parse(item.time, 'HH:mm', new Date());
      return isAfter(mealTime, now);
    });
  }, [activeItems]);

  const handleWaterUpdate = (newVal: number) => {
    onLogUpdate({ waterIntakeMl: newVal });
  };

  const handleWaterGoalUpdate = (newGoal: number) => {
    onLogUpdate({ waterGoalMl: newGoal });
  };

  const dailyCalories = useMemo(() => {
    const meals = Object.values(todayLog?.mealsLogged || {});
    return meals.reduce((acc: number, meal: any) => acc + (meal.calories || 0), 0);
  }, [todayLog]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-4"
    >
      <header className="flex justify-between items-start px-4 pt-4">
        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-serif italic text-primary leading-tight">Wellness Summary</h2>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1.5">{today}</p>
        </motion.div>
        <motion.div variants={itemVariants} className="flex gap-2">
           <button className="p-3 glass-card !rounded-2xl text-stone-400 hover:text-primary transition-colors">
             <Bell size={20} />
           </button>
        </motion.div>
      </header>

      {/* Hero Stats */}
      <div className="px-4 grid grid-cols-2 gap-4">
        <motion.div variants={itemVariants} className="glass-card bg-primary/90 text-white border-none p-5 flex flex-col justify-between h-44 shadow-lg shadow-stone-800/10">
           <div className="flex justify-between items-start">
             <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm">
               <Zap size={22} fill="white" className="text-white" />
             </div>
             <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">Energy</span>
           </div>
           <div>
             <p className="text-4xl font-serif italic">{dailyCalories}</p>
             <p className="text-[10px] font-bold uppercase tracking-tighter opacity-40 mt-1">Calories Consumed</p>
           </div>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card bg-accent/90 text-white border-none p-5 flex flex-col justify-between h-44 shadow-lg shadow-accent/10">
           <div className="flex justify-between items-start">
             <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-sm text-white">
               <Activity size={22} />
             </div>
             <button 
               onClick={onLogActivity}
               className="p-1 px-2 rounded-lg bg-white/10 text-[9px] uppercase font-bold tracking-widest hover:bg-white/20 transition-colors"
             >
               Log
             </button>
           </div>
           <div>
             <p className="text-4xl font-serif italic">
               {todayLog?.activities?.reduce((acc: number, act: any) => acc + (act.caloriesBurned || 0), 0) || 0}
             </p>
             <p className="text-[10px] font-bold uppercase tracking-tighter opacity-40 mt-1">Activity Burn</p>
           </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="px-4">
        <WaterTracker 
          current={todayLog?.waterIntakeMl || 0} 
          goal={todayLog?.waterGoalMl || 2500}
          onUpdate={handleWaterUpdate}
          onGoalUpdate={handleWaterGoalUpdate}
          history={recentLogs || []}
        />
      </motion.div>

      {nextMeal && (
        <motion.section variants={itemVariants} className="px-4">
          <div className="glass-card bg-white/40 border-dashed border-stone-300 p-8">
            <div className="flex items-center gap-2 text-accent text-[10px] font-bold uppercase tracking-widest mb-4">
              <Sparkles size={14} />
              <span>Next Planned Meal</span>
            </div>
            <h3 className="text-3xl font-serif italic text-primary leading-tight">{nextMeal.description}</h3>
            
            <div className="flex gap-4 mt-6">
              {nextMeal.calories && (
                <div className="flex flex-col">
                  <span className="text-[9px] text-stone-400 font-bold uppercase leading-none">Est. Energy</span>
                  <span className="text-sm font-bold text-primary mt-1">{nextMeal.calories} kcal</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-stone-400 text-xs font-medium border-l border-stone-200 pl-4">
                <Clock size={14} />
                <span>{nextMeal.time}</span>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Quick Actions */}
      <motion.section variants={itemVariants} className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onQuickMeal}
            className="glass-interactive p-6 flex flex-col items-center gap-3 border-white/20"
          >
            <div className="p-3.5 rounded-[1.5rem] bg-accent/10 text-accent">
              <Utensils size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Log Quick Meal</span>
          </button>
          <button 
            onClick={() => handleWaterUpdate((todayLog?.waterIntakeMl || 0) + 250)}
            className="glass-interactive p-6 flex flex-col items-center gap-3 border-white/20"
          >
             <div className="p-3.5 rounded-[1.5rem] bg-blue-500/10 text-blue-500">
               <Droplets size={24} />
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Quick Water</span>
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
};

const DietView = ({ activePlan, activeItems, todayLog, onMealToggle }: any) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 py-6 space-y-6"
    >
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-serif italic text-primary">Your Plan</h2>
          <p className="text-stone-400 text-xs mt-1 uppercase tracking-widest">{activePlan?.name || 'No Active Plan'}</p>
        </div>
        <CheckCircle2 className="text-stone-300" size={32} />
      </motion.div>

      <motion.div variants={itemVariants}>
        {!activePlan ? (
          <DietPlanManager onPlanCreated={() => {}} />
        ) : (
          <div className="space-y-3">
            {activeItems.map((item: any) => (
              <MealListItem 
                key={item.id} 
                item={item} 
                logged={!!todayLog?.mealsLogged?.[item.id]}
                onToggle={() => onMealToggle(item.id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

const LogView = ({ todayLog, onLogUpdate, onQuickMeal }: any) => {
  const [weight, setWeight] = useState(todayLog?.weightKg || '');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 py-8 space-y-6"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-serif italic text-primary">Daily Inputs</motion.h2>
      
      <div className="grid grid-cols-1 gap-4">
        <motion.button 
          variants={itemVariants}
          onClick={onQuickMeal}
          className="glass-interactive p-8 flex items-center justify-between bg-primary/95 text-white border-none shadow-xl hover:bg-primary"
        >
          <div className="flex items-center gap-5">
            <div className="p-4 bg-accent rounded-2xl shadow-lg shadow-accent/20">
              <Plus size={24} strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-xl font-serif italic">Quick Meal AI</p>
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">AI-powered logging</p>
            </div>
          </div>
          <ChevronRight className="opacity-40" />
        </motion.button>

        <motion.div variants={itemVariants} className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 text-stone-600">
            <Scale size={20} className="text-accent" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Track Weight</h3>
          </div>
          <div className="relative">
            <input 
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.0"
              className="w-full p-6 bg-white/30 border-none rounded-[1.5rem] outline-none focus:ring-2 focus:ring-accent/20 text-3xl font-serif italic text-primary"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs uppercase tracking-widest">KG</span>
          </div>
          <button 
            onClick={() => onLogUpdate({ weightKg: parseFloat(weight) })}
            className="w-full py-5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-stone-800/10 active:scale-[0.98] transition-all"
          >
            Update Weight
          </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.button variants={itemVariants} className="glass-interactive p-6 flex flex-col items-center gap-2">
          <Utensils className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">Quick Meal</span>
        </motion.button>
        <motion.button 
          variants={itemVariants}
          onClick={() => onLogUpdate({ waterIntakeMl: (todayLog?.waterIntakeMl || 0) + 250 })}
          className="glass-interactive p-6 flex flex-col items-center gap-2 hover:bg-blue-50 transition-colors"
        >
          <Droplets className="text-blue-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Add 250ml</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

const ProfileView = ({ user, userProfile, onInstall, canInstall }: any) => {
  const handleShare = async () => {
    const report = `NutriCompanion Progress Report\nUser: ${userProfile?.displayName}\nCurrent Weight: ${userProfile?.progressData?.at(-1)?.weightKg || 'N/A'} kg\nDate: ${new Date().toLocaleDateString()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Diet Progress Report', text: report });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      alert("Report copied to clipboard: \n\n" + report);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 py-8 space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-stone-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="pfp" referrerPolicy="no-referrer" />
          ) : (
            <User size={48} className="text-stone-300" />
          )}
        </div>
        <h2 className="mt-4 text-2xl font-serif italic text-primary">{userProfile?.displayName || user?.displayName}</h2>
        <p className="text-stone-400 text-sm italic">{user?.email}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        {canInstall && (
          <button 
            onClick={onInstall}
            className="w-full p-5 glass-interactive !rounded-[1.5rem] flex items-center gap-4 bg-accent/5 border-accent/20 hover:bg-accent/10 transition-all font-bold"
          >
            <div className="p-3 rounded-2xl bg-accent text-white shadow-lg shadow-accent/20">
              <Smartphone size={22} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-stone-800">Install as App</h4>
              <p className="text-[10px] uppercase tracking-widest text-accent">Get full-screen access</p>
            </div>
            <Sparkles size={18} className="ml-auto text-accent animate-pulse" />
          </button>
        )}

        {Notification.permission !== 'granted' && (
          <button 
            onClick={() => requestNotificationPermission()}
            className="w-full p-5 glass-interactive !rounded-[1.5rem] flex items-center gap-4 bg-primary/5 border-primary/10 transition-all"
          >
            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
              <Bell size={22} />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-stone-800">Enable Reminders</h4>
              <p className="text-xs text-stone-400">Get notified for meal prep times</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-stone-300" />
          </button>
        )}

        <button 
          onClick={handleShare}
          className="w-full p-5 glass-interactive !rounded-[1.5rem] flex items-center gap-4 transition-all"
        >
          <div className="p-3 rounded-2xl bg-stone-50 text-primary">
            <Share2 size={22} />
          </div>
          <div className="text-left">
            <h4 className="font-semibold text-stone-800">Share Report</h4>
            <p className="text-xs text-stone-400">Send summary to your doctor</p>
          </div>
          <ChevronRight size={18} className="ml-auto text-stone-300" />
        </button>

        <button 
          onClick={() => signOut(auth)}
          className="w-full p-5 glass-interactive !rounded-[1.5rem] flex items-center gap-4 transition-all"
        >
          <div className="p-3 rounded-2xl bg-stone-50 text-stone-600">
            <LogOut size={22} />
          </div>
          <h4 className="font-semibold text-stone-800">Sign Out</h4>
          <ChevronRight size={18} className="ml-auto text-stone-300" />
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App Entry ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [activePlan, setActivePlan] = useState<any>(null);
  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifiedItems, setNotifiedItems] = useState<Set<string>>(new Set());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Quick Meal States
  const [showQuickMeal, setShowQuickMeal] = useState(false);
  const [mealInput, setMealInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Activity States
  const [showActivity, setShowActivity] = useState(false);
  const [activityType, setActivityType] = useState('Walking');
  const [activityDuration, setActivityDuration] = useState(30);

  const handleQuickMealSubmit = async () => {
    if (!mealInput.trim() || !user) return;
    setIsAnalyzing(true);
    try {
      const nutrition = await analyzeQuickMeal(mealInput);
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      const mealsLogged = todayLog?.mealsLogged || {};
      const mealId = `quick_${Date.now()}`;
      mealsLogged[mealId] = {
        ...nutrition,
        time: format(new Date(), 'HH:mm'),
        loggedAt: new Date().toISOString()
      };

      const updatedLog = { ...todayLog, mealsLogged };
      await LogService.saveLog(user.uid, updatedLog);
      setTodayLog(updatedLog);
      setShowQuickMeal(false);
      setMealInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleActivitySubmit = async () => {
    if (!user) return;
    const caloriesBurned = Math.round(activityDuration * (activityType === 'Walking' ? 4 : 8));
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    await LogService.logActivity(user.uid, todayStr, {
      type: activityType,
      duration: activityDuration,
      caloriesBurned
    });
    
    // Refresh log
    const updatedLog = await LogService.getLogForDate(user.uid, todayStr);
    setTodayLog(updatedLog);
    setShowActivity(false);
  };

  // Notification Effect
  useEffect(() => {
    if (!activeItems.length || typeof window === 'undefined') return;

    const checkReminders = () => {
      const now = new Date();
      activeItems.forEach((item: any) => {
        if (item.prepTimeMinutes > 0 && !notifiedItems.has(item.id)) {
          const mealTime = parse(item.time, 'HH:mm', new Date());
          const prepTime = subMinutes(mealTime, item.prepTimeMinutes);
          
          // Trigger reminder if we are at or past prep time but not past meal time
          if (now >= prepTime && now < mealTime) {
            sendNotification(`Time to prepare ${item.mealType}!`, {
              body: `${item.description} needs ${item.prepTimeMinutes} mins of prep. Meal is at ${item.time}.`,
              tag: item.id // Prevents duplicate notifications for the same ID
            });
            setNotifiedItems(prev => new Set(prev).add(item.id));
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [activeItems, notifiedItems]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    // 1. Initial Profile Fetch
    UserProfileService.getProfile(user.uid).then(profile => {
      if (profile) {
        setUserProfile(profile);
      } else {
        const initial = { displayName: user.displayName, email: user.email, progressData: [] };
        UserProfileService.updateProfile(user.uid, initial);
        setUserProfile(initial);
      }
    });

    // 2. Subscribe to Diet
    const unsub = DietService.subscribeToActivePlan(user.uid, (plan, items) => {
      setActivePlan(plan);
      setActiveItems(items);
    });

    // 3. Fetch Today's Log & Recent Logs
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    LogService.getLogForDate(user.uid, todayStr).then(log => {
      setTodayLog(log || { date: todayStr, waterIntakeMl: 0, waterGoalMl: 2500, mealsLogged: {} });
    });

    LogService.getRecentLogs(user.uid).then(logs => {
      if (logs) setRecentLogs(logs);
    });

    return () => unsub();
  }, [user]);

  const handleLogUpdate = async (updates: any) => {
    if (!user) return;
    const updated = { ...todayLog, ...updates };
    setTodayLog(updated);
    await LogService.saveLog(user.uid, updated);

    // If weight updated, sync to profile progressData
    if (updates.weightKg) {
      const newProgress = [...(userProfile.progressData || [])];
      newProgress.push({ date: new Date().toISOString(), weightKg: updates.weightKg });
      const updatedProfile = { ...userProfile, progressData: newProgress };
      setUserProfile(updatedProfile);
      await UserProfileService.updateProfile(user.uid, updatedProfile);
    }
  };

  const handleMealToggle = async (itemId: string) => {
    if (!user) return;
    const mealsLogged = { ...(todayLog.mealsLogged || {}) };
    mealsLogged[itemId] = !mealsLogged[itemId];
    handleLogUpdate({ mealsLogged });
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-warm">
      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity }}>
        <h1 className="text-4xl font-serif italic text-primary">NutriCompanion</h1>
      </motion.div>
    </div>
  );

  if (!user) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-warm p-8 text-center space-y-12">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl mx-auto flex items-center justify-center text-primary">
          <Utensils size={40} />
        </div>
        <h1 className="text-5xl font-serif italic text-primary">NutriCompanion</h1>
        <p className="text-stone-500 max-w-xs mx-auto">Your personal companion for a healthier, more vibrant lifestyle.</p>
      </div>
      
      <button 
        onClick={signIn}
        className="w-full max-w-sm py-5 bg-primary text-white rounded-3xl font-bold shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
      >
        <LogIn size={20} />
        Continue with Google
      </button>
    </div>
  );

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'diet', icon: Calendar, label: 'Diet' },
    { id: 'logs', icon: PlusCircle, label: 'Logs' },
    { id: 'progress', icon: TrendingUp, label: 'Stats' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-warm relative overflow-x-hidden">
      <main className="flex-1 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard 
                activePlan={activePlan} 
                activeItems={activeItems} 
                todayLog={todayLog} 
                onLogUpdate={handleLogUpdate}
                userProfile={userProfile}
                recentLogs={recentLogs}
                onQuickMeal={() => setShowQuickMeal(true)}
                onLogActivity={() => setShowActivity(true)}
              />
            )}
            {activeTab === 'diet' && (
              <DietView 
                activePlan={activePlan} 
                activeItems={activeItems} 
                todayLog={todayLog} 
                onMealToggle={handleMealToggle}
              />
            )}
            {activeTab === 'logs' && (
              <LogView 
                todayLog={todayLog} 
                onLogUpdate={handleLogUpdate} 
                onQuickMeal={() => setShowQuickMeal(true)}
              />
            )}
            {activeTab === 'progress' && (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="px-4 py-8 space-y-6"
              >
                <motion.h2 variants={itemVariants} className="text-2xl font-serif italic text-primary">Progress Analytics</motion.h2>
                
                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} className="text-stone-400" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Connected Devices</h3>
                    </div>
                    <button 
                      onClick={() => alert("Searching for devices...")}
                      className="text-[10px] font-bold text-accent uppercase tracking-wider"
                    >
                      Sync Now
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-6 border-white/20">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Daily Steps</p>
                       <p className="text-2xl font-serif italic text-primary">8,432</p>
                       <div className="w-full bg-stone-100 h-1 rounded-full mt-3 overflow-hidden">
                          <div className="bg-primary h-full w-[84%]" />
                       </div>
                    </div>
                    <div className="glass-card p-6 border-white/20">
                       <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">Sleep Quality</p>
                       <p className="text-2xl font-serif italic text-primary">Excellent</p>
                       <p className="text-[10px] text-stone-500 mt-2">7h 42m asleep</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Scale size={16} className="text-stone-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Weight Trend (7 Days)</h3>
                  </div>
                  <div className="glass-card p-6">
                    <BiometricsChart data={userProfile?.progressData || []} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Droplets size={16} className="text-blue-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Hydration (7 Days)</h3>
                  </div>
                  <div className="glass-card p-6">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[...recentLogs].reverse()}>
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => format(parseISO(str), 'MMM d')}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#A8A29E' }}
                          />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }}
                          />
                          <Bar dataKey="waterIntakeMl" name="Water (ml)" fill="#60A5FA" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-6 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Avg Weight</span>
                    <p className="text-2xl font-serif italic mt-1 text-primary">
                      {userProfile?.progressData?.length ? (userProfile.progressData.reduce((acc: any, curr: any) => acc + curr.weightKg, 0) / userProfile.progressData.length).toFixed(1) : '0'} kg
                    </p>
                  </div>
                  <div className="glass-card p-6 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Avg Hydration</span>
                    <p className="text-2xl font-serif italic mt-1 text-primary">
                      {recentLogs.length ? (recentLogs.reduce((acc: any, curr: any) => acc + curr.waterIntakeMl, 0) / recentLogs.length / 1000).toFixed(1) : '0'} L
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {activeTab === 'profile' && <ProfileView user={user} userProfile={userProfile} onInstall={handleInstall} canInstall={!!deferredPrompt} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Rail */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass-card !rounded-[2.5rem] p-3 flex justify-around items-center z-50 shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500",
                isActive ? "text-white bg-primary shadow-xl shadow-stone-800/20" : "text-stone-400 hover:text-stone-600 hover:bg-white/50"
              )}
            >
              <Icon size={22} />
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-accent rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
      {/* Quick Meal Modal */}
      <AnimatePresence>
        {showQuickMeal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card bg-white/95 p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif italic text-primary">Quick Meal</h3>
                <button onClick={() => setShowQuickMeal(false)} className="p-2 text-stone-400 hover:text-primary transition-colors">
                  <X size={24}/>
                </button>
              </div>
              <p className="text-sm text-stone-500 mb-6">Tell us what you ate. Our AI will estimate the nutrition for you.</p>
              <div className="space-y-6">
                <textarea 
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  placeholder="e.g. A bowl of Greek yogurt with berries and walnuts"
                  className="w-full h-32 p-5 bg-stone-50 border border-stone-100 rounded-3xl outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm resize-none"
                />
                <button 
                  onClick={handleQuickMealSubmit}
                  disabled={isAnalyzing || !mealInput.trim()}
                  className="w-full py-5 bg-primary text-white rounded-3xl font-medium shadow-xl hover:bg-stone-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={20} />
                    </motion.div>
                  ) : 'Analyze & Log'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Modal */}
      <AnimatePresence>
        {showActivity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card bg-white/95 p-8 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif italic text-primary">Log Activity</h3>
                <button onClick={() => setShowActivity(false)} className="p-2 text-stone-400"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {['Walking', 'Running', 'Cycling', 'Gym'].map(type => (
                    <button
                      key={type}
                      onClick={() => setActivityType(type)}
                      className={cn(
                        "py-4 px-2 rounded-2xl border transition-all text-xs font-bold uppercase tracking-widest",
                        activityType === type ? "bg-accent text-white border-accent shadow-lg" : "bg-white border-stone-100 text-stone-500"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 text-center">
                  <label className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Duration (Minutes)</label>
                  <p className="text-4xl font-serif italic text-primary">{activityDuration}</p>
                  <input 
                    type="range" 
                    min="5" 
                    max="180" 
                    step="5"
                    value={activityDuration}
                    onChange={(e) => setActivityDuration(parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
                <button 
                  onClick={handleActivitySubmit}
                  className="w-full py-5 bg-accent text-white rounded-3xl font-medium shadow-xl hover:bg-orange-600 transition-all"
                >
                  Save Activity
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
