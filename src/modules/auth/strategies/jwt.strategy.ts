import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_STRATEGY } from 'src/common/constants';
import { AuthenticatedUser } from 'src/common/interfaces/request-with-user.interface';
import { JwtPayload } from 'src/common/interfaces';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Re-load from DB so soft-deleted / deactivated / role-changed users are caught.
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'fullname', 'email', 'role', 'status'],
    });

    if (!user || !user.status) {
      throw new UnauthorizedException('User no longer active');
    }

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
    };
  }
}
