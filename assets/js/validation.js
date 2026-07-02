// =====================================
// VALIDACION POR CASE — KHAIRON
// Formato productos_reservados:
// 0 CLAVE / UPC
// 1 DESCRIPCION
// 5 CANTIDAD
// 7 REFER. = RUTA
// 10 COMENTARIOS = CLIENTE / DESTINO
// =====================================

const VALIDATION_STORAGE_KEY = 'validationCaseRecords';
const RESERVED_STORAGE_KEY = 'reservedData';
const PROGRESS_STORAGE_KEY = 'validationProgress';

let reservedData = readStoredArray(RESERVED_STORAGE_KEY);
let validationRecords = readStoredArray(VALIDATION_STORAGE_KEY);
let activeRouteName = '';

// =====================================
// HELPERS
// =====================================

function normalizeValue(value) {
    return String(value || '').trim().toUpperCase();
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

function readStoredObject(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : null;
    }
    catch {
        return null;
    }
}

function normalizeNumber(value) {
    const clean = String(value || '')
        .replace(',', '.')
        .replace(/[^\d.]/g, '');

    return Number(clean) || 0;
}

function getRecordKey(routeName, caseId, upc) {
    return [
        normalizeValue(routeName),
        normalizeValue(caseId),
        normalizeValue(upc)
    ].join('|');
}

function getExpectedKey(routeName, upc) {
    return [
        normalizeValue(routeName),
        normalizeValue(upc)
    ].join('|');
}

function getCaseInput() {
    return document.getElementById('caseInput') ||
        document.getElementById('boxInput');
}

function getCurrentRouteName() {
    return activeRouteName || normalizeValue(
        document.getElementById('routeInput')?.value
    );
}

function getCurrentCaseId() {
    const caseInput = getCaseInput();

    return normalizeValue(
        caseInput ? caseInput.value : ''
    );
}

function escapeHTML(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function setTextIfExists(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.innerText = value;
    }
}

function getStatusFromValues(expected, scanned) {
    expected = Number(expected || 0);
    scanned = Number(scanned || 0);

    if (scanned < expected) return 'FALTANTE';
    if (scanned > expected) return 'EXCEDENTE';

    return 'OK';
}

function getBadgeClass(status) {
    if (status === 'OK') return 'success';
    if (status === 'EXCEDENTE') return 'warning';

    return 'danger';
}

function saveValidationState() {
    localStorage.setItem(
        VALIDATION_STORAGE_KEY,
        JSON.stringify(validationRecords)
    );

    localStorage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
            route: activeRouteName,
            validationRecords
        })
    );
}

function getRouteCustomer(routeName) {
    const item = reservedData.find(row =>
        normalizeValue(row.ruta) === normalizeValue(routeName)
    );

    return item && item.comentarios
        ? item.comentarios
        : 'SIN CLIENTE';
}

// =====================================
// CARGAR ARCHIVO RESERVADO
// =====================================

function splitReservedLine(line) {
    if (line.includes('\t')) return line.split('\t');
    if (line.includes(';')) return line.split(';');
    if (line.includes(',')) return line.split(',');

    return line.split(/\s{2,}/);
}

function parseReservedRow(cols) {
    const upc = normalizeValue(cols[0]);
    const descripcion = String(cols[1] || '').trim();
    const cantidad = normalizeNumber(cols[5]);
    const ruta = normalizeValue(cols[7]);
    const comentarios = String(cols[10] || '').trim();

    if (!upc || !cantidad || !ruta) {
        return null;
    }

    return {
        ruta,
        upc,
        descripcion: descripcion || 'SIN DESCRIPCION',
        esperado: cantidad,
        comentarios: comentarios || 'SIN CLIENTE'
    };
}

function initReservedFileListener() {
    const reservedFile = document.getElementById('reservedFile');

    if (!reservedFile) return;

    reservedFile.addEventListener('change', handleReservedFile);
}

