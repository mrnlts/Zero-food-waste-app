const express = require('express');

const router = express.Router();
const bcryptjs = require('bcryptjs');
// const flash = require('connect-flash');
const User = require('../models/User.model');

const saltRounds = 10;

/* GET signup  */
router.get('/', (req, res) => res.render('signup/user'));

/* POST signup  */
router.post('/', (req, res, next) => {
  const { firstName, lastName, email, password, city, age } = req.body;
 
  bcryptjs
    .genSalt(saltRounds)
    .then(salt => bcryptjs.hash(password, salt))
    .then(hashedPassword => User.create({ firstName, lastName, email, passwordHash: hashedPassword, city, age }))
    .then(dbUser => {
      // req.flash('success', 'Registration successfully');
      // res.locals.message = req.flash();
      res.redirect(`/auth/login`);
      // res.redirect(`/user/${dbUser.id}`)
    })
    .catch(error => next(error));
});

module.exports = router;