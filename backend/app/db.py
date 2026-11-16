import time
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

# pool_pre_ping checks a pooled connection before using it, so a database restart
# doesn't surface as an error on the next request.
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

# Azure SQL's free offer pauses the database when nobody uses it. The first
# connection after that fails with error 40613 ("not currently available") while
# it resumes, which takes up to a minute. Wait and retry instead of showing the
# visitor an error: the first request is just slower.
RESUME_ERROR = 40613
RESUME_RETRIES = 10
RESUME_WAIT_SECONDS = 5


def is_resuming(error: Exception) -> bool:
    return bool(error.args) and isinstance(error.args[0], tuple) and error.args[0][0] == RESUME_ERROR


@event.listens_for(engine, 'do_connect')
def connect_with_resume_retry(dialect, conn_rec, cargs, cparams):
    for attempt in range(RESUME_RETRIES + 1):
        try:
            return dialect.loaded_dbapi.connect(*cargs, **cparams)
        except dialect.loaded_dbapi.OperationalError as error:
            if attempt == RESUME_RETRIES or not is_resuming(error):
                raise
            time.sleep(RESUME_WAIT_SECONDS)


class Base(DeclarativeBase):
    pass


def get_session() -> Iterator[Session]:
    """One database session per request, closed when the request ends."""
    with SessionLocal() as session:
        yield session
