FROM node:22.21.1-alpine3.23

WORKDIR /app

RUN apk add --no-cache python3

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run build

CMD ["sh", "-c", "cd dist && python3 -m http.server 80"]