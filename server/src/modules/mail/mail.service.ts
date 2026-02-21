import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { google, Auth } from 'googleapis';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly oAuth2Client: Auth.OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.getEnv('GOOGLE_CLIENT_ID');
    const clientSecret = this.getEnv('GOOGLE_CLIENT_SECRET');
    const refreshToken = this.getEnv('GOOGLE_REFRESH_TOKEN');

    this.oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground',
    );

    this.oAuth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  private getEnv(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing environment variable: ${key}`);
    }
    return value;
  }

  private async generateAccessToken(): Promise<string> {
    const accessTokenResponse = await this.oAuth2Client.getAccessToken();

    if (!accessTokenResponse.token) {
      throw new Error('Failed to generate access token');
    }

    return accessTokenResponse.token;
  }

  private async createTransporter(): Promise<nodemailer.Transporter> {
    const clientId = this.getEnv('GOOGLE_CLIENT_ID');
    const clientSecret = this.getEnv('GOOGLE_CLIENT_SECRET');
    const refreshToken = this.getEnv('GOOGLE_REFRESH_TOKEN');
    const fromEmail = this.getEnv('FROM_EMAIL');

    const accessToken = await this.generateAccessToken();

    const transportOptions: SMTPTransport.Options = {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: fromEmail,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
    };

    return nodemailer.createTransport(transportOptions);
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      const transporter = await this.createTransporter();

      await transporter.sendMail({
        from: `"${this.getEnv('FROM_NAME')}" <${this.getEnv('FROM_EMAIL')}>`,
        to,
        subject,
        html,
        text,
      });

      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error('Email sending failed', error);
      throw error;
    }
  }
}
