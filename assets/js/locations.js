// =====================================
// ESPERAR DB
// =====================================

window.onload = async function () {

    await initDB();

};

// =====================================
// BUSCAR
// =====================================

async function searchLocation() {

    // INPUT

    const search = document
        .getElementById(
            'locationInput'
        )
        .value
        .trim()
        .toUpperCase();

    // TABLA

    const resultsBody =
        document.getElementById(
            'resultsBody'
        );

    resultsBody.innerHTML = '';

    // VALIDAR

    if (!search) {

        resultsBody.innerHTML = `

            <tr>

                <td colspan="6"
                    class="text-center text-warning">

                    Ingresa ubicación o UPC

                </td>

            </tr>

        `;

        return;

    }

    // INVENTARIO

    const inventory =
        await getInventory();

    console.log(
        'Registros:',
        inventory.length
    );

    // FILTRAR

    const filtered =
        inventory.filter(item =>

            item.ubicacion
                .includes(search)

            ||

            item.upc
                .includes(search)

        );

    // SIN RESULTADOS

    if (filtered.length === 0) {

        resultsBody.innerHTML = `

            <tr>

                <td colspan="6"
                    class="text-center text-danger">

                    Sin resultados

                </td>

            </tr>

        `;

        return;

    }

    // MOSTRAR

    filtered
        .slice(0, 500)
        .forEach(item => {

            resultsBody.innerHTML += `

                <tr>

                    <td>${escapeHTML(item.ubicacion)}</td>

                    <td>${escapeHTML(item.upc)}</td>

                    <td>${escapeHTML(item.descripcion)}</td>

                    <td>${item.existencias}</td>

                    <td>${item.reservado}</td>

                    <td>${item.disponible}</td>

                </tr>

            `;

        });

}

// =====================================
// ENTER
// =====================================

document
    .getElementById(
        'locationInput'
    )
    .addEventListener(
        'keypress',
        function (e) {

            if (e.key === 'Enter') {

                searchLocation();

            }

        }
    );

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
