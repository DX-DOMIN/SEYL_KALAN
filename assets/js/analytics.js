// INVENTARIO FÍSICO

const analyticsPeriod = KhaironCountData.getStoredPeriod();
const physicalCount = KhaironCountData.getUnifiedCountEvents({
    mode: 'operational', startDate: analyticsPeriod.startDate, endDate: analyticsPeriod.endDate
});

// ELEMENTOS HTML

const analyticsBody =
    document.getElementById('analyticsBody');

const okCount =
    document.getElementById('okCount');

const excesoCount =
    document.getElementById('excesoCount');

const faltanteCount =
    document.getElementById('faltanteCount');

const accuracy =
    document.getElementById('accuracy');

// VALIDAR HTML

if (
    analyticsBody &&
    okCount &&
    excesoCount &&
    faltanteCount &&
    accuracy
) {

    renderAnalytics();

}

// RENDER

function renderAnalytics() {

    analyticsBody.innerHTML = '';

    let ok = 0;
    let exceso = 0;
    let faltante = 0;

    physicalCount.forEach(item => {

        const diferencia = item.difference;

        let estado = '';
        let recomendacion = '';
        let clase = '';

        // OK

        if (item.normalizedStatus === 'OK') {

            estado = item.rawStatus === 'UBICACION_VACIA_VALIDADA'
                ? 'VACIA VALIDADA'
                : 'OK';

            recomendacion = item.rawStatus === 'UBICACION_VACIA_VALIDADA'
                ? 'Ubicacion revisada sin stock fisico ni sistema'
                : 'Inventario correcto';

            clase = 'success';

            ok++;

        }

        // SOBRANTE

        else if (['SOBRANTE', 'FUERA DE UBICACION'].includes(item.normalizedStatus)) {

            estado = item.rawStatus === 'NO_REGISTRADO'
                ? 'NO REGISTRADO'
                : item.normalizedStatus;

            recomendacion =
                'Ingresar mercancía sobrante';

            recomendacion = item.normalizedStatus === 'FUERA DE UBICACION'
                ? `Revisar ubicacion esperada: ${item.expectedLocation || 'SIN DATO'}`
                : item.rawStatus === 'NO_REGISTRADO'
                    ? 'Investigar UPC no registrado'
                    : 'Revisar sobrante fisico';

            clase = 'warning';

            exceso++;

        }

        // FALTANTE

        else {

            estado = item.rawStatus === 'UBICACION_VACIA_CON_STOCK_SISTEMA'
                ? 'VACIA CON STOCK SISTEMA'
                : 'FALTANTE';

            recomendacion =
                'Enviar diferencia a LOST';

            clase = 'danger';

            faltante++;

        }

        // FUERA DE UBICACIÓN

        if (item.hasConflict) {

            recomendacion +=
                ' | CONFLICTO ENTRE EVIDENCIAS';

        }

        // TABLA

        analyticsBody.innerHTML += `

            <tr>

                <td>${escapeHTML(item.upc)}</td>

                <td>${escapeHTML(item.description)}</td>

                <td>${item.systemQty}</td>

                <td>${item.physicalQty}</td>

                <td>${diferencia}</td>

                <td>

                    <span class="badge bg-${clase}">
                        ${escapeHTML(estado)}
                    </span>

                </td>

                <td>${escapeHTML(recomendacion)}</td>

            </tr>

        `;

    });

    // KPIs

    okCount.innerText = ok;

    excesoCount.innerText = exceso;

    faltanteCount.innerText = faltante;

    const total =
        ok + exceso + faltante;

    const porcentaje =
        total > 0
            ? ((ok / total) * 100).toFixed(1)
            : 0;

    accuracy.innerText =
        `${porcentaje}%`;

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

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
