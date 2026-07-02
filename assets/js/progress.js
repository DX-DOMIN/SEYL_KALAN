document.addEventListener('DOMContentLoaded', async () => {
    const progressBody = document.getElementById('progressBody');

    if (!progressBody) return;

    try {
        await initDB();

        const inventory = await getInventory();
        const physical = readStoredArray('physicalCount');

        renderProgress(progressBody, inventory, physical);
    }
    catch (error) {
        console.error('No fue posible cargar el avance:', error);
        renderMessage(progressBody, 'No fue posible consultar el inventario cargado', 'danger');
    }
});

function renderProgress(progressBody, inventory, physical) {
    progressBody.replaceChildren();

    if (!inventory.length) {
        renderMessage(progressBody, 'Primero carga el inventario ERP/WMS', 'warning');
        return;
    }

    const expectedByLocation = new Map();
    const scannedByLocation = new Map();

    inventory.forEach(item => {
        const location = String(item.ubicacion || '').trim().toUpperCase();
        const upc = String(item.upc || '').trim();
        if (!location || !upc) return;

        if (!expectedByLocation.has(location)) {
            expectedByLocation.set(location, new Set());
        }

        expectedByLocation.get(location).add(upc);
    });

    physical.forEach(item => {
        const location = String(item.location || '').trim().toUpperCase();
        const upc = String(item.upc || '').trim();
        if (!location || !upc) return;

        if (!scannedByLocation.has(location)) {
            scannedByLocation.set(location, new Set());
        }

        scannedByLocation.get(location).add(upc);
    });

    [...expectedByLocation.keys()].sort().forEach(location => {
        const expected = expectedByLocation.get(location).size;
        const scanned = scannedByLocation.get(location)?.size || 0;
        const status = scanned === 0
            ? ['PENDIENTE', 'secondary']
            : scanned >= expected
                ? ['COMPLETA', 'success']
                : ['EN PROCESO', 'warning'];

        const row = progressBody.insertRow();
        [location, expected, scanned].forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });

        const statusCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `badge bg-${status[1]}`;
        badge.textContent = status[0];
        statusCell.appendChild(badge);
    });
}

function renderMessage(container, message, type) {
    container.replaceChildren();
    const row = container.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.className = `text-center text-${type} py-4`;
    cell.textContent = message;
}

function readStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    }
    catch {
        return [];
    }
}
