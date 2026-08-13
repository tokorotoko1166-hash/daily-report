// ==========================================================================
// 業務日報・現場台帳 一括管理システム
// Cloudflare Workers (エッジ関数 ＆ KV) 用 中継プログラム (仕入れAPI拡張版)
// ==========================================================================
// 【配置方法】
// 1. Cloudflare のダッシュボードにて「Workers ＆ Pages」へ進み、新規 Worker を作成します。
// 2. このプログラムコードをコピー＆ペーストして貼り付けます。
// 3. Workersの設定の「Variables (環境変数/バインド)」の「KV Namespace Bindings」にて、
//    名前「DATA_KV」として新しく作成したKVバインドを追加します。
// 4. 保存してデプロイ（保存して公開）し、発行されたURLをPC管理者画面に登録します。
// ==========================================================================

// 不正アクセス防止用のアクセストークン（PC管理者画面およびスマホ側で一致させてください）
const AUTH_TOKEN = "TokoroEdgeOneAuthToken2026";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORSプリフライト（OPTIONS）リクエストへの自動対応
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders()
      });
    }

    // 1. アクセストークン認証チェック
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/, '').trim();
    if (token !== AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    // KVバインドチェック
    if (!env.DATA_KV) {
      return new Response(JSON.stringify({ error: 'DATA_KV namespace is not bound' }), {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
      });
    }

    try {
      // 2. エンドポイントごとのルーティング処理
      
      // 疎通接続テスト
      if (path === '/api/test' && method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok', message: 'Cloudflare Workers connected successfully.' }), {
          status: 200,
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
        });
      }

      // 現場サジェストリスト用API
      if (path === '/api/sites') {
        if (method === 'GET') {
          // 暗号化現場リストの取得
          const data = await env.DATA_KV.get('sites_list') || '[]';
          return new Response(data, {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        } else if (method === 'POST') {
          // 暗号化現場リストの保存
          const body = await request.text();
          await env.DATA_KV.put('sites_list', body);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }

      // 仕入れデータ（購入明細）用API
      if (path === '/api/purchases') {
        if (method === 'GET') {
          // 暗号化仕入れリストの取得
          const data = await env.DATA_KV.get('purchases_list') || '[]';
          return new Response(data, {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        } else if (method === 'POST') {
          // 暗号化仕入れリストの保存
          const body = await request.text();
          await env.DATA_KV.put('purchases_list', body);
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }

      // 提出日報用API
      if (path === '/api/reports') {
        if (method === 'POST') {
          // スマホから暗号化日報を中継ポストへ送信
          const body = await request.json();
          const reportId = 'rep_' + String(Date.now()) + '_' + String(Math.random()).slice(2, 8);
          // KVに一時保存
          await env.DATA_KV.put(`report_pending_${reportId}`, JSON.stringify(body));
          return new Response(JSON.stringify({ success: true, id: reportId }), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        } else if (method === 'GET') {
          // PCから未処理の日報を全取得
          const list = await env.DATA_KV.list({ prefix: 'report_pending_' });
          const reports = [];
          for (const key of list.keys) {
            const val = await env.DATA_KV.get(key.name);
            if (val) {
              reports.push({
                id: key.name.replace('report_pending_', ''),
                data: JSON.parse(val)
              });
            }
          }
          return new Response(JSON.stringify(reports), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        } else if (method === 'DELETE') {
          // 同期完了した日報をKV上から削除 (クリーンアップ)
          const body = await request.json();
          const docIds = body.ids || [];
          for (const docId of docIds) {
            await env.DATA_KV.delete(`report_pending_${docId}`);
          }
          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' }
      });
    }
  }
};

// CORS制限回避用レスポンスヘッダー
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
