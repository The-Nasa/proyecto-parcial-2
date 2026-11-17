# 📊 Tablero de Trazabilidad SDD (Spec-Driven Development)

Este tablero registra el ciclo de vida oficial de cada componente del proyecto:
`pending` ➡️ `spec_ready` ➡️ `approved` ➡️ `in_progress` ➡️ `review` ➡️ `done`

| Módulo | Especificación | Autor | Estado SDD | Criterios de Aceptación |
| :--- | :--- | :--- | :---: | :--- |
| **Catálogo de Productos** | [`specs/01-product-service/spec.md`](01-product-service/spec.md) | `implementer` | 🟢 **`done`** | CRUD funcional en Python/FastAPI, BD PostgreSQL aislada, 5 tests pytest 100% OK. |
| **Reseñas de Clientes** | [`specs/02-review-service/spec.md`](02-review-service/spec.md) | `implementer` | 🟢 **`done`** | CRUD funcional en Node.js/Express, BD NoSQL MongoDB aislada, 6 tests jest 100% OK. |
| **Frontend Integrador** | [`specs/03-frontend/spec.md`](03-frontend/spec.md) | `implementer` | 🟢 **`done`** | UI responsive con Nginx, consume ambas APIs, sin bloqueos de CORS. |
| **Orquestación K8s en AWS** | [`specs/04-k8s-aws-deployment/spec.md`](04-k8s-aws-deployment/spec.md) | `deployer` | 🟢 **`done`** | Manifiestos K8s, ECR creados, CI/CD GitHub Actions con OIDC Keyless listo. |
