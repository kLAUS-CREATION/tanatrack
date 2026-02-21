import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';
import { PrismaClient } from 'generated/prisma/client';
import { sendEmail } from './mail';
import { getOtpEmailTemplate } from 'src/constants/email-templates.constant';

const prisma = new PrismaClient({
  accelerateUrl: process.env.ACCELERATE_URL || '',
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  plugins: [
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
          })
        ).catch((err) => {
          console.error(`[CRITICAL] Failed to send ${type} email to ${email}:`, err);
        });
      },
    }),
  ],
});
