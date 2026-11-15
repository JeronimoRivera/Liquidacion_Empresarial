import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import fix_database


class MigrationCursor:
    def __init__(self):
        self.commands = []
        self.closed = False

    def execute(self, command):
        self.commands.append(command)

    def fetchall(self):
        return []

    def close(self):
        self.closed = True


class MigrationConnection:
    def __init__(self, cursor):
        self._cursor = cursor
        self.closed = False
        self.commits = 0

    def cursor(self):
        return self._cursor

    def commit(self):
        self.commits += 1

    def rollback(self):
        pass

    def close(self):
        self.closed = True


def test_migration_alters_auth_columns_and_closes_resources(monkeypatch):
    cursor = MigrationCursor()
    connection = MigrationConnection(cursor)
    monkeypatch.setattr(
        fix_database.psycopg2,
        "connect",
        lambda **kwargs: connection,
    )

    fix_database.fix_database_precision()

    normalized_commands = [command.lower() for command in cursor.commands]
    assert any(
        "alter table usuarios alter column password type varchar(255)" in command
        for command in normalized_commands
    )
    assert any(
        "alter table auditoria alter column usuario_sistema drop not null" in command
        for command in normalized_commands
    )
    assert connection.commits == 2
    assert cursor.closed
    assert connection.closed
