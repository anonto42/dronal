import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ChatService } from "./chat.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  public create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.chatService.create(req.user,req.body);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: "Chat created successfully",
      data: result,
    });
  });

  public getOneRoom = catchAsync(async (req: Request, res: Response) => {
    const result = await this.chatService.getById(req.params.id,req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Chat retrieved successfully",
      data: result,
    });
  });

  public getAllChats = catchAsync(async (req: Request, res: Response) => {
    
    const result = await this.chatService.allChats(req.user);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "All Chat's retrieved successfully",
      data: result,
    });
  });

  public deleteOnChat = catchAsync(async (req: Request, res: Response) => {
    
    const result = await this.chatService.deleteOneChat(req.user ,req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Chat delete successfully",
      data: result,
    });
  });

  public findChat = catchAsync(async (req: Request, res: Response) => {
    
    const result = await this.chatService.findChat(req.user, req.query.name as string);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "Chat found successfully",
      data: result,
    });
  });
}
