"""Importa una salida real de Blue Prism SIN ejecutar el bot.

- Lee Resultados_AAAAMMDD_HHMM.xlsx (hoja Resultados).
- Mantiene intactos los cálculos hechos por Blue Prism.
- Nunca publica los identificadores originales (personaId / clave).
- Agrega resultados por instituto y periodo, y deriva FOJA.
"""
from __future__ import annotations

from datetime import date, datetime
from hashlib import sha256
import hmac
import os
from pathlib import Path
import re
import secrets

from openpyxl import load_workbook
from openpyxl.utils.datetime import from_excel

COLUMNAS = (
    'clave', 'personaId', 'it', 'instituto', 'cargo', 'periodo',
    'horasContrato', 'tramoJornada', 'pctDirecto', 'pctIndirecto',
    'semanasHabiles', 'atencionesDirectas', 'atencionesIndirectas',
    'atencionesTotal', 'metaGestion', 'estado', 'motivo',
)

INSTITUTOS = {
    11: 'Arica', 12: 'Iquique', 21: 'Antofagasta', 22: 'Calama',
    31: 'Copiapó', 41: 'Coquimbo', 51: 'Valparaíso', 61: "O’Higgins",
    71: 'Talca', 81: 'Concepción', 91: 'Temuco', 101: 'Puerto Montt',
    111: 'Coyhaique', 131: 'Santiago', 141: 'Valdivia',
}

CODIGOS_INSTITUTO = {
    11:'Ari', 12:'Iqu', 21:'Ant', 22:'Cal', 31:'Cop', 41:'Coq',
    51:'Val', 61:'OHi', 71:'Tal', 81:'Con', 91:'Tem', 101:'PMo',
    111:'Coy', 131:'San', 141:'Vdv',
}

PATRON_ARCHIVO = re.compile(r'^Resultados_(\d{8})_(\d{4}(?:\d{2})?)\.xlsx$', re.IGNORECASE)


def carpeta_resultados() -> Path:
    """Carpeta local para copias del Excel; nunca hace falta tener el bot."""
    return Path(os.environ.get('BLUEPRISM_RESULTADOS_DIR',
                            str(Path(__file__).parent / 'entrada_blueprism'))).expanduser().resolve()


def buscar_ultimo_resultado(carpeta: Path | None = None) -> Path | None:
    carpeta = carpeta or carpeta_resultados()
    if not carpeta.is_dir():
        return None
    archivos = [p for p in carpeta.iterdir()
                if p.is_file() and not p.name.startswith('~$') and PATRON_ARCHIVO.match(p.name)]
    return max(archivos, key=lambda p: (PATRON_ARCHIVO.match(p.name).group(1),
                                        PATRON_ARCHIVO.match(p.name).group(2), p.stat().st_mtime_ns)) if archivos else None


def _secreto_local() -> bytes:
    """HMAC estable. Secreto externo al repositorio para evitar publicar IDs originales."""
    variable = os.environ.get('BLUEPRISM_ANON_SECRET')
    if variable:
        return variable.encode('utf-8')
    # En Windows: AppData/Local, fuera de la carpeta Git.
    home = Path(os.environ.get('LOCALAPPDATA', Path.home() / '.local' / 'share'))
    archivo = home / 'CadaHoraCuenta' / 'anon_secret.key'
    archivo.parent.mkdir(parents=True, exist_ok=True)
    if not archivo.exists():
        # Modo exclusivo evita sobrescribir otro secreto en una carrera.
        try:
            with archivo.open('x', encoding='ascii') as f:
                f.write(secrets.token_hex(32))
        except FileExistsError:
            pass
    return archivo.read_text(encoding='ascii').strip().encode('ascii')


def _anonimo(persona_id: int, secreto: bytes) -> int:
    digest = hmac.new(secreto, str(persona_id).encode('ascii'), sha256).digest()
    return 900_000_000_000 + int.from_bytes(digest[:7], 'big') % 100_000_000_000


def _fecha(valor) -> str:
    if isinstance(valor, (datetime, date)):
        return valor.date().isoformat() if isinstance(valor, datetime) else valor.isoformat()
    if isinstance(valor, (int, float)):
        return from_excel(valor).date().isoformat()
    if isinstance(valor, str):
        valor = valor.strip()
        try:
            return date.fromisoformat(valor[:10]).isoformat()
        except ValueError as exc:
            raise ValueError('Periodo con formato no válido; se espera AAAA-MM-DD') from exc
    raise ValueError('Periodo vacío o de tipo desconocido')


