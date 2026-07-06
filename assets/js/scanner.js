// Barrido fisico por ubicacion. IndexedDB se usa exclusivamente en modo lectura.
let inventory = [];
let physicalCount = readStoredArray('physicalCount');
let currentLocation = '';
let expectedLines = [];
let scannedLines = new Map();
let pendingMovements = [];
let emptyLocationMarked = false;
let hasSavedDailyCounts = false;
let pendingDeletion = null;

const elements = {
    location: document.getElementById('locationInput'),
    loadLocation: document.getElementById('loadLocationButton'),
    loadedBadge: document.getElementById('loadedLocationBadge'),
    expectedCount: document.getElementById('expectedInventoryCount'),
    expectedBody: document.getElementById('expectedInventoryBody'),
    capturePanel: document.getElementById('capturePanel'),
    scanner: document.getElementById('scannerInput'),
    quantity: document.getElementById('qtyInput'),
    observations: document.getElementById('observationsInput'),
    addScan: document.getElementById('addScanButton'),
    markEmpty: document.getElementById('markEmptyButton'),
    reconciliationBody: document.getElementById('reconciliationBody'),
    reconciliationCount: document.getElementById('reconciliationCount'),
    clear: document.getElementById('clearSweepButton'),
    save: document.getElementById('saveSweepButton'),
    message: document.getElementById('sweepMessage'),
    savedBody: document.getElementById('savedScannerTableBody'),
    savedTotal: document.getElementById('savedCountTotal'),
    deleteDialog: document.getElementById('deleteScanDialog'),
    deleteForm: document.getElementById('deleteScanForm')
};

document.addEventListener('DOMContentLoaded', initializeScanner);

async function initializeScanner() {
    bindScannerEvents();
    renderExpectedInventory();
    renderReconciliation();
    renderSavedCounts();
    renderSummary([]);
    setCaptureEnabled(false);

    try {
        elements.loadLocation.disabled = true;
        await initDB();
        inventory = await getInventory();
        showMessage(`Inventario disponible: ${inventory.length.toLocaleString('es-MX')} registros`, 'success');
    }
    catch (error) {
        console.error('No fue posible cargar el inventario:', error);
        showMessage('No fue posible abrir el inventario ERP/WMS. Recarga la pagina.', 'danger');
    }
    finally {
        elements.loadLocation.disabled = false;
    }
}

function bindScannerEvents() {
    elements.loadLocation.addEventListener('click', loadLocation);
    elements.addScan.addEventListener('click', addScan);
    elements.markEmpty.addEventListener('click', markLocationEmpty);
    elements.clear.addEventListener('click', () => clearSweep(true));
    elements.save.addEventListener('click', saveLocationSweep);

    elements.location.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            loadLocation();
        }
    });
    elements.scanner.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addScan();
        }
    });

    elements.savedBody.addEventListener('click', event => {
        const button = event.target.closest('[data-delete-saved-count]');
        if (!button) return;
        openDeleteDialog(Number(button.dataset.recordIndex));
    });

    document.getElementById('cancelDeleteScan').addEventListener('click', closeDeleteDialog);
    document.getElementById('cancelDeleteScanBottom').addEventListener('click', closeDeleteDialog);
    elements.deleteForm.addEventListener('submit', authorizeDeletion);
}

function loadLocation() {
    const location = normalizeValue(elements.location.value);
    if (!location) {
        showMessage('Captura una ubicacion antes de continuar.', 'danger');
        elements.location.focus();
        return;
    }
    if (!inventory.length) {
        showMessage('Primero carga el inventario ERP/WMS.', 'danger');
        return;
    }
    if (hasDraft() && location !== currentLocation && !confirm('Hay una captura sin guardar. ¿Cambiar de ubicacion y descartarla?')) {
        return;
    }

    currentLocation = location;
    elements.location.value = location;
    expectedLines = aggregateExpectedInventory(location);
    const dailyState = loadSavedDailyState(location);
    scannedLines = dailyState.scannedLines;
    pendingMovements = [];
    emptyLocationMarked = dailyState.emptyLocationMarked;
    hasSavedDailyCounts = dailyState.hasSavedDailyCounts;

    elements.loadedBadge.textContent = location;
    elements.loadedBadge.classList.add('loaded');
    setCaptureEnabled(true);
    renderAllSweepData();
    setWorkflowStep('scan');

    if (hasSavedDailyCounts) {
        showMessage(`${location}: se recupero el conteo guardado de hoy para continuar acumulando.`, 'success');
    } else if (expectedLines.length) {
        showMessage(`${location}: ${expectedLines.length} UPC esperados cargados.`, 'success');
    } else {
        showMessage(`${location} no tiene producto en sistema. Puedes contar producto fisico o validarla vacia.`, 'warning');
    }
    elements.scanner.focus();
}

