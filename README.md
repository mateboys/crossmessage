# CrossMessage

<div align="right">

[![English](https://img.shields.io/badge/English-blue)](README.md) [![中文](https://img.shields.io/badge/中文-red)](README.zh-CN.md)

</div>

[![npm version](https://badge.fury.io/js/crossmessage.svg)](https://badge.fury.io/js/crossmessage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/mateboys/crosspost.svg)](https://github.com/mateboys/crosspost/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/mateboys/crosspost.svg)](https://github.com/mateboys/crosspost/issues)


CrossMessage is a cross-domain window communication library based on `postMessage`, designed to solve reliable data transmission between cross-domain web applications. When traditional URL parameter passing methods cannot meet complex data exchange requirements, CrossMessage provides a stable, secure, and easy-to-use solution.

Its main purpose is to enable stable and reliable data transmission between two cross-domain web applications when URL message passing is not suitable. The principle is that the sender repeatedly sends messages to the receiver, and when the receiver receives the message, it returns a success confirmation to the sender, ensuring successful data delivery.

## 🎯 Core Value

- **Pain Point Solution**: Reliability issues in complex data transmission between cross-domain web applications
- **Technical Principle**: Retry delivery based on acknowledgment mechanism, ensuring 100% message delivery
- **Enterprise-Grade**: Supports multiple module formats, adapting to various development environments

## ✨ Core Features

| Feature | Description | Advantage |
|---------|-------------|-----------|
| 🔄 **Reliable Delivery** | Retry strategy based on acknowledgment mechanism | Ensures 100% message delivery |
| 🌐 **Cross-Domain Support** | Complete cross-domain window communication solution | Breaks through same-origin policy restrictions |
| 📦 **Multi-Format Support** | UMD (AMD/CommonJS/IIFE) and ES Module | Adapts to various development environments |
| 🛡️ **Security Validation** | Source window and domain whitelist mechanism | Prevents malicious message injection |
| ⚡ **Smart Retry** | Configurable retry interval and timeout strategy | Adapts to different network environments |
| 🎯 **Convenient API** | One-click window opening and message sending | Simplifies development process |
| 🔍 **Status Monitoring** | Real-time target window status detection | Handles exceptions promptly |
| 📱 **Window Close Alert** | Automatic detection of target window close status | Avoids invalid retries |

## 📦 Quick Start

### Installation

```bash
# npm
npm install crossmessage

# yarn
yarn add crossmessage

# pnpm
pnpm add crossmessage
```

### CDN Reference

#### unpkg (Recommended)

```html
<!-- UMD Version -->
<script src="https://unpkg.com/crossmessage@latest/crosspost.js"></script>

<!-- ES Module Version -->
<script type="module">
  import { sendUntilAck, receiveOnce } from 'https://unpkg.com/crossmessage@latest/crosspost.esm.js';
</script>

<!-- Specific Version -->
<script src="https://unpkg.com/crossmessage@1.0.1/crosspost.js"></script>
```

#### jsDelivr

```html
<!-- UMD Version -->
<script src="https://cdn.jsdelivr.net/npm/crossmessage@latest/crosspost.js"></script>

<!-- ES Module Version -->
<script type="module">
  import { sendUntilAck, receiveOnce } from 'https://cdn.jsdelivr.net/npm/crossmessage@latest/crosspost.esm.js';
</script>

<!-- Specific Version -->
<script src="https://cdn.jsdelivr.net/npm/crossmessage@1.0.1/crosspost.js"></script>
```

#### CDN Advantages

- ⚡ **Global Acceleration** - Nearby access, fast loading speed
- 🔄 **Auto Update** - Use `@latest` to automatically get the latest version
- 📦 **Zero Configuration** - No local installation required, direct reference
- 🛡️ **Stable & Reliable** - Professional CDN service, high availability

## 🚀 Usage Guide

### Basic Usage

#### ES Module (Recommended)

```javascript
import { sendUntilAck, receiveOnce, openAndSend } from 'crossmessage';

// 📤 Send message - wait for acknowledgment
const result = await sendUntilAck('user-data', { 
  name: 'John', 
  age: 25,
  preferences: { theme: 'dark', language: 'en-US' }
}, {
  interval: 1000,    // Retry interval (ms)
  timeout: 5000,     // Timeout (ms)
  targetOrigin: 'https://example.com'
});

// 📥 Receive message
const data = await receiveOnce('user-data', {
  allowedOrigins: ['https://example.com']
});

// 🚀 One-click open window and send
const result = await openAndSend('https://example.com/page', 'init-data', { 
  theme: 'dark',
  userId: '12345'
});
```

#### UMD / CommonJS

```javascript
const CrossMessage = require('crossmessage');

// Send message
CrossMessage.sendUntilAck('message-key', payload, options)
  .then(result => console.log('✅ Send success:', result))
  .catch(error => console.error('❌ Send failed:', error));

// Receive message
CrossMessage.receiveOnce('message-key', options)
  .then(data => console.log('📨 Message received:', data));
```

#### Browser Direct Reference (CDN)

```html
<!-- Using unpkg CDN -->
<script src="https://unpkg.com/crossmessage@latest/crosspost.js"></script>
<script>
  // Send message
  CrossMessage.sendUntilAck('data', { message: 'Hello World' })
    .then(result => console.log('✅ Success:', result));
  
  // Receive message
  CrossMessage.receiveOnce('data')
    .then(data => console.log('📨 Received:', data));
</script>
```

#### ES Module CDN Reference

```html
<script type="module">
  import { sendUntilAck, receiveOnce } from 'https://unpkg.com/crossmessage@latest/crosspost.esm.js';
  
  // Send message
  const result = await sendUntilAck('data', { message: 'Hello World' });
  console.log('✅ Success:', result);
  
  // Receive message
  const data = await receiveOnce('data');
  console.log('📨 Received:', data);
</script>
```

## 📖 API Documentation

### `sendUntilAck(key, payload, options)`

> 📤 **Send message until acknowledgment is received**

Sends a message to the target window and continuously retries until acknowledgment is received, ensuring reliable delivery.

**Parameters:**
- `key` `(string)` - Unique message identifier
- `payload` `(any)` - Data to send
- `options` `(object)` - Configuration options
  - `interval` `(number)` - Retry interval, default `1000ms`
  - `timeout` `(number)` - Timeout, default `5000ms`
  - `targetWindow` `(Window)` - Target window, auto-detected by default
  - `targetOrigin` `(string)` - Target domain, default `"*"`

**Returns:** `Promise<{key}>` - Returns object containing key on success

**Example:**
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

> 📥 **Receive a message once**

Listens for and receives a message with the specified key, automatically stops listening after receipt.

**Parameters:**
- `key` `(string)` - Unique message identifier
- `options` `(object)` - Configuration options
  - `allowedOrigins` `(string[])` - Allowed source domains, default `["*"]`
  - `expectedSourceWindow` `(Window)` - Expected source window

**Returns:** `Promise<any>` - Received data

**Example:**
```javascript
const data = await receiveOnce('user-login', {
  allowedOrigins: ['https://app.example.com'],
  expectedSourceWindow: window.opener
});
```

### `openAndSend(url, key, payload, options)`

> 🚀 **Open new window and send message**

Opens a new window and automatically sends a message, combining `window.open` + `sendUntilAck` APIs.

**Parameters:**
- `url` `(string)` - Target page URL
- `key` `(string)` - Unique message identifier
- `payload` `(any)` - Data to send
- `options` `(object)` - Configuration options
  - `windowFeatures` `(string)` - Window features
  - Other `sendUntilAck` options

**Returns:** `Promise<{key}>` - Send result

**Example:**
```javascript
const result = await openAndSend('/login', 'auth-config', {
  returnUrl: window.location.href,
  theme: 'dark'
}, {
  windowFeatures: 'width=400,height=600,scrollbars=yes'
});
```

## 🎯 Real-World Application Scenarios

### 1. Enterprise Single Sign-On (SSO)

```javascript
// Main app - initiate login
const loginResult = await openAndSend('/sso/login', 'sso-config', {
  appId: 'main-app',
  returnUrl: window.location.href,
  theme: 'corporate'
}, {
  windowFeatures: 'width=500,height=700,scrollbars=no,resizable=no'
});

// SSO page - handle login
const config = await receiveOnce('sso-config');
// Execute login logic...
```

### 2. Micro-Frontend Architecture Communication

```javascript
// Main app - send config to sub-app
const iframe = document.getElementById('micro-app');
await sendUntilAck('app-config', {
  userInfo: { id: '123', name: 'John' },
  permissions: ['read', 'write'],
  theme: 'dark'
}, {
  targetWindow: iframe.contentWindow,
  targetOrigin: 'https://micro-app.example.com'
});

// Sub-app - receive config
const config = await receiveOnce('app-config', {
  allowedOrigins: ['https://main-app.example.com']
});
```

### 3. Cross-Domain Data Synchronization

```javascript
// App A - send user data
await sendUntilAck('user-sync', {
  userId: '12345',
  profile: { name: 'Jane', email: 'jane@example.com' },
  preferences: { language: 'en-US', timezone: 'America/New_York' }
}, {
  targetOrigin: 'https://app-b.example.com',
  interval: 2000,
  timeout: 15000
});

// App B - receive and process data
const userData = await receiveOnce('user-sync', {
  allowedOrigins: ['https://app-a.example.com']
});
// Update local user info...
```

### 4. Popup Form Submission

```javascript
// Main page - open edit popup
const editResult = await openAndSend('/edit-form', 'form-data', {
  recordId: '123',
  initialData: { title: 'Original Title', content: 'Original Content' }
});

// Edit page - handle form
const formData = await receiveOnce('form-data');
// Render form...
// After user editing, send result back to main page
```

## ⚠️ Important Notes

| Note | Description | Solution |
|------|-------------|----------|
| 🔒 **Mixed Content Security** | HTTPS pages cannot send messages to HTTP pages | Upgrade target page to HTTPS |
| 🚫 **Popup Blocker** | `openAndSend` must be called in user interaction events | Call in click, touch, etc. events |
| 🌐 **Cross-Domain Restrictions** | Must correctly set `targetOrigin` and `allowedOrigins` | Explicitly specify allowed domains |
| 🧹 **Memory Management** | Library automatically cleans up timed-out and completed connections | No manual cleanup needed, but avoid duplicate creation |
| ⏱️ **Timeout Handling** | May timeout when network is unstable | Appropriately adjust `timeout` and `interval` parameters |

## 🔧 Best Practices

### 1. Security Configuration

```javascript
// ✅ Recommended: explicitly specify allowed domains
await sendUntilAck('data', payload, {
  targetOrigin: 'https://trusted-domain.com'
});

await receiveOnce('data', {
  allowedOrigins: ['https://trusted-domain.com']
});

// ❌ Avoid: using wildcard "*"
await sendUntilAck('data', payload, {
  targetOrigin: '*' // Insecure
});
```

### 2. Error Handling

```javascript
try {
  const result = await sendUntilAck('important-data', payload, {
    timeout: 10000,
    interval: 1000
  });
  console.log('✅ Message sent successfully:', result);
} catch (error) {
  console.error('❌ Message send failed:', error.message);
  // Handle failure case
}
```

### 3. Performance Optimization

```javascript
// Adjust parameters based on network environment
const isSlowNetwork = navigator.connection?.effectiveType === 'slow-2g';

await sendUntilAck('data', payload, {
  interval: isSlowNetwork ? 2000 : 1000,
  timeout: isSlowNetwork ? 15000 : 5000
});
```

## 🤝 Contributing

We welcome all forms of contributions! Whether reporting issues, suggesting features, or submitting code, all help make CrossMessage better.

### Ways to Contribute

- 🐛 **Report Bugs**: Report issues in [Issues](https://github.com/mateboys/crosspost/issues)
- 💡 **Feature Suggestions**: Propose new features or improvements
- 📝 **Documentation Improvements**: Improve documentation and examples
- 🔧 **Code Contributions**: Submit Pull Requests

### Development Guide

1. Fork this repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Create Pull Request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👨‍💻 Author

**Liu Xihang** - *Core Developer*  
📧 Email: mateboy@foxmail.com
🐙 GitHub: [@mateboys](https://github.com/mateboys)

<div align="center">

**⭐ If CrossMessage helps you, please give us a star!**

[![GitHub stars](https://img.shields.io/github/stars/mateboys/crosspost.svg?style=social&label=Star)](https://github.com/mateboys/crosspost/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mateboys/crosspost.svg?style=social&label=Fork)](https://github.com/mateboys/crosspost/network)

</div>