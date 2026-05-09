// CONTENEDOR

const heatmapContainer =
    document.getElementById(
        'heatmapContainer'
    );

// DATOS

const physical = JSON.parse(

    localStorage.getItem(
        'physicalCount'
    )

) || [];

// AGRUPAR UBICACIONES

const locations = {};

// RECORRER

physical.forEach(item => {

    const location =
        item.location || 'SIN UBICACIÓN';

    // CREAR

    if (!locations[location]) {

        locations[location] = {

            total: 0,

            errors: 0

        };

    }

    // TOTAL

    locations[location].total++;

    // ERROR

    if (
        item.fisico !== item.sistema
    ) {

        locations[location].errors++;

    }

});

// RENDER

Object.keys(locations).forEach(location => {

    const data =
        locations[location];

    // PORCENTAJE ERROR

    const errorRate =

        (data.errors / data.total) * 100;

    // ESTADO

    let status = '';

    let color = '';

    // CRÍTICA

    if (errorRate >= 50) {

        status = 'CRÍTICA';

        color = 'danger';

    }

    // RIESGO

    else if (errorRate >= 20) {

        status = 'RIESGO';

        color = 'warning';

    }

    // CORRECTA

    else {

        status = 'CORRECTA';

        color = 'success';

    }

    // CARD

    heatmapContainer.innerHTML += `

    <div class="col-lg-3 col-md-6">

        <div class="dashboard-card border border-${color}">

            <h4>

                ${location}

            </h4>

            <h2 class="text-${color}">

                ${status}

            </h2>

            <p>

                Diferencias:
                ${data.errors}

            </p>

            <p>

                Total:
                ${data.total}

            </p>

            <p>

                Error:
                ${errorRate.toFixed(1)}%

            </p>

        </div>

    </div>

    `;

});