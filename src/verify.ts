import jsQR from 'jsqr';
import { BrowserQRCodeReader } from '@zxing/browser';
import { canvas, pngBlob } from './image';
import { drawCard, drawQr } from './render';
const secondReader = new BrowserQRCodeReader();
function crossVerifies(source: HTMLCanvasElement, payload: string): boolean {
  if (decode(source) !== payload) return false;
  try { return secondReader.decodeFromCanvas(source).getText() === payload; }
  catch {
    // ZXing can select a false finder pattern even on a pristine standard QR.
    // Retry the identical pixels upside down; never change or re-encode the payload.
    const rotated = canvas(source.width, source.height); const ctx = rotated.getContext('2d')!;
    ctx.translate(source.width, source.height); ctx.rotate(Math.PI); ctx.drawImage(source, 0, 0);
    try { return secondReader.decodeFromCanvas(rotated).getText() === payload; }
    catch { return false; }
  }
}
export function decode(source: HTMLCanvasElement): string | undefined {
  const pixels = source.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, source.width, source.height);
  return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' })?.data;
}
export function verifies(source: HTMLCanvasElement, payload: string, width: number): boolean {
  const sample = canvas(Math.floor(width), Math.round(width * source.height / source.width));
  sample.getContext('2d')!.drawImage(source, 0, 0, sample.width, sample.height);
  return crossVerifies(sample, payload);
}
export interface Result { qr: HTMLCanvasElement; card: HTMLCanvasElement; blob: Blob; level: number; payload: string }
export async function generate(payload: string, cat: HTMLCanvasElement, ssid: string, start: number, width: number, current: () => boolean, progress: (message: string) => void): Promise<Result | null> {
  for (let level = start; level < 4; level++) {
    if (!current()) return null;
    progress(level === 3 ? '正在制作更易识别的清晰版…' : `正在校验猫咪图片${level ? '，增强识别中' : ''}…`);
    await new Promise(resolve => setTimeout(resolve, 0));
    if (!current()) return null;
    const qr = drawQr(payload, cat, level);
    if (!crossVerifies(qr, payload) || !verifies(qr, payload, 320) || (width < 320 && !verifies(qr, payload, width))) continue;
    const card = drawCard(qr, cat, ssid, level);
    if (!crossVerifies(card, payload)) continue;
    const blob = await pngBlob(card);
    // Validate the actual downloadable PNG, not just the pre-encoded canvas.
    const bitmap = await createImageBitmap(blob);
    const exported = canvas(bitmap.width, bitmap.height); exported.getContext('2d')!.drawImage(bitmap, 0, 0); bitmap.close();
    if (!crossVerifies(exported, payload)) continue;
    return current() ? { qr, card, blob, level, payload } : null;
  }
  throw new Error('图片未通过校验，请重新生成或更换照片。');
}
