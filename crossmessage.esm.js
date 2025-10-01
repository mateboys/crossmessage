/*!
 * crossmessage.esm.js  ·  跨域窗口可靠消息投递 (ES Module)
 * @Author: 刘希航 <mateboy@foxmail.com>
 * @Date: 2025-10-01 10:29:56
 * @Description: 跨域窗口可靠消息投递，兼容：ES Module
 *  发送方：sendUntilAck(key, payload, opts)  -> Promise
 *    成功：resolve({key})   失败：reject(Error('超时'))
 *  接收方：receiveOnce(key)  -> Promise<payload>
 *  便捷API：openAndSend(url, key, payload, opts)  -> Promise
 */

/* -------------------- 常量 -------------------- */
const MSG_TYPE = "CROSSPOST_MSG";
const ACK_TYPE = "CROSSPOST_ACK";

/* -------------------- 内部存储 -------------------- */
const senders = new Map(); // key -> { stop, resolve, reject }
const receivers = new Map(); // key -> { promise, resolve, reject, received }

/* -------------------- 工具 -------------------- */
function uid() {
  return Math.random().toString(36).slice(2);
}

// 从 URL 中提取 origin（协议+域名+端口）
function extractOrigin(url) {
  try {
    // 尝试直接解析（适用于完整 URL）
    return new URL(url).origin;
  } catch (e) {
    // 如果失败，尝试使用当前页面作为 base URL（适用于相对路径）
    try {
      if (typeof window !== "undefined" && window.location) {
        return new URL(url, window.location.href).origin;
      }
    } catch (e2) {
      // 如果还是失败，返回 null
    }
    return null;
  }
}

// 检查混合内容安全问题
function checkMixedContent(targetOrigin) {
  if (typeof window === "undefined") return { safe: true };

  const currentProtocol = window.location.protocol;
  const targetProtocol = targetOrigin.split(":")[0] + ":";

  // HTTPS -> HTTP 会被阻止
  if (currentProtocol === "https:" && targetProtocol === "http:") {
    return {
      safe: false,
      reason:
        "HTTPS页面不能向HTTP页面发送postMessage（混合内容安全策略）。解决方案：将目标页面升级为HTTPS，或在HTTP环境下使用此库",
    };
  }

  return { safe: true };
}

// 检查目标窗口是否已关闭
function isWindowClosed(targetWindow) {
  try {
    return targetWindow && targetWindow.closed;
  } catch (e) {
    // 跨域访问 closed 属性可能抛异常，假设窗口存在
    return false;
  }
}

/* -------------------- 消息封装 -------------------- */
function post(targetWindow, targetOrigin, type, key, payload, expectAck, id) {
  try {
    targetWindow.postMessage(
      { type, key, payload, expectAck, id },
      targetOrigin
    );
  } catch (err) {
    // 忽略 targetWindow 暂不可用导致的异常
  }
}

/* ===================================================
 * 发送方 API：sendUntilAck
 *  opts: { interval=1000, timeout=5000 }
 *  成功：resolve({key})   失败：reject(Error)
 * =================================================== */
function sendUntilAck(key, payload, opts) {
  if (senders.has(key)) {
    return Promise.reject(
      new Error(`[CrossMessage] key="${key}" 的发送任务已存在`)
    );
  }

  const {
    interval = 1000,
    timeout = 5000,
    targetWindow,
    targetOrigin = "*",
  } = opts || {};
  const resolvedTargetWindow =
    targetWindow ||
    (typeof window !== "undefined" &&
      (window.opener || window.parent || window));
  if (!resolvedTargetWindow) {
    return Promise.reject(new Error("[CrossMessage] 未能解析 targetWindow"));
  }

  // 检查混合内容安全问题（如果指定了具体的 targetOrigin）
  if (targetOrigin !== "*") {
    const mixedCheck = checkMixedContent(targetOrigin);
    if (!mixedCheck.safe) {
      return Promise.reject(new Error(`[CrossMessage] ${mixedCheck.reason}`));
    }
  }

  return new Promise((resolve, reject) => {
    let intervalId, timeoutId;
    let active = true;

    function cleanup() {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      window.removeEventListener("message", onAck);
      senders.delete(key);
      // 内存保护：同时清理可能存在的接收方记录，防止极端场景下的内存泄漏
      receivers.delete(key);
      active = false;
    }

    function onAck(ev) {
      const d = ev.data;
      if (!active) return;
      if (!d || d.type !== ACK_TYPE || d.key !== key) return;
      // 校验来源窗口与域（如果指定）
      if (ev.source !== resolvedTargetWindow) return;
      if (targetOrigin !== "*" && ev.origin !== targetOrigin) return;
      resolve({ key });
      cleanup();
    }

    window.addEventListener("message", onAck);

    timeoutId = setTimeout(() => {
      cleanup();
      reject(
        new Error(`[CrossMessage] key="${key}" 等待回执超时（${timeout}ms）`)
      );
    }, timeout);

    intervalId = setInterval(() => {
      // 检查目标窗口是否已关闭
      if (isWindowClosed(resolvedTargetWindow)) {
        cleanup();
        reject(new Error(`[CrossMessage] key="${key}" 目标窗口已关闭`));
        return;
      }
      post(
        resolvedTargetWindow,
        targetOrigin,
        MSG_TYPE,
        key,
        payload,
        true,
        uid()
      );
    }, interval);

    post(
      resolvedTargetWindow,
      targetOrigin,
      MSG_TYPE,
      key,
      payload,
      true,
      uid()
    ); // 立即发一次
    senders.set(key, { stop: cleanup, resolve, reject });
  });
}

