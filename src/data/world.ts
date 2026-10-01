/**
 * 基板惑星 世界観データ（星の正体＝壊れたレトロラジオはサイト上では明かさない）
 *
 * 出典:
 *  - 企画ブリーフ（エリア・店舗・キャラ・共通シグネチャー）
 *  - BAR DINNER.xlsx「キャラクター」「お店」シート
 * Excelの「裏設定（明かさない）」列は意図的に取り込んでいない。
 */

export type AreaId =
  | "cpu"
  | "capacitor"
  | "resistor"
  | "quartz"
  | "power"
  | "hill"
  | "speaker"
  | "cooling";

export type Area = {
  id: AreaId;
  name: string;
  part: string; // 住人から見た部品名
  description: string;
  /** マップ(SVG viewBox 1000x640)上の中心座標 */
  x: number;
  y: number;
  source: "brief" | "excel";
};

export const AREAS: Area[] = [
  {
    id: "cpu",
    name: "中心街",
    part: "CPUヒートシンク",
    description: "惑星でいちばん熱を持つ場所。フィンの谷間に店が並び、基盤の熱(CPUパワー)で料理が作られる。",
    x: 500,
    y: 285,
    source: "brief",
  },
  {
    id: "capacitor",
    name: "多国籍街",
    part: "電解コンデンサ",
    description: "円筒形のコンデンサが林立する路地。電荷と湯気と異国の匂いが溜まっている。",
    x: 215,
    y: 165,
    source: "brief",
  },
  {
    id: "resistor",
    name: "流行地区",
    part: "抵抗器（レジスタ）",
    description: "カラーコードの帯がそのまま流行色になる街。和モダン地区もこの並びにある。",
    x: 770,
    y: 150,
    source: "brief",
  },
  {
    id: "quartz",
    name: "洗練地区",
    part: "クォーツ（水晶振動子）",
    description: "32,768Hzで刻まれる正確な時間が流れる、銀色の缶に守られた上品な街。",
    x: 800,
    y: 470,
    source: "brief",
  },
  {
    id: "power",
    name: "電源・暴走エリア",
    part: "電源回路・バッテリー",
    description: "電源は落ちているはずなのに、雷が来ると何かが走り出す。立入注意。",
    x: 190,
    y: 470,
    source: "brief",
  },
  {
    id: "hill",
    name: "流動の丘",
    part: "―",
    description: "ゆるやかに盛り上がった、銀色の丘。溶けて流れて、そのまま固まったような形をしている。",
    x: 640,
    y: 575,
    source: "brief",
  },
  {
    id: "speaker",
    name: "音響・出力エリア",
    part: "スピーカー・イヤホンジャック",
    description: "この星の出口。ここだけは今も夜ごとに低音が漏れている。",
    x: 935,
    y: 300,
    source: "excel",
  },
  {
    id: "cooling",
    name: "冷却・放熱エリア",
    part: "ファン・冷却シート",
    description: "止まったファンの羽根の下に広がる、ひんやりした公園。",
    x: 60,
    y: 300,
    source: "excel",
  },
];

export type ShopId =
  | "the-node"
  | "collective-diner"
  | "korompo"
  | "shinabundo"
  | "denpato"
  | "seven-percent"
  | "patisserie-quartz"
  | "nikukyu-sushi"
  | "tancho"
  | "loop"
  | "moomoomeaw"
  | "jack"
  | "radiator-park"
  | "power-alley"
  | "yamasemi-stall";

/** night = 20:00–5:00 / day = 5:00–20:00 */
export type Condition = "night" | "day" | "rain" | "storm";

export type ShopItem = { name: string; note?: string; price?: string };

export type ShopSection = {
  title: string;
  kicker?: string;
  items: ShopItem[];
  /** この条件の時だけ「開催中」になる。条件外は予告表示 */
  activeWhen?: Condition;
  inactiveNote?: string;
};

