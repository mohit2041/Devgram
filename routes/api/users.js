const express = require('express')
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult} = require('express-validator');
const config = require('config')
const User = require('../../model/User');

const router = express.Router()

// @route    POST api/users
// @desc     to test users route
// @access   Public

router.post( 
    '/' ,
    [check('name' , 'name is required')
    .not()
    .isEmpty(),
    check('email' , 'please include a valid email')
        .isEmail(),
    check('password' , 'please enter a valid password of min length of 6')
    .isLength({ min: 6 })
    ],
    async (req,res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name , email , password} = req.body

        try{
            // if any user exists already
            let user = await User.findOne({email})
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }
            //avatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            })

            user = new User({
                name,
                email,
                avatar,
                password
            })
            // hashing password
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            // now save in db
            await user.save()

            //implementing jwt

            const payload = {
                user: {
                  id: user.id
                }
              };
        
              jwt.sign(
                payload,
                config.get('JWTKEY'),
                { expiresIn: '5 days' },
                (err, token) => {
                  if (err) throw err;
                  res.json({ token });
                }
            );

        }catch(err){
            console.error(err.msg);
            res.status(500).send('Server error');
        }

})

module.exports = router;
 