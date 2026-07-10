/**
 * autojs-helper 设备端 HTTP 服务
 *
 * 运行在 AutoJS6 / AutoX.js 上，基于 Java ServerSocket 手动实现 HTTP 协议。
 * 配合 PC 端 autojs-helper 桌面工具使用。
 *
 * 用法：在 AutoJS App 中加载并运行此脚本即可。
 * 端口：9319
 * 端点：GET /ping | GET /info | POST /exec
 *
 * /exec 根据 eval 返回值类型自动选择响应格式：
 *   - byte[] → 直接返回二进制（Content-Type: application/octet-stream）
 *   - 其他   → JSON 封装 {"status":"success","result":"..."}
 */

importClass(java.net.ServerSocket);
importClass(java.net.Socket);
importClass(java.net.InetSocketAddress);
importClass(java.io.InputStream);
importClass(java.io.OutputStream);
importClass(java.io.BufferedReader);
importClass(java.io.InputStreamReader);
importClass(java.lang.System);
importClass(java.util.concurrent.Executors);
importClass(java.lang.Runnable);

var PORT = 9319;
var TAG = "[autojs-helper]";

var threadPool = Executors.newCachedThreadPool();

// ---- HTTP 工具 -----------------------------------------------------------

/** 读取请求头（Rhino 中 Java String.length 是属性，不是方法） */
function readHeaders(reader) {
    var headers = {};
    var line;
    while ((line = reader.readLine()) !== null && line.length > 0) {
        var colon = line.indexOf(":");
        if (colon > 0) {
            headers[line.substring(0, colon).trim().toLowerCase()] =
                line.substring(colon + 1).trim();
        }
    }
    return headers;
}

/** 读取请求体（循环读取直至填满 contentLength，防止部分读取） */
function readBody(reader, contentLength) {
    if (!contentLength || contentLength <= 0) return "";
    var chars = java.lang.reflect.Array.newInstance(java.lang.Character.TYPE, contentLength);
    var total = 0;
    while (total < contentLength) {
        var n = reader.read(chars, total, contentLength - total);
        if (n < 0) break; // EOF 提前到达
        total += n;
    }
    return new java.lang.String(chars);
}

/** 发送文本响应 */
function sendTextResponse(outputStream, statusCode, statusText, contentType, bodyStr) {
    var bodyBytes = new java.lang.String(bodyStr).getBytes("UTF-8");
    var header =
        "HTTP/1.1 " + statusCode + " " + statusText + "\r\n" +
        "Content-Type: " + contentType + "; charset=utf-8\r\n" +
        "Content-Length: " + bodyBytes.length + "\r\n" +
        "Access-Control-Allow-Origin: *\r\n" +
        "Connection: close\r\n" +
        "\r\n";
    outputStream.write(new java.lang.String(header).getBytes("UTF-8"));
    outputStream.write(bodyBytes);
    outputStream.flush();
}

/** 发送二进制响应 */
function sendBinaryResponse(outputStream, statusCode, statusText, contentType, bytes) {
    var header =
        "HTTP/1.1 " + statusCode + " " + statusText + "\r\n" +
        "Content-Type: " + contentType + "\r\n" +
        "Content-Length: " + bytes.length + "\r\n" +
        "Access-Control-Allow-Origin: *\r\n" +
        "Connection: close\r\n" +
        "\r\n";
    outputStream.write(new java.lang.String(header).getBytes("UTF-8"));
    outputStream.write(bytes);
    outputStream.flush();
}

function sendJson(outputStream, statusCode, data) {
    sendTextResponse(outputStream, statusCode, "OK", "application/json", JSON.stringify(data));
}

function sendCors(outputStream) {
    var header =
        "HTTP/1.1 204 No Content\r\n" +
        "Access-Control-Allow-Origin: *\r\n" +
        "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n" +
        "Access-Control-Allow-Headers: Content-Type\r\n" +
        "Connection: close\r\n" +
        "\r\n";
    outputStream.write(new java.lang.String(header).getBytes("UTF-8"));
    outputStream.flush();
}