export type Shop = {
  id: ShopId;
  name: string;
  kana?: string;
  area: AreaId;
  /** ピン座標(SVG viewBox 1000x640) */
  x: number;
  y: number;
  tagline: string;
  concept: string;
  logoLogic?: string;
  goods?: string[];
  characters: string[]; // Character.id
  sections: ShopSection[];
  /** 営業条件。night = Bar（20:00–5:00）/ day = Diner（5:00–20:00） */
  opensWhen?: Condition;
  /** 閉店中に入ったときの一文 */
  closedNote?: string;
  /** 店のイメージ画（public/ 以下）。店に入ると上部に並ぶ */
  gallery?: { src: string; alt: string; caption?: string; /** 背景（CSS background） */ bg?: string }[];
  /** 開くときの演出 */
  openEffect?: "static-burst" | "rainbow" | "steam";
  accent: "pink" | "mint" | "cinnamon" | "silver";
  source: "brief" | "excel";
};

export const SHOPS: Shop[] = [
  {
    id: "the-node",
    name: "Bar: The Node",
    kana: "ザ・ノード（B1）",
    area: "cpu",
    x: 540,
    y: 330,
    tagline: "ノイズに塗れた夜を愛する大人たちの社交場",
    concept:
      "コンデンサの静かな暗がりにひっそりと佇む、ローファイでチルな隠れ家地下バー。店名は回路の接続点（Node）、電磁波の信号が交差する結節点から。",
    goods: ["オリジナルロックグラス", "コースター", "フクロウ店長厳選 Lo-fiコンピレーション（レコード風パッケージ）"],
    characters: ["owl", "cat", "pigeon"],
    opensWhen: "night",
    closedNote: "ただいま準備中。扉には CLOSED の札。ネオンが灯るのは 20:00 から。扉の隙間からグラスを磨く音だけが聞こえる。",
    accent: "pink",
    sections: [
      {
        title: "雨の日限定イベント「トレンチコートの夜」",
        kicker: "RAINY NIGHT ONLY",
        activeWhen: "rain",
        inactiveNote: "アンテナが雨を受信した日だけ、トレンチコートの鳩がカウンターの隅に現れる。",
        items: [
          { name: "鳩の聞き込みタイム", note: "街で拾った噂話をひとつだけ教えてくれる" },
          { name: "限定カクテル『Wet Signal』", note: "雨粒ノイズを閉じ込めた青いジン", price: "12 CR" },
          { name: "レコード『Rain on the Antenna』試聴会" },
        ],
      },
      {
        title: "今夜のカクテル",
        items: [
          { name: "Static Old Fashioned", note: "静電気でパチッと香りが立つ", price: "10 CR" },
          { name: "Solder Martini", note: "銀色に光る、とろりとした一杯", price: "11 CR" },
          { name: "27A Highball", note: "12Vの微炭酸", price: "8 CR" },
        ],
      },
    ],
    source: "brief",
  },
  {
    id: "collective-diner",
    name: "COLLECTIVE DINER",
    kana: "コレクティブ・ダイナー（1F）",
    area: "cpu",
    x: 465,
    y: 245,
    tagline: "CPUの熱で焼く、活気あふれるアメリカンダイナー",
    concept:
      "一番熱を持つメインCPUエリアに佇むアメリカンダイナーカフェ。電磁波でキャッチした「ジュークボックス」や「ダイナー」のログを集積（Collective）したことが名前の由来。",
    goods: ["ダイナーロゴ入りマグカップ", "ワークエプロン", "メニュー表風ZINE"],
    characters: ["bison", "pig", "raccoon", "pronghorn"],
    opensWhen: "day",
    closedNote: "本日の営業は終了しました。入口に CLOSED の札。鉄板の余熱だけがまだ少し温かい。朝 5:00 にまた開きます。",
    accent: "cinnamon",
    sections: [
      {
        title: "MENU",
        items: [
          { name: "ヒートシンク・スマッシュバーガー", note: "フィンの熱で両面カリッと", price: "9 CR" },
          { name: "オーバークロック・シェイク", price: "6 CR" },
          { name: "ジュークボックス・フライ", price: "4 CR" },
        ],
      },
    ],
    source: "excel",
  },
  {
    id: "korompo",
    name: "中華料理 公籠包",
    kana: "こうろんぽう",
    area: "capacitor",
    x: 180,
    y: 120,
    tagline: "湯気モクモク、基盤世界一の癒やし中華",
    concept:
      "せいろの中に小籠包そっくりのハムスターたちがギュッと身を寄せ合う。「ハ＋ム＝公」の文字遊びと、小籠包のフォルムがハムスターの背中に似ていることから。",
    goods: ["肉球型しょうゆ小皿（公籠包ver・朱の雷紋）", "ハムスターせいろドット絵ステッカー", "漢字ロゴ入りネオンレンゲ"],
    characters: ["panda-korompo", "duck"],
    openEffect: "steam",
    accent: "pink",
    sections: [
      {
        title: "本日のせいろ",
        items: [
          { name: "公籠包（6匹…ではなく6個）", note: "黒酢と針生姜で", price: "7 CR" },
          { name: "コンデンサ焼売", price: "5 CR" },
          { name: "電解ごま団子", price: "4 CR" },
        ],
      },
    ],
    source: "brief",
  },
  {
    id: "shinabundo",
    name: "シナブン堂",
    kana: "SHINABUNNDO",
    area: "capacitor",
    x: 275,
    y: 210,
    tagline: "ジャンク＆レトロ雑貨、ときどき焼きたてパン",
    concept:
      "カラスの旦那が集める80sジャンクと、シナモン文鳥の妻が選ぶゆめかわサイバー雑貨が同じ棚に並ぶ異種夫婦の店。店名はシナモン文鳥の省略。奥の小さなオーブンからは、妻の趣味のパンが焼ける匂い。",
    goods: ["メモ帳などの文房具", "ゆめかわサイバー雑貨", "80sジャンクパーツ"],
    characters: ["crow", "cinnamon-finch"],
    accent: "cinnamon",
    sections: [
      {
        title: "焼きたてパン",
        kicker: "BY 文鳥の奥さん",
        items: [], // 日替わり。src/lib/daily.ts で生成
      },
      {
        title: "ジャンクパーツ棚",
        kicker: "BY カラスの旦那",
        items: [], // 日替わり。src/lib/daily.ts で生成
      },
    ],
    source: "brief",
  },
  {
    id: "denpato",
    name: "電波塔",
    kana: "ギャル服屋 / C3キャロット",
    area: "resistor",
    x: 735,
    y: 115,
    tagline: "電磁波×ギャル。強めカルチャーの聖地",
    concept:
      "ハクビシンの店長と黒ギャルウサギJKたちがたむろするギャル服屋。看板ブランド「C3キャロット」は、C3を横に倒すとうさぎの耳と顔に見えることから。",
    goods: ["C3ロゴ刺繍バケットハット", "ネオンカラースウェット", "ルーズソックス風レッグウォーマー"],
    characters: ["masked-palm-civet", "rabbit"],
    openEffect: "static-burst",
    accent: "pink",
    sections: [
      {
        title: "NEW ARRIVAL",
        items: [
          { name: "C3キャロット ネオンスウェット", price: "18 CR" },
          { name: "電波ルーズソックス", note: "履くと受信感度が上がる（気がする）", price: "5 CR" },
        ],
      },
    ],
    source: "brief",
  },
  {
    id: "seven-percent",
    name: "7%",
    kana: "セレクトショップ",
    area: "quartz",
    x: 760,
    y: 420,
    tagline: "モノトーンに、1箇所だけの虹色",
    concept:
      "ストリートの最先端とスマートなスーツスタイルを融合させた、ギャップ（二面性）がテーマのセレクトショップ。デザインは基本白黒、毎回1箇所だけ7色の虹色を入れる。",
    goods: ["虹色の蝶々ワンポイント刺繍 ヘビーウェイトT", "モノトーンフラップキャップ（裏地が虹色迷彩）"],
    characters: ["husky"],
    gallery: [{ src: "/characters/husky.png", alt: "7% の店主ハスキー（ドット絵）。モノトーンの服に、虹色の蝶々がひとつ", caption: "店主ハスキー", bg: "radial-gradient(circle at 50% 45%, #3a3a40, #121216 70%)" }],
    openEffect: "rainbow",
    accent: "silver",
    sections: [
      {
        title: "SELECTION",
        items: [
          { name: "Rainbow Butterfly Tee", note: "店主の初作品モチーフ", price: "24 CR" },
          { name: "Monotone Flap Cap", price: "16 CR" },
        ],
      },
    ],
    source: "brief",
  },
  {
    id: "patisserie-quartz",
    name: "Pâtisserie Quartz",
    kana: "パティスリー・クォーツ",
    area: "quartz",
    x: 850,
    y: 505,
    tagline: "1秒の狂いもない、時間の基準のスイーツ",
    concept: "時間の基準を刻むパーツ「QUARTZ」の名を冠した洋菓子店。白ギツネの姉が作り、キツネの妹が笑顔で売る。",
    characters: ["white-fox", "fox", "hedgehog"],
    accent: "mint",
    sections: [
      {
        title: "VITRINE",
        items: [
          { name: "32768Hz ミルフィーユ", note: "層の数が正確に振動数どおり（らしい）", price: "9 CR" },
          { name: "クリスタル・タルト", price: "8 CR" },
          { name: "修行中のシュー", note: "ハリネズミ作。形はまちまち", price: "2 CR" },
        ],
      },
    ],
    source: "brief",
  },
  {
    id: "power-alley",
    name: "バッテリー裏路地",
    kana: "電気三兄弟のたまり場",
    area: "power",
    x: 190,
    y: 470,
    tagline: "雷が来ないと、誰も動かない",
    concept: "電源・バッテリー地区の裏路地。普段は静まり返っているが、アンテナが雷を受信すると三兄弟が起き出す。",
    characters: ["volt", "pulse", "spark"],
    accent: "mint",
    sections: [
      {
        title: "三兄弟、起動中",
        kicker: "STORM ONLY",
        activeWhen: "storm",
        inactiveNote: "今はバッテリーの陰で眠っている。雷の日にもう一度来てみて。",
        items: [
          { name: "ボルトの闇取引", note: "限定アイテムを小声で。警察官パンダには内緒" },
          { name: "パルスの昔話", note: "「地底のポケット基板」の話をポロッと" },
          { name: "スパークのクレジット撒き", note: "画面を走り回ってレア特典をばら撒く" },
        ],
      },
    ],
    source: "brief",
  },
  {
    id: "nikukyu-sushi",
    name: "にくきゅう鮨",
    kana: "寿司屋",
    area: "resistor",
    x: 820,
    y: 200,
    tagline: "肉球で握る、本格派",
    concept: "ハチマキを巻いた柴犬大将が、可愛い肉球で器用にシャリを握る。公籠包の小皿と並べると紅白のペアセットに。",
    goods: ["肉球型しょうゆ小皿（にくきゅう鮨ver・藍の一本線）", "ドヤ顔大将ドット絵ステッカー"],
    characters: ["shiba"],
    accent: "cinnamon",
    sections: [],
    source: "excel",
  },
  {
    id: "tancho",
    name: "割烹料理 丹頂",
    area: "resistor",
    x: 865,
    y: 125,
    tagline: "ノイズを削ぎ落とした割烹",
    concept: "静寂を愛するニホンツルの女将が、凛とした佇まいで美しい料理を出す。",
    characters: ["crane"],
    accent: "silver",
    sections: [],
    source: "excel",
  },
  {
    id: "loop",
    name: "古着屋 LOOP",
    kana: "B-SIDE",
    area: "resistor",
    x: 690,
    y: 190,
    tagline: "廃棄エリアの布切れから、街のお洒落は始まった",
    concept: "オポッサムの店主が基盤の廃棄エリアから人間の古着風の布切れを回収して仕立てる。店主はよくフラッとバカンスに出る。",
    characters: ["opossum"],
    accent: "mint",
    sections: [],
    source: "excel",
  },
  {
    id: "moomoomeaw",
    name: "moomoomeaw",
    kana: "モーモーミャウ",
    area: "cpu",
    x: 430,
    y: 360,
    tagline: "猫は牛からできている。猫は液体である。",
    concept: "独自の生命科学・哲学をベースにしたストリートカルトブランド。説明しすぎないこと自体がコンセプト。",
    goods: ["液体子猫ビッグシルエットパーカー", "口の中のミニ牛ソックス", "アクリルキーホルダー"],
    characters: ["kitten"],
    gallery: [
      {
        src: "/characters/kitten.png",
        alt: "牛乳瓶から注がれて猫になる液体子猫（ドット絵）。口の中に小さな牛がいる",
        caption: "液体子猫",
        bg: "repeating-linear-gradient(0deg, rgba(255,120,170,.35) 0 2px, transparent 2px 14px), repeating-linear-gradient(90deg, rgba(90,220,170,.35) 0 2px, transparent 2px 14px), linear-gradient(180deg, #5a4a78, #2f6a6a 60%, #3a4f86)",
      },
    ],
    accent: "pink",
    sections: [],
    source: "excel",
  },
  {
    id: "jack",
    name: "ダンスホール JACK",
    area: "speaker",
    x: 935,
    y: 300,
    tagline: "星の出口で踊る",
    concept: "イヤホンジャックの奥のダンスホール。DJはトカゲのジャックリーン。街じゅうの店で流れているBGMは、ぜんぶ彼女が作曲したもの。",
    goods: ["各店舗BGM CD（全15タイトル）", "JACKリーン作曲集 BOX", "ダンスホール JACK ステッカー"],
    characters: ["lizard"],
    accent: "pink",
    sections: [
      {
        title: "BGM CD — 作曲：ジャックリーン",
        kicker: "SHOP SOUNDTRACKS",
        items: [
          { name: "Bar: The Node — Lo-fi Jazz", note: "フクロウのマスターのリクエストで、ゆっくり", price: "12 CR" },
          { name: "COLLECTIVE DINER — Jukebox", note: "鉄板の音に負けないウォーキングベース", price: "12 CR" },
          { name: "電波塔 — GAL BEAT", price: "12 CR" },
          { name: "公籠包 — 湯気の調べ", price: "12 CR" },
          { name: "Pâtisserie Quartz — 32768Hz", price: "12 CR" },
          { name: "JACKリーン作曲集 BOX", note: "全店のBGMを1箱に", price: "60 CR" },
        ],
      },
    ],
    source: "excel",
  },
  {
    id: "radiator-park",
    name: "氷結ラジエーター公園",
    area: "cooling",
    x: 60,
    y: 300,
    tagline: "止まったファンの下の、ひんやり公園",
    concept: "ペンギンの子がアイスを売っている。",
    characters: ["penguin"],
    accent: "mint",
    sections: [],
    source: "excel",
  },
];

