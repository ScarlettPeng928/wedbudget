import type { Subcategory } from '../data/budgetCategories';

// Shown until real photos are added to the data file.
// Tones from the theme palette (input.css), so they follow any color change there.
const placeholderTones = [
  'linear-gradient(160deg, var(--color-mauve), var(--color-plum))',
  'linear-gradient(200deg, var(--color-sage), var(--color-plum))',
  'linear-gradient(180deg, var(--color-rosewood), var(--color-plum))',
  'linear-gradient(140deg, var(--color-sand), var(--color-rosewood))',
];

// A subcategory's photo, or a palette tone in its place. `index` picks the tone.
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
