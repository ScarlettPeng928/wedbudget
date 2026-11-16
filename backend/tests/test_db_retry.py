"""The connection retry for a paused Azure SQL database (app/db.py)."""

import pytest

from app import db


class FakeOperationalError(Exception):
    pass


class FakeDbapi:
    """Fails with the given error codes in turn, then connects."""

    OperationalError = FakeOperationalError

    def __init__(self, codes):
        self.codes = list(codes)
        self.calls = 0

    def connect(self, *args, **kwargs):
        self.calls += 1
        if self.codes:
            code = self.codes.pop(0)
            raise FakeOperationalError((code, b'message'))
        return 'connection'


class FakeDialect:
    def __init__(self, dbapi):
        self.loaded_dbapi = dbapi


@pytest.fixture(autouse=True)
def no_waiting(monkeypatch):
    monkeypatch.setattr(db.time, 'sleep', lambda seconds: None)


def connect(dbapi):
    return db.connect_with_resume_retry(FakeDialect(dbapi), None, (), {})


def test_waits_while_the_database_resumes():
    dbapi = FakeDbapi([40613, 40613, 40613])
    assert connect(dbapi) == 'connection'
    assert dbapi.calls == 4


def test_other_errors_fail_at_once():
    # 18456 = wrong password: retrying won't help.
    dbapi = FakeDbapi([18456])
    with pytest.raises(FakeOperationalError):
        connect(dbapi)
    assert dbapi.calls == 1


def test_gives_up_after_the_last_retry():
    dbapi = FakeDbapi([40613] * (db.RESUME_RETRIES + 1))
    with pytest.raises(FakeOperationalError):
        connect(dbapi)
    assert dbapi.calls == db.RESUME_RETRIES + 1
