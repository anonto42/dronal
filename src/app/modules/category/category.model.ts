import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    subCategory: {
        type: [String],
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

export const Category = model<ICategory>('Category', categorySchema);