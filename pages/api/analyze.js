// pages/api/analyze.js
// =====================================================
// 这个文件运行在服务器上，用户永远看不到这里的代码
// API 密钥从环境变量读取，绝对安全
// 使用 Gemini (Google) API
// =====================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 从服务器环境变量读取 Gemini API 密钥
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: '服务器未配置 API 密钥，请联系管理员。'
    });
  }

  try {
    const { productImage, referenceImage } = req.body;

    if (!productImage && !referenceImage) {
      return res.status(400).json({ error: '请至少上传一张图片。' });
    }

    const systemPrompt = `你是一个顶级的视觉反向工程专家和AI生图提示词架构师。你的任务是对用户上传的图片进行极其严谨的像素级反向解析，并输出纯JSON格式数据。

严格遵循以下职责隔离原则：
板块 1 (subject): 如果提供了图 1 (Product Image)，仅根据图 1 简洁精准地描述产品品类、造型、材质和色调。如果未提供图 1，返回空字符串。
板块 2 (composition): 如果提供了图 2 (Reference Image)，根据图 2 解析镜头参数、视角、构图重心。如果未提供图 2，返回空字符串。
板块 3 (style): 如果提供了图 2 (Reference Image)，像素级描述图 2 的背景材质层级、主光/补光/轮廓光布光逻辑及色彩氛围。如果未提供图 2，返回空字符串。
板块 4 (text): 如果提供了图 2 (Reference Image)，执行 8 项极致解析：1)逐字识别所有文字; 2)语言; 3)字体风格; 4)字号层级; 5)颜色与对比关系; 6)排版坐标位置; 7)营销功能角色; 8)图形图标详述。如果未提供图 2，返回空字符串。

输出格式约束：
1. 只输出纯 JSON，不要有任何多余文字、解释或 markdown 代码块。
2. JSON 包含以下 5 个字段：subject, composition, style, text, full_prompt。
3. full_prompt 字段要求：必须按顺序合并上述 4 个非空板块的内容。严禁包含任何板块标题标签（如"主体："或"构图："）。每个模块独立成自然段，段落之间空一行。全篇必须为纯中文。`;

    // ── 构建发送给 Gemini 的消息内容 ──
    const parts = [];

    parts.push({ text: '请解析以下提供的图片数据，并严格按照系统指令输出JSON格式。' });

    if (productImage) {
      parts.push({ text: '图 1 (Product Image):' });
      parts.push({
        inlineData: {
          mimeType: productImage.mimeType,
          data: productImage.base64,
        }
      });
    }

    if (referenceImage) {
      parts.push({ text: '图 2 (Reference Image):' });
      parts.push({
        inlineData: {
          mimeType: referenceImage.mimeType,
          data: referenceImage.base64,
        }
      });
    }

    // ── 调用 Gemini API ──
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              role: 'user',
              parts,
            }
          ],
          generationConfig: {
            maxOutputTokens: 4096,
          },
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return res.status(502).json({
        error: `AI 服务返回错误 (${geminiResponse.status})，请稍后重试。`
      });
    }

    const data = await geminiResponse.json();

    // Gemini 返回结构：data.candidates[0].content.parts[0].text
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return res.status(502).json({ error: 'AI 未返回有效内容，请重试。' });
    }

    // 解析 JSON（清理可能的 ```json 代码块）
    let parsed;
    try {
      const clean = textResponse.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      const match = clean.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : clean);
    } catch {
      console.error('JSON parse failed, raw response:', textResponse);
      return res.status(502).json({ error: 'AI 返回格式解析失败，请重试。' });
    }

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: `服务器内部错误: ${error.message}`
    });
  }
}

// 增大请求体限制，因为图片是 base64 编码，体积较大
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
}
