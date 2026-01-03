const db = require('../config/database');

// Listar transportistas
const getTransportistas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM transportistas ORDER BY id DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener', error: error.message });
    }
};

// Crear transportista (AJUSTADO A TU BD REAL)
const createTransportista = async (req, res) => {
    try {
        // Solo pedimos lo que tu tabla tiene
        const { nombre, ruc, contacto } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO transportistas (nombre, ruc, contacto, estado) VALUES (?, ?, ?, ?)',
            [nombre, ruc, contacto, 'ACTIVO'] // Por defecto ACTIVO
        );
        
        res.status(201).json({ 
            success: true, 
            mensaje: 'Transportista registrado', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al registrar', error: error.message });
    }
};

// Actualizar transportista
const updateTransportista = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ruc, contacto, estado } = req.body; // Agregamos estado por si quieres desactivarlo
        
        await db.query(
            'UPDATE transportistas SET nombre=?, ruc=?, contacto=?, estado=? WHERE id=?',
            [nombre, ruc, contacto, estado, id]
        );
        
        res.json({ success: true, mensaje: 'Transportista actualizado' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al actualizar', error: error.message });
    }
};

// Eliminar transportista
const deleteTransportista = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM transportistas WHERE id = ?', [id]);
        res.json({ success: true, mensaje: 'Transportista eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al eliminar', error: error.message });
    }
};

module.exports = { getTransportistas, createTransportista, updateTransportista, deleteTransportista };