/** 判断是否为 byte 数组 */
function isByteArray(obj) {
    try {
        var cls = obj.getClass();
        return cls.isArray() && cls.getComponentType().getName() === "byte";
    } catch (e) {
        return false;
    }
}

// ---- 业务处理 -------------------------------------------------------------

function getDeviceInfo() {
    return {
        model: device.model || "Unknown",
        brand: device.brand || "Unknown",
        androidVersion: device.release || "Unknown",
        sdkInt: device.sdkInt || 0,
        resolution: device.width + "x" + device.height,
        screenWidth: device.width,
        screenHeight: device.height,
        autojsVersion: app.versionName || "Unknown",
        uptime: Math.floor(System.currentTimeMillis() / 1000)
    };
}

function handlePing(outputStream) {
    sendJson(outputStream, 200, { status: "ok", device: getDeviceInfo() });
}

function handleInfo(outputStream) {
    var info = getDeviceInfo();
    info.battery = device.getBattery ? device.getBattery() : -1;
    info.wifiEnabled = device.isWifiEnabled ? device.isWifiEnabled() : false;
    sendJson(outputStream, 200, { status: "ok", device: info });
}

function handleExec(outputStream, body, headers) {
    try {
        // 校验 Content-Type 必须包含 json
        var ct = (headers && headers["content-type"]) || "";
        if (ct.length > 0 && ct.indexOf("json") < 0) {
            sendJson(outputStream, 415, { status: "error", message: "Content-Type 必须为 application/json" });
            return;
        }
        var data = JSON.parse(body);
        var script = data.script || "";
        if (!script) {
            sendJson(outputStream, 400, { status: "error", message: "缺少 script 参数" });
            return;
        }
        var result = eval(script);

        // 根据返回值类型选择响应格式
        if (isByteArray(result)) {
            sendBinaryResponse(outputStream, 200, "OK", "application/octet-stream", result);
        } else {
            sendJson(outputStream, 200, { status: "success", result: String(result) });
        }
    } catch (e) {
        sendJson(outputStream, 500, { status: "error", message: e.message || String(e) });
    }
}

function handleScreenshot(outputStream) {
    try {
        var img
        try {
            img = captureScreen();
        } catch (e) {
           if(!images.requestScreenCapture()) {
               sendJson(outputStream, 500, { status: "error", message: "截图失败：请检查截图权限" });
               return;
           }
           img = captureScreen();
        }
        var bytes = images.toBytes(img, "jpg", 85);
        img.recycle();
        sendBinaryResponse(outputStream, 200, "OK", "image/jpeg", bytes);
    } catch (e) {
        sendJson(outputStream, 500, { status: "error", message: e.message || String(e) });
    }
}

function handleFindImage(outputStream, body) {
    try {
        var params = JSON.parse(body);
        if (!params.image) {
            sendJson(outputStream, 400, { success: false, error: "缺少 image 字段" });
            return;
        }
        var template = images.fromBase64(params.image);
        if (!template) {
            sendJson(outputStream, 400, { success: false, error: "模板图片解码失败" });
            return;
        }
        var screen
        try {
            screen = captureScreen();
        } catch (e) {
            if (!images.requestScreenCapture()) {
                template.recycle();
                sendJson(outputStream, 500, { success: false, error: "截图失败：请检查截图权限" });
                return;
            }
            screen = captureScreen();
        }
        if (!screen) {
            template.recycle();
            sendJson(outputStream, 500, { success: false, error: "截图失败" });
            return;
        }
        var threshold = params.threshold || 0.7;
        var options = { threshold: threshold };
        if (params.region) {
            options.region = [params.region.x, params.region.y, params.region.w, params.region.h];
        }
        var result = images.matchTemplate(screen, template, options);
        screen.recycle();
        template.recycle();

        var matches = [];
        if (result && result.matches) {
            for (var i = 0; i < result.matches.length; i++) {
                matches.push({
                    x: result.matches[i].point.x,
                    y: result.matches[i].point.y,
                    similarity: result.matches[i].similarity,
                });
            }
        }
        sendJson(outputStream, 200, {
            success: true,
            matches: matches,
            matchCount: matches.length,
        });
    } catch (e) {
        sendJson(outputStream, 500, { success: false, error: e.message || String(e) });
    }
}

