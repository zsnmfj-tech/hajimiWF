import './styles.css';
import { cropCat, readCat, type Crop } from './image';
import { generate, verifies, type Result } from './verify';
import { validateWifi, wifiPayload, type WifiInput } from './wifi';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const form = el<HTMLFormElement>('form');
const ssid = el<HTMLInputElement>('ssid'), password = el<HTMLInputElement>('password');
const cropCanvas = el<HTMLCanvasElement>('crop'), resultCanvas = el<HTMLCanvasElement>('result-canvas');
const generateButton = el<HTMLButtonElement>('generate');
const defaultUrl = `${import.meta.env.BASE_URL}assets/tom-default.png`;
let cat: ImageBitmap | undefined;
let crop: Crop = { x: .5, y: .5, zoom: 1 };
let revision = 0, imageRevision = 0, busy = false, imageLoading = false;
let result: Result | undefined, resultUrl: string | undefined;

function status(text: string, kind = '') { el('status').textContent = text; el('status').className = kind; }
function invalidate() {
  revision++;
  result = undefined;
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = undefined;
  el<HTMLAnchorElement>('view-image').removeAttribute('href');
  el('result-actions').hidden = true;
  el('preview-tag').textContent = '等待生成';
  if (!resultCanvas.hidden) { status('信息已修改，请重新生成。'); el('paper-hint').textContent = '旧预览已失效，请重新生成。'; }
}
function input(): WifiInput {
  return { ssid: ssid.value, password: password.value, security: el<HTMLSelectElement>('security').value as WifiInput['security'], hidden: el<HTMLInputElement>('hidden-network').checked };
}
function drawCrop() {
  if (!cat) return;
  const picture = cropCat(cat, crop, 240);
  cropCanvas.getContext('2d')!.drawImage(picture, 0, 0);
  for (const [id, value] of [['crop-x', crop.x], ['crop-y', crop.y], ['zoom', crop.zoom]] as const) el<HTMLInputElement>(id).value = String(value);
  el('zoom-value').textContent = `${crop.zoom.toFixed(1)}×`;
}
async function loadDefault() {
  const token = ++imageRevision; imageLoading = true; invalidate(); generateButton.disabled = true;
  try {
    const response = await fetch(defaultUrl);
    if (!response.ok) throw new Error();
    const bitmap = await createImageBitmap(await response.blob());
    if (token !== imageRevision) { bitmap.close(); return; }
    invalidate(); cat?.close(); cat = bitmap; crop = { x: .5, y: .5, zoom: 1 }; drawCrop();
    el('cat-name').textContent = 'Tom，今天值班'; el('image-error').textContent = '';
    el<HTMLDetailsElement>('crop-options').open = false;
  } catch { if (token === imageRevision) el('image-error').textContent = '默认 Tom 暂时没有加载成功，可上传你的猫或点击恢复默认重试。'; }
  finally { if (token === imageRevision) { imageLoading = false; generateButton.disabled = busy || !cat; } }
}
form.addEventListener('input', event => {
  if ((event.target as HTMLElement).id === 'upload') return;
  invalidate();
  el('byte-count').textContent = `${new TextEncoder().encode(ssid.value).length} / 32 字节`;
  for (const field of ['ssid', 'password']) { el(`${field}-error`).textContent = ''; el(field).removeAttribute('aria-invalid'); }
});
el('show-password').addEventListener('click', () => {
  const show = password.type === 'password'; password.type = show ? 'text' : 'password';
  el('show-password').textContent = show ? '隐藏' : '显示'; el('show-password').setAttribute('aria-pressed', String(show));
});
el('security').addEventListener('change', () => {
  const open = input().security === 'open';
  if (open) { password.value = ''; password.type = 'password'; el('show-password').textContent = '显示'; el('show-password').setAttribute('aria-pressed', 'false'); status('已切换为无密码网络。'); }
  el('password-group').hidden = open;
  form.querySelector('.network-options summary span')!.textContent = open ? '无密码' : 'WPA / WPA2';
});
el<HTMLInputElement>('upload').addEventListener('change', async event => {
  const fileInput = event.target as HTMLInputElement; const file = fileInput.files?.[0]; fileInput.value = '';
  if (!file) return;
  const token = ++imageRevision; imageLoading = true; invalidate(); generateButton.disabled = true;
  try {
    const bitmap = await readCat(file);
    if (token !== imageRevision) { bitmap.close(); return; }
    invalidate(); cat?.close(); cat = bitmap; crop = { x: .5, y: .5, zoom: 1 }; drawCrop();
    el('cat-name').textContent = '你家的猫，来值班'; el('image-error').textContent = '';
    el<HTMLDetailsElement>('crop-options').open = true;
  } catch (error) { if (token === imageRevision) el('image-error').textContent = error instanceof Error ? error.message : '照片读取失败。'; }
  finally { if (token === imageRevision) { imageLoading = false; generateButton.disabled = busy || !cat; } }
});
el('restore').addEventListener('click', loadDefault);
for (const [id, key] of [['crop-x', 'x'], ['crop-y', 'y'], ['zoom', 'zoom']] as const) {
  el<HTMLInputElement>(id).addEventListener('input', event => { crop[key] = Number((event.target as HTMLInputElement).value); drawCrop(); });
}
el('reset-crop').addEventListener('click', () => { crop = { x: .5, y: .5, zoom: 1 }; invalidate(); drawCrop(); });
let drag: { px: number; py: number; x: number; y: number } | undefined;
cropCanvas.addEventListener('pointerdown', event => { if (!cat) return; drag = { px: event.clientX, py: event.clientY, x: crop.x, y: crop.y }; cropCanvas.setPointerCapture(event.pointerId); });
cropCanvas.addEventListener('pointermove', event => {
  if (!drag || !cat) return;
  const side = Math.min(cat.width, cat.height) / crop.zoom;
  const scale = side / cropCanvas.getBoundingClientRect().width;
  crop.x = cat.width === side ? .5 : Math.max(0, Math.min(1, drag.x - (event.clientX - drag.px) * scale / (cat.width - side)));
  crop.y = cat.height === side ? .5 : Math.max(0, Math.min(1, drag.y - (event.clientY - drag.py) * scale / (cat.height - side)));
  invalidate(); drawCrop();
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) cropCanvas.addEventListener(event, () => { drag = undefined; });
function previewWidth() { return Math.max(100, Math.floor(el('artwork').getBoundingClientRect().width)); }
async function run(start = 0) {
  if (busy || imageLoading || !cat) return;
  const values = input(), invalid = validateWifi(values);
  if (invalid) { el(`${invalid.field}-error`).textContent = invalid.message; el(invalid.field).setAttribute('aria-invalid', 'true'); el(invalid.field).focus(); return; }
  invalidate(); const token = revision; const current = () => token === revision;
  busy = true; generateButton.disabled = true; el<HTMLButtonElement>('enhance').disabled = true;
  const normalLabel = generateButton.innerHTML; generateButton.textContent = '猫咪正在开工…';
  try {
    const candidate = await generate(wifiPayload(values), cropCat(cat, crop), values.ssid, start, previewWidth(), current, message => { if (current()) status(message); });
    if (!candidate || !current()) return;
    result = candidate; resultUrl = URL.createObjectURL(candidate.blob);
    resultCanvas.width = candidate.qr.width; resultCanvas.height = candidate.qr.height;
    resultCanvas.getContext('2d')!.drawImage(candidate.qr, 0, 0);
    el('placeholder').hidden = true; resultCanvas.hidden = false;
    el('network-name').textContent = values.ssid; el('paper-hint').textContent = '用手机相机扫码，按提示加入 Wi-Fi';
    el('preview-tag').textContent = candidate.level === 3 ? '清晰版' : '猫咪融合版';
    status(candidate.level === 3 ? '这张照片已切换为清晰版，猫咪保留在下载的迎宾卡上。请用手机试扫。' : '图片校验通过，请用手机试扫。', 'success');
    el('result-actions').hidden = false; el('enhance').hidden = candidate.level === 3;
    el<HTMLAnchorElement>('view-image').href = resultUrl;
    if (window.innerWidth < 768) el('preview-title').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    el('preview-title').focus({ preventScroll: true });
  } catch (error) { if (current()) status(error instanceof Error ? error.message : '生成失败，请重试。', 'error'); }
  finally { busy = false; generateButton.disabled = imageLoading || !cat; el<HTMLButtonElement>('enhance').disabled = false; generateButton.innerHTML = normalLabel; }
}
form.addEventListener('submit', event => { event.preventDefault(); void run(); });
el('enhance').addEventListener('click', () => { if (result) void run(result.level + 1); });
el('download').addEventListener('click', () => {
  if (!result || !resultUrl) return;
  const link = document.createElement('a'); link.href = resultUrl; link.download = 'hajimi-wifi.png'; document.body.append(link); link.click(); link.remove();
});
let lastWidth = 320;
new ResizeObserver(() => {
  const width = previewWidth();
  if (result && width < Math.min(320, lastWidth) && !verifies(result.qr, result.payload, width)) { invalidate(); status('当前显示尺寸太小，请重新生成以增强识别。'); }
  lastWidth = width;
}).observe(el('artwork'));
void loadDefault();
