# 📄 SDD Spec 04: Orquestación Kubernetes y Despliegue en AWS EKS

- **ID:** `SPEC-04-K8S-AWS`
- **Plataforma:** AWS EKS (Kubernetes v1.34) + AWS ECR + AWS Elastic Load Balancer (ELB)
- **CI/CD:** GitHub Actions con OIDC Keyless (rol IAM sin access keys estáticas)
- **Estado SDD:** `approved`

---

## 1. Arquitectura de Manifiestos K8s (`k8s/`)

| Manifiesto | Tipo de Objeto | Función |
| :--- | :--- | :--- |
| `01-namespace.yaml` | `Namespace` | Aísla todos los recursos en `parcial2`. |
| `02-product-service.yaml` | `Deployment` + `Service` | 1 réplica del servicio Python, puerto interno 8000 (ClusterIP), probes `/health/live` y `/health/ready`, volumen `/app/data`. |
| `03-review-service.yaml` | `Deployment` + `Service` | 1 réplica del servicio Node.js, puerto interno 3000 (ClusterIP), probes `/health/live` y `/health/ready`, volumen `/app/data`. |
| `04-frontend.yaml` | `Deployment` + `Service` | 1 réplica de Nginx Frontend, expuesto públicamente a través de un **Service tipo `LoadBalancer`** en el puerto 80. |
| `kustomization.yaml` | `Kustomization` | Agrupa y despliega todos los manifiestos con `kubectl apply -k k8s/`. |

---

## 2. Pipeline de CI/CD (GitHub Actions)
* **Paso 1 (Tests):** Corre `pytest` para el servicio Python y `npm test` para el servicio Node.js.
* **Paso 2 (Build & Push ECR):** Genera las imágenes Docker con etiquetas por commit y las sube a los repositorios de AWS ECR.
* **Paso 3 (Deploy EKS):** Se conecta a AWS EKS mediante el rol OIDC y aplica `kubectl apply -k k8s/`.

---

## 3. Estrategia de Costo Cero ($0.00 Inactividad)
* El clúster se aprovisiona mediante `eksctl create cluster`.
* Se realiza la demostración y grabación del video del parcial.
* Al finalizar el video, se ejecuta de inmediato:
  ```bash
  eksctl delete cluster --name parcial2-eks --region us-east-1 --profile eks-admin
  ```
  Evitando cualquier cargo por días no utilizados.
