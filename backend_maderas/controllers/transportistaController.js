const db = require('../config/database');

// Listar transportistas
const getTransportistas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM transportistas ORDER BY nombre ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener transportistas', error: error.message });
    }
};

// Crear transportista
const createTransportista = async (req, res) => {
    try {
        const { nombre, ruc, placa_vehiculo, licencia_conducir, telefono } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO transportistas (nombre, ruc, placa_vehiculo, licencia_conducir, telefono) VALUES (?, ?, ?, ?, ?)',
            [nombre, ruc, placa_vehiculo, licencia_conducir, telefono]
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
        const { nombre, ruc, placa_vehiculo, licencia_conducir, telefono } = req.body;
        
        await db.query(
            'UPDATE transportistas SET nombre=?, ruc=?, placa_vehiculo=?, licencia_conducir=?, telefono=? WHERE id=?',
            [nombre, ruc, placa_vehiculo, licencia_conducir, telefono, id]
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