function loadSavedDailyState(location) {
    const today = localDateKey(new Date());
    const dailyRecords = physicalCount.filter(item =>
        normalizeValue(item.location) === location && recordDate(item) === today &&
        !KhaironCountData.isCountEventVoided(item)
    );
    const restored = new Map();
    let emptyMarked = false;

    dailyRecords.forEach(item => {
        const upc = normalizeValue(item.upc);
        if (upc === '__EMPTY__' || item.isEmptyLocationValidation && !numericQty(item.sistema)) {
            emptyMarked = true;
            return;
        }
        restored.set(upc, {
            upc,
            description: item.descripcion || 'SIN DESCRIPCION',
            physicalQty: numericQty(item.fisico),
            foundInOtherLocations: Array.isArray(item.foundInOtherLocations)
                ? item.foundInOtherLocations
                : item.anomaly && item.ubicacionCorrecta ? [item.ubicacionCorrecta] : []
        });
    });

    return {
        scannedLines: restored,
        emptyLocationMarked: emptyMarked,
        hasSavedDailyCounts: dailyRecords.length > 0
    };
}

function aggregateExpectedInventory(location) {
    const grouped = new Map();
    inventory
        .filter(item => normalizeValue(item.ubicacion) === location)
        .forEach(item => {
            const upc = normalizeValue(item.upc);
            if (!upc) return;
            const current = grouped.get(upc) || {
                location,
                upc,
                description: item.descripcion || 'SIN DESCRIPCION',
                systemQty: 0,
                reservedQty: 0,
                availableQty: 0
            };
            current.systemQty += numericQty(item.existencias);
            current.reservedQty += numericQty(item.reservado);
            current.availableQty += numericQty(item.disponible);
            if (!current.description && item.descripcion) current.description = item.descripcion;
            grouped.set(upc, current);
        });
    return [...grouped.values()].sort((a, b) => a.upc.localeCompare(b.upc));
}

function addScan() {
    if (!currentLocation) {
        showMessage('Carga una ubicacion antes de escanear.', 'danger');
        return;
    }
    if (normalizeValue(elements.location.value) !== currentLocation) {
        showMessage('La ubicacion escrita cambio. Pulsa Cargar ubicacion antes de escanear.', 'danger');
        return;
    }

    const upc = normalizeValue(elements.scanner.value);
    const quantity = Number(elements.quantity.value);
    if (!upc) {
        showMessage('Escanea o captura un UPC.', 'danger');
        elements.scanner.focus();
        return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
        showMessage('La cantidad debe ser un entero mayor que cero.', 'danger');
        elements.quantity.focus();
        return;
    }

    emptyLocationMarked = false;
    const expected = expectedLines.find(item => item.upc === upc);
    const otherMatches = inventory.filter(item =>
        normalizeValue(item.upc) === upc && normalizeValue(item.ubicacion) !== currentLocation
    );
    const foundInOtherLocations = [...new Set(otherMatches.map(item => normalizeValue(item.ubicacion)).filter(Boolean))];
    const current = scannedLines.get(upc) || {
        upc,
        description: expected?.description || otherMatches.find(item => item.descripcion)?.descripcion || 'UPC NO REGISTRADO',
        physicalQty: 0,
        foundInOtherLocations
    };
    current.physicalQty += quantity;
    current.foundInOtherLocations = foundInOtherLocations;
    scannedLines.set(upc, current);
    pendingMovements.push({ upc, qty: quantity, timestamp: new Date().toISOString() });

    renderAllSweepData();
    setWorkflowStep('review');
    if (!expected && foundInOtherLocations.length) {
        showMessage(`El UPC ${upc} pertenece a: ${foundInOtherLocations.join(', ')}.`, 'warning');
    } else if (!expected) {
        showMessage(`El UPC ${upc} no existe en el inventario.`, 'warning');
    } else {
        showMessage(`${upc}: ${current.physicalQty} piezas acumuladas en esta captura.`, 'success');
    }

    elements.scanner.value = '';
    elements.quantity.value = 1;
    elements.scanner.focus();
}

