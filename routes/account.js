require("dotenv").config();

const express = require("express");
const router = express.Router();
const Mailgun = require("mailgun-js");
const bcrypt = require('bcryptjs');

const Item = require("../models/Item.js");
const User = require("../models/User.js");

const randomString = length => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

router.get("/", (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect("/");
    return;
  }

  Item.find(null, (err, items) => {
    if (err) return next(err);

    Item.find({ interested: user._id }, (err, interestedItems) => {
      if (err) return next(err);
      const data = {
        user: user,
        items: items,
        interested: interestedItems
      };
      res.render("account", data);
    });
  });
});

router.get("/logout", (req, res, next) => {
  req.logout();
  res.redirect("/");
});

router.get("/additem/:id", (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect("/");
    return;
  }

  Item.findById(req.params.id, (err, item) => {
    if (err) return next(err);

    if (item.interested.indexOf(user._id) == -1) {
      item.interested.push(user._id);
      item.save();
      res.redirect("/account");
    } else {
      res.redirect("/account");
    }
  });
});

router.get("/deleteitem/:id", (req, res, next) => {
  const user = req.user;
  if (user == null) {
    res.redirect("/");
    return;
  }

  Item.findById(req.params.id, (err, item) => {
    if (err) return next(err);

    if (item.interested.indexOf(user._id) != -1) {
      item.interested.pop(user._id);
      item.save();
      res.redirect("/account");
    } else {
      res.redirect("/account");
    }
  });
});

router.post("/resetpassword", (req, res, next) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) return next(err);

    user.nonce = randomString(8);
    user.passwordResetTime = new Date();
    user.save();

    const mg = Mailgun({
      apiKey: `${process.env.YOUR_MAILGUN_API_KEY}`,
      domain: `${process.env.YOUR_MAILGUN_DOMAIN}`
    });

    const data = {
      from: "Jesus.Saints@gmail.com",
      to: req.body.email,
      sender: "Sample Store",
      subject: "Password Reset Request",
      html:
        'Please click <a style="color:red" href="http://localhost:5000/account/password-reset?nonce=' +
        user.nonce +
        "&id=" +
        user._id +
        '">HERE</a> to reset your password. This link will reset in 24 hours.'
    };
    mg.messages().send(data, (err, body) => {
      if (err) return next(err);

      res.render('password-email', data)
    });
  });
});

router.get("/password-reset", (req, res, next) => {
  const nonce = req.query.nonce;
  if (nonce == null) {
    return next(new Error("Invalid Request"));
  }

  const userId = req.query.id;
  if (userId == null) {
    return next(new Error("Invalid Request"));
  }

  User.findById(userId, (err, user) => {
    if (err) return next(err);
    if (user.passwordResetTime == null) {
      return next(new Error("Invalid Request"));
    }
    if (user.nonce == null) {
      return next(new Error("Invalid Request"));
    }
    if (nonce != user.nonce) {
      return next(new Error("Invalid Request"));
    }

    const now = new Date();
    const diff = now - user.passwordResetTime; // time in miliseconds
    const seconds = diff / 1000;

    if (seconds > 24 * 60 * 60) {
      return next(new Error("Invalid Request"));
    }

    // render the page where users can reset password
    const data = {
      id: userId,
      nonce: nonce
    };
    res.render("password-reset", data);
  });
});

router.post('/newpassword', (req, res, next) => {
  const password1 = req.body.password1
  if (password1 == null){
    return next(new Error('Invalid Request'))
  }
  const password2 = req.body.password2
  if (password2 == null){
    return next(new Error('Invalid Request'))
  }
  const nonce = req.body.nonce
  if (password2 == null){
    return next(new Error('Invalid Request'))
  }
  const userId = req.body.id
  if (password2 == null){
    return next(new Error('Invalid Request'))
  }

  if (password1 !== password2){
    return next(new Error('Passwords do not match'))
  }


  User.findById(userId, (err, user) => {
    if (err) return next(new Error('Invalid Request'))

    if (user.passwordResetTime == null) {
      return next(new Error("Invalid Request"));
    }
    if (user.nonce == null) {
      return next(new Error("Invalid Request"));
    }
    if (nonce != user.nonce) {
      return next(new Error("Invalid Request"));
    }

    const now = new Date();
    const diff = now - user.passwordResetTime; // time in miliseconds
    const seconds = diff / 1000;

    if (seconds > 24 * 60 * 60) {
      return next(new Error("Invalid Request"));
    }
    
    const hashedPw = bcrypt.hashSync(password1, 10)
    user.password = hashedPw
    user.save()

    res.redirect('/')
  })
})

module.exports = router;
