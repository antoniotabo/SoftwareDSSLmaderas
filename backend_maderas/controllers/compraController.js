const db = require('../config/database');

// Crear Compra con Detalles (Transacción ACID)
const createCompra = async (req, res) => {
    const connection = await db.getConnection(); // Pedimos conexión exclusiva
    try {
        const { proveedor_id, fecha, tipo_comprobante, numero_comprobante, total, items } = req.body;
        // items: [{ descripcion, cantidad, precio_unitario, importe }, ...]

        await connection.beginTransaction();

        // 1. Insertar Cabecera de Compra
        const [resCompra] = await connection.query(
            'INSERT INTO compras (proveedor_id, fecha, tipo_comprobante, numero_comprobante, total, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
            [proveedor_id, fecha, tipo_comprobante, numero_comprobante, total, req.usuario.id]
        );
        
        const compraId = resCompra.insertId;

        // 2. Insertar Detalles de la Compra
        if (items && items.length > 0) {
            const values = items.map(item => [
                compraId,
                item.descripcion,
                item.cantidad,
                item.precio_unitario,
                item.importe
            ]);

            await connection.query(
                'INSERT INTO compra_detalles (compra_id, descripcion, cantidad, precio_unitario, importe) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, mensaje: 'Compra registrada exitosamente', id: compraId });

    } catch (error) {
        await connection.rollback();
        console.error('Error en compra:', error);
        res.status(500).json({ success: false, mensaje: 'Error al registrar la compra', error: error.message });
    } finally {
        connection.release();
    }
};

// Listar Compras
const getCompras = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, p.nombre_razon_social as proveedor 
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            ORDER BY c.fecha DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al listar compras', error: error.message });
    }
};

// Obtener detalle de una compra específica
const getCompraById = async (req, res) => {
    try {
        const { id } = req.params;
        const [compra] = await db.query(`
            SELECT c.*, p.nombre_razon_social as proveedor 
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            WHERE c.id = ?
        `, [id]);

        if (compra.length === 0) return res.status(404).json({ success: false, mensaje: 'Compra no encontrada' });

        const [detalles] = await db.query('SELECT * FROM compra_detalles WHERE compra_id = ?', [id]);

        res.json({ success: true, data: { ...compra[0], items: detalles } });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al obtener detalle', error: error.message });
    }
};

module.exports = { createCompra, getCompras, getCompraById };