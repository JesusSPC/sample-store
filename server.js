require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport')
const session = require('express-session')


const auth = require('./config/auth.js')(passport);
const home = require('./routes/home.js');
const register = require('./routes/register.js');
const login = require('./routes/login.js');
const account = require('./routes/account.js');
const admin = require('./routes/admin.js');

mongoose.connect('mongodb://localhost/sample-store', {useNewUrlParser: true, useUnifiedTopology: true }, (err, data) => {
  if (err){
    console.log('DB Connection Failed...')
    return
  }

  console.log('DB Connection Successful!')
})

app.use(session({
  secret:'agdhjkas',
  resave: true,
  saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hjs')

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use(express.static(path.join(__dirname, 'public')))

app.use('/', home)
app.use('/register', register)
app.use('/login', login)
app.use('/account', account)
app.use('/admin', admin)

app.use((err, req, res, next) => {
  res.render('error', {message: err.message})
})

app.listen(5000)
console.log('The App is running on localhost 5000...')