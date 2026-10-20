import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const DEFAULT_N = 131_072;
const DEFAULT_R = 8;
const DEFAULT_P = 1;
const MAX_MEMORY = 256 * 1024 * 1024;

function deriveKey(
  password: string,
  salt: Buffer,
  n: number,
  r: number,
  p: number,
) {
  return new Promise<Buffer>((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: n, r, p, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key)),
    );
  });
}

export async function hashPassword(
  password: string,
  cost = { n: DEFAULT_N, r: DEFAULT_R, p: DEFAULT_P },
) {
  if (password.length < 8 || password.length > 128) {
    throw new Error("Password must contain between 8 and 128 characters");
  }
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, cost.n, cost.r, cost.p);
  return [
    "scrypt",
    cost.n,
    cost.r,
    cost.p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string) {
  try {
    const [algorithm, nValue, rValue, pValue, saltValue, keyValue] =
      encoded.split("$");
    if (algorithm !== "scrypt" || !keyValue || password.length > 128)
      return false;
    const n = Number(nValue);
    const r = Number(rValue);
    const p = Number(pValue);
    if (n !== DEFAULT_N || r !== DEFAULT_R || p !== DEFAULT_P) return false;
    const expected = Buffer.from(keyValue, "base64url");
    if (expected.length !== KEY_LENGTH) return false;
    const actual = await deriveKey(
      password,
      Buffer.from(saltValue, "base64url"),
      n,
      r,
      p,
    );
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
