const express = require('express');
const https = require('https');
const http = require('http');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

// Termuxへのリクエストを中継する汎用関数
function forwardToTermux(path, bodyData, res) {
    const termuxCloudflareUrl = process.env.TERMUX_URL;
    if (!termuxCloudflareUrl) {
        return res.status(400).send('Renderの環境変数 TERMUX_URL が設定されていません。');
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
        termuxRes.pipe(res, { end: true }); // 撮影画像(jpeg)をそのまま学校へパス
    });

    termuxReq.on('error', (err) => res.status(500).send(`Termux中継エラー: ${err.message}`));
    termuxReq.write(postData);
    termuxReq.end();
}

// 💡 A. URLへのナビゲート要求を中継
app.post('/api/navigate', (req, res) => {
    forwardToTermux('/browser/navigate', req.body, res);
});

// 💡 B. 座標クリック要求を中継
app.post('/api/click', (req, res) => {
    forwardToTermux('/browser/click', req.body, res);
});

// 💡 C. メイン画面：環境変数（PROXY_HTML）からフロントHTMLを表示
app.get('/', (req, res) => {
    res.send(process.env.PROXY_HTML || `<h1>環境変数 PROXY_HTML を設定してください。</h1>`);
});

app.listen(port, () => {
    console.log(`Render Remote-Viewer Middle-Gate running on port ${port}`);
});
