import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email ${createUserDto.email} already exists`,
        );
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        include: {
          avatarFile: true,
        },
      });

      const { password, ...result } = user;

      return {
        message: 'User created successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findAll(includeInactive = false) {
    try {
      const where = includeInactive ? {} : { isActive: true };

      const users = await this.prisma.user.findMany({
        where,
        include: {
          avatarFile: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const usersWithoutPassword = users.map(({ password, ...user }) => user);

      return {
        message:
          users.length > 0 ? 'Users retrieved successfully' : 'No users found',
        count: users.length,
        data: usersWithoutPassword,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve users: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          avatarFile: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const { password, ...result } = user;

      return {
        message: 'User retrieved successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          avatarFile: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      const { password, ...result } = user;

      return {
        message: 'User retrieved successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.findOne(id);

      if (updateUserDto.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (existingUser && existingUser.id !== id) {
          throw new ConflictException(
            `Email ${updateUserDto.email} is already in use`,
          );
        }
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        include: {
          avatarFile: true,
        },
      });

      const { password, ...result } = user;

      return {
        message: 'User updated successfully',
        data: result,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const isPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );

      await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      return {
        message: 'Password changed successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  async toggleStatus(id: string) {
    try {
      const result = await this.findOne(id);
      const user = result.data;

      const updated = await this.prisma.user.update({
        where: { id },
        data: { isActive: !user.isActive },
        include: {
          avatarFile: true,
        },
      });

      const { password, ...resultUser } = updated;

      return {
        message: 'User status toggled successfully',
        data: resultUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to toggle user status: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);

      await this.prisma.user.delete({
        where: { id },
      });

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async updateLastLogin(id: string) {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      // Silently fail - this is a non-critical operation
    }
  }
}