def importar_archivo(ruta: str | Path, secreto: bytes | None = None) -> dict:
    """Devuelve {meta, ejecuciones, resultados, resumenInstituto} compatible con la API.

    Nunca escribe el archivo Excel ni guarda datos personales en un JSON.
    Los errores de estructura generan ValueError con números de fila.
    """
    ruta = Path(ruta)
    match = PATRON_ARCHIVO.match(ruta.name)
    if not match:
        raise ValueError('Nombre inválido. Usar Resultados_AAAAMMDD_HHMM.xlsx')
    if ruta.stat().st_size > 50 * 1024 * 1024:
        raise ValueError('Archivo de resultados demasiado grande')
    secreto = secreto or _secreto_local()
    wb = load_workbook(ruta, read_only=True, data_only=True)
    try:
        if 'Resultados' not in wb.sheetnames:
            raise ValueError('Falta la hoja Resultados')
        ws = wb['Resultados']
        filas = ws.iter_rows(values_only=True)
        encabezado = next(filas, None)
        if encabezado is None or tuple(encabezado) != COLUMNAS:
            raise ValueError('Las 17 columnas no coinciden con el contrato de Blue Prism')

        resultados, errores, vistos = [], [], set()
        profesionales, periodos = set(), set()
        agrupados = {}
        for numero_fila, valores in enumerate(filas, start=2):
            if not any(x is not None for x in valores):
                raise ValueError(f'Fila vacía intermedia en fila {numero_fila}')
            if len(valores) != len(COLUMNAS):
                raise ValueError(f'Cantidad de columnas inválida en fila {numero_fila}')
            raw = dict(zip(COLUMNAS, valores))
            try:
                if not raw['clave']:
                    raise ValueError('Falta clave')
                clave_original = str(raw['clave']).strip()
                if clave_original in vistos:
                    raise ValueError('Clave duplicada')
                vistos.add(clave_original)
                persona_original = int(raw['personaId'])
                anon = _anonimo(persona_original, secreto)
                it = int(raw['it'])
                periodo = _fecha(raw['periodo'])
                if periodo[8:] != '01':
                    raise ValueError('El periodo debe comenzar el primer día del mes')
                if clave_original != f"{persona_original}_{periodo[:4]}{periodo[5:7]}":
                    raise ValueError('La clave no coincide con personaId y periodo')
                if it not in INSTITUTOS:
                    raise ValueError('Instituto numérico no reconocido')
                if str(raw['instituto']).strip() != CODIGOS_INSTITUTO[it]:
                    raise ValueError('El código del instituto no coincide con el IT')
                estado = str(raw['estado'] or '').strip().upper()
                if estado not in {'COMPLETADO', 'EXCEPCION'}:
                    raise ValueError('Estado desconocido')
                horas = float(raw['horasContrato'])
                if not 0 <= horas <= 168:
                    raise ValueError('Horas contratadas negativas')
                if estado == 'COMPLETADO':
                    if not raw['tramoJornada']:
                        raise ValueError('Falta tramoJornada en registro completado')
                    for campo in ('pctDirecto','pctIndirecto','semanasHabiles','atencionesDirectas',
                                  'atencionesIndirectas','atencionesTotal','metaGestion'):
                        if raw[campo] is None:
                            raise ValueError(f'Falta el valor de {campo}')
                    d, i, total = (int(raw[c]) for c in ('atencionesDirectas','atencionesIndirectas','atencionesTotal'))
                    if d < 0 or i < 0 or total != d + i:
                        raise ValueError('Totales de atenciones inconsistentes')
                    pct = float(raw['pctDirecto'])
                    pct_i = float(raw['pctIndirecto'])
                    if not 0 <= pct <= 1 or not 0 <= pct_i <= 1 or pct + pct_i > 1 + 1e-8:
                        raise ValueError('Distribución porcentual inválida')
                else:
                    # El bot escribe ceros como centinela; NO son resultados calculados.
                    d = i = total = None
                    pct = pct_i = None

                motivo = str(raw['motivo']).strip() if raw['motivo'] else None
                if motivo:
                    motivo = motivo.replace(clave_original, '[clave protegida]')
                    motivo = motivo.replace(str(persona_original), str(anon))
                fila = {
                    'clave': f'{anon}_{periodo[:4]}{periodo[5:7]}',
                    'personaId': anon,
                    'nombre': f'Profesional Anonimizado {anon - 900_000_000_000}',
                    'it': it,
                    'instituto': str(raw['instituto']).strip(),
                    'institutoNombre': INSTITUTOS[it],
                    'cargo': str(raw['cargo'] or '').strip(),
                    'periodo': periodo,
                    'tipoContrato': None,
                    'fechaTermino': None,
                    'horasContrato': int(horas) if horas.is_integer() else horas,
                    'tramoJornada': str(raw['tramoJornada']).strip() if estado=='COMPLETADO' else None,
                    'pctDirecto': pct,
                    'pctIndirecto': pct_i,
                    'semanasHabiles': float(raw['semanasHabiles']) if estado=='COMPLETADO' else None,
                    'atencionesDirectas': d,
                    'atencionesIndirectas': i,
                    'atencionesTotal': total,
                    'metaGestion': float(raw['metaGestion']) if estado=='COMPLETADO' else None,
                    'fojaPct': round(pct*100, 2) if pct is not None else None,
                    'estado': estado,
                    'motivo': motivo,
                }
                if estado == 'EXCEPCION':
                    errores.append({
                        'clave': fila['clave'], 'personaId': anon,
                        'instituto': fila['instituto'], 'periodo': periodo,
                        'tipo': 'Business Exception',
                        'motivo': fila['motivo'] or 'Excepción sin motivo',
                    })
                resultados.append(fila)
                profesionales.add(anon)
                periodos.add(periodo)
                k = (it, fila['instituto'], periodo)
                if k not in agrupados:
                    agrupados[k] = {
                        'it': it, 'instituto': fila['instituto'], 'institutoNombre': fila['institutoNombre'],
                        'periodo': periodo, 'profesionales': 0, 'horasContrato': 0, 'horasDirectas': 0,
                        'atencionesDirectas': 0, 'atencionesIndirectas': 0,
                        'atencionesTotal': 0, 'metaGestion': 0.0,
                        'registros': 0, 'excepciones': 0,
                    }
                a = agrupados[k]
                a['profesionales'] += 1
                a['horasContrato'] += fila['horasContrato']
                a['registros'] += 1
                if estado == 'EXCEPCION':
                    a['excepciones'] += 1
                else:
                    a['horasDirectas'] += fila['horasContrato'] * (fila['pctDirecto'] or 0)
                    for campo in ('atencionesDirectas','atencionesIndirectas','atencionesTotal','metaGestion'):
                        a[campo] += fila[campo]
            except (TypeError, ValueError) as e:
                raise ValueError(f'Fila {numero_fila}: {e}') from e
            if len(resultados) > 100_000:
                raise ValueError('Más de 100.000 registros: archivo inesperado')
    finally:
        wb.close()

    dt = datetime.strptime(match.group(1)+match.group(2), '%Y%m%d%H%M' if len(match.group(2))==4 else '%Y%m%d%H%M%S')
    valido = len(resultados) - len(errores)
    ejecucion_id = f"EJ-BP-{match.group(1)}-{match.group(2)}"
    resumenes = sorted(agrupados.values(), key=lambda x: (x['periodo'], x['it']))
    return {
        'meta': {
            'simulado': False,
            'descripcion': 'Resultados importados del archivo de salida de Blue Prism',
            'generado': dt.date().isoformat(),
            'origenArchivo': ruta.name,
            'periodos': sorted(periodos),
            'fuentes': {'resultados': 'blueprism-excel', 'ejecuciones': 'derivado-del-excel',
                        'novedades': 'simulado', 'multiInstituto': 'simulado'},
            'conteos': {
                'resultados': len(resultados), 'profesionales': len(profesionales),
                'errores': len(errores), 'resumenInstituto': len(resumenes),
            },
        },
        'ejecuciones': [{
            'ejecucionId': ejecucion_id, 'archivo': ruta.name,
            'fuente': 'BUK', 'fechaHora': dt.isoformat(timespec='seconds'),
            'estado': 'COMPLETADO_CON_OBSERVACIONES' if errores else 'COMPLETADO',
            'totalRegistros': len(resultados), 'validos': valido,
            'rechazados': len(errores), 'errores': errores,
        }],
        'resultados': resultados,
        'resumenInstituto': resumenes,
    }
