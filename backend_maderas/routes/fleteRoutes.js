const express = require('express');
const router = express.Router();
const { 
    getFletes, 
    getFleteById,
    createFlete,
    updateFlete,
    registrarPago,
    deleteFlete,
    getEstadisticas
} = require('../controllers/fleteController');
const { verificarToken } = require('../middleware/auth.middleware');

// Proteger todas las rutas
router.use(verificarToken);

// Rutas principales
router.get('/', getFletes);                    // Listar con filtros
router.get('/estadisticas', getEstadisticas);  // Estadísticas
router.get('/:id', getFleteById);              // Obtener uno
router.post('/', createFlete);                 // Crear
router.put('/:id', updateFlete);               // Actualizar
router.post('/:id/pago', registrarPago);       // Registrar pago
router.delete('/:id', deleteFlete);            // Eliminar

module.exports = router;