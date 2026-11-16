import type { Subcategory } from '../data/budgetCategories';

// Shown until real photos are added to the data file.
const placeholderTones = [
  'linear-gradient(160deg, #7c8a7a, #2b3a2f)',
  'linear-gradient(200deg, #8f9a86, #34402f)',
  'linear-gradient(180deg, #6f7d72, #222c25)',
  'linear-gradient(140deg, #9aa48f, #3b4a3c)',
];

// A subcategory's photo, or a green tone in its place. `index` picks the tone.
export default function SubcategoryPhoto({
  sub,
  index,
  decorative = false,
}: {
  sub: Subcategory;
  index: number;
  decorative?: boolean;
}) {
  if (sub.image) {
    return <img src={sub.image} alt={decorative ? '' : sub.name} className="h-full w-full object-cover" />;
  }
  return (
    <div className="h-full w-full" style={{ background: placeholderTones[index % placeholderTones.length] }} aria-hidden="true" />
  );
}
