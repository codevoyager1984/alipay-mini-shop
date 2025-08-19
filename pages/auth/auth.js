const config = require('../../config.js');

Page({
  data: {
    // 认证表单数据
    authForm: {
      realName: '',
      idCard: ''
    },
    
    // 提交状态
    isSubmitting: false,
    loadingText: '正在初始化认证...'
  },

  onLoad(query) {
    console.info(`Auth page onLoad with query: ${JSON.stringify(query)}`);
    
    // 检查登录状态
    this.checkLoginStatus();
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

  // 检查登录状态
  checkLoginStatus() {
    try {
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      if (!userInfo.data || !userInfo.data.isLogin) {
        my.showModal({
          title: '登录提示',
          content: '请先登录后再进行实名认证',
          confirmText: '去登录',
          cancelText: '取消',
          success: (result) => {
            if (result.confirm) {
              my.navigateTo({ url: '/pages/profile/profile' });
            } else {
              my.navigateBack();
            }
          }
        });
        return;
      }
      
      // 检查是否已经认证
      if (userInfo.data.isVerified) {
        my.showModal({
          title: '提示',
          content: '您已完成实名认证',
          confirmText: '返回',
          showCancel: false,
          success: () => {
            my.navigateBack();
          }
        });
      }
    } catch (e) {
      console.error('检查登录状态失败', e);
      my.showToast({
        content: '获取登录状态失败',
        type: 'fail'
      });
    }
  },

  // 表单输入处理
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`authForm.${field}`]: value
    });
  },

  // 验证身份证号格式
  validateIdCard(idCard) {
    // 18位身份证号正则验证
    const idCardReg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardReg.test(idCard);
  },

  // 验证真实姓名格式
  validateRealName(realName) {
    // 中文姓名验证，支持2-20个中文字符，包括少数民族的·字符
    const nameReg = /^[\u4e00-\u9fa5·]{2,20}$/;
    return nameReg.test(realName);
  },

  // 提交认证
  async submitAuth() {
    const { realName, idCard } = this.data.authForm;
    
    // 基础验证
    if (!realName.trim()) {
      my.showToast({
        content: '请输入真实姓名',
        type: 'fail'
      });
      return;
    }
    
    if (!idCard.trim()) {
      my.showToast({
        content: '请输入身份证号',
        type: 'fail'
      });
      return;
    }

    // 格式验证
    if (!this.validateRealName(realName.trim())) {
      my.showToast({
        content: '请输入正确的中文姓名',
        type: 'fail'
      });
      return;
    }

    if (!this.validateIdCard(idCard.trim())) {
      my.showToast({
        content: '请输入正确的18位身份证号',
        type: 'fail'
      });
      return;
    }

    // 开始认证流程
    this.setData({
      isSubmitting: true,
      loadingText: '正在初始化认证...'
    });

    try {
      // 调用认证初始化接口
      const certifyData = await this.initializeCertify(realName.trim(), idCard.trim());
      
      if (certifyData && certifyData.certify_id && certifyData.certify_url) {
        // 更新加载文本
        this.setData({
          loadingText: '正在启动身份验证...'
        });
        
        // 启动支付宝身份验证
        await this.startAlipayVerification(certifyData.certify_id, certifyData.certify_url);
      } else {
        throw new Error('认证初始化返回数据不完整');
      }
    } catch (error) {
      console.error('认证失败:', error);
      this.setData({
        isSubmitting: false
      });
      
      my.showToast({
        content: error.message || '认证失败，请稍后重试',
        type: 'fail'
      });
    }
  },

  // 调用认证初始化接口
  initializeCertify(certName, certNo) {
    return new Promise((resolve, reject) => {
      try {
        const tokenResult = my.getStorageSync({ key: 'access_token' });
        if (!tokenResult.data) {
          reject(new Error('登录已过期，请重新登录'));
          return;
        }

        my.request({
          url: config.api.baseUrl + config.api.endpoints.auth.certifyInitialize,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${tokenResult.data}`
          },
          data: {
            cert_name: certName,
            cert_no: certNo
          },
          success: (response) => {
            console.log('认证初始化响应:', response);
            
            if (response.statusCode === 200 && response.data) {
              const responseData = response.data;
              
              if (responseData.success) {
                resolve(responseData);
              } else {
                reject(new Error(responseData.message || '认证初始化失败'));
              }
            } else {
              reject(new Error('服务器响应异常'));
            }
          },
          fail: (error) => {
            console.error('认证初始化请求失败:', error);
            
            let errorMessage = '网络请求失败，请检查网络连接';
            if (error.status === 401) {
              errorMessage = '登录已过期，请重新登录';
            } else if (error.status === 400) {
              errorMessage = '请求参数错误，请检查输入信息';
            } else if (error.status >= 500) {
              errorMessage = '服务器异常，请稍后重试';
            }
            
            reject(new Error(errorMessage));
          }
        });
      } catch (e) {
        console.error('认证初始化过程中发生错误:', e);
        reject(new Error('认证初始化失败'));
      }
    });
  },

  // 启动支付宝身份验证
  startAlipayVerification(certifyId, certifyUrl) {
    return new Promise((resolve, reject) => {
      my.startAPVerify({
        url: certifyUrl,
        certifyId: certifyId,
        success: (res) => {
          console.log('支付宝身份验证成功:', res);
          this.handleVerificationResult(res, resolve, reject);
        },
        fail: (res) => {
          console.log('支付宝身份验证失败:', res);
          this.setData({
            isSubmitting: false
          });
          
          let errorMessage = '身份验证失败';
          if (res.error === 6001) {
            errorMessage = '用户取消了身份验证';
          } else if (res.error === 6002) {
            errorMessage = '网络异常，请检查网络连接';
          } else if (res.error === 4000) {
            errorMessage = '验证过程中出现异常';
          }
          
          reject(new Error(errorMessage));
        },
        complete: (res) => {
          console.log('支付宝身份验证完成:', res);
        }
      });
    });
  },

  // 处理验证结果
  handleVerificationResult(verifyResult, resolve, reject) {
    console.log('处理验证结果:', verifyResult);
    
    this.setData({
      isSubmitting: false
    });

    if (!verifyResult || !verifyResult.resultStatus) {
      reject(new Error('验证结果数据异常'));
      return;
    }

    const { resultStatus, result } = verifyResult;

    switch (resultStatus) {
      case '9000':
        // 认证完成（需要后端再次确认最终状态）
        this.showSuccessAndGoBack();
        resolve();
        break;
        
      case '6001':
        reject(new Error('用户取消了身份验证'));
        break;
        
      case '6002':
        reject(new Error('网络异常，请检查网络连接'));
        break;
        
      case '4000':
        let errorMessage = '验证过程中出现异常';
        if (result && result.errorCode) {
          switch (result.errorCode) {
            case 'USER_IS_NOT_CERTIFY':
              errorMessage = '用户未完成身份验证';
              break;
            case 'SYSTEM_ERROR':
              errorMessage = '系统异常，请稍后重试';
              break;
            case 'UNKNOWN_ERROR':
              errorMessage = '未知错误，请稍后重试';
              break;
            default:
              errorMessage = `验证失败: ${result.errorCode}`;
          }
        }
        reject(new Error(errorMessage));
        break;
        
      default:
        reject(new Error(`未知的验证状态: ${resultStatus}`));
    }
  },

  // 显示成功提示并返回
  showSuccessAndGoBack() {
    try {
      // 更新本地用户信息的认证状态
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      if (userInfo.data) {
        const updatedUserInfo = {
          ...userInfo.data,
          isVerified: true,
          realName: this.data.authForm.realName.trim(),
          idCard: this.data.authForm.idCard.trim()
        };
        
        my.setStorageSync({
          key: 'userInfo',
          data: updatedUserInfo
        });
      }
    } catch (e) {
      console.error('更新本地用户信息失败:', e);
    }

    my.showModal({
      title: '认证成功',
      content: '恭喜您！实名认证已完成，现在可以享受更多服务了。',
      confirmText: '确定',
      showCancel: false,
      success: () => {
        // 返回上一页
        my.navigateBack();
      }
    });
  }
});
