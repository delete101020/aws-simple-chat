import { ClaimVerifyRequest, ClaimVerifyResult } from '@core/constants';

export interface VerifyStrategy {
  verify(request: any): Promise<any>;
}

export class Verifier {
  private static _instance: Verifier;
  private _strategy: VerifyStrategy;

  constructor(strategy: VerifyStrategy) {
    this._strategy = strategy;
  }

  public static getInstance(strategy: VerifyStrategy) {
    if (!Verifier._instance) {
      Verifier._instance = new Verifier(strategy);
    } else if (Verifier._instance.getStrategy() !== strategy) {
      Verifier._instance.setStrategy(strategy);
    }

    return Verifier._instance;
  }

  public getStrategy() {
    return this._strategy;
  }

  public setStrategy(strategy: VerifyStrategy) {
    this._strategy = strategy;
  }

  /** =================================================================== */

  public async verifyToken(
    request: ClaimVerifyRequest
  ): Promise<ClaimVerifyResult> {
    return this._strategy.verify(request);
  }
}
