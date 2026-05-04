document.addEventListener('DOMContentLoaded', () => {
    // アプリ（ウィンドウ）として起動した時の初期サイズを設定
    if (window.matchMedia('(display-mode: standalone)').matches) {
        // ウィンドウが大きすぎる場合のみ、指定のサイズにリサイズを試みる
        if (window.innerWidth > 850) {
            window.resizeTo(850, 850);
        }
    }

    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const plotList = document.getElementById('plotList');
    const previewArea = document.querySelector('.preview-text');

    // --- 状態管理と永続化のロジック ---
    let appState = {
        chatHistory: [],
        plots: [],
        preview: ''
    };

    const saveData = () => {
        localStorage.setItem('magicLampState', JSON.stringify(appState));
    };

    const loadData = () => {
        const saved = localStorage.getItem('magicLampState');
        if (saved) {
            appState = JSON.parse(saved);
            
            // チャット履歴の復元
            appState.chatHistory.forEach(msg => {
                renderMessage(msg.text, msg.sender, msg.time);
            });

            // プロットの復元
            renderPlots();

            // プレビューの復元
            if (appState.preview) {
                previewArea.innerHTML = appState.preview;
            }
        } else {
            // 初期メッセージ（履歴がない場合）
            addMessage("もとさん、おはようございます！今日はどんな物語を紡ぎましょうか？", "angie");
        }
    };

    const renderPlots = () => {
        plotList.innerHTML = '';
        appState.plots.forEach((item, index) => {
            const newItem = document.createElement('div');
            newItem.className = 'chapter-item';
            newItem.innerHTML = `
                <div class="chapter-info">
                    <span class="chapter-number">Chapter ${index + 1}</span>
                    <div class="chapter-title">${item}</div>
                </div>
            `;
            plotList.appendChild(newItem);
        });
    };

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    const formatTime = (date) => {
        const hours = date.getHours();
        const mins = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? '午後' : '午前';
        const displayHours = hours % 12 || 12;
        return `${ampm} ${displayHours}:${mins}`;
    };

    const renderMessage = (text, sender, timeStr) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        
        let innerHTML = '';
        
        if (sender === 'user') {
            innerHTML = `
                <div class="message-content">
                    <div class="bubble-row">
                        <div class="message-meta">
                            <span class="read">既読</span>
                            <span class="time">${timeStr}</span>
                        </div>
                        <div class="bubble user">
                            ${text.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            `;
        } else {
            innerHTML = `
                <div class="avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content">
                    <div class="sender-name">ジーニー</div>
                    <div class="bubble-row">
                        <div class="bubble angie">
                            ${text.replace(/\n/g, '<br>')}
                        </div>
                        <div class="message-meta">
                            <span class="time">${timeStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        wrapper.innerHTML = innerHTML;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (text, sender) => {
        const timeStr = formatTime(new Date());
        appState.chatHistory.push({ text, sender, time: timeStr });
        renderMessage(text, sender, timeStr);
        saveData();
    };

    const handleSend = () => {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        // キャンバスの処理エフェクト
        const middleCanvas = document.getElementById('middleCanvas');
        middleCanvas.style.opacity = '0.7';

        // Simulate AI thinking
        setTimeout(() => {
            middleCanvas.style.opacity = '1';
            let response = "";
            
            // --- 高度な解釈ロジック ---
            
            // 1. 本の企画・アイデアを提案された場合
            if (text.includes("書きたい") || text.includes("本にしたい") || text.includes("テーマ")) {
                const theme = text.match(/「(.*?)」/) ? text.match(/「(.*?)」/)[1] : text.replace(/(書きたい|本にしたい|テーマ|について)/g, "").trim();
                
                response = `『${theme}』ですね。素晴らしいテーマです！読者の心に刺さるよう、このような3章構成（プロット）を組んでみましたがいかがでしょうか？右側のキャンバスに展開しておきますね。`;
                
                // 3つの構成案を自動生成
                appState.plots = [
                    `なぜ今、${theme}が必要なのか`,
                    `実践：${theme}を形にする技術`,
                    `未来：${theme}がもたらす変化`
                ];
                renderPlots();
                saveData();

            } 
            // 2. 章の追加や修正の場合
            else if (text.includes("章") || text.includes("構成") || text.includes("追加")) {
                const chapterTitle = text.match(/「(.*?)」/) ? text.match(/「(.*?)」/)[1] : (text.length > 15 ? text.substring(0, 15) + "..." : text);
                response = `承知しました。「${chapterTitle}」を新しい章として構成に組み込みました。物語の厚みがさらに増しましたね。`;
                
                appState.plots.push(chapterTitle);
                renderPlots();
                saveData();
            } 
            // 3. 執筆内容（想い）の入力の場合
            else {
                response = "その視点、非常に鋭いです！もとさんの「生の声」が聞こえてくるようです。その想いを核にして、読者が読みやすい文章に研ぎ出しておきます。";
                
                // ライブプレビューの更新
                appState.preview = `
                    <span style="color:var(--text-meta); display:block; margin-bottom:10px;">【ジーニーによる執筆プレビュー】</span>
                    「${text}」<br><br>
                    <span style="color:var(--accent-gold); font-size:0.85rem; border-top:1px dashed #ccc; display:block; padding-top:10px;">
                        ✨ ジーニーの眼差し：この言葉の裏にある「職人の矜持」を強調することで、読者の信頼を勝ち取れる一節になります。
                    </span>
                `;
                previewArea.innerHTML = appState.preview;
                saveData();
            }

            addMessage(response, 'angie');
            
            const middleContent = document.querySelector('.middle-content');
            if(middleContent) middleContent.scrollTop = middleContent.scrollHeight;
        }, 1200);
    };

    // Handle Enter key for send
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    const crystallizeBtn = document.querySelector('.crystallize-btn');
    crystallizeBtn.addEventListener('click', () => {
        addMessage("原稿の「研ぎ出し」を開始しますね。完了次第ご報告します！", "angie");
    });

    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('click', () => {
        addMessage("資料を読み込みました！執筆のヒントとして活用させていただきますね。", "angie");
    });

    // Toggle Canvas Logic
    const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');
    const middleCanvas = document.getElementById('middleCanvas');
    
    toggleCanvasBtn.addEventListener('click', () => {
        // PCとスマホで挙動を分ける
        if (window.innerWidth > 750) {
            // PCでは「隠す（hidden）」を切り替え
            middleCanvas.classList.toggle('hidden');
        } else {
            // スマホでは「表示（active）」を切り替え
            middleCanvas.classList.toggle('active');
        }
        
        // アイコンの切り替え
        const icon = toggleCanvasBtn.querySelector('i');
        const isVisible = window.innerWidth > 750 ? !middleCanvas.classList.contains('hidden') : middleCanvas.classList.contains('active');
        
        if (isVisible) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-columns';
        }
    });

    // Close canvas when clicking chat area on mobile (if canvas is open)
    document.querySelector('.line-chat').addEventListener('click', (e) => {
        if (window.innerWidth <= 700 && middleCanvas.classList.contains('active') && !e.target.closest('#toggleCanvasBtn')) {
            middleCanvas.classList.remove('active');
            toggleCanvasBtn.querySelector('i').className = 'fas fa-columns';
        }
    });
    
    // Send icon on chat input (mimicking LINE)
    const inputActions = document.querySelector('.input-actions');
    inputActions.innerHTML = '<i class="far fa-smile tool-icon"></i> <i class="fas fa-paper-plane tool-icon" id="sendBtnIcon" style="margin-left: 10px; color: var(--accent); cursor: pointer;"></i>';
    
    document.getElementById('sendBtnIcon').addEventListener('click', handleSend);

    // Dark Mode Toggle Logic
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const body = document.body;
    const themeIcon = themeToggleBtn.querySelector('i');

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeIcon.className = 'fas fa-sun';
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    });

    // 最後にデータをロード
    loadData();
});
