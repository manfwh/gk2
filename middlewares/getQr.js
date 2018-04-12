const fs = require('fs')
const {url} = require('../config');
exports.getQr = async (ctx, next) =>{
  let openid = ctx.query.openid;
  let options = {
    url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${ctx.access_token}`,
    body: {
      path: '/pages/help?' + openid,
      scene: openid,
      width: 214,
      line_color: { r: '65', g: '224', b: '95'}
    },
    method: 'POST',
    headers: {
      "Accept": "text/html;charset=utf-8"
    },
    json: true
  }
  let fileName = new Date().getTime();
  request(options).pipe(fs.createWriteStream('./public/images/'+ fileName +'.png'));
  ctx.qrUrl = `${url}/images/${fileName}.png`
}

function getQr(access_token) {
  
  app.context.qrUrl = `${url}/images/qr.png`
}