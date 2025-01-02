import {Server as SockerIOServer} from "socket.io"
import Message from "./models/MessagesModel.js";


const setupSocket = (server) => {
    const io = new SockerIOServer(server,{
        cors: {
            origin: process.env.ORIGIN,
            methods: ["GET","POST"],
            credentials: true
        },
    });

    const userSocketMap = new Map();
    
    const disconnect = (socket)=>{
        console.log(`Client Disconnect: ${socket.id}`);
        for(const [userID,socketId] of userSocketMap.entries()) {
            if(socketId===socket.id) {
                userSocketMap.delete(userID);
                break;
            }
        }
    };

    const sendMessage = async(message) => {
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const createdMessage = await Message.create(message);

        const messageData = await Message.findById(createdMessage._id).populate("sender","id email firstName lastName image color").populate("recipient","id email firstName lastName image color");
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("recieveMessage",messageData);
        }
        if (senderSocketId){
            io.to(senderSocketId).emit("recieveMessage",messageData);
        }
    };

    io.on("connection",(socket) =>{
        const userID = socket.handshake.query.userID;
        if(userID) {
            userSocketMap.set(userID,socket.id);
            console.log(`User connected: ${userID} with socket ID: ${socket.id}`);
        } else {
            console.log("User ID not provided during connection.");
        }

        socket.on("sendMessage",sendMessage)
        socket.on("disconnect", ()=>disconnect(socket));
    });
};
export default setupSocket;