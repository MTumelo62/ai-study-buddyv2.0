// --- Audio Decoding Functions ---
// These are required to process the raw PCM audio data from the Gemini API.

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- Audio Player ---
// A singleton AudioContext to avoid creating multiple contexts.
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
  }
  return audioContext;
};


export const playAudio = async (base64Audio: string, onEnded?: () => void): Promise<void> => {
    try {
        const ctx = getAudioContext();
        // Resume context if it was suspended by browser autoplay policies
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const decodedBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        if (onEnded) {
            source.onended = onEnded;
        }
        source.start();
    } catch (error) {
        console.error("Failed to play audio:", error);
        throw new Error("Could not play the generated audio.");
    }
};
