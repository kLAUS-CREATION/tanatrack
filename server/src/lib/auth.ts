import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { emailOTP, admin } from 'better-auth/plugins';

import { sendEmail } from './mail';
import { getOtpEmailTemplate } from 'src/constants/email-templates.constant';
import { prisma } from './prisma';
import { corsOrigins } from 'src/config/cors';

const isProd = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  // Public https URL of this backend (Render). Needed in production so callbacks,
  // redirects and Secure cookies are generated against the right origin.
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  // localhost + production FRONTEND_URL, read from env via corsOrigins().
  trustedOrigins: corsOrigins(),
  // In production the frontend (Vercel) and backend (Render) are different
  // sites, so the session cookie must be SameSite=None; Secure or the browser
  // won't send it on cross-site REST calls OR the socket.io handshake. In dev
  // both run on localhost (same-site) so we keep better-auth's Lax defaults.
  ...(isProd && {
    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  databaseHooks: {
    user: {
      create: {
        // eslint-disable-next-line @typescript-eslint/require-await
        before: async (user) => {
          const ownerEmails = process.env.OWNER_EMAILS?.split(':') ?? [];
          if (ownerEmails?.includes(user.email)) {
            return { data: { ...user, role: 'ADMIN' } };
          }
          return { data: user };
        },
      },
    },
  },

  plugins: [
    // For Email OTP
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      allowedAttempts: 5,

      // eslint-disable-next-line @typescript-eslint/require-await
      async sendVerificationOTP({ email, otp, type }) {
        const template = getOtpEmailTemplate({ otp, type });

        // 2. Use Promise.resolve() to fire-and-forget (non-blocking)
        Promise.resolve(
          sendEmail({
            to: email,
            subject: template.subject,
            text: template.text,
            html: template.html,
          }),
        ).catch((err) => {
          console.error(
            `[CRITICAL] Failed to send ${type} email to ${email}:`,
            err,
          );
        });
      },
    }),

    // For Roles
    admin(),
  ],
});
