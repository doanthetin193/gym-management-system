# 🎯 GIAI ĐOẠN 2 (SPRINT 2) - CHẶNG 02: NGHIỆP VỤ GIA HẠN GÓI TẬP (RENEWAL CONTINUITY) & GÓI PT

Tài liệu này phân tích chi tiết lát cắt nghiệp vụ thứ hai của **Sprint 2: Quản lý Hội viên & Gói tập**. Trọng tâm là thuật toán tự động nối tiếp thời hạn gói tập (Renewal Continuity) và tự động kích hoạt gói buổi PT trong [MemberMembershipService.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/membership/service/MemberMembershipService.java).

---

## 🧭 1. Bài toán Nghiệp vụ Thực tế tại Phòng Gym

### ❓ Vấn đề "Mất quyền lợi khi gia hạn sớm":
Giả sử Hội viên Dương đăng ký gói tập 1 tháng có thời hạn từ `01/10/2026` đến `31/10/2026`.
Vào ngày `25/10/2026` (khi gói cũ vẫn còn **6 ngày** hiệu lực), phòng gym có chương trình giảm giá và anh Dương quyết định mua tiếp gói 1 tháng để gia hạn:
- **Nếu hệ thống tính ngày bắt đầu từ ngày đăng ký (`25/10`):** Gói mới sẽ có hạn từ `25/10` đến `24/11`. Khách hàng bị mất trắng 6 ngày đã thanh toán của gói cũ!
- **Chuẩn hóa Nối tiếp Thời hạn (Renewal Continuity):** Hệ thống tự động phát hiện gói cũ của anh Dương vẫn còn hạn đến `31/10`. Gói mới sẽ tự động bắt đầu từ ngày **`01/11/2026`** (`oldEndDate + 1 ngày`) đến `30/11/2026`. Khách hàng bảo toàn trọn vẹn 100% thời gian tập.
- **Nếu gói cũ đã hết hạn từ lâu (ví dụ hết từ tháng 8):** Gói mới sẽ bắt đầu đúng vào ngày khách chọn đăng ký.

---

## 🏗️ 2. Phân tích Chi tiết [MemberMembershipService.java](file:///d:/gym-management-system/backend/src/main/java/com/gymduongdouble/backend/membership/service/MemberMembershipService.java)

---

### 📌 2.1. Thuật toán Tính Ngày Bắt đầu Nối tiếp: `resolveStartDate`

```java
private LocalDate resolveStartDate(Long memberId, LocalDate requestedStartDate) {
    return memberMembershipRepository.findByMemberIdOrderByStartDateDesc(memberId).stream()
        .filter(membership -> membership.getStatus() != MembershipStatus.CANCELLED)
        .filter(membership -> !membership.getEndDate().isBefore(requestedStartDate))
        .map(MemberMembership::getEndDate)
        .max(LocalDate::compareTo)
        .map(endDate -> endDate.plusDays(1))
        .orElse(requestedStartDate);
}
```

#### 🔍 Từng bước của thuật toán:
1. `findByMemberId...`: Lấy danh sách các gói tập của hội viên.
2. `.filter(status != CANCELLED)`: Bỏ qua những gói đã bị lễ tân hủy ngang.
3. `.filter(!endDate.isBefore(requestedStartDate))`: Chỉ giữ lại những gói có `endDate >= requestedStartDate` (tức là gói cũ vẫn còn hạn tại thời điểm muốn bắt đầu gói mới).
4. `.map(MemberMembership::getEndDate)`: Trích xuất danh sách các ngày hết hạn `endDate`.
5. `.max(LocalDate::compareTo)`: Lấy ngày hết hạn xa nhất trong tương lai.
6. `.map(endDate -> endDate.plusDays(1))`: Cộng thêm **1 ngày** $\rightarrow$ Đây chính là ngày bắt đầu của gói mới!
7. `.orElse(requestedStartDate)`: Nếu không có gói nào còn hạn (hoặc khách mới tinh) $\rightarrow$ Lấy chính ngày khách yêu cầu (`requestedStartDate`).

---

### 📌 2.2. Thuật toán Tính Ngày Kết thúc: `resolveEndDate`

```java
private LocalDate resolveEndDate(MembershipPlan plan, CreateMemberMembershipRequest request, LocalDate startDate) {
    if (request.endDate() != null) {
        if (request.endDate().isBefore(startDate)) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu thực tế.");
        }
        return request.endDate();
    }
    if (plan.getDurationDays() == null || plan.getDurationDays() <= 0) {
        throw new BadRequestException("Gói chưa có thời hạn, cần nhập ngày kết thúc.");
    }
    return startDate.plusDays(plan.getDurationDays() - 1L);
}
```

