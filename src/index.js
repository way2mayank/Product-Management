const express = require("express")
const { default: mongoose } = require("mongoose")
const route = require("./route/route")
const multer= require('multer')
const app = express()

app.use(express.json())
app.use(multer().any())


mongoose.connect("mongodb+srv://funupdb-first:VxaFh8Uez4zyv95l@cluster0.kizeuyb.mongodb.net/group33Database?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log('mongoDb connected......'))
    .catch((err) => console.log(err))

app.use("/", route) 

app.listen(process.env.PORT || 3000, ()=>
    console.log(`server in running on port ${process.env.PORT || 3000}`))