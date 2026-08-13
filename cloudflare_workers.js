/**
 * SIGNAL RELAY - Cloudflare Worker (Customized)
 * データの中身は一切見ない（暗号文をそのまま右から左へ流すだけ）。
 * 暗号化・復号はすべてクライアント（ブラウザ）側で行う。
 */

const DEVICE_LIST_KEY = "relay:devices";
const dataKey = (id) => `relay:data:${id}`;

function withCors(resp) {
  resp.headers.set("Access-Control-Allow-Origin", "*");
  resp.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type,X-Relay-Key");
  return resp;
}

function json(data, status = 200) {
  return withCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

// RELAY_API_KEY を設定していれば、そのキーを知らないクライアントの
// 読み書きを拒否する（＝スパム書き込み防止用）。
function isAuthorized(request, env) {
  if (!env.RELAY_API_KEY) return true;
  return request.headers.get("X-Relay-Key") === env.RELAY_API_KEY;
}

async function getDeviceIds(env) {
  const raw = await env.RELAY_KV.get(DEVICE_LIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (!isAuthorized(request, env)) {
      return json({ error: "unauthorized" }, 401);
    }

    // 端末一覧
    if (url.pathname === "/api/devices" && request.method === "GET") {
      const ids = await getDeviceIds(env);
      return json({ ids });
    }

    // 特定端末の暗号化データを取得
    if (url.pathname === "/api/data" && request.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id is required" }, 400);
      const payload = await env.RELAY_KV.get(dataKey(id));
      if (payload === null) return json({ error: "not found" }, 404);
      return json({ payload });
    }

    // 特定端末の暗号化データを削除 (PCの回収処理用)
    if (url.pathname === "/api/delete" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return json({ error: "invalid json body" }, 400);
      }
      const { id } = body || {};
      if (!id) return json({ error: "id is required" }, 400);
      
      await env.RELAY_KV.delete(dataKey(id));
      
      const ids = await getDeviceIds(env);
      const filtered = ids.filter(x => x !== id);
      await env.RELAY_KV.put(DEVICE_LIST_KEY, JSON.stringify(filtered));
      
      return json({ ok: true });
    }

    // 端末からの送信（暗号化済みデータのみ受け取る）
    if (url.pathname === "/api/send" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return json({ error: "invalid json body" }, 400);
      }
      const { id, payload } = body || {};
      if (!id || !payload) {
        return json({ error: "id and payload are required" }, 400);
      }
      if (typeof id !== "string" || id.length > 80) {
        return json({ error: "invalid id" }, 400);
      }

      await env.RELAY_KV.put(dataKey(id), payload);

      const ids = await getDeviceIds(env);
      if (!ids.includes(id)) {
        ids.push(id);
        await env.RELAY_KV.put(DEVICE_LIST_KEY, JSON.stringify(ids));
      }

      return json({ ok: true });
    }

    return json({ error: "not found" }, 404);
  },
};
