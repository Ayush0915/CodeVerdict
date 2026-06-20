# --- Build Stage ---
FROM node:20-slim AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Set default API URL environment variable for Vite client build
ENV VITE_API_URL=http://localhost:8000
RUN npm run build

# --- Production Stage ---
FROM nginx:alpine

# Copy static assets from build stage
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
