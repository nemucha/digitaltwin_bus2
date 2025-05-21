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
    const bus2KindSpan = document = document.getElementById('bus2Kind'); // 修正: `=` が一つ多い
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

    let allCsvData = []; // 全ての生のCSVデータを格納する3次元配列
    // ★★★ 検索高速化のためのインデックス化されたデータ構造 ★★★
    // 構造例: { '月曜日': { '晴れ': { '08:00': [row1, row2], '08:05': [row3] }, ... }, ... }
    let indexedBusData = {}; 

    // CSVファイルの列インデックスを定義（修正前のsearchData関数から移動）
    // ★★★ 実際のCSVファイルの構造に合わせてこれらのインデックスを調整してください ★★★
    const SEG_TIMES_COLUMN_INDEX = 0;
    const DAY_OF_WEEK_COLUMN_INDEX = 2;
    const WEATHER_COLUMN_INDEX = 3;
    const HOUR_COLUMN_INDEX = 5;
    const MINUTE_COLUMN_INDEX = 6;
    const BOARD_HOUR_COLUMN_INDEX = 12;
    const BOARD_MINUTE_COLUMN_INDEX = 13;
    const BUS_COUNT_COLUMN_INDEX = 14;
    const BUS1_KIND_COLUMN_INDEX = 15;
    const BUS2_KIND_COLUMN_INDEX = 16;
    const BUS3_KIND_COLUMN_INDEX = 17;
    const BUS4_KIND_COLUMN_INDEX = 18;
    const BUS5_KIND_COLUMN_INDEX = 19;


    try {
        inputContainer.style.display = 'none'; // 初期状態では非表示
        resultOutputDiv.style.display = 'none'; // 結果表示も初期状態では非表示
        messageElement.textContent = `複数のCSVファイルを読み込み中...`;

        const startDate = new Date('2025-04-08');
        const endDate = new Date('2025-05-19'); // 2025-05-19 まで含める
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
                        // console.log(`--- Loaded CSV: ${fileName} ---`); // デバッグ用ログは必要に応じて有効に
                        // csvText.split('\n').slice(0, 5).forEach(line => console.log(line));
                        // console.log(`--- End of ${fileName} sample ---`);
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
                // allCsvData.push(result.value.slice(1)); // ヘッダーをスキップする場合
                allCsvData.push(result.value); // ヘッダーをスキップしない設定
            }
        });

        messageElement.textContent = `全てのCSVデータの読み込みが完了しました。読み込んだファイル数: ${allCsvData.length}`;

        // ★★★ ここでデータをインデックス化する ★★★
        if (allCsvData.length > 0) {
            messageElement.textContent += ' データを検索用に最適化中...';
            indexedBusData = buildIndex(allCsvData);
            messageElement.textContent = `全てのCSVデータの読み込みと最適化が完了しました。読み込んだファイル数: ${allCsvData.length}`;
            console.log('検索用に最適化されたデータ (indexedBusData):', indexedBusData);
        }


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

        // console.log('全ての取得したCSVデータ (3次元配列):', allCsvData); // 必要に応じて有効に
        // if (allCsvData.length > 0) {
        //     console.log('最初のファイル（2025-04-08_com2.csv）のデータ:', allCsvData[0]);
        // }
        // if (allCsvData.length > 0 && allCsvData[0].length > 1 && allCsvData[0][1].length > 2) {
        //     console.log('最初のファイルの2行目3列目のデータ:', allCsvData[0][1][2]);
        // }

        inputContainer.style.display = 'block';

        searchButton.addEventListener('click', () => {
            const time = currentTimeInput.value;
            const day = dayOfWeekInput.value;
            const weather = currentWeatherInput.value;

            // 検索前にログをクリアして、新しい検索のログを見やすくする
            console.clear();
            console.log('--- 新しい検索開始 ---');
            console.log(`入力された時刻: "${time}", 曜日: "${day}", 天気: "${weather}"`);

            // ★★★ 修正されたsearchData関数を呼び出す ★★★
            const matchedRows = searchData(time, day, weather, indexedBusData);

            if (matchedRows.length > 0) {
                displayBusInfo(matchedRows);
            } else {
                resultOutputDiv.style.display = 'none';
                alert('指定された条件に合致するデータは見つかりませんでした。');
                console.warn('検索条件に合致するデータが見つかりませんでした。');
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
     * 読み込まれた3次元配列のCSVデータを、検索キー（曜日、天気、時刻）に基づいてインデックス化する関数。
     * この関数は、ページのロード時に一度だけ実行され、検索を高速化するためのデータ構造を構築します。
     *
     * @param {Array<Array<Array<string>>>} allCsvData - 読み込まれた全ての生のCSVデータ (3次元配列)
     * @returns {Object} 検索キーでアクセス可能なインデックス化されたデータ
     */
    function buildIndex(allCsvData) {
        console.log('--- buildIndex関数実行: データインデックス化を開始 ---');
        const index = {};

        if (allCsvData.length === 0) {
            console.warn('buildIndex: 処理するCSVデータがありません。');
            return index;
        }

        allCsvData.forEach(csvFile => {
            // ★ヘッダー行をスキップする場合の例: csvFile.slice(1).forEach(...)
            csvFile.forEach(row => {
                // 必要な列が全て揃っているかチェック
                const requiredMaxIndex = Math.max(HOUR_COLUMN_INDEX, MINUTE_COLUMN_INDEX, DAY_OF_WEEK_COLUMN_INDEX, WEATHER_COLUMN_INDEX);
                if (row.length <= requiredMaxIndex) {
                    // console.warn(`buildIndex: 行は必要な列数(${requiredMaxIndex + 1})を満たしていません。スキップします。`, row);
                    return;
                }

                const day = row[DAY_OF_WEEK_COLUMN_INDEX].trim().toLowerCase();
                const weather = row[WEATHER_COLUMN_INDEX].trim().toLowerCase();
                const hourStr = row[HOUR_COLUMN_INDEX].trim();
                const minuteStr = row[MINUTE_COLUMN_INDEX].trim();

                if (!hourStr || !minuteStr || isNaN(parseInt(hourStr, 10)) || isNaN(parseInt(minuteStr, 10))) {
                    // console.warn('buildIndex: 時刻の形式が不正な行をスキップ。', row);
                    return;
                }

                const timeKey = `${hourStr.padStart(2, '0')}:${minuteStr.padStart(2, '0')}`;

                if (!index[day]) {
                    index[day] = {};
                }
                if (!index[day][weather]) {
                    index[day][weather] = {};
                }
                if (!index[day][weather][timeKey]) {
                    index[day][weather][timeKey] = [];
                }
                index[day][weather][timeKey].push(row);
            });
        });
        console.log('--- buildIndex関数実行: データインデックス化が完了 ---');
        return index;
    }


    /**
     * ユーザーが入力した時刻、曜日、天気に基づいてインデックス化されたデータを検索し、
     * 条件に合致する行を2次元配列として返す関数。
     * ★★★ この関数はインデックス化されたデータ構造を使用するため、検索が高速になります。 ★★★
     *
     * @param {string} inputTime - 入力された現在時刻 (例: "14:30")
     * @param {string} inputDay - 入力された曜日 (例: "月曜日")
     * @param {string} inputWeather - 入力された天気 (例: "晴れ")
     * @param {Object} indexedBusData - buildIndex関数で作成されたインデックス化されたデータ
     * @returns {Array<Array<string>>} 条件に合致する1次元配列（行データ）の2次元配列
     */
    function searchData(inputTime, inputDay, inputWeather, indexedBusData) {
        console.log('--- searchData関数実行 (インデックス使用) ---');
        console.log(`検索条件: 時刻:"${inputTime}", 曜日:"${inputDay}", 天気:"${inputWeather}"`);

        if (!inputTime || !inputDay || !inputWeather) {
            console.warn('検索条件が不足しています。');
            return [];
        }

        const [inputHourStr, inputMinuteStr] = inputTime.split(':');
        if (!inputHourStr || !inputMinuteStr) {
            alert('時刻の形式が正しくありません (例: 14:30)。');
            console.error('時刻のパースに失敗しました。');
            return [];
        }
        const parsedInputTimeKey = `${inputHourStr.padStart(2, '0')}:${inputMinuteStr.padStart(2, '0')}`;
        const normalizedDay = inputDay.trim().toLowerCase();
        const normalizedWeather = inputWeather.trim().toLowerCase();

        // インデックスから直接データを取得
        const matchedRows = indexedBusData[normalizedDay]?.[normalizedWeather]?.[parsedInputTimeKey] || [];

        console.log('searchData 完了: 合致した行の数:', matchedRows.length, matchedRows);
        return matchedRows;
    }

    /**
     * 検索結果の2次元配列から最頻の出発時刻を特定し、
     * その時刻の行から関連情報を取得して画面に表示する関数。
     *
     * @param {Array<Array<string>>} matchedRows - 検索条件に合致した行の2次元配列
     */
    function displayBusInfo(matchedRows) {
        console.log('--- displayBusInfo関数実行 ---');
        // console.log('入力された matchedRows:', matchedRows); // デバッグ用ログは必要に応じて有効に

        if (matchedRows.length === 0) {
            resultOutputDiv.style.display = 'none';
            console.warn('displayBusInfo: matchedRows が空です。表示する情報がありません。');
            return;
        }

        const timeFrequencies = {}; // 例: {"10:30": 5, "10:35": 3}
        const overallMaxIndex = Math.max(
            SEG_TIMES_COLUMN_INDEX,
            BOARD_HOUR_COLUMN_INDEX,
            BOARD_MINUTE_COLUMN_INDEX,
            BUS_COUNT_COLUMN_INDEX,
            BUS1_KIND_COLUMN_INDEX,
            BUS2_KIND_COLUMN_INDEX,
            BUS3_KIND_COLUMN_INDEX,
            BUS4_KIND_COLUMN_INDEX,
            BUS5_KIND_COLUMN_INDEX
        );

        matchedRows.forEach((row, rowIndex) => {
            if (row.length <= overallMaxIndex) {
                console.warn(`displayBusInfo: 行 ${rowIndex} は必要な列数(${overallMaxIndex + 1})を満たしていません。スキップします。`, row);
                return;
            }

            const boardHour = row[BOARD_HOUR_COLUMN_INDEX]?.trim();
            const boardMinute = row[BOARD_MINUTE_COLUMN_INDEX]?.trim();

            if (!boardHour || !boardMinute) {
                console.warn(`displayBusInfo: 行 ${rowIndex} の出発時刻データが不正です。スキップします。`, row);
                return;
            }

            const combinedTime = `${boardHour.padStart(2, '0')}:${boardMinute.padStart(2, '0')}`;

            timeFrequencies[combinedTime] = (timeFrequencies[combinedTime] || 0) + 1;
            // console.log(`  行 ${rowIndex} から抽出した出発時刻: "${combinedTime}"`); // デバッグ用ログは必要に応じて有効に
        });

        // console.log('時刻の出現頻度:', timeFrequencies); // デバッグ用ログは必要に応じて有効に

        let mostFrequentTime = null;
        let maxFrequency = 0;

        for (const time in timeFrequencies) {
            if (timeFrequencies[time] > maxFrequency) {
                maxFrequency = timeFrequencies[time];
                mostFrequentTime = time;
            }
        }
        console.log(`最頻出発時刻: "${mostFrequentTime}" (頻度: ${maxFrequency})`);


        let representativeRow = null;
        if (mostFrequentTime) {
            const representativeRowIndex = matchedRows.findIndex(row => {
                if (row.length > Math.max(BOARD_HOUR_COLUMN_INDEX, BOARD_MINUTE_COLUMN_INDEX)) {
                    const boardHour = row[BOARD_HOUR_COLUMN_INDEX]?.trim();
                    const boardMinute = row[BOARD_MINUTE_COLUMN_INDEX]?.trim();
                    const combinedTime = `${boardHour?.padStart(2, '0')}:${boardMinute?.padStart(2, '0')}`;
                    return combinedTime === mostFrequentTime;
                }
                return false;
            });

            if (representativeRowIndex !== -1) {
                representativeRow = matchedRows[representativeRowIndex];
                console.log(`最頻出発時刻 "${mostFrequentTime}" を持つ代表行 (matchedRows内インデックス ${representativeRowIndex}):`, representativeRow);
            } else {
                console.warn('最頻出発時刻を持つ行が見つかりませんでした。');
            }
        }

        if (representativeRow) {
            // 画面に情報を表示
            mostFrequentBoardTimeSpan.textContent = mostFrequentTime;
            segTimesSpan.textContent = representativeRow[SEG_TIMES_COLUMN_INDEX]?.trim() || 'N/A';
            busCountSpan.textContent = representativeRow[BUS_COUNT_COLUMN_INDEX]?.trim() || 'N/A';
            bus1KindSpan.textContent = representativeRow[BUS1_KIND_COLUMN_INDEX]?.trim() || 'N/A';
            bus2KindSpan.textContent = representativeRow[BUS2_KIND_COLUMN_INDEX]?.trim() || 'N/A';
            bus3KindSpan.textContent = representativeRow[BUS3_KIND_COLUMN_INDEX]?.trim() || 'N/A';
            bus4KindSpan.textContent = representativeRow[BUS4_KIND_COLUMN_INDEX]?.trim() || 'N/A';
            bus5KindSpan.textContent = representativeRow[BUS5_KIND_COLUMN_INDEX]?.trim() || 'N/A';

            resultOutputDiv.style.display = 'block'; // 結果表示エリアを表示
            console.log('バス情報が画面に表示されました。');
        } else {
            resultOutputDiv.style.display = 'none';
            alert('最頻出発時刻のデータが見つからなかったため、情報を表示できませんでした。');
            console.error('最頻出発時刻の代表行が見つからないため、情報を表示できませんでした。');
        }
    }
});
