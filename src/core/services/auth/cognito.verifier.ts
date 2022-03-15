import fetch from 'node-fetch';
import { verify } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { ClaimVerifyRequest, ClaimVerifyResult } from '@core/constants';
import { VerifyStrategy } from './verifier';

interface TokenHeader {
  kid: string;
  alg: string;
}

interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

interface PublicKeyMeta {
  instance: PublicKey;
  pem: string;
}

interface PublicKeys {
  keys: PublicKey[];
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}

interface Claim {
  sub: string;
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  'cognito:username': string;
  client_id: string;
}

let cognitoIssuer = '';
let cacheKeys: MapOfKidToPublicKey | undefined;

async function fetchKeys(): Promise<PublicKeys> {
  const publicKeysResponse = await fetch(cognitoIssuer);
  return publicKeysResponse.json() as unknown as PublicKeys;
}

async function getPublicKeys() {
  if (!cacheKeys) {
    const publicKeys = await fetchKeys();

    cacheKeys = publicKeys.keys.reduce((agg, current) => {
      const pem = jwkToPem(current as jwkToPem.JWK);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {} as MapOfKidToPublicKey);
    return cacheKeys;
  } else {
    return cacheKeys;
  }
}

export class CognitoVerifier implements VerifyStrategy {
  private _userPoolId: string;
  private _region: string;

  constructor() {
    this._userPoolId = process.env.COGNITO_USER_POOL_ID;
    this._region = process.env.COGNITO_REGION;

    if (this._userPoolId) throw Error('userPoolId is required');
    if (this._region) throw Error('region is required');

    cognitoIssuer = `https://cognito-idp.${this._region}.amazonaws.com/${this._userPoolId}/.well-known/jwks.json`;
  }

  async verify(request: ClaimVerifyRequest): Promise<ClaimVerifyResult> {
    let result: ClaimVerifyResult;
    try {
      const { token } = request;
      if (!token) throw Error('token is required');

      const tokenParts = token.split('.');
      const header: TokenHeader = JSON.parse(
        Buffer.from(tokenParts[0], 'base64').toString('utf8')
      );
      const kid = header.kid;

      const publicKeys = await getPublicKeys();
      const publicKey = publicKeys[kid];
      if (!publicKey) throw Error(`public key not found at ${cognitoIssuer}`);

      const claim = verify(token, publicKey.pem) as Claim;
      const now = new Date().getTime() / 1000;
      if (now > claim.exp) throw Error('token expired');
      if (claim.iss !== cognitoIssuer)
        throw Error('token not issued by this issuer');
      if (claim.token_use !== 'id')
        throw Error('token not intended for use with cognito');

      result = {
        isValid: true,
        sub: claim.sub,
        userId: claim['cognito:username'],
        clientId: claim.client_id,
      };
    } catch (error) {
      result = {
        isValid: false,
        sub: '',
        userId: '',
        clientId: '',
        error,
      };
    }

    return result;
  }
}
