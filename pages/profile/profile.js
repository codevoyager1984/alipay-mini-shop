const config = require('../../config.js');

Page({
  data: {
    // 默认头像
    defaultAvatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiIGZpbGw9IiNmNWY1ZjUiLz4KPHN2ZyB4PSIzMCIgeT0iMjUiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0yMCAxIDAtNmEyIDIgMCAwIDAtMi0ySDZhMiAyIDAgMCAwLTIgMnY2bTE2IDBoLTRsLTItM2gtNGwtMiAzSDQiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMyIgcj0iMyIvPgo8L3N2Zz4KPC9zdmc+',
    
    // 用户信息
    userInfo: {
      isLogin: false,
      nickname: '',
      avatar: '',
      phone: '',
      isVerified: false,
      realName: '',
      idCard: '',
      alipayUserId: '',
      userId: null
    },

    // 认证弹窗相关
    showAuthModal: false,
    authForm: {
      realName: '',
      idCard: ''
    }
  },

  onLoad(query) {
    console.info(`Profile page onLoad with query: ${JSON.stringify(query)}`);
    this.loadUserInfo();
  },

  onReady() {
    // 页面加载完成
  },

  onShow() {
    // 页面显示时重新加载用户信息
    this.loadUserInfo();
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
    // 页面被下拉
    this.loadUserInfo();
    setTimeout(() => {
      my.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    // 页面被拉到底部
  },

  onShareAppMessage() {
    return {
      title: '伟小保电瓶车租赁',
      desc: '倍受信赖的以租代购平台',
      path: 'pages/index/index',
    };
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      if (userInfo.data) {
        this.setData({
          userInfo: userInfo.data
        });
        
        // 如果用户已登录，尝试从后端获取最新用户信息
        if (userInfo.data.isLogin) {
          this.getUserProfile();
        }
      }
    } catch (e) {
      console.error('获取用户信息失败', e);
    }
  },

  // 保存用户信息
  saveUserInfo(userInfo) {
    try {
      my.setStorageSync({
        key: 'userInfo',
        data: userInfo
      });
      this.setData({
        userInfo: userInfo
      });
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
  },

  // 登录
  login() {
    my.getAuthCode({
      scopes: ['auth_user'],
      success: (authResult) => {
        console.log('获取授权码成功:', authResult);
        const authCode = authResult.authCode;
        
        // 获取用户信息
        my.getAuthUserInfo({
          success: (userInfoResult) => {
            console.log('获取用户信息成功:', userInfoResult);
            const { nickName, avatar } = userInfoResult;
            
            // 调用后端登录接口
            this.callBackendLogin(authCode, nickName, avatar);
          },
          fail: (error) => {
            console.error('获取用户信息失败:', error);
            my.showToast({
              content: '获取用户信息失败，请稍后重试',
              type: 'fail'
            });
          }
        });
      },
      fail: (error) => {
        console.error('登录失败:', error);
        my.showToast({
          content: '登录失败，请稍后重试',
          type: 'fail'
        });
      }
    });
  },

  // 调用后端登录接口
  callBackendLogin(authCode, nickname, avatarUrl) {
    my.showLoading({
      content: '登录中...'
    });

    my.request({
      url: config.api.baseUrl + config.api.endpoints.auth.alipayLogin,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        auth_code: authCode,
        nickname: nickname,
        avatar_url: avatarUrl
      },
      success: (response) => {
        my.hideLoading();
        console.log('后端登录成功:', response);
        
        if (response.statusCode === 200 && response.data) {
          const { access_token, user } = response.data;
          
          // 保存用户信息和token
          const userInfo = {
            ...this.data.userInfo,
            isLogin: true,
            nickname: user.nickname,
            avatar: user.avatar_url || avatarUrl,
            phone: user.phone,
            alipayUserId: user.alipay_user_id,
            userId: user.id
          };
          
          // 保存access_token到本地存储
          my.setStorageSync({
            key: 'access_token',
            data: access_token
          });
          
          this.saveUserInfo(userInfo);
          
          my.showToast({
            content: '登录成功！',
            type: 'success'
          });
        } else {
          throw new Error('登录响应数据格式错误');
        }
      },
      fail: (error) => {
        my.hideLoading();
        console.error('后端登录失败:', error);
        my.showToast({
          content: '登录失败，请稍后重试',
          type: 'fail'
        });
      }
    });
  },

  // 获取用户资料（从后端）
  getUserProfile() {
    try {
      const tokenResult = my.getStorageSync({ key: 'access_token' });
      if (!tokenResult.data) {
        console.log('未找到access_token，跳过获取用户资料');
        return;
      }

      my.request({
        url: config.api.baseUrl + config.api.endpoints.auth.profile,
        method: 'GET',
        headers: {
          'authorization': `Bearer ${tokenResult.data}`
        },
        success: (response) => {
          console.log('获取用户资料成功:', response);
          
          if (response.statusCode === 200 && response.data) {
            const userProfile = response.data;
            
            // 更新用户信息
            const userInfo = {
              ...this.data.userInfo,
              isLogin: true,
              nickname: userProfile.nickname,
              avatar: userProfile.avatar_url,
              phone: userProfile.phone,
              alipayUserId: userProfile.alipay_user_id,
              userId: userProfile.id
            };
            
            this.saveUserInfo(userInfo);
          }
        },
        fail: (error) => {
          console.error('获取用户资料失败:', error);
          // 如果token失效，清除登录状态
          if (error.status === 401) {
            this.logout();
          }
        }
      });
    } catch (e) {
      console.error('获取用户资料时发生错误:', e);
    }
  },

  // 获取手机号
  getPhoneNumber() {
    if (!this.data.userInfo.isLogin) {
      my.showToast({
        content: '请先登录',
        type: 'fail'
      });
      return;
    }

    my.getPhoneNumber({
      success: (phoneResult) => {
        console.log('获取手机号成功:', phoneResult);
        
        // 模拟手机号绑定成功
        const userInfo = {
          ...this.data.userInfo,
          phone: '138****' + Math.floor(Math.random() * 9000 + 1000)
        };
        
        this.saveUserInfo(userInfo);
        
        my.showToast({
          content: '手机号绑定成功！',
          type: 'success'
        });
      },
      fail: (error) => {
        console.error('获取手机号失败:', error);
        my.showToast({
          content: '获取手机号失败',
          type: 'fail'
        });
      }
    });
  },

  // 实名认证
  realNameAuth() {
    if (!this.data.userInfo.isLogin) {
      my.showToast({
        content: '请先登录',
        type: 'fail'
      });
      return;
    }

    this.setData({
      showAuthModal: true,
      authForm: {
        realName: '',
        idCard: ''
      }
    });
  },

  // 认证表单输入处理
  onAuthFormChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`authForm.${field}`]: value
    });
  },

  // 提交认证
  submitAuth() {
    const { realName, idCard } = this.data.authForm;
    
    if (!realName || !idCard) {
      my.showToast({
        content: '请填写完整信息',
        type: 'fail'
      });
      return;
    }

    // 简单的身份证号验证
    const idCardReg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    if (!idCardReg.test(idCard)) {
      my.showToast({
        content: '身份证号格式不正确',
        type: 'fail'
      });
      return;
    }

    my.showLoading({
      content: '认证中...'
    });

    // 模拟认证过程
    setTimeout(() => {
      my.hideLoading();
      
      const userInfo = {
        ...this.data.userInfo,
        isVerified: true,
        realName: realName,
        idCard: idCard
      };
      
      this.saveUserInfo(userInfo);
      this.closeAuthModal();
      
      my.showToast({
        content: '实名认证成功！',
        type: 'success'
      });
    }, 2000);
  },

  // 关闭认证弹窗
  closeAuthModal() {
    this.setData({
      showAuthModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 查看个人资料
  viewProfile() {
    if (!this.data.userInfo.isLogin) {
      my.showToast({
        content: '请先登录',
        type: 'fail'
      });
      return;
    }

    const { nickname, phone, isVerified, realName } = this.data.userInfo;
    const content = `昵称：${nickname}\n手机号：${phone || '未绑定'}\n实名认证：${isVerified ? '已认证' : '未认证'}${isVerified ? `\n真实姓名：${realName}` : ''}`;
    
    my.showModal({
      title: '个人资料',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 联系客服
  contactService() {
    my.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：09:00-18:00',
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

  // 关于我们
  about() {
    my.showModal({
      title: '关于我们',
      content: '伟小保新能源\n倍受信赖的以租代购平台\n\n地址：浙江省 温州市龙湾区雁荡西路267号鸿福家园\n营业时间：09:00-18:00\n客服电话：400-123-4567',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 退出登录
  logout() {
    my.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (result) => {
        if (result.confirm) {
          try {
            my.removeStorageSync({ key: 'userInfo' });
            my.removeStorageSync({ key: 'access_token' });
            this.setData({
              userInfo: {
                isLogin: false,
                nickname: '',
                avatar: '',
                phone: '',
                isVerified: false,
                realName: '',
                idCard: '',
                alipayUserId: '',
                userId: null
              }
            });
            
            my.showToast({
              content: '已退出登录',
              type: 'success'
            });
          } catch (e) {
            console.error('退出登录失败', e);
          }
        }
      }
    });
  }
});
