# 月間活動目標・報告メーカー

`index.html` をブラウザで開くだけで使えます。Node.js、DB、サーバーの起動は不要です。

- 年を数値入力・月をドロップダウンで変更
- 実績の入力が1つでもあれば「報告」、なければ「目標」と自動判定（チェック済みの項目も実績として扱います）
- 見出しと項目を追加・削除
- 「≡」をドラッグして見出しグループ、グループ内の項目を並び替え（タッチ操作・上下キーにも対応）
- 項目名、実績、目標、単位を編集
- 数値式／チェック式を選択
- サイトと同じ配色・角丸カードのPNG画像を保存（入力枠・形式選択・操作ボタンは画像に含まれません）
- ブラウザのlocalStorageに自動保存
- JSONでデータの書き出し・読み込み
- PWAとしてホーム画面に追加・オフラインで起動

画面は編集欄のみで、プレビューは表示しません。「画像を保存」を押すと活動内容からPNGを生成します。

実績は常に入力できます。実績をすべて空欄にし、チェックもすべて外すと「目標」に戻ります。数値の「0」も実績として扱います。
チェック式では「内容」に「第4話 プロット」などの補足を入力できます。
目標の出力画像では実績欄・「／」・未チェックの「—」を表示しません。
報告の出力画像では目標未達の実績と未チェックの「—」を赤字にします。

データはブラウザ・端末ごとに保存されます。月ごとにJSONを書き出すと、過去の活動も保管できます。ブラウザのデータ削除に備えて、必要な記録はJSONでも保存してください。

Google Fontsが利用できない場合は端末の標準フォントで動作します。

## 構成

HTML / CSS / JavaScriptの静的アプリです。Reactプロジェクトではないため、DockerやPostgreSQLは使用していません。静的ホスティングにもそのまま配置できます。

```text
index.html                          画面
style.css                           スタイル
app.js                              編集・保存・並び替え・画像出力
favicon.svg                         カレンダー型のサイトアイコン
manifest.webmanifest                PWAの名前・起動URL・アイコン設定
pwa.js                              Service Workerの登録
sw.js                               オフライン用のキャッシュ管理
icons/                              ホーム画面用PNGアイコン
scripts/generate-icons.ps1           アイコンの再生成（Windows）
tests/pwa.test.cjs                   PWAの設定・キャッシュ処理のテスト
.gitignore                          個人用データ・生成物の除外
.gitattributes                      テキストファイルの改行設定
.github/workflows/deploy-pages.yml   GitHub Pages公開設定
```

## GitHubで公開する

GitHubで空のPublicリポジトリを作成したあと、このフォルダで次を実行します。
すでにGitの初期化済みなので、改めて `git init` する必要はありません。
`YOUR_ACCOUNT` と `YOUR_REPOSITORY` は実際の値に置き換えてください。

```sh
git add .
git commit -m "Initial release"
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

`.gitignore` は個人用のJSON・画像・環境変数ファイルなどを除外します。
初回起動時は今年・今月を選択し、見出し・項目がない空の状態で始まります。
活動データをサーバーに送信する処理はありません。

### GitHub Pagesでアプリも公開する場合

1. リポジトリの **Settings → Pages** を開きます。
2. **Build and deployment → Source** を **GitHub Actions** にします。
3. **Actions → Deploy to GitHub Pages → Run workflow** から `main` を実行します。
4. 完了したら **Settings → Pages** の公開URLを開きます。

以後は `main` へのpushで自動更新します。
公開URLは通常 `https://YOUR_ACCOUNT.github.io/YOUR_REPOSITORY/` です。
ワークフローはアプリ本体とPWA用ファイル・`icons/` をサイトとして配信します。README・テスト・個人用データはサイトの配信対象に含めません。

ローカルファイルと公開サイトでは保存先が異なります。移行するときは、ローカルでJSONを書き出して公開先で読み込んでください。

設定の参考：[GitHub公式ドキュメント](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## PWA・オフライン利用

GitHub PagesなどのHTTPSで公開すると、対応ブラウザからアプリとして追加できます。

- Android・PC：ブラウザの「アプリをインストール」または「ホーム画面に追加」を使用します。
- iPhone・iPad：Safariの共有メニューから「ホーム画面に追加」を選びます。

最初はオンラインでページを開いてキャッシュの保存が完了してから利用してください。
以降はオフラインでも起動・編集・PNG出力・JSONの読み込み／書き出しができます。
外部フォントが利用できない場合は端末の標準フォントを使います。
インストール用メニューの表示や名称はブラウザによって異なります。

`file://` で直接開いた場合は通常のアプリ機能を利用できますが、PWAのインストール・オフラインキャッシュは有効になりません。開発時のPWA確認には `localhost`、公開時にはHTTPSを使用してください。

新しい版は、開いているアプリと同じサイトのタブをすべて閉じたあと、再度開くと反映されます。
更新時に活動データを消す処理はありません。GitHub Pagesのワークフローがコミットごとにキャッシュの版を設定します。
別の方法で配信する場合は、更新のたびに `sw.js` の `VERSION` を変更してください。

参考：[Service Workerの動作・利用条件（MDN）](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)

## 開発

ビルドやパッケージインストールは不要です。ファイルを直接編集し、ブラウザを再読み込みします。
JavaScriptの構文確認は、Node.jsを利用できる環境で実行できます。

```sh
node --check app.js
node --check pwa.js
node --check sw.js
node --test tests/pwa.test.cjs
```
