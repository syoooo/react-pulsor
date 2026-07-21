import { describe, expect, it } from "vitest"
import type { SnippetElement, SnippetProps } from "./cssSnippet"
import { cssSnippet } from "./cssSnippet"
import { recipes } from "./recipes"
import { svgSnippet } from "./svgSnippet"

/**
 * The recipes collectively exercise every geometry branch (grid, line bars,
 * loop bars, line dots, loop dots) and every color mode — snapshotting both
 * exporters over all of them locks the whole output surface.
 */
describe("snippet exports over all recipes", () => {
  for (const [name, recipe] of Object.entries(recipes)) {
    const element = recipe.element as SnippetElement
    const props = recipe.props as SnippetProps

    it(`cssSnippet: ${name}`, () => {
      const out = cssSnippet(element, props)
      expect(out).toContain("@keyframes")
      expect(out).toContain('role="status"')
      expect(out).toMatchSnapshot()
    })

    it(`svgSnippet: ${name}`, () => {
      const out = svgSnippet(element, props)
      expect(out.startsWith("<svg")).toBe(true)
      expect(out).toContain("<rect")
      expect(out).toMatchSnapshot()
    })
  }

  it("svgSnippet frames differ over time", () => {
    const a = svgSnippet("dots", recipes.orbit.props as SnippetProps, { atMs: 0 })
    const b = svgSnippet("dots", recipes.orbit.props as SnippetProps, { atMs: 400 })
    expect(a).not.toBe(b)
  })
})
