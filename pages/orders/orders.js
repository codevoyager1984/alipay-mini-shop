const config = require('../../config.js');

Page({
  data: {
    activeTab: 'all',
    orders: [],
    filteredOrders: [],
    loading: false,
    // 分页参数
    currentPage: 1,
    pageSize: 20,
    hasMore: true
  },

  onLoad(query) {
    console.info(`Orders page onLoad with query: ${JSON.stringify(query)}`);
    this.loadOrders(true);
  },

  onReady() {
    // 页面加载完成
  },

  onShow() {
    // 页面显示 - 重新加载订单数据
    this.loadOrders(true);
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
    this.loadOrders(true);
  },

  onReachBottom() {
    // 页面被拉到底部 - 加载更多
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },

  onShareAppMessage() {
    return {
      title: '我的订单',
      desc: '查看电瓶车租赁订单',
      path: 'pages/orders/orders',
    };
  },

  // 加载订单列表
  async loadOrders(refresh = false) {
    try {
      // 如果是刷新，重置分页参数
      if (refresh) {
        this.setData({
          currentPage: 1,
          hasMore: true,
          orders: []
        });
      }

      this.setData({ loading: true });

      // 获取用户信息和token
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      const accessToken = my.getStorageSync({ key: 'access_token' });

      if (!userInfo.data || !userInfo.data.userId || !accessToken.data) {
        throw new Error('用户未登录，请先登录');
      }

      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.orders.list}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.data}`
          },
          data: {
            page: this.data.currentPage,
            limit: this.data.pageSize,
          },
          success: resolve,
          fail: reject,
          complete: () => {
            my.stopPullDownRefresh();
          }
        });
      });

      if (response.statusCode === 200 && response.data && response.data.orders) {
        // 转换API数据格式以适配现有UI
        const orders = response.data.orders.map(item => {
          // 计算分期信息
          const installmentInfo = this.calculateInstallmentInfo(
            item.installments || [], 
            item.monthly_price, 
            item.rental_period
          );
          
          return {
            id: item.id,
            orderNo: item.order_no,
            vehicleName: item.product_name,
            vehicleImage: item.product_cover_image || this.getDefaultImage(),
            createTime: this.formatDateTime(item.created_at),
            rentalPeriod: `${item.rental_period}个月`,
            totalPrice: item.total_amount.toFixed(2),
            // 分期相关信息
            installmentAmount: installmentInfo.amount.toFixed(2), // 单期金额
            paidInstallments: installmentInfo.paidCount, // 已付期数
            totalInstallments: installmentInfo.totalCount, // 总期数
            installmentStatus: installmentInfo.status, // 分期状态文本
            nextPaymentDate: installmentInfo.nextPaymentDate, // 下次支付日期
            status: this.mapOrderStatus(item.status),
            statusText: this.getStatusText(item.status),
            rawData: item // 保存原始数据，方便后续使用
          };
        });

        // 合并订单数据（用于分页加载）
        const allOrders = refresh ? orders : [...this.data.orders, ...orders];
        
        this.setData({
          orders: allOrders,
          hasMore: response.data.orders.length === this.data.pageSize,
          currentPage: refresh ? 2 : this.data.currentPage + 1
        });

        this.filterOrders();
      } else {
        throw new Error((response.data && response.data.message) ? response.data.message : '获取订单列表失败');
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      
      // 如果是认证错误，跳转到登录页面
      if (error.message && error.message.includes('未登录')) {
        my.showModal({
          title: '请先登录',
          content: '获取订单信息需要先登录账户',
          confirmText: '去登录',
          cancelText: '取消',
          success: (result) => {
            if (result.confirm) {
              my.switchTab({
                url: '/pages/profile/profile'
              });
            }
          }
        });
      } else {
        my.showToast({
          content: error.message || '加载订单失败，请稍后重试',
          type: 'fail'
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载更多订单
  loadMoreOrders() {
    this.loadOrders(false);
  },

  // 获取默认图片
  getDefaultImage() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ii8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iIzk5OSIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPC9zdmc+';
  },

  // 计算分期信息
  calculateInstallmentInfo(installments, monthlyPrice, rentalPeriod) {
    if (!installments || installments.length === 0) {
      return {
        amount: monthlyPrice || 0, // 使用 monthly_price 作为单期金额
        paidCount: 0,
        totalCount: rentalPeriod || 0, // 使用 rental_period 作为总期数
        status: '未开始支付',
        nextPaymentDate: null
      };
    }

    const totalCount = installments.length;
    const paidCount = installments.filter(item => 
      item.status === 'paid' || item.paid_date !== null
    ).length;
    
    // 获取单期金额（假设所有分期金额相同，取第一期的金额）
    const amount = installments.length > 0 ? installments[0].amount : monthlyPrice;
    
    // 找到下一个未支付的分期，获取其到期日期
    const nextUnpaidInstallment = installments.find(item => 
      item.status === 'pending' && item.paid_date === null
    );
    
    const nextPaymentDate = nextUnpaidInstallment ? 
      this.formatDate(nextUnpaidInstallment.due_date) : null;
    
    // 生成状态文本
    let status = '';
    if (paidCount === 0) {
      status = '未开始支付';
    } else if (paidCount === totalCount) {
      status = '已全部支付';
    } else {
      status = `已付 ${paidCount}/${totalCount} 期`;
    }

    return {
      amount: amount,
      paidCount: paidCount,
      totalCount: totalCount,
      status: status,
      nextPaymentDate: nextPaymentDate
    };
  },

  // 格式化日期（只显示年月日）
  formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('日期格式化失败:', error);
      return dateStr;
    }
  },

  // 格式化日期时间
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    try {
      const date = new Date(dateTimeStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('日期格式化失败:', error);
      return dateTimeStr;
    }
  },

  // 映射订单状态
  mapOrderStatus(apiStatus) {
    const statusMap = {
      'pending': 'pending',      // 未开始
      'paid': 'ongoing',         // 已支付 -> 租赁中
      'inprogress': 'inprogress', // 进行中
      'ongoing': 'ongoing',      // 租赁中
      'completed': 'completed',  // 已完成
      'cancelled': 'cancelled'   // 已取消
    };
    
    return statusMap[apiStatus] || 'pending';
  },

  // 获取状态文本
  getStatusText(apiStatus) {
    const statusTextMap = {
      'pending': '未开始',
      'paid': '已完成',
      'ongoing': '租赁中',
      'completed': '已完成',
      'cancelled': '已取消',
      "inprogress": "进行中"
    };
    
    return statusTextMap[apiStatus] || '未知状态';
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterOrders();
  },

  // 筛选订单
  filterOrders() {
    let filtered = this.data.orders;
    
    if (this.data.activeTab === 'ongoing') {
      filtered = this.data.orders.filter(order => 
        order.status === 'ongoing' || order.status === 'pending' || order.status === 'inprogress'
      );
    } else if (this.data.activeTab === 'completed') {
      filtered = this.data.orders.filter(order => 
        order.status === 'completed'
      );
    }
    
    this.setData({
      filteredOrders: filtered
    });
  },

  // 联系客服
  contactService(e) {
    const order = e.currentTarget.dataset.order;
    my.showModal({
      title: '联系客服',
      content: `需要咨询订单 ${order.orderNo} 相关问题吗？`,
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (result) => {
        if (result.confirm) {
          my.makePhoneCall({
            number: '400-123-4567',
            success: () => {
              console.log('拨打客服电话成功');
            },
            fail: (error) => {
              console.error('拨打电话失败', error);
              my.showToast({
                content: '拨打电话失败',
                type: 'fail'
              });
            }
          });
        }
      }
    });
  },

  // 支付订单
  payOrder(e) {
    const order = e.currentTarget.dataset.order;
    
    // 对于分期订单，使用分期金额；对于普通订单，使用总金额
    const paymentAmount = order.installmentAmount && order.installmentAmount !== '0.00' 
      ? order.installmentAmount 
      : order.totalPrice;
    
    // 跳转到支付页面
    my.navigateTo({
      url: `/pages/payment/payment?orderId=${order.id}&orderNo=${order.orderNo}&amount=${paymentAmount}`
    });
  },



  // 查看订单详情
  viewOrderDetail(e) {
    const order = e.currentTarget.dataset.order;
    
    // 跳转到订单详情页面
    my.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${order.id}&orderNo=${order.orderNo}`
    });
  },

  // 取消订单
  async cancelOrder(e) {
    const order = e.currentTarget.dataset.order;
    
    my.showModal({
      title: '取消订单',
      content: `确定要取消订单 ${order.orderNo} 吗？`,
      confirmText: '确认取消',
      cancelText: '不取消',
      success: async (result) => {
        if (result.confirm) {
          try {
            my.showLoading({ content: '正在取消订单...' });
            
            const accessToken = my.getStorageSync({ key: 'access_token' });
            
            const response = await new Promise((resolve, reject) => {
              my.request({
                url: `${config.api.baseUrl}${config.api.endpoints.orders.cancel}/${order.id}/cancel`,
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${accessToken.data}`
                },
                success: resolve,
                fail: reject
              });
            });
            
            my.hideLoading();
            
            if (response.statusCode === 200) {
              my.showToast({
                content: '订单取消成功',
                type: 'success'
              });
              
              // 重新加载订单列表
              this.loadOrders(true);
            } else {
              throw new Error((response.data && response.data.message) ? response.data.message : '取消订单失败');
            }
          } catch (error) {
            my.hideLoading();
            console.error('取消订单失败:', error);
            my.showToast({
              content: error.message || '取消订单失败，请稍后重试',
              type: 'fail'
            });
          }
        }
      }
    });
  },

  // 去租车
  goToRent() {
    my.switchTab({
      url: '/pages/index/index'
    });
  }
});