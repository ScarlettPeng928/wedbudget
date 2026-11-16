"""Fill the database with the starting data (SPEC.md section 6).

Run from the backend folder, after `alembic upgrade head`:

    .venv/bin/python seed.py

Safe to run again: existing rows are updated by their key (Slug for categories,
subcategories and cities, category + name for vendors), never added twice. Demo vendors that
are no longer listed here are deleted (real vendors are never touched).

Rule: a vendor name appears once per category. Real vendors don't run the same
shop in several cities, so the demo data doesn't either.
"""

from sqlalchemy import select

from app.db import SessionLocal
from app.models import PRICE_UNITS, Category, City, Subcategory, Vendor

# slug, name, share %, match by city. Order = display order. Same as src/data/planCategories.ts.
CATEGORIES = [
    ('venues', 'Venues & Banquets', 55, True),
    ('photography', 'Photography & Video', 13, True),
    ('attire', 'Wedding Attire', 10, True),
    ('bridal-styling', 'Bridal Styling', 8, True),
    ('hosting', 'Hosting & Planning', 8, True),
    ('favors', 'Wedding Favors', 6, True),
]

# Kinds of vendor in each category, in display order: (slug, name).
# Slugs are unique across all categories. Same as src/data/budgetCategories.ts.
SUBCATEGORIES = {
    'venues': [('hotel-banquet', 'Hotel Banquet'), ('wedding-hall', 'Wedding Hall'),
               ('restaurant', 'Restaurant'), ('outdoor-garden', 'Outdoor & Garden')],
    'photography': [('photographer', 'Photographer'), ('videographer', 'Videographer'),
                    ('pre-wedding-studio', 'Pre-wedding Studio'), ('photo-booth', 'Photo Booth')],
    'attire': [('gown-rental', 'Gown Rental'), ('custom-gowns', 'Custom Gowns'),
               ('suits', 'Suits'), ('accessories', 'Accessories')],
    'bridal-styling': [('bridal-stylist', 'Bridal Stylist'), ('makeup-artist', 'Makeup Artist'),
                       ('hair-studio', 'Hair Studio'), ('nails', 'Nails')],
    'hosting': [('wedding-planner', 'Wedding Planner'), ('emcee', 'Emcee'),
                ('day-of-coordinator', 'Day-of Coordinator'), ('live-music', 'Live Music')],
    'favors': [('traditional-chinese', 'Traditional Chinese'), ('western', 'Western'),
               ('handmade-cookies', 'Handmade Cookies'), ('imported', 'Imported')],
}

# North to south, then the east coast. Same as src/data/cities.ts.
CITIES = [
    ('taipei', 'Taipei'),
    ('new-taipei', 'New Taipei'),
    ('keelung', 'Keelung'),
    ('taoyuan', 'Taoyuan'),
    ('hsinchu', 'Hsinchu'),
    ('miaoli', 'Miaoli'),
    ('taichung', 'Taichung'),
    ('changhua', 'Changhua'),
    ('nantou', 'Nantou'),
    ('yunlin', 'Yunlin'),
    ('chiayi', 'Chiayi'),
    ('tainan', 'Tainan'),
    ('kaohsiung', 'Kaohsiung'),
    ('pingtung', 'Pingtung'),
    ('yilan', 'Yilan'),
    ('hualien', 'Hualien'),
    ('taitung', 'Taitung'),
]

# ---------- Demo vendors ----------
#
# Prices run from high to low in small, even steps, so moving a slider almost
# always lets a vendor in or out of a row. Each step is the same percentage
# (a ratio ladder), so cheap and expensive vendors are equally dense.


def price_ladder(high: int, low: int, count: int, step: int) -> list[int]:
    """`count` prices from `high` down to `low`, rounded to `step`."""
    ratio = (low / high) ** (1 / (count - 1))
    return [round(high * ratio**i / step) * step for i in range(count)]


# Every category matches by city, so the demo data covers three cities in full:
# Taipei, Taichung and Kaohsiung. Other cities show the empty state.

