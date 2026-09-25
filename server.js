const http = require('http');

// Renderが自動で割り当てるポート番号
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    // Renderの【環境変数 PROXY_HTML】からHTMLコードを読み取って表示する
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

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(htmlContent);
});

server.listen(port, () => {
    console.log(`Render Frontend Server successfully running on port ${port}`);
});
