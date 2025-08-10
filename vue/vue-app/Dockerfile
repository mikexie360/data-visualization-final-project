# ---- Build stage ----
    FROM node:22.12.0-alpine AS build
    WORKDIR /app
    ENV NPM_CONFIG_PRODUCTION=false
    
    COPY package*.json ./
    RUN npm ci
    
    COPY . .
    # If you want CI type-checks, insert:
    # RUN npx vue-tsc --noEmit -p tsconfig.app.json
    RUN npx vite build
    
    # ---- Runtime stage ----
    FROM caddy:2-alpine
    WORKDIR /srv
    
    # Default for local runs; Railway will set PORT
    ENV PORT=8080
    
    # Static files
    COPY --from=build /app/dist /srv
    
    # Minimal SPA config with history fallback, no heredocs needed
    RUN mkdir -p /etc/caddy && \
        printf '%s\n' \
          ':{$PORT}' \
          'root * /srv' \
          'encode zstd gzip' \
          'try_files {path} /index.html' \
          'file_server' \
          > /etc/caddy/Caddyfile
    
    EXPOSE 8080
    CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
    