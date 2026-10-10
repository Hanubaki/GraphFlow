# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
RUN npm ci

# Copy source code and compile production assets
COPY . .
RUN npm run build

# Production Stage (Unprivileged non-root Nginx)
FROM nginxinc/nginx-unprivileged:alpine
WORKDIR /usr/share/nginx/html

# Copy compiled SPA assets from builder
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose unprivileged HTTP port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
