const db = require('../config/database');

const getDashboard = async (req, res) => {
    try {
        // Ejecutamos todas las consultas en paralelo para máxima velocidad
        const [
            [totalClientes],
            [totalProveedores],
            [totalTransportistas],
            [totalUsuarios],
            [ventasPorMes],
            [fletesPorEstado]
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as total FROM clientes WHERE estado = "ACTIVO"'),
            db.query('SELECT COUNT(*) as total FROM proveedores WHERE estado = "ACTIVO"'),
            db.query('SELECT COUNT(*) as total FROM transportistas WHERE estado = "ACTIVO"'),
            db.query('SELECT COUNT(*) as total FROM usuarios WHERE activo = 1'),
            // Gráfico de ventas (últimos 6 meses)
            db.query(`
                SELECT DATE_FORMAT(fecha, '%Y-%m') as mes, SUM(total) as total 
                FROM facturas 
                GROUP BY mes 
                ORDER BY mes DESC LIMIT 6
            `),
            // Estado de fletes
            db.query('SELECT estado, COUNT(*) as cantidad FROM fletes GROUP BY estado')
        ]);

        res.json({
            totals: {
                clientes: totalClientes[0].total,
                proveedores: totalProveedores[0].total,
                transportistas: totalTransportistas[0].total,
                usuarios: totalUsuarios[0].total
            },
            graficos: {
                ventas: ventasPorMes[0], // Array de ventas por mes
                fletes: fletesPorEstado[0] // Array de estados
            }
        });
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json({ message: 'Error al obtener datos del dashboard', error: error.message });
    }
};

module.exports = { getDashboard };