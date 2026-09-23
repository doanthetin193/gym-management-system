import { Target } from 'lucide-react'
import { ComingSoonPage } from '../../../shared/components/ComingSoonPage'

export function GoalsPage() {
  return (
    <ComingSoonPage
      icon={Target}
      title="Mục tiêu"
      description="Module mục tiêu sẽ số hóa bảng mục tiêu tháng và so sánh số liệu thực tế theo từng giai đoạn."
      plannedItems={[
        'Mục tiêu doanh thu/lợi nhuận',
        'Mục tiêu khách tự tập',
        'Mục tiêu khách giáo án',
        'Mục tiêu khách PT chính/PT mới',
      ]}
    />
  )
}
