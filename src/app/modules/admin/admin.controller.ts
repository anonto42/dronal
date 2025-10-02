import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AdminService } from "./admin.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getSingleFilePath } from "../../../shared/getFilePath";

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  public overview = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.overview();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Admin overview retrieved successfully",
      data: result,
    });
  });

  public getUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.getUsers(req.query as any);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Users retrieved successfully",
      data: result,
    });
  });

  public getUser = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.getUser(req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User retrieved successfully",
      data: result,
    });
  });

  public addNewCategory = catchAsync(async (req: Request, res: Response) => {

    const image = getSingleFilePath(req.files, "image");

    req.body.image = image;

    const result = await this.adminService.addNewCategory(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category added successfully",
      data: result,
    });
  });

  public getCategories = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.getCategories(req.query as any);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Categories retrieved successfully",
      data: result,
    });
  });

  public updateCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.updateCategory(req.body.id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category updated successfully",
      data: result,
    });
  });

  public deleteCategory = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.deleteCategory(req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Category deleted successfully",
      data: result,
    });
  });

  public getPolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.getPolicy();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Policy retrieved successfully",
      data: result,
    });
  });

  public updatePolicy = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.upsertPolicy(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Policy updated successfully",
      data: result,
    });
  });

  public getTerms = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.getTerms();

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Terms retrieved successfully",
      data: result,
    });
  });

  public updateTerms = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.upsertTerms(req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Terms updated successfully",
      data: result,
    });
  });

  public blockAndUnblockUser = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.blockAndUnblockUser(req.params.id, req.params.status);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "User blocked successfully",
      data: result,
    });
  });

  public getRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.getRequests(req.query as any);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Requests retrieved successfully",
      data: result,
    });
  });

  public approveOrReject = catchAsync(async (req: Request, res: Response) => {
    const result = await this.adminService.approveOrReject(req.params.id, req.params.status);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Request approved/rejected successfully",
      data: result,
    });
  });

}
