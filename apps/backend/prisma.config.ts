import { defineConfig } from 'prisma/config'
import { config as loadEnv } from 'dotenv'
const NODE_ENV = process.env.NODE_ENV ?? 'development';

loadEnv({ path: `env/.env.${NODE_ENV}` });
loadEnv({ path: `env/.env` });

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: { path: 'prisma/migration' },
    datasource: {
        url: process.env.DATABASE_URL,
    }
})