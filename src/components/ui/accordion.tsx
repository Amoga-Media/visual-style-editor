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
      "doppelrand-shell spotlight-card transition-all rounded-2xl overflow-hidden",
      className
    )}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "doppelrand-core flex flex-1 items-center justify-between p-5 sm:p-6 text-left font-semibold text-white transition-all hover:text-cyan-300 text-sm sm:text-base [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-cyan-400 transition-transform duration-300" />
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
    className="overflow-hidden text-xs sm:text-sm text-slate-300 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("px-6 pb-6 pt-2 font-sans leading-relaxed bg-[#0c0e14]", className)}>
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

