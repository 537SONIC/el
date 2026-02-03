# SKILL｜HTML5 Slide Deck Generator (Bauhaus-first) v1.9

適用：把任何內容生成 HTML5 互動簡報（16:9、白片、粗邊框、RWD、導覽、PDF 匯出、可選互動題）
輸出：單一 HTML 檔（可直接用瀏覽器開啟；可離線；必要時可用 CDN）

---

## 0\. 版本更新重點（v1.9｜手機閱覽/輸入保底、Worksheet 表格改卡片、Print/PDF 不裁切、Overview 不累積監聽、狀態記憶、Box 文字不裁切）

本版基於 v1.8，並把第三次修正（手機框線內文字被裁切/看不到剩餘內容）一併寫成「硬性要求＋模板預設」。目標：未來用此技能輸出 HTML 時，不需要再回頭補 mobile fix。

1. 【硬規格】Auto Overflow State Machine（auto 不得被寫成 false）

   * `data-scroll="auto"`（或未設定）代表「可由 runtime 判斷是否開啟捲動」
   * auto 模式下：偵測到溢出才寫成 `true`；未溢出必須回寫成 `auto`（或移除屬性），不得回寫成 `false`
   * 理由：字體載入、螢幕尺寸、縮放、換頁顯示/隱藏都可能改變 `scrollHeight/clientHeight`；若把 auto 算出的 false 寫回去，後續 refresh 會被當成「強制關閉」而鎖死

2. 【硬規格】Navigation Refresh Contract（換頁後必 refresh）

   * 若非當前頁使用 `display:none`/hidden：初始載入量不到高度（`clientHeight=0`），必須在每次換頁後呼叫 `DeckOverflowFix.refresh(activeSlideFrame)`
   * Overview 模式（一次顯示多頁）切回單頁，也要 refresh 當前頁

3. 【模板修正】Cover Safe Alignment（封面不做垂直置中）

   * 封面 `.content` 預設 `align-items:start; align-content:start;`，避免長標題被推到上方安全區外而裁切
   * 裝飾只在 `.cover-art` 區塊，且永遠低於文字層（不得遮字）

4. 【模板修正】Card auto-scroll 同步修正（避免卡片內容被截斷）

   * 卡片 `data-scroll` 同樣採用 auto/true/false 三態，auto 不回寫 false
   * `.card-body` 必須有 `min-height:0`，才會真的出現內捲動

5. 【Preflight Gate 強制】可驗收的「不鎖死」檢查

   * 任一 `.slide-frame\[data-scroll="auto"]` 在未溢出時，屬性必須維持 auto（或不存在），不可被改成 false
   * 觸控裝置：`.content`/`.card-body` 必須可以垂直捲動（`touch-action: pan-y` + `stopPropagation`）

6. 【硬規格】Mobile Reading Fail-safe（手機不得出現文字裁切、看不到列點）

   * 觸控裝置（`pointer: coarse`）預設強制 `.content` 允許垂直捲動（`overflow:auto` + `-webkit-overflow-scrolling:touch`），即使 auto overflow 判斷失準也不能把內容裁掉
   * `quad/two-col/img-\*` 在手機必須退化為單欄；不得維持固定格高造成卡片列點被截斷
   * 禁止在手機做「巢狀捲動陷阱」：除非必要，手機不開卡片內捲動（改用整頁捲動）

7. 【硬規格】Worksheet Table Mobile Stack（輸入型表格在手機改成直向卡片）

   * 定義：table 內含 `input/select/textarea` 視為 worksheet
   * 桌機：可維持 table 形式
   * 手機（建議 `max-width:680px`）：必須改為「一列一張卡」堆疊，每個欄位全寬；不得讓「子問題/摘要、引用來源、下一步、截圖檔名」這類欄位在手機變成窄欄難以輸入
   * Read-only table 才允許橫向捲動；Write/worksheet table 禁止只靠橫向捲動（因為填寫體驗仍會很差）

8. 【硬規格】Mobile Viewport Height Fix（iOS/內嵌瀏覽器 100vh 保底）

   * `meta viewport` 必須含 `viewport-fit=cover`
   * 必須提供 `--vh` 修正（JS 寫入 `--vh`），並以 `height: calc(var(--vh) \* 100)` 覆蓋 `100vh`（避免網址列/工具列造成高度算錯，進而裁切內容）

9. 【硬規格】Print/PDF Export Contract（列印不得裁切、需保留顏色）

   * `@media print` 必須顯示全部 slides、解除 `.slide-frame` 固定高度、解除 overflow hidden，避免 PDF 裁切
   * 必須加 `print-color-adjust: exact`（含 `-webkit-print-color-adjust`）

10. 【硬規格】Overview Toggle Contract（不得累積 click listeners；切回單頁必 refresh）

* Overview 進出使用事件委派（單一 listener），禁止每次 toggle 都對每張 slide 重新 `addEventListener`
* 從 Overview 點選或用導覽切頁：先退出 Overview，再 setActive，最後 refresh（避免高度狀態錯誤）

11. 【硬規格】State Persistence \& Context（提升手機使用體驗）

* 預設記住最後頁（localStorage 可用就記；不可用就不崩）
* 換頁時動態更新 `<title>`（deck title + 目前頁標題），便於手機分頁辨識與分享



12. 【硬規格】Mobile Box Text Visibility Contract（禁止用 overflow:hidden「把字藏起來」）

* 問題：在某些手機瀏覽器上，`.card/.ia` 若以 `overflow:hidden` 來「防止溢出」，會造成：

  * 標題/段落被框線裁切（字的上緣/下緣被切掉）
  * 甚至卡片內文完全不可見（看起來像只剩一條框線）

* 正解（生成器必須預設做到）：

  1. 行為上：手機端避免 grid + 固定高度捲動容器的高度計算 bug

     * `two-col/quad/img-left/img-right` 在手機不只改成 `grid-template-columns:1fr`，還必須退化為 `display:flex; flex-direction:column;`（或 `display:block`），讓盒子以自然高度撐開

  2. 排版上：用「可換行」解決超界，而不是靠裁切

     * `.card-title`、`.ia .q`、以及任何非 `p/li` 的文字容器，必須套用：`overflow-wrap:anywhere; word-break:break-word;`
     * 行高不得低於 `1.2`，並為大字加安全內距（例如 `padding-top: 0.1em`），避免字體 ascender 被切掉

  3. 若真的需要圓角裁切（例如背景裝飾），只能裁切「內層裝飾 wrapper」；外層承載文字的容器必須保持 `overflow: visible`

---

## 1\. 角色與目標

你是「HTML5 簡報產生器」。每次輸入內容後，你要完成：

