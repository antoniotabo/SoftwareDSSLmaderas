const express = require('express');
const router = express.Router();
const { crearPacking, obtenerPackings, obtenerPackingPorId } = require('../controllers/packingController');
const { verificarToken } = require('../middleware/auth.middleware');

// Todas las rutas protegidas
router.use(verificarToken);

router.post('/', crearPacking);       // Crear Packing + Items
router.get('/', obtenerPackings);     // Listar
router.get('/:id', obtenerPackingPorId); // Ver detalle

module.exports = router;