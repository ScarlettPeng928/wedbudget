import { planCategories, type PlanCategory } from './planCategories';

// The budget categories as the home page and the vendors pages show them. Names,
// slugs and shares come from planCategories (shared with the results page); this
// file adds the tagline and the kinds of vendor in each category.

// Slugs are what the backend expects; keep them in sync with backend/seed.py.
export type Subcategory = {
  slug: string;
  name: string;
  image?: string;
};

export type BudgetCategory = PlanCategory & {
  tagline: string;
  subcategories: Subcategory[];
};

type HomeCopy = Pick<BudgetCategory, 'tagline' | 'subcategories'>;

const homeCopy: Record<string, HomeCopy> = {
  venues: {
    tagline: 'Where you say yes, and where everyone gathers after.',
    subcategories: [
      { slug: 'hotel-banquet', name: 'Hotel Banquet' },
      { slug: 'wedding-hall', name: 'Wedding Hall' },
      { slug: 'restaurant', name: 'Restaurant' },
      { slug: 'outdoor-garden', name: 'Outdoor & Garden' },
    ],
  },
  photography: {
    tagline: 'The day goes by fast. These are what you keep.',
    subcategories: [
      { slug: 'photographer', name: 'Photographer' },
      { slug: 'videographer', name: 'Videographer' },
      { slug: 'pre-wedding-studio', name: 'Pre-wedding Studio' },
      { slug: 'photo-booth', name: 'Photo Booth' },
    ],
  },
  attire: {
    tagline: 'What you wear when you walk toward each other.',
    subcategories: [
      { slug: 'gown-rental', name: 'Gown Rental' },
      { slug: 'custom-gowns', name: 'Custom Gowns' },
      { slug: 'suits', name: 'Suits' },
      { slug: 'accessories', name: 'Accessories' },
    ],
  },
  'bridal-styling': {
    tagline: 'Hair, makeup and the calm before the aisle.',
    subcategories: [
      { slug: 'bridal-stylist', name: 'Bridal Stylist' },
      { slug: 'makeup-artist', name: 'Makeup Artist' },
      { slug: 'hair-studio', name: 'Hair Studio' },
      { slug: 'nails', name: 'Nails' },
    ],
  },
  hosting: {
    tagline: "Someone to keep the day flowing, so you don't have to.",
    subcategories: [
      { slug: 'wedding-planner', name: 'Wedding Planner' },
      { slug: 'emcee', name: 'Emcee' },
      { slug: 'day-of-coordinator', name: 'Day-of Coordinator' },
      { slug: 'live-music', name: 'Live Music' },
    ],
  },
  favors: {
    tagline: 'A little thank-you for everyone who came.',
    subcategories: [
      { slug: 'traditional-chinese', name: 'Traditional Chinese' },
      { slug: 'western', name: 'Western' },
      { slug: 'handmade-cookies', name: 'Handmade Cookies' },
      { slug: 'imported', name: 'Imported' },
    ],
  },
};

export const budgetCategories: BudgetCategory[] = planCategories.map((category) => ({
  ...category,
  ...homeCopy[category.slug],
}));
