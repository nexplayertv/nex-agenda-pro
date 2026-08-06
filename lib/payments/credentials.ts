import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Criptografia simétrica (AES-256-GCM) das credenciais de gateway em
// repouso. A chave vem de CREDENTIALS_ENCRYPTION_KEY (.env, nunca no
// frontend) - ver .env.example. Formato armazenado: iv:tag:ciphertext (hex).

function getKey(): Buffer {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY não configurada");
  }
  return scryptSync(secret, "agendapro-credenciais-gateways", 32);
}

export function encriptarCredenciais(dados: Record<string, string>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const texto = JSON.stringify(dados);
  const encrypted = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function descriptografarCredenciais(valor: string): Record<string, string> {
  const [ivHex, tagHex, dataHex] = valor.split(":");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}
