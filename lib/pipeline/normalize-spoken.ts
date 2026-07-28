// Sin "server-only" — es una función pura, se referencia también desde
// pruebas/preview de cliente si hiciera falta. Red de seguridad POSTERIOR a
// Claude (que ya recibe la instrucción de normalizar en prompt_profiles
// task/script): un desliz puntual del modelo no debe romper el conteo de
// duración ni dejar un símbolo sin pronunciar.

const UNITS = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const TEENS = [
  "diez", "once", "doce", "trece", "catorce", "quince",
  "dieciséis", "diecisiete", "dieciocho", "diecinueve",
];
const TENS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const HUNDREDS = [
  "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
  "seiscientos", "setecientos", "ochocientos", "novecientos",
];

function twoDigitsToWords(n: number): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const tens = Math.floor(n / 10);
  const units = n % 10;
  if (n < 30) return units === 0 ? "veinte" : `veinti${UNITS[units]}`;
  return units === 0 ? TENS[tens] : `${TENS[tens]} y ${UNITS[units]}`;
}

function threeDigitsToWords(n: number): string {
  if (n === 100) return "cien";
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds > 0 ? HUNDREDS[hundreds] : "", rest > 0 ? twoDigitsToWords(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/** Enteros hasta 999.999.999 — suficiente para cualquier cifra que aparezca en un guion de 50s. */
export function integerToWords(n: number): string {
  if (n === 0) return "cero";
  if (n < 0) return `menos ${integerToWords(-n)}`;
  if (n < 1000) return threeDigitsToWords(n);
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    const thousandsWord = thousands === 1 ? "mil" : `${threeDigitsToWords(thousands)} mil`;
    return [thousandsWord, rest > 0 ? threeDigitsToWords(rest) : ""].filter(Boolean).join(" ");
  }
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  const millionsWord = millions === 1 ? "un millón" : `${integerToWords(millions)} millones`;
  return [millionsWord, rest > 0 ? integerToWords(rest) : ""].filter(Boolean).join(" ");
}

function percentMatchToWords(intPart: string, decPart?: string): string {
  let words = integerToWords(parseInt(intPart, 10));
  if (decPart) {
    const decWords = decPart
      .split("")
      .map((d) => UNITS[Number(d)] || "cero")
      .join(" ");
    words += ` coma ${decWords}`;
  }
  return `${words} por ciento`;
}

// Palabras clave de docs/07 §6.2 — spoken lleva minúscula CON tilde, onScreen
// mayúscula SIN tilde (regla dura de CLAUDE.md). Para keywords fuera de esta
// lista (personalizadas por el usuario) el fallback es minúscula sin tilde:
// mejor que dejar la palabra en mayúsculas dentro del audio.
const KEYWORD_SPOKEN: Record<string, string> = {
  INNOVACION: "innovación",
  AUTOMATIZA: "automatiza",
  AGENTE: "agente",
  SISTEMA: "sistema",
  PLANTILLA: "plantilla",
  FLUJO: "flujo",
  IA: "inteligencia artificial",
  BOT: "bot",
  GPT: "GPT",
};

/** keywordUpper: la forma on-screen (mayúsculas, sin tilde) → forma spoken (minúscula, con tilde si se conoce). */
export function keywordToSpoken(keywordUpper: string): string {
  return KEYWORD_SPOKEN[keywordUpper] ?? keywordUpper.toLowerCase();
}

/**
 * Red de seguridad best-effort, no sustituye la instrucción de prompt:
 * porcentajes a palabras y "IA" (sigla suelta) a "inteligencia artificial".
 * No intenta normalizar cifras con separador de miles ni fechas — casos
 * menos frecuentes que se atienden reforzando el prompt, no aquí.
 */
export function normalizeSpokenText(text: string): string {
  // El signo "-" queda fuera del \d+ y por eso no se leía: "-12%" se
  // convertía en "-doce por ciento" (el símbolo sin pronunciar quedaba
  // pegado al resultado). Se captura aparte y se antepone "menos".
  let out = text.replace(
    /(-)?(\d+)(?:[.,](\d+))?\s*%/g,
    (_match, negative: string | undefined, intPart: string, decPart?: string) =>
      `${negative ? "menos " : ""}${percentMatchToWords(intPart, decPart)}`,
  );
  out = out.replace(/\bIA\b/g, "inteligencia artificial");
  return out;
}
