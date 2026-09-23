import { Users } from 'lucide-react'
import { ComingSoonPage } from '../../../shared/components/ComingSoonPage'

export function MembersPage() {
  return (
    <ComingSoonPage
      icon={Users}
      title="Khách hàng"
      description="Khu vực này sẽ là màn hình chính của Sprint 2 để thay thế bảng quản lý khách hàng hàng tháng trong Excel."
      plannedItems={[
        'Danh sách khách hàng',
        'Tìm kiếm theo tên hoặc số điện thoại',
        'Tạo và cập nhật thông tin khách',
        'Xem chi tiết khách và lịch sử gói',
      ]}
    />
  )
}
