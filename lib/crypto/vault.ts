import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM envelope encryption para claves BYOK (docs/03-INTEGRATIONS.md
// "Política común" + docs/02-DATA-MODEL.md §3). El descifrado solo debe
// ocurrir en Server Actions / route handlers, nunca en un Server Component
// que pueda serializar el resultado hacia el cliente.

const ALGORITHM = "aes-256-gcm";
const CURRENT_KEY_VERSION = 1;

function getKek(keyVersion: number): Buffer {
  if (keyVersion !== CURRENT_KEY_VERSION) {
    throw new Error(`No hay KEK configurada para key_version ${keyVersion}.`);
  }
  const raw = process.env.INTEGRATIONS_KEK;
  if (!raw) {
    throw new Error("Falta la variable de entorno INTEGRATIONS_KEK.");
  }
  const kek = Buffer.from(raw, "base64");
  if (kek.length !== 32) {
    throw new Error(
      "INTEGRATIONS_KEK debe decodificar a 32 bytes (AES-256-GCM).",
    );
  }
  return kek;
}

function toPgBytea(buf: Buffer): string {
  return `\\x${buf.toString("hex")}`;
}

function fromPgBytea(value: string): Buffer {
  return Buffer.from(value.replace(/^\\x/, ""), "hex");
}

export type EncryptedSecretRow = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
};

export type StoredSecretRow = {
  ciphertext: string;
  iv: string;
  auth_tag: string;
  key_version: number;
};

/** Cifra una clave en claro y devuelve los campos listos para `integrations`. */
export function encryptSecret(plaintext: string): EncryptedSecretRow {
  const keyVersion = CURRENT_KEY_VERSION;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getKek(keyVersion), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: toPgBytea(ciphertext),
    iv: toPgBytea(iv),
    authTag: toPgBytea(authTag),
    keyVersion,
  };
}

/** Descifra una fila de `integrations` tal como viene de Supabase. */
export function decryptSecret(row: StoredSecretRow): string {
  const kek = getKek(row.key_version);
  const decipher = createDecipheriv(ALGORITHM, kek, fromPgBytea(row.iv));
  decipher.setAuthTag(fromPgBytea(row.auth_tag));
  const plaintext = Buffer.concat([
    decipher.update(fromPgBytea(row.ciphertext)),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** Últimos 4 caracteres de la clave, lo único seguro de mostrar en la UI. */
export function lastFourOf(plaintext: string): string {
  return plaintext.slice(-4);
}
