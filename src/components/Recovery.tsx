import React, { useState } from "react";
import { AlertCircle, BrainCircuit, Calendar, RefreshCw, Sparkles, Zap } from "lucide-react";
import { DailyAction, RebuildPlanResult } from "../types";

interface RecoveryProps {
  onRebuildPlan: (excuse: string) => Promise<RebuildPlanResult>;
}

export default function Recovery({ onRebuildPlan }: RecoveryProps) {
  const [excuse, setExcuse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RebuildPlanResult | null>(null);

  const presets = [
    { text: "I missed all study blocks yesterday because of a family emergency.", label: "Missed blocks yesterday" },
    { text: "Sick with a fever and slept all afternoon.", label: "Sick & slept under the weather" },
    { text: "Got sucked into social media and wasted 4 hours.", label: "Got majorly distracted" },
    { text: "Got an extra shift called in at my part-time job.", label: "Part-time job extra shift" }
  ];

  const handleApplyPreset = (text: string) => {
    setExcuse(text);
    setError(null);
  };

  const handleRebuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excuse || excuse.trim().length < 5) {
      setError("Please explain what happened or select a preset to rebuild.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await onRebuildPlan(excuse);
      if (!res.success) {
        throw new Error("Rebuild request returned an error.");
      }
      setResult(res);
      setExcuse("");
    } catch (err: any) {
      setError(err?.message || "Failed to synchronize recovery state.");
    } finally {
      setLoading(false);
    }
  };

  const isFallbackActive = result?.isFallbackUsed;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 animate-fade-in text-left">
      
      {/* Visual Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-medium tracking-tight text-white">
          Recovery Center
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
          Had a setback or missed study blocks? Restructure your commitments and engineer a realistic recovery plan.
        </p>
      </div>

      {isFallbackActive && (
        <div id="fallback-notification-recovery" className="rounded-xl border border-amber-900/40 bg-zinc-900/60 p-4 flex items-start gap-3 text-amber-200 animate-pulse">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <h4 className="font-sans font-medium text-sm text-zinc-100">Local Intelligence Mode Active

Risk calculations and recovery planning remain fully operational.</h4>
            <p className="text-xs text-zinc-400 mt-1">Using local risk analysis.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-6">
        <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Rebuild My Week
        </h2>

        <form onSubmit={handleRebuild} className="space-y-5">
          
          {error && (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-900 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <label htmlFor="recovery-reason-input" className="block text-xs font-mono text-zinc-500 uppercase tracking-wider">
              Describe what went wrong:
            </label>
            <textarea
              id="recovery-reason-input"
              value={excuse}
              onChange={(e) => setExcuse(e.target.value)}
              placeholder="e.g. I got sick yesterday and couldn't complete DBMS relational algebra work..."
              className="w-full h-28 bg-zinc-950 text-white rounded-xl border border-zinc-850 p-4 text-sm placeholder-zinc-650 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-none"
              disabled={loading}
            />

            {/* Presets */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-mono text-zinc-500 block">Select a standard setback preset:</span>
              <div className="flex flex-wrap gap-2">
                {presets.map((p, idx) => (
                  <button
                    id={`btn-preset-${idx}`}
                    type="button"
                    key={idx}
                    onClick={() => handleApplyPreset(p.text)}
                    className="text-xs bg-zinc-950 hover:bg-zinc-920 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-850 transition cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            id="btn-trigger-rebuild"
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-750 font-sans text-white hover:text-zinc-100 border border-zinc-700 transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-300" />
                <span>Engineering Recovery Actions...</span>
              </>
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" />
                <span>Restructure Plans & Recover State</span>
              </>
            )}
          </button>

        </form>

        {/* RESULTS CARDS */}
        {result && (
          <div className="p-6 rounded-xl border border-indigo-900/50 bg-indigo-950/5/10 text-left space-y-5 animate-fade-in">
            
            {/* Header Success Probability */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-mono text-zinc-500 uppercase">Feasibility Improvement</span>
                <p className="text-zinc-100 font-medium text-sm">Plan Successfully Restructured</p>
              </div>
              <div className="text-right flex items-center gap-2">
                <span className="text-xs text-zinc-500 line-through font-mono">Original Chance: {result.originalSuccessProbability}%</span>
                <span className="text-emerald-400 text-2xl font-mono stroke-[2] font-semibold">&rarr; {result.rebuiltSuccessProbability}%</span>
              </div>
            </div>

            {/* Strategy text */}
            <div className="space-y-1.5 text-sm">
              <span className="text-xs font-mono text-indigo-400/90 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /> Adaptive Strategy
              </span>
              <p className="text-zinc-200 leading-relaxed font-sans italic bg-zinc-950/50 p-4 rounded-lg border border-zinc-900 leading-relaxed text-sm">
                &ldquo;{result.recoveryStrategy}&rdquo;
              </p>
            </div>

            {/* Restructured Actions List */}
            {result.updatedActions.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono text-zinc-405 uppercase tracking-wider block">
                  Restructured Leverage Actions:
                </span>
                <div className="space-y-2.5">
                  {result.updatedActions.map((act, index) => (
                    <div key={index} className="p-3.5 bg-zinc-950/60 border border-zinc-900 rounded-lg flex items-center justify-between gap-4 text-xs font-mono">
                      <div className="space-y-1">
                        <span className="text-zinc-200 font-medium font-sans text-xs block">{act.title}</span>
                        <span className="text-zinc-550 text-[10px]">Duration: {act.durationMinutes} min &bull; Goal: {act.goalTitle}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-900/30">
                        {act.impact} Leverage
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
