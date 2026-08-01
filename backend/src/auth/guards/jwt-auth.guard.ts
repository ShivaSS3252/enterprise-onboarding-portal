import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// 'jwt' matches the name Passport registers for our JwtStrategy (PassportStrategy(Strategy)
// defaults its strategy name to the strategy class, resolved here as 'jwt').
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
