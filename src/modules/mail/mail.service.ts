import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { join } from 'path';

interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter;
  private readonly templateCache = new Map<
    string,
    handlebars.TemplateDelegate
  >();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const mail = this.configService.get('mail')!;
    this.transporter = nodemailer.createTransport({
      host: mail.host,
      port: mail.port,
      secure: mail.secure,
      auth:
        mail.user && mail.password
          ? { user: mail.user, pass: mail.password }
          : undefined,
    });
  }

  private compileTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): string {
    let template = this.templateCache.get(templateName);
    if (!template) {
      const filePath = join(__dirname, 'templates', `${templateName}.hbs`);
      const source = fs.readFileSync(filePath, 'utf-8');
      template = handlebars.compile(source);
      this.templateCache.set(templateName, template);
    }
    return template(context);
  }

  async sendMail(options: SendMailOptions): Promise<void> {
    const from = this.configService.get<string>('mail.from');
    try {
      await this.transporter.sendMail({ from, ...options });
      this.logger.log(`Email sent to ${options.to}: "${options.subject}"`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async sendText(to: string, subject: string, text: string): Promise<void> {
    return this.sendMail({ to, subject, text });
  }

  async sendTemplate(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const html = this.compileTemplate(templateName, context);
    return this.sendMail({ to, subject, html });
  }

  /** Fire-and-forget welcome email, wired to registration. */
  async sendWelcomeEmail(to: string, fullname: string): Promise<void> {
    return this.sendTemplate(to, 'Welcome!', 'welcome', {
      fullname,
      email: to,
      appName: 'NestJS Enterprise Starter',
    });
  }
}
