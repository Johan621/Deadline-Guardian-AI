import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { Goal, DailyAction, RealityCheckReport } from "./src/types.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry User-Agent as per skills guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper: Gracefully log API errors without dumping raw JSON errors
function logFriendlyError(context: string, error: any) {
  const errStr = String(error?.message || error || "");
  const isQuota = errStr.includes("quota") || 
                  errStr.includes("429") || 
                  errStr.includes("RESOURCE_EXHAUSTED") ||
                  (error?.status === 429) ||
                  (error?.code === 429);
  
  if (isQuota) {
    console.warn(`[Chief of Staff Guard] ${context}: Gemini API quota exceeded or request limits reached. Smoothly switching to localized calculation engines.`);
  } else {
    const errorMsg = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
    const truncated = errorMsg.length > 150 ? errorMsg.substring(0, 147) + "..." : errorMsg;
    console.warn(`[Chief of Staff Guard] ${context}: ${truncated}`);
  }
}

// Helper: Read Database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    // Return sample seeded database for a stellar student-centric experience right out of the box!
    const defaultData = {
      goals: [
        {
          id: "seed-dbms-exam",
          title: "DBMS exam in 5 days",
          category: "exam",
          targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          preparationNeededHours: 12,
          availableHoursPerDay: 1.5,
          notes: "Need to clear relational algebra and transactions. Sinking grade if I fail.",
          failureRisk: 68,
          expectedSuccessProbability: 32,
          reasoning: "Available preparation time (7.5 hours) is substantially below the required 12 hours of focused effort.",
          recommends: [
            "De-prioritize social events for the next 4 days.",
            "Complete core relational database questions first.",
            "Postpone resume formatting updates until after the exam."
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: "seed-placement",
          title: "Placement interview next Monday",
          category: "placement",
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          preparationNeededHours: 8,
          availableHoursPerDay: 2,
          notes: "Mock interviews and behavioral questions.",
          failureRisk: 35,
          expectedSuccessProbability: 65,
          reasoning: "Reasonable available prep time (14 available hours vs 8 hours needed), but high risk if daily discipline slips.",
          recommends: [
            "Conduct structured 2-hour daily mock run throughs.",
            "Prioritize top behavioral STAR examples."
          ],
          createdAt: new Date().toISOString()
        }
      ] as Goal[],
      actions: [
        {
          id: "act-dbms-1",
          goalId: "seed-dbms-exam",
          goalTitle: "DBMS exam in 5 days",
          title: "1. Relational Algebra",
          durationMinutes: 90,
          impact: "highest",
          completed: false,
          scheduledDate: new Date().toISOString().split("T")[0]
        },
        {
          id: "act-dbms-2",
          goalId: "seed-dbms-exam",
          goalTitle: "DBMS exam in 5 days",
          title: "2. Normalization",
          durationMinutes: 60,
          impact: "high",
          completed: false,
          scheduledDate: new Date().toISOString().split("T")[0]
        },
        {
          id: "act-dbms-3",
          goalId: "seed-dbms-exam",
          goalTitle: "DBMS exam in 5 days",
          title: "3. Previous Year Questions",
          durationMinutes: 45,
          impact: "medium",
          completed: false,
          scheduledDate: new Date().toISOString().split("T")[0]
        },
        {
          id: "act-placement-1",
          goalId: "seed-placement",
          goalTitle: "Placement interview next Monday",
          title: "1. Core CS Revision",
          durationMinutes: 90,
          impact: "highest",
          completed: false,
          scheduledDate: new Date().toISOString().split("T")[0]
        },
        {
          id: "act-placement-2",
          goalId: "seed-placement",
          goalTitle: "Placement interview next Monday",
          title: "2. DSA Practice",
          durationMinutes: 60,
          impact: "high",
          completed: false,
          scheduledDate: new Date().toISOString().split("T")[0]
        },
        {
          id: "act-placement-3",
          goalId: "seed-placement",
          goalTitle: "Placement interview next Monday",
          title: "3. Mock Interview",
          durationMinutes: 45,
          impact: "medium",
          completed: false,
          scheduledDate: new Date().toISOString().split("T")[0]
        }
      ] as DailyAction[],
      realityReport: null as RealityCheckReport | null
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse db.json, returning empty structure", err);
    return { goals: [], actions: [], realityReport: null };
  }
}

