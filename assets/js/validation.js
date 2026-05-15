// =====================================
// DATOS GLOBALES
// =====================================

let reservedData = JSON.parse(

    localStorage.getItem(
        'reservedData'
    )

) || [];

let activeRoute = [];

let validationScans = JSON.parse(

    localStorage.getItem(
        'validationScans'
    )

) || [];


// =====================================
// CARGAR ARCHIVO
// =====================================

document
    .getElementById('reservedFile')
    .addEventListener(
        'change',
        handleReservedFile
    );

function handleReservedFile(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = function(e){

        processReservedData(
            e.target.result
        );

    };

    reader.readAsText(file);

}


// =====================================
// PROCESAR TXT
// =====================================

function processReservedData(data) {

    const lines =
        data.split('\n');

    const grouped = {};

    lines.forEach((line) => {

        line = line.trim();

        // IGNORAR

        if (!line) return;

        if (
            line.includes('CLAVE') ||
            line.includes('REFER.')
        ) return;

        // COLUMNAS

        const cols =
            line.split('\t');

        // VALIDAR

        if (cols.length < 8)
            return;

        // DATOS

        const upc =
            String(cols[0]).trim();

        const descripcion =
            String(cols[1]).trim();

        const cantidad =
            parseInt(cols[5]) || 0;

        const ruta =
            String(cols[7]).trim();

        // VALIDAR

        if (!upc || !ruta)
            return;

        // KEY

        const key =
            ruta + '_' + upc;

        // NUEVO

        if (!grouped[key]) {

            grouped[key] = {

                ruta: ruta,

                upc: upc,

                descripcion: descripcion,

                esperado: cantidad,

                escaneado: 0,

                caja: ''

            };

        }

        // SUMAR

        else {

            grouped[key].esperado +=
                cantidad;

        }

    });

    // FINAL

    reservedData =
        Object.values(grouped);

    // GUARDAR

    localStorage.setItem(

        'reservedData',

        JSON.stringify(reservedData)

    );

    alert(
        'Reservado cargado correctamente'
    );

}


// =====================================
// CARGAR RUTA
// =====================================

function loadRoute() {

    const route = document
        .getElementById(
            'routeInput'
        )
        .value
        .trim();

    // VALIDAR

    if (!route) {

        alert(
            'Ingresa una ruta'
        );

        return;

    }

    // FILTRAR

    activeRoute =
        reservedData.filter(item =>

            String(item.ruta) ===
            String(route)

        );

    // VALIDAR

    if (activeRoute.length === 0) {

        alert(
            'Ruta no encontrada'
        );

        return;

    }

    // ACTUALIZAR

    updateDashboard();

    renderValidationTable();

    // GUARDAR

    saveValidationProgress();

    // FOCUS

    setTimeout(() => {

        document
            .getElementById(
                'validationUPC'
            )
            .focus();

    }, 100);

}


// =====================================
// EVENTO SCANNER
// =====================================

document
    .getElementById(
        'validationUPC'
    )
    .addEventListener(

        'keydown',

        function(e){

            if (e.key === 'Enter') {

                e.preventDefault();

                processValidationScan();

            }

        }

    );


// =====================================
// ESCANEAR
// =====================================

function processValidationScan() {

    const boxInput =
        document.getElementById(
            'boxInput'
        );

    const upcInput =
        document.getElementById(
            'validationUPC'
        );

    const box =
        boxInput.value.trim();

    const upc =
        upcInput.value.trim();

    // VALIDAR

    if (!box || !upc) {

        alert(
            'Completa caja y UPC'
        );

        return;

    }

    // BUSCAR

    let item = activeRoute.find(item =>

        String(item.upc) ===
        String(upc)

    );

    // NO EXISTE

    if (!item) {

        alert(
            'UPC NO ENCONTRADO'
        );

        upcInput.value = '';

        upcInput.focus();

        return;

    }

    // SUMAR

    item.escaneado++;

    item.caja = box;

    // HISTORIAL

    validationScans.unshift({

        caja: box,

        upc: upc,

        fecha:
            new Date()

    });

    // GUARDAR

    localStorage.setItem(

        'validationScans',

        JSON.stringify(validationScans)

    );

    // GUARDAR AVANCE

    saveValidationProgress();

    // ACTUALIZAR UI

    updateDashboard();

    renderValidationTable();

    // LIMPIAR

    upcInput.value = '';

    // MANTENER FOCO

    setTimeout(() => {

        upcInput.focus();

    }, 10);

}


// =====================================
// TABLA
// =====================================