function handleReservedFile(event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        processReservedData(e.target.result);
    };

    reader.readAsText(file);
}

function processReservedData(data) {
    const lines = data
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        alert('El archivo reservado está vacío');
        return;
    }

    const grouped = {};

    lines.forEach(line => {
        const upperLine = line.toUpperCase();

        if (
            upperLine.includes('CLAVE') ||
            upperLine.includes('REFER.') ||
            upperLine.includes('REFERENCIA') ||
            upperLine.includes('DESCRIP')
        ) {
            return;
        }

        const cols = splitReservedLine(line);

        if (cols.length < 8) return;

        const parsed = parseReservedRow(cols);

        if (!parsed) return;

        const key = getExpectedKey(
            parsed.ruta,
            parsed.upc
        );

        if (!grouped[key]) {
            grouped[key] = {
                ruta: parsed.ruta,
                upc: parsed.upc,
                descripcion: parsed.descripcion,
                esperado: Number(parsed.esperado || 0),
                comentarios: parsed.comentarios || 'SIN CLIENTE'
            };
        } else {
            grouped[key].esperado += Number(parsed.esperado || 0);

            if (
                (!grouped[key].comentarios ||
                    grouped[key].comentarios === 'SIN CLIENTE') &&
                parsed.comentarios
            ) {
                grouped[key].comentarios = parsed.comentarios;
            }
        }
    });

    reservedData = Object.values(grouped);

    localStorage.setItem(
        RESERVED_STORAGE_KEY,
        JSON.stringify(reservedData)
    );

    alert(
        `Reservado cargado correctamente: ${reservedData.length} UPC/ruta`
    );

    updateDashboard();
    renderValidationTable();
}

// =====================================
// RUTA
// =====================================

function getExpectedItemsByRoute(routeName) {
    return reservedData.filter(item =>
        normalizeValue(item.ruta) === normalizeValue(routeName)
    );
}

function loadRoute() {
    const routeInput = document.getElementById('routeInput');

    const routeName = normalizeValue(
        routeInput ? routeInput.value : ''
    );

    if (!routeName) {
        alert('Ingresa una ruta');
        return;
    }

    const routeItems = getExpectedItemsByRoute(routeName);

    if (routeItems.length === 0 && reservedData.length > 0) {
        alert(
            `La ruta ${routeName} no existe en el reservado cargado`
        );

        return;
    }

    activeRouteName = routeName;

    setTextIfExists('routeNumber', activeRouteName);

    saveValidationState();
    updateDashboard();
    renderValidationTable();

    const caseInput = getCaseInput();

    setTimeout(() => {
        if (caseInput) caseInput.focus();
    }, 100);
}

window.loadRoute = loadRoute;

// =====================================
// ESCANEO
// =====================================

function initValidationScanListener() {
    const validationUPC = document.getElementById('validationUPC');

    if (!validationUPC) return;

    validationUPC.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            processValidationScan();
        }
    });
}

function getExpectedItemByRouteAndUPC(routeName, upc) {
    return reservedData.find(item =>
        normalizeValue(item.ruta) === normalizeValue(routeName) &&
        normalizeValue(item.upc) === normalizeValue(upc)
    );
}

function getScansByRoute(routeName) {
    return validationRecords.filter(record =>
        normalizeValue(record.routeName) === normalizeValue(routeName)
    );
}

function getTotalScannedByUPC(routeName, upc) {
    return getScansByRoute(routeName)
        .filter(record =>
            normalizeValue(record.upc) === normalizeValue(upc)
        )
        .reduce(
            (total, record) =>
                total + Number(record.cantidad || 0),
            0
        );
}

