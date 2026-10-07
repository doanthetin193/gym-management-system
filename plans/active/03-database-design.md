# 03 - THIáº¾T Káº¾ DATABASE

## 1. Má»¥c tiÃªu thiáº¿t káº¿

Database cá»§a há»‡ thá»‘ng khÃ´ng sao chÃ©p nguyÃªn cÃ¡c file Excel hiá»‡n táº¡i.  
CÃ¡c báº£ng Excel/phiáº¿u giáº¥y Ä‘Æ°á»£c phÃ¢n tÃ­ch Ä‘á»ƒ tÃ¬m ra dá»¯ liá»‡u nguá»“n tháº­t, sau Ä‘Ã³ chuáº©n hÃ³a thÃ nh entity.

Má»¥c tiÃªu:

- Äá»§ dá»¯ liá»‡u Ä‘á»ƒ thay tháº¿ cÃ¡ch quáº£n lÃ½ thá»§ cÃ´ng hiá»‡n táº¡i.
- KhÃ´ng táº¡o quÃ¡ nhiá»u báº£ng dÆ° thá»«a.
- KhÃ´ng lÆ°á»£c bá» cÃ¡c nghiá»‡p vá»¥ quan trá»ng cá»§a chá»§ phÃ²ng.
- BÃ¡o cÃ¡o Ä‘Æ°á»£c tá»± tÃ­nh tá»« dá»¯ liá»‡u nguá»“n.
- LÆ°u lá»‹ch sá»­ gia háº¡n, thanh toÃ¡n, buá»•i táº­p vÃ  tiáº¿n Ä‘á»™.
- Chá»«a Ä‘Æ°á»ng cho payroll, import Excel vÃ  AI sau nÃ y.

NguyÃªn táº¯c:

- `Entity/Table`: báº£ng tháº­t trong database.
- `Enum/Code`: giÃ¡ trá»‹ cá»‘ Ä‘á»‹nh xá»­ lÃ½ trong code, khÃ´ng táº¡o báº£ng náº¿u khÃ´ng cáº§n quáº£n trá»‹ Ä‘á»™ng.
- `Report/View`: dá»¯ liá»‡u tá»•ng há»£p, Æ°u tiÃªn tÃ­nh tá»« báº£ng nguá»“n.

## 2. Quy mÃ´ báº£ng Ä‘á» xuáº¥t

MVP tá»‘i Æ°u nhÆ°ng Ä‘á»§ nghÄ©a:

```text
Khoáº£ng 24-26 báº£ng
```

Full phase sau:

```text
Khoáº£ng 34-42 báº£ng
```

LÃ½ do MVP active nhiá»u hÆ¡n báº£n siÃªu gá»n: dá»¯ liá»‡u tá»« 10 áº£nh cho tháº¥y há»‡ thá»‘ng khÃ´ng chá»‰ cÃ³ member/gÃ³i táº­p, mÃ  cÃ²n cÃ³ thu chi, lá»‹ch PT, check-in chÆ°Æ¡ng trÃ¬nh, chá»‰ sá»‘ cÆ¡ thá»ƒ, má»¥c tiÃªu táº­p luyá»‡n vÃ  má»¥c tiÃªu thÃ¡ng.

## 3. NhÃ³m báº£ng MVP Ä‘á» xuáº¥t

```text
users
roles
user_roles

members
member_notes

membership_plans
member_memberships

payments
financial_categories
financial_transactions
debt_records

pt_profiles
pt_assignments
pt_schedules
pt_session_packages
pt_session_logs
member_activity_logs
body_measurements
pt_goals

exercise_categories
exercises

business_goals

notifications
audit_logs
system_settings
```

Tá»•ng: khoáº£ng 25 báº£ng.

Náº¿u cáº§n giáº£m scope MVP, Æ°u tiÃªn hoÃ£n UI/bÃ¡o cÃ¡o nÃ¢ng cao chá»© khÃ´ng bá» dá»¯ liá»‡u nguá»“n cá»‘t lÃµi:

- KhÃ´ng nÃªn bá» `member_activity_logs` vÃ¬ báº£ng nÃ y giá»¯ buá»•i Ã”n táº­p vÃ  check-in GiÃ¡o Ã¡n/HÆ°á»›ng Dáº«n.
- KhÃ´ng lÃ m `training_programs`/`training_program_weeks` trong Sprint 5 vÃ¬ nhu cáº§u thá»±c táº¿ hiá»‡n táº¡i lÃ  thÆ° viá»‡n video TikTok public, khÃ´ng pháº£i LMS/giÃ¡o Ã¡n theo tuáº§n.
- CÃ³ thá»ƒ lÃ m `business_goals` á»Ÿ cuá»‘i MVP.
- Notification nÃ¢ng cao cÃ³ thá»ƒ hoÃ£n. Náº¿u chÆ°a lÃ m báº£ng `notifications` ngay, dashboard váº«n pháº£i hiá»ƒn thá»‹ danh sÃ¡ch sáº¯p háº¿t háº¡n, sinh nháº­t, cÃ´ng ná»£ vÃ  khÃ¡ch PT cÃ²n Ã­t buá»•i tá»« dá»¯ liá»‡u nguá»“n.

