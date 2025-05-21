document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const csvSummaryOutput = document.getElementById('csvSummaryOutput');
    const csvSampleOutput = document.getElementById('csvSampleOutput');
    const inputContainer = document.getElementById('inputContainer');
    const currentTimeInput = document.getElementById('current-time');
    const dayOfWeekInput = document.getElementById('dayOfWeek');
    const currentWeatherInput = document.getElementById('currentWeather');
    const searchButton = document.getElementById('searchButton');

    // HTML要素の存在チェック
    if (!messageElement || !csvSummaryOutput || !csvSampleOutput || !inputContainer ||
        !currentTimeInput || !dayOfWeekInput || !currentWeatherInput || !searchButton) {
        console.error('HTML要素が見つかりません。必要なIDを持つ要素がHTMLに存在するか確認してください。');
        return;
    }

    let allCsvData = []; // 全てのCSVデータを格納する3次元配列

    try {
        inputContainer.style.display = 'none'; // 初期状態では非表示
        messageElement.textContent = `複数のCSVファイルを読み込み中...`;

        const startDate = new Date('2025-04-08');
        const endDate = new Date('2025-05-19');
        const filePromises = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const fileName = `${year}-${month}-${day}_com2.csv`;
            const filePath = `data/${fileName}`;

            filePromises.push(
                fetch(filePath)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`ファイルが見つからないか、読み込めません: ${filePath} (HTTPステータス: ${response.status})`);
                        }
                        return response.text();
                    })
                    .then(csvText => {
                        return csvText.trim().split('\n').map(row => row.split(','));
                    })
                    .catch(error => {
                        console.error(`Error loading ${filePath}:`, error.message);
                        return null;
                    })
            );
        }

        const results = await Promise.allSettled(filePromises);

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value !== null) {
                // 各CSVファイルが最低でもヘッダー行を含み、データがあることを確認
                if (result.value.length > 0) {
                    allCsvData.push(result.value);
                }
            }
        });

        messageElement.textContent = `全てのCSVデータの読み込みが完了しました。読み込んだファイル数: ${allCsvData.length}`;

        csvSummaryOutput.innerHTML = `
            <h2>CSVデータ概要</h2>
            <p><strong>読み込んだファイル数:</strong> ${allCsvData.length}個</p>
            <p><strong>最初のファイルの総行数:</strong> ${allCsvData.length > 0 ? allCsvData[0].length : 0}行</p>
            <p><strong>最初のファイルの総列数 (最初の行に基づく):</strong> ${allCsvData.length > 0 && allCsvData[0].length > 0 ? allCsvData[0][0].length : 0}列</p>
        `;

        const sampleRowsToShow = 5;
        let sampleOutputHtml = '<h3>最初のファイルのサンプルデータ (最初の' + sampleRowsToShow + '行):</h3>';

        if (allCsvData.length > 0 && allCsvData[0].length > 0) {
            const firstFileSample = allCsvData[0].slice(0, sampleRowsToShow);
            sampleOutputHtml += '<pre>';
            firstFileSample.forEach(row => {
                sampleOutputHtml += row.join(', ') + '\n';
            });
            sampleOutputHtml += '</pre>';
        } else {
            sampleOutputHtml += '<p>読み込んだデータがありません、または最初のファイルが空です。</p>';
        }
        csvSampleOutput.innerHTML = sampleOutputHtml;

        console.log('全ての取得したCSVデータ (3次元配列):', allCsvData);
        if (allCsvData.length > 0) {
            console.log('最初のファイル（2025-04-08_com2.csv）のデータ:', allCsvData[0]);
        }
        if (allCsvData.length > 0 && allCsvData[0].length > 1 && allCsvData[0][1].length > 2) {
            console.log('最初のファイルの2行目3列目のデータ:', allCsvData[0][1][2]);
        }

        // CSV読み込み完了後、入力欄を表示
        inputContainer.style.display = 'block';

        // 検索ボタンにイベントリスナーを追加
        searchButton.addEventListener('click', () => {
            const time = currentTimeInput.value; // "HH:MM"形式
            const day = dayOfWeekInput.value;
            const weather = currentWeatherInput.value;

            // 検索関数を呼び出し、取得した値を渡す
            // allCsvDataを渡すことに注意
            searchData(time, day, weather, allCsvData);
        });


    } catch (error) {
        if (messageElement) {
            messageElement.textContent = `CSVファイルの読み込み中に予期せぬエラーが発生しました: ${error.message}`;
        }
        console.error('総合的なCSV読み込みエラー:', error);
        inputContainer.style.display = 'none';
    }
});

