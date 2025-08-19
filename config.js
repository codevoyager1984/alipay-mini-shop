// 应用配置文件
const config = {
  // API相关配置
  api: {
    // API基础域名
    baseUrl: 'https://80d86caae0f6.ngrok-free.app',
    
    // API端点
    endpoints: {
      // 认证相关
      auth: {
        alipayLogin: '/api/auth/alipay/login',
        profile: '/api/auth/profile'
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
