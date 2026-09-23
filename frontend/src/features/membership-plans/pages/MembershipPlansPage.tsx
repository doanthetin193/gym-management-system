import { Dumbbell } from 'lucide-react'
import { ComingSoonPage } from '../../../shared/components/ComingSoonPage'

export function MembershipPlansPage() {
  return (
    <ComingSoonPage
      icon={Dumbbell}
      title="Gói tập"
      description="Module quản lý bảng giá, gói tự tập, gói giáo án/hướng dẫn và gói PT chính/PT mới."
      plannedItems={[
        'Danh sách gói đang bán',
        'Tạo gói tự tập, giáo án và PT',
        'Cấu hình thời hạn và số buổi',
        'Đăng ký/gia hạn gói cho khách',
      ]}
    />
  )
}
