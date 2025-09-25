import { model, Schema } from "mongoose";
import { INotification } from "./notification.interface";

const notificationSchema = new Schema<INotification>(
  {
    for: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    readAt: { 
      type: Date, 
      default: null 
    },
  },
  { 
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
  }
);

notificationSchema.index({ for: 1, createdAt: -1 });

export const Notification = model<INotification>("Notification",notificationSchema);