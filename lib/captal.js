/**
 * CAPTAL 
 * 
 * @description Online quest-book IDE
 * @author connect <kod.connect@gmail.com>
 */
$(document).ready(function(){

    ////////////////////////////////////////////////////////////////////////////
    //                              CONFIG
    ////////////////////////////////////////////////////////////////////////////
    
    cfg = {
        version         : '0.32 beta',
        debug           : 0,
        
        autoopen        : 1,
        autosave        : 1,
        autoTranslate   : 0,
        detectLang      : 1,
        guiHideCoding   : 1,
        hideWelcome     : 0,
        isModer         : 0,
        lineBreak       : 1,
        logBuffer       : 30,
        maximized       : 0,
        readonly        : 0,
        showInvisibles  : 0, 
        workerCount     : 30,
       
        localURL: {
            game        : '../dev/ajax.php?cmd=getgame&param=',
            gamelist    : '../dev/ajax.php?cmd=gamelist&',
            statuses    : '../dev/ajax.php?cmd=statuses.json',
            templates   : '../dev/ajax.php?cmd=templates.json',
            setstatus   : '../dev/ajax.php?cmd=setstatus&param=',
            update      : '../dev/ajax.php?cmd=update&param=',
            component   : '../dev/ajax.php?cmd=component&param='
        },        
        remoteURL: {
            game        : 'http://quest-book.ru/online/getgame/',        
            gamelist    : 'http://quest-book.ru/online/gamelist/all',
            statuses    : 'http://quest-book.ru/online/statuses.json',
            templates   : 'http://quest-book.ru/online/templates.json',
            setstatus   : 'http://quest-book.ru/online/setgamestatus/',
            update      : 'http://quest-book.ru/online/publish/',
            component   : 'http://quest-book.ru/online/components/'
        },
        requestURL: null,
        
        yandex          : 'trnsl.1.1.20170211T190809Z.6bd96d6ef3a6a4b6.d62c1613c13d7bf4a7bcaa5ac1341ca94ca91499',
        yandexAlt       : [
            'trnsl.1.1.20170607T124235Z.56000412ab1b516e.7394a19a43e5b087e4f221c469ebd4c3ed8f91f8'
        ],
    };

    
    ////////////////////////////////////////////////////////////////////////////
    //                              TOOLS
    ////////////////////////////////////////////////////////////////////////////
    
    cookie = {
    
        // возвращает cookie с именем name, если есть, если нет, то undefined
        get: function(name) {
            
            if (name == undefined) return;
            
            var matches = document.cookie.match(new RegExp(
                "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
            ));
            
            return matches ? decodeURIComponent(matches[1]) : undefined;
        },
        
        set: function(name, value, options) {
            
            options = options || {};

            var expires = options.expires;

            if (typeof expires == "number" && expires) {
                
                var d = new Date();
                
                d.setTime(d.getTime() + expires * 1000);
                expires = options.expires = d;
            }
            
            if (expires && expires.toUTCString) {
                
                options.expires = expires.toUTCString();
            }

            value = encodeURIComponent(value);

            var updatedCookie = name + "=" + value;

            for (var propName in options) {
                
                updatedCookie += "; " + propName;
                var propValue = options[propName];
                
                if (propValue !== true) {
                    updatedCookie += "=" + propValue;
                }
            }

            document.cookie = updatedCookie;
        }
    };
    
    log = function(){
        
        var time = new Date();
        var secs = (time.getSeconds()< 10 ? '0': '') + time.getSeconds();
        var mins = (time.getMinutes()< 10 ? '0': '') + time.getMinutes();
        var hour = (time.getHours()  < 10 ? '0': '') + time.getHours();        
        var timestamp = hour +':'+ mins +':'+ secs;       
        var i = 0;        
        var type = (typeof arguments === 'object' && (arguments[0] == 'debug' || arguments[0] == 'error') ) ? arguments[0] : 'text';
        var wrap = function(type,str){ return '<span class="'+ type +'">'+ str +'</span>'; };
        var msg  = []; // output msg
        var arg;

        if (type === 'text') { 
            console.log(arguments);
        } else {
            arguments = arguments[1]; 
        }
        
        for (i in arguments) {
            
            if (typeof arguments[i] === 'object' && arguments[i].length === undefined) {
                // object
                arg = JSON.stringify( arguments[i] );
            } else if (typeof arguments[i] === 'object' && arguments[i].length > 0) {
                // array
                arg = JSON.stringify( arguments[i] );
            } else if (typeof arguments[i] === 'string') {
                // string
                arg = arguments[i];
            } else if (typeof arguments[i] === 'number') {
                // number
                arg = arguments[i];
            } else {
                // unknown
                arg = arguments[i];
            } 
            msg.push( wrap( type, arg ));
        }        
                
        
        $('#log')
            .append('<div><span class="timestamp">'+ timestamp +' |</span> '+ msg.join(', ') +'</div>')
            .scrollTop(999999);                      
        
        // keep log length from growing too long
        if ( $('#log div').length > cfg.logBuffer ) {
            
            $('#log div:first').remove();
        }
    };    
    
    debug = function(){ 
        if (cfg.debug) {
            log( 'debug', arguments );
            console.log( arguments );
        }
    };            
    
    error = function(){        
        log('error',  arguments);
        console.log(arguments);
    };
    
    salt = function() {
        return Math.random().toString(36).slice(2);
    };        

    // Random generator: from, to
    random = function(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    };
    
    getRandomName = function(tag){
        tag = (tag == undefined) ? ('error') : (tag);
        return tag+'_'+random(1000,9999);
    };
    
    exprSafe = function(str){
        
        return str       
                .replace( /\[/g, '&#91;')
                .replace( /\]/g, '&#93;')
                .replace( /\//g, '&#47;')
                .replace( /\(/g, '&#40;')
                .replace( /\)/g, '&#41;')
                .replace(  />/g, '&gt;' )
                .replace(  /</g, '&lt;' );
    };           
    
    cleanName = function(str){
        
        str = (typeof str != 'string') ? str.toString() : str;
        
        if (str.match(/[^а-яa-z-_0-9]+/ig) != null) {
            
            error(lang.current.naming_rules);
        }
        
        return str
                .replace(/\s+/g,'_')
                .replace(/[^а-яa-z-_0-9]+/ig,'-');
    };
    
    /**
     * Analyze text and return results to callback
     * Tries to get text around numbers
     * 
     * @param {type} o
     * @returns {String}
     */ 
    getMarks = function(text, callback){ debug('getMarks()');                
        
        // find numbers in text
        var numbers = text.match(/\d+/g);
        
        // number of workers
        var workerCount = cfg.workerCount;

        // make numbers unique
        var unumbers = [];
        for (var n in numbers)
            if (unumbers.indexOf( numbers[n] ) == -1)
                unumbers.push( numbers[n] );
        
        project.imp = {
            
            callback    : callback,
            text        : text,
            numbers     : unumbers,            
            tnumber     : 0, // first            
            workers     : [],
            finished    : 0, // workers ready
            marks       : [{ prefix: '', affix: '', feq: 0 }]
        };

        for (var w = 0; w < workerCount-1; w++) {
            
            var worker = new Worker('lib/workers/getMarks.worker.js');
            
            project.imp.tnumber++;
            
            worker.postMessage({ text: text, num: project.imp.numbers[project.imp.tnumber], marks: project.imp.marks });
            
            worker.onmessage = function( e ){

                var res   = e.data.marks,
                    found;
                                                    
                for (var j in res) {
                    
                    found = false;
                    
                    for (var i in project.imp.marks){
                    
                        if (project.imp.marks[i].prefix == res[j].prefix && project.imp.marks[i].affix == res[j].affix) {
                            // update freq
                            project.imp.marks[i].freq += (res[j].stats != undefined) ? res[j].stats : 0;
                            found = true;
                        }
                    }
                    
                    if (!found) {
                        // new mark found
                        res[j].freq = (res[j].stats != undefined) ? res[j].stats : 0;
                        project.imp.marks.push( res[j] );
                    }
                };                                          
                
                if (project.imp.tnumber < project.imp.numbers.length) {
                
                    // take next number
                    project.imp.tnumber++;                
                                    
                    worker.postMessage({ text: text, num: project.imp.tnumber, marks: project.imp.marks });
                    
                } else {                                    
                
                    project.imp.finished++;
                    
                    // if all workers are finished, we're done
                    if (project.imp.finished == project.imp.workers.length) {                        
                        
                        var callback = project.imp.callback;
                        var marks    = project.imp.marks;
                        
                        project.imp  = null; // destroy
                        
                        // stop progress timer
                        clearInterval(getMarksTimer);
                        
                        //
                        $('#dlgLoading span').html('');

                        // soft marks by frequency DESC
                        marks.sort(function(a,b){            

                            return b.freq - a.freq;
                        });                                                

                        // return results
                        if (typeof callback === 'function') {

                            callback(marks);

                        } else {       
                            
                            return marks;
                        }
                        
                    }
                }
            };
            
            project.imp.workers.push( worker );
        }
        
        // update counter
        getMarksTimer = setInterval(function(){
            
            $('#dlgLoading span').html( project.imp.tnumber  +'/'+ project.imp.numbers.length );
        },500);
    };
        
    cutMarks = function(text, marks){
        
        var last = marks.length-1;
        var tmark;
        
        for (var i in marks){
            
            tmark = marks[i];
            text  = text
                    .replace( exprSafe( '' ) );
            
            if (i == last){
                
                console.log();
            }
        }
    };

    processActions = function(text, actMarkers, cActString, cActRemove, customMark){                
        
        var actHTML = '',
            parHTML = '',
            txtHTML = text;
        
        for (var a = 0; a <= actMarkers.length-1; a++) {

            var amark   = actMarkers[a] != '!Strict' ? project.marks[ actMarkers[a] ] : customMark; 
            
            if (amark == undefined) continue;
            
            var abuffer = text.split( amark.prefix );                            
            var tact;

            for (var j in abuffer) {

                if ( j > 0 ) {

                    if (amark.affix == '') {
                        // single marker                                                                                

                        if ( abuffer[j].indexOf(' ') > 0 ) { 

                            if ( abuffer[j].indexOf('\n') != -1 && abuffer[j].indexOf(' ') > abuffer[j].indexOf('\n') ) {

                                tact = abuffer[j].substring(0, abuffer[j].indexOf('\n'));

                            } else {

                                tact = abuffer[j].substring(0, abuffer[j].indexOf(' '));                                                
                            }

                        } else if (abuffer[j].indexOf('\n') > 0){

                            tact = abuffer[j].substring(0, abuffer[j].indexOf('\n'));

                        } else {

                            tact = abuffer[j].substring(0);
                        }

                        // cleanup
                        if (cActString) {

                            tact = tact.match(/[a-zA-Z0-9]+/);

                        } else {

                            tact = tact.match(/\d+/);
                        }

                    } else if (!cActString) {
                        
                        // paired numeric marker
                        
                        tact = abuffer[j].substring(0, abuffer[j].indexOf(amark.affix) );
                        
                        // validate
                        if (tact.replace(/\s+/g,'').match(/\D+/) != null) { 
                            tact = ''; 
                        } else {
                            tact = tact.match(/\d+/);
                        }
                        
                    } else if (abuffer[j].indexOf(amark.affix) > 0 ){

                        // paired marker (non numeric)                        
                        tact = abuffer[j].substring(0, abuffer[j].indexOf(amark.affix) );
                                                
                    }

                    // skip empty and repeating actions
                    if (tact != '' && tact != null && actHTML.indexOf('goto="'+tact+'"') == -1) {

                        // cut action markers from paragraph if needed
                        if (cActRemove) {
                            
                            if (txtHTML.indexOf( amark.prefix +' '+ tact + amark.affix ) != -1) {
                                
                                txtHTML = txtHTML.replace( amark.prefix +' '+ tact + amark.affix, '#'+tact ); // tact[0]
                            } else {
                            
                                txtHTML = txtHTML.replace( new RegExp( amark.prefix + tact + amark.affix , 'g'), '#'+tact ); // tact[0]
                            }
                        
                        } else {
                            
                            txtHTML = txtHTML
                                        .replace( amark.prefix + tact + amark.affix, amark.prefix +'#'+ tact + amark.affix )
                                        .replace( amark.prefix +' '+ tact + amark.affix, amark.prefix +' #'+ tact + amark.affix );
                            //txtHTML = txtHTML.replace( new RegExp( amark.prefix + tact + amark.affix, amark.prefix +'#'+ tact + amark.affix );
                        }

                        actHTML += '<action goto="'+tact+'" intext="'+j+'">&lt;![CDATA['+ tact +']]&gt;</action>\n';
                    }
                }
            }                                                        
        }
        
        parHTML = '<text>&lt;![CDATA['+txtHTML+']]&gt;</text>\n'+actHTML+'\n';
        
        return parHTML;
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //                              LANGUAGE  
    ////////////////////////////////////////////////////////////////////////////
    
    lang = {
        
        current : null, // object
        name    : '',
        default : 'rus'
    }
    
    lang.freq = {
        
        index: { rus: 'Русский', ukr: 'Украинский', eng: 'Английский', ger: 'Немецкий', ita: 'Итальянский', fra: 'Французский' },
        
        rus: ['артефакт','без','большой','бы','быть','в','вам','вас','ваш','вверх','вернитесь','весь','вниз','во',
            'возвращайтесь','волшебный','восток','вот','вперед','время','все','вы','выносливость','где','говорить','год',
            'даже','далее','дальше','два','дело','день','для','до','должен','другой','его','ее','если','еще',
            'же','жизнь','за','запад','знать','и','идти','из','или','иметь','использовать','исследовать','их','к',
            'как','как','какой','когда','конец','который','кто','ли','ловкость','мастерство','место','можно','мой','мочь','мудрость',
            'мы','на','надо','налево','направо','наш','не','ничто','но','новый','ну','о','один','он','она',
            'они','от','очень','параграф','первый','переходите','по','под','показать','после','потом','при','применить','про','проверьте',
            'продолжить','работа','раз','рука','с','сам','самый','свое','своё','свои','свой','свой','свою',
            'себя','север','сила','сказать','слово','со','стать','так','такой','там','то','то','только','тот',
            'ты','у','уже','хотеть','человек','что','что','чтобы','это','этот','юг','я'],
        ukr: [ 'е','мені','вiн','вона','вони','ми','ви','це','що','свiй','свої','захід','південь','схід','північ' ],        
        eng: ['the','be','of','and','in','to','have','it','for','I','that','you','he','on','with','do','at','by',
            'not','this','but','from','they','his','she','or','which','as','we','say','will','would','can','if',
            'their','go','what','there','all','get','her','make','who','out','up','see','know','time','take','them',
            'some','could','so','him','year','into','its','then','think','my','come','than','more','about','now',
            'last','your','me','no','other','give','just','should','these','people','also','well','any','only','new',
            'very','when','may','way','look','like','use','such','how','because','good','find','man','our','want','hello',
            'day','between','even','many','those','what','says'],
        ger: ['der','die','und','in','den','von','zu','das','mit','sich','des','auf','für','ist','im','dem','nicht',
            'ein','die','eine','als','auch','es','an','werden','aus','er','hat','daß','sie','nach','wird','bei',
            'einer','der','um','am','sind','noch','wie','einem','über','einen','das','so','sie','zum','war','haben',
            'nur','oder','aber','vor','zur','bis','mehr','durch','man','sein','wurde','sei','in','prozent','hatte',
            'kann','gegen','vom','können','schon','wenn','habe','seine','ihre','dann','unter','wir','soll','ich',
            'eines','es','jahr','zwei','jahren','diese','dieser','wieder','keine','uhr','seiner','worden','und',
            'will','zwischen','im','immer','millionen','ein','was','sagte'],
        ita: ['non','di','che','è','e','la','il','un','una','mi','sono','ho','ma','lo','ha','le',
            'si','ti','i','con','cosa','se','io','come','da','ci','no','questo','qui','hai','sei','del','bene',
            'tu','sì','me','più','al','mio','perché','lei','solo','te','era','gli','tutto','della','così','mia',
            'ne','questa','fare','quando','ora','fatto','essere','so','mai','chi','o','alla','tutti','molto',
            'dei','anche','detto','quello','va','niente','grazie','lui','voglio','abbiamo','stato','nel','suo',
            'dove','posso','oh','prima','allora','siamo','uno','sua','tuo','hanno','noi','sta','fa','due',
            'vuoi','ancora','qualcosa','vero','casa','sia','su'],
        fra: ['être','avoir','je','de','ne','pas','le','la','tu','vous','il','et','à','un','qui','aller','les',
            'en','ça','faire','tout','on','que','ce','une','mes','pour','se','des','dire','pouvoir','vouloir',
            'mais','me','nous','dans','elle','savoir','du','où','y','bien','voir','plus','non','te','mon','au',
            'avec','moi','si','quoi','devoir','oui','ils','comme','venir','sur','toi','ici','rien','lui','bon',
            'là','suivre','pourquoi','parler','prendre','cette','quand','alors','une','chose','par','son','croire',
            'aimer','falloir','comment','très','ou','passer','penser','aussi','jamais','attendre','trouver',
            'laisser','petit','merci','même','sa','ta','autre','arriver','ces','donner']
    };
    
    lang.build = function(l){
        
        var def  = lang[ lang.default ], // default dictionary
            dict = lang[l];              // target dictionary
        
        for (var i in def){
            
            if (dict[i] == undefined) {
                
                debug('No locale string for: '+i);
                dict[i] = '!'+ def[i]; // get missing lines from default dictionary
            }
        }
    };
    
    lang.detectYan = function(str, callback){ debug('lang.detect(...)');
        
        if (str == undefined || cfg.detectLang == false) return;
                
        str = str.toLowerCase()
                .replace(/\<!\[CDATA\[/i, '')
                .replace(/\]\]>/, '')
                .replace(/\./g, '');
        
        var ru2rus   = { en: 'eng', ru: 'rus', ua: 'ukr', de: 'ger', fr: 'fra', it: 'ita', bg: 'bul' };
        
        // cut long text to increase performance
        //str = str.substr(0,100).split(' ');
        str = str.substr(0,200);
   
        if (str == '') return;
   
        return;
        $.ajax({
            url: 'https://translate.yandex.net/api/v1.5/tr.json/detect',
            data: {
                key:  'trnsl.1.1.20170211T190809Z.6bd96d6ef3a6a4b6.d62c1613c13d7bf4a7bcaa5ac1341ca94ca91499',
                text: str
                //hint: $('#targetLang img.flag').map(function(){ return this.lang}).get().join(', '),
            },
            success: function(res){                                
                
                if (typeof callback == 'function') {
                    
                    callback(res);
                }
                
                return ru2rus[res.lang];
            }
        })
    };
    
    /**
     * Try to detect language
     * @param {type} str
     * @returns {stat}
     * @TODO: increase performance
     */
    lang.detect = function(str, callback){ debug('lang.detect(...)');
        
        if (str == undefined || cfg.detectLang == false) return;
                
        var stat = [];
        var d,i,j;
        str = str.toLowerCase()
                .replace(/\<!\[CDATA\[/i, '')
                .replace(/\]\]>/, '')
                .replace(/\./g, '');
        
        // cut long text to increase performance
        str = str.substr(0,100).split(' ');
   
        // prepare stat object
        for (d in lang.freq.index) {
            
            stat.push({ count: 0, name: d, fullname: lang.freq.index[d]});            
        }
        
        // search 
        for (i in str){
            
            j = 0;
            for (d in lang.freq.index) {
                
                if ( lang.freq[d].indexOf( str[i] ) > -1) {
                    // found
                    stat[j].count++;
                }
                j++;
            }
            
            // last
            if (i == str.length-1) {
                // sort results
                stat.sort(function(a,b){
                    if (a.count < b.count) {
                        return 1;
                    } else if (a.count > b.count) {
                        return -1;
                    } else 
                        return 0;
                });              

                if (typeof callback == 'function') {
                    callback(stat);
                }

                return (stat[0].count == 0) ? 'undefined' : stat[0].name;
            }
        }                
    };
    
    lang.bul = {

        about                       : 'За приложението',
        action_add                  : 'Добавяне на действие',
        action_could_be_string      : 'Действието не винаги е число',
        action_create               : 'Създаване на действие',
        action_mark                 : 'Марк за действие',
        action_markers_remove       : 'Премахване на маркерите',
        actions                     : 'Мерки',
        add                         : 'Добави',
        
        atril_start                 : 'Стартира Antril играч',
        
        block                       : 'Блок',
        block_action                : 'Блок действие',
        block_copy                  : 'Копирайте текущия блок',
        block_delete                : 'Изтриване на блок',
        block_delete_rules          : 'Изберете блок за изтриване и опитайте отново',
        block_down                  : 'Долна блок',
        block_handler               : 'Новият процесор',
        block_indent                : 'Тире дясно',
        block_not_selected          : 'Блок е избран',
        block_outdent               : 'Тире ляв',
        block_raise                 : 'Поднять блок',
        block_script                : 'Блок скрипта',
        block_specialchar           : 'Включить спецсимволы',
        block_text                  : 'Блок текста',
        block_wrap                  : 'Перенос текста',
        
        cancel                      : 'Отмена',
        captal                      : 'Каптал',
        close                       : 'Закрыть',
        cloud_game_approve          : 'Одобрить',
        cloud_game_approved         : 'Игра была утверждена',
        cloud_game_awaiting         : 'Игра ожидает рассмотрения',
        cloud_game_ban              : 'Запретить',
        cloud_game_banned           : 'Игра была отклонена',
        cloud_game_cant_open        : 'Не могу открыть игру из облака',
        cloud_game_cant_save        : 'Не могу сохранить игру в облаке',
        cloud_game_load             : 'Загрузить',
        cloud_game_mistake          : 'Игра не из облака',
        cloud_game_not_found        : 'Игра не найдена в облаке',
        cloud_game_publish          : 'Опубликовать',
        cloud_game_reject           : 'Отклонить',
        cloud_game_rejected         : 'Игра была отправлена на доработку',
        cloud_game_saved            : 'Игра сохранена',
        cloud_games                 : 'Облако книг-игр',
        cloud_components            : 'Облако компонентов',
        cloud_unavailable           : 'Облако не доступно',
        component                   : 'Компонент',
        component_add               : 'Подключить',
        component_description       : 'Описание компонента',
        component_already_added     : 'Этот компонент уже подключен к проекту.',
        components                  : 'Компоненты',
        copy                        : 'Скопировать',
        create                      : 'Создать',
        
        data_loss_confirm           : 'Все несохраненные изменения будут потеряны. Продолжить все равно?',
        delete                      : 'Удалить',
        done                        : 'Готово',
        
        edit                        : 'Редактировать',
        editor_maximize             : 'Скрыть дерево параграфов и навигатора',
        
        file                        : 'Файл',
        file_encoding               : 'Кодировка файла',
        file_loading                : 'Загружаю файл',
        folder                      : 'Каталог',
        folder_auto                 : 'Автокаталог',
        folder_auto_undeletable     : 'Автокаталоги не могут быть удалены!',
        folder_create               : 'Создать каталог',
        folder_delete_confirm       : 'Все параграфы этого каталога будут удалены! Продолжить?',
        folder_icon_change          : 'Сменить иконку',
        folder_icon_pick            : 'Выберите иконку',
        folder_icon_rules           : 'Иконка может быть изменена только у пользовательского каталога',
        folder_name_rules           : 'Имя может быть изменено только у пользовательских каталогов',
        folder_new                  : 'Новый каталог',
        folder_settings             : 'Настройка каталога',
        format_unsupported          : 'Неизвестный формат',
        formatting                  : 'Форматирование',
        
        general                     : 'Общие',
        graph                       : 'Схема параграфов',
        go                          : 'Перейти',
        go_enter                    : 'Введите номер параграфа для перехода',
        
        handler_add                 : 'Добавить обработчик',
        handlers                    : 'Обработчики',
        help                        : 'Справочное руководство',
        help_forum                  : 'Форум обсуждения',
        help_index                  : 'Содержание',
        help_manual                 : 'Справка',
        hide_coding_elements        : 'Скрыть элементы программирования',
        
        import                      : 'Импорт',
        
        label_enter                 : 'Введите название ярлыка для этого параграфа',
        label_set                   : 'Установить ярлык',
        language_original           : 'Язык оригинала',
        language_target             : 'Язык проекта',
        links_external              : 'Переходы извне',
        loading                     : 'Думаю',
        logic_do                    : 'Выполнить',
        logic_do_long               : 'DO вызвать скрипт',
        logic_false                 : 'Виден если НЕ',
        logic_false_long            : 'IF FALSE срабатывает при невыполнении условия',
        logic_global_long           : 'GLOBAL для всего проекта',
        logic_goto                  : 'Переход к',
        logic_goto_long             : 'GOTO перейти к параграфу',
        logic_true                  : 'Виден если',
        logic_true_long             : 'IF TRUE срабатывает при выполнении условия',
        logic_type                  : 'Имя блока',
        lower                       : 'Опустить',
        
        move                        : 'Переместить',
        
        naming_rules                : 'Допустимые символы: латиница, кириллица, тире и подчеркивание',
        navigator                   : 'Навигатор',
        next                        : 'Следующий',
        
        ok                          : 'Ок',
        open                        : 'Открыть',
        open_in_editor              : 'Открыть в редакторе',
        original                    : 'Оригинал',
        
        paragraph                   : 'Параграф',
        paragraph_action_mark       : 'Признаки параграфа и действия',
        paragraph_translate_onopen  : 'Автоматический перевод при открытии параграфа',
        paragraph_copy              : 'Скопировать текущий параграф',
        paragraph_close_all         : 'Закрыть все',
        paragraph_close_current     : 'Закрыть текущий',
        paragraph_close_other       : 'Закрыть другие',
        paragraph_delete_confirm    : 'Хотите удалить параграф {ID} с его содержимым?',
        paragraph_down              : 'Опустить параграф',
        paragraph_go                : 'Перейти к параграфу №',
        paragraph_inject            : 'Встроить Новый Параграф',
        paragraph_is_end            : 'Параграф является концовкой',
        paragraph_label             : 'Установить ярлык',
        paragraph_linked            : 'Новый Связанный Параграф',
        paragraph_loading           : 'Загрузка параграфа',
        paragraph_mark              : 'Признак параграфа',
        paragraph_name_enter        : 'Введите новое имя для этого параграфа',
        paragraph_not_found         : 'Параграф не найден',
        paragraph_not_selected      : 'Исходный параграф не выбран',
        paragraph_new               : 'Новый параграф',
        paragraph_raise             : 'Поднять параграф',
        paragraph_shuffle           : 'Перемешать параграфы',
        paragraph_shuffle_confirm   : 'Вы уверены, что хотите перемешать все параграфы?',
        paragraph_set_candidate     : 'Пометить как кандидата',
        paragraph_set_draft         : 'Пометить как черновик',
        paragraph_set_new           : 'Пометить как новый',
        paragraph_set_ready         : 'Пометить как готовый',
        paragraphs                  : 'Параграфы',
        paragraphs_found            : 'Параграфов найдено',
        paste                       : 'Вставить',
        previous                    : 'Предыдущий',
        project                     : 'Проект',
        project_debug               : 'Протестировать проект',
        project_export              : 'Экспорт проекта',
        project_export_do           : 'Экспортировать',
        project_export_actions      : 'Экспортировать действия',
        project_export_language     : 'Язык для экспорта',
        project_import              : 'Импорт проекта',
        project_import_docx         : 'Импорт проекта из DOCX',
        project_loaded              : 'Проект загружен',
        project_loading             : 'Загрузка проекта',
        project_name                : 'Название проекта',
        project_new                 : 'Новый Проект',
        project_new_wizard          : 'Мастер создания проекта',
        project_not_loaded          : 'Проект не загружен',
        project_open                : 'Открыть Проект',
        project_rename              : 'Переименовать проект',
        project_save                : 'Сохранить в файл',
        project_settings            : 'Настройки проекта',
        project_tags                : 'Метки проекта',
        
        raise                       : 'Поднять',
        ready                       : 'Готов к работе',
        recognition_repeat          : 'Повторить распознание',
        remove                      : 'Убрать',
        rename                      : 'Переименовать',
        
        script_add                  : 'Добавить скрипт',
        scripts                     : 'Скрипты',
        save                        : 'Сохранить',
        save_all                    : 'Сохранить Все',
        search                      : 'Поиск',
        search_actions              : 'В Действиях',
        search_case                 : 'Учитывать регистр',
        search_do                   : 'Найти',
        search_replace_all          : 'Заменить все',
        search_replace_do           : 'Заменить',
        search_replace_with         : 'Заменить на',
        search_result_block         : 'Содержимое найденного блока',
        search_scripts              : 'В Скриптах',
        search_texts                : 'В Текстах',
        search_what                 : 'Что искать',        
        settings                    : 'Настройки',
        settings_additional         : 'Дополнительные настройки',
        settings_prewrap            : 'Учитывать перенос строк и табуляцию',
        settings_prewrap_short      : 'Перенос строки',
        
        tag_add                     : 'Добавить метку',
        tag_delte                   : 'Удалить метку',
        tag_enter                   : 'Введите метку',
        tag_list                    : 'Список меток',
        tags                        : 'Метки',
        tags_all                    : 'Все метки',
        tags_not_found              : 'В этом проекте меток не обнаружено',
        text_add                    : 'Добавить текст',
        texts                       : 'Тексты',
        tools                       : 'Инструменты',
        translation                 : 'Перевод',
        translation_already_done    : 'Автоматический перевод уже применен для этого блока.',
        translation_auto            : 'Автоперевод',
        translation_human           : 'Адаптивный перевод',
        translation_machine         : 'Машинный перевод',
        
        untitled                    : 'Безымянный',
        
        welcome                     : 'Добро пожаловать!'
    };
    
    lang.eng = {

        about                       : 'About Captal',
        action_add                  : 'Add action',
        action_could_be_string      : 'Action could be a string',
        action_create               : 'Create action',
        action_mark                 : 'Action mark',
        action_markers_remove       : 'Remove action markers',
        actions                     : 'Actions',
        add                         : 'Add',
        
        atril_start                 : 'Starting Antril player',
        
        block                       : 'Block',
        block_action                : 'Action block',
        block_copy                  : 'Coppy current block',
        block_delete                : 'Delete block',
        block_delete_rules          : 'Select block to delete and repeate your action',
        block_down                  : 'Bring block down',
        block_handler               : 'New handler',
        block_indent                : 'Indent',
        block_not_selected          : 'Block not selected',
        block_outdent               : 'Outdent',
        block_raise                 : 'Bring block up',
        block_script                : 'Script block',
        block_specialchar           : 'Show special characters',
        block_text                  : 'Text block',
        block_wrap                  : 'Wrap text',
        
        cancel                      : 'Cancel',
        captal                      : 'Captal',
        close                       : 'Close',
        cloud_game_approve          : 'Approve',
        cloud_game_approved         : 'Game was approved',
        cloud_game_awaiting         : 'Game is pending for approval',
        cloud_game_ban              : 'Ban',
        cloud_game_banned           : 'Game was rejected',
        cloud_game_cant_open        : 'Can`t open game from cloud',
        cloud_game_cant_save        : 'Can`t save game to cloud',
        cloud_game_load             : 'Edit',
        cloud_game_mistake          : 'Non cloud game',
        cloud_game_not_found        : 'Game not found in cloud',
        cloud_game_publish          : 'Publish',
        cloud_game_reject           : 'Reject',
        cloud_game_rejected         : 'Game was rejected',
        cloud_game_saved            : 'Game saved',
        cloud_games                 : 'Cloud gamebooks',
        cloud_components            : 'Cloud components',
        cloud_unavailable           : 'Cloud unavailable',
        component                   : 'Component',
        component_add               : 'Add',
        component_description       : 'Component description',
        component_already_added     : 'This component was already added.',
        components                  : 'Components',
        copy                        : 'Copy',
        create                      : 'Create',
        
        data_loss_confirm           : 'All unsaved changes will be lost. Continue anyway?',
        delete                      : 'Delete',
        done                        : 'Done',
        
        edit                        : 'Edit',
        editor_maximize             : 'Hide project tree and navigator',
        encoding_wrong              : 'Wrong file encoding!',
        export_doc_writing          : 'Writing DOC file',
        
        file                        : 'File',
        file_encoding               : 'File encoding',
        file_loading                : 'Loading file',
        folder                      : 'Folder',
        folder_auto                 : 'Autofolder',
        folder_auto_undeletable     : 'Autofolders can`t be deleted!',
        folder_create               : 'Create folder',
        folder_delete_confirm       : 'All paragraphs from this folder will be deleded! Continue?',
        folder_icon_change          : 'Change icon',
        folder_icon_pick            : 'Choose icon',
        folder_icon_rules           : 'You can change icon for user folders only',
        folder_name_rules           : 'You can rename user folders only',
        folder_new                  : 'New folder',
        folder_settings             : 'Folder options',
        format_unsupported          : 'Unsupported format',
        formatting                  : 'Formatting',
        
        general                     : 'General',
        graph                       : 'Graph',
        go                          : 'Go',
        go_enter                    : 'Enter paragraph to go',
        
        handler_add                 : 'Add handler',
        handlers                    : 'Handlers',
        help                        : 'Help',
        help_forum                  : 'Discussion forum',
        help_index                  : 'Help index',
        help_manual                 : 'Manual',
        hide_coding_elements        : 'Hide coding elements',
        
        import                      : 'Import',
        
        label_enter                 : 'Enter label for this paragraph',
        label_set                   : 'Set label',
        language_original           : 'Original language',
        language_target             : 'Target language',
        links_external              : 'External links',
        loading                     : 'Loading',
        logic_do                    : 'Execute',
        logic_do_long               : 'DO execute script',
        logic_false                 : 'Visible IF NOT',
        logic_false_long            : 'Execute script when condition returns false',
        logic_global_long           : 'GLOBAL for the whole project',
        logic_goto                  : 'Go to',
        logic_goto_long             : 'GOTO перейти к параграфу',
        logic_true                  : 'Visible IF TRUE',
        logic_true_long             : 'Execute script when condition returns true',
        logic_type                  : 'Block name',
        lower                       : 'Lower',
        
        move                        : 'Move',
        
        naming_rules                : 'Suitable characters: latin, cyrillic, minus, underscore',
        navigator                   : 'Navigator',
        next                        : 'Next',
        
        ok                          : 'Ok',
        open                        : 'Open',
        open_in_editor              : 'Open in editor',
        original                    : 'Original',
        
        paragraph                   : 'Paragraph',
        paragraph_action_mark       : 'Paragraph and action definition',
        paragraph_translate_onopen  : 'Autotranslation on paragraph open',
        paragraph_copy              : 'Copy current paragraph',
        paragraph_close_all         : 'Close all',
        paragraph_close_current     : 'Close current',
        paragraph_close_other       : 'Close other',
        paragraph_delete_confirm    : 'Are you sure to delete paragraph {ID}?',
        paragraph_down              : 'Lower paragraph',
        paragraph_go                : 'Goto paragraph №',
        paragraph_inject            : 'Inject new paragraph',
        paragraph_is_end            : 'Is an ending',
        paragraph_label             : 'Set label',
        paragraph_linked            : 'New linked paragraph',
        paragraph_loading           : 'Loading paragraph',
        paragraph_mark              : 'Paragraph mark',
        paragraph_name_enter        : 'Enter new paragraph name',
        paragraph_not_found         : 'Paragraph not found',
        paragraph_not_selected      : 'Paragraph not selected',
        paragraph_new               : 'New paragraph',
        paragraph_raise             : 'Raise paragraph',
        paragraph_shuffle           : 'Shuffle paragraphs',
        paragraph_shuffle_confirm   : 'Are you sure to shuffle paragraphs?',
        paragraph_set_candidate     : 'Mark as candidate',
        paragraph_set_draft         : 'Mark as draft',
        paragraph_set_new           : 'Mark as new',
        paragraph_set_ready         : 'Mark as ready',
        paragraphs                  : 'Paragraphs',
        paragraphs_found            : 'Paragraphs found',
        paste                       : 'Paste',
        previous                    : 'Previous',
        project                     : 'Project',
        project_debug               : 'Test project',
        project_export              : 'Export project',
        project_export_do           : 'Export',
        project_export_actions      : 'Export actions as externals',
        project_export_language     : 'Language to export',
        project_import              : 'Import project',
        project_import_docx         : 'Import from DOCX',
        project_loaded              : 'Project loaded',
        project_loading             : 'Loading project',
        project_name                : 'Project name',
        project_new                 : 'New project',
        project_new_wizard          : 'New project wizard',
        project_not_loaded          : 'Project not loaded',
        project_open                : 'Open project',
        project_rename              : 'Rename project',
        project_save                : 'Save to file',
        project_settings            : 'Project settings',
        project_tags                : 'Project tags',
        
        raise                       : 'Raise',
        ready                       : 'Ready to work',
        recognition_repeat          : 'Repeat recognition',
        remove                      : 'Remove',
        rename                      : 'Rename',
        
        script_add                  : 'Add script',
        scripts                     : 'Scripts',
        save                        : 'Save',
        save_all                    : 'Save all',
        search                      : 'Search',
        search_actions              : 'In actions',
        search_case                 : 'Case sensitive',
        search_do                   : 'Find',
        search_replace_all          : 'Replace all',
        search_replace_do           : 'Replace',
        search_replace_with         : 'Replace with',
        search_result_block         : 'Block content',
        search_scripts              : 'In scripts',
        search_texts                : 'In texts',
        search_what                 : 'Search for',        
        settings                    : 'Settings',
        settings_additional         : 'Additional settings',
        settings_prewrap            : 'Keep new lines and tabs',
        settings_prewrap_short      : 'Text wrap',
        storage                     : 'Local Storage',
        storage_load                : 'Load from LocalStorage',
        storage_save                : 'Seve to LocalStorage',
        storage_saved               : 'Autosave..',
        storage_unsupported         : 'Local Storage is not supported by your browser',
        
        tag_add                     : 'Add tag',
        tag_delte                   : 'Delete tag',
        tag_enter                   : 'Enter tag',
        tag_list                    : 'List tags',
        tags                        : 'Tags',
        tags_all                    : 'All tags',
        tags_not_found              : 'There is no tags in this project yet',
        text_add                    : 'Add text',
        texts                       : 'Texts',
        tools                       : 'Tools',
        translation                 : 'Translation',
        translation_already_done    : 'Machine translation is already applied for this block.',
        translation_auto            : 'Autotranslation',
        translation_human           : 'Human translation',
        translation_machine         : 'Machine translation',
        
        untitled                    : 'Untitled',
        
        welcome                     : 'Welcome!',
        welcome_hide                : 'Don`t show on startup'
    };
    
    lang.rus = {

        about                       : 'О программе',
        action_add                  : 'Добавить действие',
        action_could_be_string      : 'Переход не всегда является числом',
        action_create               : 'Создать действие',
        action_mark                 : 'Признак действия',
        action_markers_remove       : 'Убирать маркеры перехода',
        actions                     : 'Действия',
        add                         : 'Добавить',
        
        atril_start                 : 'Запуск Antril плеера',
        
        block                       : 'Блок',
        block_action                : 'Блок действия',
        block_copy                  : 'Скопировать текущий блок',
        block_delete                : 'Удалить блок',
        block_delete_rules          : 'Выделите блок, подлежащий удалению и повторите операцию',
        block_down                  : 'Опустить блок',
        block_handler               : 'Новый обработчик',
        block_indent                : 'Отступ вправо',
        block_not_selected          : 'Блок не выбран',
        block_outdent               : 'Отступ влево',
        block_raise                 : 'Поднять блок',
        block_script                : 'Блок скрипта',
        block_specialchar           : 'Включить спецсимволы',
        block_text                  : 'Блок текста',
        block_wrap                  : 'Перенос текста',
        
        cancel                      : 'Отмена',
        captal                      : 'Каптал',
        close                       : 'Закрыть',
        cloud_game_approve          : 'Одобрить',
        cloud_game_approved         : 'Игра была утверждена',
        cloud_game_awaiting         : 'Игра ожидает рассмотрения',
        cloud_game_ban              : 'Запретить',
        cloud_game_banned           : 'Игра была отклонена',
        cloud_game_cant_open        : 'Не могу открыть игру из облака',
        cloud_game_cant_save        : 'Не могу сохранить игру в облаке',
        cloud_game_load             : 'Загрузить',
        cloud_game_mistake          : 'Игра не из облака',
        cloud_game_not_found        : 'Игра не найдена в облаке',
        cloud_game_publish          : 'Опубликовать',
        cloud_game_reject           : 'Отклонить',
        cloud_game_rejected         : 'Игра была отправлена на доработку',
        cloud_game_saved            : 'Игра сохранена',
        cloud_games                 : 'Облако книг-игр',
        cloud_components            : 'Облако компонентов',
        cloud_unavailable           : 'Облако не доступно',
        component                   : 'Компонент',
        component_add               : 'Подключить',
        component_description       : 'Описание компонента',
        component_already_added     : 'Этот компонент уже подключен к проекту.',
        components                  : 'Компоненты',
        copy                        : 'Скопировать',
        create                      : 'Создать',
        
        data_loss_confirm           : 'Все несохраненные изменения будут потеряны. Продолжить все равно?',
        delete                      : 'Удалить',
        done                        : 'Готово',
        
        edit                        : 'Редактировать',
        editor_maximize             : 'Скрыть дерево параграфов и навигатора',
        encoding_wrong              : 'Неправильная кодировка!',
        export_doc_writing          : 'Создаю DOC файл',
        
        file                        : 'Файл',
        file_encoding               : 'Кодировка файла',
        file_loading                : 'Загружаю файл',
        folder                      : 'Каталог',
        folder_auto                 : 'Автокаталог',
        folder_auto_undeletable     : 'Автокаталоги не могут быть удалены!',
        folder_create               : 'Создать каталог',
        folder_delete_confirm       : 'Все параграфы этого каталога будут удалены! Продолжить?',
        folder_icon_change          : 'Сменить иконку',
        folder_icon_pick            : 'Выберите иконку',
        folder_icon_rules           : 'Иконка может быть изменена только у пользовательского каталога',
        folder_name_rules           : 'Имя может быть изменено только у пользовательских каталогов',
        folder_new                  : 'Новый каталог',
        folder_settings             : 'Настройка каталога',
        format_unsupported          : 'Неизвестный формат',
        formatting                  : 'Форматирование',
        
        general                     : 'Общие',
        graph                       : 'Схема параграфов',
        go                          : 'Перейти',
        go_enter                    : 'Введите номер параграфа для перехода',
        
        handler_add                 : 'Добавить обработчик',
        handlers                    : 'Обработчики',
        help                        : 'Справочное руководство',
        help_forum                  : 'Форум обсуждения',
        help_index                  : 'Содержание',
        help_manual                 : 'Справка',
        hide_coding_elements        : 'Скрыть элементы программирования',
        
        import                      : 'Импорт',
        
        label_enter                 : 'Введите название ярлыка для этого параграфа',
        label_set                   : 'Установить ярлык',
        language_original           : 'Язык оригинала',
        language_target             : 'Язык проекта',
        links_external              : 'Переходы извне',
        loading                     : 'Думаю',
        logic_do                    : 'Выполнить',
        logic_do_long               : 'DO вызвать скрипт',
        logic_false                 : 'Виден если НЕ',
        logic_false_long            : 'IF FALSE срабатывает при невыполнении условия',
        logic_global_long           : 'GLOBAL для всего проекта',
        logic_goto                  : 'Переход к',
        logic_goto_long             : 'GOTO перейти к параграфу',
        logic_true                  : 'Виден если',
        logic_true_long             : 'IF TRUE срабатывает при выполнении условия',
        logic_type                  : 'Имя блока',
        lower                       : 'Опустить',
        
        move                        : 'Переместить',
        
        naming_rules                : 'Допустимые символы: латиница, кириллица, тире и подчеркивание',
        navigator                   : 'Навигатор',
        next                        : 'Следующий',
        
        ok                          : 'Ок',
        open                        : 'Открыть',
        open_from_file              : 'Открыть из файла',
        open_in_editor              : 'Открыть в редакторе',
        original                    : 'Оригинал',
        
        paragraph                   : 'Параграф',
        paragraph_action_mark       : 'Признаки параграфа и действия',
        paragraph_translate_onopen  : 'Автоматический перевод при открытии параграфа',
        paragraph_copy              : 'Скопировать текущий параграф',
        paragraph_close_all         : 'Закрыть все',
        paragraph_close_current     : 'Закрыть текущий',
        paragraph_close_other       : 'Закрыть другие',
        paragraph_delete_confirm    : 'Хотите удалить параграф {ID} с его содержимым?',
        paragraph_down              : 'Опустить параграф',
        paragraph_go                : 'Перейти к параграфу №',
        paragraph_inject            : 'Встроить Новый Параграф',
        paragraph_is_end            : 'Параграф является концовкой',
        paragraph_label             : 'Установить ярлык',
        paragraph_linked            : 'Новый Связанный Параграф',
        paragraph_loading           : 'Загрузка параграфа',
        paragraph_mark              : 'Признак параграфа',
        paragraph_name_enter        : 'Введите новое имя для этого параграфа',
        paragraph_not_found         : 'Параграф не найден',
        paragraph_not_selected      : 'Исходный параграф не выбран',
        paragraph_new               : 'Новый параграф',
        paragraph_raise             : 'Поднять параграф',
        paragraph_shuffle           : 'Перемешать параграфы',
        paragraph_shuffle_confirm   : 'Вы уверены, что хотите перемешать все параграфы?',
        paragraph_set_candidate     : 'Пометить как кандидата',
        paragraph_set_draft         : 'Пометить как черновик',
        paragraph_set_new           : 'Пометить как новый',
        paragraph_set_ready         : 'Пометить как готовый',
        paragraphs                  : 'Параграфы',
        paragraphs_found            : 'Параграфов найдено',
        paste                       : 'Вставить',
        previous                    : 'Предыдущий',
        project                     : 'Проект',
        project_debug               : 'Протестировать проект',
        project_export              : 'Экспорт проекта',
        project_export_do           : 'Экспортировать',
        project_export_actions      : 'Экспортировать действия отдельно',
        project_export_language     : 'Язык для экспорта',
        project_import              : 'Импорт проекта',
        project_import_docx         : 'Импорт проекта из DOCX',
        project_loaded              : 'Проект загружен',
        project_loading             : 'Загрузка проекта',
        project_name                : 'Название проекта',
        project_new                 : 'Новый Проект',
        project_new_wizard          : 'Мастер создания проекта',
        project_not_loaded          : 'Проект не загружен',
        project_open                : 'Открыть Проект',
        project_rename              : 'Переименовать проект',
        project_save                : 'Сохранить в файл',
        project_settings            : 'Настройки проекта',
        project_tags                : 'Метки проекта',
        
        raise                       : 'Поднять',
        ready                       : 'Готов к работе',
        recognition_repeat          : 'Повторить распознание',
        remove                      : 'Убрать',
        rename                      : 'Переименовать',
        
        script_add                  : 'Добавить скрипт',
        scripts                     : 'Скрипты',
        save                        : 'Сохранить',
        save_all                    : 'Сохранить Все',
        search                      : 'Поиск',
        search_actions              : 'В Действиях',
        search_case                 : 'Учитывать регистр',
        search_do                   : 'Найти',
        search_replace_all          : 'Заменить все',
        search_replace_do           : 'Заменить',
        search_replace_with         : 'Заменить на',
        search_result_block         : 'Содержимое найденного блока',
        search_scripts              : 'В Скриптах',
        search_texts                : 'В Текстах',
        search_what                 : 'Что искать',        
        settings                    : 'Настройки',
        settings_additional         : 'Дополнительные настройки',
        settings_prewrap            : 'Учитывать перенос строк и табуляцию',
        settings_prewrap_short      : 'Перенос строки',
        storage                     : 'Локальное хранилище',
        storage_load                : 'Загузить за хранилища',
        storage_save                : 'Сохранить в хранилище',
        storage_saved               : 'Автосохранение..',
        storage_unsupported         : 'Ваш браузер не поддерживает Локальное Хранилище',
        
        tag_add                     : 'Добавить метку',
        tag_delte                   : 'Удалить метку',
        tag_enter                   : 'Введите метку',
        tag_list                    : 'Список меток',
        tags                        : 'Метки',
        tags_all                    : 'Все метки',
        tags_not_found              : 'В этом проекте меток не обнаружено',
        text_add                    : 'Добавить текст',
        texts                       : 'Тексты',
        tools                       : 'Инструменты',
        translation                 : 'Перевод',
        translation_already_done    : 'Автоматический перевод уже применен для этого блока.',
        translation_auto            : 'Автоперевод',
        translation_human           : 'Адаптивный перевод',
        translation_machine         : 'Машинный перевод',
        
        untitled                    : 'Безымянный',
        
        welcome                     : 'Добро пожаловать!',
        welcome_hide                : 'Не показывать на старте'
    };
    
    lang.set = function(l){
        
        l = l || 'rus';
        
        lang.current = lang[l];
        lang.name    = l;
        lang.build(l);
        cookie.set('language', l );
    };
    
    lang.set( cookie.get('language') || 'rus' );
    

    ////////////////////////////////////////////////////////////////////////////
    //                              BLOCK
    ////////////////////////////////////////////////////////////////////////////

    block = {
        id : null,
        busy: false
    };        

    /**
     * Add block to current paragraph
     *
     * @param {} o - input object
     */
    block.add = function(o) { debug('block.add(...)');        
        
        //console.log('add',o)
        
        o.uid       = salt();
        o.mode      = '';   
        o.body      = o.body || '';
        o.logicTYPE = o.logicTYPE || '';
        //o.paragraph = o.paragraph || paragraph.current() || '0';
        
        var tmpl    = $('#block-wrapper-template')
                        //.clone()
                        .html()
                        .replace(/{LOGIC_TYPE}/ig,      o.logicTYPE)
                        .replace(/{LOGIC_GO}/ig,        o.logicGO)
                        .replace(/{LOGIC_TRUE}/ig,      o.logicTRUE)
                        .replace(/{LOGIC_FALSE}/ig,     o.logicFALSE)
                        .replace(/{LOGIC_DO}/ig,        o.logicDO)
                        .replace(/{LOGIC_GLOBAL}/ig,    o.logicGLOBAL ? 'checked' : '')
                        .replace(/{UID}/ig,             o.uid)
                        .replace(/{PARAGRAPH}/ig,       o.paragraph)
                        .replace(/{TAG}/ig,             o.tag)
                        .replace(/{LANG}/ig,            o.lang)
                        .replace(/{INTEXT}/ig,          o.intext);        

        $('#desk #tab-'+ o.paragraph +' #blk_'+ o.tag )
            .show()
            .append(tmpl);
        
        var el = document.getElementById(o.uid);
        var html = o.body.toString();//el.innerHTML;
        
        if (html.length > 0) {
            html = html
                    .replace(new RegExp('&lt;','g'), '<')
                    .replace(new RegExp('&gt;','g'), '>');
        }
        //console.log(el,o.uid, '#desk #tab-'+ o.paragraph +' #blk_'+ o.tag )
        var editor = ace.edit(el);
        editor.$blockScrolling = 'Infinity';
        editor.session.setOptions({
            
            useWorker: false,  // !!! remove to get warnings back
            useSoftTabs: false, 
            tabSize: 4
        });
        editor.getSession().setValue(html,1);
        editor.setTheme("ace/theme/textmate"); // alt: kuroir
        editor.setFontSize(12);
        editor.setAutoScrollEditorIntoView(true);
        editor.setOption("maxLines", 'Infinity');        
        editor.setShowInvisibles( cfg.showInvisibles );
        editor.setReadOnly( cfg.readonly );
        editor.getSession().setUseWrapMode(true); 
 
        editor.on('change',function(e,ui){ // resize translation metablocks
            
            //console.log(e,ui)
            
            if (e.data != undefined){
                          
                var parID       = paragraph.current(),
                    obj         = $(ui.container),
                    blkID       = $('#tab-'+parID+' #blk_text .ace_editor').index( obj ),                
                    translated  = obj.attr('captal-translated'),
                    editorID    = obj.attr('id'),
                    editor      = ace.edit(editorID),
                    body        = editor.getValue(),
                    curPos      = editor.getCursorPosition(),
                    left        = editor.session.getTextRange({ start: { row:0, column:0 }, end: { row: curPos.row, column: curPos.column } }),
                    right       = editor.session.getTextRange({ start: { row: curPos.row, column: curPos.column }, end: { row:999, column:999 }, }),
                    ind         = (left.match(/\#\d+/g) || []).length;

                if (translated) {                  

                    setTimeout(function(){

                        var obj    = $('#tab-'+paragraph.current()+' .ace_focus');
                        var height = obj.height();                                        
                        var parent = obj.offsetParent();

                        parent.find('.autotrans div').css('min-height',  height );
                        parent.find('.origtrans div').css('min-height',  height );

                    },1);
                }      

                setTimeout(function(){

                    block.addLinks();
                },1);

                setTimeout(function(){

                    block.parseActions();
                },1);


                // generate new linked paragraph 


                if (e.data.action == 'insertText' && (e.data.text == '#' || e.data.text == '№') ){


                    if (ind == 0) {
                        ind++;
                    }


                    if ((left.lastIndexOf('#') == left.length-1 || left.lastIndexOf('№') == left.length-1 ) && left.length > 0) {

                        var newID = paragraph.newID();

                        body = left.substr(0, left.length-1) +'#'+ newID + right.substr(1);
                        editor.setValue(body.toString());
                        editor.resize(true);
                        editor.clearSelection();
                        editor.moveCursorTo(curPos.row, curPos.column + (newID.toString().length-1));

                        return false;
                    }
                }


                if ([' ','!','?',':',',','.'].indexOf(e.data.text) >= 0) {

                    // language detect
                    lang.detect( ace.edit(block.current()).getValue(), gui.setFlag );

                    // spellcheck
                    block.spellcheck();   

                } else {

                    var allMarks = editor.session.getMarkers();

                    for (var i in allMarks) {

                        var tmark = allMarks[i];

                        if (tmark.clazz == 'ace_spellcheck') {

                            if (tmark.range.compare(curPos.row, curPos.column) == 0) {
                                // we are inside of the spellcheck misprint
                                block.spellcheck();
                                return;
                            }
                        }
                    }

                    if (e.data == 'removeText') {
                        block.spellcheck();
                    }
                }   
            
            }
        });
        editor.on('blur',function(e){ 
            
            var editorID = $(e.target.parentNode).attr('id');
            
            ace.edit(editorID).selection.clearSelection();
            
            debug('editor.blur('+editorID+')');
                      
            $('#'+editorID).addClass('ace_focus'); // prevent lost focus
            
            block.store(editorID); // save changes to data-source
        });        
        editor.on('focus',function(e, ui){
            
            var id    = $(ui.container).attr('id');
            var parID = $(ui.container).attr('captal-paragraph');
            var blkID = $('#tab-'+parID+' #blk_'+ o.tag +' .ace_editor').index( $('#'+id) );
            
            debug('focus gained:'+id+', '+parID+', '+blkID);            

            // remove focus from other blocks of this paragraph
            //$('#tab-'+ parID +' .ace_focus').not(':eq('+ blkID +')').removeClass('ace_focus');
            $('#tab-'+ parID +' .ace_focus').not('[id="'+o.uid+'"]').removeClass('ace_focus');
            $('#tab-'+ parID +' #blk_'+o.tag+' .ace_editor').eq(blkID).addClass('ace_focus');     
            
            // update navigator
            $('#nav').jstree(true).deselect_all();
            $('#nav').jstree(true).select_node( 'nav֍'+parID+'֍'+o.tag+'֍'+blkID , true);
        });

        // setup syntax hightlight
        switch (o.tag) {
            case 'script':
            case 'handler':
                    o.mode = "ace/mode/javascript";
                break;
            case 'text':
            case 'action':
                    o.mode = "ace/mode/html";
                break;
        }
        editor.getSession().setMode(o.mode);
        
        // update logic field hints visibility
        $('#'+o.uid).prev().find('input').each(function(index,e){
            
            gui.logicFieldUpdate( e, false );
        });
        
        // translation
        if (o.tag == 'text' && o.body.match(/[a..zа..я]+/ig) != null) {
            
            var blkID = $('#tab-'+o.paragraph+' #blk_'+o.tag+' .blk_editor').length-1;
            
            if (o.translated === 'true') {
                
                var tran = $('#data-source article#'+o.paragraph+' metadata text[type="auto"][target="'+blkID+'"]');
                var orig = $('#data-source article#'+o.paragraph+' metadata text[type="original"][target="'+blkID+'"]');
                var tranText = tran
                                .html()
                                .replace( /\<\!\[CDATA\[/i,'')
                                .replace( /&lt;\!\[CDATA\[/i,'')
                                .replace(']]>','')
                                .replace(']]&gt;','');
                var origText = orig
                                .html()
                                .replace( /\<\!\[CDATA\[/i,'')
                                .replace( /&lt;\!\[CDATA\[/i,'')
                                .replace(']]>','')
                                .replace(']]&gt;','');
                var tranLang = tran.attr('lang');
                var origLang = orig.attr('lang');
                
                $('#tab-'+o.paragraph+' #blk_text .blk_wrapper:eq('+blkID+') #subheader').show();

                $('#'+o.uid)
                    .css({
                            width: '36.5%',
                            float: 'left'
                        })
                    .attr('captal-translated', true)
                    .after('<div class="autotrans"><b>'+lang.current.translation_machine+': <img src="img/16/flag_'+tranLang+'.png"></b><div>'+ tranText +'</div>Переведено сервисом<br><a href="http://translate.yandex.ru/" target="_blank">«Яндекс.Переводчик»</a></div>\
                        <div class="origtrans"><b>'+lang.current.original+': <img src="img/16/flag_'+origLang+'.png"></b><div>'+ origText +'</div></div>');
                
                $('#tab-'+o.paragraph+' #blk_text .blk_wrapper:eq('+blkID+') img.lang-flag')
                            .css('float','none')
                            .appendTo( $('#tab-'+o.paragraph+' #blk_text .blk_wrapper:eq('+blkID+') #subheader') );
                
                editor.resize(true);
                
                setTimeout(function(){
                    
                    
                    var height = $('#'+o.uid).height();                                        
                    var parent = $('#'+o.uid).offsetParent();

                    parent.find('.autotrans div').css('min-height',  height );
                    parent.find('.origtrans div').css('min-height',  height ); 
                },1);

            } else if (cfg.autoTranslate) {

                block.translate(o.uid, o.paragraph, blkID);
            } 
        }
        
        // spellcheck
        if ((o.tag == 'text' || (o.tag == 'action' && o.intext == undefined) )&& o.body.match(/[a..zа..я]+/ig) != null) {
            block.spellcheck(o.uid);
        }
        
        // autolinks
        if (o.tag == 'text') {
            
            ace.define("hoverlink", [], function(require, exports, module) {
                "use strict";

                var oop = require("ace/lib/oop");
                var event = require("ace/lib/event");
                var Range = require("ace/range").Range;
                var EventEmitter = require("ace/lib/event_emitter").EventEmitter;

                var HoverLink = function(editor) {
                    if (editor.hoverLink)
                        return;
                    editor.hoverLink = this;
                    this.editor = editor;

                    this.update      = this.update.bind(this);
                    this.onMouseMove = this.onMouseMove.bind(this);
                    this.onMouseOut  = this.onMouseOut.bind(this);
                    this.onClick     = this.onClick.bind(this);
                    event.addListener(editor.renderer.scroller, "mousemove", this.onMouseMove);
                    event.addListener(editor.renderer.content,  "mouseout",  this.onMouseOut);
                    event.addListener(editor.renderer.content,  "click",     this.onClick);
                };

                (function(){
                    oop.implement(this, EventEmitter);

                    this.token = {};
                    this.range = new Range();

                    this.update = function() {
                        this.$timer = null;

                        var editor = this.editor;
                        var renderer = editor.renderer;

                        var canvasPos = renderer.scroller.getBoundingClientRect();
                        var offset = (this.x + renderer.scrollLeft - canvasPos.left - renderer.$padding) / renderer.characterWidth;
                        var row = Math.floor((this.y + renderer.scrollTop - canvasPos.top) / renderer.lineHeight);
                        var col = Math.round(offset);

                        var screenPos = {row: row, column: col, side: offset - col > 0 ? 1 : -1};
                        var session = editor.session;
                        var docPos = session.screenToDocumentPosition(screenPos.row, screenPos.column);

                        var selectionRange = editor.selection.getRange();
                        if (!selectionRange.isEmpty()) {
                            if (selectionRange.start.row <= row && selectionRange.end.row >= row)
                                return this.clear();
                        }

                        var line = editor.session.getLine(docPos.row);
                        if (docPos.column == line.length) {
                            var clippedPos = editor.session.documentToScreenPosition(docPos.row, docPos.column);
                            if (clippedPos.column != screenPos.column) {
                                return this.clear();
                            }
                        }

                        var token = this.findLink(docPos.row, docPos.column);
                        this.link = token;
                        if (!token) {
                            return this.clear();
                        }
                        this.isOpen = true
                        editor.renderer.setCursorStyle("pointer");

                        session.removeMarker(this.marker);

                        this.range =  new Range(token.row, token.start, token.row, token.start + token.value.length);
                        this.marker = session.addMarker(this.range, "ace_action", "text", true);
                    };

                    this.clear = function() {
                        if (this.isOpen) {
                            this.editor.session.removeMarker(this.marker);
                            this.editor.renderer.setCursorStyle("");
                            this.isOpen = false;
                        }
                    };

                    this.getMatchAround = function(regExp, string, col) {
                        var match;
                        regExp.lastIndex = 0;
                        string.replace(regExp, function(str) {
                            var offset = arguments[arguments.length-2];
                            var length = str.length;
                            if (offset <= col && offset + length >= col)
                                match = {
                                    start: offset,
                                    value: str
                                };
                        });

                        return match;
                    };

                    this.onClick = function() {
                        if (this.link) {
                            this.link.editor = this.editor;
                            this._signal("open", this.link);
                            this.clear();
                        }
                    };

                    this.findLink = function(row, column) {
                        var editor = this.editor;
                        var session = editor.session;
                        var line = session.getLine(row);

                        var match = this.getMatchAround(/\#\d+\b/g, line, column);
                        if (!match)
                            return;

                        match.row = row;
                        return match;
                    };

                    this.onMouseMove = function(e) {
                        if (this.editor.$mouseHandler.isMousePressed) {
                            if (!this.editor.selection.isEmpty())
                                this.clear();
                            return;
                        }
                        this.x = e.clientX;
                        this.y = e.clientY;
                        this.update();
                    };

                    this.onMouseOut = function(e) {
                        this.clear();
                    };

                    this.destroy = function() {
                        this.onMouseOut();
                        event.removeListener(this.editor.renderer.scroller, "mousemove", this.onMouseMove);
                        event.removeListener(this.editor.renderer.content, "mouseout", this.onMouseOut);
                        delete this.editor.hoverLink;
                    };

                }).call(HoverLink.prototype);

                exports.HoverLink = HoverLink;

            });

            HoverLink = ace.require("hoverlink").HoverLink;
            editor.hoverLink = new HoverLink(editor);
            editor.hoverLink.on("open", function(e,o) {
                
                var pos = o.editor.getCursorPosition();

                if ( $('#desk .ace_action').length > 0) {

                    paragraph.open({ paragraphID: e.value.substr(1) });
                    
                    // fix misclicking bug
                    /*
                    if ( 
                        pos.column >= e.start && 
                        pos.column < (e.start + e.value.length) && 
                        pos.row == e.row  ) {
                        
                        paragraph.open({ paragraphID: e.value.substr(1) });
                    }
                    */    
                }
            });
        }
        
        if (o.intext == undefined || o.tag != 'action') {
            
            $('#'+o.uid).removeAttr('captal-intext');
        }
        
        if (typeof o.callback == 'function'){
            
            o.callback();
        }
        
        return o.uid;
    };
    
    block.addLinks = function(o){ debug('block.addLinks()');        
        return;//disabled
        block.removeLinks(o);
        
        //$('#desk .ui-tabs-panel[aria-hidden="false"] #blk_text .ace_editor').each(function(index){
        $('#tab-'+paragraph.current()+' #blk_text .ace_editor').each(function(index){
            
            var editorID = $(this).attr('id'),
                lines    = $('#'+editorID+' .ace_text'),
                itext    = lines.text(),
                links    = itext.match(/\#\d+/g),
                ulinks   = [],
                line,
                str,
                link,
                wrapped;                                

            // make links unique
            for (var ti in links){
                if (ulinks.indexOf(links[ti]) == -1) {
                    ulinks.push(links[ti]);
                }
            }

            // third approach, combine autoreplacement with manual
            lines.each(function(index){
                var caret = 0;
                line = $(this);
                str  = line.text();

                for (var ti in ulinks){
                    link    = ulinks[ti];                    
                    wrapped = '<div class="autolink">'+link+'</div>';                                
                    caret   = str.indexOf(link,caret+1); // move caret                
                    str = str.replace(new RegExp(link,'g'), function(p0,p1){
                        var prevCh = str.charCodeAt(p1-1);                    
                        var nextCh = str.charCodeAt(p1+link.length);

                        // check near character to be non numeric
                        if ( (prevCh < 48 || prevCh > 57 || isNaN(prevCh)) && (nextCh < 48 || nextCh > 57 || isNaN(nextCh) ) ) {
                            return wrapped;
                        } else {
                            return p0; // replace with itself, leave as it was
                        }
                    });                
                }      
                line.html( str );

                if (index == lines.length-1) {

                    $('#'+editorID+' .autolink').each(function(){

                        var div = document.createElement('div');
                        var lpos = $(this).position();
                        var boff = $('#'+editorID).offset();
                        var bpos = $('#'+editorID).position();                
                        var link = $(this).html();

                        $(div)
                            .html( link )
                            .addClass('autolink-helper')
                            .css({
                                top : lpos.top - 4,
                                left: lpos.left + 49
                            })
                            .click(function(e){
                                // left click
                                if (e.which == 1) {                                                        
                                    block.removeLinks();
                                    paragraph.open({ paragraphID: $(this).html().substr(1), currentParagraphID: paragraph.current() });
                                }                        
                                return false;
                            })/*
                            .contextmenu(function(e){ // right click                                                
                                var pos = $(this).offset();
                                gui.autolinkMenuTarget = $(this).html();
                                $('#mnuAutolink')                                
                                    .show()
                                    .css({
                                        position: 'absolute',
                                        'z-index': '110',
                                        left: pos.left + 10,  // pos.left + 10
                                        top: pos.top + 23     // pos.top + 23              
                                    });                        
                                return false;
                            });    */                                

                        //$('#tab-'+paragraph.current()).prepend(div);
                        $('#'+ editorID ).prepend(div);
                    });
                }
            });
        });
    };
    
    /**
     * Convert numbers to hyperlinks in editor
     * @returns {undefined}
     */   
    block.addLinksOLD = function(){ debug('block.addLinks()');
        
        var editorID = $('#desk .ui-tabs-panel[aria-hidden="false"] .ace_focus').attr('id'),
            lines    = $('#'+editorID+' .ace_text'),
            itext    = lines.text(),
            links    = itext.match(/\d+/g),
            ulinks   = [],
            line,
            str,
            link,
            wrapped;                                
             
        // make links unique
        for (var ti in links){
            if (ulinks.indexOf(links[ti]) == -1) {
                ulinks.push(links[ti]);
            }
        }
        
        // third approach, combine autoreplacement with manual
        lines.each(function(index){
            var caret = 0;
            line = $(this);
            str  = line.text();
            
            for (var ti in ulinks){
                link    = ulinks[ti];                    
                wrapped = '<div class="autolink">'+link+'</div>';                                
                caret   = str.indexOf(link,caret+1); // move caret                
                str = str.replace(new RegExp(link,'g'), function(p0,p1){
                    var prevCh = str.charCodeAt(p1-1);                    
                    var nextCh = str.charCodeAt(p1+link.length);
                    
                    // check near character to be non numeric
                    if ( (prevCh < 48 || prevCh > 57 || isNaN(prevCh)) && (nextCh < 48 || nextCh > 57 || isNaN(nextCh) ) ) {
                        return wrapped;
                    } else {
                        return p0; // replace with itself, leave as it was
                    }
                });                
            }      
            line.html( str );
            
            if (index == lines.length-1) {
                
                $('#'+editorID+' .autolink').each(function(){
                
                    var div = document.createElement('div');
                    var lpos = $(this).position();
                    var boff = $('#'+editorID).offset();
                    var bpos = $('#'+editorID).position();                
                    var link = $(this).html();

                    $(div)
                        .html( link )
                        .addClass('autolink-helper')
                        .css({
                            top : lpos.top - 4,
                            left: lpos.left + 49
                        })
                        .click(function(e){
                            // left click
                            if (e.which == 1) {                                                        
                                block.removeLinks();
                                paragraph.open({ paragraphID: $(this).html(), currentParagraphID: paragraph.current() });
                            }                        
                            return false;
                        })
                        .contextmenu(function(e){ // right click                                                
                            var pos = $(this).offset();
                            gui.autolinkMenuTarget = $(this).html();
                            $('#mnuAutolink')                                
                                .show()
                                .css({
                                    position: 'absolute',
                                    'z-index': '110',
                                    left: pos.left + 10,
                                    top: pos.top + 23                                   
                                });                        
                            return false;
                        });                                    

                    //$('#tab-'+paragraph.current()).prepend(div);
                    $('#'+ editorID ).prepend(div);
                });
            }
        });
    };
    
    block.copy = function(){ 
        
        var parID    = paragraph.current(),
            editorID = $('#tab-'+parID+' .ace_focus').attr('id'),
            tag      = $('#tab-'+parID+' .ace_focus').attr('captal-tag'),
            blkID    = $('#tab-'+parID+' #blk_'+ tag +' .ace_editor').index( $('#'+editorID) );
        
        debug('block.copy('+parID+', '+tag+', '+blkID+')');
        
        // push paragraph to buffer
        $('#copy-buffer')
                .attr('type', 'block')
                .html( 
                    $('#data-source article#'+parID+' '+tag+':eq('+blkID+')')
                        .clone()
                );
    };
    
    /**
     * Add new block to current paragraph
     *
     * @param could be tag string or object
     */
    block.create = function(o, callback){ debug('block.create('+o.tag+')');
                    
        //console.log('create',o)
        
        o.paragraph   = o.paragraph   || paragraph.current(),
        o.body        = o.body        || '',
        o.logicGO     = o.logicGO     || '',
        o.logicDO     = o.logicDO     || '',
        o.logicTRUE   = o.logicTRUE   || '',
        o.logicFALSE  = o.logicFALSE  || '',
        o.logicGLOBAL = o.logicGLOBAL || '',
        o.logicTYPE   = o.logicTYPE   || '';
        o.intext      = (o.intext != undefined) ? o.intext.toString() : '';

        //var blkID     = $('#desk .ui-tabs-panel[aria-hidden="false"] .ace_editor').length;
        var blkTypeN  = $('#desk .ui-tabs-panel[aria-hidden="false"] #blk_'+ o.tag +' .ace_editor').length;
      
        // new node in data-source
        if (o.tag == 'handler') {
           
            $('#data-source handlers').append('<'+o.tag+' name="'+ o.paragraph +'"></'+o.tag+'>');
            
        } else {
            // if article
            var obj = $('<'+o.tag+'/>')
                            .html( '&lt;![CDATA[' + o.body + ']]&gt;' )
                            .appendTo( $('#data-source article#'+ o.paragraph) );
                    
            if (o.logicTRUE)   { obj.attr('if',      o.logicTRUE    ); }
            if (o.logicFALSE)  { obj.attr('ifnot',   o.logicFALSE   ); }
            if (o.logicDO)     { obj.attr('do',      o.logicDO      ); }
            if (o.logicGLOBAL) { obj.attr('isglobal',o.logicGLOBAL  ); }
            if (o.logicTYPE)   { obj.attr('type',    o.logicTYPE    ); }
            if (o.logicGO)     { obj.attr('goto',    o.logicGO      ); }
            if (o.intext)      { obj.attr('intext',  o.intext       ); }
        }    

        // add block
        var editorID = block.add({            
            tag         : o.tag,
            body        : o.body,
            paragraph   : o.paragraph,
            logicGO     : o.logicGO,
            logicDO     : o.logicDO,
            logicTRUE   : o.logicTRUE,
            logicFALSE  : o.logicFALSE,
            logicGLOBAL : o.logicGLOBAL,
            logicTYPE   : o.logicTYPE,
            intext      : o.intext
        });
        
        // update navigator
        var nav        = $('#nav').jstree(true);
        nav.create_node( 'nav-'+ o.tag , { 
            type    : o.tag, 
            id      : 'nav֍'+ o.paragraph +'֍'+ o.tag +'֍'+ blkTypeN, 
            text    : (blkTypeN+1) 
        });
        
        if (!o.nofocus) {
            block.show( o.paragraph, o.tag, blkTypeN );
        }
        
        if (typeof callback == 'function'){
            
            callback( editorID );
        }
    };
    
    block.current = function(){
        
        return $('#desk [aria-hidden="false"] .ace_focus').attr('id');
    };
    
    /**
     *
     * @param {} obj
     */
    block.delete = function(o){ debug('block.delete()');
        
        var nav = $('#nav').jstree(true);        
        if (!nav) { error(lang.current.project_not_loaded); return; }

        var node = nav.get_node(o.blkID || nav.get_selected()[0]);        
        if (!node) {             
            error(lang.current.block_not_selected);
            log(lang.current.block_delete_rules); 
            return; 
        }       
        
        if (o.noconfirm || confirm(lang.current.block_delete +' '+node.text+'?')){   
            
            var data    = node.id.split('֍');
            var parID   = data[1];
            var tag     = data[2];
            var blkID   = data[3];
            var obj     = $('#tab-'+ parID +' #blk_'+ tag +' .blk_wrapper:eq('+ blkID +')');                        
            
            if ( node.type == 'handler') {
                // handler
                $('#data-source handler[id='+node.text+']').remove();
                
            } else {
                // article
                $('#data-source article#'+ parID +' '+tag+':eq('+ blkID +')').remove();      
                
                // удалить метаблоки перевода
                $('#data-source article#'+ parID+' metadata text[target="'+blkID+'"]').remove();                                
                
                // if no more blocks in group hide group header
                if ( $('#data-source article#'+parID+' '+tag).length == 0 ) {
                    $('#tab-'+parID+' #blk_'+tag).hide();
                }
                
                // if action deleted update states
                paragraph.state(parID,'refresh'); // self
                paragraph.state(obj.find('#logicGO').val(),'refresh'); // target
            }                        
            
            // убрать блок из редактора             
            obj.remove();

            nav.delete_node(node);  
            
            // refresh navigator node id's
            // @FIXME overkill
            paragraph.show(parID);
            
            // if it was last block create text
            if ( $('#data-source article#'+parID).html().trim() == '' ) {
                //$('#data-source article#'+paragraph.id).append('<text id="'+getRandomName('text')+'"></text>');
                block.create({ tag: 'text' });
                //paragraph.open(paragraph.id);
            }  
        }
    };
    
    block.indent = function(){
        var editor = ace.edit( block.current() );
        editor.indent();
    };        
    
    block.move = function(e){ debug('block.move('+e+')');
        
        // this will change block index
        return; // disabled
        
        var parID       = paragraph.current();
        var blk         = $('#tab-'+parID+' .ace_focus');
        var blk_header  = blk.prev();
        var tag         = blk.attr('tag');        
        var tree        = $('#nav').jstree(true);
        var node        = tree.get_node('nav֍'+parID+'֍'+ tag + '********************' );
        var source      = $('#data-source '+node.type+'[id="'+node.text+'"]');

        if (e == 'up' && $('#'+node.id).index() > 0) {
            // update editor
            //$(blk.prevAll('#tab-'+parID+' #blk_'+tag+' .blk_header')[1]).before( blk_header );
            $(blk.prevAll('.blk_header')[1]).before( blk_header );
            blk_header.after(blk);
            
            // update data-source
            source.prev().before( source );
            
            // update nav tree
            tree.move_node(
                    node.id,
                    node.parent, 
                    $('#'+node.id).index()-1
            );
            
        } else if (e == 'down') {

            $(blk.nextAll('.blk_editor')[0]).after( blk_header );
            blk_header.after(blk);
            
            // update data-source
            source.next().after( source );
            
            // update nav tree
            tree.move_node(
                    node.id,
                    node.parent, 
                    $('#'+node.id).index()+2
            );
        }
    };
    
    block.outdent = function(){
        var editor = ace.edit( block.current() );
        editor.blockOutdent();
    };
    
    block.parseActions = function(){
        
        var parID    = paragraph.current(), 
            editorID = block.current(),
            //blkID    = $('#tab-'+parID+' #blk_text .ace_editor').index( $('#'+ editorID) ), 
            editor   = ace.edit(editorID),
            body     = editor.getValue(),
            acts     = body.match(/\#\d+\b/g),
            //lastAct  = $('#data-source article#'+parID+' action').length -1,
            c        = -1;
    
        // update intext and delete removed
        $('#data-source article#'+parID+' action[intext]').each(function(index){
            
            var targetID = $(this).attr('goto');
            
            // check for intext index change
            if ( acts == null ){
                
                // removed, delete block
                var blkID     = 'nav֍'+ parID +'֍action֍'+ index,
                    targetPar = $('#data-source article#'+targetID),
                    noconfirm = true;

                // if ex-target paragraph empty, delete it
                if ( targetPar.find('script').length == 0 && 
                        targetPar.find('action').length == 0 && 
                        targetPar.find('text').html() == '' ) {

                    paragraph.delete(targetID, noconfirm);
                }

                block.delete({ blkID: blkID, noconfirm: true});
                
            } else if ( acts[ $(this).attr('intext') ] != '#'+targetID){

                var ind = acts.indexOf( '#'+targetID );
                
                if (ind != -1) {
                    
                    // index changed, update
                    $(this).attr('intext', ind);
                    
                } else {
                    
                    // removed, delete block
                    var blkID     = 'nav֍'+ parID +'֍action֍'+ index,
                        targetPar = $('#data-source article#'+targetID),
                        noconfirm = true;

                    // if ex-target paragraph empty, delete it
                    if ( targetPar.find('script').length == 0 && 
                            targetPar.find('action').length == 0 && 
                            targetPar.find('text').html() == '' ) {

                        paragraph.delete(targetID, noconfirm);
                    }

                    block.delete({ blkID: blkID, noconfirm: true});
                }
            }
            
        });
   
        // update action text create new actions
        for (var i in acts){
            
            var tact    = acts[i].substr(1),
                actDOM  = $('#data-source article#'+parID+' action[intext][goto="'+tact+'"]'),
                braces  = body.match( /{([^{}]*)}/g ),// look for {..}
                actText = tact;
            
            c++;    
        
            // do not take {} with multiple #: {.. #1 .. #2 .. #3}
            if (braces != null) {
                braces = braces.filter(function(item, a, b){ 
                    
                    var t = item.match(/\#\d+\b/g);
                    
                    if (t == null) return false;
                    
                    return ( t.length == 1) ? true : false;
                });
            };

            for (var b in braces){

                if (braces[b].match( new RegExp( '\#'+tact+'\\b' ,'g')) != null) {

                    actText = braces[b]
                                .replace( new RegExp('[{}#]','g'), '' ) ;
                } 
            }
            
            // if action not exist create it
            if (actDOM.length == 0) {

                block.create({
                        tag     : 'action', 
                        logicGO : tact ,
                        body    : actText,
                        intext  : c,
                        nofocus : true
                    }, function(actEditorID){

                        var obj = $('#tab-'+parID+' #blk_action .blk_wrapper:has("#'+actEditorID+'") #logicGO')[0];
            
                        gui.logicFieldUpdate(obj, false);

                        paragraph.new({
                            paragraphID: tact,
                            background: true,
                            callback: function(){
                                //
                            }
                        });
                        
                    }
                );
                
            } else {
                
                if ( actDOM.html().replace('&lt;![CDATA[','').replace(']]&gt;','') != actText ) {
                    
                    actDOM.html( '&lt;![CDATA[' + actText + ']]&gt;' );
                    
                    // find action editor
                    var actEditorID = $('#tab-'+parID+' #blk_action .ace_editor[captal-intext][captal-goto="'+tact+'"]').attr('id');
                    
                    //console.log('-->',tact,actEditorID)
                    
                    var actEditor   = ace.edit(actEditorID);
                    
                    actEditor.setValue( actText, 1 );
                    actEditor.resize(true);
                }
            }
        }
       
        
        // sort actions according to "intext" attribute
        var unsorted = $('#data-source article#'+parID+' action[intext]'),
            sorted   = unsorted.clone()
                        .map(function(index, item){ $(this).attr('oldindex', index ); return this; })
                        .sort(function(a,b){ return $(a).attr('intext') - $(b).attr('intext'); }),
            editors  = $('#tab-'+parID+' #blk_action .blk_wrapper').clone();
        
        if ( sorted.last().attr('intext') != unsorted.last().attr('intext') ) {    
            
            $('#data-source article#'+parID+' action[intext]').remove();
            $('#tab-'+parID+' #blk_action .blk_wrapper:has(.ace_editor[captal-intext])').remove();
            
            $(sorted).each(function(index){
                
                var oldIndex = $(this).attr('oldindex'),
                    nav      = $('#nav').jstree(true),
                    nodeID   = 'nav֍'+ parID +'֍action֍'+ oldIndex,
                    newID    = 'nav֍'+ parID +'֍action֍'+ index,
                    node     = nav.get_node(nodeID);
                
                // move action in editor
                if (editors.length > 0) {
                    
                    //console.log( editors[oldIndex] );
                    $(editors[oldIndex])
                        .appendTo('#tab-'+parID+' #blk_action');
                }
                
                // move action in data-source
                $(this)
                    .appendTo('#data-source article#'+parID)
                    .removeAttr('oldindex');
                
            });
            
            // update navigator
            gui.nav.build(parID);
        } 
    };
    
    block.paste = function(){
        
        if ( $('#copy-buffer').attr('type') == 'block' ){
            
            var srcBlk = $('#copy-buffer').html(),
                parID  = paragraph.current(),
                tag    = $(srcBlk).prop('tagName').toLowerCase()
                //newBlk = ($('#data-source article#'+parID+' '+tag).length > 0) ? $(srcBlk).insertAfter( $('#data-source article#'+parID+' '+tag).last() ) : $(srcBlk).appendTo( $('#data-source article#'+parID) );

            debug('block.paste(..)');            

            // add block to editor
            block.create({
                
                paragraph   : parID,
                tag         : tag,
                lang        : $(srcBlk).attr('lang'),
                body        : $(srcBlk).html()
                                       .replace('&lt;![CDATA[','')
                                       .replace(']]&gt;','')|| '',
                logicTYPE   : $(srcBlk).attr('type')        || '',
                logicDO     : $(srcBlk).attr('do')          || '',
                logicTRUE   : $(srcBlk).attr('if')          || '', 
                logicFALSE  : $(srcBlk).attr('ifnot')       || '',
                logicGLOBAL : $(srcBlk).attr('isglobal')    || '',
                logicGO     : $(srcBlk).attr('goto')        || ''
            });

        }
    };
    
    block.removeLinks = function(){ 
        $('.autolink').each(function(){
            var html = $(this).html();
            $(this).replaceWith( html );
        });
        $('#desk .autolink-helper').remove();
        $('#mnuAutolink').hide();
        gui.autolinkMenuTarget = null;
    };
    
    block.rename = function(e){
        
        //deprecated
        
        var parID   = paragraph.current();
        var oldName = $('#tab-'+parID+' #'+block.id).attr('captal-id');
        var newName = prompt("Please enter new block name", oldName);            

        if (newName != null) {
            var obj = $('#tab-'+parID+' #'+block.id);
            var tag = obj.attr('captal-tag');
            var nav = obj.attr('captal-nav');

            obj.prev('.blk_header').html(newName+':');      // rename header          
            obj.attr('captal-id', newName);                 // rename attribute
            $('#nav').jstree(true).set_text(nav, newName ); // rename navigator node

            // update data-source
            if (tag == 'handler') {      
                //debug('handler[name='+paragraph.id+']')
                $('#data-source handler[name='+parID+'][id="'+ oldName +'"]').attr('id', newName);
            } else {
                $('#data-source article#'+parID+' '+tag+'[id="'+ oldName +'"]').attr('td', newName);
            }
        }
    };
    
    /**
     * Scroll to block
     */
    block.show = function(parID, tag, blkID) { debug('block.show('+parID+', '+tag+', '+blkID+')');
        
        if ($('#tab-'+parID).length  == 0) {
                
            // paragraph is closed yet, open
            //parID, curParID, callback
            paragraph.open({ paragraphID: parID, currentParagraphID: parID, blockID: blkID, callback: function(){
    
                //var editor = ace.edit( $('#tab-'+parID+' .ace_focus').attr('id') );                
                //editor.blur();                
                //block.show(parID, tag, blkID);                
            }});            
            
        } else {
        
            // paragraph is opened                                                 
            var uid     = $('#tab-'+ parID +' #blk_'+tag+' .blk_editor:eq('+ blkID +')').attr('id');
            var pos     = $('#'+uid).offsetParent().position().top;
            
            // prevent ace from blinking in inactive editor
            if ( $('#tab-'+parID+' .ace_focus').length > 0 ) {
            
                var editor = ace.edit( $('#tab-'+parID+' .ace_focus').attr('id') );
                editor.renderer.$cursorLayer.hideCursor();
            }
            

            // show tab
            gui.showTab(parID);           

            // focus target block
            $('#tab-'+parID).scrollTop( pos );                            
            ace.edit( uid ).focus();
            //$('#'+uid).trigger('click');
        }
    };
    
    block.showInvisibles = function(){
        cfg.showInvisibles = !cfg.showInvisibles;
        
        $('.ace_editor').each(function(){
            var editor = ace.edit( $(this).attr('id') );
            editor.setShowInvisibles( cfg.showInvisibles );            
        });
    };
    
    block.spellcheck = function(editorID){ debug('block.spellcheck()');

        editorID = editorID || block.current();
        
        var Range  = ace.require("ace/range").Range,
            editor = ace.edit(editorID),
            input  = editor.getValue(),
            parID  = $('#'+editorID).attr('captal-paragraph'),
            tlang  = $('#tab-'+parID+' .blk_wrapper:has(#'+editorID+') .blk_header .lang-flag').attr('lang');
        
        $.ajax({
            url: 'http://speller.yandex.net/services/spellservice.json/checkText',
            method: 'POST',
            data: {
                text    : input,
                lang    : tlang !== 'undefined' ? tlang : 'rus',
                format  : 'html',
                options : 0
            },
            success: function(res){
                
                // clear markers
                var markers   = editor.session.getMarkers(),
                    cursorPos = editor.getCursorPosition(), //store position
                    selection = editor.getSelectionRange(); // store selection

                for (var i in markers){
                    
                    if (markers[i].clazz == 'ace_spellcheck'){
                        editor.session.removeMarker( markers[i].id );
                    }
                }
                
                for (var i in res){
                    
                    var row = res[i],
                        pos = editor.find(row.word);

                    var r = new Range(); // Creates a range with undefined values.
                    r.start = editor.session.doc.createAnchor(pos.start.row, pos.start.column);
                    r.end   = editor.session.doc.createAnchor(pos.end.row, pos.end.column);
                    
                    editor.session.addMarker(r,"ace_spellcheck");                    
                }                 
                editor.selection.setSelectionRange(selection, false);
                editor.moveCursorToPosition(cursorPos);                
            }
        });
    };
    
    /**
     * Store current block to data-source
     * 
     * @param {type} o description
     */
    block.store = function(editorID){ debug('block.store('+ editorID +')');
        
        if (editorID == undefined) return;       
        
        var obj         = $('#'+editorID);
        var parID       = obj.attr('captal-paragraph');        
        var tag         = obj.attr('captal-tag');
        var index       = $('#tab-'+parID+' #blk_'+tag+' .blk_editor').index(obj);
        var fields      = obj.prev();
        var logicTRUE   = fields.find('#logicTRUE').val();
        var logicFALSE  = fields.find('#logicFALSE').val();
        var logicGO     = fields.find('#logicGO').val();        
        var logicDO     = fields.find('#logicDO').val();
        var logicGLOBAL = fields.find('#logicGLOBAL').prop('checked');
        var logicTYPE   = fields.find('#logicTYPE').val();
        var editor      = ace.edit( editorID );
        var source      = editor.getValue();  
        var logicGObak  = obj.attr('captal-goto'); // keep previous value

        obj
            .attr('captal-if',      logicTRUE)
            .attr('captal-ifnot',   logicFALSE)
            .attr('captal-goto',    logicGO)
            .attr('captal-do',      logicDO)
            .attr('captal-isblobal',logicGLOBAL)
            .attr('captal-type',    logicTYPE);

        if (tag == 'handler') {
            
            $('#data-source handlers [name='+ parID +']:eq('+index+')')
                .html( '&lt;![CDATA[' + source + ']]&gt;' );
        
        } else {
            
            var dsObj = $('#data-source article#'+ parID +' '+tag +':eq('+index+')');
            
            dsObj
                .html( '&lt;![CDATA[' + source + ']]&gt;' );
        
            if (logicTRUE)   { dsObj.attr('if',       logicTRUE);   } else { dsObj.removeAttr('if');       };
            if (logicFALSE)  { dsObj.attr('ifnot',    logicFALSE);  } else { dsObj.removeAttr('ifnot');    };
            if (logicDO)     { dsObj.attr('do',       logicDO);     } else { dsObj.removeAttr('do');       };
            if (logicGLOBAL) { dsObj.attr('isglobal', logicGLOBAL); } else { dsObj.removeAttr('isglobal'); };
            if (logicTYPE)   { dsObj.attr('type',     logicTYPE);   } else { dsObj.removeAttr('type');     };
            if (logicGO)     { dsObj.attr('goto',     logicGO);     } else { dsObj.removeAttr('goto');     };
        }
        
        // goto field affect connection status, update        
        var tree = $('#toc').jstree(true);
        
        // update old target
        //        
        if (logicGObak != '') {  

            //tree.set_type( logicGObak, 'paragraph_'+paragraph.state(logicGObak)+'_'+paragraph.linkState(logicGObak) );
            
            paragraph.state(logicGObak,'refresh');
        }        
        
        // update new target
        //        
        if (logicGO != '') {    
            
            //tree.set_type( logicGO, 'paragraph_'+paragraph.state(logicGO)+'_'+paragraph.linkState(logicGO) ); 
            paragraph.state(logicGO,'refresh');
        }
        
        // update own link status
        //        
        //tree.set_type( parID, 'paragraph_'+paragraph.state(parID)+'_'+paragraph.linkState(parID) );   
        paragraph.state(parID,'refresh');
        
        // update language 
        if ( (tag == 'text' || tag == 'action') && cfg.detectLang ) {
            
            lang.detect(source, gui.setFlag );
        }
    };   
    
    block.translate = function(editorID, parID, blkID){ debug('block.translate('+editorID+', '+parID+', '+blkID+')');

        var current = false;    
        
        if (typeof editorID == 'object' || editorID == undefined ){
            
            editorID = $('#desk .ui-tabs-panel[aria-hidden="false"] #blk_text div.ace_focus').attr('id'); // will ignore everything other than text block
            current = true;
        }
                
        parID    = parID != undefined ? parID : $('#'+editorID).attr('captal-paragraph');
        blkID    = blkID != undefined ? blkID : $('#desk .ui-tabs-panel[aria-hidden="false"] #blk_text .blk_wrapper:has(.ace_focus)').index()-1;
        
        if (editorID == undefined) return; // no text block selected
        
        if (current) {
            
            var editor = ace.edit(editorID);
            var text  = editor.getValue();
            
            // not stored yet, push editor content to data-source
            $('#data-source article#'+parID+' text:eq('+blkID+')')
                            .html('&lt;![CDATA[' + text + ']]&gt;' );            
        } else {
            
            var text = $('#data-source article#'+parID+' text:eq('+blkID+')')
                            .html()
                            .replace( /\<\!\[CDATA\[/i,'')
                            .replace( /&lt;\!\[CDATA\[/i,'')
                            .replace(']]>','')
                            .replace(']]&gt;','');
        }
        
        var translated     = $('#'+editorID).attr('captal-translated');
        var recognizedLang = $('#data-source article#'+parID+' text:eq('+blkID+')').attr('lang');
        var supportedLangs = {
            'rus'   : 'ru',
            'ukr'   : 'ua',
            'eng'   : 'en',
            'ger'   : 'de',
            'ita'   : 'it',
            'fra'   : 'fr'
        };
        var sourceLang = supportedLangs[recognizedLang] || supportedLangs[project.sourceLang];
        var targetLang = supportedLangs[project.targetLang]; //'ru';      
        
        if (translated === 'true') {
            
            return error(lang.current.translation_already_done)            
        }                
        
        if (sourceLang == targetLang || text.length == 0) {
            
            return;
            
        } else {                 
        
            block.translated({
                editorID    : editorID, 
                parID       : parID, 
                blkID       : blkID, 
                text        : text, 
                sourceLang  : sourceLang, 
                targetLang  : targetLang
            });            
        }
    };
    
    block.translated = function(o){ debug('block.translated(...)');                

        var editorID    = o.editorID, 
            parID       = o.parID, 
            blkID       = o.blkID, 
            text        = o.text, 
            sourceLang  = o.sourceLang, 
            targetLang  = o.targetLang,
            key         = o.key;

        $.ajax({
                url: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
                data: {
                    key     : cfg.yandex,
                    text    : text,
                    lang    : sourceLang +'-'+ targetLang ,
                    format  : 'html',
                    options : 0
                },
                success: function(res){
                    
                    if (res.code ==  200){
                    
                        var tlang            = res.lang.split('-');        
                        var supportedLangs  = {
                            'ru' :'rus',
                            'ua' :'ukr',
                            'en' :'eng',
                            'de' :'ger',
                            'it' :'ita',
                            'fr' :'fra'
                        };        
                        var obj             = $('#'+editorID);                    
                        var origLang        = supportedLangs[tlang[0]] || 'eng';
                        var tranLang        = supportedLangs[tlang[1]] || 'rus';
                        var tranText        = res.text[0];

                        console.log('88',parID,blkID)
                        var origText        = $('#data-source article#'+parID+' text:eq('+blkID+')')
                                                    .html()
                                                    .replace( /\<\!\[CDATA\[/i,'')
                                                    .replace( /&lt;\!\[CDATA\[/i,'')
                                                    .replace(']]>','')
                                                    .replace(']]&gt;','');       

                        $('#tab-'+parID+' #blk_text .blk_wrapper:eq('+blkID+') #subheader').show();

                        obj
                            .css({
                                width: '36.5%',
                                float: 'left'
                            })
                            .attr('captal-translated', true)
                            .after('<div class="autotrans"><b>'+lang.current.translation_machine+': <img src="img/16/flag_'+tranLang+'.png"></b><div>'+ tranText +'</div>Переведено сервисом<br><a href="http://translate.yandex.ru/" target="_blank">«Яндекс.Переводчик»</a></div>\
                                <div class="origtrans"><b>'+lang.current.original+': <img src="img/16/flag_'+origLang+'.png"></b><div>'+ origText +'</div></div>');

                        $('#tab-'+parID+' #blk_text .blk_wrapper:eq('+blkID+') img.lang-flag')
                                .css('float','none')
                                .appendTo( $('#tab-'+parID+' #blk_text .blk_wrapper:eq('+blkID+') #subheader') );

                        // update data-source
                        // <article id="xx">
                        //    <text id="text_0000" lang="undefined" if="" ifnot="" goto="" do="" isglobal="false">&lt;![CDATA[]]&gt;</text>
                        //    <orig id="orig_0000" target="text_0000" lang="undefined">&lt;![CDATA[]]&gt;</orig>
                        //    <tran id="tran_0000" target="text_0000" lang="undefined">&lt;![CDATA[]]&gt;</tran>

                        $('#data-source article#'+parID+' text:eq('+blkID+')')
                                .attr('translated', true);                    

                        $('#data-source article#'+parID+' metadata')
                                .append('<text target="'+ blkID +'" lang="'+origLang+'" type="original">&lt;![CDATA['+origText+']]&gt;</text>')
                                .append('<text target="'+ blkID +'" lang="'+tranLang+'" type="auto">&lt;![CDATA['+tranText+']]&gt;</text>');

                        if ( obj.hasClass('ace_editor') ) {            

                            var editor = ace.edit(editorID);                        
                            var lines  = Math.round( $('#tab-'+parID+' .autotrans div').height()/14 );
                            var blankLines = '';

                            //for (var i = 0; i < lines; i++) {
                            //    blankLines += '\n';                            

                            //    if (i == lines-1) {

                                    editor.focus();
                                    editor.setValue(blankLines);
                                    editor.resize(true);
                                    editor._emit('change');
                                    editor.selection.clearSelection();
                                    editor.gotoLine(0,0);
                            //    }
                            //}

                        } else  {            

                            obj.html('');
                        };
                    
                    }
                },
                error: function(res){
                    
                    // swap yandex key and repeat
                    cfg.yandex = cfg.yandexAlt[0];

                    block.translated({
                        editorID    : editorID, 
                        parID       : parID, 
                        blkID       : blkID, 
                        text        : text, 
                        sourceLang  : sourceLang, 
                        targetLang  : targetLang
                    });
                }
            });                
    };
    
    block.wrapText = function(){
        $('.ace_editor').each(function(){
            var editor = ace.edit( $(this).attr('id') );

            if ( editor.getSession().getUseWrapMode() )  {
                editor.getSession().setUseWrapMode(false);
            } else {
                editor.getSession().setUseWrapMode(true);
            }
        });
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //                              HANDLER
    ////////////////////////////////////////////////////////////////////////////
    
    handler = {};
    
    handler.open = function(o){

        debug('handler.open()');
        
        alert('HOW DID YOU GET HERE?');
        return;
        
        var hanID = o.handlerID;
        
        if ($('#data-source').html().length === 0) {
            
            error('Проект не создан');
            return;
        }
        
        // check if already opened
        if ( $('#tab-'+hanID).length > 0 ) {
            // it is! just bring to front                       
            $('#desk').tabs( 'option', 'active', $('li[aria-controls="tab-'+hanID+'"]').index() );

            $('#dlgLoading').hide();
            if (typeof callback === 'function'){
                callback(hanID);
            }
            return false;

        } else if ( !$('#desk').hasClass('ui-tabs') ) {

            gui.createTabs();
            gui.fixTabs();
        }
        
        var i = 0,
            max = $('#data-source article#'+hanID).children().length,
            handlersTOTAL = $('#data-source handler[name='+hanID+']').length,
            tmpl = $('#new-handlertab-template').html();

            $(tmpl).wrap('<p></p>');

            // add new handler tab
            $('#desk #tabs').append('<li><a href="#tab-'+ hanID +'"><img src="img/16/icon-handler.png"> '+ hanID +' <img onclick="paragraph.close(this)" src="img/16/close.png"></a></li>');
            $('#desk').append('<div id="tab-'+ hanID +'">'+ tmpl +'</div>');

            // if first tab - create toolbar
            if ( $('#desk .blk_editor').length == 0) {
                gui.createToolbar();
            }
            
            $('#data-source handler[name='+hanID+']').each(function(){
                var randomName = getRandomName('handler');
                i++;                                               

                block.add({
                    tag         : 'handler',
                    body        : $(this)[0].innerHTML
                                            .replace('<![CDATA[','')
                                            .replace('&lt;![CDATA[','')
                                            .replace(']]>','')
                                            .replace(']]&gt;',''),
                    id          : $(this).attr('id')        || randomName, // attr.type
                    logicTRUE   : $(this).attr('if')        || '',
                    logicFALSE  : $(this).attr('ifnot')     || '',
                    logicGO     : $(this).attr('goto')      || '',
                    logicDO     : $(this).attr('do')        || '',
                    logicGLOBAL : $(this).attr('isglobal')  || '',
                    paragraph   : hanID
                });

                // if block has no id, give it to him to access later
                if ( $(this).attr('id') == undefined ) { // attr.id
                    
                    $(this).attr('id', randomName);
                }

                // last element
                if (i == handlersTOTAL) {
                    
                    $('#desk').tabs('refresh').tabs( 'option', 'active', $('#desk #tabs li').length -1 );

                    // select target or first block of paragraph
                    block.show( hanID, 'handler', 0 );

                    $('#dlgLoading').hide();

                    if (typeof callback === 'function') {
                        callback(hanID);
                    }
                }
            });

            // if no handlers yet
            if (handlersTOTAL == 0) {
                $('#desk').tabs('refresh').tabs( 'option', 'active', $('#desk #tabs li').length -1 );
            }

            $('#btnAddText').prop(  'disabled', true);
            $('#btnAddAction').prop('disabled', true);
            $('#btnAddScript').prop('disabled', true);
            $('#btnAddHandler').prop('disabled', false);
            
            $('#data-source options openparagraph').append('<paragraph id="'+hanID+'">');
    };
    
    
    ////////////////////////////////////////////////////////////////////////////
    //                              PARAGRAPH
    ////////////////////////////////////////////////////////////////////////////
    
    paragraph = {
        id      : null,
        groupBy : 20
    };            

    paragraph.addTag = function(){ debug('paragraph.addTag()');
        
        var nav   = $('#nav').jstree(true),
            value = cleanName(prompt(lang.current.tag_enter)),
            parID = paragraph.current();
        
        if (value){
    
            // update navigator
            nav.create_node('nav-tags', { id: value, type : 'tag', text: value });
            
            // update data-source
            $('#data-source article#'+parID+' metadata').append('<tag>'+value+'</tag>');
        }
    };

    paragraph.close = function(obj, callback){ debug('paragraph.close(...)');

        var res, id;                
   
        if (typeof obj === 'object') {
            
            // closing tab by cross
            res = $(obj).parents('a');
            id  = res.attr('href');                       
            
            $(obj).parents('li').remove();
            $('#desk '+id).remove();            
            $('#data-source options openparagraph paragraph'+id.replace('tab-','') ).remove();
            
        } else if (obj == undefined) {
            
            // closing current paragraph
            id = paragraph.current();
            $('#desk div#tab-'+id).remove();
            $('#tabs li[aria-controls="tab-'+id+'"]').remove();            
            $('#data-source options openparagraph paragraph#'+id ).remove();    
            
        } else if (obj == 'other'){
            
            id = paragraph.current();
            $('#desk div.ui-tabs-panel:not(#tab-'+id+')').remove();
            $('#tabs li:not([aria-controls="tab-'+id+'"])').remove();
            $('#data-source options openparagraph paragraph:not(#'+id+')' ).remove();
            
        } else if (obj == 'all') {
            
            $('#tabs li').remove();
            $('#desk div.ui-tabs-panel').remove();
            $('#data-source options openparagraph').html('');
            
        } else if (typeof obj == 'string' || typeof obj == 'number') {
            
            id = obj;
            $('#desk div#tab-'+id).remove();
            $('#tabs li[aria-controls="tab-'+id+'"]').remove();            
            $('#data-source options openparagraph paragraph#'+id ).remove();
        }
        
        $('#desk').tabs('refresh');        

        // if last opened paragraph, remove tabs and hide toolbar
        if ( $('#desk #tabs li').length == 0) {
            
            gui.cleanDesk();
            
        } else {
            
            gui.fixTabs();
        }
        
        if (typeof callback == 'function'){
            
            callback();
        }
    };
    
    paragraph.copy = function(obj){ 
        
        var parID  = paragraph.current();
        var folder = $('#data-source folder:has(article#'+parID+')');
        
        debug('paragraph.copy('+parID+')');
        
        // push paragraph to buffer
        $('#copy-buffer')
                .attr('type','paragraph')
                .html( 
                    $('#data-source article#'+parID)
                        .clone()
                        .attr('folder', folder.attr('id'))
                        .removeAttr('id')
                );
    };
    
    paragraph.create = function(o){ debug('paragraph.create(..)');
        
        if ($('#data-source').html().length > 0) {
            
            var tree      = $('#toc').jstree(true);
            var newID     = o.id || paragraph.newID();
            var parentDOM = (o.parent.type == 'autofolder') ? ('[type="autofolder"]:first') : ('#'+o.parent.id);

            tree.create_node( o.parent.id , { 
                
                id  : newID,
                text: newID,
                type: "paragraph_new"
                
            },'last',function(node){     
                
                // check if paragraph exist in data-source (in case of copy&paste)
                if ( $('#data-source article#'+newID).length > 0 ) {
                    // exist                    
                    
                } else {
                    // paragraph not exist in data-source, update data-source
                    $('#data-source folder'+parentDOM).append('<article id="'+newID+'">\n\
                        <text></text>\n\
                        <metadata>\n\
                    </metadata>\n\
                    </article>');
                }
                
                //tree.set_type( node.id, 'paragraph_new_'+ paragraph.linkState(node.id) );
                paragraph.state(node.id,'new');

                //tree.select_node(newID, true);
                // open created paragraph
                //paragraph.open(newID);                                                              

                if (typeof o.callback == 'function'){
                    o.callback(node);
                }
            });                    
        } else {
            error(lang.current.project_not_loaded);
        }
    };
    
    paragraph.current = function(){
        
        if ($('#tabs li.ui-state-active').length > 0) {
    
            var result = $('#tabs li.ui-state-active').attr('aria-controls').replace('tab-','');
        }
        
        return result;
    };
    
    paragraph.delete = function(parID, noconfirm){ debug('paragraph.delete('+parID+')');
        
        parID = (typeof parID == 'string') ? parID : paragraph.current();
        
        if ($('#data-source article#'+parID).length > 0) {
                        
            if (noconfirm || confirm( lang.current.paragraph_delete_confirm.replace('{ID}', parID) )) {
                                
                var toc     = $('#toc').jstree(true);
                var parent  = toc.get_node(parID).parent;
                var lastAct = $('#data-source article#'+parID+' action').length -1;
                
                if (lastAct >= 0) {
                
                    $('#data-source article#'+parID+' action').each(function(index){

                        var target = $(this).attr('goto');

                        $(this).remove();

                        paragraph.state(target, 'refresh');                                        

                        if (index == lastAct){

                            $('#data-source article#'+parID).remove();
                        }
                    });
                    
                } else {
                    
                    $('#data-source article#'+parID).remove();
                }
                
                // Check if first numeric paragraph is being changed
                paragraph.state( 
                        $('#data-source article')
                            .filter(function(){ return this.id.match(/\d+/); })
                            .sort(function(a,b){ return a.id - b.id; })
                            .first()
                            .attr('id'), 'refresh' );

                toc.delete_node(parID);                
                gui.tocUpdate(parent);   
            
                if (parID == paragraph.current()) {
                    paragraph.close();
                }
            }
            
        } else {
            error(lang.current.paragraph_not_found);
        }       
    };
    
    paragraph.delTag = function(){ debug('paragraph.delTag()');
        
        var parID = paragraph.current(),
            nav   = $('#nav').jstree(true),
            node  = nav.get_node( nav.get_selected()[0] );
        
        // remove from data-source
        $('#data-source article#'+parID+' metadata tag:contains('+node.id+')').remove();
        
        // remove from navigator
        nav.delete_node(node.id);
    };
    
    paragraph.go = function(e){        
        var id = prompt(lang.current.go_enter);        
        if (id) {
            paragraph.open({ paragraphID: id });
        }
    };
    
    paragraph.isEnd = function(parID, value){
        
        parID = parID || paragraph.current();
        
        var par = $('#data-source article#'+parID);
        
        if (value == 'undefined') {
            
            // get value
            return par.attr('isend');
            
        } else { 
            
            if (value == 'toggle') {

                if ( par.attr('isend') === 'true' ) {

                    par.attr('isend', false);

                } else {

                    par.attr('isend', true);
                }
                
            } else {

                // set value
                par.attr('isend', value);               
            }
            
            // update button
            if ( $('#tab-'+parID).attr('aria-hidden') === 'false'){

                if (par.attr('isend') === 'true') {

                    $('#toolbar #btnParRoleEnd').addClass('selected');
                } else {

                    $('#toolbar #btnParRoleEnd').removeClass('selected');
                }

                $('#toolbar #btnParRoleEnd').trigger('blur');
            }
            
            // update paragraph state
            paragraph.state(parID, 'refresh');
        }
    };
    
    paragraph.linkState = function(parID){
        
        if ($('#data-source article#'+parID).attr('isend') === 'true') {
        
            return 'end';
        
        } else if (isNaN(parID)) {
            
            return 'normal';
            
        } else if( $('#data-source action[goto="'+parID+'"]').length == 0 ) {

            // non numeric paragraphs are not orpahs
            // first numeric paragraph is not orphan
            if (parID == $('#data-source article')
                    .filter(function(){ return this.id.match(/\d+/); })
                    .sort(function(a,b){ return a.id - b.id; })
                    .first()
                    .attr('id')){
                
                return 'normal';
                
            } else {
                        
                return 'orphan';
            }


        } else if ($('#data-source article#'+parID+' action[goto]').length == 0) {
            
            return 'stub';
            
        } else {
            
            return 'normal';
        }
    };
    
    paragraph.listByTag = function(tagID){

        $('#dlgTaglist #tagName').html(':<span class="selected-tag"><img src="img/16/tag_hash.png"> '+ tagID +'</span>');
        $('#dlgTaglist #search-results').html('');

        $('#data-source article').has( 'metadata tag:contains('+tagID+')').each(function(index){

            var parID = $(this).attr('id'),
                label = $(this).attr('label') || '',
                label = (label != '') ? ':'+ label : '';

            $('#dlgTaglist #search-results').append('<div captal-paragraph="'+parID+'" class="tagged-paragraph" onclick="gui.tagJump(this)"><img src="img/16/icon-page.png"> '+parID+label+'</div>');
        }); 
    };
    
    paragraph.move = function(target){ debug('paragraph.move('+target+')');
        
        var parID = paragraph.current();
        
        if (parID) {
            var tree = $('#toc').jstree(true);
            var node = tree.get_node(parID);
            var text = tree.get_node( node.parent).text.split('..');        

            if (target == 'up' && $('#toc #'+parID).index() > 0) {
                
                $('#data-source article#'+parID).prev('article').before(  $('#data-source article#'+parID) );
                tree.move_node(
                        parID,
                        node.parent, 
                        $('#toc #'+parID).index()-1
                );

                // if first node in group
                // Rename group to match first paragraph name
                /*
                if ( $('#toc_'+paragraph.id).index() == 0) {                
                    text[0] = node.text;          
                    tree.set_text( node.parent, text.join('..') );
                } else {
                    text[0] = $('#data-source article:first').attr('id');
                    text[1] = $('#data-source article:last').attr('id');
                    tree.set_text( node.parent, text.join('..') );
                }*/
                gui.tocUpdate();

            } else if (target == 'down') {
                
                $('#data-source article#'+parID).next('article').after(  $('#data-source article#'+parID) );
                tree.move_node(
                        parID,
                        tree.get_node(parID).parent, 
                        $('#toc #'+parID).index()+2 
                );

                // if last node in group
                // Rename group to match last paragraph name
                /*
                if ( $('#data-source article:last').attr('id') == paragraph.id) {                
                    text[1] = node.text;          
                    tree.set_text( node.parent, text.join('..') );
                } else {
                    text[0] = $('#data-source article:first').attr('id');
                    text[1] = $('#data-source article:last').attr('id');
                    tree.set_text( node.parent, text.join('..') );
                }*/
                gui.tocUpdate();
            }
        } else {
            error(lang.current.paragraph_not_found);
        }
    };
    
    paragraph.new = function(o){ debug('btnNewParagraph.click()');
        
        var parID = (typeof o == 'object') ? o.paragraphID : o;
        
        o = (typeof o != 'object') ? {} : o;
        
        if ( $('#data-source article#'+parID).length == 0 ){
        
            // if no project, ignore
            if ($('#data-source').html().length > 0){ 

                // try to get current target
                //
                var tree = $('#toc').jstree(true);
                var tnode = tree.get_node( tree.get_selected()[0] ) || { type:'autofolder' };
                var tparent;        

                // if paragraphs root folded, unfold it
                if ( !tree.get_node('toc-paragraphs').state.opened ) {
                    tree.open_node('toc-paragraphs');
                }       

                // if paragraph selected, point to its parent
                if (tnode.type.indexOf('paragraph_') == 0) {
                    tnode = tree.get_node(tnode.parent);
                }

                if (tnode.type.indexOf('folder') == 0) {            
                    //
                    // USERFOLDER case
                    //                            
                    paragraph.create({
                        parent  : tnode,
                        id      : parID,
                        callback: function(node){

                            if (!o.background){
                                paragraph.open({ paragraphID: node.id, callback: o.callback });
                            }
                        }
                    });
                } else {
                    //
                    // AUTOFOLDER case
                    // 
                    // if nothing selected OR
                    // if autofolder selected OR
                    // if paragraph from autofolder selected  
                    // get last autofolder instance
                    var lastGroup = $('#toc li.jstree-last[toc-role="group"]');            

                    tparent = {
                        id : lastGroup.attr('id'),                
                        type: 'autofolder'
                    };                                                                                                                                   

                    // count paragraphs in last autofolder, create new autofolder if needed
                    if ( $('#toc .jstree-last[toc-role="group"] li').length < paragraph.groupBy ) {                
                        // no need to create new autofolder                                                
                        // if folded unfold                
                        if ( lastGroup.hasClass('jstree-closed')) {
                           tree.open_node( lastGroup.attr('id') );
                        }

                        paragraph.create({ 
                            parent  : tparent,
                            id      : parID,
                            callback: function(node){

                                if (!o.background){
                                    paragraph.open({ paragraphID: node.id, callback: o.callback });
                                }
                                // update autofolder name
                                gui.tocUpdate( node.parent );
                            }
                        });
                    } else {
                        // create new group
                        tree.create_node( 'toc-paragraphs', {
                                type: 'autofolder',
                                state: { opened : true },
                                text: '..',
                                li_attr: { 'toc-role':'group' }
                            },
                            'last',
                            function(tparent){                        
                                paragraph.create({
                                    parent  : tparent,
                                    id      : parID,
                                    callback: function( node ){

                                        if (!o.background){
                                            paragraph.open({ paragraphID: node.id, callback: o.callback });
                                        }
                                        // update autofolder name
                                        gui.tocUpdate(tparent);
                                    }
                                });
                            }
                        );
                    } 
                }
            
            } else {
                error(lang.current.project_not_loaded);
                project.new();
            }        
        }
    };
    
    paragraph.newID = function(){
       
        var n = $('#data-source article')                    
                    .filter(function(){ 
                        // leave numbers only
                        return this.id.match(/\d+/); 
                    }) 
                    .sort(alphanum) 
                    .last()
                    .attr('id')*1+1;
       
        return n;
    };
    
    paragraph.newInject = function(){ debug('paragraph.newInject()');
        
        // try to inject new paragraph between existing two
        var source   = paragraph.current(),
            toc      = $('#toc').jstree(true),
            parentID = toc.get_node(source).parent,
            parent   = toc.get_node(parentID),
            logicGO  = $('#tab-'+source+' #blk_action .blk_wrapper:has(.ace_focus) #logicGO'),
            newID    = paragraph.newID(),
            action,
            target;
        
        // if focus on action
        if (logicGO.length > 0) {
                                    
            target = logicGO.val();
            
            var editor = ace.edit( $('#tab-'+source+' #blk_action .blk_wrapper:has(.ace_focus) .ace_editor').attr('id') );
            var blkID  =  $('#tab-'+source+' #blk_action .blk_wrapper:has(.ace_focus)').index('#logicGO');
            
            action = editor.getValue();
            editor.getSession().setValue( newID.toString() );
            editor.resize(true);
            logicGO.val( newID );
            //$('#data-source article#'+source+' action:eq('+blkID+')').attr('goto', newID);            
            
        } else {
            
            // no selected action
            logicGO = $('#tab-'+source+' #blk_action #logicGO:first');
            
            if (logicGO.length > 0) {
                
                target = logicGO.val();
                action = target;
                logicGO.val( newID );

                $('#data-source article#'+source+' action:first').attr('goto', newID);
                
            } else {
                
                // no target!
                return false;
            }            
        }                
        
        
        paragraph.create({
            
            parent: parent,
            callback: function(node){

                paragraph.open({ paragraphID: newID });

                block.create({
                    paragraph   : node.id,
                    tag         : 'action',
                    logicGO     : target,
                    body        : action
                }, function(editorID){                    
                    
                    //$('#tab-'+newID+' #blk_action #logicGO:first').trigger('blur');
                    console.log(editorID)
                    paragraph.state( newID, 'refresh');
                });
                
            }
        });
    };
    
    paragraph.newLinked = function(){
        
        var parID = paragraph.current();
        
        if (parID) {                    
            
            // are there any action block in the paragraph?
            if ($('#tab-'+parID+' #blk_action .ace_editor').length > 0) {
                
                var tag   = $('#tab-'+parID+' .ace_focus').attr('captal-tag');
                
                // are we focused on action block?
                if (tag == 'action') {
                                    
                    var logicGO     = $('#tab-'+parID+' #blk_action .blk_wrapper:has(.ace_focus) #logicGO');
                    var logicGOicon = $('#tab-'+parID+' #blk_action .blk_wrapper:has(.ace_focus) #logicGOicon');
                    
                } else {
                    
                    // no our focus is somewhere else, get the last action data
                    var logicGO     = $('#tab-'+parID+' #blk_action #logicGO:last');
                    var logicGOicon = $('#tab-'+parID+' #blk_action #logicGOicon:last');
                }
                
                // does this action have target paragraph
                if ( logicGO.val().length > 0 ) {
                    
                    // check if that paragraph exists
                    if ( $('#data-source article#'+logicGO.val() ).length > 0) {

                        // paragraph exists, nothing to do with this action
                        // create new action and new linked paragraph
                        block.create({

                                tag: 'action',
                                paragraph: parID
                            },
                            function(editorID){

                                var logicGOicon = $('#desk .blk_wrapper:has(#'+editorID+') #logicGOicon');
                                gui.logicGO( logicGOicon );
                            }
                        );
                    } else {

                        // paragraph for this action not exist, create one
                        paragraph.new( logicGO.val() );
                    }
                
                } else {
                    
                    // logicGO field is empty, let gui.logicGO() fix it
                    gui.logicGO( logicGOicon );
                }    
            } else {
                
                // no action blocks at all, create one, then gui.logicGO()
                block.create({

                        tag: 'action',
                        paragraph: parID

                    },
                    function(editorID){

                        var logicGOicon = $('#desk .blk_wrapper:has(#'+editorID+') #logicGOicon');

                        gui.logicGO( logicGOicon );
                    }
                );
            }
            
        } else {
            
            // no paragraph opened
            error(lang.current.parapraph_not_selected);
        }
    };
       
    paragraph.open = function(o){
        
        var parID    = o.paragraphID,
            curParID = o.currentParagraphID, 
            callback = o.callback,
            blkID    = o.blockID || 0;
    
        debug('paragraph.open('+ parID +','+ curParID +')');
        
        if ($('#data-source').html().length === 0) {
            
            error(lang.current.project_not_loaded);
            return;
        }
        
        // check if exist
        if ( $('#data-source article#'+parID).length == 0 && $('#data-source handler[name="'+parID+'"]').length == 0 ) {
            
            // not exist!
            // check if link exist
            if ( $('#data-source article#'+curParID+' action[goto="'+parID+'"]').length == 0 && curParID != undefined ) {  

                // create action in current paragraph linked with target paragraph
                block.create({
                    paragraph   : curParID,
                    tag         : 'action',
                    body        : parID,                    
                    logicGO     : parID
                });
            }
            // create target paragraph
            paragraph.new(parID, callback);
                
        } else {        
            // check if already opened
            if ( $('#tab-'+parID).length > 0 ) {
                // it is! just bring to front            
                //$('#desk').tabs( 'option', 'active', $('#tab-'+parID).attr('aria-labelledby').split('-')[2]-2 );            
                $('#desk').tabs( 'option', 'active', $('li[aria-controls="tab-'+parID+'"]').index() );

                $('#dlgLoading').hide();
                if (typeof callback === 'function'){
                    callback(parID);
                }
                return false;
                
            } else if ( !$('#desk').hasClass('ui-tabs') ) {
                
                gui.createTabs();
                gui.fixTabs();
            }

            var i = 0;
            var max = $('#data-source article#'+parID).children().length;
            var handlersTOTAL = $('#data-source handler[name='+parID+']').length;

            if (max > 0) { // it's an article
                var tmpl = $('#new-tab-template').html();
            } else {
                var tmpl = $('#new-handlertab-template').html();
            }

            $(tmpl).wrap('<p></p>');

            // add new tab
            if (max > 0) {
                // acricle tab
                
                var type = 'paragraph_'+ paragraph.state(parID) +'_'+ paragraph.linkState(parID);
                var img = $('#toc').jstree(true).settings.types[ type ].icon;
                //var img = 'img/16/hourglass.png' ;               
                
                $('#desk #tabs').append('<li><a href="#tab-'+ parID +'"><img class="tab-icon" src="'+img+'"> '+ parID +' <img onclick="paragraph.close(this)" src="img/16/close.png"></a></li>');
            } else {
                // handler tab
                $('#desk #tabs').append('<li><a href="#tab-'+ parID +'"><img src="img/16/icon-handler.png"> '+ parID +' <img onclick="paragraph.close(this)" src="img/16/close.png"></a></li>');
            }
            $('#desk').append('<div id="tab-'+ parID +'">'+ tmpl +'</div>');

            // if first tab - create toolbar
            if ( $('#desk .blk_editor').length == 0) {
                gui.createToolbar();
            }

            // is it handler or article?
            if (max > 0) {                               
                
                var elements = ['text','action','script'];
                
                // it is an article
                $('#data-source article#'+parID).children().each(function(){

                    i++;                

                    if ( elements.indexOf( $(this)[0].localName ) != -1 ) {                       

                        block.add({
                            tag         : $(this)[0].localName,
                            body        : $(this)[0].innerHTML
                                                    .replace( /\<\!\[CDATA\[/i,'')
                                                    .replace( /&lt;\!\[CDATA\[/i,'')
                                                    .replace(']]>','')
                                                    .replace(']]&gt;',''),                            
                            lang        : $(this).attr('lang')      || 'undefined',
                            translated  : $(this).attr('translated')|| false,
                            logicTRUE   : $(this).attr('if')        || '',
                            logicFALSE  : $(this).attr('ifnot')     || '',
                            logicGO     : $(this).attr('goto')      || '',
                            logicDO     : $(this).attr('do')        || '',
                            logicGLOBAL : $(this).attr('isglobal')  || '',
                            logicTYPE   : $(this).attr('type')      || '',
                            paragraph   : parID
                        });
                    }

                    // last element, all ready
                    if ( i == max ) {                        
                        
                        $('#desk').tabs('refresh').tabs( 'option', 'active', $('#desk #tabs li').length -1 );
                        
                        var parState = $('#data-source article#'+parID).attr('state') || 'new';
                        
                        $('#tab-'+parID).attr('captal-state', parState );
                        $('#toolbar .toolbar-sub button.state-'+parState).addClass('selected');
                        
                        gui.fixTabs(); // fix editor top position

                        // select target or first block of paragraph
                        block.show( parID, 'text', blkID );
                        
                        $('#dlgLoading').hide();
                        
                        
                        setTimeout( block.addLinks, 500 );
                        
                        if (typeof callback === 'function') {
                            callback(parID);
                        }
                    }
                });

                $('#btnAddText').prop(  'disabled', false);
                $('#btnAddAction').prop('disabled', false);
                $('#btnAddScript').prop('disabled', false);
                $('#btnAddHandler').prop('disabled', true);
                
                
            } else {
                // it is a handler
                //

                $('#data-source handler[name='+parID+']').each(function(){
                    var randomName = getRandomName($(this)[0].localName);
                    i++;                                               

                    block.add({
                        tag         : $(this)[0].localName,
                        body        : $(this)[0].innerHTML
                                                .replace('<![CDATA[','')
                                                .replace('&lt;![CDATA[','')
                                                .replace(']]>','')
                                                .replace(']]&gt;',''),
                        id          : $(this).attr('id')        || randomName, // attr.type
                        logicTRUE   : $(this).attr('if')        || '',
                        logicFALSE  : $(this).attr('ifnot')     || '',
                        logicGO     : $(this).attr('goto')      || '',
                        logicDO     : $(this).attr('do')        || '',
                        logicGLOBAL : $(this).attr('isglobal')  || '',
                        paragraph   : parID
                    });

                    // if block has no id, give it to him to access later
                    if ( $(this).attr('id') == undefined ) { // attr.id
                        $(this).attr('id', randomName);
                    }

                    // last element
                    if (i == handlersTOTAL) {
                        $('#desk').tabs('refresh').tabs( 'option', 'active', $('#desk #tabs li').length -1 );

                        gui.fixTabs(); // fix editor top position

                        // select target or first block of paragraph
                        block.show( parID, 'handler', blkID );
                        
                        $('#dlgLoading').hide();
                        
                        if (typeof callback === 'function') {
                            callback(parID);
                        }
                    }
                });

                // if no handlers yet
                if (handlersTOTAL == 0) {
                    $('#desk').tabs('refresh').tabs( 'option', 'active', $('#desk #tabs li').length -1 );

                    // select first block of paragraph
                    //block.show( $('#tab-'+parID+' .blk_editor').attr('captal-name') );
                }

                $('#btnAddText').prop(  'disabled', true);
                $('#btnAddAction').prop('disabled', true);
                $('#btnAddScript').prop('disabled', true);
                $('#btnAddHandler').prop('disabled', false);
            }
            
            $('#btnOutdent').prop('disabled', false);
            $('#btnIndent').prop('disabled', false);            
            
            $('#data-source options openparagraph').append('<paragraph id="'+parID+'">');
        }
    };
    
    paragraph.paste = function(){
        
        if ( $('#copy-buffer').attr('type') == 'paragraph' ) {
        
            var sourcePar = $('#copy-buffer').html(),
                parID     = paragraph.newID(),
                newPar    = $(sourcePar)
                                .attr('id', parID)
                                .appendTo( $('folder#'+ $(sourcePar).attr('folder') ) )
                                .removeAttr('folder');

            paragraph.new(parID);
        }
    };
    
    paragraph.rename = function(parID, value){ debug('paragraph.name('+parID+','+value+')');
        
        var toc     = $('#toc').jstree(true),
            parID   = (typeof parID != 'object') ? parID : paragraph.current(),
            node    = toc.get_node(parID),             
            label   = $('#data-source article#'+parID).attr('label') || false,
            value   = value || prompt(lang.current.paragraph_name_enter, parID),
            parent  = toc.get_node( node.parent );
        
        if (parID && value) {

                if (node.id == 'toc-book') {
                    
                    project.rename( value );

                } else if (parID == value) {
                    
                    // same name, nothing changed, do nothing
                
                } else if (node.type.indexOf('paragraph_') == 0){
                    
                    // we must avoid symbols that modify jquery selector
                    value = cleanName(value);

                    if ( $('#data-source article#'+value).length > 0 ) {
                        // paragraph with that name already exits
                        //toc.set_text(node, parID);
                        //tree.set_id(data.node, 'toc_'+data.old);
                        //tree.edit(data.node);
                        error('Такое имя уже есть');
                        alert('Такое имя уже есть');
                        
                        return false;
                        
                    } else {
                        
                        // get first numeric paragraph
                        var firstNumPar = $('#data-source article')
                                    .filter(function(){ return this.id.match(/\d+/); })
                                    .sort(function(a,b){ return a.id - b.id; })
                                    .first()
                                    .attr('id');
                            
                        // rename in data-source
                        $('#data-source article#'+parID).attr('id',value);

                        // update id of toc node
                        toc.set_id(node, value);
                        toc.set_text(node, (label) ? value +':'+ label : value, false);

                        // rename tab if paragraph is already opened
                        //
                        var tabOld = 'tab-'+parID;
                        var tabNew = 'tab-'+value;

                        if ($('#'+tabOld).length > 0) {
                            // tab exists
                            
                            // update captal-paragraph
                            $('#desk [captal-paragraph="'+parID+'"').attr('captal-paragraph', value);
                            
                            $('#'+tabOld).attr('id', tabNew);
                            $('#tabs li[aria-controls="'+tabOld+'"]').attr('aria-controls', tabNew);
                            $('a[href="#'+tabOld+'"')
                                .html( '<img src="img/16/page-new.png"> \n\
                                        '+ value +' \n\
                                        <img onclick="paragraph.close(this)" src="img/16/close.png">' )
                                .attr('href', '#'+tabNew);                        
                        }
                        
                        // update autofolder
                        //
                        if (parent.type == 'autofolder') {
                            
                            if ( parent.children[0] == node.id ) {
                                // first in group, update group name
                                var text = parent.text.split('..');
                                text[0]  = value;
                                toc.set_text( parent, text.join('..') );
                            }
                            if ( parent.children[ parent.children.length -1 ] == node.id ) {
                                
                                // last in group, update group name
                                var text = parent.text.split('..');
                                text[1] = value;
                                toc.set_text( parent, text.join('..') );
                            }
                        }
                        
                        // update navigator
                        //
                        if (paragraph.current()){
                            
                            var nav = $('#nav').jstree(true);
                            nav.set_text('nav-root', (label) ? value +':'+label : value );

                            $(nav.get_json( $('#nav'), {
                                flat: true
                            }))
                            .each(function(index, value) {
                                var node = nav.get_node(this.id);
                                var lvl = node.parents.length;
                                var idx = index;

                                if (node.id.indexOf('nav֍'+parID+'֍') == 0) {

                                    var newID = node.id.replace('nav֍'+parID,'nav֍'+value);

                                    // update editors
                                    //
                                    $('#desk [captal-nav="'+ node.id +'"]').attr('captal-nav', newID);

                                    // update nav id
                                    nav.set_id(node.id, newID );                                    
                                }
                            });
                        }
                        
                        if ( (!isNaN(parID) && parID > firstNumPar && value < firstNumPar) ||
                             (!isNaN(value) && value < firstNumPar) ) {
                            
                            // now this paragraph is first numeric, update old numeric one
                            paragraph.state( firstNumPar, 'refresh');
                            // update self state
                            paragraph.state( value, 'refresh' );
                        
                        } else if ( parID == firstNumPar) {
                            
                            // this paragraph was first numeric, check if it is still
                            firstNumPar = $('#data-source article')
                                    .filter(function(){ return this.id.match(/\d+/); })
                                    .sort(function(a,b){ return a.id - b.id; })
                                    .first()
                                    .attr('id');
                            
                            if (value != firstNumPar) {
                                
                                // this paragraph is no longer first numeric, update both
                                paragraph.state( value,       'refresh' );
                                paragraph.state( firstNumPar, 'refresh' );
                            }
                        }                         
                        
                        // preserve links
                        $('#data-source action[goto="'+parID+'"]').each(function(){
                            
                            var id = $(this).parent().attr('id');

                            // update logicGO field if paragraph opened
                            if (id == paragraph.current()) {
                            
                                paragraph.close(id);                                
                            }

                            $(this)
                                .attr('goto', value)
                                .html( $(this).html().replace(new RegExp(parID,'g'), value) );
                        });
                    }
                    
                } else if (node.type.indexOf('folder') == 0) {
                    // rename folder in data-source
                    $('#data-source folder#'+node.id).attr('name',value);
                    // reselect node
                    toc.select_node( node.id  , true);
                }
            
        } else {
            error(lang.current.paragraph_not_found);
        }
    };
    
    paragraph.setLabel = function(parID, value){        
        
        if ($('#data-source article').length > 0) {
        
            var parID   = (typeof parID == 'string') ? parID : undefined || paragraph.current(),
                current = $('#data-source article#'+parID).attr('label') || '',
                value   = value || prompt(lang.current.label_enter, current),
                nav     = $('#nav').jstree(true),
                toc     = $('#toc').jstree(true);

            if (value){

                // sanitize value
                value = cleanName(value);

                nav.set_text('nav-root', parID+':'+value);
                $('#data-source article#'+parID).attr('label', value);

                // update toc
                toc.set_text(parID, parID +':'+value);
            }
        } else {
            error(lang.current.project_not_loaded);
        }
    };
    
    paragraph.show = function(parID) { debug('paragraph.show('+parID+')');
        
        if (parID == null) return;                

        // recreate tree
        gui.nav.build(parID);
        
        var nav = $('#nav').jstree(true),
            toc = $('#toc').jstree(true);
                
        // if article
        if ( $('#data-source article#'+parID).children().length > 0 ) {
            
            $('#btnAddText').prop(  'disabled', false);
            $('#btnAddAction').prop('disabled', false);
            $('#btnAddScript').prop('disabled', false);
            $('#btnAddHandler').prop('disabled', true);
            $('#btnTranslate').prop('disabled', false);
            $('#btnPageUp').prop('disabled', false);
            $('#btnPageDn').prop('disabled', false);
            $('#mainbar #btnParCopy').prop('disabled', false);
            $('#mainbar #btnBlkCopy').prop('disabled', false);
            $('#mainbar #btnPaste').prop('disabled', false);
            $('#mainbar #btnDebug').prop('disabled', false);
            
        } else {
            // handler
            $('#btnAddText').prop(  'disabled', true);
            $('#btnAddAction').prop('disabled', true);
            $('#btnAddScript').prop('disabled', true);
            $('#btnAddHandler').prop('disabled', false);
            $('#btnTranslate').prop('disabled', true);
            $('#btnPageUp').prop('disabled', true);
            $('#btnPageDn').prop('disabled', true);
            $('#mainbar #btnParCopy').prop('disabled', true);
            $('#mainbar #btnBlkCopy').prop('disabled', true);
            $('#mainbar #btnPaste').prop('disabled', true);
            $('#mainbar #btnDebug').prop('disabled', true);
            
            // paragraph icon
            nav.set_icon('nav-root', toc.get_icon(parID) );
        }
        
        // select paragraph in toc        
        //
        toc.deselect_all();
                
        if ( $('#tab-'+parID+' .blk_group:first').attr('captal-tag') == 'handler') {
            // handler
            toc.select_node(parID, true);
            
        } else {
            // article
            //$('#toc').jstree(true).select_node('toc_'+parID, true);
            toc.select_node(parID, true);
        }   
        
        // refresh toolbar buttons
        $('#toolbar .toolbar-sub .selected').removeClass('selected');
        $('#toolbar .toolbar-sub .state-'+paragraph.state(parID)).addClass('selected');
        
        if ($('#data-source article#'+parID).attr('isend') == 'true'){ 
        
            $('#toolbar #btnParRoleEnd').addClass('selected');
        }
        
        // autolinks
        block.addLinks();
        
        // autotranslate
        if (cfg.autoTranslate) {
            
            $('#tab-'+parID+' #blk_text .ace_editor').each(function(index){

                var editor = ace.edit( $(this).attr('id') );

                editor.renderer.updateFull();
            });
        }
    };    
    
    // shuffle all numeric paragraphs, preserve position in user folders
    paragraph.shuffle = function(){ debug('paragraph.shuffle()');
        
        if ($('#data-source article').length > 1) {
            
            if (!confirm(lang.current.paragraph_shuffle_confirm)) return;
            
            $('#dlgLoading').show();
            paragraph.close('all');
            
            // call it in new thread to let dlgLoading appear
            setTimeout(function(){
            
                    // get list of sorted numereic paragraph id's and shuffle them
                var res = $('#data-source article')
                    .filter(function(){                    
                        return $(this).attr('id').match(/\d+/);
                    })
                    .clone()
                    .map(function(){ 
                        return $(this).attr('id');
                    })
                    .get();

                var last     = res.length-1,
                    i        = 1, // prezerve first numeric paragraph
                    ind      = res.slice(0),
                    parID,
                    newID,
                    rndID;

                for (i; i <= last; i++){

                    rndID = random(1, res.length-1);
                    parID = res[rndID];
                    console.log('indexes:',ind)
                    console.log('random:',rndID,'parID:',parID,'i',i,'newID:',ind[i]);
                    newID = 'shuffled_'+ind[i];
                    res.splice(rndID,1);

                    paragraph.rename(parID, newID);
                }

                // rename from tmp name to new
                for (i = 1; i <= last; i++){

                    parID = 'shuffled_'+ind[i];
                    newID = parID.substr(9);

                    paragraph.rename(parID, newID);
                }

                // sort autofolder
                $('#data-source folder[type="autofolder"]').html(
                    $('#data-source folder[type="autofolder"] article').sort(function(a,b){
                        return a.id - b.id;
                    })
                );
                
                var xml = '<xml>'+ $('#data-source').html();

                // rename procedure completed, reload project, remove temp
                project.loadXML(xml);
                
            }, 200);
        }
    };
    
    paragraph.state = function(parID, state){ debug('paragraph.state()');
        
        parID = parID || paragraph.current();
        
        // no state for handlers
        if ($('#data-source handlers handler[name="'+parID+'"]').length > 0){
            return;
        }
        
        if (state == undefined) {
            
            // get current state
            return  $('#data-source article#'+parID).attr('state') || 'new';
        
        } else {            
            
            if (state == 'refresh') {
                
                state = $('#data-source article#'+parID).attr('state') || 'new';
                
            } else {
        
                // update datasource
                $('#data-source article#'+parID).attr('state', state);
            }
            
            var type = 'paragraph_'+ state +'_'+ paragraph.linkState(parID);

            // update toc
            var toc = $('#toc').jstree(true);        
            toc.set_type( parID, type );

            // update desk
            if ($('#tab-'+parID).length > 0) {    

                $('#tab-'+parID).attr('captal-state', state);

                // update tab                
                var img = $('#toc').jstree(true).settings.types[ type ].icon;
                $('#tabs [aria-controls="tab-'+parID+'"] .tab-icon').attr('src', img );

                // update buttons
                if (parID == paragraph.current() ) {

                    $('#toolbar .toolbar-sub button.state.selected').removeClass('selected');
                    $('#toolbar .toolbar-sub button.state.state-'+state)
                        .addClass('selected')
                        .trigger('blur');
                }
            }
        }
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //                              PROJECT
    ////////////////////////////////////////////////////////////////////////////
    
    project = {
        file        : { name: "Untitled.xml"},
        gameID      : null,
        imported    : null,
        isComponent : false,
        sourceLang  : 'eng',
        targetLang  : 'rus',
        encoding    : 'utf8',
        marks       : []
    };          
    
    project.addComponent = function(o){ debug('project.addComponent(',o);
        
        var toc   = $('#toc').jstree(true),
            known = toc.get_node( o.index_name );
        
        if (known.type == 'component') {
        
            error(lang.current.component_already_added);
        
        } else {
        
            // update data-source
            $('<component/>')
                .attr({
                    id      : o.index_name, 
                    version : o.version
                })
                .appendTo('#data-source components');

            // update toc tree
            toc.create_node( 
                'toc-components', 
                {
                    type    : 'component', 
                    id      : o.index_name, 
                    text    : o.fullname 
                }, 
                'last',
                function (o){
                    toc.open_node('toc-components');
                }
            );
        }
    };
    
    project.close = function(){
        
        
    };
    
    project.export = function(){ debug('project.export()');
        
        var parCount    = 0;
        var sLang       = $('#dlgExport #sLang').val();        
        
        if (sLang  == 'all') {
            
            parCount = $('#data-source article').length;
            
        } else {
            
            parCount = $('#data-source article:has(text[lang="'+ sLang +'"])').length;
        }                                
                
        
        if (parCount > 0) {
            
            $('#dlgExport #iActLeft').val( $('#dlgImportTXT #iActLeft').val() );
            $('#dlgExport #iActRight').val( $('#dlgImportTXT #iActRight').val() );            
            $('#dlgExport #parCount').html( parCount );                       
            
            $('#dlgExport #pnlActOptions .action:checkbox:checked').each(function(){
                $('<div></div>')
                        .html( $(this).parent().html() )
                        .appendTo( $('#dlgExport #pnlActOptions') );
            });
            
            // find languages
            $('#data-source text[lang]:not([lang="undefined"])').each(function(){
                var tlang = $(this).attr('lang');
                if ( $('#sLang option[value="'+ tlang +'"]').length == 0 ) {
                    $('#sLang').append('<option value="'+ tlang +'">'+ lang.freq.index[ tlang ] +'</option>');
                }
            });
            
            //$('#dlgExport #sLang')
            
            if ($('#dlgExport').hasClass('ui-dialog-content')){
                
                $('#dlgExport').dialog( "open" );
                
            } else {
                $('#dlgExport').dialog({
                    
                    title       : lang.current.project_export,
                    modal       : true,
                    sizeable    : false,
                    width       : 1000,
                    height      : 600,
                    buttons: [{ 
                            text: lang.current.project_export,
                            click: function(){      
                            
                                $('#dlgLoading').show();
                                project.exportDOC();                                
                                $( this ).dialog( "close" );                                                                                                                                
                            }
                        },
                        {
                            text: lang.current.cancel,
                            click: function() {    
                            
                                $( this ).dialog( "close" );
                            }
                        }
                    ],
                    create: function( event, ui ) {
                        
                        project.exportDOC('preview');
                        
                        $('#dlgExport #cLineBr').prop('checked', cfg.lineBreak);
                    },
                    close: function(){
                        $( this ).dialog( "destroy" );
                    }
                });
            }           
            //$('#toc-header a').removeClass('changed');
            
        } else {
            error(lang.current.paragraph_not_found);
        }
    };
    
    project.exportDOCunfinished = function(){
        
        var bookTitle       = $('#data-source book').attr('title'),
            sLang           = $('#dlgExport #sLang').val() || 'all',
            cLineBr         = $('#dlgExport #cLineBr:checked').length >0 ? true : false,
            cExportActions  = $('#dlgExport #cExportActions:checked').length >0 ? true : false,
            parLast         = $('#data-source article').length -1;
        
        WordXML.createDocument( bookTitle ,'connect');
        
        $('#data-source article').sort(alphanum).each(function(parInd){ // alphanum.js
            
            var parID = $(this).attr('id');
                //blkLast = ;
            
            WordXML.addParagraph(parID);
            
            $(this).children().each(function(blkInd){
                
                var tag         = $(this)[0].localName,
                    body        = $(this)[0].innerHTML.replace(/&lt;\!\[CDATA\[/i,'').replace(']]&gt;',''),
                    tLang       = $(this).attr('lang'),
                    logicGO     = $(this).attr('goto')  || '',
                    blkLast     = $('#data-source article#'+parID).children().length -1;
                    
                
                if (tag == 'text' && ( tLang == sLang || sLang == 'all') ) {
                    
                    WordXML.addText(body);
                
                } else if (tag == 'action' && cExportActions && ( tLang == sLang || sLang == 'all') ) {
                    
                    WordXML.addAction(body, logicGO);
                    
                }
                
                if (parInd == parLast && blkInd == blkLast){
                    
                    var doc  = WordXML.buildDocument();
                    var blob = new Blob([ doc ], {type: "text/xml;charset=utf-8"});
            
                    saveAs(blob, bookTitle +".doc");
                }
            });
        });
    };
    
    project.exportDOC = function(mode){ debug('project.exportDOCX()');
        
        var doc     = $('#doc').html(''),
            art     = 0,
            artMax  = $('#data-source article').length,
            sLang   = $('#dlgExport #sLang').val() || 'all',
            cLineBr = $('#dlgExport #cLineBr:checked').length >0 ? true : false,
            cExportActions = $('#dlgExport #cExportActions:checked').length >0 ? true : false;

        doc.append('<h1>'+ $('#data-source book').attr('title') +'</h1>');

        $('#data-source article').sort(alphanum).each(function(){ // alphanum.js
            
            var par = $(this).attr('id');
            var blk = 0;
            var blkMax = $('#data-source article#'+par).children().length;
            art++;

            doc.append('<h3>'+par+'<a name="'+par+'"></a></h3>');

            $(this).children().each(function(){
                
                var tag         = $(this)[0].localName;
                var body        = $(this)[0].innerHTML.replace(/&lt;\!\[CDATA\[/i,'').replace(']]&gt;','');
                //var type        = $(this).attr('type')  || '';
                var id          = $(this).attr('id')    || '';
                var logicTRUE   = $(this).attr('if')    || '';
                var logicFALSE  = $(this).attr('ifnot') || '';
                var logicGO     = $(this).attr('goto')  || '';
                var logicDO     = $(this).attr('do')    || '';
                //var name        = ( id == undefined ) ? tag : id +'.'+ tag; // id:type
                var iActLeft    = $('#dlgExport #iActLeft').val();
                var iActRight   = $('#dlgExport #iActRight').val();
                var tLang       = $(this).attr('lang');
                blk++;                                                                           
                
                if (tag == 'text' && ( tLang == sLang || sLang == 'all') ) {   
                    
                    body = body
                            .split('\n')
                            .map(function(item){ return '<p class="CaptalParagraph">'+ item +'</p>'; })
                            .join('\n');
                    
                    body = body
                            .replace(/\#\d+\b/g, function(str){
                                var item = str.substr(1);
                                return '<a class="MsoHyperlink" href="#'+item+'"><span class="CaptalLink">'+ item +'</span></a>';
                            })
                            .replace(/[{}]/g, '');
                    
                    doc.append(body);
                    //doc.append('<p class="CaptalParagraph">'+ body +'</p>');
                    
                } else if (tag == 'action' && cExportActions && ( tLang == sLang || sLang == 'all') ) {
                        
                    var link = '';
                    
                    if ( $.trim(body) != logicGO ) {
                        
                        link = '('+ logicGO +')';                        
                        body += ' ';
                    } else {
                        
                        link = logicGO;
                        body = '';
                    }
                    
                    body = '<p class="CaptalAction">'+ body +' <a class="MsoHyperlink" href="#'+logicGO+'"><span class="CaptalLink">'+ link +'</span></a></p>';
                    
                    doc.append( body );
                }
                

                if (art == artMax && blk == blkMax) { // last
                    
                    $('#dlgLoading').hide();
                    
                    if (mode == 'preview') {
                        
                        $('#dlgExport #parCount').html( artMax );
                        $('#dlgExport #pnlPreview').html( doc.html().replace(/\n/g,'') );
                        
                    } else {
                    
                        
                        log( lang.current.export_doc_writing );
                        var blob = new Blob( [ '<html \
                            xmlns:v="urn:schemas-microsoft-com:vml" \
                            xmlns:o="urn:schemas-microsoft-com:office:office" \
                            xmlns:w="urn:schemas-microsoft-com:office:word" \
                            xmlns="http://www.w3.org/TR/REC-html40">\
                            <head>\
                                <meta name="generator" "Captal '+ $('.version').text() +'">\
                                <meta name="classification" content="Книга-игра">\
                                <meta name="created" content="'+($.datepicker.formatDate('yymmdd', new Date()))+';'+(new Date().getTime())+'">\
                                <meta name="description" content="Посетите нас на http://quest-book.ru">\
                                <meta name="keywords" content="quest book gamebook кни книгра">\
                                <style>\
                                v\:* {behavior:url(#default#VML);}\
                                o\:* {behavior:url(#default#VML);}\
                                w\:* {behavior:url(#default#VML);}\
                                .shape {behavior:url(#default#VML);}\
                                </style>\
                                <style>\
                                <!-- \n\
                                @page {\n\
                                    mso-page-orientation: portrait;\n\
                                    size: 21cm 29.7cm;\n\
                                    margin:1cm 1cm 1cm 1cm;\n\
                                }\n\
                                @page Section1 {\n\
                                    size:8.5in 11.0in;\n\
                                    margin:1.0in 1.0in 1.0in 1.0in;\n\
                                }\n\
                                div.Section1 { page:Section1;\n\
                                } \n\
                                .MsoHyperlink, span.CaptalLink {\n\
                                    mso-style-priority:99;\n\
                                    mso-style-name: "CaptalLink";\n\
                                    mso-style-parent:"Normal";\n\
                                }\n\
                                span.CaptalActionText {\n\
                                    display: inline-block;\n\
                                    color: green;\n\
                                }\n\
                                p.CaptalAction {\n\
                                    '+ ((cLineBr) ? 'white-space: nowrap;' : '') +'\n\
                                }\n\
                                p.CaptalParagraph {\n\
                                    '+ ((cLineBr) ? 'white-space: nowrap;' : '') +'\n\
                                }\n\
                                --> \n\
                                </style>\n\
                                <title>'+ $('#data-source book').attr('title') +'</title>\n\
                                <xml>\n\
                                <w:WordDocument>\n\
                                    <w:View>Print</w:View>\n\
                                    <w:Zoom>90</w:Zoom>\n\
                                    <w:DoNotOptimizeForBrowser/>\n\
                                    <w:styles>\n\
                                        <w:versionOfBuiltInStylenames w:val="4"/>\n\
                                        <w:latentStyles w:defLockedState="off" w:latentStyleCount="156"/>\n\
                                        <w:style w:type="paragraph" w:default="on" w:styleId="Normal">\n\
                                            <w:name w:val="Normal"/>\n\
                                            <w:rPr>\n\
                                                <wx:font wx:val="Times New Roman"/>\n\
                                                <w:sz w:val="24"/>\n\
                                                <w:sz-cs w:val="24"/>\n\
                                                <w:lang w:val="RU-RU" w:fareast="RU-RU" w:bidi="AR-SA"/>\n\
                                            </w:rPr>\n\
                                        </w:style>\n\
                                        <w:style w:type="character" w:default="on" w:styleId="DefaultParagraphFont">\n\
                                            <w:name w:val="Default Paragraph Font" />\n\
                                            <w:semiHidden />\n\
                                        </w:style>\n\
                                    </w:styles>\n\
                                </w:WordDocument>\n\
                                </xml>\n\
                            </head>\n\
                            <body><div class="Section1">\n\
                                '+ doc.html() +'</div></body></html>' ], 
                            {type: "text/xml;charset=utf-8"}
                        );

                        saveAs(blob, $('#data-source book').attr('title') +".doc");
                    }
                }
            });
        });
    };
    
    project.exportRepo = function(){
        if (project.gameID != null) {
            repo.game.publish( project.gameID, function(res){
                if (res.result == 'ok') {
                    log(lang.current.cloud_game_awaiting);
                }
            });
        } else {
            error(lang.curent.cloud_game_not_found);
        }
    };
    
    project.import = function(e){
        
        if ( !$(e.currentTarget).hasClass('disabled') || e == 'wizard' ) {
        
            $('#openProject')
                .attr('accept','.pdf, .docx, .txt')
                .trigger('click');
        } else {
            
            return false;
        }
    };
    
    project.importDOCX = function(f){ debug('project.importDOCX()');

        var jf = new JsFile(f, { workerPath: 'lib/jsfile/'});

        jf.read().then(function(res){ 
            
            project.preloadDOCX( res.html() );
            
        },function(e){
            debug('Reading error', e);
        });                                
        
    };
    
    project.importPDF = function(f){ debug('project.importPDF()');
        
        var reader = new FileReader();
                            
        PDFJS.workerSrc = 'lib/pdf.worker.js';

        reader.onload = (function(theFile){
            return function(e){
                var uint8Array = new Uint8Array(e.target.result);
                var parameters = Object.create(null);

                parameters.data = uint8Array;

                PDFJS.getDocument(parameters).then(function(res){
                    project.preloadPDF(res);                                                                
                });                                
                
            };
        })(f);

        reader.readAsArrayBuffer(f);                                        
    };            
    
    project.importTXT = function(f, encoding){ debug('project.importTXT()');
        
        var reader   = new FileReader();        
        
               f =        f || project.imported;
        encoding = encoding || project.encoding;        
        
        $('#dlgLoading').show();
        
        reader.onload = function(e){
            var res = e.target.result;            
            project.preloadTXT( res, encoding );            
        };
        
        reader.readAsText(f, encoding);               
    };        
    
    project.importRepo = function(){        
        
        // reset list
        $('#dlgRepo #list').html('');
        
        $('#dlgRepo').dialog({
            modal       : true,
            sizeable    : false,
            width       : 870,
            height      : 600,
            buttons: {
              Закрыть: function() {
                $( this ).dialog( "close" );
              }
            },
            create: function(){
                var counts = {};
                var icons = {
                    1: 'bullet_edit.png',
                    2: 'hourglass.png',
                    3: 'exclamation.png',
                    4: 'lock.png',
                    5: 'tick.png'
                };                
                
                $('#dlgRepo #list').html('');
                
                for (var i in repo.statuses) {
                    $('#dlgRepo #list').append('<h3>'+ repo.statuses[i].name+': <i></i></h3><div id="groupRow'+i+'"></div>');
                    counts[ i ] = 0;
                }                                
                
                repo.game.list(function(res){
                    var tgame, state;

                    if (res.result == 'ok') {
                        for (var i in res.data.page) {
                            tgame = res.data.page[i];
		
                            // skip old unsupported games
                            if (tgame.player_type.indexOf('atril') == -1) continue;
							
                            state = repo.statuses[ tgame.status ].name;
                            tgame.cover = (tgame.cover != '') ? tgame.cover : 'img/dot-transparent.png';
                            counts[ tgame.status ]++;

                            $('#dlgRepo #list #groupRow'+ tgame.status ).append( '<div game_id="'+ tgame.game_id +'" class="gameRow" onclick="repo.game.get('+ tgame.game_id +')">\
                                <div class="cover col">\
                                    <div class="paper"></div>\
                                    <div class="paper"></div>\
                                    <div class="back"></div>\
                                    <div class="bone"></div>\
                                    <div class="art"></div>\
                                    <img class="art" src="'+ tgame.cover +'">\
                                    <img class="status" title="'+ state +'" src="img/32/'+ icons[ tgame.status ] +'">\
                                </div>\
                                <div class="info col">\
                                    <div class="title"><span>'+ tgame.fullname +'</span></div>\
                                    <div class="author">Автор: <span>'+ tgame.author_name +'</span></div>\
                                    <div class="rating">Рейтинг: <span>'+ tgame.rating_current +'</span></div>\
                                </div>\
                            </div>');

                            $('#dlgRepo #list #groupRow'+ tgame.status ).prev().find('i').html('('+ counts[ tgame.status ] +')');

                            if ( i == res.data.page.length -1 ){
                                $('#dlgRepo #list').accordion({
                                    collapsible : true,
                                    heightStyle : "content"
                                });

                                $('#dlgRepo #repo-search').appendTo( $('div.ui-dialog[aria-describedby="dlgRepo"]') );
                                $('#repo-search #iSearch').val('').focus();
                            }
                        }                   
                    } else {
                        // error
                        $('#dlgRepo #list').append('<div class="message">'+lang.current.cloud_unavailable+'</div>');
                    }
                });
            },
            close: function() {
                
                $('#repo-search').appendTo( $('#dlgRepo') );
                
                if ( $('#dlgRepo #list').hasClass('ui-accordion') ){
                    
                    $('#dlgRepo #list').accordion('destroy').html('');
                }
                $( this ).dialog( "destroy" );
            }
            
        });
        
    };
    
    project.listTags = function(){
        
        var utag = {}; // unique tags

        $('#dlgTaglist #tagName').html('');
        $('#dlgTaglist #search-results').html('');

        if ( $('#data-source article metadata tag').length > 0 ) {

            $('#data-source article metadata tag').each(function(index){

                var tag = $(this).html();

                if ( utag[ tag ] == undefined ) {

                    utag[ tag ] = true;

                    $('#dlgTaglist #search-results').append('<div class="selected-tag" onclick=paragraph.listByTag("'+tag+'")><img src="img/16/tag_hash.png"> '+tag+'</div>');
                }
            });
        } else {
            
            $('#dlgTaglist #search-results').append(lang.current.tags_not_found);
        }
    };
    
    project.loadTXT = function(mode){ 
               
        mode = mode || 'import';        
        debug('project.loadTXT('+mode+')');
        
        var xml         = document.createElement('xml'),
            mark,
            line,
            trimLine,
            numLine,
            parHTML     = '',
            parID       = 0,       // current paragraph
            parCount    = 1,
            parNumber   = false, // if paragraph is just a number
            buffer      = [],
            jbuffer     = '', // buffer joined
            parMarker   = $('#dlgImportTXT input[type="radio"]:checked'),
            actMarkers  = [],
            cActString  = $('#dlgImportTXT #cActString:checked').length > 0 ? true : false,
            cActRemove  = $('#dlgImportTXT #cActRemove:checked').length > 0 ? true : false,
            cActTags    = $('#dlgImportTXT #cActTags:checked').length > 0 ? true : false,
            iParLeft    = $('#dlgImportTXT input#iParLeft').val(),
            iParRight   = $('#dlgImportTXT input#iParRight').val(),
            iActLeft    = $('#dlgImportTXT input#iActLeft').val(),
            iActRight   = $('#dlgImportTXT input#iActRight').val(),
            res         = $('#import-source')
                                .html()
                                .replace( new RegExp('&lt;','g'), '<' )
                                .replace( new RegExp('&gt;','g'), '>' );                        
        
        // 
        if (cActTags) {
            
            actMarkers.push()
        }
        
        //
        $('#dlgImportTXT input[type="checkbox"]:checked').each(function(){
            
            actMarkers.push( $(this).attr('marker') );
        });
        
        
        // delete 0 paragraph from current project if it's empty
        if ( $('#data-source article#0 text').text() == '<![CDATA[]]>') {
            
            $('#data-source article#0').remove();
        }
        
        // append to current project                     
        $(xml).html( '<xml>'+  $('#data-source').html() +'</xml>' );
                    
        mark      = ( parMarker.attr('marker') != '!Strict' ) ? project.marks[parMarker.attr('marker')] : { prefix: iParLeft, affix: iParRight };
        parNumber = ( mark.prefix == '' && mark.affix == '') ? true : false;
        res       = res.split('\n');

        for (var i in res){  // each import-source line

            line     = res[i];
            trimLine = $.trim(line);
            numLine  = trimLine.match(/\d+/);
            
            if (line == '') { // skip empty lines               
                buffer.push('');

                if (i < res.length-1) {
                    continue;
                }
            }

            if ( (!parNumber && trimLine.indexOf(mark.prefix) == 0) || (parNumber && trimLine == numLine)) { // possible paragraph opening

                if ( mark.affix == '' || trimLine.indexOf(mark.affix) > 0 ) { 

                    // Ok, paragraph found. Append buffer to previous paragraph

                    // flush buffer
                    jbuffer = buffer.join('\n').replace(/\s+$/g,'').replace(/\[/g, '{').replace(/\]/g, '}');

                    // process actions
                    parHTML = processActions(jbuffer, actMarkers, cActString, cActRemove, { prefix: iActLeft, affix: iActRight });

                    // add paragraph content to xml
                    $(xml).find('article#'+parID).append(parHTML);
                    buffer  = [];
                    parHTML = '';

                    parCount++;

                    // create next paragraph
                    //
                    if (parNumber) {
                        // numeric paragraph declaration
                        parID = numLine;
                        
                    } else if (trimLine.indexOf(mark.affix) > 0) {
                        // paired marker                            
                        parID = trimLine.substring( mark.prefix.length, trimLine.indexOf(mark.affix) ); 
                        
                    } else {
                        // single marker
                        parID = trimLine.substring( mark.prefix.length );
                    }
                    
                    // prevent dublicate paragraph creation
                    if ($(xml).find('book folder article#'+parID).length == 0) {
                    
                        $(xml).find('book folder').append('<article id="'+parID+'"></article>');
                    }

                } else {                    
                    // false alarm, not a paragraph declaration
                    buffer.push(line);
                }

            } else {

                buffer.push( line );
            }
        }
        
        // flush last buffer
        // @TODO: !! process it with action detection !!
        jbuffer = buffer.join('\n').replace(/\s+$/g,'');
        
        // process actions
        parHTML = processActions(jbuffer, actMarkers, cActString, cActRemove);

        // add paragraph content to xml
        $(xml).find('article#'+parID).append(parHTML);
        
        if (mode == 'preview') {
            
            $('#dlgImportTXT #pnlPreview').html('');            
            $('#dlgImportTXT #parCount').html(parCount);
            
            $(xml).find('article').each(function(index){                
                
                var html = $(this).find('text').html() || '';
                             
                $('#dlgImportTXT #pnlPreview')
                        .append('<h4>'+ $(this).attr('id')+'</h4><p>'+
                                    
                                    html
                                        .replace( /\<\!\[CDATA\[/i,'')
                                        .replace( /&lt;\!\[CDATA\[/i,'')
                                        .replace(']]>','')
                                        .replace(']]&gt;','')+
                                '</p>');
                
            });
            
        } else { // real import
            
            // remove import-source
            $('#import-source').remove();

            project.loadXML(xml);
        }
    };
    
    /**
     * Load default format
     * All importing formats are converted to XML and then loaded with this fn
     * @param {type} res
     * @param {type} callback
     * @returns {undefined}
     */
    project.loadXML = function(res, callback) { debug('project.LoadXML(...)');                

        project.source   = res;
        project.callback = callback;

        setTimeout(function(){
            
            var res      = project.source,
                book     = $(res).find('book'),
                callback = project.callback;
                
            gui.cleanDesk();

            if (book.length == 0){
                $('#toc')
                    .jstree('destroy')
                    .html( $('#new-toc-template').html() );

                    //vars.tree = $('#toc').jstree({ });
                $('#dlgLoading').hide();

            } else {

                var node     = 0;
                var page     = 0;
                var bookName = $(book).attr('title') || lang.current.untitled;
                var salt = (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).substring(0,33);

                if ( $(book).attr('guid') == '' ) $(book).attr('guid',salt);


                $('title').html( bookName + ( (cfg.readonly) ? ' [READ ONLY] ' : '') + ' - '+ lang.current.captal+' '+ $('.version').html() );

                // @TODO: create own theme

                // recreate tree
                $('#toc')
                    .jstree('destroy')
                    .html( $('#new-toc-template').html() );

                // create toc tree
                //
                $('#toc').jstree({
                    core: {
                        check_callback : function(e, node, node_parent, node_position, more){                      
                            if (e == 'move_node') {
                                // restrict some dones from drop

                                if (node_parent.type.indexOf('folder') == -1) {
                                    // not folder
                                    return false;

                                } else if (more) {

                                    if (more.ref != undefined)                                
                                    if (more.pos != 'i' && more.ref.type.indexOf('paragraph_') == -1) {
                                        // it's folder, but not inside & not paragraph
                                        return false;
                                    }             
                                }
                            }                                                 
                            return true;
                        },
                        multiple: false,
                        themes: { responsive: false }
                    },
                    plugins: [ "contextmenu", "types", "dnd" ],
                    dnd: { 
                        copy: false,
                        inside_pos: 'last',
                        check_while_dragging: true,
                        is_draggable: function(node){
                            // restrict some nodes from dragging
                            if (node[0].type.indexOf('paragraph_') == -1) {
                                return false;
                            } else {
                                return true;
                            }
                        }                    
                    },
                    contextmenu: { items: (cfg.readonly ? {} : gui.contextMenuToc ) },
                    types: {
                        root            : { icon: "img/icon-book.png" },
                        paragraphs      : { icon: "img/16/folder_page.png" },                     
                        autofolder      : { icon: "img/16/folder_stand.png" },
                        folder_yellow   : { icon: "img/16/folder_yellow.png" },
                        folder_page     : { icon: "img/16/folder_page_white.png" },
                        folder_black    : { icon: "img/16/folder_black.png" },
                        folder_red      : { icon: "img/16/folder_red.png" },
                        folder_green    : { icon: "img/16/folder_green.png" },
                        folder_blue     : { icon: "img/16/folder_blue.png" },
                        folder_torn     : { icon: "img/16/folder_torn.png" },
                        folder_wrench   : { icon: "img/16/folder_wrench.png" },
                        folder_user     : { icon: "img/16/folder_user.png" },
                        folder_table    : { icon: "img/16/folder_table.png" },
                        folder_star     : { icon: "img/16/folder_star.png" },
                        folder_picture  : { icon: "img/16/folder_picture.png" },
                        folder_palette  : { icon: "img/16/folder_palette.png" },
                        folder_link     : { icon: "img/16/folder_link.png" },
                        folder_lightbulb: { icon: "img/16/folder_lightbulb.png" },
                        folder_key      : { icon: "img/16/folder_key.png" },
                        folder_image    : { icon: "img/16/folder_image.png" },
                        folder_heart    : { icon: "img/16/folder_heart.png" },
                        folder_go       : { icon: "img/16/folder_go.png" },
                        folder_find     : { icon: "img/16/folder_find.png" },
                        folder_explorer : { icon: "img/16/folder_explorer.png" },
                        folder_edit     : { icon: "img/16/folder_edit.png" },
                        folder_delete   : { icon: "img/16/folder_delete.png" },
                        folder_database : { icon: "img/16/folder_database.png" },
                        folder_camera   : { icon: "img/16/folder_camera.png" },
                        folder_bug      : { icon: "img/16/folder_bug.png" },
                        folder_brick    : { icon: "img/16/folder_brick.png" },
                        folder_bell     : { icon: "img/16/folder_bell.png" },

                        paragraph_new            : { icon: "img/16/page-new.png"          }, // deprecated
                        paragraph_new_normal     : { icon: "img/16/page-new.png"          },
                        paragraph_new_end        : { icon: "img/16/page-new-green.png"    },
                        paragraph_new_orphan     : { icon: "img/16/page-new-red.png"      },
                        paragraph_new_stub       : { icon: "img/16/page-new-yellow.png"   },
                        paragraph_draft_normal   : { icon: "img/16/page-draft.png"        },
                        paragraph_draft_end      : { icon: "img/16/page-draft-green.png"  },
                        paragraph_draft_orphan   : { icon: "img/16/page-draft-red.png"    },
                        paragraph_draft_stub     : { icon: "img/16/page-draft-yellow.png" },
                        paragraph_validate_normal: { icon: "img/16/page-validate.png"     },
                        paragraph_validate_end   : { icon: "img/16/page-validate-green.png"  },
                        paragraph_validate_orphan: { icon: "img/16/page-validate-red.png"    },
                        paragraph_validate_stub  : { icon: "img/16/page-validate-yellow.png" },
                        paragraph_ready_normal   : { icon: "img/16/page-ready.png"        },
                        paragraph_ready_end      : { icon: "img/16/page-ready-green.png"  },
                        paragraph_ready_orphan   : { icon: "img/16/page-ready-red.png"    },
                        paragraph_ready_stub     : { icon: "img/16/page-ready-yellow.png" },

                        handlers        : { icon: "img/16/folder_error.png" },
                        handler         : { icon: "img/16/icon-handler.png" },
                        components      : { icon: "img/16/folder_brick.png" },
                        component       : { icon: "img/16/brick.png" }
                    }
                }).on("changed.jstree", function (e, data) {

                    if ( data.action == 'select_node'){ 

                        var id = data.node.id.replace(/<i(.|\n)*?\/i>/,'').trim(); 

                        //console.log(data.node)

                        if ( data.node.type.indexOf('paragraph_') == 0 ) {

                            paragraph.open({ paragraphID: id });

                        } else if (data.node.type == 'handler') {

                            //handler.open({ handlerID: id });
                            paragraph.open({ paragraphID: id });
                        }
                    }

                }).on("create_node.jstree",function(e, data){                                


                }).on("rename_node.jstree",function(e, data){ 

                    var toc   = data.instance;

                    if (data.old == data.text) {

                        // same name, nothing changed, do nothing

                    } else if (data.node.id == 'toc-book') {

                        project.rename( data.text );

                    } else if (data.node.type.indexOf('folder') == 0) {
                        // rename folder in data-source
                        $('#data-source folder#'+data.node.id).attr('name',data.node.text);
                        // reselect node
                        toc.select_node( data.node.id  , true);

                    } else if (data.node.type.indexOf('paragraph_' == 0)) {
                        // we should not get here, but ok
                        paragraph.rename(data.node.id, data.text);
                    }      

                }).on("ready.jstree",function(e, data){ debug('toc.jstree.ready()');

                    var tree = data.instance;
                    var last = $(book).find('article').length;

                    /**
                     * LOADING articles
                     * 
                     * We need this to be run after xml structure changes ready
                     * @returns {undefined}
                     */
                    var loadArticles = function() { debug('load articles()');

                        $('#data-source').find('folder').each(function(){

                            var tfolder = $(this);
                            var fname   = tfolder.attr('name') || 'autofolder';                    
                            var group= 0;
                            var fc   = 0;                    
                            var fi   = 0;                                        

                            if (tfolder.attr('type') == 'autofolder') {
                                // Autofolders
                                //
                                var fmax    = $(tfolder).find('article').length;

                                $(tfolder).find('article').each(function(){
                                    //var tree = $('#toc').jstree(true);
                                    var tarticle = $(this),
                                        label    = $(this).attr('label') || '';

                                    fi++;                            
                                    fc++;

                                    if (fc == 1) {                            
                                        // create new autofolder
                                        group = tree.create_node('toc-paragraphs',{
                                            id      : getRandomName('folder'),
                                            text    : '..',
                                            type    : 'autofolder',
                                            li_attr : { 'toc-role':'group' }
                                        },'last');
                                    }


                                    // create paragraph
                                    tree.create_node( group, {
                                        id      : tarticle.attr('id'),
                                        text    : (label) ? tarticle.attr('id') + ':'+label : tarticle.attr('id'),
                                        type    : 'paragraph_new'
                                    }, 'last', function(node){

                                        //tree.set_type( node.id, 'paragraph_new_'+paragraph.linkState(node.id) );
                                        paragraph.state(node.id, 'refresh');

                                    });                                                                

                                    if (fc == paragraph.groupBy) {
                                        fc = 0;
                                        gui.tocUpdate(group);
                                    }

                                    if (fi == fmax) {
                                        gui.tocUpdate(group);
                                    }

                                });  

                            } else {

                                tree.create_node( 'toc-paragraphs',{
                                    id      : tfolder.attr('id'),
                                    text    : fname,
                                    type    : tfolder.attr('type'),                                
                                    li_attr : { 'toc-role': 'group' }
                                },'last', function(parent){

                                    $(tfolder).find('article').each(function(){

                                        var tarticle = $(this),
                                            label    = $(this).attr('label') || '';

                                        tree.create_node( parent.id, {
                                            id      : tarticle.attr('id'),
                                            text    : (label) ? tarticle.attr('id') + ':'+label : tarticle.attr('id'),
                                            type    : 'paragraph_new'
                                        },'last',function(node){

                                            //tree.set_type( node.id, 'paragraph_new_'+paragraph.linkState(node.id) );
                                            paragraph.state(node.id, 'refresh');
                                        });
                                    });
                                }); 
                            }                    
                        });

                        // fix missing language attributes in data-source
                        var arr = ['text','action'];                    
                        for (var i in arr) {                        
                            $('#data-source article '+arr[i]+':not([lang])').each(function(){
                                $(this).attr('lang', lang.detect( $(this).text() ));
                            });
                        }

                        // fix missing handlers
                        var handlers = [
                            'jsiq_init_done',
                            'before_article_unload',
                            'on_article_unload',
                            'jsiq_error',
                            'on_create_article',
                            'on_article_preload',
                            'before_render_article',
                            'on_article_onload',
                            'after_article_loaded',
                            'on_render_article',
                            'on_text_render',
                            'on_render_images',
                            'preload_images',
                            'sound_tracks_load',
                            'sound_tracks_loadbackground',
                            'sound_play_tracks',
                            'sound_volume',
                            'update_charsheet'
                        ];

                        for (var i in handlers){
                            if ( $('#data-source handler[name="'+handlers[i]+'"]').length == 0 ) {
                                $('#data-source handlers').append('<handler name="'+handlers[i]+'"></handler>');
                            }
                        }

                        // fix missing metadata sections
                        $('#data-source article:not(:has(metadata))').append('<metadata></metadata>');

                        $('#dlgLoading').hide();

                        log(lang.current.project_loaded);

                        // reopen paragraphs or just the first one
                        if ( $('#data-source options openparagraph paragraph').length > 0 ) {

                            $('#data-source options openparagraph paragraph').each(function(index){

                                var id = $(this).attr('id');

                                paragraph.open({ paragraphID: id });                            
                            });

                        } else {

                            paragraph.open({ paragraphID: $('#data-source article:first').attr('id') });
                        }

                        // push to storage
                        project.storage.save();

                        if (typeof callback == 'function'){
                            callback();
                        }
                        
                        project.source   = null;
                        project.callback = null;
                    };

                    // push book data to #data-source
                    $('#data-source').html(book);

                    // book root
                    tree.set_text('toc-book', bookName);                
                    tree.set_icon('toc-book', 'img/16/book_open.png');
                    tree.set_type('toc-book', 'root');

                    // add 'untitled' attribute to book in data-source
                    if (bookName == lang.current.untitled) {

                        $(book).attr('title', bookName);
                    }

                    // if no handlers section, create it
                    if ($('#data-source handlers').length == 0) {
                        $('#data-source book').append('<handlers></handlers>');
                    }

                    // if no components section, create it
                    if ($('#data-source components').length == 0) {
                        $('#data-source book').append('<components></components>');
                    }

                    // fix missing options set
                    $('#data-source book')
                        .append( $('#data-source options').length == 0 ? '<options></options>' : '');

                    $('#data-source book options')
                    .append( $('#data-source options linebreak').length == 0     ? '<linebreak>'+ cfg.lineBreak +'</linebreak>\n' : '')
                    .append( $('#data-source options autotranslate').length == 0 ? '<autotranslate>'+ cfg.autoTranslate +'</autotranslate>\n' : '')
                    .append( $('#data-source options sourcelang').length == 0    ? '<sourcelang>'+ project.sourceLang +'</sourcelang>\n' : '')
                    .append( $('#data-source options targetlang').length == 0    ? '<targetlang>'+ project.targetLang +'</targetlang>\n' : '')
                    .append( $('#data-source options openparagraph').length == 0 ? '<openparagraph></openparagraph>\n' : '')
                    .append( $('#data-source options nocoding').length == 0      ? '<nocoding>'+cfg.guiHideCoding+'</nocoding>\n' : '');

                    cfg.lineBreak     = $('#data-source options linebreak').text()     == "1" ? true : false;
                    cfg.autoTranslate = $('#data-source options autotranslate').text() == "1" ? true : false;
                    cfg.guiHideCoding = $('#data-source options nocoding').text()      == "1" ? true : false;
                    project.sourceLang= $('#data-source options sourcelang').text();
                    project.targetLang= $('#data-source options targetlang').text();

                    if (cfg.guiHideCoding) {
                        gui.hideCoding();
                    } else {
                        gui.showCoding();
                    }

                    // if no folders section, create it
                    if ($('#data-source folder').length == 0) {
                        // if there are articles, wrap them
                        if (last > 0) {                        
                            // there will be xml structure changes, control the proccess                        
                            var i = 0;
                            var folder = document.createElement('folder');
                            $(folder).attr({ id: 'folder_0000', type: 'autofolder'});
                            $('#data-source book').prepend( folder );                                                                        
                            $('#data-source article').each(function(){
                                i++;                            
                                $('#data-source folder#folder_0000').append( $(this) );                            
                                if (i == last) {
                                    // now we are ready to load
                                    loadArticles();
                                }
                            });
                        } else {
                            // no articles just add blank section
                            $('#data-source book').append('<folder id="folder_0000" id="autofolder"><article id="0"><text></text></article></folder>');

                            // ok, then load
                            loadArticles();
                        }
                    } else {
                        // nothing to wait, just load them
                        loadArticles();
                    }                                    
                }).bind('move_node.jstree', function(e,data){ debug('move_node.jstree()');
                    // Drag n drop paragraphs
                    //
                    var id        = data.node.id;
                    var oldParent = data.old_parent;
                    var newParent = data.node.parent;
                    var tree      = data.instance;
                    var parentDOM;
                    var res;


                    if (oldParent != newParent){
                        // move to another folder
                        //                                 
                        debug('node',data.node.id,'changed folder from',oldParent,'to',newParent);

                        newParent = tree.get_node(newParent);
                        oldParent = tree.get_node(oldParent);


                        // get neighbor
                        res = newParent.children[data.position+1];

                        if ( res != undefined ) {
                            // put before this one
                            $('#data-source article#'+res).before( $('#data-source article#'+id) );
                            debug('put before',res)
                        } else {
                            res = newParent.children[data.position-1];
                            if (res != undefined) {
                                // put after this one
                                $('#data-source article#'+res).after( $('#data-source article#'+id) );
                                debug('put after',res)
                            } else {
                                // parent has no items, just append

                                $('#data-source folder#'+newParent.id).append( $('#data-source article#'+id) );
                                debug('append',res);
                            }
                        }


                        if ( newParent.type == 'autofolder' ) {                                                                        
                            gui.tocUpdate(newParent.id);                                                                       
                        } else {
                            // moved to userfolder
                        }

                        if (oldParent.type == 'autofolder') {
                            gui.tocUpdate(oldParent.id);
                        } 


                        // open newParent if folded
                        if (!newParent.state.opened) {
                            tree.open_node(newParent.id);
                        }               


                        //$('folder#'+newParent)
                    } else {

                        debug('node',data.node.id,'moved to',data.position);

                        var parID  = data.node.id,
                            oldPos = $('#data-source article#'+parID).index();                    

                        if (oldPos > data.position) {
                            $('#data-source article#'+parID).insertBefore( $('#data-source article:eq('+data.position+')') );
                        } else {
                            $('#data-source article#'+parID).insertAfter( $('#data-source article:eq('+data.position+')') );
                        }
                    }
                    //debug( data );                
                });
            }

            $('#btnNewParagraph').prop( 'disabled', false);
            $('#btnNewLinkedPar').prop( 'disabled', false);
            $('#btnInsertPar').prop(    'disabled', false);
            $('#btnSaveAll').prop(      'disabled', false);
            $('#btnSaveDoc').prop(      'disabled', false);
            $('#btnAddText').prop(      'disabled', true);
            $('#btnAddAction').prop(    'disabled', true);
            $('#btnAddScript').prop(    'disabled', true);
            $('#btnAddHandler').prop(   'disabled', true);
            $('#btnDebug').prop(        'disabled', false);
            $('#btnOutdent').prop(      'disabled', false);
            $('#btnIndent').prop(       'disabled', false);
            $('#btnTranslate').prop(    'disabled', false);
            $('#btnShowInvisibles').prop('disabled', false);

            $('#mainbar #btnNewParagraph').prop('disabled', false);
            $('#mainbar #btnNewLinkedPar').prop('disabled', false);
            $('#mainbar #btnSaveAll').prop('disabled', false);
            $('#mainbar #btnSaveDoc').prop('disabled', false);
            $('#mainbar #btnAddText').prop('disabled', true);
            $('#mainbar #btnAddAction').prop('disabled', true);
            $('#mainbar #btnAddScript').prop('disabled', true);
            $('#mainbar #btnAddHandler').prop('disabled', true);
            $('#mainbar #btnPageUp').prop('disabled',true);
            $('#mainbar #btnPageDn').prop('disabled', true);
            $('#mainbar #btnSearch').prop('disabled', false);
            $('#mainbar #btnDebug').prop('disabled', false); 

            $('#menubar #mnuProjectRename').removeClass('disabled');
            $('#menubar #mnuProjectSave').removeClass('disabled');
            $('#menubar #mnuProjectImportFile').removeClass('disabled');
            $('#menubar #mnuProjectExportFile').removeClass('disabled');
            $('#menubar #mnuProjectOptions').removeClass('disabled');
            $('#menubar #mnuProjectRun').removeClass('disabled');
        },100);
    };  
    
    project.moderApprove = function(){
        if( project.gameID != null ) {
            repo.game.approve( project.gameID, function(res){
                if (res.result == 'ok') {
                    log(lang.current.cloud_game_approved);
                }
            });
        } else {
            error(lang.current.cloud_game_mistake);
        }
    };
    
    project.moderBan = function(){
        if( project.gameID != null ) {
            repo.game.ban( project.gameID, function(res){
                if (res.result == 'ok') {
                    log(lang.current.cloud_game_banned);
                }
            });
        } else {
            error(lang.current.cloud_game_mistake);
        }
    };
    
    project.moderReject = function(){
        if( project.gameID != null ) {
            repo.game.reject( project.gameID, function(res){
                if (res.result == 'ok') {
                    log(lang.current.cloud_game_rejected);
                }
            });
        } else {
            error(lang.current.cloud_game_mistake)
        }
    };
    
    project.new = function(opt){
        
        // check if some project already opened
        if ( $('#data-source').html() != '' )  {
            if (!confirm(lang.current.data_loss_confirm)) {
                return;
            }
        }        
		
        var salt = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        salt = salt.substring(0,33);

        $('#new-project-template book')
                .attr('guid',salt)
                .attr('title', $('#dlgOptions #projName').val() );
		
        cfg.readonly    = 0;
        project.gameID  = null;
        
        // clear startup hash
        window.location.hash = '';

        project.loadXML( $('#new-project-template').html() );
        
        if (opt == 'wizard') {
            
            project.import('wizard');
        }
    };

    project.open = function(){
        $('#openProject')
            .attr('accept','.xml')
            .trigger('click');
    };     
    
    project.options = function(opt){ debug('project.options('+opt+')');
        
        var buttons = [];
        var title   = lang.current.project_settings;
        
        if (opt == 'apply') {
                                      
            project.sourceLang = $('#dlgOptions #sourceLang img.selected').attr('lang');
            project.targetLang = $('#dlgOptions #targetLang img.selected').attr('lang');
            
            $('#data-source options sourcelang').html(project.sourceLang);
            $('#data-source options targetlang').html(project.targetLang);
            
            project.rename( $('#dlgOptions #projName').val() );                       
            
            cfg.lineBreak      = $('#dlgOptions #cLineBreak:checked').length > 0 ? true : false;
            cfg.autoTranslate  = $('#dlgOptions #cAutoTranslate:checked').length > 0 ? true : false;
            cfg.guiHideCoding  = $('#dlgOptions #cGUIHideCoding:checked').length > 0 ? true : false;
            
            if (cfg.guiHideCoding) {
                gui.hideCoding();
            } else {
                gui.showCoding();
            }
            
            $('#data-source options linebreak').html(cfg.lineBreak === true ? 1 : 0);
            $('#data-source options autotranslate').html(cfg.autoTranslate === true ? 1 : 0);
            $('#data-source options nocoding').html(cfg.guiHideCoding === true ? 1 : 0);
            
            $('#new-project-template options linebreak').html(cfg.lineBreak === true ? 1 : 0);
            $('#new-project-template options autotranslate').html(cfg.autoTranslate === true ? 1 : 0);
            $('#new-project-template options nocoding').html(cfg.guiHideCoding === true ? 1 : 0);
            
            // apply autotranslation to all opened blocks
            if ($('#dlgOptions #cAutoTranslate:checked').length > 0 && cfg.autoTranslate === false){
                
                $('#desk #blk_text .ace_editor').each(function(index){
                    
                    var editorID = $(this).attr('id');
                    var parID    = $(this).attr('captal-paragraph');
                    var blkID    = $('#tab-'+parID+' #blk_text .ace_editor').index( $(this) );
                    
                    block.translate(editorID, parID, blkID);
                });
            }
 
        }
        
        if (opt == 'wizard' || $('#data-source').html().length == 0) {

            title = lang.current.project_new_wizard;

            buttons.push({
                text: lang.current.import +' >>',
                click: function(){                                                                                                            

                    // update settings
                    project.options('apply');

                    // import
                    project.new('wizard');

                    $( this ).dialog( "destroy" );   
                }
            });
            
            buttons.push({
                text: lang.current.done,
                click: function(){                                                                                                            

                    // update settings
                    project.options('apply');

                    project.new();

                    $( this ).dialog( "destroy" );
                }
            });

        } else {
            
            // Окно настроек

            buttons.push({
                text: lang.current.save,
                click: function(){                                                                                                            

                    // update settings
                    project.options('apply');

                    $( this ).dialog( "destroy" );
                }
            });
        }

        buttons.push({
            text: lang.current.cancel,
            click: function() {     

                $( this ).dialog( "destroy" );                            
            }
        });

        $('#dlgOptions').dialog({
            modal       : true,
            sizeable    : false,
            width       : 500,
            height      : 500,
            buttons     : buttons,
            title       : title,
            create: function( event, ui ) {

                // update gui according to settings
                //
                $('#dlgOptions #cLineBreak').prop('checked', opt == 'wizard' ? true : cfg.lineBreak);
                $('#dlgOptions #cAutoTranslate').prop('checked', opt == 'wizard'? false : cfg.autoTranslate);
                $('#dlgOptions #cGUIHideCoding').prop('checked', opt == 'wizard'? false : cfg.guiHideCoding);

                $('#dlgOptions img.selected').removeClass('selected');
                $('#dlgOptions #sourceLang img[lang="'+project.sourceLang+'"]').addClass('selected');
                $('#dlgOptions #targetLang img[lang="'+project.targetLang+'"]').addClass('selected');
                $('#dlgOptions #projName')
                    .val( opt == 'wizard' ? lang.current.untitled : $('#data-source book').attr('title') )
                    .select();
            },
            close: function(){
                
                $( this ).dialog( "destroy" );
            }
        });         
    };
    
    // convert DOCX to TXT and analyze with preloadTXT
    project.preloadDOCX = function(doc){ debug('project.preloadDOCX()');        
        
        var last = $(doc).find('p').length -1;
        var classes = [];
        var centered = false;
        var bold    = false;
        var linked  = false;
        var buffer  = [];

        //console.log(doc); return

        $(doc).find('p').each(function(i){
            
            var p = $(this);
            
            
            
            buffer.push( $(this).text() );
             
            
            if (i == last ) {                
                
                buffer = buffer
                            .join('\n')
                            .replace( new RegExp(' ','g'), ' ');
                
                
                //console.log(buffer)
                project.preloadTXT( buffer );                                               
            }            
        });
    };
    
    // convert PDF to TXT and analyze it with preloadTXT
    project.preloadPDF = function(pdf){ debug('project.preloadPDF()');
        
        var pages  = pdf.numPages,
            buffer = [];
              
        for (var pi = 1; pi <= pages; pi++) {
            
            pdf.getPage(pi).then(function(page){
                
                page.getTextContent().then(function(tpage){
                                        
                    for (var i in tpage.items){
                        
                        buffer.push( tpage.items[i].str );
                    }                                                                        
                    
                    if (page.pageIndex+1 == pages) {
                        
                        // try to fix text
                        buffer = buffer
                                .join('\n')
                                .replace(/\(\n/g, '(')
                                .replace(/-\n/g, '')
                                .replace(/\n\.\n/g, '.\n')
                                .replace(/\s\n/g, function(str){ return str.replace('\n',''); })
                                .replace(/[a-zA-Zа-яА-Я,]\n/g, function(str){ return str.replace('\n',' '); });
                        
                        project.preloadTXT( buffer );                        
                    }
                });
            });
        }                        
    };
    
    project.preloadTXT = function(raw){
        
        if (raw.indexOf('�') != -1) {
            // wrong encoding
            $('#dlgImportTXT #decodeResult').html(lang.current.encoding_wrong);
        } else {
            $('#dlgImportTXT #decodeResult').html('');
        }
        
        // marker hunter
        getMarks( raw.replace(/\n/g, ' ').replace(/\r/g,''), function(marks){
            
            var checked = '';
            
            $('#import-source').remove();
            $('#dlgImportTXT #pnlMarkOptions .automarker').remove();
            $('#dlgImportTXT #pnlPreview').html('...');
            $('#dlgImportTXT #parMarkerDef').prop('checked',true);
            
            for (var i in marks){     
                
                checked = (marks[i].prefix == '' && marks[i].affix == '') ? 'checked' : '';

                var freq = isNaN(marks[i].freq) ? '' : '('+ marks[i].freq +')'; 
                           
                $('#dlgImportTXT #pnlMarkOptions').append('<div class="automarker">\
                    <input type="radio" name="parMarker" marker="'+i+'" '+checked+'> <input type="checkbox" marker="'+i+'"> '+marks[i].prefix+'<span>xxx</span>'+marks[i].affix +' '+ freq+'\
                </div>');
            }
            
            project.marks = marks;
            
            $('#dlgLoading').hide();
            
            // have to temporary store data there
            $('<div/>')
                    .attr('id','import-source')
                    .addClass('hidden')
                    .html( raw )
                    .appendTo('body');
            
            $('#dlgImportTXT').dialog({
                modal       : true,
                sizeable    : false,
                width       : 1000,
                height      : 600,
                create: function(){
                    
                    $('#dlgImportTXT #iParLeft').keypress(function(){  $('#dlgImportTXT input#cParTags').prop('checked', true); });
                    $('#dlgImportTXT #iParRight').keypress(function(){ $('#dlgImportTXT input#cParTags').prop('checked', true); });
                    $('#dlgImportTXT #iActLeft').keypress(function(){  $('#dlgImportTXT input#cActTags').prop('checked', true); });
                    $('#dlgImportTXT #iActRight').keypress(function(){ $('#dlgImportTXT input#cActTags').prop('checked', true); });
                    $('#dlgImportTXT #btnImportTXTrefresh').trigger('click');
                },
                buttons: {
                    Импорт: function(){
                        $( this ).dialog( "destroy" );
                        $('#dlgLoading').show();                        
                        project.loadTXT();
                    },
                    Отмена: function() {
                        $( this ).dialog( "destroy" );
                    }
                },
                close: function(){                            
                    $( this ).dialog( "destroy" );
                }
            });
        });
    };
    
    project.read = function(e){ 
        
        log(lang.current.file_loading);
        
        var f = e.target.files[0];
        if (!f) return;                       

        $('#dlgLoading').show();
        //debug(f.type); return;

        // clear startup hash
        window.location.hash = '';
        project.gameID = null;
        cfg.readonly = 0;
        $('#menubar #mnuProjectRepo').hide();
	
        // XML
        if (f.type.match('text/xml')) {
            var reader = new FileReader();

            project.file = f; 

            reader.onload = (function(theFile){
                return function(e){
                    var span = document.createElement('span');

                    span.innerHTML = [ e.target.result
                                        .replace( new RegExp('<!','g'), '&lt;!' )
                                        .replace( new RegExp(']]>','g'), ']]&gt;' ) 
                                    ];
                    project.loadXML( span );                  
                };
            })(f);
            
            reader.readAsText(f);        
       
        } else {

            // IMPORT
            project.imported = f;

            // DOCX
            if (f.type.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {            
                project.importDOCX(f);                        
            }               
            // PDF
            else if (f.type.match('application/pdf')){            
                project.importPDF(f);                        
            }
            // TXT
            else if (f.type.match('text/plain')){           
                project.importTXT(f);
            }      
            else {
                error(lang.current.format_unsupported);
            }
        }
    };        
    
    project.rename = function(newName){ debug('project.rename('+newName+')');
        
        if ($('#data-source').html().length != 0) {
            
            if (typeof newName == 'string') { 
                
                // update toc
                $('#toc').jstree(true).set_text( 'toc-book', newName );                
                // rename book
                $('#data-source book').attr('title', newName);
                // update window header
                $('title').html( newName + ' - '+lang.current.captal+' ' + $('.version').html() );
                // update project options
                $('#dlgOptions #projName').val(newName);
                
            } else {
                $('#toc').jstree(true).edit('toc-book');
            }
            
        } else {
            error(lang.current.project_not_loaded)
        }                
    };
    
    project.run = function(){ debug('project.run()');
        
        if ($('#data-source').html().length > 0) {                                

            $('#dlgDebug').dialog({
                modal       : true,
                sizeable    : false,
                width       : 900,
                height      : 520,
                buttons: [{
                   
                    text: lang.current.open_in_editor,
                    icons: {
                        primary: "ui-icon-search"
                    },
                    click: function(){
                        
                        var parID = jsIQ.current_article.title;                        
                        paragraph.open({ paragraphID: parID });
                    }
                        
                },{
                   
                    text: lang.current.paragraph_go,
                    icons: {
                        primary: "ui-icon-search"
                    },
                    click: function(){
                        
                        var parID = prompt(lang.current.go_enter);        
                        if (parID) {
                            jsIQ.showArticle(parID);
                        }
                    }
                        
                },{
                    text: lang.current.settings_prewrap_short,
                    icons: {
                        primary: "ui-icon-arrowstop-1-s"
                    },                    
                    click: function(){                                                
                        $('#dlgDebug #main_text').toggleClass('linebreak');
                        $('#dlgDebug #actions').toggleClass('linebreak');
                    }
                },{
                    text: lang.current.close,
                    click: function() {
                       
                        jsIQ = null;
                        jsiq_obj2attr = null;
                       
                        //$( this ).dialog( "close" );
                        $( this ).dialog( "destroy" );
                        
                        // kill Atril script container
                        $('script#atril').remove();
                        
                        // remove Atril console DOM element
                        $('#console').remove();
                        
                        $('xml book').html('');
                    }
                }],
                create: function(){
                    
                    // reload atril core script
                    $('<script>')
                            .attr('id', 'atril')
                            .attr('src','lib/jsiqapi.js')
                            .appendTo('head');

                    log(lang.current.atril_start);

                    jsIQ.addEventHandler('jsiq_init_start', function(params, vars, process)	{
                        debug('Altril init start');

                        var self = this;
                        this.containers.text        = $('#dlgDebug #main_text');
                        this.containers.title       = $('#dlgDebug #title');
                        this.containers.actions     = $('#dlgDebug #actions');                            
                        this.containers.charsheet   = $('#dlgDebug #charsheet');
                        process.next();
                    });

                    jsIQ.addEventHandler('jsiq_init_done', function(params, vars, process)	{
                        debug('Atril init done');
                        
                        var parID = paragraph.current() || 0;
                        
                        this.showArticle(  parID  );
                        process.next();
                    });
                    
                    jsIQ.addEventHandler('before_render_article', function(params, vars, process){
                        
                        var html,
                            tact,
                            found,
                            tsearch,
                            deleters = []; // actions to be removed from article
                        
                        for (var a in params.article.actions) {
                            
                            found = false;
                            
                            tact = params.article.actions[a].goto;
                            
                            for (var t in params.article.text){
                                
                                html    = params.article.text[t].text;
                                tsearch = html.indexOf('<a onclick=jsIQ.showArticle("'+tact+'")>'+tact+'</a>');
                                found   = (tsearch != -1) ? true : false;
                            }
                            
                            // mark action for remove
                            if (found) {
                                deleters.push(a);
                            }
                        }
                        
                        for (var a in deleters){
                            //params.article.actions[ deleters[a] ] = null;
                            //params.article.actions[ deleters[a] ].link = 'undefined';
                            params.article.actions[ deleters[a] ].render = function(){};
                        }
                        
                        process.next();
                    });

                    // overwrite jsIQ function
                    jsIQ.loadBook = function(url, callback, onerror){
                        
                        var self = this;
                        
                        self.msg('jsIQ.loadBook: ', 3);               
                        
                        //var data = $('#data-source').clone();
                        var data = '<?xml version="1.0" encoding="UTF-8"?>'+  
                                    $('#data-source')
                                        .html()
                                        .replace( new RegExp('&lt;!','g'), '<!')
                                        .replace( new RegExp(']]&gt;','g'), ']]>')
                                        .replace( /{(.*?)\#\d+\b(.*?)}/g, function(item){
                                            
                                            return item.replace(/[{}]/g,''); 
                                        })
                                        .replace(/\#\d+\b/g, function(item){ 
                            
                                            var tact = item.substr(1);

                                            return '<a onclick=jsIQ.showArticle("'+tact+'")>'+tact+'</a>'; 
                                        });
                        
                        data = $.parseXML(data);                                     

                        self.msg('jsIQ.loadBook.success ', 3);        
                        var params = { self: self, data: data };        

                        self.triggerEvent('jsiq_book_loaded', params,
                            function(){ 
                                /*
                                jsIQ.loadBook: STEP 2
                                */                                                                     
                                self.addArticle( params.data );

                                $(params.data).find('handlers handler').each(function(){	// in-book event handlers
                                    var t = $(this);
                                    var name = t.attr('name');

                                    //var raw = self.wrapScript( t.text(), 'params,process' );
                                    var raw = self.parser.wrapScript('handler_' + name, getNodeContentUnHtml(t) );   //, t.attr('args')
                                    if (!raw)		{
                                        return;
                                    }

                                    self.addEventHandler( name, function(params,vars,process){
                                        var env = self.createEnv('handler_' + name, {}, null, process);    //vars: vars, params: params, process: null
                                        raw.apply(this, [env]);
                                    });
                                });

                                $(params.data).find('cssdata css').each(function(){	// styles
                                    var t = $(this);
                                    var name = t.attr('name');

                                    var raw = $.trim(getNodeContentUnHtml(t));
                                    if (!raw || raw == ''){
                                        return;
                                    }

                                    $(document.body).prepend('<style id="atril-style-'+name+'">'+raw+'</style>');
                                });

                                if (typeof callback == 'function'){
                                    callback();
                                }
                            });
                    };                                               

                    jsIQ.init('whatever');
                        

                    if (cfg.lineBreak) {
                        
                        $('#dlgDebug #main_text').addClass('linebreak');
                        $('#dlgDebug #actions').toggleClass('linebreak');
                    }
                },
                close: function(){
                    jsIQ = null;
                    jsiq_obj2attr = null;

                    //$( this ).dialog( "close" );
                    $( this ).dialog( "destroy" );

                    // kill Atril script container
                    $('script#atril').remove();

                    // remove Atril console DOM element
                    $('#console').remove();

                    $('xml book').html('');
                }
            });
        } else {
            error(lang.current.project_not_loaded);
        }
    };
    
    project.save = function(){
        
        if ($('#data-source').html().length != 0) {

            var html = '<?xml version="1.0" encoding="UTF-8"?>\n' + 
                $('#data-source')
                    .html()
                    .replace( new RegExp('&lt;','g'), '<')
                    .replace( new RegExp('&gt;','g'), '>');

            var blob = new Blob( [ html ] , {type: "text/xml;charset=utf-8"} );

            saveAs(blob, project.file.name);
            
        } else {
            error(lang.current.project_not_loaded);
        } 
    };
    
    project.saveRepo = function(){
        
        if (project.gameID != null) {
            
            repo.game.update( project.gameID, function(res){
                
                if (res.result == 'ok') {
                    log(lang.current.cloud_game_saved)
                }
            });
            
        } else {
            error(lang.current.cloud_game_not_found);
        }
    };
    
    project.search = function(){
            
        var cSearchTxt = $('#dlgSearch #cSearchTxt input:checked').length > 0 ? true : false;
        var cSearchAct = $('#dlgSearch #cSearchAct input:checked').length > 0 ? true : false;
        var cSearchScr = $('#dlgSearch #cSearchScr input:checked').length > 0 ? true : false;
        var cSearchReg = $('#dlgSearch #cSearchReg input:checked').length > 0 ? true : false;
        var cSearchCur = $('#dlgSearch #cSearchCur input:checked').length > 0 ? true : false;
        var iSearchVal = $('#dlgSearch #iSearchValue input').val();

        if (iSearchVal.trim().length == 0) return;

        function process(index){

            var parent = $(this)[0].parentNode;
            var tag    = $(this)[0].localName;
            var parID  = parent.attributes['id'].value;
            var blkID  = $('#data-source article#'+parID+' '+tag).index( $(this) );                            
            var blk    = $(this)
                            .text().replace( /\<\!\[CDATA\[/i,'')
                            .replace( /&lt;\!\[CDATA\[/i,'')
                            .replace(']]>','')
                            .replace(']]&gt;','');                            
            var expr   = cSearchReg ? iSearchVal : iSearchVal.toUpperCase();
            var pos    = cSearchReg ? blk.indexOf(expr) : blk.toUpperCase().indexOf(expr);

            while (pos != -1) {

                blk     = blk.substring(0, pos) +'<u class="highlight">'+ blk.substring(pos, pos+iSearchVal.length) + '</u>' + blk.substring(pos + iSearchVal.length);
                pos     = cSearchReg ? blk.indexOf(expr, pos+22) : blk.toUpperCase().indexOf(expr, pos+22);

                if (pos == -1) { // last   

                    // get right place to show
                    var place = $('#dlgSearch #search-results .table [paragraph="'+parID+'"]:last');

                    // prepare result row
                    var div = $('<div/>')
                        .addClass('result-row')
                        .attr('paragraph', parID)
                        .attr('block',     blkID)
                        .attr('tag',       tag)
                        
                        .html('<div>\
                                <img src="img/16/icon-'+tag+'.png" title="'+tag+'">\
                                </div>\
                                <div class="par-id">'+parID+'</div>\
                                <div class="par-content" onclick=block.show("'+parID+'","'+tag+'",'+blkID+')>'+ blk + '</div>');
                    /*
                        .html('<div>\
                                <img src="img/16/icon-'+tag+'.png" title="'+tag+'">\
                                </div>\
                                <div class="par-id">'+parID+'</div>\
                                <div class="par-content" onclick=paragraph.show("'+parID+'")>'+ blk +'</div>');*/


                    // try to group results by paragraph
                    if (place.length > 0) {

                        div.insertAfter( place );

                    } else {

                        div.appendTo( $('#dlgSearch #search-results .table ') );
                    }
                }
            }          
        }


        $('#dlgSearch .result-row').remove();

        if (cSearchTxt) {

            // case sensitive search
            if (cSearchReg) {

                $('#data-source text:not([target]):contains("'+ iSearchVal +'")').each(process);

            } else {

                $('#data-source text:not([target]):Contains("'+ iSearchVal.toUpperCase() +'")').each(process);                                                        
            }
        }

        if (cSearchAct) {

            // case sensitive search
            if (cSearchReg) {

                $('#data-source action:contains("'+ iSearchVal +'")').each(process);

            } else {

                $('#data-source action:Contains("'+ iSearchVal.toUpperCase() +'")').each(process);                                                        
            }
        }

        if (cSearchScr) {

            // case sensitive search
            if (cSearchReg) {

                $('#data-source script:contains("'+ iSearchVal +'")').each(process);

            } else {

                $('#data-source script:Contains("'+ iSearchVal.toUpperCase() +'")').each(process);                                                        
            }
        }
    };
    
    project.searchNext = function(startIndex){
        
        
        if ($('#dlgSearch').dialog('isOpen')) {
            
            if ($('#dlgSearch #search-results .highlight').length == 0) return false;
            
            // get current selection
            var current = $('#dlgSearch #search-results .selected');
            
            if (current.length == 0) {
                
                if (typeof startIndex == 'number' && startIndex < $('#dlgSearch #search-results .highlight').length) {
                        
                    current = $('#dlgSearch #search-results .highlight:eq('+startIndex+')')
                    
                } else {

                    current =  $('#dlgSearch #search-results .highlight:first');
                }
                
                
                current.addClass('selected');
                $('#dlgSearch #search-results').scrollTop( current.position().top );

            } else {
                
                var selIndex = $('#dlgSearch #search-results .highlight').index( current );
                
                $('#dlgSearch #search-results .highlight').each(function(index){
                    
                    if (index == (selIndex + 1)  ){
                        
                        current.removeClass('selected');
                        $(this).addClass('selected');
                        
                        selIndex = 0; // to skip other cycle triggering
                        
                        // scroll to new selection
                        $('#dlgSearch #search-results').scrollTop( $(this).position().top );                            
                    }
                });
            }
        }
    };
    
    project.searchPrev = function(){
        
        if ($('#dlgSearch')) {
            
            // get current selection
            var current = $('#dlgSearch #search-results .selected');
            
            if (current.length == 0) {
                
                $('#dlgSearch #search-results .highlight:last').addClass('selected');
                
            } else {
                
                var selIndex = $('#dlgSearch #search-results .highlight').index( current );
                
                $('#dlgSearch #search-results .highlight').each(function(index){
                    
                    if (index == (selIndex - 1)  ){
                        
                        current.removeClass('selected');
                        $(this).addClass('selected');
                        
                        selIndex = 999; // to skip other cycle triggering
                        
                        // scroll to new selection
                        $('#dlgSearch #search-results').scrollTop( $(this).position().top ); 
                    }                    
                });
            }
        }
    };
    
    project.sortFolder = function(){
        
        
    };
    
    project.statTranslate = function(){
        
        var cTran = $('#data-source text[translated="true"]').length;
        var cAll  = $('#data-source text[type="undefined"]').length;
        log('На данный момент переведено: '+cTran+'/'+cAll+' ('+(cTran*100/cAll).toFixed(2)+'%)');
    };
    
    project.storage = {
        
        load: function(guid){
            
            if (project.storage.supported()) {
                
                localStorage['captal-index'] = localStorage['captal-index'] || '[]';
                
                var index = $.parseJSON(localStorage['captal-index']);
                
                if (index.indexOf(guid) != -1) {
                
                    var source = document.createElement('span');

                    source.innerHTML = [ localStorage[guid] ];
                    
                    $('#dlgLoading').show();
                    
                    project.loadXML( source );
                }
            
            } else {
                
                error(lang.current.storage_unsupported);
            }
        },
        save: function(){
            
            if (project.storage.supported()) {
                
                localStorage['captal-index'] = localStorage['captal-index'] || '[]';
                
                var xml   = '<?xml version="1.0" encoding="UTF-8"?>\n' + $('#data-source').html(),
                    guid  = $('#data-source book').attr('guid'),
                    index = $.parseJSON( localStorage['captal-index']),
                    limit = 1; // increase to support multiple project storage
            
                if (index.indexOf(guid) == -1) {
                    
                    if (index.length >= limit) {
                    
                        // push new, remove oldest
                        var oldest = index.splice(0,1);
                        localStorage.removeItem(oldest);
                    }
                    
                    index.push(guid);
                    localStorage['captal-index'] = JSON.stringify(index);
                }
                
                localStorage[guid] = xml;
                
                log(lang.current.storage_saved);
            
            } else {
                
                error(lang.current.storage_unsupported);
            }
        },
        supported : function() {
            try {
                return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
                return false;
            }
        }
    };
    
    project.wizard = function(){
        
        project.options('wizard');
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //                              REPOSITORY
    ////////////////////////////////////////////////////////////////////////////
    
    // Atril repository api
    repo = { 
        game        : {},
        component   : { 
            data    : {}
        }
    };                
    
    /*
     * gamelist
     * getgame
     * setgamestatus
     * updategame
     * publish
     */        
    
    repo.game.approve = function( gameID, callback ){
        repo.game.status( gameID, 5, callback);
    };
    
    repo.game.ban = function( gameID, callback ){
        repo.game.status( gameID, 4, callback);
    };
    
    repo.game.get = function( gameID ){
        debug('repo.game.get('+ gameID +')');                
        
        if ( $('#dlgRepo #list').hasClass('ui-accordion') ){
            $('#dlgRepo #list').accordion('destroy').html('');
        }
        
        if ($('#dlgRepo').hasClass('ui-dialog-content')) {
            $('#dlgRepo').dialog('close');
        }
        
        $.ajax({            
            url: (cfg.debug) ? cfg.localURL.game + gameID : cfg.remoteURL.game + gameID,
            dataType: 'json'
        })
        .success(function(res){                                    
            
            if (res.result == 'ok') {              
                // jump over BOM
                var xml = $.parseXML( res.data.data.substring( res.data.data.indexOf('<?xml')  ) );
                
                $('#menubar #mnuProjectRepo').show();
                
                // if not author set read only mode
                if (res.data.IS_AUTHOR == 0) {
                    cfg.readonly = 1;                    
                } else {                    
                    cfg.readonly = 0;
                }
                                
                if (res.data.IS_MODER == 1) {   
               	    cfg.isModer = 1;
                    $('#menubar .repoModer').show();
                } else {
                    cfg.isModer = 0;
                    $('#menubar .repoModer').hide();
                }				       
                
                // assign gameID to project
                project.gameID = res.data.game_id;
                
                project.loadXML( xml );                
            } else {
                error(lang.current.cloud_game_cant_open);
            }
        })
        .error(function(){
            error(lang.current.cloud_game_cant_open+'!');
        });                
    };
    
    repo.game.list = function( callback ){
        debug('repo.game.list()');        

        $.ajax({
            url: (cfg.debug) ? cfg.localURL.gamelist : cfg.remoteURL.gamelist,
            dataType: 'json'
        })
        .success(function( res ){            
            if (res.result == 'ok') {                
                if (typeof callback === 'function'){
                    callback(res);
                }
            } else {
                if (typeof callback === 'function'){
                    callback(false);
                }
                error(lang.current.cloud_unavailable);
            }                                     
        })
        .error(function(){
            if (typeof callback === 'function'){
                callback(false);
            }
            error(lang.current.cloud_unavailable+'!');
        });               
    };
    
    repo.game.publish = function( gameID, callback ){
        repo.game.status( gameID, 2, callback);  
    };
    
    repo.game.reject = function( gameID, callback ){
        repo.game.status( gameID, 3, callback);
    };
    
    repo.game.status = function( gameID, status, callback ){        
        $.ajax({
            url: (cfg.debug) ? cfg.localURL.setstatus + gameID +'&param2='+ status  : cfg.remoteURL.setstatus + gameID +'/'+ status,
            dataType: 'json'
        })
        .success(function(res){
            if (typeof callback === 'function'){
                callback(res);
            }
        })
        .error(function(res){
            if (typeof callback === 'function'){
                callback(res);
            }
        });
    };
    
    repo.game.update = function( gameID, callback ){
        
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + 
                $('#data-source')
                    .html()
                    .replace( new RegExp('&lt;','g'), '<')
                    .replace( new RegExp('&gt;','g'), '>');
                
        $.ajax({
            type        : 'POST',
            url         : (cfg.debug) ? cfg.localURL.update + gameID : cfg.remoteURL.update + gameID,
            dataType    : 'json',
            data: {
                data: xml
            }
        })
        .success(function(res){
            
            if (res.result == 'ok') {
                
                if (typeof callback === 'function') {
                    callback(res);
                }
                
            } else {
                error(lang.current.cloud_game_cant_save);
            }
        })
        .error(function(res){
            error(lang.current.cloud_game_cant_save+'!');
        });
    };
    
    repo.component.get = function( comID ){
        debug('repo.component.get(',comID,')');
        
        $.ajax({
            url: (cfg.debug) ? cfg.localURL.component + comID : cfg.remoteURL.component + comID,
            dataType: 'json'
        })
        .success(function( res ){
            if (res.result == 'ok') {
                
                var o   = res.data.list[0];
                var xml = $.parseXML( o.data.substring( o.data.indexOf('<?xml')  ) );

                project.gameID = o.index_name;
                project.isComponent = true;        
                console.log(xml)
                project.loadXML(xml);
                
                $( '#dlgRepoComp' ).dialog( 'close' );
            } else {
                
            }
        })
        .error(function( res ){
            error(lang.current.cloud_unavailable+'!');
        });
    };
    
    repo.component.list = function( callback ){
        
        $.ajax({
            url: (cfg.debug) ? cfg.localURL.component + 'list' : cfg.remoteURL.component + 'list',
            dataType: 'json'
        })
        .success(function( res ){
            if (res.result == 'ok') {                
                
                // reset list
                $('#dlgRepoComp #list').html('');

                $('#dlgRepoComp').dialog({
                    modal       : true,
                    sizeable    : false,
                    width       : 870,
                    height      : 600,            
                    create      : function(){                                                                             

                        for (var i in res.data.list) {

                            //console.log( res.data.list[i] )                                                      
                            var o = res.data.list[i];
                            repo.component.data[ o.index_name ] = o;

                            $('#dlgRepoComp #list')
                                .append( '<div id="'+ o.index_name +'" class="component" onclick=repo.component.select("'+o.index_name+'")><img src="img/16/brick.png"> '+ o.fullname +'</div>');
                        }   
                        
                        $('#dlgRepoComp #btnEditComp').on('click',function(res){
                            
                            var id = $('#dlgRepoComp #list .selected').attr('id');
                            
                            repo.component.get(id);
                        });
                        
                        $('#dlgRepoComp #btnAddComp').on('click',function(res){
                            
                            var index_name = $('#dlgRepoComp #list .selected').attr('id');
                            
                            project.addComponent( repo.component.data[ index_name ] );
                        });
                    },
                    close: function() {
                        
                        $('#dlgRepoComp #info').hide();                        
                        $('#dlgRepoComp #btnEditComp').off('click');
                        $('#dlgRepoComp #btnAddComp').off('click');
                        $( this ).dialog( "destroy" );
                    },
                    buttons: {
                        Закрыть: function() {                            
                            $( this ).dialog( "close" );
                        }
                    }
                });
            } else {
                if (typeof callback === 'function'){
                    callback(false);
                }
                error(lang.current.cloud_unavailable);
            }
        })
        .error(function( res ){
            if (typeof callback === 'function'){
                callback(false);
            }
            error(lang.current.cloud_unavailable+'!');
        });
    };
    
    repo.component.select = function( comID ){
        
        $('#dlgRepoComp #list .selected').removeClass('selected');
        $('#dlgRepoComp #list #'+comID).addClass('selected');
        $('#dlgRepoComp #info').show();      
        $('#dlgRepoComp #info .description').html( repo.component.data[ comID ].shortdesc );
    };
    
    repo.component.update = function( o, callback ){
        
        if (typeof callback == 'function'){
            callback();
        }
    };
    
    repo.search = function(e){       
        var val = $('#repo-search #iSearch').val() + e.key;
        
        if (val.length > 1) {
            var res = $('#dlgRepo .title span:contains('+ val +'):first').parents('.gameRow');
            var game_id = res.attr('game_id');
            var parent = res.parent().attr('id');
            
            $('#dlgRepo #list .selected').removeClass('selected');
            
            if (game_id != undefined) {                
                $('#dlgRepo #list').accordion('option', 'active', $('#dlgRepo [aria-controls="'+parent+'"]').index('.ui-accordion-header') );
                $('#dlgRepo #list [game_id="'+game_id+'"]').addClass('selected');
            }
        }        
    };
    
    $('#repo-search #iSearch').bind('keypress', repo.search);
    
    // load repository statuses    
    $.ajax({
        url: (cfg.debug) ? cfg.localURL.statuses : cfg.remoteURL.statuses,
        dataType: 'json'
    })
    .success(function(res){
        if (typeof res === 'string') {
            res = $.parseJSON(res);
        }
        repo.statuses = res;
    });                
    
    // load repository templates    
    $.ajax({
        url: (cfg.debug) ? cfg.localURL.templates : cfg.remoteURL.templates,
        dataType: 'json'
    })
    .success(function(res){    
        if (typeof res === 'string') {
            res = $.parseJSON(res);
        }
        repo.templates = res;
    })
    .error(function(){
        
    });
    
    ////////////////////////////////////////////////////////////////////////////
    //                      GRAPHICAL USER INTERFACE
    ////////////////////////////////////////////////////////////////////////////

    gui = {
        autolinkMenuTarget: null
    };

    gui.about = function(){
        $('#dlgAbout').dialog({
            modal       : true,
            sizeable    : false,
            width       : 600,
            height      : 550,
            buttons: [{
                text: lang.current.close,
                click: function() {
                    $( this ).dialog( "close" );
                }
            }]
        });
    };
    
    gui.changeFolderIcon = function(){
        
        var tree = $('#toc').jstree(true);
        
        if (typeof tree.get_node === 'function') {
        
            var node = tree.get_node( tree.get_selected()[0]);

            if (node.type.indexOf('folder') != -1) {
                
                $('#dlgFolder img.selected').removeClass('selected');
                $('#dlgFolder #'+node.type).addClass('selected');

                $('#dlgFolder').dialog({
                    modal       : true,
                    sizeable    : false,
                    width       : 500,
                    height      : 400,
                    buttons: {
                        Ок: function() {
                            var type = $('#dlgFolder img.selected').attr('id');

                            tree.set_type(node.id, type );
                            $('#data-source folder#'+node.id).attr('type', type);

                            $( this ).dialog( "close" );
                        }
                    }
                });  
            } else {
                error(lang.current.folder_icon_rules);
            }
        } else {
            error(lang.current.project_not_loaded);
        }
    };

    /**
     *
     */
    gui.cleanDesk = function(){
        
        if ( $('#desk').hasClass('ui-tabs') ) {
            
            // hide toolbar
            $('#toolbar').hide();
            
            // destroy event handlers            
            //console.log( $('#desk'))  )
            
            // we had tabs already, recreate
            $('#desk').html('<ul id="tabs"></ul>').tabs('destroy');
            
            // 
            $('#btnAddText').prop(  'disabled', true);
            $('#btnAddAction').prop('disabled', true);
            $('#btnAddScript').prop('disabled', true);
            $('#btnAddHandler').prop('disabled', true);
            $('#btnPageUp').prop('disabled', true);
            $('#btnPageDn').prop('disabled', true);
            $('#btnOutdent').prop('disabled', true);
            $('#btnIndent').prop('disabled', true);
            $('#btnTranslate').prop('disabled', true);
            
            $('#mainbar #btnParCopy').prop('disabled', true);
            $('#mainbar #btnBlkCopy').prop('disabled', true);
            $('#mainbar #btnPaste').prop('disabled', true);
            
            // clear navigator
            $('#nav')
            .jstree('destroy')
            .html('');
        } else {
            
        }
    };
    
    /**
     * Custom menu for toc tree
     *
     * @param {type} node
     */
    gui.contextMenuToc = function(node) {
        
        var tree = $("#toc").jstree(true);       
        
        var projectMenu = {
            
            renameItem: {
                label   : lang.current.project_rename,
                action  : project.rename
            }
        };
        
        var paragraphsMenu = {
            createItem: {
                label: lang.current.create,
                submenu: {
                    createFolder: {
                        label: lang.current.folder_new,
                        icon: "img/16/folder_add.png",
                        action: function(){
                            gui.createFolder();
                        }
                    },
                    createParagraph: {
                        label: lang.current.paragraph_new,
                        icon: "img/16/derivatives.png",
                        action: function(){
                            $('#btnNewParagraph').trigger('click');
                        }
                    }
                }   
            }
        };
        
        var autofolderMenu = {
            /*
            convertToUser: {
                label: 'Сделать пользовательским',
                action: function(){
                    
                }
            }*/
        };
        
        var userfolderMenu = {
            createItem:{
                label: 'Создать',
                submenu: {
                    createParagraph: {
                        label: lang.current.paragraph_new,
                        icon: "img/16/derivatives.png",
                        action: function() {
                            $('#btnNewParagraph').trigger('click');
                        }
                    }
                }
            },
            changeIcon: {
                label: lang.current.folder_icon_change,
                action: gui.changeFolderIcon
            },
            rename:{
                label: lang.current.rename,
                action: gui.renameFolder
            },
            delete: {
                label: lang.current.delete,
                action: gui.deleteFolder
            }
        };
        
        var paragraphMenu = {
            createItem: {
                label   : lang.current.create,
                icon    : 'img/16/script_add.png',
                submenu : {
                    createText:{
                        label: lang.current.block_text,
                        icon: "img/16/script_globe.png",
                        action: function() {
                            block.create({ tag: 'text' });
                        }
                    },
                    createAction:{
                        label: lang.current.block_action,
                        icon: "img/16/script_lightning.png",
                        action: function() {
                            block.create({ tag: 'action' });
                        }
                    },
                    createScript:{
                        label: lang.current.block_script,
                        icon: "img/16/script_gear.png",
                        action: function(){
                            block.create({ tag: 'script' });
                        }
                    }
                }
            },
            renameItem: {
                label   : lang.current.rename,
                icon    : 'img/16/page_edit.png',
                action  : function () {
                    //tree.edit(node);
                    paragraph.rename(node.id);
                }
            },
            labelItem: {
                label   : lang.current.label_set,
                icon    : 'img/16/tag_blue_edit.png',
                action  : paragraph.setLabel
            },
            moveItem: {
                label   : lang.current.move,
                icon    : 'img/16/document_move.png',
                submenu : {
                    moveUp: {
                        label: lang.current.paragraph_raise,
                        icon: 'img/16/page-up-icon.png',
                        action: function() {
                            paragraph.move('up');
                        }
                    },
                    moveDown: {
                        label: lang.current.paragraph_down,
                        icon: 'img/16/page-down-icon.png',
                        action: function(){
                            paragraph.move('down');
                        }
                    }
                }
            },
            deleteItem: {
                label   : lang.current.delete,
                icon    : 'img/16/page_delete.png',
                action  : function(){
                    
                    var node = tree.get_selected()[0];
                    
                    paragraph.delete(node);
                }
            }            
        };

        var handlerMenu = {
            createItem: {
                label: lang.current.create,
                submenu: {
                    createText:{
                        label: lang.current.handler,
                        icon: "img/16/timeline.png",
                        action: function(){
                            block.create({ tag: 'handler' }); 
                        }
                    }
                }
            }
        };                
        
        var componentsMenu = {
            addItem: {
                label   : lang.current.add,
                action  : repo.component.list
            }
        };
        
        var componentMenu = {
            removeItem : {
                label: lang.current.remove,
                action: function(){
                    
                    var node = tree.get_selected()[0];
                    
                    $('#data-source component#'+node).remove();
                    
                    tree.delete_node(node);
                }
            }
        };

        if (node.type == 'root') {
            // project root
            return projectMenu;
            
        } else if ( node.type == 'paragraphs') {
            // paragraph root
            return paragraphsMenu;
            
        } else if ( node.type.indexOf('paragraph_') == 0 ) {
            // paragraph, pass whole menu
            return paragraphMenu;
            
        } else if ( node.type == 'autofolder') {
            
            return autofolderMenu;
            
        } else if ( node.type.indexOf('folder') == 0 ) {
            // folder
            return userfolderMenu;
            
        } else if ( node.type == 'handler' ) {
            
            return handlerMenu;
            
        } else if ( node.type == 'components') {
            
            return componentsMenu;
            
        } else if ( node.type == 'component') {
            
            return componentMenu;
        }
        
        return {};
    };

    /**
     * Custom menu for navigator tree
     * 
     * @param {type} node
     * @returns {undefined}
     */
    gui.contextMenuNav = function(node) {
        
        var nav = $('#nav').jstree(true);
        
        var blockMenu = {            
                /*
                renameItem: { // rename block
                    separator_before: false,
                    separator_after: false,
                    label: 'Переименовать',
                    action: function(){
                        tree.edit(node);
                    }
                },*/
                deleteItem: { // delete block
                    label   : lang.current.delete,
                    icon    : 'img/16/page_delete.png',
                    action  : block.delete
                }
            },
        
            labelMenu = {
            
                renameItem: {
                    label   : lang.current.label_set,
                    icon    : 'img/16/tag_blue_edit.png',
                    action  : paragraph.setLabel
                }
            },
        
            tagsMenu = {
                
                addItem: {
                    label   : lang.current.tag_add,
                    icon    : '',
                    action  : paragraph.addTag
                }
            },
            
            tagMenu = {
            
                addItem: {
                    label   : lang.current.tag_add,
                    icon    : '',
                    action  : paragraph.addTag
                },
                delItem: {
                    label   : lang.current.tag_delete,
                    icon    : '',
                    action  : paragraph.delTag
                }
            };
        
        if (node.type == 'text' || node.type == 'action' || node.type == 'script' || node.type == 'handler'){
            
            return blockMenu;
            
        } 
        else if (node.id == 'nav-root') { return labelMenu; } 
        else if (node.id == 'nav-tags') { return tagsMenu;  }
        else if (node.type == 'tag')    { return tagMenu;   }
        
        return {};
    }; 
    
    gui.createFlow2 = function(){
        
        $('#dlgFlow').dialog({
            
            modal       : true,
            sizeable    : false,
            width       : 800,
            height      : 550,
            create      : function(){

                var graph = new Springy.Graph();
                var nodes = {};
                var links = [];                
                var last  = $('#data-source article').length -1;
                
                
                $('#data-source article').each(function(index){
                    
                    var id = $(this).attr('id');
                    
                    nodes[id] = graph.newNode({ label: id });
                    
                    $(this).find('action').each(function(actInd){
                        
                        var linkID =  id +'@#@'+ $(this).attr('goto');
                        
                        // ignore two way links
                        if ( links[ $(this).attr('goto') +'@#@'+ id ] == undefined ){
                            links[ linkID ]= [ id, $(this).attr('goto') ];
                        }
                                                
                    });
                    
                    if (index == last){
                        
                        // build links
                        for (var i in links) {
                            
                            graph.newEdge( nodes[links[i][0]], nodes[links[i][1]]);
                        }
                    }
                });
                
                $('#my_canvas').springy('destroy');

                $('#my_canvas').springy({ 
                    graph       : graph,
                    nodeFont    : "10px Verdana, sans-serif",
                    edgeFont    : "10px Verdana, sans-serif",
                    stiffness   : 50,
                    repulsion   : 100,
                    damping     : 0.7,
                    nodeSelected: null
                });
                
                //renderer.start();
                
            },
            close       : function(){
                
                $('#my_canvas').springy('destroy');
                $(this).dialog('destroy');
            }
        });
        
    };
    
    gui.createFlow3 = function(tagID){
        
        $('#dlgFlow').dialog({
            
            modal       : true,
            sizeable    : false,
            width       : 800,
            height      : 550,
            create      : function(){

                var graph = new Springy.Graph();
                var nodes = {};
                var links = [];                
                var last  = $('#data-source article').length -1;
                
                var process = function(index){
                    
                    var id = $(this).attr('id');
                    
                    nodes[id] = graph.newNode({ label: id });
                    
                    $(this).find('action').each(function(actInd){
                        
                        var linkID =  id +'@#@'+ $(this).attr('goto');
                        
                        // ignore two way links
                        //if ( links[ $(this).attr('goto') +'@#@'+ id ] == undefined ){
                        //    links[ linkID ]= [ id, $(this).attr('goto') ];
                        //}
                        
                        
                        links[ linkID ]= [ id, $(this).attr('goto') ];
                    });
                    
                    
                    if (index == last){
                        
                        // build links
                        for (var i in links) {
                            
                            graph.newEdge( nodes[links[i][0]], nodes[links[i][1]]);
                        }
                    }
                };
                
                if (tagID != undefined && typeof tagID == 'string') {
                
                    $('#data-source article').has( 'metadata tag:contains('+tagID+')').each(process);
                    
                } else {
                    
                    $('#data-source article').each(process);
                }
                
                $('#my_canvas').springy('destroy');

                $('#my_canvas').springy({ 
                    graph       : graph,
                    nodeFont    : "10px Verdana, sans-serif",
                    edgeFont    : "10px Verdana, sans-serif",
                    stiffness   : 50,
                    repulsion   : 100,
                    damping     : 0.7,
                    nodeSelected: null
                });
                
                //renderer.start();
                
            },
            close: function(){
                
                $('#my_canvas').springy('destroy');
                $(this).dialog('destroy');
            }
        });
    };
    
    /**
     * Create folder in toc
     */
    gui.createFolder = function(){
        
        if ($('#data-source').html().length > 0) {
            
            var tree = $('#toc').jstree(true);

            // create before autofolder
            var position   = $('#data-source folder').length-1;

            tree.create_node('toc-paragraphs',{
                id      : getRandomName('folder'),
                type    : 'folder_yellow',
                text    : 'New folder',
                li_attr : { 'toc-role':'group' }
            }, position, function(node){            
                tree.deselect_all();
                tree.edit(node.id);

                // update data-source
                $('#data-source folder:last').before('<folder id="'+node.id+'" name="New folder" type="folder_yellow"></folder>');
            });
        } else {
            error(lang.current.project_not_loaded);
        }
    };    
    
    // @FIXME: possible activate handler multiplies
    gui.createTabs = function(){ debug('gui.createTabs()');
        
        
        $('#desk').tabs({
            collapsible: false,
            activate: function( e, ui ) { 
                debug('tabs.activate(...)');
                
                var parID = $(ui.newTab[0]).text().trim();
                
                paragraph.show( parID );
            }            
        });
        
        $('#desk').find( ".ui-tabs-nav" ).sortable({
            //helper : 'clone',
            //axis: "x",     
            //cancel: "a",
            handle: ".tab-icon",
            cursor: "move",
            delay: 250,
            distance: 5,
            stop: function() {
                $('#desk').tabs( "refresh" );
            }
        });

        return true;
    };

    /**
     * Recreate Toolbar
     * @returns {undefined}
     */
    gui.createToolbar = function() {
        $('#desk #tabs').after( $('#toolbar-template').html() );
    }; 
    
    gui.deleteFolder = function(){
        
        var doDeleteFolder = function(toc, folder){

            if (confirm(lang.current.folder_delete_confirm)) {
                
                var last = $('#desk [role="tabpanel"]').length -1;                        

                // close any opened paragraph from this folder
                if (last > 0) {
                    $('#desk [role="tabpanel"]').each(function(index){

                        var parID = $(this).attr('id').replace('tab-','');

                        if ( $('#data-source folder#'+folder.id+' article#'+parID).length > 0){

                            // paragraph from this folder
                            paragraph.close(parID);
                        }

                        if (index == last){
                            // delete all paragraphs and folder itself from data-source
                            $('#data-source folder#'+folder.id).remove();
                        }
                    });
                } else {

                    // delete all paragraphs and folder itself from data-source
                    $('#data-source folder#'+folder.id).remove();
                }

                // remove folder from toc
                toc.delete_node( folder );
            }
        };
        
        
        if ($('#data-source').html().length > 0) {
            
            var toc = $('#toc').jstree(true);
            var target = toc.get_node( toc.get_selected()[0] );
            var folder;
            
            // delete folder can be triggered from paragraph or folder selection
            
            if ( target.type.indexOf('paragraph_') == 0 ) {
                
                folder = toc.get_node( target.parent );
                
                if (folder.type != 'autofolder') { 
                    
                    doDeleteFolder(toc, folder);
                    
                } else {
                    
                    // can't delete autofolder
                    error(lang.current.folder_auto_undeletable);
                }                
            } else if (target.type.indexOf('folder_' == 0) ) {
                                               
                doDeleteFolder(toc, target);
               
            } else {
                
                
            }
        } else {
            error(lang.current.project_not_loaded);
        }
    };
    
    /** 
     * fix editor top position according to tabs and fields height 
     */
    gui.fixTabs = function(){
        var pos =  ( $('#toolbar').position().top + parseInt($('#toolbar .toolbar-helper').css('height').replace('px','')) );         
        $('#desk .ui-tabs-panel.ui-widget-content').css('top', pos);
        $('#desk .toolbar-sub').css('top', pos);
    };
    
    gui.fullscreen = function () {
        debug('gui.fullscreen()');
        
        var element = document.getElementById('html');
        
        if (element.requestFullscreen) {
            debug('requestFullscreen')
            element.requestFullscreen();
        } else if(element.webkitrequestFullscreen) {
            debug('webkitrequestFullscreen')
            element.webkitRequestFullscreen();
        } else if(element.mozRequestFullscreen) {
            debug('mozRequestFullScreen')
            element.mozRequestFullScreen();
        }
    };
    
    gui.help = function(e){
        var pos, obj;
        
        if ($('#dlgHelp').hasClass('ui-dialog-content')){
            
            $('#dlgHelp').dialog( "open" );

            if (e != undefined && typeof e != 'object') {                
            
                obj = $('#dlgHelp #'+e);
                if (obj.length > 0) {
                    pos = parseInt( obj.position().top ) + 10;
                    $('#dlgHelp').scrollTop( pos );
                }
                
            } else if (typeof e === 'object') {
                
                $('#dlgHelp').scrollTop(0);
            }
             
        } else {           

            $('#dlgHelp').dialog({
                modal       : true,
                sizeable    : false,
                width       : 900,
                height      : 600,
                open        : function(){
                    if (e != undefined && typeof e != 'object') {                
                        obj = $('#dlgHelp #'+e);
                        if (obj.length > 0) {
                            pos = parseInt( obj.position().top ) + 10;
                            $('#dlgHelp').scrollTop( pos );                            
                        }
                    } else if (typeof e === 'object') {
                        $('#dlgHelp').scrollTop(0);
                    }
                },
                buttons: [{
                  text: lang.current.close,
                  click: function() {
                    $( this ).dialog( "close" );
                  }
                }]
            }).scroll(function(e,ui){                
                $('#dlgHelp .toc').css('top', $('#dlgHelp').scrollTop() + 10 );
            });
        }
    };
    
    gui.hideCoding = function(){
        
        $('#btnAddScript').hide();
        $('#btnAddHandler').hide();
        
        if ($('head style#captal-nocoding').length == 0){
            $('head').append('<style id="captal-nocoding"></style>');
        }
        
        
        if ($('#data-source book').length > 0) {
        
            $('#toc').jstree(true).hide_node('toc-handlers');
            $('#toc').jstree(true).hide_node('toc-components');
        }
        
        $('head style#captal-nocoding').append('\
            .blk_header .field { visibility: hidden; }\n\
            #blk_text .blk_header { height: 0px; border-top-left-radius: 5px; overflow: visible;  }\n\
            #blk_text #subheader { top: 9px; padding-top: 0; }\n\
            /* #blk_text img.lang-flag { position: absolute; top: -7px; right: -2px; padding: 2px; background: #fff; } */\n\
            #blk_text .blk_header img.lang-flag { display: none;}\n\
            #blk_action .logicGO { visibility: visible; }\n\
            #blk_script { display: none !important; }\n\
            .blk_wrapper { overflow: visible; }\n\
            #nav #nav-script, #toc #toc-handlers, #toc #toc-components { display: none; }\n\
        ');
    };
    
    gui.load = function(callback){
        
        // replace language strings
        $.ajax({
            url: 'lib/template.html',
            success: function(res){
                
                // language locale strings
                for (var line in lang.current){
            
                    var localeString = lang.current[line],
                        regex        = '{L_'+ (line.toUpperCase()) +'}';
                
                    res = res.replace(new RegExp(regex,'ig'), localeString );
                }
                
                // version
                res = res.replace(/{VERSION}/ig, cfg.version);
                
                $('body').append(res);
                callback();
            }
        });
    };
    
    gui.logicFieldUpdate = function(e, doStore){

        if (e == undefined) return;                
        
        var field    = $(e).attr('id');
        var editorID = $(e).offsetParent().offsetParent().offsetParent().find('.blk_editor').attr('id');

        doStore      = doStore != undefined ? doStore : true;
        
        debug('gui.logicFieldUpdate('+editorID+', field:'+field+', store:'+doStore+')') ;
        
        // update navigator with action target
        if ( field == 'logicGO') {
            
            var nav   = $('#nav').jstree(true);
            
            if (nav) {
            
                var parID = $('#'+editorID).attr('captal-paragraph'),
                    blkID = $('#tab-'+parID+' #blk_action .ace_editor').index( $('#'+editorID) ),
                    label = ($(e).val().length > 0) ? $('#data-source article#'+ $(e).val()).attr('label') || '' : '',
                    act   = ($(e).val().length > 0) ? '§'+ $(e).val() + (label != '' ? ':'+label : '') : blkID+1;

                nav.set_text( 'nav֍'+parID+'֍action֍'+blkID  , act );
            }
            
        } else if ( field == 'logicTYPE') {
             
            // update navigator with script name
            
            var nav   = $('#nav').jstree(true);
            
            if (nav) {
            
                var parID = $('#'+editorID).attr('captal-paragraph');
                var blkID = $('#tab-'+parID+' #blk_script .ace_editor').index( $('#'+editorID) );

                nav.set_text( 'nav֍'+parID+'֍script֍'+blkID  , $(e).val() );
            }
        }                                
        
        if ( $(e).val() == '') {
            
            $(e).prev().show();
            
        } else {
            
            $(e).prev().hide();
        }
        
        if (doStore) {
        
            block.store(editorID);
        }
    };
    
    gui.logicGO = function(e){ debug('gui.logicGO()');

        var iObj     = $(e).next().next();
        var parID    = iObj.val() || '';  
        var editorID = $(e).offsetParent().offsetParent().offsetParent().find('.ace_editor').attr('id');        
        var editor   = ace.edit( editorID );
        var session  = editor.session;
               
        // if nothing in logicGO, try guess from corresponding action
        if (parID == '') {
            
            parID = editor.getValue().match(/\d+$/) || '';
            
            // still empty? generate new paragraph ID
            if (parID == ''){                
                
                parID = paragraph.newID();
                
                // add this one to action text
                if (editor.getValue() == '') {
                    
                    editor.setValue( parID.toString() );
                    
                } else {
                    session.insert({
                            row: session.getLength(),
                            column: 0
                        }, ' '+ parID.toString()
                    );
                }
        
                editor.resize(true);
        
                block.store(editorID);
                
            }
            
            // update logicGO field with this value
            iObj.val( parID );
            gui.logicFieldUpdate(iObj);
            paragraph.open({ paragraphID: parID, currentParagraphID: paragraph.current() });
            
        } else {   
            
            paragraph.open({ paragraphID: parID, currentParagraphID: paragraph.current() }); 
        }
        
    };
    
    gui.maximize = function(){ debug('gui.maximize()');                    
        
        $('#desk').toggleClass('maximized');
        $('#table-of-contents').toggleClass('maximized');
        $('#navigator').toggleClass('maximized');
        
        // update editors
        $('.ace_editor').each(function(index){
            
            var editor = ace.edit( $(this).attr('id') );
            editor.resize(true);
            //editor.renderer.updateFull();
        });
        
        if (cfg.maximized) {                        
           
            $('#btnMaximize img').attr('src', 'img/32/arrow_expand.png');
            cfg.maximized = false;
            
        } else {
                    
            $('#btnMaximize img').attr('src', 'img/32/arrow_collapse.png');
            cfg.maximized = true;            
        }
        
        var id = $('#tab-'+paragraph.current()+' .ace_focus').attr('id');
        ace.edit(id)._emit('change'); //resize translated
    };
    
    gui.nav = {};
    
    gui.nav.build = function(parID){
        
        $('#nav')
            .jstree('destroy')
            .html( $('#new-nav-template').html() );

        $('#nav').jstree({
            core: {
                check_callback : true,
                multiple: false,
                themes: { responsive: false }
            },
            plugins: [ "contextmenu", "types" ],
            contextmenu: { items: (cfg.readonly ? {} : gui.contextMenuNav ) },
            types: {
                root     : { icon : "img/16/page-new.png"         },
                text     : { icon : "img/16/script_globe.png"     },
                action   : { icon : "img/16/script_lightning.png" },
                script   : { icon : "img/16/script_gear.png"      },
                handler  : { icon : "img/16/icon-handler.png"     },
                link     : { icon : "img/16/script_link.png"      },
                tag      : { icon : "img/16/tag_hash.png"         }
            }
        }).on("changed.jstree",function(e, data){
            
            if ( data.action == 'select_node' ) { 
            
                if (data.node.type == 'text' || data.node.type == 'action' || data.node.type == 'script' || data.node.type == 'handler') {

                    if( data.node.type == 'action' && !keys.state[17] && data.event.type == 'click') { // CTRL+Click
                     
                        var target = $('#desk [rile="tabpanel"],[aria-hidden="false"] #blk_action #logicGO:eq('+data.node.id.split('֍')[3]+')').val();
                        paragraph.open({ paragraphID: target });
                   
                    } else {

                        block.show( paragraph.current(), data.node.id.split('֍')[2], data.node.id.split('֍')[3] );
                    }
                
                } else if (data.node.type == 'link' && data.event.type == 'click') {
                    
                    var parID = data.node.id.split('֍')[3];

                    paragraph.open({ paragraphID: parID });
                    
                } else if (data.node.type == 'tag' && data.event.type == 'click'){
                    
                    var tagID = data.node.id.split('֍')[3];
                    
                    //gui.createFlow3(tagID);
                    gui.tagList(tagID);
                }
            }
        }).on("create_node.jstree",function(e, data){
            
        }).on("rename_node.jstree",function(e, data){

        }).on("ready.jstree",function(e, data){
            
            var nav = $('#nav').jstree(true);
            
            // if article
            if ($('#data-source article#'+parID).children().length > 0){
                
                // remove handler folder in nav
                nav.delete_node('nav-handler');
                
            } else {
                
                // handler, remove other folders in nav
                nav.delete_node('nav-text');
                nav.delete_node('nav-action');
                nav.delete_node('nav-script');
                nav.delete_node('nav-links');
                nav.delete_node('nav-tags');
            }
        });
        
        var nav = $('#nav').jstree(true)
        
        // navigator root is paragraph name & label
        var label = $('#data-source article#'+parID).attr('label') || false;
        nav.set_text('nav-root', (label) ? parID+':'+label : parID );
        
        var counts = {};
        
        // populate navigator tree group by group
        $('#tab-'+ parID +' .blk_wrapper').each(function(index){           
                
            var tag  = $(this).find('.blk_editor').attr('captal-tag');            
            var name;            
            
            if (counts[tag] != undefined) {
                
                counts[tag]++;
                
            } else {
                counts[tag] = 1;
            }
            
            if (tag == 'script') {
                
                name = $(this).find('#logicTYPE').val();
                
            } else if (tag == 'action') {
                
                var name  = $(this).find('#logicGO').val() || false;
                var label = $('#data-source article#'+name).attr('label') || false;
                
                name = name ? '§'+ ( (label) ? name+':'+label : name ) : counts[tag];
                
            } else {
                
                name = counts[tag];
            }

            // push block to navigator
            nav.create_node( 'nav-'+ tag , { type: tag, id: 'nav֍'+ parID +'֍'+ tag +'֍'+ (counts[tag]-1) , text: name });

            // add link to navigator node
            $(this).attr('captal-nav', 'nav֍'+ parID +'֍'+ tag +'֍'+ (counts[tag]-1));
        });
        
        // populate navigator with external links
        $('#data-source article:has(action[goto="'+parID+'"])').each(function(index){
            
            var name = $(this).attr('id');
            var label = $('#data-source article#'+name).attr('label') || false;
            
            nav.create_node('nav-links', { type: 'link', id: 'nav֍'+parID+'֍link֍'+name, text: '§'+ ( (label) ? name+':'+label : name )});
        });
        
        // populate navigator with paragraph tags
        $('#data-source article#'+parID+' metadata tag').each(function(){
            
            var name = $(this).html();
            
            nav.create_node('nav-tags', { type: 'tag', id:'nav֍'+parID+'֍tag֍'+name, text: name });
        });
    };
    
    gui.tagJump = function(o){
                        
        var parID = $(o).attr('captal-paragraph');

        paragraph.open({ paragraphID: parID });
    };
    
    gui.tagList = function(tagID){ debug('gui.tagList()');
        
        $('#dlgTaglist').dialog({
            
            modal       : true,
            sizeable    : false,
            width       : 700,
            height      : 500,
            buttons     : [{
                text: lang.current.close,
                click: function(){
                    
                    $(this).dialog('close');
                }
            }],
            create: function(){
                
                if (typeof tagID == 'string') {
                    
                    paragraph.listByTag(tagID);
                    
                } else {
                    
                    project.listTags();
                }
            },
            close: function(){

                $(this).dialog('destroy');
            }
        });
    };
    
    // refresh folder name
    gui.tocUpdate = function(parent){ debug('gui.tocUpdate('+parent+')');
        
        if (parent == undefined) return;
        
        var tree = $('#toc').jstree(true);
                        
        var node = (parent != undefined) ? tree.get_node(parent) : tree.get_node( tree.get_node(paragraph.current()).parent );
        var text = [0,0];
        
        // check folder type, don't rename user folders
        if (node.type != 'autofolder') return;
        
        text[0] = node.children[0]; // first
        text[1] = node.children[ node.children.length-1 ]; // last
        
        if (text[0] == undefined && text[1] == undefined) {
            
            tree.set_text( node, lang.current.folder_auto );
        } else {
        
            tree.set_text( node, text.join('..') );
        }
    };  
    
    gui.toggleControls = function(e){
        
        $(e).next().toggle();
    };
    
    gui.paste = function(){
        
        if ($('#copy-buffer').attr('type') == 'paragraph') {
            
            paragraph.paste();
            
        } else if ($('#copy-buffer').attr('type') == 'block') {
            
            block.paste();
        }
    };
    
    gui.renameFolder = function(){
        var tree = $('#toc').jstree(true);
        
        if (typeof tree.get_node === 'function') {
        
            var node = tree.get_node( tree.get_selected()[0]);

            if (node.type.indexOf('folder_') != -1) {
                
                tree.edit(node.id);
                
            } else {
                
                error(lang.current.folder_name_rules);
            }
        } else {
            error(lang.current.project_not_loaded);
        }
    };
    
    gui.scriptAutocomplete = function(request, response){                
        var res = [];
        var i = 0;
        var last = $('#data-source script[id*="'+request.term+'"]').length;

        $('#data-source script[id*="'+request.term+'"]').each(function(){
            i++; 
            res.push( $(this).attr('id') );   // attr.type                 
            if (i == last){
                response(res);
            }
        });                
    }
    
    gui.search = function(){
        
        if ($('#data-source book').length == 0) { 
        
            error(lang.current.project_not_loaded);
            return; 
        }
        
        $('#dlgSearch').dialog({
            modal       : true,
            sizeable    : false,
            width       : 800,
            height      : 520,
            buttons: [{
                text: lang.current.previous,
                icons: {
                    primary: "ui-icon-search"
                },                    
                click: function(){     

                    project.searchPrev();
                }
            },{
                text: lang.current.next,
                icons: {
                    primary: "ui-icon-search"
                },                    
                click: function(){     

                    project.searchNext();
                }
            },{
                text: lang.current.search_replace_do,
                icons: {
                    primary: "ui-icon-refresh"
                },                    
                click: function(){  
              
                    var current     = $('#dlgSearch #search-results .selected');
                    
                    if (current.length == 0) {
                        
                        project.searchNext();
                        return;
                    }
                              
                    var row         = $('#dlgSearch .result-row:has(.selected)');
                    var parID       = row.attr('paragraph');
                    var tag         = row.attr('tag');
                    var blkID       = row.attr('block');
                    var indexGlobal = $('#dlgSearch #search-results .highlight').index( current );
                    var indexInRow  = row.find('.highlight').index( current );
                    var blk         = $('#data-source article#'+parID+' '+tag+':eq('+blkID+')').html();
                    var cSearchReg  = $('#dlgSearch #cSearchReg input:checked').length > 0 ? true : false;
                    var iSearchVal  = $('#dlgSearch #iSearchValue input').val();
                    var iReplaceVal = $('#dlgSearch #iSearchReplace input').val();                    
                    var expr        = cSearchReg ? iSearchVal : iSearchVal.toUpperCase();
                    var pos         = cSearchReg ? blk.indexOf(expr) : blk.toUpperCase().indexOf(expr);
                    var i           = 0;

                    while (pos != -1) {                                                

                        // location looks like the right one?
                        if (i == indexInRow) {

                            
                            blk = blk.substring(0, pos) + iReplaceVal + blk.substring(pos + iSearchVal.length);
                            
                            // update datasource
                            $('#data-source article#'+parID+' '+tag+':eq('+blkID+')').html( blk );
                            
                            // update search results
                            current.replaceWith( iReplaceVal );
                            
                            // update editor if opened
                            if ($('#tab-'+parID).length > 0){
                                
                                // make paragraph tab active
                                if ($('#tab-'+parID).attr('aria-hidden')) {
                                    gui.showTab(parID);
                                }
                                
                                blk = blk.replace( /\<\!\[CDATA\[/i,'')
                                        .replace( /&lt;\!\[CDATA\[/i,'')
                                        .replace(']]>','')
                                        .replace(']]&gt;','');
                                
                                var editorID = $('#tab-'+parID+' #blk_'+tag+' .ace_editor:eq('+blkID+')').attr('id');
                                var editor   = ace.edit( editorID );
                                
                                editor.setValue( blk );   
                                editor.resize(true);
                            }
                            
                            project.searchNext(indexGlobal); // start searching from index
                            return;
                        }              
                        
                        // jump to next possible location
                        pos = cSearchReg ? blk.indexOf(expr, pos+1) : blk.toUpperCase().indexOf(expr, pos+1);
                        i++;                        
                    }
                }
            },{
                text: lang.current.search_replace_all,
                icons: {
                    primary: "ui-icon-refresh"
                },                    
                click: function(){
                    
                    var cSearchReg  = $('#dlgSearch #cSearchReg input:checked').length > 0 ? true : false;
                    var iSearchVal  = $('#dlgSearch #iSearchValue input').val();
                    var iReplaceVal = $('#dlgSearch #iSearchReplace input').val();                    
                    var expr        = cSearchReg ? iSearchVal : iSearchVal.toUpperCase();
                    var parOpened   = [];
                    
                    // remember and close opened editors
                    //
                    var tabCount = $('#tabs li[role="tab"]').length;
                    
                    $('#tabs li[role="tab"]').each(function(index){
                        
                        parOpened.push( $(this).attr('aria-controls').replace('tab-','') );
                        
                        if (index == tabCount-1){ // last
                            
                            paragraph.close('all');
                        }
                    });
                    
                    
                    var resultCount = $('#dlgSearch #search-results .result-row').length;
                    
                    $('#dlgSearch #search-results .result-row').each(function(index){
                    
                        var parID       = $(this).attr('paragraph');
                        var tag         = $(this).attr('tag');
                        var blkID       = $(this).attr('block');                        
                        var blk         = $('#data-source article#'+parID+' '+tag+':eq('+blkID+')').html();                       
                        var pos         = cSearchReg ? blk.indexOf(expr) : blk.toUpperCase().indexOf(expr);                        

                        while (pos != -1) {                                                

                            blk = blk.substring(0, pos) + iReplaceVal + blk.substring(pos + iSearchVal.length);

                            // update datasource
                            $('#data-source article#'+parID+' '+tag+':eq('+blkID+')').html( blk );                            
                            
                            // update editor if opened
                            /*
                            if ($('#tab-'+parID).length > 0){
                                
                                // make paragraph tab active
                                if ($('#tab-'+parID).attr('aria-hidden')) {
                                    gui.showTab(parID);
                                }
                                
                                blk = blk.replace( /\<\!\[CDATA\[/i,'')
                                        .replace( /&lt;\!\[CDATA\[/i,'')
                                        .replace(']]>','')
                                        .replace(']]&gt;','');
                                
                                var editorID = $('#tab-'+parID+' #blk_'+tag+' .ace_editor:eq('+blkID+')').attr('id');
                                var editor   = ace.edit( editorID );
                                
                                editor.setValue( blk );   
                                editor.resize(true);
                            }*/
                            
                            
                            
                            // update search results
                            $('#search-results .highlight:first').replaceWith( iReplaceVal );

                            // jump to next possible location
                            pos = cSearchReg ? blk.indexOf(expr, pos+1) : blk.toUpperCase().indexOf(expr, pos+1);
                        }
                        
                        if (index == resultCount-1){ // last
                            
                            //reopen paragraphs
                            for (var i in parOpened){
                                
                                paragraph.open({ paragraphID: parOpened[i] });
                            }
                        }
                    });
                }
            },{
                text: lang.current.close,
                click: function() {

                    $( this ).dialog( "close" );
                }
            }],
            create: function(){

                $('#dlgSearch #iSearchValue input').focus();

            },
            close: function(){
                
                // clear results
                $('#dlgSearch #iSearchValue input').val('');
                $('#dlgSearch #iSearchReplace input').val('');
                $('#dlgSearch .result-row').remove();
                
                $('#dlgSearch #cSearchTxt').prop('checked', true);
                $('#dlgSearch #cSearchAct').prop('checked', false);
                $('#dlgSearch #cSearchScr').prop('checked', false);
                $('#dlgSearch #cSearchReg').prop('checked', false);
                
                $( this ).dialog( "destroy" );
            }
        });
    };
    
    gui.setFlag = function(res){ debug('gui.setFlag()',res);
        
        var editorID = block.current(),
            tlang    = (res[0].count == 0) ? 'undefined' : res[0].name,
            //tlang    = ru2rus[res.lang],
            tag      = $('#desk #'+editorID).attr('captal-tag'),
            parID    = $('#desk #'+editorID).attr('captal-paragraph'),
            blkID    = $('#tab-'+parID+' #blk_'+tag+' .ace_editor').index( $('#'+editorID) );                

        // update flag
        $('#tab-'+parID+' #blk_'+tag+' .blk_wrapper:eq('+blkID+') img.lang-flag:first')
                .attr('src', 'img/16/flag_'+tlang+'.png')
                .attr('lang', tlang);

        $('#data-source article#'+parID+' '+ tag +':eq('+blkID+')').attr('lang',tlang);
    };
    
    gui.setFlagYandex = function(res){ debug('gui.setFlag()',res);
        
        var editorID = block.current(),
            ru2rus   = { en: 'eng', ru: 'rus', ua: 'ukr', de: 'ger', fr: 'fra', it: 'ita', bg: 'bul' },
            //tlang    = (res[0].count == 0) ? 'undefined' : res[0].name,
            tlang    = ru2rus[res.lang],
            tag      = $('#desk #'+editorID).attr('captal-tag'),
            parID    = $('#desk #'+editorID).attr('captal-paragraph'),
            blkID    = $('#tab-'+parID+' #blk_'+tag+' .ace_editor').index( $('#'+editorID) );                

        // update flag
        $('#tab-'+parID+' #blk_'+tag+' .blk_wrapper:eq('+blkID+') img.lang-flag:first')
                .attr('src', 'img/16/flag_'+tlang+'.png')
                .attr('lang', tlang);

        $('#data-source article#'+parID+' '+ tag +':eq('+blkID+')').attr('lang',tlang);
    };
    
    gui.setLang = function(e){
        
        var tLang     = $(e.target.parentElement).attr('id');
        var langValue = $(e.target).attr('lang');
        
        if (
                ( tLang == 'sourceLang' && langValue == $('#targetLang img.selected').attr('lang') ) ||
                ( tLang == 'targetLang' && langValue == $('#sourceLang img.selected').attr('lang') )
            ) {
 
            return;
            
        } else {
                
            $('#dlgOptions #'+tLang+' img.selected').removeClass('selected');
            $('#dlgOptions #'+tLang+' img[lang="'+langValue+'"]').addClass('selected');
        }
    };
    
    gui.showCoding = function(){
        
        $('#btnAddScript').show();
        $('#btnAddHandler').show();
        
        if ($('#data-source book').length > 0) {
            $('#toc').jstree(true).show_node('toc-handlers');
            $('#toc').jstree(true).show_node('toc-components');
        }
        
        $('head style#captal-nocoding').remove();
    };
    
    gui.showTab = function(parID){
        
        if ($('#tab-'+parID).length > 0) {
            
            var index = $('#tabs li[role="tab"]').index( $('#tabs [aria-controls="tab-'+parID+'"]') );
            
            $('#desk').tabs('option', 'active', index);
        }
    };
    
    // system errors are visible in log only on debug=1
    gui.syserror = function(msg, url, line, col, error){
        var file = (url != undefined) ? url.replace(/^.*[\\\/]/, '') : '';
        line = line || '';
        if (cfg.debug) {
            log('error', [ msg+'</span><span class="extra">'+file+':'+line ]);
        }
        console.log(msg, file, line);
    };
    
    gui.welcome = function(){                
        
        $('#dlgWelcome').dialog({
            modal       : true,
            sizeable    : false,
            width       : 800,
            height      : 600,
            buttons: [{
                text: lang.current.ok,
                click: function() {
                    $( this ).dialog( "close" );
                }
            }]
        });
        $('#dlgWelcome').tabs();
    };     

    // load GUI template and init Captal
    gui.load(function(){

        ////////////////////////////////////////////////////////////////////////////
        //                          CONTROLS & EVENTS
        ////////////////////////////////////////////////////////////////////////////
        $('#btnParCopy').click(paragraph.copy);

        $('#btnBlkCopy').click(block.copy);

        $('#btnPaste').click(gui.paste);

        $('#btnSaveAll').click(project.save);

        $('#btnSaveDoc').click(project.export);

        $('#btnOpenProject').click(project.open);

        $('#dlgImportTXT #sEncoding').change(function(e){
            
            project.encoding = $(this).val();
            
            $('#dlgImportTXT').dialog('close');
            project.importTXT(project.imported, project.encoding);
        });

        /**
         * Begins new paragraph creation
         * Determine target, then call paragraph.create({...})
         */
        $('#btnNewParagraph').click(paragraph.new);

        $('#btnNewLinkedPar').click(paragraph.newLinked);

        $('#btnInsertPar').click(paragraph.newInject);

        $('#btnNewProject').click(project.new);

        $('#btnAddText').click(function(){
            block.create({ tag : 'text' });
        });

        $('#btnAddAction').click(function(){
            block.create({ tag: 'action' });
        });

        $('#btnAddScript').click(function(){
            block.create({ tag: 'script' });
        });

        $('#btnAddHandler').click(function(){ 
            block.create({ tag: 'handler' }); 
        });

        $('#btnPageUp').click(function(){ 
            paragraph.move('up');
        });

        $('#btnPageDn').click(function(){ 
            paragraph.move('down');
        });

        $('#btnImport').click(project.import);               

        $('#btnFlow').click(gui.createFlow3);

        $('#btnDebug').click(project.run);

        $('#btnHelp').click(gui.help);

        $('#dlgHelp .toc li').bind('click',function(e){
            gui.help( $(this).attr('class') );
            e.stopPropagation();
        });

        $('#dlgWelcome .list a').bind('click',function(){
            gui.help( $(this).attr('id') );
        });

        $('#dlgFolder img').click(function(e){        
            $('#dlgFolder img.selected').removeClass('selected');
            $(e.target).addClass('selected');
        }); 

        $('#dlgExport #sLang').change(function(){

        });        

        $('#btnRenameBlock').click(block.rename);

        $('#btnOutdent').click(block.outdent);

        $('#btnIndent').click(block.indent);

        $('#btnShowInvisibles').click(block.showInvisibles);

        $('#btnRaiseBlock').click(function(){
            block.move('up');
        });

        $('#btnDownBlock').click(function(){
            block.move('down');
        });

        $('#btnInjectParagraph').click(paragraph.newInject);

        $('#btnTranslate').click(block.translate);

        $('#mainbar #btnSearch').click(gui.search);

        $('#btnMaximize').click(gui.maximize);

        $('#dlgOptions .flag').click(gui.setLang);

        $('#dlgSearch #iSearchValue input').bind('keydown',function(e){

            // создаем секундную задержку на поиск по мере набора

            if (typeof project.searchTimeout === 'number') clearTimeout(project.searchTimeout);

            project.searchTimeout = setTimeout( project.search, 1000 );
        });

        $('#dlgSearch input[type="checkbox"]').bind('change',function(){

            // эмулируем вызов задержки поиска
            $('#dlgSearch #iSearchValue input').trigger('keydown');
        });

        $('#desk').dblclick(function(e){

            if ($(e.target).attr('id') == 'desk'){

                if ($('#data-source book').length == 0) {

                    project.open();
                }
            }
        });

        $('#dlgWelcome #cHideWelcome')
                .on('click',function(e){
            cookie.set('hideWelcome', e.currentTarget.checked ? 1 : 0 );
        })
                .prop('checked', cookie.get('hideWelcome'));

        /**
         * Topmost Menubar
         */           

        menu = {
            items: {
                mnuProject : {
                    label: lang.current.project,
                    submenu: {
                        mnuProjectNew: {
                            label   : lang.current.project_new,
                            icon    : 'img/32/report_add.png',
                            action  : project.wizard
                        },
                        mnuProjectOpen: {
                            label   : lang.current.project_open,                        
                            icon    : 'img/32/folder_blue.png',
                            hotkey  : 'Alt+O',
                            action  : project.open
                        },
                        /*
                        mnuProjectStorage: {
                            label   : lang.current.storage,
                            icon    : 'img/32/folder_blue.png',
                            submenu : {}
                        },*/
                        mnuProjectRename: {
                            label   : lang.current.rename,
                            icon    : 'img/32/report_edit.png',
                            action  : project.rename
                        },
                        mnuProjectSave: {
                            label   : lang.current.project_save,
                            icon    : 'img/32/report_save.png',
                            hotkey  : 'Alt+S',
                            action  : project.save                        
                        },
                        _1: 'separator',
                        mnuProjectImportFile: {
                            label   : lang.current.project_import,
                            icon    : 'img/32/education.png',
                            action  : project.import
                        },
                        mnuProjectExportFile: {
                            label   : lang.current.project_export,
                            icon    : 'img/32/report_word.png',
                            action  : project.export
                        },
                        _2: 'separator',                    
                        mnuProjectRepo: {
                            label	: lang.current.cloud_games,
                            icon	: 'img/32/network_cloud.png',
                            submenu	: {
                                mnuProjectRepoLoad: {
                                    label   : lang.current.cloud_game_load,
                                    icon    : 'img/32/download_cloud.png',
                                    action  : project.importRepo
                                },
                                mnuProjectRepoSave: {
                                    label   : lang.current.save,
                                    icon    : 'img/32/save_cloud.png',
                                    action  : project.saveRepo
                                },
                                mnuProjectRepoPublish: {
                                    label   : lang.current.cloud_game_publish,
                                    icon    : 'img/32/upload_for_cloud.png',
                                    action  : project.exportRepo
                                },
                                _1: 'separator',
                                mnuProjectRepoModerApprove: {
                                    label   : lang.current.cloud_game_approve,
                                    icon    : 'img/32/thumb_up.png',
                                    group   : 'repoModer',
                                    action  : project.moderApprove
                                },
                                mnuProjectRepoModerReject: {
                                    label   : lang.current.cloud_game_reject,
                                    icon    : 'img/32/thumb_down.png',
                                    group   : 'repoModer',
                                    action  : project.moderReject
                                },
                                mnuProjectRepoModerBan: {
                                    label   : lang.current.cloud_game_ban,
                                    icon    : 'img/32/hand_stop.png',
                                    group   : 'repoModer',
                                    action  : project.moderBan
                                }
                            }
                        },
                        _3: 'separator',
                        mnuProjectOptions: {
                            label   : lang.current.settings,
                            icon    : 'img/32/book_gear.png',
                            action  : project.options
                        },
                        mnuProjectRun: {
                            label   : lang.current.project_debug,
                            icon    : 'img/32/debugging.png',
                            action  : project.run
                        }
                    }
                },
                mnuParagraph: {
                    label: lang.current.paragraph,
                    submenu: {
                        mnuParagraphCreate: {
                            label   : lang.current.create,
                            icon    : 'img/32/page_add.png',
                            submenu : {
                                mnuParagraphCreateNew: {
                                    label   : lang.current.paragraph_new,
                                    icon    : 'img/32/page_add.png',
                                    hotkey  : 'Alt+N', // N = 78
                                    action  : paragraph.new                        
                                },
                                mnuParagraphCreateLinked: {

                                    label   : lang.current.paragraph_linked,
                                    icon    : 'img/32/page_link.png',
                                    hotkey  : 'Alt+Enter',
                                    action  : paragraph.newLinked
                                },
                                mnuParagraphCreateInject: {

                                    label   : lang.current.paragraph_inject,
                                    icon    : 'img/32/page_insert2.png',
                                    hotkey  : 'Alt+Ins',
                                    action  : paragraph.newInject
                                }
                            }
                        },
                        mnuParagraphRename: {
                            label   : lang.current.rename,
                            hotkey  : 'F2',
                            icon    : 'img/32/page_edit.png',
                            action  : paragraph.rename
                        },
                        mnuParagraphLabel:{
                            label   : lang.current.paragraph_label,
                            icon    : 'img/32/tag_blue_edit.png',
                            action  : paragraph.setLabel
                        },
                        mnuParagraphCopy: {
                            label   : lang.current.copy,
                            icon    : 'img/32/page_copy.png',
                            hotkey  : 'Alt+C',
                            action  : paragraph.copy
                        },
                        mnuParagraphPaste: {
                            label   : lang.current.paste,
                            icon    : 'img/32/page_paste.png',
                            hotkey  : 'Alt+V',
                            action  : paragraph.paste
                        },
                        mnuParagraphClose: {
                            label: lang.current.close,
                            icon: 'img/32/page_red.png',
                            submenu: {
                                mnuParagraphCloseThis: {
                                    label: lang.current.paragraph_close_current,
                                    action: function(){
                                        paragraph.close();
                                    }
                                },
                                mnuParagraphCloseOther: {
                                    label: lang.current.paragraph_close_other,
                                    action: function(){
                                        paragraph.close('other');
                                    }
                                },
                                mnuParagraphCloseAll: {
                                    label: lang.current.paragraph_close_all,
                                    action: function(){
                                        paragraph.close('all');
                                    }
                                }
                            }
                        },
                        mnuParagraphDelete: {
                            label   : lang.current.delete,
                            icon    : 'img/32/page_delete.png',
                            action  : paragraph.delete
                        },
                        _1: 'separator',
                        mnuParagraphRaise: {
                            label   : lang.current.raise,
                            icon    : 'img/32/move_up.png',
                            action  : function(){
                                paragraph.move('up');
                            }
                        },
                        mnuParagraphLower: {
                            label   : lang.current.lower,
                            icon    : 'img/32/move_down.png',
                            action  : function(){
                                paragraph.move('down');
                            }
                        },
                        mnuParagraphJump: {
                            label   : lang.current.go,
                            icon    : 'img/32/page_go.png',
                            hotkey  : 'Alt+G',
                            action  : paragraph.go
                        },
                        mnuParagraphShuffle : {
                            label   : lang.current.paragraph_shuffle,
                            icon    : 'img/32/shuffle.png',
                            action  : paragraph.shuffle
                        }                  
                    }
                },
                mnuBlock: {
                    label: lang.current.block,
                    submenu: {                                             
                        mnuBlockAdd: {
                            label   : lang.current.create,
                            icon    : 'img/32/script_add.png',
                            submenu: {
                                mnuBlockAddText: {
                                    label   : lang.current.text_add,
                                    icon    : 'img/32/script_globe.png',
                                    action  : function(){ block.create({ tag: 'text' }); }
                                },
                                mnuBlockAddAction: {
                                    label   : lang.current.action_add,
                                    icon    : 'img/32/script_lightning.png',
                                    hotkey  : 'ALT+A',
                                    action  : function(){ block.create({ tag: 'action' }); }
                                },
                                mnuBlockAddScript: {
                                    label   : lang.current.script_add,
                                    icon    : 'img/32/script_gear.png',
                                    action  : function(){ block.create({ tag: 'script'}); }
                                },
                                mnuBlockAddHandler: {
                                    label   : lang.current.handler_add,
                                    icon    : 'img/32/script_error.png',
                                    action  : function(){ block.create({ tag: 'handler' }); }
                                }
                            }
                        },
                        /*mnuBlockRename: {
                            label   : 'Переименовать',
                            icon    : 'img/32/script_edit.png',
                            //hotkey  : 'Ctrl+F2',
                            action  : block.rename
                        },*/                    
                        mnuBlockCopy: {
                            label   : lang.current.copy,
                            icon    : 'img/32/bug_report.png',
                            action  : block.copy
                        },
                        mnuBlockPaste: {
                            label   : lang.current.paste,
                            icon    : 'img/32/paste_plain.png',
                            action  : block.paste
                        },
                        mnuBlockDelete: {
                            label   : lang.current.delete,
                            icon    : 'img/32/script_delete.png',
                            action  : block.delete
                        },
                        /*_0: 'separator',
                        mnuBlockRaise: {
                            label   : 'Поднять',
                            icon    : 'img/32/arrow_up.png',
                            action  : function(){ block.move('up'); }
                        },
                        mnuBlockLower: {
                            label   : 'Опустить',
                            icon    : 'img/32/arrow_down.png',
                            action  : function(){ block.move('down'); }
                        },*/                     
                        _1: 'separator',
                        mnuBlockLeft: {
                            label   : lang.current.block_indent,
                            icon    : 'img/32/text_indent_remove.png',
                            action  : block.outdent
                        },
                        mnuBlockRight: {
                            label   : lang.current.block_outdent,
                            icon    : 'img/32/text_indent.png',
                            action  : block.indent
                        },
                        mnuBlockSpecial: {
                            label   : lang.current.block_specialchar,
                            icon    : 'img/32/pilcrow.png',
                            action  : block.showInvisibles
                        },
                        mnuBLockWrap: {
                            label   : lang.current.block_wrap,
                            icon    : 'img/32/text_move.png',
                            action  : block.wrapText
                        },
                        mnuBlockTranslate:{
                            label   : lang.current.translation_machine,
                            icon    : 'img/32/change_language.png',
                            hotkey  : 'Alt+T',
                            action  : block.translate
                        }
                    }
                },
                mnuFolder: {
                    label: lang.current.folder,
                    submenu: {
                        mnuFolderNew:{
                            label   : lang.current.folder_create,
                            icon    : 'img/32/folder_add.png',
                            action  : gui.createFolder
                        },
                        mnuFolderRename:{
                            label   : lang.current.rename,
                            icon    : 'img/32/folder_edit.png',
                            action  : gui.renameFolder
                        },
                        mnuFolderIcon:{
                            label   : lang.current.folder_icon_change,
                            icon    : 'img/32/folder_palette.png',          
                            action  : gui.changeFolderIcon
                        },
                        mnuFolderDelete: {
                            label   : lang.current.delete,
                            icon    : 'img/32/folder_delete.png',
                            action  : gui.deleteFolder
                        }                     
                    }
                },
                mnuTools: {
                    label: lang.current.tools,
                    submenu: {
                        mnuToolsSearch : {
                            label   : lang.current.search,
                            icon    : 'img/32/find.png',
                            action  : gui.search
                        },
                        mnuToolsTags: {
                            label   : lang.current.tag_list,
                            icon    : 'img/32/document_hash_tag.png',
                            action  : gui.tagList
                        },
                        /*
                        mnuToolsGlossary: {
                            label   : 'Глоссарий',
                            icon    : 'img/32/bookmark.png'
                        },
                        mnuToolsMaximize: {
                            label   : 'Максимизировать',
                            icon    : 'img/32/arrow_expand.png',
                            hotkey  : 'Alt+F11',
                            action  : gui.maximize
                        },
                        mnuToolsFullscreen: {
                            label   :  'Полноэкранный режим',

                            action  : gui.fullscreen
                        },
                        mnuToolsGraph: {
                            label   : 'Дерево параграфов',
                            icon    : 'img/32/chart_organisation.png'
                        },                    
                        mnuToolsStats : {
                            label   : 'Статистика',
                            icon    : 'img/32/chart.png'
                        }
                        */
                        _1: 'separator',
                        mnuToolsLangs: {
                            label   : 'Language (Reload)',
                            icon    : 'img/16/flag_'+ lang.name +'.png',
                            submenu : {

                                mnuToolsLangsRus: {
                                    label   : 'Russian',
                                    icon    : 'img/16/flag_rus.png',
                                    action  : function(){ lang.set('rus'); location.reload(); }
                                },
                                mnuToolsLangsEng: {
                                    label   : 'English',
                                    icon    : 'img/16/flag_eng.png',
                                    action  : function(){ lang.set('eng'); location.reload(); }
                                }
                            }
                        }
                    }
                },
                mnuHelp: {
                    label: lang.current.help_manual,                
                    submenu: {
                        mnuHelpWelcome: {
                            label   : lang.current.welcome,
                            icon    : 'img/32/hand.png',
                            action  : gui.welcome
                        },
                        mnuHelpContent: {
                            label   : lang.current.help_index,    
                            icon    : 'img/32/manual_icon.png',
                            action  : gui.help
                        },
                        mnuHelpForum: {
                            label   : lang.current.help_forum,     
                            icon    : 'img/32/user_comment.png',
                            action  : function(){                     
                                window.open('http://quest-book.ru/forum/topic/3115/0');
                            }
                        },
                        _1: 'separator',
                        mnuHelpAbout: {
                            label   : lang.current.about,    
                            icon    : 'img/32/Button-White-Help-icon.png',
                            action  : gui.about                        
                        }
                    }
                }
            }
        };        

        // populate local storage projects
        /*
        if (project.storage.supported()){
            
            localStorage['captal-index'] = localStorage['captal-index'] || '[]';
            
            var index = $.parseJSON(localStorage['captal-index']);
            
            if (index.length > 0) {
            
                for (var i in index){

                    var source = document.createElement('span');

                    source.innerHTML = [ localStorage[ index[i] ] ];
                    
                    //console.log( $(source). )

                    menu.items.mnuProject.submenu.mnuProjectStorage.submenu[i] = {

                        label   : $(source).find('book').attr('title'),
                        icon    : 'img/32/report.png',
                        guid    : $(source).find('book').attr('guid'),
                        action  : function(){
                            
                            var source = document.createElement('span');
                            source.innerHTML = [ localStorage[this.guid] ];
                            project.loadXML( source );
                        }
                    };
                }
            } else {
                
                menu.items.mnuProject.submenu.mnuProjectStorage.submenu[0] = {

                    label   : 'Хранилище пусто',
                };
            }
        }*/

        $('#menubar').menubar(menu);    
        $('#menubar .repoModer').hide();
        $('#menubar #mnuProjectRepo').hide();
        $('#menubar #mnuProjectRename').addClass('disabled');
        $('#menubar #mnuProjectSave').addClass('disabled');
        $('#menubar #mnuProjectImportFile').addClass('disabled');
        $('#menubar #mnuProjectExportFile').addClass('disabled');
        $('#menubar #mnuProjectOptions').addClass('disabled');
        $('#menubar #mnuProjectRun').addClass('disabled');

        $('#mnuAutolink').menu({
            select: function(e, ui){ debug('mnuAutolink()');
                var link = gui.autolinkMenuTarget;

                if (link != null) {
                    block.create({
                            tag     : 'action',
                            body    : link,                    
                            logicGO : link
                        }, 
                        block.store                   
                    ); 

                    block.removeLinks();
                } else {
                    // no link targeted
                }
            }
        });

        // CTRL & block autolinks  
        //keys.down[17] = function(){ block.addLinks(); };
        //keys.up[17]   = function(){ block.removeLinks(); };

        // window resize handler
        $(window).resize(function(){ 
            gui.fixTabs();        
            block.removeLinks();

            var id = $('#tab-'+paragraph.current()+' .ace_focus').attr('id');
            ace.edit(id)._emit('change'); //resize translated
        });

        document.getElementById('openProject').addEventListener('click', function(){ this.value = null; }, false);
        document.getElementById('openProject').addEventListener('change', project.read, false);    

        window.onerror = gui.syserror;

        $(window).on('beforeunload', function(e) {
            return lang.current.data_loss_confirm;
        });

        ////////////////////////////////////////////////////////////////////////
        //                                  STARTUP
        ////////////////////////////////////////////////////////////////////////

        $('#dlgLoading #progress').progressbar({
            value: false
        });

        $('title').html( lang.current.captal +' '+ $('.version').html() );

        log(lang.current.ready);

        cfg.requestURL = window.location.href.split('/');
        if ( cfg.requestURL.indexOf('#game') > 0 ) {
            repo.game.get( cfg.requestURL[ cfg.requestURL.indexOf('#game') + 1 ] );
        }
        
        // autosave
        if (cfg.autosave) {
            
            setInterval(function(){
                
                var guid = $('#data-source book').attr('guid');
                
                if (guid) {
                    
                    project.storage.save(guid);
                }
            }, 60000); // autosave every 1 min
        }
        
        if (cfg.autoopen) {
        
            if (project.storage.supported()){
                
                var guid = $.parseJSON(localStorage['captal-index'])[0];
                
                if (guid) {
                    project.storage.load(guid);
                }
            }
        }
        
        if (!cookie.get('hideWelcome')) { gui.welcome(); }
    
    });
});
