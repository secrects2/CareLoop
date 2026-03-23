'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import EventForm from '@/components/events/EventForm'
import { Loader2 } from 'lucide-react'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [eventData, setEventData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvent = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                toast.error('找不到此活動')
                router.push('/events')
                return
            }

            setEventData(data)
            setLoading(false)
        }
        fetchEvent()
    }, [id, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <EventForm
            mode="edit"
            defaultValues={{
                id: eventData.id,
                title: eventData.title,
                event_date: eventData.event_date,
                event_time: eventData.event_time,
                location: eventData.location,
            }}
        />
    )
}
