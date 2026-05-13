const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function serveIndex(res) {
  const filePath = path.join(__dirname, "index.html");
  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendJson(res, 500, { error: { message: "页面读取失败" } });
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(content);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) {
        reject(new Error("请求体过大"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    serveIndex(res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    if (!DEEPSEEK_API_KEY) {
      sendJson(res, 500, { error: { message: "服务端未配置 DEEPSEEK_API_KEY" } });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const payload = JSON.parse(rawBody || "{}");

      const upstream = await fetch(DEEPSEEK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const text = await upstream.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { error: { message: text || "上游服务返回异常" } };
      }

      sendJson(res, upstream.status, data);
    } catch (error) {
      sendJson(res, 500, { error: { message: error.message || "服务端请求失败" } });
    }
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { error: { message: "Not Found" } });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
