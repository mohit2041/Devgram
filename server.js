const express = require("express")
const connectDB = require('./config/db')
const app = express();

// for connecting database
connectDB()

// init middleware
app.use(express.json({extended : true}))

app.get( '/' , (req,res) => res.send("server is up and running") )

app.use( '/api/users' , require('./router/api/users') )
app.use( '/api/posts' , require('./router/api/posts') )
app.use( '/api/auth' , require('./router/api/auth') )
app.use( '/api/profile' , require('./router/api/profile') )

const PORT = process.env.PORT || 3000

app.listen(PORT , ()=>{console.log(`server is started at ${PORT}`)})