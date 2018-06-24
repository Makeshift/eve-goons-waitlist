FROM node:alpine

# Force UTC times for all of our dates
ENV TZ="Etc/GMT"

RUN mkdir -p /opt/goon_waitlist
WORKDIR /opt/goon_waitlist
COPY package.json .
RUN npm install
COPY . .
CMD ["node", "index.js"]