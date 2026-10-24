import { canvas } from './image';
import { makeQr } from './qr';
export const CORE_SIZES = [0.60, 0.75, 0.90, 1] as const;
export function drawQr(payload: string, cat: HTMLCanvasElement, level: number) {
  const matrix = makeQr(payload);
  const unit = Math.ceil(1024 / (matrix.size + 8));
  const output = canvas((matrix.size + 8) * unit); const ctx = output.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, output.width, output.height);
  if (level < 3) ctx.drawImage(cat, 4 * unit, 4 * unit, matrix.size * unit, matrix.size * unit);
  for (let row = 0; row < matrix.size; row++) for (let col = 0; col < matrix.size; col++) {
    const at = row * matrix.size + col;
    const core = matrix.reserved[at] ? unit : Math.ceil(unit * CORE_SIZES[level]);
    const inset = Math.floor((unit - core) / 2);
    ctx.fillStyle = matrix.bits[at] ? '#000' : '#fff';
    ctx.fillRect((col + 4) * unit + inset, (row + 4) * unit + inset, core, core);
  }
  return output;
}
export function drawCard(qr: HTMLCanvasElement, cat: HTMLCanvasElement, ssid: string, level: number) {
  const pad = 48, top = level === 3 ? 230 : 128;
  const result = canvas(qr.width + pad * 2, qr.height + top + 180);
  const ctx = result.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, result.width, result.height);
  ctx.textAlign = 'center'; ctx.fillStyle = '#27251f'; ctx.font = 'bold 38px sans-serif';
  if (level === 3) { ctx.drawImage(cat, result.width / 2 - 64, 20, 128, 128); ctx.fillText('猫咪的 Wi-Fi 迎宾卡', result.width / 2, 198); }
  else ctx.fillText('猫咪的 Wi-Fi 迎宾卡', result.width / 2, 82);
  ctx.drawImage(qr, pad, top);
  ctx.font = 'bold 32px sans-serif';
  const characters = Array.from(ssid); const lines: string[] = []; let line = '';
  for (const character of characters) {
    if (ctx.measureText(line + character).width > result.width - 2 * pad) { lines.push(line); line = ''; }
    line += character;
  }
  lines.push(line);
  lines.forEach((text, i) => ctx.fillText(text, result.width / 2, top + qr.height + 48 + i * 40));
  ctx.fillStyle = '#666'; ctx.font = '26px sans-serif';
  ctx.fillText('用手机相机扫码，按提示加入 Wi-Fi', result.width / 2, result.height - 30);
  return result;
}