> [!NOTE]
> **Tại sao lại là `startDate.plusDays(plan.getDurationDays() - 1L)`?**
> Vì ngày bắt đầu (`startDate`) đã được tính là ngày tập đầu tiên.
> Ví dụ: Gói tập 1 ngày (`durationDays = 1`), bắt đầu ngày `24/09`:
> `24/09 + (1 - 1) = 24/09`. Ngày kết thúc chính là ngày `24/09`.
> Nếu không trừ 1, ngày kết thúc sẽ bị nhảy sang ngày `25/09` (thành 2 ngày).

---

### 📌 2.3. Tự động Kích hoạt Gói Buổi PT: `createPtPackageIfNeeded`

Khi hội viên đăng ký một gói tập loại **PT (Huấn luyện viên cá nhân)**, hệ thống không chỉ lưu vào bảng `member_memberships` mà còn tự động khởi tạo hồ sơ buổi tập trong bảng `pt_session_packages`:

```java
private void createPtPackageIfNeeded(MemberMembership membership, Long ptUserId) {
    MembershipPlan plan = membership.getPlan();
    if (plan.getPlanType() != PlanType.PT) {
        return; // Nếu không phải gói PT thì bỏ qua
    }

    PtSessionPackage sessionPackage = new PtSessionPackage();
    sessionPackage.setMember(membership.getMember());
    sessionPackage.setPtUser(findUserOrNull(ptUserId)); // PT phụ trách
    sessionPackage.setMembership(membership);
    sessionPackage.setTotalPtSessions(valueOrZero(plan.getPtSessionCount()));
    sessionPackage.setUsedPtSessions(0); // Mới mua nên chưa tập buổi nào
    sessionPackage.setRemainingPtSessions(valueOrZero(plan.getPtSessionCount()));
    sessionPackage.setTotalPracticeSessions(valueOrZero(plan.getPracticeSessionCount()));
    sessionPackage.setUsedPracticeSessions(0);
    sessionPackage.setRemainingPracticeSessions(valueOrZero(plan.getPracticeSessionCount()));
    sessionPackage.setStartDate(membership.getStartDate());
    sessionPackage.setEndDate(membership.getEndDate());
    sessionPackage.setStatus(SessionPackageStatus.ACTIVE);

    ptSessionPackageRepository.save(sessionPackage);
}
```

- Khách có thể có:
  - **`totalPtSessions`**: Số buổi tập kèm 1-1 với Huấn luyện viên.
  - **`totalPracticeSessions`**: Số buổi tự đến phòng tập luyện cá nhân được tặng kèm trong gói.
  - Cả 2 chỉ số này ban đầu đều có `used = 0` và `remaining = total`.

---

### 📌 2.4. Tự động Ghi nhận Công nợ: `createDebtIfNeeded`

```java
private void createDebtIfNeeded(MemberMembership membership, BigDecimal debtAmount) {
    if (debtAmount.compareTo(BigDecimal.ZERO) <= 0) {
        return; // Đã thanh toán đủ thì không ghi nợ
    }

    DebtRecord debtRecord = new DebtRecord();
    debtRecord.setMember(membership.getMember());
    debtRecord.setMembership(membership);
    debtRecord.setOriginalAmount(debtAmount);
    debtRecord.setPaidAmount(BigDecimal.ZERO);
    debtRecord.setRemainingAmount(debtAmount);
    debtRecord.setDueDate(membership.getStartDate());
    debtRecord.setStatus(DebtStatus.OPEN);
    debtRecord.setNote("Công nợ phát sinh khi đăng ký gói.");
    debtRecordRepository.save(debtRecord);
}
```
- Khi khách mua gói nhưng chưa trả đủ tiền (`actualPrice - discountAmount > 0`), hệ thống tự động sinh một bản ghi `DebtRecord` với trạng thái `OPEN` để quản lý công nợ chặt chẽ.

---

## 🧪 3. Kịch bản Kiểm thử Tự động: [sprint2.http](file:///d:/gym-management-system/backend/http/sprint2.http)

Sprint 2 được kiểm thử với 13 ca test toàn diện:
1. Đăng nhập tài khoản `OWNER` để lấy JWT Token.
2. Tạo gói tập Gym 1 tháng và gói PT 20 buổi.
3. Tạo mới 2 hội viên test.
4. Đăng ký gói tập lần đầu cho Hội viên 1.
5. **Gia hạn gói tập lần 2 cho Hội viên 1** $\rightarrow$ Kiểm tra `startDate` của gói 2 có tự động nối tiếp sau `endDate` của gói 1 hay không.
6. Cập nhật thông tin hội viên (`PUT /v1/members/{id}`).
7. Kiểm tra lỗi khi cập nhật trùng SĐT với người khác.
8. Tra cứu chi tiết hồ sơ 360 độ (`GET /v1/members/{id}`).
9. Kiểm tra bộ lọc `ALL`, `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`.
