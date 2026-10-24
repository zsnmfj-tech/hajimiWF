一、Idea source
【一个把二维码画成一堆手绘火柴小人、居然还能扫出来的玩具网站：默认编码的那句话就叫「wait, this scans?」】

1、Soul raw materials（有趣的灵魂）

- 内核是一个反常识的小发现：二维码的冗余大到可以让「画」和「码」同时成立——页面把谜底写在明处，默认编码内容就是「wait, this scans?」，同一句话连按几次 Draw it 会长出略微不同的火柴小人；FAQ 里还认真承诺永远免费、绝不劫持 URL（「QR codes should always be free」），灵感署名 Noel Friedrich 的手绘二维码，玩梗与工程各占一半。

2、Visually appealing UI（好看的外表）

- 整个产品就是一张会动的纸：输入文字或链接，一个由歪歪扭扭小人拼成的方块二维码当场长出来，旁边只留一个 Download 按钮——把「这么歪也能扫？」的震撼留给你举着手机对屏幕扫码的那一秒。

3、How it works（中心点采样 · 手绘可扫）

- 机制亮点一句话讲完：解码器只找三个角的定位方块，在它们之间拉一张看不见的网格，然后只检查每格正中心的墨点、忽略周围一切——所以只要「深色格中心有墨、浅色格中心留白」，格子中间画什么都行。周末复刻：一个 canvas，文字→QR 位阵→每个深色格中心落一个火柴小人、浅色格留白，手机实测扫码即毕业。套路可迁移到一切「功能性图形」：把 Wi-Fi 密码码画成猫、名片码画成自画像、车票码画成像素恐龙。
- 来源：Waxy：[https://qrsticks.greg.technology/](https://qrsticks.greg.technology/)



二、my requirement
一句话描述【把 Wi-Fi 密码画成猫，亲朋好友来访的时候直接扫码连接Wi-Fi 】
可上传猫的图像，不上传默认使用 Tom & Jerry 中 Tom形象
先完成网站功能设计与开发，然后部署在GitHub免费网站给客户使用
