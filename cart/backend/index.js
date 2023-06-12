const express=require("express");
const cors=require("cors");
const mongoose=require("mongoose");
const dotenv=require("dotenv").config();
const Stripe = require('stripe')(process.env.STRIPE_KEY)

const app=express();
app.use(cors());
app.use(express.json({limit:"10mb"}));

const PORT=process.env.PORT||8080;
//mongodb connection
console.log(process.env.MONGODB_URL)
mongoose.set('strictQuery',false);
mongoose.connect(process.env.MONGODB_URL)
.then(()=>console.log("Connect to Database"))
.catch((err)=>console.log(err))

//schema
const userSchema=mongoose.Schema({
    firstName:String,
    lastName:String,
    email:{
        type:String,
        unique:true,
    },
    password:String,
    confirmPassword:String,
    image:String,
});

//
const userModel=mongoose.model("user",userSchema)


//api
app.get("/",(req,res)=>{
    res.send("Server is running")
});
//signup
app.post("/signup",async(req,res)=>{
    console.log(req.body)
    const {email} =req.body

    userModel.findOne({email:email},(err,result)=>{
       console.log(result)
       console.log(err);
       if(result){
        res.send({message:"Email id is already register",alert:false})

       }
       else{
        const data=userModel(req.body)
        data.save();
        res.send({message:"successfully sign up ",alert:true})
       }
    });
});

//api login

app.post("/login",(req,res)=>{
    console.log(req.body)
    const {email}=req.body
    userModel.findOne({email:email},(err,result)=>{
        if(result){
                const dataSend={
                _id:result._id,
                firstName:result.firstName,
                lastName:result.lastName,
                email:result.email,
                image:result.image,
            };
            console.log(dataSend);
            res.send({message:"Login is successfully",alert:true,data:dataSend});
        }
        else{
             res.send({message:"Email is not available,please sign up",alert:false});
        }
    });
});

//product section

const schemaProduct = mongoose.Schema({
   name:String,
    category:String,
    image:String,
    price:String,
    description:String

});
const productModel=mongoose.model("product",schemaProduct)
//save product in data 
//api

app.post("/uploadProduct",async(req,res)=>{
    console.log(req.body)
    const data= await productModel(req.body)
    data.save();
    res.send({message:"upload successfully"})
})

//
app.get("/product",async(req,res)=>{
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})

/***payment getway */
//console.log(process.env.STRIPE_SECRET_KEY)
// app.post('/create-checkout-session', async (req, res) => {
//   const session = await stripe.checkout.sessions.create({
//     line_items: [
//       {
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: 'T-shirt',
//           },
//           unit_amount: 2000,
//         },
//         quantity: 1,
//       },
//     ],
//     mode: 'payment',
//     success_url: `${process.env.CLIENT_URL}/success`,
//     cancel_url: 'http://localhost:4242/cancel',
//   });

//   res.send({url:session.url});
// });


app.post("/create-checkout-session",async(req,res)=>{

     try{
      const params = {
          submit_type : 'pay',
          mode : "payment",
          payment_method_types : ['card'],
          billing_address_collection : "auto",
          shipping_options : [{shipping_rate : "shr_1N0qDnSAq8kJSdzMvlVkJdua"}],

          line_items : req.body.map((item)=>{
            return{
              price_data : {
                currency : "inr",
                product_data : {
                  name : item.name,
                  // images : [item.image]
                },
                unit_amount : item.price * 100,
              },
              adjustable_quantity : {
                enabled : true,
                minimum : 1,
              },
              quantity : item.qty
            }
          }),

          success_url : `${process.env.CLIENT_URL}/success`,
          cancel_url : `${process.env.FRONTEND_URL}/cancel`,

      }

      
      const session = await stripe.checkout.sessions.create(params)
      // console.log(session)
      res.status(200).json(session.id)
     }
     catch (err){
        res.status(err.statusCode || 500).json(err.message)
     }

})




app.listen(PORT,()=>console.log("server is running at port:" + PORT))
