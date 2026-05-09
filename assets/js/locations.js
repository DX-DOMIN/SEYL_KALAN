// BUSCAR UBICACIÓN

function searchLocation() {

    const location = document
        .getElementById('locationInput')
        .value
        .trim()
        .toUpperCase();

    const inventory = JSON.parse(
        localStorage.getItem('inventoryData')
    );

    const resultsBody = document.getElementById('resultsBody');

    resultsBody.innerHTML = '';

    if (!inventory) {

        alert('No existe inventario cargado');
        return;

    }

    // FILTRAR UBICACIÓN

    const filtered = inventory.filter(item =>
        item.ubicacion.toUpperCase() === location
    );

    // VALIDACIÓN

    if (filtered.length === 0) {

        resultsBody.innerHTML = `
        
            <tr>
                <td colspan="6" class="text-center text-warning">
                    Ubicación no encontrada
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