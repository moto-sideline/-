document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const plotList = document.getElementById('plotList');

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    const addMessage = (text, sender) => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.innerHTML = text.replace(/\n/g, '<br>');
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = timeStr;

        wrapper.appendChild(avatar);
        wrapper.appendChild(msgDiv);
        wrapper.appendChild(timeDiv);
        
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const crystallizeBtn = document.querySelector('.crystallize-btn');

    const handleSend = () => {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        // Canvas processing effect
        const canvasContent = document.getElementById('manuscriptCanvas');
        canvasContent.style.opacity = '0.6';
        canvasContent.style.transition = 'opacity 0.5s ease';

        // Simulate AI thinking and canvas update
        setTimeout(() => {
            canvasContent.style.opacity = '1';
            
            let response = "";
            
            // Logic to reflect in canvas
            if (text.includes("章") || text.includes("構成") || text.includes("Chapter")) {
                const chapterTitle = text.match(/「(.*?)」/) ? text.match(/「(.*?)」/)[1] : (text.length > 10 ? text.substring(0, 10) + "..." : text);
                response = `素晴らしいですね。その内容を「${chapterTitle}」として、構成案（プロット）に組み込んでおきました。右側のキャンバスを確認してみてください。`;
                
                // Add to Plot List
                const currentChapters = document.querySelectorAll('.chapter-item');
                const nextNum = currentChapters.length + 1;
                const newItem = document.createElement('div');
                newItem.className = 'chapter-item';
                newItem.style.animation = 'fadeIn 0.8s ease';
                newItem.innerHTML = `
                    <span class="chapter-number">Chapter ${nextNum}</span>
                    <div class="chapter-title">${chapterTitle}</div>
                `;
                plotList.appendChild(newItem);
            } else {
                response = "承知しました。その大切な想い、しっかりと受け止めました。原稿のプレビューに「ライブ・インサイト」として反映させておきますね。";
                
                // Update Live Preview
                const previewArea = document.querySelector('.manuscript-card p');
                previewArea.style.animation = 'none';
                void previewArea.offsetHeight; // trigger reflow
                previewArea.style.animation = 'fadeIn 1s ease';
                previewArea.innerHTML = `『${text}』<br><br><span style="color:var(--accent-gold); font-size:0.85rem; font-style: normal;">✨ アンジーの眼差し：この言葉が読者の心に深く刺さる一節になりそうです。</span>`;
            }

            addMessage(response, 'angie');
            
            // Scroll to bottom
            const canvas = document.querySelector('.canvas-content');
            canvas.scrollTop = canvas.scrollHeight;
        }, 1200);
    };

    const handleCrystallize = () => {
        const title = document.querySelector('.title-info p').textContent.replace('現在のプロジェクト: ', '');
        let content = `# ${title}\n\n## 構成案\n\n`;
        
        const chapters = document.querySelectorAll('.chapter-item');
        chapters.forEach(chapter => {
            const num = chapter.querySelector('.chapter-number').textContent;
            const text = chapter.querySelector('.chapter-title').textContent;
            if (!text.includes('生成中')) {
                content += `### ${num}: ${text}\n`;
            }
        });

        content += `\n## ライブ・プレビュー抜粋\n\n`;
        content += document.querySelector('.manuscript-card p').textContent.trim();

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}_manuscript.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addMessage("原稿の「研ぎ出し」が完了しました！ファイルをダウンロードフォルダへ送っておきましたよ。大切に保管してくださいね。", "angie");
    };

    const actionBtns = document.querySelectorAll('.action-btn');

    const handleModeSelect = (mode) => {
        const modeData = {
            essay: {
                title: "エッセイモード",
                msg: "エッセイモードを開始しますね。今日は、心に浮かんだとりとめもないことをそのまま教えてください。私が一編の物語へと編み上げます。",
                plot: ["序章：心のつぶやき", "日常のひとコマ", "結び：明日への一歩"]
            },
            knowledge: {
                title: "ノウハウモード",
                msg: "ノウハウモードですね。あなたが誰かに教えたい「秘訣」は何ですか？ターゲットとする読者も一緒に考えていきましょう。",
                plot: ["はじめに：なぜ今これが必要か", "核心：3つの重要ポイント", "実践へのステップ"]
            },
            experience: {
                title: "体験談モード",
                msg: "体験談モードを起動しました。あなたの人生の転機となった出来事について聞かせてください。読者の勇気に変わる物語にしましょう。",
                plot: ["プロローグ：あの日", "葛藤と挑戦", "エピローグ：手に入れたもの"]
            }
        };

        const selected = modeData[mode];
        if (!selected) return;

        // Reset and Update Plot
        plotList.innerHTML = '';
        selected.plot.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'chapter-item';
            div.style.animation = `fadeIn 0.5s ease ${index * 0.1}s both`;
            div.innerHTML = `
                <span class="chapter-number">Structure ${index + 1}</span>
                <div class="chapter-title">${item}</div>
            `;
            plotList.appendChild(div);
        });

        // Angie's Greeting
        setTimeout(() => {
            addMessage(selected.msg, 'angie');
            document.querySelector('.title-info p').textContent = `現在のモード: ${selected.title}`;
        }, 500);
    };

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    crystallizeBtn.addEventListener('click', handleCrystallize);

    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => handleModeSelect(btn.dataset.mode));
    });

    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('click', () => {
        // Simulate file selection
        addMessage("資料を読み込みました！内容をスキャンして、執筆のヒントとして活用させていただきますね。非常に興味深い内容です...", "angie");
    });

    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        const icon = sidebarToggle.querySelector('i');
        if (sidebar.classList.contains('active')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    });

    // Close sidebar when clicking main workspace on mobile
    document.querySelector('.main-workspace').addEventListener('click', () => {
        if (sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            sidebarToggle.querySelector('i').className = 'fas fa-bars';
        }
    });
});
