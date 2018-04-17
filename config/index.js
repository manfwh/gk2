module.exports = {
  appid: 'wxb0ce7dd74bfa7015',
  secret: '32dc6fdd54a89b66f098783da2fe6ea6',
  // mongodbUrl:'mongodb://yidou:a199210206@ds063536.mlab.com:63536/gaokao',
  mongodbUrl: 'mongodb://localhost/gongkao',
  url: 'https://xcx.sunpun.com',
  host: '192.168.31.204',
  port: 3000,
  tel: 18735127172,
  wechat: ['symm33', 'yxd3417'],
  template_id: 'N1o2a1RPpzExxUQ9nGVB7xbf5l1efKResYr99FWikgs',
  day: 6, // 默认6天后发送模板消息
  template: {
    "keyword1": {
      "value": '公务员面试资格',
      "color": "#fb0303"
    },
    "keyword2": {
      "value": '恭喜您获得公务员考试面试资格',
      "color": "#000"
    },
    "keyword3": {
      "value": '点击查看详情',
      "color": "#000"
    }
  }
}