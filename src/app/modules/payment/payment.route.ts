import { Router } from "express";
import { PaymentController } from "./payment.controller";
import { PaymentValidation } from "./payment.validation";
import validateRequest from "../../middlewares/validateRequest";

export class PaymentRoutes {
  public router: Router;
  private paymentController: PaymentController;

  constructor() {
    this.router = Router();
    this.paymentController = new PaymentController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    this.router
      .route("/success")
      .get(
        this.paymentController.success
      );

    this.router
      .route("/cancel")
      // .get(this.paymentController.cancel);

  }
}

export default new PaymentRoutes().router;
