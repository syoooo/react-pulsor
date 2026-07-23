# react-pulsor

[English](https://github.com/syoooo/react-pulsor/blob/main/README.md) · **简体中文** · [日本語](https://github.com/syoooo/react-pulsor/blob/main/README.ja.md)

<img src="https://raw.githubusercontent.com/syoooo/react-pulsor/main/docs/hero.svg?v=2" alt="Pulsor loaders" width="420" />

**在线 Demo → [react-pulsor.vercel.app](https://react-pulsor.vercel.app)**

可自由组合的 React 加载指示器。网格、长条与圆点，可排成线，也可绕成环，由**相位场**、**运动包络**和 **OKLab 渐变**驱动——动画只有一条走合成器的 keyframe，零依赖，无需引入任何 CSS。

市面上的 loader 大多是一段写死的动画加一个尺寸参数。Pulsor 给你四个相互独立的旋钮，任意组合都是一个不一样的 loader：

- **几何** —— 方块阵（`PulseGrid`）、直线排或条纹环的长条（`PulseBars`）、一排圆点或沿超椭圆环分布的元素（`PulseDots`）。
- **Pattern（相位场）** —— 波在图形上怎么走：平扫、对角线、涟漪、螺旋、山形折线、蛇形、种子随机，或全体同步。
- **Envelope（包络）** —— 一次「亮起」的强度曲线，ADSR 式的 `attack` / `hold` / `release`，预设从轻柔的 `breathe` 到频闪的 `flash`，再到双峰的 `heartbeat`。
- **色彩** —— 在 OKLab 空间采样的多停靠点渐变（sRGB 插值会发灰，OKLab 不会），可按空间位置取色，也可跟着动画相位走。

## 为什么它一直流畅

所有元素共享**同一条 opacity/transform keyframe**；pattern 只负责给每个元素分配一个负的 `animation-delay`（它在循环里的相位）。浏览器在主线程之外合成整个动画，所以当应用忙着处理用户正在等的那件事时——恰恰是 loader 最重要的时刻——它照样从容跳动。负延迟还意味着动画挂载即处于进行中：首帧没有尴尬的渐入。

样式在运行时注入一次（`useInsertionEffect`，按配置去重），没有任何需要引入或配置的东西。

## 安装

```sh
npm i react-pulsor
```

## 用法

```tsx
import { PulseGrid, PulseBars, PulseDots } from "react-pulsor"

// 4×4 涟漪、aurora 配色——默认的网格。
<PulseGrid />

// 均衡器：五根直立的条随行波呼吸。
<PulseBars envelope="breathe" waves={1.5} palette="lagoon" />

// 条纹环——扫描线沿闭合轮廓排布。
<PulseBars arrangement="loop" ringSize={32} stroke={10} squareness={2.2} animate="fade" />

// 经典打字指示器，带一点弹簧感的跳跃。
<PulseDots animate="bounce" easing="spring" period={800} />

// 沿超椭圆环的虚线 spinner。
<PulseDots arrangement="loop" count={12} length={7} thickness={3} aspect={0.88} squareness={2.6} />

// 自定义渐变停靠点（在 OKLab 中采样）。
<PulseGrid
  palette={[
    { color: "#B6D3EF", position: 0 },
    { color: "#F888A0", position: 1 },
  ]}
  pattern="spiral"
  rows={5}
  cols={5}
/>
```

也可以直接从精选配方起步：

```tsx
import { PulseGrid, recipes } from "react-pulsor"

<PulseGrid {...recipes.sonar.props} />
```

## 共享 props

每个组件都接受下列 props，以及任意 `HTMLAttributes<HTMLSpanElement>`（`className`、`style` 等）。

| Prop | 类型 | 默认值 |
| --- | --- | --- |
| `palette` | 预设名 \| CSS 颜色 \| `GradientStop[]` | `"aurora"` |
| `colorBy` | `"position" \| "phase" \| "linear"` | `"position"` |
| `gradientAngle` | `number`（度）——`colorBy="linear"` 的渐变方向 | `45` |
| `animate` | `"fade" \| "scale" \| "fade-scale" \| "stretch" \| "bounce" \| "sway" \| "flip"` | 各组件不同 |
| `feel` | `"calm" \| "crisp" \| "lively" \| "urgent"`——运动个性宏 | — |
| `envelope` | 预设 \| `{ attack, hold?, release }` \| 帧数组 | `"pulse"` |
| `easing` | `"linear" \| "smooth" \| "snap" \| "drift" \| "spring"` \| 任意 CSS timing function | 自动（随包络） |
| `period` | `number`——一次完整扫过的毫秒数 | `900` × feel |
| `waves` | `number`——同时在场的波前数量 | `1` |
| `dim` | `number` 0..1——静息不透明度 | 按模式 |
| `restScale` | `number` 0..1——静息缩放（scale/stretch 类） | 按模式 |
| `amplitude` | `number`——`bounce` 用 px；`sway` / `flip` 用度 | 按模式 |
| `seed` | `number`——`sparkle` 的确定性乱序种子 | `7` |
| `state` | `"loading" \| "success" \| "error"` | `"loading"` |
| `progress` | `number` 0..1——按 pattern 顺序的确定性填充 | — |
| `successColor` | `string` | `"#34D399"` |
| `errorColor` | `string` | `"#F87171"` |
| `intensity` | `number` 0..1——实时活跃度 | `1` |
| `appear` | `boolean`——挂载时 200ms 淡入 | `true` |
| `appearDelay` | `number` ms——入场前保持隐形（防闪烁） | `0` |
| `label` | `string`——aria-label | `"Loading"` |
| `respectReducedMotion` | `boolean`——遵循 `prefers-reduced-motion` | `true` |

**配色预设**：`aurora` · `ember` · `lagoon` · `ultraviolet` · `sherbet` · `glacier` · `moss` · `nocturne` · `mono`。以 `palettes` 导出；OKLab 采样器为 `sampleGradient(stops, t)`。

**Bar 原生动画**：`sway` 让每根条绕支点旋转（配 `origin`——底部支点像风吹草地，中心支点像节拍器）；`flip` 让元素绕自身长轴做 3D 翻转，百叶窗式；用在网格上则是瓷砖翻转波。两者都是纯 transform，只走合成器。

**包络预设**：`pulse`（快起长尾）· `breathe`（正弦式起伏）· `flash`（频闪）· `heartbeat`（双峰）。自定义形状写 `{ attack, hold, release }`（占一个周期的比例，剩余为静息），或显式的 `[{ at, level }, …]` 帧数组。

## 内建的运动品质

有些功夫直接做在默认值里，无需配置：

- **方向性缓动。** 不显式指定 `easing` 时，每个包络自带精修的 rise/fall 缓动对：上升段减速落峰，下降段像光的衰减——快落慢尾。显式指定一条 `easing` 仍会同时覆盖两个方向。
- **Follow-through。** `fade-scale` 里缩放比不透明度滞后约 6% 周期：元素先亮起、再鼓起，不再机械同步。
- **Feel。** `feel` 一次性设定包络、缓动与节奏：`calm`（缓慢的正弦呼吸）、`crisp`（标准脉冲）、`lively`（先蓄力下探、峰值过冲、弹簧上升）、`urgent`（频闪 + snap 提速）。显式 props 永远优先。
- **入场。** loader 挂载时以 200ms 淡入（`appear`）；设 `appearDelay={300}` 可实现「加载够快就不闪 spinner」。
- **减弱动态效果。** 在 `prefers-reduced-motion` 下，循环退化为极慢的不透明度呼吸——对前庭安全，但仍看得出「在加载」，而不是一张静止帧。

包络帧的 level 允许超出 `[0, 1]`：略微为负是蓄力（anticipation），大于 1 是过冲（overshoot）。

## `<PulseGrid />`

rows × cols 的方块阵，由 pattern 扫过。

| Prop | 类型 | 默认值 |
| --- | --- | --- |
| `pattern` | `"ripple" \| "sweep-up" \| "sweep-down" \| "sweep-left" \| "sweep-right" \| "diagonal" \| "chevron" \| "snake" \| "spiral" \| "sparkle" \| "pulse"` | `"ripple"` |
| `rows` / `cols` | `number` | `4` / `4` |
| `cellSize` | `number` px | `6` |
| `gap` | `number` px | `3` |
| `radius` | `number` px | `1.5` |

## `<PulseBars />`

直线排的条（均衡器、起草行），或堆叠成**条纹环**——药丸沿闭合超椭圆轮廓排布、向内伸入 `stroke` 的长度，中间几行在开口处一分为二。`aspect`、`squareness`、`stroke` 共同决定剪影，从圆徽章到字标风格都能贴合。配 `colorBy="linear"` 可以让一条渐变贯穿所有药丸。

| Prop | 类型 | 默认值 |
| --- | --- | --- |
| `pattern` | `"wave" \| "wave-reverse" \| "center" \| "edges" \| "alternate" \| "sparkle" \| "pulse"` | `"wave"` |
| `arrangement` | `"line" \| "loop"` | `"line"` |
| `count` | `number`——条数（loop 时为条纹数） | line `5`，loop `8` |
| `orientation` | `"vertical" \| "horizontal"`——条纹方向 | line `"vertical"`，loop `"horizontal"` |
| `thickness` | `number` px | line `4`，loop `3` |
| `length` | `number` px（仅 line） | `18` |
| `gap` | `number` px（仅 line） | `3` |
| `radius` | `number` px | `2` |
| `origin` | `"center" \| "start" \| "end"`——`stretch` 的固定端（仅 line） | `"center"` |
| `ringSize` | `number` px——环高（仅 loop） | `28` |
| `aspect` | `number`——宽 ÷ 高（仅 loop） | `1` |
| `squareness` | `number`——超椭圆指数（仅 loop） | `2` |
| `stroke` | `number` px——药丸自轮廓向内的长度（仅 loop） | `ringSize * 0.3` |

## `<PulseDots />`

一排圆点（打字指示器和它的亲戚们）；设 `arrangement="loop"` 则元素沿超椭圆按弧长均匀分布——`length === thickness` 时是圆点，拉长就是刻度。`align="tangent"` 沿轮廓描线（虚线环），`align="radial"` 全部指向圆心（表针式）。

| Prop | 类型 | 默认值 |
| --- | --- | --- |
| `pattern` | 同 bars | `"wave"` |
| `arrangement` | `"line" \| "loop"` | `"line"` |
| `count` | `number` | line `3`，loop `8` |
| `size` | `number` px——圆点直径（仅 line） | `7` |
| `gap` | `number` px（仅 line） | `4` |
| `ringSize` | `number` px——环高（仅 loop） | `28` |
| `aspect` | `number`——宽 ÷ 高 | `1` |
| `squareness` | `number`——`2` 椭圆、`4` 方圆、`1` 菱形 | `2` |
| `align` | `"tangent" \| "radial"`（仅 loop） | `"tangent"` |
| `length` / `thickness` | `number` px——loop 元素尺寸 | `6` / `6` |
| `radius` | `number` px | 元素的一半 |

## Pattern 的原理

pattern 是元素上的距离场 `d`——等距的元素同时亮起。每个元素的延迟是 `-(d / (max + 1)) × period`，`waves` 决定同时有几道波前在场。几个例子：

- **ripple** —— 到网格中心的切比雪夫距离（一圈圈扩散）
- **spiral** —— 从中心向外的矩形螺旋访问顺序
- **chevron** —— `(rows − 1 − row) + |col − center|`，一道向上爬的折线
- **snake** —— 逐行往复的蛇形路径
- **sparkle** —— 种子化的 Fisher–Yates 乱序（SSR 下也确定）

环与条纹环的几何同样导出：`superellipsePoints(count, w, h, squareness)` 返回按弧长均匀、带切向/径向角度的点；`stripedO(...)` 返回条纹环的分段矩形。

## 状态与进度

loader 需要一个「结局」。设 `state="success"`，网格会**收束成一个 ✓**（stencil 对任意 rows × cols 光栅化）；`state="error"` 收束为 ✗ 并抖动一次。条与点则整体定格为状态色，沿 pattern 顺序错峰弹出。两个一次性动画都遵循 `prefers-reduced-motion`。

```tsx
<PulseGrid rows={5} cols={5} state={done ? "success" : "loading"} />
```

传 `progress`（0..1）得到确定性 loader：元素按 pattern 顺序点亮——螺旋网格盘旋着填满，环像圆弧进度，条像一格格的仪表。

```tsx
<PulseBars count={12} progress={uploaded / total} />
```

## 流式强度

为 AI 产品而生：把 `intensity` 接到 token 流上，loader 会跟着呼吸——数据到达时饱满明亮，间隙里缓缓暗下去。衰减交给 `useStreamIntensity`：

```tsx
const { intensity, ping } = useStreamIntensity({ decay: 900, floor: 0.35 })
// 每收到一个流式分块就调用 ping()
<PulseDots intensity={intensity} />
```

## 无障碍

每个 loader 渲染 `role="status"`，`label` 可配置。在 `prefers-reduced-motion: reduce` 下动画退化为极慢的不透明度呼吸（可用 `respectReducedMotion={false}` 关闭）。

## 配方

一组精选配置以 `recipes` 导出。每个都是 `{ element, title, blurb, props }`，把 props 展开到对应组件即可。demo 站的画廊就直接渲染自这份导出。

<!-- recipes-table:start -->
| 配方 | 组件 | 说明 |
| --- | --- | --- |
| `sonar` | `<PulseGrid />` | 方形波纹从中心一圈圈散开，慢而通透。 |
| `typing` | `<PulseDots />` | 经典三点跳动，弧线被调成「跳」而不是「晃」。 |
| `comet` | `<PulseDots />` | 亮头长尾，相位取色画出拖尾。 |
| `equalizer` | `<PulseBars />` | 直立的条随行波呼吸——音频表的能量感。 |
| `galaxy` | `<PulseGrid />` | 螺旋相位场——波从中心盘旋而出。 |
| `static` | `<PulseGrid />` | 种子乱序加频闪包络——两个台之间的电视雪花。 |
| `glyph` | `<PulseDots />` | 虚线勾出的环——调aspect与squareness贴合你的字标。 |
| `monogram` | `<PulseBars />` | 条纹拼出的一枚徽标，扫描线绕行一周。stroke和squareness按口味调。 |
| `heartbeat` | `<PulseDots />` | 一颗点，双峰包络。扑通、扑通。 |
| `ticker` | `<PulseGrid />` | 低而宽的格子带，波从左向右跑马。 |
| `stadium` | `<PulseDots />` | 方圆跑道——波在圆角上一圈圈地跑。 |
| `kelp` | `<PulseBars />` | 条从根部摆动，波经过时像风穿过草地。 |
| `sunburst` | `<PulseDots />` | 径向刻度绕环闪耀——转得发烫的表盘。 |
| `drizzle` | `<PulseGrid />` | 随机格子拉伸闪烁——窗上的雨痕。 |
| `metronome` | `<PulseDots />` | 两点硬切换位——极简、机械。 |
| `breather` | `<PulseGrid />` | 整块同步吸气——安静的待机态，而非忙碌态。 |
| `manuscript` | `<PulseBars />` | 从左边距长出的横线，像正在起草的文字。 |
| `ascent` | `<PulseGrid />` | 宽幅山形折线向上爬——有方向、不停歇。 |
| `louver` | `<PulseBars />` | 板条绕自身轴翻转——过堂风里的百叶窗。 |
| `orbit` | `<PulseDots />` | 被波不断追圈的一环圆点——spinner的基因，渐变的身体。 |
| `beacon` | `<PulseDots />` | 一圈小灯快速轮转，形状眼熟，颜色鲜活。 |
<!-- recipes-table:end -->

## 给 AI 助手

机器可读的文档在 [react-pulsor.vercel.app/llms.txt](https://react-pulsor.vercel.app/llms.txt)（索引）与 [/llms-full.txt](https://react-pulsor.vercel.app/llms-full.txt)（完整参考，含每个配方展开后的 JSX）。npm 包内也随附一份 `AGENTS.md` 速查表。

## 开发

```sh
npm install          # 安装库与 demo 站（npm workspaces）
npm run site         # demo/playground：http://localhost:3030
npm run build        # tsup → dist（ESM + CJS + d.ts）
npm run typecheck
```

## 许可证

MIT
