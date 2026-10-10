document.addEventListener('DOMContentLoaded', function () {
    initApp();
});

function initApp() {
    bindSidebar();
    bindHeaderSearch();
    renderAll();
    addSampleDataIfEmpty();
}

function addSampleDataIfEmpty() {
    const db = getDatabase();
    if (!db.empleados.length && !db.sectores.length && !db.grupos.length) {
        saveDatabase(JSON.parse(JSON.stringify(defaultData)));
    }
    renderAll();
}

function bindSidebar() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            showMenu(this.dataset.menu);
        });
    });

    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', function () {
            document.getElementById('sidebar').classList.toggle('active');
        });
    }
}

function bindHeaderSearch() {
    const headerSearch = document.getElementById('headerSearch');
    if (headerSearch) {
        headerSearch.addEventListener('input', function () {
            const value = this.value.trim().toLowerCase();
            if (!value) {
                renderBusqueda();
                return;
            }
            const db = getDatabase();
            const filtered = db.empleados.filter(emp => {
                const fullName = `${emp.nombre} ${emp.apellido}`.toLowerCase();
                const sector = obtenerSectorPorId(emp.sectorId)?.nombre?.toLowerCase() || '';
                const grupo = obtenerGrupoPorId(emp.grupoId)?.nombre?.toLowerCase() || '';
                return fullName.includes(value) || sector.includes(value) || grupo.includes(value) || emp.documento.includes(value);
            });
            renderBusquedaTable(filtered);
        });
    }
}

function showMenu(menu) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const target = document.getElementById(menu);
    if (target) target.classList.add('active');

    const activeNav = document.querySelector(`.nav-link[data-menu="${menu}"]`)?.closest('.nav-item');
    if (activeNav) activeNav.classList.add('active');

    const titleNode = document.querySelector('.page-title');
    if (titleNode) titleNode.textContent = getMenuTitle(menu);

    if (menu === 'dashboard') renderDashboard();
    if (menu === 'empleados') renderEmpleados();
    if (menu === 'sectores') renderSectores();
    if (menu === 'grupos') renderGrupos();
    if (menu === 'codigos') renderCodigos();
    if (menu === 'reportes') renderReportes();
    if (menu === 'busqueda') renderBusqueda();
}

function getMenuTitle(menu) {
    const titles = {
        dashboard: 'Dashboard',
        empleados: 'Gestión de Personal',
        sectores: 'Gestión de Sectores',
        grupos: 'Gestión de Grupos',
        codigos: 'Códigos de Barras',
        reportes: 'Reportes',
        busqueda: 'Búsqueda de Personal',
        configuracion: 'Configuración'
    };
    return titles[menu] || 'Dashboard';
}

function renderAll() {
    renderDashboard();
    renderEmpleados();
    renderSectores();
    renderGrupos();
    renderCodigos();
    renderReportes();
    renderBusqueda();
    loadSelects();
}

function renderDashboard() {
    const db = getDatabase();
    const totalEmpleados = document.getElementById('totalEmpleados');
    const totalSectores = document.getElementById('totalSectores');
    const totalGrupos = document.getElementById('totalGrupos');
    const totalCodigos = document.getElementById('totalCodigos');
    if (totalEmpleados) totalEmpleados.textContent = db.empleados.length;
    if (totalSectores) totalSectores.textContent = db.sectores.length;
    if (totalGrupos) totalGrupos.textContent = db.grupos.length;
    if (totalCodigos) totalCodigos.textContent = db.codigos.length;

    const recentList = document.getElementById('ultimosEmpleados');
    if (recentList) {
        const lastEmployees = [...db.empleados].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
        if (!lastEmployees.length) {
            recentList.innerHTML = '<p class="empty-state">No hay empleados registrados</p>';
        } else {
            recentList.innerHTML = lastEmployees.map(emp => {
                const sector = obtenerSectorPorId(emp.sectorId)?.nombre || 'Sin sector';
                return `
                    <div class="recent-item">
                        <div>
                            <strong>${emp.nombre} ${emp.apellido}</strong>
                            <small>${sector}</small>
                        </div>
                        <span class="badge ${emp.estado === 'activo' ? 'active' : 'inactive'}">${emp.estado}</span>
                    </div>
                `;
            }).join('');
        }
    }

    const sectorList = document.getElementById('personalPorSector');
    if (sectorList) {
        const countBySector = {};
        db.empleados.forEach(emp => {
            const sectorName = obtenerSectorPorId(emp.sectorId)?.nombre || 'Sin sector';
            countBySector[sectorName] = (countBySector[sectorName] || 0) + 1;
        });
        const entries = Object.entries(countBySector);
        if (!entries.length) {
            sectorList.innerHTML = '<p class="empty-state">No hay sectores registrados</p>';
        } else {
            sectorList.innerHTML = entries.map(([name, count]) => `
                <div class="sector-item">
                    <div>
                        <strong>${name}</strong>
                        <small>${count} empleado(s)</small>
                    </div>
                    <span class="badge active">${count}</span>
                </div>
            `).join('');
        }
    }
}