function renderValidationTable() {

    const tbody =
        document.getElementById(
            'validationTableBody'
        );

    tbody.innerHTML = '';

    activeRoute.forEach(item => {

        const diferencia =

            item.escaneado -
            item.esperado;

        let estado = '';
        let badge = '';

        // OK

        if (diferencia === 0) {

            estado = 'OK';

            badge = 'success';

        }

        // FALTANTE

        else if (diferencia < 0) {

            estado = 'FALTANTE';

            badge = 'danger';

        }

        // EXCESO

        else {

            estado = 'EXCESO';

            badge = 'warning';

        }

        tbody.innerHTML += `

            <tr>

                <td>${item.caja || '-'}</td>

                <td>${item.upc}</td>

                <td>${item.descripcion}</td>

                <td>${item.esperado}</td>

                <td>${item.escaneado}</td>

                <td>${diferencia}</td>

                <td>

                    <span class="badge bg-${badge}">
                        ${estado}
                    </span>

                </td>

            </tr>

        `;

    });

}


// =====================================
// DASHBOARD
// =====================================

function updateDashboard() {

    if (activeRoute.length === 0)
        return;

    // ESPERADAS

    const expected =

        activeRoute.reduce(

            (sum, item) =>

                sum + item.esperado,

            0

        );

    // ESCANEADAS

    const scanned =

        activeRoute.reduce(

            (sum, item) =>

                sum + item.escaneado,

            0

        );

    // OK

    let ok = 0;

    // FALTANTES

    let missing = 0;

    // EXCESOS

    let excess = 0;

    activeRoute.forEach(item => {

        if (
            item.escaneado ===
            item.esperado
        ) {

            ok += item.esperado;

        }

        // FALTANTE

        if (
            item.escaneado <
            item.esperado
        ) {

            missing +=

                item.esperado -
                item.escaneado;

        }

        // EXCESO

        if (
            item.escaneado >
            item.esperado
        ) {

            excess +=

                item.escaneado -
                item.esperado;

        }

    });

    // ACTUALIZAR HTML

    document.getElementById(
        'routeNumber'
    ).innerText =

        activeRoute[0].ruta;

    document.getElementById(
        'expectedPieces'
    ).innerText = expected;

    document.getElementById(
        'scannedPieces'
    ).innerText = scanned;

    document.getElementById(
        'okPieces'
    ).innerText = ok;

    document.getElementById(
        'missingPieces'
    ).innerText = missing;

    document.getElementById(
        'excessPieces'
    ).innerText = excess;

}


// =====================================
// GUARDAR AVANCE
// =====================================

function saveValidationProgress() {

    if (activeRoute.length === 0)
        return;

    const progress = {

        route:
            activeRoute[0].ruta,

        activeRoute:
            activeRoute,

        validationScans:
            validationScans

    };

    localStorage.setItem(

        'validationProgress',

        JSON.stringify(progress)

    );

}


// =====================================
// RECUPERAR AVANCE
// =====================================

window.addEventListener(

    'load',

    () => {

        const savedProgress = JSON.parse(

            localStorage.getItem(
                'validationProgress'
            )

        );

        if (!savedProgress)
            return;

        activeRoute =
            savedProgress.activeRoute || [];

        validationScans =
            savedProgress.validationScans || [];

        document.getElementById(
            'routeInput'
        ).value =

            savedProgress.route || '';

        updateDashboard();

        renderValidationTable();

    }

);


// =====================================
// EXPORTAR EXCEL
// =====================================

function exportValidationExcel() {

    if (activeRoute.length === 0) {

        alert(
            'No existen datos'
        );

        return;

    }

    const report = activeRoute.map(item => ({

        Caja:
            item.caja,

        UPC:
            item.upc,

        Descripcion:
            item.descripcion,

        Esperado:
            item.esperado,

        Escaneado:
            item.escaneado,

        Diferencia:
            item.escaneado -
            item.esperado

    }));

    const worksheet =
        XLSX.utils.json_to_sheet(
            report
        );

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        'Validacion'

    );

    XLSX.writeFile(

        workbook,

        'SEYL_KALAN_Validacion.xlsx'

    );

}


// =====================================
// EXPORTAR PDF
// =====================================

