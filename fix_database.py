#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import psycopg2
import SecretConfig

def fix_database_precision():
    """Arregla la precisión de las columnas de la tabla liquidacion"""
    conn = None
    cursor = None
    try:
        # Conectar directamente a la base de datos
        print('🔌 Conectando a la base de datos...')
        conn = psycopg2.connect(
            host=SecretConfig.PGHOST,
            database=SecretConfig.PGDATABASE,
            user=SecretConfig.PGUSER,
            password=SecretConfig.PGPASSWORD,
            port=SecretConfig.PGPORT,
            sslmode="require",
            connect_timeout=10
        )
        cursor = conn.cursor()

        print('Aplicando migraciones de autenticación para Neon...')
        cursor.execute(
            'ALTER TABLE usuarios ALTER COLUMN password TYPE VARCHAR(255);'
        )
        cursor.execute(
            'ALTER TABLE auditoria ALTER COLUMN usuario_sistema DROP NOT NULL;'
        )
        conn.commit()
        print('OK Password admite VARCHAR(255)')
        print('OK auditoria.usuario_sistema admite NULL')

        print('MODIFICANDO Modificando estructura de tabla liquidacion...')

        # Modificar las columnas para aumentar la precisión de DECIMAL(10,2) a DECIMAL(15,2)
        sql_commands = [
            'ALTER TABLE liquidacion ALTER COLUMN Indemnizacion TYPE DECIMAL(15,2);',
            'ALTER TABLE liquidacion ALTER COLUMN Vacaciones TYPE DECIMAL(15,2);',
            'ALTER TABLE liquidacion ALTER COLUMN Cesantias TYPE DECIMAL(15,2);',
            'ALTER TABLE liquidacion ALTER COLUMN Intereses_Sobre_Cesantias TYPE DECIMAL(15,2);',
            'ALTER TABLE liquidacion ALTER COLUMN Prima_Servicios TYPE DECIMAL(15,2);',
            'ALTER TABLE liquidacion ALTER COLUMN Retencion_Fuente TYPE DECIMAL(15,2);',
            'ALTER TABLE liquidacion ALTER COLUMN Total_A_Pagar TYPE DECIMAL(15,2);'
        ]

        for command in sql_commands:
            cursor.execute(command)
            column_name = command.split()[5]  # Extrae el nombre de la columna
            print(f'OK Columna {column_name} actualizada a DECIMAL(15,2)')

        # Confirmar cambios
        conn.commit()
        print('OK Estructura de tabla actualizada correctamente')

        # Verificar la nueva estructura
        print('\nVERIFICANDO Verificando nueva estructura...')
        cursor.execute("""
            SELECT column_name, data_type, numeric_precision, numeric_scale 
            FROM information_schema.columns 
            WHERE table_name = 'liquidacion' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        print('\nESTRUCTURA Estructura actual de la tabla liquidacion:')
        for col in columns:
            if col[2] is not None:  # Si tiene precisión numérica
                print(f'  {col[0]}: {col[1]}({col[2]},{col[3]})')
            else:
                print(f'  {col[0]}: {col[1]}')

        print('\n🎉 Base de datos arreglada exitosamente!')
        print('🔥 Ahora las liquidaciones pueden manejar valores hasta $999,999,999,999.99')
        
    except Exception as e:
        print(f'ERROR Error general: {e}')
        if conn is not None:
            conn.rollback()
        raise
    finally:
        try:
            if cursor is not None:
                cursor.close()
        finally:
            if conn is not None:
                conn.close()

if __name__ == "__main__":
    fix_database_precision()
