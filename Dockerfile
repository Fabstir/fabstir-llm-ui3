FROM node:22.14.0



WORKDIR /app


COPY . .



RUN npm i

RUN npm run build


# removing env from container
RUN rm ./.env.local


EXPOSE 3000


CMD ["npm", "run", "start"]
