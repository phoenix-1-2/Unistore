const User = require('../models/user');
const bcrypt = require('bcryptjs');
const API_KEY = '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';
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const transporter = nodemailer.createTransport(sendGridTransport({
    auth:{
        api_key:API_KEY
    }
}));


exports.getLogin = (req,res) => {
    let userCreatedMessage = req.flash('user-created');
    if(userCreatedMessage){
        userCreatedMessage = userCreatedMessage[0];
    }
    let errorMessage = req.flash('error');
    if(errorMessage){
        errorMessage = errorMessage[0];
    } 
    res.render('login',{
        pageTitle:'Login',
        isLoggedIn : req.session.isLoggedIn,
        errorMessage : errorMessage,
        userCreatedMessage : userCreatedMessage,
        passwordError : false,
        oldInput:{
            password : '',
            email : ''
        }
    })
}
exports.postLogin = (req,res) => {
    
    const email = req.body.email.trim();
    const password = req.body.password.trim();

    User.findOne({email:email}).then((user)=>{
        if(!user){
            req.flash('error','User Not Found !!')
            return res.redirect('/signup');
        }

        bcrypt.compare(password, user.password).then(isMatching=>{
            if(isMatching){
                req.session.isLoggedIn = true;
                req.session.user = user;
                res.redirect('/');
            }else{
                req.flash('error','Password Not Matching !!')
                let userCreatedMessage = req.flash('user-created');
                if(userCreatedMessage){
                    userCreatedMessage = userCreatedMessage[0];
                }
                let errorMessage = req.flash('error');
                if(errorMessage){
                    errorMessage = errorMessage[0];
                }
                return res.render('login',{
                    pageTitle:'Login',
                    errorMessage : errorMessage,
                    userCreatedMessage : userCreatedMessage,
                    passwordError : true,
                    oldInput:{
                        password : password,
                        email : email
                    }
                })
            }
        }).catch(err=>{
            return res.redirect('/login')
        })
    })
}
exports.postReset = (req, res)=>{
    const email = req.body.email.trim();

    User.findOne({ email: email}).then(user=>{
        if(!user){
            req.flash('error','Email Not Found');
            let errorMessage = req.flash('error');
            if(errorMessage){
                errorMessage = errorMessage[0];
            }
            let userCreatedMessage = req.flash('user-created');
            if(userCreatedMessage){
                userCreatedMessage = userCreatedMessage[0];
            }
            return res.render('reset',{
                pageTitle:'Reset Password',
                errorMessage : errorMessage,
                userCreatedMessage : userCreatedMessage,
                emailError : true,
                oldInput:{
                    email : email
                }
            })
        }
        req.flash('user-created','Reset Email Has Been Sent !!');

        crypto.randomBytes(32,(err,buffer)=>{
            const token = buffer.toString('hex');
            const oldDateObj = new Date();
            user.token = token;
            user.tokenExpire = new Date(oldDateObj.getTime() + 60*60000);
            transporter.sendMail({
                to:email,
                from:'bhasin.nikhil.12@gmail.com',
                subject:'Unistore, Email Reset',
                html:
                `
                <h1> Email Reset </h1>
        
                <p> <a href="http://localhost:3000/reset/${token}" >Click here</a> to reset password </p>
                
                `
            })
            user.save().then((result)=>{
                res.redirect('/reset');
            })
            
        })
    }).catch(err=>{
        res.redirect('/reset');
    })
}
exports.getReset = (req, res)=>{
    let errorMessage = req.flash('error');
    if(errorMessage){
        errorMessage = errorMessage[0];
    }
    let userCreatedMessage = req.flash('user-created');
    if(userCreatedMessage){
        userCreatedMessage = userCreatedMessage[0];
    }
    res.render('reset',{
        pageTitle:'Reset Password',
        errorMessage : errorMessage,
        userCreatedMessage : userCreatedMessage,
        emailError : false,
        oldInput:{
            email : ''
        }
    })
}
exports.postLogout = (req,res) => {
    req.session.destroy(()=>{
        console.log('Logged Out');
        res.redirect('/');
    });
}
exports.isAuth = (req,res,next) => {
    if(!req.session.isLoggedIn){
        return res.redirect('/login');
    }
    next();
}
exports.getSignup = (req,res) => {
    let errorMessage = req.flash('error');
    if(errorMessage){
        errorMessage = errorMessage[0];
    }

    res.render('signup',{
        pageTitle:'Sign Up',
        errorMessage : errorMessage,
        passwordError : false,
        oldInput : {
            email : '',
            password : '',
            confirmPassword : ''
        }
    })
}
exports.postSignup = (req,res) => {
    const email = req.body.email.trim();
    const password = req.body.password.trim();
    const confirmPassword = req.body.confirmPassword.trim();
    
    if(password !== confirmPassword){
        req.flash("error","Password Don't Match");
        let errorMessage = req.flash('error');
        if(errorMessage){
            errorMessage = errorMessage[0];
        }

        return res.render('signup',{
            pageTitle:'Sign Up',
            errorMessage : errorMessage,
            passwordError : true,
            oldInput : {
                email : email,
                password : password,
                confirmPassword : confirmPassword
            }
        })
        
    }

    if(password.length < 6 ){
        req.flash("error","Password Length less than 6 characters");
        let errorMessage = req.flash('error');
        if(errorMessage){
            errorMessage = errorMessage[0];
        }

        return res.render('signup',{
            pageTitle:'Sign Up',
            errorMessage : errorMessage,
            passwordError : true,
            oldInput : {
                email : email,
                password : password,
                confirmPassword : confirmPassword
            }
        })
        
    }

    if(password.match(/[^0-9a-z]/i)){
        req.flash("error","Password Should Only Contains Alphabets And Numeric Values");
        let errorMessage = req.flash('error');
        if(errorMessage){
            errorMessage = errorMessage[0];
        }

        return res.render('signup',{
            pageTitle:'Sign Up',
            errorMessage : errorMessage,
            passwordError : true,
            oldInput : {
                email : email,
                password : password,
                confirmPassword : confirmPassword
            }
        })
        
    }

    User.findOne({email:email}).then(user => {
        if(user){
            req.flash('user-created','Already Registered !!');
            return res.redirect('/login');
        }
        else{

            bcrypt.hash(password,12).then(hashedPassword => {
                const user = new User({
                    email : email,
                    password : hashedPassword,
                    cart : {
                        items:[]
                    }
                });
                user.save().then(() => {
                    console.log('User saved');
                    transporter.sendMail({
                        to:email,
                        from:'bhasin.nikhil.12@gmail.com',
                        subject:'Welcome To Unistore ',
                        html:'<h1> Thank You for signing up !! Look at our products. </h1>',
                    })
                    req.flash('user-created','Sign Up Successful');
                    res.redirect('/login');
                }).catch(err => {
                    console.log(err);
                })
            })

            
        }
    })
}
exports.getNewPassword = (req, res, next) => {

    const token = req.params.token;

    User.findOne({token: token,tokenExpire:{$gt: new Date()}}).then((user)=>{
        if(user){
            res.render('newPassword',{
                pageTitle:'Reset Password',
                userId : user._id,
                token:token
            })
        }

    })

    
}

exports.postNewPassword = (req, res) => {

    const userId  = req.body.userId;
    const token = req.body.token;
    const password = req.body.password;

    User.findOne({_id: userId,token: token,tokenExpire:{$gt:new Date()}}).then((user) => {
        bcrypt.hash(password,12).then((hash) => {
            user.password = hash;
            user.token = undefined;
            user.tokenExpire = undefined;
            return user.save();
        }).then((result) => {
            res.redirect('/login');
        }).catch((err) => {
            console.error(err);
        })
    })

}

