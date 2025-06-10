document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const generateBtn = document.getElementById('generateBtn');
    const previewCanvas = document.getElementById('previewCanvas');
    const downloadLink = document.getElementById('downloadLink');
    const downloadSection = document.getElementById('downloadSection');
    const error = document.getElementById('error');
    const imageTitle = document.getElementById('imageTitle');
    const fileInput = document.getElementById('fileInput');
    const ctx = previewCanvas.getContext('2d');

    let images = new Array(50).fill(null); // 10x5のグリッド用配列

    // 画像をセルに挿入する共通関数
    function insertImage(file, index, cell) {
        if (!file.type.startsWith('image/')) {
            error.textContent = '画像ファイルを選択してください。';
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                images[index] = img;
                cell.innerHTML = '';
                cell.appendChild(img);
                updateGenerateButton();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // 10x5のグリッドを作成
    for (let i = 0; i < 50; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.index = i;
        grid.appendChild(cell);

        // ドラッグ＆ドロップの設定
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        cell.addEventListener('drop', (e) => {
            e.preventDefault();
            if (images[i]) return; // 既に画像がある場合は無視
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                insertImage(files[0], i, cell);
            }
        });

        // 左クリックでファイル選択
        cell.addEventListener('click', () => {
            if (!images[i]) { // 画像がないセルのみ
                fileInput.value = ''; // 入力リセット
                fileInput.dataset.index = i; // セルインデックスを保存
                fileInput.click();
            }
        });

        // 右クリックで次のセルに複製
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (images[i]) {
                const nextIndex = i + 1;
                if (nextIndex >= 50) {
                    error.textContent = '最後のセルなので複製できません。';
                    return;
                }
                if (images[nextIndex]) {
                    error.textContent = '次のセルは既に埋まっています。';
                    return;
                }
                const duplicateImg = new Image();
                duplicateImg.src = images[i].src;
                images[nextIndex] = duplicateImg;
                const nextCell = grid.children[nextIndex];
                nextCell.innerHTML = '';
                nextCell.appendChild(duplicateImg);
                updateGenerateButton();
            }
        });

        // ダブルクリックで画像を削除
        cell.addEventListener('dblclick', () => {
            if (images[i]) {
                images[i] = null;
                cell.innerHTML = '';
                updateGenerateButton();
                error.textContent = ''; // エラーメッセージをクリア
            }
        });
    }

    // ファイル入力の変更イベント
    fileInput.addEventListener('change', (e) => {
        const index = parseInt(fileInput.dataset.index);
        const cell = grid.children[index];
        const files = e.target.files;
        if (files.length > 0) {
            insertImage(files[0], index, cell);
        }
    });

    // 生成ボタンの有効/無効を更新
    function updateGenerateButton() {
        generateBtn.disabled = !images.some(img => img !== null);
    }

    // グリッド画像生成ボタンの処理
    generateBtn.addEventListener('click', () => {
        error.textContent = '';
        if (!images.some(img => img !== null)) {
            error.textContent = '少なくとも1つの画像を配置してください。';
            return;
        }

        // 画像の高さを100pxに設定（グリッドセルに合わせる）
        const targetHeight = 100;
        // 題名の領域を確保（例：50px）
        const titleHeight = 50;
        // 最大幅を計算（全画像の比率を考慮）
        const maxWidth = Math.max(...images.filter(img => img !== null).map(img => {
            const aspectRatio = img.width / img.height;
            return targetHeight * aspectRatio;
        }));

        // キャンバスの設定（10×5グリッド＋題名領域）
        previewCanvas.width = maxWidth * 10;
        previewCanvas.height = targetHeight * 5 + titleHeight;
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 題名の背景を白く塗りつぶす
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, previewCanvas.width, titleHeight);

        // 題名を描画
        const title = imageTitle.value || '無題';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, previewCanvas.width / 2, titleHeight / 2);

        // 画像をグリッドに配置
        images.forEach((img, index) => {
            if (img) {
                const col = index % 10;
                const row = Math.floor(index / 10);
                const aspectRatio = img.width / img.height;
                const newWidth = targetHeight * aspectRatio;
                const x = col * maxWidth + (maxWidth - newWidth) / 2;
                const y = row * targetHeight + titleHeight; // 題名分のオフセット
                ctx.drawImage(img, x, y, newWidth, targetHeight);
            }
        });

        // プレビューを表示
        downloadSection.style.display = 'block';

        // ダウンロードリンクを設定（ファイル名をタイトル＋日付＋時間に）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const fileName = `${title}_${year}${month}${day}_${hours}${minutes}.png`;
        downloadLink.href = previewCanvas.toDataURL('image/png');
        downloadLink.download = fileName;
    });
});