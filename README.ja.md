# react-pulsor

[English](https://github.com/syoooo/react-pulsor/blob/main/README.md) · [简体中文](https://github.com/syoooo/react-pulsor/blob/main/README.zh-CN.md) · **日本語**

<img src="https://raw.githubusercontent.com/syoooo/react-pulsor/main/docs/hero.svg?v=2" alt="Pulsor loaders" width="420" />

**デモ → [react-pulsor.vercel.app](https://react-pulsor.vercel.app)**

自在に組み替えられる React のローディングインジケーター。グリッド、バー、ドットを、直線にも輪にも並べて、**位相場**と**モーションエンベロープ**、**OKLab グラデーション**で動かす。走るのはコンポジタだけの keyframe 一本。依存はゼロ、CSS の import も要らない。

世の中のローダーの多くは、作り付けのアニメーションにサイズのつまみが付いただけ。Pulsor には、互いに独立した 4 つのダイヤルがあります。組み合わせを変えれば、そのたびに別のローダーになる。

- **ジオメトリ** — セルのグリッド（`PulseGrid`）、直線またはストライプループのバー（`PulseBars`）、一列またはスーパー楕円ループ上のドット（`PulseDots`）。
- **パターン（位相場）** — 波が図形をどう渡るか。スイープ、対角線、波紋、螺旋、シェブロン、蛇行、シード乱数、あるいは全同期。
- **エンベロープ** — 一拍の強度カーブ。ADSR 式の `attack` / `hold` / `release`、プリセットは柔らかな `breathe` からストロボの `flash`、二拍の `heartbeat` まで。
- **カラー** — OKLab 空間でサンプリングする多段グラデーション（sRGB 補間は灰色に濁りますが、OKLab は濁りません）。空間位置で塗るか、アニメーションの位相に追従させるかを選べます。

## なめらかさが続く理由

すべてのエレメントが**単一の opacity/transform keyframe** を共有し、パターンは各エレメントに負の `animation-delay`（ループ内の位相）を割り当てるだけ。ブラウザはメインスレッドの外で全体を合成するので、アプリがユーザーの待っている処理で忙しいとき——つまりローダーがいちばん大事なときにも、鼓動は乱れません。負のディレイのおかげでマウント時点からアニメーションは進行中。初回描画のぎこちないフェードインもありません。

スタイルは実行時に一度だけ注入されます（`useInsertionEffect`、設定単位でデデュープ）。import するものも、設定するものもありません。

## インストール

```sh
npm i react-pulsor
```

## 使い方

```tsx
import { PulseGrid, PulseBars, PulseDots } from "react-pulsor"

// 4×4 の波紋、aurora パレット——デフォルトのグリッド。
<PulseGrid />

// イコライザー：5 本のバーが進行波で呼吸する。
<PulseBars envelope="breathe" waves={1.5} palette="lagoon" />

// ストライプループ——閉じた輪郭に沿うスキャンライン。
<PulseBars arrangement="loop" ringSize={32} stroke={10} squareness={2.2} animate="fade" />

// 定番のタイピングインジケーター、バネの効いたホップ付き。
<PulseDots animate="bounce" easing="spring" period={800} />

// スーパー楕円ループを巡る破線のスピナー。
<PulseDots arrangement="loop" count={12} length={7} thickness={3} aspect={0.88} squareness={2.6} />

// カスタムのグラデーションストップ（OKLab でサンプリング）。
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

厳選レシピから始めることもできます。

```tsx
import { PulseGrid, recipes } from "react-pulsor"

<PulseGrid {...recipes.sonar.props} />
```

## 共通 props

すべてのコンポーネントが下記の props と、任意の `HTMLAttributes<HTMLSpanElement>`（`className`、`style` など）を受け取ります。

| Prop | 型 | デフォルト |
| --- | --- | --- |
| `palette` | プリセット名 \| CSS カラー \| `GradientStop[]` | `"aurora"` |
| `colorBy` | `"position" \| "phase" \| "linear"` | `"position"` |
| `gradientAngle` | `number`（度）— `colorBy="linear"` の方向 | `45` |
| `animate` | `"fade" \| "scale" \| "fade-scale" \| "stretch" \| "bounce" \| "sway" \| "flip"` | コンポーネントごと |
| `feel` | `"calm" \| "crisp" \| "lively" \| "urgent"` — モーション個性のマクロ | — |
| `envelope` | プリセット \| `{ attack, hold?, release }` \| フレーム配列 | `"pulse"` |
| `easing` | `"linear" \| "smooth" \| "snap" \| "drift" \| "spring"` \| 任意の CSS timing function | 自動（エンベロープ由来） |
| `period` | `number` — 一巡のミリ秒 | `900` × feel |
| `waves` | `number` — 同時に走る波面の数 | `1` |
| `dim` | `number` 0..1 — 静止時の不透明度 | モードごと |
| `restScale` | `number` 0..1 — 静止時のスケール（scale/stretch 系） | モードごと |
| `amplitude` | `number` — `bounce` は px、`sway` / `flip` は度 | モードごと |
| `seed` | `number` — `sparkle` の決定的シャッフルのシード | `7` |
| `state` | `"loading" \| "success" \| "error"` | `"loading"` |
| `progress` | `number` 0..1 — パターン順の確定的フィル | — |
| `successColor` | `string` | `"#34D399"` |
| `errorColor` | `string` | `"#F87171"` |
| `intensity` | `number` 0..1 — リアルタイムの活性度 | `1` |
| `appear` | `boolean` — マウント時の 200ms フェードイン | `true` |
| `appearDelay` | `number` ms — 入場まで不可視のまま待つ（チラつき防止） | `0` |
| `label` | `string` — aria-label | `"Loading"` |
| `respectReducedMotion` | `boolean` — `prefers-reduced-motion` に従う | `true` |

**パレット**：`aurora` · `ember` · `lagoon` · `ultraviolet` · `sherbet` · `glacier` · `moss` · `nocturne` · `mono`。`palettes` として export。OKLab サンプラーは `sampleGradient(stops, t)`。

**バー固有のモーション**：`sway` は各バーを支点まわりに回転させます（`origin` と併用——根元支点なら草原を渡る風、中心支点ならメトロノーム）。`flip` はエレメントを自身の長軸まわりに 3D 回転させるブラインド式。グリッドに使えばタイルフリップの波になります。どちらも純粋な transform で、コンポジタのみ。

**エンベロープ**：`pulse`（鋭く立ち上がり長く減衰）· `breathe`（正弦波のうねり）· `flash`（ストロボ）· `heartbeat`（二拍）。カスタムは `{ attack, hold, release }`（一周期に占める割合、残りは静止）か、明示的な `[{ at, level }, …]` フレーム配列で。

## 作り込み済みのモーション品質

いくつかの仕事はデフォルトに焼き込んであります。設定は不要です。

- **方向性イージング。** `easing` を指定しなければ、各エンベロープが精修済みの rise/fall ペアを持ちます。立ち上がりはピークへ減速して着地し、下りは光の減衰のように速く落ちて長く尾を引く。`easing` を明示すれば両方向をその一本で上書きします。
- **フォロースルー。** `fade-scale` ではスケールが不透明度より約 6% 周期だけ遅れます。先に灯り、それから膨らむ——機械的な同期ではなく、重なり合うアクション。
- **Feel。** `feel` はエンベロープ・イージング・テンポをまとめて設定します：`calm`（ゆっくりした正弦の呼吸）、`crisp`（標準のパルス）、`lively`（沈み込む予備動作とオーバーシュート、バネの立ち上がり）、`urgent`（ストロボ + snap の速いテンポ）。明示的な props が常に優先。
- **入場。** ローダーはマウント時に 200ms でフェードインします（`appear`）。`appearDelay={300}` にすれば、速いロードではそもそもスピナーを見せない、あの定番パターンに。
- **Reduced motion。** `prefers-reduced-motion` 下ではループがごくゆっくりした不透明度の呼吸に変わります。前庭に安全で、それでいて「まだ読み込み中」だと伝わる——静止画ではなく。

エンベロープのフレーム level は `[0, 1]` をはみ出せます。わずかな負値は予備動作（anticipation）、1 超はオーバーシュート。

## `<PulseGrid />`

rows × cols のセル行列をパターンが掃いていきます。

| Prop | 型 | デフォルト |
| --- | --- | --- |
| `pattern` | `"ripple" \| "sweep-up" \| "sweep-down" \| "sweep-left" \| "sweep-right" \| "diagonal" \| "chevron" \| "snake" \| "spiral" \| "sparkle" \| "pulse"` | `"ripple"` |
| `rows` / `cols` | `number` | `4` / `4` |
| `cellSize` | `number` px | `6` |
| `gap` | `number` px | `3` |
| `radius` | `number` px | `1.5` |

## `<PulseBars />`

直線のバー（イコライザー、起草中の行）、または**ストライプループ**——閉じたスーパー楕円の輪郭に沿ってピルが並び、`stroke` の分だけ内側へ伸び、中段の行は開口部で二つに分かれます。`aspect`・`squareness`・`stroke` がシルエットを決め、丸いバッジからワードマーク風まで合わせられます。`colorBy="linear"` を添えれば、ひとつのグラデーションが全ピルを流れます。

| Prop | 型 | デフォルト |
| --- | --- | --- |
| `pattern` | `"wave" \| "wave-reverse" \| "center" \| "edges" \| "alternate" \| "sparkle" \| "pulse"` | `"wave"` |
| `arrangement` | `"line" \| "loop"` | `"line"` |
| `count` | `number` — バーの本数（loop ではストライプ数） | line `5`、loop `8` |
| `orientation` | `"vertical" \| "horizontal"` — ストライプの向き | line `"vertical"`、loop `"horizontal"` |
| `thickness` | `number` px | line `4`、loop `3` |
| `length` | `number` px（line のみ） | `18` |
| `gap` | `number` px（line のみ） | `3` |
| `radius` | `number` px | `2` |
| `origin` | `"center" \| "start" \| "end"` — `stretch` の固定端（line のみ） | `"center"` |
| `ringSize` | `number` px — ループの高さ（loop のみ） | `28` |
| `aspect` | `number` — 幅 ÷ 高さ（loop のみ） | `1` |
| `squareness` | `number` — スーパー楕円の指数（loop のみ） | `2` |
| `stroke` | `number` px — 輪郭から内側へのピルの長さ（loop のみ） | `ringSize * 0.3` |

## `<PulseDots />`

一列のドット（タイピングインジケーターとその親戚たち）。`arrangement="loop"` にすると、エレメントがスーパー楕円上に弧長で均等に並びます——`length === thickness` ならドット、伸ばせば目盛りに。`align="tangent"` は輪郭をなぞる破線の輪、`align="radial"` はすべて中心を向く時計式です。

| Prop | 型 | デフォルト |
| --- | --- | --- |
| `pattern` | bars と同じ | `"wave"` |
| `arrangement` | `"line" \| "loop"` | `"line"` |
| `count` | `number` | line `3`、loop `8` |
| `size` | `number` px — ドット径（line のみ） | `7` |
| `gap` | `number` px（line のみ） | `4` |
| `ringSize` | `number` px — ループの高さ（loop のみ） | `28` |
| `aspect` | `number` — 幅 ÷ 高さ | `1` |
| `squareness` | `number` — `2` 楕円、`4` スクワークル、`1` ひし形 | `2` |
| `align` | `"tangent" \| "radial"`（loop のみ） | `"tangent"` |
| `length` / `thickness` | `number` px — loop エレメントの寸法 | `6` / `6` |
| `radius` | `number` px | エレメントの半分 |

## パターンの仕組み

パターンはエレメント上の距離場 `d` です。等距離のエレメントは同時に灯ります。各エレメントのディレイは `-(d / (max + 1)) × period`、`waves` が同時に走る波面の数を掛け合わせます。いくつか例を：

- **ripple** — グリッド中心からのチェビシェフ距離（広がる波紋）
- **spiral** — 中心から外へ向かう矩形螺旋の訪問順
- **chevron** — `(rows − 1 − row) + |col − center|`、登っていく折れ線
- **snake** — 行ごとに往復する蛇行路
- **sparkle** — シード付き Fisher–Yates シャッフル（SSR でも決定的）

リングとストライプループの幾何も export しています。`superellipsePoints(count, w, h, squareness)` は弧長均等で接線/法線角度付きの点列を、`stripedO(...)` はストライプループの分割セグメントを返します。

## ステートと進捗

ローダーには幕引きが要ります。`state="success"` にするとグリッドは **✓ に収束**します（ステンシルは任意の rows × cols にラスタライズ）。`state="error"` は ✗ に収束して一度だけ震えます。バーとドットはステートカラーに全体で定着し、パターン順にずらして弾みます。どちらのワンショットも `prefers-reduced-motion` に従います。

```tsx
<PulseGrid rows={5} cols={5} state={done ? "success" : "loading"} />
```

`progress`（0..1）を渡せば確定的なローダーに。エレメントがパターン順に灯っていきます——螺旋グリッドは渦を巻いて埋まり、リングは円弧のように、バーはメーターのように。

```tsx
<PulseBars count={12} progress={uploaded / total} />
```

## ストリーミング強度

AI プロダクトのための機能です。`intensity` をトークンストリームにつなぐと、ローダーが流れに合わせて呼吸します——チャンクが届く間は明るく満ちて、途切れると静かに沈む。減衰は `useStreamIntensity` に任せられます。

```tsx
const { intensity, ping } = useStreamIntensity({ decay: 900, floor: 0.35 })
// ストリーミングのチャンクごとに ping() を呼ぶ
<PulseDots intensity={intensity} />
```

## アクセシビリティ

各ローダーは `role="status"` を持ち、`label` は変更できます。`prefers-reduced-motion: reduce` 下ではごくゆっくりした不透明度の呼吸に切り替わります（`respectReducedMotion={false}` で無効化）。

## レシピ

厳選した構成を `recipes` として同梱しています。定番（`typing`、`equalizer`、`orbit`、`beacon`、`metronome`）から、シグネチャー（`monogram`、`glyph`、`heartbeat`、`sonar`、`galaxy`、`comet`、`sunburst`、`kelp`、`louver`）、そして一癖あるもの（`static`、`drizzle`、`stadium`、`manuscript`、`ticker`、`ascent`、`breather`）まで。各レシピは `{ element, title, blurb, props }` で、props を対応するコンポーネントに展開するだけ。デモサイトのギャラリーはこの export をそのまま描画しています。

## 開発

```sh
npm install          # ライブラリとデモサイトをインストール（npm workspaces）
npm run site         # デモ / Playground：http://localhost:3030
npm run build        # tsup → dist（ESM + CJS + d.ts）
npm run typecheck
```

## ライセンス

MIT