// Helper: Write Database
function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Ensure database file is generated immediately stateful
let dbState = readDB();

// API Endpoints

// 1. GET goals
app.get("/api/goals", (req, res) => {
  const db = readDB();
  res.json(db.goals);
});

// 2. DELETE goal
app.delete("/api/goals/:id", (req, res) => {
  const db = readDB();
  db.goals = db.goals.filter((g: any) => g.id !== req.params.id);
  db.actions = db.actions.filter((a: any) => a.goalId !== req.params.id);
  // Reset reality check to trigger update next load
  db.realityReport = null;
  writeDB(db);
  res.json({ success: true });
});

// 3. POST add goal
app.post("/api/goals", async (req, res) => {
  const { prompt, title: manualTitle, targetDate: manualDate, preparationNeededHours: manualPrep } = req.body;
  
  if (!prompt && !manualTitle) {
    return res.status(400).json({ error: "Goal details or a natural language prompt is required" });
  }

  const todayDate = new Date().toISOString().split("T")[0];
  const targetDateFinal = manualDate || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const goalId = "goal-" + Math.random().toString(36).substring(2, 9);
  const actionId = "act-" + Math.random().toString(36).substring(2, 9);

  try {
    // Build standard prompt for Chief of Staff
    let systemInstruction = `You are an elite, sober, realistic chief of staff for students and professionals. Your job is NOT to organize tasks, but to prevent failure before it happens. Be completely honest in predicting failure. Determine required preparation effort, assess available capacity based on the target date, and suggest smart priorities. Always provide exactly 3 distinct, tactical, chronological strategic actions (duration between 30 and 120 minutes) that the user must take in sequence to guarantee success.`;

    let userPrompt = "";
    if (prompt) {
      userPrompt = `User's goal/deadline in natural language: "${prompt}". Today is ${todayDate}.
Analyze this goal. Extract or estimate its parameters, calculate the exact failure risk, outline clear reasoning, recommend 2-3 stark priorities, and suggest exactly 3 progressive strategic actions to prepare for this goal/deadline in sequence. Do NOT prepend numbers to the action titles.`;
    } else {
      userPrompt = `The user is registering a goal: "${manualTitle}", with target date: "${manualDate}" and needs intensive preparation of ${manualPrep} hours. Today is ${todayDate}.
Analyze this goal, estimate the available preparation time, determine the failure risk (0-100), explain the reasoning soberly, give 2-3 tradeoffs, and recommend exactly 3 progressive strategic actions to prepare for this goal/deadline in sequence. Do NOT prepend numbers to the action titles.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Descriptive name summarizing the goal/deadline (do NOT invent branding)" },
            category: {
              type: Type.STRING,
              enum: ["exam", "assignment", "project", "hackathon", "placement", "meeting", "interview", "certification", "deadline"]
            },
            preparationNeededHours: { type: Type.INTEGER, description: "Total intense preparation hours realistically required" },
            availableHoursPerDay: { type: Type.INTEGER, description: "Typical daily study/prep hours they should dedicate to this" },
            failureRisk: { type: Type.INTEGER, description: "Honest, realistic percentage of failure risk (0-100) based on effort vs days remaining" },
            reasoning: { type: Type.STRING, description: "Sober analysis explaining how you calculated this exact risk percent" },
            recommends: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 highly critical priorities or strategic trade-offs"
            },
            strategicActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Action step name. Must be clear, tactical, and direct (e.g. 'Complete Relational Algebra'). Do not prepend numbers." },
                  durationMinutes: { type: Type.INTEGER, description: "Duration in minutes (e.g. 45, 60, 90, 120)" },
                  impact: { type: Type.STRING, enum: ["highest", "high", "medium", "low"], description: "Leverage level" }
                },
                required: ["title", "durationMinutes", "impact"]
              },
              description: "Exactly 3 progressive strategic actions to prepare for this goal/deadline in sequence"
            }
          },
          required: ["title", "category", "preparationNeededHours", "availableHoursPerDay", "failureRisk", "reasoning", "recommends", "strategicActions"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    const targetTitle = parsed.title || "Custom Goal";

    const strategicActionsList = parsed.strategicActions || [];
    const createdActions: DailyAction[] = [];

    // Construct 3 sequential strategic actions
    for (let i = 0; i < 3; i++) {
      const act = strategicActionsList[i] || {
        title: i === 0 ? "Initial foundational baseline study" : i === 1 ? "Practice complex requirements and review core bottlenecks" : "Final high-yield mock assessment and revision",
        durationMinutes: 90 - (i * 15),
        impact: i === 0 ? "highest" : i === 1 ? "high" : "medium"
      };

      let cleanTitle = act.title.trim();
      // Remove existing "1. ", "2. ", "3. " if model added it despite instructions
      cleanTitle = cleanTitle.replace(/^[1-3]\.\s*/, "");
      // Prepend sequence numbering
      const sequencedTitle = `${i + 1}. ${cleanTitle}`;

      createdActions.push({
        id: "act-" + Math.random().toString(36).substring(2, 9),
        goalId: goalId,
        goalTitle: targetTitle,
        title: sequencedTitle,
        durationMinutes: act.durationMinutes || 60,
        impact: act.impact || (i === 0 ? "highest" : i === 1 ? "high" : "medium"),
        completed: false,
        scheduledDate: todayDate
      });
    }

    const newGoal: Goal = {
      id: goalId,
      title: targetTitle,
      category: parsed.category,
      targetDate: targetDateFinal,
      preparationNeededHours: parsed.preparationNeededHours,
      availableHoursPerDay: parsed.availableHoursPerDay,
      notes: prompt || parsed.reasoning,
      failureRisk: parsed.failureRisk,
      expectedSuccessProbability: 100 - parsed.failureRisk,
      reasoning: parsed.reasoning,
      recommends: parsed.recommends,
      createdAt: new Date().toISOString(),
      nextBestAction: createdActions[0].title,
      actionDurationMinutes: createdActions[0].durationMinutes,
      isFallbackUsed: false
    };

    const db = readDB();
    db.goals.push(newGoal);
    // Push all 3 strategic actions sequentially
    for (const action of createdActions) {
      db.actions.push(action);
    }
    db.realityReport = null; // Clear reality check to recalculate
    writeDB(db);

    res.json({ goal: newGoal, actions: createdActions });
  } catch (error: any) {
    logFriendlyError("Goal registration override", error);

    // DETERMINISTIC LOCAL FALLBACK ENGINE
    const finalTitle = manualTitle || (prompt ? (prompt.length > 35 ? prompt.substring(0, 32) + "..." : prompt) : "Custom Goal");
    
    // Category extraction
    let finalCategory: Goal['category'] = "deadline";
    const loweredPrompt = (prompt || "").toLowerCase();
    if (loweredPrompt.includes("exam") || loweredPrompt.includes("test") || loweredPrompt.includes("quiz") || loweredPrompt.includes("paper") || loweredPrompt.includes("dbms")) {
      finalCategory = "exam";
    } else if (loweredPrompt.includes("placement") || loweredPrompt.includes("placement")) {
      finalCategory = "placement";
    } else if (loweredPrompt.includes("interview") || loweredPrompt.includes("job") || loweredPrompt.includes("hr")) {
      finalCategory = "interview";
    } else if (loweredPrompt.includes("assignment") || loweredPrompt.includes("hw") || loweredPrompt.includes("homework")) {
      finalCategory = "assignment";
    } else if (loweredPrompt.includes("project") || loweredPrompt.includes("capstone")) {
      finalCategory = "project";
    } else if (loweredPrompt.includes("hackathon") || loweredPrompt.includes("hack")) {
      finalCategory = "hackathon";
    } else if (loweredPrompt.includes("meeting") || loweredPrompt.includes("presentation")) {
      finalCategory = "meeting";
    } else if (loweredPrompt.includes("cert") || loweredPrompt.includes("certification") || loweredPrompt.includes("aws")) {
      finalCategory = "certification";
    }

    // Hours calculation
    let finalPrep = manualPrep ? Number(manualPrep) : 10;
    if (!manualPrep && prompt) {
      const matchHours = prompt.match(/(\d+)\s*(hour|hr|h\b)/i);
      if (matchHours) {
        finalPrep = Number(matchHours[1]);
      } else {
        // Mode averages
        if (finalCategory === "exam") finalPrep = 12;
        else if (finalCategory === "project") finalPrep = 20;
        else if (finalCategory === "hackathon") finalPrep = 15;
        else if (finalCategory === "placement") finalPrep = 10;
        else if (finalCategory === "interview") finalPrep = 6;
        else if (finalCategory === "assignment") finalPrep = 8;
        else if (finalCategory === "certification") finalPrep = 14;
        else finalPrep = 10;
      }
    }

    const availableHoursPerDay = 2; // general default

    // Days calculation
    const tDateObj = new Date(targetDateFinal + "T12:00:00");
    const todayObj = new Date(todayDate + "T12:00:00");
    const diffMs = tDateObj.getTime() - todayObj.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // Risk delta
    const totalAvailablePrepHours = daysRemaining * availableHoursPerDay;
    const ratio = finalPrep / Math.max(1, totalAvailablePrepHours);
    let failureRisk = 50;
    if (ratio <= 0.6) {
      failureRisk = Math.round(ratio * 40);
    } else if (ratio <= 1.0) {
      failureRisk = Math.round(40 + (ratio - 0.6) * 50);
    } else {
      failureRisk = Math.round(Math.min(98, 70 + (ratio - 1.0) * 15));
    }
    failureRisk = Math.max(5, Math.min(99, failureRisk));

    const explanation = `Observed days remaining: ${daysRemaining} days. Demanded prep effort: ${finalPrep} hours. Total capacity based on a strict 2-hour daily commitment is ${totalAvailablePrepHours} hours. ${ratio > 1.0 ? "Your active plans exceed local capacity bounds." : "Adequate time time buffer exists, provided high daily commitment is maintained."}`;

    // Recommendations
    const recommends = [
      `Strictly defend ${availableHoursPerDay} hours daily of uninterrupted block scheduling.`,
      "Synthesize existing reference syllabus material first & isolate bottleneck concepts.",
      "Postpone low-yield routine social sessions to save critical buffer."
    ];

    // Fallback actions selection based on category
    let fallbackActionTitles = [
      "Gather target reference material & draft checklist",
      "Isolate core complex bottlenecks & start notes",
      "Conduct complete self-assessment mock practice exam"
    ];

    if (finalCategory === "exam") {
      fallbackActionTitles = [
        "Complete foundational high-yield concepts",
        "Revise complex syllabus frameworks & formulas",
        "Solve previous year papers & core questions"
      ];
    } else if (finalCategory === "assignment") {
      fallbackActionTitles = [
        "Analyze guidelines, requirements & setup skeleton",
        "Draft main content deliverables and implementations",
        "Review against grading rubrics & finalize editing"
      ];
    } else if (finalCategory === "project") {
      fallbackActionTitles = [
        "Draft minimum viable product (MVP) boundaries",
        "Implement core modules & backend databases sync",
        "Test integrations & refine frontend user interface"
      ];
    } else if (finalCategory === "placement" || finalCategory === "interview") {
      fallbackActionTitles = [
        "Resynthesize portfolio projects & resume highlights",
        "Rehearse 3 behavioral STAR questionnaire answers",
        "Conduct mock vocal reviews with a structured timer"
      ];
    } else if (finalCategory === "hackathon") {
      fallbackActionTitles = [
        "Build skeletal mockup UI & wire up local states",
        "Create backend API route proxies & database engine",
        "Finalize pitch slides deck & record demo screencast"
      ];
    } else if (finalCategory === "meeting") {
      fallbackActionTitles = [
        "Wireframe high-level outline & slides layout",
        "Draft talking points & core transition statements",
        "Time professional rehearsal & verify slide assets"
      ];
    } else if (finalCategory === "certification") {
      fallbackActionTitles = [
        "Consolidate official curriculum blueprint modules",
        "Take comprehensive diagnostic quiz to find core gaps",
        "Memorize final dynamic review sheets & cheat lists"
      ];
    }

    const createdFallbackActions: DailyAction[] = [];
    for (let i = 0; i < 3; i++) {
      const sequencedTitle = `${i + 1}. ${fallbackActionTitles[i]}`;
      createdFallbackActions.push({
        id: "act-fb-" + Math.random().toString(36).substring(2, 9),
        goalId: goalId,
        goalTitle: finalTitle,
        title: sequencedTitle,
        durationMinutes: i === 0 ? 90 : i === 1 ? 60 : 45,
        impact: i === 0 ? "highest" : i === 1 ? "high" : "medium",
        completed: false,
        scheduledDate: todayDate
      });
    }

    const newGoalFallback: Goal = {
      id: goalId,
      title: finalTitle,
      category: finalCategory,
      targetDate: targetDateFinal,
      preparationNeededHours: finalPrep,
      availableHoursPerDay: availableHoursPerDay,
      notes: prompt || explanation,
      failureRisk: failureRisk,
      expectedSuccessProbability: 100 - failureRisk,
      reasoning: explanation,
      recommends: recommends,
      createdAt: new Date().toISOString(),
      nextBestAction: createdFallbackActions[0].title,
      actionDurationMinutes: createdFallbackActions[0].durationMinutes,
      isFallbackUsed: true
    };

    const db = readDB();
    db.goals.push(newGoalFallback);
    for (const action of createdFallbackActions) {
      db.actions.push(action);
    }
    db.realityReport = null; // Reset to force recalculate locally
    writeDB(db);

    res.json({ goal: newGoalFallback, actions: createdFallbackActions });
  }
});

// 4. GET daily actions
app.get("/api/actions", (req, res) => {
  const db = readDB();
  res.json(db.actions);
});

// 5. POST toggle daily action
app.post("/api/actions/:id/toggle", (req, res) => {
  const db = readDB();
  const action = db.actions.find((a: any) => a.id === req.params.id);
  if (action) {
    action.completed = !action.completed;
    
    // Recalculate associated goal's failure risk
    const goal = db.goals.find((g: any) => g.id === action.goalId);
    if (goal) {
      const oldRisk = goal.failureRisk;
      const reduction = Math.max(5, Math.min(25, Math.round((action.durationMinutes || 60) * 0.15)));
      
      if (action.completed) {
        goal.failureRisk = Math.max(5, goal.failureRisk - reduction);
      } else {
        goal.failureRisk = Math.min(99, goal.failureRisk + reduction);
      }
      goal.expectedSuccessProbability = 100 - goal.failureRisk;
      
      action.riskReductionAlert = action.completed
        ? `${goal.title} Risk reduced from ${oldRisk}% → ${goal.failureRisk}%`
        : `${goal.title} Risk returned from ${oldRisk}% → ${goal.failureRisk}%`;
    }

    // Reset Reality Check cache so client triggers full rebuild/recalculation immediately
    db.realityReport = null;
    
    writeDB(db);
    return res.json(action);
  }
  res.status(404).json({ error: "Action not found" });
});

// 6. GET Reality Check
app.get("/api/reality-check", async (req, res) => {
  const db = readDB();
  if (db.realityReport) {
    return res.json(db.realityReport);
  }

  if (db.goals.length === 0) {
    const emptyReport: RealityCheckReport = {
      isRealistic: true,
      overallSuccessProbability: 100,
      totalRequiredEffortHours: 0,
      totalAvailableHours: 0,
      textFeedback: "No active goals registered. Register your first dread to run a Reality Check.",
      prioritizedGoals: [],
      delayedGoals: []
    };
    return res.json(emptyReport);
  }

  try {
    // Run Reality Check through Gemini
    const systemInstruction = `You are an elite, sober AI Chief of Staff. Compile a comprehensive, high-honesty Reality Check. Compare required effort vs available time for all commitments. Highlight if they are overall overcommitted. Determine which goals must be prioritized, and which are recommended to delay, providing concrete, compassionate, yet highly strict, direct advice.`;

    const todayDate = new Date().toISOString().split("T")[0];
    const goalsListString = db.goals.map((g: any) => {
      return `- Title: "${g.title}", Deadline: ${g.targetDate}, Total Effort Required: ${g.preparationNeededHours} hours, Available Hours Per Day: ${g.availableHoursPerDay} hours`;
    }).join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Today is: ${todayDate}.
List of current commitments/goals:
${goalsListString}

Deliver a Reality Check report comparing combined required hours vs available days left. Check if the user is double-booked or over-capacity. Assign precise priorities.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isRealistic: { type: Type.BOOLEAN, description: "Whether the overall bundle of tasks is manageable in the remaining time" },
            overallSuccessProbability: { type: Type.INTEGER, description: "Aggregate chance of success of all commitments combined (0-100)" },
            totalRequiredEffortHours: { type: Type.INTEGER, description: "Sum of effort required across all active goals" },
            totalAvailableHours: { type: Type.INTEGER, description: "Calculated available hours from today to targets" },
            textFeedback: { type: Type.STRING, description: "A few clear, highly useful sentences telling user if their plan is realistic, highlighting the core danger" },
            prioritizedGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Matching one of the goal IDs or matching exactly their context" },
                  title: { type: Type.STRING },
                  priority: { type: Type.INTEGER, description: "Priority level (1 is highest)" },
                  reason: { type: Type.STRING, description: "Short explanation for this placement" }
                },
                required: ["title", "priority", "reason"]
              }
            },
            delayedGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Goal title recommended to postpone to save the higher priority goals" },
                  delayReason: { type: Type.STRING, description: "Strategic benefit of postponing this" }
                },
                required: ["title", "delayReason"]
              }
            }
          },
          required: ["isRealistic", "overallSuccessProbability", "totalRequiredEffortHours", "totalAvailableHours", "textFeedback", "prioritizedGoals", "delayedGoals"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());

    // Clean up IDs mapping back
    const report: RealityCheckReport = {
      isRealistic: parsed.isRealistic,
      overallSuccessProbability: parsed.overallSuccessProbability,
      totalRequiredEffortHours: parsed.totalRequiredEffortHours,
      totalAvailableHours: parsed.totalAvailableHours,
      textFeedback: parsed.textFeedback,
      prioritizedGoals: parsed.prioritizedGoals.map((g: any, index: number) => {
        const original = db.goals.find((og: any) => og.title.toLowerCase().includes(g.title.toLowerCase()) || g.title.toLowerCase().includes(og.title.toLowerCase()));
        return {
          id: original ? original.id : `p-${index}`,
          title: original ? original.title : g.title,
          priority: g.priority,
          reason: g.reason
        };
      }),
      delayedGoals: parsed.delayedGoals.map((dg: any, index: number) => {
        const original = db.goals.find((og: any) => og.title.toLowerCase().includes(dg.title.toLowerCase()) || dg.title.toLowerCase().includes(og.title.toLowerCase()));
        return {
          id: original ? original.id : `d-${index}`,
          title: original ? original.title : dg.title,
          delayReason: dg.delayReason
        };
      }),
      isFallbackUsed: false
    };

    db.realityReport = report;
    writeDB(db);
    res.json(report);
  } catch (error: any) {
    logFriendlyError("Reality Check calculation override", error);

    // DETERMINISTIC LOCAL REALITY CHECK FORMULAS
    const goals = db.goals;
    const totalRequiredEffortHours = goals.reduce((sum, g) => sum + g.preparationNeededHours, 0);
    
    const today = new Date();
    const totalAvailableHours = goals.reduce((sum, g) => {
      const tDate = new Date(g.targetDate + "T12:00:00");
      const diffDays = Math.max(1, Math.ceil((tDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      return sum + (diffDays * g.availableHoursPerDay);
    }, 0);

    const isRealistic = totalRequiredEffortHours <= totalAvailableHours;
    const capacityRatio = totalAvailableHours / Math.max(1, totalRequiredEffortHours);
    let overallSuccessProbability = 82;

    if (isRealistic) {
      overallSuccessProbability = Math.min(96, Math.round(75 + capacityRatio * 10));
    } else {
      overallSuccessProbability = Math.max(15, Math.round(82 * capacityRatio));
    }

    let feedback = "";
    if (isRealistic) {
      feedback = `Guardian is active on local analytics. Your total available capacity (${totalAvailableHours} hrs) comfortably houses your required preparation effort (${totalRequiredEffortHours} hrs). Stay locked in.`;
    } else {
      feedback = `Guardian active on local risk heuristics. Overload detected! Required effort (${totalRequiredEffortHours} hrs) exceeds total available prep margins (${totalAvailableHours} hrs). Delaying non-critical action items is highly advised.`;
    }

    // Sort active goals by urgency to determine Priorities & Deferrals
    const sortedGoalsByDate = [...goals].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
    
    const prioritizedGoals = sortedGoalsByDate.map((g, index) => ({
      id: g.id,
      title: g.title,
      priority: index + 1,
      reason: `High risk profile: target date is approaching in ${Math.max(1, Math.ceil((new Date(g.targetDate + "T12:00:00").getTime() - today.getTime()) / (100 * 60 * 60 * 24)) / 10)} days.`
    }));

    // Suggest deferring the furthest goal if capacity is crossed
    const delayedGoals: { id: string; title: string; delayReason: string }[] = [];
    if (!isRealistic && sortedGoalsByDate.length > 1) {
      const deferCandidate = sortedGoalsByDate[sortedGoalsByDate.length - 1];
      delayedGoals.push({
        id: deferCandidate.id,
        title: deferCandidate.title,
        delayReason: `Postpone until other major deadlines clear. Frees up ${deferCandidate.preparationNeededHours} hours of crucial energy.`
      });
    } else if (sortedGoalsByDate.length > 0) {
      // Suggest some smart generic tradeoff
      delayedGoals.push({
        id: "defer-routine",
        title: "Secondary Routine Polish",
        delayReason: "Shelving non-critical updates and reviews redirects all focused hours back into core deliverables."
      });
    }

    const fallbackReport: RealityCheckReport = {
      isRealistic,
      overallSuccessProbability,
      totalRequiredEffortHours,
      totalAvailableHours,
      textFeedback: feedback,
      prioritizedGoals,
      delayedGoals,
      isFallbackUsed: true
    };

    db.realityReport = fallbackReport;
    writeDB(db);
    res.json(fallbackReport);
  }
});

// 7. POST Simulate Delay
app.post("/api/simulate-delay", async (req, res) => {
  const { goalId } = req.body;
  const db = readDB();
  const targetGoal = db.goals.find((g: any) => g.id === goalId);
  
  if (!targetGoal) {
    return res.status(404).json({ error: "Target goal not found" });
  }

  try {
    const systemInstruction = `You are a strict, smart AI Failure Predictor. Analyze the target commitment and calculate precisely what happens to their failure risk if they SKIP active study/work today. Be blunt, alarming, yet constructive. Show the exact delta increase in failure risk.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Goal: "${targetGoal.title}". Current Failure Risk: ${targetGoal.failureRisk}%. Effort required remaining: ${targetGoal.preparationNeededHours} hours.
Calculate risk delta and output a simulation report showing:
1. originalRisk (must match today's: ${targetGoal.failureRisk})
2. newRisk (the higher escalated risk level)
3. impactDescription (what skipping today does to options, stress levels, and buffer)
4. recommendedRecoveryAction (e.g. 'Complete DBMS Relational Algebra immediately tomorrow morning')`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalRisk: { type: Type.INTEGER },
            newRisk: { type: Type.INTEGER },
            impactDescription: { type: Type.STRING },
            recommendedRecoveryAction: { type: Type.STRING }
          },
          required: ["originalRisk", "newRisk", "impactDescription", "recommendedRecoveryAction"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json({
      ...parsed,
      isFallbackUsed: false
    });
  } catch (error: any) {
    logFriendlyError("Simulation delta tracking override", error);
    
    const originalRisk = targetGoal.failureRisk;
    const newRisk = Math.min(99, Math.round(originalRisk * 1.25 + 5));

    res.json({
      originalRisk,
      newRisk,
      impactDescription: `Skipping today's high-leverage block for "${targetGoal.title}" contractually deletes your safety buffer, forcing you to prepare for ${Math.round(targetGoal.preparationNeededHours * 1.3)} hours under compounding pressure tomorrow.`,
      recommendedRecoveryAction: `Enforce a strict, uninterrupted 2-hour study block tomorrow morning to recuperate from today's gap.`,
      isFallbackUsed: true
    });
  }
});

