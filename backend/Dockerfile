FROM node:22

# work in directory /app in the container
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# copy source files to the container
COPY . .

EXPOSE 3000

# start the server
CMD ["sh", "-c", "npx prisma generate && npm start"]

# creates client that backend uses to interact with the database, in node_modules/@prisma/client based on prisma.schema
# RUN npx prisma generate