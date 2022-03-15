import { verify } from 'jsonwebtoken';
import { ClaimVerifyRequest, ClaimVerifyResult } from '@core/constants';
import { VerifyStrategy } from './verifier';

export class JwtVerifier implements VerifyStrategy {
  private _secret: string;

  constructor() {
    this._secret = process.env.JWT_SECRET;
  }

  async verify(request: ClaimVerifyRequest): Promise<ClaimVerifyResult> {
    const payload = verify(request.token, this._secret);

    return payload as ClaimVerifyResult;
  }
}
