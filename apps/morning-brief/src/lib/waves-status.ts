// WAVES programme status + financial-replacement KPI for the Today tab.
//
// Hand-curated for now — update this file when a phase moves.
// Future: promote to fields on the Brief contract so /morning writes them per day.
//
// Lifecycle stages (left → right on the bar):
//   1. ideation   — concept / brief / commitment exists, no build yet
//   2. building   — draft / prototype / programme module in flight
//   3. launching  — final pre-launch polish, listing, soft launch, first customers
//   4. operating  — live, repeat revenue, regular cadence
//   5. growth     — scaling, multi-channel, compounding

export type Lifecycle = "ideation" | "building" | "launching" | "operating" | "growth";

export const LIFECYCLE_ORDER: Lifecycle[] = ["ideation", "building", "launching", "operating", "growth"];

export type WavesPhase = {
  letter: "W" | "A" | "V" | "E" | "S";
  phaseName: string;             // Wholeness · Awareness · Vibration · Entrainment · Synchronicity
  product: string;               // Start With In · The Regenerative Coach · The Next Wave · SURFER · ChiiZone
  role: "book" | "programme" | "destination";
  lifecycle: Lifecycle;
  note?: string;                 // one-line status caption (optional)
};

export type FinancialProgress = {
  currentMonthlyGBP: number | null;    // current coaching-side monthly income (null = not yet measured)
  targetMonthlyGBP: number | null;     // replacement-income KPI (null until Financial Steward session 4 locks it)
  sessionsComplete: number;             // Financial Steward sessions complete (0..14)
  sessionsTotal: number;                // total sessions in the inventory arc
  kpiLockSession: number;               // the session at which the target KPI is locked
  note?: string;
};

// ──────────────────────────────────────────────────────────────
// CURRENT STATE (update this block when a phase moves)
// ──────────────────────────────────────────────────────────────

export const WAVES_LAST_UPDATED = "2026-06-05";

export const WAVES_PHASES: WavesPhase[] = [
  {
    letter: "W",
    phaseName: "Wholeness",
    product: "Start With In",
    role: "book",
    lifecycle: "launching",
    note: "v2 edit pass complete · Kindle pipeline open",
  },
  {
    letter: "A",
    phaseName: "Awareness",
    product: "The Regenerative Coach",
    role: "programme",
    lifecycle: "building",
    note: "Module 1 + ICP + landing page in flight",
  },
  {
    letter: "V",
    phaseName: "Vibration",
    product: "The Next Wave",
    role: "book",
    lifecycle: "launching",
    note: "v2 edit pass complete · Kindle pipeline open",
  },
  {
    letter: "E",
    phaseName: "Entrainment",
    product: "SURFER",
    role: "programme",
    lifecycle: "ideation",
    note: "Single landing page only · waits on a warm buyer",
  },
  {
    letter: "S",
    phaseName: "Synchronicity",
    product: "ChiiZone",
    role: "destination",
    lifecycle: "ideation",
    note: "Ltd entity exists · portal builds last",
  },
];

export const FINANCIAL_PROGRESS: FinancialProgress = {
  currentMonthlyGBP: null,
  targetMonthlyGBP: null,
  sessionsComplete: 0,
  sessionsTotal: 14,
  kpiLockSession: 4,
  note: "KPI target locks at Financial Steward session 4",
};
