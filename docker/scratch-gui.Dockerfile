FROM node:10

ADD ./scratch-gui /scratch-gui

WORKDIR /scratch-gui

RUN npm install
ENV RC_URL=http://localhost:3000
RUN npm run build
RUN npm install http-server -g

CMD ["http-server", "build", "-p 8601"]
