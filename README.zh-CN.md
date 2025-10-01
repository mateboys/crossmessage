# CrossMessage

<div align="right">

[![English](https://img.shields.io/badge/English-blue)](README.md) [![中文](https://img.shields.io/badge/中文-red)](README.zh-CN.md)

</div>

[![npm version](https://badge.fury.io/js/crossmessage-js.svg)](https://badge.fury.io/js/crossmessage-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/mateboys/crossmessage-js.svg)](https://github.com/mateboys/crossmessage-js/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/mateboys/crossmessage-js.svg)](https://github.com/mateboys/crossmessage-js/issues)

CrossMessage 是一个基于 `postMessage` 的跨域窗口通信库，专为解决跨域 Web 应用间的可靠数据传递而设计。当传统的 URL 参数传递方式无法满足复杂数据交换需求时，CrossMessage 提供了稳定、安全、易用的解决方案。

它最大的用途在于，当两个跨域web应用之前需要传递消息，且不适用于url消息传递时，使用本库
可稳定可靠做到数据传递

原理是发送端向接收端多次重复发送消息，当接收端收到消息后，返回接收成功信息给发送端，保证
数据能成功投递

## 🎯 核心价值

- **解决痛点**: 跨域 Web 应用间复杂数据传递的可靠性问题
- **技术原理**: 基于确认机制的重试投递，确保消息 100% 送达
- **企业级**: 支持多种模块格式，适配各种开发环境

## ✨ 核心特性

| 特性 | 描述 | 优势 |
|------|------|------|
| 🔄 **可靠投递** | 基于确认机制的重试策略 | 确保消息 100% 送达 |
| 🌐 **跨域支持** | 完整的跨域窗口通信解决方案 | 突破同源策略限制 |
| 📦 **多格式支持** | UMD (AMD/CommonJS/IIFE) 和 ES Module | 适配各种开发环境 |
| 🛡️ **安全校验** | 来源窗口和域名白名单机制 | 防止恶意消息注入 |
| ⚡ **智能重试** | 可配置的重试间隔和超时策略 | 适应不同网络环境 |
| 🎯 **便捷API** | 一键打开窗口并发送消息 | 简化开发流程 |
| 🔍 **状态监控** | 实时检测目标窗口状态 | 及时处理异常情况 |
| 📱 **窗口关闭提醒** | 自动检测目标窗口关闭状态 | 避免无效重试 |

## 📦 快速开始

### 安装

```bash
# npm
npm install crossmessage-js

# yarn
yarn add crossmessage-js

# pnpm
pnpm add crossmessage-js
```

### CDN 引用

#### unpkg (推荐)

```html
<!-- UMD 版本 -->
<script src="https://unpkg.com/crossmessage-js@latest/crossmessage-js.js"></script>

<!-- ES Module 版本 -->
<script type="module">
  import { sendUntilAck, receiveOnce } from 'https://unpkg.com/crossmessage-js@latest/crossmessage-js.esm.js';
</script>

<!-- 指定版本 -->
<script src="https://unpkg.com/crossmessage-js@1.0.1/crossmessage-js.js"></script>
```

#### jsDelivr

```html
<!-- UMD 版本 -->
<script src="https://cdn.jsdelivr.net/npm/crossmessage-js@latest/crossmessage-js.js"></script>

<!-- ES Module 版本 -->
<script type="module">
  import { sendUntilAck, receiveOnce } from 'https://cdn.jsdelivr.net/npm/crossmessage-js@latest/crossmessage-js.esm.js';
</script>

<!-- 指定版本 -->
<script src="https://cdn.jsdelivr.net/npm/crossmessage-js@1.0.1/crossmessage-js.js"></script>
```

#### CDN 优势

- ⚡ **全球加速** - 就近访问，加载速度快
- 🔄 **自动更新** - 使用 `@latest` 自动获取最新版本
- 📦 **零配置** - 无需本地安装，直接引用
- 🛡️ **稳定可靠** - 专业CDN服务，高可用性

## 🚀 使用指南

### 基础用法

#### ES Module (推荐)

```javascript
import { sendUntilAck, receiveOnce, openAndSend } from 'crossmessage-js';

// 📤 发送消息 - 等待确认
const result = await sendUntilAck('user-data', { 
  name: '张三', 
  age: 25,
  preferences: { theme: 'dark', language: 'zh-CN' }
}, {
  interval: 1000,    // 重试间隔(ms)
  timeout: 5000,     // 超时时间(ms)
  targetOrigin: 'https://example.com'
});

// 📥 接收消息
const data = await receiveOnce('user-data', {
  allowedOrigins: ['https://example.com']
});

// 🚀 一键打开窗口并发送
const result = await openAndSend('https://example.com/page', 'init-data', { 
  theme: 'dark',
  userId: '12345'
});
```

### UMD / CommonJS

```javascript
const CrossMessage = require('crossmessage-js');

// 发送消息
CrossMessage.sendUntilAck('message-key', payload, options)
  .then(result => console.log('✅ 发送成功:', result))
  .catch(error => console.error('❌ 发送失败:', error));

// 接收消息
CrossMessage.receiveOnce('message-key', options)
  .then(data => console.log('📨 收到消息:', data));
```

#### 浏览器直接引用 (CDN)

```html
<!-- 使用 unpkg CDN -->
<script src="https://unpkg.com/crossmessage-js@latest/crossmessage-js.js"></script>
<script>
  // 发送消息
  CrossMessage.sendUntilAck('data', { message: 'Hello World' })
    .then(result => console.log('✅ 成功:', result));
  
  // 接收消息
  CrossMessage.receiveOnce('data')
    .then(data => console.log('📨 收到:', data));
</script>
```

#### ES Module CDN 引用

```html
<script type="module">
  import { sendUntilAck, receiveOnce } from 'https://unpkg.com/crossmessage-js@latest/crossmessage-js.esm.js';
  
  // 发送消息
  const result = await sendUntilAck('data', { message: 'Hello World' });
  console.log('✅ 成功:', result);
  
  // 接收消息
  const data = await receiveOnce('data');
  console.log('📨 收到:', data);
</script>
```

## 📖 API 文档

### `sendUntilAck(key, payload, options)`

> 📤 **发送消息直到收到确认回执**

发送消息到目标窗口，并持续重试直到收到确认回执，确保消息可靠送达。

**参数:**
- `key` `(string)` - 消息唯一标识符
- `payload` `(any)` - 要发送的数据
- `options` `(object)` - 配置选项
  - `interval` `(number)` - 重试间隔，默认 `1000ms`
  - `timeout` `(number)` - 超时时间，默认 `5000ms`
  - `targetWindow` `(Window)` - 目标窗口，默认自动检测
  - `targetWindowName` `(string)` - 目标窗口名称。设置后库内部通过 `window.open('', name)` 按名解析（跨标签页场景）
  - `targetOrigin` `(string)` - 目标域名，默认 `"*"`

**返回值:** `Promise<{key}>` - 成功时返回包含key的对象

**示例:**
```javascript
const result = await sendUntilAck('user-login', { 
  username: 'admin', 
  token: 'abc123' 
}, {
  interval: 500,
  timeout: 10000,
  targetOrigin: 'https://api.example.com'
});
```

### `receiveOnce(key, options)`

> 📥 **接收一次消息**

监听并接收指定key的消息，收到后自动停止监听。

**参数:**
- `key` `(string)` - 消息唯一标识符
- `options` `(object)` - 配置选项
  - `allowedOrigins` `(string[])` - 允许的来源域名，默认 `["*"]`
  - `expectedSourceWindow` `(Window)` - 期望的源窗口
  - `name` `(string | { value: string; deep?: boolean })` - 接收端页面窗口名设置
    - 传字符串：若当前页无 `window.name` 则设置（不覆盖已有值）
    - 传对象：`{ value, deep: true }` 强制覆盖 `window.name`

**返回值:** `Promise<any>` - 接收到的数据

**示例:**
```javascript
const data = await receiveOnce('user-login', {
  allowedOrigins: ['https://app.example.com'],
  expectedSourceWindow: window.opener
});
```

### `openAndSend(url, key, payload, options)`

> 🚀 **打开新窗口并发送消息**

打开新窗口并自动发送消息，是 `window.open` + `sendUntilAck` 的组合API。

**参数:**
- `url` `(string)` - 目标页面URL
- `key` `(string)` - 消息唯一标识符
- `payload` `(any)` - 要发送的数据
- `options` `(object)` - 配置选项
  - `windowFeatures` `(string)` - 窗口特性
  - 其他 `sendUntilAck` 的选项

**返回值:** `Promise<{key}>` - 发送结果

**示例:**
```javascript
const result = await openAndSend('/login', 'auth-config', {
  returnUrl: window.location.href,
  theme: 'dark'
}, {
  windowFeatures: 'width=400,height=600,scrollbars=yes'
});
```

## 🎯 实际应用场景

## 🧠 智能窗口解析（已更新）

解析顺序：

1. **显式 `targetWindow`**（最高优先级）
2. **显式 `targetWindowName`**：通过 `window.open('', name)` 按名解析（跨标签页）
3. **父/子窗口**：`window.opener` 或 `window.parent`（弹窗/iframe）
4. **否则抛错**：提示传 `targetWindow` 或 `targetWindowName`，并确保接收端设置了 `window.name`

### 跨标签页通信方式

以下三种方式三选一，均复用前文 API，不重复赘述：

1) 不使用 name，直接使用窗口句柄（通过跳转/引用拿到）

接收端（标签页B）：
```js
receiveOnce('user-sync', { allowedOrigins: ['https://app-a.example.com'] })
  .then(data => console.log('received:', data));
```

发送端（标签页A）：
```js
// 例如先跳转/打开B并保留引用
const b = window.open('/tab-b', '_blank');

await sendUntilAck('user-sync', { userId: 'u-1001' }, {
  targetWindow: b,
  targetOrigin: 'https://app-b.example.com',
  timeout: 8000
});
```

2) 最简方式：使用 `openAndSend`

```js
await openAndSend('https://app-b.example.com/tab-b', 'user-sync', { userId: 'u-1001' }, {
  windowFeatures: 'width=1200,height=800',
  timeout: 8000
});
```

3) 通过 name 按名寻址（独立标签页推荐）

接收端（标签页B）：
```html
<script src="/crossmessage.js"></script>
<script>
  // 一步到位：设置 window.name 并接收目标消息
  CrossMessage.receiveOnce('user-sync', {
    name: { value: 'account-center', deep: true },
    allowedOrigins: ['https://app-a.example.com']
  }).then(data => console.log('received:', data));
</script>
```

发送端（标签页A）：
```js
await sendUntilAck('user-sync', { userId: 'u-1001' }, {
  targetWindowName: 'account-center',
  targetOrigin: 'https://app-b.example.com',
  timeout: 8000
});
```

### 1. 企业级单点登录 (SSO)

```javascript
// 主应用 - 发起登录
const loginResult = await openAndSend('/sso/login', 'sso-config', {
  appId: 'main-app',
  returnUrl: window.location.href,
  theme: 'corporate'
}, {
  windowFeatures: 'width=500,height=700,scrollbars=no,resizable=no'
});

// SSO 页面 - 处理登录
const config = await receiveOnce('sso-config');
// 执行登录逻辑...
```

### 2. 微前端架构通信

```javascript
// 主应用 - 向子应用发送配置
const iframe = document.getElementById('micro-app');
await sendUntilAck('app-config', {
  userInfo: { id: '123', name: '张三' },
  permissions: ['read', 'write'],
  theme: 'dark'
}, {
  targetWindow: iframe.contentWindow,
  targetOrigin: 'https://micro-app.example.com'
});

// 子应用 - 接收配置
const config = await receiveOnce('app-config', {
  allowedOrigins: ['https://main-app.example.com']
});
```

### 3. 跨域数据同步

```javascript
// 应用A - 发送用户数据
await sendUntilAck('user-sync', {
  userId: '12345',
  profile: { name: '李四', email: 'lisi@example.com' },
  preferences: { language: 'zh-CN', timezone: 'Asia/Shanghai' }
}, {
  targetOrigin: 'https://app-b.example.com',
  interval: 2000,
  timeout: 15000
});

// 应用B - 接收并处理数据
const userData = await receiveOnce('user-sync', {
  allowedOrigins: ['https://app-a.example.com']
});
// 更新本地用户信息...
```

### 4. 弹窗表单提交

```javascript
// 主页面 - 打开编辑弹窗
const editResult = await openAndSend('/edit-form', 'form-data', {
  recordId: '123',
  initialData: { title: '原始标题', content: '原始内容' }
});

// 编辑页面 - 处理表单
const formData = await receiveOnce('form-data');
// 渲染表单...
// 用户编辑完成后，发送结果回主页面
```

## ⚠️ 重要注意事项

| 注意事项 | 说明 | 解决方案 |
|---------|------|---------|
| 🔒 **混合内容安全** | HTTPS 页面无法向 HTTP 页面发送消息 | 将目标页面升级为 HTTPS |
| 🚫 **弹窗拦截** | `openAndSend` 需要在用户交互事件中调用 | 在点击、触摸等事件中调用 |
| 🌐 **跨域限制** | 需要正确设置 `targetOrigin` 和 `allowedOrigins` | 明确指定允许的域名 |
| 🧹 **内存管理** | 库会自动清理超时和完成的连接 | 无需手动清理，但避免重复创建 |
| ⏱️ **超时处理** | 网络不稳定时可能超时 | 适当调整 `timeout` 和 `interval` 参数 |

## 🔧 最佳实践

### 1. 安全配置

```javascript
// ✅ 推荐：明确指定允许的域名
await sendUntilAck('data', payload, {
  targetOrigin: 'https://trusted-domain.com'
});

await receiveOnce('data', {
  allowedOrigins: ['https://trusted-domain.com']
});

// ❌ 避免：使用通配符 "*"
await sendUntilAck('data', payload, {
  targetOrigin: '*' // 不安全
});
```

### 2. 错误处理

```javascript
try {
  const result = await sendUntilAck('important-data', payload, {
    timeout: 10000,
    interval: 1000
  });
  console.log('✅ 消息发送成功:', result);
} catch (error) {
  console.error('❌ 消息发送失败:', error.message);
  // 处理失败情况
}
```

### 3. 弹窗登录

```javascript
// 打开登录窗口并发送配置
const result = await openAndSend('/login', 'login-config', {
  returnUrl: window.location.href,
  theme: 'dark'
});
console.log('登录完成');
```

## ⚠️ 注意事项

1. **混合内容安全**: HTTPS 页面无法向 HTTP 页面发送消息
2. **弹窗拦截**: `openAndSend` 需要在用户交互事件中调用
3. **跨域限制**: 需要正确设置 `targetOrigin` 和 `allowedOrigins`
4. **内存管理**: 库会自动清理超时和完成的连接

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

## 👨‍💻 作者

刘希航 <mateboy@foxmail.com>

---

<div align="center">

**⭐ 如果 CrossMessage 对您有帮助，请给我们一个星标！**

[![GitHub stars](https://img.shields.io/github/stars/mateboys/crossmessage-js.svg?style=social&label=Star)](https://github.com/mateboys/crossmessage-js/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mateboys/crossmessage-js.svg?style=social&label=Fork)](https://github.com/mateboys/crossmessage-js/network)

</div>