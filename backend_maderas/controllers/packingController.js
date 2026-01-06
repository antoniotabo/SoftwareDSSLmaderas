const db = require('../config/database');

// ==========================================
// 1. CREAR PACKING (CON DESCUENTO DE STOCK)
// ==========================================
const crearPacking = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { cliente_id, fecha, especie, tipo_madera, observaciones, items } = req.body;
        
        // 🔥 CAMBIO AQUÍ: Usamos CONCAT(?, ' ', CURTIME()) para combinar tu fecha con la hora actual
        const [resPacking] = await connection.query(
            'INSERT INTO packing (cliente_id, fecha, especie, tipo_madera, observaciones, total_pt) VALUES (?, CONCAT(?, " ", CURTIME()), ?, ?, ?, 0)',
            [cliente_id, fecha, especie, tipo_madera, observaciones]
        );
        const packingId = resPacking.insertId;

        let totalGeneralPT = 0;

        if (items && items.length > 0) {
            for (const item of items) {
                // Insertar ítem
                await connection.query(
                    'INSERT INTO packing_items (packing_id, categoria, cantidad_piezas, e, a, l, volumen_pt) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [packingId, item.categoria, item.cantidad_piezas, item.e, item.a, item.l, item.volumen_pt]
                );

                totalGeneralPT += parseFloat(item.volumen_pt);

                // Lógica de Stock (Restar)
                const especieARestar = item.categoria || especie; 
                const tipoARestar = tipo_madera || 'Estándar';

                const [stockExistente] = await connection.query(
                    'SELECT id FROM stock WHERE especie = ? AND tipo_madera = ?',
                    [especieARestar, tipoARestar]
                );

                if (stockExistente.length > 0) {
                    await connection.query(
                        'UPDATE stock SET cantidad_pt = cantidad_pt - ? WHERE id = ?',
                        [item.volumen_pt, stockExistente[0].id]
                    );
                }
            }
        }

        // Actualizar el total
        await connection.query(
            'UPDATE packing SET total_pt = ? WHERE id = ?', 
            [totalGeneralPT, packingId]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: 'Packing registrado', id: packingId });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Error al crear packing:", error);
        res.status(500).json({ success: false, message: 'Error al crear', error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 2. LISTAR PACKINGS (CORREGIDO ORDEN)
// ==========================================
const obtenerPackings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                p.id,
                p.fecha,
                p.cliente_id,
                c.razon_social as cliente_nombre,
                p.especie,
                p.tipo_madera,
                p.observaciones,
                p.total_pt -- Ya lo guardamos en crearPacking, es más rápido leerlo directo
            FROM packing p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            -- 👇 CORRECCIÓN DE ORDEN: Primero fecha reciente, luego ID más alto (el último creado)
            ORDER BY p.fecha DESC, p.id DESC
        `);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("❌ Error al obtener packings:", error);
        res.status(500).json({ success: false, message: 'Error al obtener packings', error: error.message });
    }
};

// ==========================================
// 3. OBTENER PACKING POR ID (DETALLE)
// ==========================================
const getPackingById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener cabecera
        const [packing] = await db.query(`
            SELECT p.*, c.razon_social as cliente_nombre
            FROM packing p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            WHERE p.id = ?
        `, [id]);

        if (packing.length === 0) {
            return res.status(404).json({ success: false, message: 'Packing no encontrado' });
        }

        // Obtener items
        const [items] = await db.query('SELECT * FROM packing_items WHERE packing_id = ?', [id]);

        res.json({ 
            success: true, 
            data: { ...packing[0], items: items }
        });
    } catch (error) {
        console.error("❌ Error al obtener packing:", error);
        res.status(500).json({ success: false, message: 'Error al obtener packing', error: error.message });
    }
};

// ==========================================
// 4. ELIMINAR PACKING (Opcional: Debería devolver stock)
// ==========================================
const deletePacking = async (req, res) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const { id } = req.params;

        // NOTA: Para ser 100% estricto, aquí deberíamos devolver el stock antes de borrar.
        // Por ahora, mantenemos la lógica de borrar simple como la tenías.
        
        await connection.query('DELETE FROM packing_items WHERE packing_id = ?', [id]);
        const [result] = await connection.query('DELETE FROM packing WHERE id = ?', [id]);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Packing no encontrado' });
        }

        res.json({ success: true, message: 'Packing eliminado correctamente' });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error al eliminar packing:", error);
        res.status(500).json({ success: false, message: 'Error al eliminar packing', error: error.message });
    } finally {
        connection.release();
    }
};

// ==========================================
// 5. OBTENER ITEMS (Auxiliar si lo usas)
// ==========================================
const getPackingItems = async (req, res) => {
   try {
        const { id } = req.params; // 1. Obtenemos el ID que viene en la URL
        
        // 2. Buscamos SOLO los ítems de ese ID en la tabla packing_items
        const sql = 'SELECT * FROM packing_items WHERE packing_id = ?';
        
        const [rows] = await db.query(sql, [id]);
        res.json({ data: rows });
    } catch (error) {
        console.error("Error al listar items:", error);
        res.status(500).json({ message: 'Error al listar items' });
    }
};

module.exports = { 
    crearPacking, 
    obtenerPackings, 
    getPackingById, 
    deletePacking,
    getPackingItems 
};