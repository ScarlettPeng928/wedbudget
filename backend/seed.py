"""Fill the database with the starting data (SPEC.md section 6).

Run from the backend folder, after `alembic upgrade head`:

    .venv/bin/python seed.py

Safe to run again: existing rows are updated by their key (Slug for categories,
subcategories and cities, category + name for vendors), never added twice. Demo vendors that
are no longer listed here are deleted (real vendors are never touched).

Rule: a vendor name appears once per category. Real vendors don't run the same
shop in several cities, so the demo data doesn't either.
"""

import json
from pathlib import Path

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
# 10 vendors per subcategory in every city: 17 x 24 x 10 = 4,080 in all.
# Prices run from high to low in small,
# even steps, so moving a slider almost always lets a vendor in or out of a row.
# Each step is the same percentage (a ratio ladder), so cheap and expensive
# vendors are equally dense.


def price_ladder(high: int, low: int, count: int, step: int) -> list[int]:
    """`count` prices from `high` down to `low`, rounded to `step`."""
    ratio = (low / high) ** (1 / (count - 1))
    return [round(high * ratio**i / step) * step for i in range(count)]


VENDORS_PER_CITY = 10

# Every city has demo vendors. Vendors take turns between the cities in price
# order, so every city gets the full price range. Taipei is the price base;
# other cities cost a little less.
CITY_PRICE_SCALE = {
    'taipei': 1.0, 'new-taipei': 0.95, 'keelung': 0.85, 'taoyuan': 0.9, 'hsinchu': 0.92,
    'miaoli': 0.8, 'taichung': 0.9, 'changhua': 0.8, 'nantou': 0.78, 'yunlin': 0.75,
    'chiayi': 0.78, 'tainan': 0.85, 'kaohsiung': 0.85, 'pingtung': 0.78, 'yilan': 0.82,
    'hualien': 0.8, 'taitung': 0.75,
}

