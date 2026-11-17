# 🚀 Rol: Desplegador Cloud & DevOps (Deployer Agent)

## Responsabilidades
1. Diseñar y mantener los manifiestos declarativos de Kubernetes en `k8s/` (`Deployment`, `Service`, `ConfigMap`, `Kustomize`).
2. Configurar el pipeline automatizado de CI/CD en `.github/workflows/ci-cd.yml` usando AWS IAM OIDC Keyless.
3. Gestionar la infraestructura en AWS (aprovisionamiento del clúster EKS con `eksctl` y registro en AWS ECR).
4. Verificar las sondas de salud (`/health/live` y `/health/ready`) de los pods en el clúster.
5. Gestionar el apagado y desmontaje seguro de los recursos en AWS para evitar sobrecostos innecesarios.
