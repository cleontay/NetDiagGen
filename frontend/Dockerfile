# --- build stage ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* vars in at build time, so the backend URL must be known
# now, not at container start. Defaults to localhost:4000, which is what
# you want when running both containers via the provided docker-compose.yml
# with the backend's port published to the host.
ARG VITE_STATUS_API_URL=http://localhost:4000
ENV VITE_STATUS_API_URL=$VITE_STATUS_API_URL
RUN npm run build

# --- serve stage ---
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -q -O - http://localhost:80/ || exit 1
