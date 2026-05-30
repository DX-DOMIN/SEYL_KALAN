# Demo KHAIRON / Global Logistics / Quiksilver

## Objetivo

Ejecutar la demo local de Validación por Case usando servidor local, con KHAIRON como plataforma, Global Logistics como operador WMS y Quiksilver como cliente/cuenta.

## URL de demo

```text
http://127.0.0.1:8123/modules/validation.html
```

## Por que no usar file://

No abras `modules/validation.html` directamente con doble clic.

Cuando el navegador carga la app con `file://`, `jsPDF` puede bloquear la imagen del logo local por politica CORS. El resultado es que el PDF puede fallar o salir sin logo.

El servidor local evita ese bloqueo porque la app, los scripts y el logo se sirven desde el mismo origen:

```text
http://127.0.0.1:8123
```

## Como iniciar

Opcion recomendada:

1. Haz doble clic en `start-demo.bat`.
2. Espera a que se abra el navegador.
3. Confirma que la URL sea:

```text
http://127.0.0.1:8123/modules/validation.html
```

4. Mantén abierta la ventana negra del servidor durante toda la demo.
5. Para detener el servidor, presiona `Ctrl+C` o cierra la ventana.

## Flujo de prueba

1. En `Nombre de Ruta`, captura:

```text
RUTA-001
```

2. En `Case / Caja`, captura:

```text
CASE-001
```

3. En `Escanear UPC`, captura y confirma con Enter:

```text
75010254001
```

4. Cambia `Case / Caja` a:

```text
CASE-002
```

5. Escanea de nuevo:

```text
75010254001
```

6. Regresa `Case / Caja` a:

```text
CASE-001
```

7. Escanea una vez mas:

```text
75010254001
```

## Resultado esperado en pantalla

La tabla debe mostrar dos registros separados:

| Ruta | Case | UPC | Cantidad escaneada | Estado |
| --- | --- | --- | ---: | --- |
| RUTA-001 | CASE-001 | 75010254001 | 2 | OK |
| RUTA-001 | CASE-002 | 75010254001 | 1 | OK |

No deben aparecer estados de excedente, sobrante ni exceso.

## Resultado esperado en PDF

Al presionar `Generar Reporte PDF`, el archivo debe mostrar:

- Identidad `KHAIRON`.
- Operador `Global Logistics`.
- Cliente `Quiksilver`.
- Texto `KHAIRON — Validación por Case`.
- Ruta `RUTA-001`.
- Fecha de generación.
- Agrupación por case:
  - `CASE-001`
  - `CASE-002`
- Resumen final:
  - Total de cases.
  - Total de UPC únicos.
  - Total piezas escaneadas.
  - Total OK.
  - Total faltantes.

No debe mostrar excedentes, sobrantes ni excesos.

## Nota operativa

Si el puerto `8123` ya esta ocupado, cierra la otra ventana del servidor o cambia temporalmente el puerto en `start-demo.bat`.
