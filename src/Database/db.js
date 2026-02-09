const mongoose = require('mongoose');


async function connectDB() {
    await mongoose.connect(process.env.MONGOOSE_URI)

    console.log('connected to DB')


}


module.exports =  connectDB;
