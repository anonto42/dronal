import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { NotificationService } from "./notification.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  public getMany = catchAsync(async (req: Request, res: Response) => {
    
    const user = req.user;

    const paginationOptions = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: "createdAt",
      sortOrder: req.query.sortOrder as "asc" | "desc" || "desc",
    };

    const result = await this.notificationService.getMany(user, paginationOptions);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Notifications retrieved successfully",
      data: result,
    });
  });

  public delete = catchAsync(async (req: Request, res: Response) => {

    await this.notificationService.delete(req.body.ids as string[]);
    
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Notification deleted successfully",
    });
  });

  public markAllAsRead = catchAsync(async (req: Request, res: Response) => {

    await this.notificationService.markAllAsRead( req.body.ids as string[] );

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Notifications marked as read",
    });
  });
}
