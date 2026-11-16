"""The calculation rules from SPEC.md section 3, as plain functions.

No database or web code here, so the rules are easy to read and to test on their own.
"""

import math
from collections.abc import Sequence
from typing import Protocol

MIN_BUDGET = 100_000  # Same as MIN_BUDGET in src/api/plan.ts.
MAX_BUDGET = 9_999_999_999
MAX_GUESTS = 9_999
GUESTS_PER_TABLE = 10  # Taiwanese banquets seat 10 per table.
VENDORS_PER_CATEGORY = 6
# The vendors page (GET /api/vendors) shows this many random vendors at a time.
VENDORS_PER_PAGE = 8


class ShareLike(Protocol):
    slug: str
    share_percent: int


def allocate(total_budget: int, categories: Sequence[ShareLike]) -> dict[str, int]:
    """Split the whole budget across the categories (SPEC 3.2).

    Each amount is the category's share rounded to NT$1,000. The rounding
    difference goes to the category with the largest share (the first one listed
    if two tie), so the amounts always add up to exactly total_budget.
    """
    if sum(c.share_percent for c in categories) != 100:
        raise ValueError('Category shares must add up to 100.')

    allocations = {c.slug: round_to_thousand(total_budget * c.share_percent / 100) for c in categories}
    largest = max(categories, key=lambda c: c.share_percent)
    allocations[largest.slug] += total_budget - sum(allocations.values())
    return allocations


def round_to_thousand(amount: float) -> int:
    # Half rounds up, like Math.round in the frontend. (Python's round() would
    # round half to even, so 1,500 could become 2,000 or 1,000 depending on luck.)
    return math.floor(amount / 1000 + 0.5) * 1000


def table_count(guest_count: int) -> int:
    """Guests divided by 10, rounded up (SPEC 3.3)."""
    return math.ceil(guest_count / GUESTS_PER_TABLE)


def estimated_cost(price_min: int, price_unit: str, guest_count: int) -> int:
    """A vendor's total for this wedding (SPEC 3.4)."""
    if price_unit == 'table':
        return price_min * table_count(guest_count)
    if price_unit == 'guest':
        return price_min * guest_count
    return price_min
