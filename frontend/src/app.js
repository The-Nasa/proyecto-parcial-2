// Endpoints relativos: enrutados por Nginx Reverse Proxy
const API_PRODUCTS = '/api/products';
const API_REVIEWS = '/api/reviews';

let currentProducts = [];

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  loadData();
  // Sondeo periódico de salud cada 15 segundos
  setInterval(checkHealth, 15000);
});

// --- Chequeo de Salud de ambos Microservicios ---
async function checkHealth() {
  // Servicio Python (Productos)
  try {
    const res = await fetch(`${API_PRODUCTS.replace('/api/products', '')}/health/live`);
    if (res.ok) {
      document.getElementById('badge-python').classList.add('status-online');
      document.getElementById('badge-python').classList.remove('status-offline');
      document.getElementById('status-python').innerText = 'Online';
    } else {
      throw new Error();
    }
  } catch {
    document.getElementById('badge-python').classList.remove('status-online');
    document.getElementById('badge-python').classList.add('status-offline');
    document.getElementById('status-python').innerText = 'Desconectado';
  }

  // Servicio Node.js (Reseñas)
  try {
    const res = await fetch(`${API_REVIEWS.replace('/api/reviews', '')}/health/live`);
    if (res.ok) {
      document.getElementById('badge-node').classList.add('status-online');
      document.getElementById('badge-node').classList.remove('status-offline');
      document.getElementById('status-node').innerText = 'Online';
    } else {
      throw new Error();
    }
  } catch {
    document.getElementById('badge-node').classList.remove('status-online');
    document.getElementById('badge-node').classList.add('status-offline');
    document.getElementById('status-node').innerText = 'Desconectado';
  }
}

// --- Carga Paralela de Datos (Promise.all) ---
async function loadData() {
  await Promise.all([loadProducts(), loadReviews()]);
}

// --- Servicio 1: Catálogo de Productos (Python) ---
async function loadProducts() {
  const container = document.getElementById('products-list');
  try {
    const res = await fetch(API_PRODUCTS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentProducts = await res.json();

    if (currentProducts.length === 0) {
      container.innerHTML = '<div class="empty-state">No hay productos registrados en PostgreSQL. ¡Agrega el primero!</div>';
      updateReviewSelect();
      return;
    }

    container.innerHTML = currentProducts.map(prod => `
      <div class="card">
        <div class="card-top">
          <span class="card-title">${escapeHtml(prod.name)}</span>
          <span class="card-price">$${Number(prod.price).toFixed(2)}</span>
        </div>
        <p class="card-desc">${escapeHtml(prod.description || 'Sin descripción detallada.')}</p>
        <div class="card-footer">
          <span>Categoría: <strong>${escapeHtml(prod.category)}</strong></span>
          <span>Stock: <strong>${prod.stock} uds.</strong></span>
        </div>
      </div>
    `).join('');

    updateReviewSelect();
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Error conectando con el servicio de Productos: ${err.message}</div>`;
  }
}

async function handleCreateProduct(event) {
  event.preventDefault();
  const payload = {
    name: document.getElementById('prod-name').value.trim(),
    price: parseFloat(document.getElementById('prod-price').value),
    stock: parseInt(document.getElementById('prod-stock').value, 10),
    category: document.getElementById('prod-category').value.trim(),
    description: document.getElementById('prod-desc').value.trim()
  };

  try {
    const res = await fetch(API_PRODUCTS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al guardar el producto');
    }

    showToast('✅ Producto guardado en PostgreSQL (Python Service)');
    closeProductModal();
    document.getElementById('product-form').reset();
    await loadProducts();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// --- Servicio 2: Reseñas y Calificaciones (Node.js) ---
async function loadReviews() {
  const container = document.getElementById('reviews-list');
  try {
    const res = await fetch(API_REVIEWS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const reviews = await res.json();

    if (reviews.length === 0) {
      container.innerHTML = '<div class="empty-state">No hay reseñas registradas en MongoDB. ¡Sé el primero en calificar!</div>';
      return;
    }

    container.innerHTML = reviews.map(rev => {
      const prodName = currentProducts.find(p => p.id === rev.productId)?.name || `Producto #${rev.productId}`;
      const stars = '⭐'.repeat(Math.min(5, Math.max(1, rev.rating)));
      const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Reciente';

      return `
        <div class="card">
          <div class="card-top">
            <span class="card-title">${escapeHtml(rev.author)}</span>
            <span class="rating-stars">${stars}</span>
          </div>
          <div style="font-size: 11px; color: #60a5fa; margin-bottom: 6px;">
            Para: <strong>${escapeHtml(prodName)}</strong>
          </div>
          <p class="card-desc">"${escapeHtml(rev.comment)}"</p>
          <div class="card-footer">
            <span>Fecha: ${dateStr}</span>
            <span>ID: <code>${escapeHtml(rev.id || rev._id || 'N/A')}</code></span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Error conectando con el servicio de Reseñas: ${err.message}</div>`;
  }
}

async function handleCreateReview(event) {
  event.preventDefault();
  const payload = {
    productId: parseInt(document.getElementById('rev-product').value, 10),
    author: document.getElementById('rev-author').value.trim(),
    rating: parseInt(document.getElementById('rev-rating').value, 10),
    comment: document.getElementById('rev-comment').value.trim()
  };

  try {
    const res = await fetch(API_REVIEWS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar la reseña');
    }

    showToast('⭐ Reseña guardada en MongoDB (Node.js Service)');
    closeReviewModal();
    document.getElementById('review-form').reset();
    await loadReviews();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// --- Helpers de UI y Modales ---
function updateReviewSelect() {
  const select = document.getElementById('rev-product');
  select.innerHTML = '<option value="">Selecciona un producto...</option>' +
    currentProducts.map(p => `<option value="${p.id}">${escapeHtml(p.name)} ($${Number(p.price).toFixed(2)})</option>`).join('');
}

function openProductModal() {
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

function openReviewModal() {
  if (currentProducts.length === 0) {
    showToast('⚠️ Primero crea al menos un producto en el catálogo');
    return;
  }
  document.getElementById('review-modal').classList.add('active');
}

function closeReviewModal() {
  document.getElementById('review-modal').classList.remove('active');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
