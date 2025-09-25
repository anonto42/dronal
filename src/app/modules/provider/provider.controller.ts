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

  public providerProfileUpdate = catchAsync(async (req: Request, res: Response) => {

    const image = getSingleFilePath(req.files,"image");

    if (image) req.body.image = image;

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

}
