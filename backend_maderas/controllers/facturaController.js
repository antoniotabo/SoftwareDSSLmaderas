const db = require('../config/database');

// Listar Facturas (Con totales calculados)
const getFacturas = async (req, res) => {
    try {
        const { clienteId, estado, desde, hasta } = req.query;
        let sql = `
            SELECT f.*, c.nombre_razon_social as cliente_nombre 
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (clienteId) { sql += ' AND f.cliente_id = ?'; params.push(clienteId); }
        if (estado) { sql += ' AND f.estado = ?'; params.push(estado); }
        if (desde) { sql += ' AND f.fecha >= ?'; params.push(desde); }
        if (hasta) { sql += ' AND f.fecha <= ?'; params.push(hasta); }

        sql += ' ORDER BY f.fecha DESC';

        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear Factura (Transacción Completa)
const createFactura = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { cliente_id, fecha, tipo_documento, serie, numero, total, items } = req.body;
        
        await connection.beginTransaction();

        const [resFactura] = await connection.query(
            'INSERT INTO facturas (cliente_id, fecha, tipo_documento, serie, numero, total, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [cliente_id, fecha, tipo_documento, serie, numero, total, req.usuario.id]
        );
        
        const facturaId = resFactura.insertId;

        if (items && items.length > 0) {
            const values = items.map(item => [
                facturaId, item.descripcion, item.cantidad, item.precio_unitario, item.subtotal
            ]);
            await connection.query(
                'INSERT INTO factura_items (factura_id, descripcion, cantidad, precio_unitario, subtotal) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Factura registrada', id: facturaId });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Error al facturar', error: error.message });
    } finally {
        connection.release();
    }
};

// Registrar Cobranza (Pago a cuenta o total)
const registrarCobranza = async (req, res) => {
    try {
        const { factura_id, monto, fecha, metodo_pago } = req.body;
        
        // Registrar en tabla cobranzas (Asumiendo que existe, basada en tu código anterior)
        await db.query(
            'INSERT INTO cobranzas (factura_id, monto, fecha, metodo_pago, usuario_id) VALUES (?, ?, ?, ?, ?)',
            [factura_id, monto, fecha, metodo_pago, req.usuario.id]
        );

        // Actualizar saldo de factura (Opcional, si tienes campo saldo)
        // await db.query('UPDATE facturas SET saldo = saldo - ? WHERE id = ?', [monto, factura_id]);

        res.status(201).json({ success: true, message: 'Cobranza registrada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar cobranza', error: error.message });
    }
};

// Eliminar un item específico de una factura
const deleteFacturaItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const [result] = await db.query('DELETE FROM factura_items WHERE id = ?', [itemId]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Item no encontrado' });
        
        res.json({ success: true, message: 'Item eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar item', error: error.message });
    }
};

module.exports = { createFactura, getFacturas, registrarCobranza, deleteFacturaItem };