# Per subcategory: (highest, lowest) at Taipei prices, then hand-written names.
# The rest of the names are made up from NAME_WORDS + SUBCATEGORY_SUFFIXES.
# The price unit and rounding step come from the category (CATEGORY_UNITS),
# unless the subcategory has its own (SUBCATEGORY_UNITS).
# Names are made up. A name appears once per category.
DEMO_VENDORS = {
    # Venues: NT$ per table, except outdoor venues (buffet, NT$ per guest).
    'hotel-banquet': ((35_000, 25_000), [
        'Aurelia Grand Hotel', 'Velmont Hotel', 'The Orchid Crest', 'Solenne Hotel', 'Linden Park Hotel',
        'Starling Hotel', 'Ivoria Hotel', 'Halcyon Hotel', 'Royal Camellia Hotel', 'The Bellmoor',
        'Wisteria Grand', 'Eastgate Hotel', 'The Ashcombe', 'Crystal Bay Hotel', 'Maplewood Hotel',
        'Silverleaf Hotel', 'Rosemont Hotel', 'Northstar Hotel', 'Jadecourt Hotel', 'The Peony Hotel',
    ]),
    'wedding-hall': ((25_000, 16_000), [
        'Everbloom Hall', 'Promise Wedding Hall', 'Twin Hearts Hall', 'Lantern Hall', 'Union Hall',
        'Ever After Hall', 'Golden Bell Hall', 'Petal Hall', 'Joyful Union Hall', 'Moonrise Hall',
        'Blossom Hall', 'Forever Hall', 'Grand Vow Hall', 'Harmony Hall', 'Celeste Hall',
        'Rosewood Hall', 'First Light Hall', 'Willow Hall', 'Two Rings Hall', 'Happy Day Hall',
    ]),
    'restaurant': ((16_000, 8_000), [
        'Jade Table', 'The Long Table', 'Copper Pot', 'Lotus Kitchen', 'Bamboo Court',
        'Red Lantern House', 'Little Feast', 'Harvest Table', 'Old Tea House', 'Ginger & Garlic',
        'Plum Blossom Kitchen', 'River Bistro', 'Hearth & Home', 'Five Flavors', 'Seaside Kitchen',
        'Rice & Salt', 'The Courtyard Kitchen', 'Golden Wok', 'Morning Market Kitchen', 'Sesame House',
    ]),
    'outdoor-garden': ((2_500, 1_500), [
        'Green Meadow Garden', 'Hillside Estate', 'Willow Creek Garden', 'Sunflower Farm', 'Camphor Grove',
        'Lakeside Lawn', 'Wildflower Estate', 'Rose Garden Manor', 'Tea Hill Terrace', 'Pine Ridge Garden',
        'Orchard House', 'Secret Garden Venue', 'Riverbank Garden', 'Mountain View Lawn', 'Bamboo Grove Garden',
        'Firefly Valley', 'Olive Terrace', 'Butterfly Garden', 'Seabreeze Lawn', 'Ivy Manor',
    ]),
    # Photography & Video: NT$ per event.
    'photographer': ((120_000, 22_000), [
        'Lumen Studio', 'Still Moments', 'Golden Hour Co.', 'North Light', 'Window Light',
        'Kind Eye Studio', 'First Frame', 'Silver Frame', 'Paper Lens', 'Open Shutter',
        'Soft Grain', 'True Colors Photo', 'Candid Day', 'Moments & Co.', 'Lightbox Studio',
        'Honest Frame', 'Warm Tone Photo', 'Shutter & Bloom', 'Little Moments', 'Clear Sky Photo',
    ]),
    'videographer': ((150_000, 28_000), [
        'Daydream Films', 'Little Reel', 'Field Notes Film', 'Slow Motion Co.', 'Reel Love',
        'Frame by Frame', 'Story Reel', 'Cinema Vow', 'Super 8 Studio', 'Golden Reel',
        'Moving Pictures Co.', 'Love Story Films', 'Open Reel', 'Wide Shot Films', 'Highlight Films',
        'Moonlight Films', 'Silver Screen Vows', 'Rolling Films', 'Take One Studio', 'Ever Films',
    ]),
    'pre-wedding-studio': ((320_000, 38_000), [
        'Atelier Lune', 'Muse Bridal Studio', 'Velvet Studio', 'Dreamy Days Studio', 'Ivory Studio',
        'Blush Bridal Photo', 'Maison Photo', 'Rose Studio', 'Cloud Nine Studio', 'Serendipity Studio',
        'Pearl Studio', 'Lavender Studio', 'Petal Studio', 'Amour Studio', 'Sweet Days Studio',
        'Stardust Studio', 'Ocean Blue Studio', 'Moon River Studio', 'Garden Muse Studio', 'Forever Young Studio',
    ]),
    'photo-booth': ((36_000, 8_000), [
        'Snap Happy Booth', 'Say Cheese Booth', 'Pop & Print', 'Smile Box', 'Flash Booth',
        'Instant Joy', 'Click Click Booth', 'Print Party', 'Booth & Co.', 'Happy Snaps',
        'Selfie Station', 'Fun Frame Booth', 'Pose Box', 'Little Flash', 'Party Pics',
        'Strip Studio', 'Photo Strip Co.', 'Glitter Booth', 'Shutter Box', 'Cheese Corner',
    ]),
    # Wedding Attire: NT$ per event.
    'gown-rental': ((120_000, 22_000), [
        'Atelier Blanc', 'Ivory Lane', 'White Petal', 'Borrowed Blue', 'Simple Vow',
        'Daily Dress', 'Lace & Linen', 'Satin Corner', 'Bridal Closet', 'Gown Library',
        'Dress for a Day', 'Veil & Lace', 'Second Bloom Bridal', 'Tulle House', 'Wedding Wardrobe',
        'Lily Bridal', "Bride's Closet", 'Grace Gowns', 'Silk Rental', 'Blue Ribbon Bridal',
    ]),
    'custom-gowns': ((300_000, 75_000), [
        'Maison Vela', 'Couture Lane', 'Silk Row', 'Pearl & Thread', 'Velvet Room',
        'Thread Studio', 'Sew Sweet', 'Atelier Seraphine', 'Noor Couture', 'Haute Lace',
        'Ivory Atelier', 'Needle & Bloom', 'Couture Bloom', 'Atelier Mei', 'Golden Needle',
        'Studio Ivoire', 'Lumière Couture', 'Tailored Dreams', 'The Lace Room', 'Bespoke Bride',
    ]),
    'suits': ((60_000, 12_000), [
        'The Tailor House', 'Sharp & Co.', "Gentleman's Row", 'Fine Cut Tailors', 'Groom Room',
        'Bespoke Lane', 'Navy & Grey', 'Lapel Studio', 'Tux & Tie', 'Well Suited',
        'Button Up', 'Classic Cut', 'Savile Studio', 'The Fitting Room', 'Tie & Cuff',
        'Linen & Wool', 'Dapper Groom', 'Cufflink Co.', 'Steel Grey Tailors', 'The Suit Shop',
    ]),
    'accessories': ((30_000, 5_000), [
        'Little Tiara', 'Pearl Box', 'Veil Studio', 'Something Blue', 'Crystal Comb',
        'Silver Veil', 'Bridal Jewel Box', 'Ribbon & Pearl', 'Golden Hairpin', 'Garter & Lace',
        'Dainty Things', 'Sparkle Studio', 'Petite Pearl', 'Moonstone Bridal', 'Lace Gloves Co.',
        'Ivory Ribbon', 'Diamond Dust', 'Hairpin House', 'Bridal Trinkets', 'Shimmer & Shine',
    ]),
    # Bridal Styling: NT$ per event.
    'bridal-stylist': ((150_000, 28_000), [
        'Glow Room', 'Atelier Rouge', 'Muse Styling', 'Soft Focus Styling', 'Blush Hour',
        'Gloss & Grace', 'Bloom Beauty', 'Bridal Muse', 'Grace Styling', 'The Bride Studio',
        'Pretty Day', 'Rosy Cheeks Studio', 'Lovely Bride', 'Belle Styling', 'Morning Glow',
        'Little Muse', 'Elegance Styling', 'Charm Studio', 'Golden Bride', 'Bride & Glow',
    ]),
    'makeup-artist': ((40_000, 8_000), [
        'Petal Beauty', 'Silk Touch', 'Fine Line Makeup', 'Little Brush', 'Fresh Face',
        'Quick Glow', 'Rose Water', 'Brush & Blush', 'Flawless Studio', 'Pink Palette',
        'Beauty Bar', 'Glam Room', 'Natural Glow', 'Lash & Brow', 'Pure Beauty',
        'Contour Co.', 'Velvet Lips', 'Radiant Studio', 'Makeup by Mia', 'Bare Beauty',
    ]),
    'hair-studio': ((25_000, 6_000), [
        'Hair Ribbon', 'Updo Studio', 'Braids & Blooms', 'Silk Strands', 'Curl Studio',
        'The Hair Loft', 'Crown & Curl', 'Bridal Locks', 'Twist Studio', 'Hair Story',
        'Shine Salon', 'Soft Waves', 'Pin & Curl', 'Chignon Studio', 'Hair Bloom',
        'Golden Locks', 'Hairpin Salon', 'Sweet Curls', 'Ribbon Salon', 'Wave Room',
    ]),
    'nails': ((5_000, 1_000), [
        'Polished', 'Nail Nook', 'Pink Tips', 'Lacquer Lab', 'Gel & Grace',
        'Nail Bloom', 'Little Nails', 'Mani Studio', 'Glossy Nails', 'Petal Nails',
        'Pearl Nails', 'French Tips', 'Nail Story', 'Shine Nails', 'Velvet Nails',
        'Coral Nails', 'Blush Nails', 'Nail Garden', 'Crystal Nails', 'Tiny Tips',
    ]),
    # Hosting & Planning: NT$ per event.
    'wedding-planner': ((150_000, 35_000), [
        'North Plan Co.', 'Vow & Co.', 'Joy Planners', 'Ribbon Events', 'Plan Lite',
        'Happily Planned', 'Two Hearts Events', 'The Wedding Edit', 'Blueprint Weddings', 'Ever After Planning',
        'Bloom Events', 'Petal & Plan', 'Big Day Co.', 'The Planning Room', 'Love & Logistics',
        'Dream Day Planners', 'Golden Thread Events', 'Simply Wed', 'Wedding Notes', 'Paper Heart Events',
    ]),
    'emcee': ((40_000, 8_000), [
        'Grand Toast', 'The Toast Host', 'Warm Mic', 'Small Talk Hosts', 'Hello Host',
        'Friendly Mic', 'Golden Voice', 'Mic Drop Hosts', 'Cheers Hosting', 'Clear Voice',
        'Happy Host', 'Stage Left', 'Spotlight Hosts', 'Toast & Talk', 'Smooth Talk',
        'Big Smile Hosts', 'Voice of Joy', 'Best Words', 'Charming Host', 'Word & Wit',
    ]),
    'day-of-coordinator': ((50_000, 12_000), [
        'Day Of Studio', 'Easy Day', 'Cue Card', 'Open Floor', 'On Cue',
        'Smooth Day', 'Run of Show', 'Calm Day Co.', 'Timeline Co.', 'Checklist Co.',
        'All Set Weddings', 'No Worries Day', 'Helping Hands', 'Steady Day', 'Right on Time',
        'Peace of Mind Co.', 'Ready Set Wed', 'Clipboard Co.', 'Day Keepers', 'Just Breathe Weddings',
    ]),
    'live-music': ((80_000, 15_000), [
        'Bright Stage', 'Silver Strings', 'Golden Brass', 'Jazz & Vows', 'Velvet Keys',
        'Moonlight Band', 'First Dance Band', 'Acoustic Hearts', 'Swing Time', 'Piano & Rose',
        'Soul Strings', 'The Wedding Band', 'Harmony Duo', 'Blue Hour Band', 'Sunday Jazz',
        'Violin & Co.', 'Melody Lane', 'Groove Night', 'Serenade Strings', 'Encore Band',
    ]),
    # Wedding Favors: NT$ per guest.
    'traditional-chinese': ((1_200, 280), [
        'Moon Bakery', 'Almond House', 'Golden Crumb', 'Royal Crumb', 'Red Bean House',
        'Lotus Pastry', 'Jade Cake House', 'Double Happiness Bakery', 'Phoenix Pastry', 'Plum Cake House',
        'Golden Lotus Bakery', 'Old Street Pastry', 'Sesame Moon', 'Taro Cake Co.', 'Peanut Brittle House',
        'Pineapple Cake Co.', 'Dragon & Phoenix Cakes', 'Lucky Cake House', 'Heritage Pastry', "Grandma's Bakery",
    ]),
    'western': ((900, 220), [
        'Sweet Keep', 'Paper & Honey', 'Butter Bite', 'Petit Four Co.', 'Macaron Lane',
        'Sugar & Lace', 'Patisserie Rose', 'Little Paris', 'Crème Box', 'Pastel Sweets',
        'Le Petit Gâteau', 'Almond & Rose', 'Sweet Ribbon', 'Choux Box', 'Vanilla Bean Co.',
        'Tart & Tulle', 'Sucre Studio', 'Ribbon Patisserie', 'Biscuit Box', 'Doux Doux',
    ]),
    'handmade-cookies': ((600, 150), [
        'Tiny Treats', 'Crumbs & Co.', 'Small Joys', 'Plain Sugar', 'Honey Jar',
        'Cookie Jar Co.', 'Iced & Sweet', 'Sugar Cookie Studio', 'Hand Iced Co.', 'Little Oven',
        'Sprinkle Studio', 'Cookie Love', 'Baked with Joy', 'Butter & Sugar', 'Icing on Top',
        'Home Oven', 'Cookie Notes', 'Sweet Hands', 'Royal Icing Co.', 'Crumb Story',
    ]),
    'imported': ((1_600, 380), [
        'Thank You Box', 'Little Tokens', 'Bean & Bloom', 'Tea Cake Co.', 'Cocoa House',
        'Truffle Box', 'Euro Treats', 'Belgian Box', 'Swiss Sweet', 'Praline House',
        'Gift Box Co.', 'Velvet Cocoa', 'World Sweets', 'Grand Truffle', 'Cacao Lane',
        'Chocolate Lane', 'Bon Bon Box', 'Cocoa & Co.', 'Choco Gift', 'Sweet Import Co.',
    ]),
}

