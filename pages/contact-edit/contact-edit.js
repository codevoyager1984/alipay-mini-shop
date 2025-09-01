const config = require('../../config.js');

Page({
  data: {
    // 联系信息表单 - 最少2组
    contacts: [
      { 
        relationship: '', 
        name: '', 
        phone: '',
        relationshipOptions: ['父母', '兄弟姐妹', '朋友', '同事']
      },
      { 
        relationship: '', 
        name: '', 
        phone: '',
        relationshipOptions: ['父母', '兄弟姐妹', '朋友', '同事']
      }
    ],
    
    // 关系选择器状态
    relationshipPickerVisible: false,
    currentContactIndex: 0,
    selectedRelationshipIndex: 0,
    
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
        console.log('未找到access_token，使用默认表单');
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
            const contactsData = response.data.contacts;
            
            // 转换字段名并确保至少有2组联系人
            const contacts = contactsData.map(contact => ({
              relationship: contact.relation_type || '',
              name: contact.relation_name || '',
              phone: contact.relation_phone || '',
              relationshipOptions: ['父母', '兄弟姐妹', '朋友', '同事']
            }));
            
            // 确保至少有2组联系人
            while (contacts.length < 2) {
              contacts.push({
                relationship: '',
                name: '',
                phone: '',
                relationshipOptions: ['父母', '兄弟姐妹', '朋友', '同事']
              });
            }
            
            this.setData({
              contacts: contacts
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
  onContactInput(e) {
    const { field, index } = e.target.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`contacts[${index}].${field}`]: value
    });
  },

  // 显示关系选择器
  showRelationshipPicker(e) {
    const { index } = e.target.dataset;
    const { contacts } = this.data;
    const currentContact = contacts[parseInt(index)];
    
    // 找到当前选中的关系的索引
    let selectedIndex = 0;
    if (currentContact.relationship) {
      selectedIndex = currentContact.relationshipOptions.indexOf(currentContact.relationship);
      if (selectedIndex === -1) selectedIndex = 0;
    }
    
    this.setData({
      relationshipPickerVisible: true,
      currentContactIndex: parseInt(index),
      selectedRelationshipIndex: selectedIndex
    });
  },

  // 选择关系选项
  selectRelationship(e) {
    const { index } = e.target.dataset;
    this.setData({
      selectedRelationshipIndex: parseInt(index)
    });
  },

  // 确认选择关系
  confirmRelationship() {
    const { currentContactIndex, selectedRelationshipIndex, contacts } = this.data;
    const selectedRelationship = contacts[currentContactIndex].relationshipOptions[selectedRelationshipIndex];
    
    this.setData({
      [`contacts[${currentContactIndex}].relationship`]: selectedRelationship,
      relationshipPickerVisible: false
    });
  },

  // 关系选择器取消
  onRelationshipCancel() {
    this.setData({
      relationshipPickerVisible: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击事件冒泡
  },

  // 添加联系人
  addContact() {
    const { contacts } = this.data;

    const newContact = {
      relationship: '',
      name: '',
      phone: '',
      relationshipOptions: ['父母', '兄弟姐妹', '朋友', '同事']
    };

    this.setData({
      contacts: [...contacts, newContact]
    });
  },

  // 删除联系人
  removeContact(e) {
    const { index } = e.target.dataset;
    const { contacts } = this.data;
    
    if (contacts.length <= 2) {
      my.showToast({
        content: '至少需要保留2组联系人',
        type: 'fail'
      });
      return;
    }

    contacts.splice(index, 1);
    this.setData({
      contacts: contacts
    });
  },

  // 保存联系信息
  saveContactInfo() {
    const { contacts } = this.data;
    
    // 强制要求：所有联系人必须完整填写，不允许空白项
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // 每个联系人都必须完整填写
      if (!contact.relationship) {
        my.showToast({
          content: `第${i + 1}联系人请选择关系`,
          type: 'fail'
        });
        return;
      }
      
      if (!contact.name || !contact.name.trim()) {
        my.showToast({
          content: `第${i + 1}联系人请填写姓名`,
          type: 'fail'
        });
        return;
      }
      
      if (!contact.phone || !contact.phone.trim()) {
        my.showToast({
          content: `第${i + 1}联系人请填写手机号`,
          type: 'fail'
        });
        return;
      }
      
      // 验证手机号格式
      if (!this.validatePhone(contact.phone)) {
        my.showToast({
          content: `第${i + 1}联系人手机号格式不正确`,
          type: 'fail'
        });
        return;
      }
    }
    
    // 确保至少有2组联系人
    if (contacts.length < 2) {
      my.showToast({
        content: '至少需要填写2组联系人信息',
        type: 'fail'
      });
      return;
    }

    // 转换所有联系人字段名（此时已经验证过都是完整的）
    const validContacts = contacts.map(contact => ({
      relation_type: contact.relationship,
      relation_name: contact.name.trim(),
      relation_phone: contact.phone.trim()
    }));

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
        url: config.api.baseUrl + config.api.endpoints.contacts.list,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${tokenResult.data}`
        },
        data: {
          contacts: validContacts
        },
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

  // 验证手机号格式
  validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }
});
