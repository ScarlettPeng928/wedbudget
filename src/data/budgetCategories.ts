import { planCategories, type PlanCategory } from './planCategories';
// Home page category card photos (src/assets/home/category-<slug>.jpg).
import venuesCover from '../assets/home/category-venues.jpg';
import photographyCover from '../assets/home/category-photography.jpg';
import attireCover from '../assets/home/category-attire.jpg';
import bridalStylingCover from '../assets/home/category-bridal-styling.jpg';
import hostingCover from '../assets/home/category-hosting.jpg';
import favorsCover from '../assets/home/category-favors.jpg';
// Vendors page banners (src/assets/vendors/banner-<slug>.jpg; credits in CREDITS.md).
import venuesBanner from '../assets/vendors/banner-venues.jpg';
import photographyBanner from '../assets/vendors/banner-photography.jpg';
import attireBanner from '../assets/vendors/banner-attire.jpg';
import bridalStylingBanner from '../assets/vendors/banner-bridal-styling.jpg';
import hostingBanner from '../assets/vendors/banner-hosting.jpg';
import favorsBanner from '../assets/vendors/banner-favors.jpg';

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
  // Photo for the category's card on the home page. Until one is set, the card
  // shows a plain rosewood block. To add one: name the file category-<slug>.jpg in
  // src/assets/home/, import it at the top of this file, and set `cover` below.
  cover?: string;
  // Wide photo across the top of the category's vendors page.
  banner?: string;
};

type HomeCopy = Pick<BudgetCategory, 'tagline' | 'subcategories' | 'cover' | 'banner'>;

const homeCopy: Record<string, HomeCopy> = {
  venues: {
    banner: venuesBanner,
    cover: venuesCover,
    tagline: 'Where you say yes, and where everyone gathers after.',
    subcategories: [
      { slug: 'hotel-banquet', name: 'Hotel Banquet' },
      { slug: 'wedding-hall', name: 'Wedding Hall' },
      { slug: 'restaurant', name: 'Restaurant' },
      { slug: 'outdoor-garden', name: 'Outdoor & Garden' },
    ],
  },
  photography: {
    banner: photographyBanner,
    cover: photographyCover,
    tagline: 'The day goes by fast. These are what you keep.',
    subcategories: [
      { slug: 'photographer', name: 'Photographer' },
      { slug: 'videographer', name: 'Videographer' },
      { slug: 'pre-wedding-studio', name: 'Pre-wedding Studio' },
      { slug: 'photo-booth', name: 'Photo Booth' },
    ],
  },
  attire: {
    banner: attireBanner,
    cover: attireCover,
    tagline: 'What you wear when you walk toward each other.',
    subcategories: [
      { slug: 'gown-rental', name: 'Gown Rental' },
      { slug: 'custom-gowns', name: 'Custom Gowns' },
      { slug: 'suits', name: 'Suits' },
      { slug: 'accessories', name: 'Accessories' },
    ],
  },
  'bridal-styling': {
    banner: bridalStylingBanner,
    cover: bridalStylingCover,
    tagline: 'Hair, makeup and the calm before the aisle.',
    subcategories: [
      { slug: 'bridal-stylist', name: 'Bridal Stylist' },
      { slug: 'makeup-artist', name: 'Makeup Artist' },
      { slug: 'hair-studio', name: 'Hair Studio' },
      { slug: 'nails', name: 'Nails' },
    ],
  },
  hosting: {
    banner: hostingBanner,
    cover: hostingCover,
    tagline: "Someone to keep the day flowing, so you don't have to.",
    subcategories: [
      { slug: 'wedding-planner', name: 'Wedding Planner' },
      { slug: 'emcee', name: 'Emcee' },
      { slug: 'day-of-coordinator', name: 'Day-of Coordinator' },
      { slug: 'live-music', name: 'Live Music' },
    ],
  },
  favors: {
    banner: favorsBanner,
    cover: favorsCover,
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
