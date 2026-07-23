import { afterEach, describe, expect, it, vi } from "vitest"
import { resolveBarsProps } from "./components/PulseBars"
import { resolveDotsProps } from "./components/PulseDots"

describe("dev-mode arrangement warnings", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("warns when loop-only props are passed to the default line arrangement", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    resolveDotsProps({ ringSize: 30, align: "radial" })
    expect(warn).toHaveBeenCalledOnce()
    const msg = warn.mock.calls[0][0]
    expect(msg).toContain("<PulseDots>")
    expect(msg).toContain("ringSize, align")
    expect(msg).toContain('arrangement="loop"')
    expect(msg).toContain("the default")
  })

  it("warns when line-only props are passed to a loop", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    resolveDotsProps({ arrangement: "loop", size: 9 })
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toContain('arrangement="line"')
  })

  it("stays silent when props match the arrangement", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    resolveDotsProps({ arrangement: "loop", ringSize: 30, thickness: 4 })
    resolveDotsProps({ size: 9, gap: 5 })
    resolveBarsProps({ count: 6, length: 20, origin: "start" })
    resolveBarsProps({ arrangement: "loop", ringSize: 32, stroke: 10 })
    expect(warn).not.toHaveBeenCalled()
  })

  it("emits each message once", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    resolveBarsProps({ stroke: 12 })
    resolveBarsProps({ stroke: 12 })
    expect(warn).toHaveBeenCalledOnce()
  })
})
