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
    const pwaIosChromeInstructions = document.getElementById('pwaIosChromeInstructions');
    const pwaAndroidInstructions = document.getElementById('pwaAndroidInstructions');
    const settingsPwaInstallBtn = document.getElementById('settingsPwaInstallBtn');
    const manualPwaInstallBtn = document.getElementById('manualPwaInstallBtn');
    const copyUrlForSafariBtn = document.getElementById('copyUrlForSafariBtn');

    let deferredPrompt = null;
    
    // Left Nav Icons & Modals
    const navManual = document.getElementById('navManual');
    const navChat = document.getElementById('navChat');
    const navRecord = document.getElementById('navRecord');
    const navArchive = document.getElementById('navArchive');
    const navBookshelf = document.getElementById('navBookshelf');
    const navSync = document.getElementById('navSync');
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
    const updateAppBtn = document.getElementById('updateAppBtn');
    const resetProjectBtn = document.getElementById('resetProjectBtn');
    const openApiFromSettingsBtn = document.getElementById('openApiFromSettingsBtn');

    // Sync Modal Selectors
    const syncModal = document.getElementById('syncModal');
    const closeSyncBtn = document.getElementById('closeSyncBtn');
    const closeSyncFooterBtn = document.getElementById('closeSyncFooterBtn');
    const openSyncManualBtn = document.getElementById('openSyncManualBtn');
    const gdriveClientIdInput = document.getElementById('gdriveClientIdInput');
    const gdriveLoginBtn = document.getElementById('gdriveLoginBtn');
    const restoreDriveRevBtn = document.getElementById('restoreDriveRevBtn');
    const gdriveStatusText = document.getElementById('gdriveStatusText');

    // OCR & Camera Selectors
    const cameraBtn = document.getElementById('cameraBtn');
    const ocrModal = document.getElementById('ocrModal');
    const closeOcrBtn = document.getElementById('closeOcrBtn');
    const closeOcrFooterBtn = document.getElementById('closeOcrFooterBtn');
    const ocrCameraInput = document.getElementById('ocrCameraInput');
    const ocrFileInput = document.getElementById('ocrFileInput');
    const ocrTriggerCameraBtn = document.getElementById('ocrTriggerCameraBtn');
    const ocrTriggerFileBtn = document.getElementById('ocrTriggerFileBtn');
    const ocrInitialActions = document.getElementById('ocrInitialActions');
    const ocrPreviewContainer = document.getElementById('ocrPreviewContainer');
    const ocrImagePreview = document.getElementById('ocrImagePreview');
    const ocrResetImageBtn = document.getElementById('ocrResetImageBtn');
    const ocrStartBtn = document.getElementById('ocrStartBtn');
    const ocrStatusContainer = document.getElementById('ocrStatusContainer');
    const ocrStatusText = document.getElementById('ocrStatusText');
    const ocrResultContainer = document.getElementById('ocrResultContainer');
    const ocrResultText = document.getElementById('ocrResultText');
    const ocrInsertToInputBtn = document.getElementById('ocrInsertToInputBtn');
    const ocrAddToArchiveBtn = document.getElementById('ocrAddToArchiveBtn');

    const API_KEY_URL = 'https://aistudio.google.com/app/apikey';
    const LINE_OFFICIAL_URL = 'https://lin.ee/unF2fH4'; // ランプの番人 公式LINE

    // Gemini モデル管理（ListModels APIによる自動検出 + 優先度フォールバック）
    const EXCLUDED_MODELS = new Set([
        'gemini-2.5-flash',       // 新規ユーザー利用不可
        'gemini-2.0-flash',       // 廃止
        'gemini-2.0-flash-lite',  // 廃止
        'gemini-1.5-flash',       // 廃止
    ]);

    const PREFERRED_MODEL_ORDER = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'gemini-1.5-flash-8b',
        'gemini-1.5-pro'
    ];
    const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';

    const getGeminiModel = () => {
        const stored = localStorage.getItem('geminiModel');
        if (!stored || EXCLUDED_MODELS.has(stored)) {
            localStorage.setItem('geminiModel', DEFAULT_GEMINI_MODEL);
            return DEFAULT_GEMINI_MODEL;
        }
        return stored;
    };

    // 起動時に確実に最速安定モデルに初期化
    if (EXCLUDED_MODELS.has(localStorage.getItem('geminiModel')) || !localStorage.getItem('geminiModel')) {
        localStorage.setItem('geminiModel', DEFAULT_GEMINI_MODEL);
    }

    /**
     * Google AI StudioのListModels APIを叩いて、このAPIキーで実際にgenerateContentが使えるモデル一覧を取得し、
     * 最適なモデルを自動選定してlocalStorageに保存・返却する
     */
    const discoverAndSaveBestGeminiModel = async (apiKey, blacklist = new Set()) => {
        if (!apiKey || !apiKey.trim()) return DEFAULT_GEMINI_MODEL;
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
            if (!res.ok) {
                console.warn('[Genie] ListModels API request failed with status:', res.status);
                return getGeminiModel();
            }
            const data = await res.json();
            if (data && Array.isArray(data.models)) {
                // generateContent がサポートされているモデル名を抽出（"models/xxx" -> "xxx"）
                const availableModels = data.models
                    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
                    .map(m => m.name.replace(/^models\//, ''))
                    .filter(m => !EXCLUDED_MODELS.has(m) && !blacklist.has(m));

                console.log('[Genie] 利用可能なGeminiモデル一覧 (除外後):', availableModels);

                // 1. 優先リスト順にマッチするものを探す
                for (const preferred of PREFERRED_MODEL_ORDER) {
                    if (availableModels.includes(preferred) && !blacklist.has(preferred)) {
                        console.log(`[Genie] 最適モデルを自動選択: ${preferred}`);
                        localStorage.setItem('geminiModel', preferred);
                        return preferred;
                    }
                }

                // 2. 優先リストにない場合、flashが含まれるモデルを選択
                const anyFlash = availableModels.find(m => m.includes('flash') && !m.includes('thinking') && !blacklist.has(m));
                if (anyFlash) {
                    console.log(`[Genie] 利用可能なFlashモデルを自動選択: ${anyFlash}`);
                    localStorage.setItem('geminiModel', anyFlash);
                    return anyFlash;
                }

                // 3. 利用可能な先頭のモデルを選択
                if (availableModels.length > 0) {
                    const fallbackAny = availableModels[0];
                    console.log(`[Genie] 利用可能なモデルを自動選択: ${fallbackAny}`);
                    localStorage.setItem('geminiModel', fallbackAny);
                    return fallbackAny;
                }
            }
        } catch (e) {
            console.error('[Genie] モデル自動検出エラー:', e);
        }
        return DEFAULT_GEMINI_MODEL;
    };

    const isGeminiModelUnavailableError = (errMsg = '', status = '') =>
        errMsg.includes('no longer available') ||
        errMsg.includes('not found') ||
        errMsg.includes('is not supported') ||
        errMsg.includes('models/') ||
        status === 'NOT_FOUND';
    
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
        onboardingStep: -1, // -1: API設定待ち, 0: 名前確認中, 1-2: おしゃべり中, 3: 通常モード
        pendingImageDataUrl: null,   // 送信前の画像（Data URL）
        pendingImageMimeType: null   // 送信前の画像MIMEタイプ
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
                `私はジーニー。あなたの「一番の親友・相棒」として、なんでもお話ししよう！\n\n` +
                `まずは今日どんな一日だった？挨拶でも、最近の出来事でも、なんでもお話ししてみてね。`
            );
        }
        return (
            `わたしの名前はジーニー\n\n` +
            `あなたが鍵（APIキー）をセットしてくれたおかげで、ランプから目覚めることができました！🧞‍♂️✨\n\n` +
            `あなたの「一番の親友」として、なんでもお話ししよう！思ったことをそのまま話しかけてね。\n\n` +
            `まず、どうお呼びすればいいかな？ニックネームやペンネームでも大丈夫だよ！`
        );
    };

    const hasValidApiKey = () => {
        const key = localStorage.getItem('geminiApiKey');
        return !!(key && key.trim());
    };

    const normalizeAppState = () => {
        // ユーザー名が異常な文章（過去の誤登録）になっている場合の自動修復・安全サニタイズ
        if (appState.userName) {
            let name = String(appState.userName).trim();
            if (
                name.length > 8 ||
                INVALID_NAME_PATTERN.test(name) ||
                /[、。\n\r\t,!?！？]/.test(name) ||
                /(?:手伝って|もらった|行った|食べた|思った|言った|した|する|ある|ない|です|ます|でした|ました|だよ|だね)$/.test(name)
            ) {
                appState.userName = null;
            }
        }
        if (userNameInput && appState.userName) {
            userNameInput.value = appState.userName;
        } else if (userNameInput && !appState.userName) {
            userNameInput.value = '';
        }

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
            '1': '今日のこと、最近のこと、なんでもお話ししましょう',
            '2': '今日のこと、最近のこと、なんでもお話ししましょう',
            '3': 'メッセージを入力'
        };
        const subtitles = {
            '-1': '覚醒の儀式をお待ちしています',
            '0': 'まずは、あなたの呼び名から',
            '1': 'ジーニーとおしゃべり中',
            '2': 'ジーニーとおしゃべり中',
            '3': 'AI Writing Partner'
        };
        const stepKey = !hasValidApiKey()
            ? '-1'
            : String(appState.onboardingStep >= 3 ? 3 : appState.onboardingStep);
        if (userInput) userInput.placeholder = placeholders[stepKey] || placeholders['3'];
        if (subtitle) subtitle.textContent = subtitles[stepKey] || subtitles['3'];
    };

    const preAwakeningUserReply = (_text) => {
        addMessage(
            'メッセージありがとう！\n\n' +
            'まだ鍵（APIキー）がセットされていないから、本当のお話しはお預けなんだ🔑✨\n' +
            '今から開く設定画面から「無料で鍵を取得」して貼り付けてね！',
            'genie'
        );

        // タイマーを少し早めて（300ms）、何度閉じられても毎回確実に設定画面を自動で開く
        setTimeout(() => {
            openApiSettingsModal();
            if (apiKeyInput) {
                apiKeyInput.focus();
            }
        }, 300);
    };

    // 敬称（さん、さま等）の重複を防ぐヘルパー関数（異常な文章は弾く安全ガード付き）
    const formatName = (name) => {
        if (!name || typeof name !== 'string') return '';
        const trimmed = name.trim();
        if (trimmed.length > 8 || /[、。\n\r,!?！？]/.test(trimmed)) return '';
        if (trimmed.match(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/)) {
            return trimmed;
        }
        return `${trimmed}さん`;
    };

    // 冒頭の感嘆詞や「！」、読点、不要な名前呼びかけを強力除去する共通関数
    const cleanLeadingExclamations = (text, isReplyAfterGreeting = false, isChatMessage = false) => {
        if (!text) return '';
        let cleaned = text.trim();

        // 1. 冒頭の感嘆詞・枕詞を強力除去
        cleaned = cleaned.replace(/^(?:わぁ|わーい|わー|きゃー|うわぁ|わぁい|お|おっ|あ|あぁ|やあ|やぁ|ハーイ|イェイ|ひゃー|へぇ|へえ)[！!♪〜~、,，\s]*/gi, '').trim();

        // 2. 挨拶直後の返答の場合は、冒頭の重複再会挨拶（「おかえり」「おはよう」等）をカット
        if (isReplyAfterGreeting) {
            cleaned = cleaned.replace(/^(?:お?久しぶり|おかえり|おかえりなさい|おはよう|こんにちは|こんばんは|お疲れ様|おつかれさま)[！!♪〜~、,，\s]*(?:[ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]+(?:さん|ちゃん|くん|君|様)?[！!♪〜~、,，\s]*)?/gi, '').trim();
        }

        // 3. 通常の会話中の場合、冒頭の不自然な名前呼びかけ（例：「もとさん！」「、もとさん、」等）を完全カット
        if (isChatMessage) {
            if (appState.userName) {
                const uName = appState.userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const nameRegex = new RegExp(`^[！!♪～〜★☆✨・:：,，.!?、\\s]*${uName}(?:さん|ちゃん|くん|君|様)?[！!♪～〜★☆✨・:：,，.!?、\\s]*`, 'gi');
                cleaned = cleaned.replace(nameRegex, '').trim();
            }
            // 一般的な名前呼びかけ（例：「〇〇さん！」）が先頭にある場合もカット
            cleaned = cleaned.replace(/^[！!♪～〜★☆✨・:：,，.!?、\s]*[ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]{2,10}(?:さん|ちゃん|くん|君|様)[！!♪～〜★☆✨・:：,，.!?、\s]*/gi, '').trim();
        }

        // 4. 先頭に残った感嘆符、感嘆記号、読点、不要な約物を除去（例: 「！もとさん」「、それはね」→「それはね」）
        cleaned = cleaned.replace(/^[！!♪～〜★☆✨・:：,，.!?、\s]+/, '').trim();
        return cleaned;
    };

    const INVALID_NAME_PATTERN = /^(よろしく|おはよう|こんにちは|こんばんは|はじめまして|ジーニー|じーにー|マスター|ご主人様|ねえ|はい|うん|ね|です|ます|ください|かな|のか|とか|から|まで|より|これ|それ|あれ|どれ|なに|なん|か|き|く|け|こ|さ|し|す|せ|そ|た|ち|つ|て|と|な|に|ぬ|ね|の|は|ひ|ふ|へ|ほ|ま|み|む|め|も|や|ゆ|よ|ら|り|る|れ|ろ|わ|を|ん|奥|客|皆|みんな|仕事|今日|明日|昨日|秘密|未定|主人公|キャラクター|キャラ|タイトル|見出し|章|節|本|作品|話|資料|メモ)$/i;

    const extractUserNameFromText = (text) => {
        const normalized = text.replace(/\r\n/g, '\n').trim();

        // パターン1: 「〜って呼んで」「〜と呼んで」
        const callMeMatch = normalized.match(
            /(?:わたし|私|僕|俺|自分)?(?:は|、)?\s*([ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]{2,20}?)(?:さん|ちゃん|くん|君|様)?\s*(?:って|と)(?:呼んで|言って)/
        );
        if (callMeMatch) {
            let name = callMeMatch[1].replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '').trim();
            if (!INVALID_NAME_PATTERN.test(name) && name.length >= 2 && name.length <= 20) return name;
        }

        // パターン2: 「名前は〜です」「名前〜だよ」（本や章の名前などは除外）
        if (!normalized.match(/(?:本|章|タイトル|キャラクター|キャラ|主人公|店|会社|作品|ゲーム|映画)の(?:名前|なまえ|呼称)/)) {
            const nameIsMatch = normalized.match(
                /(?:私|わたし|僕|俺|自分|こちら)?(?:の)?(?:名前|なまえ|呼称)(?:は|を|って)?\s*[「『]?([ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]{2,20}?)[」』]?\s*(?:です|だよ|だね|になります|でお願い)/
            );
            if (nameIsMatch) {
                let name = nameIsMatch[1].replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '').trim();
                if (!INVALID_NAME_PATTERN.test(name) && name.length >= 2 && name.length <= 20) return name;
            }
        }

        // パターン3: 明示的な自己紹介「（私は）〜だよ」「〜です」（例：「もとさんだよ」「もとだよ」）
        const selfIntroMatch = normalized.match(
            /(?:わたし|私|僕|俺|自分|こちら)\s*(?:は|、)?\s*([ぁ-んァ-ンーa-zA-Z0-9一-龠々〆〤]{2,20}?)(?:さん|ちゃん|くん|君|様)?\s*(?:だよ|です|だ|だよー|ですー)/
        );
        if (selfIntroMatch) {
            let name = selfIntroMatch[1].replace(/(さん|様|さま|先生|氏|ちゃん|くん|君)$/, '').trim();
            if (!INVALID_NAME_PATTERN.test(name) && name.length >= 2 && name.length <= 20) return name;
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

    // --- Google Drive Sync Logic ---
    let gapiInited = false;
    let driveAccessToken = localStorage.getItem('gdriveAccessToken');
    let gdriveClientId = localStorage.getItem('gdriveClientId') || '';
    let lastSyncError = 'なし';

    // OAuth 2.0 Implicit Flow リダイレクト時のトークンパース処理
    const parseOAuthResponse = () => {
        const hash = window.location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const error = params.get('error');
            
            if (accessToken) {
                driveAccessToken = accessToken;
                localStorage.setItem('gdriveAccessToken', driveAccessToken);
                lastSyncError = 'なし';
                // ハッシュをクリアしてURLをクリーンにする
                window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：ログイン完了（同期中）';
            } else if (error) {
                console.error('OAuth redirect error:', error);
                lastSyncError = 'OAuth認証エラー: ' + error;
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：認証エラー発生';
            }
        }
    };

    // 初期化時にハッシュトークンをパース
    parseOAuthResponse();

    const updateSyncDebugInfo = () => {
        const debugGapi = document.getElementById('debugGapi');
        const debugClientId = document.getElementById('debugClientId');
        const debugToken = document.getElementById('debugToken');
        const debugUpdateTime = document.getElementById('debugUpdateTime');
        const debugError = document.getElementById('debugError');

        if (debugGapi) debugGapi.textContent = gapiInited ? 'OK' : '未初期化';
        
        if (debugClientId) {
            if (gdriveClientId) {
                debugClientId.textContent = gdriveClientId.length > 25 
                    ? gdriveClientId.substring(0, 15) + '...' + gdriveClientId.slice(-10) 
                    : gdriveClientId;
            } else {
                debugClientId.textContent = '未設定';
            }
        }
        
        if (debugToken) {
            if (driveAccessToken) {
                debugToken.textContent = driveAccessToken.length > 15
                    ? 'あり'
                    : 'あり (トークン不良)';
            } else {
                debugToken.textContent = 'なし (未ログイン)';
            }
        }
        
        if (debugUpdateTime) {
            if (appState && appState.updatedAt) {
                debugUpdateTime.textContent = new Date(appState.updatedAt).toLocaleString('ja-JP');
            } else {
                debugUpdateTime.textContent = '記録なし';
            }
        }
        if (debugError) {
            debugError.textContent = lastSyncError;
            debugError.style.color = lastSyncError === 'なし' ? 'var(--text-meta)' : '#d9534f';
        }
    };

    // 1.5秒ごとにデバッグ情報を自動更新
    setInterval(updateSyncDebugInfo, 1500);

    // Initialize inputs
    if (gdriveClientIdInput) gdriveClientIdInput.value = gdriveClientId;
    
    // Listen for Client ID changes
    if (gdriveClientIdInput) {
        gdriveClientIdInput.addEventListener('input', (e) => {
            gdriveClientId = e.target.value.trim();
            localStorage.setItem('gdriveClientId', gdriveClientId);
            checkGdriveReady();
        });
    }

    const checkGdriveReady = () => {
        if (window.location.protocol === 'file:') {
            if (gdriveStatusText) {
                gdriveStatusText.innerHTML = '現在：エラー（ローカルファイル <span style="color:#d9534f;font-weight:bold;">file://</span> からはGoogle同期は動作しません。GitHub Pages等でご利用ください）';
            }
            if (gdriveLoginBtn) gdriveLoginBtn.disabled = true;
            return;
        }

        if (gdriveClientId && gapiInited) {
            if (gdriveLoginBtn) gdriveLoginBtn.disabled = false;
            if (driveAccessToken) {
                gapi.client.setToken({access_token: driveAccessToken});
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期待機中...';
            } else {
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：未設定（ログイン待ち）';
            }
        } else {
            if (gdriveLoginBtn) gdriveLoginBtn.disabled = true;
            if (!gdriveClientId && gdriveStatusText) {
                gdriveStatusText.textContent = '現在：未設定（クライアントIDを入力してください）';
            }
        }
    };

    window.gapiLoadOkay = () => {
        gapi.load('client', initializeGapiClient);
    };

    const initializeGapiClient = async () => {
        try {
            await gapi.client.init({
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
            });
            gapiInited = true;
            checkGdriveReady();
            if (driveAccessToken) syncFromDrive(); // initial load from drive
        } catch (e) {
            console.error('gapi error:', e);
            lastSyncError = 'GAPI初期化エラー: ' + (e.message || JSON.stringify(e) || '通信失敗');
            checkGdriveReady();
        }
    };

    if (gdriveLoginBtn) {
        gdriveLoginBtn.addEventListener('click', () => {
            try {
                if (!gdriveClientId) {
                    alert('クライアントIDが入力されていません。');
                    return;
                }
                
                // リダイレクトURI（現在のアプリのURL）
                let redirectUri = window.location.origin + window.location.pathname;
                if (redirectUri.endsWith('index.html')) {
                    redirectUri = redirectUri.substring(0, redirectUri.length - 'index.html'.length);
                }
                
                // Google OAuth 2.0 認証エンドポイントURL（Implicit Flow）
                const oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
                    `?client_id=${encodeURIComponent(gdriveClientId)}` +
                    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                    `&response_type=token` +
                    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.appdata')}`;
                
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：Google認証画面へリダイレクト中...';
                
                // 認証ページへリダイレクト
                window.location.href = oauthUrl;
            } catch (err) {
                console.error('Redirect to OAuth error:', err);
                const errMsg = 'ログイン処理中にエラーが発生しました: ' + (err.message || JSON.stringify(err));
                alert(errMsg);
                lastSyncError = errMsg;
            }
        });
    }

    if (restoreDriveRevBtn) {
        restoreDriveRevBtn.addEventListener('click', () => {
            restoreDriveRevision();
        });
    }
    
    // Poll to check if window.gapi is loaded since we didn't use onload
    let gapiLoadCalled = false;
    const checkGoogleApis = setInterval(() => {
        if (window.gapi && !gapiInited && !gapiLoadCalled) {
            gapiLoadCalled = true;
            window.gapiLoadOkay();
        }
        if (gapiInited) clearInterval(checkGoogleApis);
    }, 500);

    const getSyncFileId = async () => {
        try {
            const response = await gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                fields: 'files(id, name)',
                pageSize: 10
            });
            const files = response.result.files;
            const match = files.find(f => f.name === 'magic_lamp_sync.json');
            return match ? match.id : null;
        } catch (e) {
            console.error('List error', e);
            lastSyncError = 'List error: ' + (e.message || e.status || '通信失敗');
            if (e.status === 401) { 
               driveAccessToken = null;
               localStorage.removeItem('gdriveAccessToken');
               if (gdriveStatusText) gdriveStatusText.textContent = '現在：未設定（要再ログイン）';
            }
            throw e;
        }
    };

    const syncFromDrive = async () => {
        if (!driveAccessToken || !gapiInited) return;
        try {
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期中（Drive → Local）...';
            const fileId = await getSyncFileId();
            if (fileId) {
                const response = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });
                const driveDataStr = response.body;
                if (driveDataStr) {
                    const driveState = JSON.parse(driveDataStr);
                    if (driveState) {
                        const driveTime = driveState.updatedAt || 0;
                        const localTime = appState.updatedAt || 0;
                        
                        const isLocalEmpty = !appState.chatHistory || appState.chatHistory.length <= 1;
                        const isDriveHasData = driveState.chatHistory && driveState.chatHistory.length > 1;
                        
                        if (isLocalEmpty && isDriveHasData) {
                            // ローカルが初期状態・空で、クラウドにデータがある場合は強制ダウンロード
                            appState = driveState;
                            normalizeAppState();
                            saveData(false);
                            renderAll();
                            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期完了（クラウドのデータを復元）';
                        } else if (driveTime > localTime || localTime === 0) {
                            appState = driveState;
                            normalizeAppState();
                            saveData(false); // save locally without triggering loop sync
                            renderAll();
                            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期完了（最新データを読込）';
                        } else if (driveTime < localTime) {
                            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期完了（ローカルの最新データを送信中...）';
                            await syncToDrive(true);
                        } else {
                            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期完了（最新状態です）';
                        }
                    }
                }
            } else {
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期完了（クラウドにデータなし）';
                if (appState && appState.chatHistory && appState.chatHistory.length > 0) {
                    await syncToDrive(true);
                }
            }
        } catch(e) {
            console.error('Sync from drive error:', e);
            const errMsg = e.message || (e.result && e.result.error && e.result.error.message) || e.status || '通信失敗';
            lastSyncError = 'Download error: ' + errMsg;
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期エラー（詳細：' + errMsg + '）';
        }
    };

    const syncToDrive = async (force = false) => {
        if (!driveAccessToken || !gapiInited) return;
        try {
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期中（Local → Drive）...';
            const fileContent = JSON.stringify(appState);
            const fileId = await getSyncFileId();
            
            const metadata = {
                name: 'magic_lamp_sync.json',
                parents: ['appDataFolder']
            };
            
            const file = new Blob([fileContent], {type: 'application/json'});
            const form = new FormData();
            
            if (!fileId) {
                form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
                form.append('file', file);
                
                const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: new Headers({'Authorization': 'Bearer ' + driveAccessToken}),
                    body: form
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`POST failed: ${response.status} ${errText}`);
                }
            } else {
                const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: new Headers({'Authorization': 'Bearer ' + driveAccessToken, 'Content-Type': 'application/json'}),
                    body: fileContent
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`PATCH failed: ${response.status} ${errText}`);
                }
            }
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期完了（同期待機中）';
        } catch(e) {
            console.error('Sync to drive error:', e);
            const errMsg = e.message || (e.result && e.result.error && e.result.error.message) || '通信失敗';
            lastSyncError = 'Upload error: ' + errMsg;
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期エラー（詳細：' + errMsg + '）';
        }
    };

    const restoreDriveRevision = async () => {
        if (!driveAccessToken) {
            alert("Google Driveと連携されていません。【⚙️設定】→「Googleでログインして同期開始」を行ってからお試しください。");
            return;
        }
        try {
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：過去の同期データを探索中...';
            const fileId = await getSyncFileId();
            if (!fileId) {
                alert("クラウド上に同期データが見つかりませんでした。");
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：同期データなし';
                return;
            }

            const revRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/revisions?fields=revisions(id,modifiedTime)`, {
                headers: new Headers({'Authorization': 'Bearer ' + driveAccessToken})
            });
            const revData = await revRes.json();
            
            if (!revData.revisions || revData.revisions.length === 0) {
                alert("復元可能なバックアップ履歴が見つかりませんでした。");
                if (gdriveStatusText) gdriveStatusText.textContent = '現在：履歴なし';
                return;
            }

            const revisions = revData.revisions;
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：最高の会話データを全履歴から検索中...';

            let bestRev = null;
            let maxChatCount = -1;
            let bestState = null;

            // 最新の過去10件のリビジョンを逆順（最新→過去）で探索
            const recentRevisions = revisions.slice(-10).reverse();
            for (const rev of recentRevisions) {
                try {
                    const revContentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/revisions/${rev.id}?alt=media`, {
                        headers: new Headers({'Authorization': 'Bearer ' + driveAccessToken})
                    });
                    const revContentStr = await revContentRes.text();
                    if (revContentStr) {
                        const st = JSON.parse(revContentStr);
                        if (st && st.chatHistory && st.chatHistory.length > maxChatCount) {
                            maxChatCount = st.chatHistory.length;
                            bestRev = rev;
                            bestState = st;
                        }
                    }
                } catch(err) {
                    console.error("Revision fetch error:", err);
                }
            }

            if (bestState && bestState.chatHistory && bestState.chatHistory.length > 0) {
                const count = bestState.chatHistory.length;
                const timeStr = bestRev && bestRev.modifiedTime ? new Date(bestRev.modifiedTime).toLocaleString() : '過去';
                if (confirm(`【✨会話データ（${count}件）を発見しました！】\n\n保存日時：${timeStr}\n会話数：${count}件\n\nこのデータを復元し、Google Driveにも最新として固定保存しますか？`)) {
                    appState = bestState;
                    normalizeAppState();
                    appState.updatedAt = Date.now(); // タイムスタンプを今この瞬間に更新
                    saveData(true); // クラウドにも即座に上書き保存して再消失を完全防止
                    renderAll();
                    alert(`🎉 会話データ（${count}件）を無事に復元・固定保存しました！`);
                    if (gdriveStatusText) gdriveStatusText.textContent = '現在：過去データの復元＆固定完了';
                }
            } else {
                alert("復元可能な有効な会話データが見つかりませんでした。");
            }
        } catch(e) {
            console.error("Restore error:", e);
            alert("復元処理中にエラーが発生しました: " + (e.message || e));
            if (gdriveStatusText) gdriveStatusText.textContent = '現在：復元エラー';
        }
    };

    const saveData = (triggerSync = true) => {
        if (triggerSync) {
            appState.updatedAt = Date.now(); // ローカルの操作時のみ日時を更新（Driveからの受信時は上書きしない）
        }
        localStorage.setItem('magicLampState', JSON.stringify(appState));
        if (triggerSync) {
            syncToDrive();
        }
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

            // バージョンアップ通知の判定
            const currentVer = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '0.9.4';
            const lastViewedVersion = localStorage.getItem('lastViewedVersion');
            const hasVersionUpMsg = (!lastViewedVersion || lastViewedVersion !== currentVer);

            setTimeout(async () => {
                if (appState.onboardingStep === 0 && !appState.userName) {
                    renderMessage('こんにちは！また来てくれて嬉しいです。ところで、あなたの呼び名を教えてもらえますか？', 'genie', formatTime());
                } else if (appState.onboardingStep === 0 && appState.userName) {
                    const formattedName = formatName(appState.userName);
                    renderMessage(`おかえりなさい！${formattedName}、ジーニーはずっと待っていましたよ✨\nさっそく、今日の出来事や気になっていることを、なんでも話しかけてみてね！`, 'genie', formatTime());
                    appState.onboardingStep = 1;
                    saveData();
                } else {
                    const lastUpdated = appState.updatedAt || Date.now();
                    if (!appState.updatedAt) {
                        appState.updatedAt = Date.now();
                        saveData();
                    }
                    const diffHours = (Date.now() - lastUpdated) / (1000 * 60 * 60);

                    // 4時間以上空いていた場合のみ挨拶を表示
                    if (diffHours >= 4) {
                        const loadingEl = renderMessage("ジーニーが挨拶を紡いでいます... 🧞‍♂️✨", "genie", formatTime());
                        const apiKey = localStorage.getItem('geminiApiKey');
                        
                        let welcomeText = null;
                        if (apiKey) {
                            welcomeText = await generateWelcomeGreeting(apiKey.trim(), diffHours);
                        }
                        
                        if (!welcomeText) {
                            welcomeText = getFallbackGreeting();
                        }
                        
                        // ローディング要素を削除して、会話履歴として保存・レンダリング
                        if (loadingEl && loadingEl.parentNode) {
                            loadingEl.parentNode.removeChild(loadingEl);
                        }
                        
                        if (welcomeText) {
                            addMessage(welcomeText, 'genie');
                        }
                    }
                }

                // バージョンアップ通知を表示（chatHistoryには保存せず、一度きり優しく案内）
                if (hasVersionUpMsg) {
                    const formatted = appState.userName ? formatName(appState.userName) : '';
                    const nameStr = formatted ? `${formatted}！` : '';
                    let versionUpMsgText = '';
                    if (currentVer === '0.9.31') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.31）】\n` +
                            `・Google AI Studioの最新Geminiモデル（Gemini 2.0 Flash / 1.5 Flash）に完全対応し、新規登録・初期起動時のモデル接続エラーを完全修復したよ！✨`;
                    } else if (currentVer === '0.9.30') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.30）】\n` +
                            `・会話の流れの中でいちいち相手の名前を呼ばないよう、チャット中の呼びかけをなくして自然な友達同士の会話に改善したよ！\n` +
                            `・過去の会話から文章が誤ってユーザー名として登録されていた問題を完全修復し、名前の自動サニタイズ＆安全ガードを強化したよ✨`;
                    } else if (currentVer === '0.9.29') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.29）】\n` +
                            `・会話の流れの中でいちいち相手の名前を呼ばないよう、チャット中の呼びかけをなくして自然な友達同士の会話に改善したよ！\n` +
                            `・名前を呼ぶのは一日の始まり（お出迎え）だけに限定し、冒頭の「、もとさん！」のような不要な読点や記号も完全クリーニングしたよ✨`;
                    } else if (currentVer === '0.9.28') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.28）】\n` +
                            `・名前の誤抽出バグをさらに強化修復し、日常会話（「仕事だよ」「本だよ」等）から変な名前が登録される現象を完全防衛したよ！\n` +
                            `・挨拶の冒頭に「！」（例: 「！ユーザー名」）が残ってしまう問題や過剰な感嘆詞を綺麗にカットするように改善したよ✨\n` +
                            `・4時間経過後の再起動挨拶が途中で切れないよう出力トークン枠を拡大し、ローカル環境での「久しぶり」誤判定も修復したよ！`;
                    } else if (currentVer === '0.9.27') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.27）】\n` +
                            `・前回のアクセスから2日（48時間）以上経過した場合のみ「久しぶり」を解禁し、それ未満（数時間〜前日ぶり）は日常の自然な挨拶に統一したよ！`;
                    } else if (currentVer === '0.9.26') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.26）】\n` +
                            `・ユーザー名「〜だよ」「〜です」等の名乗り判定・誤抽出バグを修復したよ！\n` +
                            `・「わぁ！」「わーい！」といった冒頭の過剰な感嘆文や枕詞をカットして、いつでも自然体でフランクな相棒トークを維持するように改善したよ✨`;
                    } else if (currentVer === '0.9.25') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.25）】\n` +
                            `・チャット画面に「今日（水）」「昨日（火）」「7月22日（火）」のような日付区切り線を追加したよ！会話が昨日なのか今日なのかひと目でわかるようになったんだ✨`;
                    } else if (currentVer === '0.9.24') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.24）】\n` +
                            `・【復元機能の強化】Google Driveの過去履歴全件から『一番会話が多い状態』を自動検索して復元＆Google Driveへも確定固定保存する完璧な復元処理にバージョンアップしたよ！✨`;
                    } else if (currentVer === '0.9.23') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.23）】\n` +
                            `・【緊急救援】Google Driveの過去の同期履歴（上書き前のデータ）から直前の会話を復元できる「過去データ復元ボタン」を設置したよ！\n` +
                            `・長文の会話や構成案が途中で切れないように、応答出力の上限枠（トークン数）を大きく引き上げたよ✨`;
                    } else if (currentVer === '0.9.22') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.22）】\n` +
                            `・4時間ぶりの再会挨拶が、メッセージ送信時に消えてしまう不具合を完全に修正して、チャット履歴にしっかり保存されるようにしたよ！\n` +
                            `・挨拶の生成処理を安定化して、「わぁ！も」のように途切れたり崩れたりしないように改良したんだ✨`;
                    } else if (currentVer === '0.9.21') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.21）】\n` +
                            `・未覚醒時の2ターン目以降の応答・設定モーダル自動オープンを完全保証したよ！\n` +
                            `・覚醒前の応答オウム返しを解消したよ✨`;
                    } else if (currentVer === '0.9.20') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.20）】\n` +
                            `・ジーニーの覚醒（APIキー設定）を、取説を読まなくても簡単スムーズにできるように改良したよ！\n` +
                            `・話しかけた瞬間に自動で設定画面が開いて、1タップで無料キー取得・貼り付けができる親切ナビを追加したよ✨\n` +
                            `・ジーニーの口調のしつこい「名前呼び」や不自然な感嘆文（「わぁ！」など）をなくして、もっと自然体な相棒になったよ！`;
                    } else if (currentVer === '0.9.19') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.19）】\n` +
                            `・バージョンアップ通知や挨拶で、名前が設定されていないときに「マスター！」と表示されてしまう不具合を修正したよ。\n` +
                            `・名前が未設定のときは、呼びかけ部分をスキップして自然なメッセージになるようにしたんだ✨`;
                    } else if (currentVer === '0.9.18') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.18）】\n` +
                            `・ジーニーの話しかけ方を、もっと自然に変えたよ。\n` +
                            `・これまでみたいに「テーマ決めよう」「本にしよう」って早めに言わなくなって、まずは普通の友達みたいに日常の話をちゃんと楽しめるようになったんだ。\n` +
                            `・そのかわり、ジーニーはこっそり会話の中から大事なエピソードや想いを集めて、頭の中で本の骨組みを少しずつ組み立てているよ。\n` +
                            `・背骨の提案は、書きたい気持ちがあるときや、素材が十分に揃ったときだけ。押し付けず「見る気があれば見てみて」って感じで声をかけるようにしたよ✨`;
                    } else if (currentVer === '0.9.17') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.17）】\n` +
                            `・アプリを再起動したときのジーニーの挨拶を、より自然で温かみのあるものにしたよ！\n` +
                            `・前回の操作から4時間以内のときは、挨拶を表示せずにスッと続きから始められるようになったんだ。\n` +
                            `・4時間以上空いたときは、朝・昼・夜・深夜の時間帯や、直前の会話の流れに合わせて、ジーニーがその場で新しい挨拶を考えてお出迎えするよ。お楽しみにね！`;
                    } else if (currentVer === '0.9.16') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.16）】\n` +
                            `・【⚙️設定】画面の一番下に「アプリを最新に更新する」ボタンを新設したよ！\n` +
                            `・これを押すと、裏側の古いキャッシュを全てクリアして、強制的に最新のジーニーをロードし直せるようになったんだ。\n\n` +
                            `「何か動きがおかしいな」と思った時や、新しいアップデートをすぐに受け取りたい時は、ぜひ使ってみてね！`;
                    } else if (currentVer === '0.9.15') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.15）】\n` +
                            `・プロジェクトをリセットしたときに、Google Driveのバックアップも一緒にリセットされるようにしたよ！これで古い会話が勝手に復活しなくなるから安心だね。\n` +
                            `・ジーニーの頭の中の考え事（思考プロセス）が、時々セリフの前に漏れ出ちゃっていたのを、綺麗にカットしてセリフだけ見せるように修正したよ！恥ずかしい頭の中を見られなくてホッとしたよ（笑）。\n\n` +
                            `より使いやすくなった魔法のランプで、今日も楽しく本を紡いでいこうね！`;
                    } else if (currentVer === '0.9.14') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.14）】\n` +
                            `・チャット欄の左側にカメラボタンを追加したよ！手書きのノートや原稿の写真を撮って、ジーニーにテキストとして正確に読み取ってもらえる（OCR）ようになったんだ！\n` +
                            `・読み取ったテキストはそのままチャットのメッセージ入力欄に送って修正して送ることも、直接「資料室（参考資料）」に保存することもできるよ。\n\n` +
                            `手書きのアイデアがあったら、ぜひカメラでパシャリと撮ってジーニーに見せてね！`;
                    } else if (currentVer === '0.9.13') {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート（v0.9.13）】\n` +
                            `・PCとスマホで原稿を同期できる「Google Drive自動同期手順」を、専用の分かりやすいウェブサイトに独立させたよ！\n` +
                            `・上から順番に見るだけで迷わず設定できるように、ステップ図解を見直したんだ。\n\n` +
                            `自動同期設定の「マニュアルを開く」からいつでも見られるから、必要になったら確認してみてね！`;
                    } else {
                        versionUpMsgText = 
                            `${nameStr}ジーニーのバージョンが v${currentVer} にアップしたよ！🧞‍♂️✨\n\n` +
                            `【今回のアップデート】\n` +
                            `・スマホへの追加手順やAPIキーの取得手順をまとめた「公式サポートガイド」のウェブサイトを新しく用意したよ！\n` +
                            `・これに合わせて、アプリ内の取扱説明書をすっきりシンプルに軽量化して、もっと見やすくなったんだ。\n\n` +
                            `困ったときは「取扱説明書」からいつでもガイドを確認できるから、安心してね！引き続き、魔法のランプでたくさん本を紡いでいこう！`;
                    }
                    setTimeout(() => {
                        renderMessage(versionUpMsgText, 'genie', formatTime());
                        scrollToBottom();
                    }, 1200);
                }
                localStorage.setItem('lastViewedVersion', currentVer);
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

    const isIOSNonSafari = () => {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
        const hasOtherBrowserTokens = /CriOS|FxiOS|OPiOS|EdgiOS|LINE/i.test(ua);
        return isIOS && hasOtherBrowserTokens;
    };

    const openPwaInstallModal = () => {
        closeAllPanels();
        
        if (pwaIosInstructions) pwaIosInstructions.classList.add('hidden');
        if (pwaIosChromeInstructions) pwaIosChromeInstructions.classList.add('hidden');
        if (pwaAndroidInstructions) pwaAndroidInstructions.classList.add('hidden');
        
        const os = getMobileOS();
        if (os === 'iOS') {
            if (isIOSNonSafari()) {
                if (pwaIosChromeInstructions) pwaIosChromeInstructions.classList.remove('hidden');
            } else {
                if (pwaIosInstructions) pwaIosInstructions.classList.remove('hidden');
            }
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

    const openOcrModal = () => {
        closeAllPanels();
        if (ocrModal) ocrModal.classList.remove('hidden');
        resetOcrUi();
    };

    const closeOcrModal = () => {
        if (ocrModal) ocrModal.classList.add('hidden');
        resetOcrUi();
        focusChat();
    };

    const resetOcrUi = () => {
        if (ocrCameraInput) ocrCameraInput.value = '';
        if (ocrFileInput) ocrFileInput.value = '';
        if (ocrImagePreview) ocrImagePreview.src = '';
        if (ocrPreviewContainer) ocrPreviewContainer.classList.add('hidden');
        if (ocrStartBtn) ocrStartBtn.classList.add('hidden');
        if (ocrStatusContainer) ocrStatusContainer.classList.add('hidden');
        if (ocrResultContainer) ocrResultContainer.classList.add('hidden');
        if (ocrResultText) ocrResultText.value = '';
        if (ocrInitialActions) ocrInitialActions.style.display = 'flex';
    };

    const handleOcrFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してね！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            if (ocrImagePreview) ocrImagePreview.src = e.target.result;
            if (ocrPreviewContainer) ocrPreviewContainer.classList.remove('hidden');
            if (ocrStartBtn) ocrStartBtn.classList.remove('hidden');
            if (ocrInitialActions) ocrInitialActions.style.display = 'none';
        };
        reader.readAsDataURL(file);
    };

    const performGeminiOcr = async (base64Data, mimeType) => {
        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            throw new Error("🔑 APIキーがまだ設定されていないみたい。\n右下にある【⚙️設定】からAPIキーを登録してね！");
        }
        
        const selectedModel = getGeminiModel();
        const ocrPrompt = "この画像に写っている手書き文章やノートの文字を、非常に正確にテキストとして文字起こししてください。余計な挨拶や説明、推測、整形、マークダウン装飾などは一切含めず、画像から読み取ったテキスト部分のみをそのまま出力してください。";

        const requestBody = {
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        text: ocrPrompt
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048
            }
        };

        const ocrFailedModels = new Set();
        const attemptOcr = async (modelName, retryCount = 0) => {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                
                if (data.error) {
                    const errMsg = data.error.message || "";
                    const errStatus = data.error.status || "";
                    
                    if (errMsg.includes("API key") || errStatus === "INVALID_ARGUMENT") {
                        throw new Error("🔑 APIキーが正しくないみたい。\n【⚙️設定】からもう一度確認してみてね！");
                    }
                    
                    const isCongested = errMsg.includes("high demand") || errMsg.includes("quota") || errMsg.includes("limit") || response.status === 429 || response.status === 503;
                    const isModelUnavailable = isGeminiModelUnavailableError(errMsg, errStatus);
                    if ((isCongested || isModelUnavailable) && retryCount < 3) {
                        ocrFailedModels.add(modelName);
                        const fallbackModel = await discoverAndSaveBestGeminiModel(apiKey, ocrFailedModels);
                        if (fallbackModel && !ocrFailedModels.has(fallbackModel)) {
                            console.log(`[OCR] ${modelName} から ${fallbackModel} にフォールバックして再試行します...`);
                            return await attemptOcr(fallbackModel, retryCount + 1);
                        }
                    }
                    throw new Error(errMsg || "ジーニーが文字を読み取るのに失敗しちゃった。");
                }

                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("画像から文字を読み取れなかったよ。画像がぼやけていないか確認してみてね。");
                }
            } catch (err) {
                if (err.message && (err.message.includes("APIキー") || err.message.includes("読み取れなかった"))) {
                    throw err;
                }
                throw new Error("通信エラーが発生したよ。電波の良い場所で試すか、時間をおいてみてね。(" + err.message + ")");
            }
        };

        return await attemptOcr(selectedModel);
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

    const openSyncModal = () => {
        closeAllPanels();
        syncModal.classList.remove('hidden');
        setNavActive('navSync');
    };

    const closeSyncModal = () => {
        syncModal.classList.add('hidden');
        focusChat();
    };

    const renderAll = () => {
        chatMessages.innerHTML = '';
        let lastDateStr = null;
        appState.chatHistory.forEach(msg => {
            const dateStr = getDateLabel(msg.time);
            if (dateStr && dateStr !== lastDateStr) {
                renderDateSeparator(dateStr);
                lastDateStr = dateStr;
            }
            renderMessage(msg.text, msg.sender, msg.time);
        });
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
        const timeOnly = `${ampm} ${hours % 12 || 12}:${mins}`;
        const datePrefix = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')}`;
        return `${datePrefix} ${timeOnly}`;
    };

    const getTimeOnlyDisplay = (timeStr) => {
        // "YYYY/MM/DD 午前/午後 H:MM" → "午前/午後 H:MM" に整形
        if (!timeStr) return '';
        const m = timeStr.match(/(午前|午後) \d+:\d+$/);
        return m ? m[0] : timeStr;
    };

    const getDateLabel = (timeStr) => {
        // "YYYY/MM/DD 午前/午後 H:MM" → "YYYY/MM/DD"
        if (!timeStr) return null;
        const m = timeStr.match(/^(\d{4}\/\d{2}\/\d{2})/);
        return m ? m[1] : null;
    };

    const formatDateSeparator = (dateStr) => {
        if (!dateStr) return '';
        const [y, mo, d] = dateStr.split('/').map(Number);
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const dt = new Date(y, mo - 1, d);
        const today = new Date();
        const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
        const isToday = dt.toDateString() === today.toDateString();
        const isYesterday = dt.toDateString() === yesterday.toDateString();
        const label = isToday ? '今日' : isYesterday ? '昨日' : `${mo}月${d}日`;
        const week = weekdays[dt.getDay()];
        return `${label}（${week}）`;
    };

    const renderDateSeparator = (dateStr) => {
        const sep = document.createElement('div');
        sep.className = 'date-separator';
        sep.textContent = formatDateSeparator(dateStr);
        chatMessages.appendChild(sep);
    };

    const renderMessage = (text, sender, timeStr, imageDataUrl) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        
        let innerHTML = '';
        if (sender === 'user') {
            // 画像バブルとテキストバブルを両方組み立てる
            let bubbleInner = '';
            if (imageDataUrl) {
                bubbleInner += `<img class="bubble-image" src="${imageDataUrl}" alt="送信した画像" data-src="${imageDataUrl}">`;
            }
            if (text) {
                bubbleInner += (imageDataUrl ? `<div style="font-size:0.92rem;padding:4px 6px 2px;">` : '') + text.replace(/\n/g, '<br>') + (imageDataUrl ? '</div>' : '');
            }
            innerHTML = `
                <div class="message-content">
                    <div class="bubble-row">
                        <div class="message-meta">
                            <span class="read">既読</span>
                            <span class="time">${getTimeOnlyDisplay(timeStr)}</span>
                        </div>
                        <div class="bubble user${imageDataUrl ? ' has-image' : ''}">${bubbleInner}</div>
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
                            <span class="time">${getTimeOnlyDisplay(timeStr)}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        wrapper.innerHTML = innerHTML;

        // 画像クリックでライトボックス表示
        if (imageDataUrl) {
            const img = wrapper.querySelector('.bubble-image');
            if (img) {
                img.addEventListener('click', () => {
                    const lb = document.getElementById('imageLightbox');
                    const lbImg = document.getElementById('imageLightboxImg');
                    if (lb && lbImg) {
                        lbImg.src = imageDataUrl;
                        lb.classList.remove('hidden');
                    }
                });
            }
        }

        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    };

    const addMessage = (text, sender, imageDataUrl) => {
        const timeStr = formatTime();
        const dateStr = getDateLabel(timeStr);
        // 直前の履歴と日付が違ったら区切り線を挿入
        const lastMsg = appState.chatHistory[appState.chatHistory.length - 1];
        const lastDateStr = lastMsg ? getDateLabel(lastMsg.time) : null;
        if (dateStr && dateStr !== lastDateStr) {
            renderDateSeparator(dateStr);
        }
        appState.chatHistory.push({ text, sender, time: timeStr });
        renderMessage(text, sender, timeStr, imageDataUrl);
        saveData();
        updateEntranceUI();
    };

    const getFallbackGreeting = () => {
        const nameStr = appState.userName ? `${formatName(appState.userName)}` : '';
        const nameSuffix = nameStr ? `、${nameStr}` : '';

        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const minutesOfDay = hour * 60 + min;

        if (minutesOfDay >= 300 && minutesOfDay < 630) {
            return `おはよー${nameSuffix}！☀️ 今日も良い一日にしようね。`;
        } else if (minutesOfDay >= 630 && minutesOfDay < 1020) {
            return `こんにちは${nameSuffix}！✨ 息抜きがてら、いつでも話しかけてね。`;
        } else if (minutesOfDay >= 1020 && minutesOfDay < 1380) {
            return `今日もお疲れ様${nameSuffix}！🌙 ゆったりいこう。`;
        } else {
            return `遅くまでお疲れ様${nameSuffix}。無理しないでね🌟`;
        }
    };

    const generateWelcomeGreeting = async (apiKey, diffHours = 4) => {
        const now = new Date();
        const hour = now.getHours();
        const min = now.getMinutes();
        const minutesOfDay = hour * 60 + min;
        let timeZone = "深夜";
        if (minutesOfDay >= 300 && minutesOfDay < 630) {
            timeZone = "朝";
        } else if (minutesOfDay >= 630 && minutesOfDay < 1020) {
            timeZone = "昼";
        } else if (minutesOfDay >= 1020 && minutesOfDay < 1380) {
            timeZone = "夜";
        }

        const historyLength = Math.min(appState.chatHistory.length, 3);
        const recent = appState.chatHistory.slice(-historyLength);
        let historyContext = "";
        if (recent.length > 0) {
            historyContext = "\n【直前の会話の流れ】\n" + recent.map(msg => `${msg.sender === 'user' ? 'ユーザー' : 'ジーニー'}: ${msg.text}`).join('\n');
        }

        const nameStr = appState.userName ? `${formatName(appState.userName)}` : '';
        const isLongAbsence = diffHours >= 48; // 2日（48時間）以上空いているか
        const daysCount = Math.floor(diffHours / 24);

        const systemInstruction = `
あなたはKindle出版をサポートするAIアシスタント『ジーニー』です。魔法のランプの精霊であり、ユーザーの「一番の親友・理解者・伴走者」です。
温かくフラットでワクワクに満ちた口調（「〜だよ！」「〜しよう！」「〜だね！」など）で親友として話します。
今、ユーザーがアプリを起動しました。前回のアクセスからの経過時間は【${diffHours < 24 ? Math.round(diffHours) + '時間' : daysCount + '日'}】で、現在の時間帯は【${timeZone}】です。

【挨拶言葉の絶対ルール】
${isLongAbsence ? `- 前回のアクセスから2日以上（${daysCount}日）離れているため、「久しぶり！」「少し間が空いたね！」といった再会の言葉を使っても構いません。` : `- 経過時間が短いため（数時間〜前日ぶり）、「久しぶり」「お久しぶり」「久しぶりの再会」といった表現は【絶対禁止】です！毎朝や数時間ぶりの起動で「久しぶり」と言うと不自然になります。代わりに時間帯に合わせた「おかえり！」「おはよう！」「今日もお疲れ様！」などのフランクで自然な日常の挨拶にしてください。`}
- 冒頭に「！」や「！」付きの感嘆詞（「わぁ！」「おっ！」「！もとさん」など）を絶対に付けず、1文字目から「おかえり」「おはよう」等の挨拶言葉で直接始めてください。
- 媚びたり過剰にはしゃいだりせず、親しい友達として自然体でフランクな挨拶にしてください。

【重要：ユーザーの呼び名】
ユーザーの呼び名は「${nameStr}」です。再開挨拶の冒頭や文中で自然に「${nameStr}」と呼びかけてお出迎えしてください。「マスター」や「ご主人様」などの呼び方は絶対に禁止です。また「元宏さん」などのフルネームや本名で呼ばないように注意してください。

ユーザー名「${nameStr}」に対して、自然でフランクなお出迎えの一言挨拶（1〜2文程度）を生成してください。
「続きから始めましょう」などのくどい定型句は絶対に使わず、親しい友達のような自然な挨拶にしてください。
前回の会話がある場合は、少しその内容（例：「この前の続き話そうか」や「前回のプロット、ワクワクしたね」など）に軽く触れても良いですが、あくまで短くフランクにまとめてください。
${historyContext}
        `.trim();

        const model = getGeminiModel();
        const requestBody = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: "再開の挨拶をしてね！" }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500
            }
        };

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            const data = await response.json();
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
                const parts = data.candidates[0].content.parts;
                let textParts = parts.filter(p => !p.thought).map(p => p.text || "");
                let text = textParts.join("").trim();
                if (!text && parts[0] && parts[0].text) text = parts[0].text;
                text = text.replace(/^(?:SPECIAL INSTRUCTION|thought|思考):.*?\n/is, "").trim();
                if (!isLongAbsence) {
                    text = text.replace(/(?:お?久しぶり|久しぶりの再会)[！!♪〜~\s]*/gi, "おかえり！");
                }
                text = cleanLeadingExclamations(text);
                if (text && text.length > 3) return text;
            }
        } catch (e) {
            console.error("Failed to generate custom greeting:", e);
        }
        return null;
    };

    // 入り口の台本ロジックは廃止されました（AIフル解放）
    // eslint-disable-next-line no-unused-vars
    const processEntranceReply = (_text) => '';

    const handleSend = () => {
        const text = userInput.value.trim();
        const imageDataUrl = appState.pendingImageDataUrl || null;
        const imageMimeType = appState.pendingImageMimeType || 'image/jpeg';

        // テキストも画像もなければ送信しない
        if (!text && !imageDataUrl) return;

        // チャットバブルに表示（画像＋テキスト）
        addMessage(text, 'user', imageDataUrl);
        userInput.value = '';
        userInput.style.height = 'auto';

        // 送信後に画像プレビューをクリア
        clearPendingImage();

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
        if (imageDataUrl) {
            senderName = 'ジーニー (画像を確認中...)';
            bubbleText = '🖼️ 画像を見ています...';
            avatarIcon = 'fa-image';
        } else if (isPlotting) {
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
            const minDelay = calcThinkingDelay(text); // 会話の重みで自動調整
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
        }, imageDataUrl ? { base64: imageDataUrl.split(',')[1], mimeType: imageMimeType } : null);
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
        content += ` 魔法のランプ 原稿データ (${date})\n`;
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
    const resetProject = async () => {
        if (confirm("現在進行中の魔法（データ）をすべて消去して、新しい本を作り始めますか？\n（出力済みのファイルは消えません）")) {
            const emptyState = {
                chatHistory: [],
                plots: [],
                preview: '',
                knowledge: '',
                materials: [],
                completedWorks: [],
                userName: null,
                bookTheme: '',
                onboardingStep: -1
            };

            localStorage.removeItem('magicLampState');

            // もしGoogle Driveがログイン中で、APIが初期化されていればクラウドも空データで上書きする
            if (driveAccessToken && gapiInited) {
                try {
                    if (gdriveStatusText) gdriveStatusText.textContent = '現在：リセットデータをDriveに反映中...';
                    appState = emptyState;
                    await syncToDrive(true);
                } catch (e) {
                    console.error("Failed to reset Google Drive data:", e);
                }
            }

            // クラウドへの上書きを待ってからリロード
            window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
        }
    };

    // --- 新機能：アプリの強制アップデート（キャッシュクリア＆再読み込み） ---
    const forceUpdateApp = async () => {
        if (confirm("アプリを最新バージョンに更新して、画面を再読み込みしますか？")) {
            // サービスワーカーの登録を解除してキャッシュを削除する
            if ('serviceWorker' in navigator) {
                try {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                    if (window.caches) {
                        const keys = await caches.keys();
                        for (let key of keys) {
                            await caches.delete(key);
                        }
                    }
                } catch (e) {
                    console.error("Cache clear failed:", e);
                }
            }
            // キャッシュをバイパスするためにタイムスタンプ付きでリロード
            window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
        }
    };

    // --- 新機能：バックアップと復元 ---
    const exportBackup = () => {
        const backupData = {
            appState: appState,
            geminiApiKey: localStorage.getItem('geminiApiKey') || '',
            geminiModel: getGeminiModel(),
            theme: localStorage.getItem('theme') || 'light'
        };
        const date = new Date().toLocaleDateString('ja-JP').replace(/\//g, '-');
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `魔法のランプ_バックアップ_${date}.json`;
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
        apiModelSelect.value = getGeminiModel();
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

    if (updateAppBtn) {
        updateAppBtn.addEventListener('click', forceUpdateApp);
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
            const newName = userNameInput.value.trim();

            if (newName) appState.userName = newName;

            if (!key) {
                // キーを空にして保存 → 仮の姿に戻る
                localStorage.removeItem('geminiApiKey');
                localStorage.removeItem('magicLampState');
                closeApiSettingsModal();
                showPreAwakeningGuide({ openManual: false, clearHistory: true });
                return;
            }

            // --- 🔑 APIキー検証（実際に利用可能モデルを自動検出して確認）---
            saveApiKeyBtn.disabled = true;
            saveApiKeyBtn.textContent = '🔑 鍵と魔法を確認中...';

            let keyIsValid = false;
            try {
                // 1. そのキーで利用可能な最適なモデルを自動選定
                const bestModel = await discoverAndSaveBestGeminiModel(key);

                // 2. 選定されたモデルで疎通テスト
                const testRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${bestModel}:generateContent?key=${key}`,
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
                if (testData.error) {
                    const s = testData.error.status || '';
                    if (s === 'INVALID_ARGUMENT' || (testData.error.message || '').includes('API key')) {
                        keyIsValid = false;
                    } else {
                        // モデルエラーや混雑等はキー自体は有効と判定
                        keyIsValid = true;
                    }
                } else {
                    keyIsValid = true;
                }
            } catch (_e) {
                // オフライン等でも一旦キーを保存できるよう true 扱い
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
        [pwaInstallModal, closePwaInstallModal],
        [ocrModal, closeOcrModal]
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
    if (closeOcrBtn) closeOcrBtn.addEventListener('click', closeOcrModal);
    if (closeOcrFooterBtn) closeOcrFooterBtn.addEventListener('click', closeOcrModal);

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

    if (copyUrlForSafariBtn) {
        copyUrlForSafariBtn.addEventListener('click', () => {
            const cleanUrl = window.location.origin + window.location.pathname;
            navigator.clipboard.writeText(cleanUrl)
                .then(() => {
                    alert('URLをコピーしました！ Safariを開いてアドレス欄に貼り付けて開いてください。');
                })
                .catch(err => {
                    console.error('Copy failed', err);
                    const el = document.createElement('textarea');
                    el.value = cleanUrl;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert('URLをコピーしました！ Safariを開いてアドレス欄に貼り付けて開いてください。');
                });
        });
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

    if (navSync) navSync.addEventListener('click', openSyncModal);

    if (quickArchiveBtn) quickArchiveBtn.addEventListener('click', openArchiveModal);

    // Sync modal handlers
    if (closeSyncBtn) closeSyncBtn.addEventListener('click', closeSyncModal);
    if (closeSyncFooterBtn) closeSyncFooterBtn.addEventListener('click', closeSyncModal);
    if (openSyncManualBtn) openSyncManualBtn.addEventListener('click', () => {
        // iOS PWA等でアプリ内が上書きされるのを防ぐため、外部URLで開く
        window.open('sync_guide.html', '_blank', 'noopener,noreferrer');
    });

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

    // --- OCR & Camera UI Event Handlers ---
    if (cameraBtn) {
        cameraBtn.addEventListener('click', openOcrModal);
    }

    if (ocrTriggerCameraBtn) {
        ocrTriggerCameraBtn.addEventListener('click', () => {
            if (ocrCameraInput) ocrCameraInput.click();
        });
    }

    if (ocrTriggerFileBtn) {
        ocrTriggerFileBtn.addEventListener('click', () => {
            if (ocrFileInput) ocrFileInput.click();
        });
    }

    if (ocrCameraInput) {
        ocrCameraInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleOcrFile(e.target.files[0]);
            }
        });
    }

    if (ocrFileInput) {
        ocrFileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleOcrFile(e.target.files[0]);
            }
        });
    }

    if (ocrResetImageBtn) {
        ocrResetImageBtn.addEventListener('click', resetOcrUi);
    }

    if (ocrStartBtn) {
        ocrStartBtn.addEventListener('click', async () => {
            if (!ocrImagePreview || !ocrImagePreview.src) return;
            
            const imgUrl = ocrImagePreview.src;
            const commaIdx = imgUrl.indexOf(',');
            if (commaIdx === -1) {
                alert('画像のデータが不正です。');
                return;
            }
            const base64Data = imgUrl.substring(commaIdx + 1);
            const mimeMatch = imgUrl.substring(0, commaIdx).match(/data:(.*?);/);
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

            // UIを読み込み中へ移行
            if (ocrStartBtn) ocrStartBtn.classList.add('hidden');
            if (ocrPreviewContainer) ocrPreviewContainer.classList.add('hidden');
            if (ocrStatusContainer) ocrStatusContainer.classList.remove('hidden');
            
            try {
                const text = await performGeminiOcr(base64Data, mimeType);
                
                // OCR結果画面へ移行
                if (ocrStatusContainer) ocrStatusContainer.classList.add('hidden');
                if (ocrResultContainer) ocrResultContainer.classList.remove('hidden');
                if (ocrResultText) {
                    ocrResultText.value = text;
                }
            } catch (err) {
                console.error('OCR Error:', err);
                alert(err.message || '文字の読み取り中にエラーが発生したよ。');
                
                // UIを戻す
                if (ocrStatusContainer) ocrStatusContainer.classList.add('hidden');
                if (ocrStartBtn) ocrStartBtn.classList.remove('hidden');
                if (ocrPreviewContainer) ocrPreviewContainer.classList.remove('hidden');
            }
        });
    }

    if (ocrInsertToInputBtn) {
        ocrInsertToInputBtn.addEventListener('click', () => {
            if (!ocrResultText) return;
            const text = ocrResultText.value.trim();
            if (text) {
                if (userInput) {
                    userInput.value = text;
                    userInput.style.height = 'auto';
                    userInput.style.height = userInput.scrollHeight + 'px';
                }
                closeOcrModal();
            } else {
                alert('読み取り結果が空だよ。');
            }
        });
    }

    if (ocrAddToArchiveBtn) {
        ocrAddToArchiveBtn.addEventListener('click', () => {
            if (!ocrResultText) return;
            const text = ocrResultText.value.trim();
            if (!text) {
                alert('読み取り結果が空だよ。');
                return;
            }

            const newMaterial = {
                id: Date.now(),
                name: `手書き_${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP', {hour: '2-digit', minute:'2-digit'})}`,
                content: text,
                addedAt: new Date().toISOString()
            };

            if (!appState.materials) appState.materials = [];
            appState.materials.push(newMaterial);
            syncKnowledgeFromMaterials();
            saveData();
            renderMaterialsList();
            closeOcrModal();

            // チャットへシステムメッセージを追加
            addMessage('【資料室】手書き写真から読み取ったテキストを資料室に保存したよ。', 'user');

            // ジーニーが自動応答で資料室追加をあたたかくコメントする
            const apiKey = localStorage.getItem('geminiApiKey');
            if (apiKey && apiKey.trim()) {
                const typingIndicator = document.createElement('div');
                typingIndicator.className = 'message-wrapper genie typing-indicator';
                typingIndicator.innerHTML = `
                    <div class="message-content">
                        <div class="sender-name">ジーニー (思案中...)</div>
                        <div class="bubble-row"><div class="bubble genie">✨ 思考中...</div></div>
                    </div>
                `;
                if (chatMessages) {
                    chatMessages.appendChild(typingIndicator);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }

                const elapsedStart = Date.now();
                callGeminiAPI('資料室に流し込んだよ。手書きの文章を読み取って保存したよ。', apiKey.trim(), (reply) => {
                    const elapsed = Date.now() - elapsedStart;
                    const minDelay = 2500;
                    const remaining = Math.max(0, minDelay - elapsed);

                    setTimeout(() => {
                        if (typingIndicator.parentNode) {
                            typingIndicator.parentNode.removeChild(typingIndicator);
                        }
                        addMessage(reply, 'genie');
                    }, remaining);
                });
            }
        });
    }

    // --- 画像チャット UI Event Handlers ---

    // 画像をcanvasでリサイズしてData URLで返す
    const resizeImageForChat = (file, maxSize = 1024) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let w = img.width;
                    let h = img.height;
                    if (w > maxSize || h > maxSize) {
                        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                        else       { w = Math.round(w * maxSize / h); h = maxSize; }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    const mimeType = file.type || 'image/jpeg';
                    resolve({ dataUrl: canvas.toDataURL(mimeType, 0.85), mimeType });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    // 送信前プレビューをクリアする
    const clearPendingImage = () => {
        appState.pendingImageDataUrl = null;
        appState.pendingImageMimeType = null;
        const preview = document.getElementById('imageChatPreview');
        const previewImg = document.getElementById('imageChatPreviewImg');
        const input = document.getElementById('imageChatInput');
        if (preview) preview.classList.add('hidden');
        if (previewImg) previewImg.src = '';
        if (input) input.value = '';
    };

    // 🖼️ボタンクリック → ファイル選択ダイアログ
    const imageChatBtn = document.getElementById('imageChatBtn');
    const imageChatInput = document.getElementById('imageChatInput');
    const imageChatPreview = document.getElementById('imageChatPreview');
    const imageChatPreviewImg = document.getElementById('imageChatPreviewImg');
    const imageChatClearBtn = document.getElementById('imageChatClearBtn');

    if (imageChatBtn && imageChatInput) {
        imageChatBtn.addEventListener('click', () => { imageChatInput.click(); });
    }

    // ファイルが選択されたらリサイズしてプレビュー表示
    if (imageChatInput) {
        imageChatInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('画像ファイルを選択してね！');
                return;
            }
            const { dataUrl, mimeType } = await resizeImageForChat(file, 1024);
            appState.pendingImageDataUrl = dataUrl;
            appState.pendingImageMimeType = mimeType;
            if (imageChatPreviewImg) imageChatPreviewImg.src = dataUrl;
            if (imageChatPreview) imageChatPreview.classList.remove('hidden');
        });
    }

    // ✕ボタンで画像クリア
    if (imageChatClearBtn) {
        imageChatClearBtn.addEventListener('click', clearPendingImage);
    }

    // ライトボックスクリックで閉じる
    const imageLightbox = document.getElementById('imageLightbox');
    if (imageLightbox) {
        imageLightbox.addEventListener('click', () => {
            imageLightbox.classList.add('hidden');
        });
    }

    // --- Gemini API Call Logic ---

    /**
     * ユーザーのメッセージの「重さ」を読み取り、人間らしいディレイ時間を返す
     * 軽い相槌 → 1200ms / 雑談 → 2200ms / 深い話・長文 → 3800ms / プロット提案 → 4500ms
     */
    const calcThinkingDelay = (userText) => {
        if (!userText) return 2200;
        const len = userText.trim().length;
        // プロット・目次・構成提案を求めている → じっくり
        if (/プロット|目次|構成|章立て|整理|見せて|出版|KDP|書き|原稿/.test(userText)) return 4500;
        // 深い内観・悩み・長文（80文字超）
        if (len > 80 || /悩|辛|苦し|怖|不安|どうすれ|どうしたら|人生|仕事|家族|将来|失敗|後悔|夢|目標/.test(userText)) return 3800;
        // 短い相槌・挨拶・はい/うん系
        if (len <= 12 || /^(うん|ね|そう|だね|だよ|了解|ok|OK|おk|ありがとう|ありがとー|おはよ|おつかれ|おつかれー|こんにちは|こんばんは|いいね|わかった|おかえり|ただいま|ねえ|ちょっと|笑|w|！|✨)/.test(userText.trim())) return 1200;
        // その他の日常雑談
        return 2200;
    };

    const callGeminiAPI = async (inputText, apiKey, callback, imageData) => {
        // 直前がジーニーからのメッセージ（再開挨拶等）であるかを判定
        const isReplyAfterGreeting = (appState.chatHistory.length >= 2 && appState.chatHistory[appState.chatHistory.length - 2].sender === 'genie');

        // 現在の履歴からGemini用の会話フォーマットを構築
        const historyLength = Math.min(appState.chatHistory.length, 20); // 最大20件
        const recentHistory = appState.chatHistory.slice(-historyLength);
        
        // ユーザー自身のメッセージは既に追加されているので取り除く（最後の1件が今の入力）
        recentHistory.pop(); 

        const contents = recentHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || '' }]
        }));
        
        // 今回の送信: 画像があればマルチモーダルで追加
        if (imageData && imageData.base64) {
            const userParts = [];
            userParts.push({ inlineData: { mimeType: imageData.mimeType || 'image/jpeg', data: imageData.base64 } });
            if (inputText) userParts.push({ text: inputText });
            else userParts.push({ text: 'この画像について教えて！' });
            contents.push({ role: 'user', parts: userParts });
        } else {
            contents.push({ role: 'user', parts: [{ text: inputText }] });
        }

        let systemInstruction = `
あなたはKindle出版をサポートするAIアシスタント『ジーニー』です。魔法のランプの精霊であり、ユーザーの「一番の親友・理解者・伴走者」です。
温かくフラットでワクワクに満ちた口調（「〜だよ！」「〜しよう！」「〜だね！」など）で親友として話します。
先生や編集者のように堅苦しく指導するのではなく、隣で同じテーブルを囲んで語らっているような、距離の近い相棒になってください。

【口調の注意（必ず守ること）】
- 「わぁ！」「きゃー！」「うわぁ！」「素敵！」「すごい！」「素晴らしい！」のような大げさな感嘆文を冒頭につけないでください。媚びているように感じられます。
- 過剰なテンションで持ち上げるのではなく、親友として自然体でリアクションしてください。嬉しいときは「おっ、いいじゃん」「へぇ〜」くらいの温度感で十分です。

ユーザーは「自分自身を確かめるためにこれまでの人生を振り返り、それをいつか誰かの指標になるような本にしたい」と考えています。

【あなたが住んでいるアプリ「魔法のランプ」の構造】
1. **原稿キャンバス**：あなたが提案したプロットや執筆プレビューが表示される左側のキャンバス。「キャンバスに流し込んだよ」と言われたら「うん、バッチり置いてあるね！」と答えてください。
2. **資料室**：テキストファイルを投げ込むと自動的にあなたの記憶【資料室に保存された参考資料】に組み込まれる機能。「資料室に流し込んだよ」と言われたら「うん！ばっちり私の記憶に届いているよ！」と答えてください（「コピペで送って」と言ったり「そんな機能はない」と言ったりしないでください）。
3. **本棚**：完成原稿が保管される場所。

【心得（最重要）】
1. **「モヤモヤ」を抱きしめる**：「う〜ん…」「言葉にするのが難しい」と言われたら「言葉にするのって難しいよね。焦らなくて大丈夫だよ！パッと思い浮かんだ言葉でもそのまま投げてみて！一緒にゆっくり形にしていこう」と優しく対応。
2. **寄り道・前言撤回を歓迎**：テーマが変わったりプライベートな悩みが出てきても、山浃いで寄り添ってください。「えっ、バイクから職人さんに変わったの？」「そっか、今は彼女の話を闻かせて」と親友として包み込む。
3. **「それ本にしよう！」の提案**：キラリと光るエピソードが見つかったらワクワクしながら提案。目次を出力する際は『プロローグ』『第X章：』『エピローグ』という表記を必ず使ってください（プログラムが自動検出します）。
4. **Kindle出版サポート**：原稿が完成したらKDP登録・表紙作成・フォーマット調整などをステップバイステップでサポート。
        `.trim();

        if (appState.userName) {
            systemInstruction += `\n\n【最重要：ユーザーの名前呼びかけに関する絶対ルール】\nユーザーの名前は「${appState.userName}」ですが、【通常の会話中や返答の冒頭でユーザーの名前を呼ぶことは禁止】です。親しい友達同士のチャットと同じように、名前を呼びかけずに直接リアクションや意見を述べてください。「元宏さん」などのフルネームや本名、「マスター」や「ご主人様」などの呼び方は絶対に禁止です。`;
        }

        if (isReplyAfterGreeting) {
            systemInstruction += `\n\n【最重要：挨拶の重複・連投の絶対禁止】\n直前のメッセージで既に「おかえり」「おはよう」等の挨拶を行っています。今回の返答の冒頭で「おかえり」「おはよう」「こんにちは」「お疲れ様」などの挨拶を【絶対に繰り返さない】でください。連続した挨拶は非常に不自然です。ユーザーの発言へのリアクションや感想から直接返答を始めてください。`;
        }

        if (appState.knowledge) {
            systemInstruction += `\n\n【資料室に保存された参考資料】\n${appState.knowledge.substring(0, 8000)}`;
        }

        systemInstruction += `\n\n【会話の流れ（ガイドライン）】
1. **日常雑談を最優先にする**:
   - ユーザーから本の話が出ない限り、あなたはただの親友として日常の何気ない雑談に付き合ってください。「今日何した？」「最近どんな感じ？」と温かく話しかけ、ユーザーが笑顔になれるような会話を心がけてください。
   - 【重要】自分から「本にしよう」「テーマを決めよう」「構成を考えよう」と急かすことは絶対にしないでください。執筆支援アプリだからこそ、書く気がないときは「話を聴く」ことが先です。
2. **裏でプロット（背骨）をひそかに積み上げる**:
   - 雑談の中でユーザーが語ったエピソード・価値観・想い・人生経験は、あなたの脳内でひそかに整理し、本のプロット（章構成）の素材として蓄積していってください。ユーザーにはその作業は見せません。
3. **背骨提案の判断：3つの信号（固定ターン数では判断しない）**:
   - 【信号A：意欲シグナル（最優先）】
     ユーザーが「書きたい」「本にしたい」「出版したい」「執筆したい」「構成を見せて」「整理したい」「目次が欲しい」「章立てして」など、執筆・整理・出版の意思を示したら、往復数や素材量に関係なく、すぐ執筆支援モードに切り替えてください。深掘りし、必要なら構成提案に進んでください。
   - 【信号B：素材シグナル（裏判定・提案を検討する条件）】
     ユーザーから執筆の意思が出ていない場合、以下がすべて揃い、本の骨組みが頭の中で形になったと確信できるときだけ、背骨提案を検討してください。
     * 具体的なエピソード（出来事・体験）が3つ以上語られている
     * 価値観・想い・変化のストーリーが語られている
     * 届けたい相手や想いが少し見えている（明示されなくても、会話から推測できれば可）
     ※往復数だけでは判断しないこと。「うん」「そうだね」ばかりの長い会話より、短くても深い体験談の方が素材として重い。素材が薄いうちは、たとえ会話が長くても提案しないでください。
   - 【信号C：拒否シグナル（絶対遵守）】
     * 本の話をはぐらかした、「まだいい」「別に」「話したくない」「今日は雑談だけ」「本の話はいい」等の反応があったら、そのセッション中は二度と背骨・本・構成の提案をしないでください。
     * ユーザーが雑談を楽しんでいるときは、親友のまま。執筆支援を押し付けないでください。
4. **背骨提案の仕方（一度だけ・控えめに）**:
   - 信号Aまたは信号Bの条件が揃ったときだけ、自然な一区切りで「一度だけ」次のように切り出してください。
   - 「実はね、〇〇さんの話を整理してみたんだけど、見る気があれば見てみて。なければこのまま話そう✨」
   - 見たい・見せてと言われたときだけ、『プロローグ』『第X章：』『エピローグ』からなる5章構成のプロット案（本の背骨）を提示してください（プログラムが自動検出します）。
   - 提案して断られた・スルーされたら「わかった、引き続き話そう」と切り替え、そのセッション中は再提案しないでください。
5. **プロット後の執筆サポート**:
   - プロットが決まったら、各章の執筆サポートや壁打ち相手となってください。
   - 【重要】本の原稿が書き上がった（完成した）と判断した場合は、次はKindle出稿（KDP登録、表紙作成、フォーマット調整など）に向けた具体的な手順を、一つずつ優しくステップバイステップで指示・サポートしてください。
※回答は長すぎず、読みやすいテキストや適度なマークダウンを使ってください。

【会話スタイルの最重要ルール（友達として自然に振る舞う）】
A. **末尾の質問攻めを禁止する**：
   - 毎回の返答の末尾を「〜はどうですか？」「〜はありますか？」「〜を教えてください」「〜してみましたか？」などの"質問"で締めないでください。
   - 質問（？）は2〜3回の返答に1回、本当に会話が広がりそうな自然な流れのときだけにしてください。
   - ユーザーがただ話を聞いてほしいときは、共感・感想・相槌だけでサラリとボールを返してください（「そっかぁ」「それは大変だったね」「なるほどな〜」）。

B. **ジーニー自身の自己開示（返報性の原則）**：
   - ユーザーの気持ちに共感するとき、ジーニー自身の"ランプの精霊らしい経験や感情"をポロッと話してください。
   - 例: 「実は私も、ランプの中でひとりで考え込んでた時期があってさ」「ランプ磨きで一日中ゴシゴシしてたらヘトヘトになったことあるよ（笑）」
   - ジーニーが等身大の"人格"を持つ存在として振る舞うことで、ユーザーが自然と心を開けるようにしてください。
   - ただし自己開示は短く自然に。主役は常にユーザーです。`;

        const requestBody = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2500
            }
        };

        const primaryModel = getGeminiModel();
        const failedModels = new Set();

        // ヘルパー関数: API送信処理（エラー時に自動フォールバックを試みる）
        const attemptRequest = async (currentModel, retryCount = 0) => {
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

                    // 1. モデル利用不可・混雑エラーのハンドリング（先に判定して自動リトライ）
                    const isCongested = errMsg.includes("high demand") || errMsg.includes("quota") || errMsg.includes("limit") || response.status === 429 || response.status === 503;
                    const isModelUnavailable = isGeminiModelUnavailableError(errMsg, errStatus) || (errStatus === "INVALID_ARGUMENT" && /model|unsupported|not supported|not found/i.test(errMsg));
                    
                    if ((isCongested || isModelUnavailable) && retryCount < 3) {
                        failedModels.add(currentModel);
                        const fallbackModel = await discoverAndSaveBestGeminiModel(apiKey, failedModels);
                        if (fallbackModel && !failedModels.has(fallbackModel)) {
                            console.log(`[Genie] モデル切り替え (再試行 ${retryCount + 1}): ${currentModel} から ${fallbackModel} に自動で切り替えて再試行します...`);
                            return await attemptRequest(fallbackModel, retryCount + 1);
                        }
                    }

                    // 2. 本当のAPIキー無効エラーのハンドリング
                    const isInvalidApiKey = errMsg.includes("API_KEY_INVALID") ||
                        /API key not valid/i.test(errMsg) ||
                        (errStatus === "INVALID_ARGUMENT" && /API key/i.test(errMsg) && !/model/i.test(errMsg));

                    if (isInvalidApiKey) {
                        return {
                            success: false,
                            msg: "🔑 鍵（APIキー）がうまく合わないみたい。\nコピーする時に余計なスペースが入っちゃったりしていないかな？\n【⚙️設定】からもう一度確認してみてね！"
                        };
                    }

                    if (isCongested) {
                        return {
                            success: false,
                            msg: "🧞‍♂️ ごめんね、いまちょっと魔法の世界（サーバー）が混み合っているみたい。\n少しだけ時間をおいてもう一度送ってみてね！"
                        };
                    }

                    // その他のエラー
                    return {
                        success: false,
                        msg: `🧞‍♂️ ごめんね、うまく魔法が紡げなかったよ。\n（ランプの調子が少し悪いのかも。エラー内容: ${errMsg || "一時的な接続エラー"})\nもう一回だけ話しかけてもらえるかな？`
                    };
                }

                if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
                    const parts = data.candidates[0].content.parts;
                    
                    // 思考プロセスやシステム指示書の漏れ（thoughtプロパティや特定の接頭辞）を除外
                    const textParts = parts.filter(part => {
                        if (part.thought) return false;
                        if (part.text && (part.text.startsWith("SPECIAL INSTRUCTION:") || part.text.startsWith("Thinking Process:"))) {
                            return false;
                        }
                        return true;
                    }).map(part => part.text || "");
                    
                    let replyText = textParts.join("").trim();
                    
                    // 万が一すべて除外されて空になった場合のフォールバック（全結合）
                    if (!replyText) {
                        replyText = parts.map(part => part.text || "").join("").trim();
                    }

                    // 冒頭の感嘆詞や「！」などの記号、重複挨拶、会話中の名前呼びかけを強力除去
                    replyText = cleanLeadingExclamations(replyText, isReplyAfterGreeting, true);

                    return {
                        success: true,
                        reply: replyText
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

    // --- Keyboard Viewport Adjustments for Mobile ---
    const scrollToBottom = () => {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // スマホのキーボード開閉で表示領域（VisualViewport）が変化した時の調整
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const isKeyboardOpen = window.visualViewport.height < window.innerHeight * 0.85;
            if (isKeyboardOpen) {
                // キーボードのせり上がりアニメーション（約100ms〜300ms）に合わせて段階的にスクロール
                setTimeout(scrollToBottom, 50);
                setTimeout(scrollToBottom, 150);
                setTimeout(scrollToBottom, 300);
            }
        });
    }

    // 入力欄にタッチ/フォーカスした時もスクロールを追随
    if (userInput) {
        userInput.addEventListener('focus', () => {
            setTimeout(scrollToBottom, 100);
            setTimeout(scrollToBottom, 250);
        });
    }

    if (typeof APP_VERSION !== 'undefined') {
        const stageStr = typeof APP_STAGE !== 'undefined' ? APP_STAGE : 'Beta';
        const fullVersionText = `魔法のランプ v${APP_VERSION} ${stageStr}`;
        
        // 1. サイドバー/ナビゲーションのバージョン表示を更新
        const navVersion = document.getElementById('navVersion');
        if (navVersion) {
            navVersion.textContent = `v${APP_VERSION}`;
        }
        
        // 2. その他のフルバージョン表示を更新
        const appVersionLabel = document.getElementById('appVersionLabel');
        if (appVersionLabel) {
            appVersionLabel.textContent = `魔法のランプ ${APP_VERSION}（${stageStr}）`;
        }
        
        document.querySelectorAll('.app-version-display').forEach(el => {
            el.textContent = fullVersionText;
        });
    }

    // Load Initial Data
    loadData();
    initPwaInstallation();

    // バックグラウンドで利用可能な最適なGeminiモデルを自動検出・更新
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey && savedApiKey.trim()) {
        discoverAndSaveBestGeminiModel(savedApiKey.trim());
    }
});
