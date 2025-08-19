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
      },
      // 配置相关
      config: {
        get: '/api/config'
      }
    }
  },

  // 其他配置可以在这里添加
  app: {
    name: '微小租新能源',
    version: '1.0.0'
  },

  // 全局应用配置缓存
  globalConfig: null
};

// 获取全局配置的函数
config.getGlobalConfig = function() {
  return new Promise((resolve, reject) => {
    // 如果已有缓存，直接返回
    if (config.globalConfig) {
      resolve(config.globalConfig);
      return;
    }

    // 从接口获取配置
    my.request({
      url: `${config.api.baseUrl}${config.api.endpoints.config.get}`,
      method: 'GET',
      success: (response) => {
        if (response.statusCode === 200 && response.data) {
          // 缓存配置数据
          config.globalConfig = response.data;
          resolve(response.data);
        } else {
          // 如果接口失败，返回默认配置
          const defaultConfig = {
            contact_info: '400-123-4567',
            business_hours: '09:00-18:00', 
            location_text: '浙江省 温州市龙湾区雁荡西路267号鸿福家园',
            location_latitude: '27.9925',
            location_longitude: '120.6994',
            about_us: '微小租新能源，倍受信赖的以租代购平台'
          };
          config.globalConfig = defaultConfig;
          resolve(defaultConfig);
        }
      },
      fail: (error) => {
        console.error('获取配置失败，使用默认配置:', error);
        // 接口调用失败时，返回默认配置
        const defaultConfig = {
          contact_info: '400-123-4567',
          business_hours: '09:00-18:00',
          location_text: '浙江省 温州市龙湾区雁荡西路267号鸿福家园', 
          location_latitude: '27.9925',
          location_longitude: '120.6994',
          about_us: '微小租新能源，倍受信赖的以租代购平台'
        };
        config.globalConfig = defaultConfig;
        resolve(defaultConfig);
      }
    });
  });
};

// 清除配置缓存的函数（用于刷新配置）
config.clearConfigCache = function() {
  config.globalConfig = null;
};

module.exports = config;
