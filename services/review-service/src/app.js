const express = require('express');
const cors = require('cors');
const { getModel, checkReady } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// --- Documentación OpenAPI / Swagger ---
const reviewOpenApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Review Service API (Node.js + Express)',
    version: '1.0.0',
    description: 'Microservicio 2 para Parcial 2: Reseñas y calificaciones NoSQL (MongoDB).'
  },
  paths: {
    '/health/live': {
      get: {
        summary: 'Liveness Probe (Kubernetes)',
        responses: { 200: { description: 'Servicio vivo' } }
      }
    },
    '/health/ready': {
      get: {
        summary: 'Readiness Probe (Kubernetes)',
        responses: { 200: { description: 'Base de datos MongoDB lista' } }
      }
    },
    '/api/reviews': {
      get: {
        summary: 'Listar todas las reseñas',
        parameters: [
          {
            name: 'productId',
            in: 'query',
            description: 'Filtrar por ID de producto',
            required: false,
            schema: { type: 'integer' }
          }
        ],
        responses: { 200: { description: 'Lista de reseñas' } }
      },
      post: {
        summary: 'Registrar nueva reseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'author', 'rating', 'comment'],
                properties: {
                  productId: { type: 'integer', example: 1 },
                  author: { type: 'string', example: 'Carlos Mendoza' },
                  rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                  comment: { type: 'string', example: 'Excelente producto, entrega rápida.' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Reseña registrada con éxito' },
          400: { description: 'Datos inválidos' }
        }
      }
    },
    '/api/reviews/{id}': {
      get: {
        summary: 'Obtener reseña por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Reseña encontrada' },
          404: { description: 'Reseña no encontrada' }
        }
      },
      delete: {
        summary: 'Eliminar reseña por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          204: { description: 'Reseña eliminada con éxito' },
          404: { description: 'Reseña no encontrada' }
        }
      }
    }
  }
};

app.get('/api/reviews/openapi.json', (req, res) => {
  res.status(200).json(reviewOpenApiSpec);
});

app.get('/api/reviews/docs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Review Service API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body style="margin:0; background:#fafafa;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api/reviews/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: 'BaseLayout'
      });
    };
  </script>
</body>
</html>`);
});

// --- Sondas de Salud (Kubernetes Probes) ---
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive', service: 'review-service' });
});

app.get('/health/ready', (req, res) => {
  const status = checkReady();
  if (status.ready) {
    return res.status(200).json({ status: 'ready', database: status.engine });
  }
  return res.status(503).json({ status: 'unavailable', detail: 'Base de datos no lista' });
});

// --- Endpoints de Negocio ---

// Listar reseñas (opcionalmente filtradas por ?productId=X)
app.get('/api/reviews', async (req, res) => {
  try {
    const Model = getModel();
    const query = {};
    if (req.query.productId) {
      query.productId = Number(req.query.productId);
    }
    const reviews = await Model.find(query);
    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar reseñas', detail: err.message });
  }
});

// Obtener reseña por ID
app.get('/api/reviews/:id', async (req, res) => {
  try {
    const Model = getModel();
    const review = await Model.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: `Reseña con ID ${req.params.id} no encontrada` });
    }
    res.status(200).json(review);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener la reseña', detail: err.message });
  }
});

// Registrar nueva reseña
app.post('/api/reviews', async (req, res) => {
  const { productId, author, rating, comment } = req.body;

  if (productId === undefined || productId === null || isNaN(Number(productId))) {
    return res.status(400).json({ error: 'El campo productId es obligatorio y debe ser numérico' });
  }

  if (!author || typeof author !== 'string' || author.trim().length < 2) {
    return res.status(400).json({ error: 'El campo author es obligatorio (mínimo 2 caracteres)' });
  }

  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'El campo rating debe ser un número entero entre 1 y 5' });
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    return res.status(400).json({ error: 'El campo comment es obligatorio' });
  }

  try {
    const Model = getModel();
    const newReview = await Model.create({
      productId: Number(productId),
      author: author.trim(),
      rating: Math.round(numRating),
      comment: comment.trim()
    });
    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar la reseña', detail: err.message });
  }
});

// Eliminar reseña
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const Model = getModel();
    const deleted = await Model.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: `Reseña con ID ${req.params.id} no encontrada` });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la reseña', detail: err.message });
  }
});

module.exports = app;
