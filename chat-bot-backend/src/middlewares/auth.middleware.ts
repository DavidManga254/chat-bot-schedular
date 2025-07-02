import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { decrypt } from 'src/lib/crypto';
import { UserService } from 'src/services/user/user.service';

@Injectable()
export class AuthMiddleWare implements NestMiddleware {
  constructor(private userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.signedCookies?.auth_token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    const decrypted = decrypt(token);

    if (!decrypted) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Invalid or tampered cookie' });
    }

    let payload: { email: string };

    try {
      payload = JSON.parse(decrypted);
    } catch {
      return res.status(401).json({ message: 'Unauthorized: Invalid payload' });
    }

    const existingUser = await this.userService.doesUserExist(payload.email);

    if (!existingUser) {
      return res.status(401).json({ message: 'Unauthorized: Invalid payload' });
    }

    req['user'] = { email: payload.email };

    next();
  }
}
