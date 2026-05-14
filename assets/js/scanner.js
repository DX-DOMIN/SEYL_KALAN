// INVENTARIO ERP

const inventory = JSON.parse(
    localStorage.getItem('inventoryData')
) || [];

// CONTEO FÍSICO

let physicalCount = JSON.parse(
    localStorage.getItem('physicalCount')
) || [];

// INPUTS

const scannerInput =
    document.getElementById('scannerInput');

// EVENTO ESCANEO

scannerInput.addEventListener(
    'keypress',
    function (e) {

        if (e.key === 'Enter') {

            processScan();

        }

    }
);

// PROCESAR ESCANEO

function processScan() {

    const location = document
        .getElementById('locationInput')
        .value
        .trim()
        .toUpperCase();

    const upc =
        scannerInput.value.trim();

    // NUEVO → CANTIDAD CAPTURADA

    const qty = parseInt(

        document.getElementById(
            'qtyInput'
        ).value

    ) || 1;

    // VALIDACIONES

    if (!location || !upc) {

        alert(
            'Completar ubicación y UPC'
        );

        return;

    }

    // BUSCAR EN UBICACIÓN

    let systemItem = inventory.find(item =>

        item.ubicacion.toUpperCase() ===
        location &&

        item.upc === upc

    );

    // ANOMALÍA

    let anomaly = false;

    // SI NO EXISTE EN ESA UBICACIÓN

    if (!systemItem) {

        anomaly = true;

        // BUSCAR EN OTRA UBICACIÓN

        const anotherLocation =
            inventory.find(item =>
                item.upc === upc
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

    // VALIDAR EXISTENTE

    let existing =
        physicalCount.find(item =>

            item.upc === upc &&

            item.location === location

        );

    // SUMAR EXISTENTE

    if (existing) {

        existing.fisico += qty;

    }

    // NUEVO REGISTRO

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
                ),

            fisico: qty,

            anomaly: anomaly,

            ubicacionCorrecta:
                systemItem.ubicacionCorrecta
                || 'OK'

        });

    }

    // RENDER

    renderTable();

    // MOVIMIENTO

    saveMovement(location, upc);

    // LIMPIAR INPUTS

    scannerInput.value = '';

    document.getElementById(
        'qtyInput'
    ).value = 1;

    scannerInput.focus();

}

// RENDER TABLA

function renderTable() {

    const tbody =
        document.getElementById(
            'scannerTableBody'
        );

    tbody.innerHTML = '';

    physicalCount.forEach(item => {

        const diferencia =
            item.fisico - item.sistema;

        let estado = '';
        let clase = '';
        let recomendacion = '';

        // OK

        if (
            item.fisico === item.sistema
        ) {

            estado = 'OK';

            clase = 'success';

            recomendacion =
                'Inventario correcto';

        }

        // DIFERENCIA NEGATIVA

        else if (
            item.fisico < item.sistema
        ) {

            estado =
                'DIFERENCIA NEGATIVA';

            clase = 'danger';

            recomendacion =
                'Enviar diferencia a LOST';

        }

        // EXCESO FÍSICO

        else {

            estado =
                'EXCESO FÍSICO';

            clase = 'warning';

            recomendacion =
                'Ingresar mercancía';

        }

        // ANOMALÍA

        if (item.anomaly) {

            estado =
                'FUERA DE UBICACIÓN';

            clase = 'info';

            recomendacion =
                `Mover a ${item.ubicacionCorrecta}`;

        }

        // RENDER HTML

        tbody.innerHTML += `

            <tr>

                <td>${item.location}</td>

                <td>${item.upc}</td>

                <td>${item.descripcion}</td>

                <td>${item.sistema}</td>

                <td>${item.fisico}</td>

                <td>${diferencia}</td>

                <td>

                    <span class="badge bg-${clase}">

                        ${estado}

                    </span>

                </td>

            </tr>

        `;

    });

    // GUARDAR CONTEO

    localStorage.setItem(

        'physicalCount',

        JSON.stringify(physicalCount)

    );

}

// =====================================
// GUARDAR MOVIMIENTO
// =====================================

function saveMovement(location, upc) {

    const movements = JSON.parse(

        localStorage.getItem(
            'movements'
        )

    ) || [];

    // FECHA ACTUAL

    const now = new Date();

    const formattedDate =

        now.toLocaleDateString() +

        ' ' +

        now.toLocaleTimeString();

    // INSERTAR AL INICIO

    movements.unshift({

        location: location,

        upc: upc,

        date: formattedDate

    });

    // LIMITE MOVIMIENTOS

    if (movements.length > 100) {

        movements.pop();

    }

    // GUARDAR

    localStorage.setItem(

        'movements',

        JSON.stringify(movements)

    );

}

// RENDER INICIAL

renderTable();