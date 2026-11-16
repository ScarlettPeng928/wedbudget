"""The tables from SPEC.md section 4.

Python attributes are snake_case; the database columns keep the PascalCase names
from the spec (the first argument to mapped_column).
"""

from datetime import datetime

from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, Unicode, func
from sqlalchemy.dialects.mssql import DATETIME2, TINYINT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

PRICE_UNITS = ('event', 'table', 'guest')


class Category(Base):
    __tablename__ = 'Categories'

    id: Mapped[int] = mapped_column('Id', primary_key=True)
    slug: Mapped[str] = mapped_column('Slug', Unicode(50), unique=True)
    name: Mapped[str] = mapped_column('Name', Unicode(100))
    share_percent: Mapped[int] = mapped_column('SharePercent', TINYINT)
    # True: only vendors in the plan's city. False: vendors anywhere in Taiwan.
    match_by_city: Mapped[bool] = mapped_column('MatchByCity')
    sort_order: Mapped[int] = mapped_column('SortOrder', TINYINT)

    __table_args__ = (CheckConstraint('SharePercent BETWEEN 0 AND 100', name='CK_Categories_SharePercent'),)


class City(Base):
    __tablename__ = 'Cities'

    id: Mapped[int] = mapped_column('Id', primary_key=True)
    slug: Mapped[str] = mapped_column('Slug', Unicode(50), unique=True)
    name: Mapped[str] = mapped_column('Name', Unicode(100))
    sort_order: Mapped[int] = mapped_column('SortOrder', TINYINT)


class Subcategory(Base):
    """A kind of vendor within a category, like Western favors. Each vendor has one."""

    __tablename__ = 'Subcategories'

    id: Mapped[int] = mapped_column('Id', primary_key=True)
    category_id: Mapped[int] = mapped_column('CategoryId', ForeignKey('Categories.Id'))
    # Unique across all categories, so the URL only needs the subcategory's slug.
    slug: Mapped[str] = mapped_column('Slug', Unicode(50), unique=True)
    name: Mapped[str] = mapped_column('Name', Unicode(100))
    sort_order: Mapped[int] = mapped_column('SortOrder', TINYINT)

    category: Mapped[Category] = relationship()


class Vendor(Base):
    __tablename__ = 'Vendors'

    id: Mapped[int] = mapped_column('Id', primary_key=True)
    category_id: Mapped[int] = mapped_column('CategoryId', ForeignKey('Categories.Id'))
    city_id: Mapped[int] = mapped_column('CityId', ForeignKey('Cities.Id'))
    # Optional, so a new vendor can be added before it is sorted into one.
    subcategory_id: Mapped[int | None] = mapped_column('SubcategoryId', ForeignKey('Subcategories.Id'))
    name: Mapped[str] = mapped_column('Name', Unicode(200))
    # NT$, per PriceUnit. BIGINT because INT tops out around 2.1 billion.
    price_min: Mapped[int] = mapped_column('PriceMin', BigInteger)
    price_max: Mapped[int | None] = mapped_column('PriceMax', BigInteger)
    price_unit: Mapped[str] = mapped_column('PriceUnit', Unicode(10))
    image_url: Mapped[str | None] = mapped_column('ImageUrl', Unicode(500))
    website_url: Mapped[str | None] = mapped_column('WebsiteUrl', Unicode(500))
    is_demo: Mapped[bool] = mapped_column('IsDemo', default=False)
    # Set to False to hide a vendor without deleting it.
    is_active: Mapped[bool] = mapped_column('IsActive', default=True)
    created_at: Mapped[datetime] = mapped_column('CreatedAt', DATETIME2, server_default=func.sysutcdatetime())

    category: Mapped[Category] = relationship()
    city: Mapped[City] = relationship()
    subcategory: Mapped[Subcategory | None] = relationship()

    __table_args__ = (
        CheckConstraint("PriceUnit IN ('event', 'table', 'guest')", name='CK_Vendors_PriceUnit'),
        CheckConstraint('PriceMin >= 0', name='CK_Vendors_PriceMin'),
        # The matching query filters on these columns.
        Index('IX_Vendors_Match', 'CategoryId', 'CityId', 'IsActive', 'PriceMin'),
    )
