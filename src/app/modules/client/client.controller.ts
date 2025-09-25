import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ClientService } from "./client.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  // GET /users/profile
  public getUserProfile = catchAsync(async (req: Request | any, res: Response) => {
    const user = req.user; // populated from auth middleware
    const result = await this.clientService.getUserProfile(user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User profile retrieved successfully",
      data: result,
    });
  });

  // PUT /users/profile
  public updateProfile = catchAsync(async (req: Request | any, res: Response) => {
    const user = req.user;
    const result = await this.clientService.updateProfile(user, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: result,
    });
  });
}