function markLocationEmpty() {
    if (!currentLocation) {
        showMessage('Carga una ubicacion antes de marcarla vacia.', 'danger');
        return;
    }
    if (hasSavedDailyCounts) {
        showMessage('La ubicacion ya tiene conteos guardados hoy. Eliminalos con autorizacion antes de marcarla vacia.', 'danger');
        return;
    }
    const hasExpectedStock = expectedLines.some(item => item.systemQty > 0);
    const message = hasExpectedStock
        ? 'La ubicacion tiene stock en sistema. Se generaran faltantes totales. ¿Confirmar ubicacion fisicamente vacia?'
        : '¿Confirmar que la ubicacion esta fisicamente vacia?';
    if (!confirm(message)) return;
    if (scannedLines.size && !confirm('Los escaneos temporales actuales se descartaran. ¿Continuar?')) return;

    scannedLines = new Map();
    pendingMovements = [];
    emptyLocationMarked = true;
    renderAllSweepData();
    setWorkflowStep('review');
    showMessage(
        hasExpectedStock
            ? 'Ubicacion vacia confirmada con stock en sistema.'
            : 'Ubicacion vacia validada.',
        hasExpectedStock ? 'warning' : 'success'
    );
}

function getResultLines() {
    if (!currentLocation) return [];
    const expectedByUpc = new Map(expectedLines.map(item => [item.upc, item]));
    const result = [];
    const hasExpectedStock = expectedLines.some(item => item.systemQty > 0);

    if (emptyLocationMarked && !hasExpectedStock) {
        return [{
            location: currentLocation,
            upc: '__EMPTY__',
            description: 'UBICACION VACIA VALIDADA',
            systemQty: 0,
            reservedQty: 0,
            availableQty: 0,
            physicalQty: 0,
            difference: 0,
            status: 'UBICACION_VACIA_VALIDADA',
            isInventoryAccurate: true,
            isLocationAccurate: true,
            expectedLocation: currentLocation,
            foundInOtherLocations: [],
            isEmptyLocationValidation: true
        }];
    }

    expectedLines.forEach(expected => {
        const scanned = scannedLines.get(expected.upc);
        const physicalQty = emptyLocationMarked ? 0 : numericQty(scanned?.physicalQty);
        let status = 'OK';
        if (emptyLocationMarked && expected.systemQty > 0) status = 'UBICACION_VACIA_CON_STOCK_SISTEMA';
        else if (physicalQty === 0 && expected.systemQty > 0) status = 'FALTANTE_TOTAL';
        else if (physicalQty < expected.systemQty) status = 'FALTANTE';
        else if (physicalQty > expected.systemQty) status = 'SOBRANTE';
        result.push(buildResultLine(expected, physicalQty, status, [], emptyLocationMarked));
    });

    if (!emptyLocationMarked) {
        scannedLines.forEach(scanned => {
            if (expectedByUpc.has(scanned.upc)) return;
            const status = scanned.foundInOtherLocations.length ? 'FUERA_DE_UBICACION' : 'NO_REGISTRADO';
            result.push(buildResultLine({
                location: currentLocation,
                upc: scanned.upc,
                description: scanned.description,
                systemQty: 0,
                reservedQty: 0,
                availableQty: 0
            }, scanned.physicalQty, status, scanned.foundInOtherLocations, false));
        });
    }
    return result;
}

function buildResultLine(expected, physicalQty, status, otherLocations, emptyValidation) {
    const difference = physicalQty - expected.systemQty;
    const locationAccurate = !['FUERA_DE_UBICACION', 'NO_REGISTRADO'].includes(status);
    return {
        location: currentLocation,
        upc: expected.upc,
        description: expected.description || 'SIN DESCRIPCION',
        systemQty: numericQty(expected.systemQty),
        reservedQty: numericQty(expected.reservedQty),
        availableQty: numericQty(expected.availableQty),
        physicalQty: numericQty(physicalQty),
        difference,
        status,
        isInventoryAccurate: status === 'OK',
        isLocationAccurate: locationAccurate,
        expectedLocation: otherLocations[0] || currentLocation,
        foundInOtherLocations: otherLocations,
        isEmptyLocationValidation: Boolean(emptyValidation)
    };
}

function renderAllSweepData() {
    const lines = getResultLines();
    renderExpectedInventory();
    renderReconciliation(lines);
    renderSummary(lines);
    elements.save.disabled = !currentLocation;
    elements.clear.disabled = !currentLocation;
}