function processValidationScan() {
    const routeName = getCurrentRouteName();
    const caseId = getCurrentCaseId();

    const upcInput =
        document.getElementById('validationUPC');

    const upc =
        normalizeValue(upcInput ? upcInput.value : '');

    if (!routeName) {
        alert('Primero carga una ruta');
        return;
    }

    if (!caseId || !upc) {
        alert('Completa case/caja y UPC');
        return;
    }

    const expectedItem =
        getExpectedItemByRouteAndUPC(routeName, upc);

    if (!expectedItem && reservedData.length > 0) {
        alert(
            `UPC ${upc} no encontrado en la ruta ${routeName}`
        );

        if (upcInput) {
            upcInput.value = '';
            upcInput.focus();
        }

        return;
    }

    const key =
        getRecordKey(routeName, caseId, upc);

    let record =
        validationRecords.find(item => item.key === key);

    if (record) {
        record.cantidad += 1;
        record.fecha = new Date().toLocaleString();

        if (expectedItem) {
            record.descripcion = expectedItem.descripcion;
            record.esperado = Number(expectedItem.esperado || 0);
        }
    } else {
        validationRecords.unshift({
            key,
            routeName,
            caseId,
            upc,
            descripcion: expectedItem
                ? expectedItem.descripcion
                : 'UPC SIN RESERVADO',
            esperado: expectedItem
                ? Number(expectedItem.esperado || 0)
                : 0,
            cantidad: 1,
            fecha: new Date().toLocaleString()
        });
    }

    saveValidationState();
    updateDashboard();
    renderValidationTable();

    if (upcInput) {
        upcInput.value = '';

        setTimeout(() => {
            upcInput.focus();
        }, 10);
    }
}

window.processValidationScan = processValidationScan;

// =====================================
// TABLA Y DASHBOARD
// =====================================

function buildActiveRouteRows() {
    const routeName = getCurrentRouteName();

    if (!routeName) return [];

    const expectedRows =
        getExpectedItemsByRoute(routeName);

    const scanRows =
        getScansByRoute(routeName);

    const expectedMap = {};
    const rows = [];

    expectedRows.forEach(item => {
        const upc =
            normalizeValue(item.upc);

        expectedMap[upc] = {
            routeName,
            caseId: '-',
            upc,
            descripcion:
                item.descripcion || 'SIN DESCRIPCION',
            esperado:
                Number(item.esperado || 0),
            cantidad:
                0,
            fecha:
                '',
            comentarios:
                item.comentarios || 'SIN CLIENTE'
        };
    });

    scanRows.forEach(record => {
        const upc =
            normalizeValue(record.upc);

        const expected =
            expectedMap[upc];

        rows.push({
            routeName:
                record.routeName,
            caseId:
                record.caseId,
            upc:
                record.upc,
            descripcion:
                record.descripcion ||
                expected?.descripcion ||
                'SIN DESCRIPCION',
            esperado:
                expected
                    ? expected.esperado
                    : Number(record.esperado || 0),
            cantidad:
                Number(record.cantidad || 0),
            totalScannedUPC:
                getTotalScannedByUPC(routeName, upc),
            fecha:
                record.fecha || '',
            comentarios:
                expected?.comentarios || 'SIN CLIENTE'
        });
    });

    Object.values(expectedMap).forEach(expectedRow => {
        const totalScannedUPC =
            getTotalScannedByUPC(
                routeName,
                expectedRow.upc
            );

        if (totalScannedUPC === 0) {
            rows.push({
                ...expectedRow,
                totalScannedUPC:
                    0
            });
        }
    });

    return rows.sort((a, b) => {
        if (a.caseId !== b.caseId) {
            return String(a.caseId)
                .localeCompare(String(b.caseId));
        }

        return String(a.upc)
            .localeCompare(String(b.upc));
    });
}

