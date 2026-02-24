export interface IUser {
    id: string
    name: string
    email: string
  }
  
  export interface ICategory {
    _id: string
    name: string
    type: 'income' | 'expense'
    color: string
    user: string
    createdAt: string
  }
  
  export interface IAccount {
    _id: string
    name: string
    type: 'cash' | 'bank' | 'card' | 'other'
    color: string
    initialBalance: number
    user: string
    createdAt: string
  }
  
  export interface ITransaction {
    _id: string
    title: string
    amount: number
    type: 'income' | 'expense'
    category: ICategory
    account: IAccount
    user: string
    description?: string
    date: string
    createdAt: string
  }
  
  export interface IAuthResponse {
    user: IUser
  }