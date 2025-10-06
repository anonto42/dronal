import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SupportService } from "./support.service";
import { Request, Response } from "express";
import { getSingleFilePath } from "../../../shared/getFilePath";


export class SupportController {
    private supportService: SupportService;

    constructor() {
      this.supportService = new SupportService();
    }

    public createSupport = catchAsync(async (req: Request | any, res: Response) => {
        const image = getSingleFilePath(req.files, "image");
        if (image) req.body.attachment = image;

        const result = await this.supportService.createSupport(req.user, req.body);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Support created successfully",
          data: result,
        });
    });

    public getSupports = catchAsync(async (req: Request | any, res: Response) => {
        const result = await this.supportService.getSupports(req.query);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Supports fetched successfully",
          data: result,
        });
    });

    public markAsResolve = catchAsync(async (req: Request | any, res: Response) => {
        const result = await this.supportService.markAsResolve(req.user, req.params.id);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Support given successfully",
          data: result,
        });
    });
    
}
