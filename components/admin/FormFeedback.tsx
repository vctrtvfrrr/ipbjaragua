export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null

  return <p className="text-destructive text-sm">{messages[0]}</p>
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
      {message}
    </p>
  )
}
