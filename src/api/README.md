# 登录 API 接口文档

## 接口说明

这个文档用于记录 BetterKuGou 登录功能所需的 API 接口。请在此处添加酷狗音乐的 API 接口信息。

## 需要实现的接口

### 1. 手机号登录

#### 1.1 发送验证码
**接口位置**: `LoginView.vue` -> `sendCaptcha()` 方法

**需要实现**:
- 接口地址: 待填写
- 请求方式: 待填写
- 请求参数:
  ```javascript
  {
    phone: '手机号'
  }
  ```
- 返回数据:
  ```javascript
  {
    code: 200,
    message: '验证码已发送',
    data: {}
  }
  ```

#### 1.2 手机号登录
**接口位置**: `LoginView.vue` -> `handlePhoneLogin()` 方法

**需要实现**:
- 接口地址: 待填写
- 请求方式: 待填写
- 请求参数:
  ```javascript
  {
    phone: '手机号',
    captcha: '验证码'
  }
  ```
- 返回数据:
  ```javascript
  {
    code: 200,
    message: '登录成功',
    data: {
      token: '登录凭证',
      userInfo: {
        id: '用户ID',
        nickname: '用户昵称',
        avatar: '头像URL'
      }
    }
  }
  ```

---

### 2. 账号登录

**接口位置**: `LoginView.vue` -> `handleAccountLogin()` 方法

**需要实现**:
- 接口地址: 待填写
- 请求方式: 待填写
- 请求参数:
  ```javascript
  {
    username: '账号/邮箱',
    password: '密码'
  }
  ```
- 返回数据:
  ```javascript
  {
    code: 200,
    message: '登录成功',
    data: {
      token: '登录凭证',
      userInfo: {
        id: '用户ID',
        nickname: '用户昵称',
        avatar: '头像URL'
      }
    }
  }
  ```

---

### 3. 扫码登录

#### 3.1 生成二维码
**接口位置**: `LoginView.vue` -> `generateQRCode()` 方法

**需要实现**:
- 接口地址: 待填写
- 请求方式: 待填写
- 请求参数: 无
- 返回数据:
  ```javascript
  {
    code: 200,
    message: '二维码生成成功',
    data: {
      qrcodeUrl: '二维码图片URL',
      qrcodeKey: '二维码唯一标识'
    }
  }
  ```

#### 3.2 检查扫码状态
**接口位置**: `LoginView.vue` -> `checkQRCodeStatus()` 方法

**需要实现**:
- 接口地址: 待填写
- 请求方式: 待填写
- 请求参数:
  ```javascript
  {
    qrcodeKey: '二维码唯一标识'
  }
  ```
- 返回数据:
  ```javascript
  {
    code: 200,
    message: '扫码状态',
    data: {
      status: 0, // 0-未扫码, 1-已扫码待确认, 2-已确认登录, 3-已取消, 4-已过期
      token: '登录凭证（status=2时返回）',
      userInfo: {  // status=2时返回
        id: '用户ID',
        nickname: '用户昵称',
        avatar: '头像URL'
      }
    }
  }
  ```

**轮询建议**:
- 间隔时间: 2-3秒
- 超时时间: 300秒（5分钟）
- 过期后需重新生成二维码

---

## 使用说明

### 如何集成 API

1. 在项目中创建 API 请求模块 (推荐位置: `src/api/`)
   ```javascript
   // src/api/auth.js
   export const loginByPhone = (phone, captcha) => {
     // 实现 API 调用
   }
   
   export const loginByAccount = (username, password) => {
     // 实现 API 调用
   }
   
   export const generateQRCode = () => {
     // 实现 API 调用
   }
   
   export const checkQRCodeStatus = (qrcodeKey) => {
     // 实现 API 调用
   }
   ```

2. 在 `LoginView.vue` 中导入并使用
   ```javascript
   import { loginByPhone, loginByAccount, generateQRCode } from '@/api/auth'
   
   // 在对应的方法中调用
   async handlePhoneLogin() {
     try {
       const res = await loginByPhone(this.phoneForm.phone, this.phoneForm.captcha)
       // 处理登录成功
     } catch (error) {
       // 处理错误
     }
   }
   ```

### 需要添加的依赖

如果需要发送 HTTP 请求，建议安装 axios:
```bash
npm install axios
```

### Token 存储

登录成功后，建议将 token 存储在:
- localStorage (持久化存储)
- sessionStorage (会话存储)
- Vuex/Pinia (状态管理)

示例:
```javascript
// 保存 token
localStorage.setItem('kugou_token', token)

// 保存用户信息
localStorage.setItem('kugou_user', JSON.stringify(userInfo))
```

---

## 下一步工作

1. ✅ 登录界面 UI 已完成
2. ⏳ 等待 API 接口信息
3. ⏳ 实现 API 调用逻辑
4. ⏳ 添加错误处理和用户提示
5. ⏳ 实现登录状态管理
6. ⏳ 实现自动登录功能

---

## 文件位置

- 登录组件: `src/components/LoginView.vue`
- 标题栏组件: `src/components/TitleBar.vue`
- 主应用: `src/App.vue`
- API 文档: `src/api/README.md` (本文件)

---

## 注意事项

1. 所有 API 调用都应该添加错误处理
2. 敏感信息（如密码）应该加密传输
3. Token 应该在每次请求时添加到请求头
4. 登录状态应该持久化保存
5. 二维码扫码应该实现轮询检查状态
6. 验证码倒计时应该正确处理

---

## 测试账号

请在此处添加测试账号信息（如果有）:
- 手机号: 
- 验证码: 
- 账号: 
- 密码: 
