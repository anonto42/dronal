import { Router } from "express";
import { ChatController } from "./chat.controller";
import { ChatValidation } from "./chat.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";

export class ChatRoutes {
  public router: Router;
  private chatController: ChatController;

  constructor() {
    this.router = Router();
    this.chatController = new ChatController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this
      .router
      .route("/")
      .get(
        auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
        this.chatController.getAllChats
      )
      .post(
        auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
        validateRequest(ChatValidation.createChatSchema),
        this.chatController.create
      );
      
    this
      .router
      .route("/find")
      .get(
        auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
        this.chatController.findChat
      );
      
    this
      .router
      .route("/:id")
      .get(
        auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
        validateRequest(ChatValidation.chatIdSchema),
        this.chatController.getOneRoom
      )
      .delete(
        auth( USER_ROLES.PROVIDER, USER_ROLES.CLIENT, USER_ROLES.ADMIN ),
        validateRequest(ChatValidation.chatIdSchema),
        this.chatController.deleteOnChat
      );

  }
}

export default new ChatRoutes().router;
