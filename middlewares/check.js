module.exports = {
  checkLogin: async (ctx, next) =>{
    if(!ctx.session.user) {
      return ctx.redirect('/login')
    }
    next()
  },
  checkoutNotLogin: async (ctx, next) =>{
    if(ctx.session.user) {
      return ctx.redirect('/admin')
    }
    next()
  }
}