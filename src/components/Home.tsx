import React from "react";
import { AlertCircle, CheckCircle, Clock, Compass, HelpCircle, ShieldAlert, Zap } from "lucide-react";
import { Goal, DailyAction, RealityCheckReport } from "../types";

interface HomeProps {
  goals: Goal[];
  actions: DailyAction[];
  reality: RealityCheckReport | null;
  onToggleAction: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export default function Home({ goals, actions, reality, onToggleAction, onNavigate }: HomeProps) {
  const pendingActions = actions.filter(a => !a.completed);
  const completedActions = actions.filter(a => a.completed);

  // Select Today's Best Action (Uncompleted 'highest' or 'high' impact, or first available)
  const bestAction = pendingActions.find(a => a.impact === "highest") || 
                     pendingActions.find(a => a.impact === "high") || 
                     pendingActions[0];

  const isFallbackActive = reality?.isFallbackUsed || goals.some(g => g.isFallbackUsed);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Visual Header / Welcome Hero */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-white">
            Chief of Staff
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Preventing failure before it happens.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0 text-xs px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-900 text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          GUARDIAN SYSTEM ONLINE
        </div>
      </div>

      {isFallbackActive && (
        <div id="fallback-notification-card" className="rounded-xl border border-amber-900/40 bg-zinc-900/60 p-4 flex items-start gap-3 text-amber-200 animate-pulse">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <h4 className="font-sans font-medium text-sm text-zinc-100">Local Intelligence Mode Active

Risk calculations and recovery planning remain fully operational.</h4>
            <p className="text-xs text-zinc-400 mt-1">Using local risk analysis.</p>
          </div>
        </div>
      )}

      {/* TODAY'S BEST ACTION - LARGE HIGHLIGHT CARD */}
      <section>
        <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-3">
          Today's Best Action &mdash; Do This Next
        </h2>
        {bestAction ? (
          <div className="relative overflow-hidden rounded-2xl border border-indigo-900/50 bg-gradient-to-br from-indigo-950/20 via-zinc-900/60 to-zinc-950 p-6 md:p-8 shadow-2xl transition hover:border-indigo-800">
            {/* Absolute accent glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider bg-indigo-900/40 text-indigo-300 border border-indigo-800/40">
                    <Zap className="w-3.5 h-3.5" /> High Impact
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    Goal: {bestAction.goalTitle}
                  </span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight leading-snug">
                  {bestAction.title}
                </h3>
                
                <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    Est. Time: {bestAction.durationMinutes} min
                  </span>
                  <span>&bull;</span>
                  <span>Highest leverage preparation right now</span>
                </div>
              </div>

              <div>
                <button
                  id={`btn-complete-action-${bestAction.id}`}
                  onClick={() => onToggleAction(bestAction.id)}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-medium transition cursor-pointer font-sans bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-lg w-full md:w-auto"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
            <CheckCircle className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-medium">All high-impact actions for today are complete!</p>
            <p className="text-xs text-zinc-600 mt-1">Ready to tackle new threats?</p>
            <button
              id="btn-navigate-add-goal"
              onClick={() => onNavigate("add-goal")}
              className="mt-4 inline-flex items-center gap-2 text-xs text-white hover:text-indigo-400 underline font-mono cursor-pointer"
            >
              Add another dread
            </button>
          </div>
        )}
      </section>

      {/* CORE STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REALITY CHECK REPORT PANEL */}
        <section className="lg:col-span-7 space-y-3">
          <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
            Reality Check &mdash; Strategy Console
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-6">
            {reality ? (
              <>
                {/* 1. CAPACITY METRIC HIGHLIGHTS */}
                <div id="preparation-capacity-card" className="border-b border-zinc-850 pb-5">
                  <h3 className="text-xs font-mono tracking-widest text-zinc-400 uppercase mb-4 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" /> Preparation Capacity
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1 p-3 rounded-lg bg-zinc-950/40 border border-zinc-905">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Required Hours</span>
                      <span className="text-xl font-mono text-zinc-100 font-medium">{reality.totalRequiredEffortHours} hrs</span>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-zinc-950/40 border border-zinc-905">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Available Hours</span>
                      <span className="text-xl font-mono text-zinc-100 font-medium">{reality.totalAvailableHours} hrs</span>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-zinc-950/40 border border-zinc-905">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                        Capacity Deficit/Surplus
                      </span>
                      <span className={`text-xl font-mono font-medium ${reality.totalAvailableHours - reality.totalRequiredEffortHours < 0 ? "text-red-400" : "text-emerald-400"}`}>
                        {reality.totalAvailableHours - reality.totalRequiredEffortHours > 0 ? "+" : ""}{reality.totalAvailableHours - reality.totalRequiredEffortHours} Hours
                      </span>
                    </div>
                    <div className="space-y-1 p-3 rounded-lg bg-zinc-950/40 border border-zinc-905">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Status</span>
                      <span className={`inline-block text-xs font-mono font-bold px-2 py-1 rounded mt-1.5 ${
                        (reality.totalAvailableHours - reality.totalRequiredEffortHours) < 0 
                          ? "bg-red-950/60 text-red-500 border border-red-900/40 animate-pulse" 
                          : (reality.totalAvailableHours - reality.totalRequiredEffortHours) <= 5
                          ? "bg-amber-950/60 text-amber-500 border border-amber-900/40"
                          : "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40"
                      }`}>
                        {(reality.totalAvailableHours - reality.totalRequiredEffortHours) < 0 
                          ? "OVERLOADED" 
                          : (reality.totalAvailableHours - reality.totalRequiredEffortHours) <= 5
                          ? "AT RISK"
                          : "SURVIVABLE"
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. CHIEF OF STAFF DIAGNOSIS & REASONING */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Overall Assessment</span>
                  <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-850 text-sm text-zinc-350 leading-relaxed italic">
                    &ldquo;{reality.textFeedback}&rdquo;
                  </div>
                </div>

                {/* 3. DECISIONS & RECOMMENDATIONS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                  
                  {/* Prioritize Column */}
                  <div className="space-y-3 p-4 rounded-xl bg-zinc-950/30 border border-zinc-850/60">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
                      <Compass className="w-3.5 h-3.5" /> High-Leverage Priorities
                    </span>
                    {reality.prioritizedGoals.length > 0 ? (
                      <div className="space-y-2.5 text-xs">
                        {reality.prioritizedGoals.map((g, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <span className="font-medium text-white block">&bull; {g.title}</span>
                            <span className="text-zinc-400 pl-3 block leading-relaxed">{g.reason}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 leading-relaxed italic">No active priority targets registered.</p>
                    )}
                  </div>

                  {/* Delay tradeoff Column */}
                  <div className="space-y-3 p-4 rounded-xl bg-zinc-950/30 border border-zinc-850/60">
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" /> Defended Tradeoffs (Delay)
                    </span>
                    {reality.delayedGoals.length > 0 ? (
                      <div className="space-y-2.5 text-xs">
                        {reality.delayedGoals.map((dg, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <span className="font-medium text-zinc-200 block">&bull; Postpone {dg.title}</span>
                            <span className="text-zinc-400 pl-3 block leading-relaxed">{dg.delayReason}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 leading-relaxed italic">No postponement suggested. Capacity is preserved.</p>
                    )}
                  </div>

                </div>

                {/* 4. EXPECTED SUCCESS RATE FOOTER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-850 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-700 flex items-center justify-center font-mono font-semibold text-white">
                      {reality.overallSuccessProbability}%
                    </div>
                    <div>
                      <span className="font-medium text-zinc-200 block">Expected Success Rate</span>
                      <span className="text-[11px] text-zinc-500">Based on preparation capacity metrics</span>
                    </div>
                  </div>

                  <button
                    id="btn-trigger-recovery-rebuild"
                    onClick={() => onNavigate("recovery")}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-white rounded-lg font-mono text-xs cursor-pointer border border-zinc-700 transition"
                  >
                    Adjust / Recover Plan &rarr;
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-800"></div>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-xs text-zinc-400 font-mono">Chief of Staff modeling available capacity...</p>
              </div>
            )}
          </div>
        </section>

        {/* FAILURE RISKS BREAKDOWN */}
        <section className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
            Failure Risk Engine
          </h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
            {goals.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">
                <AlertCircle className="w-8 h-8 mx-auto stroke-1" />
                <p className="text-xs font-mono mt-2">No tracked goals yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {goals.map(g => (
                  <div key={g.id} className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 transition hover:border-zinc-800">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white text-sm truncate">{g.title}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${g.failureRisk > 60 ? "bg-red-950/50 text-red-400 border border-red-900/40" : g.failureRisk > 30 ? "bg-amber-950/50 text-amber-400 border border-amber-900/40" : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/40"}`}>
                        {g.failureRisk}% failure risk
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4 text-[11px] font-mono text-zinc-400">
                      <span>Needed: {g.preparationNeededHours} hrs</span>
                      <span>Target: {g.targetDate}</span>
                    </div>

                    {/* Reasoning brief */}
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed italic">
                      &bull; {g.reasoning}
                    </p>

                    {/* Strategic Actions Sequence */}
                    <div className="mt-4 pt-3 border-t border-zinc-900 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block">
                        Strategic Sequence
                      </span>
                      <div className="space-y-1.5 pl-1">
                        {actions.filter(act => act.goalId === g.id).map((act) => (
                          <div 
                            key={act.id} 
                            className={`flex items-center justify-between text-xs gap-3 ${act.completed ? 'text-zinc-550' : 'text-zinc-300'}`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full ${act.completed ? 'bg-zinc-700' : 'bg-indigo-500'}`} />
                              <span className={`truncate ${act.completed ? 'line-through' : ''}`}>
                                {act.title}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-zinc-550 flex-shrink-0">{act.durationMinutes}m</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  id="btn-nav-risks"
                  onClick={() => onNavigate("risks")}
                  className="w-full text-center py-2.5 text-xs text-zinc-400 hover:text-white font-mono bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                >
                  Explore Risks & Delay Simulation &rarr;
                </button>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* TODAY'S GENERAL ACTIONS LAYOUT */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Daily Leveraging Matrix ({actions.length} activities logged)
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden divide-y divide-zinc-850">
          {actions.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 text-sm">
              No tactical actions seeded yet. Add a deadline or rebuilt plan.
            </div>
          ) : (
            actions.map(act => (
              <div 
                key={act.id} 
                className={`p-4 flex items-center justify-between gap-4 select-none transition ${act.completed ? 'bg-zinc-950/15 text-zinc-500' : 'hover:bg-zinc-900/20'}`}
              >
                <div className="flex items-center gap-3.5 truncate">
                  <button
                    id={`btn-checkbox-${act.id}`}
                    onClick={() => onToggleAction(act.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${act.completed ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-zinc-700 hover:border-zinc-500 bg-zinc-900'}`}
                  >
                    {act.completed && (
                      <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="truncate">
                    <span className={`text-[14px] font-sans block truncate ${act.completed ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
                      {act.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono truncate block">
                      Target: {act.goalTitle} &middot; {act.durationMinutes} min
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded tracking-wider ${act.impact === "highest" ? "bg-indigo-950 text-indigo-400 border border-indigo-900" : act.impact === "high" ? "bg-amber-950 text-amber-400 border border-amber-900" : "bg-zinc-800 text-zinc-400"}`}>
                    {act.impact} leverage
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
