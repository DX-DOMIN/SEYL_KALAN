// =====================================
// DATOS
// =====================================

const rawPhysical = JSON.parse(
    localStorage.getItem('physicalCount')
) || [];

// =====================================
// NORMALIZAR DATOS
// =====================================

const physical = rawPhysical.map(item => ({

    location:
        item.location || 'SIN UBICACIÓN',

    upc:
        item.upc || 'N/A',

    descripcion:
        item.descripcion || 'N/A',

    sistema:
        item.sistema || 0,

    fisico:
        item.fisico || 0,

    fecha:
        item.fecha || '',

    anomaly:
        item.anomaly || false

}));

// =====================================
// EXPORTAR EXCEL
// =====================================

function exportExcel() {

    // VALIDAR

    if (physical.length === 0) {

        alert(
            'No existen datos para exportar'
        );

        return;

    }

    // CREAR DATOS LIMPIOS

    const exportData = physical.map(item => ({

        Ubicacion:
            item.location,

        UPC:
            item.upc,

        Descripcion:
            item.descripcion,

        Sistema:
            item.sistema,

        Fisico:
            item.fisico,

        Fecha_Conteo:
            item.fecha

    }));

    // CREAR HOJA

    const worksheet =
        XLSX.utils.json_to_sheet(
            exportData
        );

    // CREAR LIBRO

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        'Inventario'

    );

    // DESCARGAR

    XLSX.writeFile(

        workbook,

        'KHAIRON_Reporte.xlsx'

    );

}

// =====================================
// EXPORTAR TXT
// =====================================

function exportTXT() {

    // VALIDAR

    if (physical.length === 0) {

        alert(
            'No existen datos para exportar'
        );

        return;

    }

    // TEXTO

    let text = '';

    physical.forEach(item => {

        text +=

`${item.location} | ${item.upc} | ${item.descripcion} | Sistema:${item.sistema} | Fisico:${item.fisico} | Fecha:${item.fecha}

`;

    });

    // CREAR ARCHIVO

    const blob = new Blob(

        [text],

        { type: 'text/plain' }

    );

    // LINK

    const link =
        document.createElement('a');

    link.href =
        URL.createObjectURL(blob);

    link.download =
        'KHAIRON_Reporte.txt';

    // DESCARGAR

    link.click();

}

// =====================================
// EXPORTAR AVANCE UBICACIONES
// =====================================

async function exportProgressExcel() {

    // INVENTARIO ERP

    const inventory =
        await getInventory();

    // CONTEO FÍSICO

    const physical = JSON.parse(
        localStorage.getItem('physicalCount')
    ) || [];

    // UBICACIONES ÚNICAS

    const locations = [

        ...new Set(

            inventory.map(
                item => item.ubicacion
            )

        )

    ];

    // REPORTE

    const report = [];

    // RECORRER

    locations.forEach(location => {

        // ESPERADOS

        const expected = inventory.filter(item =>

            item.ubicacion === location

        ).length;

        // ESCANEADOS

        const scanned = physical.filter(item =>

            item.location === location

        ).length;

        // ESTADO

        let estado = '';

        // PENDIENTE

        if (scanned === 0) {

            estado = 'PENDIENTE';

        }

        // COMPLETA

        else if (scanned >= expected) {

            estado = 'COMPLETA';

        }

        // EN PROCESO

        else {

            estado = 'EN PROCESO';

        }

        // AGREGAR

        report.push({

            ubicacion: location,

            esperados: expected,

            escaneados: scanned,

            estado: estado

        });

    });

    // CREAR EXCEL

    const worksheet =
        XLSX.utils.json_to_sheet(report);

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        'Avance_Ubicaciones'

    );

    // EXPORTAR

    XLSX.writeFile(

        workbook,

        'KHAIRON_Avance_Ubicaciones.xlsx'

    );

}
