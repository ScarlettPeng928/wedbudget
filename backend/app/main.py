"""WedBudget API. Run from the backend folder:

    .venv/bin/uvicorn app.main:app --reload

Then open http://localhost:8000/docs to try every endpoint in the browser.
"""

import logging
from typing import Annotated

from fastapi import Depends, FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy import case, func, select, text
from sqlalchemy.orm import Session, joinedload

from . import rules
from .db import get_session
from .models import Category, City, Subcategory, Vendor
from .schemas import (
    CategoryOut,
    CityOut,
    PlanRequest,
    PlanResult,
    SubcategoryOut,
    VendorListItem,
    VendorMatchRequest,
    VendorOut,
)

logger = logging.getLogger('wedbudget')

app = FastAPI(title='WedBudget API')

DbSession = Annotated[Session, Depends(get_session)]


# ---------- Errors (SPEC 5.7) ----------


class FieldError(Exception):
    """A request field that fails a rule the schema can't check, like an unknown city."""

    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message


# The English messages the frontend shows, per field. 'max' is used when a number
# is too large; 'default' for everything else (missing, too small, not a number).
FIELD_MESSAGES = {
    'totalBudget': {
        'default': f'Enter at least NT${rules.MIN_BUDGET:,}.',
        'max': f'Enter at most NT${rules.MAX_BUDGET:,}.',
    },
    'city': {'default': 'Select a city.'},
    'guestCount': {
        'default': 'Enter at least 1 guest.',
        'max': f'Enter at most {rules.MAX_GUESTS:,} guests.',
    },
    'allocations': {'default': 'Enter each amount as a whole number of NT$0 or more.'},
    'category': {'default': 'Choose a category.'},
    'subcategory': {'default': 'Choose a type of vendor in this category.'},
}


@app.exception_handler(FieldError)
async def field_error_handler(request: Request, exc: FieldError):
    return JSONResponse(status_code=422, content={'field': exc.field, 'message': exc.message})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Report only the first problem, in the { field, message } shape from the spec.
    error = exc.errors()[0]
    loc = error.get('loc', ())
    field = str(loc[1]) if len(loc) > 1 else 'body'
    messages = FIELD_MESSAGES.get(field)
    if messages is None:
        return JSONResponse(status_code=422, content={'field': 'body', 'message': 'Send the plan details as JSON.'})
    kind = 'max' if error['type'] == 'less_than_equal' else 'default'
    return JSONResponse(status_code=422, content={'field': field, 'message': messages.get(kind, messages['default'])})


@app.exception_handler(Exception)
async def server_error_handler(request: Request, exc: Exception):
    # Full details go to the server log; the visitor gets a plain message.
    logger.exception('Unhandled error on %s', request.url.path)
    return JSONResponse(status_code=500, content={'message': 'Something went wrong on our side. Try again in a moment.'})


# ---------- Helpers ----------


def ordered_categories(session: Session) -> list[Category]:
    return list(session.scalars(select(Category).order_by(Category.sort_order)))


def find_city(session: Session, slug: str) -> City:
    city = session.scalar(select(City).where(City.slug == slug))
    if city is None:
        raise FieldError('city', FIELD_MESSAGES['city']['default'])
    return city


# ---------- Endpoints (SPEC 5) ----------


@app.get('/api/health')
def health(session: DbSession):
    session.execute(text('SELECT 1'))  # Fails (500) if the database is unreachable.
    return {'status': 'ok'}


@app.get('/api/categories', response_model=list[CategoryOut])
def list_categories(session: DbSession):
    return [CategoryOut(slug=c.slug, name=c.name, share=c.share_percent) for c in ordered_categories(session)]


@app.get('/api/cities', response_model=list[CityOut])
def list_cities(session: DbSession):
    cities = session.scalars(select(City).order_by(City.sort_order))
    return [CityOut(slug=c.slug, name=c.name) for c in cities]


@app.post('/api/plan', response_model=PlanResult)
def create_plan(body: PlanRequest, session: DbSession):
    find_city(session, body.city)  # City doesn't change the split, but it must exist.
    allocations = rules.allocate(body.total_budget, ordered_categories(session))
    return PlanResult(request=body, allocations=allocations)


