import { Router } from "express";
import { NotificationController } from "./notification.controller";
import validateRequest from "../../middlewares/validateRequest";
import { NotificationValidation } from "./notification.validation";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

export class NotificationRoutes {
  public router: Router;
  private notificationController: NotificationController;

  constructor() {
    this.router = Router();
    this.notificationController = new NotificationController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    
    this.router
      .route("/")
      .get(
        auth( USER_ROLES.ADMIN, USER_ROLES.PROVIDER, USER_ROLES.CLIENT ),
        validateRequest( NotificationValidation.getNotificationSchema ),
        this.notificationController.getMany
      )
      .delete(
        auth( USER_ROLES.ADMIN, USER_ROLES.PROVIDER, USER_ROLES.CLIENT ),
        validateRequest( NotificationValidation.deleteNotificationSchema ),
        this.notificationController.delete
      );

    this.router
      .route("/markAllAsRead")
      .patch(
        auth( USER_ROLES.ADMIN, USER_ROLES.PROVIDER, USER_ROLES.CLIENT ),
        validateRequest( NotificationValidation.updateNotificationSchema ),
        this.notificationController.markAllAsRead
      );
  }
}

export default new NotificationRoutes().router;
