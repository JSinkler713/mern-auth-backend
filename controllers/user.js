require('dotenv').config()
const passport = require('passport')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;


const db = require('../models')


const test = (req, res)=> {
  console.log('testing')
  res.json({ "testing": "hello user endpoint alright" })
}

const register = async (req, res)=> {
  // post request to sign a new user up
  try {
    console.log('=======> we are registering')
    console.log('***********************')
    console.log('req.body')
    console.log(req.body)
    console.log('***********************')
    const foundUser = await db.User.findOne({ email: req.body.email })
    if (foundUser) {
        // if it already exists, user can come back but can't make a new one
        // send 400
      return res.status(400).json({ message: "Already a user with that email" })
    } else {
      //make a newUser
      const newUser = await new db.User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt)=> {
        if (err) throw Error;
        bcrypt.hash(newUser.password, salt, async (err, hash) => {
          if (err) console.log('console.log error in hash', err)

          newUser.password = hash;
          const createdUser = await newUser.save()
          console.log(createdUser)
          res.json(createdUser)
        })
      })
    }
  } catch (err) {
    console.log(err)
  }
}

const login = async (req, res)=> {
  const foundUser = await db.User.findOne({ email: req.body.email })
  if (foundUser) {
    let isMatch = await bcrypt.compare(req.body.password, foundUser.password);
    console.log(isMatch)
    if (isMatch) {
      console.log('in the match')
      const payload = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name
      }
      jwt.sign(payload, JWT_SECRET, { expiresIn: 3600 }, async (err, token) => {
        if (err) {
          res.status(400).json({ message: 'Session had ended' })
        }
        console.log('in the jwt sign')
        //this errors?
        const legit = await jwt.verify(token, JWT_SECRET, { expiresIn: 60 })
        console.log('========> legit')
        console.log(legit)
        res.json({ success: true, token: `Bearer ${token}`, userData: legit })
      })
    } else {
      return res.status(400).json({ message: 'Email of pass is incorrect' })
    }
  } else {
    return res.status(400).json({ message: 'User not found' })
  }
}

const profile = (req, res) => {
  console.log('inside /profile')
  console.log(req.body);
  console.log('-----------')
  console.log('req.user')
  console.log(req.user)
  const { id, name, email } = req.user
  res.json({ id, name, email });
}



module.exports = {
  test,
  register,
  login,
  profile
}
