FROM node:alpine

RUN mkdir -p /opt/goon_waitlist
WORKDIR /opt/goon_waitlist
COPY package.json /opt/goon_waitlist
RUN npm install
COPY . /opt/goon_waitlist
EXPOSE 3000
CMD [ "./wait-for", "mongo:27017", "--timeout=15", "--", "node", "index.js" ]
