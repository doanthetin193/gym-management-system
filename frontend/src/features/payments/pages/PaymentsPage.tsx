import { CreditCard } from 'lucide-react'
import { ComingSoonPage } from '../../../shared/components/ComingSoonPage'

export function PaymentsPage() {
  return (
    <ComingSoonPage
      icon={CreditCard}
      title="Thanh toán"
      description="Module này sẽ phục vụ ghi nhận thu tiền, theo dõi công nợ và lịch sử giao dịch của khách hàng."
      plannedItems={[
        'Ghi nhận thanh toán',
        'Tự cập nhật công nợ',
        'Phân loại doanh thu theo gói',
        'Lịch sử thanh toán theo khách',
      ]}
    />
  )
}
