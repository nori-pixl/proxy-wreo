const http = require('http');
const https = require('https');
const url = require('url');

// Renderが自動で割り当てるポート番号（指定がない場合は3000）
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // 1. プロキシ機能（Renderの裏側が身代わりになって「読み書き」する）
    // URLの例: https://onrender.com
    if (parsedUrl.pathname === '/proxy') {
        const targetUrlStr = parsedUrl.query.url;
        if (!targetUrlStr) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('エラー: urlパラメータが指定されていません。');
        }

        try {
            const targetUrl = new URL(targetUrlStr);
            const clientModule = targetUrl.protocol === 'https:' ? https : http;

            // ① ターゲットサイトのHTMLやデータを「読みに行く」
            const proxyReq = clientModule.request(targetUrl, (proxyRes) => {
                
                // セキュリティ上、不要なヘッダーを削除（CORS対策など）
                const cleanedHeaders = { ...proxyRes.headers };
                delete cleanedHeaders['content-security-policy'];
                delete cleanedHeaders['x-frame-options'];

                // ② 相手サイトのステータスとヘッダーを引き継ぐ
                res.writeHead(proxyRes.statusCode, cleanedHeaders);
                
                // ③ 読み取った中身を、そのまま学校のブラウザへ「書き戻す」
                proxyRes.pipe(res, { end: true });
            });

            // POSTデータなどの送信データがあればそのまま中継する
            req.pipe(proxyReq, { end: true });

            proxyReq.on('error', (err) => {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`プロキシエラー: ${err.message}`);
            });
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('エラー: 無効なURL形式です。http:// または https:// から入力してください。');
        }
        return;
    }

    // 2. メイン画面：Renderの【環境変数 PROXY_HTML】からHTMLコードを読み取って表示する
    // もし環境変数が設定されていなければ、デフォルトの簡易入力画面を出す
    const htmlContent = process.env.PROXY_HTML || `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Web Proxy (Default)</title></head>
        <body style="text-align:center; padding-top:50px; font-family:sans-serif;">
            <h2>Web Proxy (Default Screen)</h2>
            <p>Renderの環境変数「PROXY_HTML」を設定してください。</p>
            <form action="/proxy" method="GET">
                <input type="text" name="url" placeholder="https://example.com" style="width:300px; padding:10px;" required>
                <button type="submit" style="padding:10px 20px;">Go</button>
            </form>
        </body>
        </html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
});

server.listen(port, () => {
    console.log(`Render Proxy Server successfully running on port ${port}`);
});