function renderEmpleados() {
    const db = getDatabase();
    const nameFilter = document.getElementById('filtroNombre')?.value.trim().toLowerCase() || '';
    const sectorFilter = document.getElementById('filtroSector')?.value || '';
    const grupoFilter = document.getElementById('filtroGrupo')?.value || '';

    const filtered = db.empleados.filter(emp => {
        const nameMatch = !nameFilter || `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(nameFilter);
        const sectorMatch = !sectorFilter || String(emp.sectorId) === String(sectorFilter);
        const grupoMatch = !grupoFilter || String(emp.grupoId) === String(grupoFilter);
        return nameMatch && sectorMatch && grupoMatch;
    });

    const tbody = document.getElementById('tbodyEmpleados');
    if (!tbody) return;

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay empleados registrados</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(emp => {
        const sector = obtenerSectorPorId(emp.sectorId)?.nombre || 'Sin sector';
        const grupo = obtenerGrupoPorId(emp.grupoId)?.nombre || 'Sin grupo';
        return `
            <tr>
                <td>${emp.codigo}</td>
                <td>${emp.nombre} ${emp.apellido}</td>
                <td>${emp.documento}</td>
                <td>${sector}</td>
                <td>${grupo}</td>
                <td>${emp.cargo}</td>
                <td><span class="badge ${emp.estado === 'activo' ? 'active' : 'inactive'}">${emp.estado}</span></td>
                <td>
                    <div class="action-group">
                        <button class="icon-action view" title="Ver perfil" type="button" onclick="verPerfil(${emp.id})"><i class="fas fa-eye"></i></button>
                        <button class="icon-action edit" title="Editar" type="button" onclick="editarEmpleado(${emp.id})"><i class="fas fa-edit"></i></button>
                        <button class="icon-action delete" title="Eliminar" type="button" onclick="eliminarEmpleado(${emp.id})"><i class="fas fa-trash"></i></button>
                        <button class="icon-action barcode" title="Generar código" type="button" onclick="generarCodigoDesdeEmpleado(${emp.id})"><i class="fas fa-barcode"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderSectores() {
    const db = getDatabase();
    const container = document.getElementById('sectoresGrid');
    if (!container) return;

    if (!db.sectores.length) {
        container.innerHTML = '<p class="empty-state">No hay sectores registrados</p>';
        return;
    }

    container.innerHTML = db.sectores.map(sector => {
        const empleadosCount = db.empleados.filter(emp => Number(emp.sectorId) === Number(sector.id)).length;
        return `
            <div class="sector-card">
                <h3>${sector.nombre}</h3>
                <p>${sector.descripcion || 'Sin descripción'}</p>
                <p><strong>Jefe:</strong> ${sector.jefe || 'No asignado'}</p>
                <p><strong>Empleados:</strong> ${empleadosCount}</p>
                <div class="action-group">
                    <button class="icon-action edit" title="Editar" type="button" onclick="editarSector(${sector.id})"><i class="fas fa-edit"></i></button>
                    <button class="icon-action delete" title="Eliminar" type="button" onclick="eliminarSector(${sector.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function renderGrupos() {
    const db = getDatabase();
    const tbody = document.getElementById('tbodyGrupos');
    if (!tbody) return;

    const sectorFilter = document.getElementById('filtroSectorGrupos')?.value || '';
    const filtered = db.grupos.filter(grupo => !sectorFilter || String(grupo.sectorId) === String(sectorFilter));

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay grupos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(grupo => {
        const sector = obtenerSectorPorId(grupo.sectorId)?.nombre || 'Sin sector';
        const integrantes = db.empleados.filter(emp => Number(emp.grupoId) === Number(grupo.id)).length;
        return `
            <tr>
                <td>${grupo.nombre}</td>
                <td>${sector}</td>
                <td>${integrantes}</td>
                <td>${grupo.responsable || 'Sin asignar'}</td>
                <td>
                    <div class="action-group">
                        <button class="icon-action edit" title="Editar" type="button" onclick="editarGrupo(${grupo.id})"><i class="fas fa-edit"></i></button>
                        <button class="icon-action delete" title="Eliminar" type="button" onclick="eliminarGrupo(${grupo.id})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderCodigos() {
    const db = getDatabase();
    const container = document.getElementById('codigosGrid');
    if (!container) return;

    const codeFilter = document.getElementById('filtroCodigoBarras')?.value.trim().toLowerCase() || '';
    const empFilter = document.getElementById('filtroEmpleadoCodigo')?.value || '';

    const filtered = db.codigos.filter(codigo => {
        const empleado = obtenerEmpleadoPorId(codigo.empleadoId);
        const matchesCode = !codeFilter || codigo.codigo.toLowerCase().includes(codeFilter) || `${empleado?.nombre || ''} ${empleado?.apellido || ''}`.toLowerCase().includes(codeFilter);
        const matchesEmpleado = !empFilter || String(codigo.empleadoId) === String(empFilter);
        return matchesCode && matchesEmpleado;
    });

    if (!filtered.length) {
        container.innerHTML = '<p class="empty-state">No hay códigos de barras generados</p>';
        return;
    }

    container.innerHTML = filtered.map(codigo => {
        const empleado = obtenerEmpleadoPorId(codigo.empleadoId);
        return `
            <div class="codigo-card">
                <div class="codigo-meta">
                    <span>${empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Empleado'}</span>
                    <span>${codigo.tipo}</span>
                </div>
                <div class="barcode-box" id="barcode-box-${codigo.id}"></div>
                <div class="action-group" style="justify-content:center; margin-top:10px;">
                    <button class="icon-action barcode" title="Imprimir" type="button" onclick="imprimirCodigo(${codigo.id})"><i class="fas fa-print"></i></button>
                    <button class="icon-action delete" title="Eliminar" type="button" onclick="eliminarCodigo(${codigo.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');

    filtered.forEach(codigo => {
        const box = document.getElementById(`barcode-box-${codigo.id}`);
        if (!box) return;
        if (codigo.tipo === 'code128' || codigo.tipo === 'ambos') {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '220');
            svg.setAttribute('height', '80');
            JsBarcode(svg, codigo.codigo, { format: 'CODE128', displayValue: true, fontSize: 12, margin: 10, width: 2, height: 50 });
            box.innerHTML = '';
            box.appendChild(svg);
        }
        if (codigo.tipo === 'qr' || codigo.tipo === 'ambos') {
            const qrWrap = document.createElement('div');
            qrWrap.style.marginTop = '12px';
            box.appendChild(qrWrap);
            QRCode.toCanvas(qrWrap, codigo.codigo, { width: 110 }, function (error) {
                if (error) console.error(error);
            });
        }
    });
}

function renderReportes() {
    const db = getDatabase();
    const activos = db.empleados.filter(e => e.estado === 'activo').length;
    const inactivos = db.empleados.filter(e => e.estado === 'inactivo').length;

    const reportActivos = document.getElementById('reporteActivos');
    const reportInactivos = document.getElementById('reporteInactivos');
    if (reportActivos) reportActivos.textContent = activos;
    if (reportInactivos) reportInactivos.textContent = inactivos;

    const sectorCount = {};
    db.empleados.forEach(emp => {
        const sectorName = obtenerSectorPorId(emp.sectorId)?.nombre || 'Sin sector';
        sectorCount[sectorName] = (sectorCount[sectorName] || 0) + 1;
    });
    const sectorTop = Object.entries(sectorCount).sort((a, b) => b[1] - a[1])[0];
    const sectorReport = document.getElementById('reportePorSector');
    if (sectorReport) sectorReport.textContent = sectorTop ? `${sectorTop[0]} (${sectorTop[1]})` : '0';

    const groupCount = {};
    db.empleados.forEach(emp => {
        const groupName = obtenerGrupoPorId(emp.grupoId)?.nombre || 'Sin grupo';
        groupCount[groupName] = (groupCount[groupName] || 0) + 1;
    });
    const groupTop = Object.entries(groupCount).sort((a, b) => b[1] - a[1])[0];
    const groupReport = document.getElementById('reportePorGrupo');
    if (groupReport) groupReport.textContent = groupTop ? `${groupTop[0]} (${groupTop[1]})` : '0';

    const ingresoCount = {};
    db.empleados.forEach(emp => {
        if (!emp.fechaIngreso) return;
        const mes = new Date(emp.fechaIngreso).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        ingresoCount[mes] = (ingresoCount[mes] || 0) + 1;
    });
    const ingresoTop = Object.entries(ingresoCount).sort((a, b) => b[1] - a[1])[0];
    const ingresoReport = document.getElementById('reporteIngresos');
    if (ingresoReport) ingresoReport.textContent = ingresoTop ? `${ingresoTop[0]} (${ingresoTop[1]})` : '-';

    const estadisticasDiv = document.getElementById('estadisticasDiv');
    if (estadisticasDiv) {
        estadisticasDiv.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon stat-1"><i class="fas fa-users"></i></div>
                    <div class="stat-content">
                        <h3>Empleados activos</h3>
                        <p class="stat-number">${activos}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-2"><i class="fas fa-user-slash"></i></div>
                    <div class="stat-content">
                        <h3>Empleados inactivos</h3>
                        <p class="stat-number">${inactivos}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-3"><i class="fas fa-building"></i></div>
                    <div class="stat-content">
                        <h3>Sectores</h3>
                        <p class="stat-number">${db.sectores.length}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon stat-4"><i class="fas fa-sitemap"></i></div>
                    <div class="stat-content">
                        <h3>Grupos</h3>
                        <p class="stat-number">${db.grupos.length}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderBusqueda() {
    const db = getDatabase();
    renderBusquedaTable(db.empleados);
}

function renderBusquedaTable(data) {
    const tbody = document.getElementById('tbodyBusqueda');
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron resultados</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(emp => {
        const sector = obtenerSectorPorId(emp.sectorId)?.nombre || 'Sin sector';
        const grupo = obtenerGrupoPorId(emp.grupoId)?.nombre || 'Sin grupo';
        return `
            <tr>
                <td>${emp.codigo}</td>
                <td>${emp.nombre} ${emp.apellido}</td>
                <td>${emp.documento}</td>
                <td>${sector}</td>
                <td>${grupo}</td>
                <td>${emp.cargo}</td>
                <td><span class="badge ${emp.estado === 'activo' ? 'active' : 'inactive'}">${emp.estado}</span></td>
                <td>
                    <div class="action-group">
                        <button class="icon-action view" title="Ver perfil" type="button" onclick="verPerfil(${emp.id})"><i class="fas fa-eye"></i></button>
                        <button class="icon-action barcode" title="Imprimir" type="button" onclick="imprimirCodigoPorEmpleado(${emp.id})"><i class="fas fa-print"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function loadSelects() {
    const db = getDatabase();

    const sectorOptions = db.sectores.map(sector => `<option value="${sector.id}">${sector.nombre}</option>`).join('');

    const sectorSelects = ['filtroSector', 'filtroSectorGrupos', 'busquedaSector', 'empleadoSector', 'grupoSector'];
    sectorSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const current = select.value;
        const prefix = id === 'empleadoSector' || id === 'grupoSector' ? '<option value="">Seleccionar...</option>' : '<option value="">-- Todos los Sectores --</option>';
        select.innerHTML = prefix + sectorOptions;
        if (current) select.value = current;
    });

    const groupOptions = db.grupos.map(grupo => `<option value="${grupo.id}">${grupo.nombre}</option>`).join('');
    const groupSelects = ['filtroGrupo', 'busquedaGrupo', 'empleadoGrupo'];
    groupSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">Seleccionar...</option>' + groupOptions;
        if (current) select.value = current;
    });

    const codigoEmpleado = document.getElementById('codigoEmpleado');
    if (codigoEmpleado) {
        codigoEmpleado.innerHTML = '<option value="">Seleccionar...</option>' + db.empleados.map(emp => `<option value="${emp.id}">${emp.nombre} ${emp.apellido}</option>`).join('');
    }

    const filtroEmpleadoCodigo = document.getElementById('filtroEmpleadoCodigo');
    if (filtroEmpleadoCodigo) {
        filtroEmpleadoCodigo.innerHTML = '<option value="">-- Seleccionar Empleado --</option>' + db.empleados.map(emp => `<option value="${emp.id}">${emp.nombre} ${emp.apellido}</option>`).join('');
    }
}

function openEmpleadoModal(employeeId = null) {
    const modal = document.getElementById('modalEmpleado');
    const title = document.getElementById('modalEmpleadoTitle');
    const form = document.getElementById('formEmpleado');
    form.reset();
    document.getElementById('empleadoId').value = '';

    if (employeeId) {
        const employee = obtenerEmpleadoPorId(employeeId);
        if (!employee) return;
        document.getElementById('empleadoId').value = employee.id;
        document.getElementById('empleadoNombre').value = employee.nombre;
        document.getElementById('empleadoApellido').value = employee.apellido;
        document.getElementById('empleadoDocumento').value = employee.documento;
        document.getElementById('empleadoTipoDoc').value = employee.tipoDocumento;
        document.getElementById('empleadoSector').value = employee.sectorId;
        document.getElementById('empleadoCargo').value = employee.cargo;
        document.getElementById('empleadoFechaIngreso').value = employee.fechaIngreso;
        document.getElementById('empleadoTurno').value = employee.turno;
        document.getElementById('empleadoEmail').value = employee.email;
        document.getElementById('empleadoTelefono').value = employee.telefono;
        document.getElementById('empleadoEstado').value = employee.estado;
        document.getElementById('empleadoObservaciones').value = employee.observaciones;
        title.textContent = 'Editar Empleado';
        setTimeout(() => {
            const grupoSelect = document.getElementById('empleadoGrupo');
            const db = getDatabase();
            grupoSelect.innerHTML = '<option value="">Seleccionar...</option>' + db.grupos.filter(g => Number(g.sectorId) === Number(employee.sectorId)).map(g => `<option value="${g.id}">${g.nombre}</option>`).join('');
            grupoSelect.value = employee.grupoId;
        }, 0);
    } else {
        title.textContent = 'Registrar Nuevo Empleado';
        document.getElementById('empleadoSector').value = '';
        document.getElementById('empleadoGrupo').innerHTML = '<option value="">Seleccionar...</option>';
    }

    loadSelects();
    modal.classList.add('active');
}

function openSectorModal(sectorId = null) {
    const modal = document.getElementById('modalSector');
    const form = document.getElementById('formSector');
    form.reset();
    const title = document.getElementById('modalSectorTitle');
    document.getElementById('sectorId').value = '';

    if (sectorId) {
        const sector = getDatabase().sectores.find(item => Number(item.id) === Number(sectorId));
        if (!sector) return;
        document.getElementById('sectorId').value = sector.id;
        document.getElementById('sectorNombre').value = sector.nombre;
        document.getElementById('sectorDescripcion').value = sector.descripcion || '';
        document.getElementById('sectorJefe').value = sector.jefe || '';
        title.textContent = 'Editar Sector';
    } else {
        title.textContent = 'Crear Nuevo Sector';
    }

    modal.classList.add('active');
}

function openGrupoModal(grupoId = null) {
    const modal = document.getElementById('modalGrupo');
    const form = document.getElementById('formGrupo');
    form.reset();
    const title = document.getElementById('modalGrupoTitle');
    document.getElementById('grupoId').value = '';
    loadSelects();

    if (grupoId) {
        const grupo = getDatabase().grupos.find(item => Number(item.id) === Number(grupoId));
        if (!grupo) return;
        document.getElementById('grupoId').value = grupo.id;
        document.getElementById('grupoNombre').value = grupo.nombre;
        document.getElementById('grupoSector').value = grupo.sectorId;
        document.getElementById('grupoResponsable').value = grupo.responsable || '';
        document.getElementById('grupoDescripcion').value = grupo.descripcion || '';
        title.textContent = 'Editar Grupo';
    } else {
        title.textContent = 'Crear Nuevo Grupo';
    }

    modal.classList.add('active');
}

function openCodigoModal() {
    const modal = document.getElementById('modalCodigo');
    const form = document.getElementById('formCodigo');
    form.reset();
    const preview = document.getElementById('previsualizacionCodigo');
    if (preview) preview.style.display = 'none';
    loadSelects();
    modal.classList.add('active');
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');

    if (id === 'modalCodigo') {
        const preview = document.getElementById('previsualizacionCodigo');
        if (preview) preview.style.display = 'none';
        const qrContainer = document.getElementById('qrContainer');
        if (qrContainer) {
            qrContainer.style.display = 'none';
            qrContainer.innerHTML = '';
        }
    }

    const formMap = {
        modalEmpleado: 'formEmpleado',
        modalSector: 'formSector',
        modalGrupo: 'formGrupo',
        modalCodigo: 'formCodigo'
    };
    const form = document.getElementById(formMap[id]);
    if (form) form.reset();
}

function guardarEmpleado(event) {
    event.preventDefault();
    const db = getDatabase();
    const employeeId = document.getElementById('empleadoId').value;

    const employeeData = {
        nombre: document.getElementById('empleadoNombre').value.trim(),
        apellido: document.getElementById('empleadoApellido').value.trim(),
        documento: document.getElementById('empleadoDocumento').value.trim(),
        tipoDocumento: document.getElementById('empleadoTipoDoc').value,
        sectorId: Number(document.getElementById('empleadoSector').value),
        grupoId: Number(document.getElementById('empleadoGrupo').value),
        cargo: document.getElementById('empleadoCargo').value.trim(),
        fechaIngreso: document.getElementById('empleadoFechaIngreso').value,
        turno: document.getElementById('empleadoTurno').value,
        email: document.getElementById('empleadoEmail').value.trim(),
        telefono: document.getElementById('empleadoTelefono').value.trim(),
        estado: document.getElementById('empleadoEstado').value,
        observaciones: document.getElementById('empleadoObservaciones').value.trim()
    };

    if (!employeeData.nombre || !employeeData.apellido || !employeeData.documento || !employeeData.sectorId || !employeeData.grupoId || !employeeData.cargo || !employeeData.fechaIngreso) {
        alert('Completa todos los campos obligatorios.');
        return;
    }

    if (employeeId) {
        const index = db.empleados.findIndex(item => Number(item.id) === Number(employeeId));
        if (index >= 0) {
            db.empleados[index] = { ...db.empleados[index], ...employeeData };
        }
    } else {
        db.empleados.push({ id: getNextId(db.empleados), codigo: generarCodigoEmpleado(), ...employeeData });
    }

    saveDatabase(db);
    cerrarModal('modalEmpleado');
    renderAll();
}

function guardarSector(event) {
    event.preventDefault();
    const db = getDatabase();
    const sectorId = document.getElementById('sectorId').value;
    const data = {
        nombre: document.getElementById('sectorNombre').value.trim(),
        descripcion: document.getElementById('sectorDescripcion').value.trim(),
        jefe: document.getElementById('sectorJefe').value.trim()
    };

    if (!data.nombre) {
        alert('El nombre del sector es obligatorio.');
        return;
    }

    if (sectorId) {
        const index = db.sectores.findIndex(item => Number(item.id) === Number(sectorId));
        if (index >= 0) db.sectores[index] = { ...db.sectores[index], ...data };
    } else {
        db.sectores.push({ id: getNextId(db.sectores), ...data });
    }

    saveDatabase(db);
    cerrarModal('modalSector');
    renderAll();
}

function guardarGrupo(event) {
    event.preventDefault();
    const db = getDatabase();
    const grupoId = document.getElementById('grupoId').value;
    const data = {
        nombre: document.getElementById('grupoNombre').value.trim(),
        sectorId: Number(document.getElementById('grupoSector').value),
        responsable: document.getElementById('grupoResponsable').value.trim(),
        descripcion: document.getElementById('grupoDescripcion').value.trim()
    };

    if (!data.nombre || !data.sectorId) {
        alert('El nombre del grupo y el sector son obligatorios.');
        return;
    }

    if (grupoId) {
        const index = db.grupos.findIndex(item => Number(item.id) === Number(grupoId));
        if (index >= 0) db.grupos[index] = { ...db.grupos[index], ...data };
    } else {
        db.grupos.push({ id: getNextId(db.grupos), ...data });
    }

    saveDatabase(db);
    cerrarModal('modalGrupo');
    renderAll();
}

function editarEmpleado(id) { openEmpleadoModal(id); }
function editarSector(id) { openSectorModal(id); }
function editarGrupo(id) { openGrupoModal(id); }

function eliminarEmpleado(id) {
    if (!confirm('¿Deseas eliminar este empleado?')) return;
    const db = getDatabase();
    db.empleados = db.empleados.filter(item => Number(item.id) !== Number(id));
    db.codigos = db.codigos.filter(item => Number(item.empleadoId) !== Number(id));
    saveDatabase(db);
    renderAll();
}

function eliminarSector(id) {
    if (!confirm('¿Deseas eliminar este sector?')) return;
    const db = getDatabase();
    db.sectores = db.sectores.filter(item => Number(item.id) !== Number(id));
    db.grupos = db.grupos.filter(item => Number(item.sectorId) !== Number(id));
    db.empleados = db.empleados.filter(item => Number(item.sectorId) !== Number(id));
    saveDatabase(db);
    renderAll();
}

function eliminarGrupo(id) {
    if (!confirm('¿Deseas eliminar este grupo?')) return;
    const db = getDatabase();
    db.grupos = db.grupos.filter(item => Number(item.id) !== Number(id));
    db.empleados = db.empleados.filter(item => Number(item.grupoId) !== Number(id));
    saveDatabase(db);
    renderAll();
}

function eliminarCodigo(id) {
    if (!confirm('¿Deseas eliminar este código?')) return;
    const db = getDatabase();
    db.codigos = db.codigos.filter(item => Number(item.id) !== Number(id));
    saveDatabase(db);
    renderAll();
}

function generarCodigoDesdeEmpleado(empleadoId) {
    const db = getDatabase();
    const empleado = obtenerEmpleadoPorId(empleadoId);
    if (!empleado) return;

    db.codigos.push({
        id: getNextId(db.codigos),
        empleadoId: Number(empleado.id),
        codigo: empleado.codigo,
        tipo: 'code128',
        fechaCreacion: new Date().toISOString()
    });

    saveDatabase(db);
    renderAll();
}

function generarCodigoBarras(event) {
    event.preventDefault();
    const db = getDatabase();
    const empleadoId = Number(document.getElementById('codigoEmpleado').value);
    const tipo = document.getElementById('codigoTipo').value;
    const empleado = obtenerEmpleadoPorId(empleadoId);

    if (!empleado) {
        alert('Selecciona un empleado válido.');
        return;
    }

    db.codigos.push({
        id: getNextId(db.codigos),
        empleadoId,
        codigo: empleado.codigo,
        tipo,
        fechaCreacion: new Date().toISOString()
    });

    saveDatabase(db);
    cerrarModal('modalCodigo');
    renderAll();
}

function verPerfil(id) {
    const empleado = obtenerEmpleadoPorId(id);
    if (!empleado) return;
    const sector = obtenerSectorPorId(empleado.sectorId)?.nombre || 'Sin sector';
    const grupo = obtenerGrupoPorId(empleado.grupoId)?.nombre || 'Sin grupo';

    const perfilContent = document.getElementById('perfilContent');
    perfilContent.innerHTML = `
        <div class="perfil-card">
            <div class="perfil-header">
                <h3>${empleado.nombre} ${empleado.apellido}</h3>
                <span class="badge ${empleado.estado === 'activo' ? 'active' : 'inactive'}">${empleado.estado}</span>
            </div>
            <div class="perfil-grid">
                <div class="perfil-item"><span>Código</span><strong>${empleado.codigo}</strong></div>
                <div class="perfil-item"><span>Documento</span><strong>${empleado.documento}</strong></div>
                <div class="perfil-item"><span>Sector</span><strong>${sector}</strong></div>
                <div class="perfil-item"><span>Grupo</span><strong>${grupo}</strong></div>
                <div class="perfil-item"><span>Cargo</span><strong>${empleado.cargo}</strong></div>
                <div class="perfil-item"><span>Fecha ingreso</span><strong>${empleado.fechaIngreso}</strong></div>
                <div class="perfil-item"><span>Turno</span><strong>${empleado.turno}</strong></div>
                <div class="perfil-item"><span>Correo</span><strong>${empleado.email || 'No registrado'}</strong></div>
                <div class="perfil-item"><span>Teléfono</span><strong>${empleado.telefono || 'No registrado'}</strong></div>
                <div class="perfil-item"><span>Observaciones</span><strong>${empleado.observaciones || 'Sin observaciones'}</strong></div>
            </div>
        </div>
    `;

    document.getElementById('modalPerfil').classList.add('active');
}

function editarEmpleadoDesdePerfil() {
    const nameText = document.querySelector('#perfilContent .perfil-header h3');
    if (!nameText) return;
    const employeeName = nameText.textContent.trim();
    const db = getDatabase();
    const match = db.empleados.find(emp => `${emp.nombre} ${emp.apellido}` === employeeName);
    if (match) {
        editarEmpleado(match.id);
        cerrarModal('modalPerfil');
    }
}

function limpiarFiltros() {
    document.getElementById('filtroNombre').value = '';
    document.getElementById('filtroSector').value = '';
    document.getElementById('filtroGrupo').value = '';
    renderEmpleados();
}

function limpiarFiltrosCodigos() {
    document.getElementById('filtroCodigoBarras').value = '';
    document.getElementById('filtroEmpleadoCodigo').value = '';
    renderCodigos();
}

function generarReporte(tipo) {
    const db = getDatabase();
    let rows = [];

    switch (tipo) {
        case 'activos': rows = db.empleados.filter(e => e.estado === 'activo'); break;
        case 'inactivos': rows = db.empleados.filter(e => e.estado === 'inactivo'); break;
        case 'sector':
        case 'grupo':
        case 'ingresos':
        default: rows = db.empleados;
    }

    const csv = [
        ['Nombre', 'Apellido', 'Documento', 'Sector', 'Grupo', 'Cargo', 'Estado'].join(','),
        ...rows.map(emp => {
            const sector = obtenerSectorPorId(emp.sectorId)?.nombre || '';
            const grupo = obtenerGrupoPorId(emp.grupoId)?.nombre || '';
            return [emp.nombre, emp.apellido, emp.documento, sector, grupo, emp.cargo, emp.estado].join(',');
        })
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-${tipo}.csv`;
    link.click();
}

function realizarBackup() {
    const db = getDatabase();
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'backup-hr-barcode.json';
    link.click();
}

function realizarBusqueda() {
    const nombre = document.getElementById('busquedaNombre').value.trim().toLowerCase();
    const documento = document.getElementById('busquedaDocumento').value.trim().toLowerCase();
    const codigo = document.getElementById('busquedaCodigo').value.trim().toLowerCase();
    const sector = document.getElementById('busquedaSector').value;
    const grupo = document.getElementById('busquedaGrupo').value;
    const estado = document.getElementById('busquedaEstado').value;

    const db = getDatabase();
    const results = db.empleados.filter(emp => {
        const nombreMatch = !nombre || `${emp.nombre} ${emp.apellido}`.toLowerCase().includes(nombre);
        const documentoMatch = !documento || emp.documento.toLowerCase().includes(documento);
        const codigoMatch = !codigo || emp.codigo.toLowerCase().includes(codigo);
        const sectorMatch = !sector || String(emp.sectorId) === String(sector);
        const grupoMatch = !grupo || String(emp.grupoId) === String(grupo);
        const estadoMatch = !estado || emp.estado === estado;

        return nombreMatch && documentoMatch && codigoMatch && sectorMatch && grupoMatch && estadoMatch;
    });

    renderBusquedaTable(results);
}

function limpiarBusqueda() {
    document.getElementById('busquedaNombre').value = '';
    document.getElementById('busquedaDocumento').value = '';
    document.getElementById('busquedaCodigo').value = '';
    document.getElementById('busquedaSector').value = '';
    document.getElementById('busquedaGrupo').value = '';
    document.getElementById('busquedaEstado').value = '';
    renderBusqueda();
}

function mostrarGestionUsuarios() {
    alert('Aquí se puede agregar autenticación y gestión de usuarios.');
}

function logout() {
    alert('Sesión cerrada.');
}

function cargarGruposPorSector() {
    const sectorId = document.getElementById('empleadoSector').value;
    const select = document.getElementById('empleadoGrupo');
    const db = getDatabase();
    select.innerHTML = '<option value="">Seleccionar...</option>' + db.grupos.filter(g => Number(g.sectorId) === Number(sectorId)).map(g => `<option value="${g.id}">${g.nombre}</option>`).join('');
}

function imprimirCodigo(id) {
    const codigo = getDatabase().codigos.find(item => Number(item.id) === Number(id));
    if (!codigo) return;
    const empleado = obtenerEmpleadoPorId(codigo.empleadoId);

    const content = document.getElementById('contenidoImprimir');
    content.innerHTML = `
        <div class="print-card">
            <h3>${empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Empleado'}</h3>
            <p>Documento: ${empleado ? empleado.documento : ''}</p>
            <p>Código: ${codigo.codigo}</p>
            <div class="barcode-box">
                ${codigo.tipo === 'code128' || codigo.tipo === 'ambos' ? `<svg id="print-bar-${codigo.id}"></svg>` : ''}
                ${codigo.tipo === 'qr' || codigo.tipo === 'ambos' ? `<div id="print-qr-${codigo.id}" style="margin-top: 15px;"></div>` : ''}
            </div>
        </div>
    `;

    if (codigo.tipo === 'code128' || codigo.tipo === 'ambos') {
        const svg = document.getElementById(`print-bar-${codigo.id}`);
        JsBarcode(svg, codigo.codigo, { format: 'CODE128', displayValue: true, fontSize: 12, margin: 10, width: 2, height: 50 });
    }

    if (codigo.tipo === 'qr' || codigo.tipo === 'ambos') {
        const qrNode = document.getElementById(`print-qr-${codigo.id}`);
        QRCode.toCanvas(qrNode, codigo.codigo, { width: 110 }, function (error) {
            if (error) console.error(error);
        });
    }

    document.getElementById('modalImprimir').classList.add('active');
}

function imprimirCodigoPorEmpleado(empleadoId) {
    const codigo = getDatabase().codigos.find(item => Number(item.empleadoId) === Number(empleadoId));
    if (!codigo) {
        alert('No existe un código para este empleado.');
        return;
    }
    imprimirCodigo(codigo.id);
}

window.addEventListener('click', function (event) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});
