let resultPieChart;
let accuracyTrendChart;

const visibleValueLabels = {
    id: 'visibleValueLabels',
    afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 12px Segoe UI';

        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            meta.data.forEach((element, index) => {
                const value = Number(dataset.data[index]) || 0;
                if (value === 0) return;
                const position = element.tooltipPosition();
                const isPie = chart.config.type === 'doughnut';
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = 'rgba(0,0,0,.65)';
                ctx.lineWidth = 3;
                const label = isPie ? String(value) : `${value}%`;
                const y = isPie ? position.y : position.y - 10;
                ctx.strokeText(label, position.x, y);
                ctx.fillText(label, position.x, y);
            });
        });
        ctx.restore();
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        const inventory = await getInventory();
        const layout = await loadLayout();
        const history = loadScanHistory();
        const startDateFilter = document.getElementById('startDateFilter');
        const endDateFilter = document.getElementById('endDateFilter');
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        startDateFilter.value = localStorage.getItem('kpiStartDate') || toDateInputValue(monthStart);
        endDateFilter.value = localStorage.getItem('kpiEndDate') || toDateInputValue(today);
        includeLatestSweepDate(startDateFilter, endDateFilter, history);
        const savedClient = localStorage.getItem('kpiClient') || 'Quiksilver';
        const savedClientControl = document.querySelector(`[name="clientFilter"][value="${savedClient}"]`);
        if (savedClientControl) savedClientControl.checked = true;

        renderCurrentUser();

        const refresh = () => {
            normalizeDateRange(startDateFilter, endDateFilter);
            localStorage.setItem('kpiStartDate', startDateFilter.value);
            localStorage.setItem('kpiEndDate', endDateFilter.value);
            localStorage.setItem('kpiClient', getSelectedClient());
            renderDashboard(
                inventory,
                layout,
                history,
                startDateFilter.value,
                endDateFilter.value,
                getGranularity(),
                getSelectedClient()
            );
        };

        startDateFilter.addEventListener('change', refresh);
        endDateFilter.addEventListener('change', refresh);
        document.querySelectorAll('[name="granularity"]').forEach(control => {
            control.addEventListener('change', () => {
                applyCurrentGranularityDates(startDateFilter, endDateFilter);
                refresh();
            });
        });
        document.querySelectorAll('label[for="dailyView"], label[for="monthlyView"]').forEach(label => {
            label.addEventListener('click', () => {
                const control = document.getElementById(label.htmlFor);
                if (control.checked) {
                    applyCurrentGranularityDates(startDateFilter, endDateFilter);
                    refresh();
                }
            });
        });
        document.querySelectorAll('[name="clientFilter"]').forEach(control => {
            control.addEventListener('change', refresh);
        });
        document.getElementById('resetFilters').addEventListener('click', () => {
            applyCurrentGranularityDates(startDateFilter, endDateFilter);
            refresh();
        });

        refresh();
    } catch (error) {
        console.error('Dashboard error:', error);
    }
});

async function loadLayout() {
    const response = await fetch('../assets/data/layout-tr3.json');
    if (!response.ok) throw new Error('No fue posible cargar el layout TR3');
    return response.json();
}

function loadScanHistory() {
    return KhaironCountData.getUnifiedCountEvents({ mode: 'operational' });
}

function includeLatestSweepDate(startInput, endInput, history) {
    if (!history.length) return;
    const latestDate = history.reduce((latest, event) => {
        const eventDate = event.countDate || localDateKey(event.timestamp);
        return eventDate > latest ? eventDate : latest;
    }, '');
    if (!latestDate) return;
    if (!endInput.value || latestDate > endInput.value) endInput.value = latestDate;
    if (!startInput.value || startInput.value > latestDate) startInput.value = latestDate;
}

