const mongoose=require('mongoose');
const dev = require('./env.config');
const dbConnect=async ()=>{
try {
    await mongoose.connect(dev.db.url)
    console.log("connected with database")
} catch (error) {
    console.log("database is not connected");
    console.log(error)
}
}
module.exports=dbConnect;