import { useEffect } from "react"

export function Provider({ children }: { children: unknown }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-ds", "fixture-ds")
  }, [])
  return children
}
