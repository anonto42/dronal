import { Router } from "express";
import { MessageController } from "./message.controller";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { MessageValidatior } from "./message.validation";


export class MessageRoutes {
  public router: Router;
  public MessageController: MessageController;

  constructor() {
    this.router = Router();
    this.MessageController = new MessageController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this
        .router
        .route("/")
        .post(
            auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
            fileUploadHandler(),
            validateRequest( MessageValidatior.sendMessageValidator ),
            this.MessageController.create
        )

    this
        .router
        .route("/:id")
        .get(
            auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
            validateRequest( MessageValidatior.getMessagesOfChat ),
            this.MessageController.messagesOfChat
        )
        .patch(
            auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
            fileUploadHandler(),
            validateRequest( MessageValidatior.updateMessage ),
            this.MessageController.updateMessage
        )
        .delete(
            auth( USER_ROLES.PROVIDER,  USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
            validateRequest( MessageValidatior.deleteMessage ),
            this.MessageController.deleteMessage
        )
  }
}

export default new MessageRoutes().router;