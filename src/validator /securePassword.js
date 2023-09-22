const bcrypt = require('bcrypt');
const saltRounds = 10;

const encriptedPassword= async (password) =>{
    const hashedPassword =await bcrypt.hash(password, saltRounds)
    return hashedPassword
}

const comparePassword= async (password,hash) =>{
    const comparePassword =await bcrypt.compare(password, hash)
    return comparePassword
}

module.exports={encriptedPassword,comparePassword}