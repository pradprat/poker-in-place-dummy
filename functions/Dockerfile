FROM node:12 AS stage-one

# Install DEB dependencies and others.
RUN \
	set -x \
	&& apt-get autoremove \
	&& apt-get clean \
	&& apt-get update \
	&& apt-get install -y net-tools build-essential valgrind

WORKDIR /service

COPY package.json .
COPY yarn.lock .
RUN yarn install

COPY . .
RUN yarn build

EXPOSE 80
ENTRYPOINT node lib/server.js
