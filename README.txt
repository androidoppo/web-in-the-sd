WebSD (websd.mlc.ai) のコピー ― 最新 WebGPU 標準対応版
====================================================

本ディレクトリは https://websd.mlc.ai/ (mlc-ai/web-stable-diffusion のデモサイト)
の全アセットをそのままコピーし、現行の WebGPU 標準に合わせて修正したものです。

修正内容 (最新 WebGPU 対応)
--------------------------
1. dist/tvmjs.bundle.js  (tvmjs.detectGPUDevice)
   - 削除された API「GPUAdapter.requestAdapterInfo()」の呼び出しを廃止。
   - 代わりに現行標準の同期属性「GPUAdapter.info」(GPUAdapterInfo) を使用。
   - 旧エンジン向けに「adapter.info が未定義かつ requestAdapterInfo が
     関数として存在する場合のみ」フォールバック呼び出し。
   - いずれも無い場合は空の GPUAdapterInfo 相当を返し、以降の処理が
     TypeError で落ちないようにした。
   → 修正前は Chrome 現行版で「adapter.requestAdapterInfo is not a function」
     (TypeError) により GPU 初期化が必ず失敗していた。

2. dist/stable_diffusion.js  (GPU ラベル表示)
   - adapterInfo.description / .vendor を無条件に参照していた箇所を、
     description → vendor → device → architecture の順で最初の非空文字列を
     採用する方式に変更。
   - 新標準ではプライバシー保護により全フィールドが空文字になることが
     あるため、その場合は接尾辞を付けず「WebGPU」のみ表示。
   - adapterInfo 自体が undefined でも例外にならないようガードを追加。

3. index.html
   - 期限切れ (2023年8月失効) の WebGPU origin-trial メタタグ 2 件を削除。
   - Instructions を現行のブラウザ事情 (Chrome/Edge 113+ の stable チャンネルで
     WebGPU 提供開始) に合わせて更新。Chrome Canary 起動コマンドの記載は削除。

動作検証 (このコピーに対して実施)
----------------------------------
- node --check による構文検証: tvmjs.bundle.js / stable_diffusion.js OK
- ローカル静的サーブ + ヘッドレスブラウザで全 24 リクエスト 200/304、
  リソース欠落なし、コンソールエラーなし。
- モックアダプタによる detectGPUDevice の単体検証:
  (a) adapter.info を持つ最新仕様アダプタ → adapterInfo として info を返却 OK
      (旧コードならここで TypeError が発生していた箇所)
  (b) requestAdapterInfo のみを持つ旧エンジン → フォールバック呼び出し OK
  (c) 全フィールド空文字 (プライバシーモード) → 例外なし、ラベルは "WebGPU" OK

実行方法
--------
任意の静的 HTTP サーバで本ディレクトリをルートとして配信してください。

  python3 -m http.server 8888
  # ブラウザで http://localhost:8888/ を開く

モデルパラメータ (~4GB) は初回のみ HuggingFace からダウンロードされます
(stable-diffusion-config.json の cacheUrl を参照)。WebGPU 対応ブラウザ
(Chrome / Edge 113 以降、Safari on macOS) で開いてください。
GPU 検出は修正済みのため、現行ブラウザでエラーにならず初期化できます。

注意: 検証環境 (GPU の無いヘッドレス環境) の制約により、実際の画像生成
(UNet/VAE の実行) までは本環境では実行できません。WebGPU を持つ実機での
動作確認をお願いします。

元サイト: https://websd.mlc.ai/ / https://github.com/mlc-ai/web-stable-diffusion
