const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const config = require('config-lite');
const routes = require('./routes');
const pkg = require('./package');
const app = express();
const winston = require('./package');
const url = require('url');
const expressWinston = require('express-winston');
// 设置模板目录
app.set('views',path.join(__dirname,'views'));
//设置模板引擎 ejs
app.set('view engine','ejs');

// 设置静态文件目录
app.use(express.static(path.join(__dirname,'public')));
// session中间件
app.use(session({
    name:config.session.key,// 设置 cookie 中保存的 session id 的字段名称
    secret:config.session.secret, // 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改
    resave:true, // 强制更新 session
    saveUninitialized:false, //设置为 false ，强制创建一个 session，即使用户未登录
    cookie:{
        maxAge:config.session.maxAge // 过期时间，过期后 cookie 中的 session id 自动删除
    },
    store:new MongoStore({
        url:config.mongodb // mongodb 地址
    })
}));

// flash 中间件，用来 显示通知
app.use(flash());

// 处理表单及文件上传的中间件
app.use(require('express-formidable')({
    uploadDir:path.join(__dirname,'public/img'), // 上传文件目录
    keepExtensions:true // 保留后缀
}));

// 设置模板全局变量
app.locals.blog = {
    title:pkg.name,
    description:pkg.description
};

// 添加模板必须的三个变量
app.use((req,res,next)=>{
    res.locals.user = req.session.user;
    res.locals.success = req.flash('success').toString();
    res.locals.error = req.flash('error').toString();
    next();
});

// 正常请求的日志
// app.use(expressWinston.logger({
//     transports:[
//         new (winston.transports.Console)({
//             json:true,
//             colorize:true
//         }),
//         new winston.transports.File({
//             filename:'logs/success.log'
//         })
//     ]
// }));
// 路由
routes(app);
// 错误请求的日志
// app.use(expressWiniston.errorLogger({
//     transports:[
//         new winston.transports.Console({
//             json:true,
//             colorize:true
//         }),
//         new winston.transports.File({
//             filename:'log/error.log'
//         })
//     ]
// }));
// 监听端口，启动程序

function validate_token(req,res){
    var query = url.parse(req.url, true).query;  
    var signature = query.signature;  
    var echostr = query.echostr;  
    var timestamp = query['timestamp'];  
    var nonce = query.nonce;  
    var oriArray = new Array();  
    oriArray[0] = nonce;  
    oriArray[1] = timestamp;  
    oriArray[2] = "XXXXXX";  
    oriArray.sort();  
    var original = oriArray.join('');  
    var scyptoString = sha1(original);  
    if (signature == scyptoString) {  
        res.end(echostr);  
        console.log("Confirm and send echo back");  
    } else {  
        res.end("false");  
        console.log("Failed!");  
    }  
}



const port = process.env.PORT || config.port;
// if(module.parent){
//     module.exports = app;
// }else{
    app.listen(port,()=>{
        console.log(`${pkg.name} listening on port ${port}`);
    });
// }

// error page
app.use((err,req,res,next)=>{
    res.render('error',{
        error:err
    });
});