export type City = { slug: string; name: string };

// Reception locations offered in the plan form, north to south, then the east coast.
// The slugs are what the backend expects; keep this list in sync with backend/seed.py.
export const cities: City[] = [
  { slug: 'taipei', name: 'Taipei' },
  { slug: 'new-taipei', name: 'New Taipei' },
  { slug: 'keelung', name: 'Keelung' },
  { slug: 'taoyuan', name: 'Taoyuan' },
  { slug: 'hsinchu', name: 'Hsinchu' },
  { slug: 'miaoli', name: 'Miaoli' },
  { slug: 'taichung', name: 'Taichung' },
  { slug: 'changhua', name: 'Changhua' },
  { slug: 'nantou', name: 'Nantou' },
  { slug: 'yunlin', name: 'Yunlin' },
  { slug: 'chiayi', name: 'Chiayi' },
  { slug: 'tainan', name: 'Tainan' },
  { slug: 'kaohsiung', name: 'Kaohsiung' },
  { slug: 'pingtung', name: 'Pingtung' },
  { slug: 'yilan', name: 'Yilan' },
  { slug: 'hualien', name: 'Hualien' },
  { slug: 'taitung', name: 'Taitung' },
];

export const cityName = (slug: string) => cities.find((c) => c.slug === slug)?.name ?? slug;

// Plans saved before slugs were used stored the display name ('New Taipei').
export const toCitySlug = (value: string) =>
  cities.find((c) => c.slug === value || c.name === value)?.slug ?? value;
