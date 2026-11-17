# 📄 SDD Spec 02: Microservicio de Reseñas (Node.js - Express)

- **ID:** `SPEC-02-REVIEWS`
- **Lenguaje / Framework:** Node.js 20 LTS + Express.js
- **Base de Datos:** Almacén Documental NoSQL / NeDB (`/app/data/reviews.db`)
- **Estado SDD:** `approved`

---

## 1. Alcance Funcional
Gestionar las calificaciones y opiniones de clientes sobre los productos, manteniendo un almacenamiento documental desacoplado.

### Endpoints Requeridos:
| Método | Ruta | Descripción | Códigos HTTP |
| :--- | :--- | :--- | :--- |
| **GET** | `/health/live` | Liveness probe para Kubernetes | `200 OK` |
| **GET** | `/health/ready` | Readiness probe (valida estado del almacén) | `200 OK`, `503 Unavailable` |
| **GET** | `/api/reviews` | Lista todas las reseñas (filtro opcional `?productId=1`) | `200 OK` |
| **POST** | `/api/reviews` | Agrega una nueva reseña a un producto | `201 Created`, `400 Bad Request` |

---

## 2. Esquema de Datos (JSON)

### Petición de Creación:
```json
{
  "productId": 1,
  "author": "Carlos Mendoza",
  "rating": 5,
  "comment": "Excelente rendimiento, muy recomendada para edición y juegos."
}
```

### Respuesta de Reseña:
```json
{
  "id": "rev_7f8a9b",
  "productId": 1,
  "author": "Carlos Mendoza",
  "rating": 5,
  "comment": "Excelente rendimiento, muy recomendada para edición y juegos.",
  "createdAt": "2026-11-17T20:05:00Z"
}
```

---

## 3. Validaciones de Negocio
* `productId`: Número entero positivo obligatorio.
* `author`: Cadena de texto no vacía (mínimo 2 caracteres).
* `rating`: Entero entre 1 y 5 estrellas.
* `comment`: Cadena de texto no vacía.

---

## 4. Principio Database-per-Service
* El microservicio almacena sus documentos en un archivo independiente en `/app/data/reviews.db`.
* Es completamente ajeno al catálogo de productos; no comparte tablas, colecciones ni conexiones con el Servicio 1.

---

## 5. Requisitos de Calidad y Pruebas
* **Framework de Pruebas:** `jest` con `supertest`.
* **Casos obligatorios:**
  1. `GET /health/ready`: Retorna 200 y status "READY".
  2. `POST /api/reviews`: Crea reseña y devuelve 201.
  3. `POST /api/reviews`: Rechaza rating inválido (ej. 6 o 0) con 400.
  4. `GET /api/reviews`: Lista las reseñas existentes.
* **Seguridad Docker:** Multi-stage build, usuario `node` o no-root (UID 1000).
