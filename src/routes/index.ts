import express from 'express';
import AuthRoutes from '../app/modules/auth/auth.route';
import UserRoutes from '../app/modules/client/client.route';
import ProviderRoutes from '../app/modules/provider/provider.route';
import NotificationRoutes from '../app/modules/notification/notification.route';
import ChatRoutes from '../app/modules/chat/chat.route';
import MessageRoutes from '../app/modules/Message/message.route';
import PaymentRoutes from '../app/modules/payment/payment.route';
import AdminRoutes from '../app/modules/admin/admin.route';
import SupportRoutes from '../app/modules/HelpAndSupport/support.route';

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
  },
  {
    path: '/payment',
    route: PaymentRoutes
  },
  {
    path: '/admin',
    route: AdminRoutes
  },
  {
    path: '/support',
    route: SupportRoutes
  }
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;