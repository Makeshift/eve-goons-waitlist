FROM node:alpine

RUN mkdir -p /opt/goon_waitlist
WORKDIR /opt/goon_waitlist
COPY package.json .
RUN npm install
COPY . .