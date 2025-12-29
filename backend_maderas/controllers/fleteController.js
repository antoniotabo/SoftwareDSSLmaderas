const db = require('../config/database');

// Listar Fletes
const getFletes = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, t.nombre as transportista 
            FROM fletes f
            LEFT JOIN transportistas t ON f.transportista_id = t.id
            ORDER BY f.fecha DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al listar fletes', error: error.message });
    }
};

// Registrar Flete
const createFlete = async (req, res) => {
    try {
        const { transportista_id, fecha, origen, destino, guia_remision, costo_total, observacion } = req.body;
        
        const [result] = await db.query(
            'INSERT INTO fletes (transportista_id, fecha, origen, destino, guia_remision, costo_total, observacion, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [transportista_id, fecha, origen, destino, guia_remision, costo_total, observacion, req.usuario.id]
        );
        
        res.status(201).json({ 
            success: true, 
            mensaje: 'Flete registrado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al registrar flete', error: error.message });
    }
};

module.exports = { getFletes, createFlete };