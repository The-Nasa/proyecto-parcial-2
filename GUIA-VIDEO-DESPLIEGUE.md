# 🎬 Guion y Manual de Comandos para el Video del Examen Parcial 2

## Arquitectura Políglota de Microservicios en AWS EKS con CI/CD OIDC

Este documento contiene la **secuencia exacta de comandos** que debes ejecutar en tu terminal PowerShell, acompañada de la **explicación técnica (guion verbal)** que debes decir en el video frente al profesor.

---

## 📌 PARTE 1: Creación del Clúster EKS en AWS

### Comando a ejecutar en PowerShell:

```powershell
eksctl create cluster --name parcial2-eks --region us-east-1 --version 1.34 --nodegroup-name workers --node-type m7i-flex.large --nodes 1 --zones us-east-1c,us-east-1f --profile eks-admin
```

### 🗣️ Qué decir en el video:

> *"Profesor, para dar cumplimiento a los requerimientos de alta disponibilidad y gestión de costos en la nube, utilizamos la herramienta oficial `eksctl`. Estamos aprovisionando un clúster gestionado de Kubernetes en Amazon Web Services llamado `parcial2-eks` con la versión 1.34.*
>
> *Para optimizar el presupuesto del proyecto y evitar costos ociosos innecesarios, configuramos un NodeGroup con una sola instancia `m7i-flex.large` en la región `us-east-1` (zonas 1c y 1f), la cual cuenta con 2 vCPUs y 8 GiB de memoria RAM, suficiente para alojar nuestros dos microservicios, sus dos bases de datos dedicadas y el frontend con Nginx."*

*(Nota: Este comando tarda entre 10 y 12 minutos en completarse).*

---

## 📌 PARTE 2: Configuración de Acceso y Permisos IAM OIDC

Una vez que `eksctl` finaliza la creación del clúster:

### Comandos a ejecutar en PowerShell:

```powershell
# 1. Configurar kubectl local con el nuevo clúster
aws eks update-kubeconfig --name parcial2-eks --region us-east-1 --profile eks-admin

# 2. Registrar el rol de GitHub Actions como Access Entry en EKS
aws eks create-access-entry --cluster-name parcial2-eks --principal-arn arn:aws:iam::881893826841:role/github-actions-deposit-role --type STANDARD --profile eks-admin

# 3. Asignar política de Cluster Admin al rol de CI/CD
aws eks associate-access-policy --cluster-name parcial2-eks --principal-arn arn:aws:iam::881893826841:role/github-actions-deposit-role --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy --access-scope type=cluster --profile eks-admin
```

### 🗣️ Qué decir en el video:

> *"En línea con las mejores prácticas de seguridad de nivel bancario de AWS, no utilizamos contraseñas ni Access Keys estáticas en GitHub Actions. En su lugar, utilizamos autenticación federada OIDC (OpenID Connect).*
>
> *Configuramos las 'Access Entries' nativas de Amazon EKS para vincular directamente el rol IAM `github-actions-deposit-role`, permitiendo que el pipeline de integración y despliegue continuo pueda interactuar con el clúster de forma completamente keyless y segura."*

---

## 📌 PARTE 3: Despliegue de los Manifiestos de Kubernetes

### Comando a ejecutar en PowerShell:

```powershell
cd "c:\Users\ThikPad\Desktop\MESE VIII\DESARROLLO DE APLICACIONES PARA LA NUBE\microservicios\microservicio\proyecto-parcial-2"

kubectl apply -k k8s/
```

### 🗣️ Qué decir en el video:

> *"Aplicamos la orquestación mediante Kustomize sobre el directorio `k8s/`. Esto despliega dentro de un Namespace aislado llamado `parcial2`:*
>
> 1. *La base de datos relacional PostgreSQL para el servicio de productos.*
> 2. *La base de datos NoSQL MongoDB para el servicio de reseñas.*
> 3. *El microservicio en Python FastAPI consumiendo su imagen construida en Amazon ECR.*
> 4. *El microservicio en Node.js Express con su imagen de ECR.*
> 5. *El servicio Web Frontend con servidor Nginx y un servicio de tipo `LoadBalancer` que aprovisiona automáticamente un balanceador de carga público (AWS ELB)."*

---

## 📌 PARTE 4: Verificación de Pods y Obtención del Endpoint Público

### Comandos a ejecutar:

```powershell
# Verificar estado de los Pods en tiempo real
kubectl get pods -n parcial2 -w

# (Una vez que todos estén en Running 1/1, presionar Ctrl+C)

# Obtener la URL pública del LoadBalancer de AWS
kubectl get svc frontend -n parcial2
```

### 🗣️ Qué decir en el video:

