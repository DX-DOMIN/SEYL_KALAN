// =====================================
// DATOS
// =====================================

const rawPhysical = readStoredArray('physicalCount');

// =====================================
// NORMALIZAR DATOS
// =====================================

const physical = rawPhysical.map(item => ({

    location:
        item.location || 'SIN UBICACIÓN',

    upc:
        item.upc || 'N/A',

    descripcion:
        item.descripcion || 'N/A',

    sistema:
        item.sistema || 0,

    fisico:
        item.fisico || 0,

    fecha:
        item.fecha || '',

    anomaly:
        item.anomaly || false

}));

// =====================================
// EXPORTAR EXCEL
// =====================================

function exportExcel() {

    // VALIDAR

    if (physical.length === 0) {

        alert(
            'No existen datos para exportar'
        );

        return;

    }

    // CREAR DATOS LIMPIOS

    const exportData = physical.map(item => ({

        Ubicacion:
            item.location,

        UPC:
            item.upc,

        Descripcion:
            item.descripcion,

        Sistema:
            item.sistema,

        Fisico:
            item.fisico,

        Fecha_Conteo:
            item.fecha

    }));

    // CREAR HOJA

    const worksheet =
        XLSX.utils.json_to_sheet(
            exportData
        );

    // CREAR LIBRO

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        'Inventario'

    );

    // DESCARGAR

    XLSX.writeFile(

        workbook,

        'KHAIRON_Reporte.xlsx'

    );

}

// =====================================
// EXPORTAR TXT
// =====================================

function exportTXT() {

    // VALIDAR

    if (physical.length === 0) {

        alert(
            'No existen datos para exportar'
        );

        return;

    }

    // TEXTO

    let text = '';

    physical.forEach(item => {

        text +=

`${item.location} | ${item.upc} | ${item.descripcion} | Sistema:${item.sistema} | Fisico:${item.fisico} | Fecha:${item.fecha}

`;

    });

    // CREAR ARCHIVO

    const blob = new Blob(

        [text],

        { type: 'text/plain' }

    );

    // LINK

    const link =
        document.createElement('a');

    link.href =
        URL.createObjectURL(blob);

    link.download =
        'KHAIRON_Reporte.txt';

    // DESCARGAR

    link.click();

}

// =====================================
// EXPORTAR AVANCE UBICACIONES
// =====================================

async function exportProgressExcel() {

    await initDB();

    // INVENTARIO ERP

    const inventory =
        await getInventory();

    // CONTEO FÍSICO

    const physical = JSON.parse(
        localStorage.getItem('physicalCount')
    ) || [];

    // UBICACIONES ÚNICAS

    const locations = [

        ...new Set(

            inventory.map(
                item => item.ubicacion
            )

        )

    ];

    // REPORTE

    const report = [];

    // RECORRER

    locations.forEach(location => {

        // ESPERADOS

        const expected = new Set(
            inventory
                .filter(item => item.ubicacion === location)
                .map(item => String(item.upc))
        ).size;

        // ESCANEADOS

        const scanned = new Set(
            physical
                .filter(item => item.location === location)
                .map(item => String(item.upc))
        ).size;

        // ESTADO

        let estado = '';

        // PENDIENTE

        if (scanned === 0) {

            estado = 'PENDIENTE';

        }

        // COMPLETA

        else if (scanned >= expected) {

            estado = 'COMPLETA';

        }

        // EN PROCESO

        else {

            estado = 'EN PROCESO';

        }

        // AGREGAR

        report.push({

            ubicacion: location,

            esperados: expected,

            escaneados: scanned,

            estado: estado

        });

    });

    // CREAR EXCEL

    const worksheet =
        XLSX.utils.json_to_sheet(report);

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        'Avance_Ubicaciones'

    );

    // EXPORTAR

    XLSX.writeFile(

        workbook,

        'KHAIRON_Avance_Ubicaciones.xlsx'

    );

}

// =====================================
// PAQUETES DE CONSOLIDACION
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    const exportButton = document.getElementById('exportCountPackage');
    const selectButton = document.getElementById('selectCountPackages');
    const fileInput = document.getElementById('importCountPackages');
    const historyTable = document.getElementById('importHistory');

    historyTable?.addEventListener('click', event => {
        const button = event.target.closest('[data-remove-batch]');
        if (button) removeImportBatch(button.dataset.removeBatch);
    });

    renderImportHistory();
});

function exportCountPackage() {
    const events = getExportableEvents();
    if (!events.length) {
        alert('No existen escaneos para exportar');
        return;
    }

    const now = new Date();
    const currentUser = readStoredObject('currentUser') || {};
    const deviceId = getDeviceId();
    const packageData = {
        schema: 'khairon-count-package',
        version: 1,
        exportedAt: now.toISOString(),
        source: {
            deviceId,
            user: currentUser.name || currentUser.username || 'Sin usuario'
        },
        eventCount: events.length,
        events
    };

    const blob = new Blob([JSON.stringify(packageData)], { type: 'application/json' });
    const link = document.createElement('a');
    const date = now.toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `KHAIRON_Avance_${deviceId}_${date}.json`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showTransferMessage(`Paquete generado con ${events.length.toLocaleString('es-MX')} eventos.`);
}

