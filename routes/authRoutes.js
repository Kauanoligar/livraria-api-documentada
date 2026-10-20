const validateBody = require('../middlewares/validateBody');
const { Router } = require('express');
const controller = require('../controllers/AuthController');

const router = Router();
router.post('/register', validateBody('Registro'), (req, res, next) => controller.register(req, res, next));
router.post('/login', validateBody('Login'), (req, res, next) => controller.login(req, res, next));

module.exports = router;
