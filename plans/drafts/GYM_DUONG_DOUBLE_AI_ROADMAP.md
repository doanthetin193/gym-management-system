# GYM DƯƠNG DOUBLE - KẾ HOẠCH TÍCH HỢP AI

## 1. Bối cảnh dữ liệu thực tế

Thông tin mới từ chủ phòng:

- Phòng gym nhỏ.
- Mỗi tháng khoảng 50-70 khách.
- Dữ liệu khách mới và khách cũ từ trước đến nay khá nhiều.
- Khách tự tập muốn đi lúc nào thì đi, hiện không điểm danh.
- Khách có PT chắc chắn có ghi lại ngày tập, bài tập, buổi tập và tiến độ.

Điểm quan trọng:

- Không nên đánh đồng số khách mỗi tháng với tổng dữ liệu lịch sử.
- Nếu phòng hoạt động nhiều năm, dữ liệu đăng ký/gia hạn có thể đủ lớn để phân tích.
- Tuy nhiên, khách tự tập không có check-in thì thiếu behavioral data, không nên ép làm churn ML cho nhóm này quá sớm.
- Khách PT là nhóm có dữ liệu hành vi tốt nhất vì có session log, bài tập, chỉ số cơ thể và hành trình tập luyện.
- Khách Giáo án/Hướng Dẫn cũng có check-in theo gói 30, 60 hoặc 90 buổi, nên có thể đưa vào analytics nhẹ sau này.

Vì vậy AI roadmap nên tách 2 luồng:

```text
Khách tự tập
  -> Membership
  -> Expiry Management
  -> Renewal History
  -> Revenue / Retention Analytics
  -> Rule-based renewal risk nhẹ

Khách PT
  -> PT Sessions
  -> Exercise Logs
  -> Body Measurements
  -> Training Progress
  -> AI Progress Analysis
  -> PT Drop-off Risk
```

## 2. Nguyên tắc tích hợp AI

AI không nên được làm như một project tách rời. AI nên là một lớp hỗ trợ quyết định nằm trên hệ thống quản lý gym cốt lõi.

Nguyên tắc:

- Không dùng AI cho có.
- Không dùng Deep Learning nếu dữ liệu chưa đủ lớn.
- Ưu tiên rule-based/analytics trước, ML sau.
- Không cần GPU.
- Không đưa Computer Vision vào giai đoạn đầu.
- AI phải giải thích được lý do, không chỉ trả về một con số.
- Không cố dự đoán hành vi nếu hệ thống không ghi nhận được hành vi đó.

Kiến trúc tư duy:

```text
GYM MANAGEMENT PLATFORM
  |
  |-- Customer Management
  |-- Membership
  |-- PT Management
  |-- Finance
  |-- Training Content
  |
  |-- Intelligence Layer
        |-- PT Progress Analysis
        |-- PT Drop-off Risk
        |-- Customer Segmentation
        |-- Renewal / Retention Analytics
        |-- Revenue Forecasting
        |-- Exercise Recommendation
```

## 3. Điều kiện dữ liệu trước khi làm AI

Nếu dữ liệu cũ chỉ có:

- Tên.
- Số điện thoại.
- Sinh nhật.
- Gói tập.
- Ngày bắt đầu.
- Ngày hết hạn.
- Chi phí.

thì có thể làm thống kê, báo cáo và phân tích gia hạn cơ bản, nhưng chưa đủ tốt để train model churn có ý nghĩa cho toàn bộ khách.

Cần hỏi/chốt với chủ phòng:

- Dữ liệu cũ đang ở đâu: Excel, Google Sheets, sổ, phần mềm cũ?
- Dữ liệu cũ có những cột nào?
- Có lịch sử từng lần gia hạn không?
- Có dữ liệu khách PT theo từng buổi không?
- Có chỉ số cơ thể theo tuần/tháng không?
- Có ghi bài tập, mức tạ, reps, sets không?

