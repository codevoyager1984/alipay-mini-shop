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
      image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ci8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iI2Y0NDMzNiIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRsMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
      rentalPeriod: 12,
      description: null
    },
    
    // 加载状态
    loading: false
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
          productInfo: productInfo
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

    my.showLoading({
      content: '正在处理订单...'
    });

    // 模拟网络请求
    setTimeout(() => {
      my.hideLoading();
      
      my.showModal({
        title: '下单成功',
        content: `您已成功租赁 ${this.data.productInfo.name}，月租金 ¥${this.data.productInfo.price}。我们将尽快与您联系确认订单详情。`,
        confirmText: '知道了',
        showCancel: false,
        success: (result) => {
          if (result.confirm) {
            // 返回首页
            my.reLaunch({
              url: '/pages/index/index'
            });
          }
        }
      });
    }, 2000);
  }
});