import { useEffect, useState } from "react"
import type { RecipeName } from "react-pulsor"

export type Lang = "en" | "zh" | "ja"

export interface Strings {
  heroTitle: [string, string, string] // pre, accent, post
  tagline: string
  copy: string
  copied: string
  copyLink: string
  copyCss: string
  copyJsx: string
  copySvg: string
  exportGif: string
  gifDone: string
  loopHint: string
  customGradient: string
  addStop: string
  feelHint: string
  openInPlayground: string
  thProp: string
  thType: string
  thDefault: string
  thDesc: string
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    heroTitle: ["Loaders with ", "a pulse", "."],
    tagline:
      "Grids, bars, dots and rings driven by phase fields, motion envelopes and OKLab gradients — one compositor-only keyframe that keeps ticking while your app does the heavy lifting.",
    copy: "copy",
    copied: "copied ✓",
    copyLink: "copy link",
    copyCss: "copy css",
    copyJsx: "copy jsx",
    copySvg: "copy svg",
    exportGif: "export gif",
    gifDone: "gif saved ✓",
    loopHint:
      "Pills trace the loop's outline, reaching inward by stroke — middle rows split around the opening. Aspect and squareness shape the silhouette.",
    customGradient: "custom gradient",
    addStop: "+ stop",
    feelHint: "sets envelope · easing · tempo",
    openInPlayground: "open in playground ↗",
    thProp: "Prop",
    thType: "Type",
    thDefault: "Default",
    thDesc: "Description",
  },
  zh: {
    heroTitle: ["让加载", "有脉搏", "。"],
    tagline:
      "网格、长条、圆点与圆环，由相位场、运动包络和OKLab渐变驱动。动画只有一条走合成器的keyframe，应用再忙，节拍也不乱。",
    copy: "复制",
    copied: "已复制 ✓",
    copyLink: "复制链接",
    copyCss: "复制CSS",
    copyJsx: "复制JSX",
    copySvg: "复制SVG",
    exportGif: "导出GIF",
    gifDone: "GIF已保存 ✓",
    loopHint:
      "药丸沿轮廓排布，向内伸入stroke的长度；中间几行会在开口处一分为二。轮廓形状由aspect和squareness决定。",
    customGradient: "自定义渐变",
    addStop: "+ 色标",
    feelHint: "一键设定包络 · 缓动 · 节奏",
    openInPlayground: "在Playground打开 ↗",
    thProp: "属性",
    thType: "类型",
    thDefault: "默认值",
    thDesc: "说明",
  },
  ja: {
    heroTitle: ["ローダーに、", "鼓動", "を。"],
    tagline:
      "グリッド、バー、ドット、リング。波のかたちも、明滅のカーブも、色の流れも、propひとつで変わる。走るのはコンポジタだけのkeyframe一本。アプリがどれほど忙しくても、鼓動は乱れない。",
    copy: "コピー",
    copied: "コピー済み ✓",
    copyLink: "リンクをコピー",
    copyCss: "CSSをコピー",
    copyJsx: "JSXをコピー",
    copySvg: "SVGをコピー",
    exportGif: "GIFを書き出す",
    gifDone: "GIFを保存しました ✓",
    loopHint:
      "ピルは輪郭をなぞり、strokeのぶんだけ内側へ。中ほどの行は、開口部で左右に分かれます。シルエットを決めるのはaspectとsquareness。",
    customGradient: "カスタムグラデーション",
    addStop: "+ ストップ",
    feelHint: "エンベロープ・イージング・テンポをまとめて設定",
    openInPlayground: "Playgroundで開く ↗",
    thProp: "プロパティ",
    thType: "型",
    thDefault: "デフォルト",
    thDesc: "説明",
  },
}

