import { Router } from "express";
import { ClientController } from "./client.controller";
import { ClientValidation } from "./client.validation";
import auth from "../../middlewares/auth";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
import { USER_ROLES } from "../../../enums/user";
import validateRequest from "../../middlewares/validateRequest";

export class ClientRoutes {
  public router: Router;
  private clientController: ClientController;

  constructor() {
    this.router = Router();
    this.clientController = new ClientController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    
    this
    .router
    .route("/")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      this.clientController.getUserProfile
    )
    .patch(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest( ClientValidation.updateUserZodSchema ),
      fileUploadHandler(),
      this.clientController.updateProfile
    )
    .delete(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      this.clientController.deleteProfile
    );

    this
    .router
    .route("/services")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.getPaginationZodSchema),
      this.clientController.getServices
    );

    this
    .router
    .route("/provider/:id")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.aProviderZodSchema),
      this.clientController.getProviderById
    );

    this
    .router
    .route("/favorites")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.getPaginationZodSchema),
      this.clientController.getFavorites
    );

    this
    .router
    .route("/favorites/:id")
    .post(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.AddFavoriteZodSchema),
      this.clientController.addFavorite
    )
    .delete(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.RemoveFavoriteZodSchema),
      this.clientController.removeFavorite
    );

    this
    .router
    .route("/book")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.getPaginationZodSchema),
      this.clientController.getBookings
    )
    .post(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.createBookingZodSchema),
      this.clientController.createBooking
    )

    this
    .router
    .route("/book/:id")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.getPaginationZodSchema),
      this.clientController.bookScreen
    )
    .patch(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.updateBookingZodSchema),
      this.clientController.updateBooking
    )
    .delete(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.removeBookingZodSchema),
      this.clientController.cancelBooking
    )

    this
    .router
    .route("/book/view/:id")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.getPaginationZodSchema),
      this.clientController.seeBooking
    )

    this
    .router
    .route("/categories")
    .get(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT),
      validateRequest(ClientValidation.getCategoriesZodSchema),
      this.clientController.getCategories
    )

  }
}

export default new ClientRoutes().router;