import colors from 'colors';
import { Server } from 'socket.io';
import { logger } from '../shared/logger';
import { redisDB } from '../redis/connectedUsers';
import { INotification } from '../app/modules/notification/notification.interface';

const socket = (io: Server) => {
  io.on('connection', socket => {
    logger.info(colors.blue('A user connected'));

    // Set user id in redis
    socket.on("set-online", async (userId) => {
      await redisDB.set(`user:${userId}`, socket.id);
    })

    // Send notification to provider
    socket.on("notification", async (data: INotification) => {
      const userId = data.for;
      const socketId = await redisDB.get(`user:${userId}`);
      socket.to(socketId!).emit("notification", data.message)
    })

    //disconnect
    socket.on('disconnect', async () => {
      logger.info(colors.red('A user disconnect'));
      await redisDB.del(`user:${socket.id}`);
    });
  });
};

export const socketHelper = { socket };
