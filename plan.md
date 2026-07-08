## 製作「三花菁英總子學堂」網站
參考 D:\VC-SF-Story 網站的功能
### 技術棧
1. 前端：Next.js (React)
2. 後端：Next.js API Routes（內建，不需另外寫後端）
3. 資料庫：Supabase (PostgreSQL)
4. 版本控制：GitHub
5. 部署：Vercel（前端）+ Supabase（後端/DB）
### 功能
1. 學校登入
  1.1 下拉表 先選縣市，再連動選該縣市的學校簡稱，Supabase table 縣市-> city.city，學校簡稱 sf_school.school
  1.2 輸入密碼
  1.2 學校簡稱和密碼在sf_school符合則完成登入，密碼輸入錯誤用紅字顯示"密碼輸入錯誤"
2. 學校登入成功後有4三個tag
  tag 1 注意事項，sf_news.news，sf_news.valid=True
  tag 2 學校資料編輯，sf_school.school 的資料編輯，畫面參考 學校基本資料.png
  tag 3 申請作業，作業中先留空
  tag 4 上學期成果
  tag 5 下學期成果
3. github -> vc-sf-seed 

 


   
   

