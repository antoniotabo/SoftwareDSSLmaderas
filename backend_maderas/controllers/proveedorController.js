const db = require('../config/database');

// Listar todos los proveedores
const getProveedores = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM proveedores ORDER BY nombre_razon_social ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener proveedores', error: error.message });
    }
};

// Crear proveedor
const createProveedor = async (req, res) => {
    try {
        const { nombre_razon_social, ruc_dni, direccion, telefono, email } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO proveedores (nombre_razon_social, ruc_dni, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)',
            [nombre_razon_social, ruc_dni, direccion, telefono, email]
        );
        
        res.status(201).json({ 
            success: true, 
            mensaje: 'Proveedor registrado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al registrar proveedor', error: error.message });
    }
};

// Actualizar proveedor
const updateProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_razon_social, ruc_dni, direccion, telefono, email } = req.body;
        
        await db.query(
            'UPDATE proveedores SET nombre_razon_social=?, ruc_dni=?, direccion=?, telefono=?, email=? WHERE id=?',
            [nombre_razon_social, ruc_dni, direccion, telefono, email, id]
        );
        
        res.json({ success: true, mensaje: 'Proveedor actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al actualizar', error: error.message });
    }
};

// Eliminar proveedor
const deleteProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM proveedores WHERE id = ?', [id]);
        res.json({ success: true, mensaje: 'Proveedor eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al eliminar', error: error.message });
    }
};

module.exports = { getProveedores, createProveedor, updateProveedor, deleteProveedor };