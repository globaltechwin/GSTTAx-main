import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const MAX_MEMORY = 256 * 1024 * 1024;

function deriveKey(
  password: string,
  salt: Buffer,
  length: number,
  options: { N: number; r: number; p: number; maxmem: number }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string, enforcePolicy = true): Promise<string> {
  if (password.length > 128 || (enforcePolicy && password.length < 4)) {
    throw new Error("Password must be between 4 and 128 characters");
  }

  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password: string, storedValue: string): Promise<boolean> {
  const parts = storedValue.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const cost = Number(parts[1]);
  const blockSize = Number(parts[2]);
  const parallelization = Number(parts[3]);
  const saltHex = parts[4];
  const expectedHex = parts[5];

  if (
    !Number.isSafeInteger(cost) ||
    cost < 16_384 ||
    cost > 131_072 ||
    !Number.isSafeInteger(blockSize) ||
    blockSize < 1 ||
    blockSize > 16 ||
    !Number.isSafeInteger(parallelization) ||
    parallelization < 1 ||
    parallelization > 4 ||
    !/^[0-9a-f]{32}$/i.test(saltHex) ||
    !/^[0-9a-f]{128}$/i.test(expectedHex)
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await deriveKey(password, salt, expected.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: MAX_MEMORY,
  });

  return timingSafeEqual(actual, expected);
}

export function verifyLegacyPassword(password: string, storedValue: string): boolean {
  const provided = Buffer.from(password);
  const stored = Buffer.from(storedValue);
  return provided.length === stored.length && timingSafeEqual(provided, stored);
}
