# 📄 SDD Spec 01: Microservicio de Productos (Python - FastAPI)

- **ID:** `SPEC-01-PRODUCTS`
- **Lenguaje / Framework:** Python 3.12 + FastAPI + Uvicorn
- **Base de Datos:** PostgreSQL Relacional (`products_db` vía SQLAlchemy / psycopg2 / asyncpg)
- **Estado SDD:** `approved`

---

## 1. Alcance Funcional
Gestionar el catálogo de productos de la tienda virtual de forma completamente independiente de otros servicios.

### Endpoints Requeridos:
| Método | Ruta | Descripción | Códigos HTTP |
| :--- | :--- | :--- | :--- |
| **GET** | `/health/live` | Liveness probe para Kubernetes | `200 OK` |
| **GET** | `/health/ready` | Readiness probe (valida conexión a base de datos PostgreSQL) | `200 OK`, `503 Unavailable` |
| **GET** | `/api/products` | Lista todos los productos disponibles | `200 OK` |
| **GET** | `/api/products/{id}` | Obtiene un producto por su ID | `200 OK`, `404 Not Found` |
| **POST** | `/api/products` | Registra un nuevo producto en el catálogo | `201 Created`, `422 Unprocessable` |

---

## 2. Esquema de Datos (JSON)

### Petición de Creación (`ProductCreateDTO`):
```json
{
  "name": "Laptop Gamer Pro",
  "description": "Intel Core i7, 16GB RAM, RTX 4060",
  "price": 1299.99,
  "category": "Tecnología",
  "stock": 10
}
```

### Respuesta de Producto (`ProductResponseDTO`):
```json
{
  "id": 1,
  "name": "Laptop Gamer Pro",
  "description": "Intel Core i7, 16GB RAM, RTX 4060",
  "price": 1299.99,
  "category": "Tecnología",
  "stock": 10,
  "created_at": "2026-11-17T20:00:00Z"
}
```

---

## 3. Principio Database-per-Service
* El microservicio utiliza su propia base de datos dedicada **PostgreSQL** (`products_db`).
* La cadena de conexión se inyecta por variable de entorno `DATABASE_URL` (ej. `postgresql://postgres:postgres@db-products:5432/products_db`).
* Ningún otro servicio tiene acceso a las credenciales ni a las tablas de esta base de datos.

---

## 4. Requisitos de Calidad y Pruebas
* **Framework de Pruebas:** `pytest` con `httpx.AsyncClient` o `starlette.testclient.TestClient`.
* **Casos obligatorios:**
  1. `test_health_ready`: Debe retornar 200 y status "READY".
  2. `test_create_product`: Debe retornar 201 y el objeto con ID generado.
  3. `test_list_products`: Debe listar los productos creados.
  4. `test_create_product_invalid_price`: Debe rechazar precios negativos con 422.
* **Seguridad Docker:** Multi-stage build, usuario `appuser` (UID 1000, non-root).
