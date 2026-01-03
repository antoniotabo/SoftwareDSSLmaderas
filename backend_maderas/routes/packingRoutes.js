const express = require('express');
const router = express.Router();

const { 
    crearPacking, 
    obtenerPackings, 
    getPackingItems, 
    deletePacking,
    getPackingById 
} = require('../controllers/packingController');

const { verificarToken } = require('../middleware/auth.middleware');

// Proteger todas las rutas
router.use(verificarToken);

// Rutas
router.post('/', crearPacking);              // Crear packing con items
router.get('/', obtenerPackings);            // Listar todos los packings
router.get('/:id', getPackingById);          // Obtener packing específico con items
router.get('/:id/items', getPackingItems);   // Solo obtener items de un packing
router.delete('/:id', deletePacking);        // Eliminar packing y sus items

module.exports = router;