import { Router, Request, Response, NextFunction } from "express";
import { ClientController } from "./client.controller";
import { ClientValidation } from "./client.validation";
import auth from "../../middlewares/auth";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { USER_ROLES } from "../../../enums/user";

export class ClientRoutes {
  public router: Router;
  private clientController: ClientController;

  constructor() {
    this.router = Router();
    this.clientController = new ClientController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    
    // GET /profile
    this
    .router
    .route("/")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      this.clientController.getUserProfile
    )

    // PATCH /profile
    this
    .router
    .route("/profile")
    .patch(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      fileUploadHandler(),
      (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
          req.body = ClientValidation.updateUserZodSchema.parse(
            JSON.parse(req.body.data)
          );
        }
        return this.clientController.updateProfile(req, res, next);
      }
    );
  }
}

export default new ClientRoutes().router;