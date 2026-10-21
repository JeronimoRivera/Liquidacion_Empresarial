#!/usr/bin/env python3
"""Comprueba la conexión PostgreSQL configurada para Neon."""

import sys
from contextlib import closing

import psycopg2

import SecretConfig


def main() -> int:
    missing = [
        name
        for name, value in (
            ("HOST", SecretConfig.PGHOST),
            ("USER", SecretConfig.PGUSER),
            ("PASSWORD", SecretConfig.PGPASSWORD),
            ("DBNAME", SecretConfig.PGDATABASE),
        )
        if not value
    ]
    if missing:
        print(
            "Faltan valores de configuración en .env: " + ", ".join(missing),
            file=sys.stderr,
        )
        return 1

    try:
        with closing(
            psycopg2.connect(
                host=SecretConfig.PGHOST,
                database=SecretConfig.PGDATABASE,
                user=SecretConfig.PGUSER,
                password=SecretConfig.PGPASSWORD,
                port=SecretConfig.PGPORT,
                sslmode="require",
                connect_timeout=10,
            )
        ) as connection:
            with connection:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    cursor.fetchone()
        print("Conexión a PostgreSQL en Neon exitosa.")
        return 0
    except psycopg2.Error as error:
        print(f"Error de conexión a PostgreSQL en Neon: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
