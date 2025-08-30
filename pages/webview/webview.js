Page({
  data: {
    url: '',
    title: '合同签署',
    loading: true,
    orderId: '',    // 存储订单ID
    signFlowId: ''  // 存储签署流程ID
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
    
    // 获取订单ID、签署ID和签署流程ID参数
    if (query.orderId) {
      this.setData({
        orderId: query.orderId
      });
    }

    if (query.signFlowId) {
      this.setData({
        signFlowId: query.signFlowId
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

  // 接收webview消息 - 基于esign-zfb-demo优化
  onWebViewMessage(message) {
    console.log('onWebViewMessage>>>>>', message);
    
    const {
      detail: {
        type,
        token,
        url,
        authFlowId,
        orderId,
      }
    } = message;

    switch (type) {
      case 'IDENTITY_ALI_FACE_AWAKE':
        // 拉起支付宝刷脸认证
        my.startAPVerify({
          url,
          certifyId: token,
          success: (res) => {
            console.log('支付宝刷脸认证成功:', res);
          },
          fail: (res) => {
            console.log('支付宝刷脸认证失败:', res);
            my.showToast({
              content: '身份认证失败，请重试',
              type: 'fail'
            });
          },
          complete: (res) => {
            console.log('支付宝刷脸认证完成:', res);
          }
        });
        break;
        
      case 'RN_DONE':
        // 实名认证完成
        console.log('实名认证完成');
        my.showToast({
          content: '实名认证完成',
          type: 'success'
        });
        break;
        
      case 'E_AUTH_FINISHED':
        // 授权认证完成
        console.log('授权认证完成');
        my.showToast({
          content: '授权认证完成',
          type: 'success'
        });
        break;
        
      case 'SIGN_SUCCESS':
        // 签署成功
        console.log('合同签署成功');
        this.handleSignSuccess();
        break;
        
      case 'SIGN_FAIL':
        // 签署失败
        console.log('合同签署失败');
        this.handleSignFail();
        break;
        
      case 'SEAL_EXAMINE':
        // 等待用印审批
        console.log('等待用印审批');
        my.showToast({
          content: '已提交用印申请，等待审批',
          type: 'none'
        });
        break;
        
      case 'REVOKE':
        // 签署流程撤销
        console.log('签署流程撤销');
        this.handleSignRevoke();
        break;
        
      case 'REFUSE':
        // 拒签
        console.log('用户拒签');
        this.handleSignRefuse();
        break;
        
      default:
        // 兼容旧的消息格式
        console.log('未知消息类型或旧格式消息:', type);
        this.handleLegacyMessage(message);
        break;
    }
  },

  // 处理签署成功
  handleSignSuccess() {
    my.showModal({
      title: '签署成功',
      content: '合同签署完成！即将跳转到订单页面',
      confirmText: '确定',
      showCancel: false,
      success: () => {
        // 返回到订单页面，并传递签署成功的信息
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2]; // 获取上一个页面
        
        if (prevPage && prevPage.route === 'pages/payment-status/payment-status') {
          // 如果上一页是payment-status，通知签署结果
          prevPage.handleEsignResult('success', { 
            orderId: this.data.orderId, 
            signFlowId: this.data.signFlowId
          });
        }
        // 返回上一页
        my.navigateBack();
      }
    });
  },

  // 处理签署失败
  handleSignFail() {
    my.showModal({
      title: '签署失败',
      content: '合同签署失败，请稍后重试或联系客服',
      confirmText: '重试',
      cancelText: '返回',
      success: (result) => {
        if (result.confirm) {
          // 重新加载页面
          this.setData({
            loading: true
          });
          // 可以考虑重新调用电子签接口或刷新当前页面
        } else {
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          
          if (prevPage && prevPage.route === 'pages/payment-status/payment-status') {
            prevPage.handleEsignResult('fail', {
              orderId: this.data.orderId,
              signFlowId: this.data.signFlowId
            });
          }
          
          my.navigateBack();
        }
      }
    });
  },

  // 处理签署撤销
  handleSignRevoke() {
    my.showModal({
      title: '签署撤销',
      content: '签署流程已被撤销',
      confirmText: '确定',
      showCancel: false,
      success: () => {
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        
        if (prevPage && prevPage.route === 'pages/payment-status/payment-status') {
          prevPage.handleEsignResult('revoke', {
            orderId: this.data.orderId,
            signFlowId: this.data.signFlowId
          });
        }
        
        my.navigateBack();
      }
    });
  },

  // 处理拒签
  handleSignRefuse() {
    my.showModal({
      title: '拒绝签署',
      content: '您已拒绝签署合同',
      confirmText: '确定',
      showCancel: false,
      success: () => {
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        
        if (prevPage && prevPage.route === 'pages/payment-status/payment-status') {
          prevPage.handleEsignResult('refuse', {
            orderId: this.data.orderId,
            signFlowId: this.data.signFlowId
          });
        }
        
        my.navigateBack();
      }
    });
  },

  // 处理旧版本的消息格式（兼容性）
  handleLegacyMessage(message) {
    const { data } = message.detail || {};
    
    if (data && data.type === 'esign_complete') {
      // 传递消息中的ID，如果没有则会在handleSignSuccess中使用页面参数的ID
      this.handleSignSuccess();
    } else if (data && data.type === 'esign_cancel') {
      this.handleSignRefuse();
    }
  }
});
