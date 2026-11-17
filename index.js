// 打孔海报 · SillyTavern 扩展版
(() => {
  // 扩展直接运行在酒馆主页面；保留这层兼容，便于与旧的酒馆助手版共用同一份代码。
  const window = globalThis.parent && globalThis.parent !== globalThis ? globalThis.parent : globalThis;
  const document = window.document;
  const { Image, FontFace, MutationObserver, SillyTavern, Path2D, DOMMatrix } = window;
  const requestAnimationFrame = window.requestAnimationFrame.bind(window);

  // 如果旧的酒馆助手版已经在运行，先卸载它，避免两套界面同时存在。
  if (typeof window.__pkDispose === 'function') window.__pkDispose();
  // 样式由 manifest.json 中的 style.css 加载，这里只清理旧版注入的 <style>。
  document.getElementById('pk-style')?.remove();

const MODULE = 'punch-poster';

const BASE = {
  pageSkin: 'punch',     // 打孔 / 独立出版版式 / 真实 App 静态仿界面
  skinImg: '',          // 独立版式图片
  skinImgScale: 1, skinImgX: 50, skinImgY: 50,
  // POSTYPE 手机网页阅读页：不设置的文案优先沿用当前角色与当前日期。
  postypeChannel: '',
  postypeAvatarMode: 'char', // char / user / custom / initial
  postypeAvatarImg: '',
  postypeDate: '',
  postypeShowAuthor: true,
  // AO3: the metadata panel is optional; content remains user-supplied.
  ao3ShowMetadata: true,
  ao3Rating: '',
  ao3Warning: '',
  ao3Category: '',
  ao3Fandom: '',
  ao3Relationship: '',
  ao3Characters: '',
  ao3Tags: '',
  ao3Language: '',
  ao3Collections: '',
  ao3Published: '',
  ao3Words: '',
  ao3Chapters: '',
  ao3Hits: '',
  ao3MetaLines: '', // 兼容旧版自由格式作品信息
  // One customizable Threads reply, independent of the main author's data.
  threadsShowComments: true,
  threadsReplyName: '',
  threadsReplyTime: '1天',
  threadsReplyText: '',
  threadsReplyAvatarMode: 'initial',
  threadsReplyAvatarImg: '',
  // iMessage only: optional photo message and independent contact avatar.
  imessageShowImage: false,
  imessageImage: '',
  imessageImageSide: 'right',
  imessageAvatarMode: 'system',
  imessageAvatarImg: '',

  layoutMode: 'double',     // double 双区 / single 纯正文打孔
  singleScraps: false,     // 单区是否在正文上叠放碎片（默认只有孔洞）
  scrapPos: 'top',          // 碎片区位置：top 在上 / bottom 在下
  width: 1080,              // 打孔导出宽度 / CSS 高清倍率基准
  cssPageWidth: 0,          // CSS 页面实际布局宽度（0 = 模板原宽），同时用于预览与 PNG 导出

  cssPaperOverride: false,
  paperColor: '#fbfaf6',    // 正文纸色（碎片就是从这张纸上剪的）
  paperTex: 'none',         // 正文纸纹理
  paperImg: '',             // 正文纸底图
  paperImgScale: 1,         // 图片缩放，1 = 默认铺满
  paperImgX: 50,           // 图片水平对齐，0 左 50 中 100 右
  paperImgY: 50,           // 图片垂直对齐，0 上 50 中 100 下
  ink: '#2b2b2b',           // 字色
  fontKey: 'songti',        // 字体，见下方 FONTS
  fontName: '',             // 上传的字体文件名
  fontSize: 46,             // 正文字号
  lineHeight: 2.0,          // 行距倍数
  letterSpacing: 0,         // 字距 px
  indent: false,            // 段首缩进两格
  padX: 84,                 // 左右边距
  padY: 100,                // 正文区上下留白
  textBoxWidth: 100,        // 单区正文栏宽度（占可用空间百分比）
  textBoxX: 50,             // 单区正文栏水平位置（0 左 100 右）
  textVAlign: 'middle',     // 单区正文垂直位置
  pubOn: false,            // 单区图文编排：标题、正文、图片、署名按块流动
  pubTitle: '',
  pubKicker: '',
  pubTitleSize: 1.75,
  pubTitleAlign: 'left',
  pubSigPosition: 'end',    // title 标题下 / end 正文后 / footer 页脚
  pubImages: [],          // 段落之间的插图，每项含 src/after/width/align/ratio/caption

  backColor: '#bdb9b1',     // 底板色（孔里透出来的也是它）
  backTex: 'linen',         // 底板纹理
  backImg: '',              // 碎片区域图片，缩放平移以碎片区为边界
  backImgScale: 1,          // 背景图缩放
  backImgX: 50,            // 背景图水平对齐
  backImgY: 50,            // 背景图垂直对齐
  textAlign: 'left',        // 正文对齐：left / center / right / justify 两端
  split: 0.45,              // 碎片区占纸张高度的比例（拖分界白条调整）

  holeShape: 'rough',       // 孔形：rough 毛边 / rect 方 / round 圆角 / circle 圆 / torn 撕纸
  holeSize: 1.0,            // 孔大小（相对字号）
  holeShade: true,          // 孔边阴影
  holeMode: 'back',         // 孔里显示：back 透出底板 / color 自定义颜色
  holeColor: '#3b3833',     // 自定义孔颜色

  arrange: 'rows',          // 碎片排列
  rowLimit: 6,              // 每行最多几个碎片，满行自动换行
  columnLimit: 5,           // 每列最多几个碎片，满列自动换列
  scrapScale: 1.0,          // 碎片相对孔的大小，1 = 和孔一样大
  scrapVar: 0.0,            // 碎片大小错落，0 = 全部一致
  scrapTilt: 0.12,          // 碎片最大倾斜（弧度）
  scrapShadow: true,        // 碎片阴影
  deco: 0,                  // 空白装饰碎片数量

  pubAuthor: '{{char}}',      // 全模板共用的作者（可修改）
  pubNote: '',              // 全模板共用的附注 / 题记，支持换行
  pubDate: '',              // 全模板共用日期，留空为今天
  sig1: '{{char}}',         // 署名第一行，可用 {{char}} {{user}} {{date}}，留空不显示
  sig2: '{{user}}',         // 署名第二行
  sig3: '',                 // 自定义第三行
  sig4: '',                 // 自定义第四行
  sigAlign: 'right',        // 署名对齐：left / center / right
  sigPlace: 'scrap',        // 文案位置：scrap 碎片区 / text 原文区
  sigSize: 0.56,            // 署名字号（相对正文字号）
  sigColor: '#555555',      // 文案颜色（文案在碎片区底部）
  repOn: false,             // 一键替换开关
  reps: [                   // 替换规则：from 原词 → to 替换成，{{char}} {{user}} 代表当前名字
    { from: '{{char}}', to: 'char' },
    { from: '{{user}}', to: 'user' },
  ],
  randomCount: 8,           // 随机挖几个
};

const SIG_KEYS = ['pubTitle', 'pubKicker', 'pubAuthor', 'pubNote', 'pubDate', 'sigAlign', 'sigPlace', 'sigSize', 'sigColor'];

const BUILTIN = {
  '麻布': {},
  '粉白散落': {
    scrapPos: 'bottom', arrange: 'scatter', holeShape: 'rect',
    paperColor: '#ffffff', backColor: '#e3d4d9', backTex: 'grain',
    fontKey: 'heiti',
    scrapScale: 1.2, scrapVar: 0.18, scrapTilt: 0.14, deco: 4,
  },
  '墨绿阶梯': {
    scrapPos: 'top', arrange: 'stairs', holeShape: 'rect',
    paperColor: '#465243', paperTex: 'canvas', ink: '#eeeee6',
    backColor: '#e6eae7', backTex: 'crumple', scrapTilt: 0.06, textAlign: 'justify', indent: true, sigColor: '#5d6b5a',
  },
  '牛皮纸': {
    paperColor: '#f4efe4', paperTex: 'fiber', backColor: '#b68f63', backTex: 'fiber',
    holeShape: 'shred', scrapVar: 0.28, scrapTilt: 0.2, arrange: 'scatter', deco: 2,
  },
  '方格本': {
    paperColor: '#fdfdfb', paperTex: 'grid', backColor: '#2f3a4a', backTex: 'grain', sigColor: '#c8ced8',
    fontKey: 'heiti', holeShape: 'round', scrapTilt: 0.05,
  },

  '旧报纸': {
    paperColor: '#eee0c6', paperTex: 'fiber', ink: '#382f28',
    backColor: '#ad987e', backTex: 'grain', sigColor: '#382f28',
    fontKey: 'notoserif', holeShape: 'torn', arrange: 'scatter', scrapTilt: 0.12,
  },
  '霜蓝信纸': {
    paperColor: '#edf4f7', paperTex: 'lines', ink: '#354c5e',
    backColor: '#9bb4c4', backTex: 'grain', sigColor: '#293e53',
    fontKey: 'notoseriftc', holeShape: 'round', scrapVar: 0.14,
  },
  '暗室黑稿': {
    layoutMode: 'single', singleScraps: false,
    paperColor: '#252830', paperTex: 'grain', ink: '#eeede7',
    backColor: '#0f131a', holeMode: 'color', holeColor: '#626879',
    sigColor: '#c3c8d1', sigPlace: 'text', fontKey: 'notoseriftc', holeShape: 'rough',
  },
  '铅灰复写': {
    paperColor: '#e6e9e8', paperTex: 'grid', ink: '#353a3b',
    backColor: '#444c53', backTex: 'halftone', sigColor: '#e9e9e3',
    fontKey: 'notosanstc', holeShape: 'shred', arrange: 'stairs', scrapTilt: 0.09,
  },
  '朱砂印记': {
    paperColor: '#f4e8df', paperTex: 'fiber', ink: '#553831',
    backColor: '#883f40', backTex: 'grain', sigColor: '#f1ddd0',
    holeMode: 'color', holeColor: '#b44e47', fontKey: 'kaiti', holeShape: 'rough',
  },
  '紫雾拼贴': {
    paperColor: '#f5f0f7', paperTex: 'none', ink: '#463b51',
    backColor: '#a79ab6', backTex: 'canvas', sigColor: '#332d42',
    holeShape: 'round', arrange: 'scatter', scrapScale: 1.12, scrapVar: 0.25,
  },
  '森林标本': {
    paperColor: '#edf0e3', paperTex: 'fiber', ink: '#344739',
    backColor: '#a7b4a0', backTex: 'linen', sigColor: '#354b39',
    fontKey: 'wenkai', holeShape: 'maple', arrange: 'stairs',
  },
  '棕褐胶片': {
    paperColor: '#f0e3d5', paperTex: 'grain', ink: '#4e392e',
    backColor: '#694b42', backTex: 'halftone', sigColor: '#f5e6d7',
    fontKey: 'notoserif', holeShape: 'rect', arrange: 'rows', scrapTilt: 0.03,
  },
  '深海蓝图': {
    paperColor: '#204866', paperTex: 'grid', ink: '#eef5fc',
    backColor: '#102d45', backTex: 'grain', sigColor: '#d4e4ee',
    holeMode: 'color', holeColor: '#85b4d1', holeShape: 'shred',
    fontKey: 'notosanstc', arrange: 'scatter', scrapVar: 0.2,
  },
  '粉色便笺': {
    layoutMode: 'single', singleScraps: false,
    paperColor: '#fae8ea', paperTex: 'grid', ink: '#624850',
    backColor: '#bc7e8e', holeMode: 'color', holeColor: '#d2a1ad',
    sigColor: '#734a59', sigPlace: 'text', fontKey: 'xiaowei', holeShape: 'round',
  },
  '荧光剪贴': {
    paperColor: '#fffdf3', paperTex: 'none', ink: '#242523',
    backColor: '#d7d9ce', backTex: 'halftone', sigColor: '#41433d',
    holeMode: 'color', holeColor: '#cbe64c', fontKey: 'notosans',
    holeShape: 'rect', arrange: 'scatter', scrapVar: 0.18,
  },
  '雾银单页': {
    layoutMode: 'single', singleScraps: false,
    paperColor: '#ebeeec', paperTex: 'linen', ink: '#374040',
    backColor: '#8d9a97', holeMode: 'color', holeColor: '#7c9998',
    sigPlace: 'text', sigColor: '#475655', fontKey: 'notoserif', holeShape: 'torn',
  },
};

const COLOR_RAIL = ['#25262a','#555b67','#2b4b70','#7dabc5','#3e6259','#95b29b','#735c8d','#b9a7cc','#9e3d46','#df7f73','#ad7754','#e1bf9e','#8f9594','#d6d2c9','#d6e450','#f8f5eb','#ffffff','#000000'];
function colorRail(key){
  return `<div class="pk-color-rail" aria-label="左右滑动选择颜色">${COLOR_RAIL.map(c=>`<button type="button" data-color-key="${key}" data-color-value="${c}" title="${c}" aria-label="选择颜色 ${c}" style="--pk-rail-color:${c}"></button>`).join('')}</div>`;
}


const COLOR_PAIRS = [
  {name:'素白',paper:'#ffffff',ink:'#25262a'},
  {name:'米纸',paper:'#fbfaf6',ink:'#2b2b2b'},
  ...Object.entries(BUILTIN).filter(([,p])=>p.paperColor&&p.ink)
    .map(([name,p])=>({name,paper:p.paperColor,ink:p.ink}))
];
function pairedColorRail(){
  return '<div class="pk-color-rail pk-pair-rail" aria-label="纸色与字色配色">'+COLOR_PAIRS.map((p,i)=>
    '<button type="button" data-color-pair="'+i+'" aria-label="'+esc(p.name)+'" title="'+esc(p.name)+'" style="--pk-rail-color:'+p.paper+';--pk-pair-ink:'+p.ink+'"><span>字</span></button>').join('')+'</div>';
}



const TEXT_LAYOUTS = {
  book: { title: '经典书页', fontSize: 44, lineHeight: 1.9, letterSpacing: 0, padX: 120, padY: 115, textAlign: 'justify', indent: true, textBoxWidth: 100, textBoxX: 50, textVAlign: 'middle' },
  poem: { title: '疏朗诗行', fontSize: 49, lineHeight: 2.7, letterSpacing: 3, padX: 140, padY: 135, textAlign: 'left', indent: false, textBoxWidth: 72, textBoxX: 22, textVAlign: 'middle' },
  center: { title: '中央独白', fontSize: 53, lineHeight: 2.25, letterSpacing: 2, padX: 140, padY: 130, textAlign: 'center', indent: false, textBoxWidth: 82, textBoxX: 50, textVAlign: 'middle' },
  narrow: { title: '窄栏文章', fontSize: 42, lineHeight: 2.0, letterSpacing: 1, padX: 135, padY: 100, textAlign: 'left', indent: true, textBoxWidth: 60, textBoxX: 25, textVAlign: 'top' },
  right: { title: '右侧手记', fontSize: 43, lineHeight: 2.25, letterSpacing: 1, padX: 145, padY: 110, textAlign: 'right', indent: false, textBoxWidth: 68, textBoxX: 100, textVAlign: 'middle' },
  bottom: { title: '低处题记', fontSize: 52, lineHeight: 2.15, letterSpacing: 2, padX: 155, padY: 145, textAlign: 'left', indent: false, textBoxWidth: 86, textBoxX: 50, textVAlign: 'bottom' },
  airy: { title: '通透留白', fontSize: 44, lineHeight: 2.75, letterSpacing: 6, padX: 95, padY: 150, textAlign: 'justify', indent: false, textBoxWidth: 100, textBoxX: 50, textVAlign: 'middle' },
  compact: { title: '密排档案', fontSize: 35, lineHeight: 1.45, letterSpacing: 0, padX: 85, padY: 100, textAlign: 'left', indent: false, textBoxWidth: 100, textBoxX: 50, textVAlign: 'top' },
};

const ZINE_LAYOUTS = {
  literary: { name:'文学杂志', pubTitleSize:1.95, pubTitleAlign:'left', pubSigPosition:'title', fontSize:44, lineHeight:1.9, padX:118, padY:105, textBoxWidth:100, textBoxX:50, textVAlign:'top', textAlign:'justify', indent:false },
  folio: { name:'艺术图录', pubTitleSize:1.32, pubTitleAlign:'center', pubSigPosition:'end', fontSize:40, lineHeight:2.15, padX:132, padY:120, textBoxWidth:92, textBoxX:50, textVAlign:'top', textAlign:'left', indent:false },
  notebook: { name:'私人小刊', pubTitleSize:1.56, pubTitleAlign:'left', pubSigPosition:'end', fontSize:45, lineHeight:2.25, padX:140, padY:120, textBoxWidth:76, textBoxX:5, textVAlign:'top', textAlign:'left', indent:false },
  catalogue: { name:'章节扉页', pubTitleSize:2.5, pubTitleAlign:'right', pubSigPosition:'title', fontSize:41, lineHeight:2.1, padX:116, padY:135, textBoxWidth:86, textBoxX:100, textVAlign:'top', textAlign:'left', indent:false },
};

const TEX = [
  ['none', '无'], ['grain', '颗粒'], ['linen', '麻布'], ['canvas', '帆布'], ['fiber', '纤维'],
  ['crumple', '褶皱'], ['grid', '方格'], ['lines', '横线'], ['dots', '点阵'], ['halftone', '网点'],
];

const HANG = '，。、！？；：”’）》」』…,.!?;:';
const NO_RANDOM = /[\s，。、！？；：“”‘’（）《》「」『』【】…—·～~,.!?;:'"()<>\[\]\-■]/;

const st = {
  zoom: 1, livePreview: true, lastTab: 'text', history: [], historyIndex: -1, historyLock: false, historyLastKey: '', historyLastAt: 0,
  base: '', custom: null, customIsRendered: false, raw: '', paraText: '', chars: [], holes: [],
  speaker: '', isUser: false, editing: false, seed: 0, boxes: [], pieces: [], off: {}, free: [], fid: 0, canvas: null, ov: null,
  lastOpenedChat: null, lastOpenedMessageId: null,
};
let rafId = 0;

const ctx = () => SillyTavern.getContext();
// Normalize once per settings object. A fresh object (undo/reset) is normalized
// again, but ordinary reads no longer replace a reference another handler uses.
const normalizedCur = new WeakSet();
function store() {
  const es = ctx().extensionSettings;
  if (!es[MODULE] || typeof es[MODULE] !== 'object' || Array.isArray(es[MODULE])) es[MODULE] = {};
  const s = es[MODULE];
  // Repair an incomplete backup without discarding previously imported CSS.
  if (!s.cur || typeof s.cur !== 'object' || Array.isArray(s.cur)) s.cur = {};
  for (const key of ['tpl','sigTpl','cssTpl','cssHidden'])
    if (!s[key] || typeof s[key] !== 'object' || Array.isArray(s[key])) s[key] = {};
  if (!normalizedCur.has(s.cur)) {
    s.cur = Object.assign(clone(BASE), clone(s.cur));
    normalizedCur.add(s.cur);
    // Restore safely even if an older import saved malformed lists.
    if(!Array.isArray(s.cur.reps))s.cur.reps=[];
    else s.cur.reps=s.cur.reps.filter(r=>r&&typeof r==='object'&&!Array.isArray(r))
      .slice(0,300).map(r=>({from:String(r.from??''),to:String(r.to??''),enabled:r.enabled!==false}));
    if(!Array.isArray(s.cur.pubImages))s.cur.pubImages=[];
    else s.cur.pubImages=s.cur.pubImages.filter(x=>x&&typeof x==='object'&&!Array.isArray(x))
      .slice(0,80).map(x=>({...x,src:typeof x.src==='string'?x.src:'',caption:typeof x.caption==='string'?x.caption:''}));
    // Broken/old presets must not crash image widgets via non-string URLs.
    for(const k of ['skinImg','paperImg','backImg','postypeAvatarImg','threadsReplyAvatarImg','imessageImage','imessageAvatarImg'])
      if(typeof s.cur[k]!=='string')s.cur[k]='';
    if(typeof s.cur.pageSkin!=='string')s.cur.pageSkin='punch';
    // Upgrade older positional signatures without modifying existing new fields.
    if (!s.cur.pkSharedCopyV32) {
      const old = s.cur;
      const titleValue = String(old.sig1 || '').trim();
      if (!old.pubTitle && titleValue && titleValue !== '{{char}}') old.pubTitle = titleValue;
      const leftover = [old.sig2, old.sig3, old.sig4]
        .filter((v, i) => v && String(v).trim() && !(i === 0 && v === '{{user}}'));
      if (!old.pubNote && leftover.length) old.pubNote = leftover.join('\n');
      old.pkSharedCopyV32 = true;
    }
    const legacy = s.cur.pageSkin || 'punch';
    if (legacy !== 'punch' && !String(legacy).startsWith('css:')) s.cur.pageSkin='css:'+legacy;
    if (legacy==='css:singlepage' && !s.cssTpl.singlepage) {
      s.cur.pageSkin='punch'; s.cur.layoutMode='single'; s.cur.singleScraps=false;
    }
    if (legacy==='css:blank' && !s.cssTpl.blank) s.cur.pageSkin='punch';
    delete s.cur.longPoster; delete s.cur.ratio;
  }
  return s;
}
const clone = o => JSON.parse(JSON.stringify(o || {}));
const cur = () => ctx().extensionSettings[MODULE].cur;
const persist = () => ctx().saveSettingsDebounced();
const toast = (t, m) => window.toastr && window.toastr[t](m);

// Content belongs to the current message, not the previously edited poster.
// Keep pageSkin, font, colors, layout, toggle preferences and saved presets.
// When a different message is opened, discard only the per-post input fields.
const FRESH_POST_FIELDS = [
  'pubTitle','pubKicker','pubAuthor','pubNote','pubDate',
  'postypeChannel','postypeDate','ao3Rating','ao3MetaLines',
  'ao3Warning','ao3Category','ao3Fandom','ao3Relationship','ao3Characters','ao3Tags','ao3Language','ao3Collections','ao3Published','ao3Words','ao3Chapters','ao3Hits',
  'threadsReplyName','threadsReplyTime','threadsReplyText',
  'threadsReplyAvatarImg','postypeAvatarImg',
  'imessageImage','imessageAvatarImg','skinImg','pubImages',
];
function beginMessageDraft(messageId) {
  const chat = ctx().chat;
  if(st.lastOpenedChat===chat && st.lastOpenedMessageId===messageId)return;
  const p=store().cur;
  for(const key of FRESH_POST_FIELDS){
    const value=BASE[key];
    p[key]=value&&typeof value==='object'?clone(value):(value??'');
  }
  st.lastOpenedChat=chat;
  st.lastOpenedMessageId=messageId;
  persist();
}


// 操作历史：撤销 / 重做只作用于当前海报，不会修改酒馆的原始消息。
function snapshot() {
  return {
    settings: clone(cur()), custom: st.custom, customIsRendered: !!st.customIsRendered,
    holes: clone(st.holes), free: clone(st.free), off: clone(st.off),
    seed: st.seed, fid: st.fid,
  };
}
function updateHistoryButtons() {
  if (!st.ov) return;
  const undo = st.ov.querySelector('[data-act="undo"]');
  const redo = st.ov.querySelector('[data-act="redo"]');
  if (undo) undo.disabled = st.historyIndex <= 0;
  if (redo) redo.disabled = st.historyIndex < 0 || st.historyIndex >= st.history.length - 1;
}
function historyPush(key = '') {
  if (st.historyLock || !st.ov || !isOpen()) return;
  const item = snapshot();
  const last = st.history[st.historyIndex];
  if (last && JSON.stringify(last) === JSON.stringify(item)) return;
  const now = Date.now();
  if (key && key === st.historyLastKey && now - st.historyLastAt < 450 && st.historyIndex > 0 && st.historyIndex === st.history.length - 1) {
    st.history[st.historyIndex] = item;
  } else {
    st.history = st.history.slice(0, st.historyIndex + 1);
    st.history.push(item);
    if (st.history.length > 35) st.history.shift();
    st.historyIndex = st.history.length - 1;
  }
  st.historyLastKey = key; st.historyLastAt = now;
  updateHistoryButtons();
}
function resetHistory() {
  st.history = [snapshot()];
  st.historyIndex = 0;
  st.historyLastKey = ''; st.historyLastAt = 0;
  updateHistoryButtons();
}
function historyTravel(delta) {
  const i = st.historyIndex + delta;
  if (i < 0 || i >= st.history.length) return;
  const item = clone(st.history[i]);
  st.historyLock = true;
  st.historyIndex = i;
  const settings = store();
  settings.cur = item.settings;
  st.custom = item.custom;
  st.customIsRendered = !!item.customIsRendered;
  buildText();
  st.holes = item.holes;
  st.free = item.free;
  st.off = item.off;
  st.seed = item.seed;
  st.fid = item.fid;
  persist();
  syncAll();
  schedule();
  st.historyLastKey = '';
  st.historyLock = false;
  updateHistoryButtons();
}

// 仅改变预览缩放比例，导出尺寸与海报数据保持不变。
function updatePreviewZoom(resetScroll = false) {
  const ov = st.ov;
  if (!ov || !st.canvas) return;
  const stage = ov.querySelector('.pk-stage');
  const cv = st.canvas;
  if (!stage) return;
  const label = ov.querySelector('.pk-zoom-label');
  if (label) label.textContent = st.zoom === 1 ? '适宽' : Math.round(st.zoom * 100) + '%';
  const outBtn = ov.querySelector('[data-act="zoom-out"]');
  const inBtn = ov.querySelector('[data-act="zoom-in"]');
  if (outBtn) outBtn.disabled = st.zoom <= 1;
  if (inBtn) inBtn.disabled = st.zoom >= 3;
  if(cssActive()){cssSize();if(resetScroll){stage.scrollTop=0;stage.scrollLeft=0;}return;}
  const cs = window.getComputedStyle(stage);
  const aw = Math.max(60, stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  const base = aw / Math.max(1, st.W || cv.width);
  const zoom = st.editing ? 1 : st.zoom;
  cv.style.setProperty('width', ((st.W || cv.width) * base * zoom).toFixed(1) + 'px', 'important');
  cv.style.setProperty('height', ((st.H || cv.height) * base * zoom).toFixed(1) + 'px', 'important');
  cv.style.maxWidth = 'none'; cv.style.maxHeight = 'none';
  cv.style.touchAction = !st.editing && zoom > 1 ? 'pan-x pan-y' : 'pan-y';
  if (resetScroll) { stage.scrollTop = 0; stage.scrollLeft = 0; }
  if (st.editing) updateEditorBounds();
}
function changeZoom(dir) {
  const levels = [1, 1.35, 1.8, 2.35, 3];
  let i = levels.findIndex(v => Math.abs(v - st.zoom) < 0.01);
  if (i < 0) i = 0;
  const next = dir === 0 ? 1 : levels[Math.max(0, Math.min(levels.length - 1, i + dir))];
  if (next === st.zoom) return;
  const stage = st.ov?.querySelector('.pk-stage');
  const visual=cssActive()?st.ov?.querySelector('.pk-css-holder'):st.canvas;
  const oldH = parseFloat(visual?.style.height) || visual?.getBoundingClientRect().height || 1;
  const oldW = parseFloat(visual?.style.width) || visual?.getBoundingClientRect().width || 1;
  const relativeY = stage ? (stage.scrollTop + stage.clientHeight / 2) / oldH : 0;
  const relativeX = stage ? (stage.scrollLeft + stage.clientWidth / 2) / oldW : 0;
  st.zoom = next;
  updatePreviewZoom(false);
  if (stage) {
    const newH = parseFloat(visual?.style.height) || oldH;
    const newW = parseFloat(visual?.style.width) || oldW;
    stage.scrollTop = Math.max(0, relativeY * newH - stage.clientHeight / 2);
    stage.scrollLeft = Math.max(0, relativeX * newW - stage.clientWidth / 2);
  }
}

const rnd = (i, s) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isOpen = () => !!(st.ov && st.ov.classList.contains('show'));
let keyboardRenderPending = false, keyboardRenderTimer = 0;
function schedule(force = false) {
  if (compositionFields.size || (keyboardIsOpen() && !st.editing) || (!force && (keyboardIsOpen() || Date.now() < keyboardCoolingUntil))) {
    keyboardRenderPending = true;
    // After the keyboard closes, flush the last deferred preview automatically.
    if (!keyboardIsOpen() && !keyboardRenderTimer) {
      keyboardRenderTimer = setTimeout(() => {
        keyboardRenderTimer = 0;
        if (keyboardRenderPending && !keyboardIsOpen()) schedule(true);
      }, Math.max(20, keyboardCoolingUntil - Date.now() + 16));
    }
    return;
  }
  keyboardRenderPending = false;
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    if(compositionFields.size || (keyboardIsOpen() && !st.editing)){keyboardRenderPending=true;return;}
    render(true); updatePreviewZoom();
  });
}

const texCache = new Map();
function texCanvas(kind) {
  if (texCache.has(kind)) return texCache.get(kind);
  const N = { crumple: 256, fiber: 128, halftone: 12, grid: 48, dots: 24, lines: 56 }[kind] || 64;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const q = c.getContext('2d');
  const wrap = fn => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { q.save(); q.translate(dx, dy); fn(); q.restore(); } };
  const noise = (n, a) => {
    for (let i = 0; i < n; i++) {
      q.fillStyle = rnd(i, 9) > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.7})`;
      q.fillRect(Math.floor(rnd(i, 7) * N), Math.floor(rnd(i, 8) * N), 1, 1);
    }
  };
  if (kind === 'grain') noise(N * N * 0.25, 0.09);
  if (kind === 'linen') {
    for (let i = 0; i < N; i += 4) {
      q.fillStyle = 'rgba(255,255,255,.15)'; q.fillRect(0, i, N, 1.5);
      q.fillStyle = 'rgba(0,0,0,.06)'; q.fillRect(i, 0, 1.5, N);
    }
    noise(260, 0.08);
  }
  if (kind === 'canvas') {
    for (let y = 0; y < N; y += 4) for (let x = 0; x < N; x += 4) {
      q.fillStyle = ((x + y) / 4) % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.09)';
      q.fillRect(x, y, 4, 4);
    }
    noise(500, 0.06);
  }
  if (kind === 'fiber') {
    noise(1200, 0.06);
    for (let i = 0; i < 160; i++) {
      const x = rnd(i, 31) * N, y = rnd(i, 32) * N, a = rnd(i, 33) * Math.PI, l = 4 + rnd(i, 34) * 14;
      const col = rnd(i, 35) > 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(60,40,20,.10)';
      wrap(() => { q.strokeStyle = col; q.lineWidth = 0.7; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); q.stroke(); });
    }
  }
  if (kind === 'crumple') {
    for (let i = 0; i < 46; i++) {
      const x = rnd(i, 41) * N, y = rnd(i, 42) * N, r = 20 + rnd(i, 43) * 80;
      const light = rnd(i, 44) > 0.5, a = 0.04 + rnd(i, 45) * 0.05;
      wrap(() => {
        const gr = q.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, light ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        q.fillStyle = gr; q.fillRect(x - r, y - r, r * 2, r * 2);
      });
    }
    for (let i = 0; i < 9; i++) {
      const x = rnd(i, 51) * N, y = rnd(i, 52) * N, a = rnd(i, 53) * Math.PI, l = 40 + rnd(i, 54) * 120;
      wrap(() => {
        q.lineWidth = 1.2;
        q.strokeStyle = 'rgba(255,255,255,.22)'; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); q.stroke();
        q.strokeStyle = 'rgba(0,0,0,.08)'; q.beginPath(); q.moveTo(x + 1.5, y + 1.5); q.lineTo(x + 1.5 + Math.cos(a) * l, y + 1.5 + Math.sin(a) * l); q.stroke();
      });
    }
    noise(4000, 0.05);
  }
  if (kind === 'grid') { q.fillStyle = 'rgba(0,0,0,.09)'; q.fillRect(0, 0, N, 1); q.fillRect(0, 0, 1, N); }
  if (kind === 'lines') { q.fillStyle = 'rgba(0,0,0,.10)'; q.fillRect(0, N - 1, N, 1); }
  if (kind === 'dots') { q.fillStyle = 'rgba(0,0,0,.18)'; q.beginPath(); q.arc(N / 2, N / 2, 1.4, 0, Math.PI * 2); q.fill(); }
  if (kind === 'halftone') { q.fillStyle = 'rgba(0,0,0,.08)'; q.beginPath(); q.arc(N / 2, N / 2, 2.6, 0, Math.PI * 2); q.fill(); }
  texCache.set(kind, c);
  return c;
}
function texSwatch(kind, color) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const q = c.getContext('2d');
  q.fillStyle = color; q.fillRect(0, 0, 96, 96);
  if (kind !== 'none') { q.fillStyle = q.createPattern(texCanvas(kind), 'repeat'); q.fillRect(0, 0, 96, 96); }
  return c.toDataURL();
}

const imgCache = new Map();
function imgOf(src) {
  if (typeof src!=='string' || !src.trim()) return null;
  src=src.trim();
  let e = imgCache.get(src);
  const now=Date.now();
  // A network error is not permanent: retry on a later render, but never
  // retry every animation frame for an invalid URL.
  if (e && e.failedAt && now-e.failedAt>=30000) imgCache.delete(src), e=null;
  if (!e) {
    e = { img: new Image(), ok: false, failedAt: 0 };
    if (!src.startsWith('data:')) e.img.crossOrigin = 'anonymous';
    e.img.onload = () => { e.ok = true; e.failedAt = 0; if (isOpen()) schedule(); };
    e.img.onerror = () => { e.failedAt = Date.now(); toast('warning', '图片加载失败（链接无效或不允许跨域）'); };
    e.img.src = src;
    imgCache.set(src, e);
    while(imgCache.size>18) imgCache.delete(imgCache.keys().next().value);
  }
  return e.ok ? e.img : null;
}

const GF = 'https://fonts.googleapis.com/css2?display=swap&family=';
const ZF = id => `https://fontsapi.zeoseven.com/${id}/main/result.css`;
// Curated reading/poster fonts. Previous IDs stay below as hidden options,
// so templates saved in older versions continue to render unchanged.
const FONTS = {
  songti: { name: '宋体', stack: '"Songti SC","STSong","Noto Serif SC","Source Han Serif SC",serif' },
  kinghwa: { name: '京华老宋', fam: 'KingHwaOldSong', css: ZF(309), stack: '"KingHwaOldSong","Songti SC",serif' },
  huiwen: { name: '汇文明朝', fam: 'Huiwen-mincho', css: ZF(256), stack: '"Huiwen-mincho","Songti SC",serif' },
  zhuque: { name: '朱雀仿宋', fam: 'Zhuque Fangsong (technical preview)', css: ZF(7), stack: '"Zhuque Fangsong (technical preview)","STFangsong","Songti SC",serif' },
  clearsong: { name: '屏显臻宋', fam: 'Clear Han Serif', css: ZF(79), stack: '"Clear Han Serif","Songti SC",serif' },
  chillhuo: { name: '寒蝉活宋', fam: 'ChillHuoSong_F', css: ZF(875), stack: '"ChillHuoSong_F","Songti SC",serif' },
  notoserif: { name: '思源宋体', fam: 'Noto Serif SC', css: GF + 'Noto+Serif+SC:wght@400', stack: '"Noto Serif SC",serif' },
  heiti: { name: '黑体', stack: '"PingFang SC","Heiti SC","Noto Sans SC","Microsoft YaHei",sans-serif' },
  notosans: { name: '思源黑体', fam: 'Noto Sans SC', css: GF + 'Noto+Sans+SC:wght@400', stack: '"Noto Sans SC",sans-serif' },
  taipei: { name: '台北黑体', fam: 'Taipei Sans TC Beta', css: ZF(2112), stack: '"Taipei Sans TC Beta","PingFang TC",sans-serif' },
  kaiti: { name: '楷体', stack: '"Kaiti SC","STKaiti","KaiTi",serif' },
  wenkai: { name: '霞鹜文楷', fam: 'LXGW WenKai', css: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css', stack: '"LXGW WenKai",serif' },
  yuangu: { name: '源古宋体', fam: 'YuanGuSong-TGC Book', css: ZF(612), stack: '"YuanGuSong-TGC Book","Songti SC",serif' },
  jinshu: { name: '寒蝉锦书宋', fam: '寒蝉锦书宋', css: ZF(2245), stack: '"寒蝉锦书宋","Songti SC",serif' },
  nano: { name: '纳米老宋', fam: 'NanoOldSong-A', css: ZF(467), stack: '"NanoOldSong-A","Songti SC",serif' },
  siyin: { name: '思印宋', fam: 'SiyinSong', css: ZF(892), stack: '"SiyinSong","Songti SC",serif' },
  duanhei: { name: '寒蝉端黑宋', fam: '寒蝉端黑宋Pro', css: ZF(366), stack: '"寒蝉端黑宋Pro","Songti SC",serif' },
  xinzhisong: { name: '霞鹜新致宋', fam: 'LXGW Neo ZhiSong', css: ZF(22), stack: '"LXGW Neo ZhiSong","Songti SC",serif' },
  huifang: { name: '汇文仿宋', fam: 'Huiwen-Fangsong', css: ZF(440), stack: '"Huiwen-Fangsong","STFangsong",serif' },
  huizheng: { name: '汇文正楷', fam: 'Huiwen-ZhengKai', css: ZF(438), stack: '"Huiwen-ZhengKai","STKaiti",serif' },
  coopkai: { name: '汇迹正楷', fam: 'CooperZhengKai', css: ZF(482), stack: '"CooperZhengKai","STKaiti",serif' },
  chillkai: { name: '寒蝉正楷', fam: 'ChillKai', css: ZF(5), stack: '"ChillKai","STKaiti",serif' },
  zhuokai: { name: '寒蝉拙楷', fam: '寒蝉拙楷体 R', css: ZF(2239), stack: '"寒蝉拙楷体 R","STKaiti",serif' },
  zhenkai: { name: '霞鹜臻楷', fam: 'LXGW ZhenKai GB', css: ZF(2), stack: '"LXGW ZhenKai GB","STKaiti",serif' },
  neoxihei: { name: '霞鹜新晰黑', fam: 'LXGW Neo XiHei', css: ZF(19), stack: '"LXGW Neo XiHei","PingFang SC",sans-serif' },
  yunmo: { name: '寒蝉云墨黑', fam: '寒蝉云墨黑B Medium', css: ZF(2254), stack: '"寒蝉云墨黑B Medium","PingFang SC",sans-serif' },
  jiangyuan: { name: '江城圆体', fam: 'JiangChengYuanTi', css: ZF(59), stack: '"JiangChengYuanTi","PingFang SC",sans-serif' },
  chillround: { name: '寒蝉全圆', fam: '寒蝉全圆体', css: ZF(3), stack: '"寒蝉全圆体","PingFang SC",sans-serif' },
  chillsemi: { name: '寒蝉半圆', fam: '寒蝉半圆体', css: ZF(243), stack: '"寒蝉半圆体","PingFang SC",sans-serif' },
  deyi: { name: '得意黑', fam: 'Smiley Sans Oblique', css: ZF(92), stack: '"Smiley Sans Oblique","PingFang SC",sans-serif' },
    upload: { name: '上传字体' },
  // Older saved templates may reference these keys; keep their definitions.
  xiaowei: { name: '站酷小薇', fam: 'ZCOOL XiaoWei', css: GF + 'ZCOOL+XiaoWei', stack: '"ZCOOL XiaoWei",serif', hidden: true },
  mashan: { name: '马善政', fam: 'Ma Shan Zheng', css: GF + 'Ma+Shan+Zheng', stack: '"Ma Shan Zheng",cursive', hidden: true },
  longcang: { name: '龙藏体', fam: 'Long Cang', css: GF + 'Long+Cang', stack: '"Long Cang",cursive', hidden: true },
  kuaile: { name: '快乐体', fam: 'ZCOOL KuaiLe', css: GF + 'ZCOOL+KuaiLe', stack: '"ZCOOL KuaiLe",sans-serif', hidden: true },
  notoseriftc: { name: '繁体明体', fam: 'Noto Serif TC', css: GF + 'Noto+Serif+TC:wght@400', stack: '"Noto Serif TC","Songti TC",serif', hidden: true },
  notosanstc: { name: '繁体黑体', fam: 'Noto Sans TC', css: GF + 'Noto+Sans+TC:wght@400', stack: '"Noto Sans TC","PingFang TC",sans-serif', hidden: true },
  qingke: { name: '青刻黄油', fam: 'ZCOOL QingKe HuangYou', css: GF + 'ZCOOL+QingKe+HuangYou', stack: '"ZCOOL QingKe HuangYou",sans-serif', hidden: true },
  zhigmang: { name: '志莽行书', fam: 'Zhi Mang Xing', css: GF + 'Zhi+Mang+Xing', stack: '"Zhi Mang Xing",cursive', hidden: true },
  liujian: { name: '毛草体', fam: 'Liu Jian Mao Cao', css: GF + 'Liu+Jian+Mao+Cao', stack: '"Liu Jian Mao Cao",cursive', hidden: true },
  notoserifhk: { name: '港式明体', fam: 'Noto Serif HK', css: GF + 'Noto+Serif+HK:wght@400', stack: '"Noto Serif HK","Songti TC",serif', hidden: true },
};
// Each font appears in only its most useful groups; saved font keys remain supported.
const FONT_CATS = {
  常用: ['songti','kinghwa','huiwen','notoserif','heiti','notosans','kaiti','wenkai','upload'],
  宋明: ['songti','kinghwa','huiwen','yuangu','jinshu','nano','siyin','duanhei','clearsong','chillhuo','xinzhisong','notoserif'],
  楷仿: ['kaiti','wenkai','zhuque','huifang','huizheng','coopkai','chillkai','zhuokai','zhenkai'],
  黑圆: ['heiti','notosans','taipei','neoxihei','yunmo','jiangyuan','chillround','chillsemi','deyi'],
};
function fontCategory(ov, cat) {
  if (!ov) return;
  const keys = new Set(FONT_CATS[cat] || FONT_CATS.常用);
  ov.querySelectorAll('[data-fontcat]').forEach(b => b.classList.toggle('on', b.dataset.fontcat === cat));
  ov.querySelectorAll('.pk-fonts [data-font]').forEach(b => { b.hidden = !keys.has(b.dataset.font); });
}

// Wait until the remote CSS has arrived before trying to load its font-face.
// On iOS, initiating document.fonts.load before the stylesheet exists can
// report empty results, leaving a silent serif fallback in the export.
const fontReady = new Set();
const fontPending = new Set();
function ensureFont(f, text) {
  if (!f?.css || !f.fam) return;
  const sample = (text || '字').slice(0, 160);
  const key = f.fam + '|' + sample;
  if (fontReady.has(key) || fontPending.has(key)) return;
  let link = [...document.querySelectorAll('link[data-pkfont]')].find(l => l.dataset.pkfont === f.fam);
  const load = () => {
    if (fontReady.has(key) || fontPending.has(key)) return;
    fontPending.add(key);
    document.fonts.load(`40px "${f.fam}"`, sample).then(faces => {
      if (faces.length) {
        fontReady.add(key);
        if (isOpen()) schedule();
      }
    }).catch(() => {}).finally(() => { fontPending.delete(key); });
  };
  if (!link) {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = f.css;
    link.dataset.pkfont = f.fam;
    link.addEventListener('load', () => { link.dataset.loaded = '1'; load(); }, { once: true });
    document.head.appendChild(link);
  } else if (link.dataset.loaded === '1') load();
  else link.addEventListener('load', load, { once: true });
}
const fontUp = { ok: false, loading: false };
function idb(mode, fn) {
  return new Promise((res,rej)=>{
    const rq=window.indexedDB.open('pk-poster',1);
    rq.onupgradeneeded=()=>{
      if(!rq.result.objectStoreNames.contains('f'))rq.result.createObjectStore('f');
    };
    rq.onerror=()=>rej(rq.error);
    rq.onsuccess=()=>{
      const db=rq.result;
      let tx;
      try{
        tx=db.transaction('f',mode);
        const request=fn(tx.objectStore('f'));
        tx.oncomplete=()=>{db.close();res(request?.result);};
        tx.onerror=()=>{db.close();rej(tx.error);};
        tx.onabort=()=>{db.close();rej(tx.error||new Error('字体存储中断'));};
      }catch(error){db.close();rej(error);}
    };
  });
}

async function useFontBuffer(buf) {
  const f = await new FontFace('PKUploadFont', buf).load();
  document.fonts.add(f);
  fontUp.ok = true;
}
function loadUploadFont() {
  if (fontUp.ok || fontUp.loading) return;
  fontUp.loading = true;
  idb('readonly', s => s.get('font')).then(buf => buf && useFontBuffer(buf)).then(() => { if (isOpen()) schedule(); })
    .catch(() => { }).finally(() => { fontUp.loading = false; });
}
function fontStack(p) {
  const base = FONTS.songti.stack;
  if (p.fontKey === 'upload') {
    loadUploadFont();
    return fontUp.ok ? `"PKUploadFont",${base}` : base;
  }
  const f = FONTS[p.fontKey] || FONTS.songti;
  ensureFont(f, [...new Set(st.chars)].join('') + sigLines(p).join(''));
  return f.stack;
}

function drawCover(g, img, x, y, w, h, scale = 1, posX = 50, posY = 50) {
  if (!img.width || !img.height || !w || !h) return;
  // Default scale=1 / position=50 matches the old centered cover behavior.
  const cover = Math.max(w / img.width, h / img.height);
  const z = Math.min(3, Math.max(0.5, +scale || 1));
  const iw = img.width * cover * z, ih = img.height * cover * z;
  const ax = Math.min(1, Math.max(0, (+posX || 0) / 100));
  const ay = Math.min(1, Math.max(0, (+posY || 0) / 100));
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.drawImage(img, x + (w - iw) * ax, y + (h - ih) * ay, iw, ih);
  g.restore();
}

function fillLayer(g, x, y, w, h, color, tex, img, imageStyle) {
  g.fillStyle = color; g.fillRect(x, y, w, h);
  if (img) drawCover(g, img, x, y, w, h,
    imageStyle?.scale ?? 1, imageStyle?.x ?? 50, imageStyle?.y ?? 50);
  if (tex && tex !== 'none') { g.fillStyle = g.createPattern(texCanvas(tex), 'repeat'); g.fillRect(x, y, w, h); }
}

const SVG_SHAPES = {
  diamond: 'M50 2 L98 50 L50 98 L2 50 Z',
  triangle: 'M50 4 L97 94 L3 94 Z',
  heart: 'M50 92 C20 72 2 54 2 33 C2 16 15 5 29 5 C39 5 46 11 50 19 C54 11 61 5 71 5 C85 5 98 16 98 33 C98 54 80 72 50 92 Z',
  drop: 'M50 2 C58 18 86 44 86 64 C86 84 70 98 50 98 C30 98 14 84 14 64 C14 44 42 18 50 2 Z',
  moon: 'M62 4 A46 46 0 1 0 96 70 A38 38 0 1 1 62 4 Z',
  cloud: 'M26 82 C12 82 2 72 2 59 C2 47 11 38 23 37 C25 22 37 11 52 11 C65 11 76 19 80 31 C91 33 98 43 98 55 C98 70 87 82 73 82 Z',
  bird: 'M2 38 C18 28 36 30 50 52 C64 30 82 28 98 38 C84 37 70 44 57 62 L50 72 L43 62 C30 44 16 37 2 38 Z',
  maple: 'M50 2 L58 18 L67 13 L64 33 L82 22 L79 34 L97 37 L85 48 L92 55 L69 61 L71 69 L53 64 L52 98 L48 98 L47 64 L29 69 L31 61 L8 55 L15 48 L3 37 L21 34 L18 22 L36 33 L33 13 L42 18 Z',
  butterfly: 'M50 32 C40 6 4 2 4 26 C4 44 28 48 45 50 C29 53 10 62 17 80 C24 98 45 82 50 62 C55 82 76 98 83 80 C90 62 71 53 55 50 C72 48 96 44 96 26 C96 2 60 6 50 32 Z',
};
const SHAPES = [
  ['rough', '毛边'], ['rect', '方'], ['round', '圆角'], ['circle', '圆'], ['torn', '撕纸'], ['shred', '碎撕'],
  ['diamond', '菱形'], ['triangle', '三角'], ['star', '星'], ['heart', '心'],
  ['drop', '水滴'], ['moon', '月亮'], ['cloud', '云'], ['flower', '花'], ['bird', '飞鸟'],
  ['maple', '枫叶'], ['butterfly', '蝴蝶'],
];
const baseCache = new Map();
function basePath(name) {
  if (baseCache.has(name)) return baseCache.get(name);
  let p;
  if (name === 'star') {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 20 : 48;
      d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (52 + Math.sin(a) * r).toFixed(1) + ' ';
    }
    p = new Path2D(d + 'Z');
  } else if (name === 'flower') {
    p = new Path2D();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5, cx = 50 + Math.cos(a) * 24, cy = 52 + Math.sin(a) * 24;
      p.moveTo(cx + 24, cy); p.arc(cx, cy, 24, 0, Math.PI * 2);
    }
  } else p = new Path2D(SVG_SHAPES[name] || SVG_SHAPES.diamond);
  baseCache.set(name, p);
  return p;
}
function shapePath(shape, x, y, w, h, k) {
  const P = new Path2D();
  if (shape === 'rect') { P.rect(x, y, w, h); return P; }
  if (shape === 'circle') { P.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); return P; }
  if (shape === 'round') {
    const r = Math.min(w, h) * 0.25;
    P.moveTo(x + r, y); P.arcTo(x + w, y, x + w, y + h, r); P.arcTo(x + w, y + h, x, y + h, r);
    P.arcTo(x, y + h, x, y, r); P.arcTo(x, y, x + w, y, r); P.closePath(); return P;
  }
  if (shape === 'torn' || shape === 'shred') {
    const dense = shape === 'shred';
    const n = dense ? 10 : 6;
    const edge = dense ? 0.22 : 0.12;
    const drift = dense ? 0.08 : 0.035;
    const pts = [];
    const pushEdge = (fx, fy, ex, ey, seedA, seedB) => {
      for (let t = 0; t < n; t++) {
        const u = t / n;
        const nx = fx + (ex - fx) * u;
        const ny = fy + (ey - fy) * u;
        const px = nx + (rnd(k * 41 + t, seedA) - 0.5) * drift;
        const py = ny + (rnd(k * 43 + t, seedB) - 0.5) * drift;
        const ox = ex === fx ? ((nx < .5 ? -1 : 1) * rnd(k * 47 + t, seedA + 10) * edge) : 0;
        const oy = ey === fy ? ((ny < .5 ? -1 : 1) * rnd(k * 53 + t, seedB + 10) * edge) : 0;
        pts.push([px + ox, py + oy]);
        if (dense && t < n - 1 && rnd(k * 59 + t, seedA + seedB) > 0.55) {
          const notch = 0.05 + rnd(k * 61 + t, seedA + 20) * 0.09;
          const tx = ex === fx ? px + ox * 0.2 + (nx < .5 ? notch : -notch) : px + (rnd(k * 67 + t, seedA + 30) - 0.5) * 0.05;
          const ty = ey === fy ? py + oy * 0.2 + (ny < .5 ? notch : -notch) : py + (rnd(k * 71 + t, seedB + 30) - 0.5) * 0.05;
          pts.push([tx, ty]);
        }
      }
    };
    pushEdge(0, 0, 1, 0, 1, 2);
    pushEdge(1, 0, 1, 1, 3, 4);
    pushEdge(1, 1, 0, 1, 5, 6);
    pushEdge(0, 1, 0, 0, 7, 8);
    pts.forEach(([a, b], i) => { const px = x + w * a, py = y + h * b; i ? P.lineTo(px, py) : P.moveTo(px, py); });
    P.closePath();
    if (dense) {
      const extra = 1 + Math.floor(rnd(k, 91) * 2);
      for (let e = 0; e < extra; e++) {
        const sx = x + (0.05 + rnd(k + e, 92) * 0.9) * w;
        const sy = y + (0.05 + rnd(k + e, 93) * 0.9) * h;
        const sw = w * (0.12 + rnd(k + e, 94) * 0.16);
        const sh = h * (0.1 + rnd(k + e, 95) * 0.15);
        const Q = new Path2D();
        const m = 5;
        for (let i = 0; i < m; i++) {
          const a = -Math.PI / 2 + i * (Math.PI * 2 / m);
          const rr = 0.35 + rnd(k + e * 3 + i, 96) * 0.28;
          const px = sx + Math.cos(a) * sw * rr;
          const py = sy + Math.sin(a) * sh * rr;
          i ? Q.lineTo(px, py) : Q.moveTo(px, py);
        }
        Q.closePath();
        P.addPath(Q);
      }
    }
    return P;
  }
  if (shape === 'rough') {
    const m = 0.05;
    [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([a, b], i) => {
      const px = x + w * (a + (a ? -1 : 1) * rnd(k * 7 + i, 21) * m);
      const py = y + h * (b + (b ? -1 : 1) * rnd(k * 7 + i, 22) * m);
      i ? P.lineTo(px, py) : P.moveTo(px, py);
    });
    P.closePath(); return P;
  }
  P.addPath(basePath(shape), new DOMMatrix([w / 100, 0, 0, h / 100, x, y]));
  return P;
}

function spacedText(g, text, x, y, sp, align) {
  const cs = Array.from(text), ws = cs.map(c => g.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (cs.length - 1);
  let sx = align === 'right' ? x - total : align === 'center' ? x - total / 2 : x;
  g.textAlign = 'left';
  cs.forEach((c, i) => { g.fillText(c, sx, y); sx += ws[i] + sp; });
}

function names() {
  const c = ctx();
  return { user: c.name1 || '', char: (!st.isUser && st.speaker) || c.name2 || '' };
}

// 本地繁简字形对应表（ICU Traditional-Simplified 单字映射），不联网。
const ZH_MAP_FROM = "㑳㘚㠏㠣㥮㩜㩳㼆䃮䊷䋙䋻䓣䝼䡵䥑䥕䬗䮄䯀䰾䱽䲁䲘䴉䶧丟並乾亂亙亞佇佈佔併來侖侶侷俁係俔俠俬俱倀倆倈倉個們倖倣倫偉側偵偽傑傖傘備傢傭傯傳傴債傷傾僂僅僇僉僑僕僞僤僥僨僱價儀儂億儈儉儐儔儕儘償優儲儷儸儺儻儼兇兌兒兗內兩冊冪凈凍凜凱別刪剄則剋剎剗剛剝剮剴創剷劃劇劉劊劌劍劏劑劚勁動勗務勛勝勞勢勣勩勱勳勵勸勻匭匯匱區協卹卻厙厠厭厲厴參叄叢吒吢吳吶呂咷咼員唄唚唸問啓啞啟啢喎喚喨喪喫喬單喲嗆嗇嗊嗎嗚嗩嗶嘆嘍嘔嘖嘗嘜嘩嘮嘯嘰嘵嘸嘽噁噓噚噝噠噥噦噯噲噴噸噹嚀嚇嚌嚐嚕嚙嚥嚦嚨嚮嚲嚳嚴嚶囀囁囂囅囈囉囍囑囓囪圇國圍園圓圖團垵埡埨埰執堅堊堖堝堯報場塊塋塏塒塗塚塢塤塵塸塹塿墊墜墠墮墳墶墻墾壇壋壎壓壘壙壚壜壞壟壠壢壩壪壯壺壼壽夠夢夥夾奐奧奩奪奬奮奼妝姊姍姦姪娙娛婁婦婭媧媯媼媽嫋嫗嫵嫻嫿嬀嬃嬈嬋嬌嬙嬝嬡嬤嬪嬰嬸孃孌孫學孿宮寢實寧審寫寬寵寶尅將專尋對導尷屆屍屓屜屢層屨屬岡峴島峽崍崑崗崙崢崬嵐嵽嶁嶄嶇嶔嶗嶠嶢嶧嶨嶮嶴嶸嶺嶼巋巒巔巖巘巰帥師帳帶幀幃幗幘幟幣幫幬幹幾庫廁廂廄廈廎廚廝廞廟廠廡廢廣廩廬廳廻弒弔弳張強彄彆彈彌彎彙彞彠彥彿後徑從徠復徬徵徹恆恥悅悞悳悵悶悽惡惱惲惻愛愜愨愴愷愾慄慇態慍慘慚慟慣慤慪慫慮慳慶慼慾憂憊憐憑憒憖憚憤憫憮憲憶懃懇應懌懍懞懟懣懨懮懲懶懷懸懺懼懾戀戇戔戧戩戰戱戲戶拋挩挾捨捫捲掃掄掗掙掛採揀揚換揮搆損搖搗搥搧搨搵搶搾摀摑摜摟摯摳摶摺摻撈撏撐撓撚撝撟撢撣撥撫撲撳撻撾撿擁擄擇擊擋擓擔據擠擣擬擯擰擱擲擴擷擺擻擼擾攄攆攏攔攖攙攛攜攝攢攣攤攪攬敗敘敵數斂斃斆斕斬斷於昇時晉晛晝暈暉暐暘暢暫暱曄曆曇曉曏曖曠曨曬書會朧東枒柵桿梔梘梜條梟梲棄棖棗棟棡棧棲棶椏楊楓楨業極榖榪榮榲榿構槍槓槖槤槧槨槳樁樂樅樑樓標樞樣樸樹樺橈橋機橢橫檁檉檔檜檝檟檢檣檮檯檳檸檻櫃櫍櫓櫚櫛櫝櫞櫟櫥櫧櫨櫪櫫櫬櫱櫳櫸櫺櫻欄權欏欒欓欖欞欵欽歎歐歛歟歡歲歷歸歿殘殞殤殨殫殮殯殰殲殺殼毀毆毬毿氂氈氌氣氫氬氳氹氾汎汙決沍沒沖況洩洶浹浿涇涼淒淚淥淨淪淵淶淺渙減渢渦測渾湊湋湞湧湯溈準溝溫溮溳溼滄滅滌滎滬滯滲滷滸滻滾滿漁漊漍漚漢漣漬漲漵漸漿潁潑潔潕潙潛潤潯潰潷潿澀澆澇澐澗澠澤澦澩澫澮澱濁濃濆濕濘濚濜濟濤濫濬濰濱濺濼濾瀂瀅瀆瀇瀉瀋瀏瀕瀘瀝瀟瀠瀦瀧瀨瀰瀲瀾灃灄灑灕灘灝灠灣灤灧災為烏烴無煉煒煙煢煥煩煬煱熅熒熗熰熱熲熾燀燁燄燈燉燐燒燖燙燜營燦燬燭燴燶燻燼燾燿爍爐爛爭爲爺爾牀牆牋牘牽犖犢犧狀狹狽猙猶猻獁獃獄獅獎獨獪獫獮獰獱獲獵獷獸獺獻獼玀現琺琿瑋瑒瑣瑤瑩瑪瑯瑲璉璊璕璗璡璣璦璫環璵璽瓅瓊瓏瓔瓚瓛甌甕產産畝畢畫異當疇疊痀痙痠痾瘂瘋瘍瘓瘞瘡瘧瘮瘲瘺瘻療癆癇癉癒癘癟癡癢癤癥癧癩癬癭癮癰癱癲發皁皚皰皸皺盃盜盞盡監盤盧盪眞眥眾睍睏睜睞睪瞇瞘瞜瞞瞭瞶瞼矓矚矯砲硏硜硤硨硯碩碭碸確碼磑磚磣磧磯磽磾礄礆礎礐礙礡礦礪礫礬礮礱祕祿禍禎禕禡禦禪禮禰禱禿秈稅稈稏稜稟種稱穀穇穌積穎穠穡穢穩穫穭窩窪窮窯窵窶窺竄竅竇竈竊竪競筆筍筧筴箇箋箎箏箝節範築篋篔篢篤篩篳簀簆簍簞簡簣簫簷簹簽簾籃籌籐籙籛籜籟籠籤籩籪籬籮籲粧粵糝糞糧糰糲糴糶糹糾紀紂紃約紅紆紇紈紉紋納紐紓純紕紖紗紘紙級紛紜紝紞紡紬紮細紱紲紳紵紹紺紼紿絀終絃組絅絆絎結絕絛絝絞絡絢給絨絪絰統絲絳絶絹絺綁綃綄綆綈綉綌綎綏綐綑經綖綜綝綞綠綡綢綣綧綪綫綬維綯綰綱網綳綴綵綸綹綺綻綽綾綿緄緇緊緋緑緒緓緔緗緘緙線緝緞締緡緣緦編緩緬緯緱緲練緶緹緻縈縉縊縋縐縑縕縗縛縝縞縟縣縧縫縭縮縯縱縲縳縴縵縶縷縹總績繃繅繆繒織繕繚繞繡繢繩繪繫繭繮繯繰繳繶繸繹繻繼繽繾繿纁纆纈纊續纍纏纓纔纕纖纘纜缽罃罈罌罎罣罰罵罷羅羆羈羋羣羥羨義羶習翫翬翹翺翽耬耮聖聞聯聰聲聳聵聶職聹聽聾肅脅脈脛脣脫脹腎腖腡腦腫腳腸膃膕膚膞膠膢膩膽膾膿臉臍臏臘臚臟臠臢臥臨臺與興舉舊舖艙艤艦艫艱艷芻苎苧茲荊荳莊莖莢莧菓華菸萇萊萬萵葉葒著葤葦葯葷蒍蒐蒓蒔蒞蒼蓀蓆蓋蓮蓯蓽蔄蔔蔞蔣蔥蔦蔭蔴蔿蕁蕆蕎蕒蕓蕕蕘蕢蕩蕪蕭蕷薀薈薊薌薑薔薘薟薦薩薳薴薺藉藍藎藝藥藪藭藴藶藷藹藺蘀蘄蘆蘇蘊蘋蘚蘞蘢蘭蘺蘿虆虉處虛虜號虧虯蛺蛻蜆蝀蝕蝟蝦蝨蝸螄螞螢螮螻螿蟄蟈蟎蟣蟬蟯蟲蟶蟻蠅蠆蠍蠐蠑蠔蠟蠣蠧蠨蠱蠶蠻衆衊術衚衛衝袞袴裊裏補裝裡製複褌褘褲褳褸褻襀襇襏襖襝襠襤襪襬襯襲襴覈見覎規覓視覘覡覥覦親覬覯覲覷覺覽覿觀觴觶觸訁訂訃計訊訌討訏訐訒訓訕訖託記訛訝訟訢訣訥訩訪設許訴訶診註証詁詆詎詐詒詔評詖詗詘詛詝詞詠詡詢詣試詩詪詫詬詭詮詰話該詳詵詷詼詿誄誅誆誇誌認誑誒誕誘誚語誠誡誣誤誥誦誨說説誰課誶誹誼誾調諂諄談諉請諍諏諑諒諓論諗諛諜諝諞諟諡諢諤諦諧諫諭諮諱諲諳諴諶諷諸諺諼諾謀謁謂謄謅謊謎謏謐謔謖謗謙謚講謝謠謡謨謫謬謭謳謹謾譁譅證譎譏譓譖識譙譚譜譞譟譫譯議譴護譸譽譾讀變讋讌讎讒讓讕讖讚讜讞豈豎豐豔豬豶貍貓貙貝貞貟負財貢貧貨販貪貫責貯貰貲貳貴貶買貸貺費貼貽貿賀賁賂賃賄賅資賈賊賑賒賓賕賙賚賜賞賠賡賢賣賤賦賧質賫賬賭賰賴賵賸賺賻購賽賾贄贅贇贈贊贋贍贏贐贓贔贖贗贛贜赬趕趙趨趲跡跤跼踐踡踰踴蹌蹕蹟蹣蹤蹧蹺躂躉躊躋躍躑躒躓躕躚躡躥躦躪軀車軋軌軍軏軑軒軔軛軝軟軤軫軲軸軹軺軻軼軾較輄輅輇輈載輊輋輒輓輔輕輗輛輜輝輞輟輥輦輩輪輬輮輯輳輶輸輻輾輿轀轂轄轅轆轉轍轎轔轝轟轡轢轤辦辭辮辯農迴逕這連週進遊運過達違遙遜遞遠適遯遲遷選遺遼邁還邇邊邏邐郟郵鄆鄉鄒鄔鄖鄧鄩鄭鄰鄲鄳鄴鄶鄺酇酈醃醖醜醞醫醬醱醲醼釀釁釃釅釋釐釒釓釔釕釗釘釙針釣釤釦釧釩釴釵釷釹釺釿鈀鈁鈃鈄鈇鈈鈉鈍鈎鈐鈑鈒鈔鈕鈞鈣鈥鈦鈧鈮鈰鈳鈴鈷鈸鈹鈺鈽鈾鈿鉀鉅鉈鉉鉊鉋鉍鉑鉕鉗鉚鉛鉝鉞鉢鉤鉥鉦鉧鉨鉬鉭鉮鉶鉷鉸鉺鉻鉿銀銃銅銈銍銑銓銖銘銚銛銜銠銣銥銦銨銩銪銫銬銱銲銳銶銷銹銻銼鋁鋃鋅鋇鋌鋏鋐鋒鋗鋙鋝鋟鋣鋤鋥鋦鋨鋩鋪鋭鋮鋯鋰鋱鋶鋸鋹鋼錀錁錄錆錇錈錏錐錒錕錘錙錚錛錞錟錠錡錢錤錦錨錩錫錮錯録錳錶錸鍀鍁鍃鍆鍇鍈鍊鍋鍍鍔鍘鍚鍛鍠鍤鍥鍩鍬鍭鍰鍵鍶鍺鍾鎂鎄鎇鎊鎓鎔鎖鎗鎘鎚鎛鎝鎡鎢鎣鎦鎧鎩鎪鎬鎮鎰鎲鎳鎵鎶鎸鎿鏃鏇鏈鏌鏍鏏鏐鏑鏗鏘鏜鏝鏞鏟鏡鏢鏤鏨鏰鏵鏷鏹鏺鏻鏽鐃鐄鐇鐋鐍鐏鐐鐒鐓鐔鐘鐙鐝鐠鐦鐧鐨鐩鐫鐮鐯鐲鐳鐵鐶鐸鐺鐽鐿鑄鑈鑊鑌鑑鑒鑔鑕鑞鑠鑣鑥鑪鑭鑰鑱鑲鑷鑹鑼鑽鑾鑿钁長門閂閃閆閈閉開閌閎閏閑閒間閔閘閡関閣閥閧閨閩閫閬閭閱閲閶閹閻閼閽閾閿闃闆闇闈闉闊闋闌闍闐闑闒闓闔闕闖闘關闞闠闡闢闤闥阨阪陘陝陞陣陰陳陸陽隄隉隊階隑隕際隤隨險隮隱隴隸隻雋雖雙雛雜雞離難雲電霑霢霧霽靂靄靆靈靉靚靜靦靨靷鞀鞏鞝鞽韁韃韉韋韌韍韓韙韜韞韡韮韻響頁頂頃項順頇須頊頌頍頎頏預頑頒頓頔頗領頜頠頡頤頦頫頭頮頰頲頴頵頷頸頹頻頽顆題額顎顏顒顓顔顗願顙顛類顢顥顧顫顬顯顰顱顳顴風颭颮颯颱颳颶颸颺颻颼飀飄飆飈飛飠飢飣飥飩飪飫飭飯飲飴飼飽飾飿餃餄餅餉養餌餎餏餑餒餓餕餖餗餘餚餛餜餞餡館餬餱餳餵餶餷餺餼餽餾餿饁饃饅饈饉饊饋饌饑饒饗饘饜饞饢馬馭馮馱馳馴馹馼駁駃駉駐駑駒駓駔駕駘駙駛駝駟駡駢駪駭駰駱駸駼駿騁騂騄騅騊騌騍騎騏騑騖騙騞騠騤騧騫騭騮騰騱騵騶騷騸騾驀驁驂驃驄驅驊驌驍驎驏驕驗驚驛驟驢驤驥驦驪驫骯髏髒體髕髖髮鬀鬆鬍鬚鬢鬥鬧鬨鬩鬭鬮鬱鬹魎魘魚魛魢魨魯魴魷魺鮀鮁鮃鮆鮈鮊鮋鮍鮎鮐鮑鮒鮓鮚鮜鮝鮞鮟鮠鮡鮣鮦鮪鮫鮭鮮鮳鮶鮸鮺鯀鯁鯇鯉鯊鯒鯔鯕鯖鯛鯝鯡鯢鯤鯧鯨鯪鯫鯰鯴鯷鯻鯽鯿鰁鰂鰃鰆鰈鰉鰊鰍鰏鰐鰒鰓鰜鰟鰠鰣鰤鰥鰧鰨鰩鰭鰮鰱鰲鰳鰵鰶鰷鰹鰺鰻鰼鰾鱀鱂鱅鱇鱈鱉鱒鱔鱖鱗鱘鱚鱝鱟鱠鱣鱤鱧鱨鱭鱯鱲鱷鱸鱺鳥鳧鳩鳬鳲鳳鳴鳶鳾鴆鴇鴉鴒鴕鴛鴝鴞鴟鴣鴦鴨鴯鴰鴴鴷鴻鴿鵁鵂鵃鵏鵐鵑鵒鵓鵜鵝鵟鵠鵡鵪鵬鵮鵯鵲鵷鵾鶄鶇鶉鶊鶓鶖鶘鶚鶠鶡鶥鶩鶪鶬鶯鶱鶲鶴鶹鶺鶻鶼鷀鷁鷂鷄鷈鷊鷓鷖鷗鷙鷚鷟鷥鷦鷫鷭鷯鷲鷳鷸鷹鷺鷽鷿鸂鸇鸌鸏鸑鸕鸘鸚鸛鸝鸞鹵鹹鹺鹼鹽麗麤麥麩麯麴麵麼麽黃黌點黨黲黴黶黷黽黿鼇鼈鼉鼕鼴齊齋齎齏齒齔齕齗齘齙齜齟齠齡齣齦齧齩齪齬齮齯齲齶齷齼龍龎龐龑龔龕龜𡑍𥗽𨧀𨨏𨭆𨭎";
const ZH_MAP_TO = "㑇㘎㟆𫵷㤘㨫㧐𬎆鿎䌶䌺䌾𬜯䞍𫟦鿏𬭯扬𫠊䯅鲃䲝鳚鳤鹮咬丢并干乱亘亚伫布占并来仑侣局俣系伣侠私具伥俩俫仓个们幸仿伦伟侧侦伪杰伧伞备家佣偬传伛债伤倾偻仅戮佥侨仆伪𫢸侥偾雇价仪侬亿侩俭傧俦侪尽偿优储俪㑩傩傥俨凶兑儿兖内两册幂净冻凛凯别删刭则克刹刬刚剥剐剀创铲划剧刘刽刿剑㓥剂㔉劲动勖务勋胜劳势𪟝勚劢勋励劝匀匦汇匮区协恤却厍厕厌厉厣参叁丛咤吣吴呐吕啕呙员呗吣念问启哑启唡㖞唤亮丧吃乔单哟呛啬唝吗呜唢哔叹喽呕啧尝唛哗唠啸叽哓呒啴𫫇嘘㖊咝哒哝哕嗳哙喷吨当咛吓哜尝噜啮咽呖咙向亸喾严嘤啭嗫嚣冁呓啰禧嘱啮囱囵国围园圆图团埯垭𫭢采执坚垩垴埚尧报场块茔垲埘涂冢坞埙尘𫭟堑𪣻垫坠𫮃堕坟垯墙垦坛垱埙压垒圹垆坛坏垄垅坜坝塆壮壶壸寿够梦伙夹奂奥奁夺奖奋姹妆姐姗奸侄𫰛娱娄妇娅娲妫媪妈袅妪妩娴婳妫媭娆婵娇嫱袅嫒嬷嫔婴婶娘娈孙学孪宫寝实宁审写宽宠宝克将专寻对导尴届尸屃屉屡层屦属冈岘岛峡崃昆岗仑峥岽岚𫶇嵝崭岖嵚崂峤峣峄峃崄岙嵘岭屿岿峦巅岩𪩘巯帅师帐带帧帏帼帻帜币帮帱干几库厕厢厩厦庼厨厮𫷷庙厂庑废广廪庐厅回弑吊弪张强𫸩别弹弥弯汇彝彟彦佛后径从徕复彷征彻恒耻悦悮德怅闷凄恶恼恽恻爱惬悫怆恺忾栗殷态愠惨惭恸惯悫怄怂虑悭庆戚欲忧惫怜凭愦慭惮愤悯怃宪忆勤恳应怿懔蒙怼懑恹忧惩懒怀悬忏惧慑恋戆戋戗戬战戯戏户抛捝挟舍扪卷扫抡挜挣挂采拣扬换挥构损摇捣捶扇拓揾抢榨捂掴掼搂挚抠抟折掺捞挦撑挠捻㧑挢掸掸拨抚扑揿挞挝捡拥掳择击挡㧟担据挤捣拟摈拧搁掷扩撷摆擞撸扰摅撵拢拦撄搀撺携摄攒挛摊搅揽败叙敌数敛毙敩斓斩断于升时晋𬀪昼晕晖𬀩旸畅暂昵晔历昙晓向暧旷昽晒书会胧东丫栅杆栀枧𬂩条枭棁弃枨枣栋㭎栈栖梾桠杨枫桢业极谷杩荣榅桤构枪杠橐梿椠椁桨桩乐枞梁楼标枢样朴树桦桡桥机椭横檩柽档桧楫槚检樯梼台槟柠槛柜𬃊橹榈栉椟橼栎橱槠栌枥橥榇蘖栊榉棂樱栏权椤栾𣗋榄棂款钦叹欧敛欤欢岁历归殁残殒殇㱮殚殓殡㱩歼杀壳毁殴球毵牦毡氇气氢氩氲凼泛泛污决冱没冲况泄汹浃𬇙泾凉凄泪渌净沦渊涞浅涣减沨涡测浑凑𣲗浈涌汤沩准沟温浉涢湿沧灭涤荥沪滞渗卤浒浐滚满渔溇𬇹沤汉涟渍涨溆渐浆颍泼洁𣲘沩潜润浔溃滗涠涩浇涝沄涧渑泽滪泶𬇕浍淀浊浓𣸣湿泞溁浕济涛滥浚潍滨溅泺滤澛滢渎㲿泻沈浏濒泸沥潇潆潴泷濑弥潋澜沣滠洒漓滩灏漤湾滦滟灾为乌烃无炼炜烟茕焕烦炀㶽煴荧炝𬉼热颎炽𬊤烨焰灯炖磷烧𬊈烫焖营灿毁烛烩㶶熏烬焘耀烁炉烂争为爷尔床墙笺牍牵荦犊牺状狭狈狰犹狲犸呆狱狮奖独狯猃狝狞㺍获猎犷兽獭献猕猡现珐珲玮玚琐瑶莹玛琅玱琏𫞩𬍤𬍡琎玑瑷珰环玙玺𬍛琼珑璎瓒𤩽瓯瓮产产亩毕画异当畴叠佝痉酸疴痖疯疡痪瘗疮疟瘆疭瘘瘘疗痨痫瘅愈疠瘪痴痒疖症疬癞癣瘿瘾痈瘫癫发皂皑疱皲皱杯盗盏尽监盘卢荡真眦众𪾢困睁睐睾眯眍䁖瞒了瞆睑眬瞩矫炮研硁硖砗砚硕砀砜确码硙砖碜碛矶硗䃅硚硷础𬒈碍礴矿砺砾矾炮砻秘禄祸祯祎祃御禅礼祢祷秃籼税秆䅉棱禀种称谷䅟稣积颖秾穑秽稳获稆窝洼穷窑窎窭窥窜窍窦灶窃竖竞笔笋笕䇲个笺篪筝钳节范筑箧筼𬕂笃筛筚箦筘篓箪简篑箫檐筜签帘篮筹藤箓篯箨籁笼签笾簖篱箩吁妆粤糁粪粮团粝籴粜纟纠纪纣𬘓约红纡纥纨纫纹纳纽纾纯纰纼纱纮纸级纷纭纴𬘘纺䌷扎细绂绁绅纻绍绀绋绐绌终弦组䌹绊绗结绝绦绔绞络绚给绒𬘡绖统丝绛绝绢𫄨绑绡𬘫绠绨绣绤𬘩绥䌼捆经𫄧综𬘭缍绿𫟅绸绻𬘯𬘬线绶维绹绾纲网绷缀彩纶绺绮绽绰绫绵绲缁紧绯绿绪绬绱缃缄缂线缉缎缔缗缘缌编缓缅纬缑缈练缏缇致萦缙缢缒绉缣缊缞缚缜缟缛县绦缝缡缩𬙂纵缧䌸纤缦絷缕缥总绩绷缫缪缯织缮缭绕绣缋绳绘系茧缰缳缲缴𫄷䍁绎𦈡继缤缱䍀𫄸𬙊缬纩续累缠缨才𬙋纤缵缆钵䓨坛罂坛挂罚骂罢罗罴羁芈群羟羡义膻习玩翚翘翱翙耧耢圣闻联聪声耸聩聂职聍听聋肃胁脉胫唇脱胀肾胨脶脑肿脚肠腽腘肤䏝胶𦝼腻胆脍脓脸脐膑腊胪脏脔臜卧临台与兴举旧铺舱舣舰舻艰艳刍苧苎兹荆豆庄茎荚苋果华烟苌莱万莴叶荭着荮苇药荤𫇭搜莼莳莅苍荪席盖莲苁荜𬜬卜蒌蒋葱茑荫麻𫇭荨蒇荞荬芸莸荛蒉荡芜萧蓣蕰荟蓟芗姜蔷荙莶荐萨䓕苧荠借蓝荩艺药薮䓖蕴苈薯蔼蔺萚蕲芦苏蕴苹藓蔹茏兰蓠萝蔂𬟁处虚虏号亏虬蛱蜕蚬𬟽蚀猬虾虱蜗蛳蚂萤䗖蝼螀蛰蝈螨虮蝉蛲虫蛏蚁蝇虿蝎蛴蝾蚝蜡蛎蠹蟏蛊蚕蛮众蔑术胡卫冲衮绔袅里补装里制复裈袆裤裢褛亵𫌀裥袯袄裣裆褴袜䙓衬袭襕核见觃规觅视觇觋觍觎亲觊觏觐觑觉览觌观觞觯触讠订讣计讯讧讨𬣙讦讱训讪讫托记讹讶讼䜣诀讷讻访设许诉诃诊注证诂诋讵诈诒诏评诐诇诎诅𬣞词咏诩询诣试诗𬣳诧诟诡诠诘话该详诜𫍣诙诖诔诛诓夸志认诳诶诞诱诮语诚诫诬误诰诵诲说说谁课谇诽谊訚调谄谆谈诿请诤诹诼谅𬣡论谂谀谍谞谝𬤊谥诨谔谛谐谏谕谘讳𬤇谙𫍯谌讽诸谚谖诺谋谒谓誊诌谎谜𫍲谧谑谡谤谦谥讲谢谣谣谟谪谬谫讴谨谩哗䜧证谲讥𬤝谮识谯谭谱𫍽噪谵译议谴护诪誉谫读变詟䜩雠谗让谰谶赞谠谳岂竖丰艳猪豮狸猫䝙贝贞贠负财贡贫货贩贪贯责贮贳赀贰贵贬买贷贶费贴贻贸贺贲赂赁贿赅资贾贼赈赊宾赇赒赉赐赏赔赓贤卖贱赋赕质赍账赌䞐赖赗剩赚赙购赛赜贽赘赟赠赞赝赡赢赆赃赑赎赝赣赃赪赶赵趋趱迹交局践蜷逾踊跄跸迹蹒踪糟跷跶趸踌跻跃踯跞踬蹰跹蹑蹿躜躏躯车轧轨军𫐄轪轩轫轭𬨂软轷轸轱轴轵轺轲轶轼较𨐈辂辁辀载轾𪨶辄挽辅轻𫐐辆辎辉辋辍辊辇辈轮辌𫐓辑辏𬨎输辐辗舆辒毂辖辕辘转辙轿辚舆轰辔轹轳办辞辫辩农回迳这连周进游运过达违遥逊递远适遁迟迁选遗辽迈还迩边逻逦郏邮郓乡邹邬郧邓𬩽郑邻郸𫑡邺郐邝酂郦腌酝丑酝医酱酦𬪩宴酿衅酾酽释厘钅钆钇钌钊钉钋针钓钐扣钏钒𬬩钗钍钕钎𬬱钯钫钘钭𫓧钚钠钝钩钤钣钑钞钮钧钙钬钛钪铌铈钶铃钴钹铍钰钸铀钿钾钜铊铉𬬿铇铋铂钷钳铆铅𫟷钺钵钩𬬸钲𬭁鿭钼钽𬬹铏𫟹铰铒铬铪银铳铜𫓯铚铣铨铢铭铫铦衔铑铷铱铟铵铥铕铯铐铞焊锐𨱇销锈锑锉铝锒锌钡铤铗𬭎锋𫓶铻锊锓铘锄锃锔锇铓铺锐铖锆锂铽锍锯𬬮钢𬬭锞录锖锫锩铔锥锕锟锤锱铮锛𬭚锬锭锜钱𫓹锦锚锠锡锢错录锰表铼锝锨锪钔锴锳炼锅镀锷铡钖锻锽锸锲锘锹𬭤锾键锶锗钟镁锿镅镑𬭩镕锁枪镉锤镈𨱏镃钨蓥镏铠铩锼镐镇镒镋镍镓鿔镌镎镞镟链镆镙𬭬镠镝铿锵镗镘镛铲镜镖镂錾镚铧镤镪䥽𬭸锈铙𨱑𫔍铴𫔎𨱔镣铹镦镡钟镫镢镨锎锏镄𬭼镌镰䦃镯镭铁镮铎铛𫟼镱铸鿭镬镔鉴鉴镲锧镴铄镳镥𬬻镧钥镵镶镊镩锣钻銮凿䦆长门闩闪闫闬闭开闶闳闰闲闲间闵闸阂关阁阀哄闺闽阃阆闾阅阅阊阉阎阏阍阈阌阒板暗闱𬮱阔阕阑阇阗𫔶阘闿阖阙闯斗关阚阓阐辟阛闼厄坂陉陕升阵阴陈陆阳堤陧队阶𬮿陨际𬯎随险𬯀隐陇隶只隽虽双雏杂鸡离难云电沾霡雾霁雳霭叇灵叆靓静腼靥纼鼗巩绱鞒缰鞑鞯韦韧韨韩韪韬韫𮧵韭韵响页顶顷项顺顸须顼颂𫠆颀颃预顽颁顿𬱖颇领颌𬱟颉颐颏𫖯头颒颊颋颕𫖳颔颈颓频颓颗题额颚颜颙颛颜𫖮愿颡颠类颟颢顾颤颥显颦颅颞颧风飐飑飒台刮飓飔飏飖飕飗飘飙飚飞饣饥饤饦饨饪饫饬饭饮饴饲饱饰饳饺饸饼饷养饵饹饻饽馁饿馂饾𫗧余肴馄馃饯馅馆糊糇饧喂馉馇馎饩馈馏馊馌馍馒馐馑馓馈馔饥饶飨𫗴餍馋馕马驭冯驮驰驯驲𫘜驳𫘝𬳶驻驽驹𬳵驵驾骀驸驶驼驷骂骈𬳽骇骃骆骎𬳿骏骋骍𫘧骓𫘦骔骒骑骐𬴂骛骗𬴃𫘨骙䯄骞骘骝腾𫘬𫘪驺骚骟骡蓦骜骖骠骢驱骅骕骁𬴊骣骄验惊驿骤驴骧骥骦骊骉肮髅脏体髌髋发剃松胡须鬓斗闹哄阋斗阄郁鬶魉魇鱼鱽鱾鲀鲁鲂鱿鲄𬶍鲅鲆𫚖𬶋鲌鲉鲏鲇鲐鲍鲋鲊鲒鲘鲞鲕𩽾𬶏𬶐䲟鲖鲔鲛鲑鲜鲓鲪𩾃鲝鲧鲠鲩鲤鲨鲬鲻鲯鲭鲷鲴鲱鲵鲲鲳鲸鲮鲰鲶鲺鳀𬶟鲫鳊鳈鲗鳂䲠鲽鳇𬶠鳅鲾鳄鳆鳃鳒鳑鳋鲥𫚕鳏䲢鳎鳐鳍鳁鲢鳌鳓鳘𬶭鲦鲣鲹鳗鳛鳔𬶨鳉鳙𩾌鳕鳖鳟鳝鳜鳞鲟𬶮鲼鲎鲙鳣鳡鳢鲿鲚鳠𫚭鳄鲈鲡鸟凫鸠凫鸤凤鸣鸢䴓鸩鸨鸦鸰鸵鸳鸲鸮鸱鸪鸯鸭鸸鸹鸻䴕鸿鸽䴔鸺鸼𬷕鹀鹃鹆鹁鹈鹅𫛭鹄鹉鹌鹏鹐鹎鹊鹓鹍䴖鸫鹑鹒鹋鹙鹕鹗𬸘鹖鹛鹜䴗鸧莺𬸣鹟鹤鹠鹡鹘鹣鹚鹢鹞鸡䴘鹝鹧鹥鸥鸷鹨𬸦鸶鹪鹔𬸪鹩鹫鹇鹬鹰鹭鸴䴙㶉鹯鹱鹲𬸚鸬鹴鹦鹳鹂鸾卤咸鹾碱盐丽粗麦麸曲麹面么么黄黉点党黪霉黡黩黾鼋鳌鳖鼍冬鼹齐斋赍齑齿龀龁龂𬹼龅龇龃龆龄出龈啮咬龊龉𬺈𫠜龋腭龌𬺓龙厐庞䶮龚龛龟𫭼𬒗𬭊𬭛𬭶𬭳";
const ZH_MAP_FROM_CHARS = Array.from(ZH_MAP_FROM);
const ZH_MAP_TO_CHARS = Array.from(ZH_MAP_TO);
const ZH_FOLD = new Map(ZH_MAP_FROM_CHARS.map((ch, i) => [ch, ZH_MAP_TO_CHARS[i]]));
function repKey(ch) {
  return (ZH_FOLD.get(ch) || ch).toLowerCase();
}

// 只做匹配时的繁简、大小写归一，保持原文其他字和替换结果原样。
function replaceAnyCaseScript(text, from, to) {
  const needle = Array.from(from).map(repKey);
  if (!needle.length) return text;
  const input = Array.from(text), folded = input.map(repKey), result = [];
  for (let i = 0; i < input.length;) {
    let matched = i + needle.length <= input.length;
    for (let j = 0; matched && j < needle.length; j++) {
      if (folded[i + j] !== needle[j]) matched = false;
    }
    if (matched) { result.push(to); i += needle.length; }
    else { result.push(input[i]); i++; }
  }
  return result.join('');
}

function applyReps(t) {
  const p = cur();
  if (!p.repOn || !Array.isArray(p.reps)) return t;
  const n = names();
  const res = v => (v || '').replace(/{{char}}/gi, n.char).replace(/{{user}}/gi, n.user);
  p.reps.filter(r => r && r.enabled !== false).map(r => [res(r.from).trim(), res(r.to)]).filter(([f]) => f)
    .sort((a, b) => Array.from(b[0]).length - Array.from(a[0]).length)
    .forEach(([f, to]) => { t = replaceAnyCaseScript(t, f, to); });
  return t;
}

function normalizeParagraphs(t) {
  // Unicode U+2029 is a paragraph boundary; U+2028 is a soft line break.
  return String(t || '').replace(/\r\n?/g, '\n')
    .replace(/\u2029/g, '\n\n').replace(/\u2028/g, '\n')
    .replace(/[ \t\u3000]+\n/g, '\n').trim();
}
function normalize(t) {
  // Keep the historical one-newline representation for Canvas and favorites.
  return normalizeParagraphs(t).replace(/\n{2,}/g, '\n');
}
function buildText() {
  const source = st.custom != null ? st.custom : st.base;
  // Keep Canvas normalization independent of CSS paragraph rendering.
  const raw = normalize(source);
  const rendered = normalize(st.custom != null && st.customIsRendered ? raw : applyReps(raw));
  if (raw !== st.raw || rendered !== st.chars.join('')) {
    st.holes = []; st.off = {}; st.free = [];
  }
  st.raw = raw;
  st.chars = Array.from(rendered);
  // Imported CSS still receives the original paragraph breaks.
  const paragraphs = normalizeParagraphs(source);
  st.paraText = normalizeParagraphs(st.custom != null && st.customIsRendered
    ? paragraphs : applyReps(paragraphs));
}

function sharedCopy(p) {
  const n = names(), d = new Date().toLocaleDateString('zh-CN');
  const expand = t => String(t ?? '').replace(/{{char}}/gi, n.char).replace(/{{user}}/gi, n.user).replace(/{{date}}/gi, d).trim();
  return {
    title: expand(p.pubTitle) || n.user || '未命名作品',
    subtitle: expand(p.pubKicker),
    author: expand(p.pubAuthor) || n.char || '作者',
    note: expand(p.pubNote),
    date: expand(p.pubDate) || expand(p.postypeDate) || d,
  };
}
function sigLines(p) {
  const m = sharedCopy(p);
  // One semantic record for punch poster and every imported CSS layout.
  // Dates are available as a CSS slot, but not forced into punch artwork.
  return [m.title, m.subtitle, ...m.note.split('\n'), m.author].filter(Boolean);
}

function layoutText(g, p, font, W, fsx) {
  const fs = fsx || +p.fontSize, ls = +p.letterSpacing, lh = fs * p.lineHeight;
  const usable = Math.max(20, W - 2 * p.padX);
  const single = p.layoutMode === 'single';
  const widthFactor = single ? Math.min(100, Math.max(45, +p.textBoxWidth || 100)) / 100 : 1;
  const maxW = usable * widthFactor;
  const boxX = +p.padX + (usable - maxW) * (single ? Math.min(100, Math.max(0, +p.textBoxX || 0)) / 100 : 0);
  g.font = `${fs}px ${font}`;
  const paras = [[]];
  st.chars.forEach((ch, i) => { if (ch === '\n') paras.push([]); else paras[paras.length - 1].push(i); });
  const lines = [];
  const paraEnds = [];
  paras.forEach(pi => {
    let x = p.indent ? fs * 2 + ls * 2 : 0;
    let line = { items: [], last: false };
    lines.push(line);
    pi.forEach(i => {
      const ch = st.chars[i], w = g.measureText(ch).width;
      if (line.items.length && x + w > maxW && !HANG.includes(ch)) { x = 0; line = { items: [], last: false }; lines.push(line); }
      line.items.push({ i, ch, w, x });
      x += w + ls;
    });
    line.last = true;
    paraEnds.push(lines.length);
  });
  const boxes = [];
  lines.forEach((ln, li) => {
    const n = ln.items.length;
    let extra = 0;
    if (p.textAlign === 'justify' && !ln.last && n > 1) {
      const e = ln.items[n - 1];
      extra = Math.max(0, (maxW - (e.x + e.w)) / (n - 1));
    }
    let off = 0;
    if (n && !extra) {
      const e = ln.items[n - 1], lw = e.x + e.w - (ln.items[0].x);
      off = ['center', 'right'].includes(p.textAlign) ? (maxW - lw) * (p.textAlign === 'center' ? 0.5 : 1) - ln.items[0].x : 0;
    }
    ln.items.forEach((it, j) => { it.ax = boxX + it.x + extra * j + off; it.line = li; boxes.push(it); });
  });
  return { boxes, lh, h: lines.length * lh, lineCount: lines.length, paraEnds, boxX, boxW: maxW };
}


// Editorial composition on a single paper: insertion boxes shift subsequent
// paragraphs. Original text indices remain unchanged for punching/hit testing.
function wrapEditorial(g, text, font, size, maxW) {
  g.font = `${size}px ${font}`;
  const lines = [''];
  for (const c of Array.from(String(text || ''))) {
    const last = lines.length - 1;
    if (c === '\n') { lines.push(''); continue; }
    if (lines[last] && g.measureText(lines[last] + c).width > maxW) lines.push(c);
    else lines[last] += c;
  }
  return lines;
}
function layoutEditorial(g, p, T, fs, font, sigFs, sigLH, sigs) {
  if (p.layoutMode !== 'single' || !p.pubOn || st.editing) return T;
  const gap = fs * 0.48;
  const blocks = [];
  let shift = 0;
  const add = (b, h) => { b.y = shift; blocks.push(b); shift += h; };
  const maxW = T.boxW;
  if (p.pubKicker?.trim()) {
    const sz = Math.max(15, fs * 0.57);
    const lines = wrapEditorial(g, p.pubKicker.trim(), font, sz, maxW);
    add({type:'heading', lines, size:sz, color:p.sigColor, align:p.pubTitleAlign, lineH:sz*1.45}, lines.length * sz * 1.45 + gap*0.65);
  }
  if (p.pubTitle?.trim()) {
    const sz = fs * Math.max(1.1, Math.min(3, +p.pubTitleSize || 1.75));
    const lines = wrapEditorial(g, p.pubTitle.trim(), font, sz, maxW);
    add({type:'heading', lines, size:sz, color:p.ink, align:p.pubTitleAlign, lineH:sz*1.2}, lines.length * sz * 1.2 + gap);
  }
  const sigBlockH = sigs.length ? sigLH*sigs.length + gap : 0;
  if (sigs.length && p.pubSigPosition === 'title') add({type:'signature',lines:sigs.slice(),size:sigFs,lineH:sigLH},sigBlockH);
  // Photographs use a block model; images inserted after paragraph N affect
  // the positions of every subsequent glyph and remain inside the text column.
  const events = new Map();
  const photos = Array.isArray(p.pubImages) ? p.pubImages.slice(0,8) : [];
  photos.forEach(pic => {
    if (!pic?.src) return;
    const at = Math.min(T.paraEnds.length, Math.max(0, Math.floor(+pic.after || 0)));
    const line = at === 0 ? 0 : T.paraEnds[at-1];
    const w = maxW * Math.min(1,Math.max(.3,(+pic.width||80)/100));
    const im = imgOf(pic.src);
    const ar = pic.ratio === 'natural' && im?.width && im?.height ? im.width/im.height : ({'1:1':1,'4:3':4/3,'16:9':16/9,'3:4':3/4}[pic.ratio] || 4/3);
    const h = Math.min(2400, w / ar);
    const capSize = Math.max(14,fs*.43);
    const caps = pic.caption?.trim() ? wrapEditorial(g,pic.caption.trim(),font,capSize,w) : [];
    const capH = caps.length ? caps.length*capSize*1.6 + gap*.2 : 0;
    const block = {type:'photo', pic, w, h, capSize, caps, capH, align:pic.align||'center'};
    if (!events.has(line)) events.set(line, []);
    events.get(line).push(block);
  });
  const lineShifts = [];
  // "shift" includes heading and inline byline before the first paragraph.
  for (let li=0; li<=T.lineCount; li++) {
    const before = events.get(li) || [];
    for (const imageBlock of before) {
      imageBlock.y = li*T.lh + shift + gap*.45;
      blocks.push(imageBlock);
      shift += imageBlock.h + imageBlock.capH + gap*1.2;
    }
    if (li<T.lineCount) lineShifts[li]=shift;
  }
  if (sigs.length && p.pubSigPosition === 'end') {
    blocks.push({type:'signature', y:T.h+shift+gap, lines:sigs.slice(),size:sigFs,lineH:sigLH});
    shift += sigBlockH + gap;
  }
  T.boxes.forEach(b => { b.flowShift = lineShifts[b.line] || 0; });
  T.h += shift;
  T.editorialBlocks = blocks;
  return T;
}
function paintEditorial(g,p,T,font,ty,textY) {
  if (!T.editorialBlocks) return;
  for (const b of T.editorialBlocks) {
    const y = textY + ty + b.y;
    g.save();
    if (b.type === 'heading') {
      g.font = `${b.size}px ${font}`;
      g.fillStyle = b.color;
      g.textBaseline = 'top';
      g.textAlign = b.align === 'center' ? 'center' : b.align === 'right' ? 'right' : 'left';
      const x = b.align === 'center' ? T.boxX + T.boxW/2 : b.align === 'right' ? T.boxX + T.boxW : T.boxX;
      b.lines.forEach((line,i) => g.fillText(line,x,y+i*b.lineH));
    } else if (b.type === 'signature') {
      g.font = `${b.size}px ${font}`;g.fillStyle=p.sigColor;g.textBaseline='top';
      const x = p.sigAlign === 'center' ? T.boxX+T.boxW/2 : p.sigAlign==='right' ? T.boxX+T.boxW : T.boxX;
      b.lines.forEach((line,i)=>spacedText(g,line,x,y+i*b.lineH,b.size*.1,p.sigAlign));
    } else if (b.type === 'photo') {
      const x = b.align === 'right' ? T.boxX+T.boxW-b.w : b.align==='left' ? T.boxX : T.boxX+(T.boxW-b.w)/2;
      const im = imgOf(b.pic.src);
      if (im) {
        if (b.pic.fit === 'contain') {
          const k = Math.min(b.w/im.width,b.h/im.height);
          g.drawImage(im,x+(b.w-im.width*k)/2,y+(b.h-im.height*k)/2,im.width*k,im.height*k);
        } else drawCover(g,im,x,y,b.w,b.h);
      } else if (st.canvas && isOpen() && st.previewMode !== false) {
        g.fillStyle=p.paperColor;g.fillRect(x,y,b.w,b.h);
        g.strokeStyle=p.sigColor;g.lineWidth=1;g.strokeRect(x+.5,y+.5,b.w-1,b.h-1);
      }
      if (b.caps.length) {
        g.font=`${b.capSize}px ${font}`;g.fillStyle=p.sigColor;g.textBaseline='top';g.textAlign='left';
        b.caps.forEach((line,i)=>g.fillText(line,x,y+b.h+5+i*b.capSize*1.6));
      }
    }
    g.restore();
  }
}

function holeDims(p, base) {
  const s = base * p.holeSize;
  return ['rough', 'rect', 'round', 'torn'].includes(p.holeShape) ? [s, s * 1.15] : [s * 1.15, s * 1.15];
}
const keySeed = k => { let h = 7; for (const c of String(k)) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; };

function layoutScraps(p, sw, sh, maxWidth = Infinity) {
  const step = sw * 1.2, seed = st.seed * 97, tilt = +p.scrapTilt;
  const items = [];
  const push = (k, x, y) => items.push({
    k, x: x + (rnd(k + seed, 2) - 0.5) * sw * 0.1, y: y + (rnd(k + seed, 3) - 0.5) * sh * 0.18,
    rot: (rnd(k + seed, 1) - 0.5) * 2 * tilt,
  });
  const holes = st.holes;
  if (p.arrange === 'stairs') {
    let x = 0, y = 0, diag = true;
    holes.forEach((h, k) => { push(k, x, y); if (diag) { x += step * 0.8; y += sh * 0.78; } else x += step; if (h.br) diag = !diag; });
  } else if (p.arrange === 'column') {
    const limit = Math.max(1, Math.min(20, Math.round(+p.columnLimit || 5)));
    const cols = [[]];
    holes.forEach((h, k) => {
      const col = cols[cols.length - 1];
      col.push(k);
      if (h.br || col.length >= limit) cols.push([]);
    });
    cols.filter(col => col.length).forEach((col, ci) => {
      const ch = (col.length - 1) * sh * 1.2;
      col.forEach((k, ri) => push(k, ci * step * 1.4, ri * sh * 1.2 - ch / 2));
    });
  } else {
    const settingLimit = Math.max(1, Math.min(20, Math.round(+p.rowLimit || 6)));
    const fitLimit = Number.isFinite(maxWidth)
      ? Math.max(1, Math.floor((maxWidth - sw) / (sw * 1.2)) + 1)
      : settingLimit;
    const limit = Math.max(1, Math.min(settingLimit, fitLimit));
    const rows = [[]];
    holes.forEach((h, k) => {
      const row = rows[rows.length - 1];
      row.push(k);
      if (h.br || row.length >= limit) rows.push([]);
    });
    rows.filter(row => row.length).forEach((row, ri) => {
      const rw = (row.length - 1) * step;
      row.forEach((k, j) => push(k, j * step - rw / 2, ri * sh * 1.45));
    });
  }
  if (!items.length) return { items, bw: 0, bh: 0 };
  const minX = Math.min(...items.map(i => i.x)) - sw / 2, maxX = Math.max(...items.map(i => i.x)) + sw / 2;
  const minY = Math.min(...items.map(i => i.y)) - sh / 2, maxY = Math.max(...items.map(i => i.y)) + sh / 2;
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  items.forEach(i => { i.x -= cx; i.y -= cy; });
  return { items, bw: maxX - minX, bh: maxY - minY };
}

// v21: independent, exportable publication and real-app inspired static layouts.
// All text is user-provided / user-selected. These are editable mock pages, not live apps.
const PAGE_SKINS = {punch:{group:'打孔',name:'打孔海报',detail:'原生 Canvas'}};
// Independent CSS layouts. Each .css carries a JSON layout manifest inside a comment.
// CSS is mounted in a ShadowRoot, so it cannot accidentally restyle SillyTavern.


const CSS_STARTER = "/* @pk-template\n{\n  \"id\": \"plain_example\",\n  \"name\": \"自定义 · 示例排版\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"example\\\"><h1 data-pk=\\\"title\\\"></h1><div class=\\\"byline\\\" data-pk=\\\"author\\\"></div><section data-pk=\\\"body\\\"></section></article>\"\n}\n@end-pk-template */\n.pk-css-page{background:white;color:#252525;font-family:system-ui,\"PingFang SC\",sans-serif}\n.pk-css-page .example{padding:36px 25px 60px}\n.pk-css-page h1{font-size:24px;line-height:1.3;margin:0 0 12px}\n.pk-css-page .byline{font-size:13px;color:#888;margin:0 0 26px}\n.pk-css-page section{font-size:16px;line-height:1.85}\n.pk-css-page section p{margin:0 0 1em;white-space:pre-wrap}\n";

// Built-in CSS templates share the exact same import/export renderer as user CSS.
// The punch palette remains Canvas-only. All other page layouts are CSS.
// Built-in CSS assets are available as soon as the extension loads.
// User-imported templates (store().cssTpl) always override the matching IDs.
const BUILTIN_CSS = {};
const BUNDLED_TEMPLATE_CSS = ["/* @pk-template\n{\n  \"id\": \"ao3_work\",\n  \"name\": \"AO3-作品阅读页\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"ao3-site\\\">\\n  <header class=\\\"ao3-header\\\">\\n    <div class=\\\"ao3-brandline\\\"><span class=\\\"ao3-brandimg\\\" role=\\\"img\\\" aria-label=\\\"Archive of Our Own beta\\\"></span><span class=\\\"ao3-login\\\">Log In</span></div>\\n    <nav class=\\\"ao3-nav\\\" aria-label=\\\"站点导航\\\"><span>Fandoms</span><span>Browse</span><span>Search</span><span>About</span><i class=\\\"ao3-searchfield\\\" aria-hidden=\\\"true\\\"></i><b class=\\\"ao3-searchbutton\\\" aria-hidden=\\\"true\\\">Search</b></nav>\\n  </header>\\n  <main class=\\\"ao3-work\\\">\\n    <div class=\\\"ao3-adult-gate\\\"><p>This work may contain adult content. Please continue only if you wish to view it.</p><div class=\\\"ao3-adult-actions\\\"><span>Yes, Continue</span><span>No, Go Back</span></div></div>\\n    <section class=\\\"ao3-metadata\\\" data-pk-section=\\\"ao3-metadata\\\" aria-label=\\\"作品评级和标签\\\">\\n\\n      <dl class=\\\"ao3-metadata-list\\\">\\n        <div class=\\\"ao3-meta-row\\\"><dt>Rating:</dt><dd data-ao3-field=\\\"ao3Rating\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Archive Warning:</dt><dd data-ao3-field=\\\"ao3Warning\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Category:</dt><dd data-ao3-field=\\\"ao3Category\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Fandom:</dt><dd data-ao3-field=\\\"ao3Fandom\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Relationship:</dt><dd data-ao3-field=\\\"ao3Relationship\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Characters:</dt><dd data-ao3-field=\\\"ao3Characters\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Additional Tags:</dt><dd data-ao3-field=\\\"ao3Tags\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Language:</dt><dd data-ao3-field=\\\"ao3Language\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Collections:</dt><dd data-ao3-field=\\\"ao3Collections\\\"></dd></div>\\n        <div class=\\\"ao3-meta-row\\\"><dt>Stats:</dt><dd data-pk=\\\"ao3-stats\\\"></dd></div>\\n      </dl>\\n      <dl class=\\\"ao3-metadata-list\\\" data-pk=\\\"ao3-meta-lines\\\"></dl>\\n    </section>\\n    <div class=\\\"ao3-work-heading\\\"><h1 data-pk=\\\"title\\\"></h1><p data-pk=\\\"author\\\" class=\\\"ao3-author\\\"></p></div>\\n    <section class=\\\"ao3-section ao3-summary\\\"><h2>Summary:</h2><div class=\\\"ao3-section-body\\\" data-pk=\\\"subtitle\\\"></div></section>\\n    <section class=\\\"ao3-section ao3-notes\\\"><h2>Notes:</h2><div class=\\\"ao3-section-body\\\" data-pk=\\\"note\\\"></div></section>\\n    <article class=\\\"ao3-story\\\" data-pk=\\\"body\\\"></article>\\n    <footer class=\\\"ao3-actions\\\"><span class=\\\"ao3-action-top\\\">↑ Top</span><span class=\\\"ao3-action-kudos\\\">Kudos <span aria-hidden=\\\"true\\\">♥</span></span></footer>\\n  </main>\\n</div>\"\n}\n@end-pk-template */\n\n/* AO3 work layout: labels and UI chrome are fixed; no quoted fanfic content. */\n.pk-css-page{box-sizing:border-box!important;min-height:0!important;background:#fff!important;color:#242424!important;font:12px/1.45 Arial,\"PingFang SC\",\"Microsoft YaHei\",sans-serif!important}\n.pk-css-page *, .pk-css-page *::before,.pk-css-page *::after{box-sizing:border-box}\n.pk-css-page .ao3-site{width:100%;background:#fff;color:#252525;overflow:hidden}\n.pk-css-page .ao3-header{width:100%;background:#820f13}\n.pk-css-page .ao3-brandline{height:60px;background:#fff;display:flex;align-items:center;gap:7px;padding:9px 10px 5px;color:#811d20}\n.pk-css-page .ao3-brandimg{display:block;flex:1 1 320px;min-width:0;max-width:350px;height:54px;background:url(\"data:image/png;base64,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\") no-repeat left center/contain}\n.pk-css-page .ao3-login{margin-left:auto;color:#444;font:10px Arial,sans-serif;white-space:nowrap;align-self:flex-start;padding-top:3px}\n.pk-css-page .ao3-nav{min-height:46px;padding:9px 10px;display:flex;align-items:center;gap:10px;font:11px/1 Arial,sans-serif;color:#f9ecec}\n.pk-css-page .ao3-nav>span{flex:none;white-space:nowrap}\n.pk-css-page .ao3-searchfield{height:18px;background:#fff;border:1px solid #bb9494;border-radius:12px;flex:1;min-width:14px}\n.pk-css-page .ao3-searchbutton{font:10px Arial,sans-serif;color:#555;background:linear-gradient(#fff,#e6e6e6);border:1px solid #bbb;border-radius:3px;padding:4px;white-space:nowrap}\n.pk-css-page .ao3-work{padding:24px 14px 34px;overflow-wrap:anywhere}\n.pk-css-page .ao3-adult-gate{margin:6px 0 28px;text-align:center;color:#282828;font:12px/1.4 Arial,sans-serif}\n.pk-css-page .ao3-adult-gate p{margin:0;padding:8px 9px;background:#f8e27b;border:1px solid #b29b3b;border-radius:3px;text-align:left;box-shadow:0 1px 2px #0002}\n.pk-css-page .ao3-adult-actions{display:flex;justify-content:flex-end;gap:6px;margin:8px 0 0}\n.pk-css-page .ao3-adult-actions span{padding:4px 8px;border:1px solid #bbb;border-radius:3px;color:#555;background:linear-gradient(#fafafa,#e5e5e5);white-space:nowrap}\n.pk-css-page .ao3-metadata{border:1px solid #ccc;background:#fff;box-shadow:0 1px 4px #0002;padding:12px 13px;margin:0 0 42px;font:12px/1.45 Arial,\"PingFang SC\",sans-serif}\n.pk-css-page .ao3-metadata[hidden]{display:none!important}\n.pk-css-page .ao3-metadata-list{margin:0;padding:0}\n.pk-css-page .ao3-meta-row{display:block;margin:0 0 8px}\n.pk-css-page .ao3-meta-row:last-child{margin-bottom:0}\n.pk-css-page .ao3-meta-row dt{display:block;color:#454545;font-weight:400;margin:0 0 1px;line-height:1.35}\n.pk-css-page .ao3-meta-row:nth-child(2) dt{font-weight:700;text-decoration:underline}\n.pk-css-page .ao3-meta-row dd{display:block;margin:0 0 0 12px;color:#333;line-height:1.42;white-space:pre-wrap;overflow-wrap:anywhere}\n.pk-css-page .ao3-meta-empty{color:#aaa!important}\n.pk-css-page .ao3-link{color:#444;font-weight:600;border-bottom:1px dotted #777}\n.pk-css-page .ao3-stat{display:inline;margin-right:8px;white-space:normal}\n.pk-css-page .ao3-stat b{font-weight:400;color:#777}\n.pk-css-page .ao3-work-heading{text-align:center;margin:48px 0 42px}\n.pk-css-page .ao3-work-heading h1{display:block;margin:0 0 25px;color:#171717!important;font:400 36px/1.3 Georgia,\"Times New Roman\",\"Songti SC\",serif!important;overflow-wrap:anywhere;white-space:pre-wrap}\n.pk-css-page .ao3-work-heading .ao3-author{margin:0;color:#303030!important;font:16px/1.4 Georgia,\"Times New Roman\",\"Songti SC\",serif!important;overflow-wrap:anywhere}\n/* The heading, rule and content form one centered inset column like the reference page. */\n.pk-css-page .ao3-section{width:84%;margin:0 auto 34px;color:#222}\n.pk-css-page .ao3-section h2{margin:0 0 8px;padding:0 0 3px;border-bottom:1px solid #777;color:#333;font:400 18px/1.2 Georgia,\"Times New Roman\",serif!important;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:2px}\n.pk-css-page .ao3-section-body{margin:0 0 0 10px;padding:0;color:#282828;font:12.5px/1.65 Arial,\"PingFang SC\",\"Microsoft YaHei\",sans-serif!important;white-space:pre-wrap;overflow-wrap:anywhere;min-height:1.25em;text-align:left}\n.pk-css-page .ao3-section-body:empty{display:none}\n.pk-css-page .ao3-section:has(.ao3-section-body:empty){display:none}\n.pk-css-page .ao3-story{margin:48px 3px 32px;white-space:pre-wrap;font:14px/1.85 Arial,\"PingFang SC\",sans-serif!important;color:#252525;min-height:2em;overflow-wrap:anywhere;word-break:break-word}\n.pk-css-page .ao3-story p.pk-css-paragraph{margin:0 0 1em!important;line-height:inherit!important;white-space:pre-wrap}\n.pk-css-page .ao3-story p.pk-css-paragraph:last-child{margin-bottom:0!important}\n.pk-css-page .ao3-actions{margin:30px 0 0;display:flex;gap:7px;justify-content:flex-end;align-items:center}\n.pk-css-page .ao3-actions>span{display:inline-flex;align-items:center;justify-content:center;background:linear-gradient(#fbfbfb,#e6e6e6);border:1px solid #bbb;border-radius:3px;color:#555;padding:5px 9px;min-height:25px;font:11px Arial,sans-serif;white-space:nowrap}\n.pk-css-page .ao3-action-kudos>span{color:#971b20;padding-left:4px}\n@media(max-width:375px){.pk-css-page .ao3-nav{gap:7px;padding-left:8px;padding-right:8px}.pk-css-page .ao3-work{padding-left:12px;padding-right:12px}.pk-css-page .ao3-work-heading h1{font-size:33px}}\n","/* @pk-template\n{\"id\":\"bubble_chat\",\"name\":\"Bubble-聊天页\",\"width\":390,\"html\":\"<div class=\\\"bu-app\\\">\\n<header class=\\\"bu-topbar\\\"><span class=\\\"bu-back\\\" aria-hidden=\\\"true\\\"></span><strong class=\\\"bu-chat-title\\\" data-pk=\\\"author\\\"></strong><span class=\\\"bu-search\\\" aria-hidden=\\\"true\\\"></span><span class=\\\"bu-more\\\" aria-hidden=\\\"true\\\"></span></header>\\n<main class=\\\"bu-room\\\"><div class=\\\"bu-love-pill\\\" aria-label=\\\"爱心加四十五\\\"><span class=\\\"bu-love-symbol\\\" aria-hidden=\\\"true\\\">💝</span><strong>+45</strong></div><div class=\\\"bu-date\\\" data-pk=\\\"date\\\"></div><div class=\\\"bu-thread\\\">\\n<div class=\\\"bu-group bu-group-1\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-1\\\">14:00</span>\\n<div class=\\\"bu-group bu-group-2\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-2\\\">14:02</span>\\n<div class=\\\"bu-group bu-group-3\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-3\\\">14:04</span>\\n<div class=\\\"bu-group bu-group-4\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-4\\\">14:06</span>\\n<div class=\\\"bu-group bu-group-5\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-5\\\">14:08</span>\\n<div class=\\\"bu-group bu-group-6\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-6\\\">14:10</span>\\n<div class=\\\"bu-group bu-group-7\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-7\\\">14:12</span>\\n<div class=\\\"bu-group bu-group-8\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-8\\\">14:14</span>\\n<div class=\\\"bu-group bu-group-9\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-9\\\">14:16</span>\\n<div class=\\\"bu-group bu-group-10\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-10\\\">14:18</span>\\n<div class=\\\"bu-group bu-group-11\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-11\\\">14:20</span>\\n<div class=\\\"bu-group bu-group-12\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-12\\\">14:22</span>\\n<div class=\\\"bu-group bu-group-13\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-13\\\">14:24</span>\\n<div class=\\\"bu-group bu-group-14\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-14\\\">14:26</span>\\n<div class=\\\"bu-group bu-group-15\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-15\\\">14:28</span>\\n<div class=\\\"bu-group bu-group-16\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-16\\\">15:00</span>\\n<div class=\\\"bu-group bu-group-17\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-17\\\">15:02</span>\\n<div class=\\\"bu-group bu-group-18\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-18\\\">15:04</span>\\n<div class=\\\"bu-group bu-group-19\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-19\\\">15:06</span>\\n<div class=\\\"bu-group bu-group-20\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-20\\\">15:08</span>\\n<div class=\\\"bu-group bu-group-21\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-21\\\">15:10</span>\\n<div class=\\\"bu-group bu-group-22\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-22\\\">15:12</span>\\n<div class=\\\"bu-group bu-group-23\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-23\\\">15:14</span>\\n<div class=\\\"bu-group bu-group-24\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-24\\\">15:16</span>\\n<div class=\\\"bu-group bu-group-25\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-25\\\">15:18</span>\\n<div class=\\\"bu-group bu-group-26\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-26\\\">15:20</span>\\n<div class=\\\"bu-group bu-group-27\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-27\\\">15:22</span>\\n<div class=\\\"bu-group bu-group-28\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-28\\\">15:24</span>\\n<div class=\\\"bu-group bu-group-29\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-29\\\">15:26</span>\\n<div class=\\\"bu-group bu-group-30\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-30\\\">15:28</span>\\n<div class=\\\"bu-group bu-group-31\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-31\\\">16:00</span>\\n<div class=\\\"bu-group bu-group-32\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-32\\\">16:02</span>\\n<div class=\\\"bu-group bu-group-33\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-33\\\">16:04</span>\\n<div class=\\\"bu-group bu-group-34\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-34\\\">16:06</span>\\n<div class=\\\"bu-group bu-group-35\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-35\\\">16:08</span>\\n<div class=\\\"bu-group bu-group-36\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-36\\\">16:10</span>\\n<div class=\\\"bu-group bu-group-37\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-37\\\">16:12</span>\\n<div class=\\\"bu-group bu-group-38\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-38\\\">16:14</span>\\n<div class=\\\"bu-group bu-group-39\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-39\\\">16:16</span>\\n<div class=\\\"bu-group bu-group-40\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-40\\\">16:18</span>\\n<div class=\\\"bu-group bu-group-41\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-41\\\">16:20</span>\\n<div class=\\\"bu-group bu-group-42\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-42\\\">16:22</span>\\n<div class=\\\"bu-group bu-group-43\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-43\\\">16:24</span>\\n<div class=\\\"bu-group bu-group-44\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-44\\\">16:26</span>\\n<div class=\\\"bu-group bu-group-45\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-45\\\">16:28</span>\\n<div class=\\\"bu-group bu-group-46\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-46\\\">17:00</span>\\n<div class=\\\"bu-group bu-group-47\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-47\\\">17:02</span>\\n<div class=\\\"bu-group bu-group-48\\\"><span class=\\\"bu-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"bu-artist-label\\\">ARTIST</span><span class=\\\"bu-name\\\" data-pk=\\\"author\\\"></span></div>\\n<span class=\\\"bu-time bu-time-48\\\">17:04</span>\\n<section class=\\\"bu-messages\\\" data-pk=\\\"body\\\"></section>\\n<div class=\\\"bu-photo\\\" data-pk=\\\"image\\\"></div>\\n</div><div class=\\\"bu-reply-box\\\"><div class=\\\"bu-reply-value\\\" data-pk=\\\"subtitle\\\"></div><div class=\\\"bu-read\\\">읽음</div></div></main>\\n<footer class=\\\"bu-compose\\\" aria-hidden=\\\"true\\\"><span class=\\\"bu-compose-input\\\">메시지를 입력하세요</span><span class=\\\"bu-smile\\\"></span></footer>\\n</div>\"}\n@end-pk-template */\n\n\n\n\n/* Bubble 聊天页：每行正文对应一条独立消息。\n   每条显示自己的头像 / ARTIST / 昵称 / 白色气泡，以及气泡右侧的 A 翻译标。\n   不自动拆分双语、不附加译文、不渲染引用框或未读提醒。 */\n.pk-css-page{box-sizing:border-box!important;margin:0!important;padding:0!important;min-height:0!important;background:#f2f2f2!important;color:#1e1e1e!important;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",\"Apple SD Gothic Neo\",sans-serif!important}\n.pk-css-page .bu-app,.pk-css-page .bu-app *{box-sizing:border-box}\n.pk-css-page .bu-app{width:100%;min-height:0;overflow:hidden;background:#f2f2f2;color:#202020;-webkit-text-size-adjust:100%;font-family:inherit}\n/* 顶栏：没有额外伪状态栏，直接从返回 / 昵称 / 搜索开始。 */\n.pk-css-page .bu-topbar{height:60px;min-height:60px;position:relative;display:flex;align-items:center;padding:0 17px;background:#fff}\n.pk-css-page .bu-back{width:32px;height:34px;position:relative;flex:none}\n.pk-css-page .bu-back:before{content:\"\";position:absolute;left:8px;top:9px;width:14px;height:14px;border-left:2px solid #151515;border-bottom:2px solid #151515;transform:rotate(45deg)}\n.pk-css-page .bu-chat-title{position:absolute;left:70px;right:70px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:17px!important;line-height:1.4!important;font-weight:650!important;color:#171717!important;-webkit-text-fill-color:#171717!important}\n.pk-css-page .bu-search{position:relative;margin-left:auto;flex:none;width:29px;height:32px}\n.pk-css-page .bu-search:before{content:\"\";position:absolute;top:6px;left:5px;width:16px;height:16px;border:1.8px solid #111;border-radius:50%}\n.pk-css-page .bu-search:after{content:\"\";position:absolute;left:20px;top:22px;width:10px;height:2px;background:#111;transform:rotate(47deg);border-radius:3px}\n.pk-css-page .bu-more{position:relative;flex:none;width:28px;height:32px;margin-left:12px;background:radial-gradient(circle,#111 1.6px,transparent 2px) center 6px/7px 8px no-repeat,radial-gradient(circle,#111 1.6px,transparent 2px) center 14px/7px 8px no-repeat,radial-gradient(circle,#111 1.6px,transparent 2px) center 22px/7px 8px no-repeat}\n.pk-css-page .bu-more:after{content:\"\";position:absolute;top:0;right:0;width:6px;height:6px;background:#f44345;border-radius:50%}\n.pk-css-page .bu-room{position:relative;width:100%;padding:15px 10px 18px;min-height:0;background:#f2f2f2;color:#222}\n/* Bubble 爱心计数：参考图右上角白色胶囊，独立于消息和未读提示。 */\n.pk-css-page .bu-love-pill{position:absolute;top:12px;right:12px;z-index:2;display:flex;align-items:center;justify-content:center;gap:4px;min-width:63px;height:29px;padding:0 10px;border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 2px 6px rgba(0,0,0,.08);color:#1f1f1f;font:650 13px/1 -apple-system,BlinkMacSystemFont,Arial,sans-serif}\n.pk-css-page .bu-love-symbol{font-size:16px;line-height:1;display:inline-block;transform:translateY(-.2px)}\n.pk-css-page .bu-love-pill strong{font:inherit;color:inherit}\n.pk-css-page .bu-date{font:400 11px/1.5 -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif!important;color:#a5a5a5;text-align:center;margin:0 0 17px;white-space:pre-wrap}\n.pk-css-page .bu-date:empty{display:none!important}\n/* Flex 消息流：头像行→正文→时间，避免 SVG 导出时跨层 Grid 行高错位。 */\n.pk-css-page .bu-thread{display:flex;flex-flow:row wrap;align-items:flex-end;align-content:flex-start;min-width:0;padding-left:44px}\n.pk-css-page .bu-messages{display:contents}\n.pk-css-page .bu-group{display:flex;align-items:flex-start;min-width:0;gap:7px;flex:0 0 calc(100% + 44px);height:44px;margin:10px 0 0 -44px;padding-left:3px}\n.pk-css-page .bu-group-1{margin-top:0}\n.pk-css-page .bu-avatar{position:relative;display:grid;place-items:center;flex:none;width:38px;height:38px;min-width:38px;border-radius:50%;outline:2px solid #f79146;border:2px solid #fff;background:#e6b9a8;overflow:hidden;color:#fff!important;font-size:15px!important;line-height:1!important;font-weight:600!important}\n.pk-css-page .bu-avatar img{display:block!important;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;transform:none!important;margin:0!important}\n/* PNG 的 foreignObject 使用占位 GIF，真实头像由插件随后绘制。\n   只在导出的 XHTML 克隆中隐藏占位图，防止 iOS WebKit 画出蓝色问号。 */\ndiv[xmlns=\"http://www.w3.org/1999/xhtml\"] .pk-css-page .bu-avatar img{visibility:hidden!important}\n/* 姓名与标贴朝头像上沿对齐，不是头像垂直居中。 */\n.pk-css-page .bu-artist-label{flex:none;margin-top:3px;white-space:nowrap;background:#ff8f37;border-radius:1px;padding:4px 6px 3px;color:#fff!important;-webkit-text-fill-color:#fff!important;font:750 10px/1.05 -apple-system,BlinkMacSystemFont,sans-serif!important;letter-spacing:.1px}\n.pk-css-page .bu-name{min-width:0;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#575757!important;-webkit-text-fill-color:#575757!important;text-shadow:none;font:500 12px/1.3 -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif!important}\n/* 每行一条独立白气泡。插件对 p 写入内联 padding/margin:0!important，\n   因此用实色边框形成内距。 */\n.pk-css-page .bu-messages > p.pk-css-paragraph:not(.pk-css-blank){\n  display:block!important;flex:0 1 auto!important;align-self:flex-start;\n  position:relative!important;left:auto!important;right:auto!important;transform:none!important;\n  width:fit-content!important;max-width:calc(100% - 75px)!important;min-width:0!important;\n  padding:0!important;margin:0!important;\n  border:solid #fff!important;border-width:10px 13px!important;\n  background:#fff!important;border-radius:5px 16px 16px 16px!important;\n  font-family:inherit!important;font-size:inherit!important;font-weight:400!important;line-height:1.58!important;\n  color:#252525!important;-webkit-text-fill-color:#252525!important;\n  white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important;\n  text-align:left!important;text-indent:0!important;text-align-last:auto!important;\n  box-shadow:0 1px 2px rgba(0,0,0,.025);\n}\n/* 翻译标：浅灰底+白色 A + 双向回转箭头。标识属于时间栏，不再叠在气泡上。 */\n.pk-css-page .bu-messages > p.pk-css-paragraph:not(.pk-css-blank)::after{content:none!important}\n.pk-css-page .bu-messages>p.pk-css-blank{display:none!important}\n.pk-css-page .bu-time{\n  flex:none;align-self:flex-end;display:flex;align-items:flex-end;gap:6px;\n  margin:0 0 1px 9px;min-height:27px;\n  font:400 10px/1.3 -apple-system,BlinkMacSystemFont,Arial,sans-serif!important;\n  color:#b0b0b0;white-space:nowrap;\n}\n.pk-css-page .bu-time::before{\n  content:\"\";display:block;flex:none;width:27px;height:27px;\n  background:transparent url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%0A%3Ccircle%20cx%3D%2232%22%20cy%3D%2232%22%20r%3D%2230%22%20fill%3D%22%23d6d6d6%22%2F%3E%0A%3Cpath%20d%3D%22M15%2026a19%2019%200%200%201%2035-6%22%20stroke%3D%22white%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Cpath%20d%3D%22M50%2013v10H40%22%20stroke%3D%22white%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Cpath%20d%3D%22M49%2038a19%2019%200%200%201-35%206%22%20stroke%3D%22white%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Cpath%20d%3D%22M14%2051V41h10%22%20stroke%3D%22white%22%20stroke-width%3D%224%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%0A%3Ctext%20x%3D%2232%22%20y%3D%2242%22%20fill%3D%22white%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2CHelvetica%2Csans-serif%22%20font-size%3D%2230%22%20font-weight%3D%22500%22%3EA%3C%2Ftext%3E%0A%3C%2Fsvg%3E\") center / contain no-repeat;\n}\n.pk-css-page .bu-photo{display:none;flex:none;order:200;position:relative;width:205px;height:158px;max-width:calc(100% - 25px);margin-top:12px;border-radius:12px;overflow:hidden;background:#e0e0e0}\n.pk-css-page .bu-photo:has(>img.pk-slot-photo){display:block}\n.pk-css-page .bu-photo>img.pk-slot-photo{width:100%!important;height:100%!important;max-width:none!important;display:block!important;object-fit:cover!important}\n/* Optional outgoing reply. Make the ENTIRE row conditional on real subtitle\n   content, not the padding/background of the slot itself.\n   The plugin sets hidden on the subtitle slot when blank. */\n.pk-css-page .bu-reply-box{display:none!important;margin:0!important;padding:0!important;min-height:0!important}\n.pk-css-page .bu-reply-box:has(> .bu-reply-value:not([hidden]):not(:empty)){\n  display:flex!important;flex-direction:column;align-items:flex-end;\n  gap:4px;margin-top:15px!important;\n}\n.pk-css-page .bu-reply-value{\n  display:block;width:fit-content;max-width:78%;\n  padding:9px 13px;margin:0!important;\n  background:#fff;border:0;border-radius:17px 17px 5px 17px;\n  white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;\n  color:#242424!important;-webkit-text-fill-color:#242424!important;\n  font-size:14px!important;line-height:1.55!important;\n}\n.pk-css-page .bu-reply-value:empty,\n.pk-css-page .bu-reply-value[hidden]{display:none!important;padding:0!important;min-height:0!important}\n.pk-css-page .bu-read{font-size:10px;color:#aaa;text-align:right;line-height:1.4}\n.pk-css-page .bu-compose{display:flex;align-items:center;gap:12px;width:100%;height:69px;background:#fff;padding:10px 16px}\n.pk-css-page .bu-compose-input{flex:1;min-width:0;height:40px;border-radius:24px;background:#f2f3f5;padding:0 13px;color:#a7a9ac;font:400 12px/40px -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pk-css-page .bu-smile{display:block;flex:0 0 28px;width:28px;height:28px;min-width:28px;min-height:28px;margin:0;padding:0;border:0;box-shadow:none;background:transparent url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2028%2028%22%3E%3Ccircle%20cx%3D%2214%22%20cy%3D%2214%22%20r%3D%2212.15%22%20fill%3D%22none%22%20stroke%3D%22%23444444%22%20stroke-width%3D%221.8%22%2F%3E%3Ccircle%20cx%3D%229.7%22%20cy%3D%2211.2%22%20r%3D%221.35%22%20fill%3D%22%23444444%22%2F%3E%3Ccircle%20cx%3D%2218.3%22%20cy%3D%2211.2%22%20r%3D%221.35%22%20fill%3D%22%23444444%22%2F%3E%3Cpath%20d%3D%22M8.7%2016.4%20Q14%2021.8%2019.3%2016.4%22%20fill%3D%22none%22%20stroke%3D%22%23444444%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E\") center/contain no-repeat;}\n.pk-css-page .bu-smile::before,.pk-css-page .bu-smile::after{content:none!important;display:none!important;}\n@media(max-width:350px){.pk-css-page .bu-room{padding-left:9px;padding-right:9px}.pk-css-page .bu-thread{padding-left:44px}.pk-css-page .bu-group{flex-basis:calc(100% + 44px);margin-left:-44px}.pk-css-page .bu-messages>p.pk-css-paragraph:not(.pk-css-blank){max-width:calc(100% - 75px)!important}}\n\n\n/* 消息槽位：保留48条，Flex顺序与正文段落一一对应。 */\n.bu-group-1{order:1}\n.bu-messages>p:nth-child(1){order:2}\n.bu-time-1{order:3}\n.bu-thread:not(:has(.bu-messages>p:nth-child(1):not(.pk-css-blank)))>:is(.bu-group-1,.bu-time-1){display:none!important}\n.bu-group-2{order:4}\n.bu-messages>p:nth-child(2){order:5}\n.bu-time-2{order:6}\n.bu-thread:not(:has(.bu-messages>p:nth-child(2):not(.pk-css-blank)))>:is(.bu-group-2,.bu-time-2){display:none!important}\n.bu-group-3{order:7}\n.bu-messages>p:nth-child(3){order:8}\n.bu-time-3{order:9}\n.bu-thread:not(:has(.bu-messages>p:nth-child(3):not(.pk-css-blank)))>:is(.bu-group-3,.bu-time-3){display:none!important}\n.bu-group-4{order:10}\n.bu-messages>p:nth-child(4){order:11}\n.bu-time-4{order:12}\n.bu-thread:not(:has(.bu-messages>p:nth-child(4):not(.pk-css-blank)))>:is(.bu-group-4,.bu-time-4){display:none!important}\n.bu-group-5{order:13}\n.bu-messages>p:nth-child(5){order:14}\n.bu-time-5{order:15}\n.bu-thread:not(:has(.bu-messages>p:nth-child(5):not(.pk-css-blank)))>:is(.bu-group-5,.bu-time-5){display:none!important}\n.bu-group-6{order:16}\n.bu-messages>p:nth-child(6){order:17}\n.bu-time-6{order:18}\n.bu-thread:not(:has(.bu-messages>p:nth-child(6):not(.pk-css-blank)))>:is(.bu-group-6,.bu-time-6){display:none!important}\n.bu-group-7{order:19}\n.bu-messages>p:nth-child(7){order:20}\n.bu-time-7{order:21}\n.bu-thread:not(:has(.bu-messages>p:nth-child(7):not(.pk-css-blank)))>:is(.bu-group-7,.bu-time-7){display:none!important}\n.bu-group-8{order:22}\n.bu-messages>p:nth-child(8){order:23}\n.bu-time-8{order:24}\n.bu-thread:not(:has(.bu-messages>p:nth-child(8):not(.pk-css-blank)))>:is(.bu-group-8,.bu-time-8){display:none!important}\n.bu-group-9{order:25}\n.bu-messages>p:nth-child(9){order:26}\n.bu-time-9{order:27}\n.bu-thread:not(:has(.bu-messages>p:nth-child(9):not(.pk-css-blank)))>:is(.bu-group-9,.bu-time-9){display:none!important}\n.bu-group-10{order:28}\n.bu-messages>p:nth-child(10){order:29}\n.bu-time-10{order:30}\n.bu-thread:not(:has(.bu-messages>p:nth-child(10):not(.pk-css-blank)))>:is(.bu-group-10,.bu-time-10){display:none!important}\n.bu-group-11{order:31}\n.bu-messages>p:nth-child(11){order:32}\n.bu-time-11{order:33}\n.bu-thread:not(:has(.bu-messages>p:nth-child(11):not(.pk-css-blank)))>:is(.bu-group-11,.bu-time-11){display:none!important}\n.bu-group-12{order:34}\n.bu-messages>p:nth-child(12){order:35}\n.bu-time-12{order:36}\n.bu-thread:not(:has(.bu-messages>p:nth-child(12):not(.pk-css-blank)))>:is(.bu-group-12,.bu-time-12){display:none!important}\n.bu-group-13{order:37}\n.bu-messages>p:nth-child(13){order:38}\n.bu-time-13{order:39}\n.bu-thread:not(:has(.bu-messages>p:nth-child(13):not(.pk-css-blank)))>:is(.bu-group-13,.bu-time-13){display:none!important}\n.bu-group-14{order:40}\n.bu-messages>p:nth-child(14){order:41}\n.bu-time-14{order:42}\n.bu-thread:not(:has(.bu-messages>p:nth-child(14):not(.pk-css-blank)))>:is(.bu-group-14,.bu-time-14){display:none!important}\n.bu-group-15{order:43}\n.bu-messages>p:nth-child(15){order:44}\n.bu-time-15{order:45}\n.bu-thread:not(:has(.bu-messages>p:nth-child(15):not(.pk-css-blank)))>:is(.bu-group-15,.bu-time-15){display:none!important}\n.bu-group-16{order:46}\n.bu-messages>p:nth-child(16){order:47}\n.bu-time-16{order:48}\n.bu-thread:not(:has(.bu-messages>p:nth-child(16):not(.pk-css-blank)))>:is(.bu-group-16,.bu-time-16){display:none!important}\n.bu-group-17{order:49}\n.bu-messages>p:nth-child(17){order:50}\n.bu-time-17{order:51}\n.bu-thread:not(:has(.bu-messages>p:nth-child(17):not(.pk-css-blank)))>:is(.bu-group-17,.bu-time-17){display:none!important}\n.bu-group-18{order:52}\n.bu-messages>p:nth-child(18){order:53}\n.bu-time-18{order:54}\n.bu-thread:not(:has(.bu-messages>p:nth-child(18):not(.pk-css-blank)))>:is(.bu-group-18,.bu-time-18){display:none!important}\n.bu-group-19{order:55}\n.bu-messages>p:nth-child(19){order:56}\n.bu-time-19{order:57}\n.bu-thread:not(:has(.bu-messages>p:nth-child(19):not(.pk-css-blank)))>:is(.bu-group-19,.bu-time-19){display:none!important}\n.bu-group-20{order:58}\n.bu-messages>p:nth-child(20){order:59}\n.bu-time-20{order:60}\n.bu-thread:not(:has(.bu-messages>p:nth-child(20):not(.pk-css-blank)))>:is(.bu-group-20,.bu-time-20){display:none!important}\n.bu-group-21{order:61}\n.bu-messages>p:nth-child(21){order:62}\n.bu-time-21{order:63}\n.bu-thread:not(:has(.bu-messages>p:nth-child(21):not(.pk-css-blank)))>:is(.bu-group-21,.bu-time-21){display:none!important}\n.bu-group-22{order:64}\n.bu-messages>p:nth-child(22){order:65}\n.bu-time-22{order:66}\n.bu-thread:not(:has(.bu-messages>p:nth-child(22):not(.pk-css-blank)))>:is(.bu-group-22,.bu-time-22){display:none!important}\n.bu-group-23{order:67}\n.bu-messages>p:nth-child(23){order:68}\n.bu-time-23{order:69}\n.bu-thread:not(:has(.bu-messages>p:nth-child(23):not(.pk-css-blank)))>:is(.bu-group-23,.bu-time-23){display:none!important}\n.bu-group-24{order:70}\n.bu-messages>p:nth-child(24){order:71}\n.bu-time-24{order:72}\n.bu-thread:not(:has(.bu-messages>p:nth-child(24):not(.pk-css-blank)))>:is(.bu-group-24,.bu-time-24){display:none!important}\n.bu-group-25{order:73}\n.bu-messages>p:nth-child(25){order:74}\n.bu-time-25{order:75}\n.bu-thread:not(:has(.bu-messages>p:nth-child(25):not(.pk-css-blank)))>:is(.bu-group-25,.bu-time-25){display:none!important}\n.bu-group-26{order:76}\n.bu-messages>p:nth-child(26){order:77}\n.bu-time-26{order:78}\n.bu-thread:not(:has(.bu-messages>p:nth-child(26):not(.pk-css-blank)))>:is(.bu-group-26,.bu-time-26){display:none!important}\n.bu-group-27{order:79}\n.bu-messages>p:nth-child(27){order:80}\n.bu-time-27{order:81}\n.bu-thread:not(:has(.bu-messages>p:nth-child(27):not(.pk-css-blank)))>:is(.bu-group-27,.bu-time-27){display:none!important}\n.bu-group-28{order:82}\n.bu-messages>p:nth-child(28){order:83}\n.bu-time-28{order:84}\n.bu-thread:not(:has(.bu-messages>p:nth-child(28):not(.pk-css-blank)))>:is(.bu-group-28,.bu-time-28){display:none!important}\n.bu-group-29{order:85}\n.bu-messages>p:nth-child(29){order:86}\n.bu-time-29{order:87}\n.bu-thread:not(:has(.bu-messages>p:nth-child(29):not(.pk-css-blank)))>:is(.bu-group-29,.bu-time-29){display:none!important}\n.bu-group-30{order:88}\n.bu-messages>p:nth-child(30){order:89}\n.bu-time-30{order:90}\n.bu-thread:not(:has(.bu-messages>p:nth-child(30):not(.pk-css-blank)))>:is(.bu-group-30,.bu-time-30){display:none!important}\n.bu-group-31{order:91}\n.bu-messages>p:nth-child(31){order:92}\n.bu-time-31{order:93}\n.bu-thread:not(:has(.bu-messages>p:nth-child(31):not(.pk-css-blank)))>:is(.bu-group-31,.bu-time-31){display:none!important}\n.bu-group-32{order:94}\n.bu-messages>p:nth-child(32){order:95}\n.bu-time-32{order:96}\n.bu-thread:not(:has(.bu-messages>p:nth-child(32):not(.pk-css-blank)))>:is(.bu-group-32,.bu-time-32){display:none!important}\n.bu-group-33{order:97}\n.bu-messages>p:nth-child(33){order:98}\n.bu-time-33{order:99}\n.bu-thread:not(:has(.bu-messages>p:nth-child(33):not(.pk-css-blank)))>:is(.bu-group-33,.bu-time-33){display:none!important}\n.bu-group-34{order:100}\n.bu-messages>p:nth-child(34){order:101}\n.bu-time-34{order:102}\n.bu-thread:not(:has(.bu-messages>p:nth-child(34):not(.pk-css-blank)))>:is(.bu-group-34,.bu-time-34){display:none!important}\n.bu-group-35{order:103}\n.bu-messages>p:nth-child(35){order:104}\n.bu-time-35{order:105}\n.bu-thread:not(:has(.bu-messages>p:nth-child(35):not(.pk-css-blank)))>:is(.bu-group-35,.bu-time-35){display:none!important}\n.bu-group-36{order:106}\n.bu-messages>p:nth-child(36){order:107}\n.bu-time-36{order:108}\n.bu-thread:not(:has(.bu-messages>p:nth-child(36):not(.pk-css-blank)))>:is(.bu-group-36,.bu-time-36){display:none!important}\n.bu-group-37{order:109}\n.bu-messages>p:nth-child(37){order:110}\n.bu-time-37{order:111}\n.bu-thread:not(:has(.bu-messages>p:nth-child(37):not(.pk-css-blank)))>:is(.bu-group-37,.bu-time-37){display:none!important}\n.bu-group-38{order:112}\n.bu-messages>p:nth-child(38){order:113}\n.bu-time-38{order:114}\n.bu-thread:not(:has(.bu-messages>p:nth-child(38):not(.pk-css-blank)))>:is(.bu-group-38,.bu-time-38){display:none!important}\n.bu-group-39{order:115}\n.bu-messages>p:nth-child(39){order:116}\n.bu-time-39{order:117}\n.bu-thread:not(:has(.bu-messages>p:nth-child(39):not(.pk-css-blank)))>:is(.bu-group-39,.bu-time-39){display:none!important}\n.bu-group-40{order:118}\n.bu-messages>p:nth-child(40){order:119}\n.bu-time-40{order:120}\n.bu-thread:not(:has(.bu-messages>p:nth-child(40):not(.pk-css-blank)))>:is(.bu-group-40,.bu-time-40){display:none!important}\n.bu-group-41{order:121}\n.bu-messages>p:nth-child(41){order:122}\n.bu-time-41{order:123}\n.bu-thread:not(:has(.bu-messages>p:nth-child(41):not(.pk-css-blank)))>:is(.bu-group-41,.bu-time-41){display:none!important}\n.bu-group-42{order:124}\n.bu-messages>p:nth-child(42){order:125}\n.bu-time-42{order:126}\n.bu-thread:not(:has(.bu-messages>p:nth-child(42):not(.pk-css-blank)))>:is(.bu-group-42,.bu-time-42){display:none!important}\n.bu-group-43{order:127}\n.bu-messages>p:nth-child(43){order:128}\n.bu-time-43{order:129}\n.bu-thread:not(:has(.bu-messages>p:nth-child(43):not(.pk-css-blank)))>:is(.bu-group-43,.bu-time-43){display:none!important}\n.bu-group-44{order:130}\n.bu-messages>p:nth-child(44){order:131}\n.bu-time-44{order:132}\n.bu-thread:not(:has(.bu-messages>p:nth-child(44):not(.pk-css-blank)))>:is(.bu-group-44,.bu-time-44){display:none!important}\n.bu-group-45{order:133}\n.bu-messages>p:nth-child(45){order:134}\n.bu-time-45{order:135}\n.bu-thread:not(:has(.bu-messages>p:nth-child(45):not(.pk-css-blank)))>:is(.bu-group-45,.bu-time-45){display:none!important}\n.bu-group-46{order:136}\n.bu-messages>p:nth-child(46){order:137}\n.bu-time-46{order:138}\n.bu-thread:not(:has(.bu-messages>p:nth-child(46):not(.pk-css-blank)))>:is(.bu-group-46,.bu-time-46){display:none!important}\n.bu-group-47{order:139}\n.bu-messages>p:nth-child(47){order:140}\n.bu-time-47{order:141}\n.bu-thread:not(:has(.bu-messages>p:nth-child(47):not(.pk-css-blank)))>:is(.bu-group-47,.bu-time-47){display:none!important}\n.bu-group-48{order:142}\n.bu-messages>p:nth-child(48){order:143}\n.bu-time-48{order:144}\n.bu-thread:not(:has(.bu-messages>p:nth-child(48):not(.pk-css-blank)))>:is(.bu-group-48,.bu-time-48){display:none!important}\n.bu-messages>p:nth-child(n+49){order:190}\n","/* @pk-template\n{\n  \"id\": \"imessage_dark\",\n  \"name\": \"iMessage\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"im-app\\\">\\n  <header class=\\\"im-nav\\\">\\n    <span class=\\\"im-back\\\" aria-hidden=\\\"true\\\"></span>\\n    <div class=\\\"im-contact\\\">\\n      <div class=\\\"im-avatar\\\" data-pk=\\\"im-avatar\\\"><i class=\\\"im-head\\\"></i><i class=\\\"im-shoulders\\\"></i></div>\\n      <div class=\\\"im-contact-label\\\"><span class=\\\"im-contact-name\\\" data-pk=\\\"note\\\"></span><span class=\\\"im-contact-fallback\\\" data-pk=\\\"author\\\"></span><span class=\\\"im-chevron\\\"></span></div>\\n    </div>\\n    <span class=\\\"im-video\\\" aria-hidden=\\\"true\\\"></span>\\n  </header>\\n  <section class=\\\"im-chat\\\">\\n    <div class=\\\"im-date\\\"><span class=\\\"im-service\\\">iMessage</span><span class=\\\"im-datetime\\\" data-pk=\\\"date\\\"></span></div>\\n    <div class=\\\"im-messages\\\">\\n      <div class=\\\"im-sent-group\\\" data-pk=\\\"title\\\"></div>\\n      <div class=\\\"im-body\\\" data-pk=\\\"body\\\"></div>\\n      <div class=\\\"im-photo-row\\\" data-pk-section=\\\"im-photo\\\" hidden><div class=\\\"im-photo-frame\\\" data-pk=\\\"im-image\\\"><span class=\\\"im-photo-hint\\\">点击上传图片</span></div></div>\\n    </div>\\n  </section>\\n</div>\"\n}\n@end-pk-template */\n\n/* iMessage 黑色深色模式，支持多段气泡和专属图片消息。 */\n.pk-css-page{min-height:0!important;background:#000!important;color:#fff!important;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",\"SF Pro Text\",sans-serif;line-height:1.35}\n.pk-css-page .im-app{width:100%;background:#000;color:#fff;min-height:500px;overflow:hidden}\n.pk-css-page .im-nav{height:93px;background:#111;position:relative;border-bottom:1px solid #262626;display:flex;justify-content:space-between;align-items:flex-start;padding:19px 15px 0}\n.pk-css-page .im-back{width:30px;height:30px;margin-top:3px;background:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2030%2030%22%3E%3Cpath%20d%3D%22M18.5%203.5%207.5%2015l11%2011%22%20stroke%3D%22%230a84ff%22%20stroke-width%3D%223.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E\") center/contain no-repeat;flex:none}\n.pk-css-page .im-video{width:31px;height:30px;margin-top:4px;background:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2038%2032%22%3E%3Crect%20x%3D%221.7%22%20y%3D%225%22%20width%3D%2224%22%20height%3D%2222%22%20rx%3D%224.4%22%20stroke%3D%22%230a84ff%22%20stroke-width%3D%221.85%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22m26%2012%208-5v18l-8-5%22%20stroke%3D%22%230a84ff%22%20stroke-width%3D%221.85%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20fill%3D%22none%22%2F%3E%3C%2Fsvg%3E\") center/contain no-repeat;flex:none}\n.pk-css-page .im-contact{position:absolute;left:65px;right:65px;top:13px;display:flex;align-items:center;flex-direction:column;gap:4px;min-width:0}\n.pk-css-page .im-avatar{position:relative;width:50px;height:50px;border-radius:50%;background:linear-gradient(170deg,#a8aeb9,#737986);overflow:hidden;display:block;flex:none}\n.pk-css-page .im-head{position:absolute;background:#fff;left:35%;top:21%;width:30%;height:34%;border-radius:50%}\n.pk-css-page .im-shoulders{position:absolute;left:15%;bottom:-14%;width:70%;height:46%;background:#fff;border-radius:50% 50% 15% 15%}\n.pk-css-page .im-avatar.im-has-img .im-head,.pk-css-page .im-avatar.im-has-img .im-shoulders{display:none}\n.pk-css-page .im-avatar img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;max-width:none!important}\n.pk-css-page .im-contact-label{display:flex;align-items:center;justify-content:center;gap:5px;max-width:100%}\n.pk-css-page .im-contact-name{color:#f8f8f9!important;font-size:13.2px;font-weight:420;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px;line-height:1.3}\n.pk-css-page .im-chevron{height:8px;width:8px;border-right:1.5px solid #55565b;border-top:1.5px solid #55565b;transform:rotate(45deg);margin-right:4px}\n.pk-css-page .im-chat{background:#000;padding:18px 10px 35px;min-height:400px}\n.pk-css-page .im-date{display:flex;align-items:center;flex-direction:column;gap:0;text-align:center;color:#89898e;line-height:1.45;margin-bottom:16px;font-size:13px;font-weight:580}\n.pk-css-page .im-service,.pk-css-page .im-datetime{color:#89898e!important;font-size:13.4px;letter-spacing:0;line-height:1.4}\n.pk-css-page .im-messages{display:flex;flex-direction:column;min-width:0;gap:0}\n.pk-css-page .im-sent-group,.pk-css-page .im-body{width:100%;display:flex;flex-direction:column;align-items:stretch;min-width:0}\n.pk-css-page .im-row{display:flex;width:100%;min-width:0;margin:1px 0}\n.pk-css-page .im-row.im-out{justify-content:flex-end}\n.pk-css-page .im-row.im-in{justify-content:flex-start}\n.pk-css-page .im-bubble{position:relative;display:block;max-width:82%;min-width:37px;padding:8px 12px 9px;border-radius:17px;font-size:18px;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",sans-serif!important;font-weight:410;line-height:1.34;letter-spacing:-.25px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;text-indent:0!important;box-sizing:border-box;text-align:left}\n.pk-css-page .im-out .im-bubble{background:#0a84ff;color:#fff!important}\n.pk-css-page .im-in .im-bubble{background:#2c2c30;color:#fff!important;font-size:1.085em}\n.pk-css-page .im-out.im-tail .im-bubble::after,.pk-css-page .im-in.im-tail .im-bubble::after{content:\"\";position:absolute;bottom:-1px;width:14px;height:17px;background:inherit}\n.pk-css-page .im-out.im-tail .im-bubble::after{right:-6px;clip-path:path(\"M0 0H7V9Q7 14 14 15Q5 17 0 11Z\")}\n.pk-css-page .im-in.im-tail .im-bubble::after{left:-6px;clip-path:path(\"M14 0H7V9Q7 14 0 15Q9 17 14 11Z\")}\n.pk-css-page .im-sent-group{margin:0 0 11px}\n.pk-css-page .im-body{line-height:1.35!important;letter-spacing:0!important}\n.pk-css-page .im-body .pk-css-paragraph{margin:0;white-space:pre-wrap}\n.pk-css-page .im-reply-group{display:flex;flex-direction:column;align-items:stretch;margin:10px 0 0}\n.pk-css-page .im-read{width:100%;display:block;color:#89898e!important;text-align:right;font-size:12.2px;font-weight:550;line-height:1.4;margin-top:7px;margin-bottom:9px;padding-right:3px}\n.pk-css-page .im-photo-row{width:100%;display:flex;margin:13px 0 5px;justify-content:flex-end}\n.pk-css-page .im-photo-row.im-left{justify-content:flex-start}\n.pk-css-page .im-photo-frame{position:relative;display:flex;align-items:center;justify-content:center;width:230px;max-width:75%;min-height:145px;aspect-ratio:4/3;border-radius:17px;overflow:hidden;background:#242427;border:1px solid #34343a;color:#8e8e93;cursor:pointer}\n.pk-css-page .im-photo-hint{font-size:13px;color:#8e8e93;text-align:center}\n.pk-css-page .im-photo-frame.im-has-img{border:none}\n.pk-css-page .im-photo-frame img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;position:absolute;inset:0;max-width:none!important}\n.pk-css-page .im-photo-frame.im-has-img .im-photo-hint{display:none}\n@media(max-width:350px){.pk-css-page .im-nav{padding-left:10px;padding-right:10px}.pk-css-page .im-bubble{font-size:17px;max-width:86%}}\n\n/* Protect against ordinary-text fallback when a legacy JS renderer is still active. */\n.pk-css-page .im-contact-fallback{font-size:13.2px;line-height:1.3;color:#f8f8f9!important;font-weight:420;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;max-width:170px}\n.pk-css-page .im-contact-name:not(:empty)~.im-contact-fallback{display:none}\n.pk-css-page .im-photo-row[hidden]{display:none!important}\n.pk-css-page .im-sent-group:not(:has(.im-row)):not(:empty){display:block;width:fit-content;max-width:83%;align-self:flex-end;margin:0 0 11px auto;border-radius:18px;padding:8px 12px;background:#0a84ff;color:#fff!important;font-size:18px!important;line-height:1.34!important;text-align:left!important;white-space:pre-wrap;overflow-wrap:anywhere}\n.pk-css-page .im-body:not(:has(.im-row))>p.pk-css-paragraph{display:block;width:fit-content;max-width:83%;align-self:flex-start;background:#2c2c30!important;color:#fff!important;border-radius:18px;padding:8px 12px!important;margin:1px 0!important;line-height:1.35!important;font-size:18px!important;letter-spacing:0!important;text-align:left!important;text-indent:0!important;white-space:pre-wrap;overflow-wrap:anywhere}\n.pk-css-page .im-body:not(:has(.im-row)){color:#fff!important}\n.pk-css-page .im-reply-group .im-row{width:100%}\n.pk-css-page .im-out .im-bubble,.pk-css-page .im-in .im-bubble{font-size:18px!important;line-height:1.34!important;color:#fff!important;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",\"SF Pro Text\",sans-serif!important;letter-spacing:0!important}\n.pk-css-page .im-body[contenteditable=true]>.pk-css-paragraph{display:block!important}\n\n/* iOS compatibility: old shared inline ink styles must not tint chat text. */\n.pk-css-page .im-contact-name,.pk-css-page .im-contact-fallback,.pk-css-page .im-sent-group:not(:has(.im-row)),.pk-css-page .im-body .pk-css-paragraph{-webkit-text-fill-color:#fff!important}\n","/* @pk-template\n{\n  \"id\": \"instagram_post\",\n  \"name\": \"Instagram-帖子\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"ig-app\\\">\\n  <header class=\\\"ig-header\\\">\\n    <span class=\\\"ig-avatar\\\" data-pk=\\\"avatar\\\"></span>\\n    <strong class=\\\"ig-username\\\" data-pk=\\\"author\\\"></strong>\\n    <span class=\\\"ig-icon ig-menu\\\" aria-hidden=\\\"true\\\"></span>\\n  </header>\\n  <section class=\\\"ig-media\\\">\\n    <div class=\\\"ig-image\\\" data-pk=\\\"image\\\">\\n      <div class=\\\"ig-image-placeholder\\\"><span class=\\\"ig-image-glyph\\\" aria-hidden=\\\"true\\\"></span><span>点击上传帖子图片</span></div>\\n    </div>\\n  </section>\\n  <div class=\\\"ig-insights\\\">View Insights</div>\\n  <nav class=\\\"ig-actions\\\" aria-label=\\\"Post actions\\\">\\n    <div class=\\\"ig-action-left\\\">\\n      <i class=\\\"ig-icon ig-heart\\\" aria-hidden=\\\"true\\\"></i>\\n      <i class=\\\"ig-icon ig-comment\\\" aria-hidden=\\\"true\\\"></i>\\n      <i class=\\\"ig-icon ig-repost\\\" aria-hidden=\\\"true\\\"></i>\\n      <i class=\\\"ig-icon ig-send\\\" aria-hidden=\\\"true\\\"></i>\\n    </div>\\n    <i class=\\\"ig-icon ig-bookmark\\\" aria-hidden=\\\"true\\\"></i>\\n  </nav>\\n  <section class=\\\"ig-caption\\\">\\n    <strong class=\\\"ig-caption-author\\\" data-pk=\\\"author\\\"></strong><span class=\\\"ig-caption-gap\\\"> </span><div class=\\\"ig-caption-body\\\" data-pk=\\\"body\\\"></div>\\n    <div class=\\\"ig-date\\\" data-pk=\\\"date\\\"></div>\\n  </section>\\n</article>\"\n}\n@end-pk-template */\n\n/* Instagram 帖子 · 日间模式 · 打孔海报 CSS 模板 */\n.pk-css-page{box-sizing:border-box!important;background:#fff!important;color:#171717!important;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",Arial,sans-serif;-webkit-font-smoothing:antialiased}\n.pk-css-page .ig-app,.pk-css-page .ig-app *{box-sizing:border-box}\n.pk-css-page .ig-app{width:100%;min-height:0;background:#fff;color:#171717;overflow:hidden}\n\n/* 头像 + 用户名。插件会强制写入作者文字颜色，用 -webkit-text-fill-color 保证显示为正确黑色。 */\n.pk-css-page .ig-header{height:52px;display:flex;align-items:center;gap:10px;padding:0 12px 0 11px;background:#fff}\n.pk-css-page .ig-avatar{display:flex;align-items:center;justify-content:center;width:32px;height:32px;flex:none;border-radius:50%;overflow:hidden;background:#e9eaee;color:#555;font-size:14px;font-weight:600;line-height:1}\n.pk-css-page .ig-avatar .pk-avatar-photo{display:block;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;transform:none!important}\n.pk-css-page .ig-username{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:16.4px!important;font-weight:800!important;font-style:normal!important;line-height:1.23!important;letter-spacing:-.45px!important;color:#141414!important;-webkit-text-fill-color:#141414!important;text-shadow:none!important}\n.pk-css-page .ig-icon{display:inline-block;flex:none;background-repeat:no-repeat;background-position:center;background-size:contain;filter:invert(1)}\n.pk-css-page .ig-menu{width:29px;height:29px;margin-left:auto}\n\n/* 以 ::first-line 单独设置字体，避免全局字体设置的 inline!important 压过用户名样式 */\n.pk-css-page .ig-username::first-line,\n.pk-css-page .ig-caption-author::first-line{font-family:Arial,\"Helvetica Neue\",sans-serif!important;font-weight:800!important}\n\n/* 正方形图片上传槽；图片按原插件的缩放与定位参数加载 */\n.pk-css-page .ig-media{width:100%;min-width:0;background:#f4f4f4}\n.pk-css-page .ig-image{position:relative;width:100%;height:auto;aspect-ratio:1/1;overflow:hidden;isolation:isolate;display:flex;align-items:center;justify-content:center;background:#f1f2f4}\n.pk-css-page .ig-image-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:13px;color:#8b8d93;font-size:13px;letter-spacing:.025em;line-height:1.5;pointer-events:none}\n.pk-css-page .ig-image-glyph{width:45px;height:37px;border:2px solid #9b9ea7;border-radius:5px;position:relative;overflow:hidden}\n.pk-css-page .ig-image-glyph:before{content:\"\";position:absolute;width:8px;height:8px;left:8px;top:7px;border-radius:50%;background:#9b9ea7}\n.pk-css-page .ig-image-glyph:after{content:\"\";position:absolute;left:3px;bottom:-8px;width:36px;height:24px;border-top:2px solid #9b9ea7;transform:rotate(-32deg)}\n.pk-css-page .ig-image .pk-slot-photo{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;max-width:none!important;object-fit:contain!important;z-index:1}\n\n/* 原图 View Insights 蓝字、细分隔线 */\n.pk-css-page .ig-insights{height:47px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #ececec;color:#5278da;font-size:14px;font-weight:700;letter-spacing:-.18px;background:#fff}\n\n/* 直接沿用上个版本从参考图提取的六组真实图标轮廓，仅反相为日间黑色 */\n.pk-css-page .ig-actions{height:49px;display:flex;align-items:center;justify-content:space-between;padding:0 8px;background:#fff}\n.pk-css-page .ig-action-left{display:flex;align-items:center;gap:10px}\n.pk-css-page .ig-actions .ig-icon{width:30px;height:30px}\n.pk-css-page .ig-actions>.ig-bookmark{margin-right:1px}\n\n/* 用户名、正文同行。两处名字不能跟随插件的“正文墨色”变色。 */\n.pk-css-page .ig-caption{padding:0 12px 11px;background:#fff;font-size:14px;line-height:1.43;overflow-wrap:anywhere;word-break:break-word;min-height:0;color:#181818}\n.pk-css-page .ig-caption-author{display:inline-block;vertical-align:baseline;max-width:100%;font-size:14.5px!important;font-weight:800!important;font-style:normal!important;letter-spacing:-.2px!important;line-height:inherit!important;color:#141414!important;-webkit-text-fill-color:#141414!important;text-shadow:none!important}\n.pk-css-page .ig-caption-gap{display:inline;white-space:pre}\n.pk-css-page .ig-caption-body{display:inline;color:#181818!important;-webkit-text-fill-color:#181818!important;line-height:inherit!important;overflow-wrap:anywhere;white-space:normal}\n.pk-css-page .ig-caption-body p.pk-css-paragraph{margin:0!important;padding:0!important;white-space:pre-wrap;overflow-wrap:anywhere;-webkit-text-fill-color:#181818!important}\n.pk-css-page .ig-caption-body p.pk-css-paragraph:first-child{display:inline}\n.pk-css-page .ig-caption-body p.pk-css-paragraph:not(:first-child){display:block}\n.pk-css-page .ig-date{display:block;margin-top:11px;padding-bottom:0;color:#85878d!important;-webkit-text-fill-color:#85878d!important;font-size:12.5px!important;line-height:1.35;letter-spacing:-.1px;font-weight:450}\n@media(max-width:350px){.pk-css-page .ig-header{gap:8px}.pk-css-page .ig-username{font-size:15px!important}.pk-css-page .ig-action-left{gap:6px}.pk-css-page .ig-actions{padding-left:5px;padding-right:5px}}\n.pk-css-page .ig-heart{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAGiUlEQVR42u2aWWicVRTH/3eSqYlGbdNaK3Wp2roWl4pojEIQFBQUteBDccEFBX0RRBD1RUUqdUEfRHABBYNLEVToQ13RJzewVkzrUq1VG1eU2OyZ+flyrhwv3ySzfNMkOgeGbzK593zn/O/Z7rlXalGLWtSiFrXof0shL0ZASHjyz0tCoEGe/xa6Tn5NAcCEDCGE8jRjChGQmYT3SlcaG98piUbBCA0oXvBKm5IHSNrP+E5KKkkaDiGMpmCkgmcBCXRK6pC0j6SC8RsNIQzVsgC5A+CVB1ZJWiPpMkmrJC2W1C6pLGmPpM8lvSdpq6T3QwhjcZUjCF4JYKGkkySdIalX0gpJ3SbrlKQ/JG2R9IakT0MIA1kL0hQCQhQeOAJ4BPie6mgM2AScm8XP/r4Y2AxMVslzF/AwsCKLX+7Ku5fcBGxzgkwCE/acso//PgWUbewQ8LitdOS9GHjS/oeb43mW7Dluv5fc+78Abk7crCnKF23VozITJlQ1VHKKAbwFHAgsBN5MFC9Vwa/sAIn0EFCcLoPUFQMM0TZJz0haZ8FIFpiC+fuA+eUOSeOSipIOlNQn6WwLjrK5kxbc3rH5febfwfEclvSuff60LFKUdLSk8yWtdum27Ob1S7pe0kQuMQFos+f9ztzLbpU+Ai4BllWYfwDQAzyXYRF+NT09ZXP2rcBzGbAW+KCCdd3vZc9D+bXOr0tO+IeADm8p5ibt9mlL+N3iTLZk/Cad4HuAG5M5C4BOx9MHzf2ARx2/CMQYcFFD8cCUCcAiYKtb/ZJHOQIVx1fIHG0ujtzklC4nwe3yrDkZ/AoeXGC9A2HCvm8DuuP4ugCw55UuQEXl+z1INaTQaFF3OUDj6t9bq9l65YBnE3cAuKpRKygakmUHwE5gSS2RNmP1OoB3nM+/bWbeVgfPgkulPzgQysBAzAr1rn6vEzKa1q2NBBhnBT3AiPlrT048b3WWFemsmq3AMdzgVj9WXsc1GmGBdnu+ALzsf2sQgOOBn53LloH1NcvrLOB1V8YCvGImXMghvQZgOXBITsVaDNqvJTJvng6AQpZgtinpkLQsKZgGrLhoa1TgEAIhhB9DCIM5FaxttrkaSGQ+GCiGEEpZ8aUwTXV4kKveosK70mZHXpurPNjZ89tE5i5JSytVvtOZ8v6SOt24sqRf8gTArICcAdiT6NZpfQpV5QKOxq0+j8wLkhbNg/Zelz3jPmBC0kg9AAxLGkuYHVbFvNkGYEUi81+Sfq9kuYVs1yTYpCG3g/PMmUuam7xR4aMSAEYljVjHaGYAbFBbCGHS2lh+XC9wqKRS7k2HhsNJKAFHSDo9CYJbLXMVanGBiN4mexbNClZKOt9ACnPQ/M+TdKTJGgurjYkV12RaXcDupBr80n5vXv+tjlRqW+PtycbtK79dr3c/cHvGbjCfhkM+AMQy+IGkL+D3LQ1thw+xzm/ZbV/HgUsbreFzUL6YNGymXMdqJ7C00e1wRPe6jIbILuD02bKEZFe5O2mqAlzRsGzOvxYAL2eY2NfA6qa0oquzzpXWEk/l2pibTO5lS4HPMuLBNuDkveUObuVXu7OJkusBfAIsqbsVNsNL1wCDGeb2FdDXbHdwcvQB32S45SBwalMs0jUxeoBfM0D4zXdi80yRSe/vUvd+3/8bdJ2l9mb73pmu/+Y7vCOxrZ1XnZCcR94ADGc0VL8DevdKLEosYUdGAAK4MwWtgRo/WtQdyXFcPEzZCZzm0+LeTEHHAlsSECIQD9v5fl1xwVlbF/CYO0Hyp1IfAyfMSip2Ai4H3kgakdE0nwcW12oJjnc38GKSeSLv14HlezsFV3KHJUC/WyVvCW/ZDrKqVXLWdajNzVK+3wE7a5VoulqdwIMuDvhaYTtwykwCO+VPdsdxpeQIfoNzrbmxJU8OLG9zAk8lkfqcCEIyxx+bnWNlNkmwmwRuyXrnnAHBRe2rXbqaclXar2mtkOT4i4HfMy5fDAHrmtBJbgoI7W6H9kuGJQwD12TMvdbqiHT8T8AlWZYzZ8mB0Gd5miQ7lIH73F2C9RVix5febTSfyPn0icCHGe4A8BKwMeMeUbx5csxcabw0miG67fpb1hUbf5wdld8MHDynIn0OltABPJ2Y+mjGTbMn4t2gebvyWSC4iH+33QVKaQi4x2WH/4byFdLkBcCrdoNjwLpNF875NJcnCPb34cBhPmb8Z5WfAYjwv1A8K0vM+yjfoha1qEUtatH8pb8BBVQGGLmPQbYAAAAASUVORK5CYII=\")}\n.pk-css-page .ig-comment{background-image:url(\"data:image/png;base64,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\")}\n.pk-css-page .ig-repost{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAFfklEQVR42u2aXahUVRTH//vMTHr9iIQoEwoK8iXEkiAoQqOoiFACC3rqyR586MEwewhEiDK7N6Ugog+R0oJ8sCBCoh7MXqIIe6ygHvqyrITIm/fOzPn14Nq12N25d85x5s4Z7yw4nH1mztlnr+//XutIIxrRiBYyhUEvAAiSMrvMQwiM1LIQyDQvYClwG7Au/W8hCGEMOAJMAqeAp6IALmghAJmdN/F/Go/3XLBCcAK41ZhuuwNgz0KxhAC85oSQAy27nhh6IcTFdzgyOy8GDnSwhGftvuFxB8dcNpsA7N4acJFlgjdcHMidEJ4ZiuzQC1MFxo35PHGHPTFu9JrqvQpqIYTcxiskrZW0QdIVki6ShEOdXki487Ski20cmc3seruklcAWSdOVQotAzc4rge3Al8Af9IaiFTTteqe9q14JCwBqIYQ2sF7SuKQb3d9NSXmX+45oIUFSI3mmZtbRkrSu13uY+nmafRu4T9J+SZdIajtmGj1aY25CqEn6PHGdwewGgRBCANgg6aikRbbQ3An1pKSvJJ017eVOOFnCYF3SlAntDpvPx4dM0kFJWyRNDTQGOBR3OfCt+WbL/BXgG2AHsLaoOwE73VxN5/vjlUiFMcfbeMIW13Tp6iNgdQcwlAH1FAzZPQ1gfxL8okCft+eyfqXCMtq/yiJ9ZL4NfA2scgxlXQKmBvCKMXvW5mw75kNlQJATwANO+3Gxm4qkKMfYPudGLTffPnOLMHDNz7Dow85PAb4AlnWLBp0gb3JMt50rPTdfzJdNg1dbNI95/hNJZ+y3IhF6laU3T3tDCNtctsm7UYplpTAvGQL43vkswI7o+wXnWQIcBaaA08Be0/y8BbyyFpAurlkKhIQwCWyWdIuk05I+61aTDouskPSI7TsOhRCO990SgJ8SC3i0pAWEbn6bI4scdunzF2CN36MU1eS8UtS2rx90qzm7b5GkeyzuTEm6TNKaIii3rgGTMXI+5hrcgQvMofIW0GtZdqg19EUAzHE9EJiS8LTgLKAn6ayotENVYsl8C6DuAk5eEReYVwGcclWfzEBM2W31QBsfWdGF2/BJST9bCewDSe/a7+1uq0kR49t4eCzI7QhXA3cCi8sgP+Ah4C2rHi33u8SCe4kzhgKn7PxgGVSqkpbQNXxN2mETSfl7VxH46pSw0sHxuJXeWKQuUSp6RwiboLk5zf7ckN2SttkGqqVzjZObgUYIodklHA6AJN2g/xovNQvIf1UIm/yr+bjF3Z0UUWNB5fGCFhCbMa/a89N2/g64pshc88F8NNeJpA0eS18HrJo0ZwfY5mvY+Hrgd5trys5vR4FXjfndSd0v0iFgLAbAWdroWSyR2b2rgGOJNeWuLlmrBPO28Imk1J0Df1sluFZi7vXAp8n3BADHy2CK0A/mLUhmkp6W9JjhA79J+VDSVkkxhbY6rC2355ZKulbSRkm3S7rUIdGapF8l3RVCOFG0GtQPAWSWXV6Q9LBF+zQnT+pcy2xRN+DJCSE4wIW9py3p/hDCkdisHaTpR3h7XRLwZur4pC21udrkvl0WnzlpzdnSjZN+bYeDM+0wQ9GCJFfjjpmu43N1O5qS3pd0t2k+qwScdsFvOfDOLFr2GGAmbad01srmJ4CXgHtTTHC+muqpG4QQcitXvyxpswtm8XxM0hNWxMT8uGb/NW0cnAVNSvpT0o8hhB/Sd1V5w9QAXk8soQ38Fj93KSPgyvQKu4SrY8DBDu4QG6ANO+qzHLWhYLxDVhgD3kyE0HIfQ1anBd5HIdTdx5DTDsMDbK3MBqbPQljihNCy6N4C3nMuc8F/IT5mmyBPLw5NcOsRThgDdgEf29fiV5YpiQ2tENx4mRYqVaUsXhlrGNGIRjSiQdA/4YJYfO7/SPQAAAAASUVORK5CYII=\")}\n.pk-css-page .ig-send{background-image:url(\"data:image/png;base64,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\")}\n.pk-css-page .ig-bookmark{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAEi0lEQVR42u2aT2gdVRTGf9+8SasU/7TUhdBWKQZBEYsLBbW4EhRSC1YbayxUKXSh7l3ryq2tWEFEbEK1UNqa7lQQwYUoSpe6UhG1psGNJW0z730ucqa5fcRo3p95L+kcCPdlZu6953z3O+fcOXOhllpqqaWWWq5bUSedbKvTvn0US3L/Z1kwfiilE906ZUAObAOuAAYacSuLMd3N+NFfyW/+ZVwDrfj/vKRLfQPAtiTZ9hbgbeBBoNn2WDaIhY/2a+CQpJlS117TK4/2dQ+vvJnq+n8k74AtdwftCmAkoasrXvnUDZphy5aVMjvvYOL5xNfTbDCo4KgkDqxY8i6QbwYDfgDeAG6I1fASz6+EIfqPwKiYuwBeA+5JGFAJAO3yk6SpAaW9iQCgY/frBoBy0nURdPJYlX5S3YneBbCu20HzXgQhSYVtJBUVrTwxZ9eBdxB5e6ikBqAGoAagBqAGoAagBqAGoAagBuA6lXxQE7eV1qspaQ8LAEnR0ktcW9sukFSXZfsx2zsBymtrGgDbWRi6AXgHOAV8YvuI7ZviXrYmXSCMb9neCBwGJpLbLwM32z4kaa5Kd8gqMr4Rxm8GPgzjmyxUc8sC537gY9ubggmNNQFAGN+0vR04C4yF4Vn8NeKvBewCzti+M/o0VjUAQfum7buA48BDLH5OSwNeWu5+FJiyPRp9s1UJQEL7UeA0C98S5xNji/D9V+J3eX0eeBg4GUxo9ZMJeZ+Mz6NquwM4AYwGxfNkpV+VdDSeL4AjiT4FcB9w1vaEpHPlmEPPgFj5wvYDwMkwvkiofhF4UdJR23kY9i5wIO6VsaEA7o2YcH+M2RhqAJKAtzNovz0xPgNmgRckHbM9IqkIw9bH16X9wIVErwK4A5i2/Ug/AmM3ALTn6dL4J4AzwNZ4Jgtq/x4rfzqAmr8aAaXLce0U8BJwPvpk4S5bY8P0uKRmL123JwDExuWy7d3AR8DGJL9nwM/A85KmS5a0D1aurqRpYE/0yZKAuQk4YXtM0qVenVPKetE3Ni57gWPALRHwzMLX4x+B3ZK+iJTWWmbMVqTOr4Cno285Twu4FZi0vbdXO8VeMKCw/RQwCWxIjM+B74FnI4o3JLWWU1ySy7Qn6TvgOeBcQvlWAHzc9hgwV+WLzEi0U3Ec5Uq0M7Z/s92y3bRdxPVv4jzRio6spKk02m22v40xC9vzMc+ftmfbdJlKda0qC2wGbmfxcEQD+BzYJenXiA8rzt+RHTJJvwBPAl+yeBrNwG0RFwaeBpvJ9rYBfBq0/6N8/e104HCHTNJMxITP2tyh4NojdZUCoLZ9fBbv9+OS/ip9vlt0k5gwC+wDpgNoJ1micga4rc0i/e0L47OlUl0XIDRjzAvAODCVvEGapc8m9Q0AJ/v5chXeBw7EXiDrxcov4w5zsW3+INzBiU49n/eabW6047YvRtRt2j5se335+ltFZSnqiTfafis5JPm37fFU174UNKPdY/s92wfb71VVYUoW5KDtSdvPVK0HgzC+13N2elo83Qa3GKAMky611FJLLbXUUsvqkn8APtlyJauxTnUAAAAASUVORK5CYII=\")}\n.pk-css-page .ig-menu{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABf0lEQVR42u3YPU7DQBCG4XccIn4KpJACSpC4AbQcgYKjIMERKLkCDaKi4wopEaKho6VA6RB0If5oNlKaiDjZOI7yPVIkN3Z2vbOenQEzMzMzMzMzWzdR9QZJsRITi1D2h0oqVmVlp12oWSKgA2w1ee5APyLK7G9T0oWkDzVbKele0p6k+C8SYprJR4TSyr8DXWAItBq6+gIK4CoibiW1I2Iw6YaNCg8vgJ30B79A2dAtMExbdDtb+KdfIek6hVjTPUs6Ho177o/gaBuk61Ngt+FJ4C0i+uPjrjW1NCQNTpWyY4YXsApnAWVNg2ZmZuaOUDoItWbpI8xT3Kz9oWaRR/BKxZCkLnAJHKWyOEtkTajrA/gGHiKil72wmaEbtCnpaQml7aekkzSG7E2YKg2RDnAODFLToa7mxj5wBrykQmy4rBfwBfTSYNo1BuEP8Jquy2V9A4qIKCUdAjfAwdg+XdjuS9F2FxGPozE4cTfkHFCn0itvZmZmZmZmZmZmlskfb59ppB2tbHUAAAAASUVORK5CYII=\")}\n","/* @pk-template\n{\n  \"id\": \"app_postype\",\n  \"name\": \"POSTYPE · 阅读页\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"ps-document\\\">\\n  <header class=\\\"ps-channel\\\">\\n    <span class=\\\"ps-nav-left\\\"><span class=\\\"ps-icon\\\" data-pk-icon=\\\"chevron-left\\\"></span><span class=\\\"ps-icon ps-home\\\" data-pk-icon=\\\"house\\\"></span><strong class=\\\"ps-channel-name\\\">포스타입</strong></span>\\n    <span class=\\\"ps-follow\\\">关注</span>\\n  </header>\\n  <main class=\\\"ps-content\\\">\\n    <div class=\\\"ps-kicker\\\">作品</div>\\n    <h1 data-pk=\\\"title\\\"></h1>\\n    <p class=\\\"ps-subtitle\\\" data-pk=\\\"subtitle\\\"></p>\\n    <section class=\\\"ps-byline\\\">\\n      <div class=\\\"ps-avatar\\\" data-pk=\\\"avatar\\\"></div>\\n      <div class=\\\"ps-bytext\\\"><strong class=\\\"ps-author-name\\\" data-pk=\\\"author\\\"></strong><div class=\\\"ps-meta\\\"><span data-pk=\\\"date\\\"></span><span class=\\\"ps-dot\\\">·</span>浏览量 <span data-pk=\\\"views\\\"></span></div></div>\\n      <div class=\\\"ps-bytools\\\"><span class=\\\"ps-icon\\\" data-pk-icon=\\\"share\\\"></span><span class=\\\"ps-icon\\\" data-pk-icon=\\\"settings\\\"></span><span class=\\\"ps-icon\\\" data-pk-icon=\\\"list\\\"></span></div>\\n    </section>\\n    <div class=\\\"ps-translation\\\"><div><strong>需要为您翻译这篇作品吗？</strong><p>申请人数达到一定数量后即可开始翻译。</p></div><b>申请</b></div>\\n    <section class=\\\"ps-body\\\" data-pk=\\\"body\\\"></section>\\n    \\n    <aside class=\\\"ps-author-card\\\" data-pk-section=\\\"author-card\\\"><div class=\\\"ps-smallavatar\\\" data-pk=\\\"avatar\\\"></div><div class=\\\"ps-author-desc\\\"><strong data-pk=\\\"author\\\"></strong><small>作者</small></div><span class=\\\"ps-follow\\\">关注</span></aside>\\n  </main>\\n  <footer class=\\\"ps-dock\\\"><span class=\\\"ps-icon\\\" data-pk-icon=\\\"chevron-left\\\"></span><span class=\\\"ps-tool\\\"><span class=\\\"ps-icon\\\" data-pk-icon=\\\"heart\\\"></span><b data-pk=\\\"likes\\\"></b></span><span class=\\\"ps-tool\\\"><span class=\\\"ps-icon\\\" data-pk-icon=\\\"message\\\"></span><b data-pk=\\\"comments\\\"></b></span><span class=\\\"ps-icon\\\" data-pk-icon=\\\"repeat\\\"></span><span class=\\\"ps-icon\\\" data-pk-icon=\\\"bookmark\\\"></span><span class=\\\"ps-icon\\\" data-pk-icon=\\\"list\\\"></span><span class=\\\"ps-icon\\\" data-pk-icon=\\\"chevron-right\\\"></span></footer>\\n</article>\"\n}\n@end-pk-template */\n\n/* POSTYPE 网页作品阅读页，仅网站内容，不包含 Safari、广告或帖子正文。 */\n.pk-css-page{font-family:-apple-system,BlinkMacSystemFont,\"Apple SD Gothic Neo\",\"PingFang SC\",\"Noto Sans CJK KR\",sans-serif;color:#19191b;background:#fff;font-size:14px;line-height:1.5;font-weight:400}\n.pk-css-page .ps-document{background:#fff;min-height:640px;padding:0 0 28px}\n.pk-css-page .ps-channel{height:64px;padding:0 13px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #e7e7e9}\n.pk-css-page .ps-nav-left{display:flex;align-items:center;gap:6px;min-width:0;flex:1}\n.pk-css-page .ps-nav-left .ps-icon{width:22px;height:22px;flex:none}\n.pk-css-page .ps-channel-name{font-size:17px;font-weight:720;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pk-css-page .ps-follow{display:inline-flex;align-items:center;justify-content:center;background:#29292b;color:#fff;min-width:59px;height:35px;padding:0 12px;border-radius:9px;font-size:14px;font-weight:680;white-space:nowrap}\n.pk-css-page .ps-content{padding:29px 14px 10px}\n.pk-css-page .ps-kicker{font-size:14px;margin:3px 0 23px}\n.pk-css-page h1{margin:0 0 12px;font-weight:740;line-height:1.32;letter-spacing:-.035em;font-size:25px;overflow-wrap:anywhere}\n.pk-css-page .ps-subtitle{font-size:17px;line-height:1.5;margin:0 0 23px;overflow-wrap:anywhere}\n.pk-css-page .ps-byline{display:flex;align-items:center;gap:9px;min-height:54px;border-bottom:1px solid #e8e8e9;padding:0 0 20px;margin:0 0 20px}\n.pk-css-page .ps-avatar,.pk-css-page .ps-smallavatar{flex:none;display:flex;align-items:center;justify-content:center;background:#e9ecef;color:#717580;border-radius:50%;width:34px;height:34px;overflow:hidden;font-size:15px;font-weight:700}\n.pk-css-page .ps-smallavatar{width:43px;height:43px}\n.pk-css-page .ps-bytext{flex:1;min-width:0;text-align:left;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}\n.pk-css-page .ps-author-name{display:block;font-size:var(--pk-signature-size,14px);line-height:1.4;font-weight:700;color:var(--pk-signature-color,#19191b);overflow-wrap:anywhere}\n.pk-css-page .ps-meta{display:block;color:#8b8b94;font-size:12px;white-space:normal}\n.pk-css-page .ps-dot{padding:0 3px}\n.pk-css-page .ps-bytools{flex:none;display:flex;gap:12px;align-items:center;color:#27272a}\n.pk-css-page .ps-icon{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;flex:none;vertical-align:middle}\n.pk-css-page .ps-icon svg{width:100%;height:100%;display:block;overflow:visible;stroke:currentColor;fill:none;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round}\n.pk-css-page .ps-translation{display:flex;align-items:center;justify-content:space-between;background:#f1f1f3;border-radius:9px;padding:12px 12px 12px 14px;gap:7px;margin:0 0 36px}\n.pk-css-page .ps-translation strong{display:block;font-size:13px;font-weight:700}\n.pk-css-page .ps-translation p{font-size:11px;color:#999aa2;margin:4px 0 0}\n.pk-css-page .ps-translation>b{background:#fff;border-radius:9px;padding:10px 13px;white-space:nowrap;font-size:13px}\n.pk-css-page .ps-body{font-size:18px;line-height:1.95;letter-spacing:0;margin:0 0 50px;word-break:break-word;overflow-wrap:anywhere}\n.pk-css-page .ps-body p{margin:0 0 1.15em;white-space:pre-wrap}\n.pk-css-page .ps-neighbor{border-top:1px solid #e7e7e9;margin:12px 0 24px}\n.pk-css-page .ps-neighbor>div{display:flex;align-items:center;justify-content:space-between;min-height:58px;border-bottom:1px solid #e7e7e9;font-size:14px;font-weight:700;padding:0 3px}\n.pk-css-page .ps-neighbor .ps-icon{width:19px;height:19px;color:#85868b}\n.pk-css-page .ps-author-card{border:1px solid #e5e5e8;border-radius:10px;display:flex;align-items:center;gap:13px;padding:16px;margin:23px 0}\n.pk-css-page .ps-author-card .ps-author-desc{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}\n.pk-css-page .ps-author-desc strong{font-size:var(--pk-signature-size,15px);color:var(--pk-signature-color,#19191b);text-align:left}\n.pk-css-page .ps-author-desc small{font-size:12px;color:#94959b}\n.pk-css-page .ps-dock{position:relative;display:flex;justify-content:center;align-items:center;gap:12px;margin:20px auto 0;width:max-content;max-width:calc(100% - 28px);height:48px;padding:0 17px;border-radius:30px;background:#fff;border:1px solid #e7e7e9;box-shadow:0 3px 12px rgba(0,0,0,.12);white-space:nowrap}\n.pk-css-page .ps-dock>.ps-icon{width:21px;height:21px}\n.pk-css-page .ps-tool{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600}\n.pk-css-page .ps-tool .ps-icon{width:22px;height:22px}\n.pk-css-page .ps-tool b{font-size:12px;font-weight:600}\n\n/* v30: the channel header is always the site name; author byline stays independently editable. */\n.pk-css-page .ps-channel-name{font-weight:750;letter-spacing:-.035em}\n\n\n/* v31 · 仅修正 POSTYPE 图标和信息对齐。插件仍会生成 SVG 占位，\n   这里使用内嵌 PNG 覆盖它，避免旧齿轮路径变形及 iOS 字体回退。 */\n.pk-css-page .ps-byline{align-items:center;justify-content:flex-start;gap:10px;}\n.pk-css-page .ps-bytext{margin:0;max-width:none;}\n.pk-css-page .ps-bytext .ps-author-name,\n.pk-css-page .ps-bytext .ps-meta{width:100%;text-align:left;}\n.pk-css-page .ps-bytools{display:flex;align-items:center;justify-content:flex-end;gap:12px;margin-left:auto;}\n.pk-css-page .ps-icon[data-pk-icon]{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;}\n.pk-css-page .ps-icon[data-pk-icon]>svg{display:none!important;}\n.pk-css-page .ps-icon[data-pk-icon]::before{content:\"\";display:block;flex:none;width:100%;height:100%;background-repeat:no-repeat;background-position:center;background-size:contain;}\n.pk-css-page .ps-bytools .ps-icon{width:19px;height:19px;}\n.pk-css-page .ps-nav-left .ps-icon{width:21px;height:21px;}\n.pk-css-page .ps-dock{gap:11px;min-height:44px;height:44px;padding:0 13px;margin:20px auto 0;}\n.pk-css-page .ps-dock>.ps-icon{width:19px;height:19px;}\n.pk-css-page .ps-tool .ps-icon{width:20px;height:20px;}\n.pk-css-page .ps-tool{gap:3px;}\n.pk-css-page .ps-icon[data-pk-icon=\"house\"]{width:19px;height:19px;}\n\n.pk-css-page .ps-icon[data-pk-icon=\"chevron-left\"]::before{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACaklEQVR42u3cP2tTURzG8eecg5VSStJ7tXTIcCGTVFyF4OQkdvBd+AocBAsFwaGDb8NFcVaRUmc3QSwxgYwu6c2gIMjNdepQKiRCm/P783zXBHL6fMItlHIAxhhjjDHGGGOMMcYYY4xZL3j5QXu93vra2sbjENq7AH6GEF+NRifHBFhBVbW7k9Kf9wDunH+l3R+Pv78gwNWPfwTg1j9ebpoGtyeT4Umu80XH4wNAijE8yHnG6Hh8EUXn4zfzefuOAJm++W2L5zmf/+Z+Cff7/W0gHQHYXeLtL8fj4RM+ghyPbwZA6/gmADSPrx5A+/iqASyMrxbAyvgqASyNrw7A2viqACyOrwbA6vgqACyPLx7A+viiATyMLxbAy/giATyNLw7A2/iiADyOLwbA6/giADyPnx3A+/hZATh+RoCqqrpAOl5m/BBwaHX8bAApXX+GJf5vJwQcjkbDpzBcpkdQu8fxBf8pwlMpx4cWxY0KwGDB2+6VZbl+ejr9SIBLrtPZ/BxjegTgpneELACz2ex3UXRfA/EhgO1FCEVRbtb19AMBLrG6rn8VRffNkggDqwgp54cTITMAEQQAeEdIUg7iFSFJOoxHhCTtQN4QksRDeUJIUg/mBSFJPpwHhCT9gNYRkoZDWkZIWr4pVhHUAFhFUAVgEUEdgDUElQCWENQCWEFQDWABQT2AdgQTAJoRzACcIXQ6O29jnO9h8b+8DLa2yraup59yntnkvaH/c2kf7w29giaTrz+a5tp9AN8WPQF4b2h+BBAgHwLvDV0hwpeLr7YHvDd0RUm9vp4xxhhjjDHGGGOMMcYYY/b7C/mAuDKdr2LMAAAAAElFTkSuQmCC\");}\n.pk-css-page .ps-icon[data-pk-icon=\"chevron-right\"]::before{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAChElEQVR42u3cwWoTURjF8TNz00JBCc6kpctAxljxFURKaEFqfQFfxEUXuqjgC7hx71J3gqAUt+4jJbtZBBHqZAZUqpU715WLgpJZjJn7fff8l8lALudXmtLFBRhjjDHGGGOMMcYYY4wxpr3Ih0Nk2c6uc/UDAFeciz5cXHx/Pp/Pzwmwgkaj60dAdHz5VTe1dn0/zz9+JsB/bDgc7xiDKQDzl7dPrV2baEeIO/3wOLr7j/EB4KYxv06Gw1vbBOgu9QidAtS1ewPAhoxguvzwqiq+pGkaA9hd8uhmHNf3+v3tl1V19o0ALbZYFO+TZLAG4E4DhPtbW4NXRVF8JUCLlWVx0hBhUNc41IRgfDlIqAjGp8OEiGB8O1BoCMbHQ4WEYHw9WCgIxufDhYBgfD+gdgQj4ZCaEYyUnxStCGIAtCKIAtCIIA5AG4JIAE0IYgG0IIgG0IAgHkA6ggoAyQhqAKQiqAKQiKAOQBqCSoA/CGmabgC43QDhoN+/+qKqqh8EaLHFonjXEGEzjnu9sizeEqA7hGtlWTxb9flisE5TD5Bl46fO4eHyJ6PXBOhsfJxa+/MJAVpsNLpx3HD8Wa8X7eV5XhGgxfEBd9Rw/MlsNvvE74AAx1cHIG18VQASx1cDIHV8FQCSxxcPIH180QAaxhcLoGV8kQCaxhcHoG18UQAaxxcDoHV8EQCax/ceQPv4XgOEML63AKGM7yVASON7BxDa+F4BhDi+NwChjg94cG9olo0fO4dHDR5VeY2lz/eGqh+/819BS+4NVT++hH9FqL891+d7Q4O4urjze0OTJLFANLn8jptau77Hy7tX9pdQuNfXM8YYY4wxxhhjjDHGGGNMf78BaFgudQlB1RYAAAAASUVORK5CYII=\");}\n.pk-css-page .ps-icon[data-pk-icon=\"house\"]::before{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAACZUlEQVR42u2YwUobQRiA/1mlKD1pezFgIWzIemk81EcQvGiPPkIo9DV6Ll59APFuL/UWKb3VUy9tyYbgxZMExIsQHA+9FarJ7M7MP5vvOyZZmMy3s/+XiAAAAAAAwKJhEl77Up4Xn0XsyuZm6+NgMJgiIBC9Xu/l3d39qTH24O8r9twYezgcDm8R4JmiKFrTqT0TkXf/vPXT2un+aDS6QoAn2u2il2XyRcS++c9HrkWyg7L8dZnKd8pSWWins7WXZfbbE5svIrJh7cNFp1O8T2aQpbDIPO/2ReyJiKw+e6SNvBCRw7W11/eTyc13BFQvnSMR+TTnac2Mkd319Vet7e23X8fj8QMzoHLpuKK7kFQKeKJ0XFFbSOoEzFA6rqgsJFUVNGPpuKKykNQM4XlKx/m4KywkDQJcS8f51GsqpKgzoL7SSbeQognwUDpJFlIUAR5LJ7lCCl5BnksnuUIKOoRDlE5qhRRKQOjSSaaQvM+A+KWju5C8ClBUOmoLyZsAhaWjspC8PI+Vlo7KQqp9CGsuHY2FVKeAVEpHVSHVMgPSLZ34hVRZQANKJ2ohVRLQoNKJVkjOz+qGlU60QnIawk0snViFNK+AppdO8EKaeQYsXumEKaSZBCxw6XgvpGcFUDp+CymjdOIW0hKlE7eQavkrIs+7PxZwPlyW5Z+dyvnEfeqeO7X0K/sY+QcEW4AABAACEAAIQAAgAAEQluU0lmmOy/L3h3muyPPusYj0OQGAAAQAAhAACEAAIAABgAAEAAIQAAhAACAAAQgABCAAEIAAQAACAAEIAAQAAAAAAAAAAAA0kEeNYE1WhzjjOQAAAABJRU5ErkJggg==\");}\n.pk-css-page .ps-icon[data-pk-icon=\"share\"]::before{background-image:url(\"data:image/png;base64,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\");}\n.pk-css-page .ps-icon[data-pk-icon=\"settings\"]::before{background-image:url(\"data:image/png;base64,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\");}\n.pk-css-page .ps-icon[data-pk-icon=\"list\"]::before{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAADrklEQVR42u3cQWgUVxgH8P/3ZrMaykKygkjcysaMO6EhFZRGakURFG0FkULbS6/twUMP0kubQrGaChXamwcvvRUq1IOgVfSgYFRS0oOwJbOdbJZm20Nj3IKVaHb3PQ9uISSbdWYcaTvz/x33e/Nm+L733syQyQOIiIiIiIiIiIiIiIiI4kyCHrB5c+EtEbwBAMZgvFwuXQp78k2bhntTqcfblZLeuCRUa90E1G/lsvszAB1ZARzHyTQa5jyAfctC11Ipedt13QdBLnRgYMvHgJwAsDamg9vVWt6dmXHvdmqk/PZWr5vjbZIPAPtasQDJL7wHyOkYJx8AHKXMJcdxMpEUQATvhIm1YwyOJmSJ31iv43AkBQCwPmSsXcFyybnNmpejmgHlMLFV2v+SlPQrpYtRzYCzIWNtliB1CkA9Afn/KZfL/dipgeW3p/v35yd6e9elRbBjyXGLxuCr6enSKQDGb1+12r3Znp7sHRHZFnT5+p9YBHDOsvD+5OTk35G+BziO09domBEASKVkwnXdP57rUcFxMgsL6VScsp/J6IfFYnGRr5lERERERERERERERET/AYH+Imbb9pAxagzAztZPt0T0qOd5xaAnzuVy3en0Sx+KmB0AUjHL618i6jvPm7oeWQH6+wsjSuEGVn5M9Uhr7JmZKU347Sufz/dYVvoGgFfjPb7NZ9PTv451auH7qwjLwkm0/5JtbSsG/32tGY1/8gFAjufzhcFICmAMXg8TW+WIQwlZ4i2l5GAkBaAXI0ABzHi4WNupeTEh+W1qbS5HVABrFMBCm8BCK+b/qpqPxwDcjX/+zeeVSmkqssfQfL4waFkYA57+gwaA8WYTo886CR9DiYiIiIiIiIiIiIiI6F8TeKsC27ZzWssIAChlJjzPqz7PBSR9q4IgBVC2XfjSGBwD0NX6rS6Crz2v9Cl87I+2VH//lv1KyTcAhmI4sBcB/GBZ+KhUKt3r1ND3bikDA4VjAL5YdowFYFc2u+5BrTZ/239fgztFcBXAhpiuLBaAYWOwd+vW4W8rlcqqgzPId0EfhIytnHaiP1kyi+LstWq1+mbHZSXIqhEytoIxeCUpN1mt1VBUBfgzZKxdAapIDJmNqgDfd0jouWBLEM4kJPu/d3XhQiQ34b6+DbcajeZ2QOxl6b/S3Z0+Ojc353uHqFptvpjNZh8Cshvx+yjrH67WcsTz3NmI3wMGDxhjdj0dyXLT86auhL1Cbl1MREREREREREREREREFHdPAC4eHnWirvJhAAAAAElFTkSuQmCC\");}\n.pk-css-page .ps-icon[data-pk-icon=\"heart\"]::before{background-image:url(\"data:image/png;base64,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\");}\n.pk-css-page .ps-icon[data-pk-icon=\"message\"]::before{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAKjElEQVR42u1dfXBU1RX/nft2sxtA/EAEFWQ/XnYDW9GCVIQ6hlGKHbVIFUHb0trSVkdrmYq1/3SkreM4UymVWqkzgLVSKcpHp36VKoJKiwi1HTSaXd5uliREWwhBSLNJ9r17+kcyHaZD7ttv9uP9ZvJP7n25957fPeeecz9OAAcOHDhw4MCBAwcOHDhw4KCWQJXQSZ/P5yWqCwuBAMATieg8ZhoJ8GgAIOJegE5ISceIuE0Ibk2lUtGOjo6UQ0AO8Pv94zStbq6U3ETEVwI0GYCW5Z+xAMQA7AX4TU2j12Kx2GGHgGEwadLkC91ua7GUWESEzxWhbwzgPYCeJ7KeMwyjwyEAQDAYngPw9wDcBMBVomYtAC8x41eJRGxHTRKg643zmOUKADPP8BzYx4wViUTslZogQNf1CCBWMWNumZnjnVLSstbW6IGqJEDXdY+U4iEiLAfgLlOnxCTCStMcWJFMJvuqhgBd1yPM4jkAUwu0mB4BcBLA8aHfjQJwDoALCjSmD6Wk20uhDVR84Ye/yoynAB6Ry4wE8A4z3gZ4P6B9UF+vJZubmwdOV3n69Onu7u5eH5EVAWg6gKsBngnAk0PbfQDfHY8f/G2lEkC6HnqEGT/KVujM9CogNwrBLxuGcSKfTkQikVH9/eb1zHwHgBtzMH8r4/HYDwHIiiGgqanJ1d7euQ7Akiw+6wbo1y4X1kSj0c7iRNSR8S5X+m5m3ANgTBafbvJ63UuG07yyIqCpqcnV1nZ4IxHdmmEXegH8gsj6eb6zPVOEw+Gz0mn+AYAHiDAyo4WH6cX6etethSZBK/DYhMvlfgagxRmJnvCSlNoNiUTLtmPHjvWXytXp6uoa6O7uenPMmHN/B1AQQGMGfQ2bpmzs7u7aOuQIlJ8GBIOhxwDcn0HVHiJaZhjRdeXgewaDoSUAngBwVgYiWx2PR79fdgQEgw3fAOjpDJT5IBEvMAyjuZwCAJ8v1Khp+COAcAZjuCseP/hU2RDg94cuEwJ7ANTbNLfH7aabWlpausoxCrvkkkvPdbsHtgF8jU3VfmZcnUjE9p1xAiZMmFDv8YzYD2CKTdUdqVTPlzo7O3tRxvD5fF5Nq9sG4HqbqobX6/5sc3NzT16LZr4d9nhG/CwD4e+uBOEDQDKZ7LOsgQUAdtrFmKlU+tEzqgG6rk9jFu/aeFPRdNpzVVvb+92oIAQCgbOJXH8FEFFUk0RytmEY75wRDWAWj9sI/6SUNL/ShA8AiUTiUyI5/5T9ptPKj1mszkeOOX8YDIZuBvB5G9/5ntbWaBQVCsMw4kT0bZtqMwKBhkWlJoAA/MSmzlbDiD2LCodhRDcT0XPqiUYP5RrU5kRAINBwA9RbyydMU7sXVQNrGQCVGQ3renhByQgQgu6zMT2PHjr00cfVIn7DMI4w00/V6yEvKwkBuq4HmXGdosq/ent7HkeVQQhrDYB2RZXZgUDjpUUngJm+rnJfmWlVJfj7OWhBPzOtVGs+f60EJohuUxT21dXRWlQp3G6sB6DYMufbso2tsiLA5ws1QrFZRcRbynWfpxCIRqMnAWxSVJmk6/rlRSNACJpnY55+jyoHkVC6pFKKeUUjgEi5S3jC63XvqHYCDKPlbQBHFR7gNUUjAMBVirKdxTgzLcegAMDrivKZ2awDGRPg80XGAxivqPI2agREyrGeEwqF/AUnQNPMKer1gffVCgFSQjlW0+QpBScA4KCqNJWq+6BWCBg1yvshFAfzRAgUg4CJisLujo7mY7VCwIEDB/4DQLHVIiYWgQBxgYKcw6g9KC6P8diCE0AkRylKu2tN+kTK3dHRBSeAmeoVZalaI4CZVXdMzWLFAcNpB6P2cL5qTSwGAf25aEcVG6GJCvP0STEIODl8DICza0n0fr9/HKAcc3sR1gB0KcrG1dbsd9m89JEHi+AFqdwujJs6derIWhG/ELhSSY/L9UERNIBbVfz09PRPriH7P0dRmMzmTCRjAtxu8aFaQ3haLYhe1/XRUNyHIqK/ZaVNmVaMRqNJKI/j1Je0qgVS0o0A6oYvx46iEIDBzSfVLuB1qJDsK/nFPKQ6eGe3G38uFgFgxluK4gv9/tCMahZ+KBQKAPiCosrebB8YZkWApvF2G09pcTUTYFlYppYZb8xao7L1wILBUCcwrN9/hEhONAyjv9qEHw6HLzJNNjD8K6B+TcOEWCx2tGgaAEAyY4uifCyzWFSNs980eYVC+CDizdkKPxcCIITcYFPlQRRok69cEAiErwDwLfX6qK3KKajL9gPDMPYArIr0pgQC4durRfiRSKROCF5rI6tX4vGWv5eEgCGFW20TlP24Wgjo6zMfZsZlKrNMJHMeb04EWNbAs1AeySHc2Ng4ptKFr+vh+QAvt6m2wTCM90pKwFAyI9XTI7Onp6eib0g3NDRczszP2niKxy3L/WA+7YjcZoY+FsDViiq7KiFn5/CL7uQGKelV2KQuIKLlyWTzJyUngJm+DHWGwxcqVfh+fzhMZO2E+hYgmOnFQuS6yHURVqWiMYnktkoUfjDYOEsI3g3gYpvxt9XV0Z2FaDOXJ0pjATSpzI9hGEcqb8ENLQXkG1AftgNAihm3FOodRNaJUqvN/EyYEDnP40k/yYxMInhJREvi8ej+QrWfQ6baqjE/FAiE7yBKP2Zn7/8395jujcejmwvZCVd2aqqPZS6M+QkGw7MBXgxgHEAxIus3pcrnHAiErgPw8GBi8MwUH+BliURsTaH74srO/IgF+ZifUCh0vpRYwoylAE8+dXzM4v5AILSemVYXI72Bz+fzulx1C5lxH4ArsvjUZKbvJhKx9UVRw+y8hNBrwLBvhE0iedFpNED4/Q3XCkFLAcyHfQ5PBrCbCJtMU7ycTLYkc19Y9dHM4tqhdm8Gsr6/9CmRWGQYLduLZgezMz+iU6EBr8fjsbmnzPaLLYvvZKZvEsGfRx+TAPYS4QBABjMOS4mjbjene3vdxz2evpGaprlNE2OEkOOl1AJEPAXADAymU8g1MeH7zOLWRKIlVkxz6Cqk+WlqanJ1dHx8A8BLLQtfBEij/E+JfQB8g17K4BVUIQDLAjyeNAANlgUQAcwCRHlfU2VmPDkw0PtAKaL5bNaAhTblM9rbO1cAuLCCt4CiROKueLxlV8lcsQKZn0pHN8CPeL11q0v90tNVIPNTqegiwhOmOfDLZDJ5/Ex0IFOhLixwuxLAX4hoHTO1EvE9QzZ+RInG/Q+Anxo5sn7D0HuvMxcNltj8tBNhvWVpT7e2fnTo/11GKemWoZzTc2CbgzS7hRXAP4nwJ0C+UE5JY20JCAZD3wGQT5bYNAb/Yc7aRCK2HYMvzW2DJk3zzALkLICmAfwZgHzIPPV8J4AWgN4jwl5m8614PP7vstwPyYCAjUAuF674ILNYJ6XrmXwPLYDBrOydnZ3jpJQXSCmGjjv5bIBSAAaEkD0AjpimebhU/36k5FsRGaCPiLcA2lrDaHkTBcwyvmvXLhPA4aGfqoEtAUR4hdlWAw4AvDad9m6oxByhZW2CMHgdcevQfsqpOAngD1JibWtr7F1HlMXdCxK6HvoKwPMAQErxRn296/l8E1c7cODAgQMHDhw4cODAQS3iv0cD/9pxAAKgAAAAAElFTkSuQmCC\");}\n.pk-css-page .ps-icon[data-pk-icon=\"repeat\"]::before{background-image:url(\"data:image/png;base64,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\");}\n.pk-css-page .ps-icon[data-pk-icon=\"bookmark\"]::before{background-image:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAEmUlEQVR42u2dT2gcVRzHv7/Z3Sa0tk1DUSwSkpndnWCaaLO2QakQUQpCBYtY7cWD0FoU9NBqlAh6icQWFRSVFtFDL2p7sDlUeyhFWiw9bCxNQ9zZfbtrG2uJELPE2mw2M89DUgxNSSbJbv5svh+Yy+y+33vv95mZ994uvAEIIYQQQgghhBBCFgwpVWDLir6gNV4VwQPLOUFao18EXyjlfLdsBFhW5CAgh8vsYj2olPPRkhdQU9O4IRTKXwdQWWYCRlx39P5sNjtUzKBGsVsZDOabyzD5AFAZCFQ0Fzto0QUYhre6XAdMrYvfNwNkUaGARSa4CNO6zw0D/yzFZHge7hHBa2UtwHUDHel0359LUYBt25vGxvSCCuAjiGMABRAKoABCARRAKIACCAVQAKEACiAUQAGEAiiAUAAFEAqgAEIBFEAogAIIBVAAoQAKIBRAAYQCKIBQAAUQCqAAQgEUQCiAAggFUACZBcHl2OiJXbnaATw9cerHQqGi4+rVnr95B5QY04w+FQrlLwM4AODBieNAKJTvM83ITgooEbW1tZXhcLRTBKeBu+7EeJ+IdFlW9EhTU9MaCijuVb81GFz1q9Zom6HNAmDfzZsjcdOMbqWAedLa2ho0TbtNBOe1Rv0sitoi+CUcjnbGYrEQBcwB27brrl27flZEdwJYNZcJhtZoy+WGz9fV2TYF+EdMM7K/UNA9ALbPN5jW2Cai46YZ2Y8S7hRcFtNQy7Lu1Tr4lYh+pqhGBWsA+dI07V3BoH7ZcZw/eAdMGWgjzwGB3lkm/9uJw6cIvcN1cWm8LgoAAITD4XWWFT0iIicAbPRZLAfgFaWcPUo5e0RktwgGfZbdKCInLCv6fU1N44YVLcCy6h/T2ugGsG8Wxc6IeJuVco7ePpFKJY6PjYUaAJyaRZznQ6HRS5ZlP7HixoBYLBbK5YbbtfbeBRDwWWxEa3k/nU4cBuDd+WE223sDwE7Liu4F5BNA+9hmWNcAOGNZ9mci7lsr4g4IBNyGoaHhi1rjvVkkv8fzpCWdTnx4t+RPzqhSzlHD8B4BEPc7NAD6da2NeKHgbSl7ASL4CYDfjrqAdFRVrY1lMonLfutIJpN9VVVrHwXwwXgMXzSIyMmV8Ajye9VnPQ8vZTKJc3OpJB6PFwC0RyKRLs/DMUAiRWxb2a+Ej1VWhhozGefcfAMlk8mL+fythwD5FIDmQmx6BkRkbyqV6Cpm0P7+/lsA3giH609p7X0NYBPXAVP5QcTbXOzkTyaV+u004G4BcJIC/md4YlG1K5VK/VXqypRSA0o5z4rIbgBDK1yAXADc5smLqoUilUoc97zAw4D8XFYCPM/418fXRgFpUyqxXSmVWqzOZzJ9vyuVeFJrvDPeppmm0L76trgCxsYqugGMTLNWuuJ52KZU4tAMi6qFwk2nnU7D0C2AvjLdStx1892LNSf3TS43MFJdXZ0HZMedNweAj0X0i+l0csn8HHybwcHBG+vXr/tGJLBaBC2Y+t/B25mMOlv0h3CpOjT5VYZaSy+gD6XTznksA+rqoo+LyJsiuqHUrzIkhBBCCCGEELLA/AeGj3+yKUqzjgAAAABJRU5ErkJggg==\");}\n\n/* Keep any custom signature lines editable without moving the native author row. */\n.pk-css-page .ps-author-card .ps-author-desc{align-items:flex-start;text-align:left;}\n\n\n/* v32: iOS foreignObject occasionally rasterizes box-shadow as a square gray strip.\n   Preserve the actual pill contour with its 1px border; no backdrop effects. */\n.pk-css-page .ps-dock{box-shadow:none!important;filter:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:#fff!important;isolation:isolate}\n.pk-css-page .ps-channel{background:#fff!important;box-shadow:none!important;filter:none!important}\n.pk-css-page .ps-document{background:#fff!important}\n","/* @pk-template\n{\n  \"id\": \"book_excerpt_doubleframe\",\n  \"name\": \"书摘-双线框\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"bk-page\\\">\\n  <header class=\\\"bk-header\\\">\\n    <h1 class=\\\"bk-title\\\" data-pk=\\\"title\\\"></h1>\\n    <div class=\\\"bk-author\\\" data-pk=\\\"author\\\"></div>\\n    <div class=\\\"bk-ornament\\\" aria-hidden=\\\"true\\\">✣</div>\\n  </header>\\n  <div class=\\\"bk-epigraph\\\" data-pk=\\\"subtitle\\\"></div>\\n  <main class=\\\"bk-excerpt\\\" data-pk=\\\"body\\\"></main>\\n  <footer class=\\\"bk-end\\\">— 完 —</footer>\\n</article>\"\n}\n@end-pk-template */\n\n/* 所有文字只跟随插件的共享「字色」「字体」；纸张跟随「纸色」。 */\n.pk-css-page{\n  box-sizing:border-box!important;\n  width:100%;min-height:0!important;margin:0!important;padding:0!important;\n  background:var(--pk-shared-paper,#171319)!important;\n  color:var(--pk-shared-ink,inherit)!important;\n  font-family:var(--pk-shared-font,\"Songti SC\",\"STSong\",serif)!important;\n}\n.pk-css-page .bk-page,\n.pk-css-page .bk-page *{box-sizing:border-box}\n.pk-css-page .bk-page{\n  position:relative;isolation:isolate;\n  width:100%;min-width:0;min-height:480px;\n  padding:48px 33px 47px;\n  background:transparent;color:inherit;\n  overflow-wrap:anywhere;\n}\n/* 两圈极细边线：用当前字色的透明度，不指定红色或白色。 */\n.pk-css-page .bk-page::before,\n.pk-css-page .bk-page::after{\n  content:\"\";position:absolute;pointer-events:none;\n  border:1px solid currentColor;\n}\n.pk-css-page .bk-page::before{inset:6px;opacity:.34}\n.pk-css-page .bk-page::after{inset:10px;opacity:.13}\n.pk-css-page .bk-header{text-align:center;color:inherit}\n.pk-css-page .bk-title{\n  margin:0;padding:0;\n  font-family:inherit!important;\n  font-size:25px!important;line-height:1.4!important;\n  font-weight:650!important;letter-spacing:.23em;\n  text-align:center;color:inherit!important;\n  white-space:pre-wrap;overflow-wrap:anywhere;\n}\n.pk-css-page .bk-author{\n  margin:11px 0 0;\n  font-family:inherit!important;font-weight:400!important;\n  font-size:12px!important;line-height:1.65!important;\n  letter-spacing:.13em;text-align:center;\n  opacity:.65;color:inherit!important;\n  white-space:pre-wrap;\n}\n.pk-css-page .bk-ornament{\n  margin:9px auto 0;\n  font-size:19px;line-height:1.2;\n  font-family:Georgia,serif;\n  letter-spacing:0;opacity:.55;\n  color:inherit;\n}\n.pk-css-page .bk-epigraph{\n  margin:29px auto 0;\n  max-width:100%;\n  font-family:Georgia,\"Times New Roman\",serif!important;\n  font-weight:400!important;\n  font-size:11.5px!important;line-height:1.6!important;\n  letter-spacing:0!important;text-align:center;\n  color:inherit!important;opacity:.75;\n  white-space:pre-wrap;overflow-wrap:anywhere;\n}\n.pk-css-page .bk-epigraph[hidden]{display:none!important}\n.pk-css-page .bk-excerpt{\n  display:flex;flex-direction:column;gap:12px;\n  width:100%;min-width:0;\n  margin:15px 0 0;padding:0;\n  color:inherit!important;\n  font-family:inherit!important;\n  font-size:13px!important;line-height:1.86!important;\n  letter-spacing:.035em;\n  text-align:left;white-space:normal;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .bk-excerpt > p.pk-css-paragraph{\n  display:block!important;\n  margin:0!important;padding:0!important;\n  width:100%;min-width:0;\n  font-family:inherit!important;font-size:inherit!important;\n  font-weight:400!important;line-height:inherit!important;\n  letter-spacing:inherit!important;color:inherit!important;\n  white-space:pre-wrap!important;overflow-wrap:anywhere;\n  text-align:justify!important;text-align-last:auto!important;\n  text-indent:2em!important;\n}\n.pk-css-page .bk-excerpt > p.pk-css-paragraph:first-child{\n  text-indent:0!important;\n}\n/* 首字母放大取自正文首字，不把图片里的“他”写死。 */\n.pk-css-page .bk-excerpt > p.pk-css-paragraph:first-child::first-letter{\n  float:left;\n  margin:.12em .13em 0 0;\n  font-family:inherit;font-size:2.55em;line-height:.88;\n  font-weight:400;color:inherit;\n}\n.pk-css-page .bk-excerpt > p.pk-css-blank{\n  height:.5em!important;line-height:.5!important;\n  text-indent:0!important;\n}\n.pk-css-page .bk-end{\n  margin:22px 0 0;padding:0;\n  color:inherit;opacity:.48;\n  font-family:inherit;font-size:12px;\n  line-height:1.6;text-align:center;\n  letter-spacing:.14em;\n}\n@media(max-width:350px){\n  .pk-css-page .bk-page{padding:42px 27px 47px}\n  .pk-css-page .bk-title{font-size:23px!important}\n  .pk-css-page .bk-excerpt{font-size:12.5px!important}\n}\n","/* @pk-template\n{\n  \"id\": \"xhs_note\",\n  \"name\": \"小红书-笔记详情\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"xhs-app xhs-note\\\"><header class=\\\"xhs-nav\\\">\\n  <div class=\\\"xhs-left\\\"><span class=\\\"xhs-icon xhs-back\\\"></span><span class=\\\"xhs-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"xhs-author\\\" data-pk=\\\"author\\\"></span></div>\\n  <div class=\\\"xhs-actions\\\"><span class=\\\"xhs-follow\\\">关注</span><span class=\\\"xhs-icon xhs-share\\\"></span></div>\\n</header>\\n<section class=\\\"xhs-media\\\"><div class=\\\"xhs-cover\\\" data-pk=\\\"image\\\">\\n  <div class=\\\"xhs-cover-fallback\\\"><span class=\\\"xhs-placeholder-txt\\\">点击图片占位上传配图</span><div class=\\\"xhs-fallback-abstract\\\"><span></span><span></span><span></span></div></div>\\n</div><span class=\\\"xhs-pagecount\\\">1/1</span></section>\\n<section class=\\\"xhs-content\\\"><h1 class=\\\"xhs-title\\\" data-pk=\\\"title\\\"></h1><div class=\\\"xhs-maintext\\\" data-pk=\\\"body\\\"></div><p class=\\\"xhs-subtitle\\\" data-pk=\\\"subtitle\\\"></p><div class=\\\"xhs-postmeta\\\"><span data-pk=\\\"date\\\"></span></div></section>\\n<footer class=\\\"xhs-footer\\\">\\n  <div class=\\\"xhs-composer\\\"><span class=\\\"xhs-icon xhs-write\\\"></span><span>说点什么...</span></div>\\n  <div class=\\\"xhs-metrics\\\"><span class=\\\"xhs-metric\\\"><i class=\\\"xhs-icon xhs-heart\\\"></i><b>0</b></span><span class=\\\"xhs-metric\\\"><i class=\\\"xhs-icon xhs-star\\\"></i><b>收藏</b></span><span class=\\\"xhs-metric\\\"><i class=\\\"xhs-icon xhs-comment\\\"></i><b>0</b></span></div>\\n</footer></div>\"\n}\n@end-pk-template */\n\n.pk-css-page{background:#fff!important;color:#222;font:400 14px/1.52 \"PingFang SC\",\"Noto Sans CJK SC\",\"Microsoft YaHei\",Arial,sans-serif;letter-spacing:0}\n.pk-css-page .xhs-app{display:flex;flex-direction:column;min-height:680px;width:100%;background:#fff;overflow:hidden}\n.pk-css-page .xhs-nav{height:67px;min-height:67px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 13px 0 12px;border-bottom:1px solid #f1f1f2;background:#fff}\n.pk-css-page .xhs-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}\n.pk-css-page .xhs-actions{display:flex;align-items:center;gap:11px;flex:none}\n.pk-css-page .xhs-author{font-size:15px;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;color:#242424;letter-spacing:-.015em}\n.pk-css-page .xhs-avatar,.pk-css-page .xhs-sm-avatar,.pk-css-page .xhs-comment-avatar,.pk-css-page .xhs-nested-avatar{flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:#f0f0f2;color:#888;font-weight:600;line-height:1}\n.pk-css-page .xhs-avatar{width:38px;height:38px;font-size:16px}\n.pk-css-page .xhs-follow{display:inline-flex;align-items:center;justify-content:center;border:1px solid #ff3856;color:#ff3856;background:#fff;border-radius:40px;width:62px;height:32px;font-size:14px;font-weight:550;white-space:nowrap}\n.pk-css-page .xhs-icon{display:inline-block;flex:none;width:23px;height:23px;background-position:center;background-repeat:no-repeat;background-size:contain;vertical-align:middle}\n.pk-css-page .xhs-back{width:23px;height:25px;background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%222.1%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m15.5%204-8%208%208%208%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-share{width:24px;height:25px;background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.65%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M14.2%204.4%2021%2010.5l-6.8%206.1v-3.8c-5.9-.2-9.1%202.1-11.3%206.8%200-9.9%205.2-12.6%2011.3-12.6V4.4Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-heart{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.7%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M20.4%205.1a5.2%205.2%200%200%200-7.3%200L12%206.2l-1.1-1.1a5.2%205.2%200%200%200-7.3%207.3L12%2021l8.4-8.6a5.2%205.2%200%200%200%200-7.3Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-star{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.65%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m12%202.6%202.9%206%206.7%201-4.8%204.7%201.1%206.7-5.9-3.1-5.9%203.1%201.1-6.7-4.8-4.7%206.7-1L12%202.6Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-comment{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M5%2019.3c-1.2-1.1-2.3-3.6-2.3-6.8%200-5.7%204.1-9.3%209.3-9.3s9.3%203.6%209.3%209.3-4.1%209.3-9.3%209.3c-1.4%200-2.8-.2-4.1-.8L4%2021l1-1.7Z%22%2F%3E%3Ccircle%20cx%3D%228%22%20cy%3D%2212%22%20r%3D%22.7%22%20fill%3D%22%23262626%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%22.7%22%20fill%3D%22%23262626%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2212%22%20r%3D%22.7%22%20fill%3D%22%23262626%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-write{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.65%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%2016.8%2012.6-12.6a2.1%202.1%200%200%201%203%203L7%2019.8l-4%201%201-4Z%22%2F%3E%3Cpath%20d%3D%22m14.8%206%203.2%203.2%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-sort{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M3.5%207.5h17M6.5%2012h11M9.5%2016.5h5%22%2F%3E%3C%2Fsvg%3E\");width:18px;height:18px}\n.pk-css-page .xhs-mic{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%229%22%20y%3D%223%22%20width%3D%226%22%20height%3D%2211%22%20rx%3D%223%22%2F%3E%3Cpath%20d%3D%22M6%2011.5a6%206%200%200%200%2012%200M12%2017.5V22m-4%200h8%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-photo{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.45%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%222.5%22%20y%3D%223.5%22%20width%3D%2219%22%20height%3D%2217%22%20rx%3D%222.3%22%2F%3E%3Ccircle%20cx%3D%228%22%20cy%3D%228.3%22%20r%3D%221.5%22%2F%3E%3Cpath%20d%3D%22m3.4%2017.3%205.4-5%204.2%203.6%203.3-3.2%204.7%204.6%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-face{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229.2%22%2F%3E%3Cpath%20d%3D%22M8%209.5h.1m7.8%200h.1M8.1%2015.2a5.8%205.8%200%200%200%207.8%200%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-footer{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:12px 13px;border-top:1px solid #efeff0;background:#fff;min-height:60px;margin-top:auto}\n.pk-css-page .xhs-composer{display:flex;align-items:center;gap:8px;flex:1 1 40%;min-width:0;height:38px;border-radius:21px;background:#f4f4f6;padding:0 12px;color:#939399;font-size:13px;white-space:nowrap}\n.pk-css-page .xhs-composer .xhs-icon{width:17px;height:17px;opacity:.55}\n.pk-css-page .xhs-composer span:not(.xhs-icon){min-width:0;overflow:hidden;text-overflow:ellipsis}\n.pk-css-page .xhs-metrics{display:flex;align-items:center;justify-content:flex-end;flex:1 1 55%;min-width:0;gap:9px}\n.pk-css-page .xhs-metric{display:inline-flex;align-items:center;gap:3px;white-space:nowrap;min-width:0}\n.pk-css-page .xhs-metric .xhs-icon{width:24px;height:24px}\n.pk-css-page .xhs-metric b{font-size:12px;font-weight:450;white-space:nowrap}\n.pk-css-page .pk-hole{background:var(--pk-hole-bg,#eee);color:transparent;border-radius:2px}\n\n.pk-css-page .xhs-media{position:relative;width:100%;background:#f2f4f9}\n.pk-css-page .xhs-cover{height:auto;aspect-ratio:390/472;display:flex;align-items:center;justify-content:center;overflow:hidden;background-color:#edf0f8;background-position:center center;background-repeat:no-repeat}\n.pk-css-page .xhs-cover-fallback{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(130deg,#f4f2f8 0%,#e9eff9 50%,#f6eff2 100%)}\n.pk-css-page .xhs-placeholder-txt{position:absolute;top:31px;left:0;right:0;text-align:center;color:#888b99;font-size:13px;letter-spacing:1px;z-index:2}\n.pk-css-page .xhs-fallback-abstract{width:80%;height:55%;display:grid;grid-template-columns:1fr 1fr;gap:12px;opacity:.72}\n.pk-css-page .xhs-fallback-abstract>span{background:rgba(255,255,255,.64);border:1px solid rgba(172,184,210,.4);border-radius:10px;box-shadow:0 7px 16px rgba(111,119,147,.06)}\n.pk-css-page .xhs-fallback-abstract>span:last-child{grid-column:1/3;height:76%}\n.pk-css-page .xhs-pagecount{position:absolute;right:10px;top:10px;display:inline-flex;align-items:center;justify-content:center;color:white;background:rgba(37,37,42,.43);border-radius:16px;font-size:12px;min-width:35px;height:24px;padding:0 7px;z-index:9;pointer-events:none}\n.pk-css-page .xhs-content{padding:18px 15px 13px}\n.pk-css-page .xhs-title{margin:0 0 12px;font-size:19px;line-height:1.45;font-weight:650;letter-spacing:-.012em;overflow-wrap:anywhere;color:#222}\n.pk-css-page .xhs-maintext{font-size:15.2px;line-height:1.86;overflow-wrap:anywhere;word-break:break-word;color:#28282a;min-height:30px}\n.pk-css-page .xhs-maintext p.pk-css-paragraph{margin:0 0 5px;white-space:pre-wrap}\n.pk-css-page .xhs-maintext p.pk-css-paragraph:empty{min-height:14px}\n.pk-css-page .xhs-subtitle{font-size:13px;color:#3c82a7;margin:11px 0 0;white-space:pre-wrap}\n.pk-css-page .xhs-postmeta{margin:18px 0 0;color:#aaaab0;font-size:11px}\n.pk-css-page .xhs-discuss{margin:0 15px;border-top:1px solid #f0f0f1;padding:16px 0 14px}\n.pk-css-page .xhs-discuss-head{display:flex;align-items:center;gap:4px;font-size:13px;color:#333;font-weight:540}\n.pk-css-page .xhs-discuss-head b{font-weight:540}\n.pk-css-page .xhs-discuss-head .xhs-sort{margin-left:5px}\n.pk-css-page .xhs-discuss-teaser{display:flex;align-items:center;gap:7px;height:65px;color:#c4c4c6;font-size:12px}\n.pk-css-page .xhs-discuss-teaser .xhs-icon{width:17px;height:17px;opacity:.3}\n\n.pk-css-page .xhs-media .xhs-cover { aspect-ratio:390/230!important; height:auto!important; min-height:0!important; overflow:hidden!important; }\n.pk-css-page .xhs-media .xhs-cover .xhs-cover-fallback { height:100%!important; }\n\n.pk-css-page .xhs-subtitle{color:#326da3!important;font-weight:400}\n.pk-css-page .xhs-subtitle .pk-xhs-tag{color:#326da3!important;display:inline;white-space:normal}\n\n/* xhs-media layering */\n.pk-css-page .xhs-media{isolation:isolate}\n.pk-css-page .xhs-media .xhs-cover{position:relative;z-index:0}\n.pk-css-page .xhs-media .xhs-pagecount{z-index:9!important;pointer-events:none}\n.pk-css-page .xhs-media .xhs-cover .pk-slot-photo{object-fit:contain!important}\n.pk-css-page .xhs-subtitle.pk-xhs-tags{display:flex;flex-wrap:wrap;column-gap:6px;row-gap:3px}\n.pk-css-page .xhs-subtitle .pk-xhs-tag{white-space:nowrap;color:#326da3!important}\n\n.pk-css-page .xhs-media{position:relative!important;isolation:isolate!important;overflow:visible!important}\n.pk-css-page .xhs-cover{position:relative;isolation:isolate;z-index:0;overflow:hidden!important}\n.pk-css-page .xhs-cover .pk-slot-photo{object-fit:contain!important;max-width:none!important}\n.pk-css-page .xhs-media>.xhs-pagecount{position:absolute!important;right:10px!important;top:10px!important;z-index:100!important;pointer-events:none!important}\n","/* @pk-template\n{\n  \"id\": \"xhs_comments\",\n  \"name\": \"小红书 · 评论页\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"xhs-app xhs-comments\\\"><header class=\\\"xhs-nav\\\">\\n  <div class=\\\"xhs-left\\\"><span class=\\\"xhs-icon xhs-back\\\"></span><span class=\\\"xhs-avatar\\\" data-pk=\\\"avatar\\\"></span><span class=\\\"xhs-author\\\" data-pk=\\\"author\\\"></span></div>\\n  <div class=\\\"xhs-actions\\\"><span class=\\\"xhs-follow\\\">关注</span><span class=\\\"xhs-icon xhs-share\\\"></span></div>\\n</header>\\n<section class=\\\"xhs-comment-main\\\"><h2 class=\\\"xhs-countline\\\">共 <span data-pk=\\\"comments\\\"></span> 条评论 <span class=\\\"xhs-icon xhs-sort\\\"></span></h2>\\n<div class=\\\"xhs-prompt\\\"><span class=\\\"xhs-sm-avatar\\\" data-pk=\\\"avatar\\\"></span><div class=\\\"xhs-inputbar\\\"><span>爱评论的人运气都不差</span><i class=\\\"xhs-icon xhs-mic\\\"></i><i class=\\\"xhs-icon xhs-photo\\\"></i></div></div>\\n<div class=\\\"xhs-thread\\\"><span class=\\\"xhs-comment-avatar\\\" data-pk=\\\"avatar\\\"></span><div class=\\\"xhs-thread-core\\\"><div class=\\\"xhs-thread-author\\\" data-pk=\\\"author\\\"></div><div class=\\\"xhs-thread-text\\\" data-pk=\\\"body\\\"></div><div class=\\\"xhs-thread-tail\\\"><span data-pk=\\\"date\\\"></span><span>回复</span><i class=\\\"xhs-icon xhs-heart\\\"></i><i class=\\\"xhs-icon xhs-face\\\"></i></div>\\n<div class=\\\"xhs-nested\\\"><span class=\\\"xhs-nested-avatar\\\" data-pk=\\\"avatar\\\"></span><div class=\\\"xhs-nested-inner\\\"><div class=\\\"xhs-nested-author\\\"><span data-pk=\\\"author\\\"></span><span class=\\\"xhs-author-label\\\">作者</span></div><p class=\\\"xhs-nested-message\\\" data-pk=\\\"subtitle\\\"></p><div class=\\\"xhs-nested-tail\\\">回复 <i class=\\\"xhs-icon xhs-heart\\\"></i></div></div></div>\\n</div></div>\\n</section><footer class=\\\"xhs-footer\\\">\\n  <div class=\\\"xhs-composer\\\"><span class=\\\"xhs-icon xhs-write\\\"></span><span>说点什么...</span></div>\\n  <div class=\\\"xhs-metrics\\\"><span class=\\\"xhs-metric\\\"><i class=\\\"xhs-icon xhs-heart\\\"></i><b data-pk=\\\"likes\\\"></b></span><span class=\\\"xhs-metric\\\"><i class=\\\"xhs-icon xhs-star\\\"></i><b>收藏</b></span><span class=\\\"xhs-metric\\\"><i class=\\\"xhs-icon xhs-comment\\\"></i><b data-pk=\\\"comments\\\"></b></span></div>\\n</footer></div>\"\n}\n@end-pk-template */\n\n/* 小红书移动端页面；不含 iPhone 状态栏、不复制参考帖内容 */\n.pk-css-page{background:#fff!important;color:#222;font:400 14px/1.52 \"PingFang SC\",\"Noto Sans CJK SC\",\"Microsoft YaHei\",Arial,sans-serif;letter-spacing:0}\n.pk-css-page .xhs-app{display:flex;flex-direction:column;min-height:680px;width:100%;background:#fff;overflow:hidden}\n.pk-css-page .xhs-nav{height:67px;min-height:67px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 13px 0 12px;border-bottom:1px solid #f1f1f2;background:#fff}\n.pk-css-page .xhs-left{display:flex;align-items:center;gap:10px;flex:1;min-width:0}\n.pk-css-page .xhs-actions{display:flex;align-items:center;gap:11px;flex:none}\n.pk-css-page .xhs-author{font-size:15px;font-weight:550;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;color:#242424;letter-spacing:-.015em}\n.pk-css-page .xhs-avatar,.pk-css-page .xhs-sm-avatar,.pk-css-page .xhs-comment-avatar,.pk-css-page .xhs-nested-avatar{flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;background:#f0f0f2;color:#888;font-weight:600;line-height:1}\n.pk-css-page .xhs-avatar{width:38px;height:38px;font-size:16px}\n.pk-css-page .xhs-follow{display:inline-flex;align-items:center;justify-content:center;border:1px solid #ff3856;color:#ff3856;background:#fff;border-radius:40px;width:62px;height:32px;font-size:14px;font-weight:550;white-space:nowrap}\n.pk-css-page .xhs-icon{display:inline-block;flex:none;width:23px;height:23px;background-position:center;background-repeat:no-repeat;background-size:contain;vertical-align:middle}\n.pk-css-page .xhs-back{width:23px;height:25px;background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%222.1%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m15.5%204-8%208%208%208%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-share{width:24px;height:25px;background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.65%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M14.2%204.4%2021%2010.5l-6.8%206.1v-3.8c-5.9-.2-9.1%202.1-11.3%206.8%200-9.9%205.2-12.6%2011.3-12.6V4.4Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-heart{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.7%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M20.4%205.1a5.2%205.2%200%200%200-7.3%200L12%206.2l-1.1-1.1a5.2%205.2%200%200%200-7.3%207.3L12%2021l8.4-8.6a5.2%205.2%200%200%200%200-7.3Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-star{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.65%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m12%202.6%202.9%206%206.7%201-4.8%204.7%201.1%206.7-5.9-3.1-5.9%203.1%201.1-6.7-4.8-4.7%206.7-1L12%202.6Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-comment{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M5%2019.3c-1.2-1.1-2.3-3.6-2.3-6.8%200-5.7%204.1-9.3%209.3-9.3s9.3%203.6%209.3%209.3-4.1%209.3-9.3%209.3c-1.4%200-2.8-.2-4.1-.8L4%2021l1-1.7Z%22%2F%3E%3Ccircle%20cx%3D%228%22%20cy%3D%2212%22%20r%3D%22.7%22%20fill%3D%22%23262626%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%22.7%22%20fill%3D%22%23262626%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2212%22%20r%3D%22.7%22%20fill%3D%22%23262626%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-write{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.65%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m4%2016.8%2012.6-12.6a2.1%202.1%200%200%201%203%203L7%2019.8l-4%201%201-4Z%22%2F%3E%3Cpath%20d%3D%22m14.8%206%203.2%203.2%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-sort{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M3.5%207.5h17M6.5%2012h11M9.5%2016.5h5%22%2F%3E%3C%2Fsvg%3E\");width:18px;height:18px}\n.pk-css-page .xhs-mic{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%229%22%20y%3D%223%22%20width%3D%226%22%20height%3D%2211%22%20rx%3D%223%22%2F%3E%3Cpath%20d%3D%22M6%2011.5a6%206%200%200%200%2012%200M12%2017.5V22m-4%200h8%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-photo{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.45%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Crect%20x%3D%222.5%22%20y%3D%223.5%22%20width%3D%2219%22%20height%3D%2217%22%20rx%3D%222.3%22%2F%3E%3Ccircle%20cx%3D%228%22%20cy%3D%228.3%22%20r%3D%221.5%22%2F%3E%3Cpath%20d%3D%22m3.4%2017.3%205.4-5%204.2%203.6%203.3-3.2%204.7%204.6%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-face{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23262626%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%229.2%22%2F%3E%3Cpath%20d%3D%22M8%209.5h.1m7.8%200h.1M8.1%2015.2a5.8%205.8%200%200%200%207.8%200%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .xhs-footer{display:flex;align-items:center;justify-content:space-between;gap:9px;padding:12px 13px;border-top:1px solid #efeff0;background:#fff;min-height:60px;margin-top:auto}\n.pk-css-page .xhs-composer{display:flex;align-items:center;gap:8px;flex:1 1 40%;min-width:0;height:38px;border-radius:21px;background:#f4f4f6;padding:0 12px;color:#939399;font-size:13px;white-space:nowrap}\n.pk-css-page .xhs-composer .xhs-icon{width:17px;height:17px;opacity:.55}\n.pk-css-page .xhs-composer span:not(.xhs-icon){min-width:0;overflow:hidden;text-overflow:ellipsis}\n.pk-css-page .xhs-metrics{display:flex;align-items:center;justify-content:flex-end;flex:1 1 55%;min-width:0;gap:9px}\n.pk-css-page .xhs-metric{display:inline-flex;align-items:center;gap:3px;white-space:nowrap;min-width:0}\n.pk-css-page .xhs-metric .xhs-icon{width:24px;height:24px}\n.pk-css-page .xhs-metric b{font-size:12px;font-weight:450;white-space:nowrap}\n.pk-css-page .pk-hole{background:var(--pk-hole-bg,#eee);color:transparent;border-radius:2px}\n\n.pk-css-page .xhs-comment-main{flex:1 1 auto;min-height:400px;padding:20px 16px 30px;background:#fff}\n.pk-css-page .xhs-countline{display:flex;align-items:center;gap:5px;color:#2c2c2d;font-weight:560;font-size:15px;margin:0 0 22px}\n.pk-css-page .xhs-countline .xhs-sort{margin-left:3px}\n.pk-css-page .xhs-prompt{display:flex;align-items:center;gap:12px;margin-bottom:28px}\n.pk-css-page .xhs-sm-avatar{width:38px;height:38px}\n.pk-css-page .xhs-inputbar{display:flex;align-items:center;gap:8px;flex:1;min-width:0;height:44px;border-radius:25px;background:#f6f6f8;color:#a7a7aa;padding:0 13px;font-size:13px}\n.pk-css-page .xhs-inputbar>span{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}\n.pk-css-page .xhs-inputbar .xhs-icon{width:20px;height:20px;opacity:.55}\n.pk-css-page .xhs-thread{display:flex;gap:12px;align-items:flex-start;margin:0 0 20px}\n.pk-css-page .xhs-comment-avatar{width:38px;height:38px}\n.pk-css-page .xhs-thread-core{flex:1;min-width:0}\n.pk-css-page .xhs-thread-author{font-size:13.5px;color:#a0a0a5;font-weight:500;margin:-2px 0 7px;overflow-wrap:anywhere}\n.pk-css-page .xhs-thread-text{font-size:16px;line-height:1.65;color:#28282a;overflow-wrap:anywhere;min-height:25px}\n.pk-css-page .xhs-thread-text p.pk-css-paragraph{margin:0 0 6px;white-space:pre-wrap}\n.pk-css-page .xhs-thread-tail,.pk-css-page .xhs-nested-tail{display:flex;align-items:center;gap:12px;font-size:12px;color:#99999e;margin-top:9px}\n.pk-css-page .xhs-thread-tail .xhs-icon{width:18px;height:18px;opacity:.75}\n.pk-css-page .xhs-thread-tail .xhs-heart{margin-left:auto}\n.pk-css-page .xhs-nested{display:flex;align-items:flex-start;gap:8px;margin:18px 0 0}\n.pk-css-page .xhs-nested:has(.xhs-nested-message[hidden]){display:none}\n.pk-css-page .xhs-nested-avatar{width:25px;height:25px;font-size:10px}\n.pk-css-page .xhs-nested-inner{flex:1;min-width:0}\n.pk-css-page .xhs-nested-author{display:flex;align-items:center;gap:5px;color:#a0a0a5;font-size:12.5px;margin:0 0 5px}\n.pk-css-page .xhs-author-label{color:#ff3856;background:#fff1f3;border-radius:12px;padding:1px 7px;font-size:10px}\n.pk-css-page .xhs-nested-message{margin:0;color:#28282a;font-size:15px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere}\n.pk-css-page .xhs-nested-tail{margin-top:5px}\n.pk-css-page .xhs-nested-tail .xhs-icon{margin-left:auto;width:17px;height:17px;opacity:.7}\n","/* @pk-template\n{\n  \"id\": \"twitter_day\",\n  \"name\": \"推特\",\n  \"width\": 460,\n  \"html\": \"<div class=\\\"tw-screen\\\">\\n  <article class=\\\"tw-post\\\">\\n    <header class=\\\"tw-head\\\">\\n      <span class=\\\"tw-avatar\\\" data-pk=\\\"avatar\\\"></span>\\n      <div class=\\\"tw-identity\\\">\\n        <div class=\\\"tw-displayline\\\"><strong class=\\\"tw-name\\\" data-pk=\\\"author\\\"></strong><span class=\\\"tw-verified\\\" data-pk-section=\\\"twitter-verified\\\" aria-label=\\\"认证账号\\\"></span></div>\\n        <div class=\\\"tw-handle\\\" data-pk=\\\"subtitle\\\"></div>\\n      </div>\\n    </header>\\n    <main class=\\\"tw-body\\\" data-pk=\\\"body\\\"></main>\\n    <section class=\\\"tw-translation\\\" data-pk-section=\\\"twitter-translate\\\">\\n      <div class=\\\"tw-translate-head\\\"><span>由</span><span class=\\\"tw-google\\\" aria-label=\\\"Google\\\"><b class=\\\"tw-g-blue\\\">G</b><b class=\\\"tw-g-red\\\">o</b><b class=\\\"tw-g-yellow\\\">o</b><b class=\\\"tw-g-blue\\\">g</b><b class=\\\"tw-g-green\\\">l</b><b class=\\\"tw-g-red\\\">e</b></span><span>翻译自<span data-pk=\\\"twitter-language\\\">英语</span></span></div>\\n      <div class=\\\"tw-translated\\\" data-pk=\\\"note\\\"></div>\\n    </section>\\n    <footer class=\\\"tw-footer\\\"><time class=\\\"tw-time\\\" data-pk=\\\"twitter-time\\\"></time><span class=\\\"tw-time-dot\\\">·</span><time data-pk=\\\"date\\\"></time><span class=\\\"tw-dot\\\">·</span><strong>285万</strong><span>次查看</span></footer>\\n  </article>\\n</div>\"\n}\n@end-pk-template */\n\n/* 推特 X · 日间｜纯净无水印；蓝色认证徽章为内嵌图片，保证导出兼容。 */\n.pk-css-page{background:#fff!important;color:#0f1419!important;min-height:0!important;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",\"Microsoft YaHei\",Arial,sans-serif}\n.pk-css-page .tw-screen{width:100%;min-height:0;background:#fff;color:#0f1419;box-sizing:border-box;overflow:hidden}\n.pk-css-page .tw-post{box-sizing:border-box;padding:12px 12px 18px;width:100%;margin:0}\n.pk-css-page .tw-head{display:flex;align-items:flex-start;gap:10px;position:relative;min-height:48px}\n.pk-css-page .tw-avatar{display:flex;align-items:center;justify-content:center;flex:none;width:46px;height:46px;border-radius:50%;background:#e5eaee;color:#536471;font:650 20px/1 -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif;overflow:hidden}\n.pk-css-page .tw-identity{flex:1 1 auto;min-width:0;padding-top:1px}\n.pk-css-page .tw-displayline{display:flex;align-items:center;gap:5px;min-height:25px;max-width:100%}\n.pk-css-page .tw-name{font:750 20px/25px -apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",Arial,sans-serif!important;max-width:100%;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;color:#0f1419!important}\n.pk-css-page .tw-verified{width:20px;height:20px;display:inline-block;flex:none;background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAABmJLR0QA/wD/AP+gvaeTAAAYj0lEQVR4nO3deZwU1bUH8N+51TM9zDDTPQyCMgsoEBdUXHFPYl4SFBf8fJIgcYkiMyBqeNGXaPJ8PscX/eRhTEiIkswiuAUUY54ri7tRcYngSlAWYVZZZ7qHWbu76rw/ZjA8H9DdVXWrbvfc759Qde+ZrnPqVnVX3QtomqZpmqZpmqZpmqZpmqZpmqZpmqZpmqZpmpYNyO8ABpPh9+8szLNyphHwXQCnAhg58F/bALwH4lW9ffFlO68f0elflIOLLgAPlNVHhwnmnzMwB8DQg21LwB6LsBCgu5srQ20ehTho6QKQrKI2Mo0JCwGUpLnrLgLmNFaF/yIjLq2fLgBJjqhpC8WEuJuAWQ6bepyJrtWjgRy6ACQYXd9+osX0FIByN9pjoIEFT22ZWfyhG+1p/yT8DiDblNVFpzDTa3Ap+QGAgNHCojfL69svcatNrZ8uABdV1Ed+QeBnGCiU0HwBmJ6oqI3cIqHtQUtfArlhGRvl0ei9AK71pD/GoqbW0GxUU8KT/rKYLgCHRtW05gsx5DECXehpx0RPm2bXD1tnj+r2tN8sowvAgTGLOw81E4mnAEzyKYS3Ywlj6vY5hTt86j/j6QKwqaym7TgI8QwBo30OpVkQX9xQWfy+z3FkJH0TbENFfdtFJMRqBZIfAMqY6bXR9dEL/A4kE+kRIA1jFnNewoxWE+NnUO/kwQzUWVb3jfq+IHUZWwCjalrzhZVbLIKBoGVRpLmoKIppZMrqr7S2/QRB4hGAJ8jqwyWfWIKvkPqj2TI2yjo6QkJw2OpL9Fki1p6pRZc5BVDNomLUnikWzGlEdBaAw/GV+AnYw0AzgPUAPmXQeoOsdUOLwuvWTaOYnW5H13QdZonYrQDNApDj+O/wRgzMtUZOzl1bZwzdZqeBCcs4t7MjMsFkMYGYjwHhSABHo/8Hvq8+0McAPgfoTUFY1tBctALVZDn8GzyREQVQXtd2Dlj8AYSJNpuIA1hP4I8Y9CkxNhJjU1cgvnHXzEP2/J8tq1mMGRmpSBjiLCKeCmAqgFyHf4JfYgCeZKanA6b15tZrww0g4n03GH7/zsKCRM54S2A8gHEEPppBxwM4CjYLnoAPYFk/bpw97A3nf4JcyhdAWX30BmKeDyAgqYtuAG3oT5Zc9D+jnyln+nTFAWxH/98aBFAMIF9SXwkw/WvTrNBCSe27QukCKK+NTgfxEigep3ZATOCrG6uKH/I7kANRNrHK/hQdTwZ/BCDP71g0R/pMISa2ziz6zO9A9ke1r/K+RAbfB5382SBoWNbv/A7iQJQcAcrqo5OI+R2/49DcY4HOaKkKve13HF+l5AhAzN48Val5RoAr/Y5hf9QrgGoOALjI7zA0110ycGyVolwBVIyKfhPAcL/j0FxXUloeOcfvIL5KuQJg8FS/Y9DkIBbKHVvlCgBEX/c7BE0OYlZuBFDqW6BRNa35hsiPQt6vvpq/4qbVHVbpwTmlRgDDGHIKdPJns5yAMfREv4PYl1IFAMapfoegycUw/Xp9dL+UKgAClDo7aBKwsPtErxRKFQCDlPpwNPcRWKljrEwBjFvAQQBH+h2HJhcDR59cw8o8bq5MAcTzI8cge5/D1/4puB3tR/kdxF7KFIBl0Wl+x6B5xBDKHGtlCgBCF8BgIRjKHGt1CoBZmQ9Fk4uB0/2OYS8lfgkeVdMx3BDWdqhUkJpMppUrRrZcVbTb70CUSDhhWJdAkVg0TxgiZl7sdxCAIklHjO/5HYPmLVbkmPt+CXRETVsoLsQOZO7cO5o9fcEh5ohNV5R0+BmE7yNAnGgmdPIPRsFYt5jhdxC+jgADjz9vAFDqZxyab5pNq/tIPx+P9nUECIj8aujkH8zKApR/u58B+DYCjK6PXmAxPwXA8CsGTQkmgy5urgot96NzXwqgor7jLGZrJf7/LMOaj0qHCpw1KoCxYYHCHEJ7H2N9m4nXWxKI9nHyBmwiYI8pxOSWmUVvSevkwH17q7y+/RIw/RnyJmXV0nTMMAO3nJqHb5QFIPaTETET+OumGH6zpg/bu6XNet4F5suaZhU/LauD/fGsAMYs5rxEIjKPQD/2sl/t4GZMyMVtpw1BIIW7wfY+xtxXuvFas7TVWT1f5caTRCy9v32isMSfM2B1lUHlxpOCuPGk9KZfjVvANc93ySwCAPiYYV3RXDXsI5mdAJILoGJhpNjK4WoCXQf9srtSfnJiEDedbG/u4fY+xnef6JR5OQQACQYWWZa4tXV20S5ZncgpgGoOlJd2zAb4DgAlUvrQbLvhhCBuPsXZxNuPfhbDza/3uBTRQe0C47am1lA9qsn1Ycf1AqiojXybCb8FcJzbbWvOVR0XxG2nOZ91vs8ETlnSIfXboX0R8BkItzVWhh93uV13lNVETyMD94D5bLfa1Nw189ggbj/dvSUX5rzUjee2xF1rLzX0OhN+2lwZeteN1hz/Elz6YEdJWV3770nwap386rrG5eQHgKOH+fEbJp9DzG+X1bY/dHhd50inrdkvgGoWFXXtPxExazOB5jpqS5Pq6mNyXU9+AAgFffs2m4joygQSn1bUReeimm3nnq0dD12055Dy0uhzDJoPIGS3c02+K47OxR1nDpHybUd33Jvr/4MIM/j3ZaXRF0bXdB1mp4G0C6CiPvIvOab5EYDz7HSoeefSr+XiTknJDwAbI2qshU3AtywRWzO6LvKtdPdNqwDKa6PTmbESwKHpdqR5a9rXcjHvnCH7fbTBDRYDq1ul/hiWJjrMAp6vqI9emc5eKRdARX3bRSB+BPoHLeV9b3wu7paY/ADwanMCrV1qjAD7MJh5cVlddEqqO6T0EY35Y/sYM0AfQF/vK++SsTmY/818GBKTP24BFz7ZifVtprxOnImYljWxdfawxmQbpjQCmAH6DXTyK++iI+QnPwDc+U6PyskPAGFDiF+nsmHSj6q8JjIWAhtT2Vbzz5TDc3DvufkpPdXpxIL3+3DPml65nbiDycC4xmvCnx9so6QfFxmYBp38SjtvjDfJX/txxiQ/ABAsXJpso6QfGbOes1Nl55YHPEn++k/6cOc7GZP8AABOYcWhFD42HutGMJr7vlEWQO23C5Ar+YmERZ/04b/ezqzkBwAwjki2SSrnDT1nj4K+XhpA/XcKEJSc/Es+jeGOTEx+AEDyhThSKYBOFyLRXHR2aQD138mXnvxLP4vhF2/0wPcHHuwiSpq7qRTAVueRaG6ZdGh/8ucF5H4v8diGDE/+fg3JNkilANa6EIjmglMPDeDByfnIl5z8yzbEcMvrPbAyPPuJsSbZNsm/BiXxqivRaI6cPNLAg5PzUZAjN/n/srH/VcdMT34AIIjXk22TtAAamwvfAtDkSkSaLSePMPDweQUYKjn5n/08njXJD6CxobXw7WQbJb8EqiaLCUtcCUlL27HDDTwwWX7yL98Sx9xXu5FQ7vk22x5BNSX9a1L6+UQI4yHn8WjpmlBiYMn5BdLfvFq+JY4bXsmq5AexmdJJO+VPtqIuspqBM+yH5I9QkDBiSP+fuaOHPZvFwKljhxtY6kHyr9gax/UvZ1fyg+iNpsrQOalsmvKz/QyeB9CT9qPyTihIuOqYXEwdm4txYfFllTOATRELT22O4cF/xJQtBq/O/M83ZGHyAyCL5qW8bcqtMlN5fcfHqk9vePHYHNx55hCEkyRPpI/xH6t78PRmr6f1OLijhxlYOqUAw/LkJv9LjQnMerEL8SxLfgDrm1pCx6Zy/Q+k80okEYOte2yH5YHrJwZx77n5SZMfAMJBwr3n5uPGk4IeRJaarxUbWOJB8r/SlMDsl7Iy+UHE81JNfiDNd4JHcPjPALakHZUHLjwiB7ecmv7UHzeelIdfTHJ/ypB0jQ0JLDm/ACWSk//1lv4zf0zp91nsYaChsCi8NJ190iqANbMpzoxfpReWfEW5hLvOGmJ7/znHB30tgsNDAo9eUIAR+XKT/91tCVS90I2+LEz+Ab9cN41i6eyQ9lPkIzn0ABQbBa6ekItihzeMc463P1uyE4eHBJZdUICR+XIf6H/riwSuXNmN7oSaN/5OMdAQCoUeTne/tD/1NbMpDsbd6e4n09Sx7jyx7WTKcDtGFwk8OkV+8r+7LYEZq7rRk6XJDwCC8Kt0z/6AzZnhjJzQAwC22dnXbUW5hHFh9xLIqyIoL+xP/sMK5Cb/e9tNXLUqe8/8AMDADqtjj60fa219+ltnUC+D/mRnX7cdWiBcf2H5JyfKvScYVSCwdEoBSofKTf61O0z8aGUXuvyfwlAqYvpD803lthYrsH0ELIvuA+DbAsd7Mcs5uLJujA8rEHjsggJUFMpN/nW7TVy1qgudWZ78ALqtIP3R7s62j8LAsjVP2d3fLdu7WdpLG27fGB86kPyji+Qm/8e7TFz6XJeyv3S7icB/bbmqaLfd/Z0dCeJljvZ3QUeMsUniJK1u3ROMyCc8OqUAYyQn/7rdJi5f0YWOWPYnPwDHOejoaAS7wysARJ204YanNqd9858Wp0UwfAjhsSlDcURIbvKvbzNx2fIuRAbBmX9AJLe7+HknDTg6IpvmUh+AlU7acMMD62Jol3zQ7d4Yl+QRlk4pwFgXv6nan80RC1es6JL+OShmxUAO2ubCUeG/O2/DmY4Y49Y35a9YmO6N8bCB5D+yWO70DZujFi5d3omdPYMq+UFgx+uEOS4AIt7gtA03PPt5HPPXOjoZpCTVG+PiIGHJlAIcJXkdrc0RC9Oe7cSO7sGV/ABAJDY6bcN5AVgB23fgbpu/tteTIkh2OVSUS3j4/AIcIzn5t0QtTF/eNejO/F+yqN1pE44LIGGY6jxPDO+K4ECXQ4W5hEfOL8Dxw+Umf0unhctWdMlerV1pJsykM78l47gAhEUjnLbhNr+KYGgO4ZHzCnDCIfKT/wfPdaGlc/AmPwAI4Tz3nN8EMyY6bkMCr4sgP0BYPDkfJ46Qn/zTnutC857BnfwAwODjnbbhfL0vQedA0uMITs1f2wui/mt2meYcH8TUsTkYJfnBttau/uRv0snfj+nrTptw9BxZad3uMgGjAYovkn3jSXlKvfpoxxcDyd/QoZN/HxYnEhXNc4a32G3AUeIKFtOctuEFry6HZNnVw7h8hU7+/RDCML7vqAFH3RMlXYJGFZlaBLt6GJc+1yn1eadMxkTTnexvuwDKa6OnApjkpHOvZVoR7O5lTF/epcyK7Io6vbQuerrdne2PAMQ/t72vjzKlCHb3Mn64vAsb2rP3DXa3CPBNdve1dRNcsShyBJvYAEDyGiXy3HRynvRvh+xq72NMf65L9bV4VWIy0VHNlaFN6e5oawSwTNyCDE5+APjtGjVHgo4Y48oVOvnTZBDzv9nZMe0RYFRNW4UhxEZkyeJ5Kn1FuifGuGxFFz7cqZPfhniAePyWyuKkyyLtK+0RwCDx78iS5AfUuSfYE+v/qlMnv205CdDN6e6U1ggwatHucsM0NgJQ45TpIj9Hgu4E40cru/HutoQv/WeRPgvmuJaqkuZUd0hrBBCm+CmyMPkB/0aC7gTj6lU6+V0SFAikdS+Q8ghQ+mBHiYhZWwEMTTeqTOLlSNAzkPxvfaGT30VdpiXGDMxaklTKI4DRZ85Flic/0D8S/O59+SOBTn5pCgzBc1LdOKURYMxizjMT0WYAJbbDyjAyR4LeBGPG8914s1UnvwwM7AiFQuWpzBWa0giQiEcvwCBKfkDePUHcAq59SSe/TASM6IhGzk9l25QKgAiXOwspM7ldBHELmP1iN15u0skvG4OuSGW7pJdAFQsjxZyDL5Cl3/6kwo3Lob1n/hca1FqTLIv1GgE+bOuM4sjBNko6AnCAJmMQJz/gfCRIWMAcnfxey7NM+k6yjVK4BLLOciOaTNdfBL1p7xcfSP7ndfJ7jpnOTLZN8gIgOsqVaLLA/LV9uP2tnpRXV2zvY8xY1YVVOvl9wklzN5Wb4FIXIskai9fFcOGTnXi5KQHrAHMB9JnA0s9i+O4Tnfhbi77h9VFZsg2SzgpBgFBzzgf/rG8zcfWqLpQOFThzVABjQwKFuYT2Xsb6NhNvtCYGxdz86qOkX/IkLQBWYPpzVbV0Wnh8g9yp2TX7CNyRbJtULoE+diEWTfPDumQbJC8AphddCUXTvMZ4IdkmSQvA5K6nAbS5EpCmeWe31bnnmWQbJS2A1tmjugl0hzsxaZpX6PZUlk5N6VmgxpaihcR4xXlQmuaJF5tCRSmtY53a+wDVlIgFjEsBrHcSlabJR+usXDEd0yill6tTfiFm2zWFOwMInAtgre3YNE2utXFDnJvOusFpvRO8pWrodiMQOgvg+9KPTdPkYeaHTav7nG3XFO5MZz/b06OX1Ua+R4Q6AMV229A0F7QBdENTVWipnZ1tzw3aPCv8BBONY/ACAHoyG81rzMwPxxLG0XaTH3C4QMZeZfXRScR8L4BT3WhP05J4F0w3NM0KOV6j2pUCAAAwU8X90e8z41cAxrrWrqb9UyMBdzW2hOpRTa7MGe9eAQwYt4CDffmR68D0HwCGud2+NijtItAvC0NFf0plpod0uF4Ae1UsjBRbOVxNoOvgxmJ82mCUYGCRZYlbU53oKl3SCmCvspq240iIBQC+KbsvLXsQ4xUW1tymymGfSO1HZuNfYqaKushcJpqHQf6CvZZUHzFub2wN/dqt6/yD8aYABpTXtx0LFksAHOdlv1pmYOBTg/iyhsri973q09MCAIBD7tsxNC83968Akk5ZoQ0qrwaHmFM3XVGS9C0uN3leAMCXc42uAuB4pW8tK7wW7AlN3jSXPJ+f3pcCAAamW49b74Exxq8YNAUQtlo54pR0HmBzk2+rvLdcVbSbQSlPY61lKYuu9Sv5AR8LAACaK0MrAazyMwbNPwQsb5oV8vX4+1oAAGAJnud3DJo/LOa7/Y7Bt3uALzFTeX20AUC536FonmpuqgxVgMjXGcR8HwFAxGB+yu8wNG8x0RN+Jz+gQgEAYMITfsegeYvYVOKYK1EAzaHw6wTs8TsOzSOMjqZQ8Wq/wwAUKQBMIxOM9/wOQ/MI4Z1UZ22QTY0CAGAR3vE7Bs0jxMoca2UKgBT6UDS5yDKUOdbKFIAprDV+x6B5g9hQ5lj7/zvAPsrrIjsBDPc7Dk2qnU1V4RF+B7GXMiMAABDrtQgGgQ/8DmBfShUAE33odwyadB/5HcC+lCoAIj3vaLZjJs/e9kqFUgVgWqTMtwOaHMT8tt8x7Eupm+CBB+N2AijxOxRNit1NlaFDVHgGaC+lRoCBD0b/IpytCO+qlPyAagUAAOCkC5tpmYksVu7lJ+UKwEjgCQBKnSU0dxDR037H8FXKFcDWOcVbWbHvijVXvNdQFd7idxBfpVwBAIAAlvkdg+YuJjzudwz7o2QBII4a/X5AFmF0BAyu9TuM/VGyABqvC7cz6Nd+x6G5gwT+e+uM4ojfceyPkgUAAEWhonmk7wUyHgPvH2KG7vE7jgNRtgDWTaNYwjAvBtDidyyabc0M8+I1synudyAHotYvwftRWre7TMD4HwCnuNjsTgI2WcybBNE2AG1gMBMMBo8kovFgnAEg7GKffooQsNoCbyLQdmKYEBBsYRiDRwqicQyMh7uPor/HicQlzXOGK30CU74AAADVHCgvjVaBcHNac4kyOpj4EwJ9RIQPTKYPcwLWpyldj1azKC2PfENYNBvAD6DwaHkAJgiPW8S1LU3h11KZa3/M4vZwPCGOMognMuMEAiYyYwIIRWn0uwWMu5taQ/WopoSD+D2RGQWwFzOV1XZMIsM6E0wTwCgBIQ+ECCxEmdBOTE0k+DMrnvjUrbNPpq1yw8DLgs25jbNK1rnRXtkfd5WKnMBRbNGRLLiCLIQhEAIjDEYvEXYx8T/YFKubZxUp97jDwWRWAfiJmSrqo1UMzAeQ73c4B9BLjGqvVlfJBroA0tS/yo3xKMAT/I7lKz4hNqe7ddYfLDLtutZ3TZXDPumN9Z0O0DN+x7KPlTmWdbZO/vTpEcCuZWyUdUTvIsYtfobB4AXNofBNqkw0lWl0AThUXhu9DsQLABged20S4frGynCNx/1mFV0ALiiva58K0BJ4d3PcS8CVjVXhv3jUX9bSBeCS0vs7zhCW9Qzkv865ywJd1FIVUurd2kylb4Jd0jKz6C0yMAnM/5DYzQZTiLN18rtHF4CLGq8Jf95jJE5n8LMSml9lBPi01plFn0loe9DSl0AyVHOgrCx6JzF+BucnGRPAvKZQ6D/1Nz3u0wUg0cB9wUMAxtlqgLAV4KuaKov/5mpg2pf0JZBELTOL3uoR8ZNAWAggnUeC42C+t7cvdpxOfrn0COCRsvroOALfCMblAEIH2CwK8COwaH7T7PBmL+MbrHQBeGzMYs5LJCKnE9EpAB3W/6/8BVv890BO+J2tM6jX3wgHl/8FYiRy4NRpJxYAAAAASUVORK5CYII=);background-size:contain;background-position:center;background-repeat:no-repeat}\n.pk-css-page .tw-handle{display:block;font:400 16px/21px -apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",Arial,sans-serif;color:#536471;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}\n.pk-css-page .tw-body{display:block;margin-top:25px;font-size:17px;line-height:1.5;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;color:#0f1419}\n.pk-css-page .tw-body p.pk-css-paragraph{margin:0 0 10px!important;padding:0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:inherit!important}\n.pk-css-page .tw-body p.pk-css-paragraph:last-child{margin-bottom:0!important}\n.pk-css-page .tw-translation{display:block;margin-top:32px}\n.pk-css-page .tw-translate-head{display:flex;align-items:center;gap:5px;flex-wrap:wrap;color:#1d9bf0;font:400 16px/1.45 -apple-system,BlinkMacSystemFont,\"PingFang SC\",Arial,sans-serif}\n.pk-css-page .tw-google{display:inline-flex;align-items:baseline;gap:0;font:700 20px/1.2 Arial,\"Helvetica Neue\",sans-serif;letter-spacing:-.9px;margin:0 1px}\n.pk-css-page .tw-google b{font-weight:700}\n.pk-css-page .tw-g-blue{color:#4285f4}.pk-css-page .tw-g-red{color:#ea4335}.pk-css-page .tw-g-yellow{color:#fbbc05}.pk-css-page .tw-g-green{color:#34a853}\n.pk-css-page .tw-translated{margin-top:16px;min-height:0;white-space:pre-wrap;word-break:break-word;overflow-wrap:anywhere;font:400 17px/1.5 -apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",Arial,sans-serif;color:#0f1419}\n.pk-css-page .tw-translated:empty{display:none}\n.pk-css-page .tw-footer{display:flex;align-items:baseline;flex-wrap:wrap;gap:0 5px;margin-top:28px;color:#536471;font:400 14px/1.55 -apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",Arial,sans-serif}\n.pk-css-page .tw-footer strong{color:#0f1419;font-weight:750;font-size:14px}\n.pk-css-page .tw-dot{color:#536471}\n.pk-css-page .tw-screen [hidden]{display:none!important}\n\n.pk-css-page .tw-footer:has(.tw-time:empty) .tw-time-dot{display:none}\n.pk-css-page .tw-head .tw-identity{flex:1;min-width:0}\n/* The X handle comes exclusively from the editable 副标题 field. */\n.pk-css-page .tw-handle:not([hidden]):not(:empty)::before{content:\"@\"}\n.pk-css-page .tw-handle:empty{display:none!important}\n\n","/* @pk-template\n{\n  \"id\": \"ios_quote_menu\",\n  \"name\": \"文字卡片\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"iosq-canvas\\\">\\n  <div class=\\\"iosq-ghost\\\" aria-hidden=\\\"true\\\"><i></i><i></i><i></i></div>\\n  <div class=\\\"iosq-stack\\\">\\n    <article class=\\\"iosq-card\\\">\\n      <div class=\\\"iosq-quote\\\" data-pk=\\\"body\\\"></div>\\n      <footer class=\\\"iosq-footer\\\"><span class=\\\"iosq-date\\\" data-pk=\\\"date\\\"></span></footer>\\n    </article>\\n    <details class=\\\"iosq-actions\\\" open>\\n      <summary class=\\\"iosq-more\\\" aria-label=\\\"显示或收起操作菜单\\\"><span></span><span></span><span></span></summary>\\n      <div class=\\\"iosq-menu\\\">\\n        <div class=\\\"iosq-item\\\"><span>Edit</span><i class=\\\"iosq-icon iosq-pencil\\\" aria-hidden=\\\"true\\\"></i></div>\\n        <div class=\\\"iosq-item\\\"><span>Bookmark</span><i class=\\\"iosq-icon iosq-bookmark\\\" aria-hidden=\\\"true\\\"></i></div>\\n        <div class=\\\"iosq-gap\\\" aria-hidden=\\\"true\\\"></div>\\n        <div class=\\\"iosq-item iosq-disabled\\\"><span>Delete</span><i class=\\\"iosq-icon iosq-delete\\\" aria-hidden=\\\"true\\\"></i></div>\\n      </div>\\n    </details>\\n  </div>\\n</div>\"\n}\n@end-pk-template */\n\n/* iOS 文字卡片：日间长按操作菜单。正文及日期通过插件通用字段填充。 */\n.pk-css-page{box-sizing:border-box!important;background:#c8c8c8!important;color:#171717;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Display\",\"PingFang SC\",\"Hiragino Sans GB\",\"Noto Sans CJK SC\",Arial,sans-serif}\n.pk-css-page *{box-sizing:border-box}\n.pk-css-page .iosq-canvas{width:100%;min-height:390px;position:relative;isolation:isolate;overflow:hidden;background:#c8c8c8}\n.pk-css-page .iosq-ghost{position:absolute;inset:0;overflow:hidden;pointer-events:none;filter:blur(11px);opacity:.44}\n.pk-css-page .iosq-ghost i{position:absolute;display:block;border-radius:4px;background:#858585}\n.pk-css-page .iosq-ghost i:nth-child(1){top:37px;left:31px;width:95px;height:16px}\n.pk-css-page .iosq-ghost i:nth-child(2){top:66px;left:26px;width:165px;height:7px;background:#b6b6b6}\n.pk-css-page .iosq-ghost i:nth-child(3){top:103px;left:21px;width:340px;height:14px;background:#d6d6d6}\n.pk-css-page .iosq-stack{position:relative;z-index:1;width:100%;padding:121px 19px 42px}\n.pk-css-page .iosq-card{width:100%;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 5px 9px rgba(0,0,0,.14),0 17px 25px rgba(0,0,0,.075)}\n.pk-css-page .iosq-quote{min-height:46px;padding:14px 12px 10px;color:#141414;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}\n.pk-css-page .iosq-quote p.pk-css-paragraph{margin:0!important;padding:0!important;line-height:1.43!important;font-weight:350}\n.pk-css-page .iosq-quote p.pk-css-paragraph+p.pk-css-paragraph{margin-top:4px!important}\n.pk-css-page .iosq-footer{height:29px;display:flex;align-items:center;padding:0 15px;border-top:1px solid #ededed}\n.pk-css-page .iosq-date{font-size:10px!important;font-weight:650;color:#898989!important;line-height:1.2;letter-spacing:.01em}\n.pk-css-page .iosq-actions{display:flow-root;position:relative;margin:0;padding:0}\n.pk-css-page .iosq-more{list-style:none;position:absolute;top:-30px;right:10px;z-index:3;display:flex;width:32px;height:29px;align-items:center;justify-content:center;gap:3.5px;cursor:pointer;-webkit-tap-highlight-color:transparent}\n.pk-css-page .iosq-more::-webkit-details-marker{display:none}\n.pk-css-page .iosq-more::marker{content:\"\"}\n.pk-css-page .iosq-more span{width:4px;height:4px;display:block;border-radius:50%;background:#898989}\n.pk-css-page .iosq-menu{width:min(236px,84%);margin:19px auto 0;overflow:hidden;border-radius:13px;background:#f3f3f3;box-shadow:0 1px 3px rgba(0,0,0,.015);color:#111}\n.pk-css-page .iosq-item{height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 17px 0 15px;font-size:13.5px;font-weight:400;line-height:1;letter-spacing:-.01em}\n.pk-css-page .iosq-item+.iosq-item{border-top:1px solid #dedede}\n.pk-css-page .iosq-gap{height:7px;border-top:1px solid #e0e0e0;border-bottom:1px solid #e7e7e7;background:#dedede}\n.pk-css-page .iosq-disabled{color:#a6a6a6}\n.pk-css-page .iosq-icon{width:19px;height:19px;flex:none;display:inline-block;background-position:center;background-repeat:no-repeat;background-size:contain}\n.pk-css-page .iosq-pencil{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%221.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m15.7%205.4%202.9%202.9%22%2F%3E%3Cpath%20d%3D%22M5.4%2018.6%204.5%2020l1.4-.9%2012.7-12.7-1.9-1.9L4%2017.2l-.5%203.3%203.3-.5Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .iosq-bookmark{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23111111%22%20stroke-width%3D%221.75%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M6%204.9c0-.8.6-1.4%201.4-1.4h9.2c.8%200%201.4.6%201.4%201.4V21l-6-4.1L6%2021V4.9Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .iosq-delete{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%238f8f8f%22%20stroke-width%3D%221.55%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4.3%206.7h15.4M9.2%206.7V4.1c0-.6.5-1.1%201.1-1.1h3.4c.6%200%201.1.5%201.1%201.1v2.6M6.2%206.7l.7%2013.4c0%20.5.5.9%201%20.9h8.2c.5%200%201-.4%201-.9l.7-13.4M10%2010.2v7.5M14%2010.2v7.5%22%2F%3E%3C%2Fsvg%3E\")}\n@media(max-width:330px){.pk-css-page .iosq-stack{padding-left:14px;padding-right:14px}.pk-css-page .iosq-menu{width:min(236px,90%)}}\n","/* @pk-template\n{\n  \"id\": \"plain_text\",\n  \"name\": \"文摘\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"pt-page\\\">\\n  <div class=\\\"pt-body\\\" data-pk=\\\"body\\\"></div>\\n  <footer class=\\\"pt-sign\\\"><span data-pk=\\\"author\\\"></span><span class=\\\"pt-sep\\\">||</span><span data-pk=\\\"user\\\"></span></footer>\\n</article>\"\n}\n@end-pk-template */\n\n/* 文摘：纯文字正文，居中署名，不附加其他界面元素。 */\n.pk-css-page{\n  box-sizing:border-box!important;\n  min-height:0!important;\n  padding:0!important;\n  margin:0!important;\n  background:var(--pk-shared-paper,#fff)!important;\n  color:var(--pk-shared-ink,inherit)!important;\n  font-family:var(--pk-shared-font,serif)!important;\n}\n.pk-css-page .pt-page,\n.pk-css-page .pt-page *{box-sizing:border-box}\n.pk-css-page .pt-page{\n  width:100%;min-width:0;min-height:0;\n  padding:33px 28px 25px;\n  margin:0;\n  background:transparent;\n  color:inherit;\n}\n.pk-css-page .pt-body{\n  display:block;width:100%;min-width:0;\n  padding:0;margin:0;\n  color:inherit;\n  white-space:normal;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .pt-body > p.pk-css-paragraph{\n  margin:0 0 .4em!important;\n  padding:0!important;\n  font-family:inherit!important;\n  font-size:inherit!important;\n  color:inherit!important;\n  line-height:inherit!important;\n  white-space:pre-wrap!important;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .pt-body > p.pk-css-paragraph:last-child{margin-bottom:0!important}\n.pk-css-page .pt-body > p.pk-css-blank{margin:0!important}\n.pk-css-page .pt-sign{\n  display:block;\n  margin:26px 0 0;\n  padding:0;\n  border:0;\n  background:none;\n  box-shadow:none;\n  text-align:center;\n  line-height:1.6;\n  color:inherit;\n  font-size:0.95em;\n  font-weight:400;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .pt-sign .pt-sep{padding:0;color:inherit}\n.pk-css-page .pt-sign:empty{display:none}\n@media(max-width:350px){\n  .pk-css-page .pt-page{padding:27px 21px 22px}\n}\n","/* @pk-template\n{\n  \"id\": \"jinjiang_detail\",\n  \"name\": \"晋江文学城\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"jj-app\\\">\\n  <header class=\\\"jj-nav\\\">\\n    <span class=\\\"jj-nav-back\\\" aria-hidden=\\\"true\\\"></span>\\n    <span class=\\\"jj-nav-title\\\" data-pk=\\\"title\\\"></span>\\n    <span class=\\\"jj-nav-more\\\" aria-hidden=\\\"true\\\"></span>\\n  </header>\\n  <main class=\\\"jj-main\\\">\\n    <section class=\\\"jj-book-card\\\">\\n      <div class=\\\"jj-book-overview\\\">\\n        <div class=\\\"jj-cover-wrap\\\">\\n          <div class=\\\"jj-cover\\\" data-pk=\\\"image\\\"><div class=\\\"jj-cover-placeholder\\\"><strong>作品封面</strong><small>点击上传</small></div></div>\\n          <div class=\\\"jj-cover-ribbon\\\" ><span>完结</span></div>\\n        </div>\\n        <div class=\\\"jj-book-details\\\">\\n          <div class=\\\"jj-author-row\\\"><span class=\\\"jj-author-line\\\">作者 · <strong data-pk=\\\"author\\\"></strong></span><span class=\\\"jj-author-profile\\\">作者专栏</span></div>\\n          <div class=\\\"jj-book-stats\\\">\\n            <div class=\\\"jj-genre\\\">类型:<span data-pk=\\\"subtitle\\\"></span></div>\\n            <div>字数:<span>49,994</span><span class=\\\"jj-completion\\\">(完结)</span></div>\\n            <div>点击:<span>7,705</span><span class=\\\"jj-minor\\\">(非v章均)</span></div>\\n            <div>积分:<span>1.3亿</span></div>\\n            <div>状态:<span>已签约</span></div>\\n          </div>\\n          <div class=\\\"jj-book-utilities\\\"><span class=\\\"jj-share-ico\\\" aria-label=\\\"分享\\\"></span><span class=\\\"jj-download-ico\\\" aria-label=\\\"下载\\\"></span></div>\\n        </div>\\n      </div>\\n      <div class=\\\"jj-book-actions\\\">\\n        <div class=\\\"jj-reading\\\">开始阅读</div>\\n        <div class=\\\"jj-action\\\"><i class=\\\"jj-star-icon\\\"></i><div><strong>已收藏</strong><small>6930</small></div></div>\\n        <div class=\\\"jj-action\\\"><i class=\\\"jj-thumb-icon\\\"></i><div><strong>霸王票</strong><small>Nº40016</small></div></div>\\n        <div class=\\\"jj-action\\\"><i class=\\\"jj-ladle-icon\\\"></i><div><strong>灌溉</strong><small>7184</small></div></div>\\n      </div>\\n    </section>\\n    <section class=\\\"jj-intro-card\\\">\\n      <div class=\\\"jj-update-row\\\"><span class=\\\"jj-update-title\\\">最新更新:</span><span class=\\\"jj-update-info\\\" data-pk=\\\"jj-update\\\"></span><span class=\\\"jj-chapter-list\\\">目录</span></div>\\n      <div class=\\\"jj-separator\\\"></div>\\n      <div class=\\\"jj-synopsis\\\" data-pk=\\\"body\\\"></div>\\n      <div class=\\\"jj-expand\\\">展开<span class=\\\"jj-down\\\"></span></div>\\n      <div class=\\\"jj-tags-info\\\"><div><span class=\\\"jj-teal\\\">标签：</span><span>悬疑推理 成长 正剧 日常</span></div><div><span class=\\\"jj-teal\\\">其它：</span></div><div><span class=\\\"jj-teal\\\">ID ： </span><span>8880124</span><span class=\\\"jj-copy-icon\\\" aria-hidden=\\\"true\\\"></span></div></div>\\n    </section>\\n  </main>\\n</div>\"\n}\n@end-pk-template */\n\n/* 固定作品资料：字数、点击、积分、状态、收藏、霸王票、灌溉、标签和作品 ID，\n   直接写在文件开头 @pk-template 的 html 中，不占用插件设置。\n   作品名、作者、类型、更新信息、正文和封面继续从插件读取。 */\n\n\n/* 晋江文学城 · 作品详情页。截图里的图标从用户提供的原始参考图逐一提取，不使用 Emoji 或近似通用图标。 */\n.pk-css-page{background:#ededed!important;color:#2c2c2c!important;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",\"Microsoft YaHei\",sans-serif!important;font-size:13px!important;line-height:1.45!important}\n.pk-css-page .jj-app{background:#ededed;color:#292929;min-height:510px;width:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",\"Microsoft YaHei\",sans-serif}\n.pk-css-page .jj-nav{height:58px;background:#4fa799;display:flex;align-items:center;justify-content:space-between;padding:0 15px;position:relative;border-bottom:2px solid #169d8e}\n.pk-css-page .jj-nav-back{display:block;flex:none;width:18px;height:27px;background:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAA+CAYAAABQmvmRAAAEz0lEQVR42u2aa4jUZRTGf3PbdWZndtOSTSvCqD5tSR+KEIm2Iku6iRVSfglSKSIqisQPfhAV+xAsClFUdCGh6CIWEZVoUVR0syDIEqWM2jZD3XX2Mrc9fZjnpRfZqZ2dy/sX9sAfdmdnZp953uec85zzn5iZcTpFnNMsogK4H/gCOAh8Ciyp9cRYYEnkgOuBzcB8oAhUgBPASuDnU1+QDMzsg7rSQAKYA0wCMX2QSAF+DbgCyIrZDFAQ8Bgwd6oXhQL8GXChgMWBHj1e8XJrZxSSrg84BJwrRrNASgyXAAOGgHXA4dBJ1wd8LJIS3unmBX5Qj60Avqv1Jsk2VYIbgWclgQ4dvTvdTmBELC8Vw0Hr8H3AgMjJ6ug7BHAMOA78MB2wAJhZK68BM/vLzCasGqNmVjGzcTPLm9lvZvZEPe/ZSkl8AlwKlMVuSQk2KXbHgQ3A3nretBWAz1Jy9Upy3dIuHtgi8BDwamgvcRWwHzgT6NJjCSVZERiVTu+YCdhmM3wvsF6JlRbIDnWvkgD/DtwJ/BTarW0Ctuj4M2K1IAmUgQlgN3BDI2CbxfBzwNViM63HRvVzQWBfVGn7s9F/1min2wss1kklPSnE1QzKwEbgFX2IhmOmDF8AvA6cLZCmjnVCnW1MzN4vKTQtZsJwP/C8HFba8wUF1dk/VMbu0vTQ1KiX4duB7UqstAC65ErJyJwErmuGXhtleKtKV0qTQUxHnxPoY8CPwCr5g2BDaA/wkgc2I0aTKmPjqrP7VGNbBnY6klgAvKfkSopN1xBcfT0J7ACekiRaGrUkkRPI3Z4nyKgaJFWyJgV4BfBV6L2EY9aB7fKclgN7GLitnWBrMZyVNVygxJrnua0iMKx629+qSlAvwyul06TnC+K6UsDXwLIQYGslXdGrBG70Lui5FWAhcCRKu7U9mmATHui0ZGFqy78A50UF8FHgETUCE+NlPTfmTREfANe2G/B/dbo+bV/O8dxYRrJI6IPkgXuAd0OXNZRUi4EDApfwDM6ImkcX8LK6YHCG0dGPyIAvF/C5YtvUljvlKXYBa0IDdl5iWLp+3KsWOWnaGfZBXTe10k/U64fXAY8KbFbsOj1X5CuOa2QaareGp4pnBHhUei54TcZ0Gj3Ah8BlUWDYxUXAG1qaZFX2Mt7fS2J7tWxnMIZdHASuAb70Kodbo87RldLw+VgUGPYTcoDqXZ+FKnUxXU7XR4FvZO6DMexiWI3jBW9nFvem6LR89RLgfSVrd0iG/VgOPC2QOcmj5O3W8qrpy6jeNggOGHXGd4AzZJw6pOWK5/ryMv7fhtytufheyTio391uDa+VdwNvabQKzrCLXuBtYJEqRkKaxttjDGpwHYgCYOdDdqqBZPj3fpypcmQ0xO4CHp7u7q0dt722qYH4Nw9dsykrEQ9ISpEA3Atcon1ct6RREsMO9BjwK3Crp/+2JN1UMaRVwBrV7bznPVwypoHzNQhcGZphPy6neoNxnnx1p8C7pcyEtLwK+DwKgBHYN4GLJZEur0OWdA0BtzDF7YUQ30g5piXMR5pY/lbZM4/xHrV8ogDYxd1Ud80xbzIveeuEfFQkcWrcDDypdu6+LzGuqeVIFAE7D7JWtbgMPED1bipRBRzM/MwCngU8C/h/4h9I//s2FzkLfgAAAABJRU5ErkJggg==\") center/contain no-repeat}\n.pk-css-page .jj-nav-more{display:block;flex:none;width:25px;height:15px;background:url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD8AAAAfCAYAAABQ8xXpAAADAklEQVR42u2YvWsUURTFf7Of2SQaTUJEQfxCVLARKy0URBvFSguJqUUQLNTGxkLIH6CdWNroX6CC2GkpBiWBaIQYEgy6sjG7m51ks9fmjDzCZlZnEMS8C8PMvn3vvHvuPffOYwIzY6Nahg1snrwn78l78p68Jx9vo8An4IvuU8CNBDi3gWlgBpgDPgLXE+DcAyaBD/LnDXAF2LTegiDBIWcv8BjYBYRASVcIBMBrYASodMA5DDwE9gMG9AINoKn7HHAG+NEBZx/wADgA5JXQAGgBS8Bb4DJQS0t+CHgJDAi8H8hpsyqQleNjwOkYnD7gOXAIKGisCKwAq8JYBGaB4zE4A8BTYI/WF7Q+MgPqwjmSRvZ9wLA2LIo42iyUvErCPAicj8G6KYczCqIBy3peVQZLwrwVg3MN2Km5VZHPAt3yMa/nIeBo2syPAdsFXJREexwCWTlRU/2dWAdnHBiU1AMFoan1WaAsp5cl23Yq6gdeALtFPieMjJ6RklDplKW0X5b7A+LbFMm8I9GiZLWiLLU0tgrsiCmdbsdh05UT2boTlIKC1M6+Cysqm0B7m5SY0e+KfG6mkf28soyAIol3abwq0oHqNYx5wyzJoYbuLQWwS2Qi2aKx9crwqwK24nAJFci8o4Ss5iUmvwVYELlAEa5pg5aylVFGukWsnVXlWES2uUaFJeG1nI7dzhaktohgQz4VRbYlzKL+K6QhX1FnrcjxqkhGgQiU+aju78SQf6TARa/HvEM2KoOK5tyP8emJ6jnKassJQqTEuvYZTdvwBoFXynKvnM45DSuUI++AUx2wJtRHck4vMSdATTXGkx3eQM/UXzZrzVYHp6yATAPH0p7wlpyDR1VEQ0V3Xpu//w3iABcVpJokXHey3dBJ72wHjAXgAvBN6wLdFzXW0MnzXNvVZpb0umtmc2Y2Y2bTZjZhZiMJcK6a2aSZfTazWeEMJ8AZMbMpMxsX1piZXVozp8f9Hfxj3/B62h1D/5YF/gOmJ+/Je/KevCfvyXvynvx/Zj8BK/mhI4UztX4AAAAASUVORK5CYII=\") center/contain no-repeat}\n.pk-css-page .jj-nav-title{font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",sans-serif!important;color:#fff!important;-webkit-text-fill-color:#fff!important;text-align:center;font-size:20px!important;font-weight:620;letter-spacing:0.4px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:74%}\n.pk-css-page .jj-main{padding:10px 10px 20px;background:#ededed}\n.pk-css-page .jj-book-card,.pk-css-page .jj-intro-card{background:#fff;border-radius:5px;overflow:hidden}\n.pk-css-page .jj-book-card{padding:12px 10px 10px;margin:0 0 10px}\n.pk-css-page .jj-book-overview{display:flex;align-items:flex-start;gap:10px;min-height:136px}\n.pk-css-page .jj-cover-wrap{width:91px;height:125px;flex:0 0 91px;position:relative}\n.pk-css-page .jj-cover{display:flex;align-items:center;justify-content:center;width:91px;height:125px;overflow:hidden!important;border:1px solid #dedede;border-radius:5px;background:#fbfbfa;cursor:pointer;position:relative}\n.pk-css-page .jj-cover-placeholder{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;padding:10px;color:#abaeaa;text-align:center}\n.pk-css-page .jj-cover-placeholder strong{font-size:13px;font-weight:550;color:#739d94;letter-spacing:1px}.pk-css-page .jj-cover-placeholder small{font-size:10px;color:#b5b5b5}\n.pk-css-page .jj-cover img.pk-slot-photo{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important}\n.pk-css-page .jj-cover-ribbon{position:absolute;right:-1px;top:0;width:37px;height:38px;overflow:hidden;pointer-events:none;z-index:2;border-radius:0 5px 0 0}\n.pk-css-page .jj-cover-ribbon span{position:absolute;top:5px;right:-13px;display:block;width:59px;padding:1px 0;text-align:center;background:#e56d35;color:#fff;font-size:10px;font-weight:650;transform:rotate(45deg);box-shadow:0 1px 2px rgba(0,0,0,.14)}\n.pk-css-page .jj-book-details{position:relative;min-width:0;flex:1;min-height:126px;padding-top:2px}\n.pk-css-page .jj-author-row{display:flex;justify-content:space-between;align-items:flex-start;gap:5px;height:39px;white-space:nowrap}\n.pk-css-page .jj-author-line{color:#242424;font-size:14px;font-weight:510;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-top:2px}\n.pk-css-page .jj-author-line strong{font-size:14px!important;color:#242424!important;-webkit-text-fill-color:#242424!important;font-weight:510;white-space:nowrap}\n.pk-css-page .jj-author-profile{flex:none;background:#4fa799;border-radius:24px 0 0 24px;color:#fff;font-size:13.5px;line-height:27px;height:27px;padding:0 9px 0 12px;margin-right:-11px;white-space:nowrap}\n.pk-css-page .jj-book-stats{color:#777;font-size:11.8px!important;line-height:1.56;white-space:nowrap;letter-spacing:.05px;overflow:hidden}\n.pk-css-page .jj-book-stats>div{overflow:hidden;text-overflow:clip;white-space:nowrap;height:18px}\n.pk-css-page .jj-book-stats span{color:#777!important;-webkit-text-fill-color:#777!important;font-size:inherit!important;line-height:inherit}\n.pk-css-page .jj-book-stats [data-pk=\"subtitle\"]{white-space:nowrap;display:inline!important}\n.pk-css-page .jj-book-utilities{position:absolute;right:7px;bottom:10px;display:flex;align-items:center;gap:11px}\n.pk-css-page .jj-share-ico{display:block;width:24px;height:26px;background:url(\"data:image/png;base64,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\") center/contain no-repeat}\n.pk-css-page .jj-download-ico{display:block;width:30px;height:26px;background:url(\"data:image/png;base64,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\") center/contain no-repeat}\n.pk-css-page .jj-book-actions{margin-top:10px;display:grid;grid-template-columns:1.04fr 1.12fr 1.12fr 1.12fr;gap:10px;align-items:stretch}\n.pk-css-page .jj-reading,.pk-css-page .jj-action{height:34px;min-width:0;border-radius:5px;display:flex;align-items:center;justify-content:center;white-space:nowrap}\n.pk-css-page .jj-reading{background:#229e91;color:white;font-size:14.2px;font-weight:480;border:1px solid #188f81}\n.pk-css-page .jj-action{background:#fff;border:1px solid #4a9d91;color:#333;gap:3px;padding:2px 3px;overflow:hidden}\n.pk-css-page .jj-action i{display:block;flex:none;width:19px;height:25px}\n.pk-css-page .jj-star-icon{background:url(\"data:image/png;base64,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\") center/contain no-repeat}\n.pk-css-page .jj-thumb-icon{background:url(\"data:image/png;base64,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\") center/contain no-repeat}\n.pk-css-page .jj-ladle-icon{background:url(\"data:image/png;base64,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\") center/contain no-repeat}\n.pk-css-page .jj-action>div{display:flex;flex-direction:column;align-items:center;line-height:1.03;min-width:0;gap:1px}\n.pk-css-page .jj-action strong{font-size:12.5px;font-weight:440;letter-spacing:-.45px;color:#292929}\n.pk-css-page .jj-action small{font-size:9px;line-height:1;color:#303030;white-space:nowrap}\n.pk-css-page .jj-intro-card{min-height:233px;padding:10px 10px 12px}\n.pk-css-page .jj-update-row{min-width:0;display:flex;align-items:center;min-height:28px;line-height:1.45;font-size:12.3px;gap:5px;white-space:nowrap}\n.pk-css-page .jj-update-title,.pk-css-page .jj-chapter-list,.pk-css-page .jj-teal{color:#4fa799!important;-webkit-text-fill-color:#4fa799!important}\n.pk-css-page .jj-update-info{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1;color:#333}\n.pk-css-page .jj-chapter-list{border-left:1px solid #555;padding-left:9px;line-height:20px;flex:none;font-size:13px}\n.pk-css-page .jj-separator{height:1px;background:#4fa799;margin:1px 0 10px}\n.pk-css-page .jj-synopsis{min-height:115px;padding:0;color:#2b2b2b!important;font-family:\"Songti SC\",\"Noto Serif CJK SC\",\"STSong\",serif!important;text-align:left!important;word-break:break-word;line-height:2.02!important;letter-spacing:0!important;font-size:15px!important}\n.pk-css-page .jj-synopsis .pk-css-paragraph{margin:0 0 7px!important;padding:0!important;font-size:15px!important;font-family:\"Songti SC\",\"Noto Serif CJK SC\",\"STSong\",serif!important;line-height:2.02!important;letter-spacing:0!important;color:#2b2b2b!important;-webkit-text-fill-color:#2b2b2b!important;text-align:left!important;text-indent:0!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}\n.pk-css-page .jj-expand{display:flex;justify-content:flex-end;align-items:center;gap:6px;color:#777;font-size:12px;height:30px;margin-top:1px}\n.pk-css-page .jj-down{width:9px;height:9px;border-right:2px solid #aaa;border-bottom:2px solid #aaa;transform:translateY(-3px) rotate(45deg)}\n.pk-css-page .jj-tags-info{line-height:1.36;font-size:11.5px;color:#4fa799!important;min-height:44px}\n.pk-css-page .jj-tags-info div{color:#4fa799!important;font-size:11.5px;white-space:pre-wrap}\n.pk-css-page .jj-tags-info span{color:#4fa799!important;-webkit-text-fill-color:#4fa799!important}\n.pk-css-page .jj-copy-icon{display:inline-block;width:9px;height:11px;border:1px solid #4fa799;border-radius:1px;position:relative;margin-left:7px;top:1px}\n.pk-css-page .jj-copy-icon:after{content:\"\";position:absolute;width:8px;height:10px;border:1px solid #4fa799;border-radius:1px;left:-3px;top:3px;background:#fff}\n.pk-css-page .jj-cover-ribbon[hidden]{display:none!important}\n@media(max-width:355px){.pk-css-page .jj-main{padding-left:6px;padding-right:6px}.pk-css-page .jj-book-card{padding-left:7px;padding-right:7px}.pk-css-page .jj-book-overview{gap:7px}.pk-css-page .jj-book-actions{gap:5px}.pk-css-page .jj-book-stats{font-size:10.5px!important}.pk-css-page .jj-action strong{font-size:11px}.pk-css-page .jj-cover-wrap,.pk-css-page .jj-cover{width:82px}.pk-css-page .jj-cover-wrap{flex-basis:82px}}","/* @pk-template\n{\n  \"id\": \"social_post_compose\",\n  \"name\": \"朋友圈发布\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"sc-app\\\">\\n  <div class=\\\"sc-status\\\" aria-hidden=\\\"true\\\">\\n    <div class=\\\"sc-status-left\\\"><strong data-pk=\\\"compose-clock\\\">22:34</strong><span class=\\\"sc-moon\\\"></span></div>\\n    <div class=\\\"sc-status-right\\\"><span class=\\\"sc-signal\\\"><i></i><i></i><i></i><i></i></span><span class=\\\"sc-network\\\">4G</span><span class=\\\"sc-battery\\\"><i></i></span></div>\\n  </div>\\n  <div class=\\\"sc-toolbar\\\">\\n    <span class=\\\"sc-cancel\\\" data-pk=\\\"compose-cancel\\\">Cancel</span>\\n    <strong class=\\\"sc-heading\\\" data-pk=\\\"compose-heading\\\">Text</strong>\\n    <span class=\\\"sc-post\\\" data-pk=\\\"compose-button\\\">Post</span>\\n  </div>\\n  <main class=\\\"sc-editor\\\"><div class=\\\"sc-body\\\" data-pk=\\\"body\\\"></div></main>\\n  <section class=\\\"sc-options\\\">\\n    <div class=\\\"sc-option\\\"><i class=\\\"sc-icon sc-location\\\"></i><span class=\\\"sc-option-title\\\" data-pk=\\\"compose-location\\\">Location</span><i class=\\\"sc-icon sc-chevron\\\"></i></div>\\n    <div class=\\\"sc-option\\\"><i class=\\\"sc-icon sc-mention\\\"></i><span class=\\\"sc-option-title\\\" data-pk=\\\"compose-mention\\\">Mention</span><i class=\\\"sc-icon sc-chevron\\\"></i></div>\\n    <div class=\\\"sc-option\\\"><i class=\\\"sc-icon sc-person\\\"></i><span class=\\\"sc-option-title\\\">Visible To</span><span class=\\\"sc-audience\\\" data-pk=\\\"compose-audience\\\">All</span><i class=\\\"sc-icon sc-chevron\\\"></i></div>\\n  </section>\\n  <div class=\\\"sc-safe\\\" aria-hidden=\\\"true\\\"></div>\\n</div>\"\n}\n@end-pk-template */\n\n/* Daytime text post composer. All visual assets embedded; no external dependencies. */\n.pk-css-page{background:#fff!important;color:#202124;min-height:0!important;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",\"Microsoft Yahei\",sans-serif}\n.pk-css-page .sc-app{display:flex;flex-direction:column;min-height:590px;width:100%;background:#fff;color:#262729;overflow:hidden;letter-spacing:0}\n.pk-css-page .sc-status{display:flex;align-items:center;justify-content:space-between;height:37px;flex:none;padding:6px 21px 0;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;line-height:1}\n.pk-css-page .sc-status-left,.pk-css-page .sc-status-right{display:flex;align-items:center;gap:7px}\n.pk-css-page .sc-status-left strong{font-size:17px;font-weight:700;letter-spacing:.01em;color:#18191a}\n.pk-css-page .sc-moon{position:relative;width:15px;height:15px;border-radius:50%;background:#18191a;transform:rotate(-20deg)}\n.pk-css-page .sc-moon:after{content:\"\";position:absolute;top:-3px;left:6px;width:13px;height:13px;background:#fff;border-radius:50%}\n.pk-css-page .sc-signal{height:15px;display:flex;gap:2px;align-items:flex-end}\n.pk-css-page .sc-signal i{width:3.5px;border-radius:2px;background:#1f2021;display:block}\n.pk-css-page .sc-signal i:nth-child(1){height:5px}.pk-css-page .sc-signal i:nth-child(2){height:8px}.pk-css-page .sc-signal i:nth-child(3){height:11px}.pk-css-page .sc-signal i:nth-child(4){height:14px}\n.pk-css-page .sc-network{font-size:15px;font-weight:650;letter-spacing:0}\n.pk-css-page .sc-battery{position:relative;display:block;width:24px;height:12px;border:1.5px solid #56595b;border-radius:4px;margin-left:1px}\n.pk-css-page .sc-battery:before{content:\"\";position:absolute;top:1px;bottom:1px;left:1px;width:71%;background:#333;border-radius:1.8px}\n.pk-css-page .sc-battery:after{content:\"\";position:absolute;right:-3.7px;top:3px;width:2px;height:4px;background:#777;border-radius:0 2px 2px 0}\n.pk-css-page .sc-toolbar{height:82px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:1px 16px 0;gap:0;flex:none;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif}\n.pk-css-page .sc-cancel{font-size:17px;font-weight:400;line-height:1.2;justify-self:start;color:#333}\n.pk-css-page .sc-heading{font-size:18px;font-weight:630;line-height:1.2;white-space:nowrap;color:#272727}\n.pk-css-page .sc-post{font-size:16px;line-height:1.2;color:white;background:#43c779;padding:10px 16px;border-radius:6px;font-weight:560;min-height:35px;display:flex;align-items:center;justify-content:center;justify-self:end;white-space:nowrap}\n.pk-css-page .sc-editor{flex:1 0 auto;display:flex;flex-direction:column;padding:24px 28px 25px;min-height:247px}\n.pk-css-page .sc-body{margin:0;width:100%;min-height:170px;color:#303133;font-size:17px;line-height:1.52;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}\n.pk-css-page .sc-body p.pk-css-paragraph{margin:0 0 10px;white-space:pre-wrap}\n.pk-css-page .sc-body p.pk-css-paragraph:last-child{margin-bottom:0}\n.pk-css-page .sc-options{flex:none;margin:0 25px 0;padding:0;border-top:1px solid #efeff0}\n.pk-css-page .sc-option{min-height:62px;display:flex;align-items:center;gap:17px;padding:0 1px 0 2px;border-bottom:1px solid #efeff0;color:#4b4e51;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif}\n.pk-css-page .sc-option:last-child{border-bottom:0}\n.pk-css-page .sc-option-title{font-size:17px;font-weight:410;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}\n.pk-css-page .sc-audience{margin-left:auto;font-size:17px;color:#5a5b5e;white-space:nowrap}\n.pk-css-page .sc-icon{width:24px;height:24px;flex:0 0 24px;display:inline-block;vertical-align:middle;background-repeat:no-repeat;background-size:24px 24px;background-position:center;box-sizing:border-box}\n.pk-css-page .sc-location{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234B4D50%22%20stroke-width%3D%221.9%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M20.4%2010.2c0%205.4-8.4%2011.3-8.4%2011.3S3.6%2015.6%203.6%2010.2a8.4%208.4%200%200%201%2016.8%200Z%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2210.1%22%20r%3D%223%22%2F%3E%3C%2Fsvg%3E\");font-size:0;line-height:0;transform:none!important}\n.pk-css-page .sc-mention{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234B4D50%22%20stroke-width%3D%221.9%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2211.7%22%20cy%3D%2211.5%22%20r%3D%224.1%22%2F%3E%3Cpath%20d%3D%22M15.8%209.1v4.7c0%201.55.85%202.45%202.1%202.45%201.75%200%202.75-1.65%202.75-4.1a8.65%208.65%200%201%200-3.1%206.6%22%2F%3E%3C%2Fsvg%3E\");font-size:0;line-height:0;transform:none!important}\n.pk-css-page .sc-person{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234B4D50%22%20stroke-width%3D%221.9%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%227.2%22%20r%3D%224.1%22%2F%3E%3Cpath%20d%3D%22M3.15%2020.8c.25-4%203.5-6.55%208.85-6.55s8.6%202.55%208.85%206.55H3.15Z%22%2F%3E%3C%2Fsvg%3E\");font-size:0;line-height:0;transform:none!important}\n.pk-css-page .sc-chevron{margin-left:auto;background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2218%22%20height%3D%2218%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23979A9D%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m9%204.5%207.5%207.5L9%2019.5%22%2F%3E%3C%2Fsvg%3E\");background-size:17px 17px;width:18px;height:18px}\n.pk-css-page .sc-audience+.sc-chevron{margin-left:1px}\n.pk-css-page .sc-safe{height:15px;flex:none}\n","/* @pk-template\n{\n  \"id\": \"journal_article_first_page\",\n  \"name\": \"期刊论文首页\",\n  \"width\": 640,\n  \"html\": \"<article class=\\\"jr-page\\\">\\n  <header class=\\\"jr-masthead\\\">\\n    <div class=\\\"jr-masthead-line\\\">\\n      <div class=\\\"jr-left\\\"><div class=\\\"jr-journal\\\">Luggage</div><div class=\\\"jr-issn\\\">ISSN114-514 CN19-19810</div></div>\\n      <div class=\\\"jr-right\\\"><div class=\\\"jr-date\\\" data-pk=\\\"date\\\">2026 年 2 月</div><div class=\\\"jr-issue\\\">第 1 卷 第 1 期(总第 1 期) 第 1 篇</div></div>\\n    </div>\\n    <div class=\\\"jr-double-rule\\\" aria-hidden=\\\"true\\\"></div>\\n  </header>\\n  <main class=\\\"jr-main\\\">\\n    <header class=\\\"jr-article-head\\\">\\n      <h1 class=\\\"jr-title\\\" data-pk=\\\"title\\\">已读不回的伦理重构</h1>\\n      <h2 class=\\\"jr-subtitle\\\" data-pk=\\\"subtitle\\\">——基于沉默的螺旋理论的数字社交研究</h2>\\n      <div class=\\\"jr-author\\\" data-pk=\\\"author\\\">Momo HIRANO</div>\\n    </header>\\n    <section class=\\\"jr-abstract\\\" aria-label=\\\"摘要\\\"><div class=\\\"jr-abstract-content\\\" data-pk=\\\"body\\\">在即时通讯技术高度普及的数字社会中，“已读不回”已成为一种普遍却备受争议的社交行为。传统社交伦理常将其视为不礼貌、冷漠乃至“冷暴力”，但这一判断忽视了数字交往的复杂性与个体边界需求。本研究以现象学还原与深度访谈为主要方法，对30亿名18—35岁即时通讯用户进行调研，探讨“已读不回”作为一种沟通实践的伦理正当性。研究发现，已读不回并非沟通的断裂，而是一种以沉默为载体的负向沟通，可归纳为自我保护型、关系降温型、信息悬置型与权力平衡型四种类型。在特定情境下，已读不回具备清晰的伦理合理性，是数字时代“消极礼貌”的重要体现，也是个体对抗信息过载、维护心理边界的非暴力沟通策略。研究结论有助于重新理解数字社交伦理，为构建更具包容性的线上交往规范提供理论参考。</div></section>\\n    <div class=\\\"jr-keywords\\\"><strong>关键词</strong><span class=\\\"jr-keyword-value\\\" data-pk=\\\"note\\\">已读不回； 非暴力沟通； 沉默的螺旋； 数字社交； 沟通伦理； 负向沟通</span></div>\\n  </main>\\n</article>\"\n}\n@end-pk-template */\n\n/* 期刊论文首页 · 参考图版式 / 独立 CSS 模板 */\n.pk-css-page{background:#fff!important;color:#171717;min-height:0!important}\n.pk-css-page .jr-page{box-sizing:border-box;width:100%;min-height:608px;background:#fff;color:#171717;overflow:hidden;padding:56px 18px 45px;font-family:\"Times New Roman\",\"Noto Serif CJK SC\",\"Songti SC\",SimSun,serif;-webkit-font-smoothing:antialiased}\n.pk-css-page .jr-page *{box-sizing:border-box}\n.pk-css-page .jr-masthead-line{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;min-height:39px;line-height:1.27;color:#141414}\n.pk-css-page .jr-left{flex:none;min-width:0;text-align:left}\n.pk-css-page .jr-right{min-width:0;text-align:right}\n.pk-css-page .jr-journal{font-size:16px;line-height:1.25;font-weight:400;white-space:nowrap}\n.pk-css-page .jr-issn{font-size:15.5px;line-height:1.32;white-space:nowrap}\n.pk-css-page .jr-date{font-size:15px;line-height:1.3;white-space:nowrap;-webkit-text-fill-color:#171717!important}\n.pk-css-page .jr-issue{font-size:15.5px;line-height:1.32;white-space:nowrap}\n.pk-css-page .jr-double-rule{height:4px;margin-top:4px;border-top:1.2px solid #0d0d0d;border-bottom:1.2px solid #0d0d0d}\n.pk-css-page .jr-main{padding:0 37px}\n.pk-css-page .jr-article-head{text-align:center;padding-top:48px}\n.pk-css-page .jr-title,.pk-css-page .jr-subtitle{margin:0;text-align:center;font-weight:700;color:#101010;white-space:normal;overflow-wrap:anywhere;-webkit-text-fill-color:#101010!important}\n.pk-css-page .jr-title{font-size:25px;line-height:1.52;letter-spacing:.02em}\n.pk-css-page .jr-subtitle{margin-top:4px;font-size:23px;line-height:1.58;letter-spacing:.005em}\n.pk-css-page .jr-subtitle[hidden]{display:none!important}\n.pk-css-page .jr-author{margin-top:48px;text-align:center;font-size:19px;line-height:1.38;font-weight:400;color:#111;overflow-wrap:anywhere;-webkit-text-fill-color:#111!important}\n.pk-css-page .jr-abstract{margin:23px auto 0;color:#191919}\n.pk-css-page .jr-abstract-content{font-size:15.5px;line-height:1.62;text-align:justify;letter-spacing:.012em;overflow-wrap:anywhere;word-break:normal;-webkit-text-fill-color:#191919!important}\n.pk-css-page .jr-abstract-content>p.pk-css-paragraph{margin:0 0 4px;text-indent:0!important;white-space:pre-wrap;overflow-wrap:anywhere;-webkit-text-fill-color:#191919!important}\n.pk-css-page .jr-abstract-content>p.pk-css-paragraph:first-child:before{content:\"摘要\";font-weight:700;margin-right:.63em;letter-spacing:0}\n/* 在无正文的静态预览里也展示摘要标签，导入后会被真实段落替换。 */\n.pk-css-page .jr-abstract-content:not(:has(>p))::before{content:\"摘要\";font-weight:700;margin-right:.63em}\n.pk-css-page .jr-keywords{margin-top:4px;font-size:15.5px;line-height:1.65;color:#161616;letter-spacing:.012em;overflow-wrap:anywhere;word-break:normal}\n.pk-css-page .jr-keywords>strong{font-weight:700;margin-right:.62em}\n.pk-css-page .jr-keyword-value{white-space:pre-wrap;-webkit-text-fill-color:#161616!important}\n.pk-css-page .jr-keywords:has(.jr-keyword-value:empty){display:none}\n@media(max-width:520px){\n  .pk-css-page .jr-page{padding:35px 13px 38px;min-height:520px}\n  .pk-css-page .jr-journal{font-size:12px}.pk-css-page .jr-issn{font-size:11px}\n  .pk-css-page .jr-date{font-size:11.5px}.pk-css-page .jr-issue{font-size:10.2px}\n  .pk-css-page .jr-main{padding:0 15px}\n  .pk-css-page .jr-article-head{padding-top:42px}\n  .pk-css-page .jr-title{font-size:21px}.pk-css-page .jr-subtitle{font-size:17px;line-height:1.6}\n  .pk-css-page .jr-author{margin-top:38px;font-size:16px}\n  .pk-css-page .jr-abstract{margin-top:28px}\n  .pk-css-page .jr-abstract-content,.pk-css-page .jr-keywords{font-size:13.5px;line-height:1.7}\n}\n@media print{.pk-css-page .jr-page{break-inside:avoid;background:#fff}}","/* @pk-template\n{\n  \"id\": \"paper_literary\",\n  \"name\": \"纸页文字排版\",\n  \"width\": 460,\n  \"html\": \"<article class=\\\"pl-page\\\">\\n  <aside class=\\\"pl-masthead\\\"><div class=\\\"pl-title\\\" data-pk=\\\"title\\\"></div></aside>\\n  <main class=\\\"pl-main\\\">\\n    <div class=\\\"pl-subtitle\\\" data-pk=\\\"subtitle\\\"></div>\\n    <div class=\\\"pl-prose\\\" data-pk=\\\"body\\\"></div>\\n    <footer class=\\\"pl-end\\\"><span class=\\\"pl-author\\\" data-pk=\\\"author\\\"></span></footer>\\n  </main>\\n</article>\"\n}\n@end-pk-template */\n\n/* 左上竖题与上段正文偏左；下段正文右对齐，与右侧竖落款底部齐平。\n   所有文字仍共用插件「字色」，淡色竖题只调整透明度。 */\n.pk-css-page{\n  box-sizing:border-box!important;\n  margin:0!important;\n  padding:0!important;\n  min-height:0!important;\n  background:var(--pk-shared-paper,#fff)!important;\n  color:var(--pk-shared-ink,#222)!important;\n  font-family:var(--pk-shared-font,\"Songti SC\",\"STSong\",serif)!important;\n}\n.pk-css-page .pl-page,.pk-css-page .pl-page *{box-sizing:border-box}\n.pk-css-page .pl-page{\n  display:grid;\n  grid-template-columns:42px minmax(0,1fr);\n  gap:9px;\n  align-items:start;\n  width:100%;\n  padding:18px 22px 24px 19px;\n  margin:0;\n  background:var(--pk-shared-paper,#fff);\n  color:var(--pk-shared-ink,#222);\n  overflow:visible;\n}\n.pk-css-page .pl-masthead{\n  grid-column:1;\n  grid-row:1;\n  align-self:start;\n  width:100%;\n  min-width:0;\n  padding:1px 0 0;\n  margin:0;\n  overflow:visible;\n}\n.pk-css-page .pl-title{\n  display:block;\n  writing-mode:vertical-rl;\n  text-orientation:upright;\n  width:max-content;\n  min-width:1.36em;\n  max-width:none!important;\n  height:auto;\n  max-height:none!important;\n  margin:0;\n  padding:0 2px;\n  overflow:visible!important;\n  opacity:.34;\n  font-size:30px!important;\n  font-weight:500!important;\n  line-height:1.42!important;\n  letter-spacing:.045em!important;\n  text-align:start;\n  white-space:pre-wrap;\n  word-break:normal;\n  overflow-wrap:normal;\n}\n.pk-css-page .pl-title:empty{display:none}\n.pk-css-page .pl-main{\n  grid-column:2;\n  grid-row:1;\n  display:grid;\n  grid-template-columns:minmax(0,1fr) 45px;\n  column-gap:16px;\n  align-items:end;\n  min-width:0;\n  width:100%;\n  padding:0;\n  margin:0;\n  color:inherit;\n}\n.pk-css-page .pl-subtitle{\n  grid-column:1/-1;\n  grid-row:1;\n  margin:1px 0 11px;\n  padding:0;\n  font-size:12px!important;\n  line-height:1.5!important;\n  letter-spacing:.02em!important;\n  white-space:pre-wrap;\n  overflow-wrap:anywhere;\n  text-align:left;\n}\n.pk-css-page .pl-subtitle:empty,.pk-css-page .pl-subtitle[hidden]{display:none!important}\n.pk-css-page .pl-prose{\n  grid-column:1;\n  grid-row:2;\n  align-self:end;\n  display:block;\n  width:100%;\n  min-width:0;\n  margin:0;\n  padding:0;\n  font-family:inherit;\n  font-size:14px;\n  line-height:1.64;\n  font-weight:400;\n  letter-spacing:.005em;\n  text-align:left;\n  overflow-wrap:anywhere;\n  white-space:pre-wrap;\n}\n.pk-css-page .pl-prose p.pk-css-paragraph{\n  display:block;\n  margin:0 0 12px!important;\n  padding:0!important;\n  font-size:inherit!important;\n  font-family:inherit!important;\n  font-weight:inherit!important;\n  line-height:inherit!important;\n  text-align:left!important;\n  white-space:pre-wrap;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .pl-prose p.pk-css-paragraph:last-child{\n  margin-bottom:0!important;\n}\n/* 正文分为左右两个视觉段落，但不新增输入字段。\n   优先以空白段落分隔：空白段落之前靠左，之后靠右。\n   没有空白段落时，两段正文的最后一段靠右；四段及以上最后两段靠右。 */\n.pk-css-page .pl-prose p.pk-css-paragraph{\n  width:100%;\n  max-width:100%;\n  text-align-last:auto!important;\n}\n.pk-css-page .pl-prose:not(:has(> p.pk-css-blank)) > p.pk-css-paragraph:last-child:not(:first-child),\n.pk-css-page .pl-prose:not(:has(> p.pk-css-blank)) > p.pk-css-paragraph:nth-last-child(2):nth-child(n+3),\n.pk-css-page .pl-prose > p.pk-css-blank ~ p.pk-css-paragraph:not(.pk-css-blank){\n  text-align:right!important;\n  text-align-last:right!important;\n}\n.pk-css-page .pl-prose p.pk-css-blank{min-height:0!important;margin-bottom:6px!important}\n.pk-css-page .pl-end{\n  grid-column:2;\n  grid-row:2;\n  align-self:end;\n  justify-self:end;\n  display:flex;\n  justify-content:flex-end;\n  align-items:flex-end;\n  width:100%;\n  min-width:0;\n  min-height:0;\n  margin:0;\n  padding:0;\n  border:0;\n}\n.pk-css-page .pl-author{\n  display:block;\n  writing-mode:vertical-rl;\n  text-orientation:upright;\n  width:max-content;\n  min-width:1.34em;\n  max-width:none!important;\n  height:auto;\n  max-height:none!important;\n  padding:0;\n  margin:0;\n  overflow:visible!important;\n  font-size:31px!important;\n  line-height:1.36!important;\n  letter-spacing:.055em!important;\n  font-weight:500!important;\n  text-align:end;\n  white-space:pre-wrap;\n  word-break:normal;\n  overflow-wrap:normal;\n}\n.pk-css-page .pl-author:empty,.pk-css-page .pl-end:has(.pl-author:empty){display:none}\n@media(max-width:385px){\n  .pk-css-page .pl-page{grid-template-columns:38px minmax(0,1fr);gap:8px;padding:15px 18px 22px 16px}\n  .pk-css-page .pl-main{grid-template-columns:minmax(0,1fr) 40px;column-gap:12px}\n  .pk-css-page .pl-title{font-size:27px!important}\n  .pk-css-page .pl-author{font-size:28px!important}\n  .pk-css-page .pl-prose{font-size:13.5px}\n}\n\n/* 在海报上编辑时仍使用有实际尺寸的正文容器。 */\n.pk-css-page .pl-prose[contenteditable]{display:block;grid-column:1}\n.pk-css-page .pl-main:has(.pl-author:empty){column-gap:0}\n.pk-css-page .pl-main:has(.pl-author:empty) .pl-prose{grid-column:1/-1}\n","/* @pk-template\n{\n  \"id\": \"paper_prose_left\",\n  \"name\": \"纸页随笔\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"pn-sheet\\\">\\n  <header class=\\\"pn-heading\\\">\\n    <div class=\\\"pn-title\\\" data-pk=\\\"user\\\"></div>\\n    <div class=\\\"pn-names\\\"><span data-pk=\\\"author\\\"></span></div>\\n  </header>\\n  <main class=\\\"pn-body\\\" data-pk=\\\"body\\\"></main>\\n</article>\"\n}\n@end-pk-template */\n\n/* 纸页随笔：只复刻参考图左页的纯文字排版，不带照片、边框或装饰。 */\n.pk-css-page{\n  box-sizing:border-box!important;\n  margin:0!important;padding:0!important;min-height:0!important;\n  background:var(--pk-shared-paper,#faf9f4)!important;\n  color:var(--pk-shared-ink,inherit)!important;\n  font-family:var(--pk-shared-font,\"Songti SC\",serif)!important;\n}\n.pk-css-page .pn-sheet,.pk-css-page .pn-sheet *{box-sizing:border-box}\n.pk-css-page .pn-sheet{\n  width:100%;min-width:0;min-height:0;\n  padding:42px 31px 27px;\n  color:inherit;background:transparent;\n}\n/* 右上角读默认 User 名，下面一行只读默认 Char 名。 */\n.pk-css-page .pn-heading{\n  display:flex;flex-direction:column;align-items:flex-end;\n  max-width:100%;min-width:0;\n  margin:0 0 66px;\n}\n.pk-css-page .pn-title{\n  max-width:13em;min-width:0;\n  margin:0;padding:0;\n  text-align:right!important;\n  white-space:pre-wrap;overflow-wrap:anywhere;\n  font-size:1.16em;line-height:1.28;\n  letter-spacing:.035em;font-weight:400;\n  color:inherit;\n}\n.pk-css-page .pn-title:empty{display:none}\n.pk-css-page .pn-names{\n  display:flex;justify-content:flex-end;flex-wrap:wrap;gap:0;\n  margin:24px 0 0;\n  max-width:100%;font-size:.9em;line-height:1.5;\n  color:inherit;white-space:normal;\n}\n/* 段落沿左页排版：两字起行、文字自然换行、全文使用共享字体和字色。 */\n.pk-css-page .pn-body{\n  display:flex;flex-direction:column;gap:.46em;\n  width:100%;min-width:0;margin:0;padding:0;\n  text-align:justify;white-space:normal;\n  color:inherit;overflow-wrap:anywhere;\n}\n.pk-css-page .pn-body > p.pk-css-paragraph{\n  display:block!important;flex:none;\n  margin:0!important;padding:0!important;\n  width:100%;max-width:100%;\n  font:inherit!important;line-height:inherit!important;\n  letter-spacing:inherit!important;color:inherit!important;\n  text-indent:2em!important;\n  text-align:justify!important;\n  text-align-last:auto!important;\n  white-space:pre-wrap!important;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .pn-body > p.pk-css-blank{\n  height:0!important;min-height:0!important;\n  line-height:0!important;text-indent:0!important;\n}\n@media(max-width:350px){\n  .pk-css-page .pn-sheet{padding:34px 23px 24px}\n  .pk-css-page .pn-heading{margin-bottom:50px}\n}\n","/* @pk-template\n{\n  \"id\": \"threads_profile\",\n  \"name\": \"脆-个人主页\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"thp-screen\\\">\\n  <header class=\\\"thp-top\\\">\\n    <span class=\\\"thp-icon thp-back\\\" aria-hidden=\\\"true\\\"></span>\\n    <strong class=\\\"thp-username\\\" data-pk=\\\"title\\\"></strong>\\n    <div class=\\\"thp-top-actions\\\"><span class=\\\"thp-icon thp-bell\\\" aria-hidden=\\\"true\\\"></span><span class=\\\"thp-icon thp-more\\\" aria-hidden=\\\"true\\\"></span></div>\\n  </header>\\n  <section class=\\\"thp-info\\\">\\n    <div class=\\\"thp-main-row\\\">\\n      <span class=\\\"thp-avatar\\\" data-pk=\\\"avatar\\\"></span>\\n      <div class=\\\"thp-identity\\\">\\n        <strong class=\\\"thp-display-name\\\" data-pk=\\\"author\\\"></strong>\\n        <div class=\\\"thp-stat-row\\\">\\n          <div class=\\\"thp-stat\\\"><strong>52</strong><span>帖子</span></div>\\n          <div class=\\\"thp-stat\\\"><strong>5.2万</strong><span>粉丝</span></div>\\n          <div class=\\\"thp-stat\\\"><strong>0</strong><span>关注</span></div>\\n        </div>\\n      </div>\\n    </div>\\n    <div class=\\\"thp-bio\\\" data-pk=\\\"body\\\"></div>\\n    <div class=\\\"thp-extra\\\" data-pk=\\\"note\\\"></div>\\n    <div class=\\\"thp-threads-wrap\\\" data-pk-section=\\\"profile-threads\\\">\\n      <span class=\\\"thp-thread-chip\\\"><i class=\\\"thp-icon thp-threads\\\" aria-hidden=\\\"true\\\"></i><span data-pk=\\\"title\\\"></span></span>\\n    </div>\\n    <div class=\\\"thp-bottom-actions\\\" data-pk-section=\\\"profile-actions\\\">\\n      <span class=\\\"thp-follow\\\"><span data-pk=\\\"profile-follow\\\">已关注</span><i class=\\\"thp-icon thp-down\\\" aria-hidden=\\\"true\\\"></i></span>\\n      <span class=\\\"thp-message\\\">发消息</span>\\n      <span class=\\\"thp-person\\\"><i class=\\\"thp-icon thp-user-plus\\\" aria-hidden=\\\"true\\\"></i></span>\\n    </div>\\n  </section>\\n</div>\"\n}\n@end-pk-template */\n\n/* Threads / 脆个人主页 · 日间版。按参考图重新校对间距、字号、矢量图标。 */\n.pk-css-page{box-sizing:border-box!important;min-height:0!important;background:#e9e9e9!important;color:#101010!important;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",\"Noto Sans CJK SC\",Arial,sans-serif!important;padding:7px!important}\n.pk-css-page .thp-screen{box-sizing:border-box;width:100%;min-height:0;background:#fff;color:#101010;overflow:hidden;padding:0 15px 10px;border-radius:13px;box-shadow:0 1px 7px rgba(0,0,0,.17);font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"PingFang SC\",\"Noto Sans CJK SC\",Arial,sans-serif}\n.pk-css-page .thp-top{height:52px;display:flex;align-items:center;gap:30px;min-width:0;padding-left:10px}\n.pk-css-page .thp-icon{display:block;flex:none;background-position:center;background-repeat:no-repeat;background-size:contain}\n.pk-css-page .thp-back{width:24px;height:24px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjIuOCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTYuNyAyLjkgNy4wIDEybDkuNyA5LjEiLz48L3N2Zz4=)}\n.pk-css-page .thp-username{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:20px!important;font-weight:760!important;line-height:1.15;color:#080808!important;font-family:inherit!important}\n.pk-css-page .thp-top-actions{display:flex;align-items:center;gap:42px;padding-right:10px;flex:none}\n.pk-css-page .thp-bell{width:23px;height:23px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjIuMSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTkuNiAxNi40QzE4LjEgMTQuOCAxOCAxMi41IDE4IDkuNGMwLTQuNS0yLjMtNi43LTYtNi43UzYgNC45IDYgOS40YzAgMy4xLS4xIDUuNC0xLjYgNy0uNi43LS4xIDEuOC45IDEuOGgxMy40YzEgMCAxLjUtMS4xLjktMS44WiIvPjxwYXRoIGQ9Ik05LjYgMjAuMmEyLjY1IDIuNjUgMCAwIDAgNC44IDAiLz48L3N2Zz4=)}\n.pk-css-page .thp-more{width:24px;height:24px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzExMTExMSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iNC40IiBjeT0iMTIiIHI9IjEuOSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEuOSIvPjxjaXJjbGUgY3g9IjE5LjYiIGN5PSIxMiIgcj0iMS45Ii8+PC9zdmc+)}\n.pk-css-page .thp-info{padding:6px 0 0}\n.pk-css-page .thp-main-row{display:flex;align-items:center;gap:20px;min-width:0}\n.pk-css-page .thp-avatar{display:flex;align-items:center;justify-content:center;flex:none;width:85px;height:85px;border-radius:50%;overflow:hidden;background:#e7e9eb;color:#536471;font:650 29px/1 -apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif}\n.pk-css-page .thp-avatar>img{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;display:block!important}\n.pk-css-page .thp-identity{display:flex;flex-direction:column;min-width:0;flex:1;gap:11px}\n.pk-css-page .thp-display-name{font-size:14px!important;font-weight:760!important;line-height:1.16;color:#080808!important;font-family:inherit!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.pk-css-page .thp-stat-row{display:grid;grid-template-columns:74px 82px 44px;justify-content:start;gap:0;max-width:100%;align-items:start}\n.pk-css-page .thp-stat{display:flex;flex-direction:column;align-items:flex-start;gap:1px;white-space:nowrap;min-width:0;color:#080808}\n.pk-css-page .thp-stat strong{font-size:16px!important;font-weight:740!important;line-height:1.16}\n.pk-css-page .thp-stat span{font-size:14px!important;font-weight:710!important;line-height:1.2}\n.pk-css-page .thp-bio{margin-top:10px;margin-bottom:0;min-height:0;color:#101010;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;font-size:10.3px!important;line-height:1.13!important;letter-spacing:0!important}\n.pk-css-page .thp-bio p.pk-css-paragraph{margin:0!important;padding:0!important;font-size:10.3px!important;line-height:1.13!important;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word;text-indent:0!important;letter-spacing:0!important}\n.pk-css-page .thp-bio p.pk-css-paragraph:empty{min-height:4px}\n.pk-css-page .thp-extra{font-size:11px!important;line-height:1.3;white-space:pre-wrap;margin-top:3px;color:#111}\n.pk-css-page .thp-extra:empty{display:none}\n.pk-css-page .thp-threads-wrap{display:flex;margin-top:14px;margin-bottom:16px}\n.pk-css-page .thp-thread-chip{box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;max-width:100%;border-radius:100px;border:1px solid #dedede;padding:4.5px 9px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.045);color:#090909;font-size:13px!important;font-weight:680!important;line-height:1.2}\n.pk-css-page .thp-thread-chip>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pk-css-page .thp-threads{width:13px;height:15px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIiB3aWR0aD0iNDQ4IiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzExMTExMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMzMS41IDIzNS43YzIuMiAuOSA0LjIgMS45IDYuMyAyLjhjMjkuMiAxNC4xIDUwLjYgMzUuMiA2MS44IDYxLjRjMTUuNyAzNi41IDE3LjIgOTUuOC0zMC4zIDE0My4yYy0zNi4yIDM2LjItODAuMyA1Mi41LTE0Mi42IDUzaC0uM2MtNzAuMi0uNS0xMjQuMS0yNC4xLTE2MC40LTcwLjJjLTMyLjMtNDEtNDguOS05OC4xLTQ5LjUtMTY5LjZWMjU2di0uMkMxNyAxODQuMyAzMy42IDEyNy4yIDY1LjkgODYuMkMxMDIuMiA0MC4xIDE1Ni4yIDE2LjUgMjI2LjQgMTZoLjNjNzAuMyAuNSAxMjQuOSAyNCAxNjIuMyA2OS45YzE4LjQgMjIuNyAzMiA1MCA0MC42IDgxLjdsLTQwLjQgMTAuOGMtNy4xLTI1LjgtMTcuOC00Ny44LTMyLjItNjUuNGMtMjkuMi0zNS44LTczLTU0LjItMTMwLjUtNTQuNmMtNTcgLjUtMTAwLjEgMTguOC0xMjguMiA1NC40QzcyLjEgMTQ2LjEgNTguNSAxOTQuMyA1OCAyNTZjLjUgNjEuNyAxNC4xIDEwOS45IDQwLjMgMTQzLjNjMjggMzUuNiA3MS4yIDUzLjkgMTI4LjIgNTQuNGM1MS40LS40IDg1LjQtMTIuNiAxMTMuNy00MC45YzMyLjMtMzIuMiAzMS43LTcxLjggMjEuNC05NS45Yy02LjEtMTQuMi0xNy4xLTI2LTMxLjktMzQuOWMtMy43IDI2LjktMTEuOCA0OC4zLTI0LjcgNjQuOGMtMTcuMSAyMS44LTQxLjQgMzMuNi03Mi43IDM1LjNjLTIzLjYgMS4zLTQ2LjMtNC40LTYzLjktMTZjLTIwLjgtMTMuOC0zMy0zNC44LTM0LjMtNTkuM2MtMi41LTQ4LjMgMzUuNy04MyA5NS4yLTg2LjRjMjEuMS0xLjIgNDAuOS0uMyA1OS4yIDIuOGMtMi40LTE0LjgtNy4zLTI2LjYtMTQuNi0zNS4yYy0xMC0xMS43LTI1LjYtMTcuNy00Ni4yLTE3LjhIMjI3Yy0xNi42IDAtMzkgNC42LTUzLjMgMjYuM2wtMzQuNC0yMy42YzE5LjItMjkuMSA1MC4zLTQ1LjEgODcuOC00NS4xaC44YzYyLjYgLjQgOTkuOSAzOS41IDEwMy43IDEwNy43bC0uMiAuMnptLTE1NiA2OC44YzEuMyAyNS4xIDI4LjQgMzYuOCA1NC42IDM1LjNjMjUuNi0xLjQgNTQuNi0xMS40IDU5LjUtNzMuMmMtMTMuMi0yLjktMjcuOC00LjQtNDMuNC00LjRjLTQuOCAwLTkuNiAuMS0xNC40IC40Yy00Mi45IDIuNC01Ny4yIDIzLjItNTYuMiA0MS44bC0uMSAuMXoiLz48L3N2Zz4=)}\n.pk-css-page .thp-bottom-actions{display:flex;align-items:stretch;gap:5px;width:100%}\n.pk-css-page .thp-bottom-actions>span{box-sizing:border-box;min-width:0;background:#e9e9e9;border-radius:10px;min-height:31px;display:flex;align-items:center;justify-content:center;color:#0c0c0c;font-size:13px!important;line-height:1.1;font-weight:700}\n.pk-css-page .thp-follow{flex:1 1 0;gap:4px}\n.pk-css-page .thp-message{flex:1 1 0}\n.pk-css-page .thp-person{flex:none;width:31px}\n.pk-css-page .thp-down{width:16px;height:16px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjIuMzUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTUuOCA5IDEyIDE1LjIgMTguMiA5Ii8+PC9zdmc+)}\n.pk-css-page .thp-user-plus{width:21px;height:21px;background-image:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMTExMTExIiBzdHJva2Utd2lkdGg9IjEuOSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMy4yIDkuMlYzLjRtLTIuOSAyLjloNS44Ii8+PGNpcmNsZSBjeD0iMTUuOCIgY3k9IjcuOSIgcj0iMy40NSIvPjxwYXRoIGQ9Ik04LjcgMjAuN3YtMS42YzAtMy4yNSAyLjY1LTUuMDUgNi45NS01LjA1czcgMS44IDcgNS4wNXYxLjZaIi8+PC9zdmc+)}\n.pk-css-page .thp-screen [hidden]{display:none!important}\n@media(max-width:355px){.pk-css-page .thp-top{gap:14px}.pk-css-page .thp-top-actions{gap:17px;padding-right:0}.pk-css-page .thp-main-row{gap:10px}.pk-css-page .thp-avatar{width:78px;height:78px}.pk-css-page .thp-stat-row{grid-template-columns:minmax(55px,1fr) minmax(64px,1fr) minmax(35px,.5fr)}.pk-css-page .thp-stat strong{font-size:14px!important}.pk-css-page .thp-stat span{font-size:12px!important}}\n","/* @pk-template\n{\n  \"id\": \"threads_day\",\n  \"name\": \"脆\",\n  \"width\": 390,\n  \"html\": \"<div class=\\\"th-app\\\">\\n  <header class=\\\"th-nav\\\">\\n    <span class=\\\"th-ico th-back\\\" aria-hidden=\\\"true\\\"></span>\\n    <div class=\\\"th-nav-title\\\"><strong>串文</strong><small>37.7万次浏览</small></div>\\n    <div class=\\\"th-nav-actions\\\"><span class=\\\"th-ico th-bell\\\" aria-hidden=\\\"true\\\"></span><span class=\\\"th-ico th-more\\\" aria-hidden=\\\"true\\\"></span></div>\\n  </header>\\n  <article class=\\\"th-article\\\">\\n    <div class=\\\"th-author-row\\\">\\n      <span class=\\\"th-avatar\\\" data-pk=\\\"avatar\\\"></span>\\n      <div class=\\\"th-author-line\\\"><strong class=\\\"th-name\\\" data-pk=\\\"author\\\"></strong><span class=\\\"th-date\\\" data-pk=\\\"date\\\"></span></div>\\n      <span class=\\\"th-brand\\\"><i class=\\\"th-ico th-threads-mark\\\"></i><b>threads</b></span>\\n    </div>\\n    <div class=\\\"th-content\\\" data-pk=\\\"body\\\"></div>\\n    <div class=\\\"th-page-count\\\">1/2</div>\\n    <div class=\\\"th-metrics\\\">\\n      <div class=\\\"th-metric\\\"><i class=\\\"th-ico th-heart\\\"></i><span>1.8万</span></div>\\n      <div class=\\\"th-metric\\\"><i class=\\\"th-ico th-message\\\"></i><span>158</span></div>\\n      <div class=\\\"th-metric\\\"><i class=\\\"th-ico th-repeat\\\"></i><span>2,283</span></div>\\n      <div class=\\\"th-metric\\\"><i class=\\\"th-ico th-send\\\"></i><span>4,716</span></div>\\n    </div>\\n  </article>\\n  <section class=\\\"th-activity\\\">\\n    <div class=\\\"th-topic-row\\\"><span class=\\\"th-topic-magnify\\\" aria-hidden=\\\"true\\\"></span><strong data-pk=\\\"subtitle\\\"></strong><span class=\\\"th-topic-count\\\"> · 7.5K posts ›</span></div>\\n    <div data-pk-section=\\\"threads-comments\\\">\\n      <div class=\\\"th-sort\\\"><strong>热门 <span class=\\\"th-caret\\\"></span></strong><span>查看动态 ›</span></div>\\n      <div class=\\\"th-comment\\\">\\n        <span class=\\\"th-reply-avatar\\\" data-pk=\\\"threads-reply-avatar\\\"></span>\\n        <div class=\\\"th-reply-main\\\">\\n          <div class=\\\"th-reply-head\\\"><strong class=\\\"th-reply-name\\\" data-pk=\\\"threads-reply-name\\\"></strong><span class=\\\"th-reply-time\\\" data-pk=\\\"threads-reply-time\\\"></span><span class=\\\"th-reply-menu\\\" aria-hidden=\\\"true\\\">···</span></div>\\n          <div class=\\\"th-reply-content\\\" data-pk=\\\"threads-reply-text\\\"></div>\\n          <div class=\\\"th-reply-metrics\\\">\\n            <span><i class=\\\"th-ico th-heart\\\"></i><b>2,203</b></span><span><i class=\\\"th-ico th-message\\\"></i><b>3</b></span><span><i class=\\\"th-ico th-repeat\\\"></i><b>59</b></span><span><i class=\\\"th-ico th-send\\\"></i><b>101</b></span>\\n          </div>\\n        </div>\\n      </div>\\n    </div>\\n  </section>\\n</div>\"\n}\n@end-pk-template */\n\n.pk-css-page{min-height:0!important;background:#fff!important;color:#181818;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Noto Sans CJK SC\",Arial,sans-serif}\n.pk-css-page .th-app{width:100%;min-height:0;box-sizing:border-box;background:#fff;color:#171717;overflow:hidden;display:flex;flex-direction:column}\n.pk-css-page .th-nav{height:73px;padding:9px 13px 10px;display:flex;align-items:flex-start;justify-content:space-between;box-sizing:border-box;position:relative;flex:none}\n.pk-css-page .th-nav-title{position:absolute;left:82px;right:82px;top:6px;text-align:center;display:flex;flex-direction:column;gap:0;align-items:center;line-height:1.26;white-space:nowrap}\n.pk-css-page .th-nav-title strong{font-weight:750;font-size:22px;letter-spacing:.035em;color:#151515}\n.pk-css-page .th-nav-title small{font-size:12px;font-weight:550;color:#9b9b9b;letter-spacing:0}\n.pk-css-page .th-nav-actions{display:flex;align-items:center;gap:13px;position:relative;z-index:1}\n.pk-css-page .th-ico{display:inline-block;flex:none;background-repeat:no-repeat;background-position:center;background-size:contain;width:24px;height:24px;vertical-align:middle}\n.pk-css-page .th-back{width:27px;height:27px;margin-top:5px}\n.pk-css-page .th-bell{width:27px;height:27px;margin-top:4px}\n.pk-css-page .th-more{width:27px;height:27px;margin-top:4px;border:1.7px solid #272727;border-radius:50%;background-size:75%}\n.pk-css-page .th-article{padding:0 12px 16px;flex:1;display:flex;flex-direction:column;min-width:0;box-sizing:border-box}\n.pk-css-page .th-author-row{display:flex;align-items:center;min-height:69px;margin-bottom:7px;gap:10px;min-width:0;box-sizing:border-box}\n.pk-css-page .th-avatar{width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#efefef;color:#555;overflow:hidden;font-size:15px;font-weight:650}\n.pk-css-page .th-author-line{display:flex;align-items:baseline;gap:6px;min-width:0;white-space:nowrap;overflow:hidden}\n.pk-css-page .th-name{font-size:16.2px;font-weight:750;letter-spacing:-.015em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;color:#181818}\n.pk-css-page .th-date{font-size:13.7px;font-weight:480;color:#999;flex:none;white-space:nowrap;letter-spacing:-.035em}\n.pk-css-page .th-brand{margin-left:auto;white-space:nowrap;flex:none;display:inline-flex;gap:1px;align-items:center;line-height:1;font-size:13px;font-family:Arial,sans-serif;letter-spacing:-.075em;font-weight:800;color:#333}\n.pk-css-page .th-threads-mark{width:17px;height:17px}\n.pk-css-page .th-content{flex:0 1 auto;margin-top:0;box-sizing:border-box;font-size:16px;line-height:1.53;letter-spacing:.005em;font-weight:520;color:#1e1e1e;overflow-wrap:anywhere;word-break:normal;min-height:185px}\n.pk-css-page .th-content p.pk-css-paragraph{margin:0 0 9px;white-space:pre-wrap}\n.pk-css-page .th-content p.pk-css-paragraph:last-child{margin-bottom:0}\n.pk-css-page .th-page-count{align-self:flex-start;margin-top:11px;margin-bottom:12px;background:#f1f1f2;color:#888;border-radius:12px;padding:3px 10px;font-size:12px;line-height:1.2;letter-spacing:.01em;min-width:25px;text-align:center}\n.pk-css-page .th-metrics{display:flex;align-items:center;justify-content:space-between;gap:5px;padding:1px 0 7px;min-width:0;color:#656565}\n.pk-css-page .th-metric{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;flex:none;font-size:12.3px;font-weight:600;line-height:1.1;letter-spacing:-.025em}\n.pk-css-page .th-metric .th-ico{width:24px;height:24px}\n.pk-css-page :is(.th-metric,.th-reply-metrics) .th-ico{background-position:center}\n.pk-css-page :is(.th-metric,.th-reply-metrics) .th-heart{background-size:106%}\n.pk-css-page :is(.th-metric,.th-reply-metrics) .th-message{background-size:102%}\n.pk-css-page :is(.th-metric,.th-reply-metrics) .th-repeat{background-size:106%}\n.pk-css-page :is(.th-metric,.th-reply-metrics) .th-send{background-size:96%}\n@media (max-width:370px){.pk-css-page .th-article{padding-left:10px;padding-right:10px}.pk-css-page .th-metric{gap:3px;font-size:11px}.pk-css-page .th-metric .th-ico{width:21px;height:21px}.pk-css-page .th-nav-actions{gap:8px}.pk-css-page .th-author-row{gap:7px}}\n.pk-css-page .th-back{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%222.0%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M15%2018%209%2012%2015%206%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-bell{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.7%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M18%208a6%206%200%200%200-12%200c0%207-3%207-3%209h18c0-2-3-2-3-9%22%2F%3E%3Cpath%20d%3D%22M10%2021a2%202%200%200%200%204%200%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-more{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Ccircle%20cx%3D%225%22%20cy%3D%2212%22%20r%3D%221.3%22%20fill%3D%22%23242424%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2212%22%20r%3D%221.3%22%20fill%3D%22%23242424%22%20stroke%3D%22none%22%2F%3E%3Ccircle%20cx%3D%2219%22%20cy%3D%2212%22%20r%3D%221.3%22%20fill%3D%22%23242424%22%20stroke%3D%22none%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-heart{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M20.5%204.7a5.4%205.4%200%200%200-7.65%200L12%205.6l-.85-.9a5.4%205.4%200%201%200-7.65%207.65L12%2021l8.5-8.65a5.4%205.4%200%200%200%200-7.65Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-message{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.7%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M20.7%2011.5c0%205-3.7%208.7-8.7%208.7-1.5%200-2.7-.25-3.9-.9L3%2021l1.8-4.9a8.7%208.7%200%201%201%2015.9-4.6Z%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-repeat{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m16%203%204%204-4%204%22%2F%3E%3Cpath%20d%3D%22M4%2011V9a2%202%200%200%201%202-2h14%22%2F%3E%3Cpath%20d%3D%22m8%2021-4-4%204-4%22%2F%3E%3Cpath%20d%3D%22M20%2013v2a2%202%200%200%201-2%202H4%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-send{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M21%203%2010%2014%22%2F%3E%3Cpath%20d%3D%22m21%203-7%2019-4-8-8-4%2019-7Z%22%2F%3E%3Cpath%20d%3D%22M10%2014%2021%203%22%2F%3E%3C%2Fsvg%3E\")}\n.pk-css-page .th-threads-mark{background-image:url(\"data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23242424%22%20stroke-width%3D%221.75%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M17.5%207.5c-1.4-2.3-4-3.5-6.4-3.2-4.6.5-7.1%204-7.1%208.1%200%204.5%203%207.7%207.4%207.7%204.5%200%208.2-3.1%208.2-7.1%200-2.5-1.9-4.7-4.7-5.2-3.6-.7-6.1%201.4-6.1%203.8%200%201.7%201.3%202.9%203.3%202.9%202.3%200%203.7-2.2%203.7-4.7%200-2.9-1.6-5.7-5.4-5.7%22%2F%3E%3C%2Fsvg%3E\")}\n\n.pk-css-page .th-article{padding-bottom:9px}\n.pk-css-page .th-page-count{margin-bottom:8px}\n.pk-css-page .th-activity{border-top:1px solid #efefef;min-width:0;background:#fff}\n.pk-css-page .th-topic-row{padding:11px 12px 12px;display:flex;align-items:center;gap:6px;min-height:46px;font-size:13px;border-bottom:1px solid #eee;white-space:nowrap;overflow:hidden}\n.pk-css-page .th-topic-row:has([data-pk=\"subtitle\"][hidden]){display:none}\n.pk-css-page .th-topic-row [data-pk=\"subtitle\"]{font-size:13px!important;color:#158ede!important;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:55%}\n.pk-css-page .th-topic-count{font-size:12px;color:#949494;white-space:nowrap}\n.pk-css-page .th-topic-magnify{display:inline-block;flex:none;width:12px;height:12px;border:2px solid #1899e6;border-radius:50%;margin-right:2px;position:relative}\n.pk-css-page .th-topic-magnify:after{content:\"\";position:absolute;width:6px;height:2px;background:#1899e6;transform:rotate(45deg);right:-5px;bottom:-3px;border-radius:1px}\n.pk-css-page .th-sort{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border-bottom:1px solid #eaeaea;color:#1e1e1e}\n.pk-css-page .th-sort strong{font-size:14px;font-weight:680}\n.pk-css-page .th-sort>span{font-size:13px;color:#888}\n.pk-css-page .th-sort b{font-size:19px;font-weight:350;vertical-align:middle}\n.pk-css-page .th-caret{display:inline-block;width:7px;height:7px;border-right:1.5px solid #555;border-bottom:1.5px solid #555;transform:rotate(45deg);vertical-align:3px;margin-left:3px}\n/* Threads single reply: avatar / byline + time / body / evenly sized actions. */\n.pk-css-page [data-pk-section=\"threads-comments\"][hidden]{display:none!important}\n.pk-css-page .th-comment{display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;padding:16px 14px 14px;border-bottom:1px solid #f0f0f0;min-width:0;align-items:start}\n.pk-css-page .th-reply-avatar{width:36px;height:36px;border-radius:50%;background:#ededee;color:#777;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:650;flex:none}\n.pk-css-page .th-reply-avatar .pk-avatar-photo{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:50%!important;display:block!important;transform:none!important}\n.pk-css-page .th-reply-main{display:flex;min-width:0;flex-direction:column}\n.pk-css-page .th-reply-head{display:flex;align-items:center;min-width:0;gap:7px;height:24px;line-height:1.2}\n.pk-css-page .th-reply-name{color:#171717!important;font-size:14.5px!important;font-weight:720;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.pk-css-page .th-reply-time{color:#999;font-size:12.5px;font-weight:400;white-space:nowrap;flex:none}\n.pk-css-page .th-reply-menu{margin-left:auto;color:#666;flex:none;font:700 21px/1 Arial,sans-serif;letter-spacing:0;transform:translateY(-4px)}\n.pk-css-page .th-reply-content{margin:3px 0 11px;color:#222;font-size:14.5px!important;line-height:1.48;white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal}\n.pk-css-page .th-reply-metrics{display:flex;gap:17px;align-items:center;color:#888;min-width:0;flex-wrap:nowrap}\n.pk-css-page .th-reply-metrics>span{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;min-width:0}\n.pk-css-page .th-reply-metrics b{font-size:11.5px;font-weight:450;color:#888}\n.pk-css-page .th-reply-metrics .th-ico{width:20px;height:20px;opacity:.88}\n@media(max-width:365px){.pk-css-page .th-reply-metrics{gap:11px}.pk-css-page .th-comment{padding-left:10px;padding-right:10px}}\n\n.pk-css-page .th-app{min-height:0!important}\n.pk-css-page .th-article{flex:0 0 auto!important}\n.pk-css-page .th-content{flex:0 1 auto!important;min-height:0!important}\n.pk-css-page .th-page-count{margin-top:9px!important}","/* @pk-template\n{\n  \"id\": \"page_margin_note\",\n  \"name\": \"页边批注\",\n  \"width\": 460,\n  \"html\": \"<main class=\\\"pa-page\\\">\\n  <span class=\\\"pa-rule\\\" aria-hidden=\\\"true\\\"></span>\\n  <section class=\\\"pa-notes\\\">\\n    <article class=\\\"pa-note\\\">\\n      <span class=\\\"pa-avatar\\\" aria-hidden=\\\"true\\\"></span>\\n      <div class=\\\"pa-copy\\\">\\n        <strong class=\\\"pa-author\\\" data-pk=\\\"author\\\"></strong>\\n        <div class=\\\"pa-body\\\" data-pk=\\\"body\\\"></div>\\n      </div>\\n    </article>\\n  </section>\\n</main>\"\n}\n@end-pk-template */\n\n/* 页边批注：每个自然段一条批注。请配合支持多条批注的打孔海报脚本。 */\n.pk-css-page {\n  box-sizing:border-box!important;\n  margin:0!important;\n  padding:0!important;\n  min-height:0!important;\n  background:#faf9f7!important;\n  color:#a63f4a!important;\n}\n.pk-css-page .pa-page,.pk-css-page .pa-page * {box-sizing:border-box}\n.pk-css-page .pa-page {\n  position:relative;\n  padding:62px 28px 67px 73px;\n  width:100%;\n  background:#faf9f7;\n  min-height:195px;\n}\n/* Book margin separator. Each annotation gets its own thin red marker. */\n.pk-css-page .pa-rule {\n  position:absolute;\n  left:42px;\n  top:0;\n  bottom:0;\n  border-left:1px solid #d6d5d3;\n  pointer-events:none;\n}\n.pk-css-page .pa-notes {display:flex;flex-direction:column;gap:39px;min-width:0}\n.pk-css-page .pa-note {\n  position:relative;\n  display:grid;\n  grid-template-columns:41px minmax(0,1fr);\n  align-items:start;\n  gap:15px;\n  min-width:0;\n}\n.pk-css-page .pa-note::before {\n  content:\"\";\n  position:absolute;\n  left:-32px;\n  top:1px;\n  height:60px;\n  width:3px;\n  border-radius:2px;\n  background:#a63f4a;\n}\n/* Decorative annotation glyph: no editable avatar slot in this template. */\n.pk-css-page .pa-avatar {\n  position:relative;\n  display:block;\n  width:41px;\n  height:41px;\n  overflow:hidden;\n  border-radius:3px;\n  background:#a83d49;\n  font-size:0!important;\n  color:transparent!important;\n}\n.pk-css-page .pa-avatar::before {\n  content:\"\";\n  position:absolute;\n  top:6px;\n  left:15px;\n  width:12px;\n  height:14px;\n  border-radius:50%;\n  background:#f5edf0;\n}\n.pk-css-page .pa-avatar::after {\n  content:\"\";\n  position:absolute;\n  left:6px;\n  bottom:5px;\n  width:29px;\n  height:17px;\n  border-radius:52% 52% 2px 2px;\n  background:#f5edf0;\n}\n.pk-css-page .pa-avatar>img.pk-avatar-photo {\n  position:relative!important;\n  z-index:1;\n  display:block!important;\n  width:100%!important;\n  height:100%!important;\n  border-radius:3px!important;\n  object-fit:cover!important;\n}\n.pk-css-page .pa-copy {min-width:0}\n.pk-css-page .pa-author {\n  display:block;\n  margin:-1px 0 7px;\n  color:#a63f4a!important;\n  -webkit-text-fill-color:#a63f4a!important;\n  font-family:Georgia,\"Songti SC\",\"STSong\",serif!important;\n  font-size:20px!important;\n  font-weight:700!important;\n  line-height:1.3!important;\n  letter-spacing:0!important;\n  overflow-wrap:anywhere;\n}\n.pk-css-page .pa-body {\n  color:#aa414c!important;\n  -webkit-text-fill-color:#aa414c!important;\n  font-family:\"Songti SC\",\"STSong\",\"Noto Serif CJK SC\",\"SimSun\",serif!important;\n  font-size:18px!important;\n  line-height:1.65!important;\n  letter-spacing:.01em!important;\n  overflow-wrap:anywhere;\n  word-break:break-word;\n  white-space:pre-wrap;\n}\n.pk-css-page .pa-body>.pk-css-paragraph {\n  margin:0!important;\n  padding:0!important;\n  font-size:inherit!important;\n  font-family:inherit!important;\n  line-height:inherit!important;\n  color:inherit!important;\n  -webkit-text-fill-color:inherit!important;\n  text-indent:0!important;\n  white-space:pre-wrap;\n  overflow-wrap:anywhere;\n}\n@media(max-width:370px){\n  .pk-css-page .pa-page{padding-left:61px;padding-right:19px}\n  .pk-css-page .pa-rule{left:34px}\n  .pk-css-page .pa-note::before{left:-28px}\n  .pk-css-page .pa-notes{gap:30px}\n  .pk-css-page .pa-note{grid-template-columns:37px minmax(0,1fr);gap:12px}\n  .pk-css-page .pa-avatar{width:37px;height:37px}\n  .pk-css-page .pa-avatar::before{left:13px}\n  .pk-css-page .pa-avatar::after{left:4px}\n}\n","/* @pk-template\n{\n  \"id\": \"dictionary_entry\",\n  \"name\": \"字典\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"dc-page\\\"><header class=\\\"dc-running\\\" data-pk=\\\"author\\\"></header><section class=\\\"dc-definition\\\"><h1 class=\\\"dc-headword\\\" data-pk=\\\"title\\\"></h1><main class=\\\"dc-entry\\\" data-pk=\\\"body\\\"></main></section><footer class=\\\"dc-source\\\" data-pk=\\\"user\\\"></footer></article>\"\n}\n@end-pk-template */\n\n/* Compact dictionary entry. All wording comes from the editor. */\n.pk-css-page{box-sizing:border-box!important;margin:0!important;padding:0!important;min-height:0!important;background:var(--pk-shared-paper,#fff)!important;color:var(--pk-shared-ink,#222)!important;font-family:var(--pk-shared-font,\"Songti SC\",\"STSong\",serif)!important}\n.pk-css-page .dc-page{padding:20px 24px 27px;color:inherit;background:transparent;box-sizing:border-box}\n.pk-css-page .dc-running{margin:0;padding:0 0 4px;border-bottom:1px solid currentColor;text-align:center;font-size:14px;line-height:1.3;font-weight:400;letter-spacing:.08em;overflow-wrap:anywhere}\n.pk-css-page .dc-definition{display:flow-root;margin-top:29px}\n.pk-css-page .dc-headword{float:left;max-width:45%;margin:0 8px 0 0;padding:0;font-size:30px;line-height:1.2;font-weight:400;overflow-wrap:anywhere}\n.pk-css-page .dc-headword:empty{display:none}\n.pk-css-page .dc-entry{margin:0;min-width:0;counter-reset:definition;text-align:justify;overflow-wrap:anywhere;word-break:normal}\n.pk-css-page .dc-entry>p.pk-css-paragraph{display:block;margin:0!important;padding:0!important;font:inherit!important;color:inherit!important;text-align:justify;text-align-last:auto;text-indent:0!important;white-space:normal}\n.pk-css-page .dc-entry>p:not(.pk-css-blank)::before{counter-increment:definition;content:counter(definition);display:inline-flex;align-items:center;justify-content:center;width:1.05em;height:1.05em;margin-right:.2em;border-radius:50%;background:currentColor;font:700 .75em/1 Arial,sans-serif;vertical-align:.08em;-webkit-text-fill-color:var(--pk-shared-paper,#fff)}\n.pk-css-page .dc-entry>p.pk-css-blank{display:none!important}\n.pk-css-page .dc-source{clear:both;margin:4px 0 0;padding-left:1em;text-align:left;font-size:12px;line-height:1.4;font-weight:400;letter-spacing:.02em;overflow-wrap:anywhere}\n.pk-css-page .dc-source:empty{display:none}\n","/* @pk-template\n{\n  \"id\": \"book_excerpt_cover\",\n  \"name\": \"书摘-封面\",\n  \"width\": 390,\n  \"html\": \"<article class=\\\"ec-page\\\"><main class=\\\"ec-body\\\" data-pk=\\\"body\\\"></main><footer class=\\\"ec-book\\\"><div class=\\\"ec-cover\\\" data-pk=\\\"avatar\\\"></div><div class=\\\"ec-info\\\"><h1 class=\\\"ec-title\\\" data-pk=\\\"title\\\"></h1><p class=\\\"ec-author\\\" data-pk=\\\"author\\\"></p></div></footer></article>\"\n}\n@end-pk-template */\n\n/* 封面读取插件头像设置；文字完全由正文、作品名、作者栏填入。 */\n.pk-css-page{box-sizing:border-box!important;margin:0!important;padding:0!important;min-height:0!important;background:var(--pk-shared-paper,#fff)!important;color:var(--pk-shared-ink,#242424)!important;font-family:var(--pk-shared-font,\"PingFang SC\",sans-serif)!important}\n.pk-css-page .ec-page{width:100%;margin:0;color:inherit;background:transparent}\n.pk-css-page .ec-body{display:flex;flex-direction:column;gap:.6em;padding:28px 28px 26px;margin:0;min-width:0;font-size:17px;line-height:1.9;text-align:justify;overflow-wrap:anywhere;word-break:normal}\n.pk-css-page .ec-body>p.pk-css-paragraph{flex:none;min-width:0;font:inherit!important;color:inherit!important;text-align:inherit;white-space:normal}\n.pk-css-page .ec-book{display:flex;align-items:center;gap:13px;padding:20px 28px 24px;margin:0;border-top:1px solid currentColor;border-top-color:color-mix(in srgb,currentColor 15%,transparent)}\n.pk-css-page .ec-cover{flex:0 0 42px;width:42px;height:60px;min-width:42px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:0;background:rgba(127,127,127,.12);font-size:22px;color:inherit;box-shadow:0 1px 5px rgba(0,0,0,.08)}\n.pk-css-page .ec-cover>img.pk-avatar-photo{display:block;width:100%!important;height:100%!important;object-fit:cover!important;border-radius:0!important}\n.pk-css-page .ec-info{flex:1;min-width:0}\n.pk-css-page .ec-title{margin:0 0 5px;padding:0;font-size:19px;line-height:1.35;font-weight:700;overflow-wrap:anywhere}\n.pk-css-page .ec-author{margin:0;padding:0;font-size:12px;line-height:1.45;opacity:.65;overflow-wrap:anywhere}\n@media(max-width:350px){.pk-css-page .ec-body{padding-left:23px;padding-right:23px}.pk-css-page .ec-book{padding-left:23px;padding-right:23px;gap:11px}}\n\n/* 段落间距由 gap 控制，空行标记不再重复占据一整组间距。 */\n.pk-css-page .ec-body>.pk-css-blank{display:none!important}\n","/* @pk-template\n{\"id\":\"ridi_book\",\"name\":\"RIDI\",\"width\":390,\"html\":\"<article class=\\\"rd-page\\\"><header class=\\\"rd-nav\\\"><b class=\\\"rd-logo\\\">RIDI</b><span class=\\\"rd-search\\\" aria-label=\\\"搜索\\\"></span><span class=\\\"rd-login\\\">로그인</span></header><section class=\\\"rd-work\\\"><aside class=\\\"rd-side\\\"><div class=\\\"rd-cover\\\" data-pk=\\\"avatar\\\"></div><div class=\\\"rd-preview\\\">미리보기</div></aside><div class=\\\"rd-details\\\"><div class=\\\"rd-category\\\">e북 <span>›</span> 작품</div><div class=\\\"rd-category\\\">문학 <span>›</span> 발췌</div><h1 data-pk=\\\"title\\\"></h1><div class=\\\"rd-rating\\\"><strong>★ —점</strong><span> | 관심 —</span></div><p class=\\\"rd-credit\\\"><b data-pk=\\\"author\\\"></b> <span>저자</span></p><p class=\\\"rd-credit\\\"><b data-pk=\\\"user\\\"></b> <span>발췌</span></p><p class=\\\"rd-date\\\" data-pk=\\\"date\\\"></p><p class=\\\"rd-subtitle\\\" data-pk=\\\"subtitle\\\"></p><div class=\\\"rd-follow\\\">＋ 관심</div></div></section><h2 class=\\\"rd-info\\\">작품 정보</h2><div class=\\\"rd-tabs\\\"><b>작품 소개</b><span>목차</span></div><main class=\\\"rd-body\\\" data-pk=\\\"body\\\"></main><footer class=\\\"rd-collapse\\\">접기 <span>⌃</span></footer></article>\"}\n@end-pk-template */\n.rd-page{box-sizing:border-box;width:100%;background:var(--pk-shared-paper,#fff);color:var(--pk-shared-ink,#141414);font-family:var(--pk-shared-font,sans-serif);padding:0 14px 7px}\n.rd-page *{box-sizing:border-box}\n.rd-nav{display:flex;align-items:center;gap:18px;height:48px;margin-bottom:9px;font-family:Arial,sans-serif}\n.rd-logo{font-size:20px;line-height:1;color:#1e9eff;letter-spacing:-1px}\n.rd-search{margin-left:auto;width:14px;height:14px;border:1.5px solid currentColor;border-radius:50%;position:relative}\n.rd-search:after{content:\"\";position:absolute;width:9px;height:1.5px;background:currentColor;transform:rotate(47deg);right:-7px;bottom:-4px}\n.rd-login{border:1px solid #eee;border-radius:20px;padding:6px 10px;font-size:12px;font-weight:700;color:#808080}\n.rd-work{display:flex;align-items:flex-start;gap:14px}\n.rd-side{flex:0 0 98px;min-width:0}\n.rd-cover{width:98px;height:139px;overflow:hidden;border-radius:3px;background:#eee}\n.rd-cover img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}\n.rd-preview{border:1px solid #ddd;border-radius:6px;text-align:center;padding:9px 0;margin-top:10px;font-size:12px;font-weight:700;opacity:.75}\n.rd-details{flex:1;min-width:0}\n.rd-category{font-size:11px;line-height:1.5;font-weight:700;opacity:.7}\n.rd-category span{font-weight:400;padding:0 2px}\n.rd-details h1{margin:9px 0 10px;font-size:20px;font-weight:800;line-height:1.2;overflow-wrap:anywhere}\n.rd-rating{font:12px/1.5 Arial,sans-serif;margin-bottom:6px}\n.rd-rating strong{color:#dc3232}\n.rd-rating span{opacity:.65}\n.rd-credit,.rd-date,.rd-subtitle{margin:4px 0;font-size:12px;line-height:1.55;overflow-wrap:anywhere}\n.rd-credit span,.rd-date{opacity:.7}\n.rd-subtitle:empty{display:none}\n.rd-follow{display:inline-block;border:1px solid #1e9eff;color:#1e9eff;border-radius:20px;padding:5px 9px;font-size:12px;font-weight:700;margin-top:8px}\n.rd-info{border-top:1px solid #ddd;margin:18px 0 0;padding:11px 0;font-size:16px;font-weight:800}\n.rd-tabs{display:flex;margin:0 -14px;border-top:2px solid #808080;text-align:center;font-size:14px}\n.rd-tabs>b,.rd-tabs>span{width:50%;padding:10px 0}\n.rd-tabs>span{background:rgba(128,128,128,.08);border-left:1px solid #ccc;border-bottom:1px solid #ccc;opacity:.45;font-weight:700}\n.rd-body{padding:15px 0 10px;font-size:14px;line-height:1.75;overflow-wrap:anywhere}\n.rd-body p{margin:0 0 1.5em}\n.rd-body p:last-child{margin-bottom:0}\n.rd-collapse{border:1px solid #ccc;border-radius:6px;text-align:center;font-size:14px;font-weight:700;padding:9px 0}\n","/* @pk-template\n{\"id\":\"comic_detail\",\"name\":\"漫画-详情页\",\"width\":390,\"html\":\"<article class=\\\"mc-page\\\"><header class=\\\"mc-nav\\\"><span class=\\\"mc-back\\\">‹</span><span class=\\\"mc-favorite\\\">✓ 已加入最愛</span><span class=\\\"mc-info-icon\\\">i</span><span class=\\\"mc-more\\\">⋮</span></header><div class=\\\"mc-cover\\\" data-pk=\\\"avatar\\\" data-pk-upload=\\\"postypeAvatarImg\\\" title=\\\"点击上传封面\\\"></div><section class=\\\"mc-content\\\"><div class=\\\"mc-category\\\" data-pk=\\\"subtitle\\\"></div><h1 data-pk=\\\"title\\\"></h1><p class=\\\"mc-author\\\" data-pk=\\\"author\\\"></p><main class=\\\"mc-body\\\" data-pk=\\\"body\\\"></main><div class=\\\"mc-note\\\" data-pk=\\\"note\\\"></div></section></article>\"}\n@end-pk-template */\n.pk-css-page{padding:0!important;background:var(--pk-shared-paper,#fff)!important;color:var(--pk-shared-ink,#171717)!important;font-family:var(--pk-shared-font,sans-serif)!important}\n.mc-page{width:100%;box-sizing:border-box}\n.mc-page *{box-sizing:border-box}\n.mc-nav{display:flex;align-items:center;gap:19px;padding:7px 17px 10px;height:42px;font-family:sans-serif}\n.mc-back{font-size:35px;font-weight:300;line-height:1;margin-right:auto}\n.mc-favorite{background:rgba(128,128,128,.1);border-radius:20px;padding:5px 9px;font-size:12px;opacity:.7}\n.mc-info-icon{border:1px solid #ddd;border-radius:50%;width:24px;height:24px;line-height:23px;text-align:center;font-size:18px}\n.mc-more{font-size:25px;line-height:1}\n.mc-cover{width:208px;height:270px;max-width:70%;margin:0 auto 20px;overflow:hidden;border-radius:4px;background:rgba(128,128,128,.12);display:flex;align-items:center;justify-content:center;font-size:50px;cursor:pointer}\n.mc-cover>img.pk-avatar-photo{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:inherit}\n.mc-content{padding:0 16px 16px}\n.mc-category{display:table;max-width:100%;font-size:12px;line-height:1.6;font-weight:700;box-shadow:inset 0 -.4em rgba(87,211,164,.22);overflow-wrap:anywhere}\n.mc-category:empty,.mc-note:empty{display:none}\n.mc-content h1{font-size:21px;line-height:1.3;margin:4px 0;font-weight:800;overflow-wrap:anywhere}\n.mc-author{font-size:14px;line-height:1.5;margin:0 0 10px;opacity:.8}\n.mc-body{display:flex;flex-direction:column;gap:.6em;font-size:14px;line-height:1.7;overflow-wrap:anywhere}\n.mc-body>.pk-css-blank{display:none!important}\n.mc-note{display:table;max-width:100%;margin-top:20px;padding:4px 7px;border-radius:3px;background:rgba(128,128,128,.08);font-size:12px;line-height:1.6;opacity:.75;white-space:pre-wrap;overflow-wrap:anywhere}\n"];
for (const source of BUNDLED_TEMPLATE_CSS) {
  try {
    const rec = cssClean(source);
    BUILTIN_CSS[rec.id] = rec;
  } catch (error) {
    console.warn('[repo美化] Bundled CSS unavailable:', error);
  }
}


function cssActive() { return String(cur().pageSkin||'').startsWith('css:'); }
function cssEntries() { return store().cssTpl; }
// Display names and exported CSS filenames use stable, annotation-free template names.
// Keep template IDs unchanged so importing a new CSS still replaces the old one.
function cssTemplateName(id, name) {
  const stable = {
    app_postype: 'POSTYPE',
    xhs_note: '小红书',
    xhs_comments: '小红书评论',
    blank: '单页'
  };
  if (stable[id]) return stable[id];
  return String(name || id || '模板')
    .replace(/\s*[（(][^）)]*(?:修复|调整|修改|重做|无评论|无上一篇|横版|对齐|图标|更新|新版|v\d)[^）)]*[）)]\s*$/gi, '')
    .replace(/(?:\s*[-_· ]+)(?:v\d+(?:[._-]\d+)*|修复版|调整版|新版|最终版|无评论区|横版配图|无上一篇下一篇)\s*$/gi, '')
    .replace(/\s*·\s*/g, '-')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/-{2,}/g, '-')
    .trim() || String(id || '模板');
}
// FileReader is more reliable than File.text() in older embedded iOS WebViews.
// Test doubles and non-Blob sources may still provide a .text() method.
// Shared WebView-safe text reader. Only the CSS wrapper applies the 200 KB cap.
function readLocalTextFile(file,label){
  if(typeof FileReader!=='undefined' && typeof Blob!=='undefined' && file instanceof Blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(String(reader.result||''));
      reader.onerror=()=>reject(new Error('读取'+label+'失败，请重新选择文件'));
      reader.onabort=()=>reject(new Error(label+'读取已取消'));
      try{reader.readAsText(file,'UTF-8');}catch(error){reject(error);}
    });
  }
  if(typeof file.text==='function')return Promise.resolve().then(()=>file.text());
  return Promise.reject(new Error('当前环境不支持读取'+label));
}
function cssReadFile(file){
  if(!file)return Promise.reject(new Error('没有选中 CSS 文件'));
  if(Number.isFinite(file.size)&&file.size>200000)
    return Promise.reject(new Error('CSS 文件过大（最大 200 KB）'));
  return readLocalTextFile(file,' CSS 文件');
}
function cssClean(input) {
  const raw=String(input||'');
  // Keep imports local: reject scripts, external @imports, and gigantic content.
  if (raw.length>180000) throw new Error('CSS 文件太大（最大 180 KB）');
  const block=raw.match(/\/\*\s*@pk-template\s*([\s\S]*?)\s*@end-pk-template\s*\*\//i);
  if(!block)throw new Error('缺少 @pk-template 配置，请用示例 CSS 的格式');
  let meta;
  try { meta=JSON.parse(block[1]); } catch(e) {throw new Error('CSS 内的模板配置不是有效 JSON');}
  if(!meta || typeof meta.name!=='string'||!meta.name.trim()) throw new Error('需要模板名称 name');
  if(typeof meta.html!=='string'||!meta.html.includes('data-pk="body"')) throw new Error('页面结构里需要正文插槽 data-pk="body"');
  const css=raw.replace(block[0],'').trim();
  if(/@import\b/i.test(css) || /(?:expression\s*\(|javascript\s*:)/i.test(css)) throw new Error('CSS 不支持外部 @import 或脚本');
  if(/url\s*\(\s*(?!["']?data:)[^)]+\)/i.test(css)) throw new Error('为了导出稳定，CSS 暂不支持远程 url()；请用上传头像或纯 CSS 图形');
  const id=String(meta.id||meta.name).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff_-]+/g,'-').slice(0,60);
  if(!id || ['__proto__','constructor','prototype'].includes(id))throw new Error('模板 ID 不合法');
  return {id, name:cssTemplateName(id, meta.name.trim()).slice(0,64), html:meta.html, css, width:Math.min(640,Math.max(250,+meta.width||390))};
}
function cssSafeMarkup(html) {
  const tmpl=document.createElement('template');
  tmpl.innerHTML=html;
  tmpl.content.querySelectorAll('script,style,iframe,object,embed,form,link,meta,svg,foreignObject').forEach(x=>x.remove());
  tmpl.content.querySelectorAll('*').forEach(el=>{
    for(const att of Array.from(el.attributes)){
      const n=att.name.toLowerCase(),v=att.value;
      // Templates need local/data-image slots, never responsive external image
      // candidates, navigation requests or background URL attributes.
      if(n.startsWith('on') || n==='srcdoc' || n==='contenteditable' || n==='style' ||
        ['srcset','imagesrcset','poster','background','ping','formaction','action','data'].includes(n) ||
        ((n==='href'||n==='src'||n==='xlink:href') && !/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(v)))
        el.removeAttribute(att.name);
    }
  });
  return tmpl.innerHTML;
}
function cssIconSvg(name){
  const shapes={
    'chevron-left':['path|m15 18-6-6 6-6'],
    'chevron-right':['path|m9 18 6-6-6-6'],
    'house':['path|m3 10 9-7 9 7','path|M5 9v11h14V9','path|M9 20v-7h6v7'],
    'share':['path|M12 16V3','path|m7 8 5-5 5 5','path|M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7'],
    'settings':['circle|12,12,3','path|M9.8 2.7h4.4l.7 2.4 2 .8 2.2-1.2 3.1 3.1L21 10l.8 2 .2 2.2-2.4.7-.8 2 1.2 2.2-3.1 3.1-2.2-1.2-2 .8-2.2.2-.7-2.4-2-.8-2.2 1.2-3.1-3.1L3.7 17l-.8-2L.5 14.2V9.8l2.4-.7.8-2-1.2-2.2 3.1-3.1 2.2 1.2 2-.8Z'],
    'list':['path|M9 6h12','path|M9 12h12','path|M9 18h12','path|M4 6h.01','path|M4 12h.01','path|M4 18h.01'],
    'heart':['path|M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z'],
    'message':['path|M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z'],
    'repeat':['path|m17 2 4 4-4 4','path|M3 11V9a3 3 0 0 1 3-3h15','path|m7 22-4-4 4-4','path|M21 13v2a3 3 0 0 1-3 3H3'],
    'bookmark':['path|M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z']
  };
  if(!shapes[name])return null;
  const NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');
  s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');
  for(const item of shapes[name]){
    const [type,arg]=item.split('|');const node=document.createElementNS(NS,type);
    if(type==='circle'){const [cx,cy,r]=arg.split(',');node.setAttribute('cx',cx);node.setAttribute('cy',cy);node.setAttribute('r',r);}
    else node.setAttribute('d',arg);
    s.appendChild(node);
  }
  return s;
}

// All structured CSS templates use the same complete source text for preview,
// in-place editing and PNG export. This prevents one edited note from replacing
// the entire multi-selection, and ensures that stray closing brackets are not
// treated as separate notes.
// Selection extraction has already discarded HTML formatting whitespace.
// Preserve every remaining explicit newline, including a single <br>, as a
// paragraph boundary in all CSS templates. Automatic screen wrapping never
// inserts a newline here. Empty lines remain optional layout spacers.
function softJoinGap(left,right){
  if(!left||!right)return '';
  const hanKana=/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\u31f0-\u31ff\uff66-\uff9f]/u;
  const cjkPunctuation=/[\u3000-\u303f\uff00-\uff65\u2018-\u201d\u2026\u2014]/u;
  const joined=(hanKana.test(left)&&hanKana.test(right))
    ||(cjkPunctuation.test(left)&&cjkPunctuation.test(right))
    ||(cjkPunctuation.test(left)&&hanKana.test(right))
    ||(hanKana.test(left)&&cjkPunctuation.test(right));
  return joined?'':' ';
}
function sourceParagraphParts(value){
  const raw=String(value??'').replace(/\r\n?/g,'\n');
  const result=[];
  const separator=/\n+/g;
  let start=0,match;
  while((match=separator.exec(raw))){
    const paragraph=raw.slice(start,match.index);
    if(paragraph.trim())result.push({text:paragraph.trim(),blank:false});
    for(let i=1;i<match[0].length;i++)result.push({text:'',blank:true});
    start=separator.lastIndex;
  }
  const tail=raw.slice(start);
  if(tail.trim())result.push({text:tail.trim(),blank:false});
  return result;
}
function sourceTextParagraphs(value){
  return sourceParagraphParts(value).filter(part=>!part.blank).map(part=>part.text);
}
function marginNoteParts(text){
  const parts=[];
  const open={']':'[','】':'【','」':'「','』':'『','）':'（','》':'《','”':'“','’':'‘'};
  for(const item of sourceTextParagraphs(text)){
    const line=item.trim();
    if(!line)continue;
    // Only treat a line made entirely of closing brackets as a possible
    // continuation. Standalone punctuation, symbols and emoji are valid
    // user-selected paragraphs and must never disappear during editing/export.
    if(/^[\]】」』）》”’]+$/u.test(line)){
      if(parts.length){
        let previous=parts[parts.length-1];
        for(const char of line){
          if(previous.includes(open[char]) && !previous.endsWith(char))previous+=char;
        }
        parts[parts.length-1]=previous;
      } else {
        parts.push(line);
      }
      continue;
    }
    parts.push(line);
  }
  return parts;
}
function imessageReceivedParts(text){
  return sourceTextParagraphs(text).map(s=>s.trim()).filter(Boolean);
}

// 作文格纸：按用户的主标题、副标题、正文绘制真正的逐字格子，
// 而不是依赖浏览器在连续文本中猜测字符宽度。所有输入只写入 textContent。
const ESSAY_COLUMNS=20;
function essayGraphemes(value){
  const text=String(value??'').replace(/\r/g,'').replace(/\t/g,'　');
  if(typeof Intl!=='undefined' && typeof Intl.Segmenter==='function'){
    return Array.from(new Intl.Segmenter('zh',{granularity:'grapheme'}).segment(text),v=>v.segment);
  }
  return Array.from(text);
}
function essayChunks(chars,columns=ESSAY_COLUMNS){
  const rows=[];
  for(let i=0;i<chars.length;i+=columns)rows.push(chars.slice(i,i+columns));
  return rows.length?rows:[[]];
}
function essayPutRows(slot,rows,minRows=0){
  if(!slot)return;
  const fragment=document.createDocumentFragment();
  for(let i=0;i<Math.max(rows.length,minRows);i++){
    const line=document.createElement('div');line.className='ep-grid-row';
    const cells=rows[i]||[];
    for(let j=0;j<ESSAY_COLUMNS;j++){
      const cell=document.createElement('span');cell.className='ep-cell';
      cell.textContent=cells[j]||'';
      line.appendChild(cell);
    }
    fragment.appendChild(line);
  }
  slot.replaceChildren(fragment);
}
function essayRender(root,heading,subtitle,raw){
  const titleSlot=root.querySelector('.ep-title');
  const subtitleSlot=root.querySelector('.ep-subtitle');
  const body=root.querySelector('.ep-body');
  // Center every title row by counting grapheme clusters, including emoji.
  const title=essayGraphemes(String(heading||'').trim().replace(/\n/g,''));
  const titleRows=essayChunks(title).map(row=>[...Array(Math.floor((ESSAY_COLUMNS-row.length)/2)).fill(''),...row]);
  essayPutRows(titleSlot,titleRows);
  const value=String(subtitle||'').trim();
  if(!value){subtitleSlot?.replaceChildren();}
  else {
    const text=/^[—－–-]{2}/u.test(value)?value:'——'+value;
    const subtitleRows=[];
    for(const line of text.split('\n')){
      const part=[...Array(6).fill(''),...essayGraphemes(line)];
      subtitleRows.push(...essayChunks(part));
    }
    essayPutRows(subtitleSlot,subtitleRows);
  }
  const bodyRows=[];
  for(const part of sourceParagraphParts(raw)){
    if(part.blank){if(bodyRows.length)bodyRows.push([]);continue;}
    part.text.split('\n').forEach((line,i)=>{
      // Only the first row of a genuine paragraph gets the two-cell indent.
      const prefix=i===0?['','']:[];
      bodyRows.push(...essayChunks([...prefix,...essayGraphemes(line.trim())]));
    });
  }
  essayPutRows(body,bodyRows,9);
}

// Imported CSS pages may have a light surface after a dark-theme skin was used.
// Keep the shared ink setting unless it becomes effectively invisible on the
// actual body background. This guards content, not the template's visual design.
function cssColorChannels(value){
  const v=String(value||'').trim();
  let m=v.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if(m){
    let h=m[1]; if(h.length===3||h.length===4)h=Array.from(h).map(c=>c+c).join('');
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),
      h.length===8?parseInt(h.slice(6,8),16)/255:1];
  }
  m=v.match(/^rgba?\(\s*([\d.]+)(?:,|\s)\s*([\d.]+)(?:,|\s)\s*([\d.]+)(?:\s*[,\/]\s*([\d.]+))?\s*\)$/i);
  return m?[+m[1],+m[2],+m[3],m[4]==null?1:+m[4]]:null;
}
function cssReadableInk(el, ink){
  const foreground=cssColorChannels(ink);
  if(!foreground || foreground[3]<0.99)return ink;
  let background=null;
  for(let node=el;node&&node.nodeType===1;node=node.parentElement){
    const style=window.getComputedStyle(node);
    // Photo / gradient surfaces cannot be reduced to one reliable ink contrast.
    if(style.backgroundImage && style.backgroundImage!=='none')return ink;
    const candidate=cssColorChannels(style.backgroundColor);
    if(candidate&&candidate[3]>=0.97){background=candidate;break;}
  }
  if(!background)background=[255,255,255];
  const linear=v=>{const n=Math.min(255,Math.max(0,v))/255;return n<=0.04045?n/12.92:Math.pow((n+0.055)/1.055,2.4);};
  const luminance=rgb=>0.2126*linear(rgb[0])+0.7152*linear(rgb[1])+0.0722*linear(rgb[2]);
  const fgLum=luminance(foreground),bgLum=luminance(background);
  const ratio=(Math.max(fgLum,bgLum)+0.05)/(Math.min(fgLum,bgLum)+0.05);
  if(ratio>=2.8)return ink;
  // Respect every legible chosen colour; only rescue matching foreground/surface.
  return bgLum>0.42?'#282828':'#f4f4f4';
}

const cssPaperStyles=new WeakMap();
function cssApplyPaperColor(root,p){
  // Restore template/author inline styles before undo, reset or another colour.
  // Keep this transient state outside the DOM so exported clones do not inherit it.
  const previous=cssPaperStyles.get(root);
  if(previous)for(const [el,saved] of previous){
    if(!root.contains(el))continue;
    if(saved.value)el.style.setProperty('background-color',saved.value,saved.priority);
    else el.style.removeProperty('background-color');
  }
  cssPaperStyles.delete(root);
  if(!p.cssPaperOverride)return;
  const base=window.getComputedStyle(root).backgroundColor;
  const surfaces=[root,...root.querySelectorAll('*')].filter(el=>{
    const color=window.getComputedStyle(el).backgroundColor;
    return el===root || (color!=='transparent'&&color!=='rgba(0, 0, 0, 0)'&&color===base);
  });
  const saved=new Map();
  for(const el of surfaces){
    saved.set(el,{value:el.style.getPropertyValue('background-color'),priority:el.style.getPropertyPriority('background-color')});
    el.style.setProperty('background-color',p.paperColor,'important');
  }
  cssPaperStyles.set(root,saved);
}

function cssBindSharedTypography(root,p,sharedFont,templateId){
  if(templateId==='app_postype'||templateId==='postype'){
    // Also remove the extra byline from previously imported POSTYPE templates.
    root.querySelectorAll('[data-pk="signature-extra"],.ps-signature-extra').forEach(el=>el.remove());
  }
  // User-name headings are authored text too (e.g. paper_prose_left).
  // Keep site labels untouched, while all authored headings follow typography.
  root.querySelectorAll('[data-pk="title"],[data-pk="subtitle"],[data-pk="author"],[data-pk="user"],[data-pk="note"],[data-pk="signature-extra"]').forEach(el=>{
    const ink=cssReadableInk(el,p.ink||'#2b2b2b');
    el.style.setProperty('font-family',sharedFont,'important');
    el.style.setProperty('color',ink,'important');
    el.style.setProperty('-webkit-text-fill-color',ink,'important');
  });
}

function cssFillTemplate(root, spec){
  // Hide modules the owner does not want, including older CSS files already imported.
  const templateId=String(spec?.id||'');
  // The margin-note template can contain many generated note rows.
  // Drop only generated rows before shared field binding on each redraw.
  if(templateId==='page_margin_note' && !st.inlineEditing){
    root.querySelectorAll('.pa-note[data-pa-generated="1"]').forEach(el=>el.remove());
  }
  if(templateId==='xhs_note') {
    root.querySelectorAll('.xhs-discuss').forEach(el=>el.remove());
    root.querySelectorAll('.xhs-placeholder-txt').forEach(el=>{el.textContent='点击图片占位上传配图';});
    root.querySelectorAll('.xhs-media .xhs-cover').forEach(el=>{
      // The slot itself is landscape, approximately 390 x 230 logical pixels.
      el.style.setProperty('aspect-ratio','390 / 230','important');
      el.style.setProperty('height','auto','important');
      el.style.setProperty('min-height','0','important');
      el.style.setProperty('isolation','isolate','important');
    });
    root.querySelectorAll('.xhs-media').forEach(media=>{
      media.style.setProperty('position','relative','important');
      media.style.setProperty('isolation','isolate','important');
      media.style.setProperty('overflow','visible','important');
    });
    root.querySelectorAll('.xhs-media .xhs-pagecount').forEach(el=>{
      el.style.setProperty('position','absolute','important');
      el.style.setProperty('top','10px','important');
      el.style.setProperty('right','10px','important');
      el.style.setProperty('z-index','100','important');
      el.style.setProperty('pointer-events','none','important');
    });
  }

  if(templateId==='app_postype'||templateId==='postype') root.querySelectorAll('.ps-neighbor').forEach(el=>el.remove());
  if(templateId==='ao3_work'){
    // Keep all AO3 headings and field labels; only the work's values are editable.
    // Old imported AO3 CSS still uses a generic metadata list, supported below.
    const p=cur();
    const metadata=root.querySelector('[data-pk-section="ao3-metadata"]');
    if(metadata)metadata.hidden=p.ao3ShowMetadata===false;
    const fields=[
      ['Rating','ao3Rating'],['Archive Warning','ao3Warning'],
      ['Category','ao3Category'],['Fandom','ao3Fandom'],
      ['Relationship','ao3Relationship'],['Characters','ao3Characters'],
      ['Additional Tags','ao3Tags'],['Language','ao3Language'],
      ['Collections','ao3Collections'],
    ];
    const legacyText=String(p.ao3MetaLines||'');
    const legacy=new Map();
    const unmatched=[];
    const keyForTerm=term=>{
      const t=term.trim().toLowerCase().replace(/[^a-z]/g,'');
      return fields.find(([label])=>label.toLowerCase().replace(/[^a-z]/g,'')===t)?.[1]||null;
    };
    for(const line of legacyText.split(/\r?\n/).slice(0,30)){
      const value=line.trim();if(!value)continue;
      const pos=value.search(/[:：]/);
      if(pos<=0){unmatched.push(['',value]);continue;}
      const label=value.slice(0,pos).trim();
      const body=value.slice(pos+1).trim();
      const key=keyForTerm(label);
      if(key&&!legacy.has(key))legacy.set(key,body);
      else unmatched.push([label,body]);
    }
    const list=root.querySelector('[data-pk="ao3-meta-lines"]');
    if(list)list.replaceChildren();
    const linkFields=new Set(['ao3Fandom','ao3Relationship','ao3Characters','ao3Tags','ao3Collections']);
    const insertAo3Value=(node,value,isLink)=>{
      if(!value){node.textContent='—';node.classList.add('ao3-meta-empty');return;}
      node.classList.remove('ao3-meta-empty');
      if(!isLink){node.textContent=value;return;}
      node.replaceChildren();
      value.split(/[,，]\s*/).filter(Boolean).forEach((part,i)=>{
        if(i)node.appendChild(document.createTextNode(', '));
        const link=document.createElement('span');link.className='ao3-link';link.textContent=part;node.appendChild(link);
      });
    };
    const appendRow=(parent,label,value,isLink=false)=>{
      const row=document.createElement('div');row.className='ao3-meta-row';
      if(label){const dt=document.createElement('dt');dt.textContent=label+':';row.appendChild(dt);}
      const dd=document.createElement('dd');
      insertAo3Value(dd,value,isLink);
      row.appendChild(dd);parent.appendChild(row);
      return row;
    };
    for(const [label,key] of fields){
      const value=String(p[key]||legacy.get(key)||'').trim();
      const slotName=key==='ao3Warning'?'ao3-archive-warning':key.replace(/^ao3/,'ao3-').replace(/[A-Z]/g,c=>'-'+c.toLowerCase()).replace('ao3--','ao3-');
      const target=root.querySelector('[data-pk="'+slotName+'"]')
        || (key==='ao3Warning'?root.querySelector('[data-pk="ao3-warning"]'):null);
      const slot=root.querySelector('[data-ao3-field="'+key+'"]')||target;
      if(slot){
        slot.replaceChildren();
        insertAo3Value(slot,value,linkFields.has(key));
      }else if(list) appendRow(list,label,value,linkFields.has(key));
    }
    const statSlot=root.querySelector('[data-pk="ao3-stats"]');
    const statFields=[['Published','ao3Published'],['Words','ao3Words'],['Chapters','ao3Chapters'],['Hits','ao3Hits']];
    if(statSlot){
      statSlot.replaceChildren();
      for(const [label,key] of statFields){
        const value=String(p[key]||'').trim();if(!value)continue;
        const item=document.createElement('span');item.className='ao3-stat';
        const b=document.createElement('b');b.textContent=label+': ';
        item.append(b,document.createTextNode(value));statSlot.appendChild(item);
      }
      if(!statSlot.childNodes.length){statSlot.textContent='—';statSlot.classList.add('ao3-meta-empty');}
      else statSlot.classList.remove('ao3-meta-empty');
    }else if(list){
      const statParts=statFields.map(([label,key])=>{
        const value=String(p[key]||'').trim();return value?label+': '+value:'';
      }).filter(Boolean);
      appendRow(list,'Stats',statParts.join('　'));
    }
    if(list)for(const [label,value] of unmatched)appendRow(list,label,value);
  }
  const p=cur(),n=names(),m=sharedCopy(p);
  const {title,subtitle,author,date}=m;
  // CSS templates supply geometry and hierarchy; editable content shares one
  // global font and ink colour with the native punch canvas.
  const sharedFont = fontStack(p);
  root.style.setProperty('--pk-shared-font',sharedFont);
  root.style.setProperty('--pk-shared-ink',p.ink||'#2b2b2b');
  // CSS templates can opt in to the existing paper colour; typography uses one shared ink colour.
  root.style.setProperty('--pk-shared-paper',p.paperColor||'#fbfaf6');
  cssApplyPaperColor(root,p);
  cssBindSharedTypography(root,p,sharedFont,templateId);
  const values={title,subtitle,author,note:m.note,user:n.user||'用户',channel:String(p.postypeChannel||'').trim()||author,
    date};
  Object.entries(values).forEach(([key,val])=>root.querySelectorAll(`[data-pk="${key}"]`).forEach(el=>{
    // During inline editing keep the existing essay heading cells intact.
    if(templateId==='essay_grid' && st.inlineEditing && st.inlineBody && root.contains(st.inlineBody)
      && (key==='title'||key==='subtitle'))return;
    el.textContent=val;if(key==='subtitle')el.hidden=!val;
  }));
  // Legacy CSS files may still have empty number slots: fill only if empty.
  // Numeric mock values now live in CSS template markup, not plugin settings.
  root.querySelectorAll('[data-pk="views"],[data-pk="likes"],[data-pk="comments"]').forEach(el=>{
    if(!el.textContent.trim())el.textContent='0';
  });
  // In Xiaohongshu note pages, the shared subtitle is a tag field. Convert
  // plain user-entered words into separate blue hashtags, without double '#'.
  // The text is always inserted through textContent, never as HTML.
  if(templateId==='xhs_note'){
    root.querySelectorAll('[data-pk="subtitle"]').forEach(el=>{
      const tags=String(subtitle||'')
        .replace(/＃/g,'#')
        .replace(/([^\s])#/g,'$1 #')
        .split(/[\s,，、;；|｜]+/)
        .map(v=>v.replace(/^#+/,'').trim()).filter(Boolean);
      el.replaceChildren();el.hidden=!tags.length;
      el.classList.add('pk-xhs-tags');
      el.style.setProperty('color','#326da3','important');
      const fragment=document.createDocumentFragment();
      for(const tag of tags){
        const span=document.createElement('span');span.className='pk-xhs-tag';
        span.textContent='#'+tag;
        span.style.setProperty('color','#326da3','important');
        fragment.appendChild(span);
        fragment.appendChild(document.createTextNode(' '));
      }
      el.appendChild(fragment);
    });
  }
  if(templateId==='threads_day'){
    // Threads uses short relative time for recent dated posts, not YYYY/MM/DD.
    const rawDate=String(date||'').trim();
    const dmatch=rawDate.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
    let shortDate=rawDate;
    if(dmatch){
      const now=new Date(),yr=+dmatch[1],mo=+dmatch[2],dy=+dmatch[3];
      const at=Date.UTC(yr,mo-1,dy);
      if(new Date(at).getUTCFullYear()===yr&&new Date(at).getUTCMonth()===mo-1&&new Date(at).getUTCDate()===dy){
        const diff=Math.round((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-at)/86400000);
        if(diff>=0&&diff<=30){
          shortDate=diff===0?'刚刚':diff+'天';
          if(diff===0&&dmatch[4]!=null){
            const minutes=Math.floor((now.getTime()-new Date(yr,mo-1,dy,+dmatch[4],+dmatch[5]).getTime())/60000);
            if(minutes>=0)shortDate=minutes<1?'刚刚':minutes<60?minutes+'分钟':Math.floor(minutes/60)+'小时';
          }
        }
      }
    }
    root.querySelectorAll('[data-pk="date"]').forEach(el=>{el.textContent=shortDate;});
    root.querySelectorAll('[data-pk-section="threads-comments"]').forEach(el=>{el.hidden=p.threadsShowComments===false;});
    const commentName=String(p.threadsReplyName||'').trim()||'评论者';
    const commentTime=String(p.threadsReplyTime||'').trim()||'1天';
    const commentText=String(p.threadsReplyText||'').trim()||'在「编辑信息 → 脆评论区」填写评论内容';
    for(const [slot,value] of [['threads-reply-name',commentName],['threads-reply-time',commentTime],['threads-reply-text',commentText]]){
      root.querySelectorAll('[data-pk="'+slot+'"]').forEach(el=>{if(el.textContent!==value)el.textContent=value;});
    }
    const mode=p.threadsReplyAvatarMode||'initial';
    const avatarSrc=postypeAvatarSrc({...p,postypeAvatarMode:mode,postypeAvatarImg:p.threadsReplyAvatarImg||''});
    const initial=Array.from(commentName)[0]||'?';
    root.querySelectorAll('[data-pk="threads-reply-avatar"]').forEach(el=>{
      const current=el.querySelector('img.pk-avatar-photo');
      if(!avatarSrc){if(current||el.textContent!==initial)el.textContent=initial;return;}
      if(current?.getAttribute('src')===avatarSrc)return;
      const img=document.createElement('img');
      img.className='pk-avatar-photo';img.alt=commentName;
      img.style.cssText='width:100%;height:100%;object-fit:cover;object-position:center;border-radius:inherit;display:block;transform:none;';
      if(!avatarSrc.startsWith('data:')&&!avatarSrc.startsWith('blob:'))img.crossOrigin='anonymous';
      img.onerror=()=>{if(el.contains(img))el.textContent=initial;};
      el.replaceChildren(img);img.src=avatarSrc;
    });
  }
  root.querySelectorAll('[data-pk-section="author-card"]').forEach(el=>{el.hidden=p.postypeShowAuthor===false;});
  // The first signature line is the author; lines 2-4 are optional additional
  // byline lines. All typography controls belong to the CSS page, not Canvas.
  const align=['left','center','right'].includes(p.sigAlign)?p.sigAlign:'left';
  const signatureSize=Math.min(21,Math.max(12,12+((+p.sigSize||0.56)-0.3)*12));
  root.style.setProperty('--pk-signature-align',align);
  root.style.setProperty('--pk-signature-size',signatureSize.toFixed(2)+'px');
  root.style.setProperty('--pk-signature-color',p.sigColor||'#555555');
  // Notes are the only optional extra byline; title and author have dedicated slots.
  const extra=m.note ? m.note.split('\n').filter(Boolean) : [];
  root.querySelectorAll('[data-pk="signature-extra"]').forEach(el=>{
    el.textContent='';el.hidden=!extra.length;
    extra.forEach(value=>{const line=document.createElement('div');line.textContent=value;el.appendChild(line);});
  });
  root.querySelectorAll('[data-pk-icon]').forEach(el=>{
    const svg=cssIconSvg(el.dataset.pkIcon);
    if(svg){el.textContent='';el.appendChild(svg);}
  });
  // Profile avatars are independent of page illustrations. In particular,
  // dragging the cover image sliders must not recreate the avatar IMG: iOS
  // otherwise repeatedly reloads it and temporarily shows the first initial.
  const avatarSrc=postypeAvatarSrc(p),avatarInitial=Array.from(author)[0]||'?';
  root.querySelectorAll('[data-pk="avatar"]').forEach(el=>{
    const current=Array.from(el.children).find(child=>child.tagName==='IMG' && child.classList.contains('pk-avatar-photo'));
    if(!avatarSrc){
      if(current || el.textContent!==avatarInitial)el.textContent=avatarInitial;
      delete el.dataset.pkAvatarSrc;
      return;
    }
    if(current && current.getAttribute('src')===avatarSrc){
      // Keep the same element, image resource and cropping across every redraw.
      if(current.alt!==author)current.alt=author;
      return;
    }
    const img=document.createElement('img');
    img.className='pk-avatar-photo';img.alt=author;
    img.style.cssText='width:100%!important;height:100%!important;max-width:none!important;'+
      'object-fit:cover!important;object-position:center center!important;'+
      'transform:none!important;position:static!important;border-radius:inherit;display:block;';
    if(!avatarSrc.startsWith('data:')&&!avatarSrc.startsWith('blob:'))img.crossOrigin='anonymous';
    img.onerror=()=>{
      if(el.contains(img)){el.textContent=avatarInitial;el.dataset.pkAvatarSrc='';}
    };
    // Replace only if the actual avatar source changed, never on cover movement.
    el.replaceChildren(img);
    img.src=avatarSrc;
    el.dataset.pkAvatarSrc=avatarSrc;
  });
  // Real images are optional; without an image the CSS slot is its own placeholder.
  root.querySelectorAll('[data-pk="image"]').forEach(el=>{
     // The picture is cropped inside its own CSS slot. Never resize or move
     // the whole poster: the 3 sliders adjust this image only.
     const src=String(p.skinImg||'');
     el.dataset.pkUpload='skinImg';
     el.title='点击上传 / 替换图片';
     el.style.cursor='pointer';
     el.style.position='relative';
     el.style.overflow='hidden';
     el.style.backgroundImage='none';
     let photo=Array.from(el.children).find(n=>n.classList?.contains('pk-slot-photo'));
     if(src){
       if(!photo){
         photo=document.createElement('img');
         photo.className='pk-slot-photo';
         photo.alt='';
         photo.draggable=false;
         el.appendChild(photo);
       }
       if(photo.getAttribute('src')!==src)photo.src=src;
       const scale=Math.max(0.5,Math.min(3,Number(p.skinImgScale)||1));
       const x=Math.max(0,Math.min(100,Number(p.skinImgX??50)));
       const y=Math.max(0,Math.min(100,Number(p.skinImgY??50)));
       // Keep the complete image visible at its normal size. Only explicit
       // enlargement above 1x can crop, and only inside its own image slot.
       // The two position sliders set the focal point, never move the slot.
       const zoom=scale;
       photo.style.cssText='position:absolute!important;inset:0!important;display:block!important;'+
         'width:100%!important;height:100%!important;max-width:none!important;'+
         'object-fit:contain!important;object-position:'+x+'% '+y+'%!important;'+
         'transform:scale('+zoom+')!important;transform-origin:'+x+'% '+y+'%!important;'+
         'pointer-events:none!important;z-index:0!important;';
       Array.from(el.children).forEach(n=>{if(n!==photo)n.hidden=true;});
     } else {
       if(photo)photo.remove();
       Array.from(el.children).forEach(n=>{n.hidden=false;});
     }
   });
  // Content is injected as text nodes only. No material from screenshot examples is copied.
   const raw=st.paraText.replace(/\r/g,'');
   const lines=sourceParagraphParts(raw).filter(part=>templateId!=='bubble_chat'||!part.blank);
   root.querySelectorAll('[data-pk="body"]').forEach(body=>{
     // Shared typography: one set of font/size/colour/spacing controls for Canvas and CSS.
     // Canvas works at 1080px design width; scale its text size down for a 390px webpage.
     const cssScale=390/1080;
     const fs=Math.max(12,Math.min(34,(+p.fontSize||46)*cssScale));
     body.style.setProperty('font-size',fs.toFixed(2)+'px','important');
     body.style.setProperty('line-height',String(templateId==='dictionary_entry'?Math.max(1.15,(+p.lineHeight||2)*.73):(+p.lineHeight||2)),'important');
     // paper_literary manages its paragraph alignment through template CSS.
     // Keep the body baseline on the left without forcing individual paragraphs.
     body.style.setProperty('text-align',templateId==='paper_literary'?'left':(p.textAlign||'left'),'important');
     // On white CSS pages an ink choice saved from a dark template can make
     // the actual body text invisible although the text has been injected.
     body.style.setProperty('color',cssReadableInk(body,p.ink||'#2b2b2b'),'important');
     body.style.setProperty('font-family',sharedFont,'important');
     body.style.setProperty('letter-spacing',Math.max(0,(+p.letterSpacing||0)*cssScale).toFixed(2)+'px','important');
     body.style.setProperty('--pk-body-indent',p.indent?'2em':'0');
     // Do not overwrite the live contenteditable node while an iOS keyboard is composing.
     if(st.inlineEditing && st.inlineBody===body)return;
     body.replaceChildren();
     for(const [index,part] of lines.entries()){
       const blank=part.blank;
       const para=part.text;
       const pp=document.createElement('p');
       pp.className='pk-css-paragraph'+(blank?' pk-css-blank':'');
       pp.textContent=blank?'\u00a0':para;
       // Render line-wrapped source text naturally. This overrides template
       // pre-wrap rules, which otherwise recreate the original visual bug.
       if(!blank)pp.style.setProperty('white-space','normal','important');
       pp.style.textIndent=blank?'0':(p.indent?'2em':'0');
       // Keep every source newline, but never stack browser-default <p>
       // margins with a full empty text line (the old 80px gaps).
      // Preserve the literary template's own paragraph spacing and margins.
      // Inline !important zero margins defeated its 12px paragraph rhythm.
       if(templateId!=='paper_literary')pp.style.setProperty('margin','0','important');
       pp.style.setProperty('padding','0','important');
       if(blank){
         pp.style.setProperty('height','0.35em','important');
         pp.style.setProperty('line-height','0.35','important');
       }else if(index<lines.length-1 && templateId!=='paper_literary' && templateId!=='dictionary_entry'){
         pp.style.setProperty('margin-bottom','0.18em','important');
       }
       // The body controls the default alignment. Let each template's CSS
       // override its individual paragraph alignment where needed.
       for(const key of ['font-family','font-size','letter-spacing','color']){
         pp.style.setProperty(key,'inherit','important');
       }
       if(!blank)pp.style.setProperty('line-height','inherit','important');
       body.appendChild(pp);
     }
     if(templateId==='paper_literary'){
       // First blank paragraph explicitly separates the left and right blocks.
       // Without a blank separator, the lower half (not merely the last two
       // paragraphs) is right aligned. Apply this at template scope only.
       const children=Array.from(body.children);
       const firstBlank=children.findIndex(el=>el.classList.contains('pk-css-blank'));
       const paragraphs=children.filter(el=>!el.classList.contains('pk-css-blank'));
       const split=Math.ceil(paragraphs.length/2);
       paragraphs.forEach((item,i)=>{
         const lower=firstBlank>=0 ? children.indexOf(item)>firstBlank : i>=split;
         item.classList.toggle('pl-lower',lower);
         if(lower){
           item.style.setProperty('text-align','right','important');
           item.style.setProperty('text-align-last','right','important');
         }
       });
     }
   });

  if(templateId==='essay_grid'){
    // Edits happen in a temporary plaintext surface; completed content is
    // rebuilt into cells, so editing never inserts artificial 20-cell line breaks.
    if(!(st.inlineEditing && st.inlineBody && root.contains(st.inlineBody)))
      essayRender(root,title,subtitle,raw);
  }

  if(templateId==='page_margin_note'){
    const original=root.querySelector('.pa-notes > .pa-note:not([data-pa-generated])');
    // Preserve in-place editing: don't replace contenteditable during typing.
    if(original && !(st.inlineEditing && st.inlineBody && root.contains(st.inlineBody))){
      const parent=original.parentElement;
      // A selected sentence can contain a line break before a closing quote.
      // Only meaningful text creates a note; never draw a new avatar for a lone ] / 】.
      // Keep brackets that really close the previous text, but drop duplicates.
      const textParts=marginNoteParts(raw);
      if(!textParts.length)textParts.push(' ');
      const fillNote=(note, value)=>{
        const body=note.querySelector('.pa-body');
        if(!body)return;
        const line=document.createElement('p');
        line.className='pk-css-paragraph';
        line.textContent=value;
        line.style.textIndent='0';
        body.replaceChildren(line);
        // This template intentionally uses red ink, independent of shared ink.
        body.style.setProperty('color','#aa414c','important');
        body.style.setProperty('line-height','1.65','important');
        note.querySelectorAll('.pa-author').forEach(el=>el.style.setProperty('color','#a63f4a','important'));
      };
      // Clone after the shared avatar/name binding, before changing the seed.
      // Preserve the CSS typography attached to the populated body.
      const prototype=original.cloneNode(true);
      fillNote(original,textParts[0]);
      for(const part of textParts.slice(1)){
        const note=prototype.cloneNode(true);
        note.dataset.paGenerated='1';
        // Generated notes are part of the full editable source, not disposable text.
        // Each note receives its own editor target; only the seed retains data-pk.
        note.querySelector('.pa-body')?.removeAttribute('data-pk');
        fillNote(note,part);
        parent.appendChild(note);
      }
    }
  }

  if(templateId==='imessage_dark') {
    // Model: work title = sender's initial blue messages; selected text =
    // received grey messages; optional kicker = a blue reply after the first
    // incoming line; note = the contact's saved name.
    const split=v=>sourceTextParagraphs(v).map(t=>t.trim()).filter(Boolean);
    const outgoing=root.querySelector('[data-pk="title"]');
    const incoming=root.querySelector('[data-pk="body"]');
    const contact=root.querySelector('[data-pk="note"]');
    if(contact) {
      contact.textContent=String(m.note||n.char||'联系人').trim();
      contact.style.setProperty('color','#f8f8f9','important');
      contact.style.setProperty('font-family','-apple-system,BlinkMacSystemFont,\"PingFang SC\",sans-serif','important');
    }
    const rawDate=String(date||'').trim();
    const timestamp=rawDate.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:$|\s)/);
    let clock=timestamp ? timestamp[1].padStart(2,'0')+':'+timestamp[2]
       : new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});
    let displayedDate=rawDate;
    const day=rawDate.match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})/);
    if(day){
      const now=new Date();
      const isToday=+day[1]===now.getFullYear()&&+day[2]===now.getMonth()+1&&+day[3]===now.getDate();
      displayedDate=(isToday?'今天':(+day[2])+'月'+(+day[3])+'日')+' '+clock;
    } else if(!rawDate) displayedDate='今天 '+clock;
    root.querySelectorAll('[data-pk="date"]').forEach(el=>{
      el.textContent=displayedDate;
      el.style.setProperty('color','#89898e','important');
    });
    const makeBubble=(value,side,tail=false)=>{
      const row=document.createElement('div');row.className='im-row im-'+side+(tail?' im-tail':'');
      const bubble=document.createElement('span');bubble.className='im-bubble';bubble.textContent=value;
      row.appendChild(bubble);return row;
    };
    const appendRows=(target,values,side)=>values.forEach((t,i)=>target.appendChild(makeBubble(t,side,i===values.length-1)));
    if(outgoing){
      outgoing.replaceChildren();appendRows(outgoing,split(String(title).replace(/[|｜]/g,'\n\n')),'out');
    }
    if(incoming&&!(st.inlineEditing&&st.inlineBody===incoming)){
      const left=imessageReceivedParts(st.paraText);
      incoming.replaceChildren();
      const reply=split(String(subtitle).replace(/[|｜]/g,'\n\n'));
      if(reply.length){
        if(left.length)incoming.appendChild(makeBubble(left[0],'in',true));
        const group=document.createElement('div');group.className='im-reply-group';
        appendRows(group,reply,'out');incoming.appendChild(group);
        const receipt=document.createElement('div');receipt.className='im-read';receipt.textContent=clock+' 已讀';incoming.appendChild(receipt);
        appendRows(incoming,left.slice(1),'in');
      }else{
        const receipt=document.createElement('div');receipt.className='im-read';receipt.textContent=clock+' 已讀';
        incoming.appendChild(receipt);
        appendRows(incoming,left,'in');
      }
    }
    const avatar=root.querySelector('[data-pk="im-avatar"]');
    if(avatar){
      const mode=p.imessageAvatarMode||'system';
      const imageSrc=mode==='system'?'':postypeAvatarSrc({...p,postypeAvatarMode:mode,postypeAvatarImg:p.imessageAvatarImg||''});
      const old=avatar.querySelector('img.im-avatar-photo');
      avatar.classList.toggle('im-has-img',!!imageSrc);
      if(!imageSrc){if(old)old.remove();}
      else if(old?.getAttribute('src')!==imageSrc){
        if(old)old.remove();
        const img=document.createElement('img');img.className='im-avatar-photo';img.alt='联系人头像';
        if(!/^(?:data:|blob:)/.test(imageSrc))img.crossOrigin='anonymous';
        img.onerror=()=>{img.remove();avatar.classList.remove('im-has-img');};
        avatar.appendChild(img);img.src=imageSrc;
      }
    }
    root.querySelectorAll('[data-pk-section="im-photo"]').forEach(el=>{
      el.hidden=!p.imessageShowImage;
      el.classList.toggle('im-left',p.imessageImageSide==='left');
    });
    root.querySelectorAll('[data-pk="im-image"]').forEach(el=>{
      el.dataset.pkUpload='imessageImage';
      el.title='点击上传或替换消息图片';
      const src=String(p.imessageImage||'').trim();
      const old=el.querySelector('img.im-upload-photo');
      el.classList.toggle('im-has-img',!!src);
      if(!src){if(old)old.remove();}
      else if(old?.getAttribute('src')!==src){
        if(old)old.remove();
        const img=document.createElement('img');img.className='im-upload-photo';img.alt='聊天图片';
        if(!/^(?:data:|blob:)/.test(src))img.crossOrigin='anonymous';
        img.onerror=()=>{img.remove();el.classList.remove('im-has-img');};
        el.appendChild(img);img.src=src;
      }
    });
  }
}
function cssSpecSource(spec) {
  const meta={id:spec.id,name:cssTemplateName(spec.id,spec.name),width:spec.width,html:spec.html};
  return '/* @pk-template\n'+JSON.stringify(meta,null,2)+'\n@end-pk-template */\n\n'+spec.css;
}
function cssTemplateRecord() {
  const id=String(cur().pageSkin||'').slice(4);
  const spec=cssEntries()[id] || (!store().cssHidden?.[id] ? BUILTIN_CSS[id] : null) || null;
  return spec && typeof spec.html==='string' && typeof spec.css==='string' && spec.html.includes('data-pk="body"') ? spec : null;
}
function fillCssList(){
  if(!st.ov)return;
  const dest=st.ov.querySelector('.pk-css-list');if(!dest)return;
  dest.textContent='';
  const hidden=store().cssHidden || {};
  const entries=[{id:'punch',name:'打孔海报',builtIn:true},...Object.values(BUILTIN_CSS).map(r=>({...r,builtIn:true})),...Object.values(cssEntries()).filter(r=>r && typeof r==='object' && typeof r.id==='string' && typeof r.html==='string' && !BUILTIN_CSS[r.id]).map(r=>({...r,builtIn:false}))];
  entries.forEach(rec=>{
    if(rec.id!=='punch' && hidden[rec.id] && !cssEntries()[rec.id])return;
    const line=document.createElement('div');line.className='pk-css-item';
    const item=document.createElement('button');item.type='button';item.dataset.skin=rec.id==='punch'?'punch':'css:'+rec.id;
    item.innerHTML='<span class="pk-skin-name"></span><i class="fa-solid fa-check"></i>';
    item.querySelector('.pk-skin-name').textContent=cssTemplateName(rec.id, cssEntries()[rec.id]?.name||rec.name);
    line.append(item);
    if(rec.id!=='punch'){
      const exportBtn=document.createElement('button');exportBtn.type='button';exportBtn.dataset.cssexport=rec.id;exportBtn.textContent='导出';exportBtn.title='导出 CSS';line.append(exportBtn);
      const remove=document.createElement('button');remove.type='button';remove.dataset.cssdel=rec.id;remove.textContent='删除';remove.title='从模板列表隐藏或删除';line.append(remove);
    }
    dest.appendChild(line);
  });
  syncSkinSelection();
}
// Real CSS layout width. This changes line wrapping and the exported file,
// not just a visual transform on the preview.
function cssLayoutWidth(spec=cssTemplateRecord()) {
  const override=Number(cur().cssPageWidth);
  return Math.round(Number.isFinite(override) && override>=300 ? Math.min(900,override) : (+spec?.width||390));
}
function cssMountSheet(){
  if(!st.ov)return null;
  const spec=cssTemplateRecord();if(!spec)return null;
  const holder=st.ov.querySelector('.pk-css-holder');
  if(!holder)return null;
  let shadow=holder.shadowRoot;
  if(!shadow) shadow=holder.attachShadow({mode:'open'});
  const signature=cur().pageSkin+'|'+spec.css+'|'+spec.html;
  // The overlay can be recreated while the CSS signature is unchanged.
  if(st.cssSignature!==signature || !shadow.querySelector('.pk-css-page')){
    shadow.innerHTML='';
    const sheetStyle=document.createElement('style');sheetStyle.textContent=`:host{display:block}*{box-sizing:border-box} .pk-css-page{width:${spec.width}px;min-height:0;background:#fff;color:#171717;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;font-size:16px;line-height:1.7} [hidden]{display:none!important} .pk-css-page img{max-width:100%}\n`+spec.css;
    const page=document.createElement('div');page.className='pk-css-page';page.innerHTML=cssSafeMarkup(spec.html);
    shadow.append(sheetStyle,page);st.cssSignature=signature;
  }
  const page=shadow.querySelector('.pk-css-page');
  // Explicitly override template width: CSS !important declarations must not
  // make screen preview and exported layout disagree.
  page.style.setProperty('width',cssLayoutWidth(spec)+'px','important');
  cssFillTemplate(page,spec);
  cssApplyNaturalHeight(page,spec.id);
  return {holder,shadow,page,spec};
}
// Legacy iMessage and XHS comments CSS placed minimum screen heights on
// the outer app shell and message area. Those floors create blank space in
// short exported images. Restrict the workaround to these known containers:
// never change card, avatar, image slot or arbitrary imported template sizes.
function cssApplyNaturalHeight(page, templateId){
  const targets = templateId === 'imessage_dark'
    ? [['.im-app', 480], ['.im-chat', 380]]
    : templateId === 'xhs_comments'
      ? [['.xhs-app', 600], ['.xhs-comment-main', 380]] : [];
  for (const [selector, threshold] of targets) {
    const node = page.querySelector(selector);
    if (!node) continue;
    const min = parseFloat(window.getComputedStyle(node).minHeight);
    if (Number.isFinite(min) && min >= threshold)
      node.style.setProperty('min-height', '0px', 'important');
  }
}
function cssContentHeight(page){
  cssApplyNaturalHeight(page, cssTemplateRecord()?.id);
  return Math.max(1,Math.ceil(page.scrollHeight));
}
function cssSize(){
  if(!st.ov||!cssActive())return;
  const sheet=st.ov.querySelector('.pk-css-holder');const page=sheet?.shadowRoot?.querySelector('.pk-css-page');
  const spec=cssTemplateRecord();if(!page||!spec)return;
  const stage=st.ov.querySelector('.pk-stage');
  // v30 hides the whole stage on its standalone settings screen. Its width is 0
  // during that state; measuring it produced the tiny POSTYPE preview on return.
  if (!stage || !stage.getClientRects().length || stage.clientWidth < 120) return;
  const cs=window.getComputedStyle(stage);
  const padding=(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0);
  const aw=Math.max(100,stage.clientWidth-padding);
  const width=cssLayoutWidth(spec);
  page.style.setProperty('width',width+'px','important');
  const scale=(aw/width)*(st.editing?1:st.zoom);
  const height=cssContentHeight(page);
  page.style.transformOrigin='top left';page.style.transform=`scale(${scale})`;
  sheet.style.width=(width*scale)+'px';sheet.style.height=(height*scale)+'px';
  st.W=width;st.H=height;st.tl=null;st.pieces=[];st.edgeY=null;
  if(st.editing)updateEditorBounds();
}
function renderImportedCss(){
  if(!st.ov)return;
  st.ov.classList.add('css-active');
  const r=cssMountSheet();
  if(!r){st.ov.classList.remove('css-active','pk-margin-scroll');return;}
  // Do not change the layout of other CSS templates.
  st.ov.classList.toggle('pk-margin-scroll',r.spec.id==='page_margin_note');
  cssSize();
  if(r.page.querySelector('img')){
    r.page.querySelectorAll('img').forEach(im=>{
      if(!im.complete){
        // Only one pending listener pair per image even after many renders.
        if(im.dataset.pkSizeWatch==='1')return;
        im.dataset.pkSizeWatch='1';
        const onSettle=()=>{delete im.dataset.pkSizeWatch;cssSize();};
        im.addEventListener('load',onSettle,{once:true});
        im.addEventListener('error',onSettle,{once:true});
      }
    });
  }
}
function cssUnMount(){ if(st.ov)st.ov.classList.remove('css-active','pk-margin-scroll'); }
// SVG foreignObject uses its own viewport for @media queries. Resolve those
// rules against the live preview viewport before serializing; otherwise a
// 640px export silently drops mobile text and gets cropped at the bottom.
function cssFlattenViewportMedia(styleElement){
  const rules=styleElement?.sheet?.cssRules;
  if(!rules)return styleElement?.textContent||'';
  const flatten=rules=>Array.from(rules).map(rule=>{
    if(rule.type===window.CSSRule.MEDIA_RULE){
      let matched=false;
      try{matched=window.matchMedia(rule.conditionText).matches;}catch(_){ }
      return matched?flatten(rule.cssRules):'';
    }
    if(rule.type===window.CSSRule.SUPPORTS_RULE){
      return '@supports '+rule.conditionText+'{'+flatten(rule.cssRules)+'}';
    }
    return rule.cssText;
  }).join('\n');
  return flatten(rules);
}

// Only the exported PNG is cropped. Do not alter DOM min-height, layout or
// individual template backgrounds: those can be necessary for real cards.
// Only three known app/card templates may generate a white tail *outside*
// their painted design in WebKit. Never crop generic white-layout templates
// (AO3, Twitter, Instagram, etc.) whose bottom margins are intentional.
function cssTrimExportWhiteTail(canvas, scale){
  const ctx=canvas.getContext('2d');
  if(!ctx || canvas.height<2 || canvas.width<1)return canvas;
  const width=canvas.width, height=canvas.height;
  let blankStartsAt=0, painted=false;
  // Scan fixed-size strips to avoid allocating the entire iPhone-size bitmap.
  scan:
  for(let end=height;end>0;){
    const start=Math.max(0,end-64),rows=end-start;
    let pixels;
    try{pixels=ctx.getImageData(0,start,width,rows).data;}
    catch(_){return canvas;} // Security/readback failures must not break export.
    for(let y=rows-1;y>=0;y--){
      const from=y*width*4,to=from+width*4;
      let allWhite=true;
      for(let i=from;i<to;i+=4){
        if(pixels[i]<254 || pixels[i+1]<254 || pixels[i+2]<254 || pixels[i+3]<254){
          allWhite=false;break;
        }
      }
      if(!allWhite){
        blankStartsAt=start+y+1;
        painted=true;
        break scan;
      }
    }
    end=start;
  }
  // Preserve a normal small bottom margin. Tiny white margins are not errors.
  if(!painted)return canvas;
  const padding=Math.max(2,Math.round(12*scale));
  const croppedHeight=Math.min(height,blankStartsAt+padding);
  if(height-croppedHeight<Math.max(8,Math.round(32*scale)))return canvas;
  const cropped=document.createElement('canvas');
  cropped.width=width;cropped.height=croppedHeight;
  const dest=cropped.getContext('2d');
  if(!dest)return canvas;
  dest.drawImage(canvas,0,0,width,croppedHeight,0,0,width,croppedHeight);
  return cropped;
}

// Keep avatars in the exported layout instead of painting them later at live
// preview coordinates. WebKit can reflow foreignObject text differently.
function cssExportAvatar(node, copy, image, cache){
  const key=node.currentSrc||node.getAttribute('src')||node.src;
  let url=cache.get(key);
  if(!url){
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,256/Math.max(image.naturalWidth,image.naturalHeight));
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');
    if(!context)throw new Error('头像无法转换，请重新导出');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    url=canvas.toDataURL('image/png');
    cache.set(key,url);
  }
  // A background on a non-IMG element survives Safari foreignObject rendering
  // without a broken-image icon. Copy computed styles since template selectors
  // may target IMG specifically. The element stays in the original layout slot.
  const replacement=document.createElement('span');
  replacement.className=copy.className;
  replacement.setAttribute('aria-hidden','true');
  const css=window.getComputedStyle(node);
  for(const property of Array.from(css)){
    replacement.style.setProperty(property,css.getPropertyValue(property),'important');
  }
  const fit=css.objectFit||'fill';
  replacement.style.setProperty('background-image','url("'+url+'")','important');
  replacement.style.setProperty('background-size',fit==='cover'||fit==='contain'?fit:'100% 100%','important');
  replacement.style.setProperty('background-position',css.objectPosition||'50% 50%','important');
  replacement.style.setProperty('background-repeat','no-repeat','important');
  copy.replaceWith(replacement);
}

async function cssTemplateExport(){
  // Flush the same complete source used by the preview and the inline editor.
  if(st.inlineEditing)finishInlineEdit(true);
  const mounted=cssMountSheet();
  const root=mounted?.shadow;
  const page=mounted?.page,spec=mounted?.spec;
  if(!page||!spec)throw new Error('CSS 页面尚未准备好');
  const raw=st.paraText;
  const originalSkin=cur().pageSkin;
  const originalSettings=JSON.stringify(cur());
  const ensureCurrent=()=>{
    if(!page.isConnected||st.paraText!==raw||cur().pageSkin!==originalSkin
      ||JSON.stringify(cur())!==originalSettings||st.inlineEditing)
      throw new Error('导出期间页面已修改，请重新点击导出，避免保存旧内容');
  };
  if(spec.id==='page_margin_note'){
    const expected=marginNoteParts(raw).length;
    const actual=page.querySelectorAll('.pa-notes > .pa-note').length;
    if(expected && actual!==expected)throw new Error('批注段落未完整渲染，请重新打开预览后再导出');
  }else if(spec.id==='imessage_dark'){
    const expected=imessageReceivedParts(raw).length;
    const actual=page.querySelectorAll('.im-body > .im-row.im-in').length;
    if(actual!==expected)throw new Error('iMessage 气泡未完整渲染，请重新打开预览后再导出');
  }
  const w=cssLayoutWidth(spec);
  page.style.setProperty('width',w+'px','important');
  // Image aspect ratios can change layout after loading. Wait before taking
  // the final dimensions, otherwise previews may fit but PNGs get clipped.
  await Promise.all(Array.from(page.querySelectorAll('img')).map(async im=>{
    if(!im.getAttribute('src') || im.complete)return;
    try{await im.decode();}catch{}
  }));
  // A failed iMessage upload removes its IMG and leaves the placeholder behind;
  // without this check the PNG could silently omit a specifically chosen photo.
  if(spec.id==='imessage_dark' && cur().imessageShowImage && String(cur().imessageImage||'').trim()){
    const photos=Array.from(page.querySelectorAll('[data-pk="im-image"] img.im-upload-photo'));
    if(!photos.length || !photos.some(im=>im.naturalWidth>0))
      throw new Error('iMessage 聊天图片加载失败，请重新上传图片后导出');
  }
  // The preview and PNG must use the same final geometry, after fonts/images
  // have settled. A brief timeout avoids hanging indefinitely on an offline font.
  if(document.fonts?.ready){
    try{await Promise.race([document.fonts.ready,new Promise(done=>setTimeout(done,1200))]);}catch(_){ }
  }
  ensureCurrent();
  const h=cssContentHeight(page);
  if(h>7000)throw new Error('内容超过单张图片支持的高度，请减少段落后分批导出');
  const pageBox=page.getBoundingClientRect();
  // Use rendered geometry so relative positions are identical in preview/export,
  // even when the preview is scaled to fit a phone screen.
  const sx=w/Math.max(1,pageBox.width);
  const rectOf=node=>{
    const r=node.getBoundingClientRect();
    return {x:(r.left-pageBox.left)*sx,y:(r.top-pageBox.top)*sx,w:r.width*sx,h:r.height*sx};
  };
  const pictures=[];
  const blank='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const clone=page.cloneNode(true);
  // Collect and load the *real* photos before drawing: WebKit often loses
  // nested <img> tags when serializing HTML inside SVG foreignObject.
  const realPhotos=Array.from(page.querySelectorAll('img'));
  const copyPhotos=Array.from(clone.querySelectorAll('img'));
  const missingPhotos=[];
  const avatarCache=new Map();
  const photoLoads=realPhotos.map(async(node,i)=>{
    const src=node.currentSrc||node.getAttribute('src')||node.src;
    if(!src)return;
    const visual=rectOf(node);
    if(visual.w<=0||visual.h<=0)return;
    const host=node.parentElement;
    const clipHost=host && (getComputedStyle(host).overflow==='hidden'||getComputedStyle(host).overflowX==='hidden')?host:null;
    const clipBox=clipHost?rectOf(clipHost):null;
    const radius=clipHost?getComputedStyle(clipHost).borderRadius:'0';
    const css=window.getComputedStyle(node);
    const fit=css.objectFit||'fill',position=(css.objectPosition||'50% 50%').split(/\s+/);
    const pct=v=>v?.endsWith('%')?Math.max(0,Math.min(1,parseFloat(v)/100)):0.5;
    const posX=pct(position[0]),posY=pct(position[1]||position[0]);
    let image=node;
    if(!node.complete||!node.naturalWidth){
      image=new Image();if(!src.startsWith('data:')&&!src.startsWith('blob:'))image.crossOrigin='anonymous';
      image.src=src;
      try{await image.decode();}catch{ missingPhotos.push(src); return; }
    }
    if(!image.naturalWidth||!image.naturalHeight){ missingPhotos.push(src); return; }
    if(copyPhotos[i] && node.matches('img.pk-avatar-photo, img.im-avatar-photo')){
      cssExportAvatar(node,copyPhotos[i],image,avatarCache);
      return;
    }
    pictures.push({image,visual,clipBox,radius,fit,posX,posY});
    // The opaque image is drawn separately after the HTML SVG has been rendered.
    // This also prevents huge embedded photos from exhausting WebKit memory.
    if(copyPhotos[i])copyPhotos[i].setAttribute('src',blank);
  });
  await Promise.all(photoLoads);
  if(missingPhotos.length)throw new Error('有 '+missingPhotos.length+' 张图片加载失败，已停止导出，避免生成缺图海报。请重新上传或检查图片链接');
  // Even failed remote assets must not be serialized as untrusted URLs.
  copyPhotos.forEach(img=>{
    img.setAttribute('src',blank);
    img.style.setProperty('visibility','hidden','important');
  });
  clone.style.transform='none';
  const wrapper=document.createElement('div');wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
  wrapper.style.cssText=`width:${w}px;height:${h}px;overflow:hidden;background:#fff`;
  const sty=document.createElement('style');
  sty.textContent=cssFlattenViewportMedia(root.querySelector('style'));
  wrapper.append(sty,clone);
  const serialized=new XMLSerializer().serializeToString(wrapper);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><foreignObject width="100%" height="100%">${serialized}</foreignObject></svg>`;
  const data='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const budget=/iPhone|iPad|iPod/.test(window.navigator?.userAgent||'')?4800000:9500000;
  const density=(+cur().width||1080)/390;
  const ratio=Math.min(density,Math.sqrt(budget/(w*h)));
  let failedPaints=0;
  const drawImages=(ctx)=>{
    for(const p of pictures){
      const b=p.visual,clip=p.clipBox;
      try{
        ctx.save();
        if(clip){
          const r=p.radius==='50%'?Math.min(clip.w,clip.h)/2:Math.max(0,Math.min(clip.w/2,parseFloat(p.radius)||0));
          ctx.beginPath();
          if(typeof ctx.roundRect==='function')ctx.roundRect(clip.x,clip.y,clip.w,clip.h,r);
          else ctx.rect(clip.x,clip.y,clip.w,clip.h);
          ctx.clip();
        }
        let x=b.x,y=b.y,width=b.w,height=b.h;
        const iw=p.image.naturalWidth,ih=p.image.naturalHeight;
        if(p.fit==='contain'||p.fit==='cover'){
          const k=p.fit==='contain'?Math.min(width/iw,height/ih):Math.max(width/iw,height/ih);
          const destW=iw*k,destH=ih*k;
          x+=(width-destW)*p.posX;y+=(height-destH)*p.posY;
          width=destW;height=destH;
        }
        ctx.drawImage(p.image,x,y,width,height);
      }catch(e){ failedPaints++; }
      finally{ctx.restore();}
    }
    // The page counter must stay above the image (it is part of the CSS UI).
    if(String(spec.id)==='xhs_note'){
      const badge=page.querySelector('.xhs-pagecount');
      if(badge){
        const b=rectOf(badge),css=getComputedStyle(badge);
        if(b.w>0&&b.h>0){
          ctx.save();
          ctx.fillStyle=css.backgroundColor&&css.backgroundColor!=='rgba(0, 0, 0, 0)'?css.backgroundColor:'#999aa0';
          ctx.beginPath();if(ctx.roundRect)ctx.roundRect(b.x,b.y,b.w,b.h,b.h/2);else ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();
          const fontSize=(parseFloat(css.fontSize)||14),weight=css.fontWeight||'400';
          ctx.font=weight+' '+fontSize+'px '+(css.fontFamily||'sans-serif');
          ctx.fillStyle=css.color||'#fff';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(badge.textContent.trim(),b.x+b.w/2,b.y+b.h/2);
          ctx.restore();
        }
      }
    }
  };
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const c=document.createElement('canvas');c.width=Math.round(w*ratio);c.height=Math.round(h*ratio);
        const ctx=c.getContext('2d');
        ctx.setTransform(ratio,0,0,ratio,0,0);
        ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
        ctx.drawImage(img,0,0,w,h);
        drawImages(ctx);
        if(failedPaints)throw new Error('有 '+failedPaints+' 张图片绘制失败，请重新上传后导出');
        const exported=(spec.id==='imessage_dark'||spec.id==='xhs_comments'||spec.id==='threads_profile')
          ? cssTrimExportWhiteTail(c,ratio) : c;
        const url=exported.toDataURL('image/png');
        if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(url))throw new Error('导出图片编码失败，iOS WebKit 可能限制 CSS 页面截图');
        resolve(url);
      }catch(e){reject(e);}
    };
    img.onerror=()=>reject(new Error('CSS 页面无法转换成 PNG（请检查字体和资源）'));
    img.src=data;
  });
}
function activePageTemplate() {
  const p=cur();
  return p.pageSkin||'punch';
}
function skinTabs() {
  return '<div class="pk-css-list pk-skin-list pk-skin-list-flat"></div>';
}
function syncSkinSelection() {
  if (!st.ov) return;
  const active=activePageTemplate();
  st.ov.querySelectorAll('[data-skin]').forEach(el=>el.classList.toggle('on',el.dataset.skin===active));
}
// Helpers retained for imported CSS templates.
function postypeAvatarSrc(p) {
  const mode=p.postypeAvatarMode||'char';
  if(mode==='initial') return '';
  if(mode==='custom') return typeof p.postypeAvatarImg==='string'?p.postypeAvatarImg:'';
  const c=ctx(), side=mode==='user'?'user':'char';
  const resolve=(raw)=>{
    if(typeof raw!=='string'||!raw.trim())return '';
    raw=raw.trim();
    if(/^(?:data:|blob:|https?:\/\/|\/)/i.test(raw))return raw;
    // Character and persona cards use image filenames, never use the author's
    // printed name as an image URL.
    const clean=raw.replace(/^\.?\/?(?:characters\/|User Avatars\/)/i,'');
    const dir=side==='user'?'User Avatars':'characters';
    return '/'+dir+'/'+clean.split('/').map(encodeURIComponent).join('/');
  };
  if(side==='char') {
    const chars=c.characters||[];
    const idx=c.characterId??c.characterIndex;
    const byId=chars?.[idx];
    const byName=chars.find?.(v=>v?.name && (v.name===st.speaker||v.name===c.name2));
    const actor=byId?.avatar?byId:byName;
    const raw=actor?.avatar||actor?.avatar_url||c.characterAvatar||'';
    if(raw)return resolve(raw);
  }else {
    const raw=c.userAvatar||c.user_avatar||c.personaAvatar||c.persona_avatar||'';
    if(raw)return resolve(raw);
  }
  const selectors=side==='user'
    ? ['.mes.is_user .avatar img','.mes[is_user="true"] .avatar img','#user_avatar_block img','.avatar img[src*="User%20Avatars"]','.user_avatar img','.st-user-avatar img']
    : ['.mes:not(.is_user) .avatar img','.mes[is_user="false"] .avatar img','#character_avatar img','.avatar img[src*="/characters/"]','.ch_avatar img','.st-char-avatar img','.character_select .avatar img'];
  for(const selector of selectors){
    const images=Array.from(document.querySelectorAll(selector));
    for(let i=images.length-1;i>=0;i--){
      const el=images[i], u=el?.currentSrc||el?.getAttribute('src')||el?.src;
      if(u && !/default-avatar|unknown-avatar/i.test(u))return u;
    }
  }
  return '';
}

function render(preview) {
  // A deleted template can remain in undo history or an older preset. Avoid a blank preview.
  if(cssActive() && !cssTemplateRecord()) {
    cur().pageSkin='punch'; persist(); syncSkinSelection();
    if(isOpen()) toast('warning','原 CSS 模板已不存在，已改用打孔海报');
  }
  if (cssActive()) return renderImportedCss();
  cssUnMount();
  if ((cur().pageSkin || 'punch') !== 'punch') cur().pageSkin = 'punch';
  if (!st.canvas) return;
  st.previewMode = !!preview;
  const p = cur(), cv = st.canvas, g = cv.getContext('2d');
  // Use the same logical page width for native Canvas and CSS templates.
  // 'width' controls export density; cssPageWidth controls real composition width.
  const W = Math.round((+p.width || 1080) * cssLayoutWidth() / 390), font = fontStack(p);
  // The user's selected layout is stable while holes are added or removed.
  // Long Canvas artwork is clipped by the shared preview viewport, not by
  // switching the entire composition between single and double zone.
  const single = p.layoutMode === 'single';
  const showPieces = !single || !!p.singleScraps;
  const activeEditorial = single && !!p.pubOn && (!st.editing || st.inlineEditing);
  const split = Math.min(0.85, Math.max(0.12, +p.split || 0.45));
  // Honor the divider's saved position; 0.45 preserves the old default layout.
  const baseColH = single ? 0 : Math.max(190,Math.round(W * 0.38 * split / 0.45));
  const baseTextH = Math.max(160, Math.round(p.padY * 2 + p.fontSize * 2.2));
  let colH = baseColH;
  const sigs = sigLines(p);
  let fs = +p.fontSize;
  let sigFs = Math.round(fs * p.sigSize), sigLH = sigFs * 1.6;
  const sigPad = Math.max(40, p.padX * 0.6);
  let sigArea = sigs.length ? sigs.length * sigLH + sigPad : 0;
  // The collage grows vertically when a grid would otherwise cancel the size slider.
  // Its width is fixed: a large row automatically wraps to the next line.
  if (!single && st.holes.length && (p.arrange === 'rows' || p.arrange === 'column')) {
    const [wantedW, wantedH] = holeDims(p, fs);
    const usableW = W - 2 * p.padX;
    const desired = layoutScraps(p, wantedW, wantedH, usableW);
    const reserve = p.sigPlace === 'scrap' ? Math.max(36, sigArea) : 36;
    colH = Math.max(colH, Math.min(4500, Math.ceil(desired.bh / 0.92 + reserve + 72)));
  }
  let reserveSig = (p.sigPlace === 'text' && sigs.length && (!activeEditorial || p.pubSigPosition === 'footer')) ? sigArea : 0;
  let T = layoutText(g, p, font, W, fs);
  if (activeEditorial) T = layoutEditorial(g, p, T, fs, font, sigFs, sigLH, sigs);
  // 长文不再强行挤进固定画幅：正文区随内容向下延长。
  // 对极端超长消息仍限定画布高度，避免移动端 Canvas 内存溢出。
  const maxTextH = Math.max(baseTextH, 9500 - colH);
  while (p.padY * 2 + T.h + reserveSig > maxTextH && fs > 14) {
    fs = Math.max(14, Math.floor(fs * 0.93));
    sigFs = Math.round(fs * p.sigSize);
    sigLH = sigFs * 1.6;
    sigArea = sigs.length ? sigs.length * sigLH + sigPad : 0;
    reserveSig = (p.sigPlace === 'text' && sigs.length && (!activeEditorial || p.pubSigPosition === 'footer')) ? sigArea : 0;
    T = layoutText(g, p, font, W, fs);
    if (activeEditorial) T = layoutEditorial(g, p, T, fs, font, sigFs, sigLH, sigs);
  }
  const needH = Math.ceil(p.padY * 2 + T.h + reserveSig);
  const textH = Math.max(baseTextH, Math.min(needH, maxTextH));
  const H = colH + textH;
  const top = !single && p.scrapPos === 'top';
  const textY = single ? 0 : (top ? colH : 0), colY = single ? 0 : (top ? 0 : textH);
  // iOS WebKit has a modest canvas memory budget. For very long pages,
  // reduce bitmap resolution instead of allocating enormous backing stores.
  // All layout / hit-testing remain in logical W x H coordinates.
  const isIOS = /iPad|iPhone|iPod/.test(window.navigator?.userAgent || '');
  const pixelBudget = isIOS ? 5500000 : 11000000;
  const bitmapScale = Math.min(1, Math.sqrt(pixelBudget / (W * H)));
  const bw = Math.max(1, Math.floor(W * bitmapScale));
  const bh = Math.max(1, Math.floor(H * bitmapScale));
  // Keep the existing bitmap during slider drags instead of reallocating it.
  if (cv.width !== bw) cv.width = bw;
  if (cv.height !== bh) cv.height = bh;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, bw, bh);
  g.setTransform(bw / W, 0, 0, bh / H, 0, 0);
  Object.assign(st, { W, textY, textH, edgeY: single ? null : (top ? colH : textH), H });

  // The image belongs only to the scrap area, never the full poster.
  // Keep the backing colour/texture across the poster for punched-out holes.
  g.fillStyle = p.backColor;
  g.fillRect(0, 0, W, H);
  const scrapImg = single ? null : imgOf(p.backImg);
  if (scrapImg) drawCover(g, scrapImg, 0, colY, W, colH,
    p.backImgScale, p.backImgX, p.backImgY);
  if (p.backTex && p.backTex !== 'none') {
    g.fillStyle = g.createPattern(texCanvas(p.backTex), 'repeat');
    g.fillRect(0, 0, W, H);
  }

  // Paint the paper directly. Fragments later sample the same source layer
  // with local transforms; no full-size offscreen canvases are necessary.
  const paperImg = imgOf(p.paperImg);
  const paperStyle = { scale:p.paperImgScale, x:p.paperImgX, y:p.paperImgY };
  g.save();
  g.translate(0, textY);
  fillLayer(g, 0, 0, W, textH, p.paperColor, p.paperTex, paperImg, paperStyle);
  g.restore();

  const vertical = single ? ({ top:0, middle:0.5, bottom:1 }[p.textVAlign] ?? 0.5) : 0.5;
  const ty = +p.padY + Math.max(0, textH - needH) * vertical;
  st.tl = { x: T.boxX, y: textY + ty, w: T.boxW, h: T.h, fs, lh: T.lh, font };
  if (activeEditorial) paintEditorial(g,p,T,font,ty,textY);
  const [hw, hh] = holeDims(p, fs);
  st.hole = [hw, hh];
  const holeMap = new Map(st.editing ? [] : st.holes.map((h, k) => [h.i, { br: h.br, k }]));
  const rects = [];
  T.boxes.forEach(b => {
    b.y0 = textY + ty + b.line * T.lh + (b.flowShift || 0); b.y1 = b.y0 + T.lh;
    const h = holeMap.get(b.i);
    if (!h) return;
    rects[h.k] = { x: b.ax + b.w / 2 - hw / 2, y: ty + b.line * T.lh + (b.flowShift || 0) + T.lh / 2 - hh / 2, w: hw, h: hh, k: h.k, br: h.br };
  });
  const frects = (st.editing ? [] : st.free).map(f => ({ x: f.x - hw / 2, y: f.y - hh / 2, w: hw, h: hh, k: 300 + f.id, id: f.id }));
  const all = rects.filter(Boolean).concat(frects);
  // Repaint just the holes from the backing color / texture. The backing
  // photo is intentionally limited to the scrap area, never to the holes.
  const backingPattern = p.backTex && p.backTex !== 'none' ? g.createPattern(texCanvas(p.backTex), 'repeat') : null;
  all.forEach(r => {
    const path = shapePath(p.holeShape, r.x, textY + r.y, r.w, r.h, r.k);
    g.save(); g.clip(path);
    g.fillStyle = p.holeMode === 'color' ? p.holeColor : p.backColor;
    g.fillRect(r.x, textY + r.y, r.w, r.h);
    if (p.holeMode !== 'color' && backingPattern) {
      g.fillStyle = backingPattern;
      g.fillRect(r.x, textY + r.y, r.w, r.h);
    }
    g.restore();
  });
  all.forEach(r => {
    if (p.holeShade) {
      g.save(); g.clip(shapePath(p.holeShape, r.x, textY + r.y, r.w, r.h, r.k));
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(r.x, textY + r.y, r.w, r.h * 0.1); g.fillRect(r.x, textY + r.y, r.w * 0.06, r.h);
      g.restore();
    }
    if (preview && r.br) {
      const m = fs * 0.3, bx = r.x + r.w, by = textY + r.y + r.h;
      g.fillStyle = '#d24a3a';
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx - m, by); g.lineTo(bx, by - m); g.closePath(); g.fill();
    }
  });
  g.font = `${fs}px ${font}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = p.ink;
  if (!st.editing) T.boxes.forEach(b => { if (!holeMap.has(b.i)) g.fillText(b.ch, b.ax, (b.y0 + b.y1) / 2); });
  st.boxes = T.boxes;

  const areaTop = single ? textY + 36 : colY + 36;
  const areaBot = single ? textY + textH - Math.max(40, sigArea) : colY + colH - (p.sigPlace === 'scrap' ? Math.max(36, sigArea) : 36);
  const areaH = Math.max(40, areaBot - areaTop), maxW = W - 2 * p.padX;
  let [sw, sh] = holeDims(p, fs);
  const ccx = W / 2, ccy = (areaTop + areaBot) / 2;
  const pieces = [];
  const placed = [];
  if ((st.editing && !st.inlineEditing) || !showPieces) { /* 单区默认只有孔洞，不画碎片 */ } else if (p.arrange !== 'scatter' && st.holes.length) {
    const S = layoutScraps(p, sw, sh, maxW);
    const f = Math.min(1, maxW / (S.bw || 1), areaH * 0.92 / (S.bh || 1));
    sw *= f; sh *= f;
    S.items.forEach(it => {
      const x = ccx + it.x * f, y = ccy + it.y * f;
      placed.push([x, y]);
      pieces.push({ key: 'h' + st.holes[it.k].i, k: it.k, ch: st.chars[st.holes[it.k].i], crop: rects[it.k], x, y, rot: it.rot });
    });
  }
  const loose = [];
  if ((!st.editing || st.inlineEditing) && showPieces && p.arrange === 'scatter') st.holes.forEach((h, k) => loose.push({ key: 'h' + h.i, k, ch: st.chars[h.i], crop: rects[k] }));
  if (showPieces) frects.forEach(r => loose.push({ key: 'f' + r.id, k: r.k, ch: '', crop: r }));
  for (let d = 0; showPieces && d < +p.deco; d++) {
    const k = 500 + d;
    loose.push({ key: 'd' + d, k, ch: '', crop: { x: rnd(k + st.seed, 11) * (W - hw), y: rnd(k + st.seed, 12) * Math.max(1, textH - hh), w: hw, h: hh } });
  }
  const x0 = p.padX * 0.6 + sw / 2, x1 = W - p.padX * 0.6 - sw / 2;
  const y0 = areaTop + sh / 2, y1 = Math.max(y0, areaBot - sh / 2);
  const minD = Math.max(sw, sh) * 1.2;
  loose.forEach(it => {
    const sd = keySeed(it.key) + st.seed * 131;
    let best = [x0, y0], bestD = -1;
    for (let a = 0; a < 30; a++) {
      const x = x0 + rnd(sd + a, 61) * (x1 - x0), y = y0 + rnd(sd + a, 62) * (y1 - y0);
      const d = placed.length ? Math.min(...placed.map(q => Math.hypot(q[0] - x, q[1] - y))) : Infinity;
      if (d >= minD) { best = [x, y]; break; }
      if (d > bestD) { bestD = d; best = [x, y]; }
    }
    placed.push(best);
    pieces.push(Object.assign(it, { x: best[0], y: best[1], rot: (rnd(sd, 63) - 0.5) * 2 * p.scrapTilt * 1.5 }));
  });

  const ss = Math.min(sw, sh) * 0.86;
  st.pieces = [];
  pieces.forEach(pc => {
    const o = st.off[pc.key] || { x: 0, y: 0 };
    const x = pc.x + o.x, y = pc.y + o.y, crop = pc.crop || { x: 0, y: 0, w: hw, h: hh };
    const jitter = +p.scrapVar || 0;
    const scale = Math.max(0.45, 1 + (rnd(keySeed(pc.key), 97) - 0.5) * 2 * jitter);
    const pw = sw * scale, ph = sh * scale, pss = ss * scale;
    st.pieces.push({ key: pc.key, x, y, w: pw, h: ph });
    g.save();
    g.translate(x, y); g.rotate(pc.rot);
    const path = shapePath(p.holeShape, -pw / 2, -ph / 2, pw, ph, pc.k);
    if (p.scrapShadow) {
      g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowBlur = 8; g.shadowOffsetX = 2; g.shadowOffsetY = 3;
      g.fillStyle = p.paperColor; g.fill(path);
      g.shadowColor = 'transparent';
    }
    g.clip(path);
    // Sample the original paper region directly through the clipped shape.
    // This costs no extra large canvas even when the source page is long.
    g.save();
    g.translate(-pw / 2, -ph / 2);
    g.scale(pw / crop.w, ph / crop.h);
    g.translate(-crop.x, -crop.y);
    fillLayer(g, 0, 0, W, textH, p.paperColor, p.paperTex, paperImg, paperStyle);
    g.restore();
    if (pc.ch) {
      g.font = `${pss}px ${font}`; g.fillStyle = p.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(pc.ch, (rnd(pc.k, 4) - 0.5) * 3 * scale, (rnd(pc.k, 5) - 0.5) * 3 * scale + pss * 0.03);
    }
    g.restore();
  });

  if (sigs.length && (!activeEditorial || p.pubSigPosition === 'footer')) {
    g.font = `${sigFs}px ${font}`; g.fillStyle = p.sigColor; g.textBaseline = 'middle';
    const sigEdge = Math.min(60, Math.max(22, W * 0.035));
    const sx = { left: sigEdge, center: W / 2, right: W - sigEdge }[p.sigAlign] ?? W - sigEdge;
    const base = p.sigPlace === 'text'
      ? (textY + textH - sigPad * 0.55)
      : (colY + colH - sigPad * 0.6);
    sigs.forEach((t, i) => spacedText(g, t, sx, base - (sigs.length - i - 0.5) * sigLH, sigFs * 0.12, p.sigAlign));
  }

  if (preview && !st.editing && !single) {
    const hy = st.edgeY;
    g.save();
    g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 10; g.shadowOffsetY = 2;
    g.fillStyle = 'rgba(255,255,255,.96)';
    g.fill(shapePath('round', W / 2 - 70, hy - 10, 140, 20, 0));
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)';
    [-20, 0, 20].forEach(dx => { g.beginPath(); g.arc(W / 2 + dx, hy, 3.5, 0, Math.PI * 2); g.fill(); });
  }
  if (st.editing) updateEditorBounds();
}

function insertHole(i) {
  let at = st.holes.findIndex(h => h.i > i);
  if (at < 0) at = st.holes.length;
  st.holes.splice(at, 0, { i, br: false });
}
function toggle(i) {
  if (/\s/.test(st.chars[i])) return;
  const k = st.holes.findIndex(h => h.i === i);
  if (k < 0) insertHole(i);
  else if (!st.holes[k].br) st.holes[k].br = true;
  else st.holes.splice(k, 1);
  schedule(); historyPush();
}
function randomHoles(n) {
  const taken = new Set(st.holes.map(h => h.i)), pool = [];
  st.chars.forEach((c, i) => { if (!NO_RANDOM.test(c) && !taken.has(i)) pool.push(i); });
  for (let t = 0; t < n && pool.length; t++) insertHole(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  render(true); updatePreviewZoom(); historyPush('random');
}
function matchSentence(str) {
  st.holes = []; st.off = {};
  const used = new Set(), miss = [];
  let pos = 0;
  const find = (ch, from) => { for (let j = from; j < st.chars.length; j++) if (st.chars[j] === ch && !used.has(j)) return j; return -1; };
  for (const ch of Array.from(str.replace(/\r/g, ''))) {
    if (ch === '/' || ch === '\n') { if (st.holes.length) st.holes[st.holes.length - 1].br = true; continue; }
    if (/\s/.test(ch)) continue;
    let i = find(ch, pos);
    if (i < 0) i = find(ch, 0);
    if (i < 0) { miss.push(ch); continue; }
    used.add(i); st.holes.push({ i, br: false }); pos = i + 1;
  }
  render(true); updatePreviewZoom(); historyPush('match');
  if (miss.length) toast('warning', '正文里找不到：' + miss.join(''));
}
function hitTest(e) {
  const r = st.canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * st.W / r.width;
  const y = (e.clientY - r.top) * st.H / r.height;
  return st.boxes.find(b => x >= b.ax - 2 && x <= b.ax + b.w + 2 && y >= b.y0 && y <= b.y1);
}

function loadMessage(id, selText) {
  const m = ctx().chat[id], picked = normalizeParagraphs(selText || '');
  if (!m || !picked) return false;
  st.isUser = !!m.is_user; st.speaker = m.name || '';
  st.base = picked;
  st.custom = null; st.customIsRendered=false; st.raw = '\u0000';
  buildText();
  return true;
}

function upload(file, cb, preserveAlpha = false) {
  // Preserve the existing click-to-upload behavior; report errors rather than
  // silently leaving an empty placeholder when HEIC/unsupported files fail.
  if(!file)return;
  const valid=/^image\//i.test(file.type||'') || /\.(?:png|jpe?g|gif|webp|bmp|heic|heif|avif)$/i.test(file.name||'');
  if(!valid){toast('error','请选择图片文件');return;}
  if(file.size>40*1024*1024){toast('error','图片超过 40 MB，请先压缩');return;}
  const fr=new FileReader();
  const bad=()=>toast('error','图片读取失败或格式不支持，请尝试 JPG / PNG');
  fr.onerror=bad;
  fr.onload=()=>{
    const im=new Image();
    im.onerror=bad;
    im.onload=()=>{
      try{
        if(!im.width||!im.height)throw Error('空白图片');
        const max=1600,r=Math.min(1,max/Math.max(im.width,im.height));
        const c=document.createElement('canvas');
        c.width=Math.max(1,Math.round(im.width*r));
        c.height=Math.max(1,Math.round(im.height*r));
        const g=c.getContext('2d');
        if(!g)throw Error('Canvas 不可用');
        g.drawImage(im,0,0,c.width,c.height);
        // Preserve transparency for all PNG/WebP assets, including CSS avatars
        // and page illustrations, rather than flattening them to black-backed JPEGs.
        const kind=preserveAlpha||/image\/(png|webp|gif|avif)/i.test(file.type)
          ?'image/png':'image/jpeg';
        const output=c.toDataURL(kind,.85);
        if(!/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(output))throw Error('图片转换失败');
        cb(output);
      }catch(_){bad();}
    };
    im.src=fr.result;
  };
  try{fr.readAsDataURL(file);}catch(_){bad();}
}

function download(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

const ui = {
  sl: (label, k, min, max, step) => `<div class="pk-row pk-tunable"><span class="pk-l">${label}</span><div class="pk-sl" data-sl="${k}" data-min="${min}" data-max="${max}" data-step="${step}"><div class="pk-sl-tr"><div class="pk-sl-fill"></div></div><div class="pk-sl-th"></div></div><span class="pk-v" data-v="${k}"></span><button class="pk-tune-open" type="button" data-tune="${k}" title="在预览中调整" aria-label="预览调节${label}">↗</button></div>`,
  seg: (label, k, opts) => `<div class="pk-row"><span class="pk-l">${label}</span><div class="pk-seg" data-seg="${k}">${opts.map(([v, t]) => `<b data-v="${v}">${t}</b>`).join('')}</div></div>`,
  tg: (label, k) => `<div class="pk-row pk-tgrow"><span class="pk-l">${label}</span><div class="pk-tg" data-tg="${k}"><i></i></div></div>`,
  col: (label, k) => `<label class="pk-col"><input type="color" data-col="${k}"><span data-colv="${k}"></span><em>${label}</em></label>`,
  pick: (label, k, list, cls) => `${label ? `<div class="pk-sub">${label}</div>` : ''}<div class="pk-pick ${cls || ''}" data-pick="${k}">${list.map(([v, t]) => `<b data-v="${v}"><i></i><span>${t}</span></b>`).join('')}</div>`,
  inp: (label, k, ph) => `<div class="pk-row"><span class="pk-l">${label}</span><input class="pk-in" data-k="${k}" placeholder="${ph || ''}" autocomplete="off"></div>`,
  img: (label, k) => `<div class="pk-row"><span class="pk-l">${label}</span><input class="pk-in" data-img="${k}" placeholder="图片链接" autocomplete="off"><div class="pk-btn pk-sm" data-up="${k}">上传</div><div class="pk-btn pk-sm pk-ghost" data-clr="${k}">清除</div></div>
    <div class="pk-img-adjust" data-img-adjust="${k}" hidden>
      ${ui.sl('缩放', k+'Scale', 0.5, 3, 0.05)}
      ${ui.sl('左右', k+'X', 0, 100, 1)}
      ${ui.sl('上下', k+'Y', 0, 100, 1)}
      <div class="pk-row pk-btns"><div class="pk-btn pk-ghost" data-imgreset="${k}"><i class="fa-solid fa-rotate-left"></i> 重置位置</div></div>
    </div>`,
  grp: (title, body, open) => `<div class="pk-grp${open ? ' open' : ''}"><header data-fold="1"><span>${title}</span><i class="fa-solid fa-chevron-down pk-arrow"></i></header><div class="pk-grp-b">${body}</div></div>`,
};

function shapeThumb(shape) {
  const c = document.createElement('canvas');
  c.width = c.height = 72;
  const q = c.getContext('2d');
  q.fillStyle = '#5b6168';
  q.fill(shapePath(shape, 14, 14, 44, 44, 3));
  return c.toDataURL();
}

// 编辑框直接叠在海报正文的真实坐标上，不改原消息，只改本张海报。
function updateEditorBounds() {
  if(cssActive() && st.editing && st.ov){
    const ta=st.ov.querySelector('.pk-edta');
    Object.assign(ta.style,{left:'12px',top:'12px',width:'calc(100% - 24px)',height:'calc(100% - 24px)',transform:'none',fontSize:'17px',lineHeight:'1.65',background:'#fff'});
    return;
  }
  if (!st.editing || !st.ov || !st.tl || !st.canvas) return;
  const cv = st.canvas, ta = st.ov.querySelector('.pk-edta');
  const p = cur(), tl = st.tl;
  const r = cv.getBoundingClientRect(), stage = st.ov.querySelector('.pk-stage'), sr = stage.getBoundingClientRect();
  if (!r.width || !cv.width) return;
  const k = r.width / (st.W || cv.width);
  // iPhone 小字号输入自动放大页面：内部用 >=16px，视觉上缩回海报大小。
  const ios = /iP(hone|ad|od)/.test(window.navigator.userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const zoom = ios ? 1 : Math.max(1, 16 / Math.max(1, tl.fs * k));
  const targetFont = ios ? Math.max(16, tl.fs * k) : tl.fs * k * zoom;
  const editH = Math.max(tl.lh * 2, st.textY + st.textH - p.padY * 0.55 - tl.y);
  Object.assign(ta.style, {
    left: (r.left - sr.left + stage.scrollLeft + tl.x * k) + 'px',
    top: (r.top - sr.top + stage.scrollTop + tl.y * k) + 'px',
    width: (tl.w * k * zoom) + 'px',
    height: (editH * k * zoom) + 'px',
    transformOrigin: 'top left', transform: ios ? 'none' : `scale(${1 / zoom})`,
    fontFamily: tl.font, fontSize: targetFont + 'px',
    lineHeight: (ios ? Math.max(16, tl.fs * k) * p.lineHeight : tl.lh * k * zoom) + 'px',
    letterSpacing: (p.letterSpacing * k * zoom) + 'px',
    textIndent: p.indent ? '2em' : '0', color: p.ink, textAlign: p.textAlign,
  });
}
let keyboardFrame = 0;
let keyboardRevealPending = false;
let keyboardCoolingUntil = 0;
let fieldTimer = 0;
const pendingFields = new Map();
const compositionFields = new Set();
const keyboardTarget = el => el && el.matches && el.matches('input.pk-in:not([type=file]),textarea.pk-in,.pk-edta[contenteditable],[contenteditable=true]');
function keyboardIsOpen() {
  return st.ov && st.ov.classList.contains('pk-keyboard');
}
function flushField() {
  clearTimeout(fieldTimer); fieldTimer = 0;
  const entries=Array.from(pendingFields.values());pendingFields.clear();
  for(const entry of entries){
    if (entry.type === 'replacement') {
      const r = cur().reps[entry.index];
      if (!r || r[entry.side] === entry.value) continue;
      r[entry.side] = entry.value;
      persist(); buildText(); schedule(); historyPush('rep-edit');
    } else {
      setKey(entry.key, entry.value);
    }
  }
}
function queueField(entry) {
  const key=entry.type==='replacement'?'replacement:'+entry.index+':'+entry.side:'setting:'+entry.key;
  pendingFields.set(key,entry);
  clearTimeout(fieldTimer);
  // Never repaint a long Canvas while the iOS keyboard is still composing / visible.
  if (!keyboardIsOpen()) fieldTimer = setTimeout(flushField, 360);
}
function syncKeyboardViewport(reveal = false) {
  if (!st.ov || !keyboardIsOpen()) return;
  const vv = window.visualViewport;
  const height = vv ? vv.height : window.innerHeight;
  const top = vv ? vv.offsetTop : 0;
  if (!height || height < 80) return;
  st.ov.style.setProperty('--pk-kb-height', Math.round(height) + 'px');
  st.ov.style.setProperty('--pk-kb-top', Math.round(top) + 'px');
  // Scrolling the viewport must not pull the focused input back into view.
  // Update keyboard geometry during composition, but leave the IME caret alone.
  if (!reveal || compositionFields.size) return;
  // Keep the active input inside the scrollable settings panel, without scrolling the host chat.
  const active = document.activeElement;
  if (!keyboardTarget(active) || !st.ov.contains(active)) return;
  if (active.classList.contains('pk-edta')) {
    // Align position only; never repaint Canvas or rewrite font metrics during composition.
    const cv = st.canvas, stage = st.ov.querySelector('.pk-stage'), tl = st.tl;
    if (cv && stage && tl) {
      const r = cv.getBoundingClientRect(), sr = stage.getBoundingClientRect();
      const k = r.width / (st.W || cv.width);
      const x = r.left - sr.left + stage.scrollLeft + tl.x * k;
      const y = r.top - sr.top + stage.scrollTop + tl.y * k;
      const dx = parseFloat(active.style.left), dy = parseFloat(active.style.top);
      if (!Number.isFinite(dx) || Math.abs(dx - x) > 1) active.style.left = x + 'px';
      if (!Number.isFinite(dy) || Math.abs(dy - y) > 1) active.style.top = y + 'px';
      const a = active.getBoundingClientRect();
      const b = stage.getBoundingClientRect();
      if (a.top > b.bottom - 52) stage.scrollTop += a.top - (b.top + 16);
      else if (a.top < b.top + 6) stage.scrollTop += a.top - (b.top + 12);
    }
    return;
  }
  const scroller = active.closest('.pk-panel');
  if (!scroller || !scroller.clientHeight) return;
  const a = active.getBoundingClientRect(), b = scroller.getBoundingClientRect();
  if (a.bottom > b.bottom - 12) scroller.scrollTop += a.bottom - (b.bottom - 12);
  else if (a.top < b.top + 8) scroller.scrollTop += a.top - (b.top + 8);
}
function queueKeyboardViewport(reveal = false) {
  keyboardRevealPending = keyboardRevealPending || reveal;
  if (keyboardFrame || !keyboardIsOpen()) return;
  keyboardFrame = requestAnimationFrame(() => {
    keyboardFrame = 0;
    const reveal = keyboardRevealPending;
    keyboardRevealPending = false;
    syncKeyboardViewport(reveal);
  });
}
function keyboardDismiss() {
  if (!st.ov) return;
  compositionFields.clear();
  if (st.ov.classList.contains('pk-keyboard')) keyboardCoolingUntil = Date.now() + 320;
  st.ov.classList.remove('pk-keyboard');
  keyboardRevealPending = false;
  st.ov.style.removeProperty('--pk-kb-height');
  st.ov.style.removeProperty('--pk-kb-top');
  if (keyboardFrame) { window.cancelAnimationFrame(keyboardFrame); keyboardFrame = 0; }
  if (keyboardRenderPending) {
    clearTimeout(keyboardRenderTimer);
    keyboardRenderTimer = setTimeout(() => {
      keyboardRenderTimer = 0;
      if (keyboardRenderPending && !keyboardIsOpen()) schedule(true);
    }, Math.max(20, keyboardCoolingUntil - Date.now() + 16));
  }
}
function syncVisualViewport() {
  if (!st.ov || !st.editing || keyboardIsOpen()) return;
  const vv = window.visualViewport;
  const h = vv ? vv.height : window.innerHeight;
  st.ov.style.setProperty('--pk-view-height', Math.round(h) + 'px');
  // Do not repaint a large canvas during keyboard animation.
}

// Edit in the poster itself. CSS templates edit their real text node; Canvas uses
// a precisely positioned overlay on top of the existing print, not a new view.
function inlineCssBody(){
  return st.ov?.querySelector('.pk-css-holder')?.shadowRoot?.querySelector('[data-pk="body"]')||null;
}
function inlineBodyText(body){
  // innerText preserves Safari contenteditable line breaks; textContent is a fallback.
  if(!body)return '';
  return String(body.innerText ?? body.textContent ?? '').replace(/\r/g,'').replace(/\n{3,}/g,'\n\n').replace(/\n$/,'');
}
function editableCssTargets(id,body){
  const root=body?.getRootNode();
  if(id==='page_margin_note'){
    return Array.from(root?.querySelectorAll('.pa-notes .pa-note .pa-body')||[]);
  }
  if(id==='imessage_dark'){
    let bubbles=Array.from(body?.querySelectorAll('.im-row.im-in .im-bubble')||[]);
    // An empty incoming conversation must still allow a new reply to be typed.
    if(!bubbles.length&&body){
      const row=document.createElement('div');row.className='im-row im-in im-tail';
      const bubble=document.createElement('span');bubble.className='im-bubble';
      row.appendChild(bubble);body.appendChild(row);bubbles=[bubble];
    }
    return bubbles;
  }
  return body?[body]:[];
}
function structuredCssResult(kind,targets){
  if(kind==='page_margin_note'||kind==='imessage_dark'){
    return targets.map(inlineBodyText).map(s=>s.trim()).filter(Boolean).join('\n\n');
  }
  return inlineBodyText(targets[0]);
}
function beginInlineEdit(){
  if(!st.ov||st.inlineEditing)return;
  const ov=st.ov, ta=ov.querySelector('.pk-edta');
  panel(null);ov.classList.remove('pk-categories');
  st.inlineEditing=true;st.editing=true;st.inlineOriginal=st.custom!=null?st.custom:st.base;
  st.zoom=1;ov.classList.add('pk-inline-editing');
  if(cssActive()){
    const body=inlineCssBody();
    if(!body){st.inlineEditing=false;st.editing=false;ov.classList.remove('pk-inline-editing');return;}
    const templateId=String(cur().pageSkin||'').slice(4);
    st.inlineBody=body;
    st.inlineKind=templateId;
    if(templateId==='essay_grid'){
      body.classList.add('ep-editing');
      body.textContent=st.paraText;
    }
    st.inlineBodies=editableCssTargets(templateId,body);
    if(!st.inlineBodies.length){
      st.inlineBody=null;st.inlineEditing=false;st.editing=false;
      ov.classList.remove('pk-inline-editing');return;
    }
    for(const target of st.inlineBodies){
      target.contentEditable='true';
      target.spellcheck=false;
      target.style.setProperty('-webkit-user-select','text','important');
      target.style.setProperty('user-select','text','important');
      target.style.setProperty('-webkit-touch-callout','default','important');
      target.style.setProperty('outline','1px dashed #8d98a6','important');
      target.style.setProperty('outline-offset','3px','important');
      target.style.setProperty('cursor','text','important');
      target.style.setProperty('min-height','1.4em','important');
    }
    // The first field is focused, but ALL notes / received bubbles are editable.
    st.inlineBodies[0].focus({preventScroll:true});
  }else{
    ta.innerText=st.inlineOriginal;
    // Draw once. No Canvas regeneration while typing (avoids iOS keyboard freezes).
    render(true);updatePreviewZoom(false);updateEditorBounds();
    ta.style.backgroundColor=cur().paperColor||'#fff';
    ta.focus({preventScroll:true});
  }
}
function finishInlineEdit(save){
  if(!st.ov||!st.inlineEditing)return;
  const ov=st.ov, ta=ov.querySelector('.pk-edta');
  const wasCss=cssActive();
  const targets=wasCss?(st.inlineBodies||[st.inlineBody].filter(Boolean)):[];
  let result=st.inlineOriginal;
  if(save) result=wasCss ? structuredCssResult(st.inlineKind,targets) : inlineBodyText(ta);
  // Restore every contenteditable target, not just the first paragraph.
  (wasCss?document.activeElement:ta)?.blur?.();
  for(const target of targets){
    target.removeAttribute('contenteditable');
    ['-webkit-user-select','user-select','-webkit-touch-callout','outline','outline-offset','cursor','min-height'].forEach(key=>target.style.removeProperty(key));
  }
  if(st.inlineKind==='essay_grid')st.inlineBody?.classList.remove('ep-editing');
  st.inlineBody=null;st.inlineBodies=[];st.inlineKind='';
  st.inlineEditing=false;st.editing=false;
  ov.classList.remove('pk-inline-editing');
  keyboardDismiss();
  if(save && result!==st.inlineOriginal){
    st.custom=result;st.customIsRendered=true;
    buildText();historyPush('inline-edit');
  }
  st.inlineOriginal='';
  fillEditorialImages();
  render(true);updatePreviewZoom(false);
}

function buildOverlay() {
  const ov = document.createElement('div');
  ov.id = 'pk-overlay';
  ov.innerHTML = `
  <div class="pk-modal">
    <div class="pk-head pk-edit-only">
      <div class="pk-ic" data-act="close" title="关闭"><i class="fa-solid fa-xmark"></i></div>
      <div class="pk-history">
        <button class="pk-tool" type="button" data-act="undo" aria-label="撤销" title="撤销"><i class="fa-solid fa-arrow-rotate-left"></i></button>
        <button class="pk-tool" type="button" data-act="redo" aria-label="重做" title="重做"><i class="fa-solid fa-arrow-rotate-right"></i></button>
      </div>
      <div class="pk-hr"><div class="pk-btn pk-pri" data-act="save">导出 <i class="fa-solid fa-arrow-up-right-from-square"></i></div></div>
    </div>
    <div class="pk-stage">
      <canvas></canvas><div class="pk-css-holder"></div>
      <div class="pk-edta" contenteditable="plaintext-only" spellcheck="false" role="textbox" aria-multiline="true" aria-label="在海报上直接修改正文"></div>
    </div>
    <div class="pk-preview-tools pk-edit-only">
      <div class="pk-zoom-tools">
        <button class="pk-tool" type="button" data-act="zoom-out" aria-label="缩小" title="缩小"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
        <button class="pk-tool" type="button" data-act="zoom-reset" title="按屏幕宽度显示"><span class="pk-zoom-label">适宽</span></button>
        <button class="pk-tool" type="button" data-act="zoom-in" aria-label="放大" title="放大"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
      </div>
      <div class="pk-main-tools">
        <button class="pk-tool pk-edit-tool" type="button" data-act="edit" aria-label="编辑正文" title="编辑正文"><i class="fa-solid fa-pen"></i><span>编辑文字</span></button>
        <button class="pk-tool pk-settings-tool" type="button" data-act="open-style" aria-label="更改样式" title="更改样式"><i class="fa-solid fa-palette"></i><span>更改样式</span></button>
        <button class="pk-tool pk-settings-tool" type="button" data-act="open-template" aria-label="模板" title="模板"><i class="fa-solid fa-layer-group"></i><span>模板</span></button>
      </div>
      <div class="pk-inline-actions" aria-label="正文编辑操作">
        <button class="pk-inline-cancel" type="button" data-act="ed-cancel">取消</button>
        <span>正在原位编辑正文</span>
        <button class="pk-inline-done" type="button" data-act="ed-ok">完成</button>
      </div>
      <div class="pk-cat-tools" hidden>
        <button class="pk-tool" type="button" data-act="cats-close" aria-label="返回预览"><i class="fa-solid fa-arrow-left"></i></button>
        <button class="pk-cat" type="button" data-open-tab="text">文字</button>
        <button class="pk-cat" type="button" data-open-tab="punch">样式</button>
        <button class="pk-cat" type="button" data-open-tab="paper">模板</button>
      </div>
    </div>
    <div class="pk-tune-bar pk-edit-only">
      <button class="pk-tool" type="button" data-act="tune-back" aria-label="返回设置"><i class="fa-solid fa-arrow-left"></i></button>
      <div class="pk-tune-slot"></div>
      <button class="pk-tool pk-tune-done" type="button" data-act="tune-done">完成</button>
    </div>
    <div class="pk-live-grip" aria-label="拖动调整预览和设置的高度">
      <span class="pk-grip-lines"></span>
      <button type="button" data-act="live-toggle" class="pk-live-toggle">仅设置</button>
    </div>
    <div class="pk-settings-layer pk-edit-only">
      <div class="pk-settings-head"><button type="button" class="pk-tool pk-workback" data-act="panel-close" aria-label="返回预览" title="返回预览"><i class="fa-solid fa-arrow-left"></i><span>预览</span></button><span class="pk-settings-title">设置</span><button type="button" class="pk-tool pk-kb-done" data-act="keyboard-done">完成</button></div>
      <div class="pk-tabs">
      <b data-tab="text">编辑信息</b><b data-tab="punch">样式</b><b data-tab="paper">模板</b>
      </div>
      <div class="pk-panel">
      <div class="pk-pane" data-pane="text">
        ${ui.grp('作品信息', `
          ${ui.inp('作品名', 'pubTitle', '{{user}}（默认）')}
          ${ui.inp('副标题', 'pubKicker', '可留空')}
          ${ui.inp('作者', 'pubAuthor', '{{char}}（默认）')}
          ${ui.inp('备注', 'pubNote', '题记 / 说明，可留空')}
          ${ui.inp('日期', 'pubDate', '默认今天')}
          <div data-template-fields hidden>
            <div data-template-field="channel">${ui.inp('频道', 'postypeChannel', '默认与作者相同')}</div>
            <div data-template-field="avatar">
              ${ui.seg('头像', 'postypeAvatarMode', [['char','角色'],['user','用户'],['custom','自选'],['initial','文字']])}
              <div data-postype-custom>
                ${ui.inp('头像链接', 'postypeAvatarImg', '上传或粘贴头像链接')}
                <div class="pk-row pk-btns"><div class="pk-btn" data-up="postypeAvatarImg">上传头像</div><div class="pk-btn pk-ghost" data-clr="postypeAvatarImg">清除</div></div>
              </div>
            </div>
            <div data-template-field="author-card">${ui.tg('作者卡片', 'postypeShowAuthor')}</div>
          </div>
          <div class="pk-sig-presets">
            <div class="pk-sub">作品信息预设</div>
            <div class="pk-chips pk-sigchips"></div>
            <div class="pk-row"><input class="pk-in pk-signame" placeholder="预设名" autocomplete="off"><div class="pk-btn" data-act="sig-save">保存</div></div>
          </div>`, true)}
        <div data-skin-editor>${ui.grp('页面插图', `
          <div data-nonpostype-image>${ui.img('插图', 'skinImg')}<div class="pk-note">调整仅作用于插图占位框，不影响头像。支持链接、上传或点击占位框。</div></div>`, true)}</div>
        <div data-ao3-options hidden>
          ${ui.grp('AO3 作品信息', `
            <div class="pk-ao3-hint">AO3 的栏目和排版已固定；下方只填写作品内容。标题、作者沿用上方的「作品名」「作者」。</div>
            <div class="pk-ao3-field"><label>Summary</label><textarea class="pk-in" data-k="pubKicker" placeholder="填写作品简介，支持回车分段、空行" rows="4"></textarea></div>
            <div class="pk-ao3-field"><label>Notes</label><textarea class="pk-in" data-k="pubNote" placeholder="填写作者说明，可留空" rows="3"></textarea></div>
            <div class="pk-ao3-divider"></div>
            ${ui.tg('显示 Rating／作品信息', 'ao3ShowMetadata')}
            <div data-ao3-meta-fields>
              <div class="pk-ao3-subheading">作品信息标签</div>
              <div class="pk-ao3-field"><label>Rating</label><input class="pk-in" data-k="ao3Rating" placeholder="评级（可留空）"></div>
              <div class="pk-ao3-field"><label>Archive Warning</label><input class="pk-in" data-k="ao3Warning" placeholder="内容警告"></div>
              <div class="pk-ao3-field"><label>Category</label><input class="pk-in" data-k="ao3Category" placeholder="分类"></div>
              <div class="pk-ao3-field"><label>Fandom</label><input class="pk-in" data-k="ao3Fandom" placeholder="作品所属同人圈"></div>
              <div class="pk-ao3-field"><label>Relationship</label><textarea class="pk-in" data-k="ao3Relationship" rows="2" placeholder="人物关系；多项用逗号分隔"></textarea></div>
              <div class="pk-ao3-field"><label>Characters</label><textarea class="pk-in" data-k="ao3Characters" rows="2" placeholder="人物；多项用逗号分隔"></textarea></div>
              <div class="pk-ao3-field"><label>Additional Tags</label><textarea class="pk-in" data-k="ao3Tags" rows="3" placeholder="附加标签；多项用逗号分隔"></textarea></div>
              <div class="pk-ao3-field"><label>Language</label><input class="pk-in" data-k="ao3Language" placeholder="语言"></div>
              <div class="pk-ao3-field"><label>Collections</label><input class="pk-in" data-k="ao3Collections" placeholder="合集"></div>
              <div class="pk-ao3-subheading">Stats</div>
              <div class="pk-ao3-stats-inputs">
                <div class="pk-ao3-field"><label>Published</label><input class="pk-in" data-k="ao3Published" placeholder="发布日期"></div>
                <div class="pk-ao3-field"><label>Words</label><input class="pk-in" data-k="ao3Words" placeholder="字数"></div>
                <div class="pk-ao3-field"><label>Chapters</label><input class="pk-in" data-k="ao3Chapters" placeholder="章节"></div>
                <div class="pk-ao3-field"><label>Hits</label><input class="pk-in" data-k="ao3Hits" placeholder="浏览数"></div>
              </div>
              <details class="pk-ao3-legacy"><summary>旧版自定义栏目（兼容旧模板）</summary>
                <textarea class="pk-in" data-k="ao3MetaLines" rows="3" placeholder="旧格式：栏目名: 内容"></textarea>
              </details>
            </div>
          `,true)}
        </div>
        <div data-threads-options hidden>
          ${ui.grp('脆评论区', `
            ${ui.tg('显示评论区', 'threadsShowComments')}
            <div data-threads-comment-fields>
              ${ui.seg('评论头像', 'threadsReplyAvatarMode', [['char','角色'],['user','用户'],['custom','自选'],['initial','文字']])}
              <div data-threads-reply-custom>
                ${ui.inp('头像链接', 'threadsReplyAvatarImg', '图片链接或上传')}
                <div class="pk-row pk-btns"><div class="pk-btn" data-up="threadsReplyAvatarImg">上传头像</div><div class="pk-btn pk-ghost" data-clr="threadsReplyAvatarImg">清除</div></div>
              </div>
              ${ui.inp('评论姓名', 'threadsReplyName', '自行填写')}
              ${ui.inp('评论时间', 'threadsReplyTime', '例如：2小时 / 1天')}
              <div class="pk-row" style="align-items:flex-start"><span class="pk-l" style="padding-top:10px">评论文案</span><textarea class="pk-in" data-k="threadsReplyText" placeholder="输入评论正文，支持换行" rows="4" style="height:auto;min-height:110px;line-height:1.5;padding-top:8px;padding-bottom:8px;resize:vertical"></textarea></div>
            </div>
          `, true)}
        </div>
        <div data-imessage-options hidden>
          ${ui.grp('iMessage 设置', `
            <div class="pk-note">右侧消息默认读取当前用户名 {{user}}，也可在「右侧消息」里自定义；正文是左侧灰色消息；副标题是中间的蓝色回复；备注是联系人名称（留空自动显示 {{char}}）。正文换行分成多条灰色消息，右侧消息可用「｜」分隔成多条。</div>
            ${ui.seg('联系人头像', 'imessageAvatarMode', [['system','系统'],['char','角色'],['user','用户'],['custom','自选']])}
            <div data-imessage-avatar-custom>
              ${ui.inp('头像链接', 'imessageAvatarImg', '上传或粘贴图片链接')}
              <div class="pk-row pk-btns"><div class="pk-btn" data-up="imessageAvatarImg">上传头像</div><div class="pk-btn pk-ghost" data-clr="imessageAvatarImg">清除</div></div>
            </div>
            ${ui.tg('显示图片消息', 'imessageShowImage')}
            <div data-imessage-image-fields>
              ${ui.seg('图片方向', 'imessageImageSide', [['right','我 · 蓝色侧'],['left','对方 · 灰色侧']])}
              ${ui.inp('图片链接', 'imessageImage', '上传或粘贴图片链接')}
              <div class="pk-row pk-btns"><div class="pk-btn" data-up="imessageImage">上传图片</div><div class="pk-btn pk-ghost" data-clr="imessageImage">清除</div></div>
            </div>
          `, true)}
        </div>
        <section class="pk-replacement">
          <div class="pk-replacement-head"><strong>替换</strong><button type="button" class="pk-tg" data-tg="repOn" role="switch" aria-label="启用替换"><i></i></button></div>
          <div class="pk-repbox"><div class="pk-reps"></div>
          <div class="pk-row pk-btns"><div class="pk-btn" data-act="rep-add">添加规则</div></div></div>
        </section>

      </div>

      <div class="pk-pane" data-pane="punch">
        ${ui.grp('页面设置', `
          <div class="pk-row pk-page-width"><span class="pk-l">页面宽度</span><input class="pk-in pk-width-edit" data-width-edit type="number" inputmode="numeric" min="300" max="900" step="10" aria-label="页面宽度"><span class="pk-width-unit">px</span></div>
          <div class="pk-row pk-btns pk-width-presets"><button class="pk-btn" type="button" data-widthpreset="390">390</button><button class="pk-btn" type="button" data-widthpreset="420">420</button><button class="pk-btn" type="button" data-widthpreset="440">440</button><button class="pk-btn" type="button" data-widthpreset="460">460</button></div>
          ${ui.seg('导出清晰度', 'width', [['1080', '标准'], ['1440', '高清']])}
          <div class="pk-note">宽度同步改变排版和导出；高度按内容自动延伸。</div>
        `, true)}
        ${ui.grp('字体', `
<div class="pk-font-tabs">${Object.keys(FONT_CATS).map(c => `<button type="button" data-fontcat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
<div class="pk-fonts">${Object.entries(FONTS).filter(([, f]) => !f.hidden).map(([k, f]) => `<b data-font="${k}" style="${f.fam ? `font-family:'${f.fam}'` : f.stack ? `font-family:${f.stack.replace(/"/g, "'")}` : ''}">${f.name}</b>`).join('')}</div>
          <div class="pk-note">左右滑动浏览字体，点击立即预览。</div>`, true)}
        ${ui.grp('文字排版', `
          ${pairedColorRail()}<div class="pk-cols pk-pair-custom">${ui.col('字色', 'ink')}${ui.col('纸色', 'paperColor')}</div>
          <div data-css-align-control>${ui.seg('对齐', 'textAlign', [['left', '左'], ['center', '中'], ['right', '右'], ['justify', '两端']])}</div><div class="pk-note" data-paper-align-note hidden>纸页文字排版固定上段左对齐、下段右对齐，不能用通用对齐设置修改。</div>
          ${ui.sl('字号', 'fontSize', 24, 80, 1)}
          ${ui.sl('行距', 'lineHeight', 1.2, 3.2, 0.05)}
          ${ui.sl('字距', 'letterSpacing', 0, 20, 1)}
          ${ui.sl('边距', 'padX', 20, 240, 2)}
          ${ui.tg('首行缩进', 'indent')}`, false)}
        <div data-punch-only class="pk-punch-suite">
          ${ui.grp('打孔器', `
        ${ui.grp('打孔器文案样式', `
          <div data-double-only>${ui.seg('位置', 'sigPlace', [['scrap', '碎片区'], ['text', '正文区']])}</div>
          ${ui.seg('文案对齐', 'sigAlign', [['left', '左'], ['center', '中'], ['right', '右']])}
          ${ui.sl('文案字号', 'sigSize', 0.3, 1, 0.02)}
          <div class="pk-cols">${ui.col('文案颜色', 'sigColor')}${colorRail('sigColor')}</div>`, false)}
        ${ui.grp('打孔与碎片', `
          <div class="pk-sub">选字</div>
          <div class="pk-row pk-btns">
            <div class="pk-btn" data-act="random">随机挖孔</div>
            <div class="pk-step"><b data-act="minus">−</b><span class="pk-cnt"></span><b data-act="plus">+</b></div>
            <div class="pk-btn pk-ghost" data-act="clear">清空</div>
          </div>
          <div class="pk-row"><input class="pk-in pk-sentence" placeholder="输入要挖的字句" autocomplete="off"><div class="pk-btn" data-act="match">选中</div></div>
          ${ui.pick('孔形', 'holeShape', SHAPES, 'pk-shapes')}
          ${ui.sl('大小', 'holeSize', 0.6, 2.5, 0.05)}
          ${ui.tg('孔边阴影', 'holeShade')}
          <div data-pieces-only>
            <div class="pk-sub">碎片排列</div>
            ${ui.seg('位置', 'scrapPos', [['top', '上方'], ['bottom', '下方']])}
            ${ui.seg('排列', 'arrange', [['rows', '成行'], ['stairs', '阶梯'], ['scatter', '散落'], ['column', '竖排']])}
            <div data-layout-only="rows">${ui.sl('每行', 'rowLimit', 1, 20, 1)}</div>
            <div data-layout-only="column">${ui.sl('每列', 'columnLimit', 1, 20, 1)}</div>
            ${ui.sl('大小错落', 'scrapVar', 0, 0.65, 0.01)}
            ${ui.sl('倾斜', 'scrapTilt', 0, 0.5, 0.01)}
            ${ui.sl('装饰', 'deco', 0, 20, 1)}
            ${ui.tg('投影', 'scrapShadow')}
            <div class="pk-row pk-btns"><div class="pk-btn" data-act="reseed">重新排列</div></div>
          </div>
          <div class="pk-sub">孔洞颜色</div>
          ${ui.seg('孔内', 'holeMode', [['back', '底板'], ['color', '纯色']])}
          <div class="pk-cols">${ui.col('孔色', 'holeColor')}${colorRail('holeColor')}</div>
`, true)}
        <div data-punch-only>
        ${ui.grp('纸张纹样', `
          ${ui.pick('纸张纹样', 'paperTex', TEX)}
          <div data-double-only>
            <div class="pk-cols">${ui.col('碎片区底色', 'backColor')}${colorRail('backColor')}</div>
            ${ui.pick('碎片区纹样', 'backTex', TEX)}
          </div>`, true)}
        ${ui.grp('打孔器图片', `
          ${ui.img('纸张图片', 'paperImg')}
          <div data-double-only>${ui.img('碎片区图片', 'backImg')}</div>`, true)}
        ${ui.grp('打孔配色模板', `
          <div class="pk-chips pk-tpl-grid"></div>
          <div class="pk-row"><input class="pk-in pk-tplname" placeholder="模板名" autocomplete="off"><div class="pk-btn" data-act="tpl-save">保存</div></div>
          <div class="pk-row pk-btns"><div class="pk-btn" data-act="tpl-export">导出</div><div class="pk-btn" data-act="tpl-import">导入</div><div class="pk-btn pk-ghost" data-act="reset">恢复默认</div></div>`, false)}
        </div>
          `, false)}
        </div>

      </div>

      <div class="pk-pane" data-pane="paper">
        ${ui.grp('模板', `${skinTabs()}<div class="pk-css-manager"><div class="pk-btn" data-act="css-import">导入 CSS</div><div class="pk-btn pk-ghost" data-act="css-example">示例 CSS</div></div>`, true)}
      </div>
    </div>
    </div>
  </div>
  <input type="file" class="pk-file" accept="image/*" hidden>
  <input type="file" class="pk-cssfile" accept=".css,text/css" hidden>
  <input type="file" class="pk-jsonfile" accept=".json,application/json" hidden>
  <input type="file" class="pk-fontfile" accept=".ttf,.otf,.woff,.woff2,font/*" hidden>`;
  document.body.appendChild(ov);
  st.canvas = ov.querySelector('canvas');

  const $ = s => ov.querySelector(s);
  const cv = st.canvas, fileIn = $('.pk-file'), jsonIn = $('.pk-jsonfile');
  let upKey = '';
  fontCategory(ov, '常用');
  // Load only font samples actually visible in the scrollable settings pane.
  if (window.IntersectionObserver) {
    const fontWatcher = new window.IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const f = FONTS[e.target.dataset.font];
        if (f && f.css) ensureFont(f, f.name);
        fontWatcher.unobserve(e.target);
      });
    }, { root: ov.querySelector('.pk-panel'), rootMargin: '48px' });
    ov.querySelectorAll('.pk-fonts [data-font]').forEach(b => fontWatcher.observe(b));
    ov._pkFontObserver = fontWatcher;
  }

  ['touchstart', 'touchmove', 'touchend', 'wheel'].forEach(t => ov.addEventListener(t, e => e.stopPropagation(), { passive: true }));
  const liveGrip=ov.querySelector('.pk-live-grip');
  if(liveGrip) {
    let gripDrag=null;
    liveGrip.addEventListener('pointerdown',e=>{
      if(e.target.closest('[data-act]') || !ov.classList.contains('pk-live'))return;
      e.preventDefault();e.stopPropagation();
      const modal=ov.querySelector('.pk-modal');
      const layer=ov.querySelector('.pk-settings-layer');
      if(!modal||!layer)return;
      gripDrag={id:e.pointerId,y:e.clientY,h:layer.getBoundingClientRect().height,modalH:modal.clientHeight};
      try{liveGrip.setPointerCapture(e.pointerId);}catch(_){ }
    });
    liveGrip.addEventListener('pointermove',e=>{
      if(!gripDrag || gripDrag.id!==e.pointerId)return;
      e.preventDefault();
      const newH=gripDrag.h+(gripDrag.y-e.clientY);
      const pct=Math.min(66,Math.max(26,newH/Math.max(1,gripDrag.modalH)*100));
      ov.style.setProperty('--pk-live-panel-h',pct.toFixed(1)+'%');
    });
    const end=e=>{if(gripDrag?.id===e.pointerId){gripDrag=null;requestAnimationFrame(()=>updatePreviewZoom(false));}};
    liveGrip.addEventListener('pointerup',end);
    liveGrip.addEventListener('pointercancel',end);
  }

  ov.querySelectorAll('.pk-shapes b').forEach(b => { b.querySelector('i').style.backgroundImage = `url(${shapeThumb(b.dataset.v)})`; });

  // iOS: sliders should never inherit the text-input keyboard render lock.
  // Update the visual state on each pointer move, but save history only once.
  ov.querySelectorAll('.pk-sl').forEach(el => {
    const k = el.dataset.sl, min = +el.dataset.min, max = +el.dataset.max, step = +el.dataset.step;
    let active = false, dirty = false, activeId = null;
    const set = x => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0) return;
      const t = Math.min(1, Math.max(0, (x - r.left) / r.width));
      const v = +(Math.round((min + t * (max - min) - min) / step) * step + min).toFixed(4);
      if (cur()[k] === v) return;
      cur()[k] = v;
      syncOne(k);
      schedule(true);
      dirty = true;
    };
    const end = e => {
      if (!active || (e && activeId != null && e.pointerId != null && e.pointerId !== activeId)) return;
      active = false; activeId = null;
      el.classList.remove('drag');
      if (dirty) { dirty = false; persist(); historyPush('set:' + k); }
    };
    el.addEventListener('pointerdown', e => {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      // Pointerdown preventDefault does not always blur an iOS text field.
      if (keyboardTarget(document.activeElement)) {
        flushField();
        document.activeElement.blur();
        keyboardDismiss();
      }
      active = true; activeId = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      el.classList.add('drag');
      set(e.clientX);
    });
    el.addEventListener('pointermove', e => {
      if (!active || e.pointerId !== activeId) return;
      e.preventDefault(); e.stopPropagation(); set(e.clientX);
    });
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', end);
  });

  const scale = () => (st.W || cv.width) / cv.getBoundingClientRect().width;
  const toCanvas = (cx, cy) => {
    const r = cv.getBoundingClientRect(), s = (st.W || cv.width) / r.width;
    return [(cx - r.left) * s, (cy - r.top) * s, s];
  };
  const pieceAt = (cx, cy) => {
    const [x, y] = toCanvas(cx, cy);
    for (let i = st.pieces.length - 1; i >= 0; i--) {
      const pc = st.pieces[i];
      if (Math.abs(x - pc.x) <= pc.w / 2 + 8 && Math.abs(y - pc.y) <= pc.h / 2 + 8) return pc;
    }
    return null;
  };
  const onEdge = (cx, cy) => {
    if (st.edgeY == null || cur().layoutMode === 'single') return false;
    const [, y, s] = toCanvas(cx, cy);
    return Math.abs(y - st.edgeY) <= 22 * s;
  };
  let drag = null, moved = false;
  cv.addEventListener('touchstart', e => {
    if (st.editing || st.zoom > 1) return;
    const t = e.touches[0];
    if (t && (pieceAt(t.clientX, t.clientY) || onEdge(t.clientX, t.clientY))) e.preventDefault();
  }, { passive: false });
  cv.addEventListener('pointerdown', e => {
    if (st.editing || st.zoom > 1) return;
    const pc = pieceAt(e.clientX, e.clientY);
    const edge = !pc && onEdge(e.clientX, e.clientY);
    if (!pc && !edge) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) { }
    if (pc) { const o = st.off[pc.key] || { x: 0, y: 0 }; drag = { key: pc.key, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y }; }
    else drag = { edge: true, sy: e.clientY };
    moved = false;
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    e.preventDefault();
    const dx = e.clientX - (drag.sx || 0), dy = e.clientY - drag.sy;
    if (Math.abs(dy) + (drag.edge ? 0 : Math.abs(dx)) > 3) moved = true;
    if (drag.edge) {
      const p = cur(), canvasY = toCanvas(e.clientX, e.clientY)[1];
      const wantedH = p.scrapPos === 'top' ? canvasY : st.H - canvasY;
      // Convert the dragged fragment height to the ratio used by render().
      p.split = +Math.min(0.85, Math.max(0.12, 0.45 * wantedH / Math.max(1,st.W * 0.38))).toFixed(3);
      persist(); schedule(); return;
    }
    const s = scale();
    st.off[drag.key] = { x: drag.ox + dx * s, y: drag.oy + dy * s };
    schedule();
  });
  const endDrag = () => { if (drag) { if (moved) historyPush('drag'); drag = null; setTimeout(() => { moved = false; }, 0); } };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  cv.addEventListener('click', e => {
    if (st.editing) return;
    if (moved || pieceAt(e.clientX, e.clientY) || onEdge(e.clientX, e.clientY)) return;
    const b = hitTest(e);
    if (b) { toggle(b.i); return; }
    if ((cur().pageSkin||'punch')!=='punch') return;
    const [x, y] = toCanvas(e.clientX, e.clientY);
    if (y < st.textY || y > st.textY + st.textH) return;
    const py = y - st.textY, [hw, hh] = st.hole;
    const i = st.free.findIndex(f => Math.abs(f.x - x) < hw / 2 && Math.abs(f.y - py) < hh / 2);
    if (i >= 0) st.free.splice(i, 1); else st.free.push({ id: ++st.fid, x, y: py });
    schedule(); historyPush();
  });

  // iOS IME may fire many provisional input events. Only commit after a pause or blur.
  const typedField = el => {
    if (el.dataset.k != null) return { type: 'setting', key: el.dataset.k, value: el.value };
    if (el.dataset.rf != null) return { type: 'replacement', index: +el.dataset.rf, side: 'from', value: el.value };
    if (el.dataset.rt != null) return { type: 'replacement', index: +el.dataset.rt, side: 'to', value: el.value };
    return null;
  };
  const acceptTextInput = e => {
    const el = e.target;
    if (e.isComposing || compositionFields.has(el)) return;
    const entry = typedField(el);
    if (entry) queueField(entry);
  };
  ov.addEventListener('compositionstart', e => {
    const target=e.composedPath?.().find(node=>keyboardTarget(node))||e.target;
    if (!keyboardTarget(target)) return;
    compositionFields.add(target);
    clearTimeout(fieldTimer);
  });
  ov.addEventListener('compositionend', e => {
    const target=e.composedPath?.().find(node=>keyboardTarget(node))||e.target;
    compositionFields.delete(target);
    // Safari can mark this final event as composing; its value is committed.
    const entry=typedField(target);
    if(entry)queueField(entry);
    if(!compositionFields.size && keyboardRenderPending)schedule();
  });
  ov.addEventListener('input', e=>{
    const el=e.target;
    if(el.dataset.pubedit==='width') {
      updateEditorialImage(el.dataset.pubid,'width',+el.value,true);
      const label=el.parentElement.querySelector('span');if(label) label.textContent=el.value+'%';
    }
  });
  ov.addEventListener('input', acceptTextInput);
  ov.addEventListener('change', e => {
    const el=e.target;
    if(el.hasAttribute('data-width-edit')) {
      const n = Math.round(Number(el.value));
      if(Number.isFinite(n)) setKey('cssPageWidth',Math.min(900,Math.max(300,n)));
      syncOne('cssPageWidth');
      return;
    }
    if(el.dataset.pubedit && !compositionFields.has(el)) {
      const key=el.dataset.pubedit;
      updateEditorialImage(el.dataset.pubid,key,['width','after'].includes(key)?+el.value:el.value);
    }
    if (typedField(e.target) && !compositionFields.has(e.target)) {
      const entry = typedField(e.target);
      queueField(entry);
      if(document.activeElement!==el || !keyboardIsOpen())flushField();
    }
  });
  ov.addEventListener('focusin', e => {
    const focused=e.composedPath?.().find(node=>keyboardTarget(node))||e.target;
    if (!keyboardTarget(focused) || (window.innerWidth > 520 && !/iPhone|iPad|iPod/.test(window.navigator?.userAgent||'') && !(window.navigator?.platform==='MacIntel' && window.navigator?.maxTouchPoints>1))) return;
    ov.querySelector('.pk-modal')?.style.removeProperty('height');
    ov.classList.add('pk-keyboard');
    queueKeyboardViewport(true);
  });
  ov.addEventListener('focusout', e => {
    const focused=e.composedPath?.().find(node=>keyboardTarget(node))||e.target;
    if (!keyboardTarget(focused)) return;
    if (!compositionFields.has(focused)) flushField();
    // Focus may be moving between two inputs; don't collapse modal in between.
    setTimeout(() => {
      if (st.ov !== ov) return;
      if (!keyboardTarget(document.activeElement) || !ov.contains(document.activeElement)) {
        keyboardDismiss();
        if(st.ov?.classList.contains('panel')) queueFitSettingsView();
        if (st.editing && !cssActive()) updateEditorBounds();
      }
    }, 100);
  });
  ov.querySelectorAll('[data-col]').forEach(el => el.addEventListener('input', () => setKey(el.dataset.col, el.value)));
  ov.querySelectorAll('[data-img]').forEach(el => el.addEventListener('change', () => setKey(el.dataset.img, el.value.trim())));

  $('.pk-fontfile').addEventListener('change', e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    f.arrayBuffer().then(buf => useFontBuffer(buf).then(() => idb('readwrite', s => s.put(buf, 'font')))).then(() => {
      const p = cur(); p.fontName = f.name.replace(/\.\w+$/, ''); persist();
      p.fontKey = ''; setKey('fontKey', 'upload'); toast('success', '字体已载入：' + p.fontName);
    }).catch(() => toast('error', '这个字体文件读不了'));
  });
  fileIn.addEventListener('change', () => {
    const f = fileIn.files[0]; fileIn.value = '';
    const dest=upKey;upKey='';
    if (f && dest) upload(f, url => {
      if (dest.startsWith('pub:')) { updateEditorialImage(dest.slice(4),'src',url); fillEditorialImages(); }
      else {
        if(dest==='postypeAvatarImg')cur().postypeAvatarMode='custom';
        setKey(dest,url);
        if(dest==='postypeAvatarImg'){syncOne('postypeAvatarMode');syncLayoutControls();}
      }
    }, dest.startsWith('pub:'));
  });
  // ShadowRoot events are retargeted to the host; use composedPath to locate the text glyph.
  const cssHolder=ov.querySelector('.pk-css-holder');
  cssHolder.addEventListener('click',e=>{
    if(st.editing||(ov.classList.contains('panel')&&!ov.classList.contains('pk-live')))return;
    const imageSlot=e.composedPath().find(node=>node?.dataset?.pkUpload);
    if(imageSlot){
      upKey=imageSlot.dataset.pkUpload||'skinImg';
      fileIn.click();
      return;
    }
    // Ordinary CSS page text is not punchable. Clicks are reserved for image placeholders.
  });
  const cssIn=$('.pk-cssfile');
  cssIn.addEventListener('change',()=>{
    const f=cssIn.files[0];cssIn.value='';if(!f)return;
    if(f.size>200000){toast('error','CSS 文件过大');return;}
    cssReadFile(f).then(txt=>{
      const spec=cssClean(txt);
      cssEntries()[spec.id]=spec;
      if(store().cssHidden)delete store().cssHidden[spec.id];
      persist();fillCssList();
      const templateKey='css:'+spec.id;
      if(cur().pageSkin===templateKey){
        st.cssSignature=''; // force rebuilding the ShadowRoot with new CSS/HTML
        schedule(true);
        syncSkinSelection();
      } else setKey('pageSkin',templateKey);
      panel(null);
      toast('success','已导入 CSS：'+spec.name);
    }).catch(e=>toast('error',e.message||'CSS 读取失败'));
  });
  jsonIn.addEventListener('change', () => {
    const f = jsonIn.files[0]; jsonIn.value = '';
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(fr.result);
        if(!d || typeof d!=='object' || Array.isArray(d))throw Error('格式错误');
        const name = String(d.name || f.name.replace(/\.json$/i, '')).trim().slice(0,80);
        const source=d.preset||d;
        if(!name || ['__proto__','prototype','constructor'].includes(name)||!source||typeof source!=='object'||Array.isArray(source))throw Error('格式错误');
        // Reject unrelated JSON files rather than accidentally saving them as broken presets.
        if(!Object.keys(source).some(k=>k in BASE))throw Error('不是海报预设');
        if(('reps' in source && !Array.isArray(source.reps)) || ('pubImages' in source && !Array.isArray(source.pubImages)))throw Error('预设中的列表格式错误');
        const pre=clone(source);delete pre.name;
        store().tpl[name]=pre;persist();fillTpl();toast('success','已导入：'+name);
      } catch (e) { toast('error', '模板文件格式不对'); }
    };
    fr.readAsText(f);
  });

  ov.addEventListener('click', e => {
    if (e.target === ov) { close(); return; }
    const t = e.target.closest('[data-font],[data-act],[data-up],[data-clr],[data-imgreset],[data-fold],[data-tab],[data-tg],.pk-seg b,.pk-pick b,[data-tpl],[data-tpldel],[data-sigtpl],[data-sigtpldel],[data-repdel],[data-fontcat],[data-layout-tpl],[data-zine-tpl],[data-skin],[data-cssdel],[data-cssexport],[data-skin-group],[data-pubupload],[data-pubremove],[data-tune],[data-widthpreset],[data-color-key],[data-color-pair],[data-reptoggle]');
    if (!t) return;
    const s = store(), p = cur();
    if(t.dataset.colorPair!=null){
      flushField();
      const pair=COLOR_PAIRS[Number(t.dataset.colorPair)];if(!pair)return;
      p.paperColor=pair.paper;p.ink=pair.ink;p.cssPaperOverride=true;
      persist();syncOne('paperColor');syncOne('ink');schedule();historyPush('paired-color');return;
    }
    if(t.dataset.reptoggle!=null){
      flushField();
      const rule=p.reps[Number(t.dataset.reptoggle)];if(!rule)return;
      rule.enabled=rule.enabled===false;
      persist();fillReps();buildText();schedule();historyPush('rep-toggle');return;
    }
    if(t.dataset.colorKey){setKey(t.dataset.colorKey,t.dataset.colorValue);return;}
    if(t.dataset.widthpreset) {setKey('cssPageWidth',+t.dataset.widthpreset);return;}
    if (t.dataset.tune) { startTune(t.dataset.tune); return; }
    if(t.dataset.cssexport){
      const id=t.dataset.cssexport;
      const spec=cssEntries()[id]||BUILTIN_CSS[id];
      if(!spec)return;
      const raw=cssSpecSource(spec);
      download('data:text/css;charset=utf-8,'+encodeURIComponent(raw),cssTemplateName(id,spec.name)+'.css');return;
    }
    if(t.dataset.cssdel){
      e.preventDefault();e.stopPropagation();
      const id=t.dataset.cssdel;
      if(cssEntries()[id])delete cssEntries()[id];
      if(BUILTIN_CSS[id])store().cssHidden[id]=true;
      if(cur().pageSkin==='css:'+id)cur().pageSkin='punch';
      st.cssSignature='';persist();fillCssList();syncAll();schedule(true);
      toast('success','已从模板列表移除');return;
    }
    if (t.dataset.skin) {
      flushField();
      const key=t.dataset.skin;
      if(key.startsWith('css:')&&(cssEntries()[key.slice(4)] || (!store().cssHidden[key.slice(4)] && BUILTIN_CSS[key.slice(4)]))){
        setKey('pageSkin',key);syncSkinSelection();panel(null);return;
      }
      if (key==='singlepage' || key==='punch') {
        // Both are direct, peer-level templates. Single page has no independent fragment zone.
        p.pageSkin='punch';
        p.layoutMode=key==='singlepage'?'single':'double';
        p.singleScraps=false;
        if(key==='singlepage')p.pubOn=false;
        persist();syncAll();buildText();schedule(true);historyPush('page-template');
      } else if(PAGE_SKINS[key]) {
        setKey('pageSkin',key);
      }
      syncSkinSelection();panel(null);return;
    }
    if (t.dataset.pubupload) { upKey='pub:'+t.dataset.pubupload; fileIn.click(); return; }
    if (t.dataset.pubremove) {
      p.pubImages=(p.pubImages||[]).filter(x=>String(x.id)!==t.dataset.pubremove);
      persist(); fillEditorialImages(); schedule(true); historyPush('pub-remove');return;
    }
    if (t.dataset.zineTpl) {
      const preset=ZINE_LAYOUTS[t.dataset.zineTpl];
      if(!preset || p.layoutMode!=='single') return;
      Object.assign(p,preset,{pubOn:true}); delete p.name;
      persist();syncAll();schedule(true);historyPush('zine-template');return;
    }
    if (t.dataset.fontcat) { fontCategory(ov, t.dataset.fontcat); return; }
    if (t.dataset.layoutTpl) {
      const layout = TEXT_LAYOUTS[t.dataset.layoutTpl];
      if (!layout || p.layoutMode !== 'single') return;
      for (const [k,v] of Object.entries(layout)) if (k !== 'title') p[k] = v;
      persist(); syncAll(); schedule(true); historyPush('text-layout');
      return;
    }
    if (t.dataset.font) {
      if (t.dataset.font === 'upload' && (!fontUp.ok || cur().fontKey === 'upload')) { $('.pk-fontfile').click(); return; }
      setKey('fontKey', t.dataset.font); if(!st.livePreview)panel(null); return;
    }
    if (t.dataset.fold) { t.parentElement.classList.toggle('open'); queueFitSettingsView(); return; }
    if (t.dataset.tab) { panel(t.dataset.tab); return; }
    if (t.dataset.tg) { setKey(t.dataset.tg, !p[t.dataset.tg]); return; }
    if (t.parentElement && t.parentElement.dataset.seg) { const k = t.parentElement.dataset.seg; setKey(k, k === 'width' ? +t.dataset.v : t.dataset.v); return; }
    if (t.parentElement && t.parentElement.dataset.pick) { setKey(t.parentElement.dataset.pick, t.dataset.v); return; }
    if (t.dataset.up) { upKey = t.dataset.up; fileIn.click(); return; }
    if (t.dataset.clr) { setKey(t.dataset.clr, ''); return; }
    if (t.dataset.imgreset) {
      const k = t.dataset.imgreset;
      if (!['paperImg','backImg','skinImg'].includes(k)) return;
      p[k + 'Scale'] = 1;
      p[k + 'X'] = 50;
      p[k + 'Y'] = 50;
      persist();
      ['Scale','X','Y'].forEach(s => syncOne(k + s));
      schedule(); historyPush('img-reset:' + k);
      return;
    }
    if (t.dataset.repdel != null) { flushField(); p.reps.splice(+t.dataset.repdel, 1); persist(); fillReps(); buildText(); schedule(); historyPush('rep-del'); return; }
    if (t.dataset.tpldel) { e.stopPropagation(); delete s.tpl[t.dataset.tpldel]; persist(); fillTpl(); return; }
    if (t.dataset.tpl) {
      const n = t.dataset.tpl, src = s.tpl[n] || BUILTIN[n];
      if (!src) return;
      const shared=Object.fromEntries(['pubTitle','pubKicker','pubAuthor','pubNote','pubDate'].map(k=>[k,p[k]]));
      s.cur = Object.assign(clone(BASE), clone(src), shared);
      persist(); syncAll(); buildText(); schedule(); historyPush('template');
      toast('success', '已套用：' + n); panel(null); return;
    }
    if (t.dataset.sigtpldel) { e.stopPropagation(); delete s.sigTpl[t.dataset.sigtpldel]; persist(); fillSigTpl(); return; }
    if (t.dataset.sigtpl) {
      const n = t.dataset.sigtpl, src = s.sigTpl[n];
      if (!src) return;
      if('pubTitle' in src || 'pubAuthor' in src) {
        SIG_KEYS.forEach(k => { if(k in src) p[k]=src[k]; });
      } else {
        if(src.sig1 && src.sig1 !== '{{char}}') p.pubTitle=src.sig1;
        p.pubAuthor='{{char}}';
        p.pubNote=[src.sig2==='{{user}}'?'':src.sig2,src.sig3,src.sig4].filter(Boolean).join('\n');
        for(const k of ['sigAlign','sigPlace','sigSize','sigColor']) if(k in src)p[k]=src[k];
      }
      persist(); syncAll(); buildText(); schedule(); historyPush('sig-preset');
      toast('success', '已套用署名：' + n); panel(null); return;
    }
    const act = t.dataset.act;
    if (act === 'close') { close(); return; }
    if (act === 'keyboard-done') { if (st.editing) { ov.querySelector('[data-act="ed-ok"]').click(); return; } if (keyboardTarget(document.activeElement)) document.activeElement.blur(); flushField(); keyboardDismiss(); return; }
    if (act === 'settings') { panel(st.lastTab || 'punch'); return; }
    if (act === 'open-text') { panel('text'); return; }
    if (act === 'open-style') { panel('punch'); return; }
    if (act === 'open-template') { panel('paper'); return; }
    if (act === 'live-toggle') {
      st.livePreview=!st.livePreview;
      panel(st.lastTab||'punch');
      return;
    }
    if (act === 'panel-close') { panel(null); return; }
    if (act === 'tune-back') { stopTune(true); return; }
    if (act === 'tune-done') { stopTune(false); return; }
    if (act === 'zoom-in') { changeZoom(1); return; }
    if (act === 'zoom-out') { changeZoom(-1); return; }
    if (act === 'zoom-reset') { changeZoom(0); return; }
    if (act === 'css-width-reset') { setKey('cssPageWidth',0); return; }
    if (act === 'undo') { historyTravel(-1); return; }
    if (act === 'redo') { historyTravel(1); return; }
    if (act === 'edit') { beginInlineEdit(); return; }
    if (act === 'ed-ok') { finishInlineEdit(true); return; }
    if (act === 'ed-cancel') { finishInlineEdit(false); return; }
    if (act === 'pub-add-photo') {
      if(!Array.isArray(p.pubImages)) p.pubImages=[];
      if(p.pubImages.length>=8) { toast('info','最多可插入 8 张图片');return; }
      const id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
      p.pubOn=true;
      p.pubImages.push({id,src:'',after:0,width:80,align:'center',ratio:'4:3',fit:'cover',caption:''});
      persist();syncLayoutControls();syncOne('pubOn');fillEditorialImages();historyPush('pub-add');
      upKey='pub:'+id; fileIn.click();return;
    }
    if (act === 'rep-add') { flushField(); p.reps.push({ from: '', to: '', enabled: true }); persist(); fillReps(); historyPush('rep-add'); }
    if (act === 'random') randomHoles(+p.randomCount || 1);
    if (act === 'minus' || act === 'plus') setKey('randomCount', Math.min(99, Math.max(1, (+p.randomCount || 1) + (act === 'plus' ? 1 : -1))));
    if (act === 'clear') { st.holes = []; st.free = []; st.off = {}; schedule(); historyPush('clear'); }
    if (act === 'reseed') { st.seed++; st.off = {}; schedule(); historyPush('reseed'); }
    if (act === 'match') matchSentence($('.pk-sentence').value);
    if (act === 'sig-save') {
      const n = $('.pk-signame').value.trim();
      if (!n || ['__proto__','constructor','prototype'].includes(n)) { toast('info', '请输入有效的预设名'); return; }
      s.sigTpl[n] = Object.fromEntries(SIG_KEYS.map(k => [k, p[k]]));
      persist(); fillSigTpl(); toast('success', '已保存署名：' + n); return;
    }
    if (act === 'tpl-save') {
      const n = $('.pk-tplname').value.trim();
      if (!n || ['__proto__','constructor','prototype'].includes(n)) { toast('info', '请输入有效的模板名'); return; }
      s.tpl[n] = clone(p); persist(); fillTpl(); toast('success', '已保存：' + n);
    }
    if (act === 'tpl-export') {
      const n = $('.pk-tplname').value.trim() || '打孔海报模板';
      download('data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ name: n, preset: p }, null, 2)), n + '.json');
    }
    if (act === 'tpl-import') jsonIn.click();
    if (act === 'css-import') cssIn.click();
    if (act === 'css-example') download('data:text/css;charset=utf-8,'+encodeURIComponent(CSS_STARTER),'CSS模板.css');
    if (act === 'reset') { s.cur = clone(BASE); persist(); syncAll(); buildText(); schedule(); historyPush('reset'); }
    if (act === 'save') {
      // Commit pending IME/settings input before exporting the artwork.
      flushField();
      if(st.inlineEditing) finishInlineEdit(true);
      // One-tap export. Do not enter the old '图片已生成' result screen: keep the
      // editable preview visible even after saving, including on iPhone.
      if(st.exportBusy) return;
      st.exportBusy=true;
      const button=ov.querySelector('[data-act="save"]');
      if(button)button.classList.add('pk-saving');
      const finish=url=>{
        // One export action, without an additional success toast that repeats
        // the host app's own download/export-complete notification.
        download(url,'海报_'+Date.now()+'.png');
      };
      const done=()=>{st.exportBusy=false;if(button)button.classList.remove('pk-saving');};
      if(cssActive()){
        cssTemplateExport().then(finish).catch(err=>toast('error',String(err.message||err))).finally(done);
      } else {
        try{render(false);const url=st.canvas.toDataURL('image/png');render(true);finish(url);}
        catch(err){render(true);toast('error','导出失败，请改用上传的图片素材');}
        finally{done();}
      }
      return;
    }
  });
  return ov;
}

function stopTune(returnSettings = false) {
  if (!st.ov || !st.tuning) return;
  const ov = st.ov, tune = st.tuning;
  if (tune.placeholder.parentNode) tune.placeholder.replaceWith(tune.row);
  st.tuning = null;
  ov.classList.remove('pk-tuning');
  if (returnSettings) panel(tune.tab);
  else panel(null);
}

function startTune(k) {
  const ov = st.ov;
  if (!ov || st.tuning) return;
  const sl = ov.querySelector(`[data-sl="${k}"]`);
  const row = sl?.closest('.pk-row');
  const slot = ov.querySelector('.pk-tune-slot');
  if (!row || !slot || !row.parentNode) return;
  const tab = st.lastTab || 'punch';
  const placeholder = document.createComment('pk-slider-position');
  row.parentNode.insertBefore(placeholder, row);
  slot.appendChild(row);
  st.tuning = { row, placeholder, tab };
  ov.classList.remove('panel', 'pk-categories');
  ov.querySelector('.pk-modal')?.style.removeProperty('height');
  ov.classList.add('pk-tuning');
  syncOne(k);
  updatePreviewZoom(false);
}

function fitSettingsView() {
  const ov=st.ov;
  if (!ov || !ov.classList.contains('panel') || ov.classList.contains('pk-live') || ov.classList.contains('pk-keyboard') || st.editing) return;
  const modal=ov.querySelector('.pk-modal');
  const pane=ov.querySelector('.pk-pane.on');
  if(!modal||!pane)return;
  const visible=window.visualViewport?.height||window.innerHeight;
  const upper=Math.min(visible*0.86,760);
  // Two compact headers + content. When text contains many options the
  // content area scrolls; short panels no longer reserve a full empty page.
  const needed=Math.max(250,Math.ceil(pane.scrollHeight+88));
  modal.style.setProperty('height',Math.min(upper,needed)+'px','important');
}
function queueFitSettingsView() {
  requestAnimationFrame(()=>{
    if(st.ov && st.ov.classList.contains('panel')) fitSettingsView();
  });
}

function panel(tab) {
  // Commit any iOS textarea input before leaving or switching settings tabs.
  flushField();
  const ov = st.ov;
  if (!ov) return;
  if (st.tuning) {
    const t = st.tuning;
    if (t.placeholder.parentNode) t.placeholder.replaceWith(t.row);
    st.tuning = null;
    ov.classList.remove('pk-tuning');
  }
  ov.classList.toggle('panel', !!tab);
  ov.classList.toggle('pk-live', !!tab && st.livePreview !== false);
  ov.classList.remove('pk-categories');
  const liveBtn=ov.querySelector('[data-act="live-toggle"]');
  if(liveBtn)liveBtn.textContent=st.livePreview===false?'显示预览':'仅设置';
  if(!tab) ov.querySelector('.pk-modal')?.style.removeProperty('height');
  if (tab) st.lastTab = tab;
  ov.querySelectorAll('.pk-tabs b').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  ov.querySelectorAll('.pk-pane').forEach(x => x.classList.toggle('on', x.dataset.pane === tab));
  const title = ov.querySelector('.pk-settings-title');
  if (title) title.textContent = ({text:'编辑信息',punch:'更改样式',paper:'所有模板'})[tab] || '设置';
  const btn = ov.querySelector('[data-act="settings"]');
  if (btn) btn.setAttribute('aria-expanded', tab ? 'true' : 'false');
  if(tab) {queueFitSettingsView(); if(st.livePreview!==false) requestAnimationFrame(()=>{ if(isOpen()) updatePreviewZoom(false); });}
  // Refresh after the stage becomes visible and its flex width is real again.
  if (!tab && cssActive()) {
    requestAnimationFrame(() => {
      if (st.ov === ov && isOpen() && !ov.classList.contains('panel')) {
        cssSize();
        requestAnimationFrame(() => { if(st.ov === ov && isOpen()) cssSize(); });
      }
    });
  }
}

function syncRepUI() {
  if (!st.ov) return;
  const box = st.ov.querySelector('.pk-repbox');
  if (box) box.hidden = !cur().repOn;
  st.ov.querySelector('[data-tg="repOn"]')?.setAttribute('aria-checked',String(!!cur().repOn));
}

function fillReps() {
  const n = names();
  const hint = f => (f || '').replace(/{{char}}/gi, n.char).replace(/{{user}}/gi, n.user);
  st.ov.querySelector('.pk-reps').innerHTML = (cur().reps || []).map((r, i) => `
    <div class="pk-rep">
      <button type="button" class="pk-tg ${r.enabled!==false?'on':''}" data-reptoggle="${i}" role="switch" aria-checked="${r.enabled!==false}" aria-label="运行第 ${i+1} 条替换规则"><i></i></button>
      <div class="pk-repf"><input class="pk-in" data-rf="${i}" value="${esc(r.from)}" placeholder="原词" autocomplete="off">${/{{(char|user)}}/i.test(r.from) ? `<em>${esc(hint(r.from))}</em>` : ''}</div>
      <i class="fa-solid fa-arrow-right"></i>
      <input class="pk-in" data-rt="${i}" value="${esc(r.to)}" placeholder="替换成" autocomplete="off">
      <b data-repdel="${i}"><i class="fa-solid fa-xmark"></i></b>
    </div>`).join('');
  syncRepUI();
}

function syncLayoutControls() {
  if (!st.ov) return;
  const p=cur();
  const single=p.layoutMode==='single';
  // One global editor: changing the active template never removes controls.
  // Only value-dependent suboptions (e.g. row/column, custom avatar) may toggle.
  st.ov.querySelectorAll('[data-layout-only]').forEach(el=>{el.hidden=el.dataset.layoutOnly!==p.arrange;});
  st.ov.querySelectorAll('[data-double-only]').forEach(el=>{el.hidden=single;});
  st.ov.querySelectorAll('[data-single-only]').forEach(el=>{el.hidden=!single;});
  st.ov.querySelectorAll('[data-punch-only],[data-css-width-only],[data-css-only],[data-skin-editor],[data-nonpostype-image]').forEach(el=>{el.hidden=false;});
  const id=String(p.pageSkin||'').replace(/^css:/,'');
  const literary=cssActive()&&id==='paper_literary';
  st.ov.querySelectorAll('[data-css-align-control]').forEach(el=>{el.hidden=literary;});
  st.ov.querySelectorAll('[data-paper-align-note]').forEach(el=>{el.hidden=!literary;});
  const isPostype=cssActive()&&(id==='app_postype'||id==='postype');
  const isAo3=cssActive()&&id==='ao3_work';
  const isThreads=cssActive()&&id==='threads_day';
  const isIMessage=cssActive()&&id==='imessage_dark';
  // The shared avatar controls belong to every imported template that actually
  // declares an avatar slot, not just POSTYPE / Threads.
  const templateHtml=cssActive()?String(cssTemplateRecord()?.html||''):'';
  const hasTemplateAvatar=/data-pk\s*=\s*(?:["']avatar["']|avatar(?=[\s>]))/i.test(templateHtml);
  st.ov.querySelectorAll('[data-imessage-options]').forEach(el=>{el.hidden=!isIMessage;});
  st.ov.querySelectorAll('[data-imessage-image-fields]').forEach(el=>{el.hidden=!p.imessageShowImage;});
  st.ov.querySelectorAll('[data-imessage-avatar-custom]').forEach(el=>{el.hidden=p.imessageAvatarMode!=='custom';});
  for(const [key,plain,im] of [
    ['pubTitle','作品名','右侧消息'],['pubKicker','副标题','右侧回复'],
    ['pubNote','备注','联系人备注'],['pubDate','日期','时间']]){
    const label=st.ov.querySelector('[data-k="'+key+'"]')?.closest('.pk-row')?.querySelector('.pk-l');
    if(label)label.textContent=isIMessage?im:plain;
  }
  st.ov.querySelectorAll('[data-skin-editor]').forEach(el=>{el.hidden=isIMessage;});
  st.ov.querySelectorAll('[data-template-fields]').forEach(el=>{el.hidden=!(isPostype||hasTemplateAvatar);});
  st.ov.querySelectorAll('[data-template-field]').forEach(el=>{
    el.hidden=el.dataset.templateField==='avatar' ? !hasTemplateAvatar : !isPostype;
  });
  // AO3 uses the same saved fields as the other layouts, but multiline
  // editors. Hide only the original single-line rows while AO3 is active.
  for(const key of ['pubKicker','pubNote']){
    const row=st.ov.querySelector('input[data-k="'+key+'"]')?.closest('.pk-row');
    if(row)row.hidden=isAo3;
  }
  st.ov.querySelectorAll('[data-ao3-options]').forEach(el=>{el.hidden=!isAo3;});
  st.ov.querySelectorAll('[data-ao3-meta-fields]').forEach(el=>{el.hidden=p.ao3ShowMetadata===false;});
  st.ov.querySelectorAll('[data-threads-options]').forEach(el=>{el.hidden=!isThreads;});
  st.ov.querySelectorAll('[data-threads-comment-fields]').forEach(el=>{el.hidden=p.threadsShowComments===false;});
  st.ov.querySelectorAll('[data-pieces-only]').forEach(el=>{el.hidden=single;});
  st.ov.querySelectorAll('[data-postype-custom]').forEach(el=>{el.hidden=p.postypeAvatarMode!=='custom';});
  st.ov.querySelectorAll('[data-threads-reply-custom]').forEach(el=>{el.hidden=p.threadsReplyAvatarMode!=='custom';});
  syncOne('cssPageWidth');
  syncSkinSelection();
  queueFitSettingsView();
}

function setKey(k, v) {
  const p = cur();
  if(k==='paperColor')p.cssPaperOverride=true;
  const switchHoleColor = k === 'holeColor' && p.holeMode !== 'color';
  if (switchHoleColor) { p.holeMode='color'; syncOne('holeMode'); }
  if (p[k] === v && !switchHoleColor) return;
  p[k] = v;
  persist();
  if (k === 'repOn') { buildText(); syncRepUI(); }
  if (k === 'pageSkin') buildText();
  if (k === 'arrange' || k === 'layoutMode' || k === 'singleScraps' || k === 'pubOn' || k === 'pageSkin' || k === 'skinImg' || k === 'postypeAvatarMode' || k === 'threadsReplyAvatarMode' || k === 'threadsShowComments' || k === 'ao3ShowMetadata' || k === 'imessageShowImage' || k === 'imessageAvatarMode') syncLayoutControls();
  if (k === 'paperColor' || k === 'backColor') syncTex();
  syncOne(k);
  if (k !== 'randomCount') schedule();
  historyPush('set:' + k);
}

function fmt(v, step) { const d = (String(step).split('.')[1] || '').length; return (+v).toFixed(d); }

function syncOne(k) {
  const ov = st.ov, p = cur(), v = p[k];
  if(k==='ink'||k==='paperColor')ov.querySelectorAll('[data-color-pair]').forEach(button=>{
    const pair=COLOR_PAIRS[Number(button.dataset.colorPair)];
    const selected=!!pair&&pair.ink.toLowerCase()===String(p.ink).toLowerCase()&&pair.paper.toLowerCase()===String(p.paperColor).toLowerCase();
    button.classList.toggle('on',selected);button.setAttribute('aria-pressed',String(selected));
  });
  ov.querySelectorAll(`[data-color-key="${k}"]`).forEach(b=>b.classList.toggle('on',String(b.dataset.colorValue).toLowerCase()===String(v||'').toLowerCase()));
  ov.querySelectorAll(`[data-sl="${k}"]`).forEach(el => {
    const min = +el.dataset.min, max = +el.dataset.max;
    const effective = k==='cssPageWidth' && !(+v>=300) ? cssLayoutWidth() : v;
    const t = Math.min(1, Math.max(0, (effective - min) / (max - min))) * 100;
    el.querySelector('.pk-sl-fill').style.width = t + '%';
    el.querySelector('.pk-sl-th').style.left = t + '%';
    const lab = ov.querySelector(`[data-v="${k}"]`); if (lab) lab.textContent = fmt(effective, el.dataset.step);
  });
  if(k==='cssPageWidth') {
    ov.querySelectorAll('[data-width-edit]').forEach(input=>{if(input!==document.activeElement)input.value=String(cssLayoutWidth());});
    ov.querySelectorAll('[data-widthpreset]').forEach(b=>b.classList.toggle('on',+b.dataset.widthpreset===cssLayoutWidth()));
  }
  ov.querySelectorAll(`[data-seg="${k}"] b`).forEach(b => b.classList.toggle('on', String(v) === b.dataset.v));
  ov.querySelectorAll(`[data-pick="${k}"] b`).forEach(b => b.classList.toggle('on', v === b.dataset.v));
  ov.querySelectorAll(`[data-tg="${k}"]`).forEach(el => el.classList.toggle('on', !!v));
  ov.querySelectorAll(`[data-k="${k}"]`).forEach(el => { if (el !== document.activeElement) el.value = v; });
  ov.querySelectorAll(`[data-col="${k}"]`).forEach(el => { el.value = v; });
  ov.querySelectorAll(`[data-colv="${k}"]`).forEach(el => { el.style.background = v; });
  ov.querySelectorAll(`[data-img="${k}"]`).forEach(el => {
    const s = typeof v==='string'?v:'';
    if (el !== document.activeElement) el.value = s.startsWith('data:') ? '' : s;
    el.placeholder = s.startsWith('data:') ? '已上传图片' : '图片链接';
  });
  if (k === 'paperImg' || k === 'backImg' || k === 'skinImg') {
    const box = ov.querySelector(`[data-img-adjust="${k}"]`);
    if (box) box.hidden = !v;
  }
  if (['textBoxWidth','textBoxX','textVAlign','fontSize','padX','padY','lineHeight','letterSpacing','textAlign','indent'].includes(k)) {
    ov.querySelectorAll('[data-layout-tpl]').forEach(b => {
      const spec = TEXT_LAYOUTS[b.dataset.layoutTpl];
      b.classList.toggle('on', Object.entries(spec).every(([key,value]) => key === 'title' || p[key] === value));
    });
  }
  if (k === 'randomCount') ov.querySelector('.pk-cnt').textContent = v;
  if (k === 'fontKey') {
    ov.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('on', b.dataset.font === v));
    const up = ov.querySelector('[data-font="upload"]');
    if (up) up.textContent = p.fontName && fontUp.ok ? p.fontName : '上传字体';
    // Do not preload every webfont when opening the panel on iOS.
    // The selected font is loaded by fontStack() during render.
  }
}

function syncTex() {
  const p = cur();
  [['paperTex', p.paperColor], ['backTex', p.backColor]].forEach(([k, c]) => {
    st.ov.querySelectorAll(`[data-pick="${k}"] b`).forEach(b => { b.querySelector('i').style.backgroundImage = `url(${texSwatch(b.dataset.v, c)})`; });
  });
}

function syncAll() {
  Object.keys(BASE).forEach(k => { if (k !== 'reps') syncOne(k); });
  syncTex();
  fillReps();
  fillEditorialImages();
  syncLayoutControls();
  if (st.ov) st.ov.querySelectorAll('[data-zine-tpl]').forEach(b => {
    const spec=ZINE_LAYOUTS[b.dataset.zineTpl];
    b.classList.toggle('on',!!cur().pubOn && Object.entries(spec).every(([k,v])=>k==='name'||cur()[k]===v));
  });
  if (st.ov) st.ov.querySelectorAll('[data-layout-tpl]').forEach(b => {
    const preset = TEXT_LAYOUTS[b.dataset.layoutTpl];
    b.classList.toggle('on', Object.entries(preset).every(([k,v]) => k === 'title' || cur()[k] === v));
  });
}

function fillMes() {
  st.editing = false;
  
  syncAll();
}

function fillTpl() {
  const saved=store();
  const card=(name,user)=>{
    const spec=(user?saved.tpl[name]:BUILTIN[name])||{};
    const p=Object.assign({},BASE,spec);
    const paper=esc(p.paperColor||'#fbfaf6'), back=esc(p.backColor||'#bdb9b1');
    return `<div class="pk-chip pk-tpl-card" data-tpl="${esc(name)}" role="button" tabindex="0" title="${esc(name)}" aria-label="套用配色：${esc(name)}"><span class="pk-palette-circle" style="--pk-half-one:${paper};--pk-half-two:${back}"></span>${user?`<span class="pk-tpl-del" data-tpldel="${esc(name)}" title="删除：${esc(name)}" aria-label="删除：${esc(name)}">×</span>`:''}</div>`;
  };
  st.ov.querySelector('.pk-tpl-grid').innerHTML=Object.keys(BUILTIN).map(n=>card(n,false)).join('')+Object.keys(saved.tpl).map(n=>card(n,true)).join('');
}

function fillEditorialImages() {
  if (!st.ov) return;
  const list = st.ov.querySelector('.pk-photo-list');
  if (!list) return;
  const imgs = Array.isArray(cur().pubImages) ? cur().pubImages : [];
  const paraCount = Math.max(1, st.chars.filter(c=>c==='\n').length+1);
  const options = Array.from({length: Math.min(paraCount,50)+1},(_,i)=>`<option value="${i}">${i===0?'正文前':`第 ${i} 段后`}</option>`).join('');
  list.innerHTML=imgs.map((it,i)=>{
    const id=esc(it.id);
    const photoSrc=typeof it.src==='string'?it.src:'';
    const opt=(name, choices)=>`<label>${name}<select data-pubedit="${choices[0]}" data-pubid="${id}">${choices.slice(1).map(([v,label])=>`<option value="${v}" ${it[choices[0]]===v?'selected':''}>${label}</option>`).join('')}</select></label>`;
    return `<div class="pk-photo-slot" data-photo-id="${id}">
      <div class="pk-photo-slot-top"><strong>插图 ${i+1}</strong><button type="button" class="pk-btn pk-sm" data-pubupload="${id}">上传</button><button type="button" class="pk-btn pk-sm pk-ghost" data-pubremove="${id}">删除</button></div>
      <input class="pk-in" type="url" data-pubedit="src" data-pubid="${id}" autocomplete="off" placeholder="${photoSrc.startsWith('data:')?'已上传图片':'图片链接'}" value="${photoSrc.startsWith('data:')?'':esc(photoSrc)}">
      <div class="pk-photo-meta"><label>插入位置<select data-pubedit="after" data-pubid="${id}">${options.replace(`value="${Math.min(paraCount,Math.max(0,+it.after||0))}"`,`value="${Math.min(paraCount,Math.max(0,+it.after||0))}" selected`)}</select></label>
      ${opt('横向位置',['align',['left','靠左'],['center','居中'],['right','靠右']])}
      ${opt('图片比例',['ratio',['natural','原比例'],['1:1','正方形'],['4:3','4:3'],['3:4','3:4'],['16:9','16:9']])}
      ${opt('显示方式',['fit',['cover','裁切铺满'],['contain','完整显示']])}</div>
      <label>图片宽度</label><div class="pk-photo-control"><input type="range" data-pubedit="width" data-pubid="${id}" min="30" max="100" step="5" value="${+it.width||80}"><span>${+it.width||80}%</span></div>
      <input class="pk-in" data-pubedit="caption" data-pubid="${id}" autocomplete="off" placeholder="图片说明（可空）" value="${esc(it.caption||'')}">
    </div>`;
  }).join('');
}
function updateEditorialImage(id, key, value, live=false) {
  const p=cur(), list=Array.isArray(p.pubImages)?p.pubImages:[];
  const at=list.findIndex(e=>String(e.id)===String(id));
  if(at<0 || list[at][key]===value) return;
  list[at][key]=value;
  if(!live) persist();
  // Preserve the iOS composition guard for caption / URL editing; range changes stay live.
  if(!live && (key==='caption' || key==='src')) schedule(); else schedule(true);
  if(!live) historyPush('pub-image:'+key);
}

function fillSigTpl() {
  if (!st.ov) return;
  const s = store();
  const chip = n => `<div class="pk-chip" data-sigtpl="${esc(n)}">${esc(n)}<i class="fa-solid fa-xmark" data-sigtpldel="${esc(n)}"></i></div>`;
  st.ov.querySelector('.pk-sigchips').innerHTML = Object.keys(s.sigTpl || {}).map(chip).join('');
}

function close() { if (st.ov) { if(st.inlineEditing)finishInlineEdit(false); panel(null); flushField(); if (keyboardTarget(document.activeElement)) document.activeElement.blur(); keyboardDismiss(); st.editing = false; st.ov.classList.remove('show'); } }

// Use the rendered message text when a known message is used as an editor host;
// fall back to the stored message when the chat DOM has not been mounted.
function wholeMessageText(id, mes) {
  const message=ctx().chat?.[id];
  if(!message)return '';
  const holder=mes||Array.from(document.querySelectorAll('#chat .mes[mesid]'))
    .find(el=>Number(el.getAttribute('mesid'))===id);
  const body=holder?.querySelector('.mes_text');
  const visible=body ? snippetParagraphSlice(snippetNodeText(body)) : '';
  if(normalizeParagraphs(visible))return normalizeParagraphs(visible);
  const raw=String(message.mes||'');
  return normalizeParagraphs(raw.replace(/<[^>]*>/g,''));
}
function openById(id, selText) {
  const picked = normalizeParagraphs(selText || wholeMessageText(id));
  if (!picked) { toast('info', '当前消息没有可用文字'); return; }
  beginMessageDraft(id);
  if (!st.ov) { st.ov = buildOverlay(); fillTpl(); fillSigTpl(); fillCssList(); }
  if (!loadMessage(id, picked)) { toast('info', '没有可用的消息'); return; }
  keyboardDismiss();
  if (!st.chars.length) { toast('info', '选中的内容没有文字'); return; }
  st.seed = 0; st.holes = []; st.off = {}; st.free = []; st.fid = 0;
  if (String(cur().pageSkin || '').startsWith('css:') && !cssTemplateRecord()) { cur().pageSkin = 'punch'; persist(); }
  st.zoom = 1; st.lastTab = 'text';
  st.ov.querySelector('.pk-sentence').value = '';
  fillMes();
  
  panel(null);
  st.ov.classList.add('show');
  render(true); updatePreviewZoom(true); resetHistory();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => schedule());
}

// 句子拾取匣：单独保存收藏数据，不覆盖原有模板与海报设置。
let snippetBox=null, snippetBar=null, snippetPicking=false;
let snippetTapFromFloating=false;
let snippetActionMenu=null;
function hideSnippetActionMenu(){
  snippetActionMenu?.remove();snippetActionMenu=null;
}
// Selecting is deliberately non-destructive: nothing is added to favorites
// until the user presses 收藏 or confirms 合并.
function showSnippetActionMenu(text,messageId,clientX,clientY){
  if(!snippetPicking)return;
  hideSnippetActionMenu();
  const chosen=snippetMarks.filter(item=>String(item?.text||'').trim());
  if(!chosen.length)return;
  const menu=document.createElement('div');menu.id='pk-snip-action-menu';
  menu.classList.add('show');
  menu.setAttribute('role','group');menu.setAttribute('aria-label','选中句子操作');
  const create=(action,label,icon)=>{
    const button=document.createElement('button');button.type='button';button.dataset.snipAction=action;
    button.innerHTML='<i class="'+icon+'" aria-hidden="true"></i>'+label;
    return button;
  };
  const collect=create('collect','收藏','fa-regular fa-bookmark');
  const merge=create('merge','合并','fa-solid fa-code-merge');
  merge.disabled=chosen.length<2;merge.title=merge.disabled?'再选择一句即可合并':'';
  const beauty=create('beautify','repo 美化','fa-solid fa-wand-magic-sparkles');
  menu.append(collect,merge,beauty);
  menu.addEventListener('pointerdown',e=>{if(e.target.closest('button'))e.stopPropagation();});
  menu.addEventListener('click',e=>{
    const action=e.target.closest('button')?.dataset.snipAction;
    if(!action)return;
    e.preventDefault();e.stopPropagation();
    if(action==='collect'){
      let added=0;
      for(const mark of [...snippetMarks]){
        const before=snippetStore().length;
        const role={roleKey:mark.roleKey,roleName:mark.roleName,avatar:mark.avatar};
        const span=mark.body?{body:mark.body,start:mark.start,end:mark.end,sourceOffsetMode:mark.sourceOffsetMode}:null;
        const saved=addPickedSentence(mark.text,mark.messageId,role,span,true);
        if(saved && snippetStore().length>before)added++;
      }
      if(added)snippetToast('已收藏 '+added+' 句','success');
      else snippetToast('选中的句子已收藏，未重复添加');
      snippetMarks.length=0;snippetUpdatePickCount();snippetScheduleMarks();hideSnippetActionMenu();
      return;
    }
    if(action==='merge'){
      if(chosen.length<2)return;
      hideSnippetActionMenu();snippetMergeFromPicking();return;
    }
    if(new Set(chosen.map(item=>item.roleKey||'unclassified')).size>1){
      snippetToast('不同角色的句子请分别美化，避免混淆说话人','error');return;
    }
    const plan=chosen.length>1?snippetMergePlan(chosen.map(item=>item.id),true):null;
    const selectedText=plan?.proposal||chosen[0].text;
    const preferred=chosen.find(item=>Number.isInteger(item.messageId))?.messageId;
    const reference=chosen[0]||{messageId};
    const chosenId=snippetDraftMessageId({
      messageId:Number.isInteger(preferred)?preferred:messageId,
      roleKey:reference.roleKey,sourceChat:snippetChatIdentity()
    });
    if(chosenId===null){
      snippetToast('当前聊天找不到可用于美化的来源消息，请先切换到相应聊天','error');return;
    }
    hideSnippetActionMenu();stopSnippetPicking(false);
    openById(chosenId,selectedText);
  });
  document.body.appendChild(menu);snippetActionMenu=menu;
  const vv=window.visualViewport;
  const left=vv?.offsetLeft||0,top=vv?.offsetTop||0;
  const width=vv?.width||window.innerWidth,height=vv?.height||window.innerHeight;
  const w=menu.offsetWidth||270,h=menu.offsetHeight||40;
  const x=Math.max(left+7,Math.min(left+width-w-7,clientX-w/2));
  const below=clientY+12;
  const y=below+h>top+height-8?clientY-h-14:below;
  menu.style.left=Math.round(x)+'px';menu.style.top=Math.round(Math.max(top+7,y))+'px';
  // No timer: iPhone users must not have to race a disappearing menu.
}
const snippetChatIdentity=()=>String(ctx().chatId??ctx().chatName??'');
let snippetQuickTarget=null; // null = library picker, otherwise {id, chatKey, message} for one message
let snippetView='library', snippetFilter='all', snippetSearch='', snippetDetailId=null;
let snippetImportMode='merge';
const snippetCollapsed = new Set();
const snippetVisibleCounts = new Map();
const SNIPPET_PAGE_SIZE=75;
// One source of truth for creating, merging and importing saved sentences.
const SNIPPET_MAX_ITEMS=5000;
const SNIPPET_MAX_TEXT_LENGTH=10000;
let snippetMergeEditor = null;
const snippetChosen=new Set();
const snippetMarks=[];
let snippetMarkHost=null, snippetMarkFrame=0;
const snippetDefaultPrefs={messageShortcut:true,tapShortcut:true,selectionShortcut:true,iconImage:'',iconSize:54,floatX:null,floatY:null,theme:'auto',accent:'#1b1b1d',highlight:'#f2bd68',fontSize:15,panelHeight:82,panelWidth:94,density:'normal',lightBg:'#ffffff',darkBg:'#191c20'};
const snippetStore=()=>{
  const s=store();
  if(!Array.isArray(s.pickedSentences))s.pickedSentences=[];
  return s.pickedSentences;
};
const snippetPrefs=()=>{
  const s=store();
  if(!s.snippetPrefs || typeof s.snippetPrefs!=='object')s.snippetPrefs={};
  // Respect users who explicitly disabled the earlier drag shortcut.
  if(s.snippetPrefs.tapShortcut===undefined&&s.snippetPrefs.dragShortcut===false)s.snippetPrefs.tapShortcut=false;
  for(const [key,value] of Object.entries(snippetDefaultPrefs))
    if(s.snippetPrefs[key]===undefined)s.snippetPrefs[key]=value;
  return s.snippetPrefs;
};
function snippetToast(message,type='info'){toast(type,message);}
function snippetCharAvatar(raw){
  if(typeof raw!=='string'||!raw.trim())return '';
  const s=raw.trim();
  if(/^(?:data:image\/|blob:|https?:\/\/|\/)/i.test(s))return s;
  return '/characters/'+s.replace(/^\.?\/?characters\//i,'').split('/').map(encodeURIComponent).join('/');
}
// ST also sets is_system on /hide messages. Only accept a hidden message
// as a source when its *actual* speaker name can be verified in this chat.
// Ordinary system/narrator messages must not inherit the active character.
function snippetMessageEligible(id){
  const c=ctx(), msg=Number.isInteger(id)?c.chat?.[id]:null;
  if(!msg)return false;
  if(!msg.is_system)return true;
  const name=typeof msg.name==='string'?msg.name.trim():'';
  if(!name)return false;
  if(msg.is_user)return name===String(c.name1||'').trim();
  return name===String(c.name2||'').trim()
    ||(Array.isArray(c.characters)&&c.characters.some(actor=>actor?.name===name));
}
function snippetCurrentCharacter(messageId){
  const c=ctx(), chat=c.chat||[], msg=Number.isInteger(messageId)?chat[messageId]:null;
  if(msg?.is_user){
    const name=String(msg.name||c.name1||'用户').trim()||'用户';
    const domAvatar=document.querySelector('#chat .mes[mesid="'+messageId+'"] .avatar img');
    const avatar=domAvatar?.currentSrc||domAvatar?.getAttribute('src')||snippetCharAvatar(c.user_avatar||c.userAvatar||'');
    return {roleKey:'user:'+name,roleName:name,avatar:avatar||''};
  }
  const chars=Array.isArray(c.characters)?c.characters:[];
  const idx=c.characterId??c.characterIndex;
  const fromMessage=msg&&!msg.is_user&&snippetMessageEligible(messageId)&&typeof msg.name==='string'?msg.name.trim():'';
  const active=chars[idx];
  const actor=chars.find(v=>v?.name&&fromMessage&&v.name===fromMessage) || (active?.name===fromMessage||!fromMessage?active:null) || chars.find(v=>v?.name===c.name2&&c.name2===fromMessage);
  const name=fromMessage||actor?.name||c.name2||'';
  // Use name as a portable grouping key across chats, not volatile message indices.
  const key=name?'char:'+name:'unclassified';
  const domAvatar=Number.isInteger(messageId)&&!msg?.is_user?document.querySelector('#chat .mes[mesid="'+messageId+'"] .avatar img'):null;
  const avatar=(domAvatar?.currentSrc||domAvatar?.getAttribute('src')||'')
    ||snippetCharAvatar(actor?.avatar||actor?.avatar_url||(!fromMessage?c.characterAvatar:'')||'');
  return {roleKey:key,roleName:name||'未分类',avatar:avatar||''};
}
function snippetRoleOf(item){
  const key=typeof item?.roleKey==='string'&&item.roleKey?item.roleKey:'unclassified';
  const name=typeof item?.roleName==='string'&&item.roleName?item.roleName:(key==='unclassified'?'未分类':key.replace(/^(?:char:|user:)/,''));
  return {key,name,avatar:typeof item?.avatar==='string'?item.avatar:''};
}
// Find a real chat message to host a saved quote in the editor.
// Imported/legacy unclassified quotes have no trustworthy role attribution:
// try their original current-chat message, then a usable recent message.
// Classified quotes must never be attributed to an unrelated speaker.
function snippetDraftMessageId(item){
  const chat=ctx().chat||[];
  const roleKey=snippetRoleOf(item).key;
  const matches=id=>snippetMessageEligible(id)
    &&(roleKey==='unclassified'||snippetCurrentCharacter(id).roleKey===roleKey);
  const usable=id=>Number.isInteger(id)&&id>=0&&matches(id)&&!!wholeMessageText(id);
  const currentChat=String(ctx().chatId??ctx().chatName??'');
  if(item?.sourceChat===currentChat && usable(item.messageId))return item.messageId;
  // Prefer visible speech. Hidden /hide messages are fallback sources only
  // when their actual speaker can still be verified (see helper above).
  for(let id=chat.length-1;id>=0;id--)if(!chat[id]?.is_system&&usable(id))return id;
  for(let id=chat.length-1;id>=0;id--)if(usable(id))return id;
  return null;
}
function addPickedSentence(text,sourceId,roleHint,span=null,quiet=false){
  const value=normalizeParagraphs(String(text||'')).trim();
  if(!value)return null;
  if(value.length>SNIPPET_MAX_TEXT_LENGTH){
    if(!quiet)snippetToast('单条收藏不能超过 10000 字符','error');
    return null;
  }
  const arr=snippetStore();
  const role=roleHint||snippetCurrentCharacter(sourceId);
  // Old favorites may retain paragraph breaks from previous versions.
  const key=snippetRecordKey({text:value,roleKey:role.roleKey});
  const already=arr.find(x=>x&&typeof x.text==='string'&&snippetRecordKey(x)===key);
  if(already){if(!quiet)snippetToast('这句话已经收藏过了');return already;}
  const id=snippetNewId();
  const rec={id,text:value,messageId:Number.isInteger(sourceId)?sourceId:null,
    sourceChat:String(ctx().chatId??ctx().chatName??''),roleKey:role.roleKey,roleName:role.roleName,
    avatar:role.avatar,savedAt:Date.now(),
    ...(span&&span.sourceOffsetMode==='message'&&Number.isInteger(span.start)&&Number.isInteger(span.end)
      ?{sourceStart:span.start,sourceEnd:span.end,sourceOffsetMode:'message'}:{})};
  // Save paragraph indices as a fallback when the original chat DOM later
  // disappears. Character distance alone cannot tell where paragraphs begin.
  if(span?.body && rec.sourceOffsetMode==='message'){
    const parsed=snippetNodeText(span.body),full=parsed.full;
    if(rec.sourceEnd<=full.length && normalize(full.slice(rec.sourceStart,rec.sourceEnd))===normalize(value)){
      rec.sourceParagraphStart=snippetParagraphIndex(parsed,rec.sourceStart);
      rec.sourceParagraphEnd=snippetParagraphIndex(parsed,Math.max(0,rec.sourceEnd-1));
      rec.sourceParagraphFormat=2;
    }
  }
  // Never evict someone's earlier saved sentences silently.
  // The import validator already uses 5000 as the supported collection limit.
  if(arr.length>=SNIPPET_MAX_ITEMS){snippetToast('收藏已满 5000 句，请先导出备份或清理后再收藏','error');return null;}
  arr.unshift(rec);
  persist();if(!quiet)snippetToast('已收藏：'+role.roleName,'success');
  if(snippetBar)snippetUpdatePickCount();
  return rec;
}
function snippetUpdatePickCount(){
  const el=snippetBar?.querySelector('[data-snip-count]');
  if(el)el.textContent=snippetMarks.length+' 句已标记';
  const merge=snippetBar?.querySelector('[data-snip-pick-merge]');
  if(merge)merge.disabled=snippetMarks.length<2;
}
// Keep real paragraph boundaries when the chat renderer splits text among
// multiple DOM nodes. Visual word-wrapping is NOT a paragraph boundary.
// The synthetic newline has no DOM range of its own, and cannot be selected.
function snippetNodeText(body){
  const walker=document.createTreeWalker(body,window.NodeFilter.SHOW_ELEMENT|window.NodeFilter.SHOW_TEXT);
  const chunks=[],breaks=new Map();let full='',n,lastBrAt=-1,brPending=false;
  const blocks=new Set(['P','DIV','LI','BLOCKQUOTE','PRE','H1','H2','H3','H4','H5','H6','DT','DD']);
  const styles=new WeakMap();
  const styleOf=node=>{
    if(!node)return {};
    if(!styles.has(node)){
      let style={};try{style=window.getComputedStyle(node);}catch(_){}
      styles.set(node,style);
    }
    return styles.get(node);
  };
  // Themes and display regex can render paragraphs as styled <span>/<section>
  // rather than semantic <p>. Respect visible block layout without guessing
  // raw message boundaries or turning screen line wraps into paragraphs.
  // Avoid computing styles for ordinary inlines.
  const visualBlock=n=>{
    if(blocks.has(n.tagName))return true;
    if(!/^(SPAN|SECTION|ARTICLE|MAIN|HEADER|FOOTER|ASIDE|SUMMARY)$/.test(n.tagName)
      && !n.hasAttribute('style'))return false;
    const display=styleOf(n).display;
    return /^(block|flow-root|list-item|flex|grid|table|table-row|table-caption|table-cell)$/.test(display);
  };
  const markBreak=kind=>{
    if(!full)return;
    if(full.endsWith('\n')){
      // Reuse source whitespace after a tag; never shift stored character offsets.
      const i=full.length-1;
      if(kind==='block'||!breaks.has(i))breaks.set(i,kind);
    }else{
      breaks.set(full.length,kind);full+='\n';
    }
  };
  let previousBlock=null;
  const textBlock=node=>{
    let parent=node.parentElement;
    while(parent&&parent!==body&&!visualBlock(parent))parent=parent.parentElement;
    return parent||body;
  };
  while((n=walker.nextNode())){
    if(n.nodeType===1){
      if(n.tagName==='BR'){
        // <br><br> is a paragraph gap, including a whitespace-only text
        // node between the tags. Upgrade metadata without inserting bytes.
        if(brPending&&lastBrAt>=0)breaks.set(lastBrAt,'block');
        markBreak('br');lastBrAt=full.length-1;brPending=true;
      }else if(n!==body&&visualBlock(n)){
        markBreak('block');brPending=false;lastBrAt=-1;
      }
      continue;
    }
    if(!n.textContent || n.parentElement?.closest('script,style,[hidden],[aria-hidden="true"]'))continue;
    const piece=n.textContent;
    if(/\S/u.test(piece)){
      const block=textBlock(n);
      // TreeWalker reports block entry, but no exit event. Preserve the boundary
      // when text follows a closed paragraph/block without another opening tag.
      if(previousBlock&&block!==previousBlock)markBreak('block');
      previousBlock=block;
    }
    const offset=full.length;
    chunks.push({node:n,start:offset,end:offset+piece.length});full+=piece;
    // Some themes/regex leave literal blank lines in text nodes instead of
    // creating separate <p> elements. These are real paragraph boundaries.
    // Annotate the last newline; never insert text or shift source offsets.
    // pre/pre-wrap/pre-line text contains intentional visible newlines.
    // Ordinary HTML source-formatting newlines still get soft-joined.
    const whiteSpace=styleOf(n.parentElement).whiteSpace;
    if(/^(pre|pre-wrap|pre-line|break-spaces)$/.test(whiteSpace)){
      for(const gap of piece.matchAll(/\n/g))breaks.set(offset+gap.index,'br');
    }
    for(const gap of piece.matchAll(/\n(?:[ \t\u3000]*\n)+/g)){
      const last=gap[0].lastIndexOf('\n');
      breaks.set(offset+gap.index+last,'block');
    }
    if(/\S/u.test(piece)){brPending=false;lastBrAt=-1;}
  }
  return {full,chunks,breaks};
}
// Slice by stable source offsets, rendering true block starts as paragraph breaks.
// The newline from a <br> stays intra-paragraph; formatting whitespace between
// HTML tags is not promoted to a new paragraph or message bubble.
function snippetParagraphSlice(parsed,start=0,end=parsed.full.length){
  const {full,breaks}=parsed;
  start=Math.max(0,Math.min(full.length,start));
  end=Math.max(start,Math.min(full.length,end));
  let result='',skipIndent=false;
  for(let i=start;i<end;i++){
    const ch=full[i];
    if(ch!=='\n'&&ch!=='\r'){
      if(skipIndent&&/[ \t\u3000]/u.test(ch))continue;
      skipIndent=false;result+=ch;continue;
    }
    const kind=breaks.get(i);
    if(kind==='block'||kind==='br'){
      result=result.replace(/[ \t\u3000]+$/,'');
      result+=kind==='block'?'\n\n':'\n';
      skipIndent=false;
    }else{
      // Tag-formatting whitespace is not a new paragraph. A newline inside
      // a text node is a soft join with language-aware ASCII spacing.
      if(i>start && full[i-1]==='\n' && breaks.has(i-1)){
        skipIndent=true;continue;
      }
      const left=result.replace(/[ \t\u3000]+$/,'');
      // Scan ahead by index instead of copying the rest of a long message
      // for every text-node newline (important during selectionchange).
      let next=i+1;
      while(next<end && /[ \t\u3000\r\n]/u.test(full[next]))next++;
      const right=next<end&&!/\s/u.test(full[next])?full[next]:'';
      result=left+(left&&right?softJoinGap(left.slice(-1),right):'');
      skipIndent=true;
    }
  }
  return normalizeParagraphs(result).replace(/\n[ \t\u3000]+/g,'\n').replace(/\n{3,}/g,'\n\n');
}
// Browser selection.toString() is unreliable across Safari element boundaries.
// Use the actual DOM text nodes intersected by the selected Range instead.
function snippetRangeParagraphText(range,body){
  if(!range||range.collapsed||!body||!body.contains(range.startContainer)
    ||!body.contains(range.endContainer))return null;
  const parsed=snippetNodeText(body);
  let begin=null,finish=null;
  for(const chunk of parsed.chunks){
    let overlaps=false;
    try{overlaps=range.intersectsNode(chunk.node);}catch(_){}
    if(!overlaps)continue;
    const from=chunk.node===range.startContainer?range.startOffset:0;
    const to=chunk.node===range.endContainer?range.endOffset:chunk.node.textContent.length;
    if(to<=from)continue;
    if(begin===null)begin=chunk.start+from;
    finish=chunk.start+to;
  }
  if(begin===null||finish<=begin)return null;
  return {text:snippetParagraphSlice(parsed,begin,finish),start:begin,end:finish,
    body,sourceOffsetMode:'message'};
}
// These indices count DOM paragraph starts, not <br> line breaks.
// Keep old untyped hints for backup compatibility, but never trust them offline.
function snippetParagraphIndex(parsed,pos){
  let count=0;
  for(const [i,kind] of parsed.breaks)if(kind==='block'&&i<pos)count++;
  return count;
}
function snippetGapSeparator(parsed,end,start){
  if(!parsed||start<=end)return '';
  let hasBr=false,hasWhitespace=false;
  for(let i=end;i<start;i++){
    const kind=parsed.breaks.get(i);
    if(kind==='block')return '\n\n';
    if(kind==='br')hasBr=true;
    else if(/\s/.test(parsed.full[i]||''))hasWhitespace=true;
  }
  return hasBr?'\n':hasWhitespace?' ':'';
}
// The native selection shortcut can save a Range after Safari collapses its
// visible selection. Resolve its offsets now, while the source DOM exists.
function snippetSpanFromRange(range){
  if(!range||range.collapsed)return null;
  const start=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;
  const body=start?.closest('#chat .mes[mesid] .mes_text');
  return body?snippetRangeParagraphText(range,body):null;
}
function snippetTextScope(node,body){
  const start=node?.nodeType===1?node:node?.parentElement;
  const target=start?.closest('p,li,blockquote,pre,h1,h2,h3,h4,h5,h6,dt,dd');
  return target&&body.contains(target)?target:body;
}
function snippetRangeFromOffsets(chunks,start,end){
  const ranges=[];
  for(const part of chunks){
    const a=Math.max(start,part.start),b=Math.min(end,part.end);
    if(a>=b)continue;
    const range=document.createRange();range.setStart(part.node,a-part.start);range.setEnd(part.node,b-part.start);
    ranges.push(range);
  }
  return ranges;
}
function clickedSentence(e,body){
  const caret=document.caretRangeFromPoint?.(e.clientX,e.clientY);
  const alt=!caret?document.caretPositionFromPoint?.(e.clientX,e.clientY):null;
  const node=caret?.startContainer||alt?.offsetNode;
  const offset=caret?.startOffset??alt?.offset;
  if(!node||!body.contains(node))return null;
  // Never infer a sentence through a neighboring <p>, <br> or block.
  // This also avoids a previous paragraph's closing bracket being selected.
  const scope=snippetTextScope(node,body);
  const {full,chunks,breaks}=snippetNodeText(scope);
  const source=chunks.find(v=>v.node===node);
  if(!source||!full.trim())return null;
  const position=Math.min(source.end-1,source.start+Math.max(0,Number(offset)||0));
  const lineStart=full.lastIndexOf('\n',position-1)+1;
  const nextNewline=full.indexOf('\n',position);
  const lineEnd=nextNewline<0?full.length:nextNewline;
  const isEnd=i=>'。！？!?'.includes(full[i])||(full[i]==='.'&&(i===lineEnd-1||/\s/.test(full[i+1]||'')));
  let start=position,end=position;
  while(start>lineStart&&!isEnd(start-1))start--;
  while(end<lineEnd&&!isEnd(end))end++;
  if(end<lineEnd)end++;
  while(end<lineEnd&&'”’」』）》"\'】]'.includes(full[end]))end++;
  // Bracketed dialogue is one passage, even when it contains more than one sentence.
  // This prevents a stranded '[' or ']' becoming a separate saved record.
  const openPairs={'[':']','【':'】','「':'」','『':'』'};
  const stack=[];let enclosure=null;
  for(let i=0;i<full.length;i++){
    const c=full[i];
    if(openPairs[c])stack.push({char:c,start:i});
    else if(stack.length&&openPairs[stack[stack.length-1].char]===c){
      const last=stack.pop();
      if(last.start<=position&&position<=i&&i-last.start<900){
        if(!enclosure||last.start<enclosure.start)enclosure={start:last.start,end:i+1};
      }
    }
  }
  // A complete enclosing quote is the selection; do NOT union it with the
  // sentence detected before it. That union selected two adjacent passages.
  if(enclosure && enclosure.start>=lineStart && enclosure.end<=lineEnd){
    start=enclosure.start;end=enclosure.end;
  }
  // Ignore whitespace and line boundaries, never store punctuation alone.
  while(start<end&&/\s/.test(full[start]))start++;
  while(end>start&&/\s/.test(full[end-1]))end--;
  const text=snippetParagraphSlice({full,breaks},start,end).trim();
  if(!text||!/[\p{L}\p{N}]/u.test(text))return null;
  if(text.length>900){snippetToast('选中的内容较长，请分两句拾取后合并，或手动添加');return null;}
  const ranges=snippetRangeFromOffsets(chunks,start,end);
  if(!ranges.length)return null;
  // Each click can be scoped to one <p>, where local offsets start at zero.
  // Resolve offsets again against the entire message before storing them,
  // so sorting/merging across paragraphs does not select the wrong text.
  const messageChunks=scope===body?chunks:snippetNodeText(body).chunks;
  const first=ranges[0],last=ranges[ranges.length-1];
  const firstPart=messageChunks.find(c=>c.node===first.startContainer);
  const lastPart=messageChunks.find(c=>c.node===last.endContainer);
  if(!firstPart||!lastPart)return null;
  const sourceStart=firstPart.start+first.startOffset;
  const sourceEnd=lastPart.start+last.endOffset;
  return {text,ranges,start:sourceStart,end:sourceEnd,body,sourceOffsetMode:'message'};
}
function snippetMarkRender(){
  snippetMarkFrame=0;
  if(!snippetPicking||!snippetMarkHost)return;
  snippetMarkHost.replaceChildren();
  const color=snippetPrefs().highlight;
  for(const entry of snippetMarks){
    for(const range of entry.ranges){
      for(const rect of Array.from(range.getClientRects())){
        if(!rect.width||!rect.height||rect.bottom<0||rect.top>window.innerHeight)continue;
        const paint=document.createElement('span');paint.className='pk-snip-highlight';
        Object.assign(paint.style,{top:rect.top-1+'px',left:rect.left-2+'px',width:rect.width+4+'px',height:rect.height+2+'px',background:color+'65',borderBottom:'2px solid '+color});
        snippetMarkHost.appendChild(paint);
      }
    }
  }
}
function snippetScheduleMarks(){
  if(snippetMarkFrame||!snippetPicking)return;
  snippetMarkFrame=requestAnimationFrame(snippetMarkRender);
}
function onSnippetClick(e){
  if(!snippetPicking||e.target?.closest?.('#pk-snip-bar')||e.target?.closest?.('#pk-snip-merge-overlay'))return;
  const body=e.target?.closest?.('#chat .mes[mesid] .mes_text');
  if(!body)return;
  // In quick mode, leave all other messages fully interactive.
  const clickedId=Number(body.closest('.mes[mesid]')?.getAttribute('mesid'));
  if(snippetQuickTarget && (snippetChatIdentity()!==snippetQuickTarget.chatKey || clickedId!==snippetQuickTarget.id || ctx().chat?.[clickedId]!==snippetQuickTarget.message))return;
  e.preventDefault();e.stopPropagation();
  const extracted=clickedSentence(e,body);
  if(!extracted){snippetToast('未能识别完整句子，可以手动添加');return;}
  const messageId=Number(body.closest('.mes[mesid]')?.getAttribute('mesid'));
  const sourceId=Number.isInteger(messageId)?messageId:null;
  if(!Number.isInteger(sourceId)||!ctx().chat?.[sourceId]){snippetToast('原消息不存在或已失效，请重新选择','error');return;}
  if(!snippetMessageEligible(sourceId)){snippetToast('系统消息不能作为收藏来源','error');return;}
  const role=snippetCurrentCharacter(sourceId);
  const existing=snippetMarks.find(v=>v.text===extracted.text&&v.roleKey===role.roleKey);
  if(existing){
    const at=snippetMarks.indexOf(existing);snippetMarks.splice(at,1);
    snippetUpdatePickCount();snippetScheduleMarks();
    if(snippetMarks.length)
      showSnippetActionMenu(extracted.text,sourceId,e.clientX,e.clientY);
    else hideSnippetActionMenu();
    return;
  }
  const parsed=snippetNodeText(body),source=parsed.full;
  const mark={id:snippetNewId(),text:extracted.text,ranges:extracted.ranges,
    roleKey:role.roleKey,roleName:role.roleName,avatar:role.avatar,
    body,start:extracted.start,end:extracted.end,messageId:sourceId,
    sourceChat:snippetChatIdentity(),sourceStart:extracted.start,sourceEnd:extracted.end,
    sourceOffsetMode:'message',savedAt:Date.now()};
  if(mark.sourceEnd<=source.length){
    mark.sourceParagraphStart=snippetParagraphIndex(parsed,mark.sourceStart);
    mark.sourceParagraphEnd=snippetParagraphIndex(parsed,Math.max(0,mark.sourceEnd-1));
    mark.sourceParagraphFormat=2;
  }
  snippetMarks.push(mark);
  snippetUpdatePickCount();snippetScheduleMarks();
  showSnippetActionMenu(extracted.text,sourceId,e.clientX,e.clientY);
}
function stopSnippetPicking(returnToBox=true){
  hideSnippetActionMenu();
  repoSelectionMergeDrafts.length=0;
  snippetPicking=false;
  snippetQuickTarget=null;
  snippetTapFromFloating=false;
  syncSnippetTapHandle();
  document.querySelectorAll('#chat .mes.pk-snip-active-message').forEach(m=>m.classList.remove('pk-snip-active-message'));
  snippetMergeEditor?.remove();snippetMergeEditor=null;
  snippetBar?.remove();snippetBar=null;
  snippetMarks.length=0;
  snippetMarkHost?.remove();snippetMarkHost=null;
  if(snippetMarkFrame){window.cancelAnimationFrame(snippetMarkFrame);snippetMarkFrame=0;}
  document.removeEventListener('click',onSnippetClick,true);
  document.removeEventListener('scroll',snippetScheduleMarks,true);
  window.removeEventListener('scroll',snippetScheduleMarks);
  window.removeEventListener('resize',snippetScheduleMarks);
  window.visualViewport?.removeEventListener('scroll',snippetScheduleMarks);
  window.visualViewport?.removeEventListener('resize',snippetScheduleMarks);
  if(returnToBox)openSnippetBox();
}
function startSnippetPicking(options={}){
  hideRepoSelection();hideSnippetActionMenu();
  snippetMarks.length=0;
  // Also called as a button handler (with MouseEvent); only explicit quick options scope it.
  closeSnippetBox();
  if(snippetPicking)stopSnippetPicking(false);
  const quick=options?.quick===true&&Number.isInteger(options.messageId)&&options.messageId>=0;
  snippetTapFromFloating=options?.fromFloating===true;
  snippetQuickTarget=quick?{id:options.messageId,chatKey:snippetChatIdentity(),message:ctx().chat?.[options.messageId]}:null;
  if(quick)document.querySelector('#chat .mes[mesid="'+options.messageId+'"]')?.classList.add('pk-snip-active-message');
  snippetPicking=true;
  snippetMarkHost=document.createElement('div');snippetMarkHost.id='pk-snip-mark-host';
  document.body.appendChild(snippetMarkHost);
  snippetBar=document.createElement('div');snippetBar.id='pk-snip-bar';
  snippetBar.innerHTML='<span>点句后选收藏 / 合并 / 美化 <small data-snip-count>0 句已标记</small></span><div class="pk-snip-pick-actions"><button type="button" data-snip-pick-merge disabled>合并</button><button type="button" data-snip-pick-done>退出选择</button></div>';
  if(quick)snippetBar.querySelector('span').firstChild.textContent='点击本条消息中的句子 ';
  if(snippetTapFromFloating)snippetBar.querySelector('span').firstChild.textContent='点句只标记，不自动收藏 · 点图标退出 ';
  snippetBar.querySelector('[data-snip-pick-merge]').onclick=e=>{
    e.preventDefault();e.stopPropagation();snippetMergeFromPicking();
  };
  snippetBar.querySelector('[data-snip-pick-done]').onclick=e=>{
    e.preventDefault();e.stopPropagation();stopSnippetPicking(!snippetQuickTarget&&!snippetTapFromFloating);
  };
  document.body.appendChild(snippetBar);
  document.addEventListener('click',onSnippetClick,true);
  document.addEventListener('scroll',snippetScheduleMarks,true);
  window.addEventListener('scroll',snippetScheduleMarks,{passive:true});
  window.addEventListener('resize',snippetScheduleMarks);
  window.visualViewport?.addEventListener('scroll',snippetScheduleMarks);
  window.visualViewport?.addEventListener('resize',snippetScheduleMarks);
  syncSnippetTapHandle();
}
function closeSnippetBox(){snippetMergeEditor?.remove();snippetMergeEditor=null;snippetBox?.remove();snippetBox=null;}
// Pick legible label color for any user-selected accent, including pale pastels.
function snippetLuminance(hex){
  const parts=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const linear=parts.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
}
function snippetContrast(a,b){
  const x=snippetLuminance(a),y=snippetLuminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function snippetAccentText(hex){return snippetLuminance(hex)>0.179?'#191c20':'#ffffff';}
function snippetAccentInk(accent,background){
  if(snippetContrast(accent,background)>=4.5)return accent;
  // Colored text needs to contrast with the panel, not with its own fill.
  const dark='#191c20',light='#ffffff';
  return snippetContrast(dark,background)>=snippetContrast(light,background)?dark:light;
}
function snippetApplyAppearance(){
  if(!snippetBox)return;
  const p=snippetPrefs();
  for(const [name,def] of [['accent',snippetDefaultPrefs.accent],['highlight','#f2bd68'],['lightBg','#ffffff'],['darkBg','#191c20']])
    if(!/^#[0-9a-fA-F]{6}$/.test(String(p[name])))p[name]=def;
  for(const [name,lower,upper] of [['fontSize',12,20],['panelHeight',60,94],['panelWidth',78,99]])
    p[name]=Math.max(lower,Math.min(upper,Number(p[name])||lower));
  const dark=p.theme==='dark'||(p.theme==='auto'&&window.matchMedia?.('(prefers-color-scheme: dark)')?.matches);
  snippetBox.dataset.theme=dark?'dark':'light';
  snippetBox.style.setProperty('--sn-bg',dark?p.darkBg:p.lightBg);
  const accent=dark&&p.accent===snippetDefaultPrefs.accent?'#f4f4f5':p.accent;
  snippetBox.style.setProperty('--sn-accent',accent);
  snippetBox.style.setProperty('--sn-accent-fg',snippetAccentText(accent));
  snippetBox.style.setProperty('--sn-accent-ink',snippetAccentInk(accent,dark?p.darkBg:p.lightBg));
  snippetBox.style.setProperty('--sn-font-size',p.fontSize+'px');
  snippetBox.style.setProperty('--sn-panel-height',p.panelHeight+'dvh');
  snippetBox.style.setProperty('--sn-panel-width',p.panelWidth+'vw');
  snippetBox.dataset.density=p.density;
}
function snippetAvatarElement(role){
  const avatar=document.createElement('span');avatar.className='pk-snip-avatar';
  const url=role.avatar||'';
  if(url){
    const im=document.createElement('img');im.alt='';im.loading='lazy';im.src=url;
    im.onerror=()=>{im.remove();avatar.textContent=Array.from(role.name||'未')[0];};
    avatar.appendChild(im);
  }else avatar.textContent=Array.from(role.name||'未')[0];
  return avatar;
}
function snippetLabelTime(item){
  const t=Number(item.savedAt||0);
  if(!t)return '';
  const d=new Date(t);
  if(!Number.isFinite(d.getTime()))return '';
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
function snippetMake(tag,cls,text){
  const el=document.createElement(tag);if(cls)el.className=cls;
  if(text!==undefined)el.textContent=text;return el;
}
function snippetButton(text,click,cls=''){
  const b=snippetMake('button',cls,text);b.type='button';b.onclick=click;return b;
}
function snippetSafeCopy(obj){
  return JSON.parse(JSON.stringify(obj,(k,v)=>['__proto__','constructor','prototype'].includes(k)?undefined:v));
}
const snippetNewId=()=>String(Date.now())+'-'+Math.random().toString(36).slice(2,10);
const snippetRecordKey=item=>snippetRoleOf(item).key+'\u0000'+normalize(item.text);
function snippetValidatedItems(items){
  if(!Array.isArray(items))throw Error('收藏列表格式错误');
  if(items.length>SNIPPET_MAX_ITEMS)throw Error('收藏记录超过 5000 条');
  const result=[],usedIds=new Set();
  for(const item of items){
    if(!item||typeof item!=='object'||Array.isArray(item)||typeof item.text!=='string')continue;
    const value=item.text.trim();
    if(!value||value.length>SNIPPET_MAX_TEXT_LENGTH)continue;
    const copy=snippetSafeCopy(item);
    copy.text=value;
    // Obsolete rendering hints are not needed to read old backups.
    delete copy.paragraphFormat;
    delete copy.canvasSoftBreaks;
    copy.roleKey=typeof copy.roleKey==='string'&&copy.roleKey.trim()?copy.roleKey.trim().slice(0,200):'unclassified';
    copy.roleName=typeof copy.roleName==='string'?copy.roleName.slice(0,200):'';
    copy.avatar=typeof copy.avatar==='string'?copy.avatar.slice(0,12000):'';
    copy.sourceChat=typeof copy.sourceChat==='string'?copy.sourceChat.slice(0,300):'';
    copy.messageId=Number.isInteger(copy.messageId)&&copy.messageId>=0?copy.messageId:null;
    copy.savedAt=Number.isFinite(copy.savedAt)&&copy.savedAt>0?copy.savedAt:Date.now();
    let id=typeof copy.id==='string'&&copy.id.trim()&&copy.id.length<=120?copy.id:'';
    while(!id||usedIds.has(id))id=snippetNewId();
    copy.id=id;usedIds.add(id);
    // Source offsets are meaningful only as a valid ordered pair.
    if(!Number.isInteger(copy.sourceStart)||!Number.isInteger(copy.sourceEnd)||copy.sourceStart<0||copy.sourceEnd<=copy.sourceStart){
      delete copy.sourceStart;delete copy.sourceEnd;delete copy.sourceOffsetMode;
    } else if(copy.sourceOffsetMode!=='message') {
      // Legacy offsets were paragraph-local; never upgrade them implicitly.
      delete copy.sourceOffsetMode;
    }
    // A paragraph hint is only meaningful with a trustworthy message-global
    // offset pair. Never let an imported hint invent new paragraph breaks.
    if(copy.sourceParagraphFormat!==2)delete copy.sourceParagraphFormat;
    if(copy.sourceOffsetMode!=='message'
      || !Number.isInteger(copy.sourceParagraphStart)||!Number.isInteger(copy.sourceParagraphEnd)
      || copy.sourceParagraphStart<0||copy.sourceParagraphEnd<copy.sourceParagraphStart
      || copy.sourceParagraphEnd>100000){
      delete copy.sourceParagraphStart;delete copy.sourceParagraphEnd;
      delete copy.sourceParagraphFormat;
    }
    result.push(copy);
  }
  return result;
}
// Preserve existing IDs during merge, but never let an imported ID collide
// with a different saved sentence (selection and deletion are ID-based).
function snippetMergeItems(current, imported){
  const result=Array.isArray(current)?current.slice():[];
  const keys=new Set(result.filter(x=>x&&typeof x.text==='string').map(snippetRecordKey));
  const ids=new Set(result.filter(x=>x&&typeof x.id==='string').map(x=>x.id));
  for(const item of imported){
    const key=snippetRecordKey(item);
    if(keys.has(key))continue;
    const next={...item};
    while(!next.id||ids.has(next.id))next.id=snippetNewId();
    keys.add(key);ids.add(next.id);result.push(next);
  }
  if(result.length>SNIPPET_MAX_ITEMS)throw Error('合并后收藏超过 5000 条，请分批导入');
  return result;
}
function snippetExportData(){
  const data={format:'punch-poster-full-backup',version:1,
    exportedAt:new Date().toISOString(),pluginId:'6db7fd72-ea0f-4aeb-9acc-4c9134a64c1f',
    module:'punch-poster',settings:snippetSafeCopy(store())};
  const json=JSON.stringify(data,null,2);
  const blob=new window.Blob([json],{type:'application/json;charset=utf-8'});
  const url=window.URL.createObjectURL(blob);
  download(url,'打孔海报-完整备份.json');
  window.setTimeout(()=>window.URL.revokeObjectURL(url),30000);
}
function snippetReadBackupText(file){
  return readLocalTextFile(file,'备份');
}
function snippetImportData(file){
  if(!file)return;
  if(file.size>50000000){snippetToast('备份文件超过 50 MB','error');return;}
  snippetReadBackupText(file).then(raw=>{
    const data=JSON.parse(raw);
    const full=data?.format==='punch-poster-full-backup'&&data.module==='punch-poster'
      &&data.settings&&typeof data.settings==='object'&&!Array.isArray(data.settings);
    if(full){
      const incoming=snippetSafeCopy(data.settings);
      // Import is a trust boundary. Reject object keys that could alter a
      // dictionary prototype when merging or restoring external backup JSON.
      const forbidden=new Set(['__proto__','constructor','prototype']);
      if(Object.keys(incoming).some(k=>forbidden.has(k)))throw Error('备份包含不安全的字段名');
      if(!incoming.cur||typeof incoming.cur!=='object'||Array.isArray(incoming.cur))throw Error('备份缺少必要的插件设置');
      if(incoming.pickedSentences!==undefined)incoming.pickedSentences=snippetValidatedItems(incoming.pickedSentences);
      for(const key of ['tpl','sigTpl','cssTpl','cssHidden']){
        if(incoming[key]!==undefined&&(typeof incoming[key]!=='object'||!incoming[key]||Array.isArray(incoming[key])))
          throw Error('备份中的 '+key+' 格式错误');
      }
      if(incoming.cssTpl){
        // Count is deliberately not capped: users can import additional templates later.
        // The 50 MB backup size limit and per-template validation still apply.
        for(const [key,item] of Object.entries(incoming.cssTpl)){
          if(!item||typeof item!=='object'||Array.isArray(item)||
             typeof item.html!=='string'||!item.html.includes('data-pk="body"')||
             typeof item.css!=='string'||typeof item.id!=='string'||
             item.html.length>150000||item.css.length>180000||forbidden.has(key))
            throw Error('备份中的 CSS 模板损坏：'+key);
          // A backup must satisfy exactly the same restrictions as importing
          // a CSS file directly, including external resources and scripts.
          try{cssClean(cssSpecSource(item));}catch(e){throw Error('备份 CSS 模板不安全：'+key+'（'+e.message+'）');}
        }
      }
      if(incoming.tpl){
        for(const [key,item] of Object.entries(incoming.tpl))
          if(forbidden.has(key)||!item||typeof item!=='object'||Array.isArray(item))throw Error('备份中的预设损坏：'+key);
      }
      if(incoming.sigTpl){
        for(const [key,item] of Object.entries(incoming.sigTpl))
          if(forbidden.has(key)||!item||typeof item!=='object'||Array.isArray(item))throw Error('备份中的署名预设损坏：'+key);
      }
      if(incoming.cssHidden){
        for(const key of Object.keys(incoming.cssHidden))
          if(forbidden.has(key))throw Error('备份包含无效模板 ID：'+key);
      }
      if(incoming.snippetCollapsedRoles!==undefined){
        incoming.snippetCollapsedRoles=Array.isArray(incoming.snippetCollapsedRoles)
          ?incoming.snippetCollapsedRoles.filter(v=>typeof v==='string').slice(0,2000):[];
      }
      if(incoming.snippetPrefs!==undefined && (!incoming.snippetPrefs||typeof incoming.snippetPrefs!=='object'||Array.isArray(incoming.snippetPrefs)))
        incoming.snippetPrefs={};
      const existing=store();
      if(snippetImportMode==='replace'){
        if(!window.confirm('将用备份替换「打孔海报」的全部设置、CSS 模板、收藏和预设。请先保存当前备份。确定恢复？'))return;
        for(const key of Object.keys(existing))delete existing[key];
        Object.assign(existing,incoming);
      }else{
        // Validate the complete merge first; an error must not partially change
        // CSS templates or presets in the live extension settings object.
        const mergedSentences=snippetMergeItems(existing.pickedSentences,incoming.pickedSentences||[]);
        for(const key of ['tpl','sigTpl','cssTpl','cssHidden'])
          if(incoming[key]&&typeof incoming[key]==='object'&&!Array.isArray(incoming[key]))
            existing[key]={...incoming[key],...(existing[key]||{})};
        existing.pickedSentences=mergedSentences;
        for(const [key,val] of Object.entries(incoming))
          if(!(key in existing))existing[key]=val;
      }
      store();persist();syncSnippetTapHandle();snippetChosen.clear();snippetToast('完整插件数据已恢复','success');renderSnippetBox();
      if(st.ov){fillCssList();syncAll();schedule(true);}return;
    }
    // Backward compatibility: old sentence-only exports remain importable.
    const items=Array.isArray(data)?data:(data?.format==='punch-poster-sentences'&&Array.isArray(data.sentences)?data.sentences:null);
    if(!items)throw Error('不是有效的打孔海报完整备份或旧收藏备份');
    const valid=snippetValidatedItems(items);
    const replace=snippetImportMode==='replace';
    if(replace&&!window.confirm('此文件只有收藏数据。确定替换全部收藏吗？其余插件数据不会改动。'))return;
    store().pickedSentences=snippetMergeItems(replace?[]:snippetStore(),valid);
    if(data?.preferences&&typeof data.preferences==='object'&&replace)
      store().snippetPrefs={...snippetDefaultPrefs,...Object.fromEntries(Object.entries(data.preferences).filter(([k])=>k in snippetDefaultPrefs))};
    persist();syncSnippetTapHandle();snippetChosen.clear();snippetToast('旧版收藏数据已导入','success');renderSnippetBox();
  }).catch(error=>snippetToast(error.message||'备份导入失败','error'));
}
function snippetExportCss(spec){
  const raw=cssSpecSource(spec);
  download('data:text/css;charset=utf-8,'+encodeURIComponent(raw),cssTemplateName(spec.id,spec.name)+'.css');
}
function snippetImportCss(file){
  if(!file)return;
  cssReadFile(file).then(text=>{
    const spec=cssClean(text);
    const prior=cssEntries()[spec.id];
    if(prior&&JSON.stringify(prior)!==JSON.stringify(spec)
      &&!window.confirm('已存在同名模板「'+spec.name+'」。确定覆盖吗？'))return;
    cssEntries()[spec.id]=spec;
    if(store().cssHidden)delete store().cssHidden[spec.id];
    persist();snippetToast('已导入模板：'+spec.name,'success');renderSnippetBox();
  }).catch(error=>snippetToast(error.message||'CSS 导入失败','error'));
}
function snippetMergePlan(ids,picking=false){
  const all=snippetStore();
  const records=ids.map(id=>typeof id==='object'?id:(picking?snippetMarks.find(item=>item.id===id):all.find(item=>item.id===id))).filter(Boolean);
  if(records.length<2){snippetToast('至少选择两句才能合并');return null;}
  const keys=new Set(records.map(item=>snippetRoleOf(item).key));
  if(keys.size!==1){snippetToast('请先选择同一角色的句子合并，避免角色归属混乱','error');return null;}

  const currentChat=snippetChatIdentity();
  const sourceCache=new Map(),positions=new Map();
  const sourceFor=item=>{
    if(item.messageId==null||item.sourceChat!==currentChat||!snippetMessageEligible(item.messageId))return null;
    if(sourceCache.has(item.messageId))return sourceCache.get(item.messageId);
    const body=document.querySelector('#chat .mes[mesid="'+item.messageId+'"] .mes_text');
    const source=body?snippetNodeText(body):null;
    sourceCache.set(item.messageId,source);
    return source;
  };
  // Prefer checked message-global offsets, then a UNIQUE match in the live
  // message for old favorites. Repeated quotes are ambiguous, so don't guess.
  for(const item of records){
    const parsed=sourceFor(item);
    if(parsed==null)continue;
    const full=parsed.full;
    if(item.sourceOffsetMode==='message'&&Number.isInteger(item.sourceStart)
      &&Number.isInteger(item.sourceEnd)&&item.sourceStart>=0&&item.sourceEnd<=full.length
      &&normalize(full.slice(item.sourceStart,item.sourceEnd))===normalize(item.text)){
      positions.set(item.id,{start:item.sourceStart,end:item.sourceEnd,full,parsed});
      continue;
    }
    const at=full.indexOf(item.text);
    if(at>=0 && full.indexOf(item.text,at+1)<0)
      positions.set(item.id,{start:at,end:at+item.text.length,full,parsed});
  }
  records.sort((a,b)=>{
    const sameChat=a.sourceChat===b.sourceChat&&a.sourceChat===currentChat;
    if(sameChat&&a.messageId===b.messageId&&a.messageId!=null){
      const x=positions.get(a.id),y=positions.get(b.id);
      if(x&&y&&x.start!==y.start)return x.start-y.start;
      if(a.sourceOffsetMode==='message'&&b.sourceOffsetMode==='message'
        &&Number.isInteger(a.sourceStart)&&Number.isInteger(b.sourceStart)
        &&a.sourceStart!==b.sourceStart)return a.sourceStart-b.sourceStart;
    }
    // For multiple known messages in the current chat, use chronological
    // message order rather than the order in which they were bookmarked.
    if(sameChat&&a.messageId!=null&&b.messageId!=null&&a.messageId!==b.messageId
      &&sourceFor(a)!=null&&sourceFor(b)!=null)return a.messageId-b.messageId;
    return (Number(a.savedAt)||0)-(Number(b.savedAt)||0);
  });
  const parts=[];
  let lastIncluded=null;
  // Two independently picked excerpts may cover some of the same source
  // characters. Appending each excerpt verbatim repeats those characters.
  // Deduplicate ONLY verified overlapping intervals in the SAME message;
  // identical prose from distinct locations or other messages is intentional.
  for(const item of records){
    const current=positions.get(item.id);
    const previous=lastIncluded;
    const before=previous&&positions.get(previous.id);
    const sameMessage=previous&&previous.messageId!=null
      &&item.messageId===previous.messageId&&item.sourceChat===previous.sourceChat;
    let fragment=current?snippetParagraphSlice(current.parsed,current.start,current.end):item.text;
    let separator='';
    if(sameMessage&&before&&current&&before.full===current.full){
      if(current.start<before.end){
        // A nested quote is already part of the longer selection.
        if(current.end<=before.end)continue;
        // Partial overlap: take only the not-yet-included tail, NOT the
        // characters between unrelated, nonoverlapping saved selections.
        fragment=snippetParagraphSlice(current.parsed,before.end,current.end);
      }else{
        // Preserve the source gap's *type* without copying unselected text.
        separator=snippetGapSeparator(current.parsed,before.end,current.start);
      }
    }else if(previous){
      if(!sameMessage)separator='\n\n';
      else if(previous.sourceOffsetMode==='message'&&item.sourceOffsetMode==='message'
        &&previous.sourceParagraphFormat===2&&item.sourceParagraphFormat===2
        &&Number.isInteger(previous.sourceParagraphEnd)&&Number.isInteger(item.sourceParagraphStart)){
        separator=previous.sourceParagraphEnd!==item.sourceParagraphStart?'\n\n':'\n';
      }else{
        separator='\n'; // legacy/offline: retain line break, do not guess a paragraph
      }
    }
    if(!parts.length)separator='';
    if(fragment){
      parts.push(separator+fragment);
      lastIncluded=item;
    }
  }
  return {records,proposal:parts.join(''),picking};
}
function snippetOpenMergeEditor(plan){
  snippetMergeEditor?.remove();
  const overlay=document.createElement('div');overlay.id='pk-snip-merge-overlay';
  if(snippetBox){
    overlay.style.setProperty('--sn-accent',snippetBox.style.getPropertyValue('--sn-accent'));
    overlay.style.setProperty('--sn-accent-fg',snippetBox.style.getPropertyValue('--sn-accent-fg'));
  }
  const modal=snippetMake('div','pk-snip-merge-modal');
  modal.append(snippetMake('h3','','合并句子'),snippetMake('p','pk-snip-help','确认最终文字后保存为一条收藏。你可以调整文字和段落。'));
  const editor=document.createElement('textarea');editor.className='pk-snip-merge-text';editor.value=plan.proposal;
  modal.appendChild(editor);
  const buttons=snippetMake('div','pk-snip-merge-actions');
  buttons.append(snippetButton('取消',()=>{if(plan.fromSelection)repoSelectionMergeDrafts.length=0;overlay.remove();snippetMergeEditor=null;},'pk-snip-soft'),
    snippetButton('保存合并',()=>{
      const value=normalizeParagraphs(editor.value).trim();
      if(!value){snippetToast('合并后的文字不能为空','error');return;}
      if(value.length>SNIPPET_MAX_TEXT_LENGTH){snippetToast('合并文字不能超过 10000 字符','error');return;}
      const ids=new Set(plan.records.map(x=>x.id));
      const existing=snippetStore(),first=plan.records[0];
      const remaining=existing.filter(x=>!ids.has(x.id));
      if(remaining.length+1>SNIPPET_MAX_ITEMS){
        snippetToast('收藏已满 5000 句，请先清理后再合并','error');return;
      }
      const survivor={...first,text:value,savedAt:Math.min(...plan.records.map(x=>Number(x.savedAt)||Date.now()))};
      for(const key of ['ranges','body','start','end','newlyAdded'])delete survivor[key];
      delete survivor.canvasSoftBreaks; // Drop obsolete hints from older favorites.
      const sameMessage=first.messageId!=null && plan.records.every(x=>x.messageId===first.messageId&&x.sourceChat===first.sourceChat);
      if(!sameMessage){
        // Mixed-source text is a new composition, not a quote from the first
        // message. Keep role attribution, but never retain a false message ID.
        survivor.messageId=null;
        if(!plan.records.every(x=>x.sourceChat===first.sourceChat))survivor.sourceChat='';
      }
      // A composed sentence is not necessarily a contiguous span: some
      // sentences between its sources may have intentionally been skipped.
      // Keeping the min/max offset would misrepresent future selections.
      delete survivor.sourceStart;
      delete survivor.sourceEnd;
      delete survivor.sourceOffsetMode;
      delete survivor.sourceParagraphStart;
      delete survivor.sourceParagraphEnd;
      delete survivor.sourceParagraphFormat;
      const duplicate=existing.some(x=>!ids.has(x.id)&&snippetRecordKey(x)===snippetRecordKey({...first,text:value}));
      if(duplicate){snippetToast('已经收藏过相同的合并文字','error');return;}
      store().pickedSentences=[survivor,...remaining];
      for(const id of ids)snippetChosen.delete(id);
      persist();overlay.remove();snippetMergeEditor=null;
      if(plan.fromSelection)repoSelectionMergeDrafts.length=0;
      if(plan.picking){
        repoSelectionMergeDrafts.length=0;
        const markGroup=snippetMarks.filter(x=>ids.has(x.id));
        const shared=markGroup[0];
        for(let i=snippetMarks.length-1;i>=0;i--)if(ids.has(snippetMarks[i].id))snippetMarks.splice(i,1);
        if(shared){
          const combined={...shared,id:survivor.id,text:survivor.text,
            messageId:survivor.messageId,ranges:markGroup.flatMap(x=>x.ranges||[])};
          if(combined.ranges.length)snippetMarks.push(combined);
        }
        snippetUpdatePickCount();snippetScheduleMarks();
      }else snippetRenderList(snippetBox?.querySelector('.pk-snip-list'));
      snippetToast('已合并成一条收藏','success');
    },'pk-snip-primary'));
  modal.appendChild(buttons);overlay.appendChild(modal);
  overlay.addEventListener('click',e=>{if(e.target===overlay){if(plan.fromSelection)repoSelectionMergeDrafts.length=0;overlay.remove();snippetMergeEditor=null;}});
  document.body.appendChild(overlay);snippetMergeEditor=overlay;
  editor.focus();
}
function snippetMergeFromPicking(){
  const plan=snippetMergePlan(snippetMarks.map(x=>x.id),true);
  if(plan)snippetOpenMergeEditor(plan);
}
function snippetMergeFromLibrary(){
  const plan=snippetMergePlan([...snippetChosen],false);
  if(plan)snippetOpenMergeEditor(plan);
}

function snippetRenderLibrary(area){
  // Search is at the top of the page, before any collecting controls.
  const filters=snippetMake('div','pk-snip-filters');
  const input=document.createElement('input');input.type='search';
  input.placeholder='搜索句子、角色';input.setAttribute('aria-label','搜索句子或角色');
  input.value=snippetSearch;
  input.oninput=()=>{snippetSearch=input.value;snippetVisibleCounts.clear();snippetRenderList(area.querySelector('.pk-snip-list'));};
  const choose=document.createElement('select');choose.setAttribute('aria-label','按角色筛选');
  const known=new Map();
  for(const item of snippetStore().filter(item=>item&&typeof item.text==='string')){const role=snippetRoleOf(item);known.set(role.key,role.name);}
  for(const [id,name] of [['all','全部角色'],...known.entries()]){
    const option=document.createElement('option');option.value=id;option.textContent=name;choose.appendChild(option);
  }
  if(![...choose.options].some(o=>o.value===snippetFilter))snippetFilter='all';
  choose.value=snippetFilter;
  choose.onchange=()=>{snippetFilter=choose.value;snippetVisibleCounts.clear();snippetRenderList(area.querySelector('.pk-snip-list'));};
  filters.append(input,choose);area.appendChild(filters);
  const toolbar=snippetMake('div','pk-snip-toolbar');
  toolbar.append(snippetButton('＋ 拾取句子',startSnippetPicking,'pk-snip-primary'),
    snippetButton('手动添加',()=>{snippetView='manual';renderSnippetBox();},'pk-snip-soft'));
  area.appendChild(toolbar);
  const list=snippetMake('div','pk-snip-list');area.appendChild(list);
  const footer=snippetMake('footer','pk-snip-footer');
  footer.appendChild(snippetMake('span','pk-snip-selected'));
  const actions=snippetMake('div','pk-snip-footer-actions');
  const merge=snippetButton('合并选中',snippetMergeFromLibrary,'pk-snip-merge');
  const del=snippetButton('删除',()=>{
    if(!snippetChosen.size)return;
    if(!window.confirm('删除选中的 '+snippetChosen.size+' 句？此操作无法撤销。'))return;
    store().pickedSentences=snippetStore().filter(x=>!snippetChosen.has(x.id));
    snippetChosen.clear();persist();snippetRenderList(list);
  },'pk-snip-danger');
  actions.append(merge,del);footer.appendChild(actions);area.appendChild(footer);
  snippetRenderList(list);
}
function snippetRenderList(list){
  if(!list)return;
  list.replaceChildren();
  const records=snippetStore().filter(item=>item&&typeof item.text==='string'&&(snippetFilter==='all'||snippetRoleOf(item).key===snippetFilter)
    &&(!snippetSearch||item.text.toLowerCase().includes(snippetSearch.toLowerCase())
    ||snippetRoleOf(item).name.toLowerCase().includes(snippetSearch.toLowerCase())));
  const grouped=new Map();
  for(const item of records){const role=snippetRoleOf(item);if(!grouped.has(role.key))grouped.set(role.key,{role,items:[]});grouped.get(role.key).items.push(item);}
  if(!records.length)list.appendChild(snippetMake('div','pk-snip-empty',snippetStore().length?'没有找到相关句子':'尚无收藏。点「拾取句子」开始保存。'));
  for(const {role,items} of grouped.values()){
    const group=snippetMake('section','pk-snip-role-group');
    const head=snippetButton(' ',()=>{
      if(snippetCollapsed.has(role.key))snippetCollapsed.delete(role.key);else snippetCollapsed.add(role.key);
      const folded=snippetCollapsed.has(role.key);
      group.classList.toggle('is-collapsed',folded);
      head.setAttribute('aria-expanded',String(!folded));
      const value=store().snippetCollapsedRoles||[];
      store().snippetCollapsedRoles=folded?[...new Set([...value,role.key])]:value.filter(x=>x!==role.key);
      persist();
    },'pk-snip-role-heading');
    const currentFolded=snippetCollapsed.has(role.key);
    group.classList.toggle('is-collapsed',currentFolded);
    head.setAttribute('aria-expanded',String(!currentFolded));
    head.append(snippetAvatarElement(role),snippetMake('strong','',role.name),snippetMake('span','pk-snip-muted',items.length+' 句'),snippetMake('i','pk-snip-chevron'));
    group.appendChild(head);
    const content=snippetMake('div','pk-snip-role-content');
    const visibleCount=snippetVisibleCounts.get(role.key)||SNIPPET_PAGE_SIZE;
    for(const item of items.slice(0,visibleCount)){
      const card=snippetMake('div','pk-snip-card'+(snippetChosen.has(item.id)?' is-selected':''));
      const text=snippetButton('',()=>{snippetDetailId=item.id;snippetView='detail';renderSnippetBox();},'pk-snip-card-content');
      text.appendChild(snippetMake('span','pk-snip-card-quote',item.text));
      const meta=snippetMake('span','pk-snip-card-meta');
      meta.textContent=snippetLabelTime(item);
      text.appendChild(meta);
      const check=snippetButton(snippetChosen.has(item.id)?'✓':'',()=>{
        if(snippetChosen.has(item.id))snippetChosen.delete(item.id);else snippetChosen.add(item.id);
        card.classList.toggle('is-selected',snippetChosen.has(item.id));
        check.textContent=snippetChosen.has(item.id)?'✓':'';snippetUpdateSelectionFooter();
      },'pk-snip-check');check.setAttribute('aria-label','选择此句');
      card.append(text,check);content.appendChild(card);
    }
    if(items.length>visibleCount){
      const more=snippetButton('显示更多（剩余 '+(items.length-visibleCount)+' 句）',()=>{
        const scroll=list.scrollTop;
        snippetVisibleCounts.set(role.key,visibleCount+SNIPPET_PAGE_SIZE);
        snippetRenderList(list);list.scrollTop=scroll;
      },'pk-snip-small');
      more.style.cssText='display:block;margin:10px auto 15px;padding:10px 14px;';
      content.appendChild(more);
    }
    group.appendChild(content);list.appendChild(group);
  }
  snippetUpdateSelectionFooter();
}
function snippetUpdateSelectionFooter(){
  if(!snippetBox)return;
  const count=snippetBox.querySelector('.pk-snip-selected');
  if(count)count.textContent=snippetChosen.size?'已选 '+snippetChosen.size+' 句':'共收藏 '+snippetStore().length+' 句';
  const del=snippetBox.querySelector('.pk-snip-danger');if(del)del.hidden=!snippetChosen.size;
  const merge=snippetBox.querySelector('.pk-snip-merge');if(merge)merge.hidden=snippetChosen.size<2;
}
function snippetRenderDetail(area){
  const item=snippetStore().find(x=>x.id===snippetDetailId);
  if(!item){snippetView='library';renderSnippetBox();return;}
  const role=snippetRoleOf(item);
  area.appendChild(snippetButton('‹ 返回收藏',()=>{snippetView='library';renderSnippetBox();},'pk-snip-back'));
  const card=snippetMake('div','pk-snip-detail-card');
  const head=snippetMake('div','pk-snip-role-heading');
  head.append(snippetAvatarElement(role),snippetMake('strong','',role.name),snippetMake('span','pk-snip-muted',snippetLabelTime(item)));
  card.append(head,snippetMake('div','pk-snip-detail-text',item.text));area.appendChild(card);
  const actions=snippetMake('div','pk-snip-detail-actions');
  actions.appendChild(snippetButton('repo 美化',()=>{
    const id=snippetDraftMessageId(item);
    if(id===null){snippetToast('当前聊天找不到可用的来源消息，请切换聊天或复制文字','error');return;}
    const text=normalizeParagraphs(item.text||'');
    closeSnippetBox();openById(id,text);
  },'pk-snip-primary'));
  actions.appendChild(snippetButton('复制文字',async()=>{
    try{
      if(window.navigator.clipboard?.writeText)await window.navigator.clipboard.writeText(item.text);
      else{
        const box=document.createElement('textarea');box.value=item.text;
        box.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
        document.body.appendChild(box);box.focus();box.select();
        const ok=document.execCommand?.('copy');box.remove();
        if(!ok)throw Error('当前环境不支持复制');
      }
      snippetToast('已复制','success');
    }catch(error){snippetToast(error.message||'复制失败','error');}
  },'pk-snip-soft'));
  actions.appendChild(snippetButton('删除',()=>{
    if(!window.confirm('确定删除这条收藏？'))return;
    store().pickedSentences=snippetStore().filter(x=>x.id!==item.id);
    snippetChosen.delete(item.id);persist();snippetView='library';renderSnippetBox();
  },'pk-snip-danger-outline'));
  area.appendChild(actions);
}
function snippetField(title,node){
  const row=snippetMake('label','pk-snip-field');row.appendChild(snippetMake('span','',title));row.appendChild(node);return row;
}
function snippetInput(type,value,onChange){
  const el=document.createElement('input');el.type=type;el.value=value;el.oninput=()=>onChange(el.value);return el;
}
function snippetRenderSettings(area){
  const p=snippetPrefs();
  area.appendChild(snippetButton('‹ 返回收藏',()=>{snippetView='library';renderSnippetBox();},'pk-snip-back'));
  area.appendChild(snippetMake('h3','pk-snip-section-title','外观'));
  const themes=snippetMake('div','pk-snip-segments');
  for(const [value,label] of [['auto','跟随系统'],['light','日间'],['dark','夜间']]){
    themes.appendChild(snippetButton(label,()=>{p.theme=value;persist();snippetApplyAppearance();
      for(const btn of themes.children)btn.classList.toggle('is-active',btn.dataset.value===value);
    },'pk-snip-segment'+(p.theme===value?' is-active':'')));
    themes.lastChild.dataset.value=value;
  }
  area.appendChild(themes);
  area.appendChild(snippetField('日间面板底色',snippetInput('color',p.lightBg,value=>{p.lightBg=value;persist();snippetApplyAppearance();})));
  area.appendChild(snippetField('夜间面板底色',snippetInput('color',p.darkBg,value=>{p.darkBg=value;persist();snippetApplyAppearance();})));
  area.appendChild(snippetField('强调颜色',snippetInput('color',p.accent,value=>{p.accent=value;persist();snippetApplyAppearance();})));
  area.appendChild(snippetField('点句高亮颜色',snippetInput('color',p.highlight,value=>{p.highlight=value;persist();})));
  area.appendChild(snippetMake('h3','pk-snip-section-title','调整面板'));
  const slider=(label,key,min,max,unit)=>{
    const input=snippetInput('range',p[key],value=>{p[key]=Number(value);valueEl.textContent=value+unit;persist();snippetApplyAppearance();});
    input.min=min;input.max=max;input.step='1';
    const row=snippetMake('div','pk-snip-slider');
    const labelEl=snippetMake('span','',label),valueEl=snippetMake('b','',p[key]+unit);
    row.append(labelEl,input,valueEl);return row;
  };
  area.append(slider('文字大小','fontSize',12,20,'px'),slider('面板高度','panelHeight',60,94,'vh'),slider('面板宽度','panelWidth',78,99,'vw'));
  const density=snippetMake('div','pk-snip-segments');
  for(const [value,label] of [['normal','标准间距'],['compact','紧凑间距']]){
    const b=snippetButton(label,()=>{p.density=value;persist();snippetApplyAppearance();
      for(const child of density.children)child.classList.toggle('is-active',child.dataset.value===value);
    },'pk-snip-segment'+(p.density===value?' is-active':''));b.dataset.value=value;density.appendChild(b);
  }area.appendChild(density);
  area.appendChild(snippetMake('h3','pk-snip-section-title','收藏悬浮图标'));
  const shortcut=document.createElement('input');shortcut.type='checkbox';
  shortcut.checked=p.tapShortcut!==false;
  shortcut.setAttribute('aria-label','显示收藏悬浮图标');
  shortcut.onchange=()=>{p.tapShortcut=shortcut.checked;persist();syncSnippetTapHandle();};
  area.appendChild(snippetField('显示悬浮图标',shortcut));
  const preview=snippetMake('div','pk-snip-icon-preview');
  const refreshPreview=()=>{
    preview.replaceChildren();
    if(typeof p.iconImage==='string'&&p.iconImage){
      const img=document.createElement('img');img.alt='当前悬浮图标';img.src=p.iconImage;
      img.onerror=()=>{preview.textContent='图片无法加载，请更换文件或链接';};
      preview.appendChild(img);
    }else preview.appendChild(snippetMake('span','pk-snip-muted','默认书签图标（可换成任意比例图片）'));
  };
  refreshPreview();area.appendChild(preview);
  const fileInput=document.createElement('input');fileInput.type='file';
  fileInput.accept='image/png,image/jpeg,image/webp,image/gif,image/svg+xml';fileInput.hidden=true;
  fileInput.onchange=()=>{
    const file=fileInput.files?.[0];fileInput.value='';if(!file)return;
    if(!file.type.startsWith('image/')||file.size>3*1024*1024){snippetToast('请选择 3 MB 以内的图片','error');return;}
    const reader=new window.FileReader();
    reader.onload=()=>{
      if(typeof reader.result!=='string'||!reader.result.startsWith('data:image/'))return snippetToast('无法读取图片','error');
      p.iconImage=reader.result;persist();syncSnippetTapHandle();refreshPreview();urlInput.value='';snippetToast('图标已保存','success');
    };
    reader.onerror=()=>snippetToast('读取图标失败','error');reader.readAsDataURL(file);
  };
  area.appendChild(fileInput);
  const iconActions=snippetMake('div','pk-snip-icon-choices');
  iconActions.append(snippetButton('上传图片',()=>fileInput.click(),'pk-snip-soft'),
    snippetButton('恢复默认图标',()=>{p.iconImage='';persist();syncSnippetTapHandle();refreshPreview();urlInput.value='';},'pk-snip-soft'));
  area.appendChild(iconActions);
  const urlInput=snippetInput('url',typeof p.iconImage==='string'&&p.iconImage.startsWith('http')?p.iconImage:'',()=>{});
  urlInput.onchange=()=>{
    const url=urlInput.value.trim();
    if(!url){if(typeof p.iconImage==='string'&&p.iconImage.startsWith('http')){p.iconImage='';persist();syncSnippetTapHandle();refreshPreview();}return;}
    if(!/^https?:\/\//i.test(url))return;
    p.iconImage=url;persist();syncSnippetTapHandle();refreshPreview();
  };
  urlInput.placeholder='也可以粘贴图片链接（https://…）';urlInput.className='pk-snip-icon-input';
  area.appendChild(urlInput);
  const sz=snippetMake('div','pk-snip-slider');
  const sizeInput=snippetInput('range',p.iconSize,value=>{
    p.iconSize=Number(value);sizeValue.textContent=value+'px';persist();syncSnippetTapHandle();
  });
  sizeInput.min='28';sizeInput.max='120';sizeInput.step='2';
  const sizeValue=snippetMake('b','',p.iconSize+'px');
  sz.append(snippetMake('span','','图标大小'),sizeInput,sizeValue);area.appendChild(sz);
  area.appendChild(snippetButton('重置悬浮位置',()=>{
    p.floatX=null;p.floatY=null;persist();syncSnippetTapHandle();snippetToast('位置已重置','success');
  },'pk-snip-soft'));
  area.appendChild(snippetMake('p','pk-snip-help','点悬浮图标进入或退出选择模式。点句只标记，之后再选择「收藏 / 合并 / repo 美化」，不会自动保存。拖动图标只改变位置，不会选句。'));
  area.appendChild(snippetMake('h3','pk-snip-section-title','划线美化'));
  const selectionToggle=document.createElement('input');selectionToggle.type='checkbox';
  selectionToggle.checked=p.selectionShortcut!==false;
  selectionToggle.setAttribute('aria-label','划线显示收藏与 repo 美化选项');
  selectionToggle.onchange=()=>{p.selectionShortcut=selectionToggle.checked;persist();if(!selectionToggle.checked)hideRepoSelection();};
  area.appendChild(snippetField('划线后显示收藏 / repo 美化',selectionToggle));
  area.appendChild(snippetMake('p','pk-snip-help','划线或用悬浮球点句后，可以选择「收藏 / 合并 / repo 美化」；单纯选中不会收藏。再次点击悬浮球立即退出选择模式。'));
  area.appendChild(snippetMake('h3','pk-snip-section-title','数据管理'));
  const actions=snippetMake('div','pk-snip-settings-actions');
  actions.append(snippetButton('导出完整插件数据',snippetExportData,'pk-snip-soft'),snippetButton('导入完整插件数据',()=>snippetBox?.querySelector('[data-snip-file="data"]')?.click(),'pk-snip-soft'));
  area.appendChild(actions);
  const importSelect=document.createElement('select');
  for(const [id,label] of [['merge','合并（保留现有设置）'],['replace','替换（完整恢复备份）']]){const o=document.createElement('option');o.value=id;o.textContent=label;importSelect.append(o);}
  importSelect.value=snippetImportMode;importSelect.onchange=()=>{snippetImportMode=importSelect.value;};
  area.appendChild(snippetField('导入方式',importSelect));
  area.appendChild(snippetMake('p','pk-snip-help','完整备份包括 CSS 模板、打孔预设、作者等编辑设置、收藏句子及面板设置。不包含聊天全文或插件脚本本身。导入时推荐先备份当前数据。'));
  area.appendChild(snippetButton('清空全部收藏',()=>{
    if(!snippetStore().length)return snippetToast('收藏匣已为空');
    if(!window.confirm('确认清空全部 '+snippetStore().length+' 句收藏？此操作不可撤销。\n建议先导出备份。'))return;
    store().pickedSentences=[];snippetChosen.clear();persist();snippetToast('已清空收藏','success');renderSnippetBox();
  },'pk-snip-danger-outline'));
  area.appendChild(snippetButton('清空整个插件数据',()=>{
    if(!window.confirm('这会清空打孔海报的全部收藏、CSS 模板、预设、编辑信息和外观设置。请先导出完整备份。继续吗？'))return;
    if(!window.confirm('最后确认：所有打孔海报插件设置都将恢复初始状态，且无法撤销。确定清空？'))return;
    const state=store();
    for(const key of Object.keys(state))delete state[key];
    state.cur=clone(BASE);state.tpl={};state.sigTpl={};state.cssTpl={};state.cssHidden={};
    state.pickedSentences=[];state.snippetPrefs=clone(snippetDefaultPrefs);
    snippetChosen.clear();snippetCollapsed.clear();st.cssSignature='';
    persist();syncSnippetTapHandle();snippetToast('整个插件数据已清空','success');renderSnippetBox();
    if(st.ov){fillCssList();syncAll();schedule(true);}
  },'pk-snip-danger-outline pk-snip-wide'));

  area.appendChild(snippetMake('h3','pk-snip-section-title','模板'));
  const tplCount=Object.keys(cssEntries()).length;
  area.appendChild(snippetButton('管理已导入的 CSS 模板（'+tplCount+'） ›',()=>{snippetView='templates';renderSnippetBox();},'pk-snip-soft pk-snip-wide'));
}
function snippetRenderTemplates(area){
  area.appendChild(snippetButton('‹ 返回设置',()=>{snippetView='settings';renderSnippetBox();},'pk-snip-back'));
  const top=snippetMake('div','pk-snip-template-actions');
  top.appendChild(snippetButton('＋ 导入 CSS 模板',()=>snippetBox?.querySelector('[data-snip-file="css"]')?.click(),'pk-snip-soft'));
  area.appendChild(top);
  const records=Object.values(cssEntries());
  if(!records.length)area.appendChild(snippetMake('p','pk-snip-empty','暂无通过插件导入的 CSS 模板。原生打孔模板不在此列表中。'));
  for(const spec of records){
    const line=snippetMake('div','pk-snip-template-item');
    const name=snippetMake('div','pk-snip-template-name');
    name.append(snippetMake('strong','',cssTemplateName(spec.id,spec.name)),snippetMake('small','pk-snip-muted',spec.id));
    line.append(name,snippetButton('导出',()=>snippetExportCss(spec),'pk-snip-small'),
      snippetButton('删除',()=>{
        if(!window.confirm('删除 CSS 模板「'+spec.name+'」？\n建议先导出备份。'))return;
        delete cssEntries()[spec.id];
        if(cur().pageSkin==='css:'+spec.id)cur().pageSkin='punch';
        st.cssSignature='';persist();renderSnippetBox();
        if(st.ov){fillCssList();syncAll();schedule(true);}
      },'pk-snip-small pk-snip-danger-outline'));
    area.appendChild(line);
  }
  area.appendChild(snippetMake('p','pk-snip-help','这里只管理插件保存的 CSS 模板，不会影响收藏句子，也不会修改原始聊天。'));
}
function snippetRenderManual(area){
  area.appendChild(snippetButton('‹ 返回收藏',()=>{snippetView='library';renderSnippetBox();},'pk-snip-back'));
  const editor=document.createElement('textarea');editor.rows=5;editor.placeholder='粘贴或输入想收藏的一句话';editor.className='pk-snip-manual-input';area.appendChild(editor);
  const roleSelect=document.createElement('select');roleSelect.className='pk-snip-manual-role';
  const current=snippetCurrentCharacter(null);
  const roles=new Map([[current.roleKey,current]]);
  roles.set('unclassified',{roleKey:'unclassified',roleName:'未分类',avatar:''});
  for(const item of snippetStore()){
    if(!item||typeof item.text!=='string')continue;
    const role=snippetRoleOf(item);roles.set(role.key,{roleKey:role.key,roleName:role.name,avatar:role.avatar});
  }
  for(const role of roles.values()){
    const o=document.createElement('option');o.value=role.roleKey;o.textContent=role.roleName;roleSelect.append(o);
  }
  area.append(snippetField('归属角色',roleSelect),snippetButton('加入收藏',()=>{
    if(!editor.value.trim())return snippetToast('先输入一句话');
    const role=roles.get(roleSelect.value);
    if(addPickedSentence(editor.value,null,role)){snippetView='library';renderSnippetBox();}
  },'pk-snip-primary pk-snip-wide'));
}
function renderSnippetBox(){
  if(!snippetBox)return;
  snippetApplyAppearance();
  const heading=snippetBox.querySelector('[data-snip-title]');
  if(heading)heading.textContent={library:'句子拾取匣',detail:'句子详情',manual:'手动添加',settings:'设置',templates:'模板管理'}[snippetView]||'句子拾取匣';
  const settings=snippetBox.querySelector('[data-snip="settings"]');
  if(settings)settings.hidden=snippetView==='settings';
  const area=snippetBox.querySelector('.pk-snip-area');area.replaceChildren();
  area.classList.toggle('pk-snip-scrolling',snippetView!=='library');
  if(snippetView==='detail')snippetRenderDetail(area);
  else if(snippetView==='manual')snippetRenderManual(area);
  else if(snippetView==='settings')snippetRenderSettings(area);
  else if(snippetView==='templates')snippetRenderTemplates(area);
  else snippetRenderLibrary(area);
}
const snippetSystemTheme=window.matchMedia?.('(prefers-color-scheme: dark)');
const snippetSystemThemeChanged=()=>{if(snippetBox&&snippetPrefs().theme==='auto')snippetApplyAppearance();};
snippetSystemTheme?.addEventListener?.('change',snippetSystemThemeChanged);
function openSnippetBox(){
  if(snippetPicking)stopSnippetPicking(false);
  closeSnippetBox();
  snippetView='library';snippetDetailId=null;
  snippetCollapsed.clear();snippetVisibleCounts.clear();
  for(const key of store().snippetCollapsedRoles||[])snippetCollapsed.add(key);
  snippetBox=document.createElement('div');snippetBox.id='pk-snip-overlay';
  snippetBox.innerHTML=`<div class="pk-snip-modal" role="dialog" aria-modal="true" aria-label="句子拾取匣">
    <header class="pk-snip-head"><button type="button" data-snip="close" aria-label="关闭">×</button><strong data-snip-title>句子拾取匣</strong><button type="button" data-snip="settings" aria-label="设置">设置</button></header>
    <main class="pk-snip-area"></main>
    <input type="file" data-snip-file="data" accept="application/json,.json" hidden>
    <input type="file" data-snip-file="css" accept="text/css,.css" hidden>
  </div>`;
  snippetBox.querySelector('[data-snip="close"]').onclick=closeSnippetBox;
  snippetBox.querySelector('[data-snip="settings"]').onclick=()=>{snippetView='settings';renderSnippetBox();};
  const backup=snippetBox.querySelector('[data-snip-file="data"]');
  backup.onchange=()=>{const f=backup.files[0];backup.value='';snippetImportData(f);};
  const css=snippetBox.querySelector('[data-snip-file="css"]');
  css.onchange=()=>{const f=css.files[0];css.value='';snippetImportCss(f);};
  snippetBox.addEventListener('click',e=>{if(e.target===snippetBox)closeSnippetBox();});
  document.body.appendChild(snippetBox);renderSnippetBox();
}

function ensureRepoWandMenu() {
  const menu=document.querySelector('#extensionsMenu');
  if(!menu)return false;
  let row=menu.querySelector('#pk-wand');
  if(row)return true;
  row=document.createElement('div');
  row.id='pk-wand';
  row.className='extension_container interactable';
  row.setAttribute('role','button');
  row.setAttribute('tabindex','0');
    row.title='打开句子拾取匣；无需选中文字，不自动读取整楼';
  row.style.cssText='display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;min-height:36px;';
  row.innerHTML='<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span>repo美化</span>';
   const launch=()=>{
     openSnippetBox();
   };
  row.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();launch();});
  row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();launch();}});
  menu.appendChild(row);
  return true;
}

// One tap toggles sentence picking; only moving the floating artwork uses dragging.
// No text selection listeners, no drag-to-collect gesture, and no shape mask.
let snippetTapHandle=null, snippetTapIconRendered=null, snippetTapMoved=false;
function snippetPositionHandle(){
  if(!snippetTapHandle)return;
  const p=snippetPrefs(),el=snippetTapHandle;
  if(Number.isFinite(p.floatX)&&Number.isFinite(p.floatY)){
    const rect=el.getBoundingClientRect();
    const w=rect.width||46,h=rect.height||46;
    const x=Math.max(4,Math.min(window.innerWidth-w-4,p.floatX*window.innerWidth-w/2));
    const y=Math.max(4,Math.min(window.innerHeight-h-4,p.floatY*window.innerHeight-h/2));
    el.style.left=x+'px';el.style.top=y+'px';el.style.right='auto';el.style.bottom='auto';
  }else{el.style.left='';el.style.top='';el.style.right='';el.style.bottom='';}
}
function syncSnippetTapHandle(){
  if(!snippetTapHandle)return;
  const p=snippetPrefs(),enabled=p.tapShortcut!==false;
  snippetTapHandle.hidden=!enabled;
  const active=snippetPicking&&snippetTapFromFloating;
  snippetTapHandle.classList.toggle('is-active',active);
  snippetTapHandle.setAttribute('aria-pressed',String(active));
  snippetTapHandle.setAttribute('aria-label',active?'退出选择模式':'开启点句选择模式');
  snippetTapHandle.title=active?'点击退出选择模式':'点击进入句子选择模式（拖动可调整位置）';
  const image=typeof p.iconImage==='string'?p.iconImage.trim():'';
  if(snippetTapIconRendered!==image){
    snippetTapIconRendered=image;
    snippetTapHandle.replaceChildren();
    if(image&&(/^(?:https?:\/\/|data:image\/)/i).test(image)){
      const img=document.createElement('img');img.className='pk-snip-custom-icon';img.alt='';img.src=image;
      img.onerror=()=>{img.remove();const fallback=document.createElement('span');fallback.className='pk-snip-default-icon';fallback.innerHTML='<i class="fa-regular fa-bookmark" aria-hidden="true"></i>';snippetTapHandle?.appendChild(fallback);};
      snippetTapHandle.appendChild(img);
    }else{
      const fallback=document.createElement('span');fallback.className='pk-snip-default-icon';
      fallback.innerHTML='<i class="fa-regular fa-bookmark" aria-hidden="true"></i>';
      snippetTapHandle.appendChild(fallback);
    }
  }
  snippetTapHandle.style.setProperty('--pk-snip-icon-size',Math.max(28,Math.min(120,Number(p.iconSize)||54))+'px');
  // Defer positioning until a newly loaded image has its actual intrinsic size.
  snippetPositionHandle();
  const img=snippetTapHandle.querySelector('img');
  if(img&&!img.complete)img.onload=snippetPositionHandle;
  if(!enabled&&active)stopSnippetPicking(false);
}
function initSnippetTapHandle(){
  snippetTapHandle=document.createElement('button');
  snippetTapHandle.id='pk-snip-tap-handle';snippetTapHandle.type='button';
  snippetTapHandle.className='';
  let drag=null;
  snippetTapHandle.addEventListener('pointerdown',e=>{
    if(e.button!==undefined&&e.button!==0)return;
    const r=snippetTapHandle.getBoundingClientRect();
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,left:r.left,top:r.top,moved:false};
    snippetTapMoved=false;
    try{snippetTapHandle.setPointerCapture(e.pointerId);}catch(_){ }
  });
  snippetTapHandle.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<9)return;
    drag.moved=true;snippetTapMoved=true;
    snippetTapHandle.classList.add('is-moving');
    const w=snippetTapHandle.offsetWidth,h=snippetTapHandle.offsetHeight;
    const x=Math.max(4,Math.min(window.innerWidth-w-4,drag.left+e.clientX-drag.startX));
    const y=Math.max(4,Math.min(window.innerHeight-h-4,drag.top+e.clientY-drag.startY));
    snippetTapHandle.style.left=x+'px';snippetTapHandle.style.top=y+'px';
    snippetTapHandle.style.right='auto';snippetTapHandle.style.bottom='auto';
    e.preventDefault();
  });
  const endDrag=e=>{
    if(!drag||e.pointerId!==drag.id)return;
    if(drag.moved){
      const r=snippetTapHandle.getBoundingClientRect(),p=snippetPrefs();
      p.floatX=Math.max(0,Math.min(1,(r.left+r.width/2)/window.innerWidth));
      p.floatY=Math.max(0,Math.min(1,(r.top+r.height/2)/window.innerHeight));
      persist();
    }
    snippetTapHandle.classList.remove('is-moving');drag=null;
  };
  snippetTapHandle.addEventListener('pointerup',endDrag);
  snippetTapHandle.addEventListener('pointercancel',endDrag);
  snippetTapHandle.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    if(snippetTapMoved){snippetTapMoved=false;return;}
    if(snippetPicking){stopSnippetPicking(false);return;}
    if(!document.querySelector('#chat .mes[mesid]')){snippetToast('当前没有可收藏的消息');return;}
    startSnippetPicking({fromFloating:true});
  });
  document.body.appendChild(snippetTapHandle);syncSnippetTapHandle();
}

// Selection is a separate, optional shortcut to the existing editor. It does
// not change the user's native selection menu or save anything to the library.
let repoSelectionButton=null, repoSelectionTimer=0, repoSelectionRecord=null, repoSelectionPending=null;
let repoSelectionDismissed=null;
let repoSelectionTextPress=null, repoSelectionLastTap=null;
const repoSelectionMergeDrafts=[];
function repoSelectionContextValid(saved){
  const message=saved&&ctx().chat?.[saved.id];
  return !!message && snippetChatIdentity()===saved.chatKey
    && message===saved.message && snippetMessageEligible(saved.id);
}
function repoSelectionSameRange(a,b){
  const left=a?.range,right=b?.range;
  // A pending (lightweight) range has no text yet. Compare its DOM boundaries
  // so a dismissed Safari selection cannot reopen while debounce is waiting.
  return !!left&&!!right&&a.chatKey===b.chatKey&&a.id===b.id
    &&(a.text==null||b.text==null||a.text===b.text)
    &&left.startContainer===right.startContainer&&left.startOffset===right.startOffset
    &&left.endContainer===right.endContainer&&left.endOffset===right.endOffset;
}
function hideRepoSelection(){
  clearTimeout(repoSelectionTimer);repoSelectionTimer=0;
  repoSelectionPending=null;repoSelectionRecord=null;
  repoSelectionButton?.classList.remove('show');
}
// selectionchange may fire dozens of times a second while an iPhone selection
// handle is being dragged. This check must not walk/serialize message text.
function repoSelectionQuickRecord(){
  if(isOpen()||snippetPicking||snippetBox||snippetMergeEditor||snippetPrefs().selectionShortcut===false)return null;
  const sel=window.getSelection?.();
  if(!sel||sel.isCollapsed||!sel.rangeCount)return null;
  const range=sel.getRangeAt(0);
  const start=range.startContainer?.nodeType===1?range.startContainer:range.startContainer?.parentElement;
  const end=range.endContainer?.nodeType===1?range.endContainer:range.endContainer?.parentElement;
  const body=start?.closest?.('#chat .mes[mesid] .mes_text');
  if(!body||!body.contains(range.endContainer)||!body.contains(range.startContainer)
    ||!end?.closest?.('#chat .mes[mesid] .mes_text'))return null;
  const mes=body.closest('.mes[mesid]');
  const id=Number(mes?.getAttribute('mesid'));
  if(!Number.isInteger(id)||id<0||!snippetMessageEligible(id))return null;
  // Snapshot the Range before Safari collapses its visible Selection.
  return {id,body,range:range.cloneRange(),chatKey:snippetChatIdentity(),message:ctx().chat[id]};
}
function readRepoSelection(pending=null){
  const quick=pending||repoSelectionQuickRecord();
  if(!repoSelectionContextValid(quick)||!quick.body?.contains(quick.range.startContainer)
    ||!quick.body.contains(quick.range.endContainer))return null;
  // Full DOM traversal occurs once after debounce, not on selectionchange.
  const span=snippetRangeParagraphText(quick.range,quick.body);
  if(!span?.text)return null;
  return {id:quick.id,text:span.text,range:quick.range.cloneRange(),
    chatKey:quick.chatKey,message:quick.message};
}
function positionRepoSelection(record){
  if(!record||!repoSelectionButton)return false;
  const vv=window.visualViewport;
  const left=vv?.offsetLeft||0, top=vv?.offsetTop||0;
  const width=vv?.width||window.innerWidth, height=vv?.height||window.innerHeight;
  const rects=Array.from(record.range.getClientRects()).filter(r=>r.width>0&&r.height>0&&r.bottom>top&&r.top<top+height);
  // Anchor to the first selected line, not the last line of a multiline selection.
  const rect=rects[0]||record.range.getBoundingClientRect();
  // Safari can move the selected range briefly outside the visual viewport.
  // Clamp the action menu rather than closing it during handle dragging.
  if(!rect?.width)return false;
  const bw=repoSelectionButton.offsetWidth||220, bh=repoSelectionButton.offsetHeight||41;
  const x=Math.max(left+8,Math.min(left+width-bw-8,rect.left+rect.width/2-bw/2));
  // The native iOS selection toolbar usually sits just above the selected line.
  // Prefer our actions ABOVE that toolbar; never overlay the highlighted words.
  const nativeToolbarReserve=54;
  const aboveNative=rect.top-bh-nativeToolbarReserve;
  const aboveSelection=rect.top-bh-10;
  const belowSelection=rect.bottom+12;
  const y=aboveNative>=top+8?aboveNative
    :belowSelection+bh<=top+height-8?belowSelection
    :aboveSelection>=top+8?aboveSelection
    :Math.max(top+8,Math.min(top+height-bh-8,belowSelection));
  repoSelectionButton.style.left=Math.round(x)+'px';
  repoSelectionButton.style.top=Math.round(y)+'px';
  return true;
}
function ensureRepoSelectionButton(){
  if(repoSelectionButton)return;
  const menu=document.createElement('div');
  menu.id='pk-repo-selection';menu.setAttribute('role','group');
  menu.setAttribute('aria-label','选中文字操作');
  menu.innerHTML='<button type="button" data-repo-action="collect"><i class="fa-regular fa-bookmark" aria-hidden="true"></i>收藏</button><span class="pk-action-divider" aria-hidden="true"></span><button type="button" data-repo-action="merge"><i class="fa-solid fa-code-merge" aria-hidden="true"></i>合并</button><span class="pk-action-divider" aria-hidden="true"></span><button type="button" data-repo-action="beautify"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>repo 美化</button><button type="button" data-repo-action="clear-merge" hidden>清空(0)</button>';
  let lastPointer=0;
  const launch=(e,action)=>{
    e.preventDefault();e.stopPropagation();
    const saved=repoSelectionRecord;
    if(saved)repoSelectionDismissed=saved; // Ignore late Safari events for the consumed range.
    hideRepoSelection();
    // Clearing stale drafts must work even after their source was deleted.
    if(action==='clear-merge'){
      repoSelectionMergeDrafts.length=0;
      snippetToast('待合并句子已清空','success');
      return;
    }
    // The chat array can be reused in-place when SillyTavern switches chats.
    if(!repoSelectionContextValid(saved)){
      snippetToast('原消息已失效或聊天已切换，请重新选择','error');return;
    }
    if(action==='collect'){
      repoSelectionMergeDrafts.length=0;
      addPickedSentence(saved.text,saved.id,null,snippetSpanFromRange(saved.range));
      window.getSelection?.()?.removeAllRanges?.();
    }else if(action==='merge'){
      const span=snippetSpanFromRange(saved.range),role=snippetCurrentCharacter(saved.id);
      const parsed=span?.body?snippetNodeText(span.body):null,source=parsed?.full||'';
      if(repoSelectionMergeDrafts.some(v=>v.sourceChat!==snippetChatIdentity()))repoSelectionMergeDrafts.length=0;
      const draft={id:snippetNewId(),text:saved.text,messageId:saved.id,
        sourceChat:snippetChatIdentity(),roleKey:role.roleKey,roleName:role.roleName,
        avatar:role.avatar,savedAt:Date.now(),
        ...(span?{sourceStart:span.start,sourceEnd:span.end,sourceOffsetMode:'message'}:{})};
      if(span&&draft.sourceEnd<=source.length){
        draft.sourceParagraphStart=snippetParagraphIndex(parsed,draft.sourceStart);
        draft.sourceParagraphEnd=snippetParagraphIndex(parsed,Math.max(0,draft.sourceEnd-1));
        draft.sourceParagraphFormat=2;
      }
      if(repoSelectionMergeDrafts.some(v=>v.text===draft.text&&v.messageId===draft.messageId)){
        snippetToast('这句已经加入待合并');return;
      }
      repoSelectionMergeDrafts.push(draft);
      if(repoSelectionMergeDrafts.length<2)snippetToast('已暂存 1 句，再选下一句点「合并」');
      else {
        const plan=snippetMergePlan([...repoSelectionMergeDrafts],false);
        if(plan){plan.fromSelection=true;snippetOpenMergeEditor(plan);}
      }
    }else if(action==='beautify'){
      repoSelectionMergeDrafts.length=0;
      openById(saved.id,saved.text);
    }
  };
  menu.addEventListener('pointerdown',e=>{
    const target=e.target.closest?.('[data-repo-action]');
    if(!target)return;
    lastPointer=Date.now();launch(e,target.dataset.repoAction);
  });
  menu.addEventListener('click',e=>{
    const target=e.target.closest?.('[data-repo-action]');
    if(!target)return;
    if(Date.now()-lastPointer<800){e.preventDefault();e.stopPropagation();return;}
    launch(e,target.dataset.repoAction);
  });
  repoSelectionButton=menu;document.body.appendChild(menu);
}
function updateRepoSelection(){
  // Only inspect endpoints and eligibility during high-frequency drag events.
  const quick=repoSelectionQuickRecord();
  if(!quick){
    // iOS may collapse its Selection while showing the native copy toolbar.
    // Retain a previously captured Range until the delayed read completes.
    const sel=window.getSelection?.();
    if(sel && !sel.isCollapsed && sel.rangeCount){hideRepoSelection();return;}
    if(repoSelectionRecord && !repoSelectionContextValid(repoSelectionRecord))hideRepoSelection();
    return;
  }
  // Keep only the latest drag position. No snippetNodeText here.
  repoSelectionPending=quick;
  clearTimeout(repoSelectionTimer);
  repoSelectionTimer=setTimeout(()=>{
    repoSelectionTimer=0;
    // Do not reinterpret an old DOM Range as belonging to a newly opened chat.
    const queued=repoSelectionPending;
    if(!repoSelectionContextValid(queued)){hideRepoSelection();return;}
    const sel=window.getSelection?.();
    const live=repoSelectionQuickRecord();
    // An active selection outside a chat message is invalid, not a Safari
    // transient collapse. Do not resurrect an older saved selection.
    if(sel && !sel.isCollapsed && sel.rangeCount && !live){hideRepoSelection();return;}
    const active=live||queued;
    // Outside taps can precede Safari's asynchronous selectionchange event.
    // Do not even traverse the DOM for an already dismissed range.
    if(repoSelectionDismissed && repoSelectionSameRange(repoSelectionDismissed,active)){
      repoSelectionPending=null;return;
    }
    const saved=readRepoSelection(active);
    if(!repoSelectionContextValid(saved)){hideRepoSelection();return;}
    repoSelectionDismissed=null;
    ensureRepoSelectionButton();repoSelectionRecord=saved;
    repoSelectionPending=null;
    if(repoSelectionMergeDrafts.some(v=>v.sourceChat!==snippetChatIdentity()))repoSelectionMergeDrafts.length=0;
    const clear=repoSelectionButton.querySelector('[data-repo-action="clear-merge"]');
    if(clear){clear.hidden=repoSelectionMergeDrafts.length===0;clear.textContent='清空('+repoSelectionMergeDrafts.length+')';}
    repoSelectionButton.classList.add('show');
    if(!positionRepoSelection(saved))hideRepoSelection();
  },220);
}

function init() {
  store();
  document.querySelectorAll('.pk-mes-btn').forEach(b => b.remove());
  // The extension/wand menu can be mounted slightly after this script runs.
  let wandWatcher=null;
  if(!ensureRepoWandMenu()) {
    wandWatcher=new MutationObserver(()=>{
      if(ensureRepoWandMenu()){wandWatcher.disconnect();wandWatcher=null;}
    });
    wandWatcher.observe(document.body,{childList:true,subtree:true});
  }
  const wandMenuClick=e=>{
    if(e.target.closest?.('#extensionsMenuButton'))ensureRepoWandMenu();
  };
  document.addEventListener('click',wandMenuClick,true);
  initSnippetTapHandle();
  window.addEventListener('resize',snippetPositionHandle);
  // Observe selection only in chat message bodies; never intercept OS copy menu.
  const onRepoSelectionChange=()=>updateRepoSelection();
  const onRepoSelectionOutside=e=>{
    if(repoSelectionButton?.contains(e.target))return;
    const body=e.target?.closest?.('#chat .mes[mesid] .mes_text');
    if(body){
      // Long presses and dragging Safari selection handles cause pointerdown
      // inside message text. These are not outside-menu dismissals.
      repoSelectionTextPress=repoSelectionDismissed
        ?{started:Date.now(),body,x:e.clientX,y:e.clientY,pointerId:e.pointerId}:null;
      return;
    }
    const previous=repoSelectionPending||repoSelectionRecord;
    if(previous){
      repoSelectionDismissed=previous;
      hideRepoSelection();
    }
    repoSelectionLastTap=null;
    repoSelectionTextPress=null;
  };
  const onRepoSelectStart=e=>{
    if(e.target?.closest?.('#chat .mes[mesid] .mes_text')){
      repoSelectionDismissed=null;
      repoSelectionLastTap=null;
    }
  };
  const onRepoSelectionPointerUp=e=>{
    const press=repoSelectionTextPress;
    repoSelectionTextPress=null;
    if(!press||e.pointerId!==press.pointerId)return;
    const now=Date.now(),duration=now-press.started;
    const last=repoSelectionLastTap;
    const doubleTap=duration<450 && !!last && last.body===press.body
      &&now-last.at<450 && Math.hypot(press.x-last.x,press.y-last.y)<28;
    repoSelectionLastTap=duration<450&&!doubleTap
      ?{body:press.body,x:press.x,y:press.y,at:now}:null;
    // Same boundaries can be a NEW selection. A fresh long press or double
    // tap should re-arm it; an ordinary tap must not resurrect Safari's old
    // selection. Keep this path lightweight until updateRepoSelection's timer.
    if((duration>=450||doubleTap)&&repoSelectionDismissed){
      const selected=repoSelectionQuickRecord();
      if(selected&&repoSelectionContextValid(selected)){
        repoSelectionDismissed=null;
        updateRepoSelection();
      }
    }
  };
  const onRepoSelectionPointerCancel=()=>{
    repoSelectionTextPress=null;
    repoSelectionLastTap=null;
  };
  const onRepoSelectionKey=e=>{
    if(e.key==='Escape'){
      repoSelectionMergeDrafts.length=0;
      const previous=repoSelectionRecord||repoSelectionPending;
      if(previous)repoSelectionDismissed=previous;
      hideRepoSelection();
    }
  };
  const onRepoReposition=()=>{
    if(!repoSelectionRecord||!repoSelectionButton?.classList.contains('show'))return;
    if(!repoSelectionContextValid(repoSelectionRecord)){hideRepoSelection();return;}
    // Transient off-screen range geometry must not dismiss a valid selection.
    positionRepoSelection(repoSelectionRecord);
  };
  document.addEventListener('selectionchange',onRepoSelectionChange);
  document.addEventListener('pointerdown',onRepoSelectionOutside,true);
  document.addEventListener('pointerup',onRepoSelectionPointerUp,true);
  document.addEventListener('pointercancel',onRepoSelectionPointerCancel,true);
  document.addEventListener('selectstart',onRepoSelectStart,true);
  document.addEventListener('keydown',onRepoSelectionKey,true);
  document.addEventListener('scroll',onRepoReposition,true);
  window.addEventListener('resize',onRepoReposition);
  window.visualViewport?.addEventListener('resize',onRepoReposition);
  window.visualViewport?.addEventListener('scroll',onRepoReposition);

  const onResize = (event) => {
    if (!isOpen()) return;
    if (keyboardIsOpen()) { queueKeyboardViewport(event?.type === 'resize'); return; }
    if (Date.now() < keyboardCoolingUntil) return;
    if (st.editing) syncVisualViewport();
    schedule();
  };
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('scroll', onResize);
  return () => {
    clearTimeout(fieldTimer); fieldTimer = 0; pendingFields.clear();
    compositionFields.clear();keyboardRevealPending=false;
    clearTimeout(keyboardRenderTimer); keyboardRenderTimer = 0; keyboardRenderPending = false;
    if (keyboardFrame) { window.cancelAnimationFrame(keyboardFrame); keyboardFrame = 0; }
    window.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('resize', onResize);
    window.visualViewport?.removeEventListener('scroll', onResize);
    wandWatcher?.disconnect();
    document.removeEventListener('click',wandMenuClick,true);
    window.removeEventListener('resize',snippetPositionHandle);
    snippetTapHandle?.remove();snippetTapHandle=null;snippetTapIconRendered=null;
    document.removeEventListener('selectionchange',onRepoSelectionChange);
    document.removeEventListener('pointerdown',onRepoSelectionOutside,true);
    document.removeEventListener('pointerup',onRepoSelectionPointerUp,true);
    document.removeEventListener('pointercancel',onRepoSelectionPointerCancel,true);
    document.removeEventListener('selectstart',onRepoSelectStart,true);
    repoSelectionTextPress=null;repoSelectionLastTap=null;
    document.removeEventListener('keydown',onRepoSelectionKey,true);
    document.removeEventListener('scroll',onRepoReposition,true);
    window.removeEventListener('resize',onRepoReposition);
    window.visualViewport?.removeEventListener('resize',onRepoReposition);
    window.visualViewport?.removeEventListener('scroll',onRepoReposition);
    hideRepoSelection();repoSelectionMergeDrafts.length=0;repoSelectionDismissed=null;repoSelectionButton?.remove();repoSelectionButton=null;
    hideSnippetActionMenu();
    snippetMergeEditor?.remove();snippetMergeEditor=null;

     stopSnippetPicking(false);closeSnippetBox();
     snippetSystemTheme?.removeEventListener?.('change',snippetSystemThemeChanged);
     document.getElementById('pk-wand')?.remove();
    if (st.ov) { st.ov._pkFontObserver?.disconnect(); st.ov.remove(); }
  };
}


  const dispose = init();
  const onPageHide = event => {
    // A bfcache navigation freezes the page; disposing would break Back/Forward.
    if(!event.persisted && typeof window.__pkDispose === 'function')window.__pkDispose();
  };
  window.__pkDispose = () => {
    globalThis.removeEventListener('pagehide', onPageHide);
    if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
    dispose();
    window.__pkDispose = null;
  };
  globalThis.addEventListener('pagehide', onPageHide);
})();

