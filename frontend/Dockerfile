FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.html ./
COPY src ./src
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM node:22-bookworm-slim AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.html ./
COPY src ./src
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM nginx:1.27-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
