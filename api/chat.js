export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: { message: "Method Not Allowed" } });
    return;
  }

  const apiKey = (
    process.env.DEEPSEEK_API_KEY ||
    process.env.DEEPSEEK_KEY ||
    process.env.DEEPSEEK_TOKEN ||
    ""
  ).trim();

  if (!apiKey) {
    res.status(500).json({
      error: {
        message:
          "服务端未配置 DEEPSEEK_API_KEY。请在 Vercel 项目 Settings → Environment Variables 中为 Production 添加该变量并重新部署。"
      }
    });
    return;
  }

  try {
    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body || {})
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (_) {
      data = { error: { message: text || "上游服务返回异常" } };
    }

    res.status(upstream.status).json(data);
  } catch (error) {
    res.status(500).json({ error: { message: error.message || "服务端请求失败" } });
  }
}