NhÆ°ng khÃ´ng nÃªn bá» háº³n khá»i thiáº¿t káº¿ vÃ¬ cÃ¡c báº£ng nÃ y pháº£n Ã¡nh Ä‘Ãºng dá»¯ liá»‡u chá»§ phÃ²ng Ä‘ang dÃ¹ng.

## 4. Auth vÃ  phÃ¢n quyá»n

### 4.1 `users`

TÃ i khoáº£n Ä‘Äƒng nháº­p cho OWNER, PT, MEMBER.

```text
users
  id
  email
  phone
  password_hash
  full_name
  status
  last_login_at
  created_at
  updated_at
```

Enum/code:

- `UserStatus`: ACTIVE, INACTIVE, LOCKED.

### 4.2 `roles`

```text
roles
  id
  code
  name
```

Dá»¯ liá»‡u ban Ä‘áº§u:

- OWNER.
- PT.
- MEMBER.

### 4.3 `user_roles`

```text
user_roles
  user_id
  role_id
```

## 5. Member vÃ  ghi chÃº khÃ¡ch hÃ ng

### 5.1 `members`

LÆ°u há»“ sÆ¡ khÃ¡ch hÃ ng.

```text
members
  id
  user_id
  full_name
  phone
  date_of_birth
  gender
  address
  zalo_phone
  source
  status
  note
  created_at
  updated_at
```

Ghi chÃº:

- `user_id` nullable vÃ¬ khÃ´ng pháº£i member nÃ o cÅ©ng cáº§n tÃ i khoáº£n Ä‘Äƒng nháº­p ngay.
- `zalo_phone` phá»¥c vá»¥ má»Ÿ nhanh Zalo/chat sau nÃ y.

Enum/code:

- `MemberStatus`: ACTIVE, INACTIVE, ARCHIVED.
- `MemberSource`: WALK_IN, FACEBOOK, ZALO, REFERRAL, OTHER.

### 5.2 `member_notes`

LÆ°u ghi chÃº theo dÃ²ng thá»i gian.

```text
member_notes
  id
  member_id
  note_type
  content
  created_by
  created_at
```

Enum/code:

- `NoteType`: GENERAL, RENEWAL, DEBT, PT_PROGRESS, CUSTOMER_CARE.

## 6. GÃ³i táº­p vÃ  lá»‹ch sá»­ gia háº¡n

### 6.1 `membership_plans`

Danh má»¥c gÃ³i táº­p.

```text
membership_plans
  id
  name
  plan_type
  pt_level
  duration_days
  default_price
  pt_session_count
  practice_session_count
  guidance_session_count
  content_access_level
  price_ratio
  description
  active
  created_at
  updated_at
```

Enum/code:

- `PlanType`: SELF_TRAINING, PT, GUIDANCE, OTHER.
- `PtLevel`: MAIN, NEW.
- `ContentAccessLevel`: NONE, BASIC, PREMIUM.

Ghi chÃº:

- `pt_level` chá»‰ dÃ¹ng khi `plan_type = PT`.
- `pt_session_count` lÃ  sá»‘ buá»•i PT cÃ³ PT trá»±c tiáº¿p.
- `practice_session_count` lÃ  sá»‘ buá»•i Ã”n táº­p Ä‘i kÃ¨m gÃ³i PT, khÃ¡ch tá»± Ã´n bÃ i khÃ´ng cÃ³ PT trá»±c tiáº¿p.
- `guidance_session_count` dÃ¹ng cho gÃ³i GiÃ¡o Ã¡n/HÆ°á»›ng Dáº«n 30, 60, 90 buá»•i.
- `content_access_level` xÃ¡c Ä‘á»‹nh quyá»n xem thÆ° viá»‡n bÃ i táº­p/chÆ°Æ¡ng trÃ¬nh tráº£ phÃ­.
- `price_ratio` há»— trá»£ cáº¥u hÃ¬nh gÃ³i PT má»›i báº±ng khoáº£ng 65% gÃ³i PT chÃ­nh náº¿u cáº§n.
- KhÃ´ng táº¡o `PlanType.STUDENT`. Cá»™t `Sinh viÃªn` trong Excel cÅ© thá»±c cháº¥t lÃ  khoáº£n thu cá»§a gÃ³i PT má»›i.

VÃ­ dá»¥ plan:

- `Tá»± táº­p 1 thÃ¡ng`: `plan_type = SELF_TRAINING`.
- `PT chÃ­nh 20 + 20`: `plan_type = PT`, `pt_level = MAIN`, `pt_session_count = 20`, `practice_session_count = 20`, `content_access_level = PREMIUM`.
- `PT má»›i 20 + 20`: `plan_type = PT`, `pt_level = NEW`, `pt_session_count = 20`, `practice_session_count = 20`, `price_ratio = 0.65`, `content_access_level = PREMIUM`.
- `GiÃ¡o Ã¡n 30 buá»•i`: `plan_type = GUIDANCE`, `guidance_session_count = 30`, `content_access_level = BASIC` hoáº·c `PREMIUM` tÃ¹y cÃ¡ch bÃ¡n.