/** Localized recipe blurbs; recipe titles stay English, like type-specimen names. */
export const RECIPE_BLURBS: Record<"zh" | "ja", Record<RecipeName, string>> = {
  zh: {
    typing: "经典三点跳动，弧线被调成「跳」而不是「晃」。",
    equalizer: "直立的条随行波呼吸——音频表的能量感。",
    monogram: "条纹拼出的一枚徽标，扫描线绕行一周。stroke和squareness按口味调。",
    comet: "亮头长尾，相位取色画出拖尾。",
    sonar: "方形波纹从中心一圈圈散开，慢而通透。",
    ticker: "低而宽的格子带，波从左向右跑马。",
    galaxy: "螺旋相位场——波从中心盘旋而出。",
    heartbeat: "一颗点，双峰包络。扑通、扑通。",
    orbit: "被波不断追圈的一环圆点——spinner的基因，渐变的身体。",
    glyph: "虚线勾出的环——调aspect与squareness贴合你的字标。",
    sunburst: "径向刻度绕环闪耀——转得发烫的表盘。",
    stadium: "方圆跑道——波在圆角上一圈圈地跑。",
    static: "种子乱序加频闪包络——两个台之间的电视雪花。",
    drizzle: "随机格子拉伸闪烁——窗上的雨痕。",
    kelp: "条从根部摆动，波经过时像风穿过草地。",
    louver: "板条绕自身轴翻转——过堂风里的百叶窗。",
    manuscript: "从左边距长出的横线，像正在起草的文字。",
    metronome: "两点硬切换位——极简、机械。",
    breather: "整块同步吸气——安静的待机态，而非忙碌态。",
    ascent: "宽幅山形折线向上爬——有方向、不停歇。",
    beacon: "一圈小灯快速轮转，形状眼熟，颜色鲜活。",
  },
  ja: {
    typing: "おなじみの三点バウンス。揺れではなく、跳ねと呼べるところまで調律した。",
    equalizer: "波が通るたび、バーが息を吸う。オーディオメーターの躍動。",
    monogram: "ストライプを積んで組んだバッジ。strokeとsquarenessは、お好みの字面に合わせて。",
    comet: "明るい頭、長く引く尾。軌跡を描くのは位相カラーリング。",
    sonar: "四角い波紋が中心から広がる。遅く、ガラスのように。",
    ticker: "低く長いセルの帯を、波が左から右へ。電光掲示板の足取りで。",
    galaxy: "中心から渦を巻いて、波が出ていく。螺旋の位相場。",
    heartbeat: "一粒のドット、二拍のエンベロープ。ドクン、ドクン。",
    orbit: "ドットの輪を、波がいつまでも周回する。骨格はスピナー、身体はグラデーション。",
    glyph: "破線で描いたひとつの輪。aspectとsquarenessを、ロゴの字面に合わせて。",
    sunburst: "放射状の目盛りが、順に閃いて一周。熱を帯びた文字盤。",
    stadium: "角の丸い四角、スクワークルのトラック。波がラップを刻む。",
    static: "シード乱数にストロボを重ねた、チャンネルの狭間のテレビノイズ。",
    drizzle: "セルがランダムに伸びては消える。窓ガラスを伝う雨だれ。",
    kelp: "バーが根元からしなる。波が通れば、草原を渡る風。",
    louver: "スラットが自分の軸でくるりと返る。すきま風に鳴るブラインド。",
    manuscript: "行が左マージンから伸びていく。書きかけの原稿のように。",
    metronome: "二つの点が、かちりと入れ替わる。ミニマルで、機械的。",
    breather: "ブロック全体が、いっせいに息を吸う。忙しなさではなく、静かな待機。",
    ascent: "幅広の山形が、一段ずつ登っていく。方向を持った律動。",
    beacon: "小さな灯が、輪を速く巡る。見慣れたかたち、生きた色。",
  },
}

const LANG_KEY = "pulsor-lang"

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === "en" || saved === "zh" || saved === "ja") return saved
  } catch {
    /* private mode */
  }
  const nav = navigator.language.toLowerCase()
  if (nav.startsWith("zh")) return "zh"
  if (nav.startsWith("ja")) return "ja"
  return "en"
}

export function useI18n() {
  const [lang, setLang] = useState<Lang>(detectLang)
  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      /* private mode */
    }
    document.documentElement.lang = lang
  }, [lang])
  return { lang, setLang, t: STRINGS[lang] }
}
