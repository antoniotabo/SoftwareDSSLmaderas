const express = require('express');
const router = express.Router();


const inventarioController = require('../controllers/inventoryController'); 

// Rutas (Ya asumen que entran por /api/inventario en el server.js)
router.get('/stock', inventarioController.getStock);
router.get('/movimientos', inventarioController.getMovimientos);
router.get('/selectores', inventarioController.getSelectores);

module.exports = router;