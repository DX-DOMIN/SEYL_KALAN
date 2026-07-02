# KHAIRON WMS Local

Proyecto local HTML, CSS y JavaScript para operaciones WMS.

Contexto de demo:

- Plataforma: `KHAIRON`
- Operador WMS: `Global Logistics`
- Cliente/Cuenta: `Quiksilver`

## Demo KHAIRON / Global Logistics / Quiksilver

Para ejecutar la demo de Validación por Case, usa siempre servidor local.

No abras la demo con doble clic directo sobre `validation.html` ni con una ruta `file://`.
Ese modo puede bloquear el logo del PDF por seguridad del navegador y provocar error CORS.

### Inicio rapido

1. Haz doble clic en `start-demo.bat`.
2. Espera a que se abra el navegador.
3. Usa esta URL:

```text
http://127.0.0.1:8123/index.html
```

4. Mantén abierta la ventana del servidor mientras uses la demo.
5. Para detener el servidor, cierra la ventana o presiona `Ctrl+C`.

### Prueba rapida de la demo

1. Inicia sesion y abre el modulo `Validacion`.
2. Captura ruta: `RUTA-001`.
2. Captura case: `CASE-001`.
3. Escanea UPC: `75010254001`.
4. Cambia case a `CASE-002`.
5. Escanea UPC: `75010254001`.
6. Regresa a `CASE-001`.
7. Escanea UPC: `75010254001`.
8. Verifica que la tabla muestre:
   - `CASE-001` con cantidad `2`.
   - `CASE-002` con cantidad `1`.
9. Genera el PDF.
10. Verifica que el PDF muestre KHAIRON, operador Global Logistics, cliente Quiksilver y el desglose por case.

Mas detalle en `docs/DEMO_GLOBAL_LOGISTICS.md`.
