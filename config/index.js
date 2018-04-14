module.exports = {
  appid: 'wx42440125bfabc34f',
  secret: 'f3ddf0eebfaea4419c32c71a9b60ab69',
  // mongodbUrl:'mongodb://yidou:a199210206@ds063536.mlab.com:63536/gaokao',
  mongodbUrl: 'mongodb://localhost/gongkao',
  url: 'http://192.168.31.204:3000',
  host: '192.168.31.204',
  port: 3000,
  template_id: '-NNE30zgta--97raIBLxpE1H9-mwi37OnYFX7zr2LXk',
  day: 6, // 默认6天后发送模板消息
  template: {
    "keyword1": {
      "value": '恭喜您获得公务员考试面试资格',
      "color": "#000"
    },
    "keyword2": {
      "value": '点击查看详情',
      "color": "#000"
    }
  }
}