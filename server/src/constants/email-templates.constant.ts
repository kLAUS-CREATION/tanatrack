type EmailType = 'sign-in' | 'email-verification' | 'forget-password';

interface TemplateParams {
  otp: string;
  type: EmailType;
}

export const getOtpEmailTemplate = ({ otp, type }: TemplateParams) => {
  const titles = {
    'sign-in': 'Sign in to TanaTrack',
    'email-verification': 'Verify your TanaTrack account',
    'forget-password': 'Reset your TanaTrack password',
  };

  const subject = titles[type] || 'Security Code';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">${subject}</h2>
      <p style="font-size: 16px; color: #555;">Use the following code to complete your request:</p>
      <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #888; margin-top: 20px;">
        This code will expire in 5 minutes. If you did not request this, please ignore this email.
      </p>
    </div>
  `;

  const text = `${subject}: Your code is ${otp}. It expires in 5 minutes.`;

  return { subject, html, text };
};
