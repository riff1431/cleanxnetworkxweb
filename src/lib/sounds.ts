/**
 * Lightweight notification sounds using Web Audio API.
 * No external audio files required.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequencies: number[], durations: number[], type: OscillatorType = "sine", volume = 0.15) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    let startTime = ctx.currentTime;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[i]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + durations[i]);
      startTime += durations[i] * 0.7; // slight overlap
    });
  } catch {
    // Silently fail if audio isn't available
  }
}

/** Short rising two-tone chime for new messages */
export function playMessageSound() {
  playTone([523, 659], [0.12, 0.18], "sine", 0.12);
}

/** Pleasant three-note chime for bookings */
export function playBookingSound() {
  playTone([440, 554, 659], [0.15, 0.15, 0.25], "sine", 0.13);
}

/** Soft bell-like tone for notifications */
export function playNotificationSound() {
  playTone([880, 1047], [0.1, 0.2], "triangle", 0.1);
}
