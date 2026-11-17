const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://db-reviews:27017/reviews_db';

let isConnected = false;

// Esquema Mongoose para MongoDB
const reviewSchema = new mongoose.Schema({
  productId: { type: Number, required: true, index: true },
  author: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongoReview = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// In-Memory Fallback Store (para pruebas locales y tests sin requerir MongoDB levantado)
class MemoryReviewStore {
  constructor() {
    this.reviews = [];
    this.counter = 1;
  }

  async find(query = {}) {
    if (query.productId !== undefined) {
      return this.reviews.filter(r => r.productId === Number(query.productId));
    }
    return [...this.reviews];
  }

  async findById(id) {
    return this.reviews.find(r => r._id === id || r.id === id) || null;
  }

  async create(data) {
    const item = {
      _id: `rev_${this.counter++}`,
      id: `rev_${this.counter - 1}`,
      productId: Number(data.productId),
      author: data.author,
      rating: Number(data.rating),
      comment: data.comment,
      createdAt: new Date()
    };
    this.reviews.push(item);
    return item;
  }

  async findByIdAndDelete(id) {
    const idx = this.reviews.findIndex(r => r._id === id || r.id === id);
    if (idx !== -1) {
      return this.reviews.splice(idx, 1)[0];
    }
    return null;
  }

  async countDocuments() {
    return this.reviews.length;
  }

  clear() {
    this.reviews = [];
    this.counter = 1;
  }
}

const memoryStore = new MemoryReviewStore();

async function connectDB() {
  if (process.env.NODE_ENV === 'test') {
    isConnected = true;
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('MongoDB conectado exitosamente a:', MONGODB_URI);
  } catch (err) {
    console.warn('MongoDB no disponible, utilizando almacén NoSQL en memoria para alta disponibilidad:', err.message);
    isConnected = false;
  }
}

function getModel() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return MongoReview;
  }
  return memoryStore;
}

function checkReady() {
  if (process.env.NODE_ENV === 'test') {
    return { ready: true, engine: 'NoSQL In-Memory (Test Mode)' };
  }
  if (isConnected && mongoose.connection.readyState === 1) {
    return { ready: true, engine: 'MongoDB' };
  }
  return { ready: true, engine: 'NoSQL In-Memory Fallback' };
}

module.exports = {
  connectDB,
  getModel,
  checkReady,
  memoryStore
};