### 6.2 `member_memberships`

LÆ°u tá»«ng láº§n khÃ¡ch Ä‘Äƒng kÃ½/gia háº¡n.

```text
member_memberships
  id
  member_id
  plan_id
  sold_by_user_id
  start_date
  end_date
  actual_price
  paid_amount
  discount_amount
  debt_amount
  status
  note
  created_by
  created_at
  updated_at
```

Enum/code:

- `MembershipStatus`: ACTIVE, EXPIRED, CANCELLED, PENDING_PAYMENT.

Quy táº¯c:

- Gia háº¡n táº¡o record má»›i.
- KhÃ´ng ghi Ä‘Ã¨ gÃ³i cÅ©.
- Tráº¡ng thÃ¡i sáº¯p háº¿t háº¡n cÃ³ thá»ƒ tÃ­nh tá»« `end_date`, khÃ´ng nháº¥t thiáº¿t lÆ°u thÃ nh field.
- `sold_by_user_id` nullable, dÃ¹ng Ä‘á»ƒ ghi nháº­n ai sale/phá»¥ trÃ¡ch bÃ¡n gÃ³i. Field nÃ y phá»¥c vá»¥ hoa há»“ng sale PT á»Ÿ phase payroll sau nÃ y.
- Náº¿u plan lÃ  `PT`, backend táº¡o/cáº­p nháº­t `pt_session_packages` tÆ°Æ¡ng á»©ng Ä‘á»ƒ quáº£n lÃ½ sá»‘ buá»•i PT vÃ  Ã”n táº­p.
- Náº¿u plan lÃ  `GUIDANCE`, khÃ´ng táº¡o `pt_session_packages`; sá»‘ buá»•i GiÃ¡o Ã¡n Ä‘Ã£ dÃ¹ng Ä‘Æ°á»£c tÃ­nh tá»« `member_activity_logs` theo `membership_id`.

## 7. Thanh toÃ¡n, thu chi, cÃ´ng ná»£

### 7.1 `payments`

Ghi nháº­n tiá»n khÃ¡ch tráº£.

```text
payments
  id
  member_id
  membership_id
  payment_date
  amount
  payment_method
  revenue_category
  description
  created_by
  created_at
```

Enum/code:

- `PaymentMethod`: CASH, BANK_TRANSFER, CARD, OTHER.
- `RevenueCategory`: SELF_TRAINING, GUIDANCE, PT_MAIN, PT_NEW, OTHER_INCOME.

Mapping tá»« Excel `Tá»”NG THU`:

- Tá»± táº­p -> SELF_TRAINING.
- GiÃ¡o Ã¡n -> GUIDANCE.
- Sinh viÃªn -> PT_NEW.
- PT -> PT_MAIN hoáº·c PT_NEW tÃ¹y gÃ³i/nhÃ¢n sá»± phá»¥ trÃ¡ch.

Ghi chÃº:

- `Sinh viÃªn` khÃ´ng cÃ²n Ä‘Æ°á»£c dÃ¹ng nhÆ° category nghiá»‡p vá»¥ má»›i. ÄÃ¢y lÃ  tÃªn cá»™t Excel cÅ© cá»§a khoáº£n thu gÃ³i PT má»›i.
- Náº¿u sau nÃ y cÃ³ gÃ³i giáº£m giÃ¡ tháº­t cho sinh viÃªn, nÃªn xá»­ lÃ½ báº±ng discount trÃªn `member_memberships`, khÃ´ng táº¡o láº«n vá»›i revenue category hiá»‡n táº¡i.

### 7.2 `financial_categories`

Danh má»¥c thu/chi cÃ³ thá»ƒ quáº£n trá»‹.

```text
financial_categories
  id
  type
  code
  name
  active
```

Enum/code:

- `FinancialCategoryType`: INCOME, EXPENSE.

VÃ­ dá»¥ expense category:

- RENT.
- MARKETING.
- ELECTRICITY.
- WATER.
- WASTE.
- INTERNET.
- DRINKING_WATER.
- PT_SALARY.
- BONUS.
- HOLIDAY_BONUS.
- PT_SUPPORT_EXPENSE.
- MKT.
- OTHER_EXPENSE.

Ghi chÃº:

- CÃ¡c khoáº£n chi cÃ³ thá»ƒ phÃ¡t sinh linh hoáº¡t, khÃ´ng hard-code trong code.
- `Kiá»‡t` lÃ  tÃªn nhÃ¢n sá»±/PT.
- `TiÃªn PT` lÃ  khoáº£n liÃªn quan chá»‹ TiÃªn vá»›i vai trÃ² PT.
- `TiÃªn MKT` lÃ  khoáº£n liÃªn quan chá»‹ TiÃªn vá»›i vai trÃ² marketing.
- MVP cho OWNER tá»± táº¡o/sá»­a/áº©n danh má»¥c chi trong `financial_categories`, vÃ­ dá»¥ `Kiá»‡t`, `TiÃªn PT`, `TiÃªn MKT`, `ThÆ°á»Ÿng lá»…`.
- Phase sau náº¿u lÃ m payroll/nhÃ¢n sá»± chuáº©n hÆ¡n thÃ¬ cÃ¡c khoáº£n theo tÃªn ngÆ°á»i cÃ³ thá»ƒ liÃªn káº¿t sang employee/PT thay vÃ¬ chá»‰ lÃ  category.

