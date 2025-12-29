require('dotenv').config(); // Cargar variables de entorno primero
const express = require('express');
const cors = require('cors');

// ==========================================
// 1. IMPORTACIÓN DE RUTAS (Todos los módulos)
// ==========================================
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const transportistaRoutes = require('./routes/transportistaRoutes');
const packingRoutes = require('./routes/packingRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const compraRoutes = require('./routes/compraRoutes');
const fleteRoutes = require('./routes/fleteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// ==========================================
// 2. CONFIGURACIÓN DEL SERVIDOR
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 3. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors()); // Permite que Angular se conecte sin bloqueos
app.use(express.json()); // Permite recibir datos JSON en el body (POST/PUT)
app.use(express.urlencoded({ extended: true })); // Permite recibir datos de formularios urlencoded

// ==========================================
// 4. DEFINICIÓN DE ENDPOINTS (API)
// ==========================================

// Seguridad y Usuarios
app.use('/api/auth', authRoutes);           // Login y Registro
app.use('/api/usuarios', usuarioRoutes);    // Gestión de usuarios (Admin)

// Mantenimiento (Tablas Maestras)
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/transportistas', transportistaRoutes);

// Operaciones Principales
app.use('/api/packing', packingRoutes);     // Producción (Maderas)
app.use('/api/facturas', facturaRoutes);    // Ventas y Cobranzas
app.use('/api/compras', compraRoutes);      // Compras y Gastos
app.use('/api/fletes', fleteRoutes);        // Logística

// Reportes
app.use('/api/dashboard', dashboardRoutes); // Gráficos y Resumen

// ==========================================
// 5. RUTAS DE UTILIDAD
// ==========================================

// Ruta raíz (Para verificar que el server responde)
app.get('/', (req, res) => {
    res.json({
        sistema: "Software DSSL Maderas - API REST",
        estado: "En línea 🚀",
        version: "1.0.0",
        autor: "Antonio Tabo"
    });
});

// Manejo de errores 404 (Ruta no encontrada)
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        mensaje: "⚠️ La ruta solicitada no existe en esta API" 
    });
});

// ==========================================
// 6. INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════');
    console.log(`🚀 Servidor Maderas corriendo en puerto ${PORT}`);
    console.log(`📡 URL Base: http://localhost:${PORT}`);
    console.log('═══════════════════════════════════════════');
});