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

    if (!window.jQuery || !jQuery.fn?.DataTable) {
        table = null;
        return;
    }

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
                    error.message || 'Error leyendo archivo'
                );

            }

        };

    reader.readAsText(file);

}

// =====================================
// PROCESAR CSV/TXT
// =====================================

async function processData(data) {

    const parsed = window.Papa
        ? Papa.parse(data, {

            header: true,

            skipEmptyLines: true,

            transformHeader: normalizeHeader

        })
        : parseDelimitedData(data);

    if (parsed.errors.length) {

        const fatalError = parsed.errors.find(error =>
            error.type === 'Delimiter' || error.type === 'Quotes'
        );

        if (fatalError) {
            throw new Error(`Formato de archivo invalido: ${fatalError.message}`);
        }

    }

    const headers = parsed.meta.fields || [];
    const hasLocation = headers.includes('ubicacion');
    const hasCode = headers.some(header => ['upc', 'codigo', 'codigobarras'].includes(header));
    const hasStock = headers.some(header => ['existencias', 'real', 'cantidad'].includes(header));

    if (!hasLocation || !hasCode || !hasStock) {

        throw new Error(
            'El archivo debe incluir UBICACION, CODIGO/UPC y REAL/EXISTENCIAS'
        );

    }

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
                    firstValue(row, ['upc', 'codigo', 'codigobarras'])
                )
                    .trim()
                    .toUpperCase(),

            descripcion:
                String(
                    firstValue(row, ['descripcion', 'producto'])
                )
                    .trim(),

            existencias:
                parseQuantity(
                    firstValue(row, ['existencias', 'real', 'cantidad'])
                ),

            reservado:
                parseQuantity(row.reservado),

            disponible:
                parseQuantity(row.disponible)

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

    if (!inventory.length) {

        throw new Error(
            'No se encontraron registros validos para cargar'
        );

    }

    const omittedRows = parsed.data.length - inventory.length;

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

            `Inventario cargado correctamente: ${inventory.length} registros` +
            (omittedRows ? `\nRegistros omitidos por datos incompletos: ${omittedRows}` : '')

        );

    }

    catch (error) {

        console.error(error);

        alert(
            'Error guardando inventario'
        );

    }

}

function normalizeHeader(header) {

    return String(header || '')
        .replace(/^\uFEFF/, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

}

function firstValue(row, keys) {

    for (const key of keys) {

        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return row[key];
        }

    }

    return '';

}

function parseQuantity(value) {

    const normalized = String(value ?? '')
        .trim()
        .replace(/,/g, '');

    const quantity = Number(normalized || 0);

    return Number.isFinite(quantity) ? quantity : 0;

}

function parseDelimitedData(data) {
    const lines = String(data || '')
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    if (!lines.length) {
        return { data: [], errors: [], meta: { fields: [] } };
    }

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    const fields = parseDelimitedLine(lines[0], delimiter).map(normalizeHeader);
    const rows = lines.slice(1).map(line => {
        const values = parseDelimitedLine(line, delimiter);
        return fields.reduce((row, field, index) => {
            row[field] = values[index] ?? '';
            return row;
        }, {});
    });

    return { data: rows, errors: [], meta: { fields } };
}

function parseDelimitedLine(line, delimiter) {
    const values = [];
    let value = '';
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            if (quoted && line[index + 1] === '"') {
                value += '"';
                index += 1;
            }
            else {
                quoted = !quoted;
            }
        }
        else if (character === delimiter && !quoted) {
            values.push(value);
            value = '';
        }
        else {
            value += character;
        }
    }

    values.push(value);
    return values;
}

// =====================================
// RENDER TABLA
// =====================================

function renderInventory(inventory) {

    if (!table) {
        const tbody = document.querySelector('#inventoryTable tbody');
        tbody.replaceChildren();

        inventory.slice(0, 500).forEach(item => {
            const row = tbody.insertRow();
            [
                item.ubicacion,
                item.upc,
                item.descripcion,
                item.existencias,
                item.reservado,
                item.disponible
            ].forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });
        });

        return;
    }

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
