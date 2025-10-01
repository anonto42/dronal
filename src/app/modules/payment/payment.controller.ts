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

  public createConnectedAccount = catchAsync(async (req: Request, res: Response) => {

    const result = await this.paymentService.createConnectedAccount(req);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Connected account created successfully",
      data: result
    });
  });

  public successAccount = catchAsync(async (req: Request, res: Response) => {

    const result = await this.paymentService.successAccount(req);

    res.send(result);
  });

  public refreshAccount = catchAsync(async (req: Request, res: Response) => {

    const result = await this.paymentService.refreshAccount(req);

    res.send(result);
  });
}
