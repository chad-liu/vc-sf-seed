tag 申請作業



1\. sf\_apply 的增加、修改

&#x20; 如果  sf\_apply 沒有 schoolno 的資料，自動新增1筆

&#x20;  sf\_apply.schoolno = sf\_school.schoolno

&#x20; sf\_apply.school= sf\_school.school



編修  sf\_apply 資料的功能



school (學校簡稱) : read only

classtype (開班類別) : 用下拉選擇 ( -/運動類/音樂類/美術類/舞蹈戲劇類/知識科學類/語文類/其他)

purpose (申請目的) : placeolder "(50字以內)"

content (課程內容) : placeolder "(例如棒球、攝影)"

activetime(活動時段)

ActiveObj(參加對象)

ObjNum(受惠總人數)

WeakNum(其中弱勢學生人數)

teacher(指導老師)

remark(備註)  : placeolder "(第2個以上班別，請在此註明"00類00班/社/隊)"



2, 授課規劃-檔案上傳

&#x20;          <ol>

&#x20;              <li>請說明貴校種子學堂預計規劃哪些課程，如何進行。</li>

&#x20;              <li>沒有一定的格式，頁數不限 。</li>

&#x20;              <li>3完成後請存成 pdf檔，上傳後，本系統會依據貴校編號自動更改檔名。</li>

&#x20;              <li>如果要修改內容，只要重新上傳正確的檔案，新的檔案就會自動覆蓋舊的檔案。 </li>

&#x20;          </ol>

&#x20; 上傳 pdf 到Bucket sf\_plan\_pdf ，檔案路徑 存到 sf\_apply.plan\_path



3, 經費預算

&#x20; 用 sf\_apply\_detail 做成 grid ,  可以編修和刪除

&#x20;    費用類別下拉選單  ( 1.授課鐘點費/2.材料費/3.交通費/4.其他)

&#x20;     新增按鈕，按了後 sf\_apply\_detail 新增一筆資料, 

&#x20;  sf\_apply\_detail.schoolno = sf\_school.schoolno

&#x20;  sf\_apply\_detail.school= sf\_school.school

&#x20;   feetype 為 費用類別下拉選單 所選資料

&#x20;       item (項目)

&#x20;       unitprice (單價)

&#x20;       amount (數量)

&#x20;       unit(單位)

&#x20;      totalprice(小計) = unitprice \* amount

&#x20;      description(說明)   placeholder "50字內"



&#x20;      grid  footer 有合計 = sum(totalprice)

















