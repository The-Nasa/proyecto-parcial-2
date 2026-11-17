# ==============================================================================
# Dockerfile: Frontend Integrador (Nginx 1.25 Alpine + Web UI)
# ==============================================================================
FROM nginx:1.25-alpine

# Limpiar archivos por defecto de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar archivos estáticos de la aplicación
COPY src/ /usr/share/nginx/html/

# Copiar configuración con Reverse Proxy anti-CORS
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health/live || exit 1

CMD ["nginx", "-g", "daemon off;"]