> *"Podemos observar que los 5 pods correspondientes a la arquitectura completa están en estado `Running` (1/1):*
>
> * *`db-products` (PostgreSQL)*
> * *`db-reviews` (MongoDB)*
> * *`product-service` (FastAPI)*
> * *`review-service` (Express)*
> * *`frontend` (Nginx)*
>
> *Al consultar el servicio `frontend`, AWS nos ha asignado un nombre de dominio DNS público en el Elastic Load Balancer. Procederemos a abrirlo en el navegador web."*

---

## 📌 PARTE 5: Demostración en el Navegador Web (Frontend + Microservicios + Swagger)

1. **Abre Google Chrome o Edge e ingresa a tu aplicación en vivo:**
   ```
   http://a7a08ec19d0904cec9cfeaa23e98ca61-8662597.us-east-1.elb.amazonaws.com
   ```

2. **Accede a la Documentación Swagger / OpenAPI de ambos microservicios:**
   * **Microservicio Python (FastAPI):** Haz clic en el botón azul **`📘 Swagger Docs`** o visita `/docs`.
   * **Microservicio Node.js (Express):** Haz clic en el botón naranja **`📙 Swagger Docs`** o visita `/api/reviews/docs`.

3. Abre las herramientas de desarrollador presionando **F12** y ve a la pestaña **Network (Red)**.

### 🗣️ Qué hacer y decir en el video:

> 1. *"Aquí podemos ver la aplicación web CloudStore. Noten que en la cabecera tenemos dos Health Badges en tiempo real que verifican la salud de ambos microservicios.*
> 2. *En la pestaña Network de las DevTools, observamos que al cargar la página se ejecutan peticiones asíncronas en paralelo mediante `Promise.all()` hacia `/api/products` y `/api/reviews`.*
> 3. *Gracias al Reverse Proxy configurado en Nginx, las peticiones van al mismo dominio y puerto 80, eliminando por completo cualquier problema de CORS (Cross-Origin Resource Sharing).*
> 4. *Además, ambos microservicios cuentan con documentación Swagger interactiva: hacemos clic en '📘 Swagger Docs' para ver el contrato OpenAPI de FastAPI, y en '📙 Swagger Docs' para ver el contrato OpenAPI del microservicio de Express.*
> 5. *Vamos a registrar un nuevo producto en el catálogo:*
>    * Nombre: `Laptop Lenovo ThinkPad`
>    * Precio: `1250.00`
>    * Stock: `10`
>    * Categoría: `Computadoras`
>      *(Hacer clic en 'Guardar Producto' y mostrar cómo se inserta en PostgreSQL y se actualiza la grilla al instante).*
> 6. *Ahora agregaremos una reseña para ese producto:*
>    * Calificación: `5 Estrellas`
>    * Comentario: `Excelente rendimiento y entrega rápida.`
>      *(Hacer clic en 'Publicar Reseña' y mostrar cómo se guarda en el documento NoSQL de MongoDB).*
> 7. *Para demostrar la capacidad CRUD completa, utilizaremos el botón '🗑️ Eliminar' tanto en una tarjeta de producto como en una tarjeta de reseña para ejecutar los métodos HTTP DELETE respectivos.*
> 8. *Queda demostrado que ambos microservicios políglotas funcionan de forma independiente pero perfectamente integrados."*

---

## 📌 PARTE 6: Demostración del Repositorio y CI/CD en GitHub Actions

1. Muestra en pantalla el repositorio de GitHub: `https://github.com/The-Nasa/proyecto-parcial-2`.
2. Ve a la pestaña **Actions**:
   - Muestra el workflow `CI/CD Pipeline - Parcial 2 CloudStore`.
   - Muestra las etapas:
     1. **Run Unit Tests (Python & Node.js):** 100% de tests aprobados (`pytest` y `jest`).
     2. **Build & Push Docker Images to AWS ECR:** Compilación multi-stage y push mediante IAM OIDC.
     3. **Deploy to Amazon EKS:** Despliegue automatizado en el clúster.
3. Muestra en la consola de AWS o por terminal los 3 repositorios ECR con sus etiquetas de imagen.

---

## 📌 PARTE 7: Destrucción del Clúster (Política de Costo $0.00)

### Comando a ejecutar en PowerShell:

```powershell
eksctl delete cluster --name parcial2-eks --region us-east-1 --profile eks-admin
```

### 🗣️ Qué decir en el video (Conclusión):

> *"Para finalizar y en cumplimiento con los estándares de gobernanza y eficiencia de costos en la nube, procedemos a ejecutar la destrucción del clúster con `eksctl delete cluster`.*
> *Esto elimina todos los recursos aprovisionados (instancias EC2, volumenes EBS y el Load Balancer), garantizando que el entorno no genere costos adicionales una vez concluida la prueba y sustentación.*
> *Muchas gracias."*
