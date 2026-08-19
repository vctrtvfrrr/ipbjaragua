import remarkGfm from 'remark-gfm'

// The Markdown dialect the editor offers. The reader on screen and the document on paper
// share it so an Ata on paper can never understand less than what the author wrote.
export const MARKDOWN_REMARK_PLUGINS = [remarkGfm]
