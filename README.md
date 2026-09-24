# くらしの安全探検・GitHub Pages配信用

このフォルダー全体を公開用リポジトリの main ブランチに配置します。
GitHub の Settings → Pages → Source は GitHub Actions にします。
Actions の Publish game to GitHub Pages が成功すると、Pages のURLでゲームが開きます。
通常のゲームURLの末尾に teacher.html を付けると先生用の入口です。

先生画面では授業名・問題コード・公開したゲームURLを設定し、作られた専用QRを配ります。
生徒は組・番号を入力し、ゲーム内で理由と改善案を書くと自動送信されます。
先生の一覧・Excelは、別の回収サービス上で認証・保存します。GitHubに回答は保存しません。
先生の認証は現在ChatGPTです。Google認証は未実装です。
回収先: https://safety-home-connection-check.proud-bow-6894.chatgpt.site/game-teacher

受付と閲覧は作成から24時間です。授業後にExcelを保存し、不要な回答は削除してください。
写真は生徒のメモ画面用で、送信対象に含めていません。
公開リポジトリに生徒の回答、認証情報、先生の個別トークンを追加しないでください。
GitHub Pagesの実URLでの学校実機確認は、公開先を決めた後に行います。
