// CONTENEDOR

const heatmapContainer =
    document.getElementById(
        'heatmapContainer'
    );

// DATOS

const heatmapPeriod = KhaironCountData.getStoredPeriod();
const physical = KhaironCountData.getUnifiedCountEvents({
    mode: 'operational', startDate: heatmapPeriod.startDate, endDate: heatmapPeriod.endDate
});

// AGRUPAR UBICACIONES

const locations = {};

// RECORRER

physical.forEach(item => {

    item = { ...item, location: item.location || item.ubicacion };

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

    const systemQty = Number(item.systemQty ?? item.cantidadSistema ?? item.sistema) || 0;
    const physicalQty = Number(item.physicalQty ?? item.scannedQty ?? item.cantidadFisica ?? item.fisico) || 0;
    const rawStatus = String(item.rawStatus || '').toUpperCase();

    if (item.normalizedStatus !== 'OK' || physicalQty !== systemQty || !item.isLocationAccurate) {

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

                ${escapeHTML(location)}

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

if (!Object.keys(locations).length) {
    heatmapContainer.innerHTML = `
        <div class="col-12">
            <div class="dashboard-card text-center text-secondary">
                Aun no existen ubicaciones contadas.
            </div>
        </div>
    `;
}

function readStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    }
    catch {
        return [];
    }
}

function normalizeCountStatus(status, physicalQty, systemQty) {
    if (['OK', 'UBICACION_VACIA_VALIDADA', 'COMPLETA', 'VACIA_VALIDADA'].includes(status)) return 'OK';
    if (['FALTANTE', 'FALTANTE_TOTAL', 'UBICACION_VACIA_CON_STOCK_SISTEMA', 'VACIA_CON_STOCK_SISTEMA'].includes(status)) return 'FALTANTE';
    if (['SOBRANTE', 'FUERA_DE_UBICACION', 'NO_REGISTRADO'].includes(status)) return 'SOBRANTE';
    if (physicalQty < systemQty) return 'FALTANTE';
    if (physicalQty > systemQty) return 'SOBRANTE';
    return 'OK';
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
