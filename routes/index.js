const router = require('koa-router')()
const UserModel = require('../model/user')
const RuneModel = require('../model/rune')
const request = require('request')
const fs = require('fs')
const { appid, secret, url } = require('../config');
// 领取考神符
router.post('/rune', async (ctx, next) => {

  try {
    let data = ctx.request.body;
    console.log(data)
    let user = new UserModel(data);
    let rune = new RuneModel({
      owner: user._id
    });
    let [_user, _rune] = await Promise.all([user.save(), rune.save()]);
    ctx.body = {
      code: 20000,
      data: {
        user: _user,
        rune: _rune
      },
      msg: 'ok'
    }

  } catch (err) {
    ctx.body = {
      code: 30000,
      msg: err.message
    }
  }

})
// 获取助力信息
router.get('/rune/:runeid', async (ctx, next) => {
  const runeid = ctx.params.runeid;
  ctx.body = await RuneModel.findById(runeid).populate('owner', 'nickName avatarUrl')
  //.populate('helps', 'avatarUrl').exec()
})
// 发起助力
router.get('/help', async (ctx, next) => {
  ctx.body = await RuneModel.findByIdAndUpdate('5acdf1cf70b02b14cc67f37c', {
    $push: {
      helps: {

      }
    }
  })
})
router.post('/help', async (ctx, next) => {
  const { runeid, user } = ctx.request.body;
  let rune = await RuneModel.findByIdAndUpdate(runeid, {
    $push: {
      helps: user
    }
  })
  ctx.body = {
    code: 20000,
    msg: 'ok'
  }
})
// 根据openid获取用户信息
router.post('/user/:openid', async (ctx, next) => {
  let openid = ctx.params.openid;
  let user = await UserModel.findOne({ openid });
  ctx.body = {
    code: 20000,
    data: user
  }
})
// 登录
router.post('/login', async (ctx, next) => {
  ctx.body = request(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${ctx.request.body.code}&grant_type=authorization_code`)

})

// 获取二维码
router.get('/qr', async (ctx, next) => {
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
  function saveQr() {
    return new Promise(resolve =>{
      let write = fs.createWriteStream('./public/images/'+ fileName +'.png');
      request(options).pipe(write)
      write.on('finish', () =>{
        console.log('finish')
        resolve(`${url}/images/${fileName}.png`)
      })
    })
  }
  ctx.body = await saveQr()
  
  
  
  // ctx.body = `${url}/images/${fileName}.png`
  
  //
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router
