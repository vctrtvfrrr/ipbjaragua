import { abbreviateMeetingMinuteTopicTitle } from '@/lib/meeting-minute'

type Props = {
  topics: { title: string }[]
}

export function MeetingMinuteTopicList({ topics }: Props) {
  if (topics.length === 0) return <span className="text-muted-foreground">—</span>

  return (
    <ol className="list-inside list-decimal">
      {topics.map((topic, index) => {
        const abbreviated = abbreviateMeetingMinuteTopicTitle(topic.title)
        if (abbreviated === topic.title) return <li key={index}>{topic.title}</li>

        // The tooltip only ever reaches a pointer, so the whole title also goes to the
        // accessibility tree: the abbreviation must not cost a reader the Tópico.
        return (
          <li key={index} title={topic.title}>
            <span aria-hidden="true">{abbreviated}</span>
            <span className="sr-only">{topic.title}</span>
          </li>
        )
      })}
    </ol>
  )
}