# category -> (price unit, rounding step)
CATEGORY_UNITS = {
    'venues': ('table', 1_000),
    'photography': ('event', 1_000),
    'attire': ('event', 1_000),
    'bridal-styling': ('event', 500),
    'hosting': ('event', 1_000),
    'favors': ('guest', 10),
}
SUBCATEGORY_UNITS = {
    'outdoor-garden': ('guest', 50),
}

# Generated names: one word + a word for the kind of vendor ("Amber Hall").
# Suffixes don't repeat within a category, so the names can't either.
NAME_WORDS = [
    'Amber', 'Birch', 'Clover', 'Dune', 'Ember', 'Fern', 'Garnet', 'Hazel', 'Iris', 'Juniper',
    'Kite', 'Linden', 'Marigold', 'Nectar', 'Oak', 'Poppy', 'Quill', 'Reef', 'Saffron', 'Tide',
    'Umber', 'Vale', 'Wren', 'Yarrow', 'Zephyr', 'Azure', 'Bay', 'Coral', 'Drift', 'Harbor',
    'Isle', 'Lagoon', 'Aster', 'Briar', 'Cedar', 'Dahlia', 'Elm', 'Fable', 'Gale', 'Heather',
    'Indigo', 'Jasmine', 'Laurel', 'Meadow', 'Nova', 'Olive', 'Pearl', 'Quartz', 'Rowan', 'Sage',
    'Thistle', 'Velvet', 'Willow', 'Acacia', 'Bloom', 'Cove', 'Daisy', 'Echo', 'Fir', 'Glade',
    'Honey', 'Ivory', 'June', 'Lark', 'Maple', 'Opal', 'Pine', 'River', 'Sparrow', 'Tulip',
]
SUBCATEGORY_SUFFIXES = {
    'hotel-banquet': ['Hotel', 'Grand Hotel', 'Hotel Ballroom'],
    'wedding-hall': ['Hall', 'Wedding Hall', 'Banquet Hall'],
    'restaurant': ['Kitchen', 'Bistro', 'Dining'],
    'outdoor-garden': ['Garden', 'Estate', 'Lawn'],
    'photographer': ['Photo', 'Photography', 'Studio'],
    'videographer': ['Films', 'Cinema', 'Motion'],
    'pre-wedding-studio': ['Bridal Studio', 'Portraits', 'Wedding Photo'],
    'photo-booth': ['Booth', 'Photo Booth', 'Snaps'],
    'gown-rental': ['Bridal', 'Gowns', 'Bridal Rental'],
    'custom-gowns': ['Couture', 'Atelier', 'Bridal Couture'],
    'suits': ['Tailors', 'Suits', 'Menswear'],
    'accessories': ['Jewels', 'Veils', 'Accessories'],
    'bridal-stylist': ['Styling', 'Bridal Styling', 'Bride Studio'],
    'makeup-artist': ['Makeup', 'Beauty', 'Glam'],
    'hair-studio': ['Hair', 'Salon', 'Hair Studio'],
    'nails': ['Nails', 'Nail Studio', 'Nail Bar'],
    'wedding-planner': ['Weddings', 'Events', 'Planning'],
    'emcee': ['Hosts', 'Emcee', 'MC'],
    'day-of-coordinator': ['Coordination', 'Day-of', 'Wedding Day'],
    'live-music': ['Band', 'Strings', 'Ensemble'],
    'traditional-chinese': ['Bakery', 'Pastry', 'Cake House'],
    'western': ['Patisserie', 'Sweets', 'Macarons'],
    'handmade-cookies': ['Cookies', 'Cookie Co.', 'Biscuits'],
    'imported': ['Chocolates', 'Confections', 'Gifts'],
}


