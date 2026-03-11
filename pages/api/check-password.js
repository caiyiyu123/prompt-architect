// pages/api/check-password.js
// 验证访问密码，密码存在 Vercel 环境变量 SITE_PASSWORD 里
// 想改密码：去 Vercel → Settings → Environment Variables → 修改 SITE_PASSWORD 的值

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  const { password } = req.body;
  const correctPassword = process.env.SITE_PASSWORD;

  if (!correctPassword) {
    // 如果没有设置密码，直接放行（方便开发测试）
    return res.status(200).json({ ok: true });
  }

  if (password === correctPassword) {
    return res.status(200).json({ ok: true });
  } else {
    return res.status(200).json({ ok: false });
  }
}
