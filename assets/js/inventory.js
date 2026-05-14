// =====================================
// TABLA
// =====================================

let table =
    new DataTable(
        '#inventoryTable'
    );

// =====================================
// INICIAR DB
// =====================================

window.onload = async function(){

    await initDB();

};

// =====================================
// INPUT FILE
// =====================================

document
    .getElementById('fileInput')
    .addEventListener(
        'change',
        handleFile
    );

// =====================================
// LEER ARCHIVO
// =====================================

function handleFile(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = function (e) {

        const content =
            e.target.result;

        processData(content);

    };

    reader.readAsText(file);

}

// =====================================
// PROCESAR DATA
// =====================================

async function processData(data) {

    // LIMPIAR TABLA

    table.clear();

    // LÍNEAS

    const lines =
        data.split('\n');

    // INVENTARIO

    const inventory = [];

    // RECORRER

    lines.forEach((line, index) => {

        // HEADER

        if (index === 0) return;

        // COLUMNAS

        const cols =
            line.split(',');

        // VALIDAR

        if (cols.length < 6) return;

        // ITEM

        const item = {

            ubicacion:
                cols[0]
                    ?.trim()
                    .toUpperCase(),

            upc:
                cols[1]
                    ?.trim(),

            descripcion:
                cols[2]
                    ?.trim(),

            existencias:
                cols[3]
                    ?.trim(),

            reservado:
                cols[4]
                    ?.trim(),

            disponible:
                cols[5]
                    ?.trim()

        };

        inventory.push(item);

    });

    // =====================================
    // GUARDAR INDEXEDDB
    // =====================================

    try {

        await saveInventory(
            inventory
        );

        // MOSTRAR SOLO 500

        inventory
            .slice(0,500)
            .forEach(item => {

                table.row.add([

                    item.ubicacion,

                    item.upc,

                    item.descripcion,

                    item.existencias,

                    item.reservado,

                    item.disponible

                ]);

            });

        table.draw();

        alert(

            `Inventario cargado: ${inventory.length} registros`

        );

        console.log(
            'Inventario guardado IndexedDB'
        );

    }

    catch(error){

        console.error(error);

        alert(
            'Error guardando inventario'
        );

    }

}