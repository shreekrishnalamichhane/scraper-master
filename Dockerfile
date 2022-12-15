FROM node:16.15-alpine3.14
RUN mkdir /app
WORKDIR /app
COPY . .
RUN yarn
RUN yarn build
EXPOSE 6000
CMD ["yarn","start"]