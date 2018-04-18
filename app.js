const Koa = require('koa')
const session = require('koa-session');
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const mongoose = require('mongoose');
const index = require('./routes/index')
const views = require('koa-views')
const request = require('request')
const fs = require('fs')

const app = new Koa()

const UserModel = require('./model/user')
const { appid, secret, url, template_id, template, day, mongodbUrl } = require('./config')
// error handler

// 获取小程序吗
getAccess_token()
// 2小时更新一次 Access_token
setInterval(getAccess_token, 7200 * 1000)
onerror(app)
mongoose.connect(mongodbUrl);
app.keys = ['some secret hurr'];
// 启动服务后查询数据库还没有发送模板消息的用户， 启动定时任务
UserModel.find({ isSend: false }, (err, users) => {
  users.forEach((user) => {
    setTimeout(function () {
      let options = {
        url: `https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=${app.context.access_token}`,
        method: 'POST',
        json: true,
        body: {
          touser: user.openid,
          template_id,
          form_id: user.formid,
          data: template,
          page: 'pages/about',
          emphasis_keyword: "keyword1.DATA" 
        }
      }
      request(options, (err, res, body) => {
        if (err) {
          next(err)
          return
        }
        else {
          user.isSend = true;
          user.save()
        }

      })

    }, day * 24 * 60 * 60 * 1000 - (new Date().getTime() - user.createAt.getTime()))//  

  })
})


app.keys = ['some secret hurr'];
app.use(session({
  key: appid,
  maxAge: 86400000,
}, app))
// middlewares
app.use(bodyparser({
  enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))



// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})
app.use(views(__dirname + '/views', {
  extension: 'pug'
}))
// routes
app.use(index.routes(), index.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app


function getAccess_token(cb) {
  request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`, (err, res, body) => {
    app.context.access_token = JSON.parse(body).access_token;
    cb && cb(JSON.parse(body).access_token)
  })
}

