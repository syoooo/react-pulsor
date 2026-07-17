import { COMPONENT_NAMES, type ElementKind } from "./defaults"
import type { Lang, Strings } from "./i18n"

/** Implementation-oriented props reference, rendered under the recipes. */

interface PropRow {
  name: string
  type: string
  def: string
  desc: Record<Lang, string>
}

const SHARED_PROPS: PropRow[] = [
  {
    name: "palette",
    type: 'preset | color | GradientStop[]',
    def: '"aurora"',
    desc: {
      en: "Palette preset, single CSS color, or gradient stops (sampled in OKLab)",
      zh: "配色预设、单色，或渐变停靠点（OKLab采样）",
      ja: "プリセット名、単色、またはグラデーションストップ。補間はOKLab",
    },
  },
  {
    name: "colorBy",
    type: '"position" | "phase" | "linear"',
    def: '"position"',
    desc: {
      en: "position colors by placement, phase by timing, linear lays one gradient across the whole figure",
      zh: "取色依据：position按位置、phase按相位、linear为整个图形铺一条渐变",
      ja: "色の割り当て基準。positionは位置、phaseは位相、linearは図形全体にひとつのグラデーション",
    },
  },
  {
    name: "gradientAngle",
    type: "number",
    def: "45",
    desc: {
      en: 'Gradient direction for colorBy="linear", degrees',
      zh: 'colorBy="linear" 的渐变方向（度）',
      ja: 'colorBy="linear" の方向（度）',
    },
  },
  {
    name: "animate",
    type: '"fade" | "scale" | "fade-scale" | "stretch" | "bounce" | "sway" | "flip"',
    def: "per component",
    desc: {
      en: "Which visual property the envelope drives",
      zh: "包络所驱动的视觉属性",
      ja: "エンベロープが動かす視覚プロパティ",
    },
  },
  {
    name: "feel",
    type: '"calm" | "crisp" | "lively" | "urgent"',
    def: "—",
    desc: {
      en: "Personality macro: default source for envelope, easing and tempo. Explicit props win",
      zh: "一次设定包络、缓动与节奏的默认值；显式props优先",
      ja: "エンベロープ・イージング・テンポの既定値をまとめて設定。明示したpropsが優先",
    },
  },
  {
    name: "envelope",
    type: "preset | { attack, hold?, release } | frames",
    def: '"pulse"',
    desc: {
      en: "Intensity curve of one beat: ADSR fractions or explicit frames (levels may leave [0,1])",
      zh: "一拍的强度曲线：ADSR比例或显式帧（level可超出 [0,1]）",
      ja: "一拍の強度カーブ。ADSRかフレーム配列で指定（levelは [0,1] を超えてもよい）",
    },
  },
  {
    name: "easing",
    type: "preset | CSS timing function",
    def: "auto",
    desc: {
      en: "Easing between frames; the default is each envelope's curated rise/fall pair",
      zh: "帧间缓动；默认用包络自带的rise/fall缓动对",
      ja: "フレーム間のイージング。既定はエンベロープ固有のrise/fallペア",
    },
  },
  {
    name: "period",
    type: "number",
    def: "900 × feel",
    desc: { en: "Milliseconds per full sweep", zh: "一次完整扫过的毫秒数", ja: "1周期のミリ秒" },
  },
  {
    name: "waves",
    type: "number",
    def: "1",
    desc: {
      en: "Simultaneous wavefronts travelling the field",
      zh: "同时在场的波前数量",
      ja: "同時に走る波面の数",
    },
  },
  {
    name: "dim",
    type: "number 0..1",
    def: "per mode",
    desc: { en: "Resting opacity", zh: "静息不透明度", ja: "静止時の不透明度" },
  },
  {
    name: "restScale",
    type: "number 0..1",
    def: "per mode",
    desc: {
      en: "Resting scale for scale / stretch modes",
      zh: "scale / stretch类模式的静息缩放",
      ja: "scale / stretch系の静止時スケール",
    },
  },
  {
    name: "amplitude",
    type: "number",
    def: "per mode",
    desc: {
      en: "px for bounce; degrees for sway / flip",
      zh: "bounce用px；sway / flip用度",
      ja: "bounceはpx、sway / flipは度",
    },
  },
  {
    name: "seed",
    type: "number",
    def: "7",
    desc: {
      en: "Deterministic shuffle seed for the sparkle pattern",
      zh: "sparkle的确定性乱序种子",
      ja: "sparkleパターンのシャッフルシード",
    },
  },
  {
    name: "state",
    type: '"loading" | "success" | "error"',
    def: '"loading"',
    desc: {
      en: "Settle the figure: grids morph into ✓ / ✗, others snap to the state color",
      zh: "完成状态：网格变形为 ✓ / ✗，其余定格为状态色",
      ja: "完了状態。グリッドは ✓ / ✗ に変形、他はステートカラーで停止",
    },
  },
  {
    name: "progress",
    type: "number 0..1",
    def: "—",
    desc: {
      en: "Determinate fill in pattern order (replaces the loop)",
      zh: "按pattern顺序的确定性填充（替代循环）",
      ja: "確定的な進捗表示。ループの代わりに、パターン順で点灯",
    },
  },
  {
    name: "successColor",
    type: "string",
    def: '"#34D399"',
    desc: { en: "Settle color on success", zh: "成功态颜色", ja: "成功時の色" },
  },
  {
    name: "errorColor",
    type: "string",
    def: '"#F87171"',
    desc: { en: "Settle color on error", zh: "失败态颜色", ja: "失敗時の色" },
  },
  {
    name: "intensity",
    type: "number 0..1",
    def: "1",
    desc: {
      en: "Live activity level; pair with useStreamIntensity for token streams",
      zh: "实时活跃度；token流场景配合useStreamIntensity使用",
      ja: "現在の活性度。トークンストリームにはuseStreamIntensityを併用",
    },
  },
  {
    name: "appear",
    type: "boolean",
    def: "true",
    desc: {
      en: "200ms fade/scale entrance on mount",
      zh: "挂载时200ms淡入",
      ja: "マウント時に200msでフェードイン",
    },
  },
  {
    name: "appearDelay",
    type: "number (ms)",
    def: "0",
    desc: {
      en: "Delay before showing; avoids flashing a spinner on fast loads",
      zh: "显示前的延迟；避免快速加载时闪现spinner",
      ja: "表示までの遅延。高速ロード時のチラつき防止",
    },
  },
  {
    name: "label",
    type: "string",
    def: '"Loading"',
    desc: { en: "Accessible aria-label", zh: "无障碍aria-label", ja: "読み上げに使われるaria-label" },
  },
  {
    name: "respectReducedMotion",
    type: "boolean",
    def: "true",
    desc: {
      en: "Under prefers-reduced-motion the loop becomes a slow opacity breath",
      zh: "开启减弱动态效果时，切换为缓慢的透明度明灭",
      ja: "reduced-motion設定時は、ゆっくりした明滅に切り替え",
    },
  },
]

