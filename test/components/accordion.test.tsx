import { describe, it, expect } from "vitest"
import React, { act } from "react"
import { createRoot } from "react-dom/client"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AccordionDemo, FaqAccordion } from "@/components/marketing/FaqAccordion"

describe("Accordion UI Component", () => {
  it("renders AccordionDemo with exact user-requested structure and items", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(<AccordionDemo />)
    })

    expect(container.textContent).toContain("What are your shipping options?")
    expect(container.textContent).toContain("What is your return policy?")
    expect(container.textContent).toContain("How can I contact customer support?")
    expect(container.textContent).toContain("We offer standard (5-7 days)")

    root.unmount()
    container.remove()
  })

  it("renders custom Accordion in multiple selection mode", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <Accordion defaultValue={["shipping"]} className="max-w-lg">
          <AccordionItem value="shipping">
            <AccordionTrigger>Shipping info</AccordionTrigger>
            <AccordionContent>Details on delivery</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    })

    expect(container.textContent).toContain("Shipping info")
    expect(container.textContent).toContain("Details on delivery")

    root.unmount()
    container.remove()
  })

  it("renders FaqAccordion component with dynamic items", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    const items = [
      { q: "Is it really free?", a: "Yes, 100% free and open source." },
      { q: "Can I export CSS?", a: "Yes, clean Tailwind CSS is generated." }
    ]

    await act(async () => {
      root.render(<FaqAccordion items={items} />)
    })

    expect(container.textContent).toContain("Is it really free?")
    expect(container.textContent).toContain("Can I export CSS?")
    expect(container.textContent).toContain("Yes, 100% free and open source.")

    root.unmount()
    container.remove()
  })
})
