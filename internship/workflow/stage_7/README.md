# Stage 7: Dashboard, báo cáo và AI

1. [Dashboard, báo cáo và nhắc việc](01_dashboard_va_bao_cao.md)
2. [AI Retention & Revenue Advisor và kịch bản vận hành](02_ai_retention_revenue.md)
3. [Xuất XLSX và gửi dữ liệu tới Google Sheets](03_xuat_du_lieu_va_dong_bo.md)
4. [Nhắc việc và trang công khai](04_nhac_viec_va_trang_cong_khai.md)

## Hai nguyên tắc cần giữ khi đọc

Stage này chứa nhiều số liệu nên rất dễ nói quá mức. Luôn hỏi **số được tính từ bảng nào, tại thời điểm nào, có phải doanh thu đã thu hay chỉ là giá trị cơ hội**. Dashboard và báo cáo tài chính chỉ phản ánh tiền đã ghi `Payment`; công nợ là khoản cần thu; AI dùng rule để tạo nhóm ưu tiên rồi mới mời Groq diễn giải. Không có module chi phí, lợi nhuận ròng, payroll hay dự báo machine learning trong scope hiện tại.

Luồng export/sync cũng không phải một thứ. XLSX được frontend tạo ngay trên trình duyệt từ dữ liệu đã tải; Google Sheets được frontend gửi trực tiếp sang URL Apps Script do người dùng cấu hình. Cả hai đều hữu ích để báo cáo, nhưng không thay thế backup/restore PostgreSQL chuẩn.
