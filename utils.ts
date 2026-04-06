/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const playClick = () => {
  const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

export const playStartupSound = () => {
  const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.15, ctx.currentTime);
  masterGain.connect(ctx.destination);
  const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25];
  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
    g.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 2.5);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 2.5);
  });
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(130.81, ctx.currentTime);
  subGain.gain.setValueAtTime(0, ctx.currentTime);
  subGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.5);
  subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
  subOsc.connect(subGain);
  subGain.connect(masterGain);
  subOsc.start();
  subOsc.stop(ctx.currentTime + 2.5);
};

export const safeCopyToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try { document.execCommand('copy'); } catch (err) { console.error('Fallback copy failed', err); }
  document.body.removeChild(textArea);
};
