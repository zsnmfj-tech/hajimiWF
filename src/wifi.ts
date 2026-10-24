export interface WifiInput { ssid: string; password: string; security: 'wpa' | 'open'; hidden: boolean }
export function validateWifi(input: WifiInput): { field: 'ssid' | 'password'; message: string } | null {
  const bytes = new TextEncoder().encode(input.ssid).length;
  if (!bytes || bytes > 32) return { field: 'ssid', message: 'Wi-Fi 名称需要 1–32 字节，中文通常占 3 字节。' };
  if (/[\u0000-\u001f\u007f]/.test(input.ssid)) return { field: 'ssid', message: 'Wi-Fi 名称不能包含换行或控制字符。' };
  if (input.security === 'wpa') {
    if (/[^\x20-\x7e]/.test(input.password)) return { field: 'password', message: '此版本暂不支持中文或表情密码。' };
    if (!/^[\x20-\x7e]{8,63}$/.test(input.password) && !/^[0-9a-fA-F]{64}$/.test(input.password)) {
      return { field: 'password', message: '请输入 8–63 位密码，或 64 位十六进制密钥；空格也算一位。' };
    }
  }
  return null;
}
export function escapeWifi(value: string): string { return value.replace(/[\\;,:\"]/g, '\\$&'); }
export function wifiPayload(input: WifiInput): string {
  const invalid = validateWifi(input);
  if (invalid) throw new Error(invalid.message);
  return `WIFI:T:${input.security === 'wpa' ? 'WPA' : 'nopass'};S:${escapeWifi(input.ssid)};${input.security === 'wpa' ? `P:${escapeWifi(input.password)};` : ''}H:${input.hidden};;`;
}