### 7.3 `financial_transactions`

Ghi nháº­n giao dá»‹ch thu/chi tá»•ng quÃ¡t.

```text
financial_transactions
  id
  type
  category_id
  amount
  transaction_date
  member_id
  membership_id
  payment_id
  description
  created_by
  created_at
  updated_at
```

Enum/code:

- `FinancialTransactionType`: INCOME, EXPENSE.

Ghi chÃº:

- Payment cÃ³ thá»ƒ tá»± sinh transaction loáº¡i INCOME.
- Chi phÃ­ tá»« Excel `Tá»”NG CHI` táº¡o transaction loáº¡i EXPENSE.
- `TÃ i chÃ­nh nÄƒm` lÃ  report tá»« báº£ng nÃ y.
- Äá»ƒ trÃ¡nh tÃ­nh trÃ¹ng doanh thu, bÃ¡o cÃ¡o tÃ i chÃ­nh nÃªn dÃ¹ng `financial_transactions` lÃ m nguá»“n tá»•ng há»£p chÃ­nh.
- `payments` lÃ  báº£ng nghiá»‡p vá»¥ thanh toÃ¡n cá»§a khÃ¡ch; khi táº¡o/sá»­a payment pháº£i Ä‘á»“ng bá»™ má»™t transaction INCOME cÃ³ `payment_id`.
- Transaction INCOME sinh tá»« payment khÃ´ng nháº­p tay láº§n ná»¯a trÃªn UI.

### 7.4 `debt_records`

Theo dÃµi cÃ´ng ná»£ rÃµ rÃ ng.

```text
debt_records
  id
  member_id
  membership_id
  original_amount
  paid_amount
  remaining_amount
  due_date
  status
  note
  created_at
  updated_at
```

Enum/code:

- `DebtStatus`: OPEN, PARTIALLY_PAID, PAID, CANCELLED.

## 8. PT, lá»‹ch dáº¡y vÃ  gÃ¡n khÃ¡ch

### 8.1 `pt_profiles`

ThÃ´ng tin riÃªng cá»§a PT.

```text
pt_profiles
  id
  user_id
  pt_level
  specialty
  bio
  base_salary
  teaching_rate
  sales_commission_rate
  active
  created_at
  updated_at
```

Enum/code:

- `PtLevel`: MAIN, NEW.

Ghi chÃº:

- `MAIN` lÃ  PT chÃ­nh theo báº£ng giÃ¡ chuáº©n cá»§a phÃ²ng; hiá»‡n lÃ  chá»§ phÃ²ng.
- `NEW` lÃ  PT má»›i/há»c viá»‡c, gÃ³i bÃ¡n báº±ng khoáº£ng 65% giÃ¡ PT chÃ­nh; hiá»‡n lÃ  Kiá»‡t.
- `teaching_rate` máº·c Ä‘á»‹nh cÃ³ thá»ƒ lÃ  `0.30` theo cÃ´ng thá»©c lÆ°Æ¡ng dáº¡y Ä‘Ã£ chá»‘t.
- `sales_commission_rate` máº·c Ä‘á»‹nh cÃ³ thá»ƒ lÃ  `0.10` theo cÃ´ng thá»©c hoa há»“ng sale Ä‘Ã£ chá»‘t.

### 8.2 `pt_assignments`

GÃ¡n PT phá»¥ trÃ¡ch khÃ¡ch.

```text
pt_assignments
  id
  pt_user_id
  member_id
  start_date
  end_date
  status
  note
  created_at
  updated_at
```

Enum/code:

- `PtAssignmentStatus`: ACTIVE, ENDED, PAUSED.

### 8.3 `pt_schedules`

Sá»‘ hÃ³a báº£ng `Lá»ŠCH Dáº Y TUáº¦N`.

```text
pt_schedules
  id
  pt_user_id
  member_id
  schedule_date
  start_time
  end_time
  status
  note
  created_by
  created_at
  updated_at
```

Enum/code:

- `ScheduleStatus`: SCHEDULED, COMPLETED, CANCELLED, MISSED, RESCHEDULED.

Ghi chÃº:

- Excel hiá»ƒn thá»‹ dáº¡ng ma tráº­n giá» x thá»©.
- Database lÆ°u má»—i lá»‹ch lÃ  má»™t dÃ²ng.

## 9. PT session, check-in vÃ  hoáº¡t Ä‘á»™ng

### 9.1 `pt_session_packages`

Theo dÃµi gÃ³i PT theo sá»‘ buá»•i.

```text
pt_session_packages
  id
  member_id
  pt_user_id
  membership_id
  total_pt_sessions
  used_pt_sessions
  remaining_pt_sessions
  total_practice_sessions
  used_practice_sessions
  remaining_practice_sessions
  start_date
  end_date
  status
  created_at
  updated_at
```

Enum/code:

- `SessionPackageStatus`: ACTIVE, COMPLETED, CANCELLED, EXPIRED.

