import { Injectable } from '@nestjs/common';

import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService:MailerService,
    private readonly config:ConfigService,
  ){}

  async sendPasswordReset(email:string, token:string):Promise<void>{
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to:email,
      subject:'Password recovery',
      template:'reset-password',
      context:{
        resetLink
      }
    })
  }
}
