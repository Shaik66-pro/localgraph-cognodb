# Dockerfile for full-stack LocalGraph app (Express + React Vite)
FROM node:18-alpine

WORKDIR /app

# Copy root package definitions
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install root & frontend dependencies
RUN npm install
RUN cd frontend && npm install

# Copy application source code
COPY . .

# Build frontend static production bundle
RUN npm run build

# Expose server port (default 5000)
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["npm", "start"]