function getActiveRouteSummary() {
    const routeName =
        getCurrentRouteName();

    const expectedRows =
        getExpectedItemsByRoute(routeName);

    const scanRows =
        getScansByRoute(routeName);

    const expectedByUPC = {};
    const scannedByUPC = {};

    expectedRows.forEach(item => {
        const upc =
            normalizeValue(item.upc);

        expectedByUPC[upc] =
            (expectedByUPC[upc] || 0) +
            Number(item.esperado || 0);
    });

    scanRows.forEach(record => {
        const upc =
            normalizeValue(record.upc);

        scannedByUPC[upc] =
            (scannedByUPC[upc] || 0) +
            Number(record.cantidad || 0);
    });

    const upcs = new Set([
        ...Object.keys(expectedByUPC),
        ...Object.keys(scannedByUPC)
    ]);

    let expected = 0;
    let scanned = 0;
    let ok = 0;
    let missing = 0;
    let excess = 0;

    upcs.forEach(upc => {
        const exp =
            Number(expectedByUPC[upc] || 0);

        const scn =
            Number(scannedByUPC[upc] || 0);

        expected += exp;
        scanned += scn;

        if (scn === exp) {
            ok += scn;
        }

        if (scn < exp) {
            missing += exp - scn;
        }

        if (scn > exp) {
            ok += exp;
            excess += scn - exp;
        }
    });

    const cases = new Set();

    scanRows.forEach(record => {
        if (record.caseId) {
            cases.add(record.caseId);
        }
    });

    return {
        cases:
            cases.size,
        expected,
        scanned,
        validated:
            scanRows.length,
        ok,
        missing,
        excess
    };
}

function updateDashboard() {
    const routeName =
        getCurrentRouteName() || '-';

    const summary =
        getActiveRouteSummary();

    setTextIfExists(
        'routeNumber',
        routeName
    );

    setTextIfExists(
        'expectedPieces',
        summary.expected
    );

    setTextIfExists(
        'scannedPieces',
        summary.scanned
    );

    setTextIfExists(
        'okPieces',
        summary.ok
    );

    setTextIfExists(
        'missingPieces',
        summary.missing
    );

    setTextIfExists(
        'excessPieces',
        summary.excess
    );

    setTextIfExists(
        'caseCount',
        summary.cases
    );

    setTextIfExists(
        'validatedTotal',
        summary.validated
    );
}

function renderValidationTable() {
    const tbody =
        document.getElementById('validationTableBody');

    if (!tbody) return;

    const rows =
        buildActiveRouteRows();

    tbody.innerHTML = '';

    if (!activeRouteName) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-secondary">
                    Carga una ruta para iniciar la validación
                </td>
            </tr>
        `;

        return;
    }

    if (rows.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-secondary">
                    Sin datos para esta ruta
                </td>
            </tr>
        `;

        return;
    }

    rows.forEach(row => {
        const expected =
            Number(row.esperado || 0);

        const scannedTotal =
            Number(row.totalScannedUPC || 0);

        const difference =
            scannedTotal - expected;

        const status =
            getStatusFromValues(
                expected,
                scannedTotal
            );

        const badge =
            getBadgeClass(status);

        tbody.innerHTML += `
            <tr>
                <td>${escapeHTML(row.caseId)}</td>
                <td>${escapeHTML(row.upc)}</td>
                <td>${escapeHTML(row.descripcion)}</td>
                <td>${escapeHTML(expected)}</td>
                <td>${escapeHTML(row.cantidad)}</td>
                <td>${escapeHTML(difference)}</td>
                <td>
                    <span class="badge bg-${badge}">
                        ${status}
                    </span>
                </td>
                <td>${escapeHTML(row.fecha || '-')}</td>
            </tr>
        `;
    });
}

// =====================================
// EXPORTAR EXCEL
// =====================================

