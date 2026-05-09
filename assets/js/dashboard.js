// ESPERAR HTML

document.addEventListener('DOMContentLoaded', () => {

    // INVENTARIO ERP

    const inventory = JSON.parse(
        localStorage.getItem('inventoryData')
    ) || [];

    // BARRIDO FÍSICO

    const physical = JSON.parse(
        localStorage.getItem('physicalCount')
    ) || [];

    // KPIs

    let ok = 0;
    let exceso = 0;
    let diferencia = 0;

    // ANALIZAR

    physical.forEach(item => {

        if (item.fisico === item.sistema) {

            ok++;

        }

        else if (item.fisico < item.sistema) {

            diferencia++;

        }

        else {

            exceso++;

        }

    });

    // TOTAL

    const total =
        ok + exceso + diferencia;

    // EXACTITUD

    const accuracy =
        total > 0
            ? ((ok / total) * 100).toFixed(1)
            : 0;

    // INSERTAR KPIs

    const totalReviewed =
        document.getElementById('totalReviewed');

    const okProducts =
        document.getElementById('okProducts');

    const differenceProducts =
        document.getElementById('differenceProducts');

    const excessProducts =
        document.getElementById('excessProducts');

    const accuracyPercent =
        document.getElementById('accuracyPercent');

    // VALIDAR EXISTENCIA HTML

    if (
        totalReviewed &&
        okProducts &&
        differenceProducts &&
        excessProducts &&
        accuracyPercent
    ) {

        totalReviewed.innerText = total;

        okProducts.innerText = ok;

        differenceProducts.innerText = diferencia;

        excessProducts.innerText = exceso;

        accuracyPercent.innerText =
            accuracy + '%';

    }

    // CHART

    const chartCanvas =
        document.getElementById('inventoryChart');

    if (chartCanvas) {

        new Chart(chartCanvas, {

            type: 'doughnut',

            data: {

                labels: [
                    'OK',
                    'Diferencia Negativa',
                    'Exceso Físico'
                ],

                datasets: [{

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

                    borderWidth: 0

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {

                        labels: {

                            color: 'white'
                        }

                    }

                }

            }

        });

    }

});