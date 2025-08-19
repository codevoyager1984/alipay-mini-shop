const config = require('../../config.js');

Page({
  data: {
    // 当前激活的标签页
    activeTab: 'intro',
    
    // 产品信息 - 默认值，实际会从API获取
    productInfo: {
      id: 2,
      name: '雅迪电动车',
      price: '2',
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ci8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iI2Y0NDMzNiIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI9MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRsMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
      rentalPeriod: 12,
      description: null
    },
    
    // 加载状态
    loading: false,
    
    // 订单确认弹窗状态
    showOrderConfirm: false,
    
    // 订单配置信息
    orderConfig: {
      rentalDays: 30,          // 租期：固定30天
      paymentMethod: '先用后付',  // 支付方式：固定先用后付
      supportedInstallments: 6, // 支持期数：从接口获取
      rentalPlan: '长租'        // 租赁方案：固定长租
    }
  },

  onLoad(query) {
    // 页面加载，获取传递的产品信息
    console.info(`Order page onLoad with query: ${JSON.stringify(query)}`);
    
    // 如果有传递productId，则根据id获取产品信息
    if (query.productId) {
      this.loadProductInfo(query.productId);
    }
    
    // 兼容旧的vehicleId参数
    if (query.vehicleId) {
      this.loadProductInfo(query.vehicleId);
    }
    
    // 如果直接传递了产品信息（JSON字符串）
    if (query.productInfo) {
      try {
        const productInfo = JSON.parse(decodeURIComponent(query.productInfo));
        this.setData({
          productInfo: productInfo
        });
      } catch (e) {
        console.error('解析产品信息失败:', e);
      }
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

  onTitleClick() {
    // 标题被点击
  },

  onPullDownRefresh() {
    // 页面被下拉
    setTimeout(() => {
      my.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    // 页面被拉到底部
  },

  onShareAppMessage() {
    // 返回自定义分享信息
    return {
      title: `租赁${this.data.productInfo.name}`,
      desc: `月租金仅¥${this.data.productInfo.price}`,
      path: `pages/order/order?productId=${this.data.productInfo.id}`,
    };
  },

  // 根据产品ID加载产品信息
  async loadProductInfo(productId) {
    try {
      this.setData({ loading: true });
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.products.detail}/${productId}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      
      if (response.data) {
        // 转换API数据格式以适配现有UI
        const productInfo = {
          id: response.data.id,
          name: response.data.name,
          price: response.data.monthly_price.toString(),
          image: response.data.cover_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ci8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iI2Y0NDMzNiIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRsMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
          rentalPeriod: response.data.rental_period,
          description: response.data.description
        };
        
        this.setData({
          productInfo: productInfo,
          // 从API获取支持期数，如果没有则使用默认值
          'orderConfig.supportedInstallments': response.data.supported_installments || 6
        });
      }
    } catch (error) {
      console.error('加载产品信息失败:', error);
      my.showToast({
        content: '加载产品信息失败，请稍后重试',
        type: 'fail'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      return userInfo.data && userInfo.data.isLogin;
    } catch (e) {
      console.error('检查登录状态失败:', e);
      return false;
    }
  },

  // 检查实名认证状态
  checkVerificationStatus() {
    try {
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      return userInfo.data && userInfo.data.isVerified;
    } catch (e) {
      console.error('检查实名认证状态失败:', e);
      return false;
    }
  },

  // 确认下单
  confirmOrder() {
    // 先检查登录状态
    if (!this.checkLoginStatus()) {
      my.showModal({
        title: '请先登录',
        content: '下单前需要先登录账户，点击确定跳转到个人页面完成登录。',
        confirmText: '去登录',
        cancelText: '取消',
        success: (result) => {
          if (result.confirm) {
            // 跳转到个人页面
            my.navigateTo({
              url: '/pages/profile/profile'
            });
          }
        }
      });
      return;
    }

    // 检查实名认证状态
    if (!this.checkVerificationStatus()) {
      my.showModal({
        title: '需要实名认证',
        content: '为了您的账户安全，下单前需要完成实名认证，点击确定前往认证页面。',
        confirmText: '去认证',
        cancelText: '取消',
        success: (result) => {
          if (result.confirm) {
            // 跳转到实名认证页面
            my.navigateTo({
              url: '/pages/auth/auth'
            });
          }
        }
      });
      return;
    }

    // 显示订单确认界面
    this.setData({
      showOrderConfirm: true
    });
  },

  // 关闭订单确认弹窗
  closeOrderConfirm() {
    this.setData({
      showOrderConfirm: false
    });
  },

  // 提交订单
  async submitOrder() {
    try {
      my.showLoading({
        content: '正在创建订单...'
      });

      // 获取用户信息
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      if (!userInfo.data || !userInfo.data.userId) {
        throw new Error('用户信息获取失败，请重新登录');
      }

      // 调用订单创建API
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.orders.create}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.data}`
          },
          data: {
            product_id: this.data.productInfo.id,
            remark: null
          },
          success: resolve,
          fail: reject
        });
      });

      my.hideLoading();

      if (response.statusCode === 200 && response.data) {
        // 订单创建成功，关闭确认弹窗
        this.setData({
          showOrderConfirm: false
        });

        // 跳转到支付页面
        my.navigateTo({
          url: `/pages/payment/payment?orderId=${response.data.id}&orderNo=${response.data.order_no}&amount=${response.data.total_amount}`
        });
      } else {
        throw new Error((response.data && response.data.message) ? response.data.message : '订单创建失败');
      }
    } catch (error) {
      my.hideLoading();
      console.error('创建订单失败:', error);
      
      my.showModal({
        title: '订单创建失败',
        content: error.message || '网络错误，请稍后重试',
        confirmText: '知道了',
        showCancel: false
      });
    }
  }
});