const GRID_PATTERN =
  '"ripple" | "sweep-up" | "sweep-down" | "sweep-left" | "sweep-right" | "diagonal" | "chevron" | "snake" | "spiral" | "sparkle" | "pulse"'
const SEQ_PATTERN = '"wave" | "wave-reverse" | "center" | "edges" | "alternate" | "sparkle" | "pulse"'

const COMPONENT_PROPS: Record<ElementKind, PropRow[]> = {
  grid: [
    { name: "pattern", type: GRID_PATTERN, def: '"ripple"', desc: { en: "How the wave travels the grid", zh: "波的行进方式", ja: "波の進み方" } },
    { name: "rows / cols", type: "number", def: "4 / 4", desc: { en: "Grid dimensions", zh: "行数与列数", ja: "行と列の数" } },
    { name: "cellSize", type: "number (px)", def: "6", desc: { en: "Cell edge length", zh: "格子边长", ja: "セルの一辺" } },
    { name: "gap", type: "number (px)", def: "3", desc: { en: "Gap between cells", zh: "格子间距", ja: "セルの間隔" } },
    { name: "radius", type: "number (px)", def: "1.5", desc: { en: "Cell corner radius", zh: "格子圆角", ja: "セルの角丸" } },
  ],
  bars: [
    { name: "pattern", type: SEQ_PATTERN, def: '"wave"', desc: { en: "How the wave travels the bars", zh: "波的行进方式", ja: "波の進み方" } },
    {
      name: "arrangement",
      type: '"line" | "loop"',
      def: '"line"',
      desc: {
        en: "A straight line, or pills stacked into a striped closed loop",
        zh: "直线排列，或药丸堆成条纹闭环",
        ja: "直線か、ピルを重ねたストライプループか",
      },
    },
    { name: "count", type: "number", def: "5 / 8 (loop)", desc: { en: "Bars; stripes in a loop", zh: "条数；loop时为条纹数", ja: "バー数。loopではストライプ数" } },
    {
      name: "orientation",
      type: '"vertical" | "horizontal"',
      def: '"vertical" / "horizontal" (loop)',
      desc: { en: "Stripe direction", zh: "条纹方向", ja: "ストライプの向き" },
    },
    { name: "thickness", type: "number (px)", def: "4 / 3 (loop)", desc: { en: "Bar thickness", zh: "条的粗细", ja: "バーの太さ" } },
    { name: "length", type: "number (px)", def: "18", desc: { en: "Line only", zh: "仅line", ja: "lineのみ" } },
    { name: "gap", type: "number (px)", def: "3", desc: { en: "Line only", zh: "仅line", ja: "lineのみ" } },
    { name: "radius", type: "number (px)", def: "2", desc: { en: "Bar corner radius", zh: "条的圆角", ja: "バーの角丸" } },
    {
      name: "origin",
      type: '"center" | "start" | "end"',
      def: '"center"',
      desc: { en: "Fixed end for stretch (line only)", zh: "stretch的固定端（仅line）", ja: "stretchの固定端（lineのみ）" },
    },
    { name: "ringSize", type: "number (px)", def: "28", desc: { en: "Loop height (loop only)", zh: "环高（仅loop）", ja: "ループの高さ（loopのみ）" } },
    { name: "aspect", type: "number", def: "1", desc: { en: "Loop width ÷ height", zh: "环的宽高比", ja: "ループの幅 ÷ 高さ" } },
    { name: "squareness", type: "number", def: "2", desc: { en: "Superellipse exponent: 2 oval, 4 squarish", zh: "超椭圆指数：2椭圆、4方圆", ja: "スーパー楕円の指数。2で楕円、4で角丸の四角" } },
    { name: "stroke", type: "number (px)", def: "ringSize × 0.3", desc: { en: "How far pills reach inward from the outline", zh: "药丸自轮廓向内伸入的长度", ja: "輪郭から内側へのピルの長さ" } },
  ],
  dots: [
    { name: "pattern", type: SEQ_PATTERN, def: '"wave"', desc: { en: "How the wave travels the dots", zh: "波的行进方式", ja: "波の進み方" } },
    {
      name: "arrangement",
      type: '"line" | "loop"',
      def: '"line"',
      desc: {
        en: "A row of dots, or elements riding a closed loop",
        zh: "一排圆点，或沿闭环分布的元素",
        ja: "一列のドットか、閉じたループ上のエレメントか",
      },
    },
    { name: "count", type: "number", def: "3 / 8 (loop)", desc: { en: "Number of elements", zh: "元素数量", ja: "エレメントの数" } },
    { name: "size", type: "number (px)", def: "7", desc: { en: "Dot diameter (line only)", zh: "圆点直径（仅 line）", ja: "ドット径（line のみ）" } },
    { name: "gap", type: "number (px)", def: "4", desc: { en: "Line only", zh: "仅 line", ja: "line のみ" } },
    { name: "ringSize", type: "number (px)", def: "28", desc: { en: "Loop height through element centers (loop only)", zh: "过元素中心的环高（仅 loop）", ja: "エレメント中心を通るループの高さ（loop のみ）" } },
    { name: "aspect", type: "number", def: "1", desc: { en: "Loop width ÷ height", zh: "环的宽高比", ja: "ループの幅 ÷ 高さ" } },
    { name: "squareness", type: "number", def: "2", desc: { en: "2 ellipse, 4 squircle, 1 diamond", zh: "2 椭圆、4 方圆、1 菱形", ja: "2 で楕円、4 でスクワークル、1 でひし形" } },
    {
      name: "align",
      type: '"tangent" | "radial"',
      def: '"tangent"',
      desc: { en: "tangent traces the outline; radial points at the center", zh: "tangent 沿轮廓排布，radial 指向圆心", ja: "tangent は輪郭に沿う、radial は中心を向く" },
    },
    { name: "length / thickness", type: "number (px)", def: "6 / 6", desc: { en: "Loop element box: equal = dots, elongated = ticks", zh: "loop 元素尺寸：相等是圆点，拉长是刻度", ja: "loop エレメントの寸法。同値でドット、長くすると目盛り状" } },
    { name: "radius", type: "number (px)", def: "half the element", desc: { en: "Corner radius", zh: "圆角", ja: "角丸" } },
  ],

}

function PropsTable({ rows, lang, t }: { rows: PropRow[]; lang: Lang; t: Strings }) {
  return (
    <div className="props-scroll">
      <table className="props-table">
        <thead>
          <tr>
            <th>{t.thProp}</th>
            <th>{t.thType}</th>
            <th>{t.thDefault}</th>
            <th>{t.thDesc}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="p-name">{r.name}</td>
              <td className="p-type">{r.type}</td>
              <td className="p-def">{r.def}</td>
              <td className="p-desc">{r.desc[lang]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PropsSection({ lang, t }: { lang: Lang; t: Strings }) {
  return (
    <section className="props">
      <p className="props-caption">Shared props · all components</p>
      <PropsTable rows={SHARED_PROPS} lang={lang} t={t} />
      {(Object.keys(COMPONENT_PROPS) as ElementKind[]).map((el) => (
        <div key={el} className="props-group">
          <p className="props-caption">{`<${COMPONENT_NAMES[el]} />`}</p>
          <PropsTable rows={COMPONENT_PROPS[el]} lang={lang} t={t} />
        </div>
      ))}
    </section>
  )
}
