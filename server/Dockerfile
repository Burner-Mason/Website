# Burner Mason API — Cloud Run container.
FROM node:20-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
# Cloud Run injects PORT; the app defaults to 8080.
EXPOSE 8080
CMD ["node", "index.js"]
