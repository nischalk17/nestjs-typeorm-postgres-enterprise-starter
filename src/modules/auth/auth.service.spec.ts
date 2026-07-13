import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PasswordService } from 'src/common/utils';
import { UserRoleENUM } from 'src/common/enums';
import { MailService } from 'src/modules/mail/mail.service';
import { AuthService } from './auth.service';
import { User } from 'src/modules/users/entities/user.entity';

describe('AuthService - refresh flow', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let passwordService: jest.Mocked<Partial<PasswordService>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    passwordService = {
      hash: jest.fn().mockResolvedValue('hashed-refresh'),
    };
    const configService = {
      get: jest.fn().mockReturnValue('secret'),
    } as unknown as ConfigService;
    const mailService = {
      sendWelcomeEmail: jest.fn(),
    } as unknown as MailService;
    const dataSource = {} as unknown as DataSource;

    service = new AuthService(
      userRepository as unknown as Repository<User>,
      dataSource,
      jwtService as unknown as JwtService,
      configService,
      passwordService as unknown as PasswordService,
      mailService,
    );
  });

  it('issues new tokens and persists the hashed refresh token', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      email: 'a@b.com',
      role: UserRoleENUM.USER,
    });

    const tokens = await service.refreshTokens('1');

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(passwordService.hash).toHaveBeenCalledWith('refresh-token');
    expect(userRepository.update).toHaveBeenCalledWith('1', {
      hashedRefreshToken: 'hashed-refresh',
    });
  });

  it('throws when the user no longer exists', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.refreshTokens('99')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('clears the stored refresh hash on logout', async () => {
    const result = await service.logout('1');
    expect(userRepository.update).toHaveBeenCalledWith('1', {
      hashedRefreshToken: null,
    });
    expect(result.success).toBe(true);
  });
});
