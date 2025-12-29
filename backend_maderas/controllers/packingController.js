const db = require('../config/database');

// ✅ CAMBIO AQUÍ: De 'createPacking' a 'crearPacking'
const crearPacking = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { cliente_id, fecha, observacion, items } = req.body;
        
        await connection.beginTransaction();

        // Insertar Cabecera
        const [resPacking] = await connection.query(
            'INSERT INTO packing (cliente_id, fecha, observacion, usuario_id) VALUES (?, ?, ?, ?)',
            [cliente_id, fecha, observacion, req.usuario.id]
        );
        
        const packingId = resPacking.insertId;

        // Insertar Items
        if (items && items.length > 0) {
            const values = items.map(item => [
                packingId, 
                item.especie, 
                item.espesor, 
                item.ancho, 
                item.largo, 
                item.cantidad, 
                item.vol_pt
            ]);
            
            await connection.query(
                'INSERT INTO packing_items (packing_id, especie, espesor, ancho, largo, cantidad, vol_pt) VALUES ?',
                [values]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Packing registrado', id: packingId });

    } catch (error) {
        await connection.rollback();
        console.error("Error al crear packing:", error);
        res.status(500).json({ message: 'Error al crear packing', error: error.message });
    } finally {
        connection.release();
    }
};

// Obtener Items de un Packing
const getPackingItems = async (req, res) => {
    try {
        const { id } = req.params;
        const [items] = await db.query('SELECT * FROM packing_items WHERE packing_id = ?', [id]);
        // Estandarizamos la respuesta
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener items', error: error.message });
    }
};

// Eliminar Packing Completo (Transacción)
const deletePacking = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();

        // Primero borramos hijos
        await connection.query('DELETE FROM packing_items WHERE packing_id = ?', [id]);
        // Luego borramos padre
        const [result] = await connection.query('DELETE FROM packing WHERE id = ?', [id]);

        await connection.commit();

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Packing no encontrado' });
        res.json({ success: true, message: 'Packing eliminado correctamente' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: 'Error al eliminar', error: error.message });
    } finally {
        connection.release();
    }
};

// Listar Packings (Cabecera)
const obtenerPackings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre_razon_social as cliente 
            FROM packing p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            ORDER BY p.fecha DESC
        `);
        // Estandarizamos la respuesta
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ IMPORTANTE: Exportamos 'crearPacking' (en español)
module.exports = { crearPacking, obtenerPackings, getPackingItems, deletePacking };