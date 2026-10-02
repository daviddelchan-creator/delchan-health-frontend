import { EmailProviderConfig } from './emailDispatcher';
import nodemailer from 'nodemailer';

export async function dispatchTenantEmail(config: EmailProviderConfig, to: string, subject: string, htmlContent: string, threadId: string) {
  const fromHeader = `notifications@${config.customDomain}`;
  const replyToHeader = `catchall+${threadId}@${config.customDomain}`;

  switch (config.type) {
    case 'brevo':
      return await fetch('https://brevo.com', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': config.apiKey || '',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: fromHeader },
          to: [{ email: to }],
          replyTo: { email: replyToHeader },
          subject: subject,
          htmlContent: htmlContent
        })
      });

    case 'zoho':
    case 'gmail':
    case 'office365':
      // Dynamic SMTP fallback using secure connections via nodemailer routing
      const transporter = nodemailer.createTransport({
        host: config.smtpHost || (config.type === 'zoho' ? 'smtp.zoho.com' : config.type === 'gmail' ? 'smtp.gmail.com' : 'smtp.office365.com'),
        port: config.smtpPort || 465,
        secure: config.smtpPort === 465 || !config.smtpPort,
        auth: {
          user: config.authEmail,
          pass: config.authPassword
        }
      });

      return await transporter.sendMail({
        from: fromHeader,
        to: to,
        replyTo: replyToHeader,
        subject: subject,
        html: htmlContent,
        headers: {
          'X-SaaS-Thread-Id': threadId,
          'Message-ID': `<${threadId}@${config.customDomain}>`
        }
      });
  }
}
