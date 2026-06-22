import React, { useState, useEffect } from "react";
import { AlertTriangle, BookOpen, Calendar, HelpCircle, LayoutDashboard, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { Goal, DailyAction, RealityCheckReport, RebuildPlanResult } from "./types";
import Home from "./components/Home";
import AddGoal from "./components/AddGoal";
import Risks from "./components/Risks";
import Recovery from "./components/Recovery";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [reality, setReality] = useState<RealityCheckReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load baseline statistics
  const loadData = async (shouldLoadRealityCheck = true) => {
    try {
      setGeneralError(null);
      const [goalsRes, actionsRes] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/actions")
      ]);

      if (!goalsRes.ok || !actionsRes.ok) {
        throw new Error("Unable to contact Chief of Staff server. Check server state.");
      }

      const goalsData = await goalsRes.json();
      const actionsData = await actionsRes.json();

      setGoals(goalsData);
      setActions(actionsData);

      // Reality check report
      if (shouldLoadRealityCheck) {
        try {
          const realityRes = await fetch("/api/reality-check");
          if (realityRes.ok) {
            const realityData = await realityRes.json();
            setReality(realityData);
          }
        } catch (rErr) {
          console.error("Reality Check calculation delayed", rErr);
        }
      }
    } catch (err: any) {
      console.error("Baseline fetch failure", err);
      setGeneralError(err?.message || "Failed to establish communication with the backend system.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action toggle Handler
  const handleToggleAction = async (id: string) => {
    try {
      const response = await fetch(`/api/actions/${id}/toggle`, { method: "POST" });
      if (response.ok) {
        const updated = await response.json();
        setActions(prev => prev.map(a => a.id === id ? updated : a));
        if (updated.riskReductionAlert) {
          setSuccessMessage(updated.riskReductionAlert);
          setTimeout(() => {
            setSuccessMessage(prev => prev === updated.riskReductionAlert ? null : prev);
          }, 8000);
        }
        // Force an immediate reload of baseline statistics (updated risks & recalculated reality check report)
        await loadData(true);
      }
    } catch (error) {
      console.error("Action toggle failure", error);
    }
  };

  // Add Goal / Dread Intake Handler
  const handleAddGoal = async (prompt: string, manualData?: { title: string; targetDate: string; preparationNeededHours: number }) => {
    const payload = manualData ? {
      title: manualData.title,
      targetDate: manualData.targetDate,
      preparationNeededHours: manualData.preparationNeededHours
    } : { prompt };

    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || "Establishment alignment failed. Please refine your inputs.");
    }

    // Success - reload lists and force-recompute reality check
    setReality(null); // set loading indicator on reality pane
    await loadData(true);
    setActiveTab("home");
  };

  // Plan rebuilding Handler
  const handleRebuildPlan = async (excuse: string): Promise<RebuildPlanResult> => {
    const response = await fetch("/api/rebuild-week", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excuse })
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || "Recovery scheduling failed.");
    }

    const data = await response.json();
    
    // Update local state actions list immediately with restructured sets from backend persistence
    await loadData(true);
    return data;
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500 selection:text-white">
      
      {/* GLOBAL BANNER IF DEV CONNECTION DROPPED */}
      {generalError && (
        <div className="bg-red-900/60 p-3.5 border-b border-red-800 text-center text-xs font-mono text-red-100 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Connection Lost: {generalError}</span>
          <button onClick={() => loadData()} className="underline font-semibold ml-2 hover:text-white cursor-pointer hover:font-bold">Retry Sync</button>
        </div>
      )}

      {/* MINIMAL MASTER FRAME */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        
        {/* LOGO & UTILITY OVERVIEW NAV HEADER */}
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-zinc-900">
          <div 
            onClick={() => setActiveTab("home")} 
            className="flex items-center gap-2.5 cursor-pointer selection:bg-transparent group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-300">
              <span className="font-mono text-white text-base font-black">G</span>
            </div>
            <div>
              <span className="font-display font-medium text-lg leading-none block text-zinc-100 group-hover:text-white transition-colors">
                Deadline Guardian
              </span>
              <span className="text-[10px] font-mono leading-none tracking-widest text-zinc-500 uppercase">
                AI Chief of Staff
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-1 md:gap-2">
            <button
               id="nav-tab-home"
               onClick={() => setActiveTab("home")}
               className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition font-sans cursor-pointer ${activeTab === "home" ? "bg-zinc-900 text-white font-medium" : "text-zinc-550 hover:text-zinc-300"}`}
            >
              <LayoutDashboard className="w-4 h-4 text-zinc-500" />
              <span>Dashboard</span>
            </button>
            <button
               id="nav-tab-add"
               onClick={() => setActiveTab("add-goal")}
               className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition font-sans cursor-pointer ${activeTab === "add-goal" ? "bg-zinc-900 text-white font-medium" : "text-zinc-550 hover:text-zinc-300"}`}
            >
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>Add Goal</span>
            </button>
            <button
               id="nav-tab-risks"
               onClick={() => setActiveTab("risks")}
               className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition font-sans cursor-pointer ${activeTab === "risks" ? "bg-zinc-900 text-white font-medium" : "text-zinc-550 hover:text-zinc-300"}`}
            >
              <TrendingUp className="w-4 h-4 text-zinc-500" />
              <span>Risks</span>
            </button>
            <button
               id="nav-tab-recovery"
               onClick={() => setActiveTab("recovery")}
               className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm transition font-sans cursor-pointer ${activeTab === "recovery" ? "bg-zinc-900 text-white font-medium" : "text-zinc-550 hover:text-zinc-300"}`}
            >
              <RefreshCw className="w-4 h-4 text-zinc-500" />
              <span>Recovery</span>
            </button>
          </nav>
        </header>

        {/* SUCCESS/ALERT RISK NOTIFICATION BANNER */}
        {successMessage && (
          <div id="action-risk-success-banner" className="mb-6 p-4 rounded-xl bg-zinc-950 border border-emerald-900/60 flex items-center justify-between text-zinc-200 animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="text-xs md:text-sm font-sans font-medium text-emerald-400">
                {successMessage}
              </span>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="text-xs font-mono text-zinc-550 hover:text-zinc-350 cursor-pointer ml-4 pl-2 border-l border-zinc-850"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* LOADING SHIM */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-indigo-900"></div>
              <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-zinc-450 text-xs font-mono">
              Bootstrapping Core Guardian Engine...
            </p>
          </div>
        ) : (
          <main className="min-h-[500px]">
            {activeTab === "home" && (
              <Home
                goals={goals}
                actions={actions}
                reality={reality}
                onToggleAction={handleToggleAction}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === "add-goal" && (
              <AddGoal onAddGoal={handleAddGoal} />
            )}
            {activeTab === "risks" && (
              <Risks goals={goals} actions={actions} />
            )}
            {activeTab === "recovery" && (
              <Recovery onRebuildPlan={handleRebuildPlan} />
            )}
          </main>
        )}

        {/* MASTER FOOTER ACCENT */}
        <footer className="mt-20 pt-6 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-600 font-mono gap-4">
          <div className="flex items-center gap-1.5">
            <span>&copy; 2026 Deadline Guardian AI</span>
          </div>
          <div className="flex items-center gap-4">
            <span>AI Chief of Staff for High-Stakes Deadlines</span>
            <span>Secure Server-Side AI</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
