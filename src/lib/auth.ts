import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const INSECURE_FALLBACKS = new Set([
  'supersecret_jwt_key_replace_me_in_prod',
  'piechem-secret-key-change-in-production',
  'default_secret',
  'secret'
]);

function getSigningKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || INSECURE_FALLBACKS.has(secret) || secret.length < 16) {
      throw new Error(
        'CRITICAL: JWT_SECRET environment variable is missing, insecure, or too short in production. Authentication operations are halted for safety.'
      );
    }
    return new TextEncoder().encode(secret);
  }

  // Non-production (development, mock tests): fallback if not provided
  const activeSecret = secret || 'supersecret_jwt_key_replace_me_in_prod';
  return new TextEncoder().encode(activeSecret);
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
    if (process.env.NODE_ENV === 'production') {
      const secret = process.env.JWT_SECRET?.trim();
      if (!secret || INSECURE_FALLBACKS.has(secret) || secret.length < 16) {
        console.error('[SECURITY ALERT] Token verification failed: JWT_SECRET is missing or insecurely configured in production.');
      }
    }
    return null;
  }
}