function exportValidationPDF() {

    // VALIDAR

    if (activeRoute.length === 0) {

        alert(
            'No existen datos para exportar'
        );

        return;

    }

    // JSPDF

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    // =====================================
    // HEADER
    // =====================================

    doc.setFillColor(15, 23, 42);

    doc.rect(
        0,
        0,
        220,
        30,
        'F'
    );

    // TITULO

    doc.setTextColor(255,255,255);

    doc.setFontSize(22);

    doc.text(
        'SEYL KALAN',
        14,
        15
    );

    doc.setFontSize(14);

    doc.text(
        'Dashboard de Validación',
        14,
        24
    );

    // =====================================
    // INFO
    // =====================================

    doc.setTextColor(0,0,0);

    doc.setFontSize(12);

    doc.text(

        `Ruta: ${activeRoute[0].ruta}`,

        14,

        45

    );

    // FECHA

    doc.text(

        `Fecha: ${new Date().toLocaleString()}`,

        14,

        53

    );

    // =====================================
    // KPIS
    // =====================================

    const expected = activeRoute.reduce(

        (sum, item) =>

            sum + item.esperado,

        0

    );

    const scanned = activeRoute.reduce(

        (sum, item) =>

            sum + item.escaneado,

        0

    );

    let missing = 0;

    let excess = 0;

    activeRoute.forEach(item => {

        if (
            item.escaneado <
            item.esperado
        ) {

            missing +=

                item.esperado -
                item.escaneado;

        }

        if (
            item.escaneado >
            item.esperado
        ) {

            excess +=

                item.escaneado -
                item.esperado;

        }

    });

    // TARJETAS

    doc.setFillColor(34,197,94);

    doc.roundedRect(
        14,
        65,
        40,
        22,
        3,
        3,
        'F'
    );

    doc.setTextColor(255,255,255);

    doc.text(
        'Esperadas',
        18,
        74
    );

    doc.text(
        String(expected),
        18,
        83
    );

    // ESCANEADAS

    doc.setFillColor(59,130,246);

    doc.roundedRect(
        60,
        65,
        40,
        22,
        3,
        3,
        'F'
    );

    doc.text(
        'Escaneadas',
        64,
        74
    );

    doc.text(
        String(scanned),
        64,
        83
    );

    // FALTANTES

    doc.setFillColor(239,68,68);

    doc.roundedRect(
        106,
        65,
        40,
        22,
        3,
        3,
        'F'
    );

    doc.text(
        'Faltantes',
        110,
        74
    );

    doc.text(
        String(missing),
        110,
        83
    );

    // EXCESOS

    doc.setFillColor(245,158,11);

    doc.roundedRect(
        152,
        65,
        40,
        22,
        3,
        3,
        'F'
    );

    doc.text(
        'Excesos',
        156,
        74
    );

    doc.text(
        String(excess),
        156,
        83
    );

    // =====================================
    // TABLA
    // =====================================

    let y = 105;

    doc.setTextColor(0,0,0);

    doc.setFontSize(10);

    // HEADER TABLA

    doc.setFillColor(30,41,59);

    doc.rect(
        14,
        y,
        180,
        8,
        'F'
    );

    doc.setTextColor(255,255,255);

    doc.text('UPC', 16, y + 5);

    doc.text('Esperado', 70, y + 5);

    doc.text('Escaneado', 105, y + 5);

    doc.text('Dif.', 145, y + 5);

    doc.text('Estado', 165, y + 5);

    y += 12;

    // FILAS

    activeRoute.forEach(item => {

        const diferencia =

            item.escaneado -
            item.esperado;

        let estado = '';

        if (diferencia === 0) {

            estado = 'OK';

        }

        else if (diferencia < 0) {

            estado = 'FALTANTE';

        }

        else {

            estado = 'EXCESO';

        }

        doc.setTextColor(0,0,0);

        doc.text(
            String(item.upc),
            16,
            y
        );

        doc.text(
            String(item.esperado),
            70,
            y
        );

        doc.text(
            String(item.escaneado),
            110,
            y
        );

        doc.text(
            String(diferencia),
            145,
            y
        );

        doc.text(
            estado,
            165,
            y
        );

        y += 8;

        // NUEVA PAGINA

        if (y > 270) {

            doc.addPage();

            y = 20;

        }

    });

    // =====================================
    // FIRMAS
    // =====================================

    y += 20;

    doc.line(
        20,
        y,
        80,
        y
    );

    doc.line(
        120,
        y,
        180,
        y
    );

    doc.text(
        'Nombre y Firma Validador',
        20,
        y + 8
    );

    doc.text(
        'Nombre y Firma Supervisor',
        120,
        y + 8
    );

    // =====================================
    // DESCARGAR
    // =====================================

    // LIMPIAR NOMBRE RUTA

const routeName = String(
    activeRoute[0].ruta
)
.replace(/[/\\?%*:|"<>]/g, '-');

// GUARDAR PDF

doc.save(

    `SEYL_KALAN_RUTA_${routeName}.pdf`

);

}