export type SearchResult = {
  id: string
  companyName: string
  address: string | null
  phone: string | null
  website: string | null
  distanceMiles: number | null
  leadScore: number
  grade: 'A' | 'B' | 'C' | 'D'
  capabilitySummary: string | null
}
