const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/inventario/stock', inventoryController.getStock);
router.get('/inventario/movimientos', inventoryController.getMovimientos);

module.exports = router;