/**
 * ユーザーが入力した時刻、曜日、天気に基づいてCSVデータを検索し、
 * 条件に合致する行を2次元配列として返す関数。
 *
 * @param {string} inputTime - 入力された現在時刻 (例: "14:30")
 * @param {string} inputDay - 入力された曜日 (例: "月曜日")
 * @param {string} inputWeather - 入力された天気 (例: "晴れ")
 * @param {Array<Array<Array<string>>>} allCsvData - 読み込まれた全てのCSVデータ (3次元配列)
 * @returns {Array<Array<string>>} 条件に合致する1次元配列（行データ）の2次元配列
 */
function searchData(inputTime, inputDay, inputWeather, allCsvData) {
    console.log('--- 検索が実行されました ---');
    console.log('検索条件:');
    console.log('時刻:', inputTime);
    console.log('曜日:', inputDay);
    console.log('天気:', inputWeather);

    // 入力値のバリデーション（オプション）
    if (!inputTime || !inputDay || !inputWeather) {
        alert('時刻、曜日、天気のすべてのフィールドを入力してください。');
        console.warn('検索条件が不足しています。');
        return []; // 条件不足の場合は空の配列を返す
    }

    // 入力時刻を時と分に分割
    const [inputHourStr, inputMinuteStr] = inputTime.split(':');
    if (!inputHourStr || !inputMinuteStr) {
        alert('時刻の形式が正しくありません (例: 14:30)。');
        console.error('時刻のパースに失敗しました。');
        return [];
    }
    const inputHour = parseInt(inputHourStr, 10);
    const inputMinute = parseInt(inputMinuteStr, 10);

    // CSVファイルの列インデックスを定義（CSVの構造に合わせて調整してください！）
    const HOUR_COLUMN_INDEX = 0;    // 例: CSVの0列目が「時」
    const MINUTE_COLUMN_INDEX = 1;  // 例: CSVの1列目が「分」
    const DAY_OF_WEEK_COLUMN_INDEX = 2; // 例: CSVの2列目が「曜日」
    const WEATHER_COLUMN_INDEX = 3; // 例: CSVの3列目が「天気」

    const matchedRows = []; // 条件に合致した1次元配列（行データ）を格納する2次元配列

    // 3次元配列 (allCsvData) をループして検索
    allCsvData.forEach(csvFile => { // 各ファイル (2次元配列)
        // ヘッダー行をスキップする場合、ループを1から始める (例: i = 1)
        // ここでは、全ての行をチェックする前提で i = 0 から開始
        csvFile.forEach(row => { // 各行 (1次元配列)
            // 行が十分な列数を持っているかチェック
            if (row.length > Math.max(HOUR_COLUMN_INDEX, MINUTE_COLUMN_INDEX, DAY_OF_WEEK_COLUMN_INDEX, WEATHER_COLUMN_INDEX)) {
                const csvHourStr = row[HOUR_COLUMN_INDEX];
                const csvMinuteStr = row[MINUTE_COLUMN_INDEX];
                const csvDay = row[DAY_OF_WEEK_COLUMN_INDEX];
                const csvWeather = row[WEATHER_COLUMN_INDEX];

                // CSVデータ内の時と分も数値に変換して比較
                const csvHour = parseInt(csvHourStr, 10);
                const csvMinute = parseInt(csvMinuteStr, 10);

                // 全ての条件が一致するかどうかをチェック
                // 文字列比較は大文字・小文字を区別する場合があるので注意（必要ならtoLowerCase()を使う）
                if (csvHour === inputHour &&
                    csvMinute === inputMinute &&
                    csvDay.toLowerCase() === inputDay.toLowerCase() && // 大文字小文字を区別しない比較
                    csvWeather.toLowerCase() === inputWeather.toLowerCase()) { // 大文字小文字を区別しない比較
                    matchedRows.push(row); // 条件に合致した行を2次元配列に追加
                }
            }
        });
    });

    console.log('検索結果 (合致した行の2次元配列):', matchedRows);

    if (matchedRows.length > 0) {
        alert(`検索が完了しました。\n${matchedRows.length}件のデータが一致しました。\n結果はコンソールを確認してください。`);
        // 検索結果を画面に表示するロジックをここに追加することもできます
        // 例: outputDiv.innerHTML = '<h3>検索結果:</h3><pre>' + matchedRows.map(r => r.join(', ')).join('\n') + '</pre>';
    } else {
        alert('指定された条件に合致するデータは見つかりませんでした。');
    }

    return matchedRows; // 検索結果を返す
}
