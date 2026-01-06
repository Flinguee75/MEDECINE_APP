import {
  Controller,
  Post,
  Get,
  Body,
  Session,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
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
  @UseGuards(AuthGuard)
  async getUsers(@Query('role') role?: string) {
    if (role && !Object.values(Role).includes(role as Role)) {
      throw new BadRequestException('Rôle invalide');
    }

    const users = await this.authService.getUsers(role as Role | undefined);
    return {
      data: users,
    };
  }
}
