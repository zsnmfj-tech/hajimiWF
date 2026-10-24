# 哈基米 Wi-Fi

让猫咪帮你招待朋友。将 Wi-Fi 信息融入整张猫照片，生成可下载的迎宾卡；默认使用 Tom，也可上传自己的猫。

## 本地运行

需要 Node.js 24 和 npm。

```sh
npm ci
npm run dev
```

打开终端给出的 `/hajimiWF/` 地址。输入 Wi-Fi 名称和密码，选择猫图、调整裁剪，再生成并下载 PNG。

首版支持 WPA/WPA2 个人网络和开放网络，支持中文网络名；密码接受 8–63 位可打印 ASCII 或 64 位十六进制 PSK。WPA3-only、企业认证、中文/表情密码暂不支持。

## 校验与隐私

二维码完整保留功能区域和四模块白色静区。jsQR 与 ZXing 同时检查原图、缩小图及最终 PNG；无法通过时自动提高识别清晰度，最后回退标准码与猫图卡片。

SSID、密码、用户图片仅在当前页面内存中处理，不发送给服务端，不写入 URL 或浏览器存储。下载图片本身包含 Wi-Fi 连接信息。应用的“校验通过”只说明像素可解码，不代表手机已连接网络。

## 验证命令

```sh
npm run typecheck
npm test
npx playwright install chromium webkit
npm run test:e2e
npm run build
npm run preview
```

自动化测试使用虚构网络信息和生成的测试猫图。`output/`、`test-results/` 不提交。六张猫图与十种网络信息在两种浏览器引擎中进行交叉解码；另有输入、状态、上传、下载、隐私、响应式和图片切换竞态回归。

## GitHub Pages

项目使用 `/hajimiWF/` 基路径，构建目录为 `dist/`。工作流在 `main` 和 PR 上验证，只有主分支且仓库变量 `RELEASE_READY=true` 时部署。

首次正式发布前完成 [实体设备验收](docs/验收记录.md)，随后设置 Pages 来源为 GitHub Actions、启用该变量并手动执行工作流。这个首次发布门槛保证未经实测的版本不会自动成为正式上线版本。后续主分支通过检查后自动更新。

回退使用普通 `git revert` 恢复上一已验证提交，再部署；不用强推。已下载的二维码不依赖站点在线，变更 Wi-Fi 密码后需重新生成。

## 文档

- [功能设计](docs/功能设计.md)
- [开发与部署计划](docs/开发与部署计划.md)
- [视觉规范](DESIGN.md)
- [验收记录](docs/验收记录.md)
- [素材来源](ASSET_SOURCES.md)

二维码相关第三方许可随站点放在 `public/licenses/`。Tom 为 AI 生成的角色插画，本站不表示与《猫和老鼠》权利方存在官方合作。
