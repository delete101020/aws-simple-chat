import { CognitoVerifier } from './cognito.verifier';
import { JwtVerifier } from './jwt.verifier';
import { Verifier } from './verifier';

export default class AuthService {
  private static _instance: AuthService;
  private _verifier: Verifier;

  constructor() {
    // Default to JWT verifier
    const VERIFIER = process.env.VERIFIER || 'JWT';

    if (VERIFIER === 'JWT') {
      this._verifier = Verifier.getInstance(new JwtVerifier());
    }

    if (VERIFIER === 'COGNITO') {
      this._verifier.setStrategy(new CognitoVerifier());
    }
  }

  public static getInstance() {
    if (!AuthService._instance) {
      AuthService._instance = new AuthService();
    }

    return AuthService._instance;
  }

  /** =================================================================== */

  async verifyToken(token: string) {
    return await this._verifier.verifyToken({ token });
  }
}
