const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.get('/', compraController.getCompras);
router.post('/', compraController.createCompra);

// ✅ Tienes que tener estas dos líneas para que funcione lo nuevo:
router.get('/:id', compraController.getCompraById);      // Para editar
router.put('/:id/pago', compraController.registrarPago); // Para el botón de pagar

router.put('/:id', compraController.updateCompra);
router.delete('/:id', compraController.deleteCompra);

module.exports = router;