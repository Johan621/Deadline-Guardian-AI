import React, { useState } from "react";
import { AlertCircle, Clock, Hourglass, Play, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Goal, DelaySimulationResult, DailyAction } from "../types";

interface RisksProps {
  goals: Goal[];
  actions: DailyAction[];
}

export default function Risks({ goals, actions }: RisksProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<DelaySimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulateDelay = async () => {
    if (!selectedGoalId) return;
    setLoading(true);
    setSimulation(null);
    setError(null);

    try {
      const response = await fetch("/api/simulate-delay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: selectedGoalId }),
      });
      if (!response.ok) {
        throw new Error("Delay calculation failed. The Chief of Staff API was unresponsive.");
      }
      const data = await response.json();
      setSimulation(data);
    } catch (err: any) {
      setError(err?.message || "Simulation error. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const isFallbackActive = simulation?.isFallbackUsed || goals.some(g => g.isFallbackUsed);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Tab/Screen Header */}
      <div className="pb-4 border-b border-zinc-800">
        <h1 className="text-3xl font-display font-medium tracking-tight text-white">
          Risk &amp; Delay Simulation
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Calculate failure risk dynamically based on remaining preparation buffer.
        </p>
      </div>

      {isFallbackActive && (
        <div id="fallback-notification-risks" className="rounded-xl border border-amber-900/40 bg-zinc-900/60 p-4 flex items-start gap-3 text-amber-200 animate-pulse">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <h4 className="font-sans font-medium text-sm text-zinc-100">Local Intelligence Mode Active

Risk calculations and recovery planning remain fully operational.</h4>
            <p className="text-xs text-zinc-400 mt-1">Using local risk analysis.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: ACTIVE DREADS FEEDBACK */}
        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
            Active Failure Predictions
          </h2>

          {goals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
              <AlertCircle className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-medium">No tracked goals yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Add your exams or deadlines to track preparation readiness.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map(g => {
                // Calculate days left
                const tDate = new Date(g.targetDate);
                const today = new Date();
                const diffTime = Math.max(0, tDate.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                  <div key={g.id} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/10 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-white text-[15px]">{g.title}</h3>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">Target: {g.targetDate} ({diffDays} days left)</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded ${g.failureRisk > 60 ? "bg-red-950/50 text-red-400 border border-red-900/30" : g.failureRisk > 30 ? "bg-amber-950/50 text-amber-400 border border-amber-900/30" : "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"}`}>
                          {g.failureRisk}% failure risk
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="p-3.5 rounded-lg bg-zinc-950/50 divide-y divide-zinc-900/80 text-xs">
                      <div className="flex items-center justify-between pb-2 font-mono text-zinc-450">
                        <span className="flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5" /> Preparation Needed:</span>
                        <span className="font-semibold text-white">{g.preparationNeededHours} hours</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 font-mono text-zinc-450">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Allocated Hours / Day:</span>
                        <span className="font-semibold text-white">{g.availableHoursPerDay} hours</span>
                      </div>
                    </div>

                    {/* Reasoning explaining why failure risk is what it is */}
                    <div className="text-xs leading-relaxed text-zinc-300">
                      <strong className="text-zinc-400">Analysis:</strong> {g.reasoning}
                    </div>

                    {/* Trade-offs */}
                    {g.recommends && g.recommends.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Crucial Directives:</p>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-400 leading-relaxed">
                          {g.recommends.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Strategic Actions Sequence */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-900 space-y-2">
                      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">Strategic Sequence:</p>
                      <div className="space-y-1.5 pl-1 zoom-in-50">
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
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: WHAT HAPPENS IF I DELAY? SIMULATOR */}
        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-amber-400" /> What Happens If I Delay?
          </h2>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 space-y-5">
            <p className="text-zinc-300 text-sm leading-relaxed">
              Skip today's study blocks or preparation sessions? Select an active commitment and query Gemini to predict the consequence.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="goal-select" className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Select Target Commitment
                </label>
                <select
                  id="goal-select"
                  value={selectedGoalId}
                  onChange={(e) => {
                    setSelectedGoalId(e.target.value);
                    setSimulation(null);
                    setError(null);
                  }}
                  className="w-full bg-zinc-950 text-white rounded-lg border border-zinc-850 p-3.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">&mdash; Choose Goal &mdash;</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <button
                id="btn-simulate-delay"
                disabled={!selectedGoalId || loading}
                onClick={handleSimulateDelay}
                className="w-full py-3 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 font-sans text-white border border-zinc-700 transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    <span>Simulating Delay Delta...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 stroke-[3]" />
                    <span>What happens if I skip today?</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 text-xs text-left">
                {error}
              </div>
            )}

            {simulation && (
              <div className="p-5 rounded-xl border border-amber-900/45 bg-amber-950/5/10 text-left space-y-4 animate-fade-in">
                
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-mono text-zinc-500 uppercase">Risk Jump</p>
                    <p className="text-zinc-100 font-medium text-sm">Escalating Failure Odds</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-xs text-zinc-500 line-through font-mono">{simulation.originalRisk}%</span>
                    <span className="text-amber-500 text-2xl font-mono stroke-[2] font-semibold">&rarr; {simulation.newRisk}%</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 text-sm bg-zinc-950/50 p-4 rounded-lg border border-zinc-900">
                    <span className="text-xs font-mono text-amber-400/90 flex items-center gap-1 uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" /> Tactical Impact
                    </span>
                    <p className="text-zinc-200 leading-relaxed font-sans mt-1.5 leading-relaxed text-sm">
                      {simulation.impactDescription}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm bg-indigo-950/15 p-4 rounded-lg border border-indigo-900/30">
                    <span className="text-xs font-mono text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> Mitigation Directive
                    </span>
                    <p className="text-zinc-300 leading-relaxed font-sans mt-1.5 text-sm">
                      {simulation.recommendedRecoveryAction}
                    </p>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
