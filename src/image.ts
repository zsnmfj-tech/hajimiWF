export interface Crop { x: number; y: number; zoom: number }
export function canvas(width: number, height = width): HTMLCanvasElement {
  const value = document.createElement('canvas'); value.width = width; value.height = height; return value;
}
export async function readCat(file: File): Promise<ImageBitmap> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('请选择 JPEG、PNG 或 WebP。HEIC 照片请先转为 JPEG。');
  if (file.size > 5 * 1024 * 1024) throw new Error('照片需要小于 5 MiB，请先缩小图片。');
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error('无法读取这张照片，请换一张完整的图片。'); }
  if (bitmap.width * bitmap.height > 16_000_000) { bitmap.close(); throw new Error('照片超过 1600 万像素，请先缩小图片。'); }
  return bitmap;
}
export function cropCat(image: ImageBitmap, crop: Crop, size = 1024): HTMLCanvasElement {
  const result = canvas(size); const ctx = result.getContext('2d')!;
  const side = Math.min(image.width, image.height) / crop.zoom;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
  ctx.drawImage(image, (image.width - side) * crop.x, (image.height - side) * crop.y, side, side, 0, 0, size, size);
  return result;
}
export function pngBlob(source: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => source.toBlob(blob => blob ? resolve(blob) : reject(new Error('图片保存失败，请重试。')), 'image/png'));
}
