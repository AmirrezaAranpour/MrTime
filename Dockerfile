# Multi-stage: build the Vite/React app, then serve it with Nginx (which also
# reverse-proxies the API to the backend container). Built by docker-compose
# in the backend repo as the "nginx" service.

# ---- Stage 1: build the React app ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_BASE is left empty on purpose: the app calls same-origin paths
# (/api, /auth, ...) which nginx proxies to the backend. No CORS needed.
RUN npm run build

# ---- Stage 2: serve with Nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
