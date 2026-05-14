// =========================================
// BUSCAR INVENTARIO
// =========================================

function searchLocation() {

    // INPUT

    const search = document
        .getElementById('locationInput')
        .value
        .trim()
        .toUpperCase();

    // INVENTARIO

    const inventory = JSON.parse(

        localStorage.getItem(
            'inventoryData'
        )

    ) || [];

    // BODY TABLA

    const resultsBody =
        document.getElementById(
            'resultsBody'
        );

    // LIMPIAR TABLA

    resultsBody.innerHTML = '';

    // VALIDAR INVENTARIO

    if (inventory.length === 0) {

        alert(
            'No existe inventario cargado'
        );

        return;

    }

    // FILTRAR

    const filtered = inventory.filter(item =>

        // BUSCAR POR UBICACIÓN

        item.ubicacion
            ?.toUpperCase()
            .includes(search)

        ||

        // BUSCAR POR UPC

        item.upc
            ?.toUpperCase()
            .includes(search)

    );

    // SIN RESULTADOS

    if (filtered.length === 0) {

        resultsBody.innerHTML = `

            <tr>

                <td colspan="6"
                    class="text-center text-warning">

                    Sin resultados para la consulta

                </td>

            </tr>

        `;

        return;

    }

    // MOSTRAR RESULTADOS

    filtered.forEach(item => {

        resultsBody.innerHTML += `

            <tr>

                <td>${item.ubicacion}</td>

                <td>${item.upc}</td>

                <td>${item.descripcion}</td>

                <td>${item.existencias}</td>

                <td>${item.reservado}</td>

                <td>${item.disponible}</td>

            </tr>

        `;

    });

}