async function importCountPackages(event) {
    const files = [...event.target.files];
    if (!files.length) return;

    let totals = { accepted: 0, duplicated: 0, rejected: 0, files: 0 };
    for (const file of files) {
        const result = await importPackageFile(file);
        totals.accepted += result.accepted;
        totals.duplicated += result.duplicated;
        totals.rejected += result.rejected;
        totals.files += 1;
    }

    event.target.value = '';
    showImportResult(totals);
    renderImportHistory();
}

async function importPackageFile(file) {
    const result = { accepted: 0, duplicated: 0, rejected: 0 };
    let packageData;

    try {
        if (/\.xlsx?$/i.test(file.name)) {
            packageData = await readExcelPackage(file);
        } else {
            packageData = JSON.parse(await file.text());
        }
    } catch {
        result.rejected = 1;
        saveImportLog(file.name, 'Archivo invalido', result, null);
        return result;
    }

    if (packageData.schema !== 'khairon-count-package' || !Array.isArray(packageData.events)) {
        result.rejected = 1;
        saveImportLog(file.name, 'Formato no compatible', result, null);
        return result;
    }

    result.duplicated += Number(packageData.sourceDuplicates) || 0;

    const previousHistory = localStorage.getItem('scanHistory');
    const history = readStoredArray('scanHistory');
    const known = new Set(history.map(eventFingerprint));
    const batchId = createId('import');

    packageData.events.forEach(rawEvent => {
        const normalized = normalizeImportedEvent(rawEvent);
        if (!normalized) {
            result.rejected += 1;
            return;
        }

        const fingerprint = eventFingerprint(normalized);
        if (known.has(fingerprint)) {
            result.duplicated += 1;
            return;
        }

        normalized.importBatchId = batchId;
        history.push(normalized);
        known.add(fingerprint);
        result.accepted += 1;
    });

    try {
        localStorage.setItem('scanHistory', JSON.stringify(history));
        saveImportLog(
            file.name,
            packageData.source?.deviceId || 'Equipo sin identificar',
            result,
            batchId
        );
    } catch {
        if (previousHistory === null) {
            localStorage.removeItem('scanHistory');
        } else {
            localStorage.setItem('scanHistory', previousHistory);
        }
        result.rejected += result.accepted;
        result.accepted = 0;
        alert('No hay espacio suficiente en el navegador para consolidar este paquete.');
    }

    return result;
}

async function readExcelPackage(file) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    if (!rows.length) throw new Error('Excel sin registros');
    const headers = Object.keys(rows[0]).map(normalizeHeader);
    const required = ['ubicacion', 'upc', 'sistema', 'fisico', 'fecha_conteo'];
    if (!required.every(header => headers.includes(header))) {
        throw new Error('Columnas de Excel no compatibles');
    }

    const uniqueRows = [];
    const seenRows = new Set();
    rows.forEach(row => {
        const normalized = {};
        Object.entries(row).forEach(([key, value]) => {
            normalized[normalizeHeader(key)] = value;
        });
        const fingerprint = [
            normalized.ubicacion,
            normalized.upc,
            normalized.sistema,
            normalized.fisico,
            normalized.fecha_conteo
        ].join('|');
        if (!seenRows.has(fingerprint)) {
            seenRows.add(fingerprint);
            uniqueRows.push(row);
        }
    });

    const events = uniqueRows.map((row, index) => {
        const normalizedRow = {};
        Object.entries(row).forEach(([key, value]) => {
            normalizedRow[normalizeHeader(key)] = value;
        });

        const location = String(normalizedRow.ubicacion || '').trim().toUpperCase();
        const upc = String(normalizedRow.upc || '').trim();
        const systemQty = Number(normalizedRow.sistema) || 0;
        const physicalQty = Number(normalizedRow.fisico) || 0;
        const baseTimestamp = parseExcelReportDate(normalizedRow.fecha_conteo);
        const timestamp = new Date(new Date(baseTimestamp).getTime() + index).toISOString();

        return {
            id: `xlsx-${location}-${upc}-${timestamp}-${systemQty}-${physicalQty}`,
            timestamp,
            location,
            upc,
            description: normalizedRow.descripcion || 'Sin descripcion',
            scannedQty: physicalQty,
            systemQty,
            physicalQty,
            difference: physicalQty - systemQty,
            isInventoryAccurate: physicalQty === systemQty,
            isLocationAccurate: true,
            expectedLocation: location,
            user: 'Importado desde Excel'
        };
    });

    return {
        schema: 'khairon-count-package',
        version: 1,
        exportedAt: new Date().toISOString(),
        source: { deviceId: `Excel: ${file.name}`, user: 'Importacion Excel' },
        eventCount: events.length,
        sourceDuplicates: rows.length - uniqueRows.length,
        events
    };
}

function normalizeHeader(value) {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
}

function parseExcelReportDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
    if (typeof value === 'number') {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S).toISOString();
    }

    const text = String(value || '').trim().toLowerCase();
    const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2}):(\d{2})(?:\s*([ap])\.?\s*m\.?)?$/);
    if (match) {
        let hour = Number(match[4]);
        if (match[7] === 'p' && hour < 12) hour += 12;
        if (match[7] === 'a' && hour === 12) hour = 0;
        return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), hour, Number(match[5]), Number(match[6])).toISOString();
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    throw new Error('Fecha de conteo invalida');
}

function normalizeImportedEvent(event) {
    const timestamp = new Date(event.timestamp);
    if (!event.location || !event.upc || Number.isNaN(timestamp.getTime())) return null;

    const systemQty = Number(event.systemQty) || 0;
    const physicalQty = Number(event.physicalQty) || 0;
    return {
        id: event.id || createId('event'),
        timestamp: timestamp.toISOString(),
        location: String(event.location).trim().toUpperCase(),
        upc: String(event.upc).trim(),
        description: event.description || 'Sin descripcion',
        scannedQty: Number(event.scannedQty) || 0,
        systemQty,
        physicalQty,
        difference: physicalQty - systemQty,
        isInventoryAccurate: physicalQty === systemQty,
        isLocationAccurate: event.isLocationAccurate !== false,
        expectedLocation: event.expectedLocation || event.location,
        user: event.user || 'Sin usuario'
    };
}

function getExportableEvents() {
    const history = readStoredArray('scanHistory');
    if (history.length) return history;

    return readStoredArray('physicalCount').map((item, index) => {
        const timestamp = parseReportDate(item.fecha);
        const systemQty = Number(item.sistema) || 0;
        const physicalQty = Number(item.fisico) || 0;
        return {
            id: `legacy-${getDeviceId()}-${index}-${item.location}-${item.upc}`,
            timestamp,
            location: item.location,
            upc: String(item.upc),
            description: item.descripcion || 'Sin descripcion',
            scannedQty: physicalQty,
            systemQty,
            physicalQty,
            difference: physicalQty - systemQty,
            isInventoryAccurate: physicalQty === systemQty,
            isLocationAccurate: !item.anomaly,
            expectedLocation: item.ubicacionCorrecta || item.location,
            user: 'Registro anterior'
        };
    });
}

function removeImportBatch(batchId) {
    if (!batchId || !confirm('¿Retirar del concentrado los eventos de esta importacion?')) return;
    const history = readStoredArray('scanHistory');
    const filtered = history.filter(event => event.importBatchId !== batchId);
    localStorage.setItem('scanHistory', JSON.stringify(filtered));

    const logs = readStoredArray('consolidationImports').filter(log => log.batchId !== batchId);
    localStorage.setItem('consolidationImports', JSON.stringify(logs));
    renderImportHistory();
}

function saveImportLog(fileName, source, result, batchId) {
    const logs = readStoredArray('consolidationImports');
    logs.unshift({
        id: createId('log'),
        batchId,
        importedAt: new Date().toISOString(),
        fileName,
        source,
        ...result
    });
    localStorage.setItem('consolidationImports', JSON.stringify(logs.slice(0, 100)));
}

function renderImportHistory() {
    const history = readStoredArray('consolidationImports');
    const table = document.getElementById('importHistory');
    if (!table) return;
    table.replaceChildren();

    if (!history.length) {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.className = 'text-center text-secondary py-4';
        cell.textContent = 'Aun no se han cargado paquetes en esta computadora.';
    } else {
        history.forEach(log => {
            const row = table.insertRow();
            [
                new Date(log.importedAt).toLocaleString('es-MX'),
                log.fileName,
                log.source,
                log.accepted,
                log.duplicated,
                log.rejected
            ].forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });
            const actionCell = row.insertCell();
            if (log.batchId && log.accepted > 0) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-sm btn-outline-danger';
                button.dataset.removeBatch = log.batchId;
                button.title = 'Retirar importacion';
                button.innerHTML = '<i class="fa-solid fa-trash"></i>';
                actionCell.appendChild(button);
            }
        });
    }

    const total = readStoredArray('scanHistory').length;
    const counter = document.getElementById('consolidatedEventCount');
    if (counter) counter.textContent = `${total.toLocaleString('es-MX')} eventos consolidados`;
}

function showImportResult(totals) {
    const box = document.getElementById('importResult');
    box.classList.remove('d-none');
    box.textContent = `${totals.files} archivo(s): ${totals.accepted} aceptados, ${totals.duplicated} repetidos y ${totals.rejected} rechazados.`;
}

function showTransferMessage(message) {
    const box = document.getElementById('importResult');
    if (!box) return;
    box.classList.remove('d-none');
    box.textContent = message;
}

function eventFingerprint(event) {
    return event.id || [
        event.timestamp,
        event.location,
        event.upc,
        event.scannedQty,
        event.physicalQty
    ].join('|');
}

function getDeviceId() {
    let deviceId = localStorage.getItem('khaironDeviceId');
    if (!deviceId) {
        deviceId = `EQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        localStorage.setItem('khaironDeviceId', deviceId);
    }
    return deviceId;
}

function createId(prefix) {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseReportDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function readStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function readStoredObject(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}
