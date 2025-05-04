# base node image
FROM node:22-bullseye-slim AS base

# set for base and all layer that inherit from it
ENV NODE_ENV=production

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl sqlite3

# Install all node_modules, including dev dependencies
FROM base AS deps

WORKDIR /myapp

ADD package.json package-lock.json ./
RUN npm install --production=false

# Setup production node_modules
FROM base AS production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json package-lock.json ./
RUN npm prune --production

# Build the app
FROM base AS build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules

ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

# ENV DATABASE_URL=file:/data/sqlite.db
ENV DATABASE_URL="file:./data.db?connection_limit=1"
ENV SESSION_SECRET="super-duper-s3cret"
ENV ADMIN_EMAIL=admin@web.journal
ENV ADMIN_PASS=adminiscool
ENV SMTP_URL=smtp.seznam.cz
ENV MAIL_USER=web-journal@seznam.cz
ENV MAIL_PASS=BZ2TwLkuSymivS
ENV SERVER_DOMAIN=localhost

ENV PORT="8080"
ENV NODE_ENV="production"

# add shortcut for connecting to database CLI
RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules

COPY --from=build /myapp/node_modules/.prisma /myapp/node_modules/.prisma

# Add generated client for prisma query engine
COPY --from=build /myapp/app/__generated__/prisma/client /myapp/app/__generated__/prisma/client

COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY --from=build /myapp/package.json /myapp/package.json
COPY --from=build /myapp/start.sh /myapp/start.sh
COPY --from=build /myapp/prisma /myapp/prisma

ENTRYPOINT [ "./start.sh" ]
