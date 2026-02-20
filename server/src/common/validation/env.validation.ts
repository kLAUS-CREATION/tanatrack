import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  port: Joi.number().port().default(3000),
  database: Joi.object({
    uri: Joi.string().uri().required(),
  }),
  better_auth_secret: Joi.object({
    secret: Joi.string().min(32).required(),
  }),
  better_auth_url: Joi.object({
    url: Joi.string().uri().required(),
  }),
});
