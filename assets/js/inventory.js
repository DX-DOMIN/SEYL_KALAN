// =========================================
// DATATABLE
// =========================================

let table = new DataTable('#inventoryTable');

// =========================================
// INPUT FILE
// =========================================

document
    .getElementById('fileInput')
    .addEventListener('change', handleFile);

// =========================================
// LEER ARCHIVO
// =========================================

function handleFile(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        const content = e.target.result;

        processData(content);

    };

    reader.readAsText(file);

}

// =========================================
// PROCESAR INVENTARIO
// =========================================

function processData(data) {

    // LIMPIAR TABLA

    table.clear();

    // DIVIDIR LÍNEAS

    const lines = data.split('\n');

    // ARRAY INVENTARIO

    const inventory = [];

    // RECORRER ARCHIVO

    lines.forEach((line, index) => {

        // SALTAR HEADER

        if (index === 0) return;

        // LIMPIAR SALTOS OCULTOS

        line = line.replace(/\r/g, '');

        // VALIDAR LINEA VACÍA

        if (!line.trim()) return;

        // COLUMNAS

        const cols = line.split(',');

        // VALIDAR COLUMNAS

        if (cols.length < 6) return;

        // CREAR ITEM LIMPIO

        const item = {

            ubicacion: cols[0]
                ?.replace(/\s+/g, '')
                .trim()
                .toUpperCase(),

            upc: cols[1]
                ?.trim(),

            descripcion: cols[2]
                ?.trim(),

            existencias: cols[3]
                ?.trim(),

            reservado: cols[4]
                ?.trim(),

            disponible: cols[5]
                ?.trim()

        };

        // VALIDAR DATOS OBLIGATORIOS

        if (
            !item.ubicacion ||
            !item.upc
        ) return;

        // AGREGAR A INVENTARIO

        inventory.push(item);

        // RENDER TABLA

        table.row.add([

            item.ubicacion,

            item.upc,

            item.descripcion,

            item.existencias,

            item.reservado,

            item.disponible

        ]);

    });

    // DIBUJAR TABLA

    table.draw();

    // GUARDAR INVENTARIO

    localStorage.setItem(

        'inventoryData',

        JSON.stringify(inventory)

    );

    // LOG DEBUG

    console.log(

        'Inventario cargado:',
        inventory.length,
        'registros'

    );

    // ALERTA

    alert(

        `Inventario cargado correctamente\n\n${inventory.length} registros procesados`

    );

}