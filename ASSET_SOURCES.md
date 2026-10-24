# 素材与依赖来源

日期：2026-10-24。

以下图片均由本会话的 imagegen 工具生成，未使用用户的私人猫照片；不宣称官方授权或角色权利转让。

| 文件 | 内容 / 用途 |
| --- | --- |
| `public/assets/tom-default.png` | Tom 灰蓝猫，正面友好表情、简单暖白背景；网站默认图 |
| `tests/fixtures/black.png` | 黑猫，浅背景，暗色毛发回归 |
| `tests/fixtures/white.png` | 白猫，灰背景，浅色毛发回归 |
| `tests/fixtures/busy.png` | 橘猫，书与植物背景，复杂纹理回归 |
| `tests/fixtures/wide.png` | 灰虎斑横卧沙发，横向裁剪回归 |
| `tests/fixtures/tall.png` | 三花猫坐在椅子上，竖向裁剪回归 |

默认图以 PNG 保留生成原图；用户照片不通过 imagegen，仅使用浏览器 Canvas 本地处理。测试图片不进入 `dist/`。

运行依赖：qrcode 1.5.4（MIT）、jsQR 1.4.0（Apache-2.0）、@zxing/browser 0.2.1（MIT）及 @zxing/library（Apache-2.0）。完整许可见 `public/licenses/`，依赖版本由 lockfile 固定。
