import { useEffect } from "react"

export function Clock({ tick }: { tick: () => void }) {
  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) tick()
    }, 1000)
    return () => clearInterval(timer)
  }, [tick])
  return <time />
}
