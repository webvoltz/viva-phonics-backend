FROM node:22-alpine
WORKDIR /app

# Install Nano text editor and set permissions
RUN apk add nano \
    && mkdir /usr/share/nano \
    && chmod -R 777 /usr/share/nano
COPY . .
RUN yarn install
RUN NODE_OPTIONS="--max-old-space-size=4096" yarn run build
CMD ["node", "dist/main"]