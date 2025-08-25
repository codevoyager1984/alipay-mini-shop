Page({
  data: {
    url: '',
    title: '合同签署',
    loading: true
  },

  onLoad(query) {
    console.info(`Webview page onLoad with query: ${JSON.stringify(query)}`);
    
    // 获取URL和标题参数
    if (query.url) {
      this.setData({
        url: decodeURIComponent(query.url)
      });
    }
    
    if (query.title) {
      this.setData({
        title: decodeURIComponent(query.title)
      });
      
      // 设置页面标题
      my.setNavigationBar({
        title: decodeURIComponent(query.title)
      });
    }
  },

  onReady() {
    // 页面加载完成
  },

  onShow() {
    // 页面显示
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面被关闭
  },

  // webview加载完成
  onWebViewLoad(e) {
    console.log('webview加载完成:', e);
    this.setData({
      loading: false
    });
  },

  // webview加载错误
  onWebViewError(e) {
    console.error('webview加载错误:', e);
    this.setData({
      loading: false
    });
    
    my.showModal({
      title: '页面加载失败',
      content: '合同页面加载失败，请检查网络连接或稍后重试',
      confirmText: '重试',
      cancelText: '返回',
      success: (result) => {
        if (result.confirm) {
          // 重新加载
          this.setData({
            loading: true
          });
        } else {
          // 返回上一页
          my.navigateBack();
        }
      }
    });
  },

  // 接收webview消息
  onWebViewMessage(e) {
    console.log('收到webview消息:', e);
    
    // 处理来自webview的消息
    const { data } = e.detail;
    
    if (data && data.type === 'esign_complete') {
      // 电子签完成
      my.showToast({
        content: '合同签署完成！',
        type: 'success'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        my.navigateBack();
      }, 2000);
    } else if (data && data.type === 'esign_cancel') {
      // 用户取消签署
      my.showModal({
        title: '签署取消',
        content: '您已取消合同签署，是否返回订单页面？',
        confirmText: '返回',
        showCancel: false,
        success: () => {
          my.navigateBack();
        }
      });
    }
  }
});
