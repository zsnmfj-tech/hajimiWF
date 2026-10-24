import QRCode from 'qrcode';
export function makeQr(payload: string) {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'H' });
  // qrcode 1.5.4 internal interface, deliberately isolated and regression-tested.
  const matrix = qr.modules as typeof qr.modules & { reservedBit: Uint8Array; isReserved(row: number, col: number): boolean };
  if (matrix.reservedBit?.length !== matrix.size ** 2) throw new Error('二维码编码器版本不兼容。');
  return { size: matrix.size, bits: matrix.data, reserved: matrix.reservedBit, version: qr.version };
}
