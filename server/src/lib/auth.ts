import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { emailOTP, admin } from 'better-auth/plugins';

import { sendEmail } from './mail';
import { getOtpEmailTemplate } from 'src/constants/email-templates.constant';
import { prisma } from './prisma';
import { UserRole } from 'generated/prisma/enums';

const isProd = process.env.NODE_ENV === 'production';
// const ROLES = ['USER', 'ADMIN', 'OWNER', 'EMPLOYEE'] as const;

import { ac, owner, admin, employee } from './permissions';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  trustedOrigins: isProd
    ? ['https://tana-track.vercel.app']
    : ['http://localhost:3000'],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  user: {
    additionalFields: {
      role: {
        type: [
          UserRole.USER,
          UserRole.ADMIN,
          UserRole.OWNER,
          UserRole.EMPLOYEE,
        ],
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        // eslint-disable-next-line @typescript-eslint/require-await
        before: async (user) => {
          const ownerEmails = process.env.OWNER_EMAILS?.split(':') ?? [];
          if (ownerEmails.includes(user.email)) {
            return { data: { ...user, role: UserRole.OWNER } };
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
    admin({
      defaultRole: 'user',
      ac,
      roles: {
        owner,
        admin,
        employee,
        user: ac.newRole({}),
      },
    }),
  ],
});