Chủ phòng đã chốt MVP không cần import dữ liệu cũ, bắt đầu bằng dữ liệu mới. Nếu phase sau có file Excel/Google Sheets đủ sạch và muốn tận dụng lịch sử, có thể mở lại import để tăng giá trị analytics/AI.

## 4. Không nên ép churn ML cho toàn bộ khách

### 4.1 Khách tự tập

Khách tự tập không điểm danh, nên hệ thống không biết chính xác:

- Khách có đến phòng hay không.
- Tần suất tập có giảm không.
- Lần tập gần nhất là khi nào.
- Mức độ gắn bó thực tế với phòng.

Vì vậy, với khách tự tập, không nên kết luận:

```text
Không có hoạt động trong hệ thống = khách không đi tập.
```

Vì thực tế họ có thể vẫn đi tập nhưng không được ghi nhận.

Với nhóm này, nên làm:

- Thống kê khách mới/khách cũ.
- Tỷ lệ gia hạn.
- Doanh thu theo gói.
- Lịch sử gia hạn.
- Cảnh báo sắp hết hạn.
- Rule-based renewal risk nhẹ dựa trên ngày hết hạn, số lần gia hạn, công nợ, lịch sử thanh toán.

Không nên làm sớm:

- ML churn prediction dựa trên hành vi tập luyện, vì không có dữ liệu hành vi.

### 4.2 Khách PT

Khách PT có dữ liệu tốt hơn nhiều:

- Ngày tập.
- PT phụ trách.
- Buổi thứ mấy trên tổng số buổi.
- Bài tập đã tập.
- Sets/reps/mức tạ nếu PT ghi.
- Ghi chú từng buổi.
- Chỉ số cơ thể theo tuần/tháng.
- Mục tiêu ban đầu.
- Kết quả đạt được.

Đây là nhóm phù hợp nhất để làm AI/ML trong hệ thống.

## 5. AI ưu tiên số 1: PT Customer Progress Analysis

### 5.1 Mục tiêu

Thay vì hỏi:

```text
Khách này có bỏ gym không?
```

với khách PT nên hỏi:

```text
Khách này đang tiến bộ như thế nào?
Có dấu hiệu chững lại không?
PT/chủ phòng cần can thiệp ở đâu?
```

Đây là bài toán bám sát requirement:

- Theo dõi chỉ số cơ thể thay đổi hằng tuần.
- Theo dõi lộ trình tập luyện theo từng giai đoạn.
- Theo dõi mức độ tiến bộ hằng tuần.
- Thống kê, đánh giá kết quả khi kết thúc gói tập.

### 5.2 Output mong muốn

Ví dụ dashboard PT:

```text
Nguyễn Văn A
Mục tiêu: Tăng cơ
Tiến độ: Tốt

8 tuần gần đây:
- Cân nặng: +1.8 kg
- Bench Press: +10 kg
- Số buổi hoàn thành: 17/20

Đánh giá:
- Tiến độ tổng thể tích cực.
- 2 tuần gần đây mức tạ tăng chậm.
- Tần suất tập giảm nhẹ.

Gợi ý:
- PT nên kiểm tra lại lịch ngủ/dinh dưỡng.
- Có thể điều chỉnh phase tập tiếp theo.
```

### 5.3 Giai đoạn đầu nên làm bằng rule/score

Không cần ML ngay.

Ví dụ:

```text
Progress Score =
  35% hoàn thành số buổi
  + 25% cải thiện chỉ số cơ thể
  + 20% hoàn thành phase/chương trình
  + 10% cải thiện performance bài tập
  + 10% đánh giá của PT
```

Theo mục tiêu:

- Giảm mỡ: ưu tiên cân nặng, vòng eo, body fat, attendance.
- Tăng cơ: ưu tiên cân nặng, số đo, mức tạ, volume tập.
- Tăng sức mạnh: ưu tiên mức tạ, reps, consistency.
- Duy trì sức khỏe: ưu tiên đều đặn, hoàn thành buổi, cảm nhận của khách.