/** ヤマセミ兄妹の出張屋台。座標は日替わりで reception.yamasemiAt から決まる */
export const YAMASEMI_STALL: Omit<Shop, "area" | "x" | "y"> = {
  id: "yamasemi-stall",
  name: "ヤマセミ兄妹 出張屋台",
  kana: "TRAVELING STALL",
  tagline: "今日はこの地区に来ている",
  concept: "兄は無骨なジャンクガジェット、妹はゆめかわサイバー雑貨。日替わりで各地区を渡り歩く協力キャラの屋台。",
  characters: ["yamasemi-brother", "yamasemi-sister"],
  accent: "mint",
  sections: [
    {
      title: "出張ラインナップ",
      items: [
        { name: "兄: アルミ削り出しのトグルスイッチ箱", price: "14 CR" },
        { name: "兄: 軍用っぽい無骨トランシーバー（受信のみ）", price: "20 CR" },
        { name: "妹: パステルLEDのヘアピン", price: "4 CR" },
        { name: "妹: ホログラム基板ステッカー", price: "2 CR" },
      ],
    },
  ],
  source: "brief",
};

export type Character = {
  id: string;
  name: string;
  animal: string;
  emoji: string;
  /** 顔アイコン（public/ 以下）。無ければ emoji */
  image?: string;
  area: AreaId | "travel" | "space";
  shop?: ShopId;
  role: string;
  look?: string;
  fashion?: string;
  personality?: string;
  behavior?: string;
  appearsWhen?: Condition;
  /** 「27A 12V」電池の弾帯を巻いている（ヤマセミ兄妹とカラスだけ） */
  bandolier?: boolean;
  source: "brief" | "excel" | "brief+excel";
};

