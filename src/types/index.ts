export interface Category {
  id: string
  name: string
  icon: string
  isHome?: boolean
  color?: string
  order?: number
}

export interface SavedLink {
  id: string
  title: string
  url: string
  categoryId: string
  timestamp: number
  isDocked: boolean
  icon?: string
  order?: number
  description?: string
  tags?: string[]
}

export interface SearchEngine {
  id: string
  name: string
  searchUrl: string
  icon?: string
  isBuiltin?: boolean
}

export interface TabSession {
  id: string
  name: string
  tabs: Array<{
    title: string
    url: string
    favIconUrl?: string
  }>
  createdAt: number
  updatedAt: number
}

export interface ITabItem {
  name: string
  icon?: string
  children?: {
    name: string
    src?: string
    url?: string
    type?: string
    backgroundColor?: string
    iconText?: string
    view?: number
  }[]
}

export interface ITabData {
  navConfig: ITabItem[]
}
