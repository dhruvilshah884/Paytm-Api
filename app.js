const express = require('express');
const app = express();
const session = require('express-session');
const mainRouter = require('./router/userRouter');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/paytm').then(() => {
    console.log('Database Connected');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));
app.use('/', mainRouter);

app.listen(8000, () => {
    console.log('Server Connected');
});
