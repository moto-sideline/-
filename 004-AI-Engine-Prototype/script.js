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

    const handleSend = () => {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        // Fake AI response
        setTimeout(() => {
            addMessage("承知しました。今の「痛みを増幅させる技術」のお話、非常に鋭いです。第4章の『コピーライティングの罠』の中に、新たなパーツとして組み込んでおきますね。", "angie");
            
            // Update the canvas to show "activity"
            const newItem = document.createElement('div');
            newItem.className = 'chapter-item';
            newItem.style.animation = 'fadeIn 0.5s ease';
            newItem.innerHTML = `
                <span class="chapter-number">Chapter 4</span>
                <div class="chapter-title">悩みの「増幅装置」としての手法</div>
            `;
            plotList.appendChild(newItem);
        }, 1000);
    };

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
});
