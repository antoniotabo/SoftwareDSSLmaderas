const express = require('express');
const router = express.Router();
const { 
    getUsuarios, 
    updateUsuario, 
    deleteUsuario 
} = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth.middleware');

router.use(verificarToken);

router.get('/', getUsuarios);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

module.exports = router;