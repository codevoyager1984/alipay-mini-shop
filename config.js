// 应用配置文件
const config = {
  // API相关配置
  api: {
    // API基础域名
    baseUrl: 'http://45.78.228.239:8000',
    
    // API端点
    endpoints: {
      // 认证相关
      auth: {
        alipayLogin: '/api/auth/alipay/login',
        profile: '/api/auth/profile',
        bindPhone: '/api/auth/bind-phone',
        certifyInitialize: '/api/auth/certify/initialize',
        certifyQuery: '/api/auth/certify/query'
      },
      // 产品相关
      products: {
        list: '/api/products',
        detail: '/api/products'  // 详情接口会拼接 /{id}
      },
      // 订单相关
      orders: {
        create: '/api/orders',
        list: '/api/orders',
        detail: '/api/orders',  // 详情接口会拼接 /{id}
        cancel: '/api/orders'   // 取消接口会拼接 /{id}/cancel
      },
      // 支付相关
      payment: {
        create: '/api/payment/create',
        initial: '/api/payment/initial',
        notify: '/api/payment/notify',
        status: '/api/payment/status'  // 状态接口会拼接 /{order_id}
      }
    }
  },

  // 其他配置可以在这里添加
  app: {
    name: '微小租新能源',
    version: '1.0.0'
  }
};

module.exports = config;
