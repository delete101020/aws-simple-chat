interface ClaimVerifyRequest {
  readonly token: string;
}

interface ClaimVerifyResult {
  readonly isValid: boolean;
  readonly userId: string;
  readonly email?: string;
  readonly clientId?: string;
  readonly sub?: string;
  readonly error?: any;
}

export { ClaimVerifyRequest, ClaimVerifyResult };
