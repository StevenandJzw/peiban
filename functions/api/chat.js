export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: { message: "服务端未配置 DEEPSEEK_API_KEY" } },
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
