export function base64L16ToWavDataUri(
  base64L16: string,
  sampleRate = 24000,
  numChannels = 1
) {
  const raw = atob(base64L16);
  const pcmData = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    pcmData[i] = raw.charCodeAt(i);
  }

  const blockAlign = numChannels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // file length
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const output = new Uint8Array(buffer);
  output.set(pcmData, 44);

  // Safe base64 encode
  const base64Wav = uint8ToBase64(output);
  return `data:audio/wav;base64,${base64Wav}`;
}

function uint8ToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}
