const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const cors = require("cors");
const morgan = require("morgan");
const dbConnect = require("./config/db");
const dev = require("./config/env.config");
const userRouter = require("./router/users.routers");
const adminRouter = require("./router/admin.routers ");





 const PORT=dev.app.serverPort || 8080;
//const PORT=3030 || 8080;

const app = express();
app.use(cors({

}))
app.use(morgan("dev"));
app.use(cookieParser())


// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use("/api/v1/users",userRouter)
app.use("/api/v1/admin",adminRouter)


app.use((err,req, res,next) => {
    if(err) return res.status(404).json({message:err.message})

})
app.get("/", (req, res) =>{return  res.status(200).json({message:"helth is ok"})})

app.listen(PORT,async ()=>{
    console.log(`server is running at http://localhost:${PORT}`);
    await dbConnect()
});
