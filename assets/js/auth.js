(function () {
    const USERS_KEY = 'khaironUsers';
    const ROLES_KEY = 'khaironRoles';
    const SESSION_KEY = 'currentUser';
    const USER_SEED_KEY = 'khaironUserSeedVersion';
    const USER_SEED_VERSION = 'usuarios-khairon-2026-07-03-v1';

    const modules = [
        { key: 'dashboard', label: 'Dashboard', page: 'dashboard.html', icon: 'fa-chart-line', group: 'Inventarios' },
        { key: 'inventory', label: 'Carga Inventario', page: 'inventory.html', icon: 'fa-file-import', group: 'Inventarios' },
        { key: 'locations', label: 'Consulta Inventario', page: 'locations.html', icon: 'fa-location-dot', group: 'Inventarios' },
        { key: 'scanner', label: 'Barrido Fisico', page: 'scanner.html', icon: 'fa-barcode', group: 'Inventarios' },
        { key: 'analytics', label: 'Analisis', page: 'analytics.html', icon: 'fa-chart-column', group: 'Inventarios' },
        { key: 'reports', label: 'Reportes', page: 'reports.html', icon: 'fa-file-export', group: 'Inventarios' },
        { key: 'progress', label: 'Avance', page: 'progress.html', icon: 'fa-list-check', group: 'Inventarios' },
        { key: 'heatmap', label: 'Heatmap', page: 'heatmap.html', icon: 'fa-fire', group: 'Inventarios' },
        { key: 'validation', label: 'Validacion', page: 'validation.html', icon: 'fa-clipboard-check', group: 'Operaciones' },
        { key: 'users', label: 'Usuarios', page: 'users.html', icon: 'fa-users', group: 'Administracion' }
    ];

    const operationalModules = modules
        .filter(module => module.key !== 'users')
        .map(module => module.key);

    const defaultRoles = [
        {
            id: 'administrador',
            name: 'Administrador',
            description: 'Administracion y operacion completa',
            permissions: modules.map(module => module.key),
            system: true
        },
        {
            id: 'supervisor',
            name: 'Supervisor',
            description: 'Acceso operativo provisional; pendiente de ajuste definitivo',
            permissions: operationalModules,
            system: true
        },
        {
            id: 'validador',
            name: 'Validador',
            description: 'Validacion y consulta provisional; pendiente de ajuste definitivo',
            permissions: ['dashboard', 'locations', 'analytics', 'reports', 'progress', 'validation'],
            system: true
        },
        {
            id: 'consultor',
            name: 'Consultor',
            description: 'Consulta y reportes provisional; pendiente de ajuste definitivo',
            permissions: ['dashboard', 'locations', 'analytics', 'reports', 'progress', 'heatmap'],
            system: true
        },
        {
            id: 'recibo',
            name: 'Recibo',
            description: 'Carga y barrido provisional; pendiente de ajuste definitivo',
            permissions: ['inventory', 'locations', 'scanner', 'progress'],
            system: true
        },
        {
            id: 'tasker',
            name: 'Tasker',
            description: 'Operacion provisional; pendiente de ajuste definitivo',
            permissions: ['inventory', 'locations', 'scanner', 'progress'],
            system: true
        },
        {
            id: 'inventarios',
            name: 'Inventarios',
            description: 'Operacion de inventarios provisional; pendiente de ajuste definitivo',
            permissions: operationalModules,
            system: true
        }
    ];

    const defaultUsers = [
        { id: 'usr-cgarci', username: 'cgarci', password: 'CGARCI#2026', name: 'Cecilia Garcia', roleId: 'validador', active: true },
        { id: 'usr-rbaldi', username: 'rbaldi', password: 'RBALDI#2026', name: 'Rubi Baldivia', roleId: 'validador', active: true },
        { id: 'usr-npelca', username: 'npelca', password: 'NPELCA#2026', name: 'Naomi Pelcastre', roleId: 'validador', active: true },
        { id: 'usr-mrange', username: 'mrange', password: 'MRANGE#2026', name: 'Melani Rangel', roleId: 'validador', active: true },
        { id: 'usr-ddomin', username: 'ddomin', password: 'DDOMIN#2026', name: 'David Dominguez', roleId: 'administrador', active: true },
        { id: 'usr-aville', username: 'aville', password: 'AVILLE#2026', name: 'Alberto Villegas', roleId: 'administrador', active: true },
        { id: 'usr-storre', username: 'storre', password: 'STORRE#2026', name: 'Sebastian Torres', roleId: 'administrador', active: true },
        { id: 'usr-areyes', username: 'areyes', password: 'AREYES#2026', name: 'Alberto Reyes', roleId: 'consultor', active: true },
        { id: 'usr-mmondr', username: 'mmondr', password: 'MMONDR#2026', name: 'Marina Mondragon', roleId: 'consultor', active: true },
        { id: 'usr-gtorre', username: 'gtorre', password: 'GTORRE#2026', name: 'Gerardo Torres', roleId: 'consultor', active: true },
        { id: 'usr-eroa', username: 'eroa', password: 'EROA#2026', name: 'Edgar Roa', roleId: 'consultor', active: true },
        { id: 'usr-dvega', username: 'dvega', password: 'DVEGA#2026', name: 'Diana Vega', roleId: 'recibo', active: true },
        { id: 'usr-emoral', username: 'emoral', password: 'EMORAL#2026', name: 'Eduardo Morales', roleId: 'tasker', active: true },
        { id: 'usr-oolver', username: 'oolver', password: 'OOLVER#2026', name: 'Orlando Olvera', roleId: 'tasker', active: true },
        { id: 'usr-jtorre', username: 'jtorre', password: 'JTORRE#2026', name: 'Julia Torres', roleId: 'inventarios', active: true },
        { id: 'usr-fcuell', username: 'fcuell', password: 'FCUELL#2026', name: 'Fernanda Cuellar', roleId: 'inventarios', active: true },
        { id: 'usr-kjimen', username: 'kjimen', password: 'KJIMEN#2026', name: 'Katherine Jimenez', roleId: 'supervisor', active: true },
        { id: 'usr-janaya', username: 'janaya', password: 'JANAYA#2026', name: 'Juan Anaya', roleId: 'recibo', active: true },
        { id: 'usr-gbenit', username: 'gbenit', password: 'GBENIT#2026', name: 'Greco Benitez', roleId: 'supervisor', active: true },
        { id: 'usr-rbrise', username: 'rbrise', password: 'RBRISE#2026', name: 'Roberto Brise\u00f1o', roleId: 'supervisor', active: true },
        { id: 'usr-amonti', username: 'amonti', password: 'AMONTI#2026', name: 'Alan Montiel', roleId: 'supervisor', active: true }
    ];

    function readArray(key) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return Array.isArray(value) ? value : [];
        }
        catch {
            return [];
        }
    }

    function initialize() {
        if (localStorage.getItem(USER_SEED_KEY) !== USER_SEED_VERSION) {
            saveRoles(defaultRoles);
            saveUsers(defaultUsers);
            localStorage.removeItem(SESSION_KEY);
            localStorage.setItem(USER_SEED_KEY, USER_SEED_VERSION);
            return;
        }
        if (!readArray(ROLES_KEY).length) saveRoles(defaultRoles);
        if (!readArray(USERS_KEY).length) saveUsers(defaultUsers);
    }

    function getUsers() {
        initialize();
        return readArray(USERS_KEY);
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getRoles() {
        initialize();
        return readArray(ROLES_KEY);
    }

    function saveRoles(roles) {
        localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    }

    function getRole(roleId) {
        return getRoles().find(role => role.id === roleId) || null;
    }

    function sanitizeUser(user) {
        if (!user) return null;
        const role = getRole(user.roleId);
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            roleId: user.roleId,
            roleName: role?.name || 'Sin rol',
            permissions: role?.permissions || [],
            active: user.active !== false
        };
    }

    function authenticate(username, password) {
        const normalizedUsername = String(username || '').trim().toLowerCase();
        const user = getUsers().find(item =>
            item.username.toLowerCase() === normalizedUsername &&
            item.password === password
        );

        if (!user) return { ok: false, message: 'Usuario o contrasena incorrectos' };
        if (user.active === false) return { ok: false, message: 'El usuario esta inactivo' };

        const session = sanitizeUser(user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return { ok: true, user: session };
    }

    function authorizeAdministrator(username, password) {
        const normalizedUsername = String(username || '').trim().toLowerCase();
        const user = getUsers().find(item =>
            item.username.toLowerCase() === normalizedUsername &&
            item.password === String(password || '')
        );

        if (!user) return { ok: false, message: 'Credenciales de Administrador incorrectas' };
        if (user.active === false) return { ok: false, message: 'El Administrador esta inactivo' };
        if (user.roleId !== 'administrador') {
            return { ok: false, message: 'La autorizacion requiere el rol Administrador' };
        }

        return { ok: true, user: sanitizeUser(user) };
    }

    function getCurrentUser() {
        try {
            const stored = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (!stored?.username) return null;

            const user = getUsers().find(item => item.username === stored.username);
            if (!user || user.active === false) {
                logout(false);
                return null;
            }

            const session = sanitizeUser(user);
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return session;
        }
        catch {
            return null;
        }
    }

    function hasPermission(moduleKey, user = getCurrentUser()) {
        return Boolean(user?.permissions?.includes(moduleKey));
    }

    function moduleFromPage(page) {
        return modules.find(module => module.page === page) || null;
    }

    function getFirstAllowedPage(user = getCurrentUser()) {
        return modules.find(module => hasPermission(module.key, user))?.page || null;
    }

    function requirePage() {
        const page = window.location.pathname.split('/').pop();
        if (!page || page === 'index.html') return true;

        const user = getCurrentUser();
        if (!user) {
            window.location.replace('../index.html');
            return false;
        }

        const module = moduleFromPage(page);
        if (!module || hasPermission(module.key, user)) return true;

        const allowedPage = getFirstAllowedPage(user);
        sessionStorage.setItem('khaironAccessMessage', `Sin permiso para acceder a ${module.label}`);
        window.location.replace(allowedPage || '../index.html');
        return false;
    }

    function logout(redirect = true) {
        localStorage.removeItem(SESSION_KEY);
        if (redirect) window.location.href = '../index.html';
    }

    function createUser(input) {
        const users = getUsers();
        const username = String(input.username || '').trim().toLowerCase();
        const password = String(input.password || '');

        if (!username || !input.name || !password || !input.roleId) {
            return { ok: false, message: 'Completa nombre, usuario, contrasena y rol' };
        }
        if (users.some(user => user.username.toLowerCase() === username)) {
            return { ok: false, message: 'El usuario ya existe' };
        }
        if (!getRole(input.roleId)) return { ok: false, message: 'Rol no valido' };

        users.push({
            id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
            username,
            password,
            name: String(input.name).trim(),
            roleId: input.roleId,
            active: input.active !== false
        });
        saveUsers(users);
        return { ok: true };
    }

    function updateUser(userId, changes) {
        const users = getUsers();
        const user = users.find(item => item.id === userId);
        if (!user) return { ok: false, message: 'Usuario no encontrado' };

        if (changes.name !== undefined) user.name = String(changes.name).trim();
        if (changes.roleId !== undefined && getRole(changes.roleId)) user.roleId = changes.roleId;
        if (changes.active !== undefined) user.active = Boolean(changes.active);
        if (changes.password) user.password = String(changes.password);

        saveUsers(users);
        return { ok: true };
    }

    function updateRolePermissions(roleId, permissions) {
        const roles = getRoles();
        const role = roles.find(item => item.id === roleId);
        if (!role) return { ok: false, message: 'Rol no encontrado' };

        role.permissions = [...new Set(permissions)]
            .filter(key => modules.some(module => module.key === key));
        if (role.id === 'administrador' && !role.permissions.includes('users')) {
            role.permissions.push('users');
        }
        saveRoles(roles);
        return { ok: true };
    }

    initialize();

    window.KhaironAuth = {
        modules,
        authenticate,
        authorizeAdministrator,
        getUsers,
        getRoles,
        getRole,
        getCurrentUser,
        hasPermission,
        getFirstAllowedPage,
        requirePage,
        logout,
        createUser,
        updateUser,
        updateRolePermissions
    };

    if (window.location.pathname.includes('/modules/')) {
        requirePage();
    }
})();
