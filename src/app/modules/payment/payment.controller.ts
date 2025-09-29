import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { PaymentService } from "./payment.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { htmlTemplate } from "../../../shared/htmlTemplate";

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  public success = catchAsync(async (req: Request, res: Response) => {

    const result = await this.paymentService.success(req.query);

    res.send(result);
  });

  public failure = catchAsync(async (req: Request, res: Response) => {

    const result = htmlTemplate.paymentError();

    res.send(result);
  });
  
}
