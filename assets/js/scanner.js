// =====================================
// INVENTARIO ERP
// =====================================

// =====================================
// INVENTARIO GLOBAL
// =====================================

let inventory = [];

// =====================================
// CARGAR INVENTARIO DB
// =====================================

window.onload = async function () {

    try {

    // INICIAR DB

    await initDB();

    // OBTENER INVENTARIO

    inventory = await getInventory();

    console.log(
        'Inventario cargado:',
        inventory.length
    );

    }
    catch (error) {
        console.error('No fue posible cargar el inventario:', error);
        alert('No fue posible abrir el inventario. Recarga la pagina.');
    }

};

// =====================================
// CONTEO FÍSICO
// =====================================

let physicalCount = readStoredArray('physicalCount');


// =====================================
// INPUT SCANNER
// =====================================

const scannerInput =
    document.getElementById(
        'scannerInput'
    );


// =====================================
// EVENTO ESCANEO
// =====================================

scannerInput.addEventListener(

    'keydown',

    function (e) {

        if (e.key === 'Enter') {

            e.preventDefault();

            processScan();

        }

    }

);


// =====================================
// PROCESAR ESCANEO
// =====================================

function processScan() {

    // UBICACIÓN

    const location = document

        .getElementById(
            'locationInput'
        )

        .value

        .trim()

        .toUpperCase();

    // UPC

    const upc =

        scannerInput.value
        .trim()
        .toUpperCase();

    // CANTIDAD

    const qty = Number(
        document.getElementById('qtyInput').value
    );

    // =====================================
    // VALIDAR
    // =====================================

    if (!location || !upc) {

        alert(
            'Completar ubicación y UPC'
        );

        return;

    }

    if (!inventory.length) {

        alert('Primero carga el inventario ERP/WMS');

        return;

    }

    if (!Number.isInteger(qty) || qty <= 0) {

        alert('La cantidad debe ser un numero entero mayor que cero');

        return;

    }

    // =====================================
    // BUSCAR EN INVENTARIO
    // =====================================

    const locationMatches = inventory.filter(item =>
        String(item.ubicacion).toUpperCase() === location &&
        String(item.upc) === String(upc)
    );

    let systemItem = locationMatches.length
        ? {
            upc: String(upc),
            descripcion: locationMatches.find(item => item.descripcion)?.descripcion || 'SIN DESCRIPCION',
            existencias: locationMatches.reduce(
                (total, item) => total + (Number(item.existencias) || 0),
                0
            ),
            ubicacionCorrecta: location
        }
        : null;

    // =====================================
    // ANOMALÍA
    // =====================================

    let anomaly = false;

    // =====================================
    // NO EXISTE EN UBICACIÓN
    // =====================================

    if (!systemItem) {

        anomaly = true;

        // BUSCAR EN OTRA UBICACIÓN

        const anotherLocation =
            inventory.find(item =>

                String(item.upc) ===
                String(upc)

            );

        // EXISTE EN OTRA UBICACIÓN

        if (anotherLocation) {

            systemItem = {

                upc:
                    anotherLocation.upc,

                descripcion:
                    anotherLocation.descripcion,

                existencias: 0,

                ubicacionCorrecta:
                    anotherLocation.ubicacion

            };

        }

        // UPC NO EXISTE

        else {

            systemItem = {

                upc: upc,

                descripcion:
                    'UPC NO REGISTRADO',

                existencias: 0,

                ubicacionCorrecta:
                    'NO EXISTE'

            };

        }

    }

    // =====================================
    // VALIDAR EXISTENTE
    // =====================================

    let existing =
        physicalCount.find(item =>

            String(item.upc) ===
            String(upc)

            &&

            String(item.location) ===
            String(location)

        );

    // =====================================
    // SUMAR EXISTENTE
    // =====================================

    if (existing) {

        existing.sistema =
            parseInt(systemItem.existencias, 10) || 0;

        existing.descripcion =
            systemItem.descripcion;

        existing.anomaly =
            anomaly;

        existing.ubicacionCorrecta =
            systemItem.ubicacionCorrecta || 'OK';

        existing.fisico =

            parseInt(existing.fisico || 0)

            +

            qty;

        existing.fecha =

            new Date()
            .toLocaleString();

    }

    // =====================================
    // NUEVO REGISTRO
    // =====================================

    else {

        physicalCount.unshift({

            location: location,

            upc:
                systemItem.upc,

            descripcion:
                systemItem.descripcion,

            sistema:
                parseInt(
                    systemItem.existencias
                ) || 0,

            fisico:
                qty,

            fecha:
                new Date()
                .toLocaleString(),

            anomaly:
                anomaly,

            ubicacionCorrecta:

                systemItem
                .ubicacionCorrecta

                ||

                'OK'

        });

    }

    // =====================================
    // RENDER
    // =====================================

    renderTable();

    // =====================================
    // GUARDAR MOVIMIENTO
    // =====================================

    saveMovement(
        location,
        upc,
        qty
    );

    // =====================================
    // LIMPIAR INPUTS
    // =====================================

    scannerInput.value = '';

    document.getElementById(
        'qtyInput'
    ).value = 1;

    // FOCUS

    setTimeout(() => {

        scannerInput.focus();

    }, 10);

}


