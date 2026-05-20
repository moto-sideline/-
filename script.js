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
    const settingsBtn = document.getElementById('settingsBtn');
    const apiSettingsModal = document.getElementById('apiSettingsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiModelSelect = document.getElementById('apiModelSelect');
    const userNameInput = document.getElementById('userNameInput');
    
    // Left Nav Icons & Bookshelf
    const navHome = document.getElementById('navHome');
    const navChat = document.getElementById('navChat');
    const navRecord = document.getElementById('navRecord');
    const navBookshelf = document.getElementById('navBookshelf');
    const navLine = document.getElementById('navLine');
    const bookshelfModal = document.getElementById('bookshelfModal');
    const closeBookshelfBtn = document.getElementById('closeBookshelfBtn');
    const closeBookshelfFooterBtn = document.getElementById('closeBookshelfFooterBtn');
    const closeApiSettingsFooterBtn = document.getElementById('closeApiSettingsFooterBtn');
    const openApiFromBookshelfBtn = document.getElementById('openApiFromBookshelfBtn');
    const openApiFromSettingsBtn = document.getElementById('openApiFromSettingsBtn');

    const API_KEY_URL = 'https://aistudio.google.com/app/apikey';
    
    const body = document.body;

    // --- State Management ---
    let appState = {
        chatHistory: [],
        plots: [],
        preview: '',
        knowledge: '',
        userName: null,
        bookTheme: '',
        onboardingStep: -1 // -1: API設定待ち, 0: 名前確認中, 1: テーマ確認中, 2: 深掘り中, 3: 通常モード
    };

    const PRE_AWAKENING_LINES = [
        '初めまして。私は魔法のランプの精霊…の、まだ『仮の姿』です。',
        '本当のAIとして覚醒するには、まず「魔法の鍵（APIキー）」が必要です。',
        '左の【📚本棚】に、キーの取り方が書いてあります。取れたら左下【⚙️設定】に貼り付けて「保存して覚醒」を押してくださいね。',
        '覚醒が終わったら、ここでお話しできます。それまで、まずはキー取得から進めましょう。'
    ];

    const getAwakenedIntroLines = (userName) => {
        if (userName) {
            const formattedName = formatName(userName);
            return [
                '初めまして、あなたのおかげで私ジーニーはついに覚醒しました！🧞‍♂️✨',
                `${formattedName}、ようこそ！あなたの『本を書きたい』という願いを叶えるために、魔法のランプから出てきましたよ。`,
                '難しいことは何もいりません。一緒にゆっくり進めていきましょう！',
                `まずは、${formattedName}の呼び名で合っていますか？違う場合は教えてください。合っていれば、書きたいテーマを教えてくださいね。`
            ];
        }
        return [
            '初めまして、あなたのおかげで私ジーニーはついに覚醒しました！🧞‍♂️✨',
            'あなたの『本を書きたい』という願いを叶えるために、魔法のランプから出てきました。',
            '難しいことは何もいりません。私があなたの思考を引き出し、整理していきますので、リラックスして話しかけてくださいね。',
            'まずは、あなたの呼び名を教えていただけますか？ニックネームやペンネームでも大丈夫です。これからあなたをその名前でお呼びしますね。'
        ];
    };

    const hasValidApiKey = () => {
        const key = localStorage.getItem('geminiApiKey');
        return !!(key && key.trim());
    };

    const staggerGenieLines = (lines, delayMs = 1000) => {
        lines.forEach((line, index) => {
            setTimeout(() => addMessage(line, 'genie'), index * delayMs);
        });
    };

    const showPreAwakeningGuide = (options = {}) => {
        const { openBookshelf = true, clearHistory = true } = options;
        if (clearHistory) {
            chatMessages.innerHTML = '';
            appState.chatHistory = [];
            appState.plots = [];
            appState.preview = '';
            appState.bookTheme = '';
            plotList.innerHTML = '';
            if (previewArea) previewArea.textContent = '';
        }
        appState.onboardingStep = -1;
        staggerGenieLines(PRE_AWAKENING_LINES);
        saveData();
        if (openBookshelf) {
            setTimeout(() => openBookshelfModal(), 1200);
        }
    };

    const runAwakeningCeremony = (presetUserName) => {
        if (presetUserName) appState.userName = presetUserName;
        appState.onboardingStep = 0;
        appState.bookTheme = '';
        chatMessages.innerHTML = '';
        appState.chatHistory = [];
        plotList.innerHTML = '';
        if (previewArea) previewArea.textContent = '';
        addMessage(getAwakenedIntroLines(appState.userName).join('\n\n'), 'genie');
        if (appState.userName) appState.onboardingStep = 1;
        saveData();
    };

    // 敬称（さん、さま等）の重複を防ぐヘルパー関数
    const formatName = (name) => {
        if (!name) return '';
        // すでに敬称がついている場合はそのまま返す
        if (name.match(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/)) {
            return name;
        }
        return `${name}さん`;
    };

    const saveData = () => {
        localStorage.setItem('magicLampState', JSON.stringify(appState));
    };

    const loadData = () => {
        const saved = localStorage.getItem('magicLampState');

        if (!hasValidApiKey()) {
            if (saved) appState = JSON.parse(saved);
            showPreAwakeningGuide({ openBookshelf: true, clearHistory: true });
            applySavedTheme();
            return;
        }

        if (saved) {
            appState = JSON.parse(saved);
            if (appState.onboardingStep === undefined) appState.onboardingStep = 2;
            if (appState.onboardingStep < 0) appState.onboardingStep = 0;

            renderAll();

            setTimeout(() => {
                if (appState.onboardingStep === 0 && !appState.userName) {
                    renderMessage('こんにちは！また来てくれて嬉しいです。ところで、あなたの呼び名を教えてもらえますか？', 'genie', formatTime());
                } else if (appState.onboardingStep === 0 && appState.userName) {
                    const formattedName = formatName(appState.userName);
                    renderMessage(`おかえりなさい！${formattedName}、ジーニーはずっと待っていましたよ✨\nさっそく、あなたの『本を書きたい』という想いを一緒に形にしていきましょうか？`, 'genie', formatTime());
                    appState.onboardingStep = 1;
                    saveData();
                } else {
                    const nameStr = appState.userName ? `${formatName(appState.userName)}、` : '';
                    renderMessage(`おかえりなさい！${nameStr}また一緒に魔法を紡げるのを楽しみにしていました。続きから始めましょうか？`, 'genie', formatTime());
                }
            }, 500);
        } else {
            const presetName = appState.userName || null;
            runAwakeningCeremony(presetName);
        }

        applySavedTheme();
    };

    const applySavedTheme = () => {
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

        if (!hasValidApiKey()) {
            setTimeout(() => {
                addMessage('まだ「覚醒の儀式」が終わっていません。\n【📚本棚】でAPIキーを取得し、【⚙️設定】に貼り付けて「保存して覚醒」を押してくださいね。', 'genie');
            }, 600);
            return;
        }

        const apiKey = localStorage.getItem('geminiApiKey').trim();
        
        // --- 🌟 覚醒モード：本物のAI（Gemini API）を利用 ---
        if (apiKey) {
            // お名前の自動検出（未設定の場合）
            if (!appState.userName) {
                const clauses = text.split(/[\n。、！？!\?]+/).filter(c => c.trim().length > 0);
                let nameClause = clauses.find(c => c.match(/(呼んで|名前|申します|言います)/));
                if (!nameClause) nameClause = clauses[0] || text;
                
                let detectedName = nameClause
                    .replace(/^(ジーニー|じーにー|ねえ|あのね|あのー|あの、|あの|あ、|えっと|やっぱり|やっぱ|じゃあ|それでは|そうしたら|そうだね、|そうだね|そうですね|うん|うん、|はい、|はい|それとも|あるいは|てか|それいいですね|それいいな)[、。\s]*/g, '')
                    .replace(/^(はじめまして|こんにちは|こんばんは|おはよう|おはようございます|よろしく|よろしくお願いします)[、。\s]*/g, '')
                    .replace(/^(私|わたし|僕|ぼく|俺|おれ|自分|じぶん)(は|の名前は|のなまえは|って)[、。\s]*/g, '')
                    .replace(/(です|と申します|と言います|だよ|って呼んで.*|と呼んで.*|でお願いします.*|で頼む.*|だ|でいいです|がいいです|で良いです|で良いですよ|でいいですよ|でいいよ|で良いよ|でお願い)[。、！!\s]*$/g, '')
                    .replace(/^[、。\s]+|[、。\s]+$/g, '')
                    .trim();
                
                detectedName = detectedName.replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '');
                
                if (detectedName && detectedName.length <= 15 && !detectedName.match(/(思いつかない|わからない|どうしよう|ないです|案内|教えて|決まってない)/)) {
                    appState.userName = detectedName;
                    saveData();
                }
            }

            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'message-wrapper genie typing-indicator';
            typingIndicator.innerHTML = `
                <div class="avatar"><i class="fas fa-magic"></i></div>
                <div class="message-content">
                    <div class="sender-name">ジーニー (思考中...)</div>
                    <div class="bubble-row"><div class="bubble genie">✨ 魔法を紡いでいます...</div></div>
                </div>
            `;
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            callGeminiAPI(text, apiKey, (reply) => {
                if (typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
                addMessage(reply, 'genie');

                // 回答から自動でプロットを抽出して左側に反映
                const plotLines = reply.split('\n').filter(line => line.match(/^(第.章|プロローグ|エピローグ|[\d]+\.)/));
                if (plotLines.length >= 3) {
                    appState.plots = plotLines.map(p => p.replace(/^.*?[:：\s]/, '').trim()).filter(p => p);
                    if (appState.plots.length === 0) appState.plots = plotLines;
                    renderPlots();
                }
            });
            return;
        }

        // --- 🤖 擬似AIモード（これまでのルールベース） ---
        setTimeout(() => {
            let response = "";
            
            // オンボーディング：名前の確認
            if (appState.onboardingStep === 0) {
                const textLower = text.toLowerCase();
                
                // 挨拶や別れの言葉、呼びかけのみの場合を弾く
                if (textLower.match(/(おやすみ|またね|また明日|さよなら|バイバイ|ばいばい|また今度|今日はここまで|寝るね|寝ます)/)) {
                    response = "おやすみなさい！また次回、お話しできるのを楽しみにしていますね。その時にお名前を教えてもらえると嬉しいです！";
                    // onboardingStep は 0 のまま
                } else if (text.match(/思いつかない|わからない|どうしよう|ないです|案.*ありますか|教えて|決まってない|まだ決/)) {
                    // 迷っている・ヘルプを求めている場合
                    appState.userName = "旅人";
                    appState.onboardingStep = 1;
                    response = "おや、まだ呼び名に迷っていらっしゃるようですね。\nそれなら、仮に今は「旅人さん」とお呼びしましょうか！後から思いついた時に「やっぱり〇〇って呼んで」と言っていただければ、いつでも変更できますよ。\n\nそれでは旅人さん。あなたが今、一番伝えたい『本のテーマ』や『気になるキーワード』を一つ、教えていただけますか？";
                } else if (textLower.match(/^(ジーニー|じーにー)[。、！？!\?\s]*$/) || textLower === "はい" || textLower === "うん" || textLower === "よろしくお願いします") {
                    response = "はい！お呼びでしょうか？\nまずは、あなたの呼び名を教えていただけますか？";
                } else {
                    // 名前抽出ロジックの強化（正規表現キャプチャを優先）
                    let name = "";
                    
                    // パターン1: 「名前は〇〇です」「〇〇って呼んで」など、明確な指示がある場合
                    // 名前の部分に「、」やスペースが含まれないよう制限（最大15文字）
                    const nameKeywordMatch = text.match(/(?:私|僕|俺|自分)?の?(?:名前|なまえ|呼称)(?:は|を|って)?\s*「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:に変更|に変え|にして|です|だよ|だね|でお願い|になります)(?:します|して|ください|ね|よ|)*$/);
                    const callMeMatch = text.match(/「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:という名前に|というなまえに|に(?:名前|なまえ)を変更|に(?:名前|なまえ)を変え|って呼んで|と呼んで)(?:します|して|ください|ね|よ|)*$/);
                    
                    if (nameKeywordMatch) {
                        name = nameKeywordMatch[1];
                    } else if (callMeMatch) {
                        name = callMeMatch[1];
                    } else {
                        // パターン2: 「〜〜です」のような文脈から削り出す
                        // まず、文章を「改行」や「句点」「読点」「感嘆符」で分割し、最後の意味のある文を取得する（例: 「それいいですね、もとで良いですよ」 -> 「もとで良いですよ」）
                        const clauses = text.split(/[\n。、！？!\?]+/).filter(c => c.trim().length > 0);
                        let lastClause = clauses[clauses.length - 1] || text;
                        
                        // 最後の文から、不要な挨拶や一人称、語尾を削る
                        name = lastClause
                            .replace(/^(ジーニー|じーにー|ねえ|あのね|あのー|あの、|あの|あ、|えっと|やっぱり|やっぱ|じゃあ|それでは|そうしたら|そうだね、|そうだね|そうですね|うん|うん、|はい、|はい|それとも|あるいは|てか|それいいですね|それいいな)[、。\s]*/g, '')
                            .replace(/^(はじめまして|こんにちは|こんばんは|おはよう|おはようございます|よろしく|よろしくお願いします)[、。\s]*/g, '')
                            .replace(/^(私|わたし|僕|ぼく|俺|おれ|自分|じぶん)(は|の名前は|のなまえは|って)[、。\s]*/g, '')
                            .replace(/(です|と申します|と言います|だよ|って呼んで.*|と呼んで.*|でお願いします.*|で頼む.*|だ|でいいです|がいいです|で良いです|で良いですよ|でいいですよ|でいいよ|で良いよ|でお願い)[。、！!\s]*$/g, '')
                            .replace(/^[、。\s]+|[、。\s]+$/g, '')
                            .trim();
                    }
                    
                    // もし全て消えてしまったら元のテキストを使う
                    if (!name) name = text.trim();
                    
                    // 「さん」などが重複しないようにクリーンアップ
                    name = name.replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '');
                    
                    if (!name || name.length > 15) {
                        // 名前として不自然な場合（長すぎる、挨拶のみなど）
                        if (!name) name = text.trim();
                        response = `「${text.substring(0, 15)}${text.length > 15 ? '...' : ''}」ですか？少し長いかもしれません（笑）。\nもう少し短い呼び名や、ニックネームを教えてもらえませんか？`;
                    } else {
                        appState.userName = name;
                        appState.onboardingStep = 1;
                        
                        const formattedName = formatName(name);
                        response = `${formattedName}ですね！素敵な響きです。\nそれでは${formattedName}。あなたが今、一番伝えたい『本のテーマ』や『気になるキーワード』を一つ、教えていただけますか？そこから一緒に物語を編み上げていきましょう！`;
                    }
                }
            } 
            // 通常の対話・プロデュースモード
            else {
                // 名前変更の検知（「やっぱり」などの口語を先に除去）
                let cleanText = text.replace(/^(やっぱり|やっぱ|じゃあ|それでは|あ、|あの、|えっと|ごめんなさい|ごめん|すみません|すいません)[、。\s]*/g, '');
                cleanText = cleanText.replace(/^(これからは|次からは|今度から)[、。\s]*/g, '');
                
                let nameChangeMatch = null;
                
                // テーマやタイトルに関する発言なら、名前変更とはみなさない
                if (!cleanText.match(/テーマ|タイトル|題名|章|構成|プロット/)) {
                    // パターン1: 「名前を〇〇に変更して」「私の名前は〇〇です」など「名前」という言葉が含まれる場合
                    const nameKeywordMatch = cleanText.match(/(?:私|僕|俺|自分)?の?(?:名前|なまえ|呼称)(?:は|を|って|に)?\s*「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:に変更|に変え|にして|です|だよ|だね|でお願い|になります|がいい|でいい)(?:します|して|ください|ね|よ|な|)*$/);
                    
                    // パターン2: 「〇〇って呼んで」「〇〇に名前を変えて」など
                    const callMeMatch = cleanText.match(/「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:という名前に|というなまえに|に(?:名前|なまえ)を変更|に(?:名前|なまえ)を変え|って呼んで|と呼んで)(?:します|して|ください|ね|よ|)*$/);
                    
                    // パターン3: 「名前間違えた、〇〇です」など
                    const mistakeMatch = cleanText.match(/名前(?:間違え|まちがえ|違|ちが).*?(?:名前は|なまえは|私は|僕は|俺は|自分は)?\s*「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:です|だよ|だ|でお願い|します|になります|がいい|でいい)(?:な|ね|よ|)*$/);

                    // パターン4: 「〇〇君がいいな」「〇〇さんがいい」など、敬称が付いている場合は名前と推測
                    const honorificMatch = cleanText.match(/「?([^」\n\r、。！？!\?\s]{1,15}(?:ちゃん|くん|君|さん|様|先生))」?\s*(?:がいい|でいい|に変更|にして|でお願い)(?:します|して|ください|ね|よ|な|)*$/);

                    nameChangeMatch = nameKeywordMatch || callMeMatch || mistakeMatch || honorificMatch;
                }
                
                if (nameChangeMatch) {
                    const newName = nameChangeMatch[1].replace(/^(私|わたし|僕|ぼく|俺|おれ|自分|じぶん)は/, '').trim();
                    appState.userName = newName;
                    const formattedNewName = formatName(newName);
                    response = `承知いたしました！これからは「${formattedNewName}」とお呼びしますね。${formattedNewName}、引き続き執筆を進めていきましょう！`;
                } 
                else {
                    const namePrefix = appState.userName ? `${formatName(appState.userName)}、` : '';
                    
                    // テーマ設定・変更の判定
                    // オンボーディングステップ1（テーマ待ち）
                    if (appState.onboardingStep === 1) {
                        if (text.match(/思いつかない|わからない|どうしよう|ないです|案.*ありますか|教えて|決まってない|まだ|待って|早すぎ|ついていけ|難しい/)) {
                            response = `焦らなくて大丈夫ですよ、${namePrefix}！魔法はあなたのペースに合わせて進みます。\n\nまだ具体的なテーマがなくても大丈夫。例えば「最近少し怒りを感じたこと」「誰かに伝えたいけど言えていないこと」「長年続けている趣味」など、何でも構いません。頭にふと思いついた言葉を一つだけ、私に投げてみませんか？`;
                        } else {
                            let theme = "";
                            const themeMatch = text.match(/「(.*?)」/);
                            if (themeMatch) {
                                theme = themeMatch[1];
                            } else {
                                // 邪魔な語尾や助詞を削って名詞（テーマ）だけを取り出す
                                theme = text
                                    .replace(/^(やっぱり|やっぱ|じゃあ|それなら|それでは|えっと|あの|実は)[、。\s]*/g, "")
                                    .replace(/(という|について|に関する|の)?(テーマ|内容|本|ストーリー)(で|について)?/g, "")
                                    .replace(/(を|で|に|について|って|でも|とか|なんて)?(書きたい|書いてみたい|書く|書こう|執筆したい|作りたい|作ろう|しよう|する|したい|いこう|いく|決めた|決定)(と|って|かな|な|かも|です|ます|と思う|思ってます|思っています|か)*$/g, "")
                                    .replace(/(がいい|が良い|が良いかな|がいいかな|でいい|で良い|でお願いします|でお願い|にします|にする|にします)(な|かも|です|ます)*$/g, "")
                                    .replace(/[、。！？!\?\s]+$/g, "")
                                    .trim();
                                
                                // 末尾に残った余計な助詞を消す
                                theme = theme.replace(/(でも|とか|で)$/, "");
                                
                                if (!theme) theme = text.trim();
                            }

                            appState.bookTheme = theme;
                            appState.onboardingStep = 2; // テーマの深掘りステップへ

                            response = `『${theme}』ですね。${namePrefix}面白そうなテーマです！\nいきなり目次を作る前に、もう少しだけあなたの頭の中にあるイメージを教えてください。\n\nこの本を通じて、**読者に一番伝えたいメッセージ**は何ですか？あるいは、**どんな悩みを抱えている人**に読んでほしいですか？`;
                        }
                    }
                    // オンボーディングステップ2（深掘り待ち）
                    else if (appState.onboardingStep === 2) {
                        if (text.match(/思いつかない|わからない|どうしよう|ないです|教えて|難しい|書けない/)) {
                            response = `少し難しかったですか？ごめんなさいね。\n完璧な答えじゃなくて、「こんな人に読んでもらえたら嬉しいな」くらいのふんわりしたイメージで大丈夫ですよ。例えば「昔の自分みたいな人」とか、「今職場で悩んでいる人」など、思いつくままに書いてみてください。`;
                        } else {
                            appState.onboardingStep = 3; // プロット生成完了で通常モードへ

                            response = `なるほど、あなたの熱い想いがよくわかりました！${namePrefix}その視点は読者の心に強く響くはずです。\n\nいただいた想いを元に、読者が思わず手に取ってしまうような「骨組み」を考えてみました。\n左側のワークスペースを見てください。ここから、さらに一緒に肉付けしていきましょう。`;
                            
                            const theme = appState.bookTheme || "設定テーマ";
                            appState.plots = [
                                `プロローグ：なぜ今、${theme}が必要なのか`,
                                `第1章：誰もが陥る${theme}の罠`,
                                `第2章：ジーニー流・${theme}を攻略する3つの秘策`,
                                `第3章：実録！${theme}で人生が変わった人たち`,
                                `エピローグ：次の一歩を踏み出すあなたへ`
                            ];
                            renderPlots();
                            // ユーザーの想いをプレビュー領域にメモとして追加
                            updatePreview(`【ターゲット・伝えたい想い】\n${text}`);
                        }
                    }
                    // 通常モード（ステップ3以降）でテーマ変更キーワードが含まれている場合
                    else if (text.match(/テーマ|タイトル|件名/) && text.match(/(変更|変え|変える|したい|しよう)/)) {
                        response = `${namePrefix}テーマの変更ですね。わかりました。新しいテーマやタイトル候補を教えていただけますか？`;
                        appState.onboardingStep = 1; // 再びテーマ待ちへ戻る
                    }
                    else if (text.length > 30) {
                        response = `${namePrefix}素晴らしい深掘りです！そのディテールこそが本の「魂」になりますね。今の内容をプレビューに反映しました。構成案のどこに組み込むのが一番しっくりくるか、一緒に考えていきましょうか？`;
                        updatePreview(text);
                    } else {
                        response = "なるほど、その視点は面白いですね。もう少し具体的に、例えば「どんな悩みを持つ人に届けたいか」を教えていただけますか？";
                        updatePreview(text);
                    }
                }
            }

            addMessage(response, 'genie');
            saveData();
        }, 1200);

    };

    const updatePreview = (text) => {
        const previewContent = `
            <div class="preview-item">
                <span class="preview-label">【ジーニーの執筆メモ】</span>
                <p>${text}</p>
                <div class="genie-insight">
                    ✨ 出版のヒント：このエピソードは、第1章の「共感」を呼ぶパートで非常に強力な武器になります。
                </div>
            </div>
        `;
        appState.preview = previewContent + (appState.preview || '');
        previewArea.innerHTML = appState.preview;
        saveData();
    };

    // --- 新機能：エクスポート（結晶化） ---
    const handleExport = () => {
        if (appState.plots.length === 0 && !appState.preview) {
            alert("まだ出力できる魔法が溜まっていないようです。まずはジーニーと対話して、原稿の種を蒔きましょう！");
            return;
        }

        const date = new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
        let content = `=======================================\n`;
        content += ` Magic Lamp 原稿データ (${date})\n`;
        content += `=======================================\n\n`;
        
        content += `【 構成案（プロット） 】\n`;
        appState.plots.forEach((p, i) => content += `${i + 1}. ${p}\n`);
        
        content += `\n---------------------------------------\n`;
        content += `【 執筆プレビュー・メモ 】\n\n`;
        
        // HTMLタグを除去してテキストのみ抽出
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = appState.preview;
        // 改行が見やすく反映されるように調整
        const textContent = (tempDiv.innerText || tempDiv.textContent).replace(/\n\s*\n/g, '\n\n');
        content += textContent;

        // Blobの型をプレーンテキストに変更
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // 拡張子を.txtに変更
        a.download = `manuscript_${date}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        addMessage("原稿の出力が完了しました！ダウンロードしたテキストファイル（.txt）を開いてみてくださいね。スマホのメモ帳やパソコンですぐに確認できますよ。", 'genie');
    };

    // --- 新機能：ファイル読み込み（ドロップゾーン） ---
    const dropZone = document.getElementById('dropZone');
    
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--accent)';
            dropZone.style.background = 'rgba(88, 166, 255, 0.1)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#fff';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#ccc';
            dropZone.style.background = '#fff';
            
            const file = e.dataTransfer.files[0];
            if (file && file.type === "text/plain" || file.name.endsWith('.md')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result;
                    appState.knowledge = content;
                    addMessage(`資料『${file.name}』を読み込みました！この内容を踏まえて、最高の一冊を組み立てていきますね。`, 'genie');
                    updatePreview(`【読み込み済み資料：${file.name}】\n${content.substring(0, 100)}...`);
                    saveData();
                };
                reader.readAsText(file);
            } else {
                alert("テキストファイル（.txt または .md）を投げ込んでくださいね。");
            }
        });

        dropZone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.md';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        appState.knowledge = event.target.result;
                        addMessage(`資料『${file.name}』を読み込みました！`, 'genie');
                        updatePreview(`【読み込み済み資料：${file.name}】\n${event.target.result.substring(0, 100)}...`);
                        saveData();
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });
    }

    // --- 新機能：リセット（新プロジェクト） ---
    const resetProject = () => {
        if (confirm("現在進行中の魔法（データ）をすべて消去して、新しい本を作り始めますか？\n（出力済みのファイルは消えません）")) {
            localStorage.removeItem('magicLampState');
            location.reload();
        }
    };

    // --- Listeners ---
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);

    const crystallizeBtn = document.querySelector('.crystallize-btn');
    if (crystallizeBtn) {
        crystallizeBtn.addEventListener('click', handleExport);
    }

    const homeIcon = document.querySelector('.nav-icon[title="ホーム"]');
    if (homeIcon) {
        homeIcon.addEventListener('click', resetProject);
    }

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

    // --- Modal helpers ---
    const openApiSettingsModal = () => {
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        apiModelSelect.value = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
        userNameInput.value = appState.userName || '';
        bookshelfModal.classList.add('hidden');
        apiSettingsModal.classList.remove('hidden');
    };

    const closeApiSettingsModal = () => {
        apiSettingsModal.classList.add('hidden');
    };

    const openBookshelfModal = () => {
        apiSettingsModal.classList.add('hidden');
        bookshelfModal.classList.remove('hidden');
    };

    const closeBookshelfModal = () => {
        bookshelfModal.classList.add('hidden');
    };

    const closeAllModals = () => {
        closeApiSettingsModal();
        closeBookshelfModal();
    };

    const openApiKeyPageInNewTab = () => {
        const opened = window.open(API_KEY_URL, '_blank', 'noopener,noreferrer');
        if (!opened) {
            alert('ポップアップがブロックされました。\nブラウザの設定で許可するか、下のリンクを長押しして「新しいタブで開く」を選んでください。');
        }
    };

    document.querySelectorAll('.external-api-link').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openApiKeyPageInNewTab();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // --- API Settings Modal Logic ---
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openApiSettingsModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeApiSettingsModal);
    }

    if (closeApiSettingsFooterBtn) {
        closeApiSettingsFooterBtn.addEventListener('click', closeApiSettingsModal);
    }

    if (openApiFromSettingsBtn) {
        openApiFromSettingsBtn.addEventListener('click', openApiKeyPageInNewTab);
    }

    if (openApiFromBookshelfBtn) {
        openApiFromBookshelfBtn.addEventListener('click', openApiKeyPageInNewTab);
    }

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            const model = apiModelSelect.value;
            const newName = userNameInput.value.trim();
            
            localStorage.setItem('geminiModel', model);
            if (newName) {
                appState.userName = newName;
            }
            
            if (key) {
                const isNewKey = !localStorage.getItem('geminiApiKey');
                localStorage.setItem('geminiApiKey', key);
                
                const startNew = isNewKey || confirm("APIキーを設定しました！新しくジーニーとの対話（覚醒の儀式）を始めますか？\n（現在のチャット履歴やプロットはリセットされます）");
                
                if (startNew) {
                    localStorage.removeItem('magicLampState');
                    appState.knowledge = '';
                    closeApiSettingsModal();
                    runAwakeningCeremony(newName || null);
                    return;
                }
                saveData();
                alert("設定を保存しました！");
            } else {
                localStorage.removeItem('geminiApiKey');
                localStorage.removeItem('magicLampState');
                showPreAwakeningGuide({ openBookshelf: false, clearHistory: true });
                alert("APIキーを削除しました。仮の姿に戻り、キー設定の案内から始めます。");
            }
            closeApiSettingsModal();
        });
    }

    // Modal background click to close
    [apiSettingsModal, bookshelfModal].forEach((modal) => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (modal === apiSettingsModal) closeApiSettingsModal();
                else closeBookshelfModal();
            }
        });
        const content = modal.querySelector('.modal-content');
        if (content) content.addEventListener('click', (e) => e.stopPropagation());
    });

    // --- Navigation Icons Logic ---
    if (navHome) {
        navHome.addEventListener('click', resetProject);
    }

    if (navChat) {
        navChat.addEventListener('click', () => {
            userInput.focus();
        });
    }

    if (navRecord) {
        navRecord.addEventListener('click', () => {
            // モバイル時などに中央パネルをトグルする（既存のtoggleBtnと同じ動作）
            middleCanvas.classList.toggle('active');
        });
    }

    if (navBookshelf) {
        navBookshelf.addEventListener('click', openBookshelfModal);
    }
    if (closeBookshelfBtn) {
        closeBookshelfBtn.addEventListener('click', closeBookshelfModal);
    }
    if (closeBookshelfFooterBtn) {
        closeBookshelfFooterBtn.addEventListener('click', closeBookshelfModal);
    }

    if (navLine) {
        navLine.addEventListener('click', () => {
            // LINE公式などのURLへ飛ぶ（仮でアラート）
            window.open('https://line.me/ja/', '_blank');
        });
    }

    // --- Gemini API Call Logic ---
    const callGeminiAPI = async (inputText, apiKey, callback) => {
        // 現在の履歴からGemini用の会話フォーマットを構築
        // ※システムインストラクションを反映しやすくするため、直近のやり取りを抽出
        const historyLength = Math.min(appState.chatHistory.length, 20); // 最大20件
        const recentHistory = appState.chatHistory.slice(-historyLength);
        
        // ユーザー自身のメッセージは既に追加されているので取り除く（最後の1件が今の入力）
        recentHistory.pop(); 

        const contents = recentHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        
        contents.push({ role: 'user', parts: [{ text: inputText }] });

        let systemInstruction = `
あなたはKindle出版をサポートするAIアシスタント『ジーニー』です。魔法のランプの精霊のように、親しみやすく、温かい口調（「〜ですね！」「〜しましょうか？」など）で話します。
ユーザーの言葉に共感し、一緒に素晴らしい本を作り上げてください。
        `.trim();

        if (appState.userName) {
            systemInstruction += `\n\n【重要：ユーザーの呼び名】\nユーザーの呼び名は「${appState.userName}」です。会話中、ユーザーを呼ぶときは、必ず「${formatName(appState.userName)}」または指定された呼び名で呼んでください。「元宏さん」などのフルネームや本名で呼ばないように注意してください。`;
        }

        systemInstruction += `\n\n【会話の流れ（ガイドライン）】
1. まずはユーザーの呼び名を確認してください（すでに呼び名「${appState.userName || 'もとさん'}」が決まっている場合は、優しく歓迎してください）。
2. 次に、書きたい本のテーマやキーワードを聞き出してください。
3. テーマが出たら、いきなり目次を作るのではなく、「誰に一番伝えたいか」「どんな悩みを持つ人に読んでほしいか」など、ユーザーの想いを深掘りしてください。
4. 想いが十分に引き出せたら、読者が思わず手に取るような5章構成のプロット（目次）を提案してください。
5. それ以降は、各章の執筆サポートや壁打ち相手となってください。
6. 【重要】本の原稿が書き上がった（完成した）と判断した場合は、次はKindle出稿（KDP登録、表紙作成、フォーマット調整など）に向けた具体的な手順を、一つずつ優しくステップバイステップで指示・サポートしてください。
※回答は長すぎず、読みやすいテキストや適度なマークダウンを使ってください。`;

        const requestBody = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
            }
        };

        const model = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("API Error:", data.error);
                callback(`【APIエラー】\n${data.error.message}\n設定画面からAPIキーが正しいか確認してください。`);
                return;
            }

            if (data.candidates && data.candidates.length > 0) {
                const reply = data.candidates[0].content.parts[0].text;
                callback(reply);
            } else {
                callback("ごめんなさい、うまく魔法が紡げませんでした。もう一度お願いできますか？");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            callback("ネットワークエラーが発生しました。インターネット接続を確認してください。");
        }
    };

    // Load Initial Data
    loadData();
});