function renderDashboard(inventory, layout, history, startDate, endDate, granularity, client) {
    const clientLayout = layout.filter(item => item.account === client);
    const clientLocations = new Set(clientLayout.map(item => item.location));
    const filtered = history.filter(event =>
        clientLocations.has(event.location) &&
        eventMatchesDateRange(event, startDate, endDate)
    );
    const latest = latestByKey(filtered, event => `${event.location}|${event.upc}`);
    const results = summarizeResults(latest);

    setText('dashboardTitle', `KPIs de Inventario - ${client}`);
    setText('layoutTitle', `Avance ${client} · Layout TR3`);

    setText('countedCodes', latest.length);
    setText('okResults', results.ok);
    setText('excessResults', results.excess);
    setText('missingResults', results.missing);
    setText('okDetail', `${percent(results.ok, latest.length)}% del conteo`);
    setText('excessDetail', `${percent(results.excess, latest.length)}% del conteo`);
    setText('missingDetail', `${percent(results.missing, latest.length)}% del conteo`);

    renderResultPie(results, latest.length);
    renderLocationProgress(clientLayout, latest);
    renderTrend(filtered, granularity);
    renderCriticalRanking(filtered, granularity);
}

function summarizeResults(records) {
    return records.reduce((summary, event) => {
        if (!event.isLocationAccurate || event.physicalQty > event.systemQty) summary.excess += 1;
        else if (event.physicalQty < event.systemQty) summary.missing += 1;
        else summary.ok += 1;
        return summary;
    }, { ok: 0, excess: 0, missing: 0 });
}

