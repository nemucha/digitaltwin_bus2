document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const toggleCsvSummaryCheckbox = document.getElementById('toggleCsvSummary'); // 追加
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
    const waitingTimeSpan = document.getElementById('waitingTime');
    const segValsSpan = document.getElementById('segVals');
    const busKindList = document.getElementById('busKindList'); // 追加: バス種別を表示するul要素

    // HTML要素の存在チェック
    if (!messageElement || !toggleCsvSummaryCheckbox || !csvSummaryOutput || !csvSampleOutput || !inputContainer ||
        !currentTimeInput || !dayOfWeekInput || !currentWeatherInput || !searchButton ||
        !resultOutputDiv || !mostFrequentBoardTimeSpan || !waitingTimeSpan ||
        !segValsSpan || !busKindList) { // 修正: segTimesSpan, busCountSpanを削除
        console.error('HTML要素が見つかりません。必要なIDを持つ要素がHTMLに存在するか確認してください。');
        return;
    }

    let allCsvData = []; // 全ての生のCSVデータを格納する3次元配列
    let indexedBusData = {}; 

    // CSVファイルの列インデックスを定義
    // ★★★ 実際のCSVファイルの構造に合わせてこれらのインデックスを調整してください ★★★
    const SEG_TIMES_COLUMN_INDEX = 0;
    const SEG_VALS_COLUMN_INDEX = 1; // 待ち行列の長さの列
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
        inputContainer.style.display = 'none';
        resultOutputDiv.style.display = 'none';
        messageElement.textContent = `複数のCSVファイルを読み込み中...`;

        const startDate = new Date('2025-04-08');
        const endDate = new Date('2025-05-19');
        const filePromises = [];
        let totalFiles = 0;

        // 総ファイル数を計算
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            totalFiles++;
        }
        
        let filesLoadedCount = 0; // 読み込みが完了したファイルのカウンター

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
                        filesLoadedCount++;
                        // ★★★ ここで進捗をコンソールに表示 ★★★
                        console.log(`ファイル読み込み中: ${fileName} (${filesLoadedCount}/${totalFiles})`);
                        messageElement.textContent = `CSVファイルを読み込み中... (${filesLoadedCount}/${totalFiles})`;
                        return csvText.trim().split('\n').map(row => row.split(','));
                    })
                    .catch(error => {
                        filesLoadedCount++; // エラーの場合もカウントを進める
                        console.error(`Error loading ${filePath}:`, error.message);
                        messageElement.textContent = `CSVファイルを読み込み中... (${filesLoadedCount}/${totalFiles}) - エラーあり`;
                        return null;
                    })
            );
        }

        const results = await Promise.allSettled(filePromises);

        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value !== null) {
                allCsvData.push(result.value);
            }
        });

        messageElement.textContent = `全てのCSVデータの読み込みが完了しました。読み込んだファイル数: ${allCsvData.length} / ${totalFiles}`;
        console.log(`全てのCSVデータの読み込みが完了しました。読み込んだファイル数: ${allCsvData.length} / ${totalFiles}`);

        // ★★★ ここでデータをインデックス化する ★★★
        if (allCsvData.length > 0) {
            messageElement.textContent += ' データを検索用に最適化中...';
            console.log('データを検索用に最適化中...');
            indexedBusData = buildIndex(allCsvData);
            messageElement.textContent = `全てのCSVデータの読み込みと最適化が完了しました。読み込んだファイル数: ${allCsvData.length} / ${totalFiles}`;
            console.log('データの最適化が完了しました。');
            // console.log('検索用に最適化されたデータ (indexedBusData):', indexedBusData); // 必要であれば有効に
        }


        // CSVデータ概要の表示/非表示を切り替えるイベントリスナー
        toggleCsvSummaryCheckbox.addEventListener('change', () => {
            if (toggleCsvSummaryCheckbox.checked) {
                csvSummaryOutput.style.display = 'block';
                csvSampleOutput.style.display = 'block';
            } else {
                csvSummaryOutput.style.display = 'none';
                csvSampleOutput.style.display = 'none';
            }
        });

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

        inputContainer.style.display = 'block';

        searchButton.addEventListener('click', () => {
            const time = currentTimeInput.value;
            const day = dayOfWeekInput.value;
            const weather = currentWeatherInput.value;

            console.clear();
            console.log('--- 新しい検索開始 ---');
            console.log(`入力された時刻: "${time}", 曜日: "${day}", 天気: "${weather}"`);

            const matchedRows = searchData(time, day, weather, indexedBusData);

            if (matchedRows.length > 0) {
                displayBusInfo(matchedRows, time);
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

    function buildIndex(allCsvData) {
        console.log('--- buildIndex関数実行: データインデックス化を開始 ---');
        const index = {};

        if (allCsvData.length === 0) {
            console.warn('buildIndex: 処理するCSVデータがありません。');
            return index;
        }

        allCsvData.forEach(csvFile => {
            csvFile.forEach(row => {
                const day = row[DAY_OF_WEEK_COLUMN_INDEX]?.trim().toLowerCase();
                const weather = row[WEATHER_COLUMN_INDEX]?.trim().toLowerCase();
                const hourStr = row[HOUR_COLUMN_INDEX]?.trim();
                const minuteStr = row[MINUTE_COLUMN_INDEX]?.trim();

                if (!day || !weather || !hourStr || !minuteStr || isNaN(parseInt(hourStr, 10)) || isNaN(parseInt(minuteStr, 10))) {
                    // console.warn('buildIndex: 不正なデータを持つ行をスキップ。', row);
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

        const matchedRows = indexedBusData[normalizedDay]?.[normalizedWeather]?.[parsedInputTimeKey] || [];

        console.log('searchData 完了: 合致した行の数:', matchedRows.length);
        return matchedRows;
    }

    function displayBusInfo(matchedRows, inputCurrentTime) {
        console.log('--- displayBusInfo関数実行 ---');

        if (matchedRows.length === 0) {
            resultOutputDiv.style.display = 'none';
            console.warn('displayBusInfo: matchedRows が空です。表示する情報がありません。');
            return;
        }

        const timeFrequencies = {};
        const overallMaxIndex = Math.max(
            SEG_TIMES_COLUMN_INDEX, // デバッグ用なのであっても害はない
            SEG_VALS_COLUMN_INDEX,
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
        });

        let mostFrequentTime = null;
        let maxFrequency = 0;

        for (const time in timeFrequencies) {
            if (timeFrequencies[time] > maxFrequency) {
                maxFrequency = timeFrequencies[time];
                mostFrequentTime = time;
            }
        }
        console.log(`予測出発時間: "${mostFrequentTime}" (頻度: ${maxFrequency})`);


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
                console.log(`予測出発時間 "${mostFrequentTime}" を持つ代表行 (matchedRows内インデックス ${representativeRowIndex}):`, representativeRow);
            } else {
                console.warn('予測出発時間を持つ行が見つかりませんでした。');
            }
        }

        if (representativeRow) {
            // 待ち時間の計算
            let waitingMinutes = 'N/A';
            if (inputCurrentTime && mostFrequentTime) {
                const [currentHour, currentMinute] = inputCurrentTime.split(':').map(Number);
                const [boardHour, boardMinute] = mostFrequentTime.split(':').map(Number);

                const currentTimeInMinutes = currentHour * 60 + currentMinute;
                let boardTimeInMinutes = boardHour * 60 + boardMinute;

                // もし出発時刻が現在時刻より前なら、翌日の出発とみなす（24時間表記の場合）
                if (boardTimeInMinutes < currentTimeInMinutes) {
                    boardTimeInMinutes += 24 * 60; // 翌日の同じ時刻として計算
                }
                waitingMinutes = boardTimeInMinutes - currentTimeInMinutes;
                if (waitingMinutes < 0) { // 念のため負の値の場合の調整
                    waitingMinutes = 0;
                }
                waitingTimeSpan.textContent = `${waitingMinutes}分`;
            } else {
                waitingTimeSpan.textContent = waitingMinutes;
            }

            mostFrequentBoardTimeSpan.textContent = mostFrequentTime;
            // segTimesSpan.textContent = representativeRow[SEG_TIMES_COLUMN_INDEX]?.trim() || 'N/A'; // 削除

            // 待ち行列の長さ (seg_vals) を表示し、小数点以下第2位で四捨五入して単位mを付ける
            let segValsValue = parseFloat(representativeRow[SEG_VALS_COLUMN_INDEX]?.trim());
            if (!isNaN(segValsValue)) {
                segValsSpan.textContent = `${segValsValue.toFixed(2)}m`; // 小数点以下2桁で四捨五入し単位mを追加
            } else {
                segValsSpan.textContent = 'N/A';
            }
            
            // bus_countに基づいてバス種別を動的に表示
            const busCount = parseInt(representativeRow[BUS_COUNT_COLUMN_INDEX]?.trim(), 10);
            busKindList.innerHTML = ''; // 一度リストをクリア
            if (!isNaN(busCount) && busCount > 0) {
                for (let i = 1; i <= busCount && i <= 5; i++) { // 最大5種別まで
                    const kindIndex = BUS1_KIND_COLUMN_INDEX + (i - 1);
                    const busKind = representativeRow[kindIndex]?.trim() || 'N/A';
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<strong>バス${i}種別:</strong> <span>${busKind}</span>`;
                    busKindList.appendChild(listItem);
                }
            } else {
                const listItem = document.createElement('li');
                listItem.textContent = 'バス種別の情報がありません。';
                busKindList.appendChild(listItem);
            }

            resultOutputDiv.style.display = 'block';
            console.log('バス情報が画面に表示されました。');
        } else {
            resultOutputDiv.style.display = 'none';
            alert('予測出発時間のデータが見つからなかったため、情報を表示できませんでした。');
            console.error('予測出発時間の代表行が見つからないため、情報を表示できませんでした。');
        }
    }
});
