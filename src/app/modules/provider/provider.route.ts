import { Router } from "express";
import { ProviderController } from "./provider.controller";
import { ProviderValidation } from "./provider.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import fileUploadHandler from "../../middlewares/fileUploadHandler";

export class ProviderRoutes {
  public router: Router;
  private providerController: ProviderController;

  constructor() {
    this.router = Router();
    this.providerController = new ProviderController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this.router
      .route("/")
      .get(
        auth( USER_ROLES.PROVIDER ),
        this.providerController.provider
      )
      .patch(
        auth( USER_ROLES.PROVIDER ),
        validateRequest( ProviderValidation.updateProviderProfileSchema ),
        fileUploadHandler(),
        this.providerController.providerProfileUpdate
      )
      .delete(
        auth( USER_ROLES.PROVIDER ),
        this.providerController.providerProfileDelete
      );

    this.router
      .route("/verification")
      .get(
        auth( USER_ROLES.PROVIDER ),
        this.providerController.providerVerification
      )
      .post(
        auth( USER_ROLES.PROVIDER ),
        fileUploadHandler(),
        this.providerController.sendVerification
      );
  }
}
 
export default new ProviderRoutes().router;
