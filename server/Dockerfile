FROM node:20-alpine

# Enable pnpm
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

# Allow pnpm scripts (needed for Nest + Prisma)
ENV PNPM_ENABLE_PRE_POST_SCRIPTS=true

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build NestJS
RUN pnpm build

EXPOSE 5500

CMD ["node", "dist/main.js"]