Ghi chÃº:

- GÃ³i PT hiá»‡n táº¡i cÃ³ 3 máº«u chÃ­nh: `20 PT + 20 Ã”n táº­p`, `40 PT + 40 Ã”n táº­p`, `60 PT + 60 Ã”n táº­p`.
- LÆ°Æ¡ng dáº¡y PT chá»‰ tÃ­nh theo `used_pt_sessions`, khÃ´ng tÃ­nh `used_practice_sessions`.
- Phiáº¿u `CHECK IN` 24 dÃ²ng chá»‰ lÃ  máº«u in sáºµn, khÃ´ng dÃ¹ng Ä‘á»ƒ cá»‘ Ä‘á»‹nh sá»‘ buá»•i trong database.

### 9.2 `pt_session_logs`

Ghi nháº­n tá»«ng buá»•i PT.

```text
pt_session_logs
  id
  session_package_id
  member_id
  pt_user_id
  schedule_id
  session_date
  session_number
  weight
  status
  content
  note
  created_by
  created_at
  updated_at
```

Enum/code:

- `PtSessionStatus`: COMPLETED, CANCELLED, MISSED, RESCHEDULED.

Mapping tá»« phiáº¿u `CHECK IN`:

- Táº­p PT ngÃ y -> `session_date`.
- Táº­p PT cÃ¢n náº·ng -> `weight`.
- STT -> `session_number`.

### 9.3 `member_activity_logs`

DÃ¹ng cho buá»•i Ã”n táº­p Ä‘i kÃ¨m gÃ³i PT vÃ  check-in GiÃ¡o Ã¡n/HÆ°á»›ng Dáº«n.

```text
member_activity_logs
  id
  member_id
  membership_id
  session_package_id
  activity_type
  activity_date
  session_number
  weight
  note
  created_by
  created_at
```

Enum/code:

- `ActivityType`: PRACTICE, GUIDANCE_CHECKIN.

Ghi chÃº:

- Báº£ng nÃ y pháº£n Ã¡nh cá»™t `Ã”n táº­p` trong phiáº¿u check-in.
- KhÃ¡ch GiÃ¡o Ã¡n/HÆ°á»›ng Dáº«n cÅ©ng check-in táº¡i Ä‘Ã¢y vá»›i `activity_type = GUIDANCE_CHECKIN`.
- KhÃ¡ch tá»± táº­p khÃ´ng check-in, nÃªn khÃ´ng sinh dá»¯ liá»‡u á»Ÿ báº£ng nÃ y.
- `membership_id` giÃºp tÃ­nh sá»‘ buá»•i GiÃ¡o Ã¡n Ä‘Ã£ dÃ¹ng/cÃ²n láº¡i theo Ä‘Ãºng gÃ³i 30, 60, 90.
- `session_package_id` nullable, dÃ¹ng khi log lÃ  buá»•i Ã”n táº­p Ä‘i kÃ¨m má»™t gÃ³i PT cá»¥ thá»ƒ.
- Vá»›i `PRACTICE`, há»‡ thá»‘ng cáº­p nháº­t `used_practice_sessions/remaining_practice_sessions` trÃªn `pt_session_packages`.
- Vá»›i `GUIDANCE_CHECKIN`, há»‡ thá»‘ng tÃ­nh sá»‘ buá»•i Ä‘Ã£ dÃ¹ng báº±ng sá»‘ log theo `membership_id`.
- Náº¿u cáº§n MVP gá»n hÆ¡n, cÃ³ thá»ƒ táº¡m hoÃ£n UI nhÆ°ng váº«n nÃªn giá»¯ trong thiáº¿t káº¿.

## 10. Chá»‰ sá»‘ cÆ¡ thá»ƒ

### 10.1 `body_measurements`

Sá»‘ hÃ³a phiáº¿u `THEO DÃ•I KHÃCH HÃ€NG`.

```text
body_measurements
  id
  member_id
  recorded_by
  recorded_at
  height
  weight
  chest
  waist
  abdomen
  hip
  thigh
  arm
  note
  created_at
```

Mapping:

- Cao -> `height`.
- Náº·ng -> `weight`.
- V1 -> `chest`.
- Eo -> `waist`.
- Bá»¥ng -> `abdomen`.
- V3 -> `hip`.
- ÄÃ¹i -> `thigh`.
- Tay -> `arm`.

## 11. Má»¥c tiÃªu vÃ  chÆ°Æ¡ng trÃ¬nh táº­p

### 11.1 `pt_goals`

LÆ°u má»¥c tiÃªu ban Ä‘áº§u cá»§a khÃ¡ch PT/chÆ°Æ¡ng trÃ¬nh.

```text
pt_goals
  id
  member_id
  pt_user_id
  goal_type
  goal_description
  start_date
  target_date
  target_weight
  target_body_fat
  target_waist
  status
  note
  created_at
  updated_at
```

Enum/code:

- `GoalType`: FAT_LOSS, MUSCLE_GAIN, STRENGTH, FITNESS, HEALTH, OTHER.

### 11.2 Training Program theo tuáº§n

KhÃ´ng triá»ƒn khai trong Sprint 5.

