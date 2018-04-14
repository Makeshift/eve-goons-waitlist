FROM node:alpine

# pass in Person User ID & Person Group ID so when logs are created on host system they have same ids and can be accessed
ARG PUID
ARG PGID

# change container node id to a non-standard one as most hosts will have uid 1000 taken
RUN apk --no-cache add shadow && groupmod -g 1999 node && usermod -u 1999 node && addgroup -g $PGID goon && \
  adduser -D -u $PUID -G goon goon && mkdir -p /opt/goon_waitlist && chown goon:goon /opt/goon_waitlist

# run under goon user with proper uid
USER goon

WORKDIR /opt/goon_waitlist

COPY package.json .

RUN npm install

COPY . .

CMD ["node", "src/index.js"]