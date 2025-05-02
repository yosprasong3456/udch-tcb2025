FROM node:18

# Create app directory
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build
EXPOSE 3000
# Start the server using the production build
CMD [ "npm", "run", "start" ]