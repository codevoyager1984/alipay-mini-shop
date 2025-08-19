Page({
  data: {
    activeTab: 'all',
    orders: [
      {
        id: 1,
        orderNo: 'WXB202312010001',
        vehicleName: '贵阳小牛系列(编号：4699)',
        vehicleImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ii8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyMGw4LThoMjBsOCA4aDIwbDIwIDIwdjEwSDYweiIgZmlsbD0iIzk5OSIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRMMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
        createTime: '2023-12-01 14:30',
        rentalPeriod: '1个月',
        totalPrice: '802.00',
        status: 'ongoing',
        statusText: '租赁中'
      },
      {
        id: 2,
        orderNo: 'WXB202311280002',
        vehicleName: '成都电动车（编号：2000)',
        vehicleImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ii8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iI2Y0NDMzNiIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRMMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
        createTime: '2023-11-28 10:15',
        rentalPeriod: '1个月',
        totalPrice: '434.00',
        status: 'completed',
        statusText: '已完成'
      },
      {
        id: 3,
        orderNo: 'WXB202312020003',
        vehicleName: '雅迪电动车（编号：3001)',
        vehicleImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjVmNWY1Ii8+CjxwYXRoIGQ9Im02MCA4MCAyMC0yMGgyOGw4LThoMjBsOCA4aDI4bDIwIDIwdjEwSDYweiIgZmlsbD0iIzRjYWY1MCIvPgo8Y2lyY2xlIGN4PSI3MCIgY3k9IjkwIiByPSIxMCIgZmlsbD0iIzMzMyIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSI5MCIgcj0iMTAiIGZpbGw9IiMzMzMiLz4KPHN2ZyB4PSI5MCIgeT0iNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+CjxwYXRoIGQ9Im0xMiAzLTEuOTEyIDUuODEzYS4xMDIuMTAyIDAgMCAxLS4wOTYuMDY5SDE1YTEgMSAwIDAgMSAuNzA3IDEuNzA3bC0yIDJhMSAxIDAgMCAwIDAgMS40MTRMMTYgMTZhMSAxIDAgMCAxLS43MDcuNzA3bC00IDRhMSAxIDAgMCAxLTEuNDE0IDAtNGE0IDQgMCAwIDEgMC0xLjQxNGwyLTJhMSAxIDAgMCAxIDEuNDE0IDAiLz4KPC9zdmc+CjwvdGV4dD4K',
        createTime: '2023-12-02 16:45',
        rentalPeriod: '2个月',
        totalPrice: '1376.00',
        status: 'pending',
        statusText: '待支付'
      }
    ],
    filteredOrders: []
  },

  onLoad(query) {
    console.info(`Orders page onLoad with query: ${JSON.stringify(query)}`);
    this.filterOrders();
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
    return {
      title: '我的订单',
      desc: '查看电瓶车租赁订单',
      path: 'pages/orders/orders',
    };
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    this.filterOrders();
  },

  // 筛选订单
  filterOrders() {
    let filtered = this.data.orders;
    
    if (this.data.activeTab === 'ongoing') {
      filtered = this.data.orders.filter(order => 
        order.status === 'ongoing' || order.status === 'pending'
      );
    } else if (this.data.activeTab === 'completed') {
      filtered = this.data.orders.filter(order => 
        order.status === 'completed'
      );
    }
    
    this.setData({
      filteredOrders: filtered
    });
  },

  // 联系客服
  contactService(e) {
    const order = e.currentTarget.dataset.order;
    my.showModal({
      title: '联系客服',
      content: `需要咨询订单 ${order.orderNo} 相关问题吗？`,
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

  // 支付订单
  payOrder(e) {
    const order = e.currentTarget.dataset.order;
    my.showLoading({
      content: '正在支付...'
    });

    // 模拟支付过程
    setTimeout(() => {
      my.hideLoading();
      
      // 更新订单状态
      const orders = this.data.orders.map(item => {
        if (item.id === order.id) {
          return {
            ...item,
            status: 'ongoing',
            statusText: '租赁中'
          };
        }
        return item;
      });
      
      this.setData({
        orders: orders
      });
      this.filterOrders();
      
      my.showToast({
        content: '支付成功！',
        type: 'success'
      });
    }, 2000);
  },

  // 续租订单
  renewOrder(e) {
    const order = e.currentTarget.dataset.order;
    my.showModal({
      title: '续租订单',
      content: `确定要续租 ${order.vehicleName} 一个月吗？费用：¥${order.totalPrice.split('.')[0]}.00`,
      confirmText: '确认续租',
      cancelText: '取消',
      success: (result) => {
        if (result.confirm) {
          my.showToast({
            content: '续租成功！',
            type: 'success'
          });
        }
      }
    });
  },

  // 查看订单详情
  viewOrder(e) {
    const order = e.currentTarget.dataset.order;
    my.showModal({
      title: '订单详情',
      content: `订单号：${order.orderNo}\n车辆：${order.vehicleName}\n租赁时间：${order.createTime}\n租期：${order.rentalPeriod}\n总费用：¥${order.totalPrice}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 去租车
  goToRent() {
    my.switchTab({
      url: '/pages/index/index'
    });
  }
});
