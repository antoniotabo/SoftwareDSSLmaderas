const db = require('../config/database');

// 1. Listar clientes con filtros (Búsqueda por Razón Social o RUC)
const getClientes = async (req, res) => {
    try {
        const { q, estado } = req.query;
       let sql = "SELECT * FROM clientes WHERE estado != 'INACTIVO'";
        const params = [];

        // Filtro por estado (Si envías ?estado=ACTIVO)
        if (estado) {
            sql += ' AND estado = ?';
            params.push(estado);
        }

        // Filtro de búsqueda general (Si envías ?q=algo)
        if (q) {
            sql += ' AND (razon_social LIKE ? OR ruc LIKE ? OR contacto LIKE ?)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        
        sql += ' ORDER BY id DESC'; // Ordenar del más nuevo al más viejo

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al listar clientes', error: error.message });
    }
};

// 2. Obtener un cliente por ID (Para rellenar el formulario de editar)
const getClienteById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cliente', error: error.message });
    }
};

// 3. Crear cliente (INSERT usando las columnas reales)
const createCliente = async (req, res) => {
    try {
        // Recibimos los datos del frontend
        const { razon_social, ruc, direccion, telefono, contacto } = req.body;
        
        // Validación básica
        if (!razon_social || !ruc) {
            return res.status(400).json({ message: 'Razón Social y RUC son obligatorios' });
        }

        const [result] = await db.query(
            'INSERT INTO clientes (razon_social, ruc, contacto, telefono, direccion, estado) VALUES (?, ?, ?, ?, ?, "ACTIVO")',
            [razon_social, ruc, contacto, telefono, direccion]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Cliente registrado correctamente', 
            id: result.insertId 
        });

    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ message: 'Error al crear cliente', error: error.message });
    }
};

// 4. Actualizar cliente (UPDATE usando las columnas reales)
const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { razon_social, ruc, direccion, telefono, contacto, estado } = req.body;
        
        const [result] = await db.query(
            'UPDATE clientes SET razon_social=?, ruc=?, contacto=?, telefono=?, direccion=?, estado=? WHERE id=?',
            [razon_social, ruc, contacto, telefono, direccion, estado || 'ACTIVO', id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado para actualizar' });
        }

        res.json({ success: true, message: 'Cliente actualizado correctamente' });
    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// 5. Eliminar cliente (Borrado Lógico: Cambia estado a INACTIVO)
const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        
        // No borramos la fila, solo la marcamos como INACTIVO para no perder historial
        const [result] = await db.query('UPDATE clientes SET estado = "INACTIVO" WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        
        res.json({ success: true, message: 'Cliente eliminado (Inactivado)' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

module.exports = { getClientes, getClienteById, createCliente, updateCliente, deleteCliente };