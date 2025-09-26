import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ClientService } from "./client.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getSingleFilePath } from "../../../shared/getFilePath";

export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  public getUserProfile = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.getUserProfile(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User profile retrieved successfully",
      data: result,
    });
  });

  public updateProfile = catchAsync(async (req: Request | any, res: Response) => {
    const image = getSingleFilePath(req.files, "image");

    if (image) req.body.image = image;

    if(req.body.longitude && req.body.latitude) req.body.location = { type: "Point", coordinates: [Number(req.body.longitude), Number(req.body.latitude)] };

    const result = await this.clientService.updateProfile(req.user, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: result,
    });
  });

  public deleteProfile = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.deleteProfile(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Profile deleted successfully",
      data: result,
    });
  });

  public getProviders = catchAsync(async (req: Request | any, res: Response) => {
    
    const result = await this.clientService.getProviders(req.user, req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Providers retrieved successfully",
      data: result,
    });
  });

  public getProviderById = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.getProviderById(req.user, req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Provider retrieved successfully",
      data: result,
    });
  });

  public getFavorites = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.getFavorites(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Favorites retrieved successfully",
      data: result,
    });
  });

  public addFavorite = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.addFavorite(req.user, req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Favorite added successfully",
      data: result,
    });
  });

  public removeFavorite = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.removeFavorite(req.user, req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Favorite removed successfully",
      data: result,
    });
  });

}