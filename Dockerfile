FROM node:18

WORKDIR /usr/src/app

RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm i

COPY . .

RUN npm run build

ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV}

EXPOSE 3008

CMD [ "sh", "-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm start; fi" ]