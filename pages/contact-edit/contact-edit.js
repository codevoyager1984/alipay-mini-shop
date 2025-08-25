const config = require('../../config.js');

Page({
  data: {
    // 联系信息表单
    contactForm: {
      email: '',
      contact_address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      social_account: ''
    },
    
    // 加载状态
    loading: false
  },

  onLoad(query) {
    console.info(`Contact edit page onLoad with query: ${JSON.stringify(query)}`);
    this.loadContactInfo();
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

  // 加载已有的联系信息
  loadContactInfo() {
    try {
      const tokenResult = my.getStorageSync({ key: 'access_token' });
      if (!tokenResult.data) {
        console.log('未找到access_token，使用空白表单');
        return;
      }

      my.request({
        url: config.api.baseUrl + config.api.endpoints.auth.profile,
        method: 'GET',
        headers: {
          'authorization': `Bearer ${tokenResult.data}`
        },
        success: (response) => {
          console.log('获取联系信息成功:', response);
          
          if (response.statusCode === 200 && response.data) {
            const userProfile = response.data;
            
            const contactForm = {
              email: userProfile.email || '',
              contact_address: userProfile.contact_address || '',
              emergency_contact_name: userProfile.emergency_contact_name || '',
              emergency_contact_phone: userProfile.emergency_contact_phone || '',
              social_account: userProfile.social_account || ''
            };
            
            this.setData({
              contactForm: contactForm
            });
          }
        },
        fail: (error) => {
          console.error('获取联系信息失败:', error);
          my.showToast({
            content: '获取信息失败，请稍后重试',
            type: 'fail'
          });
        }
      });
    } catch (e) {
      console.error('加载联系信息时发生错误:', e);
    }
  },

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.target.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`contactForm.${field}`]: value
    });
  },

  // 保存联系信息
  saveContactInfo() {
    const { contactForm } = this.data;
    
    // 验证必填字段
    if (!contactForm.contact_address || !contactForm.contact_address.trim()) {
      my.showToast({
        content: '请填写联系地址',
        type: 'fail'
      });
      return;
    }
    
    if (!contactForm.emergency_contact_name || !contactForm.emergency_contact_name.trim()) {
      my.showToast({
        content: '请填写紧急联系人姓名',
        type: 'fail'
      });
      return;
    }
    
    if (!contactForm.emergency_contact_phone || !contactForm.emergency_contact_phone.trim()) {
      my.showToast({
        content: '请填写紧急联系人电话',
        type: 'fail'
      });
      return;
    }
    
    // 验证紧急联系人电话格式（必填字段）
    if (!this.validatePhone(contactForm.emergency_contact_phone)) {
      my.showToast({
        content: '请输入正确的紧急联系人电话格式',
        type: 'fail'
      });
      return;
    }
    
    // 验证邮箱格式（如果填写了邮箱）
    if (contactForm.email && !this.validateEmail(contactForm.email)) {
      my.showToast({
        content: '请输入正确的邮箱格式',
        type: 'fail'
      });
      return;
    }

    try {
      const tokenResult = my.getStorageSync({ key: 'access_token' });
      if (!tokenResult.data) {
        my.showToast({
          content: '请重新登录',
          type: 'fail'
        });
        return;
      }

      this.setData({ loading: true });

      my.request({
        url: config.api.baseUrl + config.api.endpoints.auth.contactInfo,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${tokenResult.data}`
        },
        data: contactForm,
        success: (response) => {
          this.setData({ loading: false });
          console.log('保存联系信息成功:', response);
          
          if (response.statusCode === 200) {
            my.showToast({
              content: '联系信息保存成功！',
              type: 'success'
            });
            
            // 延迟返回上一页
            setTimeout(() => {
              my.navigateBack();
            }, 1500);
          } else {
            throw new Error('保存响应数据格式错误');
          }
        },
        fail: (error) => {
          this.setData({ loading: false });
          console.error('保存联系信息失败:', error);
          
          let errorMessage = '保存失败，请稍后重试';
          if (error.status === 401) {
            errorMessage = '登录已过期，请重新登录';
          }
          
          my.showToast({
            content: errorMessage,
            type: 'fail'
          });
        }
      });
    } catch (e) {
      this.setData({ loading: false });
      console.error('保存联系信息时发生错误:', e);
      my.showToast({
        content: '操作失败，请稍后重试',
        type: 'fail'
      });
    }
  },

  // 验证邮箱格式
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // 验证手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
});
