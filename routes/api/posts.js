const express = require('express')

const router = express.Router()

// @route    POST api/posts
// @desc    posts
// @access   Public

router.get( '/' , (req,res) => {
    res.send('posts route')
})

module.exports = router;
