"""Checks for the calculation rules. Run from the backend folder: .venv/bin/pytest"""

from dataclasses import dataclass

import pytest

from app.rules import allocate, estimated_cost, table_count


@dataclass
class Share:
    slug: str
    share_percent: int


CATEGORIES = [
    Share('venues', 55),
    Share('photography', 13),
    Share('attire', 10),
    Share('bridal-styling', 8),
    Share('hosting', 8),
    Share('favors', 6),
]


def test_allocation_matches_the_spec_example():
    # SPEC.md 3.2: NT$1,234,567, the odd remainder lands on venues.
    assert allocate(1_234_567, CATEGORIES) == {
        'venues': 679_567,
        'photography': 160_000,
        'attire': 123_000,
        'bridal-styling': 99_000,
        'hosting': 99_000,
        'favors': 74_000,
    }


@pytest.mark.parametrize('total', [100_000, 1_200_000, 1_234_567, 3_333_333, 9_999_999_999])
def test_allocation_always_adds_up_to_the_total(total):
    assert sum(allocate(total, CATEGORIES).values()) == total


def test_half_rounds_up_like_the_frontend():
    # 6% of 1,175,000 is 70,500. Math.round in the frontend gives 71,000;
    # Python's built-in round() would give 70,000 (it rounds half to even).
    assert allocate(1_175_000, CATEGORIES)['favors'] == 71_000


def test_shares_must_add_up_to_100():
    with pytest.raises(ValueError):
        allocate(1_000_000, CATEGORIES[:-1])


@pytest.mark.parametrize(('guests', 'tables'), [(1, 1), (10, 1), (11, 2), (150, 15), (151, 16)])
def test_table_count_rounds_up(guests, tables):
    assert table_count(guests) == tables


def test_estimated_cost_by_price_unit():
    assert estimated_cost(80_000, 'event', 150) == 80_000
    assert estimated_cost(20_000, 'table', 151) == 320_000  # 16 tables
    assert estimated_cost(480, 'guest', 150) == 72_000
