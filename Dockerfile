FROM node:18.20.3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN cp .env.sample .env.local

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
