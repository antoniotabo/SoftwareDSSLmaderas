const db = require('../config/database');

// Listar clientes con filtros (Búsqueda por nombre/RUC)
const getClientes = async (req, res) => {
    try {
        const { q, estado } = req.query;
        let sql = 'SELECT * FROM clientes WHERE 1=1';
        const params = [];

        if (estado) {
            sql += ' AND estado = ?';
            params.push(estado);
        }
        if (q) {
            sql += ' AND (nombre_razon_social LIKE ? OR ruc_dni LIKE ? OR contacto LIKE ?)';
            params.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        
        sql += ' ORDER BY nombre_razon_social ASC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error al listar clientes', error: error.message });
    }
};

// Obtener un cliente por ID
const getClienteById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
        
        if (rows.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cliente', error: error.message });
    }
};

// Crear cliente
const createCliente = async (req, res) => {
    try {
        const { nombre_razon_social, ruc_dni, direccion, telefono, email, contacto, estado } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO clientes (nombre_razon_social, ruc_dni, direccion, telefono, email, contacto, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nombre_razon_social, ruc_dni, direccion, telefono, email, contacto, estado || 'ACTIVO']
        );
        
        res.status(201).json({ success: true, message: 'Cliente registrado', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear cliente', error: error.message });
    }
};

// Actualizar cliente
const updateCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_razon_social, ruc_dni, direccion, telefono, email, contacto, estado } = req.body;
        
        const [result] = await db.query(
            'UPDATE clientes SET nombre_razon_social=?, ruc_dni=?, direccion=?, telefono=?, email=?, contacto=?, estado=? WHERE id=?',
            [nombre_razon_social, ruc_dni, direccion, telefono, email, contacto, estado, id]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente no encontrado' });

        res.json({ success: true, message: 'Cliente actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// Eliminar cliente (Lógico o Físico)
const deleteCliente = async (req, res) => {
    try {
        const { id } = req.params;
        // Opción 1: Borrado Físico (Si no tiene facturas)
        // const [result] = await db.query('DELETE FROM clientes WHERE id = ?', [id]);

        // Opción 2: Borrado Lógico (Más seguro)
        const [result] = await db.query('UPDATE clientes SET estado = "INACTIVO" WHERE id = ?', [id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
        
        res.json({ success: true, message: 'Cliente eliminado (Inactivado)' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar', error: error.message });
    }
};

module.exports = { getClientes, getClienteById, createCliente, updateCliente, deleteCliente };