export default () => ({
  node_env: {
    env: process.env.NODE_ENV,
  },
  port: parseInt(process.env.PORT || '5500', 10) || 3000,
  database: {
    uri: process.env.DATABASE_URL,
  },
  better_auth_secret: {
    secret: process.env.BETTER_AUTH_SECRET,
  },
  better_auth_url: {
    url: process.env.BETTER_AUTH_URL,
  },
  arifpay: {
    apiKey: process.env.ARIFPAY_API_KEY,
    expiration: process.env.ARIFPAY_EXPIRATION || '2027-02-01T03:45:27',
  },
});
