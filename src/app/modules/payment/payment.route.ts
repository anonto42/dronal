import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";

export class PaymentRoutes {
  public router: Router;
  private paymentController: PaymentController;

  constructor() {
    this.router = Router();
    this.paymentController = new PaymentController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this
      .router
      .route("/success")
      .get(
        this.paymentController.success
      );

    this
      .router
      .route("/account/:id")
      .get(
        this.paymentController.successAccount
      );

    this
      .router
      .route("/account/refresh/:id")
      .get(
        this.paymentController.refreshAccount
      );

    this
      .router
      .route("/cancel")
      .get(
        this.paymentController.failure
      )

    this
      .router
      .route("/connected-account")
      .get(
        auth(USER_ROLES.PROVIDER),
        this.paymentController.createConnectedAccount
      );
  }
}

export default new PaymentRoutes().router;
