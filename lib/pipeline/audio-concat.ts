// Concatenación de audio PCM entre bloques del guion (paso 4) — sin ffmpeg ni
// ninguna librería de audio: es aritmética de buffers pura sobre PCM 16-bit
// signed little-endian, mono. docs/03-INTEGRATIONS.md §1 "Síntesis por
// bloques": cada bloque (hook, promesa, contenido, CTA) se sintetiza por
// separado en ElevenLabs y se concatena aquí respetando pausas naturales.

/** Silencio de `ms` milisegundos como PCM 16-bit signed LE, mono — puro cero. */
export function silencePcm(ms: number, sampleRate: number): Buffer {
  const bytesPerSample = 2; // 16-bit
  const samples = Math.round((ms / 1000) * sampleRate);
  return Buffer.alloc(samples * bytesPerSample); // Buffer.alloc ya rellena con ceros
}

/** Concatena chunks de PCM (mismo sample rate y formato) en orden. */
export function concatenatePcm(chunks: Buffer[]): Buffer {
  return Buffer.concat(chunks);
}

/**
 * Envuelve PCM crudo en un contenedor WAV (header de 44 bytes), mono,
 * 16-bit. Formato bien conocido y determinístico — no requiere ninguna
 * librería:
 *
 *   "RIFF" + tamañoTotal + "WAVE"
 *   "fmt " + 16 + PCM(1) + canales(1) + sampleRate + byteRate + blockAlign + bitsPerSample(16)
 *   "data" + tamañoDatos + <pcm>
 */
export function wrapPcmAsWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8); // 2
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + dataSize, 4); // tamaño total - 8
  header.write("WAVE", 8, "ascii");

  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // tamaño del subchunk1 (PCM)
  header.writeUInt16LE(1, 20); // audio format 1 = PCM sin comprimir
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write("data", 36, "ascii");
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}
