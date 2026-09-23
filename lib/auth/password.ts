import { hash, verify } from "@node-rs/argon2";

// `Algorithm` is a `const enum` in @node-rs/argon2, which isolatedModules (set in
// tsconfig.json) can't support — so we inline its value. 2 = Argon2id.
const OPTIONS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export function verifyPassword(hashed: string, password: string): Promise<boolean> {
  return verify(hashed, password);
}
