// INVENTARIO ERP

const inventory = JSON.parse(
    localStorage.getItem('inventoryData')
) || [];

// CONTEO FÍSICO

const physical = JSON.parse(
    localStorage.getItem('physicalCount')
) || [];

// BODY

const progressBody =
    document.getElementById('progressBody');

// OBTENER UBICACIONES ÚNICAS

const locations = [
    ...new Set(
        inventory.map(
            item => item.ubicacion
        )
    )
];

// RECORRER

locations.forEach(location => {

    // ESPERADOS

    const expected =
        inventory.filter(item =>

            item.ubicacion === location

        ).length;

    // ESCANEADOS

    const scanned =
        physical.filter(item =>

            item.location === location

        ).length;

    // ESTADO

    let estado = '';
    let clase = '';

    // PENDIENTE

    if (scanned === 0) {

        estado = 'PENDIENTE';

        clase = 'secondary';

    }

    // COMPLETA

    else if (scanned >= expected) {

        estado = 'COMPLETA';

        clase = 'success';

    }

    // EN PROCESO

    else {

        estado = 'EN PROCESO';

        clase = 'warning';

    }

    // RENDER

    progressBody.innerHTML += `

        <tr>

            <td>${location}</td>

            <td>${expected}</td>

            <td>${scanned}</td>

            <td>

                <span class="badge bg-${clase}">

                    ${estado}

                </span>

            </td>

        </tr>

    `;

});