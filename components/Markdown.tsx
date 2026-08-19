import ReactMarkdown from 'react-markdown'
import { MARKDOWN_REMARK_PLUGINS } from '@/lib/markdown-dialect'

export default function Markdown({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={MARKDOWN_REMARK_PLUGINS}>{content}</ReactMarkdown>
}
