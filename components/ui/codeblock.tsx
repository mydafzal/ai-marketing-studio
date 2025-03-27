// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Markdown/CodeBlock.tsx

'use client'

import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard'
import { IconCheck, IconCopy, IconDownload } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'

interface Props {
  language: string
  value: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css'
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789' // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lowercase ? result.toLowerCase() : result
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const downloadAsFile = () => {
    if (typeof window === 'undefined') {
      return
    }
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateRandomString(
      3,
      true
    )}${fileExtension}`
    const fileName = window.prompt('Enter file name' || '', suggestedFileName)

    if (!fileName) {
      // User pressed cancel on prompt.
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(value)
  }

  return (
    <div className="relative w-full font-sans codeblock bg-[#151925] rounded-lg overflow-hidden border border-[#2A2E3A] my-4">
      <div className="flex items-center justify-between w-full px-4 py-2 pr-3 bg-[#1A1D29] text-[#ADB0B8] border-b border-[#2A2E3A]">
        <span className="text-xs font-medium lowercase">{language}</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            className="size-7 p-0 hover:bg-[#212534] text-[#8A8F99] hover:text-white rounded-md focus-visible:ring-1 focus-visible:ring-[#4BF29C] focus-visible:ring-offset-0"
            onClick={downloadAsFile}
            size="icon"
          >
            <IconDownload className="size-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 p-0 hover:bg-[#212534] text-[#8A8F99] hover:text-white rounded-md focus-visible:ring-1 focus-visible:ring-[#4BF29C] focus-visible:ring-offset-0"
            onClick={onCopy}
          >
            {isCopied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
            <span className="sr-only">Copy code</span>
          </Button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={coldarkDark}
        PreTag="div"
        showLineNumbers
        customStyle={{
          margin: 0,
          width: '100%',
          background: 'transparent',
          padding: '1rem 1rem',
          fontSize: '0.85rem'
        }}
        lineNumberStyle={{
          userSelect: 'none',
          color: '#8A8F99',
          paddingRight: '1rem',
          borderRight: '1px solid #2A2E3A',
          marginRight: '1rem'
        }}
        codeTagProps={{
          style: {
            fontSize: '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: '#ADB0B8'
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
