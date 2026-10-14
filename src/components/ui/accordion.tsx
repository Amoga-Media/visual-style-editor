import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type AccordionProps = (
  | (Omit<AccordionPrimitive.AccordionSingleProps, "type" | "defaultValue" | "value" | "onValueChange"> & {
      type?: "single"
      defaultValue?: string
      value?: string
      onValueChange?: (value: string) => void
    })
  | (Omit<AccordionPrimitive.AccordionMultipleProps, "type" | "defaultValue" | "value" | "onValueChange"> & {
      type?: "multiple"
      defaultValue?: string[]
      value?: string[]
      onValueChange?: (value: string[]) => void
    })
) & {
  className?: string
}

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ className, type, ...props }, ref) => {
  const isArray = Array.isArray((props as { defaultValue?: unknown }).defaultValue)
  const resolvedType = type || (isArray ? "multiple" : "single")

  if (resolvedType === "multiple") {
    const multipleProps = props as AccordionPrimitive.AccordionMultipleProps
    return (
      <AccordionPrimitive.Root
        ref={ref}
        {...multipleProps}
        type="multiple"
        className={cn("w-full space-y-3", className)}
      />
    )
  }

  const singleProps = props as AccordionPrimitive.AccordionSingleProps
  return (
    <AccordionPrimitive.Root
      ref={ref}
      {...singleProps}
      type="single"
      collapsible
      className={cn("w-full space-y-3", className)}
    />
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border rounded-xl overflow-hidden transition-all duration-200",
      className
    )}
    style={{
      backgroundColor: "var(--surface-1)",
      borderColor: "var(--border)",
      boxShadow: "var(--shadow-sm)",
    }}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex m-0">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between p-4 sm:p-5 text-left font-medium transition-colors text-sm sm:text-base [&[data-state=open]>svg]:rotate-180 cursor-pointer select-none",
        className
      )}
      style={{
        color: "var(--ink-1)",
      }}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" style={{ color: "var(--ink-3)" }} />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-xs sm:text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    style={{ color: "var(--ink-2)" }}
    {...props}
  >
    <div
      className={cn("px-4 sm:px-5 pb-5 pt-2 font-sans leading-relaxed border-t", className)}
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-2)",
      }}
    >
      {children}
    </div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export function AccordionDemo() {
  return (
    <Accordion defaultValue={["shipping"]} className="max-w-lg">
      <AccordionItem value="shipping">
        <AccordionTrigger>What are your shipping options?</AccordionTrigger>
        <AccordionContent>
          We offer standard (5-7 days), express (2-3 days), and overnight
          shipping. Free shipping on international orders.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="returns">
        <AccordionTrigger>What is your return policy?</AccordionTrigger>
        <AccordionContent>
          Returns accepted within 30 days. Items must be unused and in original
          packaging. Refunds processed within 5-7 business days.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="support">
        <AccordionTrigger>How can I contact customer support?</AccordionTrigger>
        <AccordionContent>
          Reach us via email, live chat, or phone. We respond within 24 hours
          during business days.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
