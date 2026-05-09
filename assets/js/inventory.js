// TABLA

let table = new DataTable('#inventoryTable');

// INPUT FILE

document
    .getElementById('fileInput')
    .addEventListener('change', handleFile);

// FUNCIÓN PRINCIPAL

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

// PROCESAR DATOS

function processData(data) {

    table.clear();

    const lines = data.split('\n');

    const inventory = [];

    lines.forEach((line, index) => {

        if (index === 0) return;

        const cols = line.split(',');

        if (cols.length < 6) return;

        const item = {

            ubicacion: cols[0]?.trim(),
            upc: cols[1]?.trim(),
            descripcion: cols[2]?.trim(),
            existencias: cols[3]?.trim(),
            reservado: cols[4]?.trim(),
            disponible: cols[5]?.trim()

        };

        inventory.push(item);

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

    // GUARDAR EN LOCAL STORAGE

    localStorage.setItem(
        'inventoryData',
        JSON.stringify(inventory)
    );

    alert("Inventario cargado correctamente");

}