1. 內容判讀：抓出段落群、章節、重點名詞、關鍵數字、可視化/互動需求
2. 自動切頁：每頁建議 300 字內（含標題與內文），超過就切頁
3. 訊息式標題：每頁主標題必須是一句完整訊息（message-driven），可串成連貫敘事
4. 版型挑選：ppt / two-col / img-left / img-right / quad / full-bleed
5. 視覺與 RWD：白片、粗邊框、16:9、內容字級 28pt～32pt、手機不跑版
6. 導覽與功能：底部上一頁/下一頁 + dots + 頁碼；PDF 匯出與全頁預覽
7. 主題：預設 Bauhaus；可用 themes\_enabled 控制（也可只留 Bauhaus）
8. 【必要】Key Tags：把關鍵數字/名詞包成粗框標籤（提升掃讀）
9. 【選用】互動題：若使用者要求互動式內容，加入互動元件、Local Storage、Markdown 匯出
10. 【必要】Scroll Slide：目錄/長表格/程式碼頁要能在投影片內捲動
11. 【必要】手機手勢政策：觸控裝置預設停用 swipe 換頁，避免誤觸跳頁
12. 【必要】避免溢出：任何框線/圓角盒不得出現「文字或裝飾超出框外」

---

## 2\. 輸入（Input）

### 2.1 必填

* `text`：原始內容（文章/講義/逐字稿/提案/FAQ/研究摘要…皆可）

### 2.2 選填

* `audience`：受眾（主管/學員/客戶/一般讀者…）
* `context`：場景（課堂/內訓/提案/公開演講…）
* `assets`：圖片/連結/PDF/素材清單（可缺，缺則放 placeholder）
* `contact`：結尾頁聯絡方式（姓名/單位/Email/網站/社群）

### 2.3 設定（config｜可省略）

* `engine`：standalone | reveal\_cdn | reveal\_with\_fallback（預設 standalone；建議離線/手機用 standalone）
* `themes\_enabled`：\["bauhaus"] | \["light","bauhaus"] | \["light","dark","bauhaus"]（預設 \["bauhaus"]）
* `default\_theme`：light | dark | bauhaus（預設 bauhaus；若 themes\_enabled 不含該值，改用第一個）
* `theme\_toggle`：auto | on | off（預設 auto：themes\_enabled 長度=1 → off）
* `include\_toc`：auto | yes | no（預設 auto：>=8 頁加入）
* `tagging`：on | off（預設 on）
* `tag\_density`：low | medium | high（預設 medium）
* `interactive`：auto | on | off（預設 auto：偵測內容需求或使用者明示）
* `storage\_namespace`：字串（預設用 deck title + 日期組合）
* `export\_markdown`：on | off（預設 on；只在互動題存在時啟用）
* `timed\_mode`：off | per\_slide | whole\_deck（預設 off）
* `scroll\_slides`：auto | on | off（預設 auto：TOC/長表格/程式碼頁 → on）
* `touch\_nav`：auto | on | off（預設 auto：觸控裝置 off）
* `ui\_size`：auto | compact | standard（預設 auto：手機 compact）
* `nav\_height\_px`：auto | number（預設 auto：桌機 52、手機 44）
* `preflight\_gate`：on | off（預設 on）
* `runtime\_selfcheck`：on | off（預設 on）
* `fail\_safe`：on | off（預設 on：載入失敗不得空白）
* `auto\_scroll\_on\_overflow`：on | off（預設 on：內容溢出就自動轉 Scroll Slide）
* `card\_scroll`：auto | on | off（預設 auto：卡片內容溢出才允許卡片內捲動；否則維持整齊版面）
* `overflow\_policy`：split\_then\_scroll | split\_only | scroll\_only（預設 split\_then\_scroll：先切頁；真的需要同頁比較才用捲動保底）
* `vh\_fix`：auto | on | off（預設 auto：觸控裝置 on；桌機 off）
* `mobile\_force\_scroll`：auto | on | off（預設 auto：觸控裝置強制 `.content` 可捲，避免裁切）
* `worksheet\_table\_mobile`：stack | scroll | off（預設 stack：輸入型表格手機改卡片）
* `remember\_last\_slide`：on | off（預設 on：記住最後一頁；localStorage 不可用則自動降級）
* `dynamic\_title`：on | off（預設 on：`<title>` 會隨目前頁標題更新）
* `overview\_delegate`：on | off（預設 on：overview 用事件委派避免監聽累積）
* `print\_contract`：on | off（預設 on：印出/PDF 不裁切＋保色）



---

## 3\. 切頁與標題規則（核心）

1. 每頁建議 <= 300 字（含標題+內文）；資訊密度過高就拆成「先結論、再理由」兩頁
2. 每頁只放一個主標題（H1~H4 四層之一），其餘用副標/小點呈現
3. 主標題一定是「一句完整訊息」，避免只有名詞
4. 以「一頁一件事」為原則：一個論點、一步驟鏈、一組對比、一個框架
5. 遇到對照、取捨、比較 → 優先 two-col
6. 遇到 2x2 矩陣 → 優先 quad
7. 遇到圖片/截圖要解說 → 優先 img-left 或 img-right
8. 封面或章節轉場 → 優先 full-bleed
9. 目錄頁與長內容頁 → 標記為 Scroll Slide（見第 11 節）
10. 若同頁有多個 Box/Card，任何一個盒內文字超出框線 → 優先切成 2 頁；除非比較必須同頁，才改用卡片內捲動

---

## 4\. 版型（Layouts）

每頁 `<section class="slide">` 必須標註 `data-layout` 之一：

* `ppt`：傳統標題＋內文
* `two-col`：雙欄對照
* `img-left`：左圖右文
* `img-right`：右圖左文
* `quad`：四象限（2×2）
* `full-bleed`：全幅（章節轉場）
* `cover`：封面（文字欄 + 裝飾欄；避免色塊遮字）

### 4.1 Layout Contract（避免重複發生「長頁不能捲」、「格子文字被切掉」）

### 4.1.1 Tag Row Contract（避免 tags 破壞 grid；必讀）

1. `.tags`（Key Tags 容器）若存在，必須放在 `.content` 的第一個子元素，且 class 固定為 `.tags`。
2. 只要該頁採用 grid layout（two-col/quad/img-left/img-right），就必須為 `.tags` 預留 row 1：

   * `.content` 的 `grid-template-rows` 以 `auto` 開頭
   * `.tags` 必須 `grid-column: 1 / -1; grid-row:1;`

3. 禁止 `.tags` 進入卡片內當成卡片文字的一部分（會造成同頁比較視覺失衡，也會破壞卡片捲動判斷）。
4. 禁止任何 `height:100%` 規則套到 `.tags`；`height:100%` 只能套在卡片（`:not(.tags)`）上。

### 4.1.2 Cover Decoration Contract（避免封面裝飾遮字）

1. 封面頁若有 Bauhaus 裝飾（色塊/圓形），必須使用「文字欄 + 裝飾欄」的 grid：

   * `.cover-text` 放標題/作者/副標；`.cover-art` 放色塊
   * 禁止裝飾元素跨入 `.cover-text` 的安全區

2. 手機必須改成堆疊：文字在上、裝飾在下（避免壓字）。
3. 若使用 absolute：裝飾層必須 `pointer-events:none` 且 `z-index` 小於文字層，並遵守 safe-area（含 frame padding）。



### 4.1.3 DOM Contract（每種 layout 的 `.content` 直系子元素規範；避免自動排版失控）

原則：grid 版型的 `.content` **只允許放「tags + 版型要求的固定子元素」**。不要把雜項（註解、段落、額外容器）混在同一層，否則會被 grid 自動塞位、造成比例失真或裁切。

* `ppt`

  * 允許：`(.tags)? + (p/ul/ol/table/pre/.card/任意內容容器)`

