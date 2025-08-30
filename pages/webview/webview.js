const config = require('../../config.js');

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
  async handleSignSuccess() {
    // 如果没有signFlowId，无法查询状态，直接跳转
    if (!this.data.signFlowId) {
      console.error('缺少signFlowId，无法查询电子签状态');
      this.goToOrdersWithMessage('合同签署完成！');
      return;
    }
    
    // 显示加载状态
    my.showLoading({
      content: '正在确认签署状态...'
    });
    
    try {
      // 调用电子签状态查询接口
      const statusResult = await this.checkEsignStatus(this.data.signFlowId);
      
      my.hideLoading();
      
      if (statusResult.success) {
        // 签署成功
        this.handleEsignSuccess();
      } else {
        // 签署失败
        this.handleEsignFailure();
      }
    } catch (error) {
      my.hideLoading();
      console.error('查询电子签状态失败:', error);
      this.handleEsignError('查询签署状态失败，请稍后重试');
    }
  },

  // 处理签署失败
  handleSignFail() {
    my.showModal({
      title: '签署失败',
      content: '合同签署失败，请稍后重试或联系客服',
      confirmText: '返回订单',
      showCancel: false,
      success: () => {
        this.goToOrders();
      }
    });
  },

  // 处理签署撤销
  handleSignRevoke() {
    my.showModal({
      title: '签署撤销',
      content: '签署流程已被撤销',
      confirmText: '返回订单',
      showCancel: false,
      success: () => {
        this.goToOrders();
      }
    });
  },

  // 处理拒签
  handleSignRefuse() {
    my.showModal({
      title: '拒绝签署',
      content: '您已拒绝签署合同',
      confirmText: '返回订单',
      showCancel: false,
      success: () => {
        this.goToOrders();
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
  },

  // 查询电子签状态
  async checkEsignStatus(signFlowId) {
    const tokenResult = my.getStorageSync({ key: 'access_token' });
    if (!tokenResult.data) {
      throw new Error('登录状态失效');
    }
    
    return new Promise((resolve, reject) => {
      my.request({
        url: `${config.api.baseUrl}${config.api.endpoints.esign.status}/${signFlowId}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${tokenResult.data}`
        },
        success: (response) => {
          console.log('电子签状态查询结果:', response);
          
          if (response.statusCode === 200 && response.data) {
            resolve(response.data);
          } else {
            reject(new Error('接口返回异常'));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  },
  
  // 处理签署成功
  handleEsignSuccess() {
    my.showModal({
      title: '签署成功',
      content: '合同签署完成！即将跳转到订单页面',
      confirmText: '确定',
      showCancel: false,
      success: () => {
        this.goToOrders();
      }
    });
  },
  
  // 处理签署失败
  handleEsignFailure() {
    my.showModal({
      title: '签署失败',
      content: '合同签署失败，请稍后重试或联系客服',
      confirmText: '返回订单',
      showCancel: false,
      success: () => {
        this.goToOrders();
      }
    });
  },
  
  // 处理签署错误
  handleEsignError(errorMessage) {
    my.showModal({
      title: '状态确认失败',
      content: errorMessage || '无法确认签署状态，请稍后重试或联系客服',
      confirmText: '返回订单',
      showCancel: false,
      success: () => {
        this.goToOrders();
      }
    });
  },

  // 跳转到订单页面
  goToOrders() {
    my.reLaunch({
      url: '/pages/orders/orders'
    });
  },

  // 带消息跳转到订单页面
  goToOrdersWithMessage(message) {
    my.showToast({
      content: message,
      type: 'success'
    });
    
    setTimeout(() => {
      this.goToOrders();
    }, 1500);
  }
});
