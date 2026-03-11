# Stage 1: Build frontend with Node
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy rest of frontend
COPY frontend/ .

# Build frontend with Vite
RUN npm run build

# Stage 2: Express backend with built frontend
FROM node:18-slim

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy backend code
COPY backend/ .

# Copy built frontend to public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start Express server
CMD ["node", "server.js"]
