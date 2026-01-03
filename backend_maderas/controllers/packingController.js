const db = require('../config/database');

// Crear Packing con Transacción
const crearPacking = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { cliente_id, fecha, especie, tipo_madera, observaciones, items } = req.body;
        
        await connection.beginTransaction();

        // ✅ CORREGIDO: Usar las columnas correctas de la tabla
        const [resPacking] = await connection.query(
            'INSERT INTO packing (cliente_id, fecha, especie, tipo_madera, observaciones) VALUES (?, ?, ?, ?, ?)',
            [cliente_id, fecha, especie, tipo_madera, observaciones]
        );
        
        const packingId = resPacking.insertId;

        // Insertar Items
        if (items && items.length > 0) {
            const values = items.map(item => [
                packingId,
                item.cantidad_piezas,
                item.e,  // espesor
                item.a,  // ancho
                item.l,  // largo
                item.volumen_pt,
                item.categoria
            ]);
            
            await connection.query(
                'INSERT INTO packing_items (packing_id, cantidad_piezas, e, a, l, volumen_pt, categoria) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Packing registrado exitosamente', 
            id: packingId 
        });

    } catch (error) {
        await connection.rollback();
        console.error("❌ Error al crear packing:", error);
        res.status(500).json({ 
            success: false,
            message: 'Error al crear packing', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

// Obtener Items de un Packing
const getPackingItems = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.query(
            'SELECT * FROM packing_items WHERE packing_id = ?', 
            [id]
        );
        res.json({ success: true, data: items });
    } catch (error) {
        console.error("❌ Error al obtener items:", error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener items', 
            error: error.message 
        });
    }
};

// Eliminar Packing Completo
const deletePacking = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();

        // Primero eliminar items
        await connection.query('DELETE FROM packing_items WHERE packing_id = ?', [id]);
        
        // Luego eliminar packing
        const [result] = await connection.query('DELETE FROM packing WHERE id = ?', [id]);

        await connection.commit();

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Packing no encontrado' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Packing eliminado correctamente' 
        });
    } catch (error) {
        await connection.rollback();
        console.error("❌ Error al eliminar packing:", error);
        res.status(500).json({ 
            success: false,
            message: 'Error al eliminar packing', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

// Listar Packings
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
                COALESCE(SUM(pi.volumen_pt), 0) as total_pt
            FROM packing p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            LEFT JOIN packing_items pi ON p.id = pi.packing_id
            GROUP BY p.id, p.fecha, p.cliente_id, c.razon_social, p.especie, p.tipo_madera, p.observaciones
            ORDER BY p.fecha DESC
        `);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("❌ Error al obtener packings:", error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener packings', 
            error: error.message 
        });
    }
};

// Obtener un Packing por ID con sus Items
const getPackingById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener cabecera
        const [packing] = await db.query(`
            SELECT 
                p.*,
                c.razon_social as cliente_nombre
            FROM packing p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            WHERE p.id = ?
        `, [id]);

        if (packing.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Packing no encontrado' 
            });
        }

        // Obtener items
        const [items] = await db.query(
            'SELECT * FROM packing_items WHERE packing_id = ?',
            [id]
        );

        res.json({ 
            success: true, 
            data: {
                ...packing[0],
                items: items
            }
        });
    } catch (error) {
        console.error("❌ Error al obtener packing:", error);
        res.status(500).json({ 
            success: false,
            message: 'Error al obtener packing', 
            error: error.message 
        });
    }
};

module.exports = { 
    crearPacking, 
    obtenerPackings, 
    getPackingItems, 
    deletePacking,
    getPackingById 
};