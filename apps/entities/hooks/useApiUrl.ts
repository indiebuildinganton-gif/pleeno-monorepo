import { useCallback } from 'react'

export function useApiUrl() {
  return useCallback((path: string) => {
    if (path.startsWith('/entities')) {
      return path
    }
    return `/entities${path}`
  }, [])
}

export function getApiUrl(path: string): string {
  if (path.startsWith('/entities')) {
    return path
  }
  return `/entities${path}`
}
