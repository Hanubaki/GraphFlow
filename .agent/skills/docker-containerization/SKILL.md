---
name: docker-containerization
description: >-
  Production Dockerfile best practices, multi-stage builds, non-root user security, layer cache optimization,
  and docker-compose orchestration. Use when containerizing frontend/backend applications or defining reproducible dev environments.
---

# Docker Containerization & Microservice Packaging Runbook

Building minimal, secure, and production-ready container images.

## 1. Multi-Stage Production Build (Node/Vite/SPA)

```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Stage (Nginx unprivileged)
FROM nginxinc/nginx-unprivileged:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

## 2. Container Security Hardening

* **Never run as root:** Use non-root users (`USER node` or unprivileged Nginx containers).
* **Minimal Base Images:** Use Alpine or Distroless base images to minimize CVE attack surfaces.
* **Ignore Files:** Always provide `.dockerignore` excluding `.git`, `node_modules`, `.env*`, and test directories.
