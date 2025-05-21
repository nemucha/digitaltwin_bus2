document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const csvSummaryOutput = document.getElementById('csvSummaryOutput');
    const csvSampleOutput = document.getElementById('csvSampleOutput');
    const inputContainer = document.getElementById('inputContainer');
    const currentTimeInput = document.getElementById('current-time');
    const dayOfWeekInput = document.getElementById('dayOfWeek');
    const currentWeatherInput = document.getElementById('currentWeather');
    const searchButton = document.getElementById('searchButton');

    // 結果表示用の要素を取得
    const resultOutputDiv = document.getElementById('resultOutput');
    const mostFrequentBoardTimeSpan = document.getElementById('mostFrequentBoardTime');
    const segTimesSpan = document.getElementById('segTimes');
    const busCountSpan = document.getElementById('busCount');
    const bus1KindSpan = document.getElementById('bus1Kind');
    const bus2KindSpan = document.getElementById('bus2Kind');
    const bus3KindSpan = document.getElementById('bus3Kind');
    const bus4KindSpan = document.getElementById('bus4Kind');
    const bus5KindSpan = document.getElementById('bus5Kind');


    // HTML要素の存在チェック
    if (!messageElement || !csvSummaryOutput || !csvSampleOutput || !inputContainer ||
        !currentTimeInput || !dayOfWeekInput || !currentWeatherInput || !searchButton ||
        !resultOutputDiv || !mostFrequentBoardTimeSpan || !segTimesSpan || !busCountSpan ||
        !bus1KindSpan || !bus2KindSpan || !bus3KindSpan || !bus4KindSpan || !bus5KindSpan) {
        console.error('HTML要素が見つかりません。必要なIDを持つ要素がHTMLに存在するか確認してください。');
        return;
    }

    let allCsvData = []; // 全てのCSVデータを格納する3次元配列

    try {
        inputContainer.style.display = 'none'; // 初期状態では非表示
        resultOutputDiv.style.display = 'none'; // 結果表示も初期状態では非表示
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

        inputContainer.style.display = 'block';

        searchButton.addEventListener('click', () => {
            const time = currentTimeInput.value;
            const day = dayOfWeekInput.value;
            const weather = currentWeatherInput.value;

            const matchedRows = searchData(time, day, weather, allCsvData);

            if (matchedRows.length > 0) {
                // 最頻値を計算し、結果を表示する関数を呼び出す
                displayBusInfo(matchedRows);
            } else {
                resultOutputDiv.style.display = 'none'; // 結果がない場合は表示しない
                alert('指定された条件に合致するデータは見つかりませんでした。');
            }
        });


    } catch (error) {
        if (messageElement) {
            messageElement.textContent = `CSVファイルの読み込み中に予期せぬエラーが発生しました: ${error.message}`;
        }
        console.error('総合的なCSV読み込みエラー:', error);
        inputContainer.style.display = 'none';
        resultOutputDiv.style.display = 'none';
    }

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

        if (!inputTime || !inputDay || !inputWeather) {
            alert('時刻、曜日、天気のすべてのフィールドを入力してください。');
            console.warn('検索条件が不足しています。');
            return [];
        }

        const [inputHourStr, inputMinuteStr] = inputTime.split(':');
        if (!inputHourStr || !inputMinuteStr) {
            alert('時刻の形式が正しくありません (例: 14:30)。');
            console.error('時刻のパースに失敗しました。');
            return [];
        }
        const inputHour = parseInt(inputHourStr, 10);
        const inputMinute = parseInt(inputMinuteStr, 10);

        // CSVファイルの列インデックスを定義（ご指定の値に修正済み）
        const HOUR_COLUMN_INDEX = 4;
        const MINUTE_COLUMN_INDEX = 5;
        const DAY_OF_WEEK_COLUMN_INDEX = 2;
        const WEATHER_COLUMN_INDEX = 3;

        const matchedRows = [];

        allCsvData.forEach(csvFile => {
            csvFile.forEach(row => {
                // 必要な列が全て存在するか確認
                if (row.length > Math.max(HOUR_COLUMN_INDEX, MINUTE_COLUMN_INDEX, DAY_OF_WEEK_COLUMN_INDEX, WEATHER_COLUMN_INDEX)) {
                    const csvHourStr = row[HOUR_COLUMN_INDEX];
                    const csvMinuteStr = row[MINUTE_COLUMN_INDEX];
                    const csvDay = row[DAY_OF_WEEK_COLUMN_INDEX];
                    const csvWeather = row[WEATHER_COLUMN_INDEX];

                    const csvHour = parseInt(csvHourStr, 10);
                    const csvMinute = parseInt(csvMinuteStr, 10);

                    if (csvHour === inputHour &&
                        csvMinute === inputMinute &&
                        csvDay.toLowerCase() === inputDay.toLowerCase() &&
                        csvWeather.toLowerCase() === inputWeather.toLowerCase()) {
                        matchedRows.push(row);
                    }
                }
            });
        });

        console.log('検索結果 (合致した行の2次元配列):', matchedRows);
        return matchedRows;
    }

    /**
     * 検索結果の2次元配列から最頻の出発時刻を特定し、
     * その時刻の行から関連情報を取得して画面に表示する関数。
     *
     * @param {Array<Array<string>>} matchedRows - 検索条件に合致した行の2次元配列
     */
    function displayBusInfo(matchedRows) {
        if (matchedRows.length === 0) {
            resultOutputDiv.style.display = 'none';
            return;
        }

        // CSVファイルの列インデックスを定義（追加分を含め、ご指定の値に修正済み）
        const HOUR_COLUMN_INDEX = 4;
        const MINUTE_COLUMN_INDEX = 5;
        // const DAY_OF_WEEK_COLUMN_INDEX = 2; // 今回は使用しないが参考として残す
        // const WEATHER_COLUMN_INDEX = 3;    // 今回は使用しないが参考として残す
        const BOARD_HOUR_COLUMN_INDEX = 6;
        const BOARD_MINUTE_COLUMN_INDEX = 7;
        const SEG_TIMES_COLUMN_INDEX = 8;
        const BUS_COUNT_COLUMN_INDEX = 9;
        const BUS1_KIND_COLUMN_INDEX = 10;
        const BUS2_KIND_COLUMN_INDEX = 11;
        const BUS3_KIND_COLUMN_INDEX = 12;
        const BUS4_KIND_COLUMN_INDEX = 13;
        const BUS5_KIND_COLUMN_INDEX = 14;

        // board_hourとboard_minuteを組み合わせた時刻の出現頻度をカウント
        const timeFrequencies = {}; // 例: {"10:30": 5, "10:35": 3}
        matchedRows.forEach(row => {
            if (row.length > Math.max(BOARD_HOUR_COLUMN_INDEX, BOARD_MINUTE_COLUMN_INDEX)) {
                const boardHour = row[BOARD_HOUR_COLUMN_INDEX];
                const boardMinute = row[BOARD_MINUTE_COLUMN_INDEX];
                const combinedTime = `${boardHour.padStart(2, '0')}:${boardMinute.padStart(2, '0')}`; // "HH:MM"形式に整形

                timeFrequencies[combinedTime] = (timeFrequencies[combinedTime] || 0) + 1;
            }
        });

        let mostFrequentTime = null;
        let maxFrequency = 0;

        // 最頻値を特定
        for (const time in timeFrequencies) {
            if (timeFrequencies[time] > maxFrequency) {
                maxFrequency = timeFrequencies[time];
                mostFrequentTime = time;
            }
        }

        // 最頻値の時刻を持つ行を1つ取り出す
        let representativeRow = null;
        if (mostFrequentTime) {
            representativeRow = matchedRows.find(row => {
                if (row.length > Math.max(BOARD_HOUR_COLUMN_INDEX, BOARD_MINUTE_COLUMN_INDEX)) {
                    const boardHour = row[BOARD_HOUR_COLUMN_INDEX];
                    const boardMinute = row[BOARD_MINUTE_COLUMN_INDEX];
                    const combinedTime = `${boardHour.padStart(2, '0')}:${boardMinute.padStart(2, '0')}`;
                    return combinedTime === mostFrequentTime;
                }
                return false;
            });
        }

        if (representativeRow) {
            // 画面に情報を表示
            mostFrequentBoardTimeSpan.textContent = mostFrequentTime;
            segTimesSpan.textContent = representativeRow[SEG_TIMES_COLUMN_INDEX] || 'N/A';
            busCountSpan.textContent = representativeRow[BUS_COUNT_COLUMN_INDEX] || 'N/A';
            bus1KindSpan.textContent = representativeRow[BUS1_KIND_COLUMN_INDEX] || 'N/A';
            bus2KindSpan.textContent = representativeRow[BUS2_KIND_COLUMN_INDEX] || 'N/A';
            bus3KindSpan.textContent = representativeRow[BUS3_KIND_COLUMN_INDEX] || 'N/A';
            bus4KindSpan.textContent = representativeRow[BUS4_KIND_COLUMN_INDEX] || 'N/A';
            bus5KindSpan.textContent = representativeRow[BUS5_KIND_COLUMN_INDEX] || 'N/A';

            resultOutputDiv.style.display = 'block'; // 結果表示エリアを表示
            console.log('最頻出発時刻の代表行:', representativeRow);
        } else {
            resultOutputDiv.style.display = 'none';
            alert('最頻出発時刻を持つデータが見つかりませんでした。');
            console.error('最頻出発時刻の代表行が見つかりません。');
        }
    }
});