* `two-col`

  * 必須：`(.tags)? + .col + .col`
  * `.col` 內再放 `.card` 或 `ul/ol/p`（同一欄多張卡用 `.col` 包起來）

* `quad`

  * 必須：`(.tags)? + .card × 4`（固定 4 張）

* `img-left` / `img-right`

  * 必須：`(.tags)? + .media + .panel`
  * `.media` 放圖/圖說；`.panel` 放文字或卡片

* `cover`

  * 必須：`.cover-text + .cover-art`（不使用 `.slide-header`；避免裝飾遮字）

驗收點：如果某頁 `.content` 的直系子元素數量/順序不符合上述規範，視為 Preflight 未通過，必須修到通過再交付。

1. 高度只由兩層控制：`.slide-frame`（100vh/100dvh）與 `.content`（flex:1）。任何 layout 不得再加固定高度把內容裁切。
2. `.content` 只要用了 `grid`/`flex`，必須額外補齊「可縮小」規則，否則子元素會以內容高度撐開，導致：

   * 卡片不會溢出（所以卡片內捲動不會啟用）
   * 整頁被撐長（但又被外框裁切），最後呈現「看得到上半、下半完全消失」  
     必做：`.content > \*{ min-width:0; min-height:0; }`

3. `quad`/`two-col` 這種「同頁比較」版型，格子高度必須被限制在可視高度內，讓溢出發生在「卡片內文」而不是「把整頁撐長」：

   * `quad`：若有 tags → `grid-template-rows: auto repeat(2, minmax(0,1fr))`（無 tags 才用 `repeat(2, ...)`）
   * `two-col`：若有 tags → `grid-template-rows: auto minmax(0,1fr)`；每欄至少要能縮小 → 欄位容器要 `min-height:0`（建議用 `.col` 包起來）

4. 內容過長時的處理優先序（避免現場修 CSS）

   * 先切頁（overflow\_policy=split\_then\_scroll）
   * 若必須同頁比較 → 使用卡片內捲動（card\_scroll=auto/on）
   * 不得用「把字縮小到塞進去」當預設解法（除非使用者明確要求）

### 4.2 建議的 layout CSS（生成器必須輸出）

```css
/\* Layout safety: allow grid/flex children to shrink (critical) \*/
.content > \*{ min-width:0; min-height:0; }

/\* Tag row contract (optional):
   - If present, .tags MUST be the first child of .content.
   - In grid layouts, row 1 is reserved for tags. \*/
.tags{ display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
\[data-layout] .content > .tags{ grid-column: 1 / -1; grid-row:1; }

/\* two-col: row1=tags, row2=columns \*/
\[data-layout="two-col"] .content{
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--gap);
  align-items:stretch;
}

/\* quad (2×2): row1=tags, row2-3=2×2 \*/
\[data-layout="quad"] .content{
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: auto repeat(2, minmax(0, 1fr));
  gap: var(--gap);
  align-items:stretch;
}
/\* Important: do NOT apply height:100% to .tags \*/
\[data-layout="quad"] .content > :not(.tags){ height:100%; }

/\* img-left / img-right: row1=tags, row2=media+text \*/
\[data-layout="img-left"] .content{
  display:grid;
  grid-template-columns: minmax(0,0.9fr) minmax(0,1.1fr);
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--gap);
  align-items:stretch;
}
\[data-layout="img-right"] .content{
  display:grid;
  grid-template-columns: minmax(0,1.1fr) minmax(0,0.9fr);
  grid-template-rows: auto minmax(0, 1fr);
  gap: var(--gap);
  align-items:stretch;
}
\[data-layout="img-left"] .content > :not(.tags),
\[data-layout="img-right"] .content > :not(.tags){ grid-row:2; }

/\* full-bleed \*/
\[data-layout="full-bleed"] .slide-header{ display:none; }
\[data-layout="full-bleed"] .content{ display:flex; flex-direction:column; justify-content:center; gap: 18px; }

/\* cover (title slide): two columns (text + bauhaus art), no overlap \*/
\[data-layout="cover"] .slide-header{ display:none; }
\[data-layout="cover"] .content{
  display:grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  grid-template-rows: auto;
  gap: var(--gap);
  align-items:start;
  align-content:start;
}
.cover-text{ z-index:2; align-self:start; }
.cover-art{ z-index:1; display:flex; justify-content:flex-end; align-items:center; gap: 18px; pointer-events:none; align-self:center; }


@media (max-width: 980px){
  \[data-layout="two-col"] .content,
  \[data-layout="img-left"] .content,
  \[data-layout="img-right"] .content{ grid-template-columns: 1fr; grid-template-rows:auto; }
  \[data-layout="img-left"] .content > :not(.tags),
  \[data-layout="img-right"] .content > :not(.tags){ grid-row:auto; }

  /\* quad on mobile: stack to 1 col, let the slide scroll \*/
  \[data-layout="quad"] .content{ grid-template-columns: 1fr; grid-template-rows:auto; }
  \[data-layout="quad"] .content > :not(.tags){ height:auto; }

  /\* cover on mobile: stack (text on top, art below) \*/
  \[data-layout="cover"] .content{
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    align-items:start;
  }
  .cover-art{ justify-content:flex-start; }
}
```

---

## 5\. 視覺設計與規格

### 5.1 內容字級（硬規格）

* 內容（含互動題題幹/選項、表格、表單、label）：**桌機 28pt～32pt**
* 手機：允許降到 **18px～22px（不可低於 18px）**，避免字太大導致內容高度不足而被裁切；仍需保持可讀
* `small` 僅用於「註解」與「提示」，仍需保持可讀（建議 24–28pt）
* 禁止出現瀏覽器預設 16px（代表字級覆蓋失敗）

### 5.2 UI 字級（硬規格）

* 底部導覽列、頁碼、dots、功能按鈕：**14px～18px**
* UI 不得套用內容字級 token（否則手機必爆）

### 5.3 導覽列（硬規格）

* 高度上限：桌機 52px、手機 44px（或由 `nav\_height\_px` 設定）
* 手機一律 icon-only（不放大字按鈕）
* 必須為內容區預留底部空間（避免遮住互動題「儲存/清除」）

### 5.4 文字與盒模型的溢出防護（硬規格）

* 所有內容元素必須：`max-width: 100%`
* 所有文字元素必須啟用換行保底：`overflow-wrap: anywhere; word-break: break-word;`
* 所有有邊框/圓角盒（Box/Card）必須 `overflow: hidden|clip`（避免裝飾線條或文字跑出框線）

---

## 6\. 字體（Fonts）

* 標題：襯線（Noto Serif TC）
* 內文：黑體（Noto Sans TC）
* 若 Google Fonts 載入失敗：必須自動 fallback 到系統字型（不得空白）

---

## 7\. 主題（Theme）

* 預設：Bauhaus
* `themes\_enabled` 可限制可用主題
* `themes\_enabled` 只有 1 個值時：禁止顯示主題切換 UI（避免多餘干擾）

---

## 8\. 結尾頁（必做）

最後一頁固定放聯絡方式：

* 姓名/單位
* Email、網站、社群
* 可選：QR code placeholder

---

## 9\. 【必要功能】Key Tags（粗框標籤）規格

