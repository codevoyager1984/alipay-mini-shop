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
    
    // 解析后的商品介绍内容
    parsedDescription: [],
    
    // 加载状态
    loading: false,
    
    // 订单确认弹窗状态
    showOrderConfirm: false,
    
    // 订单确认弹窗数据加载状态
    orderConfirmLoading: false,
    
    // 材料提交弹窗状态
    showMaterialSubmission: false,
    
    // 订单配置信息
    orderConfig: {
      rentalDays: 30,          // 租期：固定30天
      paymentMethod: '先用后付',  // 支付方式：固定先用后付
      supportedInstallments: null, // 支持期数：从接口获取
      rentalPlan: '长租'        // 租赁方案：固定长租
    },
    
    // 合同相关状态（保留以备兼容）
    showContractModal: false,  // 是否显示合同弹窗
    countdown: 10,             // 倒计时秒数（10秒）
    isAgreed: false,          // 是否同意协议
    countdownTimer: null,     // 倒计时定时器
    
    // 材料上传相关状态
    materialImages: {         // 已上传的材料图片
      zhimaxinyong: null,     // 芝麻信用照片
      rencheheyi: null,       // 人车合一照片
      chejiahao: null         // 车架号照片
    },
    materialUrls: {           // 上传后的URL
      zhimaxinyong_image: null,
      rencheheyi_image: null,
      chejiahao_image: null
    },
    allMaterialsUploaded: false  // 是否全部材料已上传
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
    // 清理倒计时定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
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
          service_fee: response.data.service_fee,
          image: response.data.cover_image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ci8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iI2Y0NDMzNiIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRsMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
          rentalPeriod: response.data.rental_period,
          description: response.data.description
        };
        
        this.setData({
          productInfo: productInfo,
          // 从API获取支持期数，使用rental_period字段
          'orderConfig.supportedInstallments': response.data.rental_period || null
        });
        
        // 解析商品描述的 markdown 内容
        this.parseMarkdownDescription(productInfo.description);
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

  // 确保产品数据已加载
  async ensureProductDataLoaded() {
    // 如果支持期数还没有加载，重新加载产品信息
    if (this.data.orderConfig.supportedInstallments === null && this.data.productInfo.id) {
      await this.loadProductInfo(this.data.productInfo.id);
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
  },

  // 解析 Markdown 内容为可渲染的数据结构
  parseMarkdownDescription(markdown) {
    if (!markdown) {
      this.setData({
        parsedDescription: []
      });
      return;
    }

    const lines = markdown.split('\n');
    const parsed = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // 空行作为段落分隔
        parsed.push({
          type: 'br',
          content: '',
          indent: 0
        });
        continue;
      }
      
      // 标题 (# ## ### 等)
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = this.parseInlineElements(headingMatch[2]);
        parsed.push({
          type: 'heading',
          level: level,
          content: content,
          indent: 0
        });
        continue;
      }
      
      // 分割线 (--- 或 ***)
      if (trimmedLine.match(/^[-*]{3,}$/)) {
        parsed.push({
          type: 'hr',
          content: '',
          indent: 0
        });
        continue;
      }
      
      // 图片 (![alt](src))
      const imageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        parsed.push({
          type: 'image',
          alt: imageMatch[1],
          src: imageMatch[2],
          indent: 0
        });
        continue;
      }
      
      // 无序列表项 (- 或 *)
      const ulMatch = line.match(/^(\s*)[-*]\s+(.+)$/);
      if (ulMatch) {
        const indent = this.getIndentLevel(ulMatch[1]);
        const content = this.parseInlineElements(ulMatch[2]);
        parsed.push({
          type: 'ul',
          content: content,
          indent: indent
        });
        continue;
      }
      
      // 有序列表项 (1. 2. 等)
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
      if (olMatch) {
        const indent = this.getIndentLevel(olMatch[1]);
        const content = this.parseInlineElements(olMatch[2]);
        parsed.push({
          type: 'ol',
          content: content,
          indent: indent
        });
        continue;
      }
      
      // 普通文本段落
      const content = this.parseInlineElements(trimmedLine);
      parsed.push({
        type: 'text',
        content: content,
        indent: 0
      });
    }
    
    this.setData({
      parsedDescription: parsed
    });
  },

  // 解析行内元素（加粗、斜体、代码、链接等）
  parseInlineElements(text) {
    const elements = [];
    let currentText = text;
    let position = 0;

    while (position < currentText.length) {
      // 查找下一个特殊标记
      const patterns = [
        { regex: /\*\*([^*]+)\*\*/, type: 'bold' },      // **加粗**
        { regex: /\*([^*]+)\*/, type: 'italic' },        // *斜体*
        { regex: /`([^`]+)`/, type: 'code' },            // `代码`
        { regex: /\[([^\]]+)\]\(([^)]+)\)/, type: 'link' } // [文字](链接)
      ];

      let nearestMatch = null;
      let nearestIndex = currentText.length;

      // 找到最近的匹配
      for (const pattern of patterns) {
        const match = currentText.slice(position).match(pattern.regex);
        if (match && match.index + position < nearestIndex) {
          nearestMatch = {
            ...pattern,
            match: match,
            index: match.index + position
          };
          nearestIndex = match.index + position;
        }
      }

      if (nearestMatch) {
        // 添加匹配前的普通文本
        if (nearestMatch.index > position) {
          const plainText = currentText.slice(position, nearestMatch.index);
          if (plainText) {
            elements.push({
              type: 'plain',
              text: plainText
            });
          }
        }

        // 添加特殊元素
        if (nearestMatch.type === 'link') {
          elements.push({
            type: 'link',
            text: nearestMatch.match[1],
            url: nearestMatch.match[2]
          });
        } else {
          elements.push({
            type: nearestMatch.type,
            text: nearestMatch.match[1]
          });
        }

        position = nearestMatch.index + nearestMatch.match[0].length;
      } else {
        // 没有更多特殊标记，添加剩余文本
        const remainingText = currentText.slice(position);
        if (remainingText) {
          elements.push({
            type: 'plain',
            text: remainingText
          });
        }
        break;
      }
    }

    return elements.length > 0 ? elements : [{ type: 'plain', text: text }];
  },

  // 获取缩进级别
  getIndentLevel(spaces) {
    if (!spaces) return 0;
    let indent = 0;
    for (let i = 0; i < spaces.length; i++) {
      if (spaces[i] === ' ') {
        indent++;
      } else if (spaces[i] === '\t') {
        indent += 4; // tab 按 4 个空格计算
      }
    }
    return Math.floor(indent / 4); // 每 4 个空格为一个缩进级别
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

  // 检查手机号绑定状态
  checkPhoneBindingStatus() {
    try {
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      return userInfo.data && userInfo.data.phone && userInfo.data.phone.trim() !== '';
    } catch (e) {
      console.error('检查手机号绑定状态失败:', e);
      return false;
    }
  },

  // 显示合同弹窗
  showContract() {
    // 显示合同弹窗并开始倒计时
    this.setData({
      showContractModal: true,
      countdown: 10,
      isAgreed: false
    });
    
    this.startCountdown();
  },

  // 关闭合同弹窗
  closeContract() {
    this.setData({
      showContractModal: false,
      countdown: 10,
      isAgreed: false
    });
    
    // 清理倒计时定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
      this.setData({
        countdownTimer: null
      });
    }
  },

  // 开始倒计时
  startCountdown() {
    const timer = setInterval(() => {
      const currentCountdown = this.data.countdown;
      if (currentCountdown > 0) {
        this.setData({
          countdown: currentCountdown - 1
        });
      } else {
        // 倒计时结束，清理定时器
        clearInterval(timer);
        this.setData({
          countdownTimer: null
        });
      }
    }, 1000);
    
    this.setData({
      countdownTimer: timer
    });
  },

  // 切换协议同意状态
  toggleAgreement() {
    // 只有倒计时结束后才能切换同意状态
    if (this.data.countdown === 0) {
      this.setData({
        isAgreed: !this.data.isAgreed
      });
    }
  },



  // 确认下单（显示订单确认弹窗）
  async confirmOrder() {
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

    // 检查手机号绑定状态
    if (!this.checkPhoneBindingStatus()) {
      my.showModal({
        title: '需要绑定手机号',
        content: '为了您的账户安全，下单前需要先绑定手机号，点击确定前往个人页面完成绑定。',
        confirmText: '去绑定',
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

    // 显示订单确认界面，先显示loading
    this.setData({
      showOrderConfirm: true,
      orderConfirmLoading: true
    });

    // 确保产品数据已加载（特别是支持期数）
    await this.ensureProductDataLoaded();
    
    // 数据加载完成，隐藏loading
    this.setData({
      orderConfirmLoading: false
    });
  },

  // 关闭订单确认弹窗
  closeOrderConfirm() {
    this.setData({
      showOrderConfirm: false,
      orderConfirmLoading: false
    });
  },

  // 显示材料提交弹窗
  async showMaterialSubmission() {
    // 关闭订单确认弹窗
    this.setData({
      showOrderConfirm: false
    });
    
    // 显示材料提交弹窗
    this.setData({
      showMaterialSubmission: true
    });
  },

  // 关闭材料提交弹窗
  closeMaterialSubmission() {
    this.setData({
      showMaterialSubmission: false
    });
  },

  // 直接提交订单（不显示协议弹窗）
  async submitOrderDirect() {
    try {
      // 检查是否所有材料都已上传
      if (!this.data.allMaterialsUploaded) {
        my.showToast({
          content: '请先上传所有必需的材料',
          type: 'fail'
        });
        return;
      }

      my.showLoading({
        content: '正在创建订单...'
      });

      // 获取用户信息
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      if (!userInfo.data || !userInfo.data.userId) {
        throw new Error('用户信息获取失败，请重新登录');
      }

      // 调用订单创建API，包含上传的材料URLs
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
            remark: null,
            rencheheyi_image: this.data.materialUrls.rencheheyi_image,
            chejiahao_image: this.data.materialUrls.chejiahao_image,
            zhimaxinyong_image: this.data.materialUrls.zhimaxinyong_image
          },
          success: resolve,
          fail: reject
        });
      });

      my.hideLoading();

      if (response.statusCode === 200 && response.data) {
        // 订单创建成功，关闭材料提交弹窗
        this.setData({
          showMaterialSubmission: false
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
  },

  // 选择图片
  selectImage(e) {
    const type = e.currentTarget.dataset.type;
    console.log('选择图片类型:', type);
    
    my.chooseImage({
      count: 1,
      sourceType: ['camera', 'album'],
      success: (res) => {
        console.log('选择图片成功:', res);
        const filePaths = res.tempFilePaths || res.filePaths || res.apFilePaths;
        if (filePaths && filePaths.length > 0) {
          // 先在界面上显示选中的图片
          console.log('设置本地图片路径:', type, filePaths[0]);
          this.setData({
            [`materialImages.${type}`]: filePaths[0]
          });
          console.log('设置后的materialImages:', this.data.materialImages);
          
          // 延迟一点再显示上传中状态，让用户先看到选中的图片
          setTimeout(() => {
            my.showLoading({
              content: '上传中...'
            });
            
            // 上传图片
            this.uploadImageFile(filePaths[0], type);
          }, 300);
        }
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        my.showToast({
          content: '选择图片失败',
          type: 'fail'
        });
      }
    });
  },

  // 上传图片文件
  async uploadImageFile(filePath, type) {
    try {
      console.log('开始上传图片:', filePath, type);
      
      // 获取访问令牌
      const accessToken = my.getStorageSync({ key: 'access_token' });
      
      const response = await new Promise((resolve, reject) => {
        my.uploadFile({
          url: `${config.api.baseUrl}/api/upload/image?folder=audit-images`,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${accessToken.data}`
          },
          success: resolve,
          fail: reject
        });
      });

      my.hideLoading();
      
      if (response.statusCode === 200) {
        const result = JSON.parse(response.data);
        console.log('上传成功:', result);
        
        // 保存上传后的URL
        const urlKey = this.getMaterialUrlKey(type);
        const uploadedUrl = result.url || (result.data && result.data.url);
        console.log('保存图片URL:', type, uploadedUrl);
        
        this.setData({
          [`materialUrls.${urlKey}`]: uploadedUrl,
          [`materialImages.${type}`]: uploadedUrl  // 同时更新界面显示的图片
        });
        
        console.log('当前materialImages:', this.data.materialImages);
        
        // 检查是否所有材料都已上传
        this.checkAllMaterialsUploaded();
        
        my.showToast({
          content: '上传成功',
          type: 'success'
        });
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      my.hideLoading();
      console.error('上传图片失败:', error);
      
      // 清除界面上的图片显示
      this.setData({
        [`materialImages.${type}`]: null
      });
      
      my.showToast({
        content: '上传失败，请重试',
        type: 'fail'
      });
    }
  },

  // 获取材料URL键名
  getMaterialUrlKey(type) {
    const keyMap = {
      'zhimaxinyong': 'zhimaxinyong_image',
      'rencheheyi': 'rencheheyi_image', 
      'chejiahao': 'chejiahao_image'
    };
    return keyMap[type];
  },

  // 检查是否所有材料都已上传
  checkAllMaterialsUploaded() {
    const urls = this.data.materialUrls;
    const allUploaded = urls.zhimaxinyong_image && urls.rencheheyi_image && urls.chejiahao_image;
    
    this.setData({
      allMaterialsUploaded: allUploaded
    });
    
    console.log('材料上传状态:', allUploaded, urls);
  },
});