const db = require('../config/database');

// ==========================================
// 1. LISTAR COMPRAS
// ==========================================
const getCompras = async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.id, c.fecha, c.tipo_producto, c.cantidad_pt, c.precio_pt, 
                c.total_compra, c.anticipo, c.total_pendiente, c.estado,
                p.nombre as proveedor_nombre,
                c.proveedor_id -- Necesario para editar
            FROM compras c
            JOIN proveedores p ON c.proveedor_id = p.id
            ORDER BY c.fecha DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows); 
    } catch (error) {
        console.error('❌ Error al listar compras:', error);
        res.status(500).json({ message: 'Error al listar', error: error.message });
    }
};

// ==========================================
// 2. OBTENER COMPRA POR ID (Para editar)
// ==========================================
const getCompraById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM compras WHERE id = ?', [id]);
        
        if (rows.length === 0) return res.status(404).json({ message: 'Compra no encontrada' });
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener compra', error: error.message });
    }
};

// ==========================================
// 3. REGISTRAR PAGO (AMORTIZAR)
// ==========================================
const registrarPago = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto_pago } = req.body; // El dinero que está pagando AHORA

        // 1. Obtener datos actuales
        const [compra] = await db.query('SELECT * FROM compras WHERE id = ?', [id]);
        if (compra.length === 0) return res.status(404).json({ message: 'No existe' });

        const datos = compra[0];
        
        // 2. Calcular nuevos valores
        const nuevoAnticipo = parseFloat(datos.anticipo || 0) + parseFloat(monto_pago);
        const totalReal = parseFloat(datos.cantidad_pt) * parseFloat(datos.precio_pt);
        
        // 3. Determinar estado (con margen de error de 0.1 por decimales)
        let nuevoEstado = 'PENDIENTE';
        if (nuevoAnticipo >= (totalReal - 0.1)) {
            nuevoEstado = 'CANCELADO'; // Se pagó todo
        }

        // 4. Actualizar BD
        await db.query(
            'UPDATE compras SET anticipo = ?, estado = ? WHERE id = ?',
            [nuevoAnticipo, nuevoEstado, id]
        );

        res.json({ success: true, message: 'Pago registrado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar pago' });
    }
};

// ==========================================
// 4. CREAR Y 5. ELIMINAR (Igual que antes)
// ==========================================
const createCompra = async (req, res) => {
    try {
        const { proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado } = req.body;
        const sql = `INSERT INTO compras (proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo || 0, estado || 'PENDIENTE']);
        res.json({ success: true, message: 'Compra registrada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear', error: error.message });
    }
};

const updateCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const { proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado } = req.body;
        const sql = `UPDATE compras SET proveedor_id=?, fecha=?, tipo_producto=?, cantidad_pt=?, precio_pt=?, anticipo=?, estado=? WHERE id=?`;
        await db.query(sql, [proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado, id]);
        res.json({ success: true, message: 'Compra actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

const deleteCompra = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM compras WHERE id = ?', [id]);
        res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
};

module.exports = { getCompras, getCompraById, createCompra, updateCompra, deleteCompra, registrarPago };