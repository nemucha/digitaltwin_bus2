document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const csvDataOutput = document.getElementById('csvDataOutput');
    const csvFilePath = 'data/2025-04-08_com2.csv'; // GitHub Pagesでの相対パス

    let csvDataArray = []; // CSVデータを格納する二次元配列

    try {
        messageElement.textContent = `CSVファイルを読み込み中: ${csvFilePath}...`;

        // CSVファイルを非同期でフェッチ
        const response = await fetch(csvFilePath);

        // レスポンスが正常か確認
        if (!response.ok) {
            throw new Error(`HTTPエラー！ステータス: ${response.status}`);
        }

        // テキストとしてCSVの内容を取得
        const csvText = await response.text();

        // CSVテキストを解析して二次元配列に変換
        // 各行を分割し、各行のカンマで区切られた値をさらに分割
        csvDataArray = csvText.trim().split('\n').map(row => {
            // 各行の値をカンマで分割。引用符がある場合は適切に処理する必要があるが、
            // 今回は単純なCSVを想定。より複雑なCSVにはライブラリの利用を推奨。
            return row.split(',');
        });

        // データの表示
        messageElement.textContent = `CSVデータを読み込みました！`;
        csvDataOutput.textContent = '取得した二次元配列:\n' + JSON.stringify(csvDataArray, null, 2);

        // ★★★ ここから csvDataArray を使って処理を行う ★★★
        console.log('取得したCSVデータ (二次元配列):', csvDataArray);
        console.log('最初の行:', csvDataArray[0]);
        console.log('2行目の3列目のデータ:', csvDataArray[1] ? csvDataArray[1][2] : 'データなし');

    } catch (error) {
        messageElement.textContent = `CSVファイルの読み込み中にエラーが発生しました: ${error.message}`;
        console.error('CSV読み込みエラー:', error);
    }
});