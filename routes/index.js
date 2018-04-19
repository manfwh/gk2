const router = require('koa-router')()
const UserModel = require('../model/user')
const RuneModel = require('../model/rune')
const request = require('request')
const rep = require('request-promise-native');
const schedule = require("node-schedule")
const WXBizDataCrypt = require('../utils/WXBizDataCrypt')
const fs = require('fs')
const moment = require('moment')
const arraySort = require('array-sort');

const check = require('../middlewares/check')
const { appid, secret, url, template_id, template, day, tel, wechat } = require('../config');
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

// 获取 手机号
router.post('/getPhone', async (ctx, next) => {
  let { encryptedData, iv, code } = ctx.request.body;
  let res = await rep(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`)
  let { openid, session_key } = JSON.parse(res)

  var pc = new WXBizDataCrypt(appid, session_key)

  var data = pc.decryptData(encryptedData, iv)
  await UserModel.findOneAndUpdate({ openid }, { phone: data.phoneNumber })

  console.log('解密后 data: ', data)  
  ctx.status = 204
})
// 获取助力信息
router.get('/rune/:runeid', async (ctx, next) => {
  const runeid = ctx.params.runeid;
  let rune = await RuneModel.findById(runeid).populate('owner', 'nickName avatarUrl gender');
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
  let _user = await UserModel.findById(rune.owner._id).exec();
  _user.score += Math.random().toFixed(1)
  await user.save()
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
  if (hasUser) {
    ctx.body = hasUser.openid
  } else {
    let user = new UserModel({
      openid,
    })
    await user.save()
    ctx.body = openid;
  }

})
// 保存formid
router.post('/formid', async (ctx, next) => {
  console.log(113, ctx.request.body)
  const { formid, openid } = ctx.request.body;
  let user = await UserModel.findOne({ openid });

  setTimeout(() => {
    sendTemp(openid, ctx.access_token, template_id, formid, template)
  }, day * 24 * 60 * 60 * 1000); //


  function sendTemp(openid, token, template_id, form_id, data) {
    let options = {
      url: `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${token}`,
      method: 'POST',
      body: {
        touser: openid,
        template_id,
        form_id,
        page: 'pages/about',
        data,
        emphasis_keyword: "keyword1.DATA" 
      },
      json: true
    }
    request(options, (err, res, body) => {
      if (err) next(err)
      UserModel.findOneAndUpdate({ openid: openid }, { isSend: true },(err, user)=>{
      } )
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

// 获取二维码
router.get('/qr', async (ctx, next) => {
  let runeid = ctx.query.runeid;
  let getQrOptions = {
    // 接口B
    url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${ctx.access_token}`,
    body: {
      page: 'pages/help',
      scene: runeid,
      width: 214,
      line_color: { r: '65', g: '224', b: '95' }
    },
    method: 'POST',
    headers: {
      "Accept": "text/html;charset=utf-8"
    },
    json: true
  }
  ctx.body = await saveQr()  
  function saveQr() {
    return new Promise(resolve => {
      let write = fs.createWriteStream('./public/images/' + runeid + '.png');
      request(getQrOptions).pipe(write)
      write.on('finish', () => {
        resolve(`${url}/images/${runeid}.png`)
      })
    })
  }
})

// 获取联系方式 手机号和微信号
router.get('/getContact', async (ctx) =>{
  ctx.body = {
    tel,
    wechat
  }
})



// admin
router.get('/admin', async (ctx, next) =>{
  next()
  let {onlyShowPhone, sortByCreateAt} = ctx.query;
  let _runes = await RuneModel.find({}).populate('owner').exec()
  let runes = null;
  // 排除小程序审核测试账号
  let testUserRe = /^rdgztest/
  if(onlyShowPhone) {
    runes = _runes.filter((rune) => rune.owner && !testUserRe.test(rune.owner.nickName) && rune.owner.phone)    
  } 
  else if(sortByCreateAt) {
    runes = arraySort(_runes.filter((rune) => rune.owner && !testUserRe.test(rune.owner.nickName) ), 'owner.createAt')
  } 
  else {
    runes = _runes.filter((rune) => rune.owner && !testUserRe.test(rune.owner.nickName) )
  }

  await ctx.render('index', {title: '后台管理', runes, moment, onlyShowPhone})
}, check.checkLogin)
router.get('/login', async (ctx, next) =>{
  next()
  await ctx.render('login')
}, check.checkoutNotLogin)


// 后台登录
router.post('/res' , async (ctx) =>{
  const { username, password} = ctx.request.body;
  if(username == 'admin' && username == password) {
    ctx.session.user = username;
    ctx.body = {
      code: 1
    }
  } else {
    ctx.body = '用户名或密码错误'
  }
})

// 临时接口修改数据
router.get('/tmp', async (ctx) =>{
  UserModel.find({},(err, users) =>{
    users.forEach(async user =>{
      let n = Math.floor(Math.random()*20) + 110;
      let rune = await RuneModel.findOne({owner: user._id}).exec();
      console.log(rune)
      if(rune) {
        user.score = rune.helps.length * Math.random().toFixed(1) + n
         user.save()
      }
    })
  })
})
module.exports = router

