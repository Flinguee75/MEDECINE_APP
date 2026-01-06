import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Session,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Session() session: any) {
    const user = await this.authService.validateUser(loginDto);

    // Stocker l'ID de l'utilisateur dans la session
    session.userId = user.id;

    return {
      data: { user },
      message: 'Connexion réussie',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logout(@Session() session: any) {
    // Détruire la session
    return new Promise((resolve, reject) => {
      session.destroy((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            message: 'Déconnexion réussie',
          });
        }
      });
    });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@CurrentUser() userId: string) {
    const user = await this.authService.getUserById(userId);

    if (!user) {
      return {
        data: null,
      };
    }

    return {
      data: user,
    };
  }

  @Get('users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getUsers(@Query('role') role?: string, @Query('search') search?: string) {
    if (role && !Object.values(Role).includes(role as Role)) {
      throw new BadRequestException('Rôle invalide');
    }

    const users = await this.authService.getUsers(role as Role | undefined);

    // Apply search filter if provided
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    return {
      data: filteredUsers,
    };
  }

  @Post('users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.createUser(createUserDto);
    return {
      data: user,
      message: 'Utilisateur créé avec succès',
    };
  }

  @Patch('users/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.authService.updateUser(id, updateUserDto);
    return {
      data: user,
      message: 'Utilisateur modifié avec succès',
    };
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.authService.deleteUser(id);
    return {
      message: 'Utilisateur supprimé avec succès',
    };
  }
}
