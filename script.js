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

    const addMessage = (text, sender) => {
        const timeStr = formatTime(new Date());
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
                    <div class="sender-name">アンジー</div>
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

    const handleSend = () => {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        // Simulate AI thinking
        setTimeout(() => {
            let response = "承知しました。その大切な想い、しっかりと受け止めました。";
            
            // Basic logic to add plot
            if (text.includes("章") || text.includes("構成")) {
                const chapterTitle = text.match(/「(.*?)」/) ? text.match(/「(.*?)」/)[1] : (text.length > 10 ? text.substring(0, 10) + "..." : text);
                response = `素晴らしいですね。「${chapterTitle}」として、構成案（プロット）に組み込んでおきました。`;
                
                const currentChapters = document.querySelectorAll('.chapter-item:not(.empty)');
                const nextNum = currentChapters.length + 1;
                
                // Remove empty indicator if exists
                const emptyNode = document.querySelector('.chapter-item.empty');
                if (emptyNode) emptyNode.remove();

                const newItem = document.createElement('div');
                newItem.className = 'chapter-item';
                newItem.innerHTML = `
                    <div class="chapter-info">
                        <span class="chapter-number">Chapter ${nextNum}</span>
                        <div class="chapter-title">${chapterTitle}</div>
                    </div>
                `;
                plotList.appendChild(newItem);
            } else {
                // Update Live Preview
                const previewArea = document.querySelector('.preview-text');
                previewArea.innerHTML = `『${text}』<br><br><span style="color:#d4af37; font-size:0.85rem;">✨ アンジーの眼差し：この言葉が読者の心に深く刺さる一節になりそうです。</span>`;
            }

            addMessage(response, 'angie');
            
            // Scroll to bottom of canvas if active
            const middleContent = document.querySelector('.middle-content');
            if(middleContent) middleContent.scrollTop = middleContent.scrollHeight;
        }, 1000);
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

    // Toggle Canvas Logic (for narrow screens)
    const toggleCanvasBtn = document.getElementById('toggleCanvasBtn');
    const middleCanvas = document.getElementById('middleCanvas');
    
    toggleCanvasBtn.addEventListener('click', () => {
        middleCanvas.classList.toggle('active');
        
        // Icon change
        const icon = toggleCanvasBtn.querySelector('i');
        if (middleCanvas.classList.contains('active')) {
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
});
