import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

/** Reusable wrapper around bcrypt for hashing/comparing secrets. */
@Injectable()
export class PasswordService {
  constructor(private readonly configService: ConfigService) {}

  private get rounds(): number {
    return this.configService.get<number>('jwt.bcryptRounds', 12);
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
