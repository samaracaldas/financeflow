import mongoose, { Document, Schema } from 'mongoose'

export interface ICategory extends Document {
  name: string
  user: mongoose.Types.ObjectId
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default mongoose.model<ICategory>('Category', CategorySchema)