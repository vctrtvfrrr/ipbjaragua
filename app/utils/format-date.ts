export default function formatDate(str: string): string {
  const date = new Date(`${str}T12:00:00`);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}
