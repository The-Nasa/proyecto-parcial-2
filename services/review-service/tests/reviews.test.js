const request = require('supertest');
const app = require('../src/app');
const { memoryStore } = require('../src/db');

describe('Review Service (Node.js + Express) Unit Tests', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  test('GET /health/live debe responder 200 y status alive', async () => {
    const res = await request(app).get('/health/live');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('alive');
    expect(res.body.service).toBe('review-service');
  });

  test('GET /health/ready debe responder 200 y status ready', async () => {
    const res = await request(app).get('/health/ready');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ready');
  });

  test('POST /api/reviews crea una reseña y responde 201', async () => {
    const payload = {
      productId: 1,
      author: 'Lucía Fernández',
      rating: 5,
      comment: 'Excelente producto, llegó rápido y en perfecto estado.'
    };

    const res = await request(app)
      .post('/api/reviews')
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.author).toBe('Lucía Fernández');
    expect(res.body.rating).toBe(5);
    expect(res.body.productId).toBe(1);
    expect(res.body.id || res.body._id).toBeDefined();

    // Comprobar que aparece en el listado
    const listRes = await request(app).get('/api/reviews');
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.length).toBe(1);
  });

  test('GET /api/reviews?productId=X filtra correctamente por producto', async () => {
    await request(app).post('/api/reviews').send({
      productId: 1,
      author: 'User 1',
      rating: 4,
      comment: 'Bueno'
    });

    await request(app).post('/api/reviews').send({
      productId: 2,
      author: 'User 2',
      rating: 5,
      comment: 'Muy bueno'
    });

    const res = await request(app).get('/api/reviews?productId=1');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].productId).toBe(1);
  });

  test('POST /api/reviews rechaza calificaciones inválidas con 400', async () => {
    const invalidRatingPayload = {
      productId: 1,
      author: 'Test',
      rating: 6, // Rating fuera de rango (1-5)
      comment: 'Calificación inválida'
    };

    const res = await request(app)
      .post('/api/reviews')
      .send(invalidRatingPayload);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('rating');
  });

  test('POST /api/reviews rechaza autor vacío o inválido', async () => {
    const missingAuthorPayload = {
      productId: 1,
      author: '',
      rating: 4,
      comment: 'Sin autor'
    };

    const res = await request(app)
      .post('/api/reviews')
      .send(missingAuthorPayload);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('author');
  });
});
