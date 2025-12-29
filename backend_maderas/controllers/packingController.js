const db = require('../config/database');

/**
 * Crear un Packing completo (Cabecera + Items)
 * Transacción ACID: O se guarda todo, o no se guarda nada.
 */
const crearPacking = async (req, res) => {
    // 1. Obtener una conexión dedicada para la transacción
    // (No usamos 'db' directo porque necesitamos commit/rollback)
    // NOTA: db.getConnection() es necesario para transacciones manuales
    // Como usamos pool.promise(), accedemos al pool original para esto o usamos lógica simple:
    
    // Simplificación para mysql2 con pool:
    const connection = await db.getConnection();

    try {
        const { cliente_id, fecha, observacion, items } = req.body;
        // items es un array: [{ especie, espesor, ancho, largo, cantidad, ... }]

        // 2. Iniciar Transacción
        await connection.beginTransaction();

        // 3. Insertar Cabecera (Packing)
        const [packingResult] = await connection.query(
            'INSERT INTO packing (cliente_id, fecha, observacion, usuario_id) VALUES (?, ?, ?, ?)',
            [cliente_id, fecha, observacion, req.usuario.id] // req.usuario.id viene del token
        );
        
        const packingId = packingResult.insertId;

        // 4. Insertar Items (Loop)
        // Preparamos los valores para una inserción masiva (Bulk Insert) por eficiencia
        if (items && items.length > 0) {
            const values = items.map(item => [
                packingId, 
                item.especie, 
                item.espesor, 
                item.ancho, 
                item.largo, 
                item.cantidad,
                item.volumen_pt // Asegúrate de calcular esto en el frontend o aquí
            ]);

            await connection.query(
                'INSERT INTO packing_items (packing_id, especie, espesor, ancho, largo, cantidad, volumen_pt) VALUES ?',
                [values]
            );
        }

        // 5. Confirmar Cambios
        await connection.commit();

        res.status(201).json({
            success: true,
            mensaje: 'Packing registrado correctamente',
            data: { id: packingId, items_count: items.length }
        });

    } catch (error) {
        // 6. Si algo falla, revertir todo
        await connection.rollback();
        console.error('Error en crearPacking:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar el packing',
            error: error.message
        });
    } finally {
        // 7. Liberar conexión siempre
        connection.release();
    }
};

/**
 * Obtener todos los packings
 */
const obtenerPackings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.nombre as cliente_nombre 
            FROM packing p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            ORDER BY p.fecha DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Obtener un packing con sus items
 */
const obtenerPackingPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Consultar cabecera
        const [packing] = await db.query('SELECT * FROM packing WHERE id = ?', [id]);
        if (packing.length === 0) return res.status(404).json({ success: false, msg: 'No encontrado' });

        // Consultar hijos
        const [items] = await db.query('SELECT * FROM packing_items WHERE packing_id = ?', [id]);

        res.json({
            success: true,
            data: { ...packing[0], items }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { crearPacking, obtenerPackings, obtenerPackingPorId };