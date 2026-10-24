import { BrowserQRCodeReader } from '@zxing/browser';
import { cropCat, canvas } from '../src/image';
import { generate, decode, verifies } from '../src/verify';
import { wifiPayload, type WifiInput } from '../src/wifi';
import { drawQr } from '../src/render';
import { makeQr } from '../src/qr';
export async function matrix() {
  const files = ['assets/tom-default.png', 'tests/fixtures/black.png', 'tests/fixtures/white.png', 'tests/fixtures/busy.png', 'tests/fixtures/wide.png', 'tests/fixtures/tall.png'];
  const base: WifiInput = { ssid: 'CatHome', password: 'demo12345', security: 'wpa', hidden: false };
  const inputs = [base, { ...base, ssid: '猫咪的家' }, { ...base, ssid: ' A;B,C:D"\\ ' }, { ...base, password: ' pass;,:"\\word ' }, { ...base, ssid: 'a'.repeat(32), password: 'b'.repeat(63) }, { ...base, password: 'ab'.repeat(32) }, { ...base, security: 'open' as const }, { ...base, hidden: true }, { ...base, ssid: 'ABCD' }, { ...base, ssid: '"cat"\\' }];
  const reader = new BrowserQRCodeReader(); const rows = [];
  for (const file of files) {
    const blob = await (await fetch(`/hajimiWF/${file}`)).blob();
    const image = await createImageBitmap(blob); const cat = cropCat(image, { x: .5, y: .5, zoom: 1 }); image.close();
    for (let i = 0; i < inputs.length; i++) {
      const payload = wifiPayload(inputs[i]);
      const result = await generate(payload, cat, inputs[i].ssid, 0, 315, () => true, () => {});
      if (!result) throw new Error('No result');
      let independent: string;
      try { independent = reader.decodeFromCanvas(result.card).getText(); }
      catch {
        const rotated=canvas(result.card.width,result.card.height);const ctx=rotated.getContext('2d')!;
        ctx.translate(rotated.width,rotated.height);ctx.rotate(Math.PI);ctx.drawImage(result.card,0,0);
        independent=reader.decodeFromCanvas(rotated).getText();
      }
      if (independent !== payload) throw new Error(`ZXing mismatch: ${file}:${i}`);
      if (i === 0 && result.level === 3) throw new Error(`Art requirement failed: ${file}`);
      rows.push({ file, input: i, level: result.level });
    }
  }
  return rows;
}
export async function robustness() {
  const image = await createImageBitmap(await (await fetch('/hajimiWF/assets/tom-default.png')).blob());
  const cat = cropCat(image, { x: .5, y: .5, zoom: 1 }); image.close();
  const payload = 'WIFI:T:WPA;S:CatHome;P:demo12345;H:false;;';
  const original = await generate(payload, cat, 'CatHome', 0, 315, () => true, () => {});
  if (!original) throw new Error('No result');
  const rotated = canvas(original.qr.width + 160); const ctx = rotated.getContext('2d')!;
  ctx.fillStyle = '#fff';ctx.fillRect(0,0,rotated.width,rotated.height);ctx.translate(rotated.width/2,rotated.height/2);ctx.rotate(5*Math.PI/180);ctx.drawImage(original.qr,-original.qr.width/2,-original.qr.height/2);
  const jpeg = new Image();jpeg.src = original.qr.toDataURL('image/jpeg',.75);await jpeg.decode();
  const compressed = canvas(jpeg.width,jpeg.height); compressed.getContext('2d')!.drawImage(jpeg,0,0);
  const fallback = await generate(payload,cat,'CatHome',3,315,()=>true,()=>{});
  const protectedImage = drawQr(payload,cat,0);
  const pixel = protectedImage.getContext('2d')!.getImageData(0,0,protectedImage.width,1).data;
  return { rotate: decode(rotated) === payload, jpeg: decode(compressed) === payload, resize: verifies(original.qr,payload,347), fallback: fallback?.level === 3, quiet: Array.from(pixel).every(value=>value===255) };
}
export function decodeCanvas(source: HTMLCanvasElement) { return decode(source); }
export async function photoDetail() {
  const payload = 'WIFI:T:WPA;S:CatHome;P:demo12345;H:false;;';
  const matrix = makeQr(payload), unit = Math.ceil(1024 / (matrix.size + 8));
  const rows = [];
  for (const name of ['black', 'white', 'busy']) {
    const bitmap = await createImageBitmap(await (await fetch(`/hajimiWF/tests/fixtures/${name}.png`)).blob());
    const cat = cropCat(bitmap, { x: .5, y: .5, zoom: 1 }); bitmap.close();
    const improved = drawQr(payload, cat, 0), previous = drawQr(payload, cat, 1);
    const reference = canvas(improved.width); reference.getContext('2d')!.drawImage(cat, 4 * unit, 4 * unit, matrix.size * unit, matrix.size * unit);
    const data = [reference, improved, previous].map(image => image.getContext('2d')!.getImageData(0, 0, image.width, image.height).data);
    let newError = 0, oldError = 0, protectedPixels = true;
    for (let row = 0; row < matrix.size; row++) for (let col = 0; col < matrix.size; col++) {
      const at = row * matrix.size + col;
      for (let y = 0; y < unit; y++) for (let x = 0; x < unit; x++) {
        const offset = (((row + 4) * unit + y) * improved.width + (col + 4) * unit + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          if (matrix.reserved[at]) protectedPixels &&= data[1][offset + channel] === (matrix.bits[at] ? 0 : 255);
          else {
            newError += Math.abs(data[1][offset + channel] - data[0][offset + channel]);
            oldError += Math.abs(data[2][offset + channel] - data[0][offset + channel]);
          }
        }
      }
    }
    rows.push({ name, errorRatio: newError / oldError, protectedPixels, decodes: verifies(improved, payload, 315) });
  }
  return rows;
}
