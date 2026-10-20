export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001' },
  database: {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true',
    autoLoadEntities: true,
    synchronize: false,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun: false,
  },
});
