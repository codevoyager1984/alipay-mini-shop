const config = require('../../config.js');

Page({
  data: {
    // 订单信息
    orderId: null,
    orderNo: '',
    installmentNo: null,
    productName: '',
    amount: 0,
    
    // 支付状态
    paymentStatus: 'checking', // checking, success, failed, timeout
    statusText: '正在确认支付状态...',
    
    // 倒计时
    countdown: 600, // 10分钟 = 600秒
    countdownText: '',
    
    // 轮询相关
    pollingCount: 0,
    maxPollingCount: 600, // 最多轮询600次（10分钟）
    isTimeout: false, // 是否已超时
    
    // 加载状态
    loading: true
  },

  // 将定时器存储在页面实例上，而不是data中
  pollingTimer: null,
  countdownTimer: null,

  onLoad(query) {
    console.log('Payment status page onLoad with query:', query);
    
    // 获取订单参数
    if (query.orderId && query.orderNo && query.installmentNo) {
      this.setData({
        orderId: parseInt(query.orderId),
        orderNo: query.orderNo,
        installmentNo: parseInt(query.installmentNo),
        productName: query.productName || '商品',
        amount: parseFloat(query.amount) || 0
      });
      
      // 开始轮询支付状态
      this.startStatusPolling();
      
      // 开始倒计时
      this.startCountdown();
    } else {
      my.showModal({
        title: '参数错误',
        content: '订单信息获取失败，缺少必要参数（orderId、orderNo、installmentNo），请重新支付',
        confirmText: '知道了',
        showCancel: false,
        success: () => {
          my.navigateBack();
        }
      });
    }
  },

  onUnload() {
    // 清理定时器
    this.clearTimers();
  },

  onHide() {
    // 页面隐藏时也清理定时器
    this.clearTimers();
  },

  onShow() {
    console.log('页面显示，当前状态:', this.data.paymentStatus);
    // 页面显示时如果还在检查状态，重新开始轮询
    if (this.data.paymentStatus === 'checking' && !this.pollingTimer) {
      console.log('重新开始轮询和倒计时');
      this.startStatusPolling();
      this.startCountdown();
    }
  },

  // 开始轮询支付状态
  startStatusPolling() {
    console.log('开始轮询支付状态...');
    
    // 清理之前的定时器
    this.clearPollingTimer();
    
    // 立即检查一次
    this.checkPaymentStatus();
    
    // 设置轮询定时器
    this.pollingTimer = setInterval(() => {
      console.log('轮询检查支付状态，次数:', this.data.pollingCount);
      this.checkPaymentStatus();
    }, 2000); // 改为每2秒轮询一次，减少服务器压力
    
    console.log('轮询定时器已设置，ID:', this.pollingTimer);
  },

  // 检查支付状态
  async checkPaymentStatus() {
    try {
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.payment.status}/${this.data.orderId}/${this.data.installmentNo}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.data}`
          },
          success: resolve,
          fail: reject
        });
      });

      this.setData({
        pollingCount: this.data.pollingCount + 1
      });

      console.log('支付状态查询结果:', response.data);

      if (response.statusCode === 200 && response.data) {
        const { is_paid } = response.data;
        
        if (is_paid === true) {
          // 支付成功
          this.handlePaymentSuccess();
        } else if (is_paid === false) {
          // 继续等未开始完成
          this.setData({
            statusText: '支付确认中，请稍候...'
          });
        }
        // 注意：新接口似乎只返回 is_paid 布尔值，不再有明确的失败状态
        // 如果需要处理支付失败的情况，可能需要结合超时逻辑或其他机制
      }
    } catch (error) {
      console.error('查询支付状态失败:', error);
      // 网络错误不立即失败，继续重试
      this.setData({
        statusText: '网络不稳定，正在重试...'
      });
    }
  },

  // 开始倒计时
  startCountdown() {
    console.log('开始倒计时...');
    
    // 清理之前的倒计时定时器
    this.clearCountdownTimer();
    
    this.updateCountdownText();
    
    this.countdownTimer = setInterval(() => {
      const newCountdown = this.data.countdown - 1;
      this.setData({ countdown: newCountdown });
      
      if (newCountdown <= 0) {
        this.handleCountdownEnd();
      } else {
        this.updateCountdownText();
      }
    }, 1000);
    
    console.log('倒计时定时器已设置，ID:', this.countdownTimer);
  },

  // 更新倒计时文本
  updateCountdownText() {
    const countdown = this.data.countdown;
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    const timeText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
    
    this.setData({
      countdownText: `请不要关闭此页面，正在确认支付状态... ${timeText}`
    });
  },

  // 倒计时结束处理
  handleCountdownEnd() {
    // 倒计时结束，标记为超时，但不清理轮询定时器
    if (this.data.paymentStatus === 'checking') {
      this.setData({
        paymentStatus: 'timeout',
        statusText: '支付状态确认已超时，但仍在后台检查中...',
        isTimeout: true,
        loading: false,
        countdownText: '已超时，您可以手动重试或继续等待'
      });
    }
  },

  // 轮询超时处理（现在不会被调用，因为不停止轮询）
  handlePollingTimeout() {
    // 这个方法现在主要用于手动重试时重置状态
    this.setData({
      paymentStatus: 'timeout',
      statusText: '支付状态确认超时',
      isTimeout: true,
      loading: false,
      countdownText: '已超时，您可以手动重试或继续等待'
    });
  },

  // 支付成功处理
  handlePaymentSuccess() {
    this.clearTimers();
    
    this.setData({
      paymentStatus: 'success',
      statusText: '支付成功！',
      loading: false,
      countdownText: '支付确认完成',
      isTimeout: false
    });
  },

  // 支付失败处理
  handlePaymentFailed() {
    this.clearTimers();
    
    this.setData({
      paymentStatus: 'failed',
      statusText: '支付失败',
      loading: false,
      countdownText: '支付确认完成',
      isTimeout: false
    });

    my.showModal({
      title: '支付失败',
      content: '支付未成功，您可以重新尝试支付',
      confirmText: '重新支付',
      cancelText: '返回订单',
      success: (result) => {
        if (result.confirm) {
          // 返回支付页面重新支付
          my.navigateTo({
            url: `/pages/payment/payment?orderId=${this.data.orderId}&orderNo=${this.data.orderNo}&installmentNo=${this.data.installmentNo}&amount=${this.data.amount}`
          });
        } else {
          my.reLaunch({
            url: '/pages/orders/orders'
          });
        }
      }
    });
  },

  // 清理定时器
  clearTimers() {
    this.clearPollingTimer();
    this.clearCountdownTimer();
  },

  // 清理轮询定时器
  clearPollingTimer() {
    if (this.pollingTimer) {
      console.log('清理轮询定时器，ID:', this.pollingTimer);
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  },

  // 清理倒计时定时器
  clearCountdownTimer() {
    if (this.countdownTimer) {
      console.log('清理倒计时定时器，ID:', this.countdownTimer);
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  },

  // 手动刷新状态
  refreshStatus() {
    console.log('手动刷新状态');
    if (this.data.paymentStatus !== 'checking') {
      this.setData({
        paymentStatus: 'checking',
        statusText: '正在确认支付状态...',
        loading: true,
        countdown: 600, // 重新开始10分钟倒计时
        pollingCount: 0,
        isTimeout: false
      });
      
      // 如果轮询已停止，重新开始
      if (!this.pollingTimer) {
        this.startStatusPolling();
      }
      this.startCountdown();
    }
  },

  // 手动重试（用于超时后的重试）
  manualRetry() {
    my.showLoading({ content: '重新检查支付状态...' });
    
    // 立即检查一次状态
    this.checkPaymentStatus().then(() => {
      my.hideLoading();
      
      // 如果仍然是超时状态，提示用户
      if (this.data.paymentStatus === 'timeout') {
        my.showToast({
          content: '仍在检查中，请稍候...',
          type: 'none'
        });
      }
    }).catch(() => {
      my.hideLoading();
      my.showToast({
        content: '网络错误，请稍后重试',
        type: 'fail'
      });
    });
  },

  // 返回订单列表
  goToOrders() {
    my.reLaunch({
      url: '/pages/orders/orders'
    });
  },

  // 返回首页
  goToHome() {
    my.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 联系客服
  contactService() {
    my.makePhoneCall({
      number: '400-123-4567',
      success: () => {
        console.log('拨打客服电话成功');
      },
      fail: (error) => {
        console.error('拨打客服电话失败', error);
        my.showToast({
          content: '拨打电话失败',
          type: 'fail'
        });
      }
    });
  }
});
