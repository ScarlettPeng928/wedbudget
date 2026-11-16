// Everything the plan pages send to or get from the backend lives in src/api/,
// so the UI never talks to the network directly.
import { postJson } from './client';

// Smallest budget the planner accepts, in NT$. Below this most categories round to 0.
// The backend enforces the same limit.
export const MIN_BUDGET = 100_000;

export type PlanRequest = {
  totalBudget: number; // NT$
  city: string; // City slug, e.g. 'new-taipei' (see src/data/cities.ts)
  guestCount: number;
};

export type PlanResult = {
  request: PlanRequest;
  // NT$ per category slug.
  allocations: Record<string, number>;
};

// The backend splits the whole budget across the six categories (backend/SPEC.md 3.2).
export const generateBudgetPlan = (request: PlanRequest) => postJson<PlanResult>('/api/plan', request);
