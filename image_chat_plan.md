# 📸 画像チャット表示機能 実装メモ

> 作成日: 2026-07-14
> 目的: カメラボタンでOCRするだけでなく、画像をチャット画面にLINEのように表示してジーニーと会話できるようにする

---

## 🎯 やりたいこと

- 画像を選んだ or 撮影したとき、チャット画面にサムネイルで表示
- 画像に対してジーニーがコメントできる（OCRではなく、画像を「見て」返答）
- LINEみたいな体験：画像バブル → ジーニーの返信バブル

---

## 📌 現状の仕組み（把握済み）

| 場所 | 内容 |
|------|------|
| `index.html` L114 | カメラボタン `#cameraBtn` がある |
| `index.html` L359-360 | `#ocrCameraInput`, `#ocrFileInput` がある（隠しinput） |
| `script.js` L2070~ | カメラボタン click → `openOcrModal()` |
| `script.js` L1045~ | `handleOcrFile()` → プレビュー表示してOCR実行 |
| `script.js` L1062~ | `performGeminiOcr()` → Gemini APIに画像送ってテキスト抽出 |
| `script.js` L1062~ | requestBodyに `inlineData` (base64) を含めてAPI呼び出し済み |

**ポイント**: すでに base64でGemini APIに画像を送る仕組みがある！  
→ OCRプロンプトを「画像を見て会話する」プロンプトに変えれば良い

---

## 🛠️ 実装方針

### ① カメラボタンの動作を「2択」にする（または新しいモードを追加）

**案A**: カメラボタン長押し or 右クリックで「チャットに画像を送る」  
**案B**: カメラボタンクリックでモーダルを出し、「文字読み込み」か「画像で話す」か選ぶ  
**案C**: カメラボタンとは別に「🖼️画像送信ボタン」を追加（シンプル）← **推奨**

### ② 画像をチャットバブルに表示する

`addMessage()` 関数を拡張して、`imageData`（base64）を受け取れるようにする

```js
// 現状
addMessage(text, role)

// 拡張後
addMessage(text, role, { imageData: base64, mimeType: 'image/jpeg' })
```

チャットバブルのHTML内に `<img>` タグを追加して表示。

### ③ ジーニーへ画像付きで会話を送る

`sendMessage()` でAPIを呼ぶとき、`contents[].parts` に:
- `inlineData: { mimeType, data }` ← 画像
- `text: ユーザーのメッセージ` ← テキスト

を両方入れる（マルチモーダル）

---

## 📝 変更が必要なファイル

### `index.html`
- 画像送信用の隠しinputを追加（`#imageChatInput`）
- 入力エリアに画像ボタン追加（カメラアイコンと別）または既存ボタン改修
- チャットバブルのCSSクラスに画像対応を追加

### `script.js`
- `addMessage()` に imageData オプションを追加
- 画像ファイル選択イベントハンドラを追加
- `sendMessage()` でimageDataがある場合、APIリクエストのpartsに追加
- 画像プレビュー（送信前のサムネイル表示）を入力エリアに追加

### `style.css`
- チャットバブル内の画像スタイル（角丸、最大幅など）
- 送信前プレビューのスタイル

---

## 🔑 Gemini API マルチモーダルの書き方

```js
{
  contents: [
    ...会話履歴,
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64String  // "data:image/jpeg;base64," の後ろだけ
          }
        },
        {
          text: "この画像について教えて"
        }
      ]
    }
  ]
}
```

---

## ⚠️ 注意点

- base64画像はトークンを大量消費するので、会話履歴に含めるときは **最新の1枚だけ** にするか、履歴から除外する設計が必要
- スマホカメラで撮った写真はサイズが大きいので、canvas でリサイズしてから送る（例: 長辺1024px以下）

---

## 🚀 実装ステップ（中断しても再開できるよう細かく）

1. **STEP 1**: `index.html` に `#imageChatInput`（隠しinput）追加
2. **STEP 2**: 入力エリアに 🖼️ ボタン追加
3. **STEP 3**: `style.css` にバブル内画像・プレビューのスタイル追加
4. **STEP 4**: `addMessage()` を拡張して画像バブルを表示
5. **STEP 5**: 画像選択時のプレビュー表示（テキスト欄の上に小さく）
6. **STEP 6**: `sendMessage()` でimageDataをAPIリクエストに含める
7. **STEP 7**: 送信後、imageDataをクリア
8. **STEP 8**: 画像リサイズ処理（canvas）を追加

---

## Git 操作メモ

```bash
git add image_chat_plan.md
git commit -m "docs: add image chat feature design memo"
git push
```
