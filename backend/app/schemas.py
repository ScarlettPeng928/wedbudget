"""Request and response shapes for the API.

Python uses snake_case; the JSON uses camelCase to match the frontend types
(PlanRequest / PlanResult in src/api/plan.ts). to_camel does the conversion.
"""

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from .rules import MAX_BUDGET, MAX_GUESTS, MIN_BUDGET


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CategoryOut(CamelModel):
    slug: str
    name: str
    share: int


class CityOut(CamelModel):
    slug: str
    name: str


class SubcategoryOut(CamelModel):
    slug: str
    name: str


class PlanRequest(CamelModel):
    total_budget: int = Field(ge=MIN_BUDGET, le=MAX_BUDGET)
    city: str = Field(min_length=1, max_length=50)
    guest_count: int = Field(ge=1, le=MAX_GUESTS)


class PlanResult(CamelModel):
    request: PlanRequest
    allocations: dict[str, int]


class VendorMatchRequest(CamelModel):
    city: str = Field(min_length=1, max_length=50)
    guest_count: int = Field(ge=1, le=MAX_GUESTS)
    # NT$ per category slug; a missing category counts as NT$0.
    allocations: dict[str, int]


class VendorOut(CamelModel):
    id: int
    name: str
    city: CityOut
    price_min: int
    price_max: int | None
    price_unit: str
    estimated_cost: int
    image_url: str | None
    website_url: str | None
    is_demo: bool


class VendorListItem(CamelModel):
    """A vendor on the vendors page: no plan, so a starting price instead of an estimated total."""

    id: int
    name: str
    city: CityOut
    subcategory: SubcategoryOut | None
    price_min: int
    price_max: int | None
    price_unit: str
    image_url: str | None
    website_url: str | None
    is_demo: bool
