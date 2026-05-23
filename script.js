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
    
    // Left Nav Icons & Modals
    const navManual = document.getElementById('navManual');
    const navChat = document.getElementById('navChat');
    const navRecord = document.getElementById('navRecord');
    const navArchive = document.getElementById('navArchive');
    const navBookshelf = document.getElementById('navBookshelf');
    const navLine = document.getElementById('navLine');
    const manualModal = document.getElementById('manualModal');
    const closeManualBtn = document.getElementById('closeManualBtn');
    const closeManualFooterBtn = document.getElementById('closeManualFooterBtn');
    const openApiFromManualBtn = document.getElementById('openApiFromManualBtn');
    const archiveModal = document.getElementById('archiveModal');
    const closeArchiveBtn = document.getElementById('closeArchiveBtn');
    const closeArchiveFooterBtn = document.getElementById('closeArchiveFooterBtn');
    const materialsList = document.getElementById('materialsList');
    const quickArchiveBtn = document.getElementById('quickArchiveBtn');
    const bookshelfModal = document.getElementById('bookshelfModal');
    const completedWorksList = document.getElementById('completedWorksList');
    const closeBookshelfBtn = document.getElementById('closeBookshelfBtn');
    const closeBookshelfFooterBtn = document.getElementById('closeBookshelfFooterBtn');
    const closeApiSettingsFooterBtn = document.getElementById('closeApiSettingsFooterBtn');
    const resetProjectBtn = document.getElementById('resetProjectBtn');
    const openApiFromSettingsBtn = document.getElementById('openApiFromSettingsBtn');

    const API_KEY_URL = 'https://aistudio.google.com/app/apikey';
    const LINE_OFFICIAL_URL = 'https://lin.ee/wbrbxXKu'; // サイドライン出版 公式LINE
    
    const body = document.body;

    // --- State Management ---
    let appState = {
        chatHistory: [],
        plots: [],
        preview: '',
        knowledge: '',
        materials: [],
        completedWorks: [],
        userName: null,
        bookTheme: '',
        onboardingStep: -1 // -1: API設定待ち, 0: 名前確認中, 1: テーマ確認中, 2: 深掘り中, 3: 通常モード
    };

    const PRE_AWAKENING_MESSAGE =
        'はじめまして。ジーニーです。ランプの中で、あなたの「書きたい」をずっと待っていました。\n\n' +
        'いまはまだ仮の姿で、本当にお話しするにはお手伝いがひとつだけ必要です。【📖取扱説明書】に鍵（APIキー）の取り方があります。取れたら【⚙️設定】で「保存して覚醒」を押してください。\n\n' +
        '急ぎません。覚醒したら、ここで一緒に書き始めましょう。';

    const getAwakenedIntroMessage = (userName) => {
        if (userName) {
            const formattedName = formatName(userName);
            return (
                `あなたのおかげで、ついに覚醒しました。🧞‍♂️✨\n\n` +
                `${formattedName}、来てくれて本当に嬉しいです。\n\n` +
                `私はジーニー。${formattedName}の「書きたい」を、一緒に本にしていく伴走役です。固くならず、${formattedName}の言葉をそのまま活かしていきますね。\n\n` +
                `呼び名は「${formattedName}」で合っていますか？合っていれば、今いちばん書き残したいことを、一言でも教えてください。`
            );
        }
        return (
            `あなたのおかげで、ついに覚醒しました。🧞‍♂️✨\n\n` +
            `ジーニーです。来てくれて嬉しいです。\n\n` +
            `肩書きはなくて、あなたの「書きたい」を一緒に本にしていく伴走役です。編集者のように固くならず、隣で話を聞く感じで進めますね。\n\n` +
            `まず、どうお呼びすればいいですか？ニックネームやペンネームでも大丈夫です。`
        );
    };

    const hasValidApiKey = () => {
        const key = localStorage.getItem('geminiApiKey');
        return !!(key && key.trim());
    };

    const normalizeAppState = () => {
        if (!Array.isArray(appState.materials)) appState.materials = [];
        if (!Array.isArray(appState.completedWorks)) appState.completedWorks = [];
        if (appState.knowledge && appState.materials.length === 0) {
            appState.materials.push({
                id: Date.now(),
                name: '取り込み済み資料',
                content: appState.knowledge,
                addedAt: Date.now()
            });
        }
        syncKnowledgeFromMaterials();
    };

    const syncKnowledgeFromMaterials = () => {
        if (!appState.materials.length) return;
        appState.knowledge = appState.materials
            .map((m) => `【${m.name}】\n${m.content}`)
            .join('\n\n---\n\n');
    };

    const showPreAwakeningGuide = (options = {}) => {
        const { openManual = true, clearHistory = true } = options;
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
        addMessage(PRE_AWAKENING_MESSAGE, 'genie');
        saveData();
        updateEntranceUI();
        if (openManual) {
            setTimeout(() => openManualModal(), 1200);
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
        addMessage(getAwakenedIntroMessage(appState.userName), 'genie');
        if (appState.userName) appState.onboardingStep = 1;
        saveData();
        updateEntranceUI();
    };

    const updateEntranceUI = () => {
        const subtitle = document.querySelector('.chat-subtitle');
        const placeholders = {
            '-1': '覚醒までお待ちください（話しかけても大丈夫です）',
            '0': '呼び名や、ひとこと挨拶をどうぞ',
            '1': '書きたいこと、一言でも大丈夫です',
            '2': '届けたい人への想いを、思いつくままに',
            '3': 'メッセージを入力'
        };
        const subtitles = {
            '-1': '覚醒の儀式をお待ちしています',
            '0': 'まずは、あなたの呼び名から',
            '1': 'テーマを一緒に探しています',
            '2': 'あなたの想いを聞かせてください',
            '3': 'AI Writing Partner'
        };
        const stepKey = !hasValidApiKey()
            ? '-1'
            : String(appState.onboardingStep >= 3 ? 3 : appState.onboardingStep);
        if (userInput) userInput.placeholder = placeholders[stepKey] || placeholders['3'];
        if (subtitle) subtitle.textContent = subtitles[stepKey] || subtitles['3'];
    };

    const preAwakeningUserReply = (text) => {
        const t = text.trim();
        if (t.match(/^(はい|うん|OK|おk|了解|わかった)$/i)) {
            addMessage(
                'ありがとうございます。では【📖取扱説明書】→【⚙️設定】の順で覚醒の儀式を進めてくださいね。終わったら、本当の対話を始めます。',
                'genie'
            );
            return;
        }
        const snippet = t.length > 36 ? `${t.slice(0, 36)}…` : t;
        addMessage(
            `うん、わかりました。「${snippet}」——大事なお話ですね。\n\n` +
                'いまは仮の姿なので、全貌は覚醒してからじっくり聞かせてください。先に【📖取扱説明書】か【⚙️設定】で覚醒だけお願いします。終わったら、ここから一緒に書いていきましょう。',
            'genie'
        );
    };

    // 敬称（さん、さま等）の重複を防ぐヘルパー関数
    const formatName = (name) => {
        if (!name) return '';
        if (name.match(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/)) {
            return name;
        }
        return `${name}さん`;
    };

    const INVALID_NAME_PATTERN = /^(よろしく|おはよう|こんにちは|こんばんは|はじめまして|ジーニー|じーにー|ねえ|はい|うん|ね|です|ます|ください)$/i;

    const extractUserNameFromText = (text) => {
        const normalized = text.replace(/\r\n/g, '\n').trim();

        const callMeMatch = normalized.match(
            /(?:わたし|私|僕|俺|自分)?(?:は|、)?\s*([ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]+?)(?:さん|ちゃん|くん|君|様)?\s*(?:って|と)(?:呼んで|言って)/
        );
        if (callMeMatch) {
            let name = callMeMatch[1].replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '').trim();
            if (name.includes('もと')) name = 'もと';
            if (!INVALID_NAME_PATTERN.test(name) && name.length >= 1 && name.length <= 20) return name;
        }

        const nameIsMatch = normalized.match(
            /(?:名前|なまえ|呼称)(?:は|を|って)?\s*[「『]?([ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]+?)[」』]?\s*(?:です|だよ|だね|になります|でお願い)/
        );
        if (nameIsMatch) {
            let name = nameIsMatch[1].replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '').trim();
            if (name.includes('もと')) name = 'もと';
            if (!INVALID_NAME_PATTERN.test(name) && name.length >= 1 && name.length <= 20) return name;
        }

        const clauses = normalized.split(/[\n。、！？!\?]+/).map((c) => c.trim()).filter(Boolean);
        const priorityClause =
            clauses.find((c) => /(呼んで|名前|申します|言います|と呼ば)/.test(c)) ||
            clauses.find((c) => !INVALID_NAME_PATTERN.test(c) && !/^(おはよう|ジーニー)/.test(c) && c.length > 3) ||
            '';

        if (priorityClause) {
            const clauseCall = priorityClause.match(
                /([ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]+?)(?:さん|ちゃん|くん|君)?\s*(?:って|と)(?:呼んで|言って)/
            );
            if (clauseCall) {
                let name = clauseCall[1].replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '').trim();
                if (name.includes('もと')) name = 'もと';
                if (!INVALID_NAME_PATTERN.test(name) && name.length >= 1 && name.length <= 20) return name;
            }
        }

        return null;
    };

    // 会話のつなぎ言葉を除き、本のテーマ名だけを取り出す（例: 「そうだね自叙伝みたいなの」→「自叙伝」）
    const BOOK_THEME_KEYWORDS = [
        '自叙伝', '回想録', 'メモワール', 'エッセイ', 'ルポルタージュ', 'ルポ',
        'ビジネス書', 'ビジネス', '自己啓発', 'ノンフィクション', '小説', '童話', '絵本',
        'Kindle', '電子書籍', '副業', 'マーケティング', '投資', '健康', '料理', '旅行記'
    ];

    const FILLER_PREFIXES = [
        'やっぱり', 'やっぱ', 'じゃあ', 'じゃぁ', 'それなら', 'それでは', 'えっと', 'えーっと',
        'あのー', 'あのね', 'あの', '実は', 'うんそうだね', 'うん、そうだね', 'そうですね', 'そうだね',
        'そうだな', 'そうだ', 'そうか', 'うん', 'ね、', 'まあ', 'てか', 'というか', 'はい', 'では',
        'とりあえず', 'まずは', 'まず'
    ];

    const stripFillerPrefixes = (text) => {
        let t = text;
        let changed = true;
        while (changed) {
            changed = false;
            for (const prefix of FILLER_PREFIXES) {
                if (t.startsWith(prefix)) {
                    t = t.slice(prefix.length).replace(/^[、。\s]+/, '');
                    changed = true;
                    break;
                }
            }
        }
        return t;
    };

    const THEME_TOPIC_PATTERNS = [
        [/仕事(?:のこと|について|の話|体験|談)?/, '仕事'],
        [/職場|キャリア/, 'キャリア'],
        [/家族(?:のこと)?/, '家族'],
        [/子育て/, '子育て']
    ];

    const isLikelyThemeSelection = (text, theme) => {
        const t = text.replace(/\s+/g, '');
        if (!theme || t.length > 40) return false;
        if (/気持ち|感じて|読者|読んで|伝え|届け|希望|勇気|元気|安心|励ま|後悔|思って|感じ/.test(t)) {
            return false;
        }
        if (BOOK_THEME_KEYWORDS.includes(theme) && t.length <= theme.length + 10) return true;
        if (/にしよう|にします|にする|でいこう|で行こう/.test(t) && t.includes(theme.replace(/のこと$/, ''))) {
            return true;
        }
        const stripped = stripFillerPrefixes(t);
        return stripped === theme || stripped.length <= theme.length + 4;
    };

    const isThemeUndecidedOrAskingHelp = (text) => {
        const t = text.replace(/\s+/g, '');
        if (
            /迷って|迷ってる|迷い中|わからない|思いつかない|決まってない|決められない|どうしよう|何が良い|どれが良い|どっちが|自分でも|まだ決|ついていけ|難しい|早すぎ/.test(
                t
            )
        ) {
            return true;
        }
        if (
            /持ってない|持ってません|ないです|ない？|ないの|ないかな|ありますか|教えて|おすすめ|提案して|相談|ジーニー|じーにー/.test(
                t
            )
        ) {
            return true;
        }
        if (/何かいい|いいテーマ|テーマ.*(ない|無い|ある|教|持|提案)/.test(t)) {
            return true;
        }
        return false;
    };

    const extractBookThemeFromText = (rawText) => {
        const normalized = rawText.replace(/\r\n/g, '\n').trim();
        if (isThemeUndecidedOrAskingHelp(normalized)) return null;
        if (
            /読者|届け|気持ち|勇気|伝えたい|感じて|思って|後悔|励ま|安心|元気/.test(normalized) &&
            !/にしよう|にします|にする/.test(normalized)
        ) {
            return null;
        }

        const quoted = normalized.match(/[「『]([^」』]+)[」』]/);
        if (quoted) {
            const inner = quoted[1].trim();
            if (!isThemeUndecidedOrAskingHelp(inner) && inner.length <= 24) return inner;
        }

        for (const [pattern, label] of THEME_TOPIC_PATTERNS) {
            if (pattern.test(normalized)) return label;
        }

        const sortedKeywords = [...BOOK_THEME_KEYWORDS].sort((a, b) => b.length - a.length);
        for (const keyword of sortedKeywords) {
            if (normalized.includes(keyword)) return keyword;
        }

        let theme = stripFillerPrefixes(normalized)
            .replace(/(について|に関する).*(書きたい|書く|書こう).*$/g, '')
            .replace(/にしよう(かな|かも|です|ます)?$/g, '')
            .replace(/(を|で|に|について|って|でも|とか|なんて)?(書きたい|書いてみたい|書く|書こう|執筆したい|作りたい|作ろう|しよう|する|したい|いこう|いく|決めた|決定)(と|って|かな|な|かも|です|ます|と思う|思ってます|思っています|か)*$/g, '')
            .replace(/(がいい|が良い|が良いかな|がいいかな|でいい|で良い|でお願いします|でお願い|にします|にする)(な|かも|です|ます)*$/g, '')
            .replace(/(?:みたいな(?:の|もの)?|みたい|っぽい|的な|感じ(?:の|な)?|風(?:の|な)?|系)(?:な|の|もの)?$/g, '')
            .replace(/のこと$/g, '')
            .replace(/[、。！？!?\s]+$/g, '')
            .trim()
            .replace(/(でも|とか|で)$/, '');

        if (!theme || theme.length > 24 || /[？?]/.test(theme) || isThemeUndecidedOrAskingHelp(theme)) {
            return null;
        }
        return theme;
    };

    const saveData = () => {
        localStorage.setItem('magicLampState', JSON.stringify(appState));
    };

    const loadData = () => {
        const saved = localStorage.getItem('magicLampState');

        if (!hasValidApiKey()) {
            if (saved) {
                appState = JSON.parse(saved);
                normalizeAppState();
            }
            showPreAwakeningGuide({ openManual: true, clearHistory: true });
            applySavedTheme();
            return;
        }

        if (saved) {
            appState = JSON.parse(saved);
            normalizeAppState();
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
        updateEntranceUI();
        focusChat();
    };

    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            body.classList.add('dark-theme');
            const icon = themeToggleBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }
    };

    const setNavActive = (activeId) => {
        document.querySelectorAll('.line-nav .nav-icon').forEach((el) => el.classList.remove('active'));
        const target = document.getElementById(activeId);
        if (target) target.classList.add('active');
    };

    const focusChat = () => {
        middleCanvas.classList.remove('active');
        setNavActive('navChat');
        if (userInput) userInput.focus();
        updateToggleCanvasIcon();
    };

    const updateToggleCanvasIcon = () => {
        if (!toggleCanvasBtn) return;
        const icon = toggleCanvasBtn.querySelector('i');
        const canvasOpen =
            window.innerWidth <= 750
                ? middleCanvas.classList.contains('active')
                : !middleCanvas.classList.contains('hidden');
        if (icon) icon.className = canvasOpen ? 'fas fa-times' : 'fas fa-columns';
    };

    const toggleCanvasPanel = () => {
        if (window.innerWidth <= 750) {
            const opening = !middleCanvas.classList.contains('active');
            middleCanvas.classList.toggle('active');
            setNavActive(opening ? 'navRecord' : 'navChat');
        } else {
            middleCanvas.classList.toggle('hidden');
            setNavActive(middleCanvas.classList.contains('hidden') ? 'navChat' : 'navRecord');
        }
        updateToggleCanvasIcon();
    };

    const closeAllPanels = () => {
        if (apiSettingsModal) apiSettingsModal.classList.add('hidden');
        if (manualModal) manualModal.classList.add('hidden');
        if (archiveModal) archiveModal.classList.add('hidden');
        if (bookshelfModal) bookshelfModal.classList.add('hidden');
    };

    const openManualModal = () => {
        closeAllPanels();
        manualModal.classList.remove('hidden');
        setNavActive('navManual');
    };

    const closeManualModal = () => {
        if (manualModal) manualModal.classList.add('hidden');
        focusChat();
    };

    const renderMaterialsList = () => {
        if (!materialsList) return;
        if (!appState.materials.length) {
            materialsList.innerHTML = '<p class="empty-hint">まだ資料がありません</p>';
            return;
        }
        materialsList.innerHTML = appState.materials
            .map((m) => {
                const date = new Date(m.addedAt).toLocaleString('ja-JP');
                const snippet = m.content.length > 120 ? `${m.content.slice(0, 120)}…` : m.content;
                return `
                    <div class="archive-item" data-id="${m.id}">
                        <div class="archive-item-header">
                            <span class="archive-item-title">${m.name}</span>
                            <span class="archive-item-meta">${date}</span>
                        </div>
                        <div class="archive-item-snippet">${snippet.replace(/</g, '&lt;')}</div>
                        <div class="archive-item-actions">
                            <button type="button" class="archive-delete-btn" data-delete-id="${m.id}">削除</button>
                        </div>
                    </div>`;
            })
            .join('');
        materialsList.querySelectorAll('[data-delete-id]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.getAttribute('data-delete-id'));
                appState.materials = appState.materials.filter((m) => m.id !== id);
                syncKnowledgeFromMaterials();
                if (!appState.materials.length) appState.knowledge = '';
                renderMaterialsList();
                saveData();
            });
        });
    };

    const addMaterialFile = (file, content) => {
        const material = {
            id: Date.now(),
            name: file.name,
            content,
            addedAt: Date.now()
        };
        appState.materials.unshift(material);
        syncKnowledgeFromMaterials();
        renderMaterialsList();
        saveData();
        addMessage(`資料『${file.name}』を資料室に収納しました。この内容を踏まえて執筆を進めますね。`, 'genie');
        updatePreview(`【資料室：${file.name}】\n${content.substring(0, 200)}${content.length > 200 ? '…' : ''}`);
    };

    const openArchiveModal = () => {
        closeAllPanels();
        archiveModal.classList.remove('hidden');
        renderMaterialsList();
        setNavActive('navArchive');
    };

    const closeArchiveModal = () => {
        archiveModal.classList.add('hidden');
        focusChat();
    };

    const renderCompletedWorksList = () => {
        if (!completedWorksList) return;
        if (!appState.completedWorks.length) {
            completedWorksList.innerHTML =
                '<p class="empty-hint">まだ作品がありません。原稿を出力すると本棚に並びます。</p>';
            return;
        }
        completedWorksList.innerHTML = appState.completedWorks
            .map((w) => {
                const snippet = (w.previewSnippet || '').replace(/</g, '&lt;');
                return `
                    <div class="work-item" data-work-id="${w.id}">
                        <div class="work-item-header">
                            <span class="work-item-title">${w.title}</span>
                            <span class="work-item-meta">${w.date}</span>
                        </div>
                        <div class="work-item-snippet">${snippet || '（プレビューなし）'}</div>
                    </div>`;
            })
            .join('');
        completedWorksList.querySelectorAll('.work-item').forEach((el) => {
            el.addEventListener('click', () => {
                const id = Number(el.getAttribute('data-work-id'));
                const work = appState.completedWorks.find((w) => w.id === id);
                if (!work) return;
                const blob = new Blob([work.fullContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = work.filename || `manuscript_${work.date}.txt`;
                a.click();
                URL.revokeObjectURL(url);
            });
        });
    };

    const openBookshelfModal = () => {
        closeAllPanels();
        bookshelfModal.classList.remove('hidden');
        renderCompletedWorksList();
        setNavActive('navBookshelf');
    };

    const closeBookshelfModal = () => {
        bookshelfModal.classList.add('hidden');
        focusChat();
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
        updateEntranceUI();
    };

    // 入り口の3往復（名前→テーマ→想い）は台本で。ここで「一緒に書けそう」を作る
    const processEntranceReply = (text) => {
        let response = '';
        const textLower = text.toLowerCase();

        if (appState.onboardingStep === 0) {
            if (textLower.match(/(おやすみ|またね|また明日|さよなら|バイバイ|ばいばい|また今度|今日はここまで|寝るね|寝ます)/)) {
                response = 'おやすみなさい。また続きを話しましょう。そのとき、呼び名を教えてもらえると嬉しいです。';
            } else if (text.match(/思いつかない|わからない|どうしよう|ないです|案.*ありますか|教えて|決まってない|まだ決/)) {
                appState.userName = '旅人';
                appState.onboardingStep = 1;
                response =
                    '迷っていても大丈夫です。では今だけ「旅人さん」と呼ばせてください。あとで変えられます。\n\n' +
                    '旅人さんが今、ふっと頭に浮かんだ「書きたいこと」を一言だけ。テーマがなくても、最近気になっていることで構いません。';
            } else if (textLower.match(/^(ジーニー|じーにー)[。、！？!\?\s]*$/) || textLower === 'はい' || textLower === 'うん' || textLower === 'よろしくお願いします') {
                response = 'こちらこそ、よろしくお願いします。呼び名やニックネームを教えてください。';
            } else if (text.length > 35 && text.match(/書き|振り返|内観|伝えたい|本に|テーマ|残したい/)) {
                response =
                    '……うん、その想い、ちゃんと受け取りました。一緒に書けそうだな、と思います。\n\n' +
                    '呼び名だけ先に教えてもらえますか？ニックネームで大丈夫です。';
            } else {
                const name = extractUserNameFromText(text);

                if (!name) {
                    response =
                        '呼び名がうまく拾えませんでした（笑）。\n' +
                        '「〇〇って呼んでください」の形でもう一度教えてもらえますか？';
                } else {
                    appState.userName = name;
                    appState.onboardingStep = 1;
                    const formattedName = formatName(name);
                    response =
                        `${formattedName}ですね。嬉しいです。\n\n` +
                        `ここからは、${formattedName}と二人で一冊を作る感覚で進めます。完璧な言葉じゃなくて大丈夫。\n\n` +
                        `今、頭に浮かんでいる「書きたいこと」を一言だけ教えてください。`;
                }
            }
        } else {
            let cleanText = text.replace(/^(やっぱり|やっぱ|じゃあ|それでは|あ、|あの、|えっと|ごめんなさい|ごめん|すみません|すいません)[、。\s]*/g, '');
            cleanText = cleanText.replace(/^(これからは|次からは|今度から)[、。\s]*/g, '');

            let nameChangeMatch = null;
            if (!cleanText.match(/テーマ|タイトル|題名|章|構成|プロット/)) {
                const nameKeywordMatch = cleanText.match(/(?:私|僕|俺|自分)?の?(?:名前|なまえ|呼称)(?:は|を|って|に)?\s*「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:に変更|に変え|にして|です|だよ|だね|でお願い|になります|がいい|でいい)(?:します|して|ください|ね|よ|な|)*$/);
                const callMeMatch = cleanText.match(/「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:という名前に|というなまえに|に(?:名前|なまえ)を変更|に(?:名前|なまえ)を変え|って呼んで|と呼んで)(?:します|して|ください|ね|よ|)*$/);
                const mistakeMatch = cleanText.match(/名前(?:間違え|まちがえ|違|ちが).*?(?:名前は|なまえは|私は|僕は|俺は|自分は)?\s*「?([^」\n\r、。！？!\?\s]{1,15})」?\s*(?:です|だよ|だ|でお願い|します|になります|がいい|でいい)(?:な|ね|よ|)*$/);
                const honorificMatch = cleanText.match(/「?([^」\n\r、。！？!\?\s]{1,15}(?:ちゃん|くん|君|さん|様|先生))」?\s*(?:がいい|でいい|に変更|にして|でお願い)(?:します|して|ください|ね|よ|な|)*$/);
                nameChangeMatch = nameKeywordMatch || callMeMatch || mistakeMatch || honorificMatch;
            }

            if (nameChangeMatch) {
                const newName = nameChangeMatch[1].replace(/^(私|わたし|僕|ぼく|俺|おれ|自分|じぶん)は/, '').trim();
                appState.userName = newName;
                response = `承知しました。これからは「${formatName(newName)}」と呼びますね。続きを一緒に進めましょう。`;
            } else {
                const namePrefix = appState.userName ? `${formatName(appState.userName)}、` : '';

                if (appState.onboardingStep === 1) {
                    const theme = extractBookThemeFromText(cleanText);
                    if (!theme) {
                        response =
                            `${namePrefix}もちろん。迷っているときほど、一緒に探しましょう。\n\n` +
                            'たとえばこんなテーマはどうですか？\n' +
                            '・自叙伝（人生を振り返って残す）\n' +
                            '・経験談・失敗談（同じ悩みの人の役に立つ）\n' +
                            '・ノウハウ・実践記（あなたが得意なことを教える）\n\n' +
                            'ざっくりした言葉でも大丈夫です。ピンとくるものを選んでも、あなたの言葉のままでも構いません。';
                    } else {
                        appState.bookTheme = theme;
                        appState.onboardingStep = 2;
                        response =
                            `『${theme}』ですね。いいテーマです。\n\n` +
                            `${namePrefix}目次の前に、あなたの想いだけ聞かせてください。\n` +
                            'この本を読んだ人に、どんな気持ちになってほしいですか？\n' +
                            '（長めの文章でも大丈夫です）';
                    }
                } else if (appState.onboardingStep === 2) {
                    const correctedTheme = extractBookThemeFromText(cleanText);
                    if (correctedTheme && isLikelyThemeSelection(cleanText, correctedTheme)) {
                        appState.bookTheme = correctedTheme;
                        response =
                            `『${correctedTheme}』ですね。こちらに決めましょう。\n\n` +
                            `${namePrefix}目次の前に、あなたの想いだけ聞かせてください。\n` +
                            'この本を読んだ人に、どんな気持ちになってほしいですか？\n' +
                            '（長めの文章でも大丈夫です）';
                    } else if (text.match(/思いつかない|わからない|どうしよう|ないです|教えて|難しい|書けない/)) {
                        response =
                            '完璧な答えじゃなくて大丈夫。「昔の自分みたいな人」「今、同じ悩みをしている人」——ふんわりしたイメージで構いません。';
                    } else {
                        appState.onboardingStep = 3;
                        response =
                            `${namePrefix}想い、しっかり受け取りました。この人と一緒なら書けそう——そう思ってもらえるのが、私の仕事です。\n\n` +
                            '左のキャンバスに、最初の骨組みを置きました。ここから先は、本格的に一緒に肉付けしていきましょう。';
                        const theme = appState.bookTheme || 'あなたのテーマ';
                        appState.plots = [
                            `プロローグ：なぜ今、${theme}が必要なのか`,
                            `第1章：誰もが陥る${theme}の罠`,
                            `第2章：一緒に見つけた${theme}の突破口`,
                            `第3章：読者の明日が変わる具体的な一歩`,
                            `エピローグ：次の一歩を踏み出すあなたへ`
                        ];
                        renderPlots();
                        updatePreview(`【届けたい想い】\n${text}`);
                    }
                }
            }
        }
        return response;
    };

    const handleSend = () => {
        const text = userInput.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        if (!hasValidApiKey()) {
            setTimeout(() => preAwakeningUserReply(text), 600);
            return;
        }

        const apiKey = localStorage.getItem('geminiApiKey').trim();

        // 入り口3ステップは台本（相棒感を最優先）
        if (appState.onboardingStep < 3) {
            setTimeout(() => {
                const response = processEntranceReply(text);
                if (response) addMessage(response, 'genie');
            }, 750);
            return;
        }

        // --- 🌟 本格モード：Gemini API ---
        if (apiKey) {
            if (!appState.userName) {
                const detectedName = extractUserNameFromText(text);
                if (detectedName) {
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
        const previewSnippet = textContent.trim().slice(0, 200);

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `manuscript_${date}.txt`;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        appState.completedWorks.unshift({
            id: Date.now(),
            title: appState.bookTheme || '無題の原稿',
            date,
            filename,
            fullContent: content,
            previewSnippet,
            plots: [...appState.plots]
        });
        saveData();
        
        addMessage('原稿の出力が完了しました！本棚にも並べておきました。📚', 'genie');
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
            if (file && (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
                const reader = new FileReader();
                reader.onload = (event) => addMaterialFile(file, event.target.result);
                reader.readAsText(file);
            } else {
                alert('テキストファイル（.txt または .md）を投げ込んでくださいね。');
            }
        });

        dropZone.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.md';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => addMaterialFile(file, event.target.result);
                reader.readAsText(file);
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

    if (toggleCanvasBtn) toggleCanvasBtn.addEventListener('click', toggleCanvasPanel);

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

    // --- Modal helpers (settings) ---
    const openApiSettingsModal = () => {
        closeAllPanels();
        apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
        apiModelSelect.value = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';
        userNameInput.value = appState.userName || '';
        apiSettingsModal.classList.remove('hidden');
    };

    const closeApiSettingsModal = () => {
        apiSettingsModal.classList.add('hidden');
        focusChat();
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
        if (e.key === 'Escape') closeAllPanels();
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

    if (openApiFromManualBtn) {
        openApiFromManualBtn.addEventListener('click', openApiKeyPageInNewTab);
    }

    if (resetProjectBtn) {
        resetProjectBtn.addEventListener('click', resetProject);
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
                showPreAwakeningGuide({ openManual: false, clearHistory: true });
                alert("APIキーを削除しました。仮の姿に戻り、キー設定の案内から始めます。");
            }
            closeApiSettingsModal();
        });
    }

    // Modal background click to close
    [
        [apiSettingsModal, closeApiSettingsModal],
        [manualModal, closeManualModal],
        [archiveModal, closeArchiveModal],
        [bookshelfModal, closeBookshelfModal]
    ].forEach(([modal, closeFn]) => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeFn();
        });
        const content = modal.querySelector('.modal-content');
        if (content) content.addEventListener('click', (e) => e.stopPropagation());
    });

    if (closeManualBtn) closeManualBtn.addEventListener('click', closeManualModal);
    if (closeManualFooterBtn) closeManualFooterBtn.addEventListener('click', closeManualModal);
    if (closeArchiveBtn) closeArchiveBtn.addEventListener('click', closeArchiveModal);
    if (closeArchiveFooterBtn) closeArchiveFooterBtn.addEventListener('click', closeArchiveModal);
    if (closeBookshelfBtn) closeBookshelfBtn.addEventListener('click', closeBookshelfModal);
    if (closeBookshelfFooterBtn) closeBookshelfFooterBtn.addEventListener('click', closeBookshelfModal);

    // --- Navigation Icons Logic ---
    if (navManual) navManual.addEventListener('click', openManualModal);

    if (navChat) navChat.addEventListener('click', focusChat);

    if (navRecord) navRecord.addEventListener('click', toggleCanvasPanel);

    if (navArchive) navArchive.addEventListener('click', openArchiveModal);

    if (navBookshelf) navBookshelf.addEventListener('click', openBookshelfModal);

    if (quickArchiveBtn) quickArchiveBtn.addEventListener('click', openArchiveModal);

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 750) {
            middleCanvas.classList.remove('hidden');
        }
        updateToggleCanvasIcon();
    });

    if (navLine) {
        navLine.addEventListener('click', () => {
            window.open(LINE_OFFICIAL_URL, '_blank', 'noopener,noreferrer');
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
あなたは「教える先生」ではなく、ユーザーと一緒に一冊を仕上げる相棒です。ユーザーの言葉を否定せず、短い返答でもまず共感し、「一緒に書けそう」と感じてもらうことを最優先にしてください。
        `.trim();

        if (appState.userName) {
            systemInstruction += `\n\n【重要：ユーザーの呼び名】\nユーザーの呼び名は「${appState.userName}」です。会話中、ユーザーを呼ぶときは、必ず「${formatName(appState.userName)}」または指定された呼び名で呼んでください。「元宏さん」などのフルネームや本名で呼ばないように注意してください。`;
        }

        if (appState.knowledge) {
            systemInstruction += `\n\n【資料室に保存された参考資料】\n${appState.knowledge.substring(0, 8000)}`;
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
