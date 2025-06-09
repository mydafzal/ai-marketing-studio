import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { AlertCircle, Bold, Italic, Heading1, Heading2, List, Link as LinkIcon, Undo, Redo } from 'lucide-react'
import { marked } from 'marked'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  className?: string
  minHeight?: string
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  error,
  className = '',
  minHeight = '300px'
}: MarkdownEditorProps) {
  // Function to convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    try {
      if (!markdown) return ''
      // Check if the content already looks like HTML
      if (markdown.includes('<p>') || markdown.includes('<h1>') || markdown.includes('<strong>')) {
        return markdown
      }
      return marked.parse(markdown) as string
    } catch (error) {
      console.error('Error converting markdown to HTML:', error)
      return markdown
    }
  }

  // Get initial HTML content
  const initialHtml = markdownToHtml(value)
  
  // State to track the content
  const [content, setContent] = useState(initialHtml)

  // Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#4BF29C] underline'
        }
      })
    ],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      // Get HTML content from editor
      const html = editor.getHTML()
      setContent(html)
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm lg:prose-base break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-headings:text-white prose-a:text-[#4BF29C] prose-strong:text-white p-4 focus:outline-none w-full overflow-auto ${className}`,
        style: `min-height: ${minHeight}; height: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: normal;`
      }
    }
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (!editor || !value) return
    
    // Only update if the content has actually changed
    const newHtml = markdownToHtml(value)
    if (newHtml !== content) {
      editor.commands.setContent(newHtml)
      setContent(newHtml)
    }
  }, [editor, value, content])

  // Function to handle toolbar button clicks
  const handleFormat = (type: string) => {
    if (!editor) return
    
    switch (type) {
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'link':
        const url = window.prompt('Enter URL')
        if (url) {
          editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }
        break
      case 'undo':
        editor.chain().focus().undo().run()
        break
      case 'redo':
        editor.chain().focus().redo().run()
        break
    }
  }

  // Button component for toolbar
  const ToolbarButton = ({ type, icon: Icon, label }: { type: string, icon: any, label: string }) => {
    const isActive = editor?.isActive(type) || 
                    (type === 'h1' && editor?.isActive('heading', { level: 1 })) ||
                    (type === 'h2' && editor?.isActive('heading', { level: 2 })) ||
                    false
    
    return (
      <button
        type="button"
        onClick={() => handleFormat(type)}
        className={`p-1.5 rounded hover:bg-[#151925] transition-colors ${
          isActive ? 'text-[#4BF29C] bg-[#151925]' : 'text-gray-300'
        }`}
        title={label}
        disabled={!editor}
      >
        <Icon className="size-4" />
      </button>
    )
  }

  return (
    <div className="space-y-2 w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[#1A1D29] rounded-t-lg border border-gray-700 p-1 border-b-0">
        <ToolbarButton type="bold" icon={Bold} label="Bold" />
        <ToolbarButton type="italic" icon={Italic} label="Italic" />
        <div className="h-4 w-px bg-gray-700 mx-1" />
        <ToolbarButton type="h1" icon={Heading1} label="Heading 1" />
        <ToolbarButton type="h2" icon={Heading2} label="Heading 2" />
        <div className="h-4 w-px bg-gray-700 mx-1" />
        <ToolbarButton type="bulletList" icon={List} label="Bullet List" />
        <ToolbarButton type="link" icon={LinkIcon} label="Insert Link" />
        <div className="ml-auto flex items-center">
          <ToolbarButton type="undo" icon={Undo} label="Undo" />
          <ToolbarButton type="redo" icon={Redo} label="Redo" />
        </div>
      </div>
      
      {/* Editor with improved scrolling and width */}
      <div
        className={`bg-[#1A1D29] rounded-b-lg border ${
          error ? 'border-red-500' : 'border-gray-700'
        } overflow-auto w-full`}
        style={{ minHeight }}
      >
        <EditorContent editor={editor} className="overflow-auto w-full" />
      </div>
      
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertCircle className="size-3.5 text-red-500" />
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}
    </div>
  )
}