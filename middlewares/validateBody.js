const { components } = require('../docs/openapi.json');

// Compartilha as regras de entrada com o contrato OpenAPI para evitar divergências.
module.exports = function validateBody(schemaName) {
  const schema = components.schemas[schemaName];
  return (req, res, next) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ erro: 'Informe um objeto JSON no corpo da requisição.' });
    }
    for (const field of schema.required || []) {
      if (body[field] === undefined || body[field] === null) {
        return res.status(400).json({ erro: `O campo ${field} é obrigatório.` });
      }
    }
    for (const [field, rule] of Object.entries(schema.properties)) {
      const value = body[field];
      if (value === undefined) continue;
      const valid = rule.type === 'integer'
        ? Number.isSafeInteger(value)
        : typeof value === rule.type;
      if (!valid) {
        return res.status(400).json({ erro: `O campo ${field} deve ser do tipo ${rule.type}.` });
      }
      if (rule.minLength && value.trim().length < rule.minLength) {
        return res.status(400).json({ erro: `O campo ${field} deve conter pelo menos ${rule.minLength} caracteres.` });
      }
    }
    next();
  };
};