# Venues: each city has its own list (per table, NT$).
VENUE_CITIES = {
    'taipei': (68_000, 12_000, [
        'The Grand Hall', 'Crown Banquet', 'Garden House', 'Silver Lake Hall', 'Orchid Palace',
        'City Terrace', 'Jade Pavilion', 'Lotus Court', 'River Pavilion', 'Bamboo House',
        'Corner Banquet', 'Small Feast Room',
    ]),
    'taichung': (55_000, 10_000, [
        'Maple Court', 'Grand Taichung Hall', 'Lantern Hall', 'Cedar Pavilion', 'Moonlight Banquet',
        'Willow Banquet', 'Park View Hall', 'Golden Rice Hall', 'Harvest Room', 'Tea Garden Hall',
        'Hometown Banquet', 'Little Lantern Room',
    ]),
    'kaohsiung': (52_000, 9_000, [
        'Harbour Grand', 'Ocean Crown Hall', 'Sunset Pier', 'Coral Banquet', 'Lighthouse Hall',
        'Palm Hall', 'Bay Terrace', 'Pearl Room', 'Seaside Room', 'Breeze Banquet',
        'Port Kitchen Hall', 'Sandbar Room',
    ]),
}

# The other categories: (highest, lowest, unit, step, Taipei names), at Taipei prices.
# Taichung and Kaohsiung get their own names (OTHER_CITY_NAMES) and prices (CITY_PRICE_SCALE).
OTHER_CATEGORIES = {
    'photography': (320_000, 18_000, 'event', 1_000, [
        'Lumen Studio', 'Silver Frame', 'Frame & Field', 'Still Moments', 'Golden Hour Co.',
        'Paper Lens', 'North Light', 'Daydream Films', 'Little Reel', 'Field Notes Film',
        'Two Hearts Photo', 'Open Shutter', 'Window Light', 'Kind Eye Studio', 'Snapshot Day',
        'First Frame',
    ]),
    'attire': (300_000, 22_000, 'event', 1_000, [
        'Atelier Blanc', 'Maison Vela', 'Couture Lane', 'Silk Row', 'The Tailor House',
        'Ivory Lane', 'Pearl & Thread', 'Lace & Linen', 'Velvet Room', 'Thread Studio',
        'White Petal', 'Satin Corner', 'Simple Vow', 'Daily Dress', 'Sew Sweet',
        'Borrowed Blue',
    ]),
    'bridal-styling': (150_000, 8_000, 'event', 1_000, [
        'Glow Room', 'Atelier Rouge', 'Petal Beauty', 'Muse Studio', 'Soft Focus',
        'Silk Touch', 'Blush Hour', 'Rose Water', 'Gloss & Grace', 'Fine Line Makeup',
        'Bloom Beauty', 'Morning Dew', 'Hair Ribbon', 'Little Brush', 'Fresh Face',
        'Quick Glow',
    ]),
    'hosting': (150_000, 8_000, 'event', 1_000, [
        'North Plan Co.', 'Grand Toast', 'Vow & Co.', 'Day Of Studio', 'The Toast Host',
        'Bright Stage', 'Cue Card', 'Open Floor', 'Joy Planners', 'Warm Mic',
        'Ribbon Events', 'Small Talk Hosts', 'Easy Day', 'Hello Host', 'Friendly Mic',
        'Plan Lite',
    ]),
    'favors': (1_600, 220, 'guest', 10, [
        'Sweet Keep', 'Royal Crumb', 'Golden Crumb', 'Paper & Honey', 'Thank You Box',
        'Little Tokens', 'Moon Bakery', 'Bean & Bloom', 'Almond House', 'Plain Sugar',
        'Honey Jar', 'Tea Cake Co.', 'Small Joys', 'Butter Bite', 'Crumbs & Co.',
        'Tiny Treats',
    ]),
}

CITY_PRICE_SCALE = {'taipei': 1.0, 'taichung': 0.9, 'kaohsiung': 0.85}

