const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi.json');

const authRoutes = require('./routes/authRoutes');
const livroRoutes = require('./routes/livroRoutes');
const autorRoutes = require('./routes/autorRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

// Contrato público: documentação e JSON não exigem autenticação.
app.get('/api-docs.json', (req, res) => res.json(openapi));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(null, {
  swaggerOptions: { url: '/api-docs.json' },
  customSiteTitle: 'Documentação | API de Livraria'
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/livros', livroRoutes);
app.use('/api/v1/autores', autorRoutes);

app.use(errorHandler);

module.exports = app;
