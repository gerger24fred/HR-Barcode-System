const STORAGE_KEY = 'hr_barcode_system_v1';

const defaultData = {
    sectores: [
        { id: 1, nombre: 'Administración', descripcion: 'Área administrativa', jefe: 'María López' },
        { id: 2, nombre: 'Finanzas', descripcion: 'Gestión contable y financiera', jefe: 'Carlos Pérez' },
        { id: 3, nombre: 'Operaciones', descripcion: 'Producción y logística', jefe: 'Ana Gómez' }
    ],
    grupos: [
        { id: 1, nombre: 'Soporte TI', sectorId: 1, responsable: 'Luis Ortega', descripcion: 'Atención tecnológica' },
        { id: 2, nombre: 'Contabilidad', sectorId: 2, responsable: 'Patricia Ruiz', descripcion: 'Procesos contables' },
        { id: 3, nombre: 'Almacén', sectorId: 3, responsable: 'Jorge Ramírez', descripcion: 'Gestión de inventario' }
    ],
    empleados: [
        {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            documento: '12345678',
            tipoDocumento: 'Cédula',
            sectorId: 1,
            grupoId: 1,
            cargo: 'Analista',
            fechaIngreso: '2024-01-10',
            turno: 'Diurno',
            email: 'juan.perez@empresa.com',
            telefono: '555-1234',
            estado: 'activo',
            observaciones: 'Colaborador nuevo',
            codigo: 'EMP-001'
        },
        {
            id: 2,
            nombre: 'María',
            apellido: 'González',
            documento: '87654321',
            tipoDocumento: 'Cédula',
            sectorId: 2,
            grupoId: 2,
            cargo: 'Contadora',
            fechaIngreso: '2023-05-22',
            turno: 'Diurno',
            email: 'maria.gonzalez@empresa.com',
            telefono: '555-5678',
            estado: 'activo',
            observaciones: 'Responsable de cierre',
            codigo: 'EMP-002'
        },
        {
            id: 3,
            nombre: 'Carlos',
            apellido: 'Mendoza',
            documento: '11223344',
            tipoDocumento: 'Pasaporte',
            sectorId: 3,
            grupoId: 3,
            cargo: 'Supervisor',
            fechaIngreso: '2022-11-03',
            turno: 'Nocturno',
            email: 'carlos.mendoza@empresa.com',
            telefono: '555-9876',
            estado: 'inactivo',
            observaciones: 'Actividad parcial',
            codigo: 'EMP-003'
        }
    ],
    codigos: [
        { id: 1, empleadoId: 1, codigo: 'EMP-001', tipo: 'code128', fechaCreacion: new Date().toISOString() },
        { id: 2, empleadoId: 2, codigo: 'EMP-002', tipo: 'qr', fechaCreacion: new Date().toISOString() }
    ]
};

function getDatabase() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
    }

    try {
        const parsed = JSON.parse(raw);
        return {
            sectores: Array.isArray(parsed.sectores) ? parsed.sectores : [],
            grupos: Array.isArray(parsed.grupos) ? parsed.grupos : [],
            empleados: Array.isArray(parsed.empleados) ? parsed.empleados : [],
            codigos: Array.isArray(parsed.codigos) ? parsed.codigos : []
        };
    } catch (error) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
    }
}

function saveDatabase(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getNextId(items) {
    return items.length ? Math.max(...items.map(item => Number(item.id))) + 1 : 1;
}

function generarCodigoEmpleado() {
    const db = getDatabase();
    const nextId = db.empleados.length ? Math.max(...db.empleados.map(e => Number(e.id))) + 1 : 1;
    return `EMP-${String(nextId).padStart(3, '0')}`;
}

function obtenerSectorPorId(sectorId) {
    const db = getDatabase();
    return db.sectores.find(s => Number(s.id) === Number(sectorId));
}

function obtenerGrupoPorId(grupoId) {
    const db = getDatabase();
    return db.grupos.find(g => Number(g.id) === Number(grupoId));
}

function obtenerEmpleadoPorId(empleadoId) {
    const db = getDatabase();
    return db.empleados.find(e => Number(e.id) === Number(empleadoId));
}
