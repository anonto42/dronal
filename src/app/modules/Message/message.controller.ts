import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MessageService } from "./message.service";
import { Request, Response } from "express";
import { getSingleFilePath } from "../../../shared/getFilePath";


export class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    public create = catchAsync(async (req: Request, res: Response) => {

        const image = getSingleFilePath(req.files, "image");

        if(image) req.body.image = image;

        const result = await this.messageService.create(req.user,req.body);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.CREATED,
          message: "Message created successfully",
          data: result,
        });
    });

    public messagesOfChat = catchAsync(async (req: Request, res: Response) => {

        const result = await this.messageService.messagesOfChat(req.user,req.query, req.params.id);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Messages of chat retrieved successfully",
          data: result,
        });
    });

    public updateMessage = catchAsync(async (req: Request, res: Response) => {

        const image = getSingleFilePath(req.files, "image");

        if(image) req.body.image = image;

        const result = await this.messageService.updateMessage(req.user, req.params.id, req.body);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Message updated successfully",
          data: result,
        });
    });

    public deleteMessage = catchAsync(async (req: Request, res: Response) => {

        const result = await this.messageService.deleteMessage(req.user, req.params.id);
    
        sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: "Message delete Successfully",
          data: result,
        });
    });
    
}
