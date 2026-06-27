import { Injectable, Logger } from '@nestjs/common';

import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordContext } from './interfaces/mail-context.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const context: ResetPasswordContext = {
      resetLink: `${this.frontendUrl}/reset-password?token=${token}`,
    }

    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    this.logger.log(`Sending password reset email to ${email}`);

    if (this.config.get('NODE_ENV') !== 'production') {
      this.logger.debug(`Reset link: ${resetLink}`);
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password recovery',
        template: './reset-password',
        context,
      });
      this.logger.log(`Password reset email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
