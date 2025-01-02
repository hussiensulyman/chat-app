import mongoose from "mongoose";
import User from "../models/UserModel.js"
import Message from "../models/MessagesModel.js"


export const searchContacts = async (request,response,next) => {
    try{
      const {searchTerm} = request.body;
      if (searchTerm === undefined || searchTerm === null) {
        return response.status(400).send("Search Term is required");
      }
      const sanitizedSearchTerm = searchTerm.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      const regex = new RegExp(sanitizedSearchTerm,"i");

      const contacts = await User.find({
        $and: [
          {_id:{$ne: request.userID}},
          {
            $or: [{firstName:regex},{lastName:regex},{email:regex}],
          },
        ],
      })

      return response.status(200).json({contacts});


      return response.status(200).send("Logout Successful");
    } catch (error) {
      console.log({ error });
      return response.status(500).send("Internal Service Error");  
    }
  };


  export const getContactsForDMList = async (request,response,next) => {
    try{
      let {userID} = request;
      userID = new mongoose.Types.ObjectId(userID);
      const contacts = await Message.aggregate([
        {
          $match:{
            $or:[{sender:userID},{recipient:userID}],
          },
        },
        {
          $sort:{timestamp:-1},
        },
        {$group:{
          _id: {
            $cond: {
              if: {$eq:["$sender",userID]},
              then:"$recipient",
              else:"$sender",
            },
          },
        },},
        {$lookup:{
          from:"users",
          localField:"_id",
          foreignField:"_id",
          as:"contactInfo",
          },
        },
        {
          $unwind:"$contactInfo",
        },
        {
          $project:{
            _id:1,
            lastMessageTime:1,
            email:"$contactInfo.email",
            firstName:"$contactInfo.firstName",
            lastName:"$contactInfo.lastName",
            image:"$contactInfo.image",
            color:"$contactInfo.color",
          },
        },
        {
          $sort:{lastMessageTime:-1},
        },
      ]);

      return response.status(200).json({contacts});


      return response.status(200).send("Logout Successful");
    } catch (error) {
      console.log({ error });
      return response.status(500).send("Internal Service Error");  
    }
  };