import mongoose, { Document, Schema } from 'mongoose'

export interface ICategory extends Document {
  name: string
  type: 'income' | 'expense'
  color: string
  user: mongoose.Types.ObjectId
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    color: { type: String, required: true, default: '#6c757d' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default mongoose.model<ICategory>('Category', CategorySchema)