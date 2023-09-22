const {Schema,model}=require("mongoose")

const userSchema =new Schema({
    name:{
        type: 'string',
        true:true,
        required:[true,"name is required"],
        minlength :[2,'Name should be at least 2 characters long'],
        maxlength :[100,'Name should be maximum 100 carracter'],
    },
    email:{
        type: String,
        validate: {
            validator: function(v) {
              return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
          },
          required: [true,"email is requred"],
          unique: true,
          lowercase: true,
          trim: true,
          message:"enter your email",
    },
    password:{
        type: String,
        required: [true,"password is required"],
        message:"enter your password",
        min:6,
    },
      phone:{
        type: String,
        required: [true,"user phone is requred"],
        min:6,
    },
    isBanned:{
        type: Boolean,
        default:false,
    },
    is_admin:{
        type: Number,
        default:0
    },
    is_verified:{
        type: Number,
        default:0
    },
    createdAt:{
        type: Date,
        default:Date.now
    },
    // image:{
    //     data:Buffer,
    //     contentType:String,
    //     // type: String,
    //     default:["https://pixabay.com/photos/code-coding-computer-data-1839406/","https://pixabay.com/illustrations/business-idea-growth-business-idea-3189797/"]
    // },
    image:{
        type: String,
        default:"https://pixabay.com/photos/code-coding-computer-data-1839406/",
    },
},
 {timestamps: true}
)

const UserModel=model("users-model",userSchema);
module.exports=UserModel;