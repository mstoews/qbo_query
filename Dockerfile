FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm i --force
COPY . .
RUN npm run build -- --configuration=production --output-hashing=all

FROM nginx:alpine
COPY --from=build /app/dist/qbo_query/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
