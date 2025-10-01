/* global define, module */
/*!
 * crossmessage.js  ·  Cross-Domain Window Reliable Message Delivery
 * @Author: 刘希航 <liu.xihang@zte.com.cn>
 * @Date: 2025-10-01 20:00:00
 * @Description: Enterprise-grade cross-domain window communication library with reliable message delivery guarantee
 */
(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CrossMessage = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* -------------------- 常量 -------------------- */
  const MSG_TYPE = "CROSSMESSAGE_MSG";
  const ACK_TYPE = "CROSSMESSAGE_ACK";

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
      targetWindowName, // 新增：可选的目标窗口名称（用于跨标签页）
      targetOrigin = "*",
    } = opts || {};
    // 智能解析目标窗口
    let resolvedTargetWindow = targetWindow;
    
    if (!resolvedTargetWindow && typeof window !== "undefined") {
      // 1. 优先使用用户显式提供的窗口名称（独立标签页通信）
      if (typeof targetWindowName === "string" && targetWindowName.trim()) {
        try {
          // 使用 window.open 的特性：如果窗口存在则返回引用，不存在则创建
          const found = window.open('', targetWindowName.trim());
          // 关键检测：如果是刚创建的新窗口，它的 location.href 会是 'about:blank'
          // 且没有 opener（因为我们用空 URL 打开的）
          if (found && found !== window) {
            // 检查是否是刚创建的空白窗口
            try {
              const isNewBlank = found.location.href === 'about:blank' && 
                                 found.document.title === '' &&
                                 !found.document.body?.hasChildNodes();
              if (isNewBlank) {
                // 这是新创建的窗口，说明目标不存在，立即关闭它
                found.close();
              } else if (!found.closed) {
                // 这是已存在的窗口
                resolvedTargetWindow = found;
              }
            } catch (e) {
              // 跨域情况下无法访问 location，但说明窗口确实存在
              if (!found.closed) {
                resolvedTargetWindow = found;
              }
            }
          }
        } catch (_) {}
      }
      // 2. 尝试父子窗口关系（弹窗/iframe场景）
      if (!resolvedTargetWindow && (window.opener || window.parent)) {
        resolvedTargetWindow = window.opener || window.parent;
      }
      // 3. 若仍未解析，交由调用方显式传入
    }
    
    if (!resolvedTargetWindow) {
      return Promise.reject(new Error("[CrossMessage] 未能解析 targetWindow。请传入 targetWindow 或 targetWindowName，并确保接收端已设置 window.name。"));
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

    const { allowedOrigins = ["*"], expectedSourceWindow, name } = opts || {};

    // 可选：为接收端设置窗口名称，便于跨标签页通过名称定位
    try {
      if (typeof window !== "undefined" && name != null) {
        let desiredName = undefined;
        let forceDeep = false;
        if (typeof name === "string") {
          desiredName = name.trim();
        } else if (name && typeof name === "object") {
          if (typeof name.value === "string") desiredName = name.value.trim();
          if (name.deep === true) forceDeep = true;
        }
        if (desiredName) {
          if (forceDeep) {
            window.name = desiredName;
          } else {
            if (!window.name) {
              window.name = desiredName;
            } else if (window.name !== desiredName) {
              console.warn(
                `[CrossMessage] 当前页已存在 window.name="${window.name}"，未覆盖为 "${desiredName}"。如需强制，请传 { name: { value: "${desiredName}", deep: true } }`
              );
            }
          }
        }
      }
    } catch (_) {}

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
  return { sendUntilAck, receiveOnce, openAndSend };
});