// 8. POST Rebuild Week / Recovery
app.post("/api/rebuild-week", async (req, res) => {
  const { excuse } = req.body;
  try {
    const db = readDB();

    if (db.goals.length === 0) {
      return res.status(400).json({ error: "No active goals to rebuild a layout for." });
    }

    const todayDate = new Date().toISOString().split("T")[0];
    const goalsString = db.goals.map((g: any) => `- ${g.title} (Needed: ${g.preparationNeededHours}h, current failure risk: ${g.failureRisk}%)`).join("\n");
    const currentActions = db.actions.map((a: any) => `- Action: ${a.title} for goal: "${a.goalTitle}" (${a.completed ? 'completed' : 'pending'})`).join("\n");

    const systemInstruction = `You are an elite, agile AI Chief of Staff. The user has fallen behind or had circumstances change (excuse: "${excuse}"). Your job is to automatically rewrite and engineer a tactical RECOVERY strategy. Postpone minor tasks, condense session times, and shift priorities to lower their failure risk.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Today's Date: ${todayDate}.
User's disruption/event description: "${excuse}"
Active commitments requiring study/work:
${goalsString}
Current daily actions layout:
${currentActions}

Generate lists of restructured tactical recovery actions (max 3, highly critical actions for today/tomorrow) and compute the newly engineered rebuilt success probability.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recoveryStrategy: { type: Type.STRING, description: "The overarching strategic shift to overcome the disruption" },
            rebuiltSuccessProbability: { type: Type.INTEGER, description: "The newly calculated aggregate success probability (0-100)" },
            updatedActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  goalTitle: { type: Type.STRING, description: "Matching active goal title" },
                  title: { type: Type.STRING, description: "Restructured, crisp actionable task" },
                  durationMinutes: { type: Type.INTEGER, description: "Optimized length" },
                  impact: { type: Type.STRING, enum: ["highest", "high", "medium", "low"] }
                },
                required: ["goalTitle", "title", "durationMinutes", "impact"]
              }
            }
          },
          required: ["recoveryStrategy", "rebuiltSuccessProbability", "updatedActions"]
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());

    // Map actions back into db actions
    const freshActions: DailyAction[] = parsed.updatedActions.map((act: any, idx: number) => {
      const matchGoal = db.goals.find((g: any) => g.title.toLowerCase().includes(act.goalTitle.toLowerCase()) || act.goalTitle.toLowerCase().includes(g.title.toLowerCase())) || db.goals[0];
      return {
        id: "act-rebuilt-" + Math.random().toString(36).substring(2, 9),
        goalId: matchGoal.id,
        goalTitle: matchGoal.title,
        title: act.title,
        durationMinutes: act.durationMinutes,
        impact: act.impact,
        completed: false,
        scheduledDate: todayDate
      };
    });

    // Merge/replace active uncompleted actions with newly marshalled ones to perform actual database rewrite!
    db.actions = [
      ...db.actions.filter((a: any) => a.completed), // Keep completed actions
      ...freshActions // Add new rebuilt actions
    ];

    // Recalculate reality report to show state changes
    db.realityReport = null;
    writeDB(db);

    const originalProb = db.realityReport?.overallSuccessProbability || 45;

    res.json({
      success: true,
      updatedActions: freshActions,
      recoveryStrategy: parsed.recoveryStrategy,
      rebuiltSuccessProbability: parsed.rebuiltSuccessProbability,
      originalSuccessProbability: originalProb,
      isFallbackUsed: false
    });

  } catch (error: any) {
    logFriendlyError("Weekly recovery rebuild override", error);
    const db = readDB();
    const todayDate = new Date().toISOString().split("T")[0];

    // Select the highest risk goal or first goal
    const sortedGoals = [...db.goals].sort((a, b) => b.failureRisk - a.failureRisk);
    const primaryGoal = sortedGoals[0];

    const freshActionsFallback: DailyAction[] = [];
    
    if (primaryGoal) {
      freshActionsFallback.push({
        id: "act-rebuilt-fb-" + Math.random().toString(36).substring(2, 9),
        goalId: primaryGoal.id,
        goalTitle: primaryGoal.title,
        title: `Condensed high-yield review session for ${primaryGoal.title}`,
        durationMinutes: 45,
        impact: "highest",
        completed: false,
        scheduledDate: todayDate
      });
    }

    if (sortedGoals[1]) {
      freshActionsFallback.push({
        id: "act-rebuilt-fb-2-" + Math.random().toString(36).substring(2, 9),
        goalId: sortedGoals[1].id,
        goalTitle: sortedGoals[1].title,
        title: `Priority syllabus practice review block`,
        durationMinutes: 60,
        impact: "high",
        completed: false,
        scheduledDate: todayDate
      });
    }

    db.actions = [
      ...db.actions.filter((a: any) => a.completed),
      ...freshActionsFallback
    ];

    db.realityReport = null; // reset to force recalculation which handles fallback correctly too
    writeDB(db);

    const originalProb = 45; // average probability guess
    const rebuiltSuccessProbability = Math.min(95, Math.round(originalProb * 1.25));

    res.json({
      success: true,
      updatedActions: freshActionsFallback,
      recoveryStrategy: `Fallback Recovery System on duty. We compressed session times and rescheduled priority tasks to handle: "${excuse}". Minor actions postponed.`,
      rebuiltSuccessProbability: rebuiltSuccessProbability,
      originalSuccessProbability: originalProb,
      isFallbackUsed: true
    });
  }
});


// Vite / Static Files Middleware

async function initMiddlewaresAndStart() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global server start bind
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deadline Guardian AI Server running on http://localhost:${PORT}`);
  });
}

initMiddlewaresAndStart();