function renderExpectedInventory() {
    elements.expectedBody.replaceChildren();
    elements.expectedCount.textContent = `${expectedLines.length} UPC`;
    if (!currentLocation) {
        renderEmptyRow(elements.expectedBody, 5, 'Carga una ubicacion para consultar su inventario.');
        return;
    }
    if (!expectedLines.length) {
        renderEmptyRow(elements.expectedBody, 5, 'Sin producto en sistema. La ubicacion puede contarse o validarse vacia.');
        return;
    }
    expectedLines.forEach(item => {
        const row = elements.expectedBody.insertRow();
        [item.upc, item.description, item.systemQty, item.reservedQty, item.availableQty]
            .forEach(value => row.insertCell().textContent = value);
    });
}

function renderReconciliation(lines = getResultLines()) {
    elements.reconciliationBody.replaceChildren();
    elements.reconciliationCount.textContent = `${lines.length} lineas`;
    if (!currentLocation) {
        renderEmptyRow(elements.reconciliationBody, 9, 'Aun no hay una ubicacion cargada.');
        return;
    }
    if (!lines.length) {
        renderEmptyRow(elements.reconciliationBody, 9, 'Escanea producto o marca la ubicacion vacia.');
        return;
    }
    lines.forEach(line => {
        const row = elements.reconciliationBody.insertRow();
        [line.location, line.upc, line.description, line.systemQty, line.reservedQty,
            line.availableQty, line.physicalQty, line.difference]
            .forEach(value => row.insertCell().textContent = value);
        const statusCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `sweep-status ${statusClass(line.status)}`;
        badge.textContent = line.status.replaceAll('_', ' ');
        statusCell.appendChild(badge);
    });
}

function renderSummary(lines) {
    const totals = summarizeLines(lines);
    setText('summarySystemUpcs', expectedLines.length);
    setText('summarySystemPieces', expectedLines.reduce((sum, item) => sum + item.systemQty, 0));
    setText('summaryPhysicalUpcs', [...scannedLines.values()].filter(item => item.physicalQty > 0).length);
    setText('summaryPhysicalPieces', [...scannedLines.values()].reduce((sum, item) => sum + item.physicalQty, 0));
    setText('summaryOk', totals.okLines);
    setText('summaryShortage', totals.shortageLines);
    setText('summaryOverage', totals.overageLines);
    setText('summaryOutOfLocation', totals.outOfLocationLines);
    setText('summaryNotRegistered', totals.notRegisteredLines);
}

function summarizeLines(lines) {
    return lines.reduce((totals, line) => {
        if (line.status === 'OK' || line.status === 'UBICACION_VACIA_VALIDADA') totals.okLines += 1;
        if (['FALTANTE', 'FALTANTE_TOTAL', 'UBICACION_VACIA_CON_STOCK_SISTEMA'].includes(line.status)) totals.shortageLines += 1;
        if (line.status === 'SOBRANTE') totals.overageLines += 1;
        if (line.status === 'FUERA_DE_UBICACION') totals.outOfLocationLines += 1;
        if (line.status === 'NO_REGISTRADO') totals.notRegisteredLines += 1;
        return totals;
    }, { okLines: 0, shortageLines: 0, overageLines: 0, outOfLocationLines: 0, notRegisteredLines: 0 });
}

