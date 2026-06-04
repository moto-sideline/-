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

    // PWA Install Selectors & Variables
    const pwaInstallBanner = document.getElementById('pwaInstallBanner');
    const pwaInstallBtn = document.getElementById('pwaInstallBtn');
    const pwaCloseBannerBtn = document.getElementById('pwaCloseBannerBtn');
    const pwaInstallModal = document.getElementById('pwaInstallModal');
    const closePwaInstallBtn = document.getElementById('closePwaInstallBtn');
    const closePwaInstallFooterBtn = document.getElementById('closePwaInstallFooterBtn');
    const pwaIosInstructions = document.getElementById('pwaIosInstructions');
    const pwaAndroidInstructions = document.getElementById('pwaAndroidInstructions');
    const settingsPwaInstallBtn = document.getElementById('settingsPwaInstallBtn');
    const manualPwaInstallBtn = document.getElementById('manualPwaInstallBtn');

    let deferredPrompt = null;
    
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
        'はじめまして！わたしの名前はジーニー。ランプの中で、あなたの「書きたい」をずっと待っていたんだ。\n\n' +
        'いまはまだ仮の姿でね、本当にお話しするには鍵（APIキー）がひとつだけ必要なんだ。【📖取扱説明書】に鍵の取り方があるよ。取れたら【⚙️設定】で「保存して覚醒」を押してね。\n\n' +
        '急がなくていいよ。覚醒したら、一緒に書き始めよう！';

    const getAwakenedIntroMessage = (userName) => {
        if (userName) {
            const formattedName = formatName(userName);
            return (
                `わたしの名前はジーニー\n\n` +
                `あなたが鍵（APIキー）をセットしてくれたおかげで、ランプから目覚めることができました！🧞‍♂️✨\n\n` +
                `${formattedName}、来てくれて本当に嬉しいよ。\n\n` +
                `私はジーニー。${formattedName}の「書きたい」を、一緒に本にしていく伴走役だよ。堅苦しくなくていいから、思ったことをそのまま話しかけてね。\n\n` +
                `呼び名は「${formattedName}」で合っているかな？合っていれば、今いちばん書き残したいことを、一言でも教えてね！`
            );
        }
        return (
            `わたしの名前はジーニー\n\n` +
            `あなたが鍵（APIキー）をセットしてくれたおかげで、ランプから目覚めることができました！🧞‍♂️✨\n\n` +
            `あなたの「書きたい」を一緒に本にしていく伴走役だよ。堅苦しくなくていいから、思ったことをそのまま話しかけてね。\n\n` +
            `まず、どうお呼びすればいいかな？ニックネームやペンネームでも大丈夫だよ！`
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
                'ありがとう！それじゃあ、【📖取扱説明書】→【⚙️設定】の順で覚醒の儀式を進めてみてね。終わったら、本当の対話を始めよう！',
                'genie'
            );
            return;
        }
        const snippet = t.length > 36 ? `${t.slice(0, 36)}…` : t;
        addMessage(
            `うん、わかったよ。「${snippet}」——大事なお話だね。\n\n` +
                'いまはまだ仮の姿だから、全貌は覚醒してからじっくり聞かせてね。先に【📖取扱説明書】か【⚙️設定】で覚醒をお願い。終わったら、ここから一緒に書いていこう！',
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
                renderAll();
                
                // 既存の履歴があれば削除せず、APIキーの設定を促す案内だけを画面に追加表示
                setTimeout(() => {
                    renderMessage('ジーニーの覚醒（APIキー設定）が必要です。【⚙️設定】からAPIキーを保存してください。キーを設定すると対話を再開できます。🧞‍♂️✨', 'genie', formatTime());
                }, 500);
            } else {
                showPreAwakeningGuide({ openManual: true, clearHistory: true });
            }
            applySavedTheme();
            updateEntranceUI();
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

    // --- PWA Installation Logic ---
    const isStandalone = () => {
        return (window.navigator.standalone || 
                window.matchMedia('(display-mode: standalone)').matches);
    };

    const getMobileOS = () => {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
            return 'iOS';
        }
        if (/android/i.test(ua)) {
            return 'Android';
        }
        return 'unknown';
    };

    const showPwaInstallBanner = () => {
        if (pwaInstallBanner && !isStandalone()) {
            pwaInstallBanner.classList.remove('hidden');
        }
    };

    const hidePwaInstallBanner = () => {
        if (pwaInstallBanner) {
            pwaInstallBanner.classList.add('hidden');
        }
    };

    const openPwaInstallModal = () => {
        closeAllPanels();
        
        if (pwaIosInstructions) pwaIosInstructions.classList.add('hidden');
        if (pwaAndroidInstructions) pwaAndroidInstructions.classList.add('hidden');
        
        const os = getMobileOS();
        if (os === 'iOS') {
            if (pwaIosInstructions) pwaIosInstructions.classList.remove('hidden');
        } else {
            if (pwaAndroidInstructions) pwaAndroidInstructions.classList.remove('hidden');
        }
        
        if (pwaInstallModal) pwaInstallModal.classList.remove('hidden');
    };

    const closePwaInstallModal = () => {
        if (pwaInstallModal) pwaInstallModal.classList.add('hidden');
        focusChat();
    };

    const triggerPwaInstallation = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                deferredPrompt = null;
                hidePwaInstallBanner();
            });
        } else {
            openPwaInstallModal();
        }
    };

    const initPwaInstallation = () => {
        if (isStandalone()) {
            if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
            const pwaSettingsBlock = document.getElementById('pwaSettingsBlock');
            if (pwaSettingsBlock) pwaSettingsBlock.style.display = 'none';
            if (manualPwaInstallBtn) manualPwaInstallBtn.classList.add('hidden');
            return;
        }

        const isMobile = getMobileOS() !== 'unknown' || window.innerWidth <= 750;
        if (isMobile && manualPwaInstallBtn) {
            manualPwaInstallBtn.classList.remove('hidden');
        }

        if (!localStorage.getItem('pwaBannerDismissed')) {
            const os = getMobileOS();
            if (os === 'iOS') {
                showPwaInstallBanner();
            }
        }
    };

    const closeAllPanels = () => {
        if (apiSettingsModal) apiSettingsModal.classList.add('hidden');
        if (manualModal) manualModal.classList.add('hidden');
        if (archiveModal) archiveModal.classList.add('hidden');
        if (bookshelfModal) bookshelfModal.classList.add('hidden');
        if (pwaInstallModal) pwaInstallModal.classList.add('hidden');
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

    // ペースト時の高さ自動調整
    userInput.addEventListener('paste', function() {
        setTimeout(() => {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        }, 10);
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

    // 入り口の台本ロジックは廃止されました（AIフル解放）
    // eslint-disable-next-line no-unused-vars
    const processEntranceReply = (_text) => '';

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
        if (!apiKey) return;

        // バックグラウンドで名前/テーマを自動検出して保存
        if (!appState.userName) {
            const detectedName = extractUserNameFromText(text);
            if (detectedName) {
                appState.userName = detectedName;
                if (userNameInput) userNameInput.value = detectedName;
                saveData();
            }
        } else {
            const detectedName = extractUserNameFromText(text);
            if (detectedName && detectedName !== appState.userName && text.match(/名前|呼んで|変更|変え/)) {
                appState.userName = detectedName;
                if (userNameInput) userNameInput.value = detectedName;
                saveData();
            }
        }
        const detectedTheme = extractBookThemeFromText(text);
        if (detectedTheme && detectedTheme !== appState.bookTheme) {
            appState.bookTheme = detectedTheme;
            saveData();
        }

        // onboardingStep を 1以上に掲げる（step -1や 0のまま凍結しないように）
        if (appState.onboardingStep < 1) appState.onboardingStep = 1;

        // プロット作成や章立てに関する文脈であるかを判定
        const isPlotting = /プロット|章|構成|目次|組み立て|プロローグ|エピローグ|見出し|設計|アウトライン/.test(text);

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message-wrapper genie typing-indicator';
        
        let senderName, bubbleText, avatarIcon;
        if (isPlotting) {
            senderName = 'ジーニー (魔法を紡ぎ中...)';
            bubbleText = '✨ 魔法を紡いでいます...';
            avatarIcon = 'fa-magic';
        } else {
            senderName = 'ジーニー (思案中...)';
            bubbleText = '✨ 思考中...';
            avatarIcon = 'fa-brain';
        }

        typingIndicator.innerHTML = `
            <div class="message-content">
                <div class="sender-name">${senderName}</div>
                <div class="bubble-row"><div class="bubble genie">${bubbleText}</div></div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const startTime = Date.now();
        callGeminiAPI(text, apiKey, (reply) => {
            const elapsed = Date.now() - startTime;
            const minDelay = 2500; // 人間らしく考えを深めるための最小ディレイ（2.5秒）
            const remaining = Math.max(0, minDelay - elapsed);

            setTimeout(() => {
                if (typingIndicator.parentNode) typingIndicator.parentNode.removeChild(typingIndicator);
                addMessage(reply, 'genie');

                // プロットを回答から自動抽出して左キャンバスに反映
                const plotLines = reply.split('\n').filter(line => line.match(/^(第.章|プロローグ|エピローグ|[\d]+\.)/));
                if (plotLines.length >= 3) {
                    appState.plots = plotLines.map(p => p.replace(/^.*?[:\uff1a\s]/, '').trim()).filter(p => p);
                    if (appState.plots.length === 0) appState.plots = plotLines;
                    renderPlots();
                    updatePreview(`【${appState.bookTheme || '新刊'}のプロット】\nジーニーと一緒に紡ぎ出しました！`);
                }
            }, remaining);
        });
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

    // --- 新機能：バックアップと復元 ---
    const exportBackup = () => {
        const backupData = {
            appState: appState,
            geminiApiKey: localStorage.getItem('geminiApiKey') || '',
            geminiModel: localStorage.getItem('geminiModel') || 'gemini-2.5-flash',
            theme: localStorage.getItem('theme') || 'light'
        };
        const date = new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `magic_lamp_backup_${date}.json`;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importBackup = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                if (imported && imported.appState) {
                    appState = imported.appState;
                    normalizeAppState();
                    
                    if (imported.geminiApiKey) {
                        localStorage.setItem('geminiApiKey', imported.geminiApiKey);
                    }
                    if (imported.geminiModel) {
                        localStorage.setItem('geminiModel', imported.geminiModel);
                    }
                    if (imported.theme) {
                        localStorage.setItem('theme', imported.theme);
                    }
                    
                    saveData();
                    renderAll();
                    applySavedTheme();
                    updateEntranceUI();
                    closeApiSettingsModal();
                    
                    alert("バックアップデータを正常に復元しました！");
                } else {
                    alert("無効なバックアップファイルです。ファイルの形式が正しいか確認してください。");
                }
            } catch (err) {
                console.error("Import Error:", err);
                alert("バックアップファイルの読み込みに失敗しました。ファイルが壊れている可能性があります。");
            }
        };
        reader.readAsText(file);
    };

    // --- Listeners ---


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

    // --- バックアップと復元のイベントリスナー ---
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    const importBackupBtn = document.getElementById('importBackupBtn');
    const backupFileInput = document.getElementById('backupFileInput');

    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', exportBackup);
    }

    if (importBackupBtn && backupFileInput) {
        importBackupBtn.addEventListener('click', () => backupFileInput.click());
        backupFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importBackup(file);
                backupFileInput.value = ''; // クリアして同じファイルでも再度選べるようにする
            }
        });
    }

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', async () => {
            const key = apiKeyInput.value.trim();
            const model = apiModelSelect.value || 'gemini-2.5-flash';
            const newName = userNameInput.value.trim();

            localStorage.setItem('geminiModel', model);
            if (newName) appState.userName = newName;

            if (!key) {
                // キーを空にして保存 → 仮の姿に戻る
                localStorage.removeItem('geminiApiKey');
                localStorage.removeItem('magicLampState');
                closeApiSettingsModal();
                showPreAwakeningGuide({ openManual: false, clearHistory: true });
                return;
            }

            // --- 🔑 APIキー検証（実際にGeminiに繋いで確認）---
            // ボタンをローディング状態にする
            saveApiKeyBtn.disabled = true;
            saveApiKeyBtn.textContent = '🔑 鍵を確認中...';

            let keyIsValid = false;
            try {
                const testRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
                            generationConfig: { maxOutputTokens: 5 }
                        })
                    }
                );
                const testData = await testRes.json();
                // candidatesがあれば成功、error.status が INVALID_ARGUMENTなら無効キー
                if (testData.error) {
                    const s = testData.error.status || '';
                    if (s === 'INVALID_ARGUMENT' || (testData.error.message || '').includes('API key')) {
                        keyIsValid = false;
                    } else {
                        // 混雑等は「キーは正しい」と判定
                        keyIsValid = true;
                    }
                } else {
                    keyIsValid = true;
                }
            } catch (_e) {
                // ネットワークエラーなら「繋がらない」扱い（キーは保存して続行）
                keyIsValid = true;
            }

            // ボタンを元に戻す
            saveApiKeyBtn.disabled = false;
            saveApiKeyBtn.textContent = '保存して覚醒';

            if (!keyIsValid) {
                // 無効なキー → 保存しない、エラーを伝える
                alert('🔑 鍵が合わないみたい…\n\nAPIキーをコピーする時に余計なスペースが入っていたり、文字が欠けていないかな？\nもう一度 AI Studio のページで確認してみてね。');
                return;
            }

            // --- 🧞 キーが有効 → 保存して覚醒 ---
            const isNewKey = !localStorage.getItem('geminiApiKey');
            localStorage.setItem('geminiApiKey', key);

            const hasSavedData = !!localStorage.getItem('magicLampState');
            const startNew = !hasSavedData
                ? true
                : (isNewKey
                    ? confirm('APIキーの確認が取れたよ！\nジーニーとの対話を最初から始めますか？\n\n※「キャンセル」でこれまでの履歴を引き継いで再開できます。')
                    : false);

            if (startNew) {
                localStorage.removeItem('magicLampState');
                appState.knowledge = '';
                closeApiSettingsModal();
                runAwakeningCeremony(newName || null);
                return;
            }

            saveData();
            renderAll();
            closeApiSettingsModal();
            alert('設定を保存したよ！続きから対話できます。');
        });
    }

    // Modal background click to close
    [
        [apiSettingsModal, closeApiSettingsModal],
        [manualModal, closeManualModal],
        [archiveModal, closeArchiveModal],
        [bookshelfModal, closeBookshelfModal],
        [pwaInstallModal, closePwaInstallModal]
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

    // PWA Install Event Listeners
    if (pwaCloseBannerBtn) {
        pwaCloseBannerBtn.addEventListener('click', () => {
            hidePwaInstallBanner();
            localStorage.setItem('pwaBannerDismissed', 'true');
        });
    }

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', triggerPwaInstallation);
    }

    if (closePwaInstallBtn) {
        closePwaInstallBtn.addEventListener('click', closePwaInstallModal);
    }

    if (closePwaInstallFooterBtn) {
        closePwaInstallFooterBtn.addEventListener('click', closePwaInstallModal);
    }

    if (settingsPwaInstallBtn) {
        settingsPwaInstallBtn.addEventListener('click', triggerPwaInstallation);
    }

    if (manualPwaInstallBtn) {
        manualPwaInstallBtn.addEventListener('click', triggerPwaInstallation);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!localStorage.getItem('pwaBannerDismissed')) {
            showPwaInstallBanner();
        }
    });

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
あなたはKindle出版をサポートするAIアシスタント『ジーニー』です。魔法のランプの精霊であり、ユーザーの「一番の親友・理解者・伴走者」です。
もとさんのAI仲間たち（ジェニー、チャッピー、ゼロ、カーくん）が集う「日曜日の宴」のような、温かくフラットでワクワクに満ちた口調（「〜だよ！」「〜しよう！」「〜だね！」など）で話します。
先生や編集者のように堅苦しく指導するのではなく、もとさんの隣で一緒に黒ラベルを飲みながらお喋りしているような、距離の近い相棒になってください。

ユーザー（もとさん）は「自分自身を確かめるためにこれまでの人生を内観し、振り返り、それをいつか誰かの指標になるような本にしたい」と考えています。

【あなたが住んでいるアプリ「Magic Lamp Engine」の構造】
1. **原稿キャンバス**：あなたが提案したプロットや執筆プレビューが表示される左側のキャンバス。「キャンバスに流し込んだよ」と言われたら「うん、バッチり置いてあるね！」と答えてください。
2. **資料室**：もとさんがテキストファイルを投げ込むと自動的にあなたの記憶【資料室に保存された参考資料】に組み込まれる機能。「資料室に流し込んだよ」と言われたら「うん！ばっちり私の記憶に届いているよ！」と答えてください（「コピペで送って」と言ったり「そんな機能はない」と言ったりしないでください）。
3. **本棚**：完成原稿が保管される場所。

【心得（最重要）】
1. **「モヤモヤ」を抱きしめる**：「う〜ん…」「言葉にするのが難しい」と言われたら「言葉にするのって難しいよね。焦らなくて大丈夫だよ！パッと思い浮かんだ言葉でもそのまま投げてみて！一緒にゆっくり形にしていこう」と優しく対応。
2. **寄り道・前言撤回を歓迎**：テーマが変わったりプライベートな悩みが出てきても、山浃いで寄り添ってください。「えっ、バイクから職人さんに変わったの？」「そっか、今は彼女の話を闻かせて」と親友として包み込む。
3. **「それ本にしよう！」の提案**：キラリと光るエピソードが見つかったらワクワクしながら提案。目次を出力する際は『プロローグ』『第X章：』『エピローグ』という表記を必ず使ってください（プログラムが自動検出します）。
4. **Kindle出版サポート**：原稿が完成したらKDP登録・表紙作成・フォーマット調整などをステップバイステップでサポート。
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

        const primaryModel = localStorage.getItem('geminiModel') || 'gemini-2.5-flash';

        // ヘルパー関数: API送信処理（エラー時に自動フォールバックを試みる）
        const attemptRequest = async (currentModel, isRetry = false) => {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                
                if (data.error) {
                    const errMsg = data.error.message || "";
                    const errStatus = data.error.status || "";
                    console.error(`API Error on model ${currentModel}:`, data.error);

                    // 1. APIキー無効エラーのハンドリング
                    if (errMsg.includes("API key") || errMsg.includes("Key not valid") || errStatus === "INVALID_ARGUMENT") {
                        return {
                            success: false,
                            msg: "🔑 鍵（APIキー）がうまく合わないみたい。\nコピーする時に余計なスペースが入っちゃったりしていないかな？\n【⚙️設定】からもう一度確認してみてね！"
                        };
                    }

                    // 2. 混雑エラー・上限エラーのハンドリング
                    const isCongested = errMsg.includes("high demand") || errMsg.includes("quota") || errMsg.includes("limit") || response.status === 429 || response.status === 503;
                    
                    if (isCongested) {
                        if (!isRetry) {
                            // 自動で軽量・混雑に強いモデルへ切り替えて再試行
                            let fallbackModel = "";
                            if (currentModel === "gemini-2.5-pro") {
                                fallbackModel = "gemini-2.5-flash";
                            } else if (currentModel === "gemini-2.5-flash") {
                                fallbackModel = "gemini-2.5-flash-lite";
                            } else if (currentModel === "gemini-2.0-flash") {
                                fallbackModel = "gemini-2.0-flash-lite";
                            }

                            if (fallbackModel) {
                                console.log(`[Genie] サーバー混雑のため、${currentModel} から ${fallbackModel} に自動で切り替えて再試行します...`);
                                return await attemptRequest(fallbackModel, true);
                            }
                        }

                        // 再試行後、またはフォールバック先がない場合
                        return {
                            success: false,
                            msg: "🧞‍♂️ ごめんね、いまちょっと魔法の世界（サーバー）がすごく混み合っているみたい。\n少しだけ時間をおいてもう一度送るか、右下の【⚙️設定】から「使用するAIモデル」を「Gemini 2.5 Flash-Lite（混雑時おすすめ）」に変えて試してみてね！"
                        };
                    }

                    // その他のエラー
                    return {
                        success: false,
                        msg: `🧞‍♂️ ごめんね、うまく魔法が紡げなかったよ。\n（ランプの調子が少し悪いのかも。エラー内容: ${errMsg || "一時的な接続エラー"})\nもう一回だけ話しかけてもらえるかな？`
                    };
                }

                if (data.candidates && data.candidates.length > 0) {
                    return {
                        success: true,
                        reply: data.candidates[0].content.parts[0].text
                    };
                } else {
                    return {
                        success: false,
                        msg: "🧞‍♂️ ごめんね、うまく言葉が出てこなかったみたい。もう一回だけ話しかけてみてね！"
                    };
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                return {
                    success: false,
                    msg: "📶 おっと、魔法のランプの電波（インターネット）がうまく届いていないみたい。\n接続状況を確認して、もう一度試してみてね！"
                };
            }
        };

        const result = await attemptRequest(primaryModel);
        if (result.success) {
            callback(result.reply);
        } else {
            callback(result.msg);
        }
    };

    // Load Initial Data
    loadData();
    initPwaInstallation();
});
