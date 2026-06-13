import 'dotenv/config';
import nodemailer, { TransportOptions } from 'nodemailer';
import { google } from 'googleapis';

const IS_PROD = process.env.NODE_ENV === 'production';

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground',
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.FROM_EMAIL || 'besufikadkidane93@gmail.com',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    accessToken: async () => {
      const { token } = await oAuth2Client.getAccessToken();
      return token ?? '';
    },
  },
  tls: {
    rejectUnauthorized: IS_PROD,
  },
} as TransportOptions);

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailInput) {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log('[MAIL] Sent to', to);
  } catch (err) {
    console.error('[MAIL_ERROR]', err);
  }
}