function saveLocationSweep() {
    if (!currentLocation) {
        showMessage('Carga una ubicacion antes de guardar.', 'danger');
        return;
    }
    if (!scannedLines.size && !emptyLocationMarked) {
        showMessage('Escanea producto o marca la ubicacion vacia antes de guardar.', 'danger');
        return;
    }

    const now = new Date();
    const countDate = localDateKey(now);
    const sweepId = createId('LS');
    const observations = elements.observations.value.trim();
    const currentUser = KhaironAuth.getCurrentUser() || {};
    const sourceDeviceId = getDeviceId();
    const rawResultLines = getResultLines();
    const totals = summarizeLines(rawResultLines);
    const locationStatus = resolveLocationStatus(rawResultLines);
    const resultLines = rawResultLines.map(line => KhaironCountData.normalizeCountEvent(line, {
        source: 'locationSweep',
        timestamp: now.toISOString(),
        countDate,
        countMode: 'LOCATION_SWEEP',
        locationSweepId: sweepId,
        user: currentUser.name || currentUser.username || 'Sin usuario',
        sourceDeviceId,
        observations
    }));
    const sweep = {
        id: sweepId,
        location: currentLocation,
        user: currentUser.name || currentUser.username || 'Sin usuario',
        createdAt: pendingMovements[0]?.timestamp || now.toISOString(),
        savedAt: now.toISOString(),
        countDate,
        status: locationStatus,
        expectedLines: expectedLines.map(item => ({ ...item })),
        scannedLines: [...scannedLines.values()].map(item => ({ ...item })),
        resultLines: resultLines.map(item => ({ ...item })),
        totals: {
            systemUpcs: expectedLines.length,
            systemPieces: expectedLines.reduce((sum, item) => sum + item.systemQty, 0),
            scannedUpcs: [...scannedLines.values()].filter(item => item.physicalQty > 0).length,
            scannedPieces: [...scannedLines.values()].reduce((sum, item) => sum + item.physicalQty, 0),
            ...totals
        },
        observations,
        sourceDeviceId
    };

    const nextPhysical = [...physicalCount];
    const nextHistory = readStoredArray('scanHistory');
    const nextMovements = readStoredArray('movements');
    const nextSweeps = readStoredArray('khaironLocationSweeps');

    resultLines.forEach(line => {
        upsertDailyPhysical(nextPhysical, line, sweep, now);
        upsertDailyHistory(nextHistory, line, sweep, now, currentUser, sourceDeviceId);
    });
    pendingMovements.forEach(movement => nextMovements.unshift({
        id: createId('movement'),
        location: currentLocation,
        upc: movement.upc,
        qty: movement.qty,
        date: new Date(movement.timestamp).toLocaleString('es-MX'),
        timestamp: movement.timestamp,
        countDate,
        countMode: 'LOCATION_SWEEP',
        locationSweepId: sweepId,
        sourceDeviceId,
        user: currentUser.name || currentUser.username || 'Sin usuario'
    }));
    if (emptyLocationMarked && !pendingMovements.length) {
        nextMovements.unshift({
            id: createId('movement'), location: currentLocation, upc: '__EMPTY__', qty: 0,
            date: now.toLocaleString('es-MX'), timestamp: now.toISOString(), countDate,
            countMode: 'LOCATION_SWEEP', locationSweepId: sweepId,
            sourceDeviceId,
            user: currentUser.name || currentUser.username || 'Sin usuario', emptyValidation: true
        });
    }
    nextSweeps.unshift(sweep);

    const backups = backupStorage(['physicalCount', 'scanHistory', 'movements', 'khaironLocationSweeps']);
    try {
        localStorage.setItem('physicalCount', JSON.stringify(nextPhysical));
        localStorage.setItem('scanHistory', JSON.stringify(nextHistory));
        localStorage.setItem('movements', JSON.stringify(nextMovements));
        localStorage.setItem('khaironLocationSweeps', JSON.stringify(nextSweeps));
        physicalCount = nextPhysical;
        console.info('[KHAIRON] Barrido guardado', {
            sweepId,
            countDate,
            location: currentLocation,
            lines: resultLines.length,
            physicalCount: nextPhysical.length,
            scanHistory: nextHistory.length,
            movements: nextMovements.length,
            locationSweeps: nextSweeps.length
        });
    }
    catch (error) {
        restoreStorage(backups);
        console.error('No fue posible guardar el barrido:', error);
        showMessage('No fue posible guardar. No se modificaron los datos anteriores.', 'danger');
        return;
    }

    clearSweep(false);
    renderSavedCounts();
    showMessage(`Barrido ${sweepId} guardado correctamente para ${sweep.location}.`, 'success');
}

