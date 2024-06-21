FROM node:18-alpine3.20
ENV NODE_ENV=production
WORKDIR /app
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
CMD ["node","app.js"]