LÃ½ do:

- Chá»§ phÃ²ng hiá»‡n khÃ´ng cáº§n quáº£n lÃ½ khÃ³a há»c/giÃ¡o Ã¡n theo tuáº§n trÃªn web.
- PT/chá»§ phÃ²ng khÃ´ng cÃ³ thá»i gian nháº­p chi tiáº¿t tá»«ng tuáº§n nhÆ° LMS.
- Tiáº¿n Ä‘á»™ PT hiá»‡n Ä‘Ã£ Ä‘á»§ dá»¯ liá»‡u cá»‘t lÃµi qua `pt_session_logs`, `member_activity_logs`, `body_measurements` vÃ  `pt_goals`.

Phase sau chá»‰ má»Ÿ láº¡i náº¿u cÃ³ nhu cáº§u tháº­t vá» giÃ¡o Ã¡n cÃ¡ nhÃ¢n hÃ³a theo tuáº§n cho tá»«ng khÃ¡ch PT.

## 12. ThÆ° viá»‡n bÃ i táº­p/video TikTok public

### 12.1 `exercise_categories`

```text
exercise_categories
  id
  name
  slug
  description
  icon_name
  sort_order
  active
  created_at
  updated_at
```

### 12.2 `exercises`

Má»—i dÃ²ng lÃ  má»™t bÃ i táº­p/chá»§ Ä‘á» hÆ°á»›ng dáº«n cÃ³ thá»ƒ gáº¯n má»™t video TikTok chÃ­nh.

```text
exercises
  id
  category_id
  title
  slug
  description
  instruction
  common_mistakes
  level
  muscle_group
  equipment
  tiktok_url
  tiktok_video_id
  thumbnail_url
  author_name
  author_tiktok_url
  featured
  published
  view_count
  created_at
  updated_at
```

Enum/code:

- `ExerciseLevel`: BEGINNER, INTERMEDIATE, ADVANCED.

NguyÃªn táº¯c:

- Sprint 5 chá»‰ dÃ¹ng TikTok, khÃ´ng há»— trá»£ provider video khÃ¡c.
- ThÆ° viá»‡n bÃ i táº­p lÃ  public; khÃ´ng dÃ¹ng `MEMBER_ONLY`/`PREMIUM` trong sprint nÃ y.
- KhÃ´ng cáº§n báº£ng `exercise_media` trong Sprint 5 náº¿u má»—i bÃ i táº­p chá»‰ gáº¯n má»™t video TikTok chÃ­nh.
- Náº¿u phase sau cáº§n nhiá»u áº£nh/video cho má»™t bÃ i táº­p, má»›i tÃ¡ch thÃªm báº£ng media riÃªng.
- KhÃ´ng upload/stream video báº±ng VPS.
- Frontend Æ°u tiÃªn TikTok embed; náº¿u embed bá»‹ cháº·n hoáº·c khÃ´ng táº£i Ä‘Æ°á»£c thÃ¬ hiá»ƒn thá»‹ thumbnail/nÃºt má»Ÿ TikTok.

## 13. Má»¥c tiÃªu kinh doanh, notification vÃ  audit

### 13.1 `business_goals`

Sá»‘ hÃ³a báº£ng `Má»¤C TIÃŠU THÃNG`.

```text
business_goals
  id
  year
  month
  category
  metric_name
  target_value
  unit
  note
  created_by
  created_at
  updated_at
```

Enum/code:

- `BusinessGoalCategory`: FINANCE, SELF_TRAINING_MEMBER, GUIDED_CUSTOMER, NEW_PT_CUSTOMER, MAIN_PT_CUSTOMER, OTHER.
- `BusinessGoalMetric`: REVENUE, PROFIT, CUSTOMER_COUNT, NEW_CUSTOMER_COUNT, PT_CUSTOMER_COUNT.

Mapping tá»« Excel `Má»¤C TIÃŠU THÃNG`:

- TÃ i chÃ­nh / Doanh thu -> category FINANCE, metric REVENUE.
- TÃ i chÃ­nh / Lá»£i nhuáº­n -> category FINANCE, metric PROFIT.
- Sá»‘ khÃ¡ch Member / KhÃ¡ch tá»± táº­p -> category SELF_TRAINING_MEMBER.
- KhÃ¡ch HÆ°á»›ng Dáº«n/GiÃ¡o Ã¡n -> category GUIDED_CUSTOMER.
- KhÃ¡ch PT Má»›i -> category NEW_PT_CUSTOMER, tÃ­nh tá»« gÃ³i PT cÃ³ `pt_level = NEW`.
- KhÃ¡ch PT ChÃ­nh -> category MAIN_PT_CUSTOMER, tÃ­nh tá»« gÃ³i PT cÃ³ `pt_level = MAIN`.

KhÃ¡ch HÆ°á»›ng Dáº«n lÃ  khÃ¡ch mua giÃ¡o Ã¡n sau giai Ä‘oáº¡n táº­p PT; nhÃ³m nÃ y cÃ³ thá»ƒ check-in theo gÃ³i 30, 60, 90 buá»•i.

### 13.2 `notifications`

