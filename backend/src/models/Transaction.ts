import mongoose, { Document, Schema } from 'mongoose'

export interface ITransaction extends Document {
  title: string
  amount: number
  type: 'income' | 'expense'
  category: mongoose.Types.ObjectId
  account: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  description?: string
  date: Date
  createdAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String },
    date: { type: Date, required: true },
  },
  { timestamps: true }
)

export default mongoose.model<ITransaction>('Transaction', TransactionSchema)