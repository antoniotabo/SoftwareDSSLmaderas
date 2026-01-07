const express = require('express');
const router = express.Router();

// 1. Importar el Controlador (ESTO ESTÁ PERFECTO ✅)
const { 
    getClientes, 
    getClienteById, 
    createCliente, 
    updateCliente, 
    deleteCliente,
    existeRuc
} = require('../controllers/clienteController');

// 2. Importar el Middleware (AQUÍ ESTABA EL ERROR ⚠️)
// El archivo se llama 'authMiddleware' y no usa llaves {} porque es export default
const { verificarToken } = require('../middleware/auth.middleware');

// 3. Proteger todas las rutas de abajo
router.use(verificarToken); 

// 4. Rutas (ESTO ESTÁ PERFECTO ✅)
router.get('/', getClientes);           // Listar con filtros
router.get('/:id', getClienteById);     // Obtener uno para editar
router.post('/', createCliente);        // Crear
router.put('/:id', updateCliente);      // Editar
router.delete('/:id', deleteCliente);   // Eliminar
router.get('/existe-ruc/:ruc', existeRuc);
module.exports = router;