# Names outside Taipei: one word per vendor plus a word for the category,
# so every city shows its own vendors ("Amber Studio", "Birch Films", ...).
OTHER_CITY_WORDS = {
    'taichung': ['Amber', 'Birch', 'Clover', 'Dune', 'Ember', 'Fern', 'Garnet', 'Hazel',
                 'Iris', 'Juniper', 'Kite', 'Linden', 'Marigold', 'Nectar', 'Oak', 'Poppy'],
    'kaohsiung': ['Quill', 'Reef', 'Saffron', 'Tide', 'Umber', 'Vale', 'Wren', 'Yarrow',
                  'Zephyr', 'Azure', 'Bay', 'Coral', 'Drift', 'Harbor', 'Isle', 'Lagoon'],
}
CATEGORY_WORDS = {
    'photography': ['Studio', 'Films', 'Photo', 'Pictures'],
    'attire': ['Bridal', 'Atelier', 'Couture', 'Gowns'],
    'bridal-styling': ['Beauty', 'Makeup', 'Styling', 'Glam'],
    'hosting': ['Events', 'Hosts', 'Planning', 'Weddings'],
    'favors': ['Bakery', 'Sweets', 'Patisserie', 'Cakes'],
}

# Each city starts the photo rotation at a different photo, so switching city
# changes the pictures too. (Still a rotation of 6: no repeats within a row.)
CITY_PHOTO_OFFSET = {'taipei': 0, 'taichung': 2, 'kaohsiung': 4}


def city_names(category: str, city: str, taipei_names: list[str]) -> list[str]:
    if city == 'taipei':
        return taipei_names
    words = CATEGORY_WORDS[category]
    return [f'{word} {words[i % len(words)]}' for i, word in enumerate(OTHER_CITY_WORDS[city])]


def build_vendors() -> dict[str, list[tuple[str, str, int, int, str]]]:
    """category -> [(name, city, price min, price max, unit)], most expensive first."""
    vendors: dict[str, list[tuple[str, str, int, int, str]]] = {'venues': []}
    for city, (high, low, names) in VENUE_CITIES.items():
        for name, price in zip(names, price_ladder(high, low, len(names), 1_000)):
            vendors['venues'].append((name, city, price, round(price * 1.3, -3), 'table'))

    for category, (high, low, unit, step, taipei_names) in OTHER_CATEGORIES.items():
        vendors[category] = []
        for city, scale in CITY_PRICE_SCALE.items():
            names = city_names(category, city, taipei_names)
            prices = price_ladder(round(high * scale), round(low * scale), len(names), step)
            vendors[category] += [
                (name, city, price, round(price * 1.3 / step) * step, unit) for name, price in zip(names, prices)
            ]

    for category, rows in vendors.items():
        names = [row[0] for row in rows]
        repeated = sorted({n for n in names if names.count(n) > 1})
        if repeated:
            raise SystemExit(f'{category}: each vendor name must be used once, but these repeat: {repeated}')
    return vendors


VENDORS = build_vendors()

# Demo photos: free Pexels photos (pexels.com/license), cropped to 4:3 at 800x600 and
# served by Vite from public/vendors/. Numbers are the Pexels photo IDs, in file order.
# Six per category; replace the files in public/vendors/ to use your own.
PHOTO_SOURCES = {
    'venues': [17315458, 13834522, 36028895, 17206153, 12876404, 17023014],
    'photography': [5729053, 13470038, 17057198, 3990404, 3347413, 13217377],
    'attire': [5618793, 8459398, 291759, 8459313, 19815532, 13847665],
    'bridal-styling': [1900578, 20593111, 2997775, 7712437, 11083630, 8784918],
    'hosting': [18662956, 27743361, 8872482, 10541661, 811572, 8872472],
    'favors': [1346345, 2337851, 20526713, 7180263, 16014880, 8014845],
}


