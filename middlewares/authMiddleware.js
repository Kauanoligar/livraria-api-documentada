const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      erro: 'Formato de autenticação inválido. Use Authorization: Bearer <token>.'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'livraria-api'
    });

    req.usuario = {
      id: payload.sub,
      nome: payload.nome,
      role: payload.role
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado.' });
    }

    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

function exigirRole(...rolesPermitidas) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    if (!rolesPermitidas.includes(req.usuario.role)) {
      return res.status(403).json({
        erro: `Acesso proibido: perfil permitido: ${rolesPermitidas.join(' ou ')}.`
      });
    }

    return next();
  };
}

module.exports = { autenticarToken, exigirRole };
