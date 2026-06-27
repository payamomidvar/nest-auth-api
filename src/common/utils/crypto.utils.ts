import { createHash, randomBytes } from 'crypto';

export class CryptoUtils {
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  static generateRandomToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }
}

const rawToken = CryptoUtils.generateRandomToken();
const hashedToken = CryptoUtils.hashToken(rawToken);
