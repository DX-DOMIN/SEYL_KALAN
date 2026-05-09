// TABLA

const analysisTable =
    document.getElementById(
        'analysisTable'
    );

// KPIs

const okCount =
    document.getElementById(
        'okCount'
    );

const excesoCount =
    document.getElementById(
        'excesoCount'
    );

const faltanteCount =
    document.getElementById(
        'faltanteCount'
    );

const accuracy =
    document.getElementById(
        'accuracy'
    );

// RENDER

function renderAnalysis() {

    // LEER DATOS

    const physical = JSON.parse(

        localStorage.getItem(
            'physicalCount'
        )

    ) || [];

    // LIMPIAR TABLA

    analysisTable.innerHTML = '';

    // CONTADORES

    let ok = 0;

    let sobrante = 0;

    let faltante = 0;

    // SIN DATOS

    if (physical.length === 0) {

        analysisTable.innerHTML = `

        <tr>

            <td colspan="7"
                class="text-center">

                Sin análisis disponible

            </td>

        </tr>

        `;

        // KPIs VACÍOS

        okCount.innerText = 0;

        excesoCount.innerText = 0;

        faltanteCount.innerText = 0;

        accuracy.innerText = '0%';

        return;

    }

    // RECORRER DATOS

    physical.forEach(item => {

        const sistema =
            Number(item.sistema || 0);

        const fisico =
            Number(item.fisico || 0);

        const diferencia =
            fisico - sistema;

        let estado = '';

        let recomendacion = '';

        // OK

        if (fisico === sistema) {

            estado = 'OK';

            recomendacion =
                'Inventario correcto';

            ok++;

        }

        // SOBRANTE

        else if (fisico > sistema) {

            estado = 'SOBRANTE';

            recomendacion =
                'Ingresar mercancía sobrante';

            sobrante++;

        }

        // FALTANTE

        else {

            estado = 'FALTANTE';

            recomendacion =
                'Enviar producto a LOST';

            faltante++;

        }

        // ANOMALÍA

        if (item.anomaly) {

            recomendacion +=
                ' | Posible movimiento incorrecto';

        }

        // FILA

        analysisTable.innerHTML += `

        <tr>

            <td>
                ${item.location || '-'}
            </td>

            <td>
                ${item.upc || '-'}
            </td>

            <td>
                ${item.descripcion || '-'}
            </td>

            <td>
                ${sistema}
            </td>

            <td>
                ${fisico}
            </td>

            <td>
                ${diferencia}
            </td>

            <td>
                ${estado}
            </td>

            <td>
                ${recomendacion}
            </td>

        </tr>

        `;

    });

    // ACTUALIZAR KPIs

    okCount.innerText =
        ok;

    excesoCount.innerText =
        sobrante;

    faltanteCount.innerText =
        faltante;

    // EXACTITUD

    const total =
        physical.length;

    const exactitud =
        (
            (ok / total) * 100
        ).toFixed(1);

    accuracy.innerText =
        exactitud + '%';

}

// EJECUTAR

renderAnalysis();