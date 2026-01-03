const db = require('../config/database');

// 1. Listar Fletes
const getFletes = async (req, res) => {
    try {
        const { estado, desde, hasta, transportista_id } = req.query;

        let sql = `
            SELECT 
                f.id,
                f.fecha,
                f.transportista_id,
                t.nombre as transportista_nombre,
                f.guia_remitente,
                f.guia_transportista,
                f.detalle_carga,
                f.valor_flete,
                f.adelanto,
                f.pago,
                f.pendiente,
                f.estado,
                f.fecha_cancelacion,
                f.observacion
            FROM fletes f
            LEFT JOIN transportistas t ON f.transportista_id = t.id
            WHERE 1=1
        `;

        const params = [];

        // Filtros dinámicos
        if (estado) {
            sql += ' AND f.estado = ?';
            params.push(estado);
        }
        if (desde) {
            sql += ' AND f.fecha >= ?';
            params.push(desde);
        }
        if (hasta) {
            sql += ' AND f.fecha <= ?';
            params.push(hasta);
        }
        if (transportista_id) {
            sql += ' AND f.transportista_id = ?';
            params.push(transportista_id);
        }

        sql += ' ORDER BY f.fecha DESC';

        const [rows] = await db.query(sql, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error al listar fletes:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al listar fletes', 
            error: error.message 
        });
    }
};

// 2. Obtener Flete por ID
const getFleteById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT 
                f.*,
                t.nombre as transportista_nombre,
                t.ruc as transportista_ruc
            FROM fletes f
            LEFT JOIN transportistas t ON f.transportista_id = t.id
            WHERE f.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Flete no encontrado'
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('❌ Error al obtener flete:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al obtener flete', 
            error: error.message 
        });
    }
};

// 3. Registrar Flete
const createFlete = async (req, res) => {
    try {
        const { 
            fecha,
            transportista_id,
            guia_remitente,
            guia_transportista,
            detalle_carga,
            valor_flete,
            adelanto,
            pago,
            observacion
        } = req.body;

        console.log('📥 Datos recibidos:', req.body);

        // Validaciones
        if (!fecha || !transportista_id || !valor_flete) {
            return res.status(400).json({
                success: false,
                mensaje: 'Faltan campos obligatorios: fecha, transportista_id, valor_flete'
            });
        }

        const [result] = await db.query(
            `INSERT INTO fletes 
            (fecha, transportista_id, guia_remitente, guia_transportista, 
             detalle_carga, valor_flete, adelanto, pago, observacion) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fecha,
                transportista_id,
                guia_remitente || null,
                guia_transportista || null,
                detalle_carga || null,
                valor_flete,
                adelanto || 0,
                pago || 0,
                observacion || null
            ]
        );

        console.log('✅ Flete registrado ID:', result.insertId);

        res.status(201).json({ 
            success: true, 
            mensaje: 'Flete registrado correctamente', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ Error al registrar flete:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al registrar flete', 
            error: error.message 
        });
    }
};

// 4. Actualizar Flete
const updateFlete = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            fecha,
            transportista_id,
            guia_remitente,
            guia_transportista,
            detalle_carga,
            valor_flete,
            adelanto,
            pago,
            fecha_cancelacion,
            observacion
        } = req.body;

        const [result] = await db.query(
            `UPDATE fletes 
            SET fecha = ?, 
                transportista_id = ?, 
                guia_remitente = ?, 
                guia_transportista = ?,
                detalle_carga = ?,
                valor_flete = ?,
                adelanto = ?,
                pago = ?,
                fecha_cancelacion = ?,
                observacion = ?
            WHERE id = ?`,
            [
                fecha,
                transportista_id,
                guia_remitente,
                guia_transportista,
                detalle_carga,
                valor_flete,
                adelanto || 0,
                pago || 0,
                fecha_cancelacion,
                observacion,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Flete no encontrado'
            });
        }

        res.json({ 
            success: true, 
            mensaje: 'Flete actualizado correctamente' 
        });
    } catch (error) {
        console.error('❌ Error al actualizar flete:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al actualizar flete', 
            error: error.message 
        });
    }
};

// 5. Registrar Pago
const registrarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto_pago, fecha_pago } = req.body;

        // Obtener flete actual
        const [flete] = await db.query('SELECT * FROM fletes WHERE id = ?', [id]);
        
        if (flete.length === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Flete no encontrado'
            });
        }

        const nuevoPago = (parseFloat(flete[0].pago) || 0) + parseFloat(monto_pago);
        const pendiente = flete[0].valor_flete - (flete[0].adelanto || 0) - nuevoPago;

        await db.query(
            `UPDATE fletes 
            SET pago = ?,
                fecha_cancelacion = ?
            WHERE id = ?`,
            [nuevoPago, pendiente <= 0 ? fecha_pago : null, id]
        );

        res.json({ 
            success: true, 
            mensaje: 'Pago registrado correctamente',
            nuevo_pendiente: Math.max(0, pendiente)
        });
    } catch (error) {
        console.error('❌ Error al registrar pago:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al registrar pago', 
            error: error.message 
        });
    }
};

// 6. Eliminar Flete
const deleteFlete = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query('DELETE FROM fletes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                mensaje: 'Flete no encontrado'
            });
        }

        res.json({ 
            success: true, 
            mensaje: 'Flete eliminado correctamente' 
        });
    } catch (error) {
        console.error('❌ Error al eliminar flete:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al eliminar flete', 
            error: error.message 
        });
    }
};

// 7. Obtener Estadísticas
const getEstadisticas = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_fletes,
                SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado = 'CANCELADO' THEN 1 ELSE 0 END) as cancelados,
                SUM(valor_flete) as total_valor,
                SUM(pendiente) as total_pendiente
            FROM fletes
        `);

        res.json({ success: true, data: stats[0] });
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ 
            success: false, 
            mensaje: 'Error al obtener estadísticas', 
            error: error.message 
        });
    }
};

module.exports = { 
    getFletes, 
    getFleteById,
    createFlete,
    updateFlete,
    registrarPago,
    deleteFlete,
    getEstadisticas
};