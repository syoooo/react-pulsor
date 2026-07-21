import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Drive a loader's `intensity` from a token stream (or any activity signal).
 * Call `ping()` on every chunk: intensity jumps to 1 and falls back to
 * `floor` after `decay` ms of silence — the loader breathes with the stream.
 *
 *   const { intensity, ping } = useStreamIntensity()
 *   stream.on("token", ping)
 *   <PulseBars intensity={intensity} />
 */
export function useStreamIntensity(options: { decay?: number; floor?: number } = {}): {
  intensity: number
  ping: () => void
} {
  const { decay = 900, floor = 0.35 } = options
  const [intensity, setIntensity] = useState(floor)
  const timer = useRef<number | undefined>(undefined)

  const ping = useCallback(() => {
    setIntensity(1)
    if (timer.current !== undefined) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setIntensity(floor), decay)
  }, [decay, floor])

  useEffect(
    () => () => {
      if (timer.current !== undefined) window.clearTimeout(timer.current)
    },
    [],
  )

  return { intensity, ping }
}