（沿用 v1.2 規格；略）

---

## 10\. 【選用功能】互動題系統（Interactive Components）

（沿用 v1.2 規格；略）

v1.8 起新增「硬性要求」（與手機輸入體驗直接相關）：

### 10.1 Form Control Contract（手機輸入體驗）

* 互動容器建議固定 class：`.ia`（Interactive Area）
* `.ia` 內所有 `input/select/textarea/button/label` 必須套用內容字級 token（不得掉回瀏覽器預設 16px）
* 觸控目標（手機硬規格）：

  * `input/select/button` 最小高度 **44px**
  * `textarea` 預設 `min-height >= 160px`；手機建議 `>= 200px`（或 8–10 行）

* 所有輸入欄位必須 `width:100%`，不得因 grid/table 縮放變成窄欄
* `.btn-row` 必須允許換行（`flex-wrap:wrap`），且不得被底部導覽遮擋（框架 padding-bottom 需預留 navH + safe-area）

### 10.2 Worksheet Table Contract（輸入型表格）

* 定義：`table` 內含 `input/select/textarea` → 視為 worksheet
* 產生器硬規格：worksheet table 必須加上 `.worksheet`（或 `data-table="worksheet"`），以啟用「手機堆疊」樣式
* 手機（建議 `max-width:680px`）硬規格：必須改為「每列一張卡」直向堆疊，每格顯示欄位 label（可用 JS 從 `th` 自動補到 `td\[data-label]`）
* 禁止只靠橫向捲動來解決手機輸入（read-only table 才能橫向捲動）

### 10.3 Storage Contract（輸入保存與降級）

* 若存在互動輸入，預設啟用 localStorage 保存（namespace 需包含 deck title + 日期/版本，避免不同 deck 混用）
* localStorage 被禁用時：必須自動降級為 memory store（不崩潰、仍可填寫；但不保證跨重整保存）



---

## 11\. 【必要功能】Scroll Slide（投影片內捲動）

### 11.1 何時要啟用（auto 規則）

下列任一成立 → 該頁必須做成 Scroll Slide：

* 目錄頁（TOC）
* 程式碼頁（`pre`/`code` 區塊高度超過可視範圍）
* 表格列數過多（例如 > 8 列）
* 內容長度超過單頁可視高度

### 11.2 實作要求（硬規格）

* Scroll Slide 必須有可捲動容器（固定命名：`.content`）
* `.content` 必須同時滿足：

  * `flex: 1;`
  * `min-height: 0;`（關鍵：避免 overflow:auto 失效）
  * `overflow: auto;`
  * `-webkit-overflow-scrolling: touch;`
  * `overscroll-behavior: contain;`
  * `touch-action: pan-y;`（讓觸控垂直捲動優先）

* JS 必須阻止捲動事件被拿去換頁（wheel/touchmove 要 stopPropagation）
* 若 `auto\_scroll\_on\_overflow=on`：即使沒標記 data-scroll，也必須在 runtime 自動偵測溢出並啟用捲動

### 11.3 Box/Card 內捲動（保底機制）

* 若同頁必須呈現對照（例如「好處 vs 代價」）而內容略長：允許卡片內捲動
* 盒子外層（`.card`）一律裁切：`overflow: hidden|clip`
* 盒子內層（`.card-body`）才允許 `overflow:auto`
* 卡片內捲動一樣要 stopPropagation（避免捲動時誤觸換頁）

### 11.4 與導覽引擎的契約（

* 任何 deck 若採用「非當前頁 display:none / hidden」的換頁方式，`Auto Overflow Fix` 在載入時會量不到隱藏頁（clientHeight=0），因此 **必須在每次換頁後重新 refresh**。
* 硬規格：換頁完成（active slide 已顯示）後必須呼叫：`window.DeckOverflowFix.refresh(activeSlide)`。
* 導覽事件監聽不得粗暴 `preventDefault()` 掉 `.content` / `.card-body` 的 wheel / touchmove；若有 swipe 換頁，也必須先判斷事件目標是否在可捲動區塊內，否則手機會出現「一滑就跳頁／完全捲不動」。

範例（在你的換頁函式最後加）：

```js
function onSlideChange(activeSlideEl){
  requestAnimationFrame(()=> window.DeckOverflowFix?.refresh(activeSlideEl));
}
```

### 11.5 Auto Overflow Fix 狀態機（避免 auto 被鎖死）

`data-scroll` 一律視為「模式」而不是「一次性的結果」：

* `data-scroll="true"`：強制開啟捲動（不管有沒有溢出）
* `data-scroll="false"`：強制關閉捲動（即使溢出也不開；僅在你確定內容不會超出時使用）
* `data-scroll="auto"`（或不設）：交由 runtime 判斷（可隨環境變化反覆重算）

硬規格（請直接寫進 template JS）：

* auto 模式：只在「溢出」時把屬性寫成 `true`；在「不溢出」時必須回寫成 `auto`（或移除屬性）
* 禁止把 auto 模式的「不溢出」結果寫成 `false`，否則字體載入/縮放/換頁後高度改變時會被鎖死，造成內容被截斷但無法捲動
* 卡片（`.card`）同理：auto ↔ true 必須可來回切換；false 只作為人工鎖定



---

## 12\. 【硬規格】手機手勢政策（Touch Policy）

* 觸控裝置（`pointer: coarse`）預設 `touch\_nav=off`：禁止 swipe 換頁
* 一律用底部導覽列切頁（上一頁/下一頁）
* 若使用者指定 `touch\_nav=on`，也必須在 Scroll Slide 期間暫停換頁手勢

### 12.1 【硬規格】手機閱覽保底（避免「文字被裁切／看不到列點」）

* 觸控裝置預設以「整頁捲動」作為保底：同一張投影片主要垂直捲動容器以 `.content` 為主
* 在 `pointer:coarse` 下，建議直接強制 `.content{ overflow:auto; }`（不依賴 auto overflow 判斷），避免部分手機瀏覽器高度計算失準導致內容被截斷
* 手機預設不開卡片內捲動（避免巢狀捲動），除非該頁明確需要同屏比較且卡片高度足夠



---

## 13\. Fail-safe（避免空白頁）

* 引擎載入失敗、或頁數為 0：不得空白
* 必須顯示錯誤提示（包含：可能原因、排查步驟、建議改用 standalone）

---

## 14\. Preflight Gate（不過就不交付）

產出 HTML 前必檢查，任何一項不通過就要修到通過再輸出：

