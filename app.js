const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const errorController = require('./controllers/errorController');
const path = require('path');
const User = require('./models/user');
const adminRouter = require('./routes/adminRouter');
const shopRouter = require('./routes/shopRouter');
const authRouter = require('./routes/authRouter');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
        cb(null,true);
    }
    else{
        cb(null,false);
    }
}
const storage = multer.diskStorage({
    destination:(req,file, cb)=>{
        cb(null,'images');
    },
    filename:(req,file, cb)=>{
        cb(null,new Date().toISOString() + '-' + file.originalname );
    }
})

const store = new MongoDbStore({
    uri:'mongodb+srv://phoenix_124:Nikhil@12042001@shop.kxdzn.mongodb.net/Store?retryWrites=true&w=majority',
    collections:'sessions'
})
const app = express();

app.use(
    session({
    secret:'abcdef1ghi3jklmnopqrsunwxyz',
    saveUninitialized:false,
    resave: false,
    store:store
    })
);
app.use(bodyParser.urlencoded({extended:false}));
app.use(multer({storage:storage,fileFilter:fileFilter}).single('image'));
app.use(cookieParser());

app.use(csrf({ cookie: true }))
app.use(flash());

app.use((req, res,next)=>{
    res.locals.isLoggedIn = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})


app.use((req, res,next) => {
    if(req.session.user){
        
        User.findById(req.session.user._id).then((user)=>{
            req.user = user;
            next();
        })
    }
    else{
        next();
    }
    
});



app.set('view engine','ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'images')));
app.use(shopRouter);
app.use(authRouter);
app.use('/admin',adminRouter);
app.use(errorController.getError)

mongoose.connect('mongodb+srv://phoenix_124:Nikhil@12042001@shop.kxdzn.mongodb.net/Store?retryWrites=true&w=majority',{ useNewUrlParser: true,useUnifiedTopology:true }).then(()=>{
    console.log('Connected To Mongo DB');    
    app.listen(process.env.PORT || 3000)
}).catch(err=>{
    console.log(err);
})

