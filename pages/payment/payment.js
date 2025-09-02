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
      totalInstallments: 0, // 实际生成的分期数量（用于判断初始支付）
      plannedInstallments: 0, // 计划的分期总数（用于页面显示）
      // 支付时间相关
      dueDate: null,
      isPaymentDue: false,
      // 服务费相关
      service_fee_amount: 0,
      service_fee_paid: false,
      // 门店信息
      shopName: '',
      shopAddress: '',
      // 租金信息
      monthlyPrice: 0,
      // 平台信息
      customerService: '',
      serviceTime: ''
    },
    
    // 全局配置信息
    globalConfig: null,
    
    // 联系信息
    contactInfo: {
      isConfigured: false,
      contacts: []
    },
    
    // 支付状态
    paymentStatus: 'pending', // pending, processing, success, failed
    
    // 支付类型
    paymentType: '', // serviceFee, installment
    
    // 订单状态
    orderStatus: 'pending', // pending, under_review, approved, rejected
    
    // 审核相关信息
    auditInfo: {
      chejiahao_image: '',
      product_cover_image: '',
      zhimaxinyong_image: ''
    },
    
    // 加载状态
    loading: false
  },

  onLoad(query) {
    console.info(`Payment page onLoad with query: ${JSON.stringify(query)}`);
    
    // 加载全局配置
    this.loadGlobalConfig();
    
    // 加载联系信息
    this.loadContactInfo();
    
    // 获取订单参数
    if (query.orderId && query.orderNo) {
      console.log('获取到订单参数, orderId:', query.orderId, 'orderNo:', query.orderNo);
      this.setData({
        'orderInfo.orderId': parseInt(query.orderId),
        'orderInfo.orderNo': query.orderNo,
        'orderInfo.amount': query.amount ? parseFloat(query.amount) : 0
      });
      
      // 如果有paymentType参数，记录支付类型
      if (query.paymentType) {
        this.setData({
          paymentType: query.paymentType
        });
      }
      
      // 加载订单详情
      console.log('准备调用 loadOrderDetail, orderId:', query.orderId);
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
    // 页面显示时重新加载联系信息（可能用户刚从profile页面配置完回来）
    this.loadContactInfo();
  },

  onHide() {
    // 页面隐藏
  },

  onUnload() {
    // 页面被关闭
  },

  // 联系客服
  contactService() {
    const { globalConfig } = this.data;
    
    // 使用动态配置的联系方式和工作时间
    const phoneNumber = globalConfig ? globalConfig.contact_info : '400-123-4567';
    const businessHours = globalConfig ? globalConfig.business_hours : '09:00-18:00';

    my.showModal({
      title: '联系客服',
      content: `客服电话：${phoneNumber}\n工作时间：${businessHours}`,
      confirmText: '拨打电话',
      cancelText: '取消',
      success: (result) => {
        if (result.confirm) {
          my.makePhoneCall({
            number: phoneNumber,
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

  // 加载订单详情
  async loadOrderDetail(orderId) {
    try {
      console.log('开始加载订单详情, orderId:', orderId);
      this.setData({ loading: true });
      
      const accessToken = my.getStorageSync({ key: 'access_token' });
      console.log('获取到 accessToken:', accessToken ? '有token' : '无token');
      
      const response = await new Promise((resolve, reject) => {
        const requestUrl = `${config.api.baseUrl}${config.api.endpoints.orders.detail}/${orderId}`;
        console.log('请求订单详情 URL:', requestUrl);
        
        my.request({
          url: requestUrl,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken.data}`
          },
          success: (res) => {
            console.log('订单详情请求成功, statusCode:', res.statusCode);
            console.log('订单详情响应数据:', res.data);
            resolve(res);
          },
          fail: (err) => {
            console.error('订单详情请求失败:', err);
            reject(err);
          }
        });
      });
      
      if (response.statusCode === 200 && response.data) {
        console.log('开始处理订单详情响应数据...');
        
        // 计算分期信息
        const installmentInfo = this.calculateInstallmentInfo(
          response.data.installments || [], 
          response.data.monthly_price, 
          response.data.rental_period
        );
        
        console.log('分期信息计算完成:', installmentInfo);
        
        this.setData({
          'orderInfo.productName': response.data.product_name,
          'orderInfo.productImage': response.data.product_cover_image,
          'orderInfo.installmentAmount': installmentInfo.currentAmount,
          'orderInfo.currentInstallmentNo': installmentInfo.currentInstallmentNo,
          'orderInfo.totalInstallments': installmentInfo.totalInstallments, // 实际分期数量（用于判断初始支付）
          'orderInfo.plannedInstallments': installmentInfo.plannedInstallments, // 计划分期总数（用于页面显示）
          'orderInfo.dueDate': this.formatDueDate(installmentInfo.dueDate),
          'orderInfo.isPaymentDue': installmentInfo.isPaymentDue,
          // 服务费相关字段
          'orderInfo.service_fee_amount': response.data.service_fee_amount || 0,
          'orderInfo.service_fee_paid': response.data.service_fee_paid || false,
          // 门店和租金信息
          'orderInfo.shopName': response.data.shop_name || '',
          'orderInfo.shopAddress': response.data.shop_address || '',
          'orderInfo.monthlyPrice': response.data.monthly_price || 0,
          // 平台信息
          'orderInfo.customerService': response.data.customer_service || '',
          'orderInfo.serviceTime': response.data.service_time || '',
          // 根据支付类型更新支付金额
          'orderInfo.amount': this.data.paymentType === 'serviceFee' ? 
            (response.data.service_fee_amount || 0) : 
            installmentInfo.currentAmount,
          // 订单状态和审核信息
          orderStatus: response.data.status || 'pending',
          'auditInfo.chejiahao_image': response.data.chejiahao_image || '',
          'auditInfo.product_cover_image': response.data.product_cover_image || '',
          'auditInfo.zhimaxinyong_image': response.data.zhimaxinyong_image || ''
        });
        
        console.log('订单状态设置为:', response.data.status);
        console.log('当前页面状态:', this.data.orderStatus);
      } else {
        console.log('响应状态码不是200或没有数据:', response.statusCode, response.data);
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
  calculateInstallmentInfo(installments, monthlyPrice, rentalPeriod) {
    if (!installments || installments.length === 0) {
      return {
        currentAmount: monthlyPrice || 0, // 使用 monthly_price 作为当前支付金额
        currentInstallmentNo: 1,
        totalInstallments: 0, // 实际生成的分期数量，用于判断初始支付
        plannedInstallments: rentalPeriod || 0, // 计划的分期总数，用于页面显示
        dueDate: null,
        isPaymentDue: true // 首期支付默认可以支付
      };
    }

    const totalInstallments = installments.length;
    
    // 找到第一个未支付的分期
    const unpaidInstallment = installments.find(item => 
      item.status === 'pending' && item.paid_date === null
    );
    
    if (unpaidInstallment) {
      const dueDate = unpaidInstallment.due_date;
      const isPaymentDue = this.checkIfPaymentDue(dueDate);
      
      return {
        currentAmount: unpaidInstallment.amount,
        currentInstallmentNo: unpaidInstallment.installment_no,
        totalInstallments: totalInstallments,
        plannedInstallments: totalInstallments, // 有分期数据时，计划数等于实际数
        dueDate: dueDate,
        isPaymentDue: isPaymentDue
      };
    } else {
      // 如果所有分期都已支付，返回最后一期的信息
      const lastInstallment = installments[installments.length - 1];
      return {
        currentAmount: lastInstallment.amount,
        currentInstallmentNo: lastInstallment.installment_no,
        totalInstallments: totalInstallments,
        plannedInstallments: totalInstallments, // 有分期数据时，计划数等于实际数
        dueDate: lastInstallment.due_date,
        isPaymentDue: true // 已完成的订单认为可以支付
      };
    }
  },

  // 检查是否到了支付时间
  checkIfPaymentDue(dueDate) {
    if (!dueDate) return true; // 如果没有到期日期，默认可以支付
    
    const now = new Date();
    const due = new Date(dueDate);
    
    // 提前7天可以支付
    const advancePaymentDays = 7;
    const advancePaymentTime = new Date(due.getTime() - advancePaymentDays * 24 * 60 * 60 * 1000);
    
    return now >= advancePaymentTime;
  },

  // 格式化日期显示
  formatDueDate(dueDate) {
    if (!dueDate) return '';
    
    let date;
    // 检查是否为ISO格式但没有时区信息的时间字符串
    const hasTimezone = dueDate.includes('Z') || 
                       dueDate.includes('+') || 
                       (dueDate.includes('-') && dueDate.lastIndexOf('-') > 10);
    
    if (dueDate.includes('T') && !hasTimezone) {
      // 如果是ISO格式但没有时区信息，将其视为UTC时间，添加Z后缀
      const utcTimeStr = dueDate.endsWith('Z') ? dueDate : dueDate + 'Z';
      date = new Date(utcTimeStr);
    } else {
      date = new Date(dueDate);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  // 计算距离支付时间的天数
  getDaysUntilPayment(dueDate) {
    if (!dueDate) return 0;
    
    const now = new Date();
    const due = new Date(dueDate);
    const advancePaymentDays = 7;
    const advancePaymentTime = new Date(due.getTime() - advancePaymentDays * 24 * 60 * 60 * 1000);
    
    const diffTime = advancePaymentTime.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  },

  // 发起支付
  async startPayment() {
    // 检查联系信息是否已配置
    if (!this.data.contactInfo.isConfigured) {
      my.showModal({
        title: '联系信息未完善',
        content: '为了保障您的权益，请先完善联系信息再进行支付。',
        confirmText: '去完善',
        cancelText: '取消',
        success: (result) => {
          if (result.confirm) {
            this.goToProfile();
          }
        }
      });
      return;
    }
    
    // 检查是否到了支付时间
    if (!this.data.orderInfo.isPaymentDue) {
      const daysUntil = this.getDaysUntilPayment(this.data.orderInfo.dueDate);
      const dueDateStr = this.formatDueDate(this.data.orderInfo.dueDate);
      
      my.showModal({
        title: '支付提醒',
        content: `第${this.data.orderInfo.currentInstallmentNo}期分期付款的最晚时间为${dueDateStr}，提前支付不会产生额外费用，您确定要现在支付吗？`,
        confirmText: '确定支付',
        cancelText: '稍后支付',
        success: (result) => {
          if (result.confirm) {
            this.proceedWithPayment();
          }
        }
      });
      return;
    }
    
    // 如果已到支付时间，直接进行支付
    this.proceedWithPayment();
  },

  // 执行支付流程
  async proceedWithPayment() {
    try {
      this.setData({ 
        paymentStatus: 'processing',
        loading: true 
      });

      // 先调用支付创建接口获取支付参数
      const paymentParams = await this.createPayment();
      
      let payResult;
      
      // 检查是否跳过支付宝API调用
      if (config.payment.skipAlipayApi) {
        console.log('跳过支付宝API调用，模拟支付成功');
        
        // 模拟支付宝API返回的成功结果
        payResult = {
          resultCode: '8000',
          memo: '支付处理中（模拟）'
        };
        
        // 模拟API调用时间
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        // 调用真实的支付宝小程序支付接口
        payResult = await new Promise((resolve, reject) => {
          my.tradePay({
            tradeNO: paymentParams.tradeNO,
            success: resolve,
            fail: reject
          });
        });
      }

      console.log('支付结果:', payResult);

      if (payResult.resultCode === '9000' || payResult.resultCode === '8000') {
        // 支付提交成功，开启电子签流程
        // this.setData({ 
        //   paymentStatus: 'success',
        //   loading: false 
        // });
        
        // 判断是否为服务费支付，确定跳转参数
        const isServiceFeePayment = this.data.orderInfo.service_fee_amount > 0 && !this.data.orderInfo.service_fee_paid;
        const paymentAmount = isServiceFeePayment ? this.data.orderInfo.service_fee_amount : this.data.orderInfo.amount;
        const paymentType = isServiceFeePayment ? 'serviceFee' : 'installment';
        
        // 跳转到支付状态确认页面
        my.navigateTo({
          url: `/pages/payment-status/payment-status?orderId=${this.data.orderInfo.orderId}&orderNo=${this.data.orderInfo.orderNo}&installmentNo=${this.data.orderInfo.currentInstallmentNo}&productName=${encodeURIComponent(this.data.orderInfo.productName)}&amount=${paymentAmount}&paymentType=${paymentType}`
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
      
      // 判断支付类型：服务费支付 或 分期支付
      const isServiceFeePayment = this.data.orderInfo.service_fee_amount > 0 && !this.data.orderInfo.service_fee_paid;
      
      console.log('支付调试信息:', {
        totalInstallments: this.data.orderInfo.totalInstallments,
        plannedInstallments: this.data.orderInfo.plannedInstallments,
        service_fee_amount: this.data.orderInfo.service_fee_amount,
        service_fee_paid: this.data.orderInfo.service_fee_paid,
        isServiceFeePayment: isServiceFeePayment,
        orderId: this.data.orderInfo.orderId,
        currentInstallmentNo: this.data.orderInfo.currentInstallmentNo
      });
      
      let endpoint;
      if (isServiceFeePayment) {
        endpoint = config.api.endpoints.payment.serviceFee;
      } else {
        endpoint = config.api.endpoints.payment.create;
      }
      
      console.log('使用的支付接口:', endpoint);
      
      // 构建请求数据
      const requestData = {
        order_id: this.data.orderInfo.orderId
      };
      
      // 如果不是服务费支付，需要传入分期号
      if (!isServiceFeePayment) {
        requestData.installment_no = this.data.orderInfo.currentInstallmentNo;
      }
      
      console.log('支付请求参数:', requestData);
      
      const response = await new Promise((resolve, reject) => {
        my.request({
          url: `${config.api.baseUrl}${endpoint}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken.data}`
          },
          data: requestData,
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

  // 加载全局配置
  async loadGlobalConfig() {
    try {
      const globalConfig = await config.getGlobalConfig();
      this.setData({
        globalConfig: globalConfig
      });
      console.log('Payment页面全局配置加载成功:', globalConfig);
    } catch (error) {
      console.error('Payment页面加载全局配置失败:', error);
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

  // 加载联系信息
  loadContactInfo() {
    try {
      const tokenResult = my.getStorageSync({ key: 'access_token' });
      if (!tokenResult.data) {
        console.log('未找到access_token，跳过获取联系信息');
        return;
      }

      my.request({
        url: config.api.baseUrl + config.api.endpoints.contacts.list,
        method: 'GET',
        headers: {
          'authorization': `Bearer ${tokenResult.data}`
        },
        success: (response) => {
          console.log('获取用户联系信息成功:', response);
          
          if (response.statusCode === 200 && response.data && response.data.contacts) {
            const contacts = response.data.contacts;
            
            // 检查联系信息是否已配置（至少有2个完整的联系人）
            const validContacts = contacts.filter(contact => 
              contact.relation_type && contact.relation_name && contact.relation_phone
            );
            const isConfigured = validContacts.length >= 2;
            
            const contactInfo = {
              isConfigured: isConfigured,
              contacts: validContacts
            };
            
            this.setData({
              contactInfo: contactInfo
            });
          } else {
            // 如果没有联系人数据，设置为未配置状态
            this.setData({
              contactInfo: {
                isConfigured: false,
                contacts: []
              }
            });
          }
        },
        fail: (error) => {
          console.error('获取联系信息失败:', error);
          // 如果获取失败，设置为未配置状态
          this.setData({
            contactInfo: {
              isConfigured: false,
              contacts: []
            }
          });
        }
      });
    } catch (e) {
      console.error('加载联系信息时发生错误:', e);
      // 如果出现异常，设置为未配置状态
      this.setData({
        contactInfo: {
          isConfigured: false,
          contacts: []
        }
      });
    }
  },

  // 跳转到联系信息编辑页面
  goToProfile() {
    my.navigateTo({
      url: '/pages/contact-edit/contact-edit',
      success: () => {
        console.log('跳转到联系信息编辑页面成功');
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        my.showToast({
          content: '跳转失败，请稍后重试',
          type: 'fail'
        });
      }
    });
  },
});
