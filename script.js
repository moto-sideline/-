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
        preview: '',
        knowledge: '',
        userName: null,
        onboardingStep: 0 // 0: 名前確認中, 1: テーマ確認中, 2: 通常モード
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
        if (saved) {
            appState = JSON.parse(saved);
            // 互換性のため古いデータへの対応
            if (appState.onboardingStep === undefined) appState.onboardingStep = 2;
            
            renderAll();
            
            // セッション開始時のみの挨拶（履歴には残さない）
            setTimeout(() => {
                const nameStr = appState.userName ? `${formatName(appState.userName)}、` : '';
                renderMessage(`おかえりなさい！${nameStr}また一緒に魔法を紡げるのを楽しみにしていました。続きから始めましょうか？`, 'genie', formatTime());
            }, 500);
        } else {
            // 初回オンボーディング（名前を尋ねる）
            appState.onboardingStep = 0;
            const introLines = [
                "初めまして！私はジーニー。あなたの『本を書きたい』という願いを叶えるためにやってきました。🧞‍♂️✨",
                "難しいことは何もいりません。私があなたの思考を引き出し、整理していきますので、リラックスして話しかけてくださいね。",
                "まずは、あなたの名前を教えていただけますか？ニックネームやペンネームでも大丈夫です。これからあなたをその名前でお呼びしますね。"
            ];
            introLines.forEach((line, index) => {
                setTimeout(() => addMessage(line, 'genie'), index * 1000);
            });
        }

        // テーマの復元
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

        // ジーニーの思考中エフェクト
        setTimeout(() => {
            let response = "";
            
            // オンボーディング：名前の確認
            if (appState.onboardingStep === 0) {
                // 名前の抽出ロジック（挨拶、一人称、語尾を除去）
                let name = text
                    .replace(/^(はじめまして|こんにちは|こんばんは|あのー|あの、|あの|あ、|えっと|やっぱり|やっぱ|じゃあ|それでは|そうしたら|そうだね、|そうだね|そうですね|うん|うん、|はい、|はい)[、。\s]*/g, '') // 挨拶・つなぎ言葉を除去
                    .replace(/^(私|わたし|僕|ぼく|俺|おれ|自分|じぶん)(は|の名前は|のなまえは|って)[、。\s]*/g, '') // 一人称を除去
                    .replace(/(です|と申します|と言います|だよ|って呼んで.*|と呼んで.*|でお願いします.*|で頼む.*|だ)[。、！!\s]*$/g, '') // 語尾を末尾($)で判定して除去
                    .replace(/^[、。\s]+|[、。\s]+$/g, '') // 先頭や末尾に残った余計な記号を削除
                    .trim();
                
                // もし全て消えてしまったら元のテキストを使う（フェイルセーフ）
                if (!name) name = text.trim();

                appState.userName = name;
                appState.onboardingStep = 1;
                
                const formattedName = formatName(name);
                response = `${formattedName}ですね！素敵な響きです。\nそれでは${formattedName}。あなたが今、一番伝えたい『本のテーマ』や『気になるキーワード』を一つ、教えていただけますか？そこから一緒に物語を編み上げていきましょう！`;
                
            } 
            // 通常の対話・プロデュースモード
            else {
                // 名前変更の検知（「やっぱり」などの口語を先に除去）
                const cleanText = text.replace(/^(やっぱり|やっぱ|じゃあ|それでは|あ、|あの、|えっと)[、。\s]*/g, '');
                const nameChangeMatch = cleanText.match(/(?:これからは)?(?:私の名前は|名前を)?\s*(.+?)\s*(?:に名前を変えて|に名前を変更して|って呼んで|と呼んで)(?:ください|ね|よ|)*$/);
                
                if (nameChangeMatch) {
                    const newName = nameChangeMatch[1].replace(/^(私|わたし|僕|ぼく|俺|おれ|自分|じぶん)は/, '').trim();
                    appState.userName = newName;
                    const formattedNewName = formatName(newName);
                    response = `承知いたしました！これからは「${formattedNewName}」とお呼びしますね。${formattedNewName}、引き続き執筆を進めていきましょう！`;
                } 
                else {
                    const namePrefix = appState.userName ? `${formatName(appState.userName)}、` : '';
                    
                    // テーマ設定・変更の判定
                    // オンボーディングステップ1（テーマ待ち）、またはテーマ関連キーワードが含まれている場合
                    if (appState.onboardingStep === 1 || text.match(/テーマ|書きたい|書こう|タイトル|件名/)) {
                        
                        let theme = "";
                        const themeMatch = text.match(/「(.*?)」/);
                        if (themeMatch) {
                            theme = themeMatch[1];
                        } else {
                            // 邪魔な語尾や助詞を削って名詞（テーマ）だけを取り出す
                            theme = text
                                .replace(/(という|について|に関する|の)?(テーマ|内容|本|ストーリー)(で|について)?/g, "")
                                .replace(/(を|で|に|について|って|でも|とか|なんて)?(書きたい|書いてみたい|書く|書こう|執筆したい|作りたい|作ろう|しよう|する|したい|いこう|いく|決めた|決定)(と|って|かな|な|かも|です|ます|と思う|思ってます|思っています|か)*$/g, "")
                                .replace(/(がいい|が良い|が良いかな|がいいかな|でいい|で良い)(な|かも|です|ます)*$/g, "")
                                .replace(/^(あのー|あのね|あの|えーっと|えっと|ええと|実は|私|わたし|僕|ぼく|俺|おれ|自分|じゃあ|それじゃあ|そうですね|そうだね|そうだな|そうだ|そう|よし|やっぱり|やっぱ|うーん|んー|うんじゃあ|うん、じゃあ|うん|はい|では|でわ|とりあえず|まずは|まあ|てか|というか)[、。\s]*/g, "")
                                .replace(/[、。！？!\?\s]+$/g, "")
                                .trim();
                            
                            // 末尾に残った余計な助詞を消す
                            theme = theme.replace(/(でも|とか)$/, "");
                            
                            // それでも空になってしまったら元のテキストをフォールバック
                            if (!theme) theme = text.trim();
                        }

                        appState.onboardingStep = 2; // テーマ設定完了で通常モードへ

                        response = `『${theme}』ですね。${namePrefix}素晴らしい着眼点です！\n読者が思わず手に取ってしまうような「骨組み」を考えてみました。\n\n左側のワークスペースを見てください。ここから、さらにあなたの熱を込めていきましょう。`;
                        
                        appState.plots = [
                            `プロローグ：なぜ今、${theme}が必要なのか`,
                            `第1章：誰もが陥る${theme}の罠`,
                            `第2章：ジーニー流・${theme}を攻略する3つの秘策`,
                            `第3章：実録！${theme}で人生が変わった人たち`,
                            `エピローグ：次の一歩を踏み出すあなたへ`
                        ];
                        renderPlots();
                    } else if (text.length > 30) {
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

    // Load Initial Data
    loadData();
});