def demo_photo(category_slug: str, index: int) -> str:
    """Photos repeat in price order. A row shows at most 6 vendors, always neighbours
    in price order, so with 6 photos the same one never appears twice in a row.
    `index` counts within what one row can show: per city when the category matches by city."""
    count = len(PHOTO_SOURCES[category_slug])
    return f'/vendors/{category_slug}-{index % count + 1}.jpg'


def seed() -> None:
    if sum(share for _, _, share, _ in CATEGORIES) != 100:
        raise SystemExit('Category shares must add up to 100.')

    with SessionLocal() as session:
        categories = {c.slug: c for c in session.scalars(select(Category))}
        for order, (slug, name, share, by_city) in enumerate(CATEGORIES, start=1):
            category = categories.get(slug) or Category(slug=slug)
            category.name, category.share_percent, category.match_by_city, category.sort_order = name, share, by_city, order
            categories[slug] = category
            session.add(category)

        cities = {c.slug: c for c in session.scalars(select(City))}
        for order, (slug, name) in enumerate(CITIES, start=1):
            city = cities.get(slug) or City(slug=slug)
            city.name, city.sort_order = name, order
            cities[slug] = city
            session.add(city)

        session.flush()  # Gives new categories and cities their Id before others refer to them.

        subcategories = {s.slug: s for s in session.scalars(select(Subcategory))}
        for category_slug, subs in SUBCATEGORIES.items():
            for order, (slug, name) in enumerate(subs, start=1):
                sub = subcategories.get(slug) or Subcategory(slug=slug)
                sub.category_id, sub.name, sub.sort_order = categories[category_slug].id, name, order
                subcategories[slug] = sub
                session.add(sub)

        session.flush()

        existing = {(v.category_id, v.name): v for v in session.scalars(select(Vendor))}
        seeded: set[tuple[int, str]] = set()
        kept: set[Vendor] = set()  # The exact rows this run keeps, new or updated.
        for category_slug, rows in VENDORS.items():
            category = categories[category_slug]
            per_city: dict[str, int] = {}
            for index, (name, city_slug, price_min, price_max, unit) in enumerate(rows):
                assert unit in PRICE_UNITS, unit
                # Photos count per city, since a row only shows one city.
                if category.match_by_city:
                    photo_index = per_city.get(city_slug, 0) + CITY_PHOTO_OFFSET.get(city_slug, 0)
                else:
                    photo_index = index
                # Demo vendors take turns between the subcategories, so every
                # subcategory gets a mix of prices in every city.
                subs = SUBCATEGORIES[category_slug]
                sub_slug = subs[per_city.get(city_slug, 0) % len(subs)][0]
                per_city[city_slug] = per_city.get(city_slug, 0) + 1

                key = (category.id, name)
                vendor = existing.get(key) or Vendor(category_id=category.id, name=name)
                vendor.city_id = cities[city_slug].id
                vendor.subcategory_id = subcategories[sub_slug].id
                vendor.price_min, vendor.price_max, vendor.price_unit = price_min, price_max, unit
                vendor.image_url = demo_photo(category_slug, photo_index)
                vendor.is_demo, vendor.is_active = True, True
                session.add(vendor)
                seeded.add(key)
                kept.add(vendor)

        # Every other demo vendor is from an older version of this list, or a duplicate
        # the dictionary above didn't pick: delete it. Only IsDemo rows are removed.
        # (Compare rows, not names: on an empty database every vendor is new.)
        retired = [v for v in session.scalars(select(Vendor).where(Vendor.is_demo)) if v not in kept]
        for vendor in retired:
            session.delete(vendor)

        # Subcategories no longer listed above: delete them (after their vendors moved on).
        listed = {slug for subs in SUBCATEGORIES.values() for slug, _ in subs}
        for slug, sub in subcategories.items():
            if slug not in listed:
                session.delete(sub)

        session.commit()
        print(f'Seeded {len(CATEGORIES)} categories, {len(listed)} subcategories, {len(CITIES)} cities, '
              f'{len(seeded)} demo vendors ({len(retired)} old demo vendors deleted).')


if __name__ == '__main__':
    seed()
