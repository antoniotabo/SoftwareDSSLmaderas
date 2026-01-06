const db = require('../config/database');

// ==========================================
// 1. OBTENER STOCK (KARDEX ACTUAL)
// ==========================================
const getStock = async (req, res) => {
    try {
        const sql = `
            SELECT id, especie, tipo_madera, cantidad_pt, ubicacion, fecha
            FROM stock
            ORDER BY fecha DESC, id DESC
        `;
        
        const [rows] = await db.query(sql);
        res.json({ data: rows }); 
    } catch (error) {
        console.error('Error al obtener stock:', error);
        res.status(500).json({ message: 'Error al obtener el inventario' });
    }
};

// ==========================================
// 2. OBTENER HISTORIAL (MOVIMIENTOS)
// ==========================================
const getMovimientos = async (req, res) => {
    try {
        const sql = `
            SELECT * FROM (
                -- COMPRAS
                SELECT 
                    'COMPRA' as tipo, 
                    id,  -- Necesitamos el ID para desempatar
                    fecha, 
                    tipo_producto as detalle, 
                    cantidad_pt as cantidad, 
                    'Sistema' as usuario
                FROM compras 
                WHERE estado != 'ANULADA' 

                UNION ALL

                -- PACKING
                SELECT 
                    'VENTA/PACKING' as tipo, 
                    p.id, -- Necesitamos el ID para desempatar
                    p.fecha, 
                    CONCAT_WS(' ', p.especie, p.tipo_madera) as detalle, 
                    pi.volumen_pt as cantidad, 
                    'Sistema' as usuario
                FROM packing p 
                JOIN packing_items pi ON p.id = pi.packing_id
            ) as historial
            -- 🔥 CAMBIO CLAVE: Ordenar por Fecha Y por ID para que los nuevos salgan siempre arriba
            ORDER BY fecha DESC, id DESC 
            LIMIT 50
        `;
        
        const [rows] = await db.query(sql);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error en getMovimientos:', error);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
};

// ==========================================
// 3. OBTENER LISTAS (PARA COMBOBOX)
// ==========================================
const getSelectores = async (req, res) => {
    try {
        const connection = await db.getConnection();
        
        // 1. Especies Únicas
        const [especies] = await connection.query(
            "SELECT DISTINCT especie FROM stock WHERE especie IS NOT NULL AND especie != '' ORDER BY especie"
        );
        
        // 2. Tipos Únicos
        const [tipos] = await connection.query(
            "SELECT DISTINCT tipo_madera FROM stock WHERE tipo_madera IS NOT NULL AND tipo_madera != '' ORDER BY tipo_madera"
        );

        connection.release();
        
        res.json({ 
            especies: especies.map(e => e.especie), 
            tipos: tipos.map(t => t.tipo_madera) 
        });

    } catch (error) {
        console.error('Error al cargar selectores:', error);
        res.status(500).json({ message: 'Error al cargar listas' });
    }
};

module.exports = { getStock, getMovimientos, getSelectores };