function renderResultPie(results, total) {
    const emptyState = document.getElementById('emptyPie');
    emptyState.classList.toggle('d-none', total > 0);

    if (typeof Chart === 'undefined') {
        emptyState.classList.remove('d-none');
        emptyState.textContent = 'Grafica no disponible. Verifica la conexion y recarga.';
        return;
    }
    if (resultPieChart) resultPieChart.destroy();
    const canvas = document.getElementById('resultPieChart');
    resultPieChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['OK', 'Excedentes', 'Faltantes'],
            datasets: [{
                data: [results.ok, results.excess, results.missing],
                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                borderColor: '#0f1f18',
                borderWidth: 4,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '58%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#e5e7eb', padding: 18, usePointStyle: true } },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${context.raw} (${percent(context.raw, total)}%)`
                    }
                }
            }
        },
        plugins: [visibleValueLabels]
    });
}

function renderTrend(events, granularity) {
    const bucketKey = event => {
        return granularity === 'daily'
            ? localDateKey(event.timestamp)
            : localMonthKey(event.timestamp);
    };
    const buckets = [...new Set(events.map(bucketKey))].sort();
    const iraData = [];
    const ilaData = [];

    buckets.forEach(bucket => {
        const bucketEvents = events.filter(event => bucketKey(event) === bucket);
        const latest = latestByKey(bucketEvents, event => `${event.location}|${event.upc}`);
        iraData.push(calculatePieceIra(latest));
        ilaData.push(calculateLocationIla(latest));
    });

    setText(
        'trendCaption',
        granularity === 'daily'
            ? 'IRA por piezas e ILA por ubicacion, por dia'
            : 'IRA por piezas e ILA por ubicacion, por mes'
    );
    const emptyState = document.getElementById('emptyTrend');
    emptyState.classList.toggle('d-none', buckets.length > 0);

    if (typeof Chart === 'undefined') {
        emptyState.classList.remove('d-none');
        emptyState.textContent = 'Grafica no disponible. Verifica la conexion y recarga.';
        return;
    }
    if (accuracyTrendChart) accuracyTrendChart.destroy();

    accuracyTrendChart = new Chart(document.getElementById('accuracyTrendChart'), {
        type: 'bar',
        data: {
            labels: buckets.map(formatBucket),
            datasets: [
                {
                    label: 'IRA',
                    data: iraData,
                    borderColor: '#35d07f',
                    backgroundColor: 'rgba(53,208,127,.78)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'ILA',
                    data: ilaData,
                    borderColor: '#36a9e1',
                    backgroundColor: 'rgba(54,169,225,.78)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 20 } },
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e5e7eb', usePointStyle: true, padding: 20 }
                }
            },
            scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,.05)' } },
                y: {
                    min: 0,
                    max: 100,
                    ticks: { color: '#9ca3af', callback: value => `${value}%` },
                    grid: { color: 'rgba(255,255,255,.07)' }
                }
            }
        },
        plugins: [visibleValueLabels]
    });
}

function calculatePieceIra(records) {
    if (!records.length) return 0;
    const totals = records.reduce((result, event) => {
        result.system += Math.max(Number(event.systemQty) || 0, 0);
        result.variance += Math.abs((Number(event.physicalQty) || 0) - (Number(event.systemQty) || 0));
        return result;
    }, { system: 0, variance: 0 });

    if (totals.system === 0) return totals.variance === 0 ? 100 : 0;
    return Number(Math.max(0, (1 - (totals.variance / totals.system)) * 100).toFixed(1));
}

function calculateLocationIla(records) {
    if (!records.length) return 0;

    const locations = new Map();

    records.forEach(event => {
        const current = locations.get(event.location) ?? true;
        locations.set(event.location, current && event.isLocationAccurate);
    });

    const accurate = [...locations.values()].filter(Boolean).length;
    return percent(accurate, locations.size);
}

function renderLocationProgress(layout, latest) {
    const layoutLocations = layout.map(item => item.location);
    const counted = new Set(latest.map(event => event.location));
    const total = layoutLocations.length;
    const countedTotal = layoutLocations.filter(location => counted.has(location)).length;
    const progress = percent(countedTotal, total);

    setText('layoutSummary', `${countedTotal.toLocaleString('es-MX')} contadas de ${total.toLocaleString('es-MX')} ubicaciones`);
    setText('progressPercent', `${progress}%`);
    document.getElementById('progressBar').style.width = `${progress}%`;

    const container = document.getElementById('clientProgress');
    container.replaceChildren();
    const clients = [...new Set(layout.map(item => item.account))].sort();
    clients.forEach(client => {
        const clientLocations = layout.filter(item => item.account === client);
        const clientCounted = clientLocations.filter(item => counted.has(item.location)).length;
        const clientPercent = percent(clientCounted, clientLocations.length);
        const section = document.createElement('section');
        section.className = 'client-progress-row';
        section.innerHTML = `<div class="client-progress-heading"><strong></strong><span></span></div><div class="client-bar"><i></i></div><small></small><div class="client-aisles"></div>`;
        section.querySelector('strong').textContent = client;
        section.querySelector('.client-progress-heading span').textContent = `${clientPercent}%`;
        section.querySelector('small').textContent = `${clientCounted.toLocaleString('es-MX')} contadas de ${clientLocations.length.toLocaleString('es-MX')} ubicaciones`;
        section.querySelector('.client-bar i').style.width = `${clientPercent}%`;

        const aisleContainer = section.querySelector('.client-aisles');
        const aisles = [...new Set(clientLocations.map(item => item.aisle))].sort();
        aisles.forEach(aisle => {
            const aisleLocations = clientLocations.filter(item => item.aisle === aisle);
            const aisleCounted = aisleLocations.filter(item => counted.has(item.location)).length;
            const aislePercent = percent(aisleCounted, aisleLocations.length);
            const row = document.createElement('div');
            row.className = 'client-aisle-row';
            row.innerHTML = `<span></span><div class="client-aisle-bar"><i></i></div><b></b>`;
            row.querySelector('span').textContent = `Pasillo ${aisle}`;
            row.querySelector('i').style.width = `${aislePercent}%`;
            row.querySelector('b').textContent = `${aisleCounted}/${aisleLocations.length} · ${aislePercent}%`;
            aisleContainer.appendChild(row);
        });

        container.appendChild(section);
    });
}

function renderCriticalRanking(events, granularity) {
    const finalRecords = latestByKey(events, event => {
        const periodKey = granularity === 'daily'
            ? localDateKey(event.timestamp)
            : localMonthKey(event.timestamp);
        return `${periodKey}|${event.location}|${event.upc}`;
    });
    const issues = finalRecords.filter(event => !event.isInventoryAccurate || !event.isLocationAccurate);
    const ranking = new Map();

    issues.forEach(event => {
        const current = ranking.get(event.upc) || {
            upc: event.upc, description: event.description, incidents: 0,
            missingUnits: 0, excessUnits: 0,
            days: new Set(), locations: new Set(), last: event.timestamp
        };
        current.incidents += 1;
        if (event.difference < 0) current.missingUnits += Math.abs(event.difference);
        else if (event.difference > 0) current.excessUnits += event.difference;
        current.days.add(localDateKey(event.timestamp));
        current.locations.add(event.location);
        if (event.timestamp > current.last) current.last = event.timestamp;
        ranking.set(event.upc, current);
    });

    const rows = [...ranking.values()].sort((a, b) =>
        b.incidents - a.incidents ||
        (b.missingUnits + b.excessUnits) - (a.missingUnits + a.excessUnits) ||
        b.days.size - a.days.size
    ).slice(0, 10);
    const table = document.getElementById('criticalSkuTable');
    table.replaceChildren();

    if (!rows.length) {
        const row = table.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 9;
        cell.className = 'text-center text-secondary py-4';
        cell.textContent = 'No hay UPC con incidencias en el periodo.';
        return;
    }

    rows.forEach((item, index) => {
        const row = table.insertRow();
        [index + 1, item.upc, item.description, item.incidents, item.missingUnits, item.excessUnits,
            item.days.size, item.locations.size, formatDateTime(item.last)]
            .forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });
    });
}

function latestByKey(events, keySelector) {
    const latest = new Map();
    events.forEach(event => {
        const baseKey = keySelector(event);
        const key = event.hasConflict
            ? `${baseKey}|${event.conflictGroupId}|${event.eventFingerprint}`
            : baseKey;
        const current = latest.get(key);
        if (!current || event.timestamp > current.timestamp) latest.set(key, event);
    });
    return [...latest.values()];
}

function eventMatchesDateRange(event, startDate, endDate) {
    const eventDate = event.countDate || '';
    return (!startDate || eventDate >= startDate) && (!endDate || eventDate <= endDate);
}

function normalizeDateRange(startInput, endInput) {
    if (startInput.value && endInput.value && startInput.value > endInput.value) {
        const previousStart = startInput.value;
        startInput.value = endInput.value;
        endInput.value = previousStart;
    }
}

function applyCurrentGranularityDates(startInput, endInput) {
    const today = new Date();
    const granularity = getGranularity();
    startInput.value = granularity === 'daily'
        ? toDateInputValue(today)
        : toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
    endInput.value = toDateInputValue(today);
}

function localDateKey(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localMonthKey(timestamp) {
    return localDateKey(timestamp).slice(0, 7);
}

function getGranularity() {
    return document.querySelector('[name="granularity"]:checked')?.value || 'daily';
}

function getSelectedClient() {
    return document.querySelector('[name="clientFilter"]:checked')?.value || 'Quiksilver';
}

function readStorageArray(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
}

function renderCurrentUser() {
    const user = readStorageObject('currentUser');
    const box = document.getElementById('currentUserBox');
    if (user && box) box.textContent = user.name || user.username || 'Usuario';
}

function readStorageObject(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
}

function parseLegacyDate(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function percent(value, total) {
    return total ? Number(((value / total) * 100).toFixed(1)) : 0;
}

function toDateInputValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatBucket(value) {
    const parts = value.split('-').map(Number);
    const date = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(parts[0], parts[1] - 1, 1);
    return date.toLocaleDateString('es-MX', parts.length === 3 ? { day: '2-digit', month: 'short' } : { month: 'short' });
}

function formatDateTime(value) {
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}