// =====================================
// RENDER TABLA
// =====================================

function renderTable() {

    const tbody =
        document.getElementById(
            'scannerTableBody'
        );

    tbody.innerHTML = '';

    // =====================================
    // RECORRER
    // =====================================

    physicalCount.forEach(item => {

        // NORMALIZAR

        const sistema =

            parseInt(item.sistema)
            || 0;

        const fisico =

            parseInt(item.fisico)
            || 0;

        const diferencia =

            fisico - sistema;

        // ESTADO

        let estado = '';

        let clase = '';

        let recomendacion = '';

        // =====================================
        // OK
        // =====================================

        if (fisico === sistema) {

            estado = 'OK';

            clase = 'success';

            recomendacion =
                'Inventario correcto';

        }

        // =====================================
        // FALTANTE
        // =====================================

        else if (fisico < sistema) {

            estado = 'FALTANTE';

            clase = 'danger';

            recomendacion =
                'Enviar diferencia a LOST';

        }

        // =====================================
        // SOBRANTE
        // =====================================

        else {

            estado = 'SOBRANTE';

            clase = 'warning';

            recomendacion =
                'Ingresar mercancía';

        }

        // =====================================
        // ANOMALÍA
        // =====================================

        if (item.anomaly) {

            estado =
                'FUERA DE UBICACIÓN';

            clase = 'info';

            recomendacion =

                `Mover a ${item.ubicacionCorrecta}`;

        }

        // =====================================
        // RENDER HTML
        // =====================================

        tbody.innerHTML += `

            <tr>

                <td>${escapeHTML(item.location)}</td>

                <td>${escapeHTML(item.upc)}</td>

                <td>${escapeHTML(item.descripcion)}</td>

                <td>${sistema}</td>

                <td>${fisico}</td>

                <td>${diferencia}</td>

                <td>

                    <span class="badge bg-${clase}">

                        ${escapeHTML(estado)}

                    </span>

                </td>

            </tr>

        `;

    });

    // =====================================
    // GUARDAR
    // =====================================

    localStorage.setItem(

        'physicalCount',

        JSON.stringify(
            physicalCount
        )

    );

}


// =====================================
// GUARDAR MOVIMIENTO
// =====================================

function saveMovement(
    location,
    upc,
    scannedQty
) {

    const movements = readStoredArray('movements');

    // FECHA

    const now = new Date();

    const countResult = physicalCount.find(item =>
        String(item.upc) === String(upc) &&
        String(item.location) === String(location)
    );

    const currentUser = readStoredObject('currentUser') || {};

    const formattedDate =

        now.toLocaleDateString()

        +

        ' '

        +

        now.toLocaleTimeString();

    // INSERTAR

    movements.unshift({

        location: location,

        upc: upc,

        date: formattedDate,

        timestamp: now.toISOString(),

        qty: scannedQty

    });

    // LIMITE

    if (movements.length > 100) {

        movements.pop();

    }

    // GUARDAR

    localStorage.setItem(

        'movements',

        JSON.stringify(
            movements
        )

    );

    // Historial detallado: fuente unica para los KPI del dashboard.
    const scanHistory = readStoredArray('scanHistory');

    const systemQty = parseInt(countResult?.sistema, 10) || 0;
    const physicalQty = parseInt(countResult?.fisico, 10) || 0;
    const isLocationAccurate = !countResult?.anomaly;

    scanHistory.unshift({
        id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: now.toISOString(),
        location,
        upc: String(upc),
        description: countResult?.descripcion || 'UPC NO REGISTRADO',
        scannedQty: parseInt(scannedQty, 10) || 1,
        systemQty,
        physicalQty,
        difference: physicalQty - systemQty,
        isInventoryAccurate: physicalQty === systemQty,
        isLocationAccurate,
        expectedLocation: isLocationAccurate
            ? location
            : countResult?.ubicacionCorrecta || 'NO EXISTE',
        user: currentUser.name || currentUser.username || 'Sin usuario'
    });

    localStorage.setItem(
        'scanHistory',
        JSON.stringify(scanHistory)
    );

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

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// =====================================
// RENDER INICIAL
// =====================================

renderTable();
