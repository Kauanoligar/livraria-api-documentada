function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  const mensagem = err.message || 'Ocorreu um erro interno no servidor.';

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    erro: mensagem
  });
}

module.exports = errorHandler;
