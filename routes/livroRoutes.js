const { Router } = require('express');
const controller = require('../controllers/LivroController');
const { autenticarToken, exigirRole } = require('../middlewares/authMiddleware');

const router = Router();

// Rotas públicas
router.get('/', (req, res, next) => controller.index(req, res, next));
router.get('/:id', (req, res, next) => controller.show(req, res, next));

// Apenas ADMIN
router.post(
  '/',
  autenticarToken,
  exigirRole('ADMIN'),
  (req, res, next) => controller.store(req, res, next)
);

// USER ou ADMIN
router.post(
  '/:id/comentarios',
  autenticarToken,
  exigirRole('USER', 'ADMIN'),
  (req, res, next) => controller.storeComment(req, res, next)
);

module.exports = router;
