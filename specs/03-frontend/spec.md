# 📄 SDD Spec 03: Frontend Integrador (Nginx + Web UI)

- **ID:** `SPEC-03-FRONTEND`
- **Tecnología:** HTML5 + CSS3 (Tailwind / Bootstrap Dark Mode) + Vanilla JS Asíncrono
- **Servidor Web:** Nginx 1.25 Alpine
- **Estado SDD:** `approved`

---

## 1. Alcance Funcional

Proporcionar una interfaz visual interactiva que consulte y muestre datos de ambos microservicios en una sola vista, y permita registrar nuevos productos y reseñas en tiempo real.

### Pantallas y Componentes:

1. **Encabezado:** Nombre del sistema ("CloudStore"), badges de estado de salud en vivo de los dos microservicios.
2. **Panel de Catálogo (Servicio Python):**
   - Listado de productos con tarjetas visuales (Nombre, precio, categoría, stock).
   - Formulario para agregar un producto nuevo (`POST /api/products`).
3. **Panel de Reseñas (Servicio Node.js):**
   - Listado de reseñas con autor, estrellas de calificación (⭐⭐⭐⭐⭐) y comentario.
   - Formulario para agregar una reseña a un producto (`POST /api/reviews`).
4. **Consumo Asíncrono:** Uso de `fetch` / `Promise.all` para consultar ambos servicios en paralelo.

---

## 2. Arquitectura de Red y Solución Anti-CORS

Para evitar problemas de CORS cuando la aplicación se ejecute en Kubernetes en AWS, el servidor **Nginx del Frontend actuará como Reverse Proxy**:

* Solicitudes a `/api/products/*` ➡️ Nginx las redirige internamente a `http://product-service:8000/api/products/*`.
* Solicitudes a `/api/reviews/*` ➡️ Nginx las redirige internamente a `http://review-service:3000/api/reviews/*`.
* Solicitudes a `/` ➡️ Nginx sirve los archivos estáticos (`index.html`, `app.js`, `style.css`).

De esta manera, el navegador del usuario solo se comunica con el puerto 80 del Frontend y jamás sufre bloqueos de CORS.
