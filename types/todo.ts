export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Todo {
  id: number
  title: string
  description: string | null
  completed: boolean
  priority: Priority
  startDate: string | null
  dueDate: string | null
  category: string | null
  tags: string[]
  owner: string
  createdAt: string
  updatedAt: string
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Priority
  startDate?: string
  dueDate?: string
  category?: string
  tags?: string[]
  owner?: string
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  completed?: boolean
  priority?: Priority
  startDate?: string | null
  dueDate?: string | null
  category?: string
  tags?: string[]
}

export interface Filters {
  search: string
  category: string
  priority: string
  completed: string
  dateFrom: string
  dateTo: string
  noDate: string
}
