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

    this.router
      .route("/service")
      .get(
        auth( USER_ROLES.PROVIDER ),
        this.providerController.providerServices
      )
      .post(
        auth( USER_ROLES.PROVIDER ),
        fileUploadHandler(),
        validateRequest( ProviderValidation.createServiceSchema ),
        this.providerController.addService
      );

    this.router
      .route("/service/:id")
      .get(
        auth( USER_ROLES.PROVIDER ),
        validateRequest( ProviderValidation.viewServiceSchema ),
        this.providerController.viewService
      )
      .patch(
        auth( USER_ROLES.PROVIDER ),
        fileUploadHandler(),
        validateRequest( ProviderValidation.updateServiceSchema ),
        this.providerController.updateService
      )
      .delete(
        auth( USER_ROLES.PROVIDER ),
        validateRequest( ProviderValidation.deleteServiceSchema ),
        this.providerController.deleteService
      );

    this
    .router
    .route("/book")
    .get(
      auth(USER_ROLES.PROVIDER),
      validateRequest(ProviderValidation.getPaginationZodSchema),
      this.providerController.getBookings
    )
    .post(
      auth(USER_ROLES.PROVIDER),
      validateRequest(ProviderValidation.bookingsActionZodSchema),
      this.providerController.actionBooking
    )

    this
    .router
    .route("/book/:id")
    .get(
      auth(USER_ROLES.PROVIDER),
      validateRequest(ProviderValidation.viewServiceSchema),
      this.providerController.seeBooking
    )

    this
    .router
    .route("/categories")
    .get(
      auth(USER_ROLES.PROVIDER),
      validateRequest(ProviderValidation.getCategoriesSchema),
      this.providerController.getCategories
    )

    this
    .router
    .route("/customer/:id")
    .get(
      auth(USER_ROLES.PROVIDER),
      validateRequest(ProviderValidation.viewServiceSchema),
      this.providerController.getCustomer
    )

  }
}
 
export default new ProviderRoutes().router;