function exportValidationExcel() {
    const rows =
        buildActiveRouteRows();

    if (rows.length === 0) {
        alert('No existen datos');
        return;
    }

    const report =
        rows.map(row => {
            const expected =
                Number(row.esperado || 0);

            const scannedTotal =
                Number(row.totalScannedUPC || 0);

            return {
                Ruta:
                    getCurrentRouteName(),
                Cliente:
                    getRouteCustomer(getCurrentRouteName()),
                Case:
                    row.caseId,
                UPC:
                    row.upc,
                Descripcion:
                    row.descripcion,
                Esperado:
                    expected,
                Escaneado:
                    row.cantidad,
                Diferencia:
                    scannedTotal - expected,
                Estado:
                    getStatusFromValues(
                        expected,
                        scannedTotal
                    ),
                Fecha:
                    row.fecha || ''
            };
        });

    const worksheet =
        XLSX.utils.json_to_sheet(report);

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Validacion_por_Case'
    );

    XLSX.writeFile(
        workbook,
        'KHAIRON_Validacion_por_Case.xlsx'
    );
}

window.exportValidationExcel = exportValidationExcel;

// =====================================
// EXPORTAR PDF
// =====================================

async function loadLogoForPDF() {
    return new Promise(resolve => {
        const image =
            new Image();

        image.onload =
            () => resolve(image);

        image.onerror =
            () => resolve(null);

        image.src =
            '../assets/img/logo-global-logistics.png';
    });
}

