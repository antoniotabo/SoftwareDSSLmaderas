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
                c.proveedor_id
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
        const { monto_pago } = req.body;

        const [compra] = await db.query('SELECT * FROM compras WHERE id = ?', [id]);
        if (compra.length === 0) return res.status(404).json({ message: 'No existe' });

        const datos = compra[0];
        const nuevoAnticipo = parseFloat(datos.anticipo || 0) + parseFloat(monto_pago);
        const totalReal = parseFloat(datos.cantidad_pt) * parseFloat(datos.precio_pt);
        
        let nuevoEstado = 'PENDIENTE';
        // Margen de error 0.1 para evitar problemas de decimales
        if (nuevoAnticipo >= (totalReal - 0.1)) {
            nuevoEstado = 'CANCELADO';
        }

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
// 4. CREAR COMPRA (CON ACTUALIZACIÓN DE STOCK)
// ==========================================
const createCompra = async (req, res) => {
    // Usamos una conexión dedicada para la transacción
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Recibimos los datos. 
        // NOTA: Agregué 'ubicacion' y 'tipo_madera' (si vienen del front) para el stock.
        const { 
            proveedor_id, 
            fecha, 
            tipo_producto, // Esto será la 'especie' en stock
            tipo_madera,   // Si no viene, pondremos 'Estándar'
            cantidad_pt, 
            precio_pt, 
            anticipo, 
            estado,
            ubicacion      // Importante para saber dónde guardar el stock
        } = req.body;

        const maderaDefinida = tipo_madera || 'Estándar';
        const ubicacionDefinida = ubicacion || 'Almacén General';

        // --- PASO A: Insertar en Tabla COMPRAS ---
        const sqlCompra = `
            INSERT INTO compras 
            (proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.query(sqlCompra, [
            proveedor_id, 
            fecha, 
            tipo_producto, 
            cantidad_pt, 
            precio_pt, 
            anticipo || 0, 
            estado || 'PENDIENTE'
        ]);

        // --- PASO B: Actualizar Tabla STOCK (El Cerebro) ---
        
        // 1. Verificar si ya existe esa madera en el inventario
        const sqlCheckStock = 'SELECT id FROM stock WHERE especie = ? AND tipo_madera = ?';
        const [existe] = await connection.query(sqlCheckStock, [tipo_producto, maderaDefinida]);

        if (existe.length > 0) {
            // OPCIÓN 1: YA EXISTE -> SUMAMOS LA CANTIDAD y actualizamos fecha
            const sqlUpdateStock = `
                UPDATE stock 
                SET cantidad_pt = cantidad_pt + ?, fecha = NOW() 
                WHERE id = ?
            `;
            await connection.query(sqlUpdateStock, [cantidad_pt, existe[0].id]);
        } else {
            // OPCIÓN 2: ES NUEVO -> CREAMOS LA FILA
            const sqlInsertStock = `
                INSERT INTO stock (especie, tipo_madera, cantidad_pt, ubicacion, fecha) 
                VALUES (?, ?, ?, ?, NOW())
            `;
            await connection.query(sqlInsertStock, [
                tipo_producto, 
                maderaDefinida, 
                cantidad_pt, 
                ubicacionDefinida
            ]);
        }

        // Si todo salió bien, confirmamos los cambios
        await connection.commit();
        res.json({ success: true, message: 'Compra registrada y Stock actualizado correctamente' });

    } catch (error) {
        // Si algo falla, deshacemos todo (Rollback)
        await connection.rollback();
        console.error('❌ Error en transacción compra/stock:', error);
        res.status(500).json({ message: 'Error al crear compra', error: error.message });
    } finally {
        // Liberamos la conexión
        connection.release();
    }
};

// ==========================================
// 5. ACTUALIZAR COMPRA (Solo datos básicos)
// ==========================================
const updateCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const { proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado } = req.body;
        
        // NOTA: Si editas la cantidad aquí, idealmente deberías ajustar el stock también.
        // Por seguridad, esta versión simple solo actualiza el registro contable.
        const sql = `UPDATE compras SET proveedor_id=?, fecha=?, tipo_producto=?, cantidad_pt=?, precio_pt=?, anticipo=?, estado=? WHERE id=?`;
        await db.query(sql, [proveedor_id, fecha, tipo_producto, cantidad_pt, precio_pt, anticipo, estado, id]);
        
        res.json({ success: true, message: 'Compra actualizada' });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar', error: error.message });
    }
};

// ==========================================
// 6. ELIMINAR COMPRA
// ==========================================
const deleteCompra = async (req, res) => {
    try {
        const { id } = req.params;
        // OJO: Al eliminar una compra, el stock físico NO baja automáticamente aquí 
        // (porque podrías haber vendido la madera ya).
        await db.query('DELETE FROM compras WHERE id = ?', [id]);
        res.json({ success: true, message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar' });
    }
};

module.exports = { getCompras, getCompraById, registrarPago, createCompra, updateCompra, deleteCompra };