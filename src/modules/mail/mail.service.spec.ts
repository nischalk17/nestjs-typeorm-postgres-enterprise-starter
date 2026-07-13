import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'test' });

  beforeEach(() => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'mail') {
          return { host: 'smtp.test', port: 587, secure: false };
        }
        if (key === 'mail.from') return 'no-reply@test.com';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new MailService(configService);
    service.onModuleInit();
    sendMailMock.mockClear();
  });

  it('sends a text email via the transporter', async () => {
    await service.sendText('user@test.com', 'Subject', 'Body');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com', text: 'Body' }),
    );
  });

  it('does not throw when the transporter fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('smtp down'));
    await expect(
      service.sendText('user@test.com', 'Subject', 'Body'),
    ).resolves.toBeUndefined();
  });
});
