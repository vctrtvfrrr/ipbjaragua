import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Form, FormActions, FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const bulletins = [
  { edition: '72', date: '2026-07-05', status: 'Rascunho' },
  { edition: '71', date: '2026-06-28', status: 'Publicado' },
]

export default function AdminExamplePage() {
  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline">Painel</Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal">Fundação de UI</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Gestão inicial de boletins, avisos e conteúdo editorial.
            </p>
          </div>

          <Dialog>
            <DialogTrigger render={<Button />}>Novo boletim</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar boletim</DialogTitle>
                <DialogDescription>Informe os dados mínimos para iniciar uma nova edição.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancelar</Button>
                <Button>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Form className="bg-card text-card-foreground rounded-lg border p-5">
            <FormField>
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" defaultValue="Boletim Dominical" />
              <FormMessage>Use o título padrão para edições dominicais.</FormMessage>
            </FormField>

            <FormField>
              <Label htmlFor="article">Artigo</Label>
              <Select defaultValue="latest">
                <SelectTrigger id="article" className="w-full">
                  <SelectValue placeholder="Selecione um artigo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Artigo mais recente</SelectItem>
                  <SelectItem value="manual">Selecionar manualmente</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField>
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" name="notes" placeholder="Notas internas do boletim" />
            </FormField>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked />
                Exibir avisos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch defaultChecked />
                Publicar na data
              </label>
            </div>

            <FormActions>
              <Button variant="outline">Salvar rascunho</Button>
              <Button>Publicar</Button>
            </FormActions>
          </Form>

          <aside className="bg-card text-card-foreground rounded-lg border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium">Ações rápidas</h2>
                <p className="text-muted-foreground mt-1 text-sm">Menu e badge com a mesma escala visual.</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>Mais</DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Boletim</DropdownMenuLabel>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                  <DropdownMenuItem>Exportar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </aside>
        </section>

        <section className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Edição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bulletins.map((bulletin) => (
                <TableRow key={bulletin.edition}>
                  <TableCell>{bulletin.edition}</TableCell>
                  <TableCell>{bulletin.date}</TableCell>
                  <TableCell>
                    <Badge variant={bulletin.status === 'Publicado' ? 'default' : 'secondary'}>{bulletin.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      </div>
    </main>
  )
}
