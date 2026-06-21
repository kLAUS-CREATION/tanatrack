FROM node:20

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

ENV PNPM_ENABLE_PRE_POST_SCRIPTS=true

RUN pnpm install

COPY . .

RUN pnpm exec prisma generate

EXPOSE 5500

CMD ["pnpm", "start:dev"]