function handle404(outputStream, path) {
    sendJson(outputStream, 404, { status: "error", message: "端点不存在: " + path });
}

// ---- 路由 -----------------------------------------------------------------

function route(method, path, outputStream, body, headers) {
    log(TAG + " " + method + " " + path);
    if (method === "OPTIONS") {
        sendCors(outputStream);
    } else if (path === "/ping" && method === "GET") {
        handlePing(outputStream);
    } else if (path === "/info" && method === "GET") {
        handleInfo(outputStream);
    } else if (path === "/exec" && method === "POST") {
        handleExec(outputStream, body, headers);
    } else if (path === "/screenshot" && method === "GET") {
        handleScreenshot(outputStream);
    } else if (path === "/find-image" && method === "POST") {
        handleFindImage(outputStream, body);
    } else {
        handle404(outputStream, path);
    }
}

// ---- 连接处理 -------------------------------------------------------------

function handleConnection(socket) {
    var inputStream = null;
    var outputStream = null;
    try {
        socket.setSoTimeout(10000); // 客户端读超时 10 秒，防止慢连接挂起线程
        socket.setTcpNoDelay(true); // 禁用 Nagle，避免大块写入时等待 ACK
        socket.setSendBufferSize(1024 * 1024); // 1MB 发送缓冲区
        inputStream = socket.getInputStream();
        outputStream = socket.getOutputStream();

        var reader = new BufferedReader(new InputStreamReader(inputStream, "UTF-8"));
        var requestLine = reader.readLine();
        if (!requestLine) { socket.close(); return; }

        var parts = requestLine.split(" ");
        if (parts.length < 2) { socket.close(); return; }

        var method = parts[0].toUpperCase();
        var path = parts[1];
        var headers = readHeaders(reader);
        var cl = parseInt(headers["content-length"] || "0");
        if (isNaN(cl) || cl < 0) {
            sendTextResponse(outputStream, 400, "Bad Request", "text/plain", "Invalid Content-Length");
            socket.close();
            return;
        }
        var body = readBody(reader, cl);

        route(method, path, outputStream, body, headers);
    } catch (e) {
        log(TAG + " 请求处理异常: " + e);
    } finally {
        try { if (outputStream) outputStream.close(); } catch (e) {}
        try { if (inputStream) inputStream.close(); } catch (e) {}
        try { socket.close(); } catch (e) {}
    }
}

// ---- 主循环 ---------------------------------------------------------------

log(TAG + " 启动 HTTP 服务，端口: " + PORT);
try { toast("autojs-helper 已启动 :" + PORT); } catch (e) {}

var server = null;
var running = true;

events.on("exit", function () {
    log(TAG + " 退出信号已收到，通知主循环停止");
    running = false;
    device.cancelKeepingAwake();
    try { threadPool.shutdownNow(); } catch (e) {}
});

try {
    // 必须先 setReuseAddress(true) 再 bind，否则 SO_REUSEADDR 不生效
    server = new ServerSocket();
    server.setReuseAddress(true);
    server.bind(new InetSocketAddress(PORT));
    // accept() 每 1 秒超时一次，让主循环有机会检查 running 标志
    // 这样就不用依赖 exit 回调跨线程关闭 socket，避免了竞态条件
    server.setSoTimeout(1000);
    device.keepScreenOn(3600 * 1000);

    while (running) {
        try {
            let client = server.accept();
            threadPool.execute(new Runnable(function () {
                handleConnection(client);
            }));
        } catch (e) {
            // 预期内：setSoTimeout 每 1 秒超时一次，用于检查 running 状态
            // 非超时异常记录日志，避免静默吞掉意外错误
            if (String(e).indexOf("SocketTimeout") < 0) {
                log(TAG + " accept 异常: " + e);
            }
        }
    }

    log(TAG + " 主循环已退出，正在释放端口 " + PORT);
} catch (e) {
    log(TAG + " 服务异常: " + e);
    try { toast("服务异常停止: " + e.message); } catch (ee) {}
} finally {
    if (server) { try { server.close(); } catch (e) {} }
    device.cancelKeepingAwake();
}