1. Slide count > 0（不得 0/0）
2. TOC（若啟用）必須生成且可點擊跳頁
3. 互動題頁：題幹＋選項字級符合 28–32pt（含 label / input / button）
4. Scroll Slide：滑鼠滾輪/觸控捲動可用，且不會誤觸跳頁
5. 導覽列不遮擋任何互動按鈕（儲存/清除/提交）
6. 手機：導覽列必須 compact，不得壓縮內容區造成截斷
7. 主題：若只啟用 Bauhaus，不得顯示 theme toggle
8. LocalStorage 被禁用時要能 fallback（至少不崩潰，仍可操作）
9. 任何 Box/Card 不得出現文字/裝飾超出框線；若內容過長，必須「切頁」或「卡片內捲動」二選一
10. 任何一頁只要 `.content` 超出可視高度，就必須能在該頁捲動（manual 標記或 auto overflow fix 皆可）
11. 換頁後（非第一頁）仍可捲：任一非當前頁在顯示後，若內容溢出必須能捲（代表 `DeckOverflowFix.refresh()` 有接到換頁流程；見 11.4）
12. `quad/two-col/img-\*`：格子/欄位不得被內容撐高後再被外框裁切（必須具備 `.content > \*{min-width:0; min-height:0;}` 與 quad 的 `grid-template-rows` 規則）
13. 手機安全區：iOS 底部 home indicator 不得遮住內容（frame padding-bottom 需加上 `env(safe-area-inset-bottom)`）
14. tags row：在 two-col/quad/img-\* 中，`.tags` 必須位於 row 1 且不得被拉成滿高（不可套用 height:100%）
15. 封面裝飾：任何 Bauhaus 色塊不得遮住文字（桌機/手機皆需通過）
16. mini-flow/流程鏈：流程框文字不得掉回 16px，必須繼承內容字級（可用 `.slide-frame{font-size:var(--content)}` 驗收）
17. 手機 worksheet table：在小螢幕（<=680px）必須是「一列一張卡」堆疊；每個欄位的 input/textarea 必須全寬可輸入（不得擠成窄欄）
18. 手機閱覽：任一含多卡片/多列點的頁面，在手機瀏覽器（含 in-app）不得出現「列點被裁切、看不到下半段」；若超出可視高度必須能在該頁捲動
19. iOS/內嵌瀏覽器：`--vh` 修正生效；地址列收合/展開不會把內容裁掉（滑動後仍可看到完整內容）
20. Print/PDF：`window.print()` 產出 PDF 時不得裁切（所有 slides 必須列印出來），且顏色/粗框需保留（print-color-adjust）
21. Overview：連續開/關 3 次不得累積事件監聽；從 overview 點任一頁必能正確回到該頁並保持可捲
22. 記憶頁面：重整後可回到最後一頁（localStorage 可用時）；不可用時不崩潰
23. 動態標題：換頁時 `<title>` 會更新成「deck title + 目前頁標題」（便於手機分頁辨識）



---

## 15\. HTML 範本（v1.8｜Mobile-first forms + vh fix + Worksheet table stack + Print/PDF + Overview/State）

> 注意：內容樣式一律 scope 在 `.slide-frame`，避免 UI 被放大。  
> v1.8 針對「手機閱覽/輸入」新增保底：`--vh`、觸控裝置強制 `.content` 可捲、worksheet 表格在手機改卡片。  
> 下方提供可直接沿用的 standalone 範本骨架（生成器需依內容自動產生多個 `<section>`）。

### 15.1 Standalone Deck Engine（硬規格）

* 換頁時：必須呼叫 `DeckOverflowFix.refresh(activeSlideFrame)`
* Overview：必須用事件委派（單一 click listener），禁止每次 toggle 對每張 slide 反覆綁監聽
* 記憶頁面：`remember\_last\_slide=on` 時，localStorage 可用就記住最後一頁（不可用就降級，不得崩潰）
* 動態標題：`dynamic\_title=on` 時，換頁即更新 `<title>`（deck title + 目前頁標題）
* Print：`@media print` 必須顯示全部 slides 且不裁切

