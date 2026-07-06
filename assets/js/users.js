document.addEventListener('DOMContentLoaded', () => {
    if (!KhaironAuth.requirePage()) return;

    const form = document.getElementById('userForm');
    const roleMatrix = document.getElementById('roleMatrix');
    const userTable = document.getElementById('usersTableBody');

    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const result = KhaironAuth.createUser({
            name: data.get('name'),
            username: data.get('username'),
            password: data.get('password'),
            roleId: data.get('roleId'),
            active: true
        });

        showMessage(result.ok ? 'Usuario creado correctamente' : result.message, result.ok ? 'success' : 'danger');
        if (result.ok) {
            form.reset();
            renderAll();
        }
    });

    userTable.addEventListener('change', event => {
        const row = event.target.closest('[data-user-id]');
        if (!row) return;

        const userId = row.dataset.userId;
        if (event.target.matches('[data-user-role]')) {
            KhaironAuth.updateUser(userId, { roleId: event.target.value });
        }
        if (event.target.matches('[data-user-active]')) {
            KhaironAuth.updateUser(userId, { active: event.target.checked });
        }
        renderAll();
    });

    userTable.addEventListener('click', event => {
        const button = event.target.closest('[data-reset-password]');
        if (!button) return;

        const password = prompt('Nueva contrasena temporal (minimo 6 caracteres)');
        if (password === null) return;
        if (password.length < 6) {
            showMessage('La contrasena debe tener al menos 6 caracteres', 'danger');
            return;
        }

        KhaironAuth.updateUser(button.dataset.resetPassword, { password });
        showMessage('Contrasena actualizada', 'success');
    });

    roleMatrix.addEventListener('change', event => {
        if (!event.target.matches('[data-role-permission]')) return;
        const roleId = event.target.dataset.roleId;
        const checked = [...roleMatrix.querySelectorAll(`[data-role-id="${roleId}"]`)]
            .filter(input => input.checked)
            .map(input => input.value);
        KhaironAuth.updateRolePermissions(roleId, checked);
        showMessage('Permisos actualizados', 'success');
        renderAll();
    });

    function renderAll() {
        renderSummary();
        renderRoleOptions();
        renderUsers();
        renderRoles();
    }

    function renderSummary() {
        const users = KhaironAuth.getUsers();
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('activeUsers').textContent = users.filter(user => user.active !== false).length;
        document.getElementById('totalRoles').textContent = KhaironAuth.getRoles().length;
    }

    function renderRoleOptions() {
        const select = document.getElementById('newUserRole');
        const current = select.value;
        select.replaceChildren();
        KhaironAuth.getRoles().forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            select.appendChild(option);
        });
        if (current) select.value = current;
    }

    function renderUsers() {
        const roles = KhaironAuth.getRoles();
        const currentUser = KhaironAuth.getCurrentUser();
        userTable.replaceChildren();

        KhaironAuth.getUsers().forEach(user => {
            const row = userTable.insertRow();
            row.dataset.userId = user.id;

            [user.name, user.username].forEach(value => {
                const cell = row.insertCell();
                cell.textContent = value;
            });

            const roleCell = row.insertCell();
            const roleSelect = document.createElement('select');
            roleSelect.className = 'form-select form-select-sm';
            roleSelect.dataset.userRole = '';
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                option.selected = role.id === user.roleId;
                roleSelect.appendChild(option);
            });
            roleSelect.disabled = user.id === currentUser.id;
            roleCell.appendChild(roleSelect);

            const statusCell = row.insertCell();
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.className = 'form-check-input';
            toggle.checked = user.active !== false;
            toggle.dataset.userActive = '';
            toggle.disabled = user.id === currentUser.id;
            toggle.setAttribute('aria-label', `Usuario ${user.name} activo`);
            statusCell.appendChild(toggle);
            statusCell.append(` ${toggle.checked ? 'Activo' : 'Inactivo'}`);

            const actionCell = row.insertCell();
            const resetButton = document.createElement('button');
            resetButton.type = 'button';
            resetButton.className = 'btn btn-sm btn-outline-secondary';
            resetButton.dataset.resetPassword = user.id;
            resetButton.title = 'Cambiar contrasena';
            resetButton.innerHTML = '<i class="fa-solid fa-key"></i>';
            actionCell.appendChild(resetButton);
        });
    }

    function renderRoles() {
        roleMatrix.replaceChildren();

        KhaironAuth.getRoles().forEach(role => {
            const section = document.createElement('section');
            section.className = 'role-permission-section';
            const heading = document.createElement('div');
            heading.className = 'role-permission-heading';
            heading.innerHTML = '<div><strong></strong><small></small></div><span></span>';
            heading.querySelector('strong').textContent = role.name;
            heading.querySelector('small').textContent = role.description;
            heading.querySelector('span').textContent = `${role.permissions.length} modulos`;
            section.appendChild(heading);

            const grid = document.createElement('div');
            grid.className = 'permission-grid';
            KhaironAuth.modules.forEach(module => {
                const label = document.createElement('label');
                label.className = 'permission-option';
                const input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'form-check-input';
                input.value = module.key;
                input.checked = role.permissions.includes(module.key);
                input.dataset.rolePermission = '';
                input.dataset.roleId = role.id;
                input.disabled = role.id === 'administrador' && module.key === 'users';
                label.append(input, document.createTextNode(module.label));
                grid.appendChild(label);
            });
            section.appendChild(grid);
            roleMatrix.appendChild(section);
        });
    }

    function showMessage(message, type) {
        const box = document.getElementById('usersMessage');
        box.className = `users-message ${type}`;
        box.textContent = message;
        box.hidden = false;
        clearTimeout(showMessage.timeout);
        showMessage.timeout = setTimeout(() => { box.hidden = true; }, 3500);
    }

    renderAll();
});
