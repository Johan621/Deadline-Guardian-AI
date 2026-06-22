import React, { useState } from "react";
import { AlertCircle, ArrowRight, BrainCircuit, Calendar, HelpCircle, Inbox, ShieldAlert, Sparkles } from "lucide-react";

interface AddGoalProps {
  onAddGoal: (prompt: string, manualData?: { title: string; targetDate: string; preparationNeededHours: number }) => Promise<void>;
}

export default function AddGoal({ onAddGoal }: AddGoalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Manual fallback fields
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualPrep, setManualPrep] = useState("");

  const templates = [
    { text: "DBMS exam in 5 days, behind on SQL", label: "DBMS exam in 5 days" },
    { text: "Placement interview next Monday, totally unprepared", label: "Placement interview next Monday" },
    { text: "Hackathon submission next week, no database backend built", label: "Hackathon submission next week" },
    { text: "Project presentation tomorrow morning, slides unfinished", label: "Project presentation tomorrow" },
    { text: "Resume update by Friday to apply for companies", label: "Resume update by Friday" }
  ];

  const handleApplyTemplate = (text: string) => {
    setPrompt(text);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (showManual) {
        if (!manualTitle || !manualDate || !manualPrep) {
          throw new Error("Please complete all manual goal fields.");
        }
        const prepNum = parseFloat(manualPrep);
        if (isNaN(prepNum) || prepNum <= 0) {
          throw new Error("Preparation hours must be a positive number.");
        }
        await onAddGoal("", {
          title: manualTitle,
          targetDate: manualDate,
          preparationNeededHours: prepNum
        });
      } else {
        if (!prompt || prompt.trim().length < 5) {
          throw new Error("Please write more details on what you are worried about.");
        }
        await onAddGoal(prompt);
      }
      setSuccess(true);
      setPrompt("");
      setManualTitle("");
      setManualDate("");
      setManualPrep("");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during database alignment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 animate-fade-in">
      
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-medium tracking-tight text-white">
          What are you worried about?
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
          The Guardian will soberly calculate preparation hours vs remaining days, evaluate failure risk, and build a recovery plan.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-6">
        
        {/* Switch tab */}
        <div className="flex border-b border-zinc-800 pb-2.5 gap-6">
          <button
            id="tab-btn-natural"
            onClick={() => setShowManual(false)}
            className={`text-xs font-mono tracking-wider uppercase pb-1.5 transition border-b-2 cursor-pointer ${!showManual ? 'text-indigo-400 border-indigo-500 font-semibold' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            Natural Language Diagnosis
          </button>
          <button
            id="tab-btn-manual"
            onClick={() => setShowManual(true)}
            className={`text-xs font-mono tracking-wider uppercase pb-1.5 transition border-b-2 cursor-pointer ${showManual ? 'text-indigo-400 border-indigo-500 font-semibold' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
          >
            Structured Inputs
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-900 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Commitment synchronized!</span>
                <span>The system calculated preparation capacity and added Today's Best Action.</span>
              </div>
            </div>
          )}

          {!showManual ? (
            <div className="space-y-4">
              <label htmlFor="prompt-input" className="sr-only">Your worry detail</label>
              <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Examples: 'I have a DBMS exam in 5 days and I haven't reviewed SQL transactions...' or 'Placement interview next Monday but I'm stumbling on behavioral questions...'"
                className="w-full h-36 bg-zinc-950 text-white rounded-xl border border-zinc-850 p-4 text-sm placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition leading-relaxed resize-none"
                disabled={loading}
              />

              {/* Suggestions quick items */}
              <div className="space-y-3">
                <p className="text-xs font-mono text-zinc-500">
                  Select a student or professional template to test instantly:
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((tpl, idx) => (
                    <button
                      id={`btn-example-${idx}`}
                      type="button"
                      key={idx}
                      onClick={() => handleApplyTemplate(tpl.text)}
                      className="text-xs bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white px-3 py-1.5 rounded-full border border-zinc-850 transition cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in text-left">
              <div>
                <label htmlFor="manual-title-input" className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
                  Goal / Deadline Name
                </label>
                <input
                  id="manual-title-input"
                  type="text"
                  placeholder="e.g. DBMS Exam"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-zinc-950 text-white rounded-lg border border-zinc-850 p-3 text-sm focus:outline-none focus:border-indigo-500 transition"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="manual-date-input" className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
                    Target Date
                  </label>
                  <input
                    id="manual-date-input"
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-zinc-950 text-white rounded-lg border border-zinc-850 p-3 text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="manual-prep-input" className="block text-xs font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
                    Intense Prep Needed (Hrs)
                  </label>
                  <input
                    id="manual-prep-input"
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={manualPrep}
                    onChange={(e) => setManualPrep(e.target.value)}
                    className="w-full bg-zinc-950 text-white rounded-lg border border-zinc-850 p-3 text-sm focus:outline-none focus:border-indigo-500 transition font-mono"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            id="btn-register-goal"
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-medium bg-indigo-500 hover:bg-indigo-600 font-sans text-white hover:text-zinc-100 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {loading ? (
              <>
                <BrainCircuit className="w-5 h-5 animate-pulse text-indigo-200" />
                <span>AI Chief of Staff analyzing odds...</span>
              </>
            ) : (
              <>
                <span>Register Commitment & Predict Risk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>
      </div>

    </div>
  );
}