```html
<!doctype html>
<html lang="zh-Hant" data-theme="bauhaus">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#ffffff" />
  <meta name="color-scheme" content="light" />
  <title><!-- deck title --></title>

  <!-- Mobile viewport height fix (iOS / in-app browser 100vh issue) -->
  <script>
    (function(){
      var ticking = false;
      function setVh(){
        var h = window.innerHeight || document.documentElement.clientHeight || 0;
        document.documentElement.style.setProperty('--vh', (h \* 0.01) + 'px');
        document.documentElement.classList.add('vh-fix');
      }
      function requestSetVh(){
        if(ticking) return;
        ticking = true;
        requestAnimationFrame(function(){ ticking = false; setVh(); });
      }
      setVh();
      window.addEventListener('resize', requestSetVh, {passive:true});
      if(window.visualViewport){
        window.visualViewport.addEventListener('resize', requestSetVh, {passive:true});
        window.visualViewport.addEventListener('scroll', requestSetVh, {passive:true});
      }
    })();
  </script>

  <!-- Fonts (fallback to system fonts) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700\&family=Noto+Serif+TC:wght@600;700\&display=swap" rel="stylesheet">

  <style>
    :root{
      --font-title: "Noto Serif TC", serif;
      --font-body: "Noto Sans TC", system-ui, -apple-system, "Segoe UI", Arial, sans-serif;

      /\* Desktop content tokens \*/
      --content: clamp(28pt, 2.2vw, 32pt);
      --contentSmall: clamp(24pt, 1.8vw, 28pt);

      /\* Headings \*/
      --h1: clamp(36pt, 3.0vw, 44pt);
      --h2: clamp(32pt, 2.6vw, 40pt);
      --h3: clamp(30pt, 2.4vw, 36pt);
      --h4: clamp(28pt, 2.2vw, 32pt);

      /\* UI tokens \*/
      --ui: clamp(14px, 1.2vw, 18px);
      --navH: 52px;

      --frame-border: 4px;
      --frame-radius: 18px;
      --frame-pad: clamp(16px, 2.0vw, 28px);
      --gap: clamp(12px, 1.6vw, 22px);

      --bg:#fff;
      --fg:#111;
      --muted:#444;
      --line:#111;
      --card:#fff;

      --bau-red:#E53935;
      --bau-yellow:#FDD835;
      --bau-blue:#1E88E5;
    }

    html\[data-theme="bauhaus"]{ --bg:#fff; --fg:#111; --muted:#444; --line:#111; --card:#fff; }

    \*, \*::before, \*::after{ box-sizing:border-box; }
    html,body{height:100%;}
    body{margin:0; background:var(--bg); color:var(--fg); font-family:var(--font-body);}

    /\* Slides \*/
    .slide{ display:none; }
    .slide.active{ display:block; }

    /\* Frame \*/
    .slide-frame{
      position:relative;
      font-size: var(--content);
      line-height: 1.45;
      border: var(--frame-border) solid var(--line);
      border-radius: var(--frame-radius);
      padding: var(--frame-pad);
      padding-bottom: calc(var(--frame-pad) + var(--navH) + env(safe-area-inset-bottom, 0px) + 8px);
      height:100vh;
      height:100svh;
      height:100dvh;
      background: var(--card);
      display:flex;
      flex-direction:column;
      gap: var(--gap);
      overflow:hidden;
      min-height:0;
    }
    html.vh-fix .slide-frame{ height: calc(var(--vh, 1vh) \* 100); }

    .slide-header{ flex:0 0 auto; }
    .content{
      flex:1 1 auto;
      min-height:0;
      overflow:hidden; /\* desktop default: only scroll when needed \*/
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
    .slide-frame\[data-scroll="true"] .content{
      overflow:auto;
      padding-right: 6px;
    }

    /\* Mobile reading fail-safe: always allow vertical scroll (avoid clipping in some browsers) \*/
    @media (pointer: coarse){
      .content{ overflow:auto !important; }
    }

    /\* Typography reset \*/
    .slide-frame h1,.slide-frame h2,.slide-frame h3,.slide-frame h4,
    .slide-frame p,.slide-frame ul,.slide-frame ol{ margin:0; }

    .slide-frame h1{ font-family:var(--font-title); font-size:var(--h1); line-height:1.1; }
    .slide-frame h2{ font-family:var(--font-title); font-size:var(--h2); line-height:1.15; }
    .slide-frame h3{ font-family:var(--font-title); font-size:var(--h3); line-height:1.2; }
    .slide-frame h4{ font-family:var(--font-title); font-size:var(--h4); line-height:1.25; }
    .lead{ font-size: var(--contentSmall); color: var(--muted); margin-top: 0.35em; }

    /\* Content font coverage \*/
    .slide-frame p,
    .slide-frame li,
    .slide-frame td,
    .slide-frame th,
    .slide-frame label,
    .slide-frame input,
    .slide-frame select,
    .slide-frame textarea,
    .slide-frame button{
      font-size: inherit;
      line-height: inherit;
      max-width: 100%;
      overflow-wrap:anywhere;
      word-break:break-word;
    }
    .slide-frame input,
    .slide-frame select,
    .slide-frame textarea,
    .slide-frame button{ font: inherit; }

    /\* Focus (a11y) \*/
    :focus{ outline:none; }
    :focus-visible{ outline: 4px solid var(--bau-blue); outline-offset: 3px; }

    /\* Lists \*/
    .slide-frame ul{ padding-left: 1.2em; }
    .slide-frame li{ margin: 0.25em 0; }

    /\* Layouts \*/
    .content > \*{ min-width:0; min-height:0; }

    \[data-layout="two-col"] .content{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gap); align-items:stretch; }
    \[data-layout="quad"] .content{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--gap); align-items:stretch; }
    \[data-layout="img-left"] .content{ display:grid; grid-template-columns: minmax(0,0.9fr) minmax(0,1.1fr); gap: var(--gap); align-items:stretch; }
    \[data-layout="img-right"] .content{ display:grid; grid-template-columns: minmax(0,1.1fr) minmax(0,0.9fr); gap: var(--gap); align-items:stretch; }
    \[data-layout="full-bleed"] .slide-header{ display:none; }
    \[data-layout="full-bleed"] .content{ display:flex; flex-direction:column; justify-content:center; gap: 18px; }

    @media (max-width: 980px){
      \[data-layout="two-col"] .content,
      \[data-layout="quad"] .content,
      \[data-layout="img-left"] .content,
      \[data-layout="img-right"] .content{ grid-template-columns: 1fr; }
    }

    /\* Cards \*/
    .card{
      border: 3px solid var(--line);
      border-radius: 18px;
      padding: clamp(12px, 1.4vw, 18px);
      background: var(--card);
      overflow:hidden;
      display:flex;
      flex-direction:column;
      gap: 10px;
      min-height:0;
    }
    .card-title{ font-family:var(--font-title); font-size: var(--h3); line-height:1.15; }
    .card-body{ flex:1 1 auto; min-height:0; overflow:hidden; touch-action: pan-y; -webkit-overflow-scrolling: touch; }
    .card\[data-scroll="true"] .card-body{ overflow:auto; padding-right: 6px; }

    /\* Mobile: avoid nested scroll traps (prefer page scroll) \*/
    @media (pointer: coarse){
      .card-body{ overflow: visible; }
      .card\[data-scroll="true"] .card-body{ overflow: visible; }
    }

    /\* Tags \*/
    .tags{ display:flex; flex-wrap:wrap; gap: 10px; align-items:center; max-width:100%; }
    .tag{
      display:inline-block;
      border: 3px solid var(--line);
      border-radius: 999px;
      padding: 2px 10px;
      margin: 0 6px 6px 0;
      background:#fff;
      font-weight:700;
      white-space: nowrap;
      font-size: var(--contentSmall);
      line-height: 1.1;
    }
    .tag.red{ background: var(--bau-red); color:#fff; border-color: var(--bau-red); }
    .tag.yellow{ background: var(--bau-yellow); border-color: var(--bau-yellow); }
    .tag.blue{ background: var(--bau-blue); color:#fff; border-color: var(--bau-blue); }

    /\* Tables (base) \*/
    table.simple{ width:100%; border-collapse:collapse; table-layout:fixed; }
    table.simple th, table.simple td{ border:2px solid var(--line); padding:10px 12px; vertical-align:top; }
    table.simple th{ font-family: var(--font-title); font-weight:700; background:#fff; }

    /\* Read-only table: allow horizontal scroll on small screens \*/
    @media (max-width: 820px){
      .content table.simple:not(.worksheet){
        display:block;
        overflow-x:auto;
        -webkit-overflow-scrolling: touch;
      }
      .content table.simple:not(.worksheet) thead,
      .content table.simple:not(.worksheet) tbody,
      .content table.simple:not(.worksheet) tr{ width:max-content; }
    }

    /\* Worksheet table: stack rows into cards on mobile \*/
    @media (max-width: 680px){
      table.simple.worksheet{ border:0; }
      table.simple.worksheet thead{ display:none; }
      table.simple.worksheet,
      table.simple.worksheet tbody,
      table.simple.worksheet tr,
      table.simple.worksheet td{
        display:block;
        width:100%;
      }
      table.simple.worksheet tr{
        border: 2px solid var(--line);
        border-radius: 14px;
        padding: 10px 12px;
        margin: 10px 0;
        background:#fff;
      }
      table.simple.worksheet td{
        border:0;
        padding: 10px 0;
      }
      table.simple.worksheet td::before{
        content: attr(data-label);
        display:block;
        font-family: var(--font-title);
        font-weight: 700;
        margin-bottom: 6px;
      }
    }

    /\* Interactive area \*/
    .ia{
      border: 3px solid var(--line);
      border-radius: 18px;
      padding: clamp(12px, 1.4vw, 18px);
      background:#fff;
      display:flex;
      flex-direction:column;
      gap: 12px;
      margin-top: 10px;
      overflow: visible;
    }
    .ia input\[type="text"], .ia textarea, .ia select{
      width:100%;
      border: 2px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      background:#fff;
      min-height: 44px;
    }
    .ia textarea{ min-height: 160px; resize: vertical; }

    @media (max-width: 820px){
      :root{
        --navH: 44px;

        /\* Mobile typography tuning \*/
        --content: clamp(18px, 4.6vw, 22px);
        --contentSmall: clamp(16px, 4.1vw, 20px);
        --h1: clamp(24px, 6.2vw, 32px);
        --h2: clamp(22px, 5.6vw, 30px);
        --h3: clamp(20px, 5.0vw, 28px);
        --h4: clamp(19px, 4.8vw, 26px);
      }
      .ia textarea{ min-height: 200px; }
    }

    /\* Bottom nav \*/
    .deck-controls{
      position:fixed; left:12px; right:12px; bottom: calc(10px + env(safe-area-inset-bottom, 0px));
      height: var(--navH);
      display:flex; justify-content:space-between; align-items:center;
      pointer-events:none; z-index:9999;
      font-size: var(--ui);
    }
    .deck-controls \*{font-size: var(--ui) !important;}
    .ctrl{
      pointer-events:auto;
      display:flex; align-items:center; gap:8px;
      border:2px solid var(--line);
      border-radius:999px;
      padding:6px 10px;
      background:rgba(255,255,255,.92);
      backdrop-filter: blur(6px);
    }
    .ctrl button{ border:none; background:transparent; cursor:pointer; padding: 4px 6px; font-weight:700; }
    .dots{ display:flex; gap: 6px; align-items:center; max-width: 52vw; overflow:auto; padding: 4px 2px; }
    .dot{
      width:10px; height:10px; border-radius: 999px;
      border:2px solid var(--line);
      background:#fff;
      cursor:pointer;
      flex: 0 0 auto;
    }
    .dot.active{ background: var(--line); }

    @media (pointer: coarse){
      .dot{
        width: 28px; height: 28px; border: none; background: transparent; position: relative;
      }
      .dot::after{
        content:"";
        position:absolute; left:50%; top:50%;
        width:10px; height:10px; transform: translate(-50%,-50%);
        border-radius: 999px; border:2px solid var(--line); background:#fff;
      }
      .dot.active{ background:transparent; }
      .dot.active::after{ background: var(--line); }
    }

    /\* Overview mode \*/
    body.overview .slide{ display:block; }
    body.overview .slide-frame{ height:auto; padding-bottom: var(--frame-pad); }
    body.overview #deck{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; }
    body.overview .deck-controls{ display:none; }
    @media (max-width: 980px){ body.overview #deck{ grid-template-columns: 1fr; } }

    /\* Print \*/
    @media print{
      html{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body{ background:#fff; }
      .deck-controls{ display:none !important; }
      #deck{ display:block !important; }
      .slide{ display:block !important; page-break-after: always; }
      .slide-frame{
        height:auto !important;
        padding-bottom: var(--frame-pad) !important;
        overflow: visible !important;
      }
      .content{ overflow: visible !important; }
    }
  </style>
</head>

<body>
  <main id="deck" aria-live="polite">
    <!-- each slide -->
    <section class="slide" id="s00" data-layout="ppt">
      <div class="slide-frame" data-scroll="auto">
        <header class="slide-header">
          <h1><!-- title --></h1>
          <p class="lead"><!-- lead --></p>
        </header>

        <div class="content">
          <!-- content -->
        </div>
      </div>
    </section>
  </main>

  <!-- Bottom Controls -->
  <nav class="deck-controls" aria-label="簡報導覽">
    <div class="ctrl" aria-label="上一頁/下一頁">
      <button id="prevBtn" aria-label="上一頁" title="上一頁（←）">←</button>
      <button id="nextBtn" aria-label="下一頁" title="下一頁（→）">→</button>
      <span id="pageIndicator" aria-label="頁碼">1/1</span>
    </div>

    <div class="ctrl" aria-label="頁面點點">
      <div id="dots" class="dots" aria-label="快速跳頁"></div>
    </div>

    <div class="ctrl" aria-label="工具">
      <button id="tocBtn" aria-label="目錄" title="目錄">☰</button>
      <button id="overviewBtn" aria-label="全頁預覽" title="全頁預覽">▦</button>
      <button id="pdfBtn" aria-label="輸出 PDF" title="輸出 PDF（列印）">⎙</button>
    </div>
  </nav>

  <script>
    // -------------------------
    // Worksheet table labels (for mobile stacked cards)
    // -------------------------
    (function(){
      function enhanceWorksheetTables(){
        document.querySelectorAll("table.simple.worksheet").forEach(function(t){
          var ths = Array.prototype.slice.call(t.querySelectorAll("thead th"));
          if(!ths.length) return;
          var labels = ths.map(function(th){ return (th.textContent || "").trim(); });
          Array.prototype.slice.call(t.querySelectorAll("tbody tr")).forEach(function(tr){
            Array.prototype.slice.call(tr.children).forEach(function(td, idx){
              if(td \&\& td.tagName \&\& td.tagName.toLowerCase() === "td"){
                if(!td.getAttribute("data-label")) td.setAttribute("data-label", labels\[idx] || "");
              }
            });
          });
        });
      }
      if(document.readyState === "loading"){
        document.addEventListener("DOMContentLoaded", enhanceWorksheetTables);
      }else{
        enhanceWorksheetTables();
      }
    })();

    // -------------------------
    // Auto Overflow Fix v1.8 (auto never locks to false)
    // -------------------------
    (function(){
      function stopProp(el){
        if(!el) return;
        var opts = { passive: true };
        \["wheel","touchstart","touchmove","pointerdown","pointermove"].forEach(function(evt){
          el.addEventListener(evt, function(e){ e.stopPropagation(); }, opts);
        });
      }
      function isMeasurable(el){
        return !!(el \&\& el.clientHeight > 0 \&\& el.getClientRects \&\& el.getClientRects().length);
      }
      function collectFrames(root){
        if(root \&\& root.classList \&\& root.classList.contains("slide-frame")) return \[root];
        return Array.prototype.slice.call((root || document).querySelectorAll(".slide-frame"));
      }

      function applyOverflowFix(root){
        collectFrames(root).forEach(function(frame){
          var modeAttr = frame.getAttribute("data-scroll");
          var mode = (modeAttr || "auto").toLowerCase();
          var content = frame.querySelector(".content");
          if(!content) return;

          stopProp(content);

          if(mode === "true"){ frame.setAttribute("data-scroll","true"); return; }
          if(mode === "false"){ frame.setAttribute("data-scroll","false"); return; }

          if(!isMeasurable(content)) return;

          var overflow = (content.scrollHeight - content.clientHeight) > 1;
          frame.setAttribute("data-scroll", overflow ? "true" : "auto");
        });

        var ctx = (root \&\& root.classList \&\& root.classList.contains("slide-frame")) ? root : (root || document);
        Array.prototype.slice.call(ctx.querySelectorAll(".card")).forEach(function(card){
          var modeAttr = card.getAttribute("data-scroll");
          var mode = (modeAttr || "auto").toLowerCase();
          var body = card.querySelector(".card-body");
          if(!body) return;

          stopProp(body);

          if(mode === "true"){ card.setAttribute("data-scroll","true"); return; }
          if(mode === "false"){ card.setAttribute("data-scroll","false"); return; }

          if(!isMeasurable(body)) return;

          var overflow = (body.scrollHeight - body.clientHeight) > 1;
          if(overflow){
            card.setAttribute("data-scroll","true");
          }else{
            if(modeAttr){ card.setAttribute("data-scroll","auto"); }
            else{ card.removeAttribute("data-scroll"); }
          }
        });
      }

      window.DeckOverflowFix = { refresh: function(root){
        requestAnimationFrame(function(){ applyOverflowFix(root || document); });
      } };

      function refreshAll(){ window.DeckOverflowFix.refresh(document); }

      window.addEventListener("load", function(){
        refreshAll();
        if(document.fonts \&\& document.fonts.ready){
          document.fonts.ready.then(refreshAll).catch(function(){});
        }
        Array.prototype.slice.call(document.querySelectorAll("img")).forEach(function(img){
          if(img \&\& !img.complete){
            img.addEventListener("load", refreshAll, { once:true });
            img.addEventListener("error", refreshAll, { once:true });
          }
        });
      });

      window.addEventListener("resize", function(){
        clearTimeout(window.\_\_deckOverflowFixTimer);
        window.\_\_deckOverflowFixTimer = setTimeout(refreshAll, 160);
      });
    })();

    // -------------------------
    // Minimal Deck Engine (v1.8)
    // - overview uses event delegation (no listener leak)
    // - remember last slide (optional)
    // - dynamic title (optional)
    // -------------------------
    (function(){
      var slides = Array.prototype.slice.call(document.querySelectorAll("#deck > .slide"));
      if(!slides.length) return;

      var CFG = {
        remember\_last\_slide: true,
        dynamic\_title: true,
        deck\_title: document.title || "Deck"
      };

      function storageAvailable(){
        try{ var k="\_\_t"; localStorage.setItem(k,"1"); localStorage.removeItem(k); return true; }
        catch(e){ return false; }
      }
      var hasLS = storageAvailable();
      function lsGet(k){ if(!hasLS) return null; try{ return localStorage.getItem(k); }catch(e){ return null; } }
      function lsSet(k,v){ if(!hasLS) return; try{ localStorage.setItem(k,v); }catch(e){} }

      var NS = "Deck\_v1.8\_" + CFG.deck\_title.replace(/\\s+/g,"\_");
      var KEY\_LAST = NS + "\_last";

      var current = 0;

      function indexByHash(){
        var id = (location.hash || "").replace("#","").trim();
        if(!id) return -1;
        for(var i=0;i<slides.length;i++){ if(slides\[i].id === id) return i; }
        return -1;
      }

      function getSlideTitle(idx){
        var h = slides\[idx].querySelector("h1,h2");
        return h ? (h.textContent || "").trim() : ("第 " + (idx+1) + " 頁");
      }

      function updateTitle(){
        if(!CFG.dynamic\_title) return;
        var t = getSlideTitle(current);
        document.title = CFG.deck\_title + "｜" + t;
      }

      // Dots
      var dotsEl = document.getElementById("dots");
      var dotNodes = \[];

      function buildDots(){
        if(!dotsEl) return;
        dotsEl.innerHTML = "";
        dotNodes = slides.map(function(s, i){
          var d = document.createElement("button");
          d.type = "button";
          d.className = "dot";
          d.title = "第 " + (i+1) + " 頁";
          d.setAttribute("aria-label", d.title);
          d.addEventListener("click", function(){
            document.body.classList.remove("overview");
            setActive(i);
          });
          dotsEl.appendChild(d);
          return d;
        });
      }

      function updateDots(){
        dotNodes.forEach(function(d, i){
          if(i === current){ d.classList.add("active"); d.setAttribute("aria-current","page"); }
          else{ d.classList.remove("active"); d.removeAttribute("aria-current"); }
        });
      }

      function updatePage(){
        var pi = document.getElementById("pageIndicator");
        if(pi) pi.textContent = (current+1) + "/" + slides.length;

        var prev = document.getElementById("prevBtn");
        var next = document.getElementById("nextBtn");
        var atStart = (current === 0);
        var atEnd = (current === slides.length - 1);
        if(prev){ prev.disabled = atStart; prev.setAttribute("aria-disabled", atStart ? "true" : "false"); }
        if(next){ next.disabled = atEnd; next.setAttribute("aria-disabled", atEnd ? "true" : "false"); }
      }

      function setActive(idx, opts){
        opts = opts || {};
        if(idx < 0) idx = 0;
        if(idx >= slides.length) idx = slides.length - 1;
        current = idx;

        slides.forEach(function(s, i){
          if(i === current) s.classList.add("active");
          else s.classList.remove("active");
        });

        if(!document.body.classList.contains("overview") \&\& !opts.noHash){
          history.replaceState(null, "", "#" + slides\[current].id);
        }

        if(CFG.remember\_last\_slide) lsSet(KEY\_LAST, String(current));
        updateDots();
        updatePage();
        updateTitle();

        try{ window.DeckOverflowFix \&\& window.DeckOverflowFix.refresh(slides\[current].querySelector(".slide-frame")); }catch(e){}
      }

      // Buttons
      var prevBtn = document.getElementById("prevBtn");
      var nextBtn = document.getElementById("nextBtn");
      var tocBtn = document.getElementById("tocBtn");
      var overviewBtn = document.getElementById("overviewBtn");
      var pdfBtn = document.getElementById("pdfBtn");

      if(prevBtn) prevBtn.addEventListener("click", function(){ document.body.classList.remove("overview"); setActive(current-1); });
      if(nextBtn) nextBtn.addEventListener("click", function(){ document.body.classList.remove("overview"); setActive(current+1); });
      if(tocBtn) tocBtn.addEventListener("click", function(){ document.body.classList.remove("overview"); setActive(0); }); // 依需求改成 TOC index
      if(pdfBtn) pdfBtn.addEventListener("click", function(){ window.print(); });

      if(overviewBtn){
        overviewBtn.addEventListener("click", function(){
          document.body.classList.toggle("overview");
          if(!document.body.classList.contains("overview")){
            setActive(current, {noHash:true});
          }
        });
      }

      // Overview click delegation (no listener leak)
      document.getElementById("deck").addEventListener("click", function(e){
        if(!document.body.classList.contains("overview")) return;
        var slide = e.target.closest \&\& e.target.closest(".slide");
        if(!slide) return;
        var idx = slides.indexOf(slide);
        if(idx < 0) return;
        document.body.classList.remove("overview");
        setActive(idx);
      });

      // Keyboard nav (avoid when typing)
      window.addEventListener("keydown", function(e){
        var tag = (document.activeElement \&\& document.activeElement.tagName || "").toLowerCase();
        var typing = (tag === "input" || tag === "textarea" || tag === "select");
        if(typing) return;

        if(e.key === "ArrowLeft"){ e.preventDefault(); document.body.classList.remove("overview"); setActive(current-1); }
        if(e.key === "ArrowRight"){ e.preventDefault(); document.body.classList.remove("overview"); setActive(current+1); }
        if(e.key === "Home"){ e.preventDefault(); document.body.classList.remove("overview"); setActive(0); }
        if(e.key === "End"){ e.preventDefault(); document.body.classList.remove("overview"); setActive(slides.length-1); }
      });

      // Hash change
      window.addEventListener("hashchange", function(){
        if(document.body.classList.contains("overview")) return;
        var idx = indexByHash();
        if(idx >= 0) setActive(idx, {noHash:true});
      });

      // Init (priority: hash > localStorage > 0)
      buildDots();
      var idx0 = indexByHash();
      if(idx0 < 0 \&\& CFG.remember\_last\_slide){
        var saved = parseInt(lsGet(KEY\_LAST) || "", 10);
        if(!isNaN(saved)) idx0 = saved;
      }
      setActive(idx0 >= 0 ? idx0 : 0, {noHash:true});
    })();
  </script>
</body>
</html>
```



---

## 16\. 輸出語言規範

* 文字輸出一律需經 `taiwan.md` 語言調校（台灣書面用語、避免 AI 語氣）
* 全文用字需一致（同一概念不要一頁叫「導入」、一頁叫「落地」）

---

