// INVENTARIO FÍSICO

const physicalCount = readStoredArray('physicalCount');

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

        const diferencia =
            item.fisico - item.sistema;

        let estado = '';
        let recomendacion = '';
        let clase = '';

        // OK

        if (diferencia === 0 && !item.anomaly) {

            estado = 'OK';

            recomendacion =
                'Inventario correcto';

            clase = 'success';

            ok++;

        }

        // SOBRANTE

        else if (diferencia > 0 || item.anomaly) {

            estado = 'SOBRANTE';

            recomendacion =
                'Ingresar mercancía sobrante';

            clase = 'warning';

            exceso++;

        }

        // FALTANTE

        else {

            estado = 'FALTANTE';

            recomendacion =
                'Enviar diferencia a LOST';

            clase = 'danger';

            faltante++;

        }

        // FUERA DE UBICACIÓN

        if (item.anomaly) {

            recomendacion +=
                ' | Posible movimiento incorrecto';

        }

        // TABLA

        analyticsBody.innerHTML += `

            <tr>

                <td>${escapeHTML(item.upc)}</td>

                <td>${escapeHTML(item.descripcion)}</td>

                <td>${item.sistema}</td>

                <td>${item.fisico}</td>

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