/* ===================================================
 * 接收方 API：receiveOnce
 *  返回 Promise<payload>
 * =================================================== */
function receiveOnce(key, opts) {
  if (receivers.has(key)) return receivers.get(key).promise;

  const { allowedOrigins = ["*"], expectedSourceWindow } = opts || {};

  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  receivers.set(key, { promise, resolve, reject, received: false });

  function onMsg(ev) {
    const d = ev.data;
    if (!d || d.type !== MSG_TYPE || d.key !== key) return;

    // 校验来源窗口
    if (expectedSourceWindow && ev.source !== expectedSourceWindow) return;

    // 校验来源域
    const originOk =
      allowedOrigins.includes("*") || allowedOrigins.includes(ev.origin);
    if (!originOk) return;

    const rec = receivers.get(key);
    if (rec && !rec.received) {
      rec.received = true;
      rec.resolve(d.payload);
      try {
        // 使用 ev.source 作为目标窗口，使用 ev.origin 作为回执目标 origin
        if (ev.source && typeof ev.source.postMessage === "function") {
          ev.source.postMessage(
            {
              type: ACK_TYPE,
              key,
              payload: undefined,
              expectAck: false,
              id: d.id,
            },
            ev.origin || "*"
          );
        }
      } catch (_) {}
      window.removeEventListener("message", onMsg);
      receivers.delete(key);
      // 内存保护：同时清理可能存在的发送方记录，防止极端场景下的内存泄漏
      senders.delete(key);
    }
  }

  window.addEventListener("message", onMsg);
  return promise;
}

/* ===================================================
 * 便捷 API：openAndSend
 *  打开窗口并发送消息，自动提取 targetOrigin
 * =================================================== */
function openAndSend(url, key, payload, opts) {
  const { windowFeatures, ...sendOpts } = opts || {};

  // 清理 URL：去除首尾空格
  const cleanUrl = typeof url === "string" ? url.trim() : url;
  if (!cleanUrl) {
    return Promise.reject(new Error("[CrossMessage] URL 不能为空"));
  }

  // 自动提取 targetOrigin，如果失败则回退到 '*'
  let targetOrigin = extractOrigin(cleanUrl);
  if (!targetOrigin) {
    console.warn(
      `[CrossMessage] 无法从 URL "${cleanUrl}" 提取 origin，回退到 '*'`
    );
    targetOrigin = "*";
  }

  // 检查混合内容安全问题（只有指定了具体 origin 时才检查）
  if (targetOrigin !== "*") {
    const mixedCheck = checkMixedContent(targetOrigin);
    if (!mixedCheck.safe) {
      return Promise.reject(new Error(`[CrossMessage] ${mixedCheck.reason}`));
    }
  }

  // 打开窗口（使用清理后的 URL）
  const targetWindow = window.open(cleanUrl, "_blank", windowFeatures);
  if (!targetWindow) {
    // 提供更详细的错误信息
    const errorMsg = `[CrossMessage] 无法打开目标窗口，可能的原因：
1. 浏览器弹窗拦截器阻止了窗口打开
2. 当前调用不在用户交互事件中（如点击事件）
3. 浏览器达到窗口数量限制
建议：在用户点击等交互事件中调用此函数`;
    return Promise.reject(new Error(errorMsg));
  }

  // 发送消息
  return sendUntilAck(key, payload, {
    ...sendOpts,
    targetWindow,
    targetOrigin,
  });
}

/* -------------------- 公开接口 -------------------- */

// ES Module 导出
export { sendUntilAck, receiveOnce, openAndSend };

// 默认导出（包含所有方法的对象）
export default { sendUntilAck, receiveOnce, openAndSend };
