export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = (
    env.DEEPSEEK_API_KEY ||
    env.DEEPSEEK_KEY ||
    env.DEEPSEEK_TOKEN ||
    ""
  ).trim();

  if (!apiKey) {
    return Response.json(
      {
        error: {
          message:
            "服务端未配置 DEEPSEEK_API_KEY。请在 Cloudflare Pages 项目 Settings → Environment variables 中添加并重新部署。"
        }
      },
      { status: 500 }
    );
  }

  try {
    const payload = await request.json();
    const upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload || {})
    });

    const data = await upstream.json();
    return Response.json(data, { status: upstream.status });
  } catch (error) {
    return Response.json(
      { error: { message: error.message || "服务端请求失败" } },
      { status: 500 }
    );
  }
}
