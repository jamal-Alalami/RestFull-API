const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.user_get_all = (req, res, next) => {

  User.find()
    .select('_id userName email phoneNumber category type location')
    .exec()
    .then(docs => {
      const response = {
        count: docs.length,
        users: docs.map(doc =>{
          return {
            _id: doc._id,
            userName: doc.userName,
            email: doc.email,
            phoneNumber: doc.phoneNumber,
            category: doc.category,
            type: doc.type,
            location: doc.location,
            request: {
              type: 'GET',
              url: 'http://localhost:3000/user/' + doc._id
            }
          }
        })
      };
      res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
};

exports.user_signup = (req, res, next) => {
  User.find({ $or:[{email: req.body.email}, {userName: req.body.userName}]})
  .exec()
  .then(user => {
    if (user.length >= 1) {
      return res.status(409).json({
        message: 'this user exists'
      });
    } else {
      bcrypt.hash(req.body.password, 10, (err, hash) => {
       if (err) {
         return res.status(500).json({
           error: err
         })
       } else {
         const user = new User({
           _id: new mongoose.Types.ObjectId(),
           email: req.body.email,
           userName: req.body.userName,
           type: req.body.type,
           category: req.body.category,
           location: req.body.location,
           phoneNumber: req.body.phoneNumber,
           password: hash
         });
         user
          .save()
          .then(result => {
            console.log(result);
            res.status(201).json({
              message: 'User created Successfully'
            })
          })
          .catch(err => {
            res.status(500).json({
              error: err
            })
          });
       }
     });
    }
  })

};

exports.user_login = (req, res, next) => {
  User.find({ $or:[{email: req.body.emailOrUsername}, {userName: req.body.emailOrUsername}]})
    .exec()
    .then(user => {
      if (user.length < 1) {
        return res.status(401).json({
          message: 'Auth fiald'
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: 'Auth fiald'
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              userId: user[0]._id
            },
            process.env.JWT_KEY,
            {
              expiresIn: "7 days"
            },
          );
          return res.status(200).json({
            message: 'Auth successful',
            token: token
          })
        }
        res.status(401).json({
          message: 'Auth fiald'
        });
      });
    })
    .catch(err => {
      res.status(500).json({
        error: err
      });
    });
};

exports.user_delete = (req, res, next) => {
  User.findById({_id: req.params.userId})
    .exec()
    .then(user => {
      if (user) {
        User.remove({_id: req.params.userId})
          .exec()
          .then(result => {
            res.status(200).json({
              message: 'User deleted'
            });
          })
          .catch(err => {
            res.status(500).json({
              error: err
            })
          });
      } else {
        return res.status(409).json({
          message: 'user does not exists'
        });
      }
    })

};
