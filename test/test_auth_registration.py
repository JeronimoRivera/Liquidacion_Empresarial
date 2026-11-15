import os
import sys
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

import controller.controlador as controller
import view_web.flask_app as flask_app
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash


class AuthCursor:
    def __init__(self, rows):
        self.rows = list(rows)
        self.queries = []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def execute(self, sql, params=None):
        self.queries.append((sql, params))

    def fetchone(self):
        return self.rows.pop(0) if self.rows else None

    def close(self):
        pass


class AuthConnection:
    def __init__(self, cursor):
        self._cursor = cursor
        self.closed = False
        self.commits = 0

    def cursor(self):
        return self._cursor

    def commit(self):
        self.commits += 1

    def close(self):
        self.closed = True


def test_hashed_password_authentication_uses_document_and_closes_connection(monkeypatch):
    password_hash = generate_password_hash("correct-password")
    cursor = AuthCursor([
        None,
        (17, "Ana", "Pérez", "usuario", password_hash),
    ])
    connection = AuthConnection(cursor)
    monkeypatch.setattr(controller.psycopg2, "connect", lambda **kwargs: connection)

    result = controller.BaseDeDatos().autenticar_usuario("CC-123456", "correct-password")

    assert result == {
        "id": 17,
        "nombre": "Ana",
        "apellido": "Pérez",
        "rol": "usuario",
        "autenticado": True,
    }
    assert connection.closed
    assert cursor.queries[1][1] == ["CC-123456"]


def test_registrar_cuenta_hashes_password_and_uses_assistant_role(monkeypatch):
    cursor = AuthCursor([(27,)])
    connection = AuthConnection(cursor)
    monkeypatch.setattr(controller.psycopg2, "connect", lambda **kwargs: connection)

    user_id = controller.BaseDeDatos().registrar_cuenta(
        nombre="Ana",
        apellido="Pérez",
        documento_identidad="CC-123456",
        correo_electronico="ana@example.com",
        telefono="3001234567",
        fecha_ingreso=date(2026, 1, 1),
        salario="3500000",
        password="secure-password",
    )

    insert_params = cursor.queries[2][1]
    assert user_id == 27
    assert insert_params[9] == "usuario"
    assert check_password_hash(insert_params[10], "secure-password")
    assert connection.commits == 1
    assert connection.closed


def test_registration_route_creates_regular_account_and_audits(monkeypatch):
    captured = {}

    class FakeDatabase:
        def registrar_cuenta(self, **values):
            captured["values"] = values
            return 27

        @staticmethod
        def registrar_auditoria(**values):
            captured["audit"] = values

    monkeypatch.setattr(flask_app, "BaseDeDatos", FakeDatabase)
    flask_app.app.config.update(TESTING=True, WTF_CSRF_ENABLED=False)
    client = flask_app.app.test_client()

    response = client.post("/registro", data={
        "nombre": "Ana",
        "apellido": "Pérez",
        "documento": "CC-123456",
        "correo_electronico": "ana@example.com",
        "telefono": "3001234567",
        "fecha_ingreso": "2026-01-01",
        "salario": "3500000",
        "password": "secure-password",
        "confirmar_password": "secure-password",
        "rol": "administrador",
    })

    assert response.status_code == 302
    assert response.headers["Location"].endswith("/login")
    assert captured["values"]["fecha_ingreso"] == date(2026, 1, 1)
    assert captured["values"]["password"] == "secure-password"
    assert "rol" not in captured["values"]
    assert captured["audit"]["accion"] == "REGISTER"
    assert captured["audit"]["usuario_sistema"] == 27


def test_registration_rejects_missing_required_fields():
    flask_app.app.config.update(TESTING=True, WTF_CSRF_ENABLED=False)
    response = flask_app.app.test_client().post("/registro", data={})

    assert response.status_code == 200
    assert "Campos obligatorios incompletos" in response.get_data(as_text=True)
