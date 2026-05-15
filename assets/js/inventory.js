let table;

// =====================================
// INICIAR
// =====================================

document.addEventListener(

    'DOMContentLoaded',

    async () => {

        try {

            // INICIAR DATABASE

            await initDB();

            // TABLA

            initializeTable();

            // INPUT FILE

            initializeFileInput();

            // CARGAR INVENTARIO

            await loadExistingInventory();

        }

        catch (error) {

            console.error(error);

            alert(
                'Error iniciando inventario'
            );

        }

    }

);

// =====================================
// TABLA
// =====================================

function initializeTable() {

    table = $('#inventoryTable').DataTable({

        destroy: true,

        responsive: true,

        pageLength: 50

    });

}

// =====================================
// FILE INPUT
// =====================================

function initializeFileInput() {

    const fileInput =
        document.getElementById(
            'fileInput'
        );

    if (!fileInput) {

        console.error(
            'No existe fileInput'
        );

        return;

    }

    fileInput.addEventListener(

        'change',

        handleFile

    );

}

// =====================================
// LEER ARCHIVO
// =====================================

async function handleFile(event) {

    const file =
        event.target.files[0];

    if (!file) {

        return;

    }

    const reader =
        new FileReader();

    reader.onload =
        async (e) => {

            try {

                const content =
                    e.target.result;

                await processData(
                    content
                );

            }

            catch (error) {

                console.error(error);

                alert(
                    'Error leyendo archivo'
                );

            }

        };

    reader.readAsText(file);

}

// =====================================
// PROCESAR CSV/TXT
// =====================================

async function processData(data) {

    const parsed = Papa.parse(data, {

        header: true,

        skipEmptyLines: true,

        transformHeader: header =>

            header
                .trim()
                .toLowerCase()

    });

    const inventory = [];

    parsed.data.forEach(row => {

        const item = {

            ubicacion:
                String(
                    row.ubicacion || ''
                )
                    .trim()
                    .toUpperCase(),

            upc:
                String(
                    row.upc || ''
                )
                    .trim(),

            descripcion:
                String(
                    row.descripcion || ''
                )
                    .trim(),

            existencias:
                Number(
                    row.existencias || 0
                ),

            reservado:
                Number(
                    row.reservado || 0
                ),

            disponible:
                Number(
                    row.disponible || 0
                )

        };

        // VALIDAR

        if (
            !item.ubicacion ||
            !item.upc
        ) {

            return;

        }

        inventory.push(item);

    });

    try {

        // GUARDAR INVENTARIO

        await saveInventory(
            inventory
        );

        // RENDER

        renderInventory(
            inventory
        );

        alert(

            `Inventario cargado correctamente: ${inventory.length} registros`

        );

    }

    catch (error) {

        console.error(error);

        alert(
            'Error guardando inventario'
        );

    }

}

// =====================================
// RENDER TABLA
// =====================================

function renderInventory(inventory) {

    table.clear();

    inventory.forEach(item => {

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

}

// =====================================
// CARGAR INVENTARIO EXISTENTE
// =====================================

async function loadExistingInventory() {

    try {

        const inventory =
            await getInventory();

        renderInventory(
            inventory
        );

    }

    catch (error) {

        console.error(error);

    }

}