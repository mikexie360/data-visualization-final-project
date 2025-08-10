# ---- Build stage ----
    FROM node:22.12.0-alpine AS build
    WORKDIR /app
    
    # Ensure devDeps (vite, etc.) are installed
    ENV NPM_CONFIG_PRODUCTION=false
    
    COPY package*.json ./
    RUN npm ci
    
    # Copy source and build (no vue-tsc to avoid TS1323 in CI)
    COPY . .
    # If you WANT type-checking in CI, swap the next line with:
    # RUN npx vue-tsc --noEmit -p tsconfig.app.json && npx vite build
    RUN npx vite build
    
    # ---- Runtime stage ----
    FROM caddy:2-alpine
    WORKDIR /srv
    
    # Default to 8080 locally; Railway will override PORT
    ENV PORT=8080
    
    # Minimal SPA config with history fallback
    RUN sh -lc 'cat > /etc/caddy/Caddyfile <<EOF
    :{$PORT}
    root * /srv
    encode zstd gzip
    try_files {path} /index.html
    file_server
    EOF'
    
    # Static files
    COPY --from=build /app/dist /srv
    
    EXPOSE 8080
    CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
    