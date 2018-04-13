const router = require('koa-router')()
const UserModel = require('../model/user')
const RuneModel = require('../model/rune')
const request = require('request')
const rep = require('request-promise-native');
const schedule = require("node-schedule")
const WXBizDataCrypt = require('../utils/WXBizDataCrypt')
const fs = require('fs')
const { appid, secret, url, template_id, template } = require('../config');
// 领取考神符
router.post('/rune', async (ctx, next) => {
  let { openid, nickName, gender, avatarUrl, city, province, country } = ctx.request.body;
  let user = await UserModel.findOne({ openid }).exec();
  if (user) {
    user.gender = gender;
    user.nickName = nickName;
    user.avatarUrl = avatarUrl;
    user.city = city;
    user.province = province;
    user.country = country;
    let rune = await RuneModel.findOne({ owner: user._id })
    if (rune) {
      ctx.body = {
        code: 30001,
        msg: '已经领取考神符过了',
        data: {
          rune
        }
      }

    } else {
      let newRune = new RuneModel({
        owner: user._id
      });
      let [_user, _rune] = await Promise.all([user.save(), newRune.save()]);
      ctx.body = {
        code: 20000,
        data: {
          user: _user,
          rune: _rune
        },
        msg: 'ok'
      }
    }
  } else {
    ctx.body = {
      code: 30000,
      msg: '用户未注册'
    }
  }
})
// 获取 sesstion key
router.post('/getPhone', async (ctx, next) => {
  let { encryptedData, iv, code } = ctx.request.body;
  let res = await rep(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${ctx.request.body.code}&grant_type=authorization_code`)
  let { openid, session_key } = JSON.parse(res)

  var pc = new WXBizDataCrypt(appid, session_key)

  var data = pc.decryptData(encryptedData, iv)
  await UserModel.findOneAndUpdate({openid}, {phone: data.phoneNumber})
  ctx.status =204
  console.log('解密后 data: ', data)
})
// 获取助力信息
router.get('/rune/:runeid', async (ctx, next) => {
  const runeid = ctx.params.runeid;
  console.log(runeid)
  let rune = await RuneModel.findById(runeid).populate('owner', 'nickName avatarUrl gender');
  console.log(rune)
  ctx.body = rune
  //.populate('helps', 'avatarUrl').exec()
})
// 发起助力
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
  let res = await rep(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${ctx.request.body.code}&grant_type=authorization_code`)
  let { openid } = JSON.parse(res)
  let hasUser = await UserModel.findOne({ openid })
  console.log(hasUser)
  if (hasUser) {
    ctx.body = hasUser.openid
  } else {
    let user = new UserModel({
      openid,
    })
    await user.save()
    ctx.body = openid;
  }

  //  res;
  // let res = await rq();
  // console.log(res)
  // ctx.body = res;

})
// 保存formid
router.post('/formid', async (ctx, next) => {
  console.log(ctx.request.body)
  const { formid, openid } = ctx.request.body;
  console.log(formid)
  let user = await UserModel.findOne({ openid });

  setTimeout(() => {
    sendTemp(openid, ctx.access_token, template_id, formid, template)
  }, 5000); //6 * 24 * 60 * 60 * 1000


  function sendTemp(openid, token, template_id, form_id, data) {
    let options = {
      url: `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${token}`,
      method: 'POST',
      body: {
        touser: openid,
        template_id,
        form_id,
        page: 'about?',
        data
      },
      json: true
    }
    request(options, (err, res, body) => {
      if (err) next(err)
      console.log(body)
      UserModel.findOneAndUpdate({ openid }, { isSend: true })
    })
  }

  if (user) {
    user.formid = formid;
    user.save();
  }
  ctx.body = {
    code: 20000
  }
})
router.get('/send', async (ctx, next) => {
  let options = {
    url: `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${ctx.access_token}`,
    method: 'POST',
    body: {
      touser: 'oArrS5MKQuKv8SDuQB-LLpsQKdE0',
      template_id: '-NNE30zgta--97raIBLxpDONSkjG3XT3VQnoopb1-ww',
      form_id: 1523591113120,
      page: 'about?',
      data: template
    },
    json: true
  }
  request(options, (err, res, body) => {
    if (err) console.log(err)
    console.log(body)
  })
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
      line_color: { r: '65', g: '224', b: '95' }
    },
    method: 'POST',
    headers: {
      "Accept": "text/html;charset=utf-8"
    },
    json: true
  }
  function saveQr() {
    return new Promise(resolve => {
      let write = fs.createWriteStream('./public/images/' + openid + '.png');
      request(options).pipe(write)
      write.on('finish', () => {
        resolve(`${url}/images/${openid}.png`)
      })
    })
  }
  ctx.body = await saveQr()
})


module.exports = router
