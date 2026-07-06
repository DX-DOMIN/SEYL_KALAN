(function () {
    'use strict';

    const SOURCE_PRIORITY = { scanHistory: 3, physicalCount: 2, locationSweep: 1 };
    let lastStats = null;

    function readStoredArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function clean(value) { return String(value ?? '').trim(); }
    function upper(value) { return clean(value).toUpperCase(); }
    function number(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    function dateKey(date) {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function parseCountDate(value) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return { date: value, timestamp: value.toISOString(), countDate: dateKey(value), invalidDate: false };
        }
        const text = clean(value).replace(/\u00a0/g, ' ');
        if (!text) return { date: null, timestamp: '', countDate: '', invalidDate: true };
        const legacy = text.toLowerCase().match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(a\.?\s*m\.?|p\.?\s*m\.?|am|pm)?$/i
        );
        if (legacy) {
            let hour = Number(legacy[4]);
            const meridiem = String(legacy[7] || '').replace(/[.\s]/g, '').toLowerCase();
            if (meridiem === 'pm' && hour < 12) hour += 12;
            if (meridiem === 'am' && hour === 12) hour = 0;
            const date = new Date(Number(legacy[3]), Number(legacy[2]) - 1, Number(legacy[1]), hour, Number(legacy[5]), Number(legacy[6] || 0));
            const valid = date.getFullYear() === Number(legacy[3]) && date.getMonth() === Number(legacy[2]) - 1 && date.getDate() === Number(legacy[1]);
            if (valid) return { date, timestamp: date.toISOString(), countDate: dateKey(date), invalidDate: false };
        }
        const date = new Date(text);
        if (!Number.isNaN(date.getTime())) {
            return { date, timestamp: date.toISOString(), countDate: dateKey(date), invalidDate: false };
        }
        return { date: null, timestamp: '', countDate: '', invalidDate: true };
    }

    function normalizeCountStatus(status, rawStatus) {
        const raw = upper(rawStatus || status).replace(/\s+/g, '_');
        if (['OK', 'UBICACION_VACIA_VALIDADA', 'COMPLETA', 'VACIA_VALIDADA'].includes(raw)) return 'OK';
        if (['FALTANTE', 'FALTANTE_TOTAL', 'UBICACION_VACIA_CON_STOCK_SISTEMA', 'VACIA_CON_STOCK_SISTEMA'].includes(raw)) return 'FALTANTE';
        if (raw === 'SOBRANTE' || raw === 'NO_REGISTRADO') return 'SOBRANTE';
        if (raw === 'FUERA_DE_UBICACION') return 'FUERA DE UBICACION';
        return raw.replace(/_/g, ' ') || 'OK';
    }

    function inferRawStatus(record, difference) {
        const explicit = upper(record.rawStatus || record.lineStatus || record.status || record.estado);
        const diagnostic = upper([
            record.description, record.descripcion, record.expectedLocation,
            record.ubicacionCorrecta, explicit
        ].filter(Boolean).join(' ')).replace(/\s+/g, '_');
        if (diagnostic.includes('UPC_NO_REGISTRADO') || diagnostic.includes('NO_REGISTRADO')) return 'NO_REGISTRADO';
        if (diagnostic.includes('UBICACION_VACIA_CON_STOCK_SISTEMA')) return 'UBICACION_VACIA_CON_STOCK_SISTEMA';
        if (diagnostic.includes('UBICACION_VACIA_VALIDADA')) return 'UBICACION_VACIA_VALIDADA';
        if (diagnostic.includes('FUERA_DE_UBICACION')) return 'FUERA_DE_UBICACION';
        if (explicit) return explicit.replace(/\s+/g, '_');
        return difference < 0 ? 'FALTANTE' : difference > 0 ? 'SOBRANTE' : 'OK';
    }

    function buildOperationalKey(record) {
        const event = record.normalizedStatus ? record : normalizeCountEvent(record);
        return `${event.countDate || 'SIN_FECHA'}|${event.location}|${event.upc}`;
    }

    function buildCountFingerprint(record) {
        const event = record.normalizedStatus ? record : normalizeCountEvent(record);
        return [event.countDate || 'SIN_FECHA', event.location, event.upc, event.normalizedStatus,
            event.locationSweepId || '', event.user || '', event.timestamp || ''].join('|');
    }

    function normalizeCountEvent(record, context = {}) {
        const location = upper(record.location || record.ubicacion || context.location);
        const upc = upper(record.upc || context.upc);
        const systemQty = number(record.systemQty ?? record.cantidadSistema ?? record.expectedQty ?? record.sistema);
        const physicalQty = number(record.physicalQty ?? record.scannedQty ?? record.cantidadFisica ?? record.fisico);
        const difference = number(record.difference ?? record.diferencia ?? (physicalQty - systemQty));
        const rawStatus = inferRawStatus(record, difference);
        const normalizedStatus = normalizeCountStatus(record.normalizedStatus || record.status, rawStatus);
        const parsed = parseCountDate(record.timestamp || record.savedAt || record.fecha || context.timestamp);
        const countDate = clean(record.countDate || context.countDate || parsed.countDate);
        const invalidDate = !countDate || parsed.invalidDate && !record.countDate && !context.countDate;
        const description = clean(record.description || record.descripcion || context.description) || 'SIN DESCRIPCION';
        const foundInOtherLocations = Array.isArray(record.foundInOtherLocations)
            ? record.foundInOtherLocations.map(upper).filter(Boolean) : [];
        const source = context.source || record.source || 'unknown';
        const inferredLocationAccuracy = !['FUERA_DE_UBICACION', 'FUERA DE UBICACION', 'NO_REGISTRADO'].includes(rawStatus);
        const event = {
            ...record,
            id: record.id || context.id || '',
            location, ubicacion: location, upc,
            description, descripcion: description,
            systemQty, cantidadSistema: systemQty,
            physicalQty, scannedQty: physicalQty, cantidadFisica: physicalQty,
            difference, diferencia: difference,
            status: normalizedStatus, estado: normalizedStatus, rawStatus, normalizedStatus,
            isInventoryAccurate: record.isInventoryAccurate ?? (normalizedStatus === 'OK' && difference === 0),
            isLocationAccurate: record.isLocationAccurate ?? inferredLocationAccuracy,
            expectedLocation: upper(record.expectedLocation || record.ubicacionCorrecta || location),
            foundInOtherLocations,
            countMode: record.countMode || context.countMode || 'LEGACY',
            locationSweepId: record.locationSweepId || context.locationSweepId || '',
            importBatchId: record.importBatchId || context.importBatchId || '',
            packageId: record.packageId || context.packageId || '',
            aggregationMode: upper(record.aggregationMode || context.aggregationMode),
            aggregationGroupId: record.aggregationGroupId || context.aggregationGroupId || '',
            isEmptyLocationValidation: Boolean(record.isEmptyLocationValidation || rawStatus === 'UBICACION_VACIA_VALIDADA'),
            user: clean(record.user || context.user) || 'Sin usuario',
            sourceDeviceId: clean(record.sourceDeviceId || context.sourceDeviceId),
            observations: clean(record.observations || context.observations),
            timestamp: parsed.timestamp,
            countDate,
            invalidDate,
            voided: Boolean(record.voided),
            source,
            sourcePriority: SOURCE_PRIORITY[source] || 0,
            hasConflict: Boolean(record.hasConflict),
            conflictReason: clean(record.conflictReason),
            conflictGroupId: record.conflictGroupId || '',
            isAggregated: Boolean(record.isAggregated),
            aggregatedFromCount: number(record.aggregatedFromCount) || 1,
            aggregatedFromIds: Array.isArray(record.aggregatedFromIds) ? record.aggregatedFromIds : []
        };
        event.eventFingerprint = record.eventFingerprint || buildCountFingerprint(event);
        event.operationalKey = buildOperationalKey(event);
        return event;
    }

    function getVoids() {
        return [...readStoredArray('khaironVoidedCountEvents'),
            ...readStoredArray('scanDeletionAudit').filter(item => item.eventFingerprint || item.targetId)];
    }

    function isCountEventVoided(record, voids = getVoids()) {
        const event = record.normalizedStatus ? record : normalizeCountEvent(record);
        if (event.voided) return true;
        return voids.some(tombstone => {
            if (tombstone.eventFingerprint && tombstone.eventFingerprint === event.eventFingerprint) return true;
            if (tombstone.targetId && tombstone.targetId === event.id) return true;
            const sameLine = upper(tombstone.location) === event.location && upper(tombstone.upc) === event.upc && clean(tombstone.countDate) === event.countDate;
            if (!sameLine) return false;
            if (tombstone.locationSweepId && event.locationSweepId) return tombstone.locationSweepId === event.locationSweepId;
            if (tombstone.deletedAt && event.timestamp && event.timestamp > tombstone.deletedAt) return false;
            return true;
        });
    }

    function isExcelEvent(event) {
        return String(event.id || '').startsWith('xlsx-') || event.user === 'Importado desde Excel' || event.aggregationMode === 'SUM';
    }

    function areEventsAggregatable(a, b) {
        if (a.operationalKey !== b.operationalKey) return false;
        if (a.locationSweepId && a.locationSweepId === b.locationSweepId) return true;
        if (a.aggregationGroupId && a.aggregationGroupId === b.aggregationGroupId) return true;
        if (isExcelEvent(a) && isExcelEvent(b) && a.importBatchId && a.importBatchId === b.importBatchId) return true;
        const explicitSum = a.aggregationMode === 'SUM' && b.aggregationMode === 'SUM';
        if (explicitSum && a.packageId && a.packageId === b.packageId) return true;
        if (explicitSum && a.importBatchId && a.importBatchId === b.importBatchId) return true;
        return false;
    }

    function aggregateEvents(events) {
        const systemQty = events.reduce((sum, event) => sum + event.systemQty, 0);
        const physicalQty = events.reduce((sum, event) => sum + event.physicalQty, 0);
        const difference = physicalQty - systemQty;
        const rawStatuses = new Set(events.map(event => event.rawStatus));
        let rawStatus;
        if (rawStatuses.has('UBICACION_VACIA_CON_STOCK_SISTEMA')) rawStatus = 'UBICACION_VACIA_CON_STOCK_SISTEMA';
        else if (rawStatuses.has('FUERA_DE_UBICACION')) rawStatus = 'FUERA_DE_UBICACION';
        else if (rawStatuses.has('NO_REGISTRADO')) rawStatus = 'NO_REGISTRADO';
        else if (rawStatuses.size === 1 && rawStatuses.has('UBICACION_VACIA_VALIDADA')) rawStatus = 'UBICACION_VACIA_VALIDADA';
        else rawStatus = difference < 0 || physicalQty === 0 && systemQty > 0 ? 'FALTANTE' : difference > 0 ? 'SOBRANTE' : 'OK';
        const latestTimestamp = events.map(event => event.timestamp).filter(Boolean).sort().pop() || '';
        const base = events[0];
        return normalizeCountEvent({
            ...base,
            id: `aggregate-${base.operationalKey}`,
            systemQty, physicalQty, scannedQty: physicalQty, difference,
            rawStatus, status: rawStatus,
            timestamp: latestTimestamp,
            isInventoryAccurate: difference === 0 && normalizeCountStatus(rawStatus, rawStatus) === 'OK',
            isLocationAccurate: events.every(event => event.isLocationAccurate),
            isAggregated: true,
            aggregatedFromCount: events.length,
            aggregatedFromIds: events.map(event => event.id || event.eventFingerprint),
            eventFingerprint: '',
            source: 'aggregate'
        }, { source: 'aggregate' });
    }

    function collapseMirroredRepresentations(events, stats) {
        const kept = [];
        events.forEach(event => {
            const mirrorIndex = kept.findIndex(current => {
                if (current.source === event.source) return false;
                if (current.systemQty !== event.systemQty || current.physicalQty !== event.physicalQty) return false;
                if (current.rawStatus !== event.rawStatus) return false;
                if (!current.timestamp || !event.timestamp) return false;
                return Math.abs(new Date(current.timestamp).getTime() - new Date(event.timestamp).getTime()) <= 2000;
            });
            if (mirrorIndex < 0) {
                kept.push(event);
                return;
            }
            stats.mirroredRepresentations += 1;
            if (event.sourcePriority > kept[mirrorIndex].sourcePriority) kept[mirrorIndex] = event;
        });
        return kept;
    }

    function sourceEvents() {
        const history = readStoredArray('scanHistory').map(item => normalizeCountEvent(item, { source: 'scanHistory' }));
        const physical = readStoredArray('physicalCount').map(item => normalizeCountEvent(item, { source: 'physicalCount' }));
        const sweeps = readStoredArray('khaironLocationSweeps').flatMap(sweep =>
            (Array.isArray(sweep.resultLines) ? sweep.resultLines : []).map(line => normalizeCountEvent(line, {
                source: 'locationSweep', id: `${sweep.id || 'sweep'}-${line.upc || '__EMPTY__'}`,
                location: sweep.location, timestamp: sweep.savedAt || sweep.createdAt, countDate: sweep.countDate,
                countMode: 'LOCATION_SWEEP', locationSweepId: sweep.id, user: sweep.user,
                sourceDeviceId: sweep.sourceDeviceId, observations: sweep.observations
            }))
        );
        return [...history, ...physical, ...sweeps].filter(event => event.location && event.upc);
    }

    function buildProjection(options = {}) {
        const raw = sourceEvents();
        const stats = {
            sourceEvents: raw.length, exactDuplicates: 0, evidenceCount: 0,
            mirroredRepresentations: 0,
            aggregatedGroups: 0, aggregatedEventsCollapsed: 0,
            conflictGroups: 0, conflictEvents: 0, invalidDates: 0, operationalCount: 0
        };
        const exact = new Map();
        raw.forEach(event => {
            const current = exact.get(event.eventFingerprint);
            if (current) {
                stats.exactDuplicates += 1;
                if (event.sourcePriority > current.sourcePriority) exact.set(event.eventFingerprint, event);
            } else exact.set(event.eventFingerprint, event);
        });
        const voids = getVoids();
        let evidence = [...exact.values()].map(event => ({ ...event, voided: isCountEventVoided(event, voids) }));
        stats.invalidDates = evidence.filter(event => event.invalidDate).length;
        if (!options.includeVoided) evidence = evidence.filter(event => !event.voided);
        stats.evidenceCount = evidence.length;
        if (options.startDate) evidence = evidence.filter(event => event.countDate && event.countDate >= options.startDate);
        if (options.endDate) evidence = evidence.filter(event => event.countDate && event.countDate <= options.endDate);
        if (options.clientLocations) evidence = evidence.filter(event => options.clientLocations.has(event.location));
        if (options.mode === 'evidence') {
            stats.operationalCount = evidence.length;
            lastStats = stats;
            return { events: evidence.sort((a, b) => b.timestamp.localeCompare(a.timestamp)), stats };
        }

        const groups = new Map();
        evidence.forEach(event => {
            if (!groups.has(event.operationalKey)) groups.set(event.operationalKey, []);
            groups.get(event.operationalKey).push(event);
        });
        const operational = [];
        groups.forEach(group => {
            group = collapseMirroredRepresentations(group, stats);
            const clusters = [];
            group.forEach(event => {
                const cluster = clusters.find(items => areEventsAggregatable(items[0], event));
                if (cluster) cluster.push(event); else clusters.push([event]);
            });
            const candidates = clusters.map(items => {
                if (items.length === 1) return items[0];
                stats.aggregatedGroups += 1;
                stats.aggregatedEventsCollapsed += items.length - 1;
                return aggregateEvents(items);
            });
            if (candidates.length > 1) {
                const conflictGroupId = `conflict-${group[0].operationalKey}`;
                const fingerprints = candidates.map(event => event.eventFingerprint);
                stats.conflictGroups += 1;
                stats.conflictEvents += candidates.length;
                candidates.forEach(event => operational.push({
                    ...event,
                    hasConflict: true,
                    conflictGroupId,
                    conflictReason: 'Misma fecha/ubicacion/UPC con evidencia no acumulable',
                    conflictEvents: fingerprints,
                    conflictCount: candidates.length
                }));
            } else operational.push(candidates[0]);
        });
        stats.operationalCount = operational.length;
        lastStats = stats;
        return { events: operational.sort((a, b) => b.timestamp.localeCompare(a.timestamp)), stats };
    }

    function getUnifiedCountEvents(options = {}) { return buildProjection(options).events; }
    function getUnifiedCountStats(options = {}) { return buildProjection(options).stats; }
    function getLastStats() { return lastStats ? { ...lastStats } : null; }
    function getStoredPeriod() {
        return { startDate: localStorage.getItem('kpiStartDate') || '', endDate: localStorage.getItem('kpiEndDate') || '' };
    }
    function getStoredScope(defaultScope = 'GLOBAL') {
        const scope = localStorage.getItem('khaironCountScope');
        return scope === 'CLIENTE_ACTUAL' || scope === 'GLOBAL' ? scope : defaultScope;
    }

    globalThis.KhaironCountData = {
        normalizeCountStatus, normalizeCountEvent, parseCountDate,
        getUnifiedCountEvents, getUnifiedCountStats, getLastStats,
        buildCountFingerprint, buildOperationalKey, isCountEventVoided,
        areEventsAggregatable, getStoredPeriod, getStoredScope,
        readStoredArray, dateKey
    };
})();
