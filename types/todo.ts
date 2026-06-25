export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Todo {
  id: number
  title: string
  description: string | null
  completed: boolean
  priority: Priority
  dueDate: string | null
  category: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateTodoInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string
  category?: string
  tags?: string[]
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  completed?: boolean
  priority?: Priority
  dueDate?: string | null
  category?: string
  tags?: string[]
}

export interface Filters {
  search: string
  category: string
  priority: string
  completed: string
}