```text
notifications
  id
  recipient_user_id
  member_id
  notification_type
  title
  content
  status
  scheduled_at
  sent_at
  read_at
  created_at
```

Enum/code:

- `NotificationType`: MEMBERSHIP_EXPIRING, MEMBERSHIP_EXPIRED, BIRTHDAY, DEBT_REMINDER, PT_LOW_SESSIONS, PT_PROGRESS_WARNING.

### 13.3 `audit_logs`

```text
audit_logs
  id
  actor_user_id
  action
  entity_type
  entity_id
  old_value_json
  new_value_json
  ip_address
  created_at
```

Cáº§n log:

- Táº¡o/sá»­a member.
- Gia háº¡n gÃ³i.
- Ghi nháº­n/sá»­a thanh toÃ¡n.
- Ghi nháº­n/sá»­a chi phÃ­.
- Sá»­a buá»•i PT.
- Sá»­a dá»¯ liá»‡u lÆ°Æ¡ng sau nÃ y.

### 13.4 `system_settings`

```text
system_settings
  key
  value
  description
  updated_at
```

VÃ­ dá»¥:

- `membership.expiring_soon_days = 7`.
- `notification.birthday_time = 06:00`.

## 14. Báº£ng phase sau

### Import dá»¯ liá»‡u cÅ©

```text
member_import_batches
```

Chá»‰ dÃ¹ng náº¿u phase sau muá»‘n nháº­p dá»¯ liá»‡u lá»‹ch sá»­. MVP hiá»‡n táº¡i khÃ´ng cáº§n import dá»¯ liá»‡u cÅ© vÃ¬ chá»§ phÃ²ng Ä‘Ã£ chá»‘t báº¯t Ä‘áº§u vá»›i dá»¯ liá»‡u má»›i.

Náº¿u import dá»¯ liá»‡u tÃ i chÃ­nh/khÃ¡ch/PT sau nÃ y, cÃ³ thá»ƒ má»Ÿ rá»™ng thÃªm:

```text
import_rows
  id
  batch_id
  row_number
  status
  raw_data_json
  error_message
```

KhÃ´ng Ä‘Æ°a `member_import_batches` vÃ  `import_rows` vÃ o schema MVP náº¿u chÆ°a triá»ƒn khai import.

### Payroll/lÆ°Æ¡ng PT

```text
salary_periods
salary_items
commission_rules
```

Mapping tá»« Excel `LÆ¯Æ NG PT`:

- LÆ°Æ¡ng cá»‘ Ä‘á»‹nh -> `salary_periods.base_salary`.
- LÆ°Æ¡ng dáº¡y khÃ¡ch -> `salary_items` type TEACHING_COMMISSION.
- LÆ°Æ¡ng sale -> `salary_items` type SALES_COMMISSION.
- ThÆ°á»Ÿng -> `salary_items` type BONUS.
- Pháº¡t -> `salary_items` type PENALTY.

Quy táº¯c Ä‘Ã£ chá»‘t Ä‘á»ƒ triá»ƒn khai á»Ÿ phase sau:

- LÆ°Æ¡ng dáº¡y PT chá»‰ tÃ­nh trÃªn sá»‘ buá»•i PT thá»±c dáº¡y, láº¥y tá»« `pt_session_logs`.
- KhÃ´ng tÃ­nh lÆ°Æ¡ng dáº¡y cho buá»•i Ã”n táº­p vÃ¬ Ä‘Ã¢y lÃ  buá»•i khÃ¡ch tá»± táº­p láº¡i.
- CÃ´ng thá»©c lÆ°Æ¡ng dáº¡y: `sá»‘ buá»•i PT Ä‘Ã£ dáº¡y * 30% * (giÃ¡ gÃ³i / tá»•ng sá»‘ buá»•i PT cá»§a gÃ³i)`.
- Hoa há»“ng sale: `10% * sá»‘ tiá»n khÃ¡ch Ä‘Ã£ thanh toÃ¡n`.
- Náº¿u khÃ¡ch thanh toÃ¡n nhiá»u Ä‘á»£t, hoa há»“ng sale phÃ¡t sinh theo sá»‘ tiá»n thá»±c nháº­n tá»«ng Ä‘á»£t.

### AI/Analytics

```text
customer_ai_scores
ai_score_runs
```

DÃ¹ng cho:

- PT Progress.
- PT Drop-off Risk.
- Renewal Risk.
- Customer Segment.

## 15. Báº£ng nÃ o lÃ  dá»¯ liá»‡u nguá»“n, báº£ng nÃ o lÃ  bÃ¡o cÃ¡o?

### Dá»¯ liá»‡u nguá»“n cáº§n lÆ°u

- `members`.
- `membership_plans`.
- `member_memberships`.
- `payments`.
- `financial_transactions`.
- `pt_schedules`.
- `pt_session_logs`.
- `member_activity_logs`.
- `body_measurements`.
- `pt_goals`.
- `exercise_categories`.
- `exercises`.

### BÃ¡o cÃ¡o nÃªn tá»± tÃ­nh

