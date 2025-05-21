document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const csvSummaryOutput = document.getElementById('csvSummaryOutput'); // 新しい要素
    const csvSampleOutput = document.getElementById('csvSampleOutput');   // 新しい要素
    const csvFilePath = 'data/2025-04-08_com2.csv'; // GitHub Pagesでの相対パス

    let csvDataArray = []; // CSVデータを格納する二次元配列

    // 要素が存在しない場合はエラーを出して処理を中断
    if (!messageElement || !csvSummaryOutput || !csvSampleOutput) {
        console.error('HTML要素が見つかりません。id="message", id="csvSummaryOutput", または id="csvSampleOutput" がHTMLに存在するか確認してください。');
        return;
    }

    try {
        messageElement.textContent = `CSVファイルを読み込み中: ${csvFilePath}...`;

        const response = await fetch(csvFilePath);

        if (!response.ok) {
            throw new Error(`HTTPエラー！ステータス: ${response.status}`);
        }

        const csvText = await response.text();

        // CSVテキストを解析して二次元配列に変換
        csvDataArray = csvText.trim().split('\n').map(row => {
            return row.split(',');
        });

        messageElement.textContent = `CSVデータの読み込みが完了しました。`;

        // ★★★ ここから表示の変更 ★★★

        // 1. データ総数の表示
        csvSummaryOutput.innerHTML = `
            <h2>CSVデータ概要</h2>
            <p><strong>総行数:</strong> ${csvDataArray.length}行</p>
            <p><strong>総列数 (最初の行に基づく):</strong> ${csvDataArray.length > 0 ? csvDataArray[0].length : 0}列</p>
        `;

        // 2. サンプルデータの表示 (最初の5行を例として表示)
        const sampleRows = 5;
        let sampleOutputText = '<h3>サンプルデータ (最初の' + sampleRows + '行):</h3>';

        if (csvDataArray.length === 0) {
            sampleOutputText += '<p>データがありません。</p>';
        } else {
            // ヘッダー行を含めて最初の sampleRows + 1 行を取得（もしあれば）
            const rowsToShow = csvDataArray.slice(0, sampleRows);
            sampleOutputText += '<pre>'; // 整形されたテキストを表示するために<pre>タグを使用
            rowsToShow.forEach(row => {
                sampleOutputText += row.join(', ') + '\n'; // カンマ区切りで表示
            });
            sampleOutputText += '</pre>';
        }
        csvSampleOutput.innerHTML = sampleOutputText;


        // ★★★ 取得したcsvDataArrayを使って、さらにデータを処理・分析できます ★★★
        // 例えば、特定の列のデータを取得したり、計算を行ったりなど
        console.log('取得したCSVデータ (二次元配列):', csvDataArray);
        // 例: 最初の行（ヘッダー）を表示
        if (csvDataArray.length > 0) {
            console.log('ヘッダー行:', csvDataArray[0]);
        }
        // 例: 特定の列のデータをコンソールに表示
        if (csvDataArray.length > 1 && csvDataArray[0].length > 0) {
            // 最初のデータ列 (インデックス0) を取得 (ヘッダーを除く)
            const firstColumnData = csvDataArray.slice(1).map(row => row[0]);
            console.log('最初の列のデータ (ヘッダーを除く):', firstColumnData);
        }

    } catch (error) {
        if (messageElement) {
            messageElement.textContent = `CSVファイルの読み込み中にエラーが発生しました: ${error.message}`;
        }
        console.error('CSV読み込みエラー:', error);
    }
});
