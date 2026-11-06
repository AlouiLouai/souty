/**
 * Browser text-to-speech in Arabic, mirroring the PWA's voice selection:
 * prefer a Tunisian Arabic voice, then any Arabic voice. Call only from
 * client components, in response to a user gesture.
 */

function arabicVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => /^ar[-_]TN/i.test(voice.lang)) ??
    voices.find((voice) => /^ar/i.test(voice.lang)) ??
    null
  );
}

/**
 * Chrome loads voices asynchronously; asking once early makes them
 * available by the time the visitor presses a speak button.
 */
export function warmUpVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.getVoices();
}

/**
 * Speaks Arabic text aloud.
 *
 * @returns `true` if an Arabic voice was found and speech started. When
 * `false`, nothing is spoken and `onEnd` still fires after a short pause so
 * callers can run the same "finished" UI either way.
 */
export function speakArabic(text: string, onEnd?: () => void): boolean {
  const voice = arabicVoice();
  if (voice) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.9;
      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }
      synth.speak(utterance);
      return true;
    } catch {
      // Fall through to the silent path.
    }
  }
  if (onEnd) window.setTimeout(onEnd, 1800);
  return false;
}
