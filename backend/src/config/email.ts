import nodemailer from 'nodemailer';
import { config } from './index';
import { logger } from './logger';

let transporter: nodemailer.Transporter;

export const initEmailTransporter = async (): Promise<void> => {
  if (config.email.user && config.email.pass) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`📧 Ethereal test email account created: ${testAccount.user}`);
  }

  try {
    await transporter.verify();
    logger.info('✅ Email transporter verified');
  } catch (err) {
    logger.warn('⚠️ Email transporter verification failed — emails may not send');
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<nodemailer.SentMessageInfo> => {
  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`📧 Email preview: ${previewUrl}`);
    }

    logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('❌ Email send failed:', error);
    throw error;
  }
};
