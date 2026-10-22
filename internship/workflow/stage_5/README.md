# Stage 5: Nghiệp vụ huấn luyện PT

1. [Phân công PT và lịch hẹn](01_phan_cong_va_lich_pt.md)
2. [Ghi buổi, ôn tập, chỉ số và mục tiêu](02_ghi_buoi_chi_so_muc_tieu.md)

## Mục tiêu khi học stage này

Stage 5 là nơi bốn khái niệm rất dễ bị lẫn được tách rời trong code: **gói buổi PT**, **phân công PT**, **lịch hẹn** và **nhật ký buổi đã diễn ra**. Đọc xong, bạn cần giải thích được vì sao đặt lịch không trừ buổi, vì sao ghi buổi không bắt buộc phải có lịch, và vì sao PT không chỉ cần role `PT` mà còn phải có quyền với đúng hội viên tại đúng ngày thao tác.

Nên đọc theo thứ tự file 1 rồi file 2. Khi gặp một tên entity, mở song song thư mục [`backend/src/main/java/com/gymduongdouble/backend/pt/domain`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/domain); khi gặp một quy tắc nghiệp vụ, tìm method cùng tên trong [`PtService`](../../../backend/src/main/java/com/gymduongdouble/backend/pt/service/PtService.java). Không suy luận nghiệp vụ chỉ từ giao diện: frontend hỗ trợ thao tác, còn backend mới là nơi quyết định request có hợp lệ hay không.

Để kiểm tra thao tác trên giao diện, kết hợp đọc [kịch bản vận hành PT](../../../plans/active/09-pt-operation-and-manual-test.md). Bộ workflow này giải thích source code và cách lần vết dữ liệu; nó không thay thế dữ liệu thật, kết quả test thực tế hay chính sách lương của phòng gym. Phiên bản hiện tại **không có module tính lương/hoa hồng PT**: lịch và nhật ký buổi chỉ phục vụ quản lý quá trình huấn luyện.