export const CHARACTERS: Character[] = [
  {
    id: "space-ham",
    name: "スペースハム",
    animal: "ハムスター",
    emoji: "🐹",
    image: "/characters/space-ham.png",
    area: "space",
    role: "すべての始まり",
    look: "宇宙服・ヘルメット / 3頭身",
    personality: "人間界から宇宙に旅立ち、未知の基盤世界に人間界の電波を繋いでしまった街の有名人。",
    behavior: "ローディング中、真っ暗な宇宙でぷかぷか浮きながら360度クルンと宙返りする。",
    source: "excel",
  },
  {
    id: "owl",
    name: "マスター",
    animal: "フクロウ",
    emoji: "🦉",
    area: "cpu",
    shop: "the-node",
    role: "オーナー",
    look: "丸っこい体に大きな目、3頭身",
    fashion: "クラシックベスト × モードな黒ストリートシャツ",
    personality: "物静かで聞き上手。電気ノイズをジャズとして聴きながら、淡々と怪しげなカクテルを調合する。",
    behavior: "20時以降にBarが点灯し、静かにグラスを磨いている。電磁波の受信感度に一番詳しい。",
    source: "brief+excel",
  },
  {
    id: "cat",
    name: "ネコ",
    animal: "ネコ",
    emoji: "🐈‍⬛",
    area: "cpu",
    shop: "the-node",
    role: "従業員（サボり魔）",
    look: "しなやかでコロンとした3.5頭身",
    fashion: "オーバーサイズスウェット（萌え袖）、ルーズソックス、スニーカー",
    personality: "圧倒的に「メロい」。カウンターに頬杖をついてLo-fiを聴いている。",
    behavior: "たまに気まぐれに画面越しの人間を「ん？」とじっと見つめてくる。",
    source: "brief+excel",
  },
  {
    id: "pigeon",
    name: "鳩",
    animal: "ハト",
    emoji: "🕊️",
    area: "cpu",
    shop: "the-node",
    role: "雨の日限定の客",
    fashion: "トレンチコート",
    personality: "雨の匂いと一緒にやってきて、カウンターの隅で一杯だけ飲んで帰る。",
    appearsWhen: "rain",
    source: "brief",
  },
  {
    id: "bison",
    name: "バイソン",
    animal: "バイソン",
    emoji: "🦬",
    area: "cpu",
    shop: "collective-diner",
    role: "店長兼シェフ",
    fashion: "アメカジ・ワーク、コック帽、極太デニム、ワークブーツ",
    personality: "豪快で職人気質。基盤の熱(CPUパワー)で調理する。",
    behavior: "メンテナンス中は頭にタオルを巻いて半田ごてを握り、街の修理にあたる。",
    source: "excel",
  },
  { id: "pig", name: "ブタ", animal: "ブタ", emoji: "🐖", area: "cpu", shop: "collective-diner", role: "シェフ", personality: "食いしん坊な実力派。", source: "excel" },
  { id: "raccoon", name: "アライグマ", animal: "アライグマ", emoji: "🦝", area: "cpu", shop: "collective-diner", role: "皿洗い", personality: "やんちゃ坊主。ちょっと不満げにお皿を洗っている。", source: "excel" },
  { id: "pronghorn", name: "プロングホーン", animal: "レイヨウ", emoji: "🦌", area: "cpu", shop: "collective-diner", role: "ウェイトレス", fashion: "ダイナー制服、ローラースケート", personality: "キビキビ働く勝気な店員。", source: "excel" },
  { id: "panda-police", name: "パンダ巡査", animal: "パンダ", emoji: "🐼", area: "cpu", role: "警察官", fashion: "パトカー配色（帽子が赤）", source: "excel" },
  {
    id: "crow",
    name: "カラスの旦那",
    animal: "カラス",
    emoji: "🐦‍⬛",
    area: "capacitor",
    shop: "shinabundo",
    role: "80sジャンク担当",
    fashion: "胸に「27A 12V」電池の弾帯",
    personality: "光るもの、古いもの、壊れたものを見ると放っておけない。",
    bandolier: true,
    source: "brief",
  },
  {
    id: "cinnamon-finch",
    name: "シナモン文鳥の奥さん",
    animal: "シナモン文鳥",
    emoji: "🐦",
    area: "capacitor",
    shop: "shinabundo",
    role: "接客・ゆめかわサイバー・パン焼き担当",
    look: "シナモンカラーのまるっとした文鳥",
    personality: "パンを作るのが趣味。",
    source: "brief+excel",
  },
  { id: "panda-korompo", name: "パンダ", animal: "パンダ", emoji: "🐼", area: "capacitor", shop: "korompo", role: "店員", fashion: "チャイナ服", personality: "せいろを大切に運ぶ料理人。", source: "excel" },
  { id: "duck", name: "アヒル", animal: "アヒル", emoji: "🦆", area: "capacitor", shop: "korompo", role: "店員", fashion: "バンダナ、チャイナエプロン", personality: "パンダの後ろをトコトコついて回る。", source: "excel" },
  { id: "masked-palm-civet", name: "ハクビシン", animal: "ハクビシン", emoji: "🦡", area: "resistor", shop: "denpato", role: "店長", fashion: "強めネオギャル", personality: "常に音楽に乗ってノリノリで接客。", source: "excel" },
  { id: "rabbit", name: "ウサギ", animal: "ウサギ", emoji: "🐰", area: "resistor", shop: "denpato", role: "黒ギャルJK（バイト）", fashion: "ガングロ、ルーズソックス、C3キャロット", personality: "「まじウケる〜」とダラダラ過ごしている。", source: "excel" },
  { id: "opossum", name: "オポッサム", animal: "オポッサム", emoji: "🐀", area: "resistor", shop: "loop", role: "店主", fashion: "ヴィンテージスポーツ、バケットハット", personality: "電動キックボードで移動。よくバカンスに消える。", source: "excel" },
  { id: "shiba", name: "柴犬大将", animal: "柴犬", emoji: "🐕", area: "resistor", shop: "nikukyu-sushi", role: "大将", fashion: "ネジりハチマキ、職人前掛け", source: "excel" },
  { id: "crane", name: "ニホンツルの女将", animal: "ニホンツル", emoji: "🦢", image: "/characters/crane/standing.png", area: "resistor", shop: "tancho", role: "女将", fashion: "着物", source: "excel" },
  {
    id: "husky",
    name: "ハスキー",
    animal: "ハスキー",
    emoji: "🐺",
    image: "/characters/husky.png",
    area: "quartz",
    shop: "seven-percent",
    role: "店主",
    look: "いかつい顔立ちだが中身は天然",
    fashion: "ストリートからスマートなスーツまで",
    personality: "見た目と中身の完璧なギャップ。白黒のデザインに1箇所だけ虹色を入れる。",
    source: "brief+excel",
  },
  {
    id: "white-fox",
    name: "白ギツネ",
    animal: "白ギツネ",
    emoji: "🦊",
    area: "quartz",
    shop: "patisserie-quartz",
    role: "オーナーパティシエ（姉）",
    fashion: "クラシックな白いコックコート",
    personality: "1秒の狂いもなく繊細なスイーツを作る、店の絶対的エース。",
    source: "brief+excel",
  },
  { id: "fox", name: "キツネ", animal: "キツネ", emoji: "🦊", area: "quartz", shop: "patisserie-quartz", role: "広報・接客（妹）", personality: "姉に憧れてこの業界に。姉より愛想が良い。", source: "excel" },
  { id: "hedgehog", name: "ハリネズミ", animal: "ハリネズミ", emoji: "🦔", area: "quartz", shop: "patisserie-quartz", role: "修行中", personality: "トゲに気をつけながら、クリームをうまく絞れず特訓中。", source: "excel" },
  { id: "volt", name: "ボルト", animal: "電気三兄弟・長男", emoji: "⚡", area: "power", shop: "power-alley", role: "言わざる", look: "大きめの黒パーカーの隙間から顔が出ている", personality: "クールでシニカル。闇取引や裏路地スロットの案内役。", appearsWhen: "storm", source: "brief+excel" },
  { id: "pulse", name: "パルス", animal: "電気三兄弟・次男", emoji: "〰️", area: "power", shop: "power-alley", role: "見ざる", look: "紐を固く絞ったフードで顔を隠している", personality: "シャイ。喋り出すと星の秘密をポロッと語ってしまう。", appearsWhen: "storm", source: "brief+excel" },
  { id: "spark", name: "スパーク", animal: "電気三兄弟・三男", emoji: "✨", area: "power", shop: "power-alley", role: "聞かざる", look: "フードは後ろに垂れ下がっている", personality: "超ハイテンション。画面を走り回ってクレジットを撒き散らす。", appearsWhen: "storm", source: "brief+excel" },
  { id: "yamasemi-brother", name: "ヤマセミ兄", animal: "ヤマセミ", emoji: "🐦", area: "travel", role: "出張：ジャンク・無骨ガジェット", fashion: "肩から「27A 12V」電池の弾帯", personality: "各地区を渡り歩く出張屋台。", bandolier: true, source: "brief" },
  { id: "yamasemi-sister", name: "ヤマセミ妹", animal: "ヤマセミ", emoji: "🐦", area: "travel", role: "出張：ゆめかわサイバー雑貨", fashion: "肩から「27A 12V」電池の弾帯", personality: "兄と一緒に出張。シナブン堂とは仲良し。", bandolier: true, source: "brief" },
  { id: "kitten", name: "液体子猫", animal: "子猫", emoji: "🐱", image: "/characters/kitten.png", area: "cpu", shop: "moomoomeaw", role: "謎の生命体", look: "とろっとした液体のようなシルエット", personality: "あくびをすると口の中に小さな牛がいる。", source: "excel" },
  { id: "lizard", name: "ジャックリーン", animal: "トカゲ", emoji: "🦎", area: "speaker", shop: "jack", role: "DJ・作曲家", look: "中性的な姉さん", personality: "街の各店舗のBGMをすべて作曲した。店ごとのCDも自分の店で売っている。", source: "excel" },
  { id: "penguin", name: "ペンギンの子", animal: "ペンギン", emoji: "🐧", area: "cooling", shop: "radiator-park", role: "アイス売り", source: "excel" },
];

/** 共通シグネチャー: 配線パターン(銅箔ライン)の3色 */
export const COPPER = {
  pink: "#FF007F",
  mint: "#3DFFC0",
  cinnamon: "#C8814B",
} as const;

export const shopById = (id: ShopId) => SHOPS.find((s) => s.id === id)!;
export const charById = (id: string) => CHARACTERS.find((c) => c.id === id);
export const areaById = (id: AreaId) => AREAS.find((a) => a.id === id)!;