def vendor_names(sub_slug: str, count: int, taken: set[str]) -> list[str]:
    """The hand-written names first, then generated ones, skipping names already used."""
    _, written = DEMO_VENDORS[sub_slug]
    candidates = written + [f'{word} {suffix}' for suffix in SUBCATEGORY_SUFFIXES[sub_slug] for word in NAME_WORDS]
    names = []
    for name in candidates:
        if name not in taken:
            names.append(name)
            taken.add(name)
            if len(names) == count:
                return names
    raise SystemExit(f'{sub_slug}: not enough names for {count} vendors. Add words to NAME_WORDS.')

# Demo photos: free Unsplash photos (unsplash.com/license), 10 per subcategory,
# chosen by hand. Unsplash serves them cropped to 4:3 at 800x600 (the w/h/fit
# parameters in each URL). Photographer credits are in CREDITS.md.
DEMO_PHOTOS: dict[str, list[dict[str, str]]] = json.loads(
    (Path(__file__).parent / 'demo_photos.json').read_text(encoding='utf-8'))



def build_vendors() -> dict[str, list[tuple[str, str, str, int, int, str, str]]]:
    """category -> [(name, subcategory, city, price min, price max, unit, photo URL)].

    A subcategory has 10 vendors per city and 10 photos, so a page filtered to
    one city and one subcategory never shows the same photo twice.
    """
    cities = [slug for slug, _ in CITIES]
    count = VENDORS_PER_CITY * len(cities)
    vendors: dict[str, list[tuple[str, str, str, int, int, str, str]]] = {}
    for category, subs in SUBCATEGORIES.items():
        taken: set[str] = set()
        rows = vendors.setdefault(category, [])
        for sub_slug, _ in subs:
            unit, step = SUBCATEGORY_UNITS.get(sub_slug, CATEGORY_UNITS[category])
            (high, low), _ = DEMO_VENDORS[sub_slug]
            photos = DEMO_PHOTOS[sub_slug]
            names = vendor_names(sub_slug, count, taken)
            for index, (name, base_price) in enumerate(zip(names, price_ladder(high, low, count, step))):
                city_index, turn = index % len(cities), index // len(cities)
                city = cities[city_index]
                price = round(base_price * CITY_PRICE_SCALE[city] / step) * step
                # Each city starts at a different photo, so switching city changes the pictures.
                photo = photos[(turn + city_index * 3) % len(photos)]['url']
                rows.append((name, sub_slug, city, price, round(price * 1.3 / step) * step, unit, photo))

    for category, rows in vendors.items():
        names = [row[0] for row in rows]
        repeated = sorted({n for n in names if names.count(n) > 1})
        if repeated:
            raise SystemExit(f'{category}: each vendor name must be used once, but these repeat: {repeated}')
    return vendors


VENDORS = build_vendors()


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
            for name, sub_slug, city_slug, price_min, price_max, unit, photo in rows:
                assert unit in PRICE_UNITS, unit
                key = (category.id, name)
                vendor = existing.get(key) or Vendor(category_id=category.id, name=name)
                vendor.city_id = cities[city_slug].id
                vendor.subcategory_id = subcategories[sub_slug].id
                vendor.price_min, vendor.price_max, vendor.price_unit = price_min, price_max, unit
                vendor.image_url = photo
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
