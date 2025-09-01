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

    // 打码的手机号
    maskedPhone: '',
    
    // 联系信息
    contactInfo: {
      isComplete: false
    },
    

    
    // 全局配置信息
    globalConfig: null
  },

  onLoad(query) {
    console.info(`Profile page onLoad with query: ${JSON.stringify(query)}`);
    this.loadGlobalConfig();
    this.loadUserInfo();
  },

  onReady() {
    // 页面加载完成
  },

  onShow() {
    // 页面显示时重新加载用户信息
    this.loadGlobalConfig();
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
    // 清除配置缓存，重新加载配置
    config.clearConfigCache();
    this.loadGlobalConfig();
    this.loadUserInfo();
    setTimeout(() => {
      my.stopPullDownRefresh();
    }, 1000);
  },

  onReachBottom() {
    // 页面被拉到底部
  },

  onShareAppMessage() {
    const { globalConfig } = this.data;
    
    // 使用动态配置的关于我们信息作为描述
    const desc = globalConfig ? globalConfig.about_us : '倍受信赖的以租代购平台';
    
    return {
      title: '微小租新能源',
      desc: desc,
      path: 'pages/index/index',
    };
  },

  // 加载全局配置
  async loadGlobalConfig() {
    try {
      const globalConfig = await config.getGlobalConfig();
      this.setData({
        globalConfig: globalConfig
      });
      console.log('Profile页面全局配置加载成功:', globalConfig);
    } catch (error) {
      console.error('Profile页面加载全局配置失败:', error);
    }
  },

  // 加载用户信息
  loadUserInfo() {
    try {
      const userInfo = my.getStorageSync({ key: 'userInfo' });
      if (userInfo.data) {
        this.setData({
          userInfo: userInfo.data,
          maskedPhone: this.maskPhoneNumber(userInfo.data.phone)
        });
        
        // 如果用户已登录，尝试从后端获取最新用户信息
        if (userInfo.data.isLogin) {
          this.getUserProfile();
          this.loadContactInfo();
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
        userInfo: userInfo,
        maskedPhone: this.maskPhoneNumber(userInfo.phone)
      });
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
  },

  // 手机号打码处理
  maskPhoneNumber(phone) {
    if (!phone || phone.length !== 11) {
      return '';
    }
    // 显示前3位和后4位，中间用****替代
    return phone.substring(0, 3) + '****' + phone.substring(7);
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
            userId: user.id,
            isVerified: user.is_certified || false
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
            
            // 更新用户信息，使用服务器返回的 is_certified 字段
            const userInfo = {
              ...this.data.userInfo,
              isLogin: true,
              nickname: userProfile.nickname,
              avatar: userProfile.avatar_url,
              phone: userProfile.phone,
              isVerified: userProfile.is_certified || false,  // 使用服务器返回的认证状态
              realName: userProfile.id_card_name || '',
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

  // 用户同意授权手机号回调
  onGetPhoneAuthorize(authResult) {
    console.log('用户授权手机号成功:', authResult);
    
    if (!this.data.userInfo.isLogin) {
      my.showToast({
        content: '请先登录',
        type: 'fail'
      });
      return;
    }

    // 用户已授权，直接调用获取手机号API
    this.callGetPhoneNumberAPI();
  },

  // 用户拒绝授权手机号回调
  onGetPhoneError(error) {
    console.log('用户拒绝授权手机号:', error);
    
    my.showToast({
      content: '需要手机号授权才能绑定账户',
      type: 'fail'
    });
  },

  // 调用获取手机号API
  callGetPhoneNumberAPI() {
    // 使用支付宝官方API获取手机号
    my.getPhoneNumber({
      success: (phoneResult) => {
        console.log('获取手机号成功:', phoneResult);
        
        // 检查返回的数据是否包含错误信息
        if (phoneResult.response) {
          try {
            // 尝试解析response，检查是否有错误
            const responseData = JSON.parse(phoneResult.response);
            if (responseData.code && responseData.code !== '10000') {
              // API返回了错误信息
              this.handlePhoneNumberError(responseData);
              return;
            }
          } catch (e) {
            // response不是JSON格式，说明是正常的加密数据
            console.log('response是加密数据，继续处理');
          }
          
          // 将加密数据发送到后端进行绑定
          this.bindPhoneNumber(phoneResult);
        } else {
          my.showToast({
            content: '获取手机号数据失败',
            type: 'fail'
          });
        }
      },
      fail: (error) => {
        console.error('获取手机号失败:', error);
        
        // 根据错误类型显示不同的提示信息
        let errorMessage = '获取手机号失败';
        
        if (error.error === 4) {
          errorMessage = '用户拒绝授权';
        } else if (error.error === 10) {
          errorMessage = '网络异常，请重试';
        } else if (error.error === 11) {
          errorMessage = '用户取消操作';
        }
        
        my.showToast({
          content: errorMessage,
          type: 'fail'
        });
      }
    });
  },

  // 处理获取手机号的API错误
  handlePhoneNumberError(errorData) {
    console.error('获取手机号API错误:', errorData);
    
    let errorMessage = '获取手机号失败';
    let showConfig = false;
    
    switch (errorData.code) {
      case '40001':
        if (errorData.subCode === 'isv.missing-encrypt-key') {
          errorMessage = '小程序未配置手机号获取功能';
          showConfig = true;
        } else {
          errorMessage = '参数配置错误';
          showConfig = true;
        }
        break;
      case '40002':
        errorMessage = '权限不足，请联系管理员';
        break;
      case '40003':
        errorMessage = '应用未上线或已下线';
        break;
      default:
        errorMessage = `获取失败: ${errorData.msg || '未知错误'}`;
    }
    
    if (showConfig) {
      // 显示配置说明
      my.showModal({
        title: '功能配置提示',
        content: `${errorMessage}\n\n请在支付宝开放平台小程序管理后台：\n1. 添加"获取会员手机号"功能包\n2. 配置加密密钥\n3. 重新发布小程序`,
        confirmText: '知道了',
        showCancel: false
      });
    } else {
      my.showToast({
        content: errorMessage,
        type: 'fail'
      });
    }
  },

  // 绑定手机号
  bindPhoneNumber(phoneResult) {
    try {
      const tokenResult = my.getStorageSync({ key: 'access_token' });
      if (!tokenResult.data) {
        my.showToast({
          content: '请重新登录',
          type: 'fail'
        });
        return;
      }

      my.showLoading({
        content: '绑定手机号中...'
      });

      // 准备发送到后端的数据
      // 如果phoneResult.response是JSON字符串，需要解析
      // 如果是加密字符串，直接使用
      let requestData;
      
      try {
        // 尝试解析response，看是否是JSON格式
        const parsedResponse = JSON.parse(phoneResult.response);
        
        // 如果解析成功且包含response和sign字段，使用解析后的数据
        if (parsedResponse.response && parsedResponse.sign) {
          requestData = {
            response: parsedResponse.response,
            sign: parsedResponse.sign
          };
        } else {
          // 如果解析后的数据格式不正确，使用原始数据
          requestData = {
            response: phoneResult.response,
            sign: phoneResult.sign
          };
        }
      } catch (e) {
        // 如果解析失败，说明response是加密字符串，直接使用
        requestData = {
          response: phoneResult.response,
          sign: phoneResult.sign
        };
      }

      my.request({
        url: config.api.baseUrl + config.api.endpoints.auth.bindPhone,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${tokenResult.data}`
        },
        data: requestData,
        success: (response) => {
          my.hideLoading();
          console.log('绑定手机号成功:', response);
          
          if (response.statusCode === 200 && response.data) {
            const responseData = response.data;
            
            if (responseData.success && responseData.phone) {
              // 更新本地用户信息
              const userInfo = {
                ...this.data.userInfo,
                phone: responseData.phone
              };
              
              this.saveUserInfo(userInfo);
              
              my.showToast({
                content: responseData.message || '手机号绑定成功！',
                type: 'success'
              });
            } else {
              my.showToast({
                content: responseData.message || '手机号绑定失败',
                type: 'fail'
              });
            }
          } else {
            throw new Error('绑定响应数据格式错误');
          }
        },
        fail: (error) => {
          my.hideLoading();
          console.error('绑定手机号失败:', error);
          
          let errorMessage = '手机号绑定失败，请稍后重试';
          if (error.status === 401) {
            errorMessage = '登录已过期，请重新登录';
            this.logout();
          }
          
          my.showToast({
            content: errorMessage,
            type: 'fail'
          });
        }
      });
    } catch (e) {
      my.hideLoading();
      console.error('绑定手机号时发生错误:', e);
      my.showToast({
        content: '操作失败，请稍后重试',
        type: 'fail'
      });
    }
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

    // 跳转到认证页面
    my.navigateTo({
      url: '/pages/auth/auth'
    });
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

  // 关于我们
  about() {
    const { globalConfig } = this.data;
    
    // 使用动态配置的信息
    const aboutUs = globalConfig ? globalConfig.about_us : '微小租新能源\n倍受信赖的以租代购平台';
    const address = globalConfig ? globalConfig.location_text : '浙江省 温州市龙湾区雁荡西路267号鸿福家园';
    const businessHours = globalConfig ? globalConfig.business_hours : '09:00-18:00';
    const phoneNumber = globalConfig ? globalConfig.contact_info : '400-123-4567';

    my.showModal({
      title: '关于我们',
      content: `${aboutUs}\n\n地址：${address}\n营业时间：${businessHours}\n客服电话：${phoneNumber}`,
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
          console.log('获取联系信息成功:', response);
          
          if (response.statusCode === 200 && response.data && response.data.contacts) {
            const contacts = response.data.contacts;
            
            // 检查联系信息是否完整（至少有2个完整的联系人）
            const validContacts = contacts.filter(contact => 
              contact.relation_type && contact.relation_name && contact.relation_phone
            );
            const isComplete = validContacts.length >= 2;
            
            const contactInfo = {
              isComplete: isComplete
            };
            
            this.setData({
              contactInfo: contactInfo
            });
          }
        },
        fail: (error) => {
          console.error('获取联系信息失败:', error);
        }
      });
    } catch (e) {
      console.error('加载联系信息时发生错误:', e);
    }
  },



  // 跳转到联系信息编辑页面
  goToContactEdit() {
    if (!this.data.userInfo.isLogin) {
      my.showToast({
        content: '请先登录',
        type: 'fail'
      });
      return;
    }

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
  }
});
