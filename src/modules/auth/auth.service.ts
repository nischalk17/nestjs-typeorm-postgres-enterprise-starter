import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserRoleENUM } from 'src/common/enums';
import { JwtPayload } from 'src/common/interfaces';
import { PasswordService } from 'src/common/utils';
import { MailService } from 'src/modules/mail/mail.service';
import { User } from 'src/modules/users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto, LoginUserDto } from './dto/auth.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly mailService: MailService,
  ) {}

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessOptions: JwtSignOptions = {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.accessExpiresIn',
      ) as JwtSignOptions['expiresIn'],
    };
    const refreshOptions: JwtSignOptions = {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.refreshExpiresIn',
      ) as JwtSignOptions['expiresIn'],
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...payload }, accessOptions),
      this.jwtService.signAsync({ ...payload }, refreshOptions),
    ]);

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    repository: Repository<User> = this.userRepository,
  ): Promise<void> {
    const hashed = await this.passwordService.hash(refreshToken);
    await repository.update(userId, { hashedRefreshToken: hashed });
  }

  async register(dto: CreateUserDto): Promise<AuthTokens> {
    if (
      dto.role === UserRoleENUM.ADMIN ||
      dto.role === UserRoleENUM.SUPER_ADMIN
    ) {
      throw new UnauthorizedException(
        'Unauthorised: Admin account cannot be created.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id'],
    });
    if (existingUser) {
      throw new ConflictException('Username or Email already exists');
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    // User creation + refresh-token persistence must succeed or fail
    // together — a partial failure here would leave a user row with no
    // usable refresh token (unable to silently re-auth after access-token
    // expiry) or, if save fails, an orphaned tokens issuance.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let newUser: User;
    let tokens: AuthTokens;
    try {
      const userRepo = queryRunner.manager.getRepository(User);
      newUser = userRepo.create({ ...dto, password: hashedPassword });
      await userRepo.save(newUser);

      tokens = await this.generateTokens(newUser);
      await this.persistRefreshToken(newUser.id, tokens.refreshToken, userRepo);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    // Fire-and-forget welcome email (does not block the response, and is
    // intentionally outside the transaction — an email failure must never
    // roll back a successful registration).
    void this.mailService.sendWelcomeEmail(newUser.email, newUser.fullname);

    return tokens;
  }

  async login(dto: LoginUserDto): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id', 'fullname', 'email', 'role', 'password'],
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await this.passwordService.compare(
      dto.password,
      user.password,
    );
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async refreshTokens(userId: string): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullname', 'email', 'role'],
    });
    if (!user) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<{ message: string; success: boolean }> {
    await this.userRepository.update(userId, { hashedRefreshToken: null });
    return { message: 'Account Logged Out', success: true };
  }
}