async function exportValidationPDF() {
    const rows =
        buildActiveRouteRows();

    if (rows.length === 0) {
        alert('No existen datos para exportar');
        return;
    }

    const commercialRows =
        rows.filter(row => {
            const expected =
                Number(row.esperado || 0);

            const scannedTotal =
                Number(row.totalScannedUPC || 0);

            return getStatusFromValues(
                expected,
                scannedTotal
            ) !== 'EXCEDENTE';
        });

    if (!window.jspdf?.jsPDF) {
        alert('No fue posible cargar el generador PDF. Verifica la conexion y recarga.');
        return;
    }

    const { jsPDF } = window.jspdf;

    const doc =
        new jsPDF();

    const logo =
        await loadLogoForPDF();

    const routeName =
        getCurrentRouteName();

    const customerName =
        getRouteCustomer(routeName);

    doc.setFillColor(8, 13, 28);
    doc.rect(0, 0, 220, 42, 'F');

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 40, 220, 2, 'F');

    if (logo) {
        doc.addImage(
            logo,
            'PNG',
            12,
            6,
            32,
            28
        );
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(19);
    doc.text(
        'KHAIRON — Validación por Case',
        50,
        15
    );

    doc.setFontSize(11);
    doc.text(
        'Operador WMS: Global Logistics',
        50,
        25
    );

    doc.setFontSize(9);
    doc.text(
        `Cliente: ${customerName}`,
        50,
        34
    );

    doc.text(
        'Powered by Khairon',
        162,
        18
    );

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFillColor(245, 247, 250);

    doc.roundedRect(
        14,
        50,
        182,
        28,
        3,
        3,
        'F'
    );

    doc.text(
        `Ruta: ${routeName}`,
        20,
        60
    );

    doc.text(
        `Cliente / destino: ${customerName}`,
        20,
        68
    );

    doc.text(
        `Fecha de generación: ${new Date().toLocaleString()}`,
        20,
        76
    );

    let y = 90;

    const grouped =
        commercialRows.reduce((acc, row) => {
            const caseId =
                row.caseId || 'SIN-CASE';

            if (!acc[caseId]) {
                acc[caseId] = [];
            }

            acc[caseId].push(row);

            return acc;
        }, {});

    Object.keys(grouped)
        .sort()
        .forEach(caseId => {
            if (y > 250) {
                doc.addPage();
                y = 18;
            }

            doc.setFillColor(16, 185, 129);

            doc.roundedRect(
                14,
                y,
                182,
                10,
                2,
                2,
                'F'
            );

            doc.setTextColor(2, 18, 13);
            doc.setFontSize(11);
            doc.text(
                caseId,
                17,
                y + 6.5
            );

            y += 14;

            doc.setFillColor(30, 41, 59);
            doc.rect(14, y, 182, 9, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);

            doc.text('UPC', 16, y + 6);
            doc.text('Descripción', 55, y + 6);
            doc.text('Cantidad', 128, y + 6);
            doc.text('Estado', 166, y + 6);

            y += 12;

            grouped[caseId].forEach(row => {
                if (y > 270) {
                    doc.addPage();
                    y = 18;
                }

                const expected =
                    Number(row.esperado || 0);

                const scannedTotal =
                    Number(row.totalScannedUPC || 0);

                const status =
                    getStatusFromValues(
                        expected,
                        scannedTotal
                    );

                doc.setTextColor(15, 23, 42);

                doc.text(
                    String(row.upc),
                    16,
                    y
                );

                doc.text(
                    String(row.descripcion)
                        .slice(0, 34),
                    55,
                    y
                );

                doc.text(
                    String(row.cantidad),
                    132,
                    y
                );

                doc.text(
                    status,
                    166,
                    y
                );

                doc.setDrawColor(226, 232, 240);

                doc.line(
                    14,
                    y + 3,
                    196,
                    y + 3
                );

                y += 8;
            });

            y += 6;
        });

    if (y > 230) {
        doc.addPage();
        y = 20;
    }

    doc.setFillColor(15, 23, 42);

    doc.roundedRect(
        14,
        y,
        182,
        10,
        2,
        2,
        'F'
    );

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text(
        'Resumen final',
        17,
        y + 6.5
    );

    y += 18;

    const summary =
        commercialRows.reduce(
            (acc, row) => {
                const expected =
                    Number(row.esperado || 0);

                const scannedTotal =
                    Number(row.totalScannedUPC || 0);

                const status =
                    getStatusFromValues(
                        expected,
                        scannedTotal
                    );

                acc.cases.add(row.caseId);
                acc.uniqueUPCs.add(row.upc);
                acc.scanned += Number(row.cantidad || 0);

                if (status === 'FALTANTE') {
                    acc.missing++;
                }

                if (status === 'OK') {
                    acc.ok++;
                }

                return acc;
            },
            {
                cases: new Set(),
                uniqueUPCs: new Set(),
                scanned: 0,
                ok: 0,
                missing: 0
            }
        );

    doc.setTextColor(0, 0, 0);
    doc.setFillColor(245, 247, 250);

    doc.roundedRect(
        14,
        y - 8,
        182,
        30,
        3,
        3,
        'F'
    );

    doc.text(
        `Total de cases: ${summary.cases.size}`,
        16,
        y
    );

    doc.text(
        `Total de UPC únicos: ${summary.uniqueUPCs.size}`,
        16,
        y + 8
    );

    doc.text(
        `Total piezas escaneadas: ${summary.scanned}`,
        16,
        y + 16
    );

    doc.text(
        `Total OK: ${summary.ok}`,
        110,
        y
    );

    doc.text(
        `Total faltantes: ${summary.missing}`,
        110,
        y + 8
    );

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);

    doc.text(
        `Powered by Khairon · Operador WMS: Global Logistics · Cliente: ${customerName}`,
        14,
        286
    );

    const cleanRoute =
        String(routeName)
            .replace(/[/\\?%*:|"<>]/g, '-');

    const cleanCustomer =
        String(customerName)
            .replace(/[/\\?%*:|"<>]/g, '-')
            .slice(0, 40);

    doc.save(
        `KHAIRON_Validacion_${cleanCustomer}_${cleanRoute}.pdf`
    );
}

window.exportValidationPDF = exportValidationPDF;

// =====================================
// INICIALIZAR
// =====================================

window.addEventListener('load', () => {
    const savedProgress = readStoredObject(PROGRESS_STORAGE_KEY);

    if (savedProgress && savedProgress.route) {
        activeRouteName =
            savedProgress.route;

        const routeInput =
            document.getElementById('routeInput');

        if (routeInput) {
            routeInput.value =
                activeRouteName;
        }
    }

    initReservedFileListener();
    initValidationScanListener();

    updateDashboard();
    renderValidationTable();
});