@app.post('/api/vendors/match', response_model=dict[str, list[VendorOut]])
def match_vendors(body: VendorMatchRequest, session: DbSession):
    if any(amount < 0 for amount in body.allocations.values()):
        raise FieldError('allocations', FIELD_MESSAGES['allocations']['default'])
    city = find_city(session, body.city)

    result: dict[str, list[VendorOut]] = {}
    for category in ordered_categories(session):
        budget = body.allocations.get(category.slug, 0)
        query = (
            select(Vendor)
            .options(joinedload(Vendor.city))
            .where(
                Vendor.category_id == category.id,
                Vendor.is_active,
                # The estimated cost is never below PriceMin, so this skips vendors
                # that can't fit before the exact check below.
                Vendor.price_min <= budget,
            )
        )
        if category.match_by_city:
            query = query.where(Vendor.city_id == city.id)

        matches = []
        for vendor in session.scalars(query):
            cost = rules.estimated_cost(vendor.price_min, vendor.price_unit, body.guest_count)
            if cost <= budget:
                matches.append((cost, vendor))

        # Highest estimated cost first; Id breaks ties so the order never shuffles.
        matches.sort(key=lambda m: (-m[0], m[1].id))
        result[category.slug] = [
            VendorOut(
                id=v.id,
                name=v.name,
                city=CityOut(slug=v.city.slug, name=v.city.name),
                price_min=v.price_min,
                price_max=v.price_max,
                price_unit=v.price_unit,
                estimated_cost=cost,
                image_url=v.image_url,
                website_url=v.website_url,
                is_demo=v.is_demo,
            )
            for cost, v in matches[: rules.VENDORS_PER_CATEGORY]
        ]
    return result


@app.get('/api/vendors', response_model=list[VendorListItem])
def list_vendors(
    session: DbSession,
    category: str,
    city: str | None = None,
    subcategory: str | None = None,
    budget: Annotated[int | None, Query(ge=0, le=rules.MAX_BUDGET)] = None,
    guests: Annotated[int | None, Query(ge=1, le=rules.MAX_GUESTS)] = None,
    seed: Annotated[int | None, Query(ge=0, le=2_147_483_647)] = None,
    offset: Annotated[int, Query(ge=0, le=10_000)] = 0,
    limit: Annotated[int, Query(ge=1, le=rules.MAX_VENDORS_PER_REQUEST)] = rules.VENDORS_PER_PAGE,
):
    """Random vendors in one category for the vendors page. Leave out `city` for all of
    Taiwan, and `subcategory` for every kind of vendor in the category.

    With `budget` (and `guests`, which it needs), only vendors whose estimated cost
    for that many guests fits the budget: the same rule as the plan page's matches.

    Paging ("Show more"): pass the same `seed` with a growing `offset`. The seed fixes
    one shuffled order, so later pages continue it without repeats; a new seed (a new
    visit) gives a new order. Without a seed, a fresh random pick each time."""
    found = session.scalar(select(Category).where(Category.slug == category))
    if found is None:
        raise FieldError('category', FIELD_MESSAGES['category']['default'])

    query = (
        select(Vendor)
        .options(joinedload(Vendor.city), joinedload(Vendor.subcategory))
        .where(Vendor.category_id == found.id, Vendor.is_active)
    )
    if city is not None:
        query = query.where(Vendor.city_id == find_city(session, city).id)
    if subcategory is not None:
        sub = session.scalar(
            select(Subcategory).where(Subcategory.slug == subcategory, Subcategory.category_id == found.id)
        )
        if sub is None:
            raise FieldError('subcategory', FIELD_MESSAGES['subcategory']['default'])
        query = query.where(Vendor.subcategory_id == sub.id)

    if budget is not None:
        # Per-guest and per-table prices depend on the guest count.
        if guests is None:
            raise FieldError('guestCount', FIELD_MESSAGES['guestCount']['default'])
        # rules.estimated_cost, written as SQL so the database filters before picking
        # the random few (filtering afterwards would leave fewer than a page).
        estimated = case(
            (Vendor.price_unit == 'table', Vendor.price_min * rules.table_count(guests)),
            (Vendor.price_unit == 'guest', Vendor.price_min * guests),
            else_=Vendor.price_min,
        )
        query = query.where(estimated <= budget)

    if seed is None:
        # NEWID() gives every row a random value, so sorting by it shuffles the vendors.
        query = query.order_by(func.newid()).limit(limit)
    else:
        # CHECKSUM(Id, seed) scrambles the ids the same way for the same seed: a stable
        # shuffle that OFFSET can page through. Id breaks the rare tie.
        query = query.order_by(func.checksum(Vendor.id, seed), Vendor.id).offset(offset).limit(limit)
    return [
        VendorListItem(
            id=v.id,
            name=v.name,
            city=CityOut(slug=v.city.slug, name=v.city.name),
            subcategory=SubcategoryOut(slug=v.subcategory.slug, name=v.subcategory.name) if v.subcategory else None,
            price_min=v.price_min,
            price_max=v.price_max,
            price_unit=v.price_unit,
            image_url=v.image_url,
            website_url=v.website_url,
            is_demo=v.is_demo,
        )
        for v in session.scalars(query)
    ]

@app.get('/api/hello')
def hello():
    return {'message': 'Hello from WedBudget'}

