import { CalendarClock } from 'lucide-react'
import { ComingSoonPage } from '../../../shared/components/ComingSoonPage'

export function PtSchedulePage() {
  return (
    <ComingSoonPage
      icon={CalendarClock}
      title="Lịch PT"
      description="Module lịch PT sẽ được triển khai sau khi các luồng khách hàng và gói tập cốt lõi ổn định."
      plannedItems={[
        'Lịch dạy theo ngày/tuần',
        'Check-in buổi PT',
        'Theo dõi buổi ôn tập',
        'Cập nhật chỉ số cơ thể',
      ]}
    />
  )
}
