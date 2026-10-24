import { describe, expect, it } from 'vitest';
import { escapeWifi, validateWifi, wifiPayload, type WifiInput } from '../src/wifi';
const normal: WifiInput = { ssid: 'CatHome', password: 'demo12345', security: 'wpa', hidden: false };
describe('Wi-Fi input and encoding', () => {
  it('encodes a personal network without changing data', () => expect(wifiPayload(normal)).toBe('WIFI:T:WPA;S:CatHome;P:demo12345;H:false;;'));
  it('preserves spaces and escapes each metacharacter exactly once', () => { expect(escapeWifi(' a\\;,:" ')).toBe(' a\\\\\\;\\,\\:\\" '); });
  it('counts UTF-8 bytes instead of characters', () => { expect(validateWifi({ ...normal, ssid: '猫'.repeat(10) + 'ab' })).toBeNull(); expect(validateWifi({ ...normal, ssid: '猫'.repeat(11) })?.field).toBe('ssid'); });
  it.each(['', 'a'.repeat(33), 'a\nb'])('rejects invalid SSID %j', ssid => expect(validateWifi({ ...normal, ssid })).not.toBeNull());
  it.each(['1234567', 'a'.repeat(64) + 'a', 'g'.repeat(64), '密码123456'])('rejects unsupported passwords %j', password => expect(validateWifi({ ...normal, password })?.field).toBe('password'));
  it.each(['12345678', 'a'.repeat(63), 'ab'.repeat(32), ' pass   '])('accepts valid password length', password => expect(validateWifi({ ...normal, password })).toBeNull());
  it('never includes password for open networks', () => expect(wifiPayload({ ...normal, security: 'open', hidden: true })).toBe('WIFI:T:nopass;S:CatHome;H:true;;'));
});
