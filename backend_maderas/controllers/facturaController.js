const db = require('../config/database');

// ==========================================
// 1. LISTAR FACTURAS (Devuelve Array directo)
// ==========================================
const getFacturas = async (req, res) => {
    try {
        const { clienteId, estado, desde, hasta } = req.query;

        let sql = `
            SELECT 
                f.id, f.fecha, f.factura_nro, f.guia_nro, f.estado, f.descripcion,
                c.razon_social as cliente_nombre,
                COALESCE((SELECT SUM(total_item) FROM factura_items WHERE factura_id = f.id), 0) as total_calculado
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
        
        // Devolvemos el array directamente para que la tabla del frontend se llene
        res.json(rows); 

    } catch (error) {
        console.error('❌ Error al listar facturas:', error);
        res.status(500).json({ message: 'Error al listar facturas', error: error.message });
    }
};

// ==========================================
// 2. OBTENER FACTURA POR ID (Para Editar)
// ==========================================
const getFacturaById = async (req, res) => {
    try {
        const { id } = req.params;

        // A. Obtener Cabecera
        const [cabecera] = await db.query('SELECT * FROM facturas WHERE id = ?', [id]);

        if (cabecera.length === 0) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        // B. Obtener Items
        const [items] = await db.query('SELECT * FROM factura_items WHERE factura_id = ?', [id]);

        // C. Retornar objeto completo
        res.json({ 
            success: true, 
            data: { ...cabecera[0], items: items } 
        });

    } catch (error) {
        console.error('❌ Error al obtener factura:', error);
        res.status(500).json({ success: false, message: 'Error interno', error: error.message });
    }
};

// ==========================================
// 3. CREAR FACTURA (Con Transacción)
// ==========================================
const createFactura = async (req, res) => {
    const connection = await db.getConnection(); 
    try {
        const { cliente_id, fecha, factura_nro, guia_nro, descripcion, igv_pct, detraccion_pct, packing_id, items } = req.body;
        
        await connection.beginTransaction();

        // 1. Insertar Cabecera (Incluyendo packing_id)
        const [resFactura] = await connection.query(
            `INSERT INTO facturas 
            (cliente_id, fecha, factura_nro, guia_nro, descripcion, igv_pct, detraccion_pct, estado, packing_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'EMITIDA', ?)`,
            [cliente_id, fecha, factura_nro, guia_nro || '', descripcion || '', igv_pct || 0.18, detraccion_pct || 0.04, packing_id || null]
        );
        
        const facturaId = resFactura.insertId;
        let itemsParaInsertar = [];

        // 2. Lógica Inteligente de Items
        // CASO A: Viene vinculado a un Packing y NO se enviaron items manuales (Auto-llenado)
        if (packing_id && (!items || items.length === 0)) {
            const [packingItems] = await connection.query(
                `SELECT 
                    -- Generamos una descripción profesional: "TORNILLO - 1.000 x 6.000 x 10.000"
                    CONCAT(categoria, ' - ', e, '" x ', a, '" x ', l, "'") as producto,
                    volumen_pt as cantidad, -- En madera facturamos Volumen (PT)
                    0.00 as precio_unit     -- El precio lo define Ventas, no Producción
                 FROM packing_items 
                 WHERE packing_id = ?`,
                [packing_id]
            );

            if (packingItems.length > 0) {
                itemsParaInsertar = packingItems.map(it => [facturaId, it.producto, it.cantidad, it.precio_unit]);
            }
        } 
        // CASO B: Items manuales desde el Frontend (Edición usuario)
        else if (items && items.length > 0) {
            itemsParaInsertar = items.map(item => [
                facturaId, item.producto, item.cantidad, item.precio_unit
            ]);
        }

        // 3. Insertar Detalle
        if (itemsParaInsertar.length > 0) {
            await connection.query(
                'INSERT INTO factura_items (factura_id, producto, cantidad, precio_unit) VALUES ?',
                [itemsParaInsertar]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Factura creada exitosamente', id: facturaId });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Error al crear factura:", error);
        res.status(500).json({ success: false, message: 'Error al crear factura', error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 4. ACTUALIZAR FACTURA (Con Transacción)
// ==========================================
const updateFactura = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { cliente_id, fecha, factura_nro, guia_nro, descripcion, igv_pct, detraccion_pct, items } = req.body;

        await connection.beginTransaction();

        // A. Actualizar Cabecera
        await connection.query(
            `UPDATE facturas SET cliente_id=?, fecha=?, factura_nro=?, guia_nro=?, descripcion=?, igv_pct=?, detraccion_pct=? 
             WHERE id=?`,
            [cliente_id, fecha, factura_nro, guia_nro, descripcion, igv_pct, detraccion_pct, id]
        );

        // B. Actualizar Items (Borrar viejos -> Insertar nuevos)
        await connection.query('DELETE FROM factura_items WHERE factura_id = ?', [id]);

        if (items && items.length > 0) {
            const values = items.map(item => [
                id, item.producto, item.cantidad, item.precio_unit
            ]);
            await connection.query(
                'INSERT INTO factura_items (factura_id, producto, cantidad, precio_unit) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Factura actualizada correctamente' });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Error al actualizar factura:", error);
        res.status(500).json({ success: false, message: 'Error al actualizar', error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 5. ELIMINAR FACTURA (✅ CORREGIDO: Elimina en cascada)
// ==========================================
const deleteFactura = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;

        await connection.beginTransaction();

        // 1. Eliminar Items (Hijos)
        await connection.query('DELETE FROM factura_items WHERE factura_id = ?', [id]);

        // 2. Eliminar Cobranzas (Hijos)
        await connection.query('DELETE FROM cobranzas WHERE factura_id = ?', [id]);

        // 3. Eliminar Factura (Padre)
        const [result] = await connection.query('DELETE FROM facturas WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }

        await connection.commit();
        res.json({ success: true, message: 'Factura eliminada correctamente' });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Error al eliminar factura:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar', error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 6. OTROS
// ==========================================
const deleteFacturaItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const [result] = await db.query('DELETE FROM factura_items WHERE id = ?', [itemId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Item no encontrado' });
        }
        res.json({ success: true, message: 'Item eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar item', error: error.message });
    }
};

const registrarCobranza = async (req, res) => {
    try {
        const { factura_id, fecha, anticipo, entregado } = req.body;
        await db.query(
            'INSERT INTO cobranzas (factura_id, fecha, anticipo, entregado) VALUES (?, ?, ?, ?)',
            [factura_id, fecha, anticipo || 0, entregado || 0]
        );
        res.status(201).json({ success: true, message: 'Cobranza registrada exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al registrar cobranza', error: error.message });
    }
};

module.exports = { 
    createFactura, 
    getFacturas, 
    getFacturaById, 
    updateFactura, 
    deleteFactura, 
    deleteFacturaItem,
    registrarCobranza 
};