function upsertDailyPhysical(records, line, sweep, now) {
    const key = dailyRecordKey(sweep.countDate, line.location, line.upc);
    const index = records.findIndex(item => physicalRecordKey(item) === key);
    const rawStatus = line.rawStatus || line.status;
    const normalizedStatus = normalizeCountStatus(rawStatus);
    const lineId = deterministicCountId(sweep.countDate, line.location, line.upc);
    const compatible = {
        id: index >= 0 ? records[index].id : `physical-${lineId}`,
        lineId,
        location: line.location,
        ubicacion: line.location,
        upc: line.upc,
        description: line.description,
        descripcion: line.description,
        sistema: line.systemQty,
        fisico: line.physicalQty,
        fecha: now.toLocaleString('es-MX'),
        anomaly: !line.isLocationAccurate,
        ubicacionCorrecta: line.expectedLocation,
        countDate: sweep.countDate,
        countMode: 'LOCATION_SWEEP',
        locationSweepId: sweep.id,
        locationStatus: sweep.status,
        expectedQty: line.systemQty,
        scannedQty: line.physicalQty,
        physicalQty: line.physicalQty,
        cantidadFisica: line.physicalQty,
        systemQty: line.systemQty,
        cantidadSistema: line.systemQty,
        difference: line.difference,
        diferencia: line.difference,
        lineStatus: rawStatus,
        rawStatus,
        status: normalizedStatus,
        estado: normalizedStatus,
        normalizedStatus,
        reservedQty: line.reservedQty,
        availableQty: line.availableQty,
        isEmptyLocationValidation: line.isEmptyLocationValidation,
        savedAt: now.toISOString(),
        timestamp: now.toISOString(),
        user: sweep.user,
        sourceDeviceId: sweep.sourceDeviceId,
        observations: sweep.observations,
        foundInOtherLocations: line.foundInOtherLocations
    };
    if (index >= 0) records[index] = { ...records[index], ...compatible };
    else records.unshift(compatible);
}

function upsertDailyHistory(records, line, sweep, now, currentUser, sourceDeviceId) {
    const key = dailyRecordKey(sweep.countDate, line.location, line.upc);
    const indexes = records
        .map((item, index) => ({ index, key: historyRecordKey(item) }))
        .filter(item => item.key === key)
        .map(item => item.index);
    const targetIndex = indexes.length ? indexes[0] : -1;
    const previous = targetIndex >= 0 ? records[targetIndex] : null;
    const rawStatus = line.rawStatus || line.status;
    const normalizedStatus = normalizeCountStatus(rawStatus);
    const lineId = deterministicCountId(sweep.countDate, line.location, line.upc);
    const event = {
        id: previous?.id || `event-${lineId}`,
        lineId,
        timestamp: now.toISOString(),
        countDate: sweep.countDate,
        location: line.location,
        ubicacion: line.location,
        upc: line.upc,
        description: line.description,
        descripcion: line.description,
        scannedQty: line.physicalQty,
        systemQty: line.systemQty,
        cantidadSistema: line.systemQty,
        physicalQty: line.physicalQty,
        cantidadFisica: line.physicalQty,
        difference: line.difference,
        diferencia: line.difference,
        rawStatus,
        lineStatus: rawStatus,
        status: normalizedStatus,
        estado: normalizedStatus,
        normalizedStatus,
        isInventoryAccurate: line.isInventoryAccurate,
        isLocationAccurate: line.isLocationAccurate,
        expectedLocation: line.expectedLocation,
        user: currentUser.name || currentUser.username || 'Sin usuario',
        countMode: 'LOCATION_SWEEP',
        locationSweepId: sweep.id,
        locationStatus: sweep.status,
        sourceDeviceId,
        observations: sweep.observations,
        foundInOtherLocations: line.foundInOtherLocations,
        isEmptyLocationValidation: line.isEmptyLocationValidation
    };
    if (targetIndex >= 0) records[targetIndex] = { ...previous, ...event };
    else records.unshift(event);
}

function normalizeCountStatus(status) {
    return KhaironCountData.normalizeCountStatus(status, status);
}

function deterministicCountId(countDate, location, upc) {
    const value = `${countDate}|${String(location).trim().toUpperCase()}|${String(upc).trim().toUpperCase()}`;
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return `${countDate}-${(hash >>> 0).toString(36)}`;
}

function resolveLocationStatus(lines) {
    if (lines.length === 1 && lines[0].status === 'UBICACION_VACIA_VALIDADA') return 'VACIA_VALIDADA';
    if (lines.some(line => line.status === 'UBICACION_VACIA_CON_STOCK_SISTEMA')) return 'VACIA_CON_STOCK_SISTEMA';
    return lines.every(line => line.status === 'OK') ? 'COMPLETA' : 'CON_DIFERENCIAS';
}

function clearSweep(askConfirmation) {
    if (askConfirmation && hasDraft() && !confirm('¿Limpiar la captura sin guardar?')) return;
    currentLocation = '';
    expectedLines = [];
    scannedLines = new Map();
    pendingMovements = [];
    emptyLocationMarked = false;
    hasSavedDailyCounts = false;
    elements.location.value = '';
    elements.scanner.value = '';
    elements.quantity.value = 1;
    elements.observations.value = '';
    elements.loadedBadge.textContent = 'Sin ubicacion cargada';
    elements.loadedBadge.classList.remove('loaded');
    setCaptureEnabled(false);
    renderAllSweepData();
    setWorkflowStep('load');
    elements.location.focus();
}

