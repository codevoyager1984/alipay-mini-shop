const config = require('../../config.js');

Page({
  data: {
    // 订单信息
    orderInfo: {
      orderId: null,
      orderNo: '',
      amount: 0,
      productName: '',
      productImage: '',
      // 分期相关信息
      installmentAmount: 0,
      currentInstallmentNo: 1,
      totalInstallments: 0
    },
    
    // 支付状态
    paymentStatus: 'pending', // pending, processing, success, failed
    
    // 加载状态
    loading: false
  },

  onLoad(query) {
    console.info(`Payment page onLoad with query: ${JSON.stringify(query)}`);
    
    // 获取订单参数
    if (query.orderId && query.orderNo && query.amount) {
      this.setData({
        'orderInfo.orderId': parseInt(query.orderId),
        'orderInfo.orderNo': query.orderNo,
        'orderInfo.amount': parseFloat(query.amount)
      });
      
      // 加载订单详情
      this.loadOrderDetail(query.orderId);
    } else {
      my.showModal({
        title: '参数错误',
        content: '订单信息获取失败，请重新下单',
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
    // 页面显示
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面被关闭
  },

  // 加载订单详情
  async loadOrderDetail(orderId) {
    try {
      this.setData({ loading: true });
      
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.orders.detail}/${orderId}`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.data}`
          },
          success: resolve,
          fail: reject
        });
      });
      
      if (response.statusCode === 200 && response.data) {
        // 计算分期信息
        const installmentInfo = this.calculateInstallmentInfo(response.data.installments || []);
        
        this.setData({
          'orderInfo.productName': response.data.product_name,
          'orderInfo.productImage': response.data.product_cover_image,
          'orderInfo.installmentAmount': installmentInfo.currentAmount,
          'orderInfo.currentInstallmentNo': installmentInfo.currentInstallmentNo,
          'orderInfo.totalInstallments': installmentInfo.totalInstallments,
          // 更新支付金额为当前分期金额
          'orderInfo.amount': installmentInfo.currentAmount
        });
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      my.showToast({
        content: '加载订单信息失败',
        type: 'fail'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 计算分期信息
  calculateInstallmentInfo(installments) {
    if (!installments || installments.length === 0) {
      return {
        currentAmount: 0,
        currentInstallmentNo: 1,
        totalInstallments: 0
      };
    }

    const totalInstallments = installments.length;
    
    // 找到第一个未支付的分期
    const unpaidInstallment = installments.find(item => 
      item.status === 'pending' && item.paid_date === null
    );
    
    if (unpaidInstallment) {
      return {
        currentAmount: unpaidInstallment.amount,
        currentInstallmentNo: unpaidInstallment.installment_no,
        totalInstallments: totalInstallments
      };
    } else {
      // 如果所有分期都已支付，返回最后一期的信息
      const lastInstallment = installments[installments.length - 1];
      return {
        currentAmount: lastInstallment.amount,
        currentInstallmentNo: lastInstallment.installment_no,
        totalInstallments: totalInstallments
      };
    }
  },

  // 发起支付
  async startPayment() {
    try {
      this.setData({ 
        paymentStatus: 'processing',
        loading: true 
      });

      // 先调用支付创建接口获取支付参数
      const paymentParams = await this.createPayment();
      
      // 调用支付宝小程序支付接口
      const payResult = await new Promise((resolve, reject) => {
        my.tradePay({
          tradeNO: paymentParams.tradeNO,
          success: resolve,
          fail: reject
        });
      });

      console.log('支付结果:', payResult);

      if (payResult.resultCode === '9000') {
        // 支付提交成功，跳转到支付状态页面进行确认
        this.setData({ 
          paymentStatus: 'processing',
          loading: false 
        });
        
        // 跳转到支付状态确认页面
        my.navigateTo({
          url: `/pages/payment-status/payment-status?orderId=${this.data.orderInfo.orderId}&orderNo=${this.data.orderInfo.orderNo}&installmentNo=${this.data.orderInfo.currentInstallmentNo}&productName=${encodeURIComponent(this.data.orderInfo.productName)}&amount=${this.data.orderInfo.amount}`
        });
      } else if (payResult.resultCode === '8000') {
        // 支付处理中，也跳转到状态页面
        this.setData({ 
          paymentStatus: 'processing',
          loading: false 
        });
        
        // 跳转到支付状态确认页面
        my.navigateTo({
          url: `/pages/payment-status/payment-status?orderId=${this.data.orderInfo.orderId}&orderNo=${this.data.orderInfo.orderNo}&installmentNo=${this.data.orderInfo.currentInstallmentNo}&productName=${encodeURIComponent(this.data.orderInfo.productName)}&amount=${this.data.orderInfo.amount}`
        });
      } else {
        // 支付失败或取消
        this.setData({ 
          paymentStatus: 'failed',
          loading: false 
        });
        
        my.showModal({
          title: '支付失败',
          content: '支付未完成，您可以重新尝试支付',
          confirmText: '重新支付',
          cancelText: '取消',
          success: (result) => {
            if (result.confirm) {
              this.setData({ paymentStatus: 'pending' });
            }
          }
        });
      }
    } catch (error) {
      console.error('支付失败:', error);
      this.setData({ 
        paymentStatus: 'failed',
        loading: false 
      });
      
      // 区分不同类型的错误
      let errorTitle = '支付失败';
      let errorContent = '支付过程中发生错误，请稍后重试';
      
      if (error.message && error.message.includes('创建支付订单失败')) {
        errorTitle = '创建支付失败';
        errorContent = error.message;
      } else if (error.message) {
        errorContent = error.message;
      }
      
      my.showModal({
        title: errorTitle,
        content: errorContent,
        confirmText: '重新支付',
        cancelText: '取消',
        success: (result) => {
          if (result.confirm) {
            this.setData({ paymentStatus: 'pending' });
          }
        }
      });
    }
  },

  // 创建支付订单，获取支付参数
  async createPayment() {
    try {
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${config.api.endpoints.payment.create}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.data}`
          },
          data: {
            order_id: this.data.orderInfo.orderId,
            installment_no: this.data.orderInfo.currentInstallmentNo
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data) {
        console.log('支付参数:', response.data);
        // 构建支付宝支付所需的订单字符串
        return {
          tradeNO: response.data.trade_no,
          outTradeNo: response.data.out_trade_no,
          totalAmount: response.data.total_amount,
          subject: response.data.subject,
          body: response.data.body
        };
      } else {
        throw new Error((response.data && response.data.message) || '创建支付订单失败');
      }
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw new Error(error.message || '创建支付订单失败，请稍后重试');
    }
  },

  // 构建支付宝订单字符串
  buildOrderString(paymentData) {
    // 根据支付宝SDK要求构建订单字符串
    // 实际项目中，这个字符串应该由后端完整生成，包含签名等安全信息
    const params = {
      app_id: '2021000000000000', // 实际应用中应该从配置获取
      method: 'alipay.trade.app.pay',
      charset: 'UTF-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace(/[T]/g, ' ').replace(/\..+/, ''),
      version: '1.0',
      biz_content: JSON.stringify({
        out_trade_no: paymentData.out_trade_no,
        total_amount: paymentData.total_amount,
        subject: paymentData.subject,
        body: paymentData.body,
        product_code: 'QUICK_MSECURITY_PAY'
      })
    };

    // 构建参数字符串
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    return paramStr + '&sign=mock_signature'; // 实际项目中签名应该由后端生成
  },

  // 生成订单字符串（实际项目中应该从后端获取）
  generateOrderString() {
    // 这是一个模拟的订单字符串，实际项目中需要从后端获取完整的支付参数
    // 包含签名、商户信息等
    return `alipay_sdk=alipay-sdk-java-4.22.110.ALL&app_id=2021000000000000&biz_content=%7B%22out_trade_no%22%3A%22${this.data.orderInfo.orderNo}%22%2C%22total_amount%22%3A%22${this.data.orderInfo.amount}%22%2C%22subject%22%3A%22${encodeURIComponent(this.data.orderInfo.productName)}%22%2C%22product_code%22%3A%22QUICK_MSECURITY_PAY%22%7D&charset=UTF-8&format=json&method=alipay.trade.app.pay&sign_type=RSA2&timestamp=2024-01-01+00%3A00%3A00&version=1.0&sign=mock_signature`;
  },

  // 显示支付成功
  showPaymentSuccess() {
    const { currentInstallmentNo, totalInstallments } = this.data.orderInfo;
    const message = totalInstallments > 0 
      ? `恭喜您！第${currentInstallmentNo}期分期支付成功，我们将尽快为您安排发货。`
      : '恭喜您！订单支付成功，我们将尽快为您安排发货。';
      
    my.showModal({
      title: '支付成功',
      content: message,
      confirmText: '查看订单',
      cancelText: '返回首页',
      success: (result) => {
        if (result.confirm) {
          // 跳转到订单列表
          my.reLaunch({
            url: '/pages/orders/orders'
          });
        } else {
          // 返回首页
          my.reLaunch({
            url: '/pages/index/index'
          });
        }
      }
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
