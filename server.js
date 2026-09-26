const http = require('http');
const https = require('https');
const url = require('url');

const port = process.env.PORT || 3000;

// Termux（バックエンド）へのデータ中継処理
function forwardToTermux(path, bodyData, res) {
    const termuxCloudflareUrl = process.env.TERMUX_URL;
    if (!termuxCloudflareUrl) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Renderの環境変数 TERMUX_URL が設定されていません。');
    }

    const postData = JSON.stringify(bodyData);
    const termuxUrlObj = new URL(`${termuxCloudflareUrl}${path}`);
    const clientModule = termuxUrlObj.protocol === 'https:' ? https : http;

    const options = {
        hostname: termuxUrlObj.hostname,
        path: termuxUrlObj.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const termuxReq = clientModule.request(options, (termuxRes) => {
        res.writeHead(termuxRes.statusCode, termuxRes.headers);
        termuxRes.pipe(res, { end: true });
    });

    termuxReq.on('error', (err) => {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Termux中継エラー: ${err.message}`);
    });
    
    termuxReq.write(postData);
    termuxReq.end();
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // 💡 A. URLへのナビゲート要求を中継
    if (req.method === 'POST' && parsedUrl.pathname === '/api/navigate') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            forwardToTermux('/browser/navigate', JSON.parse(body), res);
        });
        return;
    }

    // 💡 B. 座標クリック要求を中継
    if (req.method === 'POST' && parsedUrl.pathname === '/api/click') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            forwardToTermux('/browser/click', JSON.parse(body), res);
        });
        return;
    }

    // 💡 C. メイン画面：Renderの環境変数（PROXY_HTML）からフロントHTMLを表示
    const htmlContent = process.env.PROXY_HTML || `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Error</title></head>
        <body style="text-align:center; padding-top:50px; font-family:sans-serif; background:#222; color:#fff;">
            <h2>Web Proxy Portal</h2>
            <p>※環境変数 PROXY_HTML が正しく設定されていないか、読み込めていません。</p>
        </body>
        </html>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
});

server.listen(port, () => {
    console.log(`Render Remote-Viewer Middle-Gate running on port ${port}`);
});