function renderSavedCounts() {
    elements.savedBody.replaceChildren();
    const activeEntries = physicalCount
        .map((item, index) => ({ item, index }))
        .filter(entry => !KhaironCountData.isCountEventVoided(entry.item));
    elements.savedTotal.textContent = `${activeEntries.length.toLocaleString('es-MX')} registros`;
    if (!activeEntries.length) {
        renderEmptyRow(elements.savedBody, 8, 'Aun no existen conteos guardados.');
        return;
    }
    activeEntries
        .slice(0, 200)
        .forEach(({ item, index }) => {
        const systemQty = numericQty(item.sistema);
        const physicalQty = numericQty(item.fisico);
        const status = item.lineStatus || item.status || inferLegacyStatus(item);
        const row = elements.savedBody.insertRow();
        [item.fecha || item.savedAt || '', item.location, item.upc, systemQty, physicalQty, physicalQty - systemQty]
            .forEach(value => row.insertCell().textContent = value);
        const statusCell = row.insertCell();
        const badge = document.createElement('span');
        badge.className = `sweep-status ${statusClass(status)}`;
        badge.textContent = String(status).replaceAll('_', ' ');
        statusCell.appendChild(badge);
        const actionCell = row.insertCell();
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-danger delete-scan-btn';
        button.dataset.deleteSavedCount = '';
        button.dataset.recordIndex = index;
        button.title = 'Eliminar con autorizacion';
        button.setAttribute('aria-label', `Eliminar ${item.upc} de ${item.location}`);
        button.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
        actionCell.appendChild(button);
    });
}

function openDeleteDialog(recordIndex) {
    const record = physicalCount[recordIndex];
    if (!record) return;
    pendingDeletion = { record, recordIndex };
    document.getElementById('deleteScanSummary').textContent =
        `${record.location} - ${record.upc} - ${record.fisico || 0} piezas - ${recordDate(record)}`;
    setDeleteMessage('');
    elements.deleteForm.reset();
    elements.deleteDialog.showModal();
    document.getElementById('adminUsername').focus();
}

function authorizeDeletion(event) {
    event.preventDefault();
    if (!pendingDeletion) return;
    const data = new FormData(elements.deleteForm);
    const reason = String(data.get('deleteReason') || '').trim();
    if (reason.length < 4) {
        setDeleteMessage('Captura un motivo de al menos 4 caracteres.');
        return;
    }
    const authorization = KhaironAuth.authorizeAdministrator(data.get('adminUsername'), data.get('adminPassword'));
    if (!authorization.ok) {
        setDeleteMessage(authorization.message);
        return;
    }
    try {
        deleteSavedRecord(pendingDeletion, authorization.user, reason);
    } catch (error) {
        console.error('No fue posible anular el registro:', error);
        setDeleteMessage('No fue posible guardar la anulacion. No se modificaron los datos.');
        return;
    }
    closeDeleteDialog();
    renderSavedCounts();
    showMessage('Registro anulado con autorizacion y evidencia de auditoria.', 'success');
}

function deleteSavedRecord(pending, administrator, reason) {
    const { record, recordIndex } = pending;
    const key = physicalRecordKey(record);
    const history = readStoredArray('scanHistory');
    const movements = readStoredArray('movements');
    const removedHistory = history.filter(item => historyRecordKey(item) === key);
    const removedMovements = movements.filter(item => movementRecordKey(item) === key);
    const audit = readStoredArray('scanDeletionAudit');
    const voids = readStoredArray('khaironVoidedCountEvents');
    const currentUser = KhaironAuth.getCurrentUser() || {};
    const deletedAt = new Date().toISOString();
    const normalized = KhaironCountData.normalizeCountEvent(record, { source: 'physicalCount' });
    const tombstone = {
        id: createId('void'), targetType: 'COUNT_EVENT', targetId: record.id,
        eventFingerprint: normalized.eventFingerprint,
        locationSweepId: record.locationSweepId || '', location: normalized.location,
        upc: normalized.upc, countDate: normalized.countDate, reason,
        deletedBy: administrator.name, deletedUsername: administrator.username, deletedAt
    };
    voids.unshift(tombstone);
    audit.unshift({
        ...tombstone, timestamp: deletedAt,
        requestedBy: currentUser.name || currentUser.username || 'Sin usuario',
        authorizedBy: administrator.name, authorizedUsername: administrator.username,
        reason, record: { ...record }, removedHistory, removedMovements
    });
    const backups = backupStorage(['khaironVoidedCountEvents', 'scanDeletionAudit']);
    try {
        localStorage.setItem('khaironVoidedCountEvents', JSON.stringify(voids));
        localStorage.setItem('scanDeletionAudit', JSON.stringify(audit));
    } catch (error) {
        restoreStorage(backups);
        throw error;
    }
}

