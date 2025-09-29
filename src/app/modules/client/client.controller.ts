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

  public getServices = catchAsync(async (req: Request | any, res: Response) => {
    
    const result = await this.clientService.getServices(req.user, req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Services retrieved successfully",
      data: result,
    });
  });

  public getProviderById = catchAsync(async (req: Request | any, res: Response) => {
    const result = await this.clientService.getProviderById(req.user, req.params.id, req.query);

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

  public createBooking = catchAsync(async (req: Request | any, res: Response) => {

    if( req.body.longitude && req.body.latitude) req.body.location = { type: "Point", coordinates: [Number(req.body.longitude), Number(req.body.latitude)] };

    const result = await this.clientService.sendBooking(req.user, req.body, req);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully create Booking",
      data: result,
    });
  });

  public updateBooking = catchAsync(async (req: Request | any, res: Response) => {

    if( req.body.longitude && req.body.latitude) req.body.location = { type: "Point", coordinates: [Number(req.body.longitude), Number(req.body.latitude)] };

    const result = await this.clientService.updateBooking(req.user, req.params.id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully update Booking",
      data: result,
    });
  });

  public cancelBooking = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.clientService.cancelBooking(req.user, req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Successfully cancel Booking",
      data: result,
    });
  });

  public getBookings = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.clientService.getBookings(req.user, req.query, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bookings retrieved successfully",
      data: result,
    });
  });
  
  public bookScreen = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.clientService.bookScreen(req.params.id, req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bookings screen retrieved successfully",
      data: result,
    });
  });

  public seeBooking = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.clientService.seeBooking(req.user, req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Bookings screen retrieved successfully",
      data: result,
    });
  });

  public getCategories = catchAsync(async (req: Request | any, res: Response) => {

    const result = await this.clientService.getCategories(req.query);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Categories retrieved successfully",
      data: result,
    });
  });

}