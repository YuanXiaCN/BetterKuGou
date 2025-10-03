/**
 * 全局右键菜单管理器
 * 确保同一时间只有一个右键菜单处于打开状态
 */

class ContextMenuManager {
  constructor() {
    this.activeMenuCloser = null
  }

  /**
   * 注册一个新的菜单
   * @param {Function} closeCallback - 关闭菜单的回调函数
   */
  registerMenu(closeCallback) {
    // 关闭之前打开的菜单
    if (this.activeMenuCloser && this.activeMenuCloser !== closeCallback) {
      this.activeMenuCloser()
    }
    // 设置新的活动菜单
    this.activeMenuCloser = closeCallback
  }

  /**
   * 取消注册菜单
   * @param {Function} closeCallback - 要取消的关闭回调函数
   */
  unregisterMenu(closeCallback) {
    if (this.activeMenuCloser === closeCallback) {
      this.activeMenuCloser = null
    }
  }

  /**
   * 关闭当前活动的菜单
   */
  closeActiveMenu() {
    if (this.activeMenuCloser) {
      this.activeMenuCloser()
      this.activeMenuCloser = null
    }
  }
}

// 导出单例
export default new ContextMenuManager()
