import type { ReactNode } from "react"

export interface SectionButton {
  text: string
  href?: string
  color?: 'red' | 'blue'
}

export interface Section {
  id: string
  title: ReactNode
  subtitle?: ReactNode
  content?: string
  buttons?: SectionButton[]
}

export interface SectionProps extends Section {
  isActive: boolean
}