import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { redisDB } from '../redis/connectedUsers';
import { INotification } from '../app/modules/notification/notification.interface';
import { IMessage } from '../app/modules/Message/message.interface';
import { IChat } from '../app/modules/chat/chat.interface';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    // Set user id in redis
    socket.on("set-online", async (userId) => {
      await redisDB.set(`user:${userId}`, socket.id);
      console.log("User connecntd with socket ", socket.id)
    })

    // Send notification 
    socket.on("notification", async (data: INotification) => {
      const userId = data.for;
      const socketId = await redisDB.get(`user:${userId}`);
      socket.to(socketId!).emit("notification", data.message)
    })

    // Send message 
    socket.on("message", async (data: { message: IMessage, chat: IChat }) => {
      data.chat.participants.forEach(async element => {
        const socketId = await redisDB.get(`user:${element}`);
        socket.to(socketId!).emit("message", data.message)
      });
    })

    //disconnect
    socket.on('disconnect', async () => {
      logger.info(colors.red('A user disconnect'));
      await redisDB.del(`user:${socket.id}`);
    });
  });
};

export const socketHelper = { socket };
