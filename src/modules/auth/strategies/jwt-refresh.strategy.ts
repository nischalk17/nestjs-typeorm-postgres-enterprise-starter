import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as bcrypt from 'bcrypt';
import { JWT_REFRESH_STRATEGY } from 'src/common/constants';
import { AuthenticatedUser } from 'src/common/interfaces/request-with-user.interface';
import { JwtPayload } from 'src/common/interfaces';
import { User } from 'src/modules/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  JWT_REFRESH_STRATEGY,
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret')!,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<AuthenticatedUser> {
    const authHeader = req.get('authorization') || '';
    const refreshToken = authHeader.replace('Bearer', '').trim();

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'fullname',
        'email',
        'role',
        'status',
        'hashedRefreshToken',
      ],
    });

    if (!user || !user.status || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const matches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!matches) {
      throw new UnauthorizedException('Access denied');
    }

    return {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      refreshToken,
    };
  }
}
