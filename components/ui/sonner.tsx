'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          // Inherited fallback for a toast raised without a type.
          '--toast-accent': 'var(--border)',
        } as React.CSSProperties
      }
      toastOptions={{
        // Inline, because Sonner ships `[data-sonner-toast][data-styled='true'] { border: … }` in a
        // stylesheet it appends at runtime, outranking any class on both specificity and order.
        style: { borderLeft: '4px solid var(--toast-accent)' },
        classNames: {
          icon: 'text-(--toast-accent)',
          success: '[--toast-accent:var(--brand-ridge)]',
          error: '[--toast-accent:var(--destructive)]',
          warning: '[--toast-accent:var(--brand-deep)]',
          info: '[--toast-accent:var(--brand-current)]',
          loading: '[--toast-accent:var(--muted-foreground)]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
