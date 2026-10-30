import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  CORS_ORIGIN: Joi.string().uri({ allowRelative: false }).required(),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  // Development/test can use deterministic local-only defaults; production must provide real secrets.
  AUTH_ACCESS_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(32).default('development-only-access-secret-change-me'),
  }),
  AUTH_REFRESH_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(32).required(),
    otherwise: Joi.string().min(32).default('development-only-refresh-secret-change-me'),
  }),
  AUTH_ACCESS_TTL_SECONDS: Joi.number().integer().positive().default(900),
  AUTH_REFRESH_TTL_SECONDS: Joi.number().integer().positive().default(604800),
});
