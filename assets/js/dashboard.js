// =====================================
// DASHBOARD OPERATIVO
// =====================================

document.addEventListener('DOMContentLoaded', () => {

    // INVENTARIO

    const inventory = JSON.parse(
        localStorage.getItem('inventoryData')
    ) || [];

    // CONTEO FÍSICO

    const physical = JSON.parse(
        localStorage.getItem('physicalCount')
    ) || [];

    // MOVIMIENTOS

    const movements = JSON.parse(
        localStorage.getItem('movements')
    ) || [];

    // KPIs

    let ok = 0;
    let diferencia = 0;
    let exceso = 0;

    // ANALIZAR DATOS

    physical.forEach(item => {

        // ANOMALÍA

        if (item.anomaly) {

            diferencia++;
            return;

        }

        // OK

        if (item.fisico === item.sistema) {

            ok++;

        }

        // DIFERENCIA

        else if (item.fisico < item.sistema) {

            diferencia++;

        }

        // EXCESO

        else {

            exceso++;

        }

    });

    // TOTAL

    const total =
        ok + diferencia + exceso;

    // EXACTITUD

    const accuracy =
        total > 0
            ? ((ok / total) * 100).toFixed(1)
            : 0;

    // INSERTAR KPIS

    document.getElementById(
        'totalReviewed'
    ).innerText = total;

    document.getElementById(
        'okProducts'
    ).innerText = ok;

    document.getElementById(
        'differenceProducts'
    ).innerText = diferencia;

    document.getElementById(
        'excessProducts'
    ).innerText = exceso;

    document.getElementById(
        'accuracyPercent'
    ).innerText = accuracy + '%';

    // =====================================
    // CHART
    // =====================================

    const ctx =
        document.getElementById(
            'inventoryChart'
        );

    new Chart(ctx, {

        type: 'bar',

        data: {

            labels: [
                'OK',
                'Diferencias',
                'Exceso'
            ],

            datasets: [{

                label: 'Productos',

                data: [
                    ok,
                    diferencia,
                    exceso
                ],

                backgroundColor: [
                    '#00ff99',
                    '#ff4d4d',
                    '#ffcc00'
                ],

                borderRadius: 10

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                x: {

                    ticks: {

                        color: '#c9d1d9'

                    },

                    grid: {

                        display: false

                    }

                },

                y: {

                    beginAtZero: true,

                    ticks: {

                        color: '#c9d1d9'

                    },

                    grid: {

                        color:
                            'rgba(255,255,255,.05)'

                    }

                }

            }

        }

    });

    // =====================================
    // TABLA MOVIMIENTOS
    // =====================================

    const table =
        document.getElementById(
            'movementsTable'
        );

    table.innerHTML = '';

    // ÚLTIMOS 10

    const latest =
        movements.slice(0, 10);

    // VACÍO

    if (latest.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="4"
                    class="text-center text-secondary">

                    Sin movimientos registrados

                </td>

            </tr>

        `;

        return;

    }

    // RENDER

    latest.forEach(move => {

        // BUSCAR PRODUCTO

        const product =
            inventory.find(item =>

                item.upc === move.upc

            );

        // DESCRIPCIÓN

        const descripcion =
            product
                ? product.descripcion
                : 'UPC NO REGISTRADO';

        // ESTADO

        let estado = 'OK';
        let badge = 'success';

        const scanned =
            physical.find(item =>

                item.upc === move.upc &&

                item.location === move.location

            );

        if (scanned) {

            if (scanned.anomaly) {

                estado = 'ANOMALÍA';
                badge = 'warning';

            }

            else if (
                scanned.fisico < scanned.sistema
            ) {

                estado = 'FALTANTE';
                badge = 'danger';

            }

            else if (
                scanned.fisico > scanned.sistema
            ) {

                estado = 'EXCESO';
                badge = 'warning';

            }

        }

        // HTML

        table.innerHTML += `

            <tr>

                <td>${move.location}</td>

                <td>${move.upc}</td>

                <td>${descripcion}</td>

                <td>

                    <span class="badge bg-${badge}">

                        ${estado}

                    </span>

                </td>

                <td>

    ${
        move.date
            ? move.date
            : 'Sin fecha'
    }

</td>

            </tr>

        `;

    });

});