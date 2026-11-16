import type { PlanResult } from '../api/plan';
import { toCitySlug } from '../data/cities';

// The plan is kept in this browser only (localStorage), so a visitor can leave
// and come back to it. Storage can be blocked, so every access is guarded.
const KEY = 'wedbudget-plan';

// What the results page keeps: the allocation as generated (`suggested`) next to
// the visitor's own adjustments (`allocations`). Comparing the two tells us
// whether the sliders were moved, and the suggestion sets each slider's range.
export type SavedPlan = PlanResult & { suggested: Record<string, number> };

// A freshly generated plan: no adjustments yet, so both start out the same.
export const fromResult = (result: PlanResult): SavedPlan => ({ ...result, suggested: result.allocations });

// True once the visitor has changed any amount since the plan was generated.
// Generating again replaces those changes, so the forms warn first.
export function isAdjusted(plan: SavedPlan) {
  const slugs = new Set([...Object.keys(plan.allocations), ...Object.keys(plan.suggested)]);
  return [...slugs].some((slug) => (plan.allocations[slug] ?? 0) !== (plan.suggested[slug] ?? 0));
}

export function loadPlan(): SavedPlan | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const plan = JSON.parse(raw) as PlanResult & { suggested?: Record<string, number> };
    return {
      ...plan,
      // Older saves stored the city's name ('New Taipei'); the backend needs the slug.
      request: { ...plan.request, city: toCitySlug(plan.request.city) },
      // Plans saved before `suggested` existed: treat the current amounts as the suggestion.
      suggested: plan.suggested ?? plan.allocations,
    };
  } catch {
    return null;
  }
}

export function savePlan(plan: SavedPlan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // Storage blocked: the plan simply isn't remembered.
  }
}
