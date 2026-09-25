// 💡 正しいインポート（require）部分
const express = require('express');
const Unblocker = require('unblocker');
const app = express();

// プロキシの基本設定
const unblocker = new Unblocker({ prefix: '/proxy/' });
app.use(unblocker);

// 1. フロントエンド画面：環境変数「PROXY_HTML」の値をそのまま読み取って表示する
app.get('/', (req, res) => {
    const htmlContent = process.env.PROXY_HTML || `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>Web Proxy (Default)</title></head>
        <body style="text-align:center; padding-top:50px; font-family:sans-serif;">
            <h2>Web Proxy (Default Screen)</h2>
            <p>Renderの環境変数「PROXY_HTML」を設定してください。</p>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// Renderが自動で割り当てるポート番号で起動
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Render Unblocker Backend running on port ${port}`);
});

// YouTubeなどの動画サイトの読み書き（WebSocket通信）を中継するための設定
server.on('upgrade', (request, socket, head) => {
    unblocker.onUpgrade(request, socket, head);
});
