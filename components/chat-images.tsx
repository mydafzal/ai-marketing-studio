'use client'

import { useRef } from 'react'
import Image from 'next/image'

import { useResizeObserver } from 'usehooks-ts'
import { ImagePart } from 'ai'
import { Message } from '@/lib/types'

import { useAIState } from 'ai/rsc'

export function ChatImage() {
  const [aiState, setAIState] = useAIState()

  const chartRef = useRef<HTMLDivElement>(null)
  const { width = 0 } = useResizeObserver({
    ref: chartRef,
    box: 'border-box'
  })

  const imageMes = aiState.messages.filter(
    (msg: Message) =>
      Array.isArray(msg.content) &&
      msg.content.some(item => item.type === 'image')
  )

  const images: ImagePart[] = []
  imageMes.map((msg: Message) => {
    if (Array.isArray(msg.content))
      msg.content.map(item => {
        if (item.type === 'image') images.push(item)
      })
  })

  return (
    <>
      <div className="text-lg text-zinc-300">This is current images of the campaign</div>
      <div className="ml-4 flex-1 pl-2">
        <div className="group relative flex flex-wrap items-start md:-ml-12">
          {Array.isArray(images) &&
            images
              .filter(message => message.type === 'image')
              .map((message, idx) => (
                <div key={idx} className="p-2 w-1/2">
                  <Image
                    src={(message as ImagePart).image as string}
                    alt=""
                    className=" mt-4 mr-2 "
                    style={{ width: '500px', height: 'auto' }}
                    width={300}
                    height={160}
                    sizes="(max-width: 500px) 100vw, 33vw"
                  />
                </div>
              ))}
        </div>
      </div>
    </>
  )
}
