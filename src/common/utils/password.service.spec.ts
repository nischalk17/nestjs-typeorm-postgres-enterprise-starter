import { ConfigService } from '@nestjs/config';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue(10),
    } as unknown as ConfigService;
    service = new PasswordService(configService);
  });

  it('hashes a password to a non-plain value', async () => {
    const hash = await service.hash('P@ssw0rd!');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('P@ssw0rd!');
  });

  it('compares a matching password successfully', async () => {
    const hash = await service.hash('P@ssw0rd!');
    await expect(service.compare('P@ssw0rd!', hash)).resolves.toBe(true);
  });

  it('rejects a non-matching password', async () => {
    const hash = await service.hash('P@ssw0rd!');
    await expect(service.compare('wrong', hash)).resolves.toBe(false);
  });
});
