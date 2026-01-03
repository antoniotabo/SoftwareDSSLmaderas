const db = require('../config/database');

// 1. OBTENER STOCK (Desde la Vista que ya arreglamos)
const getStock = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_stock_real ORDER BY stock_actual_pt DESC');
        
        const dataFormateada = rows.map(row => ({
            especie: row.producto || 'Sin Nombre', 
            tipo_madera: 'General', 
            ubicacion: 'Almacén Principal', 
            cantidad_pt: row.stock_actual_pt || 0,
            entradas: row.entradas_pt,
            salidas: row.salidas_pt
        }));

        res.json({ success: true, data: dataFormateada });
    } catch (error) {
        console.error('Error en getStock:', error);
        res.status(500).json({ message: 'Error al calcular inventario' });
    }
};

// 2. OBTENER MOVIMIENTOS (Aquí estaba el error 500)
const getMovimientos = async (req, res) => {
    try {
        const sql = `
            SELECT * FROM (
                -- COMPRAS (Aquí sí existe estado, lo dejamos opcionalmente o lo quitamos si quieres ver todo)
                SELECT 
                    'COMPRA' as tipo, 
                    fecha, 
                    tipo_producto as detalle, 
                    cantidad_pt as cantidad, 
                    'Sistema' as usuario
                FROM compras 
                -- WHERE estado != 'ANULADA' -- (Opcional: Tu tabla solo tiene PENDIENTE/CANCELADO, así que esto no filtra nada por ahora)

                UNION ALL

                -- PACKING / SALIDAS
                SELECT 
                    'VENTA/PACKING' as tipo, 
                    p.fecha, 
                    -- Usamos CONCAT_WS para evitar problemas si 'tipo_madera' es NULL
                    CONCAT_WS(' ', p.especie, p.tipo_madera) as detalle, 
                    pi.volumen_pt as cantidad, 
                    'Sistema' as usuario
                FROM packing p 
                JOIN packing_items pi ON p.id = pi.packing_id
                -- ❌ AQUÍ QUITAMOS EL 'WHERE p.estado' PORQUE ESA COLUMNA NO EXISTE
            ) as historial
            ORDER BY fecha DESC 
            LIMIT 50
        `;
        
        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error en getMovimientos:', error); // Esto te mostrará el error real en la terminal negra
        res.status(500).json({ message: 'Error al obtener historial' });
    }
};

module.exports = { getStock, getMovimientos };