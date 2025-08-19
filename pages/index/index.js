const config = require('../../config.js');

Page({
  data: {
    // Logo 图片路径 - 使用占位符
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiIGZpbGw9IiNmZmYiLz4KPHN2ZyB4PSIyNSIgeT0iMjUiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRMMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDAgMCAxIDAtMS40MTRsMi0yYTEgMSAwIDAgMSAxLjQxNCAwIi8+Cjwvc3ZnPgo8L3N2Zz4K',
    
    // 店铺信息
    shopInfo: {
      name: '微小租新能源',
      time: '09:00-18:00',
      address: '浙江省 温州市龙湾区雁荡西路267号鸿福家园',
    },
    
    // 搜索关键词
    searchKeyword: '',
    
    // 产品列表 - 从API获取
    products: [],
    
    // 筛选后的产品列表
    filteredProducts: [],
    
    // 加载状态
    loading: false
  },

  onLoad(query) {
    // 页面加载
    console.info(`Page onLoad with query: ${JSON.stringify(query)}`);
    this.loadProducts();
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
    // 页面被下拉刷新
    this.loadProducts().finally(() => {
      my.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    // 页面被拉到底部
  },

  onShareAppMessage() {
    // 返回自定义分享信息
    return {
      title: '微小租新能源',
      desc: '倍受信赖的以租代购平台',
      path: 'pages/index/index',
    };
  },

  // 搜索输入处理
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword
    });
    this.filterProducts(keyword);
  },

  // 搜索按钮点击
  onSearch() {
    this.filterProducts(this.data.searchKeyword);
  },

  // 加载产品列表
  async loadProducts() {
    try {
      this.setData({ loading: true });
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.products.list}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      
      if (response.data && response.data.products) {
        // 转换API数据格式以适配现有UI
        const products = response.data.products.map(product => ({
          id: product.id,
          name: product.name,
          price: product.monthly_price.toString(),
          image: product.cover_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ii8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iIzk5OSIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRMMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDAgMCAxIDAtMS40MTRsMi0yYTEgMSAwIDAgMSAxLjQxNCAwIi8+Cjwvc3ZnPgo8L3N2Zz4K',
          rentalPeriod: product.rental_period,
          description: product.description
        }));
        
        this.setData({
          products: products,
          filteredProducts: products
        });
      }
    } catch (error) {
      console.error('加载产品列表失败:', error);
      my.showToast({
        content: '加载产品列表失败，请稍后重试',
        type: 'fail'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 筛选产品
  filterProducts(keyword) {
    let filtered = this.data.products;
    
    if (keyword && keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase().trim();
      filtered = this.data.products.filter(product => 
        product.name.toLowerCase().includes(lowerKeyword) ||
        product.id.toString().includes(lowerKeyword)
      );
    }
    
    this.setData({
      filteredProducts: filtered
    });
  },

  // 获取产品详情
  async getProductDetail(productId) {
    try {
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.products.detail}/${productId}`,
          method: 'GET',
          success: resolve,
          fail: reject
        });
      });
      
      return response.data;
    } catch (error) {
      console.error('获取产品详情失败:', error);
      throw error;
    }
  },

  // 导航功能
  onNavigate() {
    my.openLocation({
      latitude: 27.9925,
      longitude: 120.6994,
      name: this.data.shopInfo.name,
      address: this.data.shopInfo.address,
      success: () => {
        console.log('导航成功');
      },
      fail: (error) => {
        console.error('导航失败', error);
        my.showToast({
          content: '导航失败，请稍后重试',
          type: 'fail'
        });
      }
    });
  },

  // 拨打电话
  onCall() {
    my.makePhoneCall({
      number: '400-123-4567',
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (error) => {
        console.error('拨打电话失败', error);
        my.showToast({
          content: '拨打电话失败',
          type: 'fail'
        });
      }
    });
  },

  // 下单功能
  onOrder(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === productId);
    
    if (product) {
      // 直接跳转到订单确认页面
      my.navigateTo({
        url: `/pages/order/order?productId=${productId}`
      });
    }
  }
});
