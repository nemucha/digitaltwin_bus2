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
                        // デバッグ用ログ: 読み込んだCSVテキストの最初の数行をログに出力
                        console.log(`--- Loaded CSV: ${fileName} ---`);
                        csvText.split('\n').slice(0, 5).forEach(line => console.log(line));
                        console.log(`--- End of ${fileName} sample ---`);
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
                // ★もしヘッダー行をスキップするなら、ここで .slice(1) を追加してください
                // allCsvData.push(result.value.slice(1));
                allCsvData.push(result.value); // 現在はヘッダーをスキップしない設定
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

            // 検索前にログをクリアして、新しい検索のログを見やすくする
            console.clear();
            console.log('--- 新しい検索開始 ---');
            console.log(`入力された時刻: "${time}", 曜日: "${day}", 天気: "${weather}"`);

            const matchedRows = searchData(time, day, weather, allCsvData);

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
        console.log('--- searchData関数実行 ---');
        console.log(`検索条件: 時刻:"${inputTime}", 曜日:"${inputDay}", 天気:"${inputWeather}"`);

        if (!inputTime || !inputDay || !inputWeather) {
            console.warn('検索条件が不足しています (searchData内部)。');
            return [];
        }

        const [inputHourStr, inputMinuteStr] = inputTime.split(':');
        if (!inputHourStr || !inputMinuteStr) {
            alert('時刻の形式が正しくありません (例: 14:30)。');
            console.error('時刻のパースに失敗しました (searchData内部)。');
            return [];
        }
        const inputHour = parseInt(inputHourStr, 10);
        const inputMinute = parseInt(inputMinuteStr, 10);
        console.log(`パースされた入力時刻: 時=${inputHour}, 分=${inputMinute}`);


        // CSVファイルの列インデックスを定義（ご指定の値に修正しました！）
        const HOUR_COLUMN_INDEX = 5;
        const MINUTE_COLUMN_INDEX = 6;
        const DAY_OF_WEEK_COLUMN_INDEX = 2;
        const WEATHER_COLUMN_INDEX = 3;

        console.log('検索条件比較に使用される列インデックス:', {
            HOUR_COLUMN_INDEX,
            MINUTE_COLUMN_INDEX,
            DAY_OF_WEEK_COLUMN_INDEX,
            WEATHER_COLUMN_INDEX
        });

        const matchedRows = [];

        if (allCsvData.length === 0) {
            console.warn('CSVデータが読み込まれていません。');
            return [];
        }

        allCsvData.forEach((csvFile, fileIndex) => {
            // ヘッダー行をスキップする場合はここで `csvFile.slice(1)` を使用
            csvFile.forEach((row, rowIndex) => {
                // ★ヘッダー行をスキップする場合の例:
                // if (rowIndex === 0) return;

                // 行が全ての必要な列を持っているかチェック (安全のため)
                const requiredMaxIndex = Math.max(HOUR_COLUMN_INDEX, MINUTE_COLUMN_INDEX, DAY_OF_WEEK_COLUMN_INDEX, WEATHER_COLUMN_INDEX);
                if (row.length <= requiredMaxIndex) {
                    // console.warn(`ファイル ${fileIndex}, 行 ${rowIndex} は必要な列数(${requiredMaxIndex + 1})を満たしていません。スキップします。`, row);
                    return; // 必要な列がない行はスキップ
                }

                // CSVデータから値を取得し、前後の空白を除去
                const csvHourStr = row[HOUR_COLUMN_INDEX].trim();
                const csvMinuteStr = row[MINUTE_COLUMN_INDEX].trim();
                const csvDay = row[DAY_OF_WEEK_COLUMN_INDEX].trim();
                const csvWeather = row[WEATHER_COLUMN_INDEX].trim();

                console.log(`  ファイル ${fileIndex}, 行 ${rowIndex}: CSV Data - Hour:"${csvHourStr}", Min:"${csvMinuteStr}", Day:"${csvDay}", Weather:"${csvWeather}"`);

                const csvHour = parseInt(csvHourStr, 10);
                const csvMinute = parseInt(csvMinuteStr, 10);

                // 比較のログと実行
                const matchHour = (csvHour === inputHour);
                const matchMinute = (csvMinute === inputMinute);
                const matchDay = (csvDay.toLowerCase() === inputDay.trim().toLowerCase()); // 入力値もトリム
                const matchWeather = (csvWeather.toLowerCase() === inputWeather.trim().toLowerCase()); // 入力値もトリム

                console.log(`    Comparison: Hour=${matchHour} (${csvHour} vs ${inputHour}), Minute=${matchMinute} (${csvMinute} vs ${inputMinute}), Day=${matchDay} ("${csvDay.toLowerCase()}" vs "${inputDay.trim().toLowerCase()}"), Weather=${matchWeather} ("${csvWeather.toLowerCase()}" vs "${inputWeather.trim().toLowerCase()}")`);

                if (matchHour && matchMinute && matchDay && matchWeather) {
                    console.log(`    !!! Match found for File ${fileIndex}, Row ${rowIndex} !!!`, row);
                    matchedRows.push(row); // 条件に合致した行を2次元配列に追加
                }
            });
        });

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
        console.log('入力された matchedRows:', matchedRows);

        if (matchedRows.length === 0) {
            resultOutputDiv.style.display = 'none';
            console.warn('displayBusInfo: matchedRows が空です。表示する情報がありません。');
            return;
        }

        // CSVファイルの列インデックスを定義（最新の値に修正済み！）
        const SEG_TIMES_COLUMN_INDEX = 0;
        const DAY_OF_WEEK_COLUMN_INDEX = 2; // (参考)
        const WEATHER_COLUMN_INDEX = 3;     // (参考)
        const HOUR_COLUMN_INDEX = 5;        // (参考)
        const MINUTE_COLUMN_INDEX = 6;      // (参考)
        const BOARD_HOUR_COLUMN_INDEX = 12;
        const BOARD_MINUTE_COLUMN_INDEX = 13;
        const BUS_COUNT_COLUMN_INDEX = 14;
        const BUS1_KIND_COLUMN_INDEX = 15;
        const BUS2_KIND_COLUMN_INDEX = 16;
        const BUS3_KIND_COLUMN_INDEX = 17;
        const BUS4_KIND_COLUMN_INDEX = 18;
        const BUS5_KIND_COLUMN_INDEX = 19;

        console.log('displayBusInfoで使用される列インデックス:', {
            SEG_TIMES_COLUMN_INDEX,
            BOARD_HOUR_COLUMN_INDEX,
            BOARD_MINUTE_COLUMN_INDEX,
            BUS_COUNT_COLUMN_INDEX,
            BUS1_KIND_COLUMN_INDEX,
            BUS2_KIND_COLUMN_INDEX,
            BUS3_KIND_COLUMN_INDEX,
            BUS4_KIND_COLUMN_INDEX,
            BUS5_KIND_COLUMN_INDEX
        });

        // board_hourとboard_minuteを組み合わせた時刻の出現頻度をカウント
        const timeFrequencies = {}; // 例: {"10:30": 5, "10:35": 3}
        let maxBoardIndex = Math.max(BOARD_HOUR_COLUMN_INDEX, BOARD_MINUTE_COLUMN_INDEX);
        let maxSegTimesIndex = Math.max(SEG_TIMES_COLUMN_INDEX, BUS_COUNT_COLUMN_INDEX, BUS1_KIND_COLUMN_INDEX, BUS2_KIND_COLUMN_INDEX, BUS3_KIND_COLUMN_INDEX, BUS4_KIND_COLUMN_INDEX, BUS5_KIND_COLUMN_INDEX);
        const overallMaxIndex = Math.max(maxBoardIndex, maxSegTimesIndex);


        matchedRows.forEach((row, rowIndex) => {
            // 必要な列が全て存在するかチェック (安全のため、より高いインデックスまで確認)
            if (row.length <= overallMaxIndex) {
                console.warn(`displayBusInfo: 行 ${rowIndex} は必要な列数(${overallMaxIndex + 1})を満たしていません。スキップします。`, row);
                return;
            }

            const boardHour = row[BOARD_HOUR_COLUMN_INDEX].trim(); // 前後の空白を除去
            const boardMinute = row[BOARD_MINUTE_COLUMN_INDEX].trim(); // 前後の空白を除去
            const combinedTime = `${boardHour.padStart(2, '0')}:${boardMinute.padStart(2, '0')}`; // "HH:MM"形式に整形

            timeFrequencies[combinedTime] = (timeFrequencies[combinedTime] || 0) + 1;
            console.log(`  行 ${rowIndex} から抽出した出発時刻: "${combinedTime}"`);
        });

        console.log('時刻の出現頻度:', timeFrequencies);

        let mostFrequentTime = null;
        let maxFrequency = 0;

        // 最頻値を特定
        for (const time in timeFrequencies) {
            if (timeFrequencies[time] > maxFrequency) {
                maxFrequency = timeFrequencies[time];
                mostFrequentTime = time;
            }
        }
        console.log(`最頻出発時刻: "${mostFrequentTime}" (頻度: ${maxFrequency})`);


        // 最頻値の時刻を持つ行を1つ取り出す
        let representativeRow = null;
        if (mostFrequentTime) {
            const representativeRowIndex = matchedRows.findIndex(row => {
                if (row.length > Math.max(BOARD_HOUR_COLUMN_INDEX, BOARD_MINUTE_COLUMN_INDEX)) {
                    const boardHour = row[BOARD_HOUR_COLUMN_INDEX].trim();
                    const boardMinute = row[BOARD_MINUTE_COLUMN_INDEX].trim();
                    const combinedTime = `${boardHour.padStart(2, '0')}:${boardMinute.padStart(2, '0')}`;
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
            // データが存在しない、または取得できない場合のために 'N/A' を設定
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
            // このアラートは displayBusInfo が呼ばれたが有効な代表行が見つからなかった場合にのみ表示
            alert('最頻出発時刻を持つデータが見つかりませんでした。');
            console.error('最頻出発時刻の代表行が見つからないため、情報を表示できませんでした。');
        }
    }
});