- Tá»•ng thu ngÃ y/thÃ¡ng/nÄƒm.
- Tá»•ng chi ngÃ y/thÃ¡ng/nÄƒm.
- Lá»£i nhuáº­n.
- TÃ i chÃ­nh nÄƒm.
- Sá»‘ khÃ¡ch má»›i/cÅ©.
- Sá»‘ khÃ¡ch tÃ¡i tá»¥c/gia háº¡n theo thÃ¡ng.
- KhÃ¡ch sáº¯p háº¿t háº¡n.
- % hoÃ n thÃ nh má»¥c tiÃªu thÃ¡ng.
- Báº£ng lÆ°Æ¡ng PT cuá»‘i thÃ¡ng.

## 16. Index quan trá»ng

```text
users.phone
users.email
members.phone
members.full_name
member_memberships.member_id
member_memberships.end_date
member_memberships.status
payments.member_id
payments.payment_date
financial_transactions.transaction_date
financial_transactions.type
financial_transactions.category_id
pt_schedules.pt_user_id
pt_schedules.schedule_date
pt_session_logs.member_id
pt_session_logs.session_date
body_measurements.member_id
body_measurements.recorded_at
exercise_categories.slug
exercises.slug
exercises.category_id
exercises.published
notifications.recipient_user_id
notifications.status
```

## 17. RÃ ng buá»™c dá»¯ liá»‡u

- GÃ³i Ä‘Ã£ tá»«ng bÃ¡n khÃ´ng xÃ³a cá»©ng, chá»‰ inactive.
- Thanh toÃ¡n Ä‘Ã£ ghi nháº­n khÃ´ng xÃ³a cá»©ng tÃ¹y tiá»‡n.
- Sá»­a dá»¯ liá»‡u tÃ i chÃ­nh pháº£i cÃ³ audit log.
- Gia háº¡n táº¡o dÃ²ng má»›i trong `member_memberships`.
- PT chá»‰ xem khÃ¡ch Ä‘Æ°á»£c phÃ¢n cÃ´ng.
- MEMBER chá»‰ xem dá»¯ liá»‡u cá»§a mÃ¬nh.
- BÃ¡o cÃ¡o tÃ i chÃ­nh sinh tá»« transaction, khÃ´ng nháº­p tay báº£ng tá»•ng.

## 18. Káº¿t luáº­n

Thiáº¿t káº¿ nÃ y lÃ  báº£n tá»‘i Æ°u tá»‘i thiá»ƒu nhÆ°ng Ä‘á»§ Ã½ nghÄ©a nghiá»‡p vá»¥:

- KhÃ´ng quÃ¡ nhiá»u báº£ng dÆ°.
- KhÃ´ng lÆ°á»£c bá» PT tracking, body measurement, check-in, thÆ° viá»‡n bÃ i táº­p/video TikTok public vÃ  finance.
- Giá»¯ Ä‘Ãºng cÃ¡c nhu cáº§u chá»§ phÃ²ng Ä‘ang lÃ m báº±ng Excel/phiáº¿u giáº¥y.
- CÃ³ thá»ƒ triá»ƒn khai MVP theo tá»«ng sprint.
- CÃ³ Ä‘Æ°á»ng má»Ÿ rá»™ng sang payroll, import Excel vÃ  AI sau nÃ y.

## 19. Cập nhật theo implementation hiện tại

Tài liệu chốt hiện trạng sau nâng cấp UI nằm tại `plans/active/10-current-implementation-alignment.md`.

Các điều chỉnh database/entity so với thiết kế sơ khai:

- Giữ mô hình `users`, `roles`, `user_roles`; role hiện hành chỉ gồm `OWNER`, `PT`, `MEMBER`.
- Không còn role/table riêng cho `STAFF`.
- Không dùng bảng `training_programs` và `training_program_weeks` trong scope hiện tại.
- Không dùng bảng `exercise_media`; mỗi `exercises` lưu trực tiếp thông tin video TikTok cần thiết.
- Không dùng `member_notes` trong implementation hiện tại; ghi chú chính nằm ở member/membership/payment/session theo từng nghiệp vụ.
- Không dùng entity `notifications` riêng; nhắc việc hiện tại được tính động từ hạn gói, công nợ và sinh nhật.
- Không dùng entity `audit_logs` riêng trong scope hiện tại; nếu cần audit đầy đủ sẽ mở lại ở phase hardening.
- `system_settings` được dùng cho cấu hình VietQR và các cấu hình hệ thống nhỏ.
- `business_goals` vẫn thuộc scope hiện tại để quản lý mục tiêu tháng.
- `body_measurements` và `pt_goals` là nguồn dữ liệu cho portal hội viên và theo dõi khách PT.

Danh sách entity hiện tại cần xem là nguồn chính:

- `User`, `Role`.
- `Member`.
- `MembershipPlan`, `MemberMembership`.
- `Payment`, `DebtRecord`, `FinancialCategory`, `FinancialTransaction`.
- `PtProfile`, `PtAssignment`, `PtSchedule`, `PtSessionPackage`, `PtSessionLog`, `MemberActivityLog`.
- `BodyMeasurement`, `PtGoal`.
- `ExerciseCategory`, `Exercise`.
- `BusinessGoal`, `SystemSetting`.

