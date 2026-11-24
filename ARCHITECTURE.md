CivicPulse — Smart City Infrastructure Management Platform

সংস্করণ: স্ট্যাক: Next.js (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL

সূচিপত্র
প্রজেক্টের সারসংক্ষেপ ও মূল লক্ষ্য
ওয়ার্কফ্লো, ক্যাটাগরি ও ডিপার্টমেন্ট ম্যাপিং
আর্কিটেকচার লেয়ার ও কোডিং নিয়মাবলি
ডিজাইন গাইডলাইন (Signal City v1.0)
ডেটাবেস ডিজাইন
ফোল্ডার স্ট্রাকচার
এনভায়রনমেন্ট ভেরিয়েবল
API কোয়েরি কনভেনশন
নোটিফিকেশন ও রিমাইন্ডার
ধাপে ধাপে কাজের প্ল্যান (১৭ ধাপ)
সাবমিশন চেকলিস্ট
১. প্রজেক্টের সারসংক্ষেপ ও মূল লক্ষ্য

CivicPulse একটি প্রোডাকশন-মানের স্মার্ট সিটি ইনফ্রাস্ট্রাকচার ম্যানেজমেন্ট প্ল্যাটফর্ম। নাগরিকেরা রাস্তাঘাট, স্ট্রিটলাইট, ড্রেনেজ, ফুটপাত, বর্জ্য ব্যবস্থাপনা ও পাবলিক ইনফ্রাস্ট্রাকচারের সমস্যা রিপোর্ট করেন। ডিপার্টমেন্ট ম্যানেজার, মেইনটেন্যান্স স্টাফ ও অ্যাডমিন সেগুলো যাচাই (Verify), অ্যাসাইন (Assign), মনিটর ও সমাধান করেন।

১.১ ইউজার রোল ও দায়িত্ব
রোল কোড মূল দায়িত্ব
Citizen CITIZEN রেজিস্ট্রেশন/লগইন, ছবি ও GPS/ম্যাপ লোকেশনসহ ইস্যু জমা, নিজের রিপোর্টের স্ট্যাটাস ও আপডেট ট্র্যাক, সমাধানের পর ফিডব্যাক/রেটিং
Department Manager MANAGER নিজ বিভাগের রিপোর্ট দেখা, ভেরিফাই, প্রায়োরিটি নির্ধারণ, স্টাফকে টাস্ক অ্যাসাইন, কাজ তদারকি, সম্পন্ন কাজ রিভিউ করে অনুমোদন/ফেরত, টিমের ওয়ার্কলোড ম্যানেজ
Maintenance Staff STAFF অ্যাসাইন করা ওয়ার্ক অর্ডার দেখা, লোকেশন ও ইস্যুর বিস্তারিত দেখা, প্রোগ্রেস/নোট যুক্ত করা, কমপ্লিশন ফটো আপলোড, টাস্ক সম্পন্ন মার্ক করা
Admin ADMIN ইউজার ও ডিপার্টমেন্ট তৈরি/আপডেট/ডিঅ্যাক্টিভেট, ডিপার্টমেন্ট ম্যানেজার নিয়োগ, সব ইস্যু মনিটরিং, অ্যানালিটিক্স ও SLA রিপোর্ট, সিস্টেম কনফিগারেশন (SLA সময়, ডুপ্লিকেট রেডিয়াস, ডিসপ্যাচ নীতি)
১.২ ন্যূনতম সিড ডেটা

হার্ডকোডেড মক ডেটা ছাড়া সব ডেটা DB থেকে আসবে।

৪টি রোল (ADMIN, MANAGER, STAFF, CITIZEN)
৫টি মিউনিসিপ্যাল ডিপার্টমেন্ট
২০+ Maintenance Staff
৩০টি বাস্তব লোকেশন (latitude, longitude, address, area/ward সহ)
১০০+ ইস্যু (যেমন ১০৮টি) এবং সংশ্লিষ্ট হিস্ট্রি, টাস্ক ও ফিডব্যাক
ইস্যুর ছবির জন্য placeholder URL (public/images/seed/\*), যাতে Cloudinary ছাড়াও ডেমো চলে
২. ওয়ার্কফ্লো, ক্যাটাগরি ও ডিপার্টমেন্ট ম্যাপিং
২.১ ইস্যু স্ট্যাটাস লাইফসাইকেল
text
SUBMITTED → UNDER_REVIEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED

প্রতিটি স্ট্যাটাস পরিবর্তনে IssueHistory-তে সংরক্ষিত হবে: কে পরিবর্তন করেছেন, কী বদলেছে (from → to), নোট এবং কখন।

২.২ ট্রানজিশন ও অনুমতি (src/server/workflow/transitions.ts)
থেকে → পর্যন্ত অনুমোদিত রোল শর্ত / নোট
SUBMITTED → UNDER_REVIEW MANAGER (নিজ ডিপার্টমেন্ট), ADMIN ভেরিফাই অ্যাকশন; ইস্যু অটো-রাউটেড ডিপার্টমেন্টে থাকবে
UNDER_REVIEW → ASSIGNED MANAGER, ADMIN প্রায়োরিটি সেট ও স্টাফ অ্যাসাইন বাধ্যতামূলক; Task তৈরি হবে
ASSIGNED → IN_PROGRESS STAFF (শুধু নিজের টাস্ক), MANAGER স্টাফ কাজ শুরু করলে
IN_PROGRESS → RESOLVED MANAGER, ADMIN স্টাফ টাস্ক COMPLETED করার পর ম্যানেজার রিভিউ করে অনুমোদন দিলে। অননুমোদিত হলে নোটসহ IN_PROGRESS-এ ফেরত যায়
RESOLVED → CLOSED MANAGER, ADMIN নাগরিকের ফিডব্যাক জমা পড়লে বা SLA অনুযায়ী অটো-ক্লোজ
SUBMITTED / UNDER_REVIEW → CLOSED MANAGER, ADMIN বাতিল/অবৈধ বা ডুপ্লিকেট রিপোর্ট; কারণ বাধ্যতামূলক

Citizen কখনোই স্ট্যাটাস বদলাতে পারবে না। সব ট্রানজিশন সার্ভারে transitions.ts ম্যাট্রিক্স ও permissions/\* দিয়ে যাচাই হবে।

২.৩ ক্যাটাগরি ও প্রায়োরিটি
ক্যাটাগরি: Road Damage, Streetlight, Drainage, Footpath, Waste Management, Public Infrastructure
প্রায়োরিটি: LOW, MEDIUM, HIGH, CRITICAL
২.৪ ক্যাটাগরি → ডিপার্টমেন্ট ম্যাপিং (অটো-রাউটিং)

নাগরিক শুধু ক্যাটাগরি বেছে নেন। ইস্যু জমা হলে সার্ভার src/shared/constants/categories.ts-এর ম্যাপ অনুযায়ী ডিপার্টমেন্ট নির্ধারণ করে Issue.departmentId সেট করে। ফলে ম্যানেজার শুধু নিজের ডিপার্টমেন্টের ইস্যু দেখতে পান। ম্যানেজার/অ্যাডমিন চাইলে পরে ডিপার্টমেন্ট পরিবর্তন (রি-অ্যাসাইন) করতে পারবেন।

ক্যাটাগরি ডিফল্ট ডিপার্টমেন্ট
Road Damage Roads & Highways
Footpath Roads & Highways
Streetlight Electricity & Lighting
Drainage Water & Sewage
Waste Management Waste Management
Public Infrastructure Parks & Public Spaces
২.৫ ডুপ্লিকেট ডিটেকশন নীতি
ইস্যু জমার আগে ফর্মে GET /api/issues/nearby দিয়ে একই ক্যাটাগরির কাছাকাছি (কনফিগারেবল রেডিয়াস, ডিফল্ট ৫০ মি.) সক্রিয় ইস্যু দেখিয়ে DuplicateWarning দেখানো হবে।
সতর্কতা শুধু পরামর্শমূলক, সাবমিশন ব্লক করবে না। নাগরিক "তবুও জমা দিন" বেছে নিতে পারবেন।
POST /api/issues-এ সম্ভাব্য ডুপ্লিকেট পেলে ইস্যুতে duplicateOfId সেট হবে এবং ম্যানেজার ট্রায়াজ কিউতে "Possible Duplicate" ব্যাজ দেখবেন।
৩. আর্কিটেকচার লেয়ার ও কোডিং নিয়মাবলি

আপনি ও এজেন্ট উভয়েই এই নিয়মগুলো মানবেন, যাতে কোড পরিষ্কার, সিকিউর ও মেইনটেইনেবল থাকে।

Routing & Layout (src/app/**/page.tsx, layout.tsx): শুধু রাউটিং, ডেটা ফেচিং/ক্লায়েন্ট পেজ রেন্ডারিং ও লেআউট কম্পোজিশন। ভারী বিজনেস লজিক নয়।
Thin API Routes (src/app/api/**): শুধু Zod ইনপুট ভ্যালিডেশন, সেশন/পারমিশন চেক এবং src/server/services/_ বা src/server/workflow/_ কল।
Backend Services & Workflow (src/server/services/_, src/server/workflow/_): মূল বিজনেস লজিক, Prisma transaction, নোটিফিকেশন ও অ্যাক্টিভিটি লগ।
Server-Side RBAC (src/server/permissions/_): সব গুরুত্বপূর্ণ অ্যাকশন সার্ভারে যাচাই:
Citizen → শুধু নিজের রিপোর্ট
Staff → শুধু নিজের টাস্ক
Manager → শুধু নিজের ডিপার্টমেন্টের ইস্যু
Admin → পূর্ণ নিয়ন্ত্রণ
Shared Code (src/shared/_): Client ও Server উভয়ের জন্য কমন Zod schemas, TypeScript types ও constants (roles, status, categories, priorities, routes)।
Leaflet Map ও SSR: Map কম্পোনেন্ট সবসময় next/dynamic দিয়ে { ssr: false } অবস্থায় লোড হবে।
State & Quality: কোনো TODO বা অসম্পূর্ণ placeholder নয়। সব ড্যাশবোর্ড/লিস্ট/ফর্ম পেজে Loading, Error, Empty ও Success স্টেট থাকবে।
ডেটা ইন্টেগ্রিটি: GPS (lat ∈ [−90, 90], lng ∈ [−180, 180]) ও আপলোড করা ছবি (টাইপ, সাইজ) সার্ভারে ভ্যালিডেট হবে। IssueHistory কখনো মুছে বা বদলানো যাবে না।
৪. ডিজাইন গাইডলাইন ("Signal City v1.0")
৪.১ কালার প্যালেট
ব্যবহার রং হেক্স
সাইডবার, টপ হিরো ব্যানার, ডার্ক অ্যাকসেন্ট Dark Navy #111C33
লাইট মোড ব্যাকগ্রাউন্ড ও কার্ড Warm Cream / White #F7F5EE / #FFFFFF
ডার্ক মোড ব্যাকগ্রাউন্ড Deep Night #0B1120
মূল CTA বাটন ও অ্যাক্টিভ সাইডবার হাইলাইট Gold / Yellow #FACC15
সেভ/সাবমিট বাটন, অ্যাক্টিভ ফিল্টার/ট্যাব, চার্ট অ্যাকসেন্ট Royal Blue #2563EB
৪.২ ড্যাশবোর্ড শেল
বামে: কোল্যাপ্সিবল Dark Navy সাইডবার (লোগো, অ্যাক্টিভ রোল কার্ড, রোল-ভিত্তিক মেনু, নিচে DB স্ট্যাটাস)
ওপরে: টপবার (পেজ টাইটেল, রোল পিল, Demo Account Switcher, নোটিফিকেশন বেল, লাইট/ডার্ক থিম টগল, ইউজার অ্যাভাটার)

Demo Account Switcher: এটি রোল বদলানোর ফিচার নয়। প্রতিটি ইউজারের রোল একটাই। শুধু ডেমো পরিবেশে (NEXT_PUBLIC_DEMO_MODE=true) বর্তমান সেশন শেষ করে নির্বাচিত ডেমো অ্যাকাউন্টে নতুন করে লগইন করায়। প্রোডাকশনে বন্ধ থাকবে।

৫. ডেটাবেস ডিজাইন
৫.১ মডেল তালিকা

User, Department, Location, Issue, Task, TaskUpdate, IssueHistory, Feedback, Notification, SystemConfig

৫.২ মূল সম্পর্ক
text
Department 1 ──< User (MANAGER / STAFF) Department.managerId → User
Department 1 ──< Issue
Location 1 ──< Issue (area/ward ভিত্তিক বিতরণের জন্য)
User 1 ──< Issue (reporter)
Issue 1 ──< Task ──< TaskUpdate Task.assigneeId → User (STAFF)
Issue 1 ──< IssueHistory (append-only অডিট ট্রেল)
Issue 1 ── 0..1 Feedback (রিপোর্টার দেবেন)
User 1 ──< Notification
Issue 0..1 ── duplicateOfId → Issue
৫.৩ গুরুত্বপূর্ণ ফিল্ড
Issue: title, description, category, priority, status, imageUrls[], address, latitude, longitude, locationId?, departmentId, reporterId, duplicateOfId?, verifiedById?, verifiedAt?, resolvedAt?, createdAt
Location: name, area/ward, address, latitude, longitude
Task: issueId, assigneeId, assignedById, status (PENDING, IN_PROGRESS, COMPLETED, REJECTED), dueAt, completionPhotoUrls[], reviewNote?
IssueHistory: issueId, actorId, fromStatus?, toStatus, note?, createdAt
SystemConfig: SLA ঘণ্টা (প্রায়োরিটি অনুযায়ী), ডুপ্লিকেট রেডিয়াস, ডিসপ্যাচ নীতি, রিমাইন্ডার ব্যবধান
৫.৪ ইনডেক্স (পারফরম্যান্স)

Issue(status, departmentId), Issue(category), Issue(createdAt), Issue(latitude, longitude), Task(assigneeId, status), Notification(userId, readAt)

৬. ফোল্ডার স্ট্রাকচার
text
civicpulse/
├── prisma/
│ ├── schema.prisma # User, Department, Location, Issue, Task, TaskUpdate, IssueHistory, Feedback, Notification, SystemConfig
│ ├── seed.ts # মাস্টার seed রানার
│ └── seed-data/
│ ├── departments.ts # ৫টি ডিপার্টমেন্ট (Roads & Highways, Electricity & Lighting, Water & Sewage, Waste Management, Parks & Public Spaces)
│ ├── locations.ts # ঢাকার ৩০টি বাস্তব লোকেশন (lat, lng, address, area সহ)
│ ├── users.ts # Admin, Manager, ২০+ Staff, Citizens (ডেমো অ্যাকাউন্টসহ)
│ └── issues.ts # ১০০+ ইস্যু, হিস্ট্রি, টাস্ক ও ফিডব্যাক জেনারেটর
│
├── public/
│ ├── images/
│ │ └── seed/ # সিড ইস্যুর placeholder ছবি
│ ├── uploads/ # Cloudinary না থাকলে লোকাল স্টোরেজ fallback (gitignored)
│ └── markers/ # ৬টি ক্যাটাগরির কাস্টম ম্যাপ মার্কার
│
├── src/
│ ├── middleware.ts # রোল অনুযায়ী রুট প্রোটেকশন ও রিডাইরেক্ট
│ │
│ ├── app/ # 🟨 শুধু রাউটিং ও লেআউট
│ │ ├── layout.tsx # Root Layout (Fonts, ThemeProvider, SessionProvider, QueryProvider)
│ │ ├── globals.css
│ │ ├── not-found.tsx
│ │ ├── error.tsx
│ │ │
│ │ ├── (public)/
│ │ │ ├── layout.tsx # Navbar + {children} + Footer
│ │ │ ├── page.tsx # ল্যান্ডিং পেজ (HeroBanner + ৯টি সেকশন)
│ │ │ ├── login/page.tsx # লগইন + ৪ রোলের Demo One-Click Login
│ │ │ └── register/page.tsx # সিটিজেন রেজিস্ট্রেশন
│ │ │
│ │ ├── (dashboard)/
│ │ │ ├── layout.tsx # রোল-ভিত্তিক Sidebar + Topbar
│ │ │ ├── loading.tsx
│ │ │ │
│ │ │ ├── citizen/
│ │ │ │ ├── page.tsx # Overview (Stats, Recent Reports, City Incident Radar)
│ │ │ │ └── issues/
│ │ │ │ ├── page.tsx # My Reports (All/Active/Resolved ট্যাব, সার্চ, ফিল্টার)
│ │ │ │ └── new/page.tsx # Report Issue (ফর্ম + Drag-and-Drop ইমেজ + GPS/Map Pinpoint)
│ │ │ │
│ │ │ ├── manager/
│ │ │ │ ├── page.tsx # Triage Overview (Pending Triage, Active Work Orders, SLA, Unassigned Queue)
│ │ │ │ ├── issues/page.tsx # Department Triage Queue (টেবিল, ফিল্টার, Export CSV)
│ │ │ │ ├── reviews/page.tsx # সম্পন্ন কাজের রিভিউ কিউ (অনুমোদন / ফেরত)
│ │ │ │ └── team/page.tsx # Field Crew Roster & Workload
│ │ │ │
│ │ │ ├── staff/
│ │ │ │ ├── page.tsx # My Work Orders (টাস্ক লিস্ট ও স্ট্যাটাস ফিল্টার)
│ │ │ │ └── tasks/[id]/page.tsx # Work Order Details (ম্যাপ, প্রোগ্রেস, Completion Photo)
│ │ │ │
│ │ │ ├── admin/
│ │ │ │ ├── page.tsx # City Overview (Total Incidents, SLA Rate, Critical Incidents)
│ │ │ │ ├── analytics/page.tsx # Executive BI Analytics (Recharts)
│ │ │ │ ├── departments/page.tsx # Department Management + ম্যানেজার নিয়োগ
│ │ │ │ ├── users/page.tsx # User Directory & Permissions
│ │ │ │ └── system/page.tsx # SLA, Proximity Radius, Dispatch, Reminder কনফিগ
│ │ │ │
│ │ │ ├── issues/[id]/page.tsx # Issue Details (সব রোলের জন্য, টাইমলাইন, অ্যাকশন, ফিডব্যাক, PDF)
│ │ │ ├── map/page.tsx # ফুল-স্ক্রিন Interactive Map + Heatmap টগল
│ │ │ ├── notifications/page.tsx
│ │ │ └── settings/page.tsx # Profile (Personal Info + Password Security)
│ │ │
│ │ └── api/ # 🟧 পাতলা API Routes
│ │ ├── auth/
│ │ │ ├── [...nextauth]/route.ts
│ │ │ └── register/route.ts
│ │ ├── issues/
│ │ │ ├── route.ts # GET (ফিল্টার/সর্ট/পেজিনেশন), POST (নতুন ইস্যু + অটো-রাউটিং + ডুপ্লিকেট ফ্ল্যাগ)
│ │ │ ├── nearby/route.ts # GET (GPS radius অনুযায়ী কাছাকাছি ইস্যু)
│ │ │ └── [id]/
│ │ │ ├── route.ts # GET, PATCH, DELETE
│ │ │ ├── status/route.ts # POST (ট্রানজিশন ম্যাট্রিক্স অনুযায়ী)
│ │ │ ├── assign/route.ts # POST (ডিপার্টমেন্ট ও স্টাফ অ্যাসাইন)
│ │ │ ├── verify/route.ts # POST (ভেরিফাই)
│ │ │ ├── priority/route.ts # PATCH (LOW … CRITICAL)
│ │ │ └── history/route.ts # GET (অডিট ট্রেল)
│ │ ├── tasks/
│ │ │ ├── route.ts # GET স্টাফের টাস্ক
│ │ │ └── [id]/
│ │ │ ├── route.ts # GET, PATCH (স্ট্যাটাস/কমপ্লিশন)
│ │ │ ├── review/route.ts # POST ম্যানেজারের অনুমোদন/ফেরত
│ │ │ └── updates/route.ts # POST অগ্রগতি ও ছবি
│ │ ├── departments/
│ │ │ ├── route.ts # GET, POST
│ │ │ └── [id]/route.ts # PATCH (নাম, ম্যানেজার নিয়োগ, অ্যাক্টিভ/ডিঅ্যাক্টিভ), DELETE
│ │ ├── users/
│ │ │ ├── route.ts # GET, POST
│ │ │ ├── me/route.ts # GET, PATCH প্রোফাইল ও পাসওয়ার্ড
│ │ │ └── [id]/route.ts # PATCH রোল/ডিপার্টমেন্ট/স্ট্যাটাস
│ │ ├── locations/route.ts # GET (area-wise ফিল্টার ও বিতরণ)
│ │ ├── settings/route.ts # GET, PATCH সিস্টেম কনফিগ
│ │ ├── feedback/route.ts # POST রেটিং ও রিভিউ
│ │ ├── notifications/
│ │ │ ├── route.ts # GET (পোলিং সাপোর্ট: ?since=)
│ │ │ └── [id]/read/route.ts
│ │ ├── cron/
│ │ │ └── reminders/route.ts # মেইনটেন্যান্স/SLA রিমাইন্ডার (Vercel Cron, CRON_SECRET সুরক্ষিত)
│ │ ├── upload/route.ts # ইমেজ আপলোড
│ │ ├── analytics/
│ │ │ ├── summary/route.ts
│ │ │ ├── trends/route.ts
│ │ │ ├── departments/route.ts
│ │ │ └── satisfaction/route.ts # বোনাস: সিটিজেন সন্তুষ্টি
│ │ └── export/
│ │ └── issues/[id]/pdf/route.ts # বোনাস: PDF রিপোর্ট
│ │
│ ├── client/ # 🟦 ফ্রন্টএন্ড UI ও স্টেট
│ │ ├── components/
│ │ │ ├── ui/ # shadcn/ui বেস
│ │ │ ├── layout/
│ │ │ │ ├── Navbar.tsx
│ │ │ │ ├── MobileMenu.tsx
│ │ │ │ ├── Footer.tsx # ৩-কলাম ফুটার
│ │ │ │ ├── Sidebar.tsx
│ │ │ │ ├── Topbar.tsx
│ │ │ │ ├── DemoAccountSwitcher.tsx # শুধু ডেমো মোডে
│ │ │ │ ├── NotificationBell.tsx
│ │ │ │ ├── ThemeToggle.tsx
│ │ │ │ └── PageHeader.tsx
│ │ │ ├── landing/ # HeroBanner + ৯টি সেকশন
│ │ │ │ ├── HeroBanner.tsx
│ │ │ │ ├── PlatformOverview.tsx
│ │ │ │ ├── CategoryGrid.tsx
│ │ │ │ ├── HowItWorks.tsx
│ │ │ │ ├── CityRadarPreview.tsx
│ │ │ │ ├── RoleEcosystem.tsx
│ │ │ │ ├── StatusTimelineDemo.tsx
│ │ │ │ ├── ExecutiveInsights.tsx
│ │ │ │ ├── ComparisonTable.tsx # প্রচলিত ম্যানুয়াল রিপোর্টিং বনাম CivicPulse
│ │ │ │ └── CallToAction.tsx
│ │ │ ├── auth/
│ │ │ │ ├── LoginForm.tsx
│ │ │ │ └── RegisterForm.tsx
│ │ │ ├── issues/
│ │ │ │ ├── IssueForm.tsx
│ │ │ │ ├── IssueCard.tsx
│ │ │ │ ├── IssueTable.tsx
│ │ │ │ ├── IssueFilters.tsx
│ │ │ │ ├── IssueDetailView.tsx
│ │ │ │ ├── StatusBadge.tsx
│ │ │ │ ├── PriorityBadge.tsx
│ │ │ │ ├── StatusTimeline.tsx
│ │ │ │ ├── StatusUpdateDialog.tsx
│ │ │ │ ├── AssignTaskDialog.tsx
│ │ │ │ ├── DuplicateWarning.tsx
│ │ │ │ └── FeedbackForm.tsx
│ │ │ ├── tasks/
│ │ │ │ ├── TaskCard.tsx
│ │ │ │ ├── TaskTable.tsx
│ │ │ │ ├── TaskUpdateForm.tsx
│ │ │ │ ├── TaskReviewDialog.tsx # ম্যানেজারের অনুমোদন/ফেরত
│ │ │ │ └── WorkloadCard.tsx
│ │ │ ├── map/
│ │ │ │ ├── IssueMap.tsx # Leaflet (ssr: false)
│ │ │ │ ├── LocationPicker.tsx
│ │ │ │ ├── CategoryMarker.tsx
│ │ │ │ ├── HeatLayer.tsx # বোনাস
│ │ │ │ └── MapFilters.tsx
│ │ │ ├── charts/
│ │ │ │ ├── MonthlyTrendChart.tsx
│ │ │ │ ├── CategoryPieChart.tsx
│ │ │ │ ├── DepartmentBarChart.tsx
│ │ │ │ ├── ResolutionTimeChart.tsx
│ │ │ │ ├── SatisfactionChart.tsx
│ │ │ │ └── StatCard.tsx
│ │ │ ├── users/
│ │ │ │ ├── UserTable.tsx
│ │ │ │ ├── UserFormDialog.tsx
│ │ │ │ └── ProfileForm.tsx
│ │ │ ├── departments/
│ │ │ │ ├── DepartmentTable.tsx
│ │ │ │ └── DepartmentFormDialog.tsx
│ │ │ └── common/
│ │ │ ├── ImageUpload.tsx
│ │ │ ├── Pagination.tsx
│ │ │ ├── SearchInput.tsx
│ │ │ ├── DateRangePicker.tsx
│ │ │ ├── LoadingState.tsx
│ │ │ ├── ErrorState.tsx
│ │ │ ├── EmptyState.tsx
│ │ │ ├── SuccessState.tsx
│ │ │ └── ConfirmDialog.tsx
│ │ ├── hooks/
│ │ │ ├── useDebounce.ts
│ │ │ ├── useIssues.ts
│ │ │ ├── useTasks.ts
│ │ │ ├── useNotifications.ts # পোলিং ভিত্তিক near-real-time
│ │ │ ├── useGeolocation.ts
│ │ │ └── useAnalytics.ts
│ │ ├── lib/
│ │ │ ├── api-client.ts
│ │ │ ├── formatters.ts
│ │ │ ├── cn.ts
│ │ │ └── map-utils.ts
│ │ └── providers/
│ │ ├── SessionProvider.tsx
│ │ ├── QueryProvider.tsx
│ │ ├── ThemeProvider.tsx
│ │ └── ToastProvider.tsx
│ │
│ ├── server/ # 🟥 ব্যাকএন্ড লজিক ও সিকিউরিটি
│ │ ├── db/prisma.ts
│ │ ├── auth/
│ │ │ ├── auth.config.ts
│ │ │ ├── session.ts
│ │ │ └── password.ts
│ │ ├── permissions/
│ │ │ ├── index.ts
│ │ │ ├── issue.permissions.ts
│ │ │ ├── task.permissions.ts
│ │ │ └── guards.ts
│ │ ├── services/
│ │ │ ├── auth.service.ts
│ │ │ ├── issue.service.ts
│ │ │ ├── task.service.ts
│ │ │ ├── user.service.ts
│ │ │ ├── department.service.ts
│ │ │ ├── location.service.ts
│ │ │ ├── settings.service.ts
│ │ │ ├── feedback.service.ts
│ │ │ ├── analytics.service.ts
│ │ │ ├── notification.service.ts
│ │ │ ├── reminder.service.ts
│ │ │ ├── activity.service.ts
│ │ │ └── upload.service.ts
│ │ ├── workflow/
│ │ │ ├── transitions.ts # ট্রানজিশন ম্যাট্রিক্স (২.২ অনুযায়ী)
│ │ │ └── issue-workflow.ts # Prisma $transaction সহ স্ট্যাটাস পরিবর্তন
│ │ ├── utils/
│ │ │ ├── geo.ts # Haversine ও bounding box
│ │ │ ├── duplicate.ts # ডুপ্লিকেট ডিটেকশন (শুধু ফ্ল্যাগ, ব্লক নয়)
│ │ │ ├── pagination.ts
│ │ │ ├── query-parser.ts # page, limit, q, status, priority, category, from, to, sort
│ │ │ └── errors.ts
│ │ └── storage/
│ │ ├── index.ts # Cloudinary অথবা লোকাল fallback
│ │ └── image-validator.ts
│ │
│ └── shared/ # 🟩 Client + Server শেয়ার্ড
│ ├── validators/
│ │ ├── auth.schema.ts
│ │ ├── issue.schema.ts
│ │ ├── task.schema.ts
│ │ ├── user.schema.ts
│ │ ├── department.schema.ts
│ │ ├── settings.schema.ts
│ │ ├── feedback.schema.ts
│ │ └── common.schema.ts
│ ├── types/
│ │ ├── api.ts
│ │ ├── issue.ts
│ │ ├── user.ts
│ │ └── next-auth.d.ts
│ └── constants/
│ ├── roles.ts # ADMIN, MANAGER, STAFF, CITIZEN
│ ├── status.ts # SUBMITTED … CLOSED
│ ├── categories.ts # ৬টি ক্যাটাগরি + ক্যাটাগরি→ডিপার্টমেন্ট ম্যাপ
│ ├── priorities.ts # LOW, MEDIUM, HIGH, CRITICAL
│ └── routes.ts
│
├── docs/
│ ├── API.md # এন্ডপয়েন্ট, কোয়েরি প্যারামিটার, রোল পারমিশন
│ ├── DATABASE.md
│ └── ER-diagram.png
├── .env.example
├── .gitignore
├── components.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json # Cron schedule (রিমাইন্ডার)
├── package.json
└── README.md # সেটআপ, ডেমো ক্রেডেনশিয়াল, লাইভ লিংক
৭. এনভায়রনমেন্ট ভেরিয়েবল

.env ও .env.example-এ নিচের ভেরিয়েবল থাকবে (.env কখনো কমিট করা যাবে না):

env

# Database (PostgreSQL / Neon)

DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/civicpulse?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/civicpulse?sslmode=require"

# Authentication (Auth.js / NextAuth)

AUTH_SECRET="replace-with-a-strong-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Image / File Storage (ফাঁকা রাখলে লোকাল fallback চালু হবে)

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# App & Default Map Coordinates

NEXT_PUBLIC_APP_NAME="CivicPulse"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LAT="23.8103"
NEXT_PUBLIC_DEFAULT_LNG="90.4125"

# Demo Mode (প্রোডাকশন ডেমো সাইটে true; আসল প্রোডাকশনে false)

NEXT_PUBLIC_DEMO_MODE="true"

# Cron (রিমাইন্ডার এন্ডপয়েন্ট সুরক্ষা)

CRON_SECRET="replace-with-a-random-string"

# Seed User Default Password

SEED_DEFAULT_PASSWORD="Password123!"
৮. API কোয়েরি কনভেনশন

GET /api/issues এবং অনুরূপ লিস্ট এন্ডপয়েন্ট একই প্যারামিটার মানবে (Zod দিয়ে ভ্যালিডেট, সার্ভার-সাইড পেজিনেশন):

প্যারামিটার বিবরণ উদাহরণ
page, limit পেজিনেশন (সর্বোচ্চ limit=50) page=2&limit=20
q সার্চ (শিরোনাম/ঠিকানা), ক্লায়েন্টে debounce q=pothole
status, priority, category ফিল্টার status=ASSIGNED&priority=HIGH
departmentId, locationId ডিপার্টমেন্ট/এলাকা ফিল্টার locationId=...
from, to তারিখ পরিসীমা (ISO) from=2026-01-01&to=2026-03-31
sort সর্ট ফিল্ড ও দিক sort=createdAt:desc

রোল অনুযায়ী ডেটা সীমা সার্ভারে প্রয়োগ হবে (Citizen → নিজের, Manager → নিজ ডিপার্টমেন্ট, Staff → নিজের টাস্কের ইস্যু)।

৯. নোটিফিকেশন ও রিমাইন্ডার
ইন-অ্যাপ নোটিফিকেশন: স্ট্যাটাস পরিবর্তন, অ্যাসাইনমেন্ট, রিভিউ ফলাফল ও ফিডব্যাকে notification.service.ts রেকর্ড তৈরি করে।
Near-real-time: useNotifications প্রতি ~১৫–৩০ সেকেন্ডে GET /api/notifications?since= পোল করে (সহজ ও Vercel-বান্ধব; চাইলে পরে SSE/WebSocket)।
অটোমেটেড রিমাইন্ডার (বোনাস): vercel.json-এর Cron GET /api/cron/reminders চালায় (Authorization: Bearer CRON_SECRET বাধ্যতামূলক)। SLA সীমা পেরোনো বা dueAt কাছাকাছি টাস্কের জন্য স্টাফ ও ম্যানেজারকে নোটিফিকেশন যায়।
১০. ধাপে ধাপে কাজের প্ল্যান (১৭ ধাপ)

প্রতিটি ধাপ শেষে "যাচাই" পূরণ না হলে পরের ধাপে যাওয়া যাবে না।

ধাপ ১ — ফোল্ডার স্ট্রাকচার ও প্যাকেজ সেটআপ

ফোল্ডার তৈরি, প্রয়োজনীয় প্যাকেজ ইনস্টল ও .env.example তৈরি। যাচাই: ফোল্ডার ও package.json ঠিক আছে।

ধাপ ২ — Prisma Schema ও Seed Data

schema.prisma (Location মডেলসহ) এবং seed-data/\* + seed.ts লেখা: ৫ ডিপার্টমেন্ট, ৩০ লোকেশন, ৪ রোল, ২০+ স্টাফ, ১০০+ ইস্যু (ক্যাটাগরি→ডিপার্টমেন্ট ম্যাপ মেনে)। যাচাই: npx prisma generate নির্ভুলভাবে চলে।

ধাপ ৩ — DATABASE_URL সেটআপ ও Seed

.env-এ DATABASE_URL যোগ করে npx prisma db push ও npx prisma db seed চালানো।

নোট: db push শুধু লোকাল ডেভেলপমেন্টের জন্য। ডিপ্লয়মেন্টের আগে npx prisma migrate dev দিয়ে মাইগ্রেশন তৈরি করে প্রোডাকশনে npx prisma migrate deploy চালাতে হবে।

যাচাই: টেবিল তৈরি হয়েছে এবং ১০০+ ইস্যু লোড হয়েছে।

ধাপ ৪ — Shared Constants, Validators ও Types

src/shared/constants/_ (ক্যাটাগরি→ডিপার্টমেন্ট ম্যাপসহ), validators/_, types/\*। যাচাই: রোল, স্ট্যাটাস, ক্যাটাগরি ও সব ফর্মের Zod স্কিমা প্রস্তুত।

ধাপ ৫ — Auth.js, Middleware ও RBAC

prisma.ts, Auth.js config/routes, middleware.ts, src/server/permissions/\*। যাচাই: লগইন/রেজিস্ট্রেশন ও রোল-ভিত্তিক রুট সুরক্ষা কাজ করে।

ধাপ ৬ — Workflow Engine ও Geo/Duplicate Utils

workflow/\* (২.২-এর ট্রানজিশন ম্যাট্রিক্স + IssueHistory), geo.ts, duplicate.ts। যাচাই: ট্রানজ্যাকশনাল স্ট্যাটাস আপডেট চলে; অবৈধ ট্রানজিশন প্রত্যাখ্যাত হয়; কাছাকাছি/ডুপ্লিকেট চেক প্রস্তুত।

ধাপ ৭ — Backend Services ও API Routes

src/server/services/\* এবং src/app/api/\*\* (Issues, Tasks + review, Departments, Users, Locations, Settings, Feedback, Notifications, Cron, Upload, Analytics, PDF)। যাচাই: API রুট পাতলা; সব CRUD/অ্যাকশন সার্ভিসে যুক্ত; docs/API.md-র খসড়া তৈরি।

ধাপ ৮ — Public Layout ও Landing Page

(public)/layout.tsx, Navbar, MobileMenu, Footer এবং HeroBanner + ৯টি সেকশন। যাচাই: হোম পেজ সঠিক রেন্ডার হয় (ক্যাটাগরি, ওয়ার্কফ্লো, রোল সেকশনসহ)।

ধাপ ৯ — Login ও Register UI

/login (৪ রোলের Demo One-Click Login সহ) ও /register। যাচাই: চার রোলেই লগইন ও নতুন সিটিজেন রেজিস্ট্রেশন কাজ করে।

ধাপ ১০ — Dashboard Shell ও Profile Settings

(dashboard)/layout.tsx, Sidebar, Topbar, DemoAccountSwitcher, NotificationBell, ThemeToggle এবং /settings। যাচাই: রোল অনুযায়ী সাইডবার, ডার্ক/লাইট মোড, প্রোফাইল ও পাসওয়ার্ড আপডেট কাজ করে।

ধাপ ১১ — Citizen Portal

Overview, Report Issue (ইমেজ প্রিভিউ + GPS/Map Pinpoint + ডুপ্লিকেট সতর্কতা) ও My Reports। যাচাই: নাগরিক ইস্যু জমা দিতে ও নিজের রিপোর্ট ট্র্যাক করতে পারেন; ডুপ্লিকেট সতর্কতা জমা ব্লক করে না।

ধাপ ১২ — Manager Portal

Triage Overview, Department Queue (সার্চ, ফিল্টার, অ্যাসাইন, CSV Export), Reviews কিউ এবং Crew & Workload। যাচাই: ম্যানেজার ভেরিফাই, প্রায়োরিটি সেট, টাস্ক অ্যাসাইন এবং সম্পন্ন কাজ অনুমোদন/ফেরত দিতে পারেন।

ধাপ ১৩ — Staff Portal

My Work Orders ও Task Details (ম্যাপ, প্রোগ্রেস আপডেট, কমপ্লিশন ফটো, কমপ্লিট)। যাচাই: স্টাফ শুধু নিজের কাজ দেখে ও আপডেট করতে পারেন।

ধাপ ১৪ — Admin Portal

City Overview, Executive Analytics (Recharts), Departments CRUD (ম্যানেজার নিয়োগসহ), User Directory ও System Settings। যাচাই: সব পেজ, চার্ট ও কনফিগারেশন সেভ কাজ করে।

ধাপ ১৫ — Issue Details, Full Map, নোটিফিকেশন ও রিমাইন্ডার

শেয়ার্ড issues/[id] (টাইমলাইন, অ্যাকশন, ফিডব্যাক, PDF), /map (Heatmap সহ), /notifications, পোলিং ও cron/reminders। যাচাই: টাইমলাইন, ফিডব্যাক, PDF, ম্যাপ ফিল্টার ও নোটিফিকেশন পোলিং কাজ করে।

ধাপ ১৬ — টেস্টিং, ডকুমেন্টেশন ও ফাইনাল বিল্ড
RBAC যাচাই: প্রতিটি রোল দিয়ে অননুমোদিত API কল (যেমন Citizen দিয়ে স্ট্যাটাস বদল) ব্যর্থ হয় কি না
ওয়ার্কফ্লো ম্যাট্রিক্সের ইউনিট টেস্ট
docs/API.md, docs/DATABASE.md, ER ডায়াগ্রাম ও README.md (চার রোলের ডেমো ক্রেডেনশিয়ালসহ)
npm run lint ও npm run build

যাচাই: কোনো TypeScript/lint/build এরর নেই।

ধাপ ১৭ — ডিপ্লয়মেন্ট ও ডেমো যাচাই

Vercel (অ্যাপ) + Neon (PostgreSQL) এ ডিপ্লয়: এনভ ভেরিয়েবল সেট, prisma migrate deploy, প্রোডাকশন DB সিড, Cron সক্রিয়। যাচাই: লাইভ লিংকে চারটি ডেমো অ্যাকাউন্টে লগইন করে পূর্ণ ফ্লো (রিপোর্ট → ভেরিফাই → অ্যাসাইন → কাজ → রিভিউ → ফিডব্যাক → ক্লোজ) সফল।
