const express = require('express');
const router = express.Router();
// Ahora sí coinciden los nombres con el controller
const { 
    crearPacking, 
    obtenerPackings, 
    getPackingItems, 
    deletePacking 
} = require('../controllers/packingController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.post('/', crearPacking);       
router.get('/', obtenerPackings);     
router.get('/:id/items', getPackingItems); 
router.delete('/:id', deletePacking); 

module.exports = router;