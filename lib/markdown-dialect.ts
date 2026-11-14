import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

// The Markdown dialect the editor offers. The reader on screen and the document on paper
// share it so an Ata on paper can never understand less than what the author wrote.
// Authors type lists of Participantes, addresses and verses one per line, so a single line
// break is kept as a line break instead of collapsing into a space.
export const MARKDOWN_REMARK_PLUGINS = [remarkGfm, remarkBreaks]
