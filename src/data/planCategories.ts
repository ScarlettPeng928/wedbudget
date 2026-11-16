export type PlanCategory = {
  slug: string;
  name: string;
  // Starting share of the total budget, in percent. The six shares add up to 100:
  // the whole budget is allocated, with nothing held back.
  share: number;
};

// Placeholder rules until the backend calculates the allocation.
export const planCategories: PlanCategory[] = [
  { slug: 'venues', name: 'Venues & Banquets', share: 55 },
  { slug: 'photography', name: 'Photography & Video', share: 13 },
  { slug: 'attire', name: 'Wedding Attire', share: 10 },
  { slug: 'bridal-styling', name: 'Bridal Styling', share: 8 },
  { slug: 'hosting', name: 'Hosting & Planning', share: 8 },
  { slug: 'favors', name: 'Wedding Favors', share: 6 },
];
