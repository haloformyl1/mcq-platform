import { SignJWT, jwtVerify } from 'jose'

const secretKey = process.env.JWT_SECRET || 'supersecret_jwt_key_replace_me_in_prod'
const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: any, expiresIn: string | number | Date = '10y') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key)
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return null
  }
}

