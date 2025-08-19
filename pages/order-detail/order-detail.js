const config = require('../../config.js');

Page({
  data: {
    // 订单基本信息
    orderDetail: null,
    
    // 分期付款信息
    installments: [],
    
    // 页面状态
    loading: true,
    
    // 页面参数
    orderId: null,
    
    // 全局配置信息
    globalConfig: null,
    orderNo: ''
  },

  onLoad(query) {
    console.log('Order detail page onLoad with query:', query);
    
    // 加载全局配置
    this.loadGlobalConfig();
    
    if (query.orderId && query.orderNo) {
      this.setData({
        orderId: parseInt(query.orderId),
        orderNo: query.orderNo
      });
      
      this.loadOrderDetail();
    } else {
      my.showModal({
        title: '参数错误',
        content: '订单信息获取失败，请重新尝试',
        confirmText: '知道了',
        showCancel: false,
        success: () => {
          my.navigateBack();
        }
      });
    }
  },

  onReady() {
    // 页面加载完成
  },

  onShow() {
    // 页面显示时重新加载数据
    if (this.data.orderId) {
      this.loadOrderDetail();
    }
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面被关闭
  },

  // 加载订单详情
  async loadOrderDetail() {
    try {
      this.setData({ loading: true });
      
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      if (!accessToken.data) {
        throw new Error('用户未登录，请先登录');
      }
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.orders.detail}/${this.data.orderId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.data}`
          },
          success: resolve,
          fail: reject
        });
      });
      
      if (response.statusCode === 200 && response.data) {
        // 处理订单基本信息
        const orderDetail = {
          orderId: response.data.id,
          orderNo: response.data.order_no,
          productName: response.data.product_name,
          productImage: response.data.product_cover_image || this.getDefaultImage(),
          createTime: this.formatDateTime(response.data.created_at),
          rentalPeriod: `${response.data.rental_period}个月`,
          totalAmount: response.data.total_amount.toFixed(2),
          status: this.mapOrderStatus(response.data.status),
          statusText: this.getStatusText(response.data.status)
        };
        
        // 处理分期信息
        const installments = (response.data.installments || []).map(item => ({
          installmentNo: item.installment_no,
          amount: item.amount.toFixed(2),
          dueDate: this.formatDate(item.due_date),
          paidDate: item.paid_date ? this.formatDateTime(item.paid_date) : null,
          paymentMethod: item.payment_method || null,
          status: this.mapInstallmentStatus(item.status, item.paid_date),
          statusText: this.getInstallmentStatusText(item.status, item.paid_date),
          rawData: item
        }));
        
        this.setData({
          orderDetail: orderDetail,
          installments: installments
        });
      } else {
        throw new Error((response.data && response.data.message) || '获取订单详情失败');
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      
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
            } else {
              my.navigateBack();
            }
          }
        });
      } else {
        my.showToast({
          content: error.message || '加载订单详情失败',
          type: 'fail'
        });
      }
    } finally {
      this.setData({ loading: false });
    }
  },

  // 获取默认图片
  getDefaultImage() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ii8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iIzk5OSIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPC9zdmc+';
  },

  // 格式化日期时间
  formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    try {
      let date;
      // 检查是否为ISO格式但没有时区信息的时间字符串
      const hasTimezone = dateTimeStr.includes('Z') || 
                         dateTimeStr.includes('+') || 
                         (dateTimeStr.includes('-') && dateTimeStr.lastIndexOf('-') > 10);
      
      if (dateTimeStr.includes('T') && !hasTimezone) {
        // 如果是ISO格式但没有时区信息，将其视为UTC时间，添加Z后缀
        const utcTimeStr = dateTimeStr.endsWith('Z') ? dateTimeStr : dateTimeStr + 'Z';
        date = new Date(utcTimeStr);
      } else {
        date = new Date(dateTimeStr);
      }
      
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

  // 格式化日期（不包含时间）
  formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
      let date;
      // 检查是否为ISO格式但没有时区信息的时间字符串
      const hasTimezone = dateStr.includes('Z') || 
                         dateStr.includes('+') || 
                         (dateStr.includes('-') && dateStr.lastIndexOf('-') > 10);
      
      if (dateStr.includes('T') && !hasTimezone) {
        // 如果是ISO格式但没有时区信息，将其视为UTC时间，添加Z后缀
        const utcTimeStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
        date = new Date(utcTimeStr);
      } else {
        date = new Date(dateStr);
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('日期格式化失败:', error);
      return dateStr;
    }
  },

  // 映射订单状态
  mapOrderStatus(apiStatus) {
    const statusMap = {
      'pending': 'pending',
      'paid': 'completed',
      'ongoing': 'ongoing',
      'completed': 'completed',
      'cancelled': 'cancelled'
    };
    
    return statusMap[apiStatus] || 'pending';
  },

  // 获取订单状态文本
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

  // 映射分期状态
  mapInstallmentStatus(apiStatus, paidDate) {
    if (paidDate) {
      return 'paid';
    }
    
    const statusMap = {
      'pending': 'pending',
      'paid': 'paid',
      'overdue': 'overdue'
    };
    
    return statusMap[apiStatus] || 'pending';
  },

  // 获取分期状态文本
  getInstallmentStatusText(apiStatus, paidDate) {
    if (paidDate) {
      return '已支付';
    }
    
    const statusTextMap = {
      'pending': '未开始',
      'paid': '已支付',
      'overdue': '已逾期'
    };
    
    return statusTextMap[apiStatus] || '未开始';
  },

  // 支付分期
  payInstallment(e) {
    const installment = e.currentTarget.dataset.installment;
    
    // 跳转到支付页面
    my.navigateTo({
      url: `/pages/payment/payment?orderId=${this.data.orderId}&orderNo=${this.data.orderNo}&installmentNo=${installment.installmentNo}&amount=${installment.amount}`
    });
  },

  // 加载全局配置
  async loadGlobalConfig() {
    try {
      const globalConfig = await config.getGlobalConfig();
      this.setData({
        globalConfig: globalConfig
      });
      console.log('OrderDetail页面全局配置加载成功:', globalConfig);
    } catch (error) {
      console.error('OrderDetail页面加载全局配置失败:', error);
    }
  },

  // 联系客服
  contactService() {
    const { globalConfig } = this.data;
    
    // 使用动态配置的联系方式
    const phoneNumber = globalConfig ? globalConfig.contact_info : '400-123-4567';

    my.makePhoneCall({
      number: phoneNumber,
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
  },

  // 返回订单列表
  goBack() {
    my.navigateBack();
  }
});
