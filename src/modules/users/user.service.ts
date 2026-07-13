import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRoleENUM } from 'src/common/enums';
import { LoggedInUser } from 'src/common/types';
import { generateTakeSkip } from 'src/common/utils/pagination.util';
import { ILike, Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDTO } from './dto/user-filter.dto';
import { User } from './entities/user.entity';

/** Whitelist of columns users are allowed to sort the list endpoint by. */
const SORTABLE_COLUMNS = new Set(['createdAt', 'fullname', 'email', 'role']);

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(filter: UserFilterDTO = new UserFilterDTO()) {
    const { skip, take } = generateTakeSkip({
      page: filter.page,
      take: filter.take,
    });
    const sortBy =
      filter.sortBy && SORTABLE_COLUMNS.has(filter.sortBy)
        ? filter.sortBy
        : 'createdAt';

    return this.userRepository.findAndCount({
      where: {
        ...(filter.role ? { role: filter.role } : {}),
        ...(filter.search ? { fullname: ILike(`%${filter.search}%`) } : {}),
      },
      select: ['id', 'createdAt', 'fullname', 'email', 'role'],
      order: { [sortBy]: filter.sortOrder || 'DESC' },
      skip,
      take,
    });
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'createdAt', 'fullname', 'email', 'role'],
    });

    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  getProfile(user: LoggedInUser) {
    return {
      message: 'Logged-In User Data',
      user,
    };
  }

  async update(id: string, updateDetails: UpdateUserDto) {
    const userData = await this.userRepository.findOne({ where: { id } });

    if (!userData) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (
      updateDetails.role === UserRoleENUM.ADMIN ||
      updateDetails.role === UserRoleENUM.SUPER_ADMIN
    ) {
      throw new UnauthorizedException(
        'Unauthorised: Admin or Super Admin role cannot be assigned.',
      );
    }

    if (
      userData.role === UserRoleENUM.ADMIN ||
      userData.role === UserRoleENUM.SUPER_ADMIN
    ) {
      throw new UnauthorizedException(
        'Unauthorised: Admin or Super Admin account cannot be modified.',
      );
    }

    this.userRepository.merge(userData, updateDetails);
    await this.userRepository.save(userData);

    return {
      message: 'User details updated successfully',
      success: true,
    };
  }

  async deleteById(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);

    await this.userRepository.softDelete(user.id);
    return {
      message: `User: ${id} Deleted Successfully`,
      success: true,
    };
  }
}
