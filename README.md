# Prompt Architect — 部署教程（零基础版）

## 这个项目是什么？

一个 AI 图片提示词反向解析工具。上传产品图或参考图，自动生成 AI 生图所需的详细提示词。

---

## 一、项目文件说明

```
prompt-architect/
├── pages/
│   ├── index.js          ← 网页界面（用户看到的页面）
│   └── api/
│       └── analyze.js    ← 后端（调用 Gemini，API密钥藏在这里的环境变量里）
├── styles/
│   └── globals.css       ← 样式
├── package.json          ← 项目配置
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

**重要**：`analyze.js` 运行在服务器上，用户永远看不到里面的密钥。

---

## 二、部署步骤（全程网页操作，不需要命令行）

### 第 1 步：注册 GitHub 账号

1. 打开 https://github.com
2. 点击右上角 **Sign up**
3. 输入邮箱、密码、用户名，完成注册

### 第 2 步：创建 GitHub 仓库并上传文件

1. 登录 GitHub 后，点击右上角 **+** → **New repository**
2. Repository name 填写：`prompt-architect`
3. 选择 **Public**（公开）
4. 点击 **Create repository**
5. 进入仓库页面，点击 **uploading an existing file**
6. 把整个 `prompt-architect` 文件夹里的文件**逐个上传**（注意目录结构）：
   - 先创建 `pages` 文件夹，上传 `index.js`
   - 创建 `pages/api` 子文件夹，上传 `analyze.js`
   - 创建 `styles` 文件夹，上传 `globals.css`
   - 在根目录上传 `package.json`、`next.config.js`、`tailwind.config.js`、`postcss.config.js`

> **小技巧**：GitHub 网页上传时，可以把文件直接拖拽进去，路径会自动识别。

### 第 3 步：注册 Vercel 并连接 GitHub

1. 打开 https://vercel.com
2. 点击 **Sign Up** → 选择 **Continue with GitHub**（用 GitHub 账号登录，最方便）
3. 授权 Vercel 访问你的 GitHub

### 第 4 步：在 Vercel 部署项目

1. 登录 Vercel 后，点击 **Add New** → **Project**
2. 在列表里找到你刚创建的 `prompt-architect` 仓库，点击 **Import**
3. Framework Preset 会自动识别为 **Next.js**（如果没有，手动选择 Next.js）
4. 在 **Environment Variables** 区域，点击 **Add**：
   - Name：`GEMINI_API_KEY`
   - Value：填入你的 Gemini API 密钥（从 Google AI Studio 获取：https://aistudio.google.com/app/apikey）
5. 点击 **Deploy**
6. 等待 1-3 分钟，部署完成！

### 第 5 步：获取你的网址

部署成功后，Vercel 会给你一个网址，例如：
```
https://prompt-architect-xxx.vercel.app
```
把这个链接发给任何人，他们就能直接使用！

---

## 三、如何获取 Gemini API 密钥？

1. 打开 https://aistudio.google.com/app/apikey
2. 用 Google 账号登录
3. 点击 **Create API key**
4. 复制生成的密钥（形如 `AIzaSy...`）
5. 粘贴到 Vercel 的 `GEMINI_API_KEY` 环境变量中

---

## 四、常见问题

**Q：部署后访问显示 500 错误？**
A：检查 Vercel 的 Environment Variables 里 `GEMINI_API_KEY` 是否正确填写。

**Q：图片上传后没有反应？**
A：检查图片大小，建议不超过 5MB。

**Q：如何更新网页内容？**
A：直接在 GitHub 修改文件，Vercel 会自动重新部署（一般 1 分钟内生效）。

**Q：有多少人可以同时使用？**
A：Vercel 免费版支持每月 100GB 流量，个人分享完全够用。

---

## 五、费用说明

- **Vercel 部署**：免费（个人项目完全免费）
- **Gemini API**：每天有免费额度（约 1500 次请求/天），个人使用基本够用
- **域名**（可选）：如果想要自定义域名如 `yourname.com`，每年约 50-100 元

---

如有问题，可以把报错信息截图给 Claude 帮助排查。