### 5.4 Dữ liệu cần lưu

Nên thiết kế các bảng:

```text
pt_goals
  member_id
  goal_type
  start_date
  target_weight
  target_body_fat
  target_waist
  note

pt_session_logs
  member_id
  pt_user_id
  session_date
  session_number
  total_pt_sessions
  total_practice_sessions
  note

pt_exercise_logs
  session_log_id
  exercise_id
  sets
  reps
  weight
  duration_minutes
  note

body_measurements
  member_id
  recorded_at
  weight
  body_fat
  chest
  waist
  hip
  note
```

## 6. AI ưu tiên số 2: PT Drop-off Risk

### 6.1 Mục tiêu

Dự đoán/cảnh báo khách PT có nguy cơ bỏ ngang chương trình hoặc không mua tiếp gói PT.

Đây là hướng gần với churn, nhưng đúng dữ liệu hơn vì khách PT có lịch sử buổi tập.

### 6.2 Dữ liệu đầu vào

Feature gợi ý:

- `days_since_last_pt_session`: số ngày từ buổi PT gần nhất.
- `sessions_used_ratio`: tỷ lệ buổi đã dùng.
- `remaining_sessions`: số buổi còn lại.
- `session_frequency_4_weeks`: tần suất buổi tập 4 tuần gần đây.
- `missed_or_delayed_sessions`: số buổi bị hủy/vắng/trễ nếu có lưu.
- `progress_score`: điểm tiến độ.
- `measurement_improvement_rate`: tốc độ cải thiện chỉ số.
- `goal_type`: mục tiêu tập.
- `renewal_count`: số lần đã gia hạn.
- `debt_amount`: công nợ.
- `pt_notes_sentiment`: chưa nên làm sớm, chỉ cân nhắc sau nếu ghi chú đủ nhiều.

### 6.3 Giai đoạn đầu dùng rule-based

Ví dụ rule:

```text
+30 điểm nếu 14 ngày chưa có buổi PT mới.
+20 điểm nếu tần suất tập giảm liên tục 3 tuần.
+20 điểm nếu còn <= 3 buổi và chưa gia hạn.
+15 điểm nếu progress score thấp.
+15 điểm nếu còn công nợ.

0-39: LOW
40-69: MEDIUM
70-100: HIGH
```

Output:

```text
Khách PT có nguy cơ bỏ chương trình

Nguyễn Văn A    HIGH
Lý do:
- 16 ngày chưa có buổi PT.
- Còn 2 buổi.
- Tiến độ 2 tuần gần đây chững lại.

Gợi ý:
- PT nên liên hệ đặt lịch buổi tiếp theo.
- Chủ phòng có thể tư vấn gia hạn trước khi hết buổi.
```

### 6.4 Sau này mới train ML

Khi có đủ dữ liệu lịch sử:

- Ai mua tiếp gói PT.
- Ai dừng sau khi hết gói.
- Ai bỏ ngang.
- Lịch sử session trước thời điểm dừng.

thì có thể train:

- Logistic Regression baseline.
- Random Forest.
- XGBoost/LightGBM.

Không cần Deep Learning/GPU.

## 7. Churn/Renewal Analytics cho khách tự tập

### 7.1 Mục tiêu

Với khách tự tập, nên gọi là Renewal Analytics hoặc Retention Analytics thay vì Churn Prediction ML.

Mục tiêu:

- Biết tỷ lệ khách gia hạn.
- Biết nhóm khách nào hay quay lại.
- Biết gói nào giữ chân khách tốt.
- Biết doanh thu từ khách mới/khách cũ.
- Biết khách nào sắp hết hạn cần nhắc.

### 7.2 Rule-based renewal risk nhẹ

Có thể tính điểm đơn giản:

```text
+40 điểm nếu còn <= 7 ngày hết hạn.
+20 điểm nếu chưa từng gia hạn.
+15 điểm nếu có công nợ.
+10 điểm nếu gói ngắn hạn.
+10 điểm nếu lần trước gia hạn trễ.

0-39: LOW
40-69: MEDIUM
70-100: HIGH
```

Lưu ý:

- Đây không phải ML churn đúng nghĩa.
- Không dùng dữ liệu "lâu chưa tập" nếu không có check-in.
- Hiển thị dưới dạng "cần chăm sóc gia hạn", không khẳng định khách sẽ bỏ.

## 8. Customer Segmentation

### 8.1 Mục tiêu

Phân nhóm khách để chủ phòng có chiến lược chăm sóc khác nhau.

Ví dụ:

```text
Khách trung thành
- Gia hạn nhiều lần
- Tổng chi tiêu cao

Khách mới
- Mới đăng ký
- Chưa có nhiều lịch sử

Khách giá trị cao
- Gói dài hạn
- Có dùng PT
- Doanh thu cao

Khách cần chăm sóc
- Sắp hết hạn
- Gia hạn không đều
- Có công nợ hoặc lịch sử trễ hạn
```

### 8.2 Cách làm

Giai đoạn đầu:

- Rule-based segmentation.

Sau này:

- K-Means nếu dữ liệu đủ và đã chuẩn hóa feature.

Feature:

- Số lần gia hạn.
- Tổng tiền đã chi.
- Loại gói.
- Số ngày gắn bó.
- Có dùng PT hay không.
- Số buổi PT đã dùng.
- Công nợ.
- Lịch sử trễ hạn.

## 9. Revenue Forecasting

### 9.1 Mục tiêu

Liên hệ requirement:

- Thống kê doanh số theo ngày, tuần, tháng, quý, năm.
- Lập biểu đồ so sánh với mục tiêu đầu năm.

Nâng cấp:

- Dự báo doanh thu tháng tới.
- Cảnh báo khả năng không đạt mục tiêu.

### 9.2 Khi nào nên làm

Không nên làm quá sớm.

Cần có dữ liệu doanh thu đủ dài:

- Tối thiểu vài tháng.
- Tốt hơn là 12 tháng để thấy mùa vụ.

### 9.3 Model

Bắt đầu bằng:

- Moving average.
- Linear Regression.
- Random Forest Regression.
- XGBoost Regression nếu dữ liệu đủ.

Không cần model time-series phức tạp ở giai đoạn đầu.

## 10. Exercise Recommendation

### 10.1 Mục tiêu

Gợi ý bài tập/chương trình tập theo mục tiêu.

Ví dụ:

```text
Mục tiêu: Tăng cơ ngực
Trình độ: Beginner
Thiết bị: Dumbbell, Bench

Gợi ý:
1. Dumbbell Bench Press
2. Incline Dumbbell Press
3. Chest Fly
```

### 10.2 Nên làm bằng rule-based trước

Không cần ML ban đầu.

Database bài tập nên có:

- Nhóm cơ.
- Mục tiêu phù hợp.
- Độ khó.
- Thiết bị.
- Có phù hợp beginner không.

Sau này nếu có đủ dữ liệu member xem/tập/lưu bài, mới tính tới recommendation system.

## 11. AI/RAG Chatbot kiến thức gym

### 11.1 Mục tiêu

Member hỏi về bài tập, kiến thức, chương trình tập.

Ví dụ:

- "Tôi mới tập thì nên tập nhóm cơ nào?"
- "Bài bench press tác động vào cơ nào?"
- "Tôi muốn giảm mỡ thì nên xem chương trình nào?"

### 11.2 Kiến trúc

Nếu làm, nên dùng RAG:

```text
Nội dung kiến thức của gym
  -> chunking/embedding
  -> vector database
  -> LLM trả lời dựa trên tài liệu nội bộ
```

### 11.3 Xếp ưu tiên

Không nên là AI đầu tiên.

Lý do:

- Có chi phí API nếu dùng LLM cloud.
- Cần kiểm soát nội dung tư vấn sức khỏe/thể hình.
- Cần tài liệu kiến thức đủ tốt.
- Không trực tiếp giải quyết nỗi đau vận hành như PT progress hoặc giữ chân khách.

## 12. Computer Vision - không nên làm giai đoạn đầu

Ý tưởng:

- Nhận diện động tác qua camera.
- Đếm rep.
- Phân tích form tập.

Không nên đưa vào project này lúc đầu vì:

- Nặng.
- Khó deploy trên VPS nhỏ.
- Có vấn đề privacy/camera.
- Cần xử lý video realtime.
- Accuracy khó đảm bảo.
- Scope phình rất mạnh.

Nếu muốn làm nghiên cứu/demo riêng thì được, nhưng không nên đưa vào roadmap production ban đầu.

## 13. Xếp hạng AI nên làm sau thông tin mới

| Hạng | Tính năng | Nhóm áp dụng | Giá trị | Độ khó | Tài nguyên | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PT Customer Progress Analysis | Khách PT | Rất cao | Dễ-Trung bình | Rất nhẹ | Làm bằng score/rule trước |
| 2 | PT Drop-off Risk | Khách PT | Rất cao | Trung bình | Nhẹ | Có thể ML sau khi đủ lịch sử |
| 3 | Customer Segmentation | Tất cả khách | Cao | Dễ | Rất nhẹ | Bắt đầu bằng rule-based |
| 4 | Renewal Analytics | Khách tự tập | Cao | Dễ | Rất nhẹ | Không gọi là churn ML nếu không có check-in |
| 5 | Revenue Forecasting | OWNER | Trung bình | Trung bình | Nhẹ | Cần dữ liệu doanh thu đủ dài |
| 6 | Exercise Recommendation | MEMBER/PT | Trung bình | Dễ | Rất nhẹ | Rule-based trước |
| 7 | RAG Chatbot | MEMBER | Trung bình | Trung bình | Phụ thuộc API | Chỉ làm khi có content tốt |
| 8 | Computer Vision | Demo riêng | Thấp ở production đầu | Khó | Nặng | Không đưa vào roadmap đầu |

## 14. Roadmap AI đề xuất

### AI Phase 0 - Chuẩn bị dữ liệu trong MVP

Làm ngay từ MVP:

- Lưu lịch sử gói tập.
- Lưu lịch sử gia hạn.
- Lưu thanh toán.
- Lưu công nợ.
- Lưu session log PT.
- Lưu exercise log từng buổi PT.
- Lưu body measurement theo thời gian.
- Lưu mục tiêu tập luyện ban đầu của khách PT.
- Lưu kết quả đánh giá khi kết thúc gói PT.
- Thiết kế bảng để sau này lưu AI score.
- Chỉ chuẩn bị import dữ liệu cũ ở phase sau nếu chủ phòng đổi nhu cầu và có file đủ sạch.

Bảng gợi ý:

```text
customer_ai_scores
  id
  member_id
  score_type
  score_value
  risk_level
  segment
  explanation_json
  calculated_at
```

Ví dụ `score_type`:

- PT_PROGRESS.
- PT_DROP_OFF_RISK.
- RENEWAL_RISK.
- CUSTOMER_SEGMENT.

### AI Phase 1 - Rule-based Intelligence

Làm sau khi MVP ổn:

- PT progress scoring.
- PT drop-off warning.
- Renewal risk nhẹ cho khách tự tập.
- Rule-based customer segmentation.
- Retention dashboard cho OWNER.

Ưu điểm:

- Không cần dữ liệu lớn.
- Dễ giải thích.
- Chạy trực tiếp trong Spring Boot.
- Deploy rất nhẹ.
- Phù hợp với phòng gym nhỏ.

### AI Phase 2 - ML cho khách PT

Khi có đủ dữ liệu thật:

