const express = require('express')

const router = express.Router()
const request = require('request')
const { check, validationResult } = require('express-validator');
const Profile = require('../../model/Profile');
const User = require('../../model/User');
const auth = require('../../middleware/auth')
const config = require('config')
// const Post = require('../../models/Post');

// @route    GET api/profile/me
// @desc     Get current user's profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'profile not available' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
    '/',
    auth,
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    async (req, res) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // destructure the request
      const {
        company,
        website,
        location,
        status,
        skills,
        bio,
        githubusername,
        education,
        experience,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook,
      } = req.body;
  
      // build a profile object
      const profileFields = {
        user: req.user.id,
      };

      profileFields.social = {}
      profileFields.education = []
      profileFields.experience = []
      //adding rest of fields
      if(company) profileFields.company = company
      if(website) profileFields.website = website
      if(location) profileFields.location = location
      if(status) profileFields.status = status
      if(skills) profileFields.skills = skills.split(',').map( skill => skill.trim() )
      if(bio) profileFields.bio = bio
      if(githubusername) profileFields.githubusername = githubusername
      if(education) profileFields.education = education
      if(experience) profileFields.experience = experience
  
      // Build socialFields
      if(youtube)  profileFields.social.youtube = youtube
      if(twitter)  profileFields.social.twitter = twitter
      if(instagram)  profileFields.social.instagram = instagram
      if(linkedin)  profileFields.social.linkedin = linkedin
      if(facebook)  profileFields.social.facebook = facebook
      
      try {

        let profile = await Profile.findOne({user : req.user.id})


        // if profile found
        if(profile){
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            );

            return res.json(profile)
        }

        // creating profile

        profile = new Profile(profileFields)
        await profile.save()

        return res.json(profile);

      } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
      }
    }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
    try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get(
    '/user/:user_id',
    async (req, res) => {
        try {
            const profile = await Profile.findOne({
                user: req.params.user_id
            }).populate('user', ['name', 'avatar']);

            if (!profile) return res.status(400).json({ msg: 'Profile not found' });

            return res.json(profile);

        } catch (err) {
            // if id is not the type of ObjectId we want the message 'profile not found'
            if(err.kind == 'ObjectId'){
                return res.status(400).json({ msg: 'Profile not found,check ProfileID is correct?' });
            }

            console.error(err.message);
            return res.status(500).json({ msg: 'Server error' });
        }
    }
);

// @route    DELETE api/profile
// @desc     delete logged in user and his profile
// @access   Private
router.delete('/',
    auth,
    async (req, res) => {
        try {
            // deleting posts

            // deleting profile
            await Profile.findOneAndRemove({user : req.user.id})

            // deleting user
            await User.findOneAndRemove({ _id : req.user.id })
    
            res.json({msg : "user deleted"});

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
    '/experience',
    [auth,
        [
            check('title', 'Title is required').notEmpty(),
            check('company', 'Company is required').notEmpty(),
            check('from', 'From date is required and needs to be from the past').notEmpty()
        ],
    ],
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
    
        try {
            const profile = await Profile.findOne({ user: req.user.id });
    
            profile.experience.unshift(req.body);
    
            await profile.save();
    
            res.json(profile);
        } catch (err) {

            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if(!profile){
            return res.status(400).json({ msg: 'Profile not found' });
        }  

        if(profile.experience.length==0){
            return res.status(400).json({ msg: 'no experience data' });
        }

        const expIndex = profile.experience.map( exp => exp._id).indexOf(req.params.exp_id)

        if(expIndex==-1){
            return res.status(400).json({ msg: 'experience not found' });
        }

        profile.experience.splice(expIndex,1)
        
        await profile.save();
        return res.status(200).json(profile);

    } catch (error) {
        // if id is not the type of ObjectId we want the message 'experience not found'
        if(err.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'this experience not found' });
        }
        
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
  '/education',
  [auth,
      [
          check('school', 'school is required').notEmpty(),
          check('degree', 'degree is required').notEmpty(),
          check('fieldofstudy' , 'fieldofstudy is required').notEmpty(),
          check('from', 'From date is required and needs to be from the past').notEmpty()
      ],
  ],
  async (req, res) => {

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
      }
  
      try {
          const profile = await Profile.findOne({ user: req.user.id });
  
          profile.education.unshift(req.body);
  
          await profile.save();
  
          res.json(profile);
      } catch (err) {

          console.error(err.message);
          res.status(500).send('Server Error');
      }
  }
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
      const profile = await Profile.findOne({ user: req.user.id });

      if(!profile){
          return res.status(400).json({ msg: 'Profile not found' });
      }  

      if(profile.education.length==0){
          return res.status(400).json({ msg: 'no education data' });
      }

      const eduIndex = profile.education.map( edu => edu._id).indexOf(req.params.edu_id)

      if(eduIndex==-1){
          return res.status(400).json({ msg: 'education not found' });
      }

      profile.education.splice(eduIndex,1)
      
      await profile.save();
      return res.status(200).json(profile);

  } catch (error) {
      // if id is not the type of ObjectId we want the message 'experience not found'
      if(err.kind == 'ObjectId'){
          return res.status(400).json({ msg: 'this education not found' });
      }
      
      console.error(error);
      return res.status(500).json({ msg: 'Server error' });
  }
});

// @route    GET api/profile/github/:username
// @desc     get github repos
// @access   Public

router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri : `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('GITHUBKEY')}`,
      method : 'GET',
      headers : { 'user-agent' : 'node.js'}
    }

    request(options , (error,response,body) => {
      if(error) throw error

      if(response.statusCode !== 200){
        return res.status(404).json({msg : 'no github profile found'})
      }

      res.json(JSON.parse(body))
    })

  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: 'No Github profile found' });
  }
});

module.exports = router;
