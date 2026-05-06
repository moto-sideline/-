document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const plotList = document.getElementById('plotList');
    const previewArea = document.getElementById('previewArea');
    const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');
    const middleCanvas = document.getElementById('middleCanvas');
    const sendBtn = document.getElementById('sendBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const body = document.body;

    // --- State Management ---
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
            renderAll();
            // Returning user greeting
            addMessage("おかえりなさい！また一緒に魔法を紡げるのを楽しみにしていました。続きから始めましょうか？", 'genie');
        } else {
            // Detailed First-time Onboarding
            const introLines = [
                "初めまして！私はジーニー。あなたの『本を書きたい』という願いを叶えるためにやってきました。🧞‍♂️✨",
                "難しいことは何もいりません。あなたが誰かに伝えたいこと、大切にしている想いを、私にそのまま話しかけてください。",
                "まずは、あなたが今考えている『本のテーマ』や『気になるキーワード』を一つ、教えていただけますか？そこから一緒に物語を編み上げていきましょう。"
            ];
            introLines.forEach((line, index) => {
                setTimeout(() => addMessage(line, 'genie'), index * 1000);
            });
        }

        // Theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            const icon = themeToggleBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }
    };

    const renderAll = () => {
        chatMessages.innerHTML = '';
        appState.chatHistory.forEach(msg => renderMessage(msg.text, msg.sender, msg.time));
        renderPlots();
        if (appState.preview) previewArea.innerHTML = appState.preview;
    };

    const renderPlots = () => {
        plotList.innerHTML = '';
        if (appState.plots.length === 0) {
            plotList.innerHTML = '<div class="chapter-item empty"><div class="chapter-title">（対話から生成中...）</div></div>';
            return;
        }
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

    // --- Interaction ---
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    const formatTime = () => {
        const now = new Date();
        const hours = now.getHours();
        const mins = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? '午後' : '午前';
        return `${ampm} ${hours % 12 || 12}:${mins}`;
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
                        <div class="bubble user">${text.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
            `;
        } else {
            innerHTML = `
                <div class="avatar"><i class="fas fa-bolt"></i></div>
                <div class="message-content">
                    <div class="sender-name">ジーニー</div>
                    <div class="bubble-row">
                        <div class="bubble genie">${text.replace(/\n/g, '<br>')}</div>
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
        const timeStr = formatTime();
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

        // Simulated thinking effect
        setTimeout(() => {
            let response = "";
            
            if (text.includes("書きたい") || text.includes("テーマ")) {
                const theme = text.match(/「(.*?)」/) ? text.match(/「(.*?)」/)[1] : text.replace("について書きたい", "").trim();
                response = `『${theme}』、とても素敵なテーマですね！\nあなたの想いを大切に受け取って、まずは3つの章からなる「骨格（プロット）」を組み立ててみました。\n\n画面の左側（ワークスペース）を確認してみてください。`;
                
                appState.plots = [
                    `${theme}の真実と、私たちが知るべきこと`,
                    `実践：${theme}を一歩ずつ形にする方法`,
                    `未来への展望：${theme}がもたらす変化`
                ];
                renderPlots();
            } else {
                response = "そのお話、もっと詳しく聞かせてください。読者の心に深く刺さる一冊にするために、あなたの言葉を一つひとつ研ぎ澄ませていきますね。";
                appState.preview = `
                    <span style="color:var(--text-meta); display:block; margin-bottom:10px;">【ジーニーによる執筆プレビュー】</span>
                    「${text}」<br><br>
                    <span style="color:var(--accent-gold); font-size:0.85rem; border-top:1px dashed var(--line-middle-border); display:block; padding-top:10px;">
                        ✨ ジーニーの眼差し：この言葉には、読者の悩みに対する「答え」が隠されています。ここを深掘りすることで、信頼される本になりますよ。
                    </span>
                `;
                previewArea.innerHTML = appState.preview;
            }

            addMessage(response, 'genie');
            saveData();
        }, 1200);
    };

    // --- Listeners ---
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);

    toggleCanvasBtn.addEventListener('click', () => {
        if (window.innerWidth > 750) {
            middleCanvas.classList.toggle('hidden');
        } else {
            middleCanvas.classList.toggle('active');
        }
        
        const isVisible = window.innerWidth > 750 ? !middleCanvas.classList.contains('hidden') : middleCanvas.classList.contains('active');
        toggleCanvasBtn.querySelector('i').className = isVisible ? 'fas fa-times' : 'fas fa-columns';
    });

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        const icon = themeToggleBtn.querySelector('i');
        if (body.classList.contains('dark-theme')) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    });

    // Load Initial Data
    loadData();
});
