import * as React from 'react'

import { cn } from '@/lib/utils'

function Form({ className, ...props }: React.ComponentProps<'form'>) {
  return <form data-slot="form" className={cn('space-y-4', className)} {...props} />
}

function FormField({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="form-field" className={cn('group/field grid gap-2', className)} {...props} />
}

function FormActions({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="form-actions"
      className={cn('flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="form-message" className={cn('text-muted-foreground text-sm', className)} {...props} />
}

export { Form, FormActions, FormField, FormMessage }
