// =====================================
// DASHBOARD SEYL_KALAN
// =====================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        try {

            // =====================================
            // INIT DB
            // =====================================

            await initDB();

            // =====================================
            // USUARIO
            // =====================================

            const currentUser =
                JSON.parse(
                    localStorage.getItem(
                        'currentUser'
                    )
                );

            if (currentUser) {

                const userBox =
                    document.getElementById(
                        'currentUserBox'
                    );

                if (userBox) {

                    userBox.innerHTML = `

                        <i class="fa-solid fa-user"></i>

                        ${currentUser.name}

                    `;
                }

            }

            // =====================================
            // INVENTARIO
            // =====================================

            const inventory =
                await getInventory();

            console.log(
                'Inventario dashboard:',
                inventory.length
            );

            // =====================================
            // CONTEO
            // =====================================

            const physical =
                JSON.parse(
                    localStorage.getItem(
                        'physicalCount'
                    )
                ) || [];

            // =====================================
            // MOVIMIENTOS
            // =====================================

            const movements =
                JSON.parse(
                    localStorage.getItem(
                        'movements'
                    )
                ) || [];

            console.log(
                'Movimientos:',
                movements.length
            );

            // =====================================
            // KPIS
            // =====================================

            let ok = 0;
            let diferencia = 0;
            let exceso = 0;

            physical.forEach(item => {

                if (item.anomaly) {

                    exceso++;
                    return;
                
                }

                if (item.fisico === item.sistema) {

                    ok++;

                }

                else if (
                    item.fisico < item.sistema
                ) {

                    diferencia++;

                }

                else {

                    exceso++;

                }

            });

            const total =
                ok + diferencia + exceso;

            const accuracy =
                total > 0
                    ? (
                        (ok / total) * 100
                    ).toFixed(1)
                    : 0;

            // =====================================
            // HTML KPI
            // =====================================

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
            ).innerText =
                accuracy + '%';

            // =====================================
            // CHART
            // =====================================

            const ctx =
                document.getElementById(
                    'inventoryChart'
                );

            if (ctx) {

                new Chart(ctx, {

                    type: 'line',

                    data: {

                        labels:
                            movements
                                .slice(0, 10)
                                .reverse()
                                .map((move, index) =>

                                    `Scan ${index + 1}`

                                ),

                        datasets: [{

                            label:
                                'Actividad',

                            data:
                                movements
                                    .slice(0, 10)
                                    .reverse()
                                    .map((_, index) =>

                                        index + 1

                                    ),

                            borderColor:
                                '#00ff99',

                            backgroundColor:
                                'rgba(0,255,153,.15)',

                            fill: true,

                            tension: 0.4

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false,

                        plugins: {

                            legend: {

                                labels: {

                                    color: '#fff'

                                }

                            }

                        },

                        scales: {

                            x: {

                                ticks: {

                                    color: '#cbd5e1'

                                },

                                grid: {

                                    color:
                                        'rgba(255,255,255,.05)'

                                }

                            },

                            y: {

                                beginAtZero: true,

                                ticks: {

                                    color: '#cbd5e1'

                                },

                                grid: {

                                    color:
                                        'rgba(255,255,255,.05)'

                                }

                            }

                        }

                    }

                });

            }

            // =====================================
            // TABLA
            // =====================================

            const table =
                document.getElementById(
                    'movementsTable'
                );

            table.innerHTML = '';

            // =====================================
            // SIN MOVIMIENTOS
            // =====================================

            if (movements.length === 0) {

                table.innerHTML = `

                    <tr>

                        <td colspan="5"
                            class="text-center text-secondary">

                            Sin movimientos registrados

                        </td>

                    </tr>

                `;

                return;

            }

            // =====================================
            // ÚLTIMOS 10
            // =====================================

            movements
                .slice(0, 10)
                .forEach(move => {

                    const product =
                        inventory.find(item =>

                            String(item.upc) ===
                            String(move.upc)

                        );

                    const descripcion =
                        product
                            ? product.descripcion
                            : 'UPC NO REGISTRADO';

                    let estado = 'OK';
                    let badge = 'success';

                    const scanned =
                        physical.find(item =>

                            String(item.upc) ===
                            String(move.upc)

                            &&

                            String(item.location) ===
                            String(move.location)

                        );

                    if (scanned) {

                        if (scanned.anomaly) {

                            estado =
                                'SOBRANTE';

                            badge =
                                'warning';

                        }

                        else if (
                            scanned.fisico <
                            scanned.sistema
                        ) {

                            estado =
                                'FALTANTE';

                            badge =
                                'danger';

                        }

                        else if (
                            scanned.fisico >
                            scanned.sistema
                        ) {

                            estado =
                                'EXCESO';

                            badge =
                                'warning';

                        }

                    }

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

                            <td>${move.date}</td>

                        </tr>

                    `;

                });

        }

        catch(error) {

            console.error(
                'Dashboard error:',
                error
            );

        }

    }
);