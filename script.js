document.addEventListener('DOMContentLoaded', async () => {
    const messageElement = document.getElementById('message');
    const csvSummaryOutput = document.getElementById('csvSummaryOutput');
    const csvSampleOutput = document.getElementById('csvSampleOutput');
    const inputContainer = document.getElementById('inputContainer');
    const currentTimeInput = document.getElementById('current-time');
    const dayOfWeekInput = document.getElementById('dayOfWeek');
    const currentWeatherInput = document.getElementById('currentWeather'); // 天気入力フィールドを取得

    // HTML要素の存在チェック
    if (!messageElement || !csvSummaryOutput || !csvSampleOutput || !inputContainer || !currentTimeInput || !dayOfWeekInput || !currentWeatherInput) {
        console.error('HTML要素が見つかりません。必要なIDを持つ要素がHTMLに存在するか確認してください。');
        return;
    }

    let allCsvData = [];

    try {
        inputContainer.style.display = 'none';
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
                allCsvData.push(result.value);
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
        console.log('入力された現在時刻:', currentTimeInput.value);
        console.log('入力された曜日:', dayOfWeekInput.value);
        console.log('入力された天気:', currentWeatherInput.value); // 天気の値を取得して表示


    } catch (error) {
        if (messageElement) {
            messageElement.textContent = `CSVファイルの読み込み中に予期せぬエラーが発生しました: ${error.message}`;
        }
        console.error('総合的なCSV読み込みエラー:', error);
        inputContainer.style.display = 'none';
    }
});
