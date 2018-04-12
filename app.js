const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const mongoose = require('mongoose');
const index = require('./routes/index')
const users = require('./routes/users')
const request = require('request')
const fs = require('fs')
const {appid, secret, url} = require('./config')
// error handler

// 获取小程序吗
getAccess_token()

setInterval(getAccess_token, 7200 * 1000)
onerror(app)
mongoose.connect('mongodb://localhost/zhuli');


// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// routes
app.use(index.routes(), index.allowedMethods())
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

module.exports = app


function getAccess_token(cb) {
  request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`, (err, res, body) =>{
    app.context.access_token = JSON.parse(body).access_token;
    cb && cb(JSON.parse(body).access_token)
  })
}

