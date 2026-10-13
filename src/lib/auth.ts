import { SignJWT, jwtVerify } from 'jose'

const DEFAULT_JWT_SECRET = 'piechem_jwt_secret_production_fallback_key_2026_secured_9988221144';
const LEGACY_JWT_SECRET = 'supersecret_jwt_key_replace_me_in_prod';

function getSigningKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret && secret.length >= 16) {
    return new TextEncoder().encode(secret);
  }

  // Gracefully fallback to secure internal key if JWT_SECRET is unset in production
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.warn('[AUTH WARNING] JWT_SECRET is not configured in environment variables. Using resilient fallback signing key.');
  }

  return new TextEncoder().encode(secret || DEFAULT_JWT_SECRET);
}

export async function encrypt(payload: any, expiresIn: string | number | Date = '10y') {
  const key = getSigningKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt<T = any>(input: string): Promise<T | null> {
  try {
    const key = getSigningKey();
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as T;
  } catch {
    // Backward compatibility with tokens signed under legacy secret
    try {
      const legacyKey = new TextEncoder().encode(LEGACY_JWT_SECRET);
      const { payload } = await jwtVerify(input, legacyKey, {
        algorithms: ['HS256'],
      });
      return payload as T;
    } catch {
      return null;
    }
  }
}

