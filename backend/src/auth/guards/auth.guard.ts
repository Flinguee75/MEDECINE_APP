import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Vérifier si l'utilisateur est connecté (session contient userId)
    if (!request.session || !request.session.userId) {
      throw new UnauthorizedException('Vous devez être connecté');
    }

    return true;
  }
}
