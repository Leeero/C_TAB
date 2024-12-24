export interface Category {
  id: string
  name: string
  icon: string
  isHome?: boolean
  color?: string
}

export interface SavedLink {
  id: string
  title: string
  url: string
  categoryId: string
  timestamp: number
  isDocked: boolean
  icon?: string
}

export interface SearchEngine {
  id: string
  name: string
  searchUrl: string
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