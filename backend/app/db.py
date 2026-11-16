from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

# pool_pre_ping checks a pooled connection before using it, so a database restart
# doesn't surface as an error on the next request.
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def get_session() -> Iterator[Session]:
    """One database session per request, closed when the request ends."""
    with SessionLocal() as session:
        yield session
