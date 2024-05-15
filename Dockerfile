# Use the official Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:18

ARG service_account_key_url
ARG gh_token
ARG project_id
ARG export_table

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

ENV SERVICE_ACCOUNT_KEY_URL=$service_account_key_url
ENV GH_TOKEN=$gh_token
ENV PROJECT_ID=$project_id
ENV EXPORT_TABLE=$export_table

# Install production dependencies.
RUN npm i --production

# Copy local code to the container image.
COPY . .

# Run the web service on container startup.
CMD [ "npm", "start" ]
