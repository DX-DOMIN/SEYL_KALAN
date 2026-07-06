// =====================================
// DATOS
// =====================================

const reportPeriod = KhaironCountData.getStoredPeriod();
const rawPhysical = KhaironCountData.getUnifiedCountEvents({
    mode: 'operational',
    startDate: reportPeriod.startDate,
    endDate: reportPeriod.endDate
});
const reportEvidence = KhaironCountData.getUnifiedCountEvents({
    mode: 'evidence', includeVoided: true,
    startDate: reportPeriod.startDate, endDate: reportPeriod.endDate
});
const reportStats = KhaironCountData.getUnifiedCountStats({
    mode: 'operational', startDate: reportPeriod.startDate, endDate: reportPeriod.endDate
});

// =====================================
// NORMALIZAR DATOS
// =====================================

const physical = rawPhysical.map(item => ({

    location:
        item.location || 'SIN UBICACIÓN',

    upc:
        item.upc || 'N/A',

    descripcion:
        item.descripcion || item.description || 'N/A',

    sistema:
        Number(item.sistema ?? item.systemQty ?? item.cantidadSistema) || 0,

    fisico:
        Number(item.fisico ?? item.physicalQty ?? item.scannedQty ?? item.cantidadFisica) || 0,

    fecha:
        item.fecha || item.savedAt || '',

    anomaly:
        item.anomaly || false,

    difference:
        Number(item.difference ?? item.diferencia ?? ((item.fisico ?? item.physicalQty ?? 0) - (item.sistema ?? item.systemQty ?? 0))) || 0,

    status:
        normalizeCountStatus(item.rawStatus || item.lineStatus || item.status || item.estado, item),

    rawStatus:
        item.rawStatus || item.lineStatus || item.status || item.estado || '',

    countDate:
        item.countDate || '',

    countMode:
        item.countMode || 'LEGACY',

    locationSweepId:
        item.locationSweepId || '',

    user: item.user || 'Sin usuario',
    timestamp: item.timestamp || '',
    observations: item.observations || '',
    normalizedStatus: item.normalizedStatus || item.status || '',
    voided: Boolean(item.voided),
    hasConflict: Boolean(item.hasConflict),
    conflictGroupId: item.conflictGroupId || '',
    conflictReason: item.conflictReason || '',
    isAggregated: Boolean(item.isAggregated),
    aggregatedFromCount: Number(item.aggregatedFromCount) || 1,
    aggregatedFromIds: Array.isArray(item.aggregatedFromIds) ? item.aggregatedFromIds : [],
    invalidDate: Boolean(item.invalidDate)

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
            item.fecha,

        Diferencia:
            item.difference,

        Estado:
            item.status,

        Estado_Detallado:
            item.rawStatus,

        Fecha_Operativa:
            item.countDate,

        Modo_Conteo:
            item.countMode,

        ID_Barrido:
            item.locationSweepId,

        Usuario: item.user,
        Fecha_Hora: item.timestamp,
        Observaciones: item.observations,
        Estado_Normalizado: item.normalizedStatus,
        Anulado: item.voided ? 'SI' : 'NO',
        Conflicto: item.hasConflict ? 'SI' : 'NO',
        Grupo_Conflicto: item.conflictGroupId,
        Motivo_Conflicto: item.conflictReason,
        Acumulado: item.isAggregated ? 'SI' : 'NO',
        Lineas_Acumuladas: item.aggregatedFromCount,
        IDs_Acumulados: item.aggregatedFromIds.join(' | '),
        Fecha_Invalida: item.invalidDate ? 'SI' : 'NO'

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

    const evidenceRows = reportEvidence.map(event => ({
        eventFingerprint: event.eventFingerprint,
        Ubicacion: event.location,
        UPC: event.upc,
        Descripcion: event.description,
        Sistema: event.systemQty,
        Fisico: event.physicalQty,
        Diferencia: event.difference,
        Estado_Detallado: event.rawStatus,
        Estado_Normalizado: event.normalizedStatus,
        Usuario: event.user,
        Fecha_Hora: event.timestamp,
        Fecha_Operativa: event.countDate,
        ID_Barrido: event.locationSweepId,
        Anulado: event.voided ? 'SI' : 'NO',
        Fecha_Invalida: event.invalidDate ? 'SI' : 'NO'
    }));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(evidenceRows), 'Evidencia');
    const conflictRows = exportData.filter(row => row.Conflicto === 'SI');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(conflictRows), 'Conflictos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([reportStats]), 'Resumen_Consolidacion');

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

    return exportUnifiedProgressExcel();

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

async function exportUnifiedProgressExcel() {
    await initDB();
    const inventory = await getInventory();
    const period = KhaironCountData.getStoredPeriod();
    const events = KhaironCountData.getUnifiedCountEvents({
        mode: 'operational', startDate: period.startDate, endDate: period.endDate
    });
    let layout = [];
    try {
        const response = await fetch('../assets/data/layout-tr3.json');
        if (response.ok) layout = await response.json();
    } catch (error) {
        console.warn('No fue posible cargar layout para exportar avance:', error);
    }
    const locations = new Set([
        ...layout.map(item => String(item.location || '').trim().toUpperCase()),
        ...inventory.map(item => String(item.ubicacion || '').trim().toUpperCase()),
        ...events.map(item => item.location)
    ].filter(Boolean));
    const report = [...locations].sort().map(location => {
        const locationEvents = events.filter(event => event.location === location);
        const expected = new Set(inventory
            .filter(item => String(item.ubicacion || '').trim().toUpperCase() === location)
            .map(item => String(item.upc || '').trim().toUpperCase()).filter(Boolean)).size;
        const scanned = new Set(locationEvents.map(item => item.upc)
            .filter(upc => upc && upc !== '__EMPTY__')).size;
        const layoutItem = layout.find(item => String(item.location || '').trim().toUpperCase() === location);
        return {
            ubicacion: location,
            cliente: layoutItem?.account || 'SIN CLIENTE',
            esperados: expected,
            escaneados: scanned,
            revisada: locationEvents.length ? 'SI' : 'NO',
            estado: locationEvents.length ? 'COMPLETA' : 'PENDIENTE',
            desde: period.startDate || 'INICIO',
            hasta: period.endDate || 'ACTUAL',
            conflictos: locationEvents.filter(event => event.hasConflict).length
        };
    });
    const worksheet = XLSX.utils.json_to_sheet(report);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Avance_Ubicaciones');
    XLSX.writeFile(workbook, 'KHAIRON_Avance_Ubicaciones.xlsx');
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
        version: 2,
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
    const sourceDeviceId = packageData.source?.deviceId || 'Equipo sin identificar';
    const fingerprints = new Set(history.map(item =>
        KhaironCountData.buildCountFingerprint(KhaironCountData.normalizeCountEvent(item, { source: 'scanHistory' }))
    ));
    const batchId = createId('import');

    packageData.events.forEach(rawEvent => {
        const normalized = normalizeImportedEvent(rawEvent, sourceDeviceId);
        if (!normalized) {
            result.rejected += 1;
            return;
        }

        const fingerprint = KhaironCountData.buildCountFingerprint(normalized);
        if (fingerprints.has(fingerprint)) {
            result.duplicated += 1;
            return;
        }

        const packageId = packageData.packageId || [
            packageData.source?.deviceId || 'SIN-EQUIPO',
            packageData.exportedAt || packageData.eventCount || file.name
        ].join('|');
        normalized.packageId = packageId;
        if (String(rawEvent.id || '').startsWith('xlsx-') || rawEvent.user === 'Importado desde Excel') {
            normalized.aggregationMode = 'SUM';
        }
        normalized.importBatchId = batchId;
        history.push(normalized);
        fingerprints.add(fingerprint);
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

    const source = { deviceId: `Excel: ${file.name}`, user: 'Importacion Excel' };
    const consolidatedEvents = consolidateDailyEvents(events, source.deviceId);
    return {
        schema: 'khairon-count-package',
        version: 2,
        exportedAt: new Date().toISOString(),
        source,
        eventCount: consolidatedEvents.length,
        sourceDuplicates: rows.length - uniqueRows.length,
        events: consolidatedEvents
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

function normalizeImportedEvent(event, sourceDeviceId) {
    const normalized = KhaironCountData.normalizeCountEvent(event, {
        source: 'scanHistory',
        sourceDeviceId
    });
    return normalized.location && normalized.upc && normalized.countDate ? normalized : null;

    const timestamp = new Date(event.timestamp || event.savedAt || event.fecha);
    const location = event.location || event.ubicacion;
    if (!location || !event.upc || Number.isNaN(timestamp.getTime())) return null;

    const systemQty = Number(event.systemQty ?? event.cantidadSistema ?? event.expectedQty ?? event.sistema) || 0;
    const physicalQty = Number(event.physicalQty ?? event.scannedQty ?? event.cantidadFisica ?? event.fisico) || 0;
    const difference = Number(event.difference ?? event.diferencia ?? (physicalQty - systemQty)) || 0;
    const rawStatus = event.rawStatus || event.lineStatus || event.status || event.estado;
    const status = normalizeCountStatus(rawStatus, { systemQty, physicalQty });
    const normalizedLocation = String(location).trim().toUpperCase();
    const countDate = event.countDate || localEventDateKey(timestamp);
    return {
        id: event.id || `event-${deterministicEventId(countDate, normalizedLocation, event.upc)}`,
        timestamp: timestamp.toISOString(),
        location: normalizedLocation,
        ubicacion: normalizedLocation,
        upc: String(event.upc).trim(),
        description: event.description || event.descripcion || 'Sin descripcion',
        descripcion: event.description || event.descripcion || 'Sin descripcion',
        scannedQty: physicalQty,
        systemQty,
        cantidadSistema: systemQty,
        physicalQty,
        cantidadFisica: physicalQty,
        difference,
        diferencia: difference,
        isInventoryAccurate: physicalQty === systemQty,
        isLocationAccurate: event.isLocationAccurate !== false,
        expectedLocation: event.expectedLocation || normalizedLocation,
        user: event.user || 'Sin usuario',
        countDate,
        countMode: event.countMode || 'LEGACY',
        locationSweepId: event.locationSweepId,
        rawStatus,
        lineStatus: rawStatus,
        status,
        estado: status,
        sourceDeviceId: event.sourceDeviceId || sourceDeviceId,
        observations: event.observations || '',
        isEmptyLocationValidation: Boolean(event.isEmptyLocationValidation),
        foundInOtherLocations: Array.isArray(event.foundInOtherLocations) ? event.foundInOtherLocations : []
    };
}

function getExportableEvents() {
    return KhaironCountData.getUnifiedCountEvents({ mode: 'evidence' });

    const history = readStoredArray('scanHistory');
    const sweepEvents = readStoredArray('khaironLocationSweeps').flatMap(sweep =>
        (Array.isArray(sweep.resultLines) ? sweep.resultLines : []).map(line => ({
            ...line,
            timestamp: sweep.savedAt || sweep.createdAt,
            countDate: sweep.countDate,
            location: line.location || sweep.location,
            locationSweepId: sweep.id,
            countMode: 'LOCATION_SWEEP',
            observations: sweep.observations
        }))
    );
    if (history.length || sweepEvents.length) return consolidateDailyEvents([...history, ...sweepEvents], getDeviceId());

    return consolidateDailyEvents(readStoredArray('physicalCount').map((item, index) => {
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
    }), getDeviceId());
}

function consolidateDailyEvents(events, fallbackSource) {
    const consolidated = new Map();
    events.map(event => normalizeImportedEvent(event, fallbackSource)).filter(Boolean).forEach(event => {
        const key = dailyEventKey(event);
        const current = consolidated.get(key);
        if (!current) {
            consolidated.set(key, { ...event });
            return;
        }

        if (isExcelEvent(event) && isExcelEvent(current)) {
            current.systemQty += event.systemQty;
            current.physicalQty += event.physicalQty;
            current.scannedQty += event.scannedQty;
            current.difference = current.physicalQty - current.systemQty;
            current.isInventoryAccurate = current.difference === 0;
            current.isLocationAccurate = current.isLocationAccurate && event.isLocationAccurate;
            if (event.timestamp > current.timestamp) current.timestamp = event.timestamp;
            return;
        }

        if (event.timestamp > current.timestamp) consolidated.set(key, { ...event });
    });
    return [...consolidated.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function dailyEventKey(event) {
    return KhaironCountData.buildOperationalKey(event);

    const date = event.countDate || localEventDateKey(event.timestamp);
    return `${date}|${String(event.location || '').trim().toUpperCase()}|${String(event.upc || '').trim().toUpperCase()}`;
}

function normalizeCountStatus(status, item = {}) {
    return KhaironCountData.normalizeCountStatus(status, item.rawStatus || status);

    const value = String(status || '').trim().toUpperCase();
    if (['OK', 'UBICACION_VACIA_VALIDADA', 'COMPLETA', 'VACIA_VALIDADA'].includes(value)) return 'OK';
    if (['FALTANTE', 'FALTANTE_TOTAL', 'UBICACION_VACIA_CON_STOCK_SISTEMA', 'VACIA_CON_STOCK_SISTEMA'].includes(value)) return 'FALTANTE';
    if (['SOBRANTE', 'FUERA_DE_UBICACION', 'NO_REGISTRADO'].includes(value)) return 'SOBRANTE';
    const systemQty = Number(item.systemQty ?? item.sistema ?? item.cantidadSistema) || 0;
    const physicalQty = Number(item.physicalQty ?? item.fisico ?? item.scannedQty ?? item.cantidadFisica) || 0;
    if (physicalQty < systemQty) return 'FALTANTE';
    if (physicalQty > systemQty) return 'SOBRANTE';
    return 'OK';
}

function deterministicEventId(countDate, location, upc) {
    const value = `${countDate}|${location}|${String(upc).trim().toUpperCase()}`;
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return `${countDate}-${(hash >>> 0).toString(36)}`;
}

function localEventDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'SIN-FECHA';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isExcelEvent(event) {
    return String(event.id || '').startsWith('xlsx-') || event.user === 'Importado desde Excel';
}

function removeImportBatch(batchId) {
    if (!batchId || !confirm('¿Retirar del concentrado los eventos de esta importacion?')) return;
    const history = readStoredArray('scanHistory');
    const filtered = history.flatMap(event => {
        if (event.importBatchId !== batchId) return [event];
        return event.previousImportEvent ? [event.previousImportEvent] : [];
    });
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

    const total = consolidateDailyEvents(readStoredArray('scanHistory'), getDeviceId()).length;
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