- Train PT drop-off model.
- Train model dự đoán khả năng mua tiếp gói PT.
- Có thể dùng progress score làm feature.
- Lưu kết quả batch vào PostgreSQL.
- Dashboard đọc score từ database.

Stack:

- Python.
- pandas.
- scikit-learn.
- SHAP nếu dùng model phù hợp.
- joblib để lưu model.

Model:

- Logistic Regression baseline.
- Random Forest.
- XGBoost/LightGBM nếu dữ liệu đủ.

Không cần GPU.

### AI Phase 3 - Segmentation/Forecasting/Recommendation

Làm sau:

- K-Means customer segmentation nếu rule-based không đủ.
- Revenue forecasting.
- Exercise recommendation.
- Gợi ý retention action theo từng nhóm khách.

Ưu tiên vẫn là batch job, không realtime.

### AI Phase 4 - LLM/RAG nếu cần

Chỉ làm khi:

- Có thư viện kiến thức đủ tốt.
- Chủ phòng muốn member có trợ lý hỏi đáp.
- Chấp nhận chi phí API/model.
- Có rule rõ về disclaimer sức khỏe/thể hình.

## 15. Kiến trúc kỹ thuật AI nhẹ, dễ deploy VPS

### Giai đoạn đầu

```text
Spring Boot
  |
  |-- Rule-based scoring
  |-- Scheduler tính điểm hằng ngày
  |-- PostgreSQL lưu score
  |
React Dashboard hiển thị cảnh báo
```

Ưu điểm:

- Đơn giản.
- Không thêm service.
- Dễ deploy VPS.
- Phù hợp với phòng 50-70 khách/tháng.

### Giai đoạn ML batch

```text
PostgreSQL
  |
Python training script
  |
model.pkl
  |
Python batch scoring script
  |
PostgreSQL customer_ai_scores
  |
Spring Boot API
  |
React Dashboard
```

Ưu điểm:

- Backend Java không phải gánh inference phức tạp.
- Không cần realtime.
- Có thể chạy cron mỗi ngày/tuần.
- Không ảnh hưởng hiệu năng web chính.

### Giai đoạn ML service nếu thật sự cần

```text
React
  |
Spring Boot
  |
FastAPI ML Service
  |
model.pkl
```

Chỉ dùng khi:

- Cần inference realtime.
- Model phức tạp hơn.
- Muốn tách vòng đời deploy model và backend.

Không nên dựng FastAPI ML service quá sớm nếu rule-based/batch scoring đã đủ.

## 16. Kết luận sau thông tin mới

Thông tin mới làm thay đổi ưu tiên AI:

- Không nên lấy Churn Prediction cho toàn bộ khách làm AI chính.
- Với khách tự tập, do không điểm danh, nên tập trung vào expiry management, renewal analytics và rule-based reminder.
- Với khách PT, dữ liệu đầy đủ hơn rất nhiều, nên đây mới là nơi AI tạo giá trị mạnh nhất.

AI đáng làm nhất cho GYM DƯƠNG DOUBLE:

1. PT Customer Progress Analysis.
2. PT Drop-off Risk.
3. Customer Segmentation.
4. Renewal Analytics cho khách tự tập.

Churn/renewal ML chỉ nên làm sau khi có dữ liệu đủ tốt. Nếu không có check-in cho khách tự tập, model churn toàn hệ thống dễ bị sai vì thiếu hành vi thực tế.

Cách thực tế nhất:

- MVP lưu dữ liệu đúng.
- Không cần import lịch sử ở MVP; bắt đầu thu thập dữ liệu mới thật sạch.
- Phase 1 dùng rule-based score.
- Phase 2 ưu tiên ML cho khách PT trước.
- Không dùng Deep Learning/GPU cho bài toán tabular nhỏ.
- Không đưa Computer Vision vào production roadmap sớm.

Như vậy AI vẫn có chỗ đứng rõ ràng trong hệ thống, nhưng không làm project nặng lên và không dự đoán quá mức so với dữ liệu thực tế.
