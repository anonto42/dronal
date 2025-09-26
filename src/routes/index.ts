import express from 'express';
import AuthRoutes from '../app/modules/auth/auth.route';
import UserRoutes from '../app/modules/client/client.route';
import ProviderRoutes from '../app/modules/provider/provider.route';
import NotificationRoutes from '../app/modules/notification/notification.route';
import ChatRoutes from '../app/modules/chat/chat.route';
import MessageRoutes from '../app/modules/Message/message.route';
const router = express.Router();

const apiRoutes = [
  {
    path: '/client',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/provider',
    route: ProviderRoutes
  },
  {
    path: '/notification',
    route: NotificationRoutes
  },
  {
    path: '/chat',
    route: ChatRoutes
  },
  {
    path: '/message',
    route: MessageRoutes
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;