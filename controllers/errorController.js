exports.getError = (req, res, next)=>{
    res.render('error',{
        pageTitle:'Page Not Found',
        isLoggedIn : req.session.isLoggedIn
    })
}