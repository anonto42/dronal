import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ProviderService } from "./provider.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getSingleFilePath } from "../../../shared/getFilePath";

export class ProviderController {
  private providerService: ProviderService;

  constructor() {
    this.providerService = new ProviderService();
  }

  public provider = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.profile(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Provider retrieved successfully",
      data: result,
    });
  });

  public providerHome = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.providerHome(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Provider home retrieved successfully",
      data: result,
    });
  });

  public providerProfileUpdate = catchAsync(async (req: Request, res: Response) => {

    const image = getSingleFilePath(req.files,"image");

    if (image) req.body.image = image;

    if(req.body.longitude && req.body.latitude) req.body.location = { type: "Point", coordinates: [Number(req.body.longitude), Number(req.body.latitude)] };

    const result = await this.providerService.profileUpdate(req.user, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Provider update successfully",
      data: result,
    });
  });

  public providerProfileDelete = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.profileDelete(req.user,req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Provider delete successfully",
      data: result,
    });
  });

  public providerVerification = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.verificaitonStatusCheck(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully get verification info",
      data: result,
    });
  });

  public sendVerification = catchAsync(async (req: Request, res: Response) => {

    const nid = getSingleFilePath(req.files,"nid");
    const license = getSingleFilePath(req.files,"license");

    if (nid) req.body.nid = nid;
    if (license) req.body.license = license;

    const result = await this.providerService.sendVerificaitonRequest(req.user,req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully send verification request",
      data: result,
    });
  });

  public providerServices = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.providerServices(req.user,req.query as any);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully get provider services",
      data: result,
    });
  });

  public addService = catchAsync(async (req: Request, res: Response) => {

    const image = getSingleFilePath(req.files,"image");

    if (image) req.body.image = image;

    const result = await this.providerService.addService(req.user,req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully add service",
      data: result,
    });
  });

  public deleteService = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.deleteService(req.user,req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully delete service",
      data: result,
    });
  });

  public updateService = catchAsync(async (req: Request, res: Response) => {

    const image = getSingleFilePath(req.files,"image");

    if (image) req.body.image = image;

    const result = await this.providerService.updateService(req.user,req.params.id,req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully update service",
      data: result,
    });
  });

  public viewService = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.viewService(req.user,req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully get service",
      data: result,
    });
  });

  public getBookings = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.providerService.getBookings(req.user, req.query, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bookings retrieved successfully",
      data: result,
    });
  });

  public actionBooking = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.providerService.actionBooking(req.user, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bookings retrieved successfully",
      data: result,
    });
  });

  public seeBooking = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.providerService.seeBooking(req.user, req.params.id );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bookings retrieved successfully",
      data: result,
    });
  });

  public getCategories = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.getCategories(req.query as any);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Categories retrieved successfully",
      data: result,
    });
  });

  public getCustomer = catchAsync(async (req: Request, res: Response) => {

    const result = await this.providerService.getCustomer( req.params.id as string );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Customer retrieved successfully",
      data: result,
    });
  });

  public cancelBooking = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.providerService.cancelBooking(req.user, req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Booking cancelled successfully",
      data: result,
    });
  });

  public wallet = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.providerService.wallet(req.user, req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Wallet retrieved successfully",
      data: result,
    });
  });

  public whitdrawal = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.providerService.whitdrawal(req.user, req.body, req);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Wallet retrieved successfully",
      data: result,
    });
  });
}
