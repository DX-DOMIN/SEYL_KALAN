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

    // INICIAR DB

    await initDB();

    // OBTENER INVENTARIO

    inventory = await getInventory();

    console.log(
        'Inventario cargado:',
        inventory.length
    );

};

// =====================================
// CONTEO FÍSICO
// =====================================

let physicalCount = JSON.parse(

    localStorage.getItem(
        'physicalCount'
    )

) || [];


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
        .trim();

    // CANTIDAD

    const qty = parseInt(

        document.getElementById(
            'qtyInput'
        ).value

    ) || 1;

    // =====================================
    // VALIDAR
    // =====================================

    if (!location || !upc) {

        alert(
            'Completar ubicación y UPC'
        );

        return;

    }

    // =====================================
    // BUSCAR EN INVENTARIO
    // =====================================

    let systemItem = inventory.find(item =>

        String(item.ubicacion)
            .toUpperCase() ===
        location &&

        String(item.upc) ===
        String(upc)

    );

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
        upc
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

                <td>${item.location}</td>

                <td>${item.upc}</td>

                <td>${item.descripcion}</td>

                <td>${sistema}</td>

                <td>${fisico}</td>

                <td>${diferencia}</td>

                <td>

                    <span class="badge bg-${clase}">

                        ${estado}

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
    upc
) {

    const movements = JSON.parse(

        localStorage.getItem(
            'movements'
        )

    ) || [];

    // FECHA

    const now = new Date();

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

        date: formattedDate

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

}


// =====================================
// RENDER INICIAL
// =====================================

renderTable();