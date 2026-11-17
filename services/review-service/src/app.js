const express = require('express');
const cors = require('cors');
const { getModel, checkReady } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

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
