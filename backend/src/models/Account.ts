import mongoose, { Document, Schema } from 'mongoose'

export interface IAccount extends Document {
  name: string
  type: 'cash' | 'bank' | 'card' | 'other'
  color: string
  initialBalance: number
  user: mongoose.Types.ObjectId
  createdAt: Date
}

const AccountSchema = new Schema<IAccount>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['cash', 'bank', 'card', 'other'], required: true, default: 'bank' },
    color: { type: String, required: true, default: '#007bff' },
    initialBalance: { type: Number, required: true, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export default mongoose.model<IAccount>('Account', AccountSchema)