function closeDeleteDialog() {
    pendingDeletion = null;
    setDeleteMessage('');
    elements.deleteForm.reset();
    if (elements.deleteDialog.open) elements.deleteDialog.close();
}

function setCaptureEnabled(enabled) {
    [elements.scanner, elements.quantity, elements.observations, elements.addScan, elements.markEmpty]
        .forEach(control => { control.disabled = !enabled; });
    elements.capturePanel.setAttribute('aria-disabled', String(!enabled));
}

function setWorkflowStep(step) {
    const order = ['load', 'scan', 'review', 'save'];
    const activeIndex = order.indexOf(step);
    document.querySelectorAll('[data-step-indicator]').forEach(indicator => {
        const index = order.indexOf(indicator.dataset.stepIndicator);
        indicator.classList.toggle('active', index === activeIndex);
        indicator.classList.toggle('complete', index < activeIndex);
    });
}

function showMessage(message, type) {
    elements.message.textContent = message;
    elements.message.className = `sweep-message ${type}`;
    elements.message.hidden = false;
}

function setDeleteMessage(message) {
    const box = document.getElementById('deleteScanMessage');
    box.textContent = message;
    box.hidden = !message;
}

function renderEmptyRow(tbody, columns, message) {
    const row = tbody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = columns;
    cell.className = 'sweep-empty-state';
    cell.textContent = message;
}

function statusClass(status) {
    if (['OK', 'UBICACION_VACIA_VALIDADA'].includes(status)) return 'ok';
    if (['FALTANTE', 'FALTANTE_TOTAL', 'UBICACION_VACIA_CON_STOCK_SISTEMA'].includes(status)) return 'shortage';
    if (status === 'SOBRANTE') return 'overage';
    if (status === 'FUERA_DE_UBICACION') return 'out-of-location';
    return 'unregistered';
}

function inferLegacyStatus(item) {
    if (item.anomaly) return 'FUERA_DE_UBICACION';
    const difference = numericQty(item.fisico) - numericQty(item.sistema);
    if (difference === 0) return 'OK';
    if (difference > 0) return 'SOBRANTE';
    return numericQty(item.fisico) === 0 ? 'FALTANTE_TOTAL' : 'FALTANTE';
}

function hasDraft() {
    return Boolean(currentLocation && (
        pendingMovements.length ||
        emptyLocationMarked && !hasSavedDailyCounts ||
        elements.observations.value.trim()
    ));
}

function dailyRecordKey(date, location, upc) {
    return `${date}|${normalizeValue(location)}|${normalizeValue(upc)}`;
}

function physicalRecordKey(item) {
    return dailyRecordKey(recordDate(item), item.location, item.upc);
}

function historyRecordKey(item) {
    return dailyRecordKey(item.countDate || localDateKey(item.timestamp), item.location, item.upc);
}

function movementRecordKey(item) {
    return dailyRecordKey(item.countDate || localDateKey(item.timestamp || item.date), item.location, item.upc);
}

function recordDate(item) {
    return item.countDate || localDateKey(item.savedAt || item.timestamp || item.fecha);
}

function localDateKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'SIN-FECHA';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeValue(value) {
    return String(value || '').trim().toUpperCase();
}

function numericQty(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function createId(prefix) {
    if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getDeviceId() {
    let deviceId = localStorage.getItem('khaironDeviceId');
    if (!deviceId) {
        deviceId = `EQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        localStorage.setItem('khaironDeviceId', deviceId);
    }
    return deviceId;
}

function backupStorage(keys) {
    return keys.reduce((backups, key) => {
        backups[key] = localStorage.getItem(key);
        return backups;
    }, {});
}

function restoreStorage(backups) {
    Object.entries(backups).forEach(([key, value]) => {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    });
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

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
