import "server-only";
import { isIPv4, isIPv6 } from "node:net";

function ipv4ToLong(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inCidr4(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipv4ToLong(ip) & mask) === (ipv4ToLong(range) & mask);
}

// 169.254.169.254 (metadata de nube AWS/GCP/Azure) cae dentro de
// 169.254.0.0/16 — cubierto explícitamente, no como caso aparte.
// 100.100.100.200 (metadata de Alibaba Cloud) NO cae en ningún rango
// RFC 1918 — vive en 100.64.0.0/10 (RFC 6598, Carrier-Grade NAT), que es un
// bypass real y conocido de guards SSRF que solo cubren los privados
// "clásicos". Se agrega explícitamente por eso, no por CGNAT en sí.
const PRIVATE_V4_RANGES = [
  "127.0.0.0/8",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16",
  "100.64.0.0/10",
  "0.0.0.0/8",
];

/** Rechaza IPs privadas, loopback, link-local y de metadata de nube — IPv4 e IPv6. Sin dependencias nuevas. */
export function isPrivateOrMetadataIp(ip: string): boolean {
  if (isIPv4(ip)) {
    return PRIVATE_V4_RANGES.some((cidr) => inCidr4(ip, cidr));
  }
  if (isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 — ULA
    if (/^fe[89ab]/.test(normalized)) return true; // fe80::/10 — link-local

    const v4Mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4Mapped) return isPrivateOrMetadataIp(v4Mapped[1]);
    return false;
  }
  return true; // formato irreconocible: conservador, se rechaza
}
