// DATOS

const rawPhysical = JSON.parse(
    localStorage.getItem('physicalCount')
) || [];

// NORMALIZAR DATOS

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

    anomaly:
        item.anomaly || false,

    ubicacionCorrecta:
        item.ubicacionCorrecta || 'OK'

}));

// EXPORTAR EXCEL

function exportExcel() {

    // VALIDAR

    if (physical.length === 0) {

        alert(
            'No existen datos para exportar'
        );

        return;

    }

    // CREAR HOJA

    const worksheet =
        XLSX.utils.json_to_sheet(physical);

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

        'SEYL_KALAN_Reporte.xlsx'

    );

}

// EXPORTAR TXT

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

`${item.location} | ${item.upc} | ${item.descripcion} | Sistema:${item.sistema} | Fisico:${item.fisico}

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
        'SEYL_KALAN_Reporte.txt';

    // DESCARGAR

    link.click();

}

// EXPORTAR AVANCE UBICACIONES

function exportProgressExcel() {

    // INVENTARIO ERP

    const inventory = JSON.parse(
        localStorage.getItem('inventoryData')
    ) || [];

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

        'SEYL_KALAN_Avance_Ubicaciones.xlsx'

    );

}