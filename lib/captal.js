/**
 * CAPTAL 
 * 
 * @description Online quest-book IDE
 * @author connect <kod.connect@gmail.com>
 */
$(document).ready(function(){
        
    //vars = {};    
    
    $('.version').html("0.20 alpha");
    
    cfg = {
        debug           : 1,
        
        autoTranslate   : 0,
        detectLang      : 1,
        isModer         : 0,
        lineBreak       : 1,
        logBuffer       : 30,
        maximized       : 0,
        readonly        : 0,
        showInvisibles  : 0,
        showWelcome     : 0,
       
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
        requestURL: null
    };    
    
    ////////////////////////////////////////////////////////////////////////////
    //                              TOOLS
    ////////////////////////////////////////////////////////////////////////////
    
    log = function(){
        
        var time = new Date();
        var secs = (time.getSeconds()< 10 ? '0': '') + time.getSeconds();
        var mins = (time.getMinutes()< 10 ? '0': '') + time.getMinutes();
        var hour = (time.getHours()  < 10 ? '0': '') + time.getHours();        
        var timestamp = hour +':'+ mins +':'+ secs;       
        var i = 0;        
        var type = (typeof arguments === 'object' && (arguments[0] === 'debug' || arguments[0] === 'error') ) ? arguments[0] : 'text';
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
        }
        console.log( arguments );
    };    
    
    error = function(msg, url, line, col, error){
        var file = (url != undefined) ? url.replace(/^.*[\\\/]/, '') : '';
        line = line || '';
        log('error', [ msg+'</span><span class="extra">'+file+':'+line ]);
        console.log(msg, file, line);
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
    
    // @TODO: remove this
    getNextId = function(tag){
        tag = (tag == undefined) ? ('error') : (tag);
        
        var tree = $('#toc').jstree(true);                
        var html = $('#data-source '+tag).sort(function(a,b){ 
            var x = a.id.match(/\d+/g);
            var y = b.id.match(/\d+/g);
            return parseInt(x) > parseInt(y); 
        }); // get last name by value not position
        var n    = $(html).last().attr('id').match(/\d+/g);
        var str  = $(html).last().attr('id').replace(n,'');

        n = (n == null) ? str + 1 : str + (parseInt(n) +1);

        return n;
    };
    
    exprSafe = function(str){    
        return str       
                .replace( /\[/g, '&#91;')
                .replace( /\]/g, '&#93;')
                .replace( /\//g, '&#47;');
    };           
    
    /**
     * Analyze text and return results to callback
     * @param {type} o
     * @returns {String}
     */ 
    getMarks = function(text, callback){ debug('getMarks()');
        
        var prevCh, nextCh;
        var prefix, affix;
        var left, right;
        var marks = [], freq = [], tmark = [];
        var i = 0;
        
        // find numbers in text
        var numbers = text.match(/\d+/g);
        
        // make numbers unique
        var unumbers = [];
        for (var n in numbers)
            if (unumbers.indexOf( numbers[n] ) == -1)
                unumbers.push( numbers[n] );
        
        // for each unique number
        for (var n in unumbers) {
            var num = unumbers[n];           
            // find first position of this number
            var pos = text.indexOf(num);                         
            
            // for each position of this number in text
            while( pos != -1) {
                
                // skip numbers in the very begining of text
                if ( pos > 0 ) {
                
                    // check previous and next characters
                    prevCh = text.charCodeAt(pos - 1);
                    nextCh = text.charCodeAt(pos + num.toString().length);
                
                    // confirm they're not a number characters
                    if ( (prevCh < 48 || prevCh > 57 || isNaN(prevCh)) && (nextCh < 48 || nextCh > 57 || isNaN(nextCh) ) ) {
                        // cut left side of text                                                    
                        left = text.substring(0,pos).split(' ');

                        // if previous character is space, get previous word
                        if (prevCh == 32) {                            
                            prefix = left[ left.length-2 ];
                        } else {
                            // else, get everthing up to space
                            prefix = left[ left.length-1 ];
                        }
                        
                        // cut right side
                        right = text.substring(pos + num.toString().length).split(' ');
                        // if right character is space, get next word
                        if (nextCh == 32){
                            affix = right[1];
                        } else {
                            // get everithing up to space
                            affix = right[0];
                        }
                        
                        // set this mark
                        tmark = [ prefix, affix ];
                    
                        // check if this is first accurance
                        i = marks.indexOf(tmark);                                                
                        if ( i == -1 ) {
                            // new one, store it
                            marks.push( tmark );
                            // put its' frequency to 1
                            freq.push( 1 );
                        } else {
                            // already known, increase its' frequency
                            freq[ i ]++;
                        }
                    }                    
                }                
                // move selector to next position
                pos = text.indexOf(num,pos+1); 
            }
        }    
        // return results
        if (typeof callback === 'function') {
            callback(marks, freq);
        }        
        return { marks: marks, freq: freq };
    };
    
    // @TODO: should be something like getMarks
    getActions = function(){
        
    };

    ////////////////////////////////////////////////////////////////////////////
    //                              BLOCK
    ////////////////////////////////////////////////////////////////////////////

    block = {
        id : null
    };        

    /**
     * Add block to current paragraph
     *
     * @param {} o - input object
     */
    block.add = function(o) { debug('block.add(',o,')');        
        
        o.uid       = salt();
        o.mode      = '';   
        o.body      = o.body || '';  
        //o.paragraph = o.paragraph || paragraph.id;                

        $('#desk #tab-'+ o.paragraph +' #blk_'+ o.tag ).append(
                '<div class="blk_wrapper">\
                    <div class="blk_header">\
                        <div class="field logicTRUE" title="IF TRUE срабатывает при выполнении условия">\
                            <img src="img/16/brick.png">\
                            <div class="hint">Виден если</div>\
                            <input id="logicTRUE" type="text">\
                        </div>\
                        <div class="field logicFALSE" title="IF FALSE срабатывает при невыполнении условия">\
                            <img src="img/16/brick_delete.png">\
                            <div class="hint">Виден если НЕ</div>\
                            <input id="logicFALSE" type="text">\
                        </div>\
                        <div class="field logicDO" title="DO вызвать скрипт">\
                            <img src="img/16/brick_error.png">\
                            <div class="hint">Выполнить</div>\
                            <input id="logicDO" type="text">\
                        </div>\
                        <div class="field small logicGO" title="GOTO перейти к параграфу">\
                            <img id="logicGOicon" src="img/16/brick_go.png">\
                            <div class="hint">Переход к</div>\
                            <input id="logicGO" type="text">\
                        </div>\
                        <div class="field logicGLOBAL" title="GLOBAL для всего проекта"><img src="img/16/globe_place.png"><input id="logicGLOBAL" type="checkbox"></div>\
                    </div>\
                    <div id="'+                 o.uid+'" \
                        captal-paragraph="'+    o.paragraph+'" \
                        captal-tag="'+          o.tag+'" \
                        captal-if="" \
                        captal-ifnot="" \
                        captal-goto="" \
                        captal-do="" \
                        captal-isglobal="" \
                        class="blk_editor">'+   o.body +'</div>\
                </div>' );

        /*
        $('#desk #tab-'+ o.paragraph +' #blk_'+ o.tag ).append(
                '<div class="blk_wrapper">\
                    <div class="blk_header">\
                        <div class="field logicGLOBAL" title="GLOBAL для всего проекта"><img src="img/16/globe_place.png"><input id="logicGLOBAL" type="checkbox"></div>\
                        <div class="field logicFALSE" title="IF FALSE срабатывает при невыполнении условия"><img src="img/16/brick_delete.png" onclick="gui.toggleControls(this)"><input id="logicFALSE" type="text" class="hidden"></div>\
                        <div class="field logicTRUE" title="IF TRUE срабатывает при выполнении условия"><img id="logicTRUEicon" src="img/16/brick.png" class="pointer" onclick="gui.toggleControls(this)"><input id="logicTRUE" type="text" class="hidden"></div>\
                        <div class="field logicDO" title="DO вызвать скрипт"><img src="img/16/brick_error.png" onclick="gui.toggleControls(this)"><input id="logicDO" type="text" class="hidden"></div>\
                        <div class="field small logicGO" title="GOTO перейти к параграфу"><img id="logicGOicon" src="img/16/brick_go.png" class="pointer" onclick="gui.toggleControls(this)"><input id="logicGO" type="text" class="hidden"></div>\
                    </div>\
                    <div id="'+                 o.uid+'" \
                        captal-paragraph="'+    o.paragraph+'" \
                        captal-tag="'+          o.tag+'" \
                        captal-if="" \
                        captal-ifnot="" \
                        captal-goto="" \
                        captal-do="" \
                        captal-isglobal="" \
                        class="blk_editor">'+   o.body +'</div>\
                </div>' );   */    

        var el = document.getElementById(o.uid);
        var html = el.innerHTML;
        if (html.length > 0) {
            html = html
                    .replace(new RegExp('&lt;','g'), '<')
                    .replace(new RegExp('&gt;','g'), '>');
        }
        var editor = ace.edit(el);
        editor.$blockScrolling = 'Infinity';
        editor.getSession().setOption("useWorker", false); // !!! remove to get warnings back
        editor.getSession().setValue(html);
        editor.setTheme("ace/theme/textmate"); // alt: kuroir
        editor.setAutoScrollEditorIntoView(true);
        editor.setOption("maxLines", 'Infinity');
        editor.setShowInvisibles( cfg.showInvisibles );
		editor.setReadOnly( cfg.readonly );
        editor.getSession().setUseWrapMode(true);
        // @FIXME: collect editor handlers blur,focus,change
        editor.on('blur',function(e){
            
            var id = $(e.target.offsetParent).attr('id');
            //debug('focus lost: '+id);
           
            $('#'+id).addClass('ace_focus'); // prevent lost focus
            
            block.store(id); // save changes to data-source
        });        
        editor.on('focus',function(e, ui){
            
            var id    = $(ui.container).attr('id');
            var parID = $(ui.container).attr('captal-paragraph');
            var blkID = $('#desk .ace_editor').index( $('#'+id) );
            
            //debug('focus gained:',id,parID,blkID);            

            // @TODO: get rid of global block.id someday
            //block.id = id;

            // remove focus from other blocks of this paragraph
            $('#tab-'+ parID +' .ace_focus').not(':eq('+ blkID +')').removeClass('ace_focus');
            $('#tab-'+ parID +' .ace_editor').eq(blkID).addClass('ace_focus');                                                  
        });
        
        // @FIXME: too frequent, performance reduction
        //editor.on('change', function(e, ui){
            /*
                var id = $(ui.container).attr('id');
                block.store(id);
            */
        //});

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
        
        
        // translation
        if (o.tag == 'text') {
            
            if (o.translated === 'true') {

                var tran = $('#data-source translation[type="auto"][textid="'+o.id+'"]');
                var orig = $('#data-source translation[type="original"][textid="'+o.id+'"]');
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

                $('#'+o.uid)
                    .css({
                    width: '38%',
                    float: 'left'
                })
                    .attr('captal-translated', true)
                    .after('<div class="autotrans"><b>Автоперевод: <img src="img/16/flag_'+tranLang+'.png"></b><div>'+ tranText +'</div>Переведено сервисом <a href="http://translate.yandex.ru/" target="_blank">«Яндекс.Переводчик»</a></div>\
                        <div class="origtrans"><b>Оригинал: <img src="img/16/flag_'+origLang+'.png"></b><div>'+ origText +'</div></div>');

            } else if (cfg.autoTranslate) {

                block.translate(o.uid);
            } 
        }
        
        // dirty navigator update
        // @TODO: checkme
        //paragraph.show( paragraph.id );
        return o.uid;
    };
   
    /**
     * Convert numbers to hyberlinks in editor
     * @returns {undefined}
     */   
    block.addLinks = function(){
        var lines = $('#'+block.id+' .ace_text');
        var itext = lines.text();        
        var line;
        var str;
        var links = itext.match(/\d+/g);
        var ulinks = [];
        var link;
        var wrapped;                                
             
        // make links unique
        for (var ti in links){
            if (ulinks.indexOf(links[ti]) == -1) {
                ulinks.push(links[ti]);
            }
        }
        
        // third approach, combine autoreplacement with manual
        lines.each(function(){
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
        });
                
        // delay for DOM
        setTimeout(function(){
            $('#'+block.id+' .autolink').each(function(){
                var div = document.createElement('div');
                var lpos = $(this).position();
                var boff = $('#'+block.id).offset();
                var bpos = $('#'+block.id).position();                
                var link = $(this).html();
                
                $(div)
                    .html( link )
                    .addClass('autolink-helper')
                    .css({
                        top : bpos.top + lpos.top - 2,
                        left: lpos.left + 58
                    })
                    .click(function(e){
                        // left click
                        if (e.which == 1) {                                                        
                            block.removeLinks();
                            paragraph.open( $(this).html() );                            
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
                $('#tab-'+paragraph.id).prepend(div);
            });
        },200);
    };        
    
    /**
     * Add new block to current paragraph
     *
     * @param could be tag string or object
     */
    block.create = function(o){ debug('block.create('+o.tag+')');
                      
        o.paragraph   = o.paragraph   || paragraph.current(),
        o.body        = o.body        || '',
        o.logicGO     = o.logicGO     || '',
        o.logicDO     = o.logicDO     || '',
        o.logicTRUE   = o.logicTRUE   || '',
        o.logicFALSE  = o.logicFALSE  || '',
        o.logicGLOBAL = o.logicGLOBAL || '';

        var blkID     = $('#desk .ui-tabs-panel[aria-hidden="false"] #blk_'+ o.tag +' .ace_editor').length;
        
        // new node in data-source
        if (o.tag == 'handler') {
           
            $('#data-source handlers').append('<'+o.tag+' name="'+ o.paragraph +'"></'+o.tag+'>');
            
        } else {
            // if article
            $('<'+o.tag+'/>')
                    .attr({ 
                        goto    : o.logicGO,
                        if      : o.logicTRUE,
                        ifnot   : o.logicFALSE,
                        do      : o.logicDO,
                        isglobal: o.logicGLOBAL 
                    })
                    .html( '' )
                    .appendTo( $('#data-source article#'+ o.paragraph) );            
        }    

        // add block
        var tblock = block.add({            
            tag         : o.tag,
            body        : o.body,
            paragraph   : o.paragraph,
            logicGO     : o.logicGO,
            logicDO     : o.logicDO,
            logicTRUE   : o.logicTRUE,
            logicFALSE  : o.logicFALSE,
            logicGLOBAL : o.logicGLOBAL
        });
        
        // update navigator
        var tree        = $('#nav').jstree(true);
        tree.create_node( 'nav-'+ o.tag , { type: o.tag, id: 'nav_'+ o.paragraph +'_'+ o.tag +'_'+ blkID, text: blkID+1 });
        
        block.show( o.paragraph, blkID );        
        return o;
    };
    
    /**
     *
     * @param {} obj
     */
    block.delete = function(e){ debug('block.delete()');
        
        var tree = $('#nav').jstree(true);        
        if (!tree) { error('Проект не загружен'); return; }
        
        var node = tree.get_node(tree.get_selected()[0]);        
        if (!node) {             
            error('Блок не выбран');
            log('Выделите блок, подлежащий удалению и повторите операцию'); 
            return; 
        }       
        
        if (confirm('Удалить блок '+node.text+'?')){        
            var obj  = $('#tab-'+paragraph.id+' #'+block.id);

            // убрать блок из редактора             
            obj.prev('.blk_header').remove();
            obj.prev('.lang-flag').remove();
            obj.remove();

            if ( node.type == 'handler') {
                // handler
                $('#data-source handler[id='+node.text+']').remove();
            } else {
                // article
                $('#data-source article#'+paragraph.id+' *[id='+node.text+']').remove();                            
            }                        

            tree.delete_node(node);  
            
            // if it was last block create text
            if ( $('#data-source article#'+paragraph.id).html().trim() == '' ) {
                //$('#data-source article#'+paragraph.id).append('<text id="'+getRandomName('text')+'"></text>');
                block.create('text');
                //paragraph.open(paragraph.id);
            }  
        }
    };
    
    block.indent = function(){
        var editor = ace.edit( block.id );
        editor.indent();
    };        
    
    /**
     * Load block attributes
     * @TODO: Depricated
     * @param {} blockID
    
    
    block.load = function(blockID){ debug('block.load('+blockID+')');
        
        return error('block.load() is depricated');
        
        $('#desk .field input[id="text"]').val(''); // clear logic fields
        
        blockID         = blockID || block.id;        
        var obj         = $('#tab-'+ paragraph.id +' #'+ blockID);                
        var logicTRUE   = $(obj).attr('captal-if')      || '';
        var logicFALSE  = $(obj).attr('captal-ifnot')   || '';
        var logicGO     = $(obj).attr('captal-goto')    || '';
        var logicDO     = $(obj).attr('captal-do')      || '';
        var logicGLOBAL = $(obj).attr('captal-isglobal')|| '';

        if (logicTRUE   != 'undefined') {
            $('#logicTRUE').val(logicTRUE);
        }
        if (logicFALSE  != 'undefined') {
            $('#logicFALSE').val(logicFALSE);
        }
        if (logicGO     != 'undefined') {
            $('#logicGO').val(logicGO);
        }
        if (logicDO     != 'undefined') {
            $('#logicDO').val(logicDO);
        }
        if (logicGLOBAL == 'true') {
            $('#logicGLOBAL').prop('checked',true);
        } else {
            $('#logicGLOBAL').prop('checked',false);
        }

        // select node in nav tree        
        $('#nav').jstree('deselect_all');
        $('#nav').jstree(true).select_node ('nav_'+ $('#'+blockID).attr('captal-id'), true );
        //debug( 'nav_'+ $('#'+blockID).attr('captal-name') );
    };
    */
    block.move = function(e){ debug('block.move('+e+')');
        
        var blk         = $('#tab-'+paragraph.id+' .ace_focus');
        var blk_header  = blk.prev();
        var tree        = $('#nav').jstree(true);
        var node        = tree.get_node('nav_'+$(blk).attr('captal-id'));
        var source      = $('#data-source '+node.type+'[id="'+node.text+'"]');

        if (e == 'up' && $('#'+node.id).index() > 0) {
            // update editor
            //$(blk.prevAll('#tab-'+paragraph.id+' #blk_'+tag+' .blk_header')[1]).before( blk_header );
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
        var editor = ace.edit( block.id );
        editor.blockOutdent();
    };
    
    block.removeLinks = function(){ 
        $('#'+block.id+' .autolink').each(function(){
            var html = $(this).html();
            $(this).replaceWith( html );
        });
        $('#desk .autolink-helper').remove();
        $('#mnuAutolink').hide();
        gui.autolinkMenuTarget = null;
    };
    
    block.rename = function(e){                        
        var oldName = $('#tab-'+paragraph.id+' #'+block.id).attr('captal-id');
        var newName = prompt("Please enter new block name", oldName);            

        if (newName != null) {
            var obj = $('#tab-'+paragraph.id+' #'+block.id);
            var tag = obj.attr('captal-tag');
            var nav = obj.attr('captal-nav');

            obj.prev('.blk_header').html(newName+':');      // rename header          
            obj.attr('captal-id', newName);                 // rename attribute
            $('#nav').jstree(true).set_text(nav, newName ); // rename navigator node

            // update data-source
            if (tag == 'handler') {      
                //debug('handler[name='+paragraph.id+']')
                $('#data-source handler[name='+paragraph.id+'][id="'+ oldName +'"]').attr('id', newName);
            } else {
                $('#data-source article#'+paragraph.id+' '+tag+'[id="'+ oldName +'"]').attr('td', newName);
            }
        }
    };
    
    /**
     * Scroll to block
     */
    block.show = function(parID, blkID) { debug('block.show('+parID+', '+blkID+')');
        
        var uid    = $('#tab-'+ parID +' .blk_editor:eq('+ blkID +')').attr('id');
        
        console.log('editor',uid)
        var offset = $('#'+uid).prev().position().top;       
        
        if (offset != undefined) {
            
            $('#tab-'+ parID).scrollTop( $('#tab-'+parID).scrollTop() + offset );
            ace.edit( uid ).focus();
        }                
    };
    
    block.showInvisibles = function(){
        cfg.showInvisibles = !cfg.showInvisibles;
        
        $('.ace_editor').each(function(){
            var editor = ace.edit( $(this).attr('id') );
            editor.setShowInvisibles( cfg.showInvisibles );            
        });
    };
    
    /**
     * Store current block to data-source
     * 
     * @param {type} o description
     */
    block.store = function(o){ //debug('block.store('+blockID+')');
        // @FIXME: too frequent!
        
        var blockID = (typeof o == 'object') ? o.id : o;
        blockID = (blockID == undefined) ? block.id : blockID;
        if (blockID == undefined) { return false; }
        
        debug('block.store('+blockID+')');
        
        var obj         = $('#'+blockID);
        var id          = obj.attr('captal-id');
        var tag         = obj.attr('captal-tag');
        var logicTRUE   = $('#logicTRUE').val();
        var logicFALSE  = $('#logicFALSE').val();
        var logicGO     = $('#logicGO').val();        
        var logicDO     = $('#logicDO').val();
        var logicGLOBAL = $('#logicGLOBAL').prop('checked');
        var editor      = ace.edit( blockID );
        var source      = editor.getValue();  
        var logicGObak  = obj.attr('captal-goto'); // keep previous value

        obj
            .attr('captal-if',      logicTRUE)
            .attr('captal-ifnot',   logicFALSE)
            .attr('captal-goto',    logicGO)
            .attr('captal-do',      logicDO)
            .attr('captal-isblobal',logicGLOBAL);

        if (tag == 'handler') {
            //debug( name );
            $('#data-source handlers [paragraph='+ paragraph.id +'][id='+id+']')
                .html( '&lt;![CDATA[' + source + ']]&gt;' );
        } else {
            $('#data-source article#'+ paragraph.id +' '+tag +'[id="'+id+'"]')
                .html( '&lt;![CDATA[' + source + ']]&gt;' )
                .attr('if',         logicTRUE)
                .attr('ifnot',      logicFALSE)
                .attr('goto',       logicGO)
                .attr('do',         logicDO)
                .attr('isglobal',   logicGLOBAL);        
        }
        
        // goto field affect connection status, update        
        var tree = $('#toc').jstree(true);
        
        // update old target
        //        
        if (logicGObak != '') {                        
            if ($('#data-source action[goto="'+logicGObak+'"]').length == 0) {
                //orphan
                tree.set_icon(logicGObak, "img/16/icon-page-red.png" );
            } else if ($('#data-source article#'+logicGObak+' action[goto]').length > 0) {
                // deadend
                tree.set_icon(logicGObak, "img/16/icon-page-yellow.png" );
            } else {
                // normal
                tree.set_icon(logicGObak, "img/16/icon-page.png" );
            }                               
        }        
        
        // update new target
        //        
        if (logicGO != '') {            
            if ($('#data-source article#'+logicGO+' action[goto]').length > 0) {
                // normal
                tree.set_icon(logicGO, "img/16/icon-page.png" );
            } else {                
                // deadend
                tree.set_icon(logicGO, "img/16/icon-page-yellow.png" );                
            }                               
        }
        
        // update self
        //        
        if ($('#data-source action[goto="'+paragraph.id+'"]').length == 0) {
            //orphan
            tree.set_icon(paragraph.id, "img/16/icon-page-red.png" );
        } else if (logicGO == '') {
            // deadend
            tree.set_icon(paragraph.id, "img/16/icon-page-yellow.png" );
        } else {
            // normal
            tree.set_icon(paragraph.id, "img/16/icon-page.png" );
        }                
        
        // update language        
        lang.detect(source, function(res){
            var tlang = (res[0].count == 0) ? 'undefined' : res[0].name;
            $('#desk #'+blockID).prevAll('img.lang-flag:first').prop('src', 'img/16/flag_'+tlang+'.png').prop('lang', tlang);
            if (tag != 'handler') {
                $('#data-source article#'+paragraph.id+' '+ tag +'[id="'+ id +'"]').attr('lang',tlang);
            }
        });
    };   
    
    block.translate = function(blockID){ debug('block.translate()');
        
        if (block.id == null) return;
        
        var blockID = typeof blockID != 'object' ? blockID : block.id;                                           
        var text = $('#data-source text[id="'+ $('#'+blockID).attr('captal-id') +'"]')
                                                    .html()
                                                    .replace( /\<\!\[CDATA\[/i,'')
                                                    .replace( /&lt;\!\[CDATA\[/i,'')
                                                    .replace(']]>','')
                                                    .replace(']]&gt;','');
        var translated     = $('#'+blockID).attr('captal-translated');
        var recognizedLang = $('#'+blockID).prev().prev().attr('lang');
        var supportedLangs = {
            'rus'   : 'ru',
            'ukr'   : 'ua',
            'eng'   : 'en',
            'ger'   : 'de',
            'ita'   : 'it',
            'fra'   : 'fr'
        };
        var sourceLang = supportedLangs[recognizedLang] || 'en';
        var targetLang = 'ru';      
        
        if (translated === 'true') {
            
            return error('Автоматический перевод уже применен для этого блока.')            
        }                
        
        if (sourceLang == targetLang || text.length == 0) {
            
            return;
            
        } else {                 
        
            $.ajax({
                url: 'https://translate.yandex.net/api/v1.5/tr.json/translate',
                data: {
                    key     : 'trnsl.1.1.20170211T190809Z.6bd96d6ef3a6a4b6.d62c1613c13d7bf4a7bcaa5ac1341ca94ca91499',
                    text    : text,
                    lang    : sourceLang +'-'+ targetLang ,
                    format  : 'html',
                    options : 0,
                    id      : blockID
                },
                success: function(res){
                    
                    // extract blockID from request url
                    var url = this.url.split('&');
                    res.id  = url[url.length-1].substr(3);
                    
                    block.translated(res);
                }
            });
        }
    };
    
    block.translated = function(res){ debug('block.translated(...)');                
        
        var lang            = res.lang.split('-');        
        var supportedLangs  = {
            'ru' :'rus',
            'ua' :'ukr',
            'en' :'eng',
            'de' :'ger',
            'it' :'ita',
            'fr' :'fra'
        };        
        var blockID         = res.id;
        var obj             = $('#'+blockID);
        var blockName       = obj.attr('captal-id');
        var origLang        = supportedLangs[lang[0]] || 'eng';
        var tranLang        = supportedLangs[lang[1]] || 'rus';
        var tranID          = getRandomName('tran');
        var tranText        = res.text[0];
        var origID          = getRandomName('orig');
        var origText        = $('#data-source text[id="'+blockName+'"]')
                                    .html()
                                    .replace( /\<\!\[CDATA\[/i,'')
                                    .replace( /&lt;\!\[CDATA\[/i,'')
                                    .replace(']]>','')
                                    .replace(']]&gt;','');;        
        
        obj
            .css({
                width: '38%',
                float: 'left'
            })
            .attr('captal-translated', true)
            .after('<div class="autotrans"><b>Автоперевод: <img src="img/16/flag_'+tranLang+'.png"></b><div>'+ tranText +'</div>Переведено сервисом <a href="http://translate.yandex.ru/" target="_blank">«Яндекс.Переводчик»</a></div>\
                <div class="origtrans"><b>Оригинал: <img src="img/16/flag_'+origLang+'.png"></b><div>'+ origText +'</div></div>');
        
        // update data-source
        // <article id="xx">
        //    <text id="text_0000" lang="undefined" if="" ifnot="" goto="" do="" isglobal="false">&lt;![CDATA[]]&gt;</text>
        //    <orig id="orig_0000" target="text_0000" lang="undefined">&lt;![CDATA[]]&gt;</orig>
        //    <tran id="tran_0000" target="text_0000" lang="undefined">&lt;![CDATA[]]&gt;</tran>
        
        $('#data-source text[id="'+blockName+'"]')
                .attr('translated', true)
                .after('<translation id="'+origID+'" textid="'+blockName+'" lang="'+origLang+'" type="original">&lt;![CDATA['+origText+']]&gt;</translation>')
                .after('<translation id="'+tranID+'" textid="'+blockName+'" lang="'+tranLang+'" type="auto">&lt;![CDATA['+tranText+']]&gt;</translation>');
        
        if ( obj.hasClass('ace_editor') ) {            

            var editor = ace.edit(blockID);
            editor.focus();
            editor.setValue('');
            editor.resize(true);
            
        } else  {            
            
            obj.html('');
        };
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //                              LANGUAGE  
    ////////////////////////////////////////////////////////////////////////////
    
    lang = {  
        dicts: { rus: 'Русский', ukr: 'Украинский', eng: 'Английский', ger: 'Немецкий', ita: 'Итальянский', fra: 'Французский' },
        
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
            'day','between','even','many','those'],
        ger: ['der','die','und','in','den','von','zu','das','mit','sich','des','auf','für','ist','im','dem','nicht',
            'ein','die','eine','als','auch','es','an','werden','aus','er','hat','daß','sie','nach','wird','bei',
            'einer','der','um','am','sind','noch','wie','einem','über','einen','das','so','sie','zum','war','haben',
            'nur','oder','aber','vor','zur','bis','mehr','durch','man','sein','wurde','sei','in','prozent','hatte',
            'kann','gegen','vom','können','schon','wenn','habe','seine','ihre','dann','unter','wir','soll','ich',
            'eines','es','jahr','zwei','jahren','diese','dieser','wieder','keine','uhr','seiner','worden','und',
            'will','zwischen','im','immer','millionen','ein','was','sagte'],
        ita: ['non','di','che','è','e','la','il','un','a','per','in','una','mi','sono','ho','ma','lo','ha','le',
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
        for (d in lang.dicts) {
            stat.push({ count: 0, name: d, fullname: lang.dicts[d]});            
        }
        
        // search 
        for (i in str){
            j = 0;
            for (d in lang.dicts) {              
                if ( lang[d].indexOf( str[i] ) > -1) {
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
    
    ////////////////////////////////////////////////////////////////////////////
    //                              PARAGRAPH
    ////////////////////////////////////////////////////////////////////////////
    
    paragraph = {
        id      : null,
        groupBy : 20
    };            

    paragraph.close = function(obj){ 
        debug('paragraph.close('+ obj +')');

        var res, id;
        if (paragraph.id == undefined) return;                
   
        if (typeof obj === 'object') {
            // closing tab by cross
            res = $(obj).parents('a');
            id  = res.attr('href');                       
            
            $(obj).parents('li').remove();
            $('#desk '+id).remove();
            
        } else if (obj == undefined) {   
            // closing current paragraph
            id = paragraph.id;
            $('#desk div#tab-'+id).remove();
            $('#tabs li[aria-controls="tab-'+id+'"]').remove();            
            // switch to another paragraph    
            
        } else if (obj == 'other'){
            id = paragraph.id;
            $('#desk div.ui-tabs-panel:not(#tab-'+id+')').remove();
            $('#tabs li:not([aria-controls="tab-'+id+'"])').remove();            
        } else if (obj == 'all') {
            $('#tabs li').remove();
            $('#desk div.ui-tabs-panel').remove();
        } else {
            
        }
        
        $('#desk').tabs('refresh');
        

        // if last opened paragraph, remove tabs and hide toolbar
        if ( $('#desk #tabs li').length == 0) {
            gui.cleanDesk();            
        } else {
            gui.fixTabs();
        }
    };
    
    paragraph.create = function(o){ debug('paragraph.create('+ JSON.stringify(o) +')');
        
        if ($('#data-source').html().length > 0) {
            
            var tree      = $('#toc').jstree(true);
            var newID     = o.id || getNextId('article');
            var parentDOM = (o.parent.type == 'autofolder') ? ('[type="autofolder"]:first') : ('#'+o.parent.id);

            tree.create_node( o.parent.id , { 
                
                id  : newID,
                text: newID,
                type: "paragraph"
                
            },'last',function(node){     
                
                // update data-source
                $('#data-source folder'+parentDOM).append('<article id="'+newID+'"><text id="'+getRandomName('text')+'"></text></article>');

                if ($('#data-source action[goto="'+node.id+'"]').length == 0) {
                    //orphan
                    tree.set_icon(node.id, "img/16/icon-page-red.png" );
                } else if ($('#data-source article#'+node.id+' action[goto]').length == 0) {
                    // deadend
                    tree.set_icon(node.id, "img/16/icon-page-yellow.png" );
                } else {
                    // normal
                    tree.set_icon(node.id, "img/16/icon-page.png" );
                }

                //tree.select_node(newID, true);
                // open created paragraph
                //paragraph.open(newID);                                                              

                if (typeof o.callback == 'function'){
                    o.callback(node);
                }
            });                    
        } else {
            error('Проект не загружен');
        }
    };
    
    paragraph.current = function(){
    
        var result = $('#tabs li.ui-state-active').attr('aria-controls').replace('tab-','');
    
        return result;
    };
    
    paragraph.delete = function(e){ 
        debug('paragraph.delete()');
        if (paragraph.id) {
            if (confirm('Хотите удалить параграф '+paragraph.id+' с его содержимым?')) {            
                var tree = $('#toc').jstree(true);
                var parent = tree.get_node(paragraph.id).parent;

                tree.delete_node(paragraph.id);
                $('#data-source article#'+paragraph.id).remove();            
                gui.tocUpdate(parent);   
                paragraph.close();
            }
        } else {
            error('Параграф не найден');
        }       
    };
    
    paragraph.go = function(e){        
        var id = prompt('Введите номер параграфа для перехода');        
        if (id) {
            paragraph.open(id);
        }
    };
    
    paragraph.move = function(target){ debug('paragraph.move('+target+')');
        if (paragraph.id) {
            var tree = $('#toc').jstree(true);
            var node = tree.get_node(paragraph.id);
            var text = tree.get_node( node.parent).text.split('..');        

            if (target == 'up' && $('#toc #'+paragraph.id).index() > 0) {
                $('#data-source article#'+paragraph.id).prev('article').before(  $('#data-source article#'+paragraph.id) );
                tree.move_node(
                        paragraph.id,
                        node.parent, 
                        $('#toc #'+paragraph.id).index()-1
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
                $('#data-source article#'+paragraph.id).next('article').after(  $('#data-source article#'+paragraph.id) );
                tree.move_node(
                        paragraph.id,
                        tree.get_node(paragraph.id).parent, 
                        $('#toc #'+paragraph.id).index()+2 
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
            error('Параграф не найден');
        }
    };
    
    paragraph.new = function(opt){ debug('btnNewParagraph.click()');
        
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
            if (tnode.type == 'paragraph') {
                tnode = tree.get_node(tnode.parent);
            }

            if (tnode.type.indexOf('folder') == 0) {            
                //
                // USERFOLDER case
                //                            
                paragraph.create({
                    parent: tnode,
                    callback: function(node){ 
                        paragraph.open( node.id );                
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
                        parent: tparent,
                        callback: function(node){      
                            paragraph.open( node.id );
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
                                parent: tparent,
                                callback: function( node ){
                                    paragraph.open( node.id );
                                    // update autofolder name
                                    gui.tocUpdate(tparent);
                                }
                            });
                        }
                    );
                } 
            }
        } else {
            error('Проект не загружен');
            project.new();
        }        
    };
       
    paragraph.open = function(parID, curParID, callback){ debug('paragraph.open('+ parID +','+ curParID +')');
        
        if ($('#data-source').html().length === 0) {        
            error('Проект не создан');
            return;
        }
        
        // check if exist
        if ( $('#data-source article#'+parID).length == 0 && $('#data-source handler[name="'+parID+'"]').length == 0 ) {
            
            // not exist!
            if (confirm('Этот параграф не существует, создать?')){            

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
                paragraph.create({
                    parent: { 
                        id   : $('#toc li.jstree-last[toc-role="group"]').attr('id'),
                        type : 'autofolder' 
                    },
                    id: parID,
                    callback: function(node){ 
                        paragraph.open( node.id, callback );  
                        gui.tocUpdate(); 
                    }
                });
            }            
        } else {        
            // check if already opened
            if ( $('#tab-'+parID).length > 0 ) {
                // it is! just bring to front            
                //$('#desk').tabs( 'option', 'active', $('#tab-'+parID).attr('aria-labelledby').split('-')[2]-2 );            
                $('#desk').tabs( 'option', 'active', $('li[aria-controls="tab-'+parID+'"]').index() );

                $('#dlgLoading').hide();
                if (typeof callback === 'function'){
                    callback();
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
                $('#desk #tabs').append('<li><a href="#tab-'+ parID +'"><img class="tab-icon" src="img/16/icon-page.png"> '+ parID +' <img onclick="paragraph.close(this)" src="img/16/close.png"></a></li>');
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
                    var randomName = getRandomName($(this)[0].localName);
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
                            paragraph   : parID
                        });
                    }

                    // last element, all ready
                    if ( i == max ) {
                        $('#desk').tabs('refresh').tabs( 'option', 'active', $('#desk #tabs li').length -1 );
                        
                        gui.fixTabs(); // fix editor top tosition

                        // select first block of paragraph
                        block.show( parID, 0 );
                        
                        $('#dlgLoading').hide();
                        
                        if (typeof callback === 'function') {
                            callback();
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

                        // select first block of paragraph
                        block.show( parID, 0 );
                        
                        $('#dlgLoading').hide();
                        
                        if (typeof callback === 'function') {
                            callback();
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
        }
    };
    
    paragraph.rename = function(){  
        if (paragraph.id) {
            $('#toc').jstree(true).edit(paragraph.id);
        } else {
            error('Параграф не найден');
        }
    };
    
    paragraph.show = function(parID) { debug('paragraph.show('+parID+')');
        
        if (parID == null) return;                

        // recreate tree
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
                root     : { icon : "img/16/icon-page.png" },
                text     : { icon : "img/16/script_globe.png" },
                action   : { icon : "img/16/script_lightning.png" },
                script   : { icon : "img/16/script_gear.png" },
                handler  : { icon : "img/16/icon-handler.png" }
            }
        }).on("changed.jstree",function(e, data){
            
            if ( data.action == 'select_node' && (data.node.type == 'text' || data.node.type == 'action' || data.node.type == 'script' || data.node.type == 'handler') ) {                  
                
                // check if block is not loaded
                if ( $('.ace_focus').attr('captal-name') != data.node.text) {
                    
                    block.show( paragraph.current(), data.node.text );
                }
            }
        }).on("create_node.jstree",function(e, data){
            
        }).on("rename_node.jstree",function(e, data){
            /*
            var oldName = data.old;
            var newName = data.text;
            
            if (newName != null) {
                var obj = $('#tab-'+paragraph.id+' #'+block.id);
                var tag = obj.attr('captal-tag');
                var nav = obj.attr('captal-nav');
                
                obj.prev('.blk_header').html(newName+':');      // rename header          
                obj.attr('captal-name', newName);               // rename attribute
                $('#nav').jstree(true).set_text(nav, newName ); // rename navigator node
                $('#nav').jstree(true).set_id(nav, 'nav_'+newName ); // rename navigator node
                
                // update data-source
                if (data.node.type == 'handler') {
                    $('#data-source handler[id="'+ oldName +'"]').attr('id', newName); // attr.type
                } else {
                    $('#data-source article#'+paragraph.id+' '+tag+'[id="'+ oldName +'"]').attr('id', newName); // attr.type
                }
            }*/
        }).on("ready.jstree",function(e, data){
                     
            // reselect current block in nav
            //$('#nav').jstree(true).select_node( 'nav_'+$('#tab-'+paragraph.id+' .ace_focus').attr('captal-name'), true );          
            // update block.id
            //block.id = $('#tab-'+paragraph.id+' .ace_focus').attr('id');
            // reload logic fields, will also reselect navigator
            //block.load( block.id );
        });
        
        var tree = $('#nav').jstree(true);
        
        // navigator root is paragraph name
        tree.set_text('nav-root', parID); 
        
        // populate navigator tree
        $('#tab-'+ parID +' .blk_editor').each(function(){
            var tag  = $(this).attr('captal-tag');
            //var name = $(this).attr('captal-name');            
            var name = $(this).index();

            // push block to navigator
            var nav = tree.create_node( 'nav-'+ tag , { type: tag, id: 'nav_'+ getRandomName(tag) , text: name });
            
            // add link to navigator node
            $(this).attr('captal-nav', nav);

            // deselect
            //$(this).removeClass('ace_focus');
        });
       
        //paragraph.id = parID;
                
        // if article
        if ( $('#data-source article#'+parID).children().length > 0 ) {
            $('#btnAddText').prop(  'disabled', false);
            $('#btnAddAction').prop('disabled', false);
            $('#btnAddScript').prop('disabled', false);
            $('#btnAddHandler').prop('disabled', true);            
        } else {
            // handler
            $('#btnAddText').prop(  'disabled', true);
            $('#btnAddAction').prop('disabled', true);
            $('#btnAddScript').prop('disabled', true);
            $('#btnAddHandler').prop('disabled', false);
            
            // paragraph icon
            tree.set_icon('nav-root', $('#toc').jstree(true).get_icon(paragraph.id) );
        }
        
        //if ($('#data-source article#'+parID).children().length > 0 || h)
        $('#btnPageUp').prop('disabled', false);
        $('#btnPageDn').prop('disabled', false);
        
        // select paragraph in toc        
        //
        $('#toc').jstree('deselect_all');
                
        if ( $('#tab-'+paragraph.id+' .blk_group:first').attr('captal-tag') == 'handler') {
            // handler
            $('#toc').jstree(true).select_node(parID, true);
        } else {
            // article
            //$('#toc').jstree(true).select_node('toc_'+parID, true);
            $('#toc').jstree(true).select_node(parID, true);
        }                 
    };    
    
    paragraph.shuffle = function(){ debug('paragraph.shuffle()');
        
        if ($('#data-source article').length === 0) {        
            error('Параграфы не найдены');
            return;
        } else if ($('#data-source article').length === 1) {        
            // nothing to shuffle
            return;
        }
        
        if (!confirm('Вы уверены, что хотите перемешать все параграфы?')) return;
        
        var i;
        var last = $('#data-source article').length;
        var rnd;
                
        $('#dlgLoading').show();
        
        // clone data-source structure to buffer
        var buffer = $('<div />')
                        .attr('id','temp-source')
                        .addClass('hidden')
                        .html( $('#data-source').html() )
                        .appendTo('body');        
        
        // remove autofolders
        $('#temp-source folder[id="autofolder"]').remove();
        
        // create autofolder
        $('<folder />')
                .attr('id','folder_0000')
                .attr('type','autofolder')
                .prependTo('#temp-source book');
        
        // copy articles from data-source to buffer in random order
        // [!] preserve first (entry) paragraph
        for (i = 1; i < last; i++) {
            rnd = random(2, $('#data-source article').length );
            $('#temp-source folder[id="autofolder"]').append( $('#data-source article:nth-child('+rnd+')') );                    
        }
        // push first paragraph unchanged
        $('#temp-source folder[id="autofolder"]').prepend( $('#data-source article:nth-child(1)') );                    
        
        // rename paragraphs to tmp names
        i = 1;
        $('#temp-source article').each(function(){            
            i++;
            
            var id = $(this).attr('id');            
            $(this).attr('id','tmp-'+id);

            // preserve links
            $('#temp-source action[goto="'+id+'"]').each(function(){                
                var action = $('#temp-source action[goto="'+id+'"]');

                $(this)
                    .html( $(this).html().replace(new RegExp(id,'g'),'tmp-'+id) )
                    .attr('goto','tmp-'+id);
            });

            if (i == last) {
                // rename according new order
                i = 0;
                $('#temp-source article').each(function(){
                    var id = $(this).attr('id');

                    $(this).attr('id',i);
                    
                    // restore links
                    $('#temp-source action[goto="'+id+'"]').each(function(){
                        $(this)
                            .html( $(this).html().replace(new RegExp(id,'g'),i) )
                            .attr('goto',i);
                    });
                
                    i++;
                    
                    if (i == last) {
                        var xml = '<xml>'+ $('#temp-source').html();

                        // rename procedure completed, reload project, remove temp
                        project.loadXML(xml, 
                            function(){
                               $('#temp-source').remove();
                            }
                        );
                    }
                });
            }
        });
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //                              PROJECT
    ////////////////////////////////////////////////////////////////////////////
    
    project = {
        file        : { name: "Untitled.xml"},
        gameID      : null,
        imported    : null,
        isComponent : false,
        language    : 'undefined',
        encoding    : 'utf8'
    };          
    
    project.addComponent = function(o){
        debug('project.addComponent(',o);
        
        var tree =  $('#toc').jstree(true);
        
        // update data-source
        $('<component/>')
            .attr({
                id      : o.index_name, 
                version : o.version
            })
            .appendTo('#data-source components');
    
        // update toc tree
        tree.create_node( 
            'toc-components', 
            {
                type    : 'component', 
                id      : o.index_name, 
                text    : o.fullname 
            }, 
            'last',
            function (o){
                tree.open_node('toc-components');
            }
        );
    };
    
    project.export = function(){
        debug('project.export()');
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
                    $('#sLang').append('<option value="'+ tlang +'">'+ lang.dicts[ tlang ] +'</option>');
                }
            });
            
            //$('#dlgExport #sLang')
            
            if ($('#dlgExport').hasClass('ui-dialog-content')){
                $('#dlgExport').dialog( "open" );
            } else {
                $('#dlgExport').dialog({
                    modal       : true,
                    sizeable    : false,
                    width       : 1000,
                    height      : 600,
                    buttons: {
                        Экспорт: function(){                                                                                                            
                            project.exportDOCX();                                
                            $( this ).dialog( "destroy" );                                                                                                                                
                        },
                        Отмена: function() {     
                            $( this ).dialog( "destroy" );
                            //$( this ).dialog( "close" );
                        }
                    },
                    open: function( event, ui ) {
                        
                        $('#dlgExport #cLineBr').prop('checked', cfg.lineBreak);
                    }
                });
            }           
            //$('#toc-header a').removeClass('changed');
        } else {
            error('Параграфы не найдены');
        }
    };
    
    project.exportDOCX = function(){                                                                                                                                      
        debug('project.exportDOCX()');
        
        //var doc     = $('<div />').addClass('hidden').appendTo('body');
        var doc     = $('#doc').html('');
        var art     = 0;
        var artMax  = $('#data-source article').length;   
        var sLang   = $('#dlgExport #sLang').val() || 'all';
        var cLineBr = $('#dlgExport #cLineBr:checked').length >0 ? true : false; 

        $('#data-source article').each(function(){
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
                var tlang;
                blk++;
                
                /*
                body = exprSafe(body)
                        .replace(new RegExp( exprSafe('[go]') ,'g'), '<a>')
                        .replace(new RegExp( exprSafe('[/go]'),'g'), '</a>');
                */
               
                // convert inline actions
                //....                                                                            
                
                if (tag == 'text') {
                    
                    // new line breaks
                    if (cLineBr) {
                        //body = body.replace(/\n/g, '<br />');
                        body = '<pre>'+ body + '</pre>';
                    }    
                    
                    doc.append('<p>'+ body +'</p>');
                }

                if (art == artMax && blk == blkMax) {
                    // last
                    log('writing DOC' );
                    var blob = new Blob( [ '<html xmlns:office="urn:schemas-microsoft-com:office:office" '+
                        'xmlns:word="urn:schemas-microsoft-com:office:word" '+
                        'xmlns="http://www.w3.org/TR/REC-html40">'+
                        '<head><xml>'+
                        '<word:WordDocument>'+
                        '<word:View>Print</word:View>'+
                        '<word:Zoom>90</word:Zoom>'+
                        '<word:DoNotOptimizeForBrowser/>'+
                        '</word:WordDocument>'+
                        '</xml>'+
                        '</head><body>'+ doc.html() +'</body></html>' ] , {type: "text/xml;charset=utf-8"});
                    saveAs(blob, "Untitled.doc");
                }
                
            });
        });
        /*
            $('#data-source article').each(function(){
            var par = $(this).attr('id');
            var blk = 0;
            var blkMax = $('#data-source article#'+par).children().length;
            art++;

            $('#doc').append('<h2>'+par+'</h2>');

            $(this).find('[lang="'+lang+'"]').each(function(){
                var tag         = $(this)[0].localName;
                var body        = $(this)[0].innerHTML.replace('<![CDATA[','').replace(']]>','');
                var type        = $(this).attr('type')  || '';
                var logicTRUE   = $(this).attr('if')    || '';
                var logicFALSE  = $(this).attr('ifnot') || '';
                var logicGO     = $(this).attr('goto')  || '';
                var logicDO     = $(this).attr('do')    || '';
                var name        = ( type == undefined ) ? tag : type +'.'+ tag;
                blk++;

                if (tag == 'text') {
                    $('#doc').append('<p>'+body+'</p>');
                }

                if (art == artMax && blk == blkMax) {
                    // last
                    debug('writing DOC' );
                    var blob = new Blob( [ '<html><head></head><body>'+ $('#doc').html() +'</body></html>' ] , {type: "text/xml;charset=utf-8"});
                    saveAs(blob, "Untitled.doc");
                }
            });
        });
         */
    };
    
    project.exportRepo = function(){
        if (project.gameID != null) {
            repo.game.publish( project.gameID, function(res){
                if (res.result == 'ok') {
                    log('Игра ожидает рассмотрения');
                }
            });
        } else {
            error('Игра не найдена в облаке');
        }
    };
    
    project.import = function(){
        $('#openProject')
            .attr('accept','.pdf, .docx, .txt')
            .trigger('click');
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
                            
        PDFJS.workerSrc = 'lib/workers/pdf.worker.js';

        reader.onload = (function(theFile){
            return function(e){
                var uint8Array = new Uint8Array(e.target.result);
                var parameters = Object.create(null);

                parameters.data = uint8Array;

                //PDFJS.getDocument('dev/lonewolf2.pdf')
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
            open        : function(){
                var counts = {};
                var icons = {
                    1: 'bullet_edit.png',
                    2: 'hourglass.png',
                    3: 'exclamation.png',
                    4: 'lock.png',
                    5: 'tick.png'
                };                
                
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
                        $('#dlgRepo #list').append('<div class="message">Облако не доступно</div>');
                    }
                });
            },
            close: function() {
                $('#repo-search').appendTo( $('#dlgRepo') );
                if ( $('#dlgRepo #list').hasClass('ui-accordion') ){
                    $('#dlgRepo #list').accordion('destroy').html('');
                }
                $( this ).dialog( "destroy" );
            },
            buttons: {
              Закрыть: function() {
                    // clean
                    $('#repo-search').appendTo( $('#dlgRepo') );
                    if ( $('#dlgRepo #list').hasClass('ui-accordion') ){
                        $('#dlgRepo #list').accordion('destroy').html('');
                    }
                    $( this ).dialog( "destroy" );
              }
            }
        });
        
    };
    
    project.loadDOCXalt = function(res){ debug('project.loadDOCX');
        var tpar    = 0;
        var i       = 0;
        var lastR   = $(res).find('p').length;
        var pProbMax= $('#dlgImportDOCX input.paragraph:checkbox:checked').length;
        //var buffer  = document.createElement('div');
        var buffer  = '';
        var xml     = document.createElement('xml');
        
        var cParCenter = $('#dlgImportDOCX #cParCenter:checked').length > 0 ? true : false;
        var cParBold   = $('#dlgImportDOCX #cParBold:checked').length   > 0 ? true : false;
        var cParClass  = $('#dlgImportDOCX #cParClass:checked').length  > 0 ? true : false;
        var cParAlone  = $('#dlgImportDOCX #cParAlone:checked').length  > 0 ? true : false;

        var actions = [];
        
        $('#dlgImportDOCX .action:checkbox:checked').each(function(){
            actions.push( $(this).next().html() );
        });

        // load template
        $(xml).html( $('#new-project-template xml').html() );
        
        //
        var parseBuffer = function(buffer, tpar, callback){            
            var actText = '';
            var tact;
            buffer = $.trim(buffer);
            if (buffer != '') {
                for (var ta in actions) {
                    if (buffer.match( new RegExp( actions[ta]) ) != null){                            
                        var arr = buffer.split( actions[ta] );                                                                                    

                        for (var ti in arr) {
                            if (ti > 0) {
                                tact = arr[ti].match(/\d+/);

                                if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0){
                                   actText += '<action goto="'+tact+'">'+ tact +'</action>\n';                                   
                                }
                            }
                        }
                    }
                }
                $(xml).find('article#'+tpar).append('<text>'+buffer+'</text>\n'+actText);
                buffer = '';
            }                        
            
            if (typeof callback == 'function') {
                callback();
            }
        };
        
        $(res).find('p').each(function(){
            var p = $(this);
            var pText = $.trim(p.text());
            var pNum  = pText.match(/\d+/);
            var pProb = 0;            
            
            i++;
            
            if (pNum != null) {                
                // try to detect paragraph declaration
                //
                if ( cParCenter  && p.css('text-align') == 'center'               ) { pProb++; }
                if ( cParBold    && p.find('span').css('font-weight') == 'bold'   ) { pProb++; }
                if ( cParClass   && p.hasClass( $('#dlgImportDOCX #sParClass').val() )) { pProb++; }
                if ( cParAlone   && pText == pNum){ pProb++; }
            }
            
            if (pProb == pProbMax) {
                // this is paragraph declaration                    
                parseBuffer(buffer,tpar,function(){
                    tpar = pNum;
                    $(xml).find('book').append('<article id='+tpar+'></article>');                    
                });
            } else {
                buffer += p.text();
            }            
            
            if (i == lastR) {
                // flush leftovers
                parseBuffer(buffer,tpar,function(){
                    project.loadXML(xml);
                });
            }
        });
        
    };
    
    project.loadDOCX = function(res){ debug('project.loadDOCX()');
        var tpar    = 0;
        var i       = 0;
        var lastR   = $(res).find('p').length;
        var pProbMax= $('#dlgImportDOCX input.paragraph:checkbox:checked').length;
        var buffer  = document.createElement('div');
        var xml     = document.createElement('div');
        
        var cParCenter = $('#dlgImportDOCX #cParCenter:checked').length > 0 ? true : false;
        var cParBold   = $('#dlgImportDOCX #cParBold:checked').length   > 0 ? true : false;
        var cParClass  = $('#dlgImportDOCX #cParClass:checked').length  > 0 ? true : false;
        var cParAlone  = $('#dlgImportDOCX #cParAlone:checked').length  > 0 ? true : false;
        
        var cActLinkMi = $('#dlgImportDOCX #cActLinkMi:checkbox:checked').length > 0 ? true : false;
        var cActLinkTo = $('#dlgImportDOCX #cActLinkTo:checkbox:checked').length > 0 ? true : false;
        var cActLinkRb = $('#dlgImportDOCX #cActLinkRb:checkbox:checked').length > 0 ? true : false;
        var cActLinkPh = $('#dlgImportDOCX #cActLinkPh:checkbox:checked').length > 0 ? true : false;
        var cActLink   = $('#dlgImportDOCX #cActLink:checkbox:checked').length   > 0 ? true : false;        
        
        // load template
        $(xml).html( $('#new-project-template xml').html() );
        
        var parseBuffer = function(buffer, tpar, callback){
            var j       = 0;
            var lastB   = $(buffer).find('p').length;
            var bText   = $(buffer).text().replace(/–/g,'-').replace( new RegExp(' ','g'), ' ');
            var artText = '';
            var artActs = '';
            var tact;
            var actWrap = function(tact){
                return '<action goto="'+tact+'">&lt;![CDATA['+tact+']]&gt;</action>';
            };
            
            // actons " то "            
            //      
            if ( cActLinkTo ) {
                if ( bText.match(' то ') != null) { 
                    var arr = bText.split(' то ');

                    for (var ti in arr) {
                        tact = arr[ti].match(/\d+/);
                        if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                            //$(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                            artText += actWrap(tact);
                        }
                    }
                }
            }
            
            // action " - "
            // как это печально             
            if ( cActLinkMi ) {
                if ( bText.match(' - ') != null) { 
                    var arr = bText.split(' - ');
                    
                    for (var ti in arr) {                    
                        tact = arr[ti].match(/\d+/);
                        if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                            //$(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                            artActs += actWrap(tact);
                        }
                    }
                }
            }
            
            // action " параграф "            
            if ( cActLinkPh ) {
                var expr = new RegExp(' параграф ','i');
                if ( bText.match(expr) != null) { 
                    var arr = bText.split(expr);
                    
                    for (var ti in arr) {                    
                        tact = arr[ti].match(/\d+/);
                        if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                            //$(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                            artActs += actWrap(tact);
                        }
                    }
                }
            }
           
            // actions between ( xxx )
            //
            if ( cActLinkRb ) {
                var actions = bText.match(/\((.*?)\)/g);

                for (var ti in actions) {
                    tact = actions[ti].replace('(','').replace(')','');
                    if (tact.match(/\d+/) == tact && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                        //$(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                        artActs += actWrap(tact);
                    }
                }
            }
            
            // actions Hyperlink
            if ( cActLink ) {
                $(buffer).find('.Hyperlink').each(function(){
                    tact = $(this).text();
                    if (tact.match(/\d+/) == tact && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                        //$(xml).find('article#'+tpar).append('<action goto="'+ tact +'">'+ tact +'</action>'); 
                        artActs += actWrap(tact);
                    }
                });                
            }                        

    
            $(buffer).find('p').each(function(){                
                var pText = $.trim($(this).text().replace( new RegExp(' ','g'), ' '));
                j++;
                
                if (pText != '') {
                    // accumulate paragraph blocks
                    //article += '<text>'+ pText +'</text>\n';
                    artText += '<p>'+ pText +'</p>\n';
                }
                                
                if (j == lastB) {
                    
                    artText = '<text>&lt;![CDATA['+ artText +']]&gt;</text>';
                    
                    //if ( $(xml).find('article#'+tpar).length == 0 ) {
                        // article not found, create one
                    //    $(xml).find('book').append('<article id='+tpar+'></article>');
                    //} else {
                        $(xml).find('article#'+tpar).html(artText + artActs); // push all blocks to par
                                        
                    if (typeof callback == 'function'){
                        callback();
                    }
                }
            });
        };

        
        $(res).find('p').each(function(){
            var p = $(this);
            var pText = $.trim(p.text());
            var pNum  = pText.match(/\d+/);
            var pProb = 0;            
            
            i++;
            
            if (pNum != null) {                
                // try to detect paragraph declaration
                //
                if ( cParCenter  && p.css('text-align') == 'center'               ) { pProb++; }
                if ( cParBold    && p.find('span').css('font-weight') == 'bold'   ) { pProb++; }
                if ( cParClass   && p.hasClass( $('#dlgImportDOCX #sParClass').val() )) { pProb++; }
                if ( cParAlone   && pText == pNum){ pProb++; }
            }
            
            if (pProb == pProbMax) {
                // this is paragraph declaration                    
                parseBuffer(buffer,tpar,function(){
                    tpar = pNum;
                    $(xml).find('book folder').append('<article id='+tpar+'></article>');                                        
                    $(buffer).html('');
                });
            } else {
                $(buffer).append( p ); // will move each p from res
            }            
            
            if (i == lastR) {
                // flush leftovers, and load it all
                parseBuffer(buffer,tpar,function(){
                    project.loadXML(xml);
                });
            }
        });
        
    };
    
    project.loadDOCXold2 = function(res){
//$('#data-source').html(res);return;
        var last    = $(res).find('p').length;
        var buffer  = document.createElement('div');
        var xml     = document.createElement('xml');
        var tpar    = 0;
        var tact    = null;
        var p       = null;
        var span    = null;
        var i       = 0;
        var j       = 0;
        var eob     = 0;
        
        var pProb   = 0; // paragragh probability
        var pProbMax= $('#dlgImportDOCX input.paragraph:checkbox:checked').length;
        var aProb   = 0; // action probability
        var aProbMax= $('#dlgImportDOCX input.action:checkbox:checked').length;
        
        $(xml).html( $('#new-project-template xml').html() );               
        
        // parse buffer
        //
        var parse = function(callback){
            var text = $(buffer).text();                                                    

            // try to detect actions

            // actons " то "            
            //      
            if ( $('#dlgImportDOCX #cActLinkTo:checkbox:checked') ) {
                if ( text.match(' то ') != null) { 
                    var arr = text.split(' то ');

                    for (var ti in arr) {
                        tact = arr[ti].match(/\d+/);
                        if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                            $(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                        }
                    }
                }
            }

            // action " - "
            // как это печально             
            if ( $('#dlgImportDOCX #cActLinkMi:checkbox:checked') ) {
                text = text.replace(/–/g,'-');
                if ( text.match(' - ') != null) { 
                    var arr = text.split(' - ');
                    for (var ti in arr) {                    
                        tact = arr[ti].match(/\d+/);
                        if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                            $(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                        }
                    }
                }
            }

            // action "?....xxx"
            //            
            if ( $('#dlgImportDOCX #cActLinkQm:checkbox:checked') ) {
                if ( text.match(/\?/) != null ) {
                    actions = text.split('?');
                    tact = actions[1].match(/\d+/);
                    actions = $.trim(actions[1]);
                    if (tact != null && actions.indexOf(tact) == 0 && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                        $(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                    }
                }
            }

            // actions between ( xxx )
            //
            if ( $('#dlgImportDOCX #cActLinkRb:checkbox:checked') ) {
                var actions = text.match(/\((.*?)\)/g);

                for  (var a in actions) {
                    tact = actions[a].replace('(','').replace(')','');

                    if (tact.match(/\d+/) == tact && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                        $(xml).find('article#'+tpar).append('<action goto="'+tact+'">'+ tact +'</action>');
                    }
                }
            }
            
            // actions Hyperlink
            if ( $('#dlgImportDOCX #cActLink:checkbox:checked') ) {
                $(buffer).find('.Hyperlink').each(function(){
                    tact = $(this).text();
                    if (tact.match(/\d+/) == tact && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0) {
                        $(xml).find('article#'+tpar).append('<action goto="'+ tact +'">'+ tact +'</action>'); 
                    }
                });                
            }

            eob = $(buffer).find('p').length;
            j   = 0;

            $(buffer).find('p').each(function(){
                j++;
                var pText = $(this).text();

                // push paragraph text        
                if (text != '')
                $(xml).find('article#'+tpar).append('<text>'+ text +'</text>');

                if (j == eob) {
                    
                    // flush buffer
                    $(buffer).html('');

                    //if (tp) { debug( p.text() ); return; }
                    if ( text != '')
                    if ( $(xml).find('article#'+tpar).length == 0 ) {                        
                        $(xml).find('book').append('<article id='+tpar+'></article>');    
                    }
                    
                    
                    eob = 0;
                    if (callback != undefined) {
                        callback();
                    }
                }
            });
                        
        };                
        
        
        $(res).find('p').each(function(){            
            p = $(this);
            pProb = 0;
            i++;                        
            
            if (p.text() != '') {
            
                // try to detect paragraph declaration
                //
                if ( $('#dlgImportDOCX #cParCenter:checked').length> 0 && p.css('text-align') == 'center'               ) { pProb++; }
                if ( $('#dlgImportDOCX #cParBold:checked').length  > 0 && p.find('span').css('font-weight') == 'bold'   ) { pProb++; }
                if ( $('#dlgImportDOCX #cParClass:checked').length > 0 && p.hasClass( $('#dlgImportDOCX #sParClass').val() )) { pProb++; }
                if ( $('#dlgImportDOCX #cParAlone:checked').length > 0 ){ 
                    if ( $.trim( p.text()) == $.trim( p.text().match(/\d+/)))
                        pProb++; 
                }
                
                if (pProb == pProbMax && p.text().match(/\d+/) != null){
                    // if paragraph declaration                          
                    parse(function(){
                        tpar = $.trim(p.text());
                    });                                                                             
                } else {                
                    // while not paragraph declaration, push to buffer            
                    $(buffer).append(p);
                }
            }
                        
            
            if (i == last) {                
                parse(function(){                 
                    project.loadXML(xml);
                });
            }
        });
    };
            
    project.loadPDF = function(pdf){
        var xml     = document.createElement('xml');
        var pages   = pdf.numPages;
        var parSize = $("#dlgImportPDF #sParSize").val();
        var parFont = $("#dlgImportPDF #sParFont").val();
        var tpar    = 0;
        var buffer  = '';
        var pProb   = 0;
        var pProbMax= $('#dlgImportPDF input.paragraph:checkbox:checked').length;
        
        $(xml).html( $('#new-project-template xml').html() );
        
        // read pdf page by page
        // WARNING async!
        for (var pi = 1; pi <= pages; pi++) {        
            pdf.getPage(pi).then(function(page){                
                page.getTextContent().then(function(tpage){                                        
                    // try to detect paragraph declaration
                    var line;                                        
                    
                    for (var i in tpage.items){
                        line = tpage.items[i];                       
                        pProb = 0;
                        
                        if ($('#dlgImportPDF cParSize:checked') && line.height == parSize ) { pProb++; }
                        if ($('#dlgImportPDF cParFont:checked') && line.fontName == parFont ) { pProb++; }
                        
                        if (pProb == pProbMax)
                        if ( line.str.match(/\d+/) != null && line.str.length < 6  ) {                        
                            // paragraph
                           
                            // flush buffer
                            if ($.trim(buffer) != '') {
                                
                                $(xml).find('article#'+tpar).append('<text>&lt;![CDATA['+buffer+']]&gt;</text>');
                                buffer = '';
                            }
                            
                            // create new article
                            tpar = line.str.match(/\d+/);
                            $(xml).find('book folder[id="autofolder"]').append('<article id="'+tpar+'"></article>');
                                                        
                        } else {                            
                            buffer += line.str;
                        }
                        
                        
                        //if ($.trim(tpage.)
                    }      
                    
                    // flush remaining buffer
                    $(xml).find('article#'+tpar).append('<text>&lt;![CDATA['+buffer+']]&gt;</text>');
                    buffer = '';
                            
                            
                    if (page.pageIndex+1 == pages) {
                        project.loadXML(xml);
                    }
                });
            });
        }
        
        
    };        
    
    project.loadTXT = function(){ debug('project.loadTXT()');  
        var xml         = document.createElement('xml');
        var tpar        = 0;
        var buffer      = [];        
        var actions     = [];
        var actText     = '';     
        var pProb       = 0;
        var aProb       = 0;
        var pProbMax    = $('#dlgImportTXT input.paragraph:checkbox:checked').length;
        var aProbMax    = $('#dlgImportTXT input.action:checkbox:checked').length;        
        var cParTags    = $('#dlgImportTXT #cParTags:checked').length > 0 ? true : false;        
        var cActTags    = $('#dlgImportTXT #cActTags:checked').length > 0 ? true : false;
        var cActTagsCut = $('#dlgImportTXT #cActTagsCut:checked').length >0 ? true : false; 
        var cParUnsort  = $('#dlgImportTXT #cParUnsort:checked').length > 0 ? true : false;
        var iParLeft    = $('#dlgImportTXT #iParLeft').val();
        var iActLeft    = $('#dlgImportTXT #iActLeft').val();
        var iParRight   = $('#dlgImportTXT #iParRight').val();        
        var iActRight   = $('#dlgImportTXT #iActRight').val();   
        var res         = $('#data-source')
                                .html()
                                .replace( new RegExp('&lt;','g'), '<' )
                                .replace( new RegExp('&gt;','g'), '>' )
                                .split('\n');

        // replace special symbols
        iParLeft  = iParLeft                        
                        //.replace( new RegExp('<','g'), '&lt;' )
                        //.replace( new RegExp('>','g'), '&gt;' )
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	');
        iActLeft  = iActLeft
                        //.replace( new RegExp('<','g'), '&lt;' )
                        //.replace( new RegExp('>','g'), '&gt;' )
                        .replace( /\[/g, '\\[')
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	');
        iParRight = iParRight                        
                        //.replace( new RegExp('<','g'), '&lt;' )
                        //.replace( new RegExp('>','g'), '&gt;' )                        
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	')
        iActRight = iActRight                        
                        //.replace( new RegExp('<','g'), '&lt;' )
                        //.replace( new RegExp('>','g'), '&gt;' )
                        .replace( /\]/g, '\\]')
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	');                
        
        $('#dlgImportTXT #pnlActOptions .action:checkbox:checked').each(function(){
            actions.push( $(this).next().html() );            
        });

        $(xml).html( $('#new-project-template xml').html() );                        
        
        for (var i in res) { // each data-source line
            var self = res[i];
            var line = $.trim(self);
            var num  = line.match(/\d+/);         
            var tact;
            var tbuffer;
                        
            if (line == '') {                
                buffer.push('');
                continue;
            }           
            
            if (cParTags && num != null) {
                
                if ( self.indexOf(iParLeft) == 0 ) {
                    if ( self.indexOf(iParRight) == self.indexOf(iParLeft) + iParLeft.length + num.toString().length ) {
                        pProb++;                        
                    }
                }i
            }
                        
            
            // load                       
            if ( (cParTags && pProb == pProbMax) || (!cParTags && num == parseInt(tpar)+1 && num == line) || (cParUnsort && num == line) ) {
                pProb  = 0;
                //buffer = $.trim(buffer);
                
                // flush buffer
                if (buffer != []) {
                    var jbuffer = buffer.join('\n').replace(/\s+$/g,'').replace(/\[/g, '{').replace(/\]/g, '}');                    
                    
                    // autoactions
                    if (!cActTags)
                    for (var ta in actions) {                                                                                                
                        
                        // actions should be slashed
                        // [ ]
                        tbuffer = exprSafe(jbuffer);                                                
                        
                        /*
                        debug('->', 
                        exprSafe(actions[ta]),
                        tbuffer.match( exprSafe(actions[ta]) ) );continue;
                        */
                        
                        if (tbuffer.match( exprSafe( actions[ta]) ) != null){                            
                            var arr = jbuffer.split( actions[ta] );                                                                                    
                            
                            for (var ti in arr) {
                                if (ti > 0) {
                                    tact = arr[ti].match(/\d+/);

                                    if (ti > 0 && arr[ti].indexOf(tact) == 0 && tact != null && $(xml).find('article#'+tpar+' action[goto="'+tact+'"]').length == 0){
                                       actText += '<action goto="'+tact+'">&lt;![CDATA['+ tact +']]&gt;</action>\n';                                   
                                    }
                                }
                                
                                if (ti == arr.length-1) { // last
                                    
                                    // remove action marker from text
                                    if (cActTagsCut) {                                                        
                                        var tact = actions[ta].trimLeft();
                                        jbuffer = jbuffer
                                                .replace( new RegExp(tact,  'g'), '' );                                                                                                                         
                                    }
                                }
                            }
                        }
                    }                                        
                    
                    // tagged actions
                    if (cActTags) {                                                
                        var arr = jbuffer.split( iActLeft );
                        for (var ti in arr){
                            if (ti == 0) continue;
                                                                                 
                            tact = arr[ti].match(/\d+/);
                            
                            if ( arr[ti].indexOf(iActRight) == tact.toString().length ) {
                                // this is action!
                                actText += '<action goto="'+tact[0]+'">&lt;![CDATA['+ tact[0] +']]&gt;</action>\n';
                            }
                            
                            // remove action marker from text
                            if (cActTagsCut) {
                                
                                console.log('===='+iActLeft);
                                jbuffer = jbuffer
                                    .replace( new RegExp(iActLeft,  'g'), '' )
                                    .replace( new RegExp(iActRight, 'g'), '' );
                            }
                        }
                    }                                                            
                    
                    $(xml).find('article#'+tpar).append('<text id="'+getRandomName('text')+'" lang="'+lang.detect(jbuffer)+'">&lt;![CDATA['+jbuffer+']]&gt;</text>\n'+actText);
                    buffer  = [];
                    tbuffer = '';
                    actText = '';
                }
                
                // create new article
                if (cParUnsort) {
                    tpar = num;
                } else {
                    tpar++;
                }
                $(xml).find('book folder').append('<article id="'+tpar+'"></article>');                
            } else {
                buffer.push( self );
            }                        
        };
        
        // flush last buffer
        jbuffer = buffer.join('\n').replace(/\s+$/g,'');
        $(xml).find('article#'+tpar).append('<text>&lt;![CDATA['+jbuffer+']]&gt;</text>');                        
        
        project.loadXML(xml);
    };
    
    /**
     * Load default format
     * All importing formats are converted to XML and then loaded with this fn
     * @param {type} res
     * @param {type} callback
     * @returns {undefined}
     */
    project.loadXML = function(res, callback) { debug('project.LoadXML(...)');                

        var book = $(res).find('book');
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
            var bookName = $(book).attr('title') || 'Безымянный';                        

            $('#btnNewParagraph').prop('disabled',false);
            $('#btnSaveAll').prop('disabled',false);
            $('#btnSaveDoc').prop('disabled',false);
            $('#btnAddText').prop('disabled', true);
            $('#btnAddAction').prop('disabled', true);
            $('#btnAddScript').prop('disabled', true);
            $('#btnAddHandler').prop('disabled', true);
            $('#btnDebug').prop('disabled', false);
            $('title').html( bookName + ( (cfg.readonly) ? ' [READ ONLY] ' : '') + ' - Каптал ' + $('.version').html() );

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
                                if (more.pos != 'i' && more.ref.type != 'paragraph') {
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
                        if (node[0].type != 'paragraph') {
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
                    
                    paragraph       : {
                        icon : "img/16/icon-page.png",
                        valid_children : []
                    },
                    handlers        : { icon: "img/16/folder_error.png" },
                    handler         : { icon: "img/16/icon-handler.png" },
                    components      : { icon: "img/16/folder_brick.png" },
                    component       : { icon: "img/16/brick.png" }
                }
            }).on("changed.jstree", function (e, data) {
                
                if ( data.action == 'select_node' && (data.node.type == 'paragraph' || data.node.type == 'handler') ) {  
                    
                    $('#dlgLoading').show();
                    var id = $('#'+data.node.id+' a').html().replace(/<i(.|\n)*?\/i>/,'').trim();                    
                    paragraph.open(id);
                    
                } else {
                    /*
                    $('#btnAddText').prop('disabled', true);
                    $('#btnAddAction').prop('disabled', true);
                    $('#btnAddScript').prop('disabled', true);
                    */
                }

            }).on("create_node.jstree",function(e, data){
                /*
                if (!(data.node.text == 'New node' && data.node.type == 'paragraph')) return;

                // generate new node name
                // @TODO: FIXME
                var tree = $('#toc').jstree(true);                
                var html = $('#data-source article').sort(function(a,b){ 
                    var x = a.id.match(/\d+/g);
                    var y = b.id.match(/\d+/g);
                    return parseInt(x) > parseInt(y); 
                }); // get last name by value not position
                var n    = $(html).last().attr('id').match(/\d+/g);
                var str  = $(html).last().attr('id').replace(n,'');
                                
                n = (n == null) ? str + 1 : str + (parseInt(n) +1);

                tree.set_text(data.node, n);
                tree.set_id(data.node, 'toc_'+n);
                $('#data-source book handlers').before('<article id="'+n+'"><text id="'+getRandomName('text')+'"></text></article>');

                // Rename group to match first\last paragraph name
                //

                var text = tree.get_node( data.parent).text.split('..');

                // if first node in group
                if (data.position == 0) {
                    // rename group
                    var text = tree.get_node( data.parent).text.split('..');
                    text[0] = data.node.text;
                }

                text[1] = data.node.text;
                tree.set_text( data.parent, text.join('..') );
                */
            }).on("rename_node.jstree",function(e, data){       
                var tree = data.instance;
                var parent = tree.get_node( data.node.parent );

                if (data.node.id == 'toc-book') {
                    
                    project.rename( data.text );

                } else if (data.old == data.text) {
                    // same name, nothing changed, do nothing
                    
                } else if (data.node.type == 'paragraph'){
                    // rename paragraph
                    if ( $('#data-source article#'+data.text).length == 0 ) {
                        $('#data-source article#'+data.old).attr('id',data.text);

                        // update id of toc node
                        //tree.set_id(data.node, 'toc_'+data.text);
                        tree.set_id(data.node, data.text);

                        // rename tab if paragraph is already opened
                        //
                        var tabOld = 'tab-'+data.old;
                        var tabNew = 'tab-'+data.text;

                        if ($('#'+tabOld).length > 0) {
                            // tab exists
                            
                            // update captal-paragraph
                            $('#desk [captal-paragraph="'+data.old+'"').attr('captal-paragraph', data.text);
                            
                            $('#'+tabOld).attr('id', tabNew);
                            $('#tabs li[aria-controls="'+tabOld+'"]').attr('aria-controls', tabNew);
                            $('a[href="#'+tabOld+'"')
                                .html( '<img src="img/16/icon-page.png"> \n\
                                        '+data.text+' \n\
                                        <img onclick="paragraph.close(this)" src="img/16/close.png">' )
                                .attr('href', '#'+tabNew);                        
                        }
                        
                        if (parent.type == 'autofolder') {
                            if ( parent.children[0] == data.node.id ) {
                                // first in group, update group name
                                var text = parent.text.split('..');
                                text[0] = data.text;
                                tree.set_text( data.node.parent, text.join('..') );
                            }
                            if ( parent.children[ parent.children.length -1 ] == data.node.id ) {
                                // last in group, update group name
                                var text = parent.text.split('..');
                                text[1] = data.text;
                                tree.set_text( data.node.parent, text.join('..') );
                            }
                        }
                        
                        // update paragraph.id
                        paragraph.id = data.text;
                        
                    } else if ( $('#data-source article#'+data.text).length > 0 ) {
                        // node with that name already exits
                        tree.set_text(data.node, data.old);
                        //tree.set_id(data.node, 'toc_'+data.old);
                        tree.edit(data.node);
                        alert('Такое имя уже есть');
                    }
                } else if (data.node.type.indexOf('folder') == 0) {
                    // rename folder in data-source
                    $('#data-source folder#'+data.node.id).attr('name',data.node.text);
                    // reselect node
                    tree.select_node( data.node.id  , true);
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
                var loadArticles = function() { 
                    debug('load articles()');
                   
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
                                var tarticle = $(this);
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
                                    text    : tarticle.attr('id'),
                                    type    : 'paragraph'
                                }, 'last', function(node){
                                    //debug(node);
                                    
                                    if ($('#data-source action[goto="'+node.id+'"]').length == 0) {
                                        //orphan
                                        tree.set_icon(node.id, "img/16/icon-page-red.png" );
                                    } else if ($('#data-source article#'+node.id+' action[goto]').length == 0) {
                                        // deadend
                                        tree.set_icon(node.id, "img/16/icon-page-yellow.png" );
                                    } else {
                                        // normal
                                        tree.set_icon(node.id, "img/16/icon-page.png" );
                                    }                                    
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
                                    var tarticle = $(this);
                                        tree.create_node( parent.id, {
                                            id      : tarticle.attr('id'),
                                            text    : tarticle.attr('id'),
                                            type    : 'paragraph'
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
                    
                    $('#dlgLoading').hide();
                    
                    log('Проект загружен');
                    
                    // open first paragraph
                    paragraph.open( $('#data-source article:first').attr('id') );
                    
                    if (typeof callback == 'function'){
                        callback();
                    }
                };

                // push book data to #data-source
                $('#data-source').html(book);

                // book root
                tree.set_text('toc-book', bookName);                
                tree.set_icon('toc-book', 'img/16/book_open.png');
                tree.set_type('toc-book', 'root');

                // add 'untitled' attribute to book in data-source
                if (bookName == 'Безымянный') {
                    
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
                
                // if no options section, create it
                if ($('#data-source options').length == 0){
                    
                    $('#data-source book').append('<options>\
                        <set id="lineBreak">'+ cfg.lineBreak +'</set>\
                        <set id="autoTranslate">'+ cfg.autoTranslate +'</set>\
                    </options>');
                    
                } else {
                    
                    cfg.lineBreak     = $('#data-source options #lineBreak').text()     == "1" ? true : false;
                    cfg.autoTranslate = $('#data-source options #autoTranslate').text() == "1" ? true : false;
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
            //debug('node',data.node.id,'changed folder from',oldParent,'to',newParent);
                    
                    
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
                }
                //debug( data );                
            });
        }
    };  
    
    project.moderApprove = function(){
        if( project.gameID != null ) {
            repo.game.approve( project.gameID, function(res){
                if (res.result == 'ok') {
                    log('Игра была утверждена');
                }
            });
        } else {
            error('Игра не из облака');
        }
    };
    
    project.moderBan = function(){
        if( project.gameID != null ) {
            repo.game.ban( project.gameID, function(res){
                if (res.result == 'ok') {
                    log('Игра была отклонена');
                }
            });
        } else {
            error('Игра не из облака');
        }
    };
    
    project.moderReject = function(){
        if( project.gameID != null ) {
            repo.game.reject( project.gameID, function(res){
                if (res.result == 'ok') {
                    log('Игра была отправлена на доработку');
                }
            });
        } else {
            error('Игра не из облака')
        }
    };
    
    project.new = function(opt){
        
        // check if some project already opened
        if ( $('#data-source').html() != '' )  {
            if (!confirm('Все несохраненные изменения будут потеряны. Продолжить все равно?')) {
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

        $('#btnNewParagraph').prop('disabled', false);
        $('#btnSaveAll').prop('disabled', false);
        $('#btnSaveDoc').prop('disabled', false);
        $('#btnAddText').prop('disabled', true);
        $('#btnAddAction').prop('disabled', true);
        $('#btnAddScript').prop('disabled', true);
        $('#btnAddHandler').prop('disabled', true);
        $('#btnPageUp').prop('disabled',true);
        $('#btnPageDn').prop('disabled', true);
        $('#btnDebug').prop('disabled', false);        
        
        if (opt == 'wizard') {
            
            project.import();
        }
    };

    project.open = function(){
        $('#openProject')
            .attr('accept','.xml')
            .trigger('click');
    };     
    
    project.options = function(opt){
        
        var buttons = {};
        var title   = 'Настройки проекта';
        
        if (opt == 'apply') {
            
            cfg.lineBreak     = $('#dlgOptions #cLineBreak:checked').length > 0 ? true : false ;
            cfg.autoTranslate = $('#dlgOptions #cAutoTranslate:checked').length > 0 ? true : false ;
            project.rename( $('#dlgOptions #projName').val() );                        
            
            $('#new-project-template set#lineBreak').html(cfg.lineBreak === true ? 1 : 0);
        }
        
        if ($('#dlgOptions').hasClass('ui-dialog-content')){
            
                $('#dlgOptions').dialog( "open" );                
                
            } else {                
                
                if (opt == 'wizard' || $('#data-source').html().length == 0) {
                    
                    title = 'Мастер создания проекта';
                    
                    buttons['Далее >>'] = function(){                                                                                                            
                            
                        // update settings
                        project.options('apply');
                        
                        // import
                        project.new('wizard');

                        $( this ).dialog( "destroy" );                                                                                                                                
                    };
                    
                    buttons['Готово'] = function(){                                                                                                            
                            
                        // update settings
                        project.options('apply');
                        
                        project.new();

                        $( this ).dialog( "destroy" );                                                                                                                                
                    };
                    
                } else {
                    
                    buttons['Сохранить'] = function(){                                                                                                            
                            
                        // update settings
                        project.options('apply');
                        
                        $( this ).dialog( "destroy" );                                                                                                                                
                    };
                }
                
                buttons['Отмена'] = function() {     
                            
                    $( this ).dialog( "destroy" );                            
                };                
                
                $('#dlgOptions').dialog({
                    modal       : true,
                    sizeable    : false,
                    width       : 500,
                    height      : 600,
                    buttons     : buttons,
                    title       : title,
                    open: function( event, ui ) {
                        
                        // update gui according to settings
                        $('#dlgOptions #cLineBreak').prop('checked', cfg.lineBreak);
                        $('#dlgOptions #cAutoTranslate').prop('checked', cfg.autoTranslate);
                    }
                });
                
                $('#dlgOptions #projName').select();
            }        
    };
    
    project.preloadDOCXalt = function(doc){ debug('project.preloadDOCX()');
        var i = 0;
        var last = $(doc).find('p').length;
        var classes = [];
        var centered = false;
        var bold    = false;
        var linked  = false;
        var acts    = [];
        var nums    = [];
        var bText   = '';
                
        // rollback import options
        $('#dlgImportDOCX .pnlBlock.paragraph div').remove();
        $('#dlgImportDOCX .pnlBlock.paragraph').append('<div><input id="cParAlone"  id="checkbox" class="paragraph"> На всю строку</div>');        
        
        $('#dlgImportDOCX .pnlBlock.action div').remove();                       
        
        $(doc).find('p').each(function(){
            var p = $(this);
            var tclass = p.attr('class');
            var lastS = $(p).find('span').length;
            
            i++;
             
            // classes
            if ( tclass != undefined && tclass != '' && classes.indexOf(tclass) < 0) {
                if (classes.length == 0) {
                    $('#dlgImportDOCX .pnlBlock.paragraph').append('<input id="cParClass"  id="checkbox" class="paragraph"> Стиль: <select id="sParClass"><option value="'+tclass+'">'+tclass+'</option></select>');
                } else {
                    $('#dlgImportDOCX #sParClass').append('<option value="'+tclass+'">'+tclass+'</option>');
                }
                classes.push(tclass);                                
            };
            
            // centered
            if (!centered) {
                if ( p.css('text-align') == 'center' ) {
                    centered = true;
                    $('#dlgImportDOCX .pnlBlock.paragraph').append('<div><input id="cParCenter" id="checkbox" class="paragraph"> По центру</div>');
                }
            };                         
            
            $(p).find('span').each(function(){
                var span = $(this);

                // bold
                if (!bold) {
                    if ( span.css('font-weight') == 'bold' ) {
                        bold = true;
                        $('#dlgImportDOCX .pnlBlock.paragraph').append('<div><input id="cParBold"   id="checkbox" class="paragraph"> Полужирный</div>');
                    }
                };
                
                // link
                if (!linked) {
                    if ( span.hasClass('Hyperlink') ) {
                        linked = true;
                        $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLink"   id="checkbox" class="action"> Гиперссылка</div>');
                    }
                };  
                                
               
                              
            });
            
            if (i == last ) {                
                /*
                if (act_to == 10) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkTo"   id="checkbox" class="action"> Действия: то xxx </div>'); }                
                if (act_mi == 10) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkMi"   id="checkbox" class="action"> Действия: - xxx </div>'); }                
                if (act_rb == 10) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkRb"   id="checkbox" class="action"> Действия: (xxx) </div>'); }
                if (act_qm == 10) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkQM"   id="checkbox" class="action"> Действия: ?...xxx </div>'); }
                */
               
                $('#dlgLoading').hide();                

                if ($('#dlgImportDOCX').hasClass('ui-dialog-content')){
                     $('#dlgImportDOCX').dialog( "open" );
                } else {
                    $('#dlgImportDOCX').dialog({
                        modal       : true,
                        sizeable    : false,
                        width       : 700,
                        height      : 520,
                        buttons: {
                            Импорт: function(){                            
                                $( this ).dialog( "close" );
                                $('#dlgLoading').show();

                                project.loadDOCX( doc );                                            
                            },
                            Отмена: function() {                            
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                }
            }            
        });
                
    };
    
    project.preloadDOCXnew = function(doc){ debug('project.preloadDOCX()');
        //res = res.replace(/–/g,'-');        
        $(doc).find('.jf-page').html( $(doc).find('.jf-page').html().replace( new RegExp(' ','g'), ' ') );
        
        var last    = $(doc).find('p').length;
        var i       = 0;       
        var tpar    = 0;
        var buffer  = '';
        var acts    = [];
        var sums    = [];
        
        $(doc).find('p').each(function(){
            var self = $(this);
            var line = $.trim(self.text());
            var num  = line.match(/\d+/);            
            i++;
            
            if (line != ''){            
                if (num == parseInt(tpar)+1 && num == line){
                    
                    if (buffer != ''){                    
                        // actions: universal
                        //
                        var numArr = buffer.match(/\d+/g);
                        var left = '', right = '', caret = 0;

                        for (var tn in numArr){
                            caret = buffer.indexOf( numArr[tn], caret ); // move caret           
                            left  = buffer.substring(0, caret);            

                            var leftArr = left.split(' ');

                            if (left[ left.length-1 ] == ' ') {                             
                                left = ' '+ leftArr[ leftArr.length-2 ] +' ';
                            } else {
                                left = ' '+ leftArr[ leftArr.length-1 ];
                            }

                            var  acti = acts.indexOf( left );

                            if ( acti == -1 ) {
                                acts.push(left);
                                sums.push(1);                            
                            } else {
                                sums[acti]++;
                            }
                        }
                    }
                    
                    tpar++;
                    buffer = '';
                } else {
                    buffer += line;
                }
            }
            
            if (i == last){
                
                for (var tn in acts){
                    if (sums[tn] > 9)
                    $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkU'+tn+'"   id="checkbox" class="action"><b>'+acts[tn]+'</b> xxx (<i>'+sums[tn]+' раз</i>)</div>');
                }
                
                $('#dlgLoading').hide();
                
                if ($('#dlgImportDOCX').hasClass('ui-dialog-content')){
                     $('#dlgImportDOCX').dialog( "open" );
                } else {
                    $('#dlgImportDOCX').dialog({
                        modal       : true,
                        sizeable    : false,
                        width       : 700,
                        height      : 520,
                        buttons: {
                            Импорт: function(){                            
                                $( this ).dialog( "close" );
                                $('#dlgLoading').show();

                                project.loadDOCX( doc );                                            
                            },
                            Отмена: function() {                            
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                }
            }
        });
    };
    
    project.preloadDOCX = function(doc){ debug('project.preloadDOCX()');        
        var i = 0;
        var last = $(doc).find('p').length;
        var classes = [];
        var centered = false;
        var bold    = false;
        var linked  = false;
        var act_to  = 0;
        var act_mi  = 0;
        var act_rb  = 0;
        var act_qm  = 0;
        var act_ph  = 0;                
                
        // rollback import options
        $('#dlgImportDOCX .pnlBlock.paragraph div').remove();
        $('#dlgImportDOCX .pnlBlock.paragraph').append('<div><input id="cParAlone"  id="checkbox" class="paragraph"> На всю строку</div>');                
        $('#dlgImportDOCX .pnlBlock.action div').remove();                       

        $(doc).find('p').each(function(){
            var p = $(this);
            var tclass = p.attr('class');
            var lastS = $(p).find('span').length;
            
            i++;
             
            // classes
            if ( tclass != undefined && tclass != '' && classes.indexOf(tclass) < 0) {
                if (classes.length == 0) {
                    $('#dlgImportDOCX .pnlBlock.paragraph').append('<input id="cParClass"  id="checkbox" class="paragraph"> Стиль: <select id="sParClass"><option value="'+tclass+'">'+tclass+'</option></select>');
                } else {
                    $('#dlgImportDOCX #sParClass').append('<option value="'+tclass+'">'+tclass+'</option>');
                }
                classes.push(tclass);                                
            };
            
            // centered
            if (!centered) {
                if ( p.css('text-align') == 'center' ) {
                    centered = true;
                    $('#dlgImportDOCX .pnlBlock.paragraph').append('<div><input id="cParCenter" id="checkbox" class="paragraph"> По центру</div>');
                    $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActCenter" id="checkbox" class="action"> По центру</div>');
                }
            };                         
            
            $(p).find('span').each(function(){
                var span = $(this);

                // bold
                if (!bold) {
                    if ( span.css('font-weight') == 'bold' ) {
                        bold = true;
                        $('#dlgImportDOCX .pnlBlock.paragraph').append('<div><input id="cParBold"   id="checkbox" class="paragraph"> Полужирный</div>');
                        $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActBold"   id="checkbox" class="action"> Полужирный</div>');
                    }
                };
                
                // link
                if (!linked) {
                    if ( span.hasClass('Hyperlink') ) {
                        linked = true;
                        $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLink"   id="checkbox" class="action"> Гиперссылка</div>');
                    }
                };  
                                
                
                // actions: то
                //if (act_to < 10) {
                    if (span.text().match(' то ') != null) { act_to += span.text().match(' то ').length;  }                
                //}
                
                // actions: -
                //if (act_mi < 10) {
                    span.text( span.text().replace(/–/g,'-') );
                    if (span.text().match(' - ')  != null ) { 
                        act_mi += span.text().match(' - ').length; 
                    }
                //}
                
                // actions: (xxx)
                //if (act_rb < 10) {
                    if (span.text().match(/\((.*?)\)/g) != null) { act_rb += span.text().match(/\((.*?)\)/g).length;  }
                //}
                
                // action: ?...xxx
                //if (act_qm < 10) {
                    if (span.text().match(/\?/) != null) { act_qm += span.text().match(/\?/).length; }
                //}                                   
                    
                // actions: paragraph xxx    
                //if (act_ph < 10) {
                    var expr = new RegExp('параграф','i');
                    //span.text( span.text().replace(' ',' ') );
                    if (span.text().match(expr) != null) { act_ph += span.text().match(expr).length;  }                
                //}
                
            });
            
            if (i == last ) {                
                
                if (act_to > 5) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkTo"   id="checkbox" class="action"><b>то</b> xxx (<i>'+act_to+' раз</i>)</div>'); }                
                if (act_mi > 5) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkMi"   id="checkbox" class="action"><b>-</b> xxx (<i>'+act_mi+' раз</i>)</div>'); }                
                if (act_rb > 5) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkRb"   id="checkbox" class="action"><b>(</b>xxx<b>)</b> (<i>'+act_rb+' раз</i>)</div>'); }
                if (act_qm > 5) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkQM"   id="checkbox" class="action"><b>?...</b>xxx (<i>'+act_qm+' раз</i>)</div>'); }
                if (act_ph > 5) { $('#dlgImportDOCX .pnlBlock.action').append('<div><input id="cActLinkPh"   id="checkbox" class="action"><b>параграф</b> xxx (<i>'+act_ph+' раз</i>)</div>'); }
                            
                            
                $('#dlgLoading').hide();                        

                if ($('#dlgImportDOCX').hasClass('ui-dialog-content')){
                     $('#dlgImportDOCX').dialog( "open" );
                } else {
                    $('#dlgImportDOCX').dialog({
                        modal       : true,
                        sizeable    : false,
                        width       : 700,
                        height      : 520,
                        buttons: {
                            Импорт: function(){                                                                                                            
                                project.loadDOCX( doc );                                
                                $( this ).dialog( "close" );                                                                                                                                
                            },
                            Отмена: function() {                            
                                $( this ).dialog( "close" );
                            }
                        }
                    });
                }
            }            
        });
                
    };
    
    project.preloadPDF = function(pdf){ debug('project.preloadPDF()');
        var pages = pdf.numPages;
        var sizes = [];
        var fonts = [];
        
        for (var pi = 1; pi <= pages; pi++) {        
            pdf.getPage(pi).then(function(page){                      
                page.getTextContent().then(function(tpage){                                        
                    // try to detect paragraph declaration
                    var line;
                    var buffer = '';                    
                    var tpar = 0;
                    
//debug(page.pageIndex,tpage);
                    for (var i in tpage.items){
                        line = tpage.items[i];
                        
                        if ( line.str.match(/\d+/) != null )  {
                            // collect font sizes
                            if (sizes.indexOf(line.height) < 0) {
                                sizes.push(line.height);
                                $('#dlgImportPDF #sParSize').append('<option value="'+line.height+'"> '+line.height+': '+line.str+'</option>');
                            }
                            // collect font names
                            if (fonts.indexOf(line.fontName) < 0) {
                                fonts.push(line.fontName);
                                $('#dlgImportPDF #sParFont').append('<option value="'+line.fontName+'"> '+line.fontName+': '+line.str+'</option>');
                            }
                        }                                                                  
                    }                                                                        

                    
                    if (page.pageIndex+1 == pages) {
                        
                        $('#dlgLoading').hide();
                        
                        $('#dlgImportPDF').dialog({
                            modal       : true,
                            vjsizeable    : false,
                            width       : 700,
                            height      : 520,
                            buttons: {
                                Импорт: function(){
                                    $( this ).dialog( "destroy" );
                                    $('#dlgLoading').show();
                                    project.loadPDF(pdf);
                                },
                                Отмена: function() {
                                    $( this ).dialog( "destroy" );
                                }
                            }
                        });
                        
                    }
                });
            });
        }                        
    };
    
    project.preloadTXT = function(raw){ debug('project.preloadTXT()');                             
        var tpar        = 0;
        var parcount    = 0;
        var buffer      = [];
        var res         = [];
        var acts        = [];
        var sums        = [];     
        var pProb       = 0;
        var pProbMax    = $('#dlgImportTXT input.paragraph:checkbox:checked').length;
        var cParTags    = $('#dlgImportTXT #cParTags:checked').length > 0   ? true : false;
        var cActTags    = $('#dlgImportTXT #cActTags:checked').length > 0   ? true : false;
        var cActTagsCut = $('#dlgImportTXT #cActTagsCut:checked').length >0 ? true : false;        
        var cParUnsort  = $('#dlgImportTXT #cParUnsort:checked').length > 0 ? true : false;
        var iParLeft    = $('#dlgImportTXT #iParLeft').val();
        var iActLeft    = $('#dlgImportTXT #iActLeft').val();
        var iParRight   = $('#dlgImportTXT #iParRight').val();        
        var iActRight   = $('#dlgImportTXT #iActRight').val();        
        
        // replace special symbols
        iParLeft  = exprSafe(iParLeft
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	'));
        iActLeft  = exprSafe(iActLeft
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	'));
        iParRight = exprSafe(iParRight
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	'));        
        iActRight = exprSafe(iActRight
                        .replace( /\\t/g, '	' )
                        .replace( new RegExp('→','g'), '	'));
        
        // encoding
        //
        // try to detect file encoding
        if (raw.indexOf('�') != -1) {
            // wrong encoding
            debug('WRONG ENCODING!');
            $('#dlgImportTXT #decodeResult')
                .html('<img src="img/16/error.png"> Неверная кодировка!');                       
        } else {            
            $('#dlgImportTXT #decodeResult')
                .html('<img src="img/16/check.png"> OK');
        }
       
        res = raw
                .replace(/–/g,'-')
                .replace(/\[/g, '{')
                .replace(/\]/g, '}');
        //res = res.replace( new RegExp(' ','g'), '  ');
        //res = res.replace( new RegExp(' ','g'), ' '); 
        res = res.split('\n');                    

        // rollback import options
        $('#dlgImportTXT #pnlActOptions').html(''); 
        $('#dlgImportTXT #parCount').html(0);
        $('#dlgImportTXT #lang')
            .prop('src','img/16/flag_undefined.png')
            .prop('title', 'undefined language');

        for (var i in res) {
            
            var self = exprSafe(res[i]);
            var line = $.trim(self);
            var num  = line.match(/\d+/);                                             

            if (line == '') {
                buffer.push('');
                continue;
            }   
            
            if (cParTags && num != null) {               
                if ( self.indexOf(iParLeft) == 0 ) {                    

                    if ( self.indexOf(iParRight) == self.indexOf(iParLeft) + iParLeft.length + num.toString().length-1 ) {
                        pProb++;
                    }
                }
            }                        
            
            if ( (cParTags && pProb == pProbMax) || (!cParTags && num == parseInt(tpar)+1 && num == line) || (cParUnsort && num == line) ) {
                pProb  = 0;
                
                // parse buffer
                if (buffer.length > 0) {                    
                    // actions: universal
                    //
                    var jbuffer = buffer
                                    .join('')                                    
                                    .replace(/\s+$/g,'')
                                    .replace(/\[/g, '{')
                                    .replace(/\]/g, '}'); 
                    var numArr = jbuffer.match(/\d+/g);
                    var left = '', right = '', caret = 0;

                    for (var tn in numArr){                        
                        caret = jbuffer.indexOf( numArr[tn], caret ); // move caret           
                        left  = jbuffer.substring(0, caret);            

                        var leftArr = left.split(' ');

                        if (left[ left.length-1 ] == ' ') {                             
                            left = ' '+ leftArr[ leftArr.length-2 ] +' ';
                        } else {
                            left = ' '+ leftArr[ leftArr.length-1 ];
                        }

                        left = left
                                .replace(new RegExp('<p>','g'),'')
                                .replace(new RegExp('</p>','g'),'')

                        var  acti = acts.indexOf( left );
                        
                        if ( acti == -1 ) {
                            acts.push( left );
                            sums.push(1);                            
                        } else {
                            sums[acti]++;
                        }
                    }
                    
                    if (cActTagsCut) {
                        jbuffer = jbuffer
                                    .replace( new RegExp(iActLeft,  'g'), '' )
                                    .replace( new RegExp(iActRight, 'g'), '' );
                    }
                }
                
                // update preview
                if (tpar == 2) {
                    $('#dlgImportTXT #pnlPreview').html('<b>'+(num-1)+'</b><br>'+                            
                        jbuffer
                        .replace( new RegExp(' ','g'), '<span class="entity">_</span>&#8203;')
                        .replace( /\t/g, '<span class="entity">&#8594;</span>'));
                
                    // detect language
                    lang.detect(jbuffer,function(res){                        
                        var tlang = (res[0].count == 0) ? ('undefined') : res[0].name;
                        
                        //debug('language', tlang);
                            
                        $('#dlgImportTXT #lang')
                            .prop('src','img/16/flag_'+ tlang +'.png')
                            .prop('title', tlang +' language');
                    });
                }
                
                if (cParUnsort) {
                    tpar = num;
                } else {
                    tpar++;
                } 
                parcount++;
                $('#dlgImportTXT #parCount').html(parcount);
                buffer = [];
            } else {
                buffer.push('<p>'+ self +'</p>');
            }                        
        };
        
        if (tpar == 0) {
            buffer = buffer.slice(0,100);
            $('#dlgImportTXT #pnlPreview').html('<p>'+
                    buffer
                    .join('')
                    .replace( new RegExp(' ','g'), '<span class="entity">_</span>&#8203;')
                    .replace( /\t/g, '<span class="entity">&#8594;</span>')+                    
                    '</p>');
            
            // detect language
            lang.detect(buffer.join(''), function(res){
                //debug('language',res[0].name)
                $('#dlgImportTXT #lang')
                    .prop('src','img/16/flag_'+ res[0].name +'.png')
                    .prop('title', res[0].name+' language');
            });
        }
                
        // we will ignore last buffer
               
        for (var tn in acts) {  
            // treshold is 2
            if (sums[tn] > 2) { 
                $('#dlgImportTXT #pnlActOptions').append('<div class="action-div"><input id="cActLinkU'+tn+'"   id="checkbox" class="action"><b>'+acts[tn]+'</b> xxx (<i>'+sums[tn]+'</i> раз)</div>');
            }
        }      
        
        // sort options by their frequency
        var actOptions = $('#dlgImportTXT #pnlActOptions div.action-div');
        
        actOptions.sort(function(a,b){
            var an = parseInt( $(a).find('i').html() );
            var bn = parseInt( $(b).find('i').html() );
            
            if (an > bn) {
                return -1;
            } else if ('an < bn') {
                return 1;
            } else {
                return 0;
            }
        });
        
        actOptions.detach().appendTo( $("#dlgImportTXT #pnlActOptions") );
        
        // convert encoding
        /*
        if (project.encoding != 'utf8') {
            debug('FILE NEEDS TO BE CONVETRED TO UTF-8');                        
        }*/
        
        $('#dlgLoading').hide();        
        
        // have to temorary store data there
        $('#data-source').html( raw );

        if ($('#dlgImportTXT').hasClass('ui-dialog-content')){                              
             $('#dlgImportTXT').dialog( "open" );
        } else {                        
            $('#dlgImportTXT').dialog({
                modal       : true,
                sizeable    : false,
                width       : 1000,
                height      : 700,
                buttons: {
                    Импорт: function(){
                        $( this ).dialog( "destroy" );
                        $('#dlgLoading').show();                        
                        project.loadTXT();
                    },
                    Отмена: function() {
                        $( this ).dialog( "destroy" );
                    }
                }
            });
        }        
    };
    
    project.read = function(e){ log('Загружаю файл');
        
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
                    
                    span.innerHTML = [ e.target.result.replace( new RegExp('<!','g'), '&lt;!' ).replace( new RegExp(']]>','g'), ']]&gt;' ) ];
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
                alert('Unsupported Format');
            }
        }
    };        
    
    project.rename = function(newName){
        
        if ($('#data-source').html().length != 0) {
            
            if (typeof newName !== 'undefined') { 
                
                // update toc
                $('#toc').jstree(true).set_text( 'toc-book', newName );                
                // rename book
                $('#data-source book').attr('title', newName);
                // update window header
                $('title').html( newName + ' - Каптал ' + $('.version').html() );
                // update project options
                $('#dlgOptions #projName').val(newName);
                
            } else {
                $('#toc').jstree(true).edit('toc-book');
            }
            
        } else {
            error('Проект не загружен.')
        }                
    };
    
    project.run = function(){
        
        if ($('#data-source').html().length > 0) {
            
            $('xml book').html('');
            jsIQ.init('whatever');        

            $('#dlgDebug').dialog({
                modal       : true,
                sizeable    : false,
                width       : 800,
                height      : 520,
                buttons: [{
                    text: 'Перенос строки',
                    icons: {
                        primary: "ui-icon-arrowstop-1-s"
                    },                    
                    click: function(){                                                
                        $('#dlgDebug #main_text').toggleClass('linebreak');
                    }
                },{
                    text: 'Ок',
                    click: function() {
                        
                        // @TODO: Destroy Atril events here
                        
                        $( this ).dialog( "close" );
                    }
                }],
                create: function(){
                    
                    if (cfg.lineBreak) {
                        
                        $('#dlgDebug #main_text').addClass('linebreak');
                    }
                }
            });
        } else {
            error('Проект не загружен');
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
            error('Проект не загружен');
        } 
    };
    
    project.saveRepo = function(){
        if (project.gameID != null) {
            repo.game.update( project.gameID, function(res){
                if (res.result == 'ok') {
                    log('Игра сохранена')
                }
            });
        } else {
            error('Игра не найдена в облаке');
        }
    };
    
    project.wizard = function(){
        
        project.options('wizard');
    }
    
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
            $('#dlgRepo').dialog('destroy');
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
                error('Не могу открыть игру из облака');
            }
        })
        .error(function(){
            error('Не могу открыть игру из облака!');
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
                error('Не могу открыть облако');
            }                                     
        })
        .error(function(){
            if (typeof callback === 'function'){
                callback(false);
            }
            error('Не могу открыть облако!');
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
            type: 'POST',
            url: (cfg.debug) ? cfg.localURL.update + gameID : cfg.remoteURL.update + gameID,
            dataType: 'json',
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
                error('Не могу сохранить игру в облаке');
            }
        })
        .error(function(res){
            error('Не могу сохранить игру в облаке!');
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
            error('Не могу открыть облако!');
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
                    open        : function(){                                                                             

                        for (var i in res.data.list) {

                            //console.log( res.data.list[i] )                                                      
                            var o = res.data.list[i];
                            repo.component.data[ o.index_name ] = o;

                            $('#dlgRepoComp #list')
                                .append( '<div id="'+ o.index_name +'" class="component" onclick=repo.component.select("'+o.index_name+'")><img src="img/16/brick.png"> '+ o.fullname +'</div>');
                        }   
                        
                        $('#dlgRepoComp #btnEditComp').bind('click',function(res){
                            
                            var id = $('#dlgRepoComp #list .selected').attr('id');
                            
                            repo.component.get(id);
                        });
                        
                        $('#dlgRepoComp #btnAddComp').bind('click',function(res){
                            
                            var index_name = $('#dlgRepoComp #list .selected').attr('id');
                            
                            project.addComponent( repo.component.data[ index_name ] );
                        });
                    },
                    close: function() {
                        $('#dlgRepoComp #info').hide();
                        $( this ).dialog( "destroy" );
                    },
                    buttons: {
                        Закрыть: function() {
                            // clean
                            $('#dlgRepoComp #info').hide();
                            $( this ).dialog( "destroy" );
                        }
                    }
                });
            } else {
                if (typeof callback === 'function'){
                    callback(false);
                }
                error('Не могу открыть облако');
            }
        })
        .error(function( res ){
            if (typeof callback === 'function'){
                callback(false);
            }
            error('Не могу открыть облако!');
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
            buttons: {
              Ок: function() {
                $( this ).dialog( "close" );
              }
            }
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
                            var type = $('#dlgFolder img.selected').attr('type');

                            tree.set_type(node.id, type );
                            $('#data-source folder#'+node.id).attr('type', type);

                            $( this ).dialog( "close" );
                        }
                    }
                });  
            } else {
                error('Иконка может быть изменена только у пользовательского каталога');
            }
        } else {
            error('Проект не загружен');
        }
    };

    /**
     *
     */
    gui.cleanDesk = function(){
        
        if ( $('#desk').hasClass('ui-tabs') ) {
            //block.store();
            
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
        
        var paragraphsMenu = {
            createItem: {
                label: 'Создать',
                submenu: {
                    createFolder: {
                        label: "Новый каталог",
                        icon: "img/16/folder_add.png",
                        action: function(){
                            gui.createFolder();
                        }
                    },
                    createParagraph: {
                        label: "Новый параграф",
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
                        label: "Новый параграф",
                        icon: "img/16/derivatives.png",
                        action: function() {
                            $('#btnNewParagraph').trigger('click');
                        }
                    }
                }
            },
            changeIcon: {
                label: "Сменить иконку",
                action: gui.changeFolderIcon
            },
            rename:{
                label: 'Переименовать',
                action: gui.renameFolder
            }
        };
        
        var paragraphMenu = {
            createItem: {
                label: 'Создать',
                submenu: {
                    createText:{
                        label: "Блок текста",
                        icon: "img/16/script_globe.png",
                        action: function() {
                            block.create('text');
                        }
                    },
                    createAction:{
                        label: "Блок действия",
                        icon: "img/16/script_lightning.png",
                        action: function() {
                            block.create('action');
                        }
                    },
                    createScript:{
                        label: "Блок скрипта",
                        icon: "img/16/script_gear.png",
                        action: function(){
                            block.create('script');
                        }
                    }
                }
            },
            renameItem: { // The "rename" menu item
                separator_before: false,
                separator_after: false,
                label: "Переименовать",
                action: function () {
                    tree.edit(node);
                }
            },
            moveItem: {
                label: 'Переместить',
                submenu: {
                    moveUp: {
                        label: 'Поднять выше',
                        icon: 'img/16/page-up-icon.png',
                        action: function() {
                            paragraph.move('up');
                        }
                    },
                    moveDown: {
                        label: 'Опустить ниже',
                        icon: 'img/16/page-down-icon.png',
                        action: function(){
                            paragraph.move('down');
                        }
                    }
                }
            },
            deleteItem: {
                separator_before: false,
                separator_after: false,
                label: "Удалить",
                action: paragraph.delete
            }            
        };

        var handlerMenu = {
            createItem: {
                label: 'Создать',
                submenu: {
                    createText:{
                        label: "Новый обработчик",
                        icon: "img/16/timeline.png",
                        action: function(){
                            block.create('handler'); 
                        }
                    }
                }
            }
        };                
        
        var componentsMenu = {
            addItem: {
                label   : 'Добавить',
                action  : repo.component.list
            }
        };
        
        var componentMenu = {
            removeItem : {
                label: 'Убрать',
                action: function(){
                    var node = tree.get_selected()[0];
                    $('#data-source component#'+node).remove();
                    
                    tree.delete_node(node);
                }
            }
        };

        if (node.type == 'root') {
            // project root
            delete paragraphMenu.deleteItem;
            return paragraphMenu;
        } else if ( node.type == 'paragraphs') {
            // paragraph root
            return paragraphsMenu;
        } else if ( node.type == 'paragraph' ) {
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
        var tree = $('#nav').jstree(true);
        var items = {            
            renameItem: { // rename block
                separator_before: false,
                separator_after: false,
                label: 'Переименовать',
                action: function(){
                    tree.edit(node);
                }
            },
            deleteItem: { // delete block
                label: 'Удалить',
                action: block.delete
            }
        };
        
        return items;
    };
    
    gui.createFlow = function() { debug('gui.createFlow()');
        var nodes = [];
        var links = [];
        var indxs = [];
        var tnode;
        var last = $('#data-source article').length;
        var i = 0;
        var j = 0;
        var flowWidth = 4;

        var graph = new joint.dia.Graph;

        var paper = new joint.dia.Paper({
            el: $('#dlgFlow #flow'),
            width: 900,
            height: 2000,
            model: graph,
            gridSize: 1
        });

        $('#data-source article').each(function(){
            var article = $(this);
            var tid = $(this).attr('id');
            var tX  = Math.round(i/flowWidth);
            i++;
            j = (j > flowWidth) ? j = 1 : j + 1;

            tnode = new joint.shapes.basic.Rect({
                position: { x: j * 60 , y: (tX * 20) + (i*20) },               
                size: {width: 1, height: 1 },
                attrs: { rect: {fill: 'lightyellow'}, text: {text: tid, fill: 'black'} }
            });
            nodes.push( tnode );            
            indxs.push( tid );                                    

            if (i == last){              
                
                $('#data-source action[goto]').each(function(){                    
                    var source = $(this).parent().attr('id');
                    var sourceID = nodes[ indxs.indexOf(source) ].id;
                    var target = $(this).attr('goto');
                    var targetID = nodes[ indxs.indexOf(target) ].id;
                    var tlink = new joint.dia.Link({
                        source: { id: sourceID },
                        target: { id: targetID }
                    });

                    links.push( tlink );
                });

                graph.addCells( nodes );                                                                
                graph.addCells( links );
            }
        });
        
        if ($('#dlgFlow').hasClass('ui-dialog-content')){
            $('#dlgFlow').dialog( "open" );
        } else {
            $('#dlgFlow').dialog({
                modal       : true,
                sizeable    : false,
                width       : 700,
                height      : 520,
                buttons: {                    
                    Закрыть: function() {                            
                        $( this ).dialog( "close" );
                    }
                }
            });
        }
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
                $('#data-source folder:last').before('<folder id="'+node.id+'" name="'+node.text+'" id="folder_yellow"></folder>');
            });
        } else {
            error('Проект не загружен');
        }
    };    
    
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
        //$(host).append( $('#toolbar-template').html() );        

        $('#toolbar input#logicTRUE').autocomplete({            
            source: gui.scriptAutocomplete,
            select: function(e){
                // at this very moment value in field is old, wait a bit
                window.setTimeout(function(){                
                    block.store( block.id );
                }, 200);
            }
        });
        $('#toolbar input#logicFALSE').autocomplete({            
            source: gui.scriptAutocomplete,
            select: function(e){
                // at this very moment value in field is old, wait a bit
                window.setTimeout(function(){                
                    block.store( block.id );
                }, 200);
            }
        });
        $('#toolbar input#logicDO').autocomplete({            
            source: gui.scriptAutocomplete,
            select: function(e){
                // at this very moment value in field is old, wait a bit
                window.setTimeout(function(){                
                    block.store( block.id );
                }, 200);
            }
        });

        $('#toolbar input').keydown(function(e){
            // at this very moment value in field is old, wait a bit
            window.setTimeout(function(){                
                block.store( block.id );
            }, 200);
        });
        
        // focus on corresponding script block
        $('#toolbar #logicTRUEicon').click(function(e){
            debug('logcTRUEicon.click()');
            
            var fn = $('#toolbar #logicTRUE').val();
            if ( fn != '' ) {
                fn = fn.split('?')[0];
                
                // search in current paragraph
                if ($('#desk article#'+paragraph.id+' script[captal-name="'+ fn +'"]').length != 0) {
                    
                    block.show(fn);
                    
                } else {
                    
                    // search in whole project
                    if ($('#data-source script[id="'+ fn +'"]').length != 0) {
                        // found, get paragraph
                        var parID = $('#data-source script[id="'+ fn +'"]').parent().attr('id');
  
                        paragraph.open(parID, function(e){
                            // focus script
                            block.show(fn);
                        });
                    }
                }
            }
        });
                
        $('#toolbar #logicGOicon').click(function(e){
            var parID = $('#toolbar #logicGO').val();
            if ( parID != '' ) {
                paragraph.open( parID );
            }
        });
        
        // global
        $('#toolbar #logicGLOBAL').change(function(e){            

            $('#'+block.id).attr('captal-isglobal', $(this).is(':checked'));
                                    
            // at this very moment value in field is old, wait a bit
            window.setTimeout(function(){                
                block.store( block.id );
            }, 200);
            
        });
    }; 
    
    /** 
     * fix editor top position according to tabs and fields height 
     */
    gui.fixTabs = function(){
        var pos =  ( $('#toolbar').position().top + parseInt($('#toolbar').css('height').replace('px','')) + 2 );         
        $('#desk .ui-tabs-panel.ui-widget-content').css('top', pos);
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
                buttons: {
                  Ок: function() {
                    $( this ).dialog( "close" );
                  }
                }
            }).scroll(function(e,ui){                
                $('#dlgHelp .toc').css('top', $('#dlgHelp').scrollTop() + 10 );
            });
        }
    };
    
    gui.maximize = function(){ debug('gui.maximize()');                    
        
        $('#desk').toggleClass('maximized');
        $('#table-of-contents').toggleClass('maximized');
        $('#navigator').toggleClass('maximized');
        
        if (cfg.maximized) {                        
           
            $('#btnMaximize img').attr('src', 'img/32/arrow_expand.png');
            cfg.maximized = false;
            
        } else {
                    
            $('#btnMaximize img').attr('src', 'img/32/arrow_collapse.png');
            cfg.maximized = true;
        }
        
      
    };
    
    gui.tocUpdate = function(parent){ debug('gui.tocUpdate('+parent+')');
        var tree = $('#toc').jstree(true);
        var node = (parent != undefined) ? tree.get_node(parent) : tree.get_node( tree.get_node(paragraph.id).parent );
        var text = [0,0];
        text[0] = node.children[0]; // first
        text[1] = node.children[ node.children.length-1 ]; // last
        tree.set_text( node, text.join('..') );
    };  
    
    gui.toggleControls = function(e){
        
        $(e).next().toggle();
    };
    
    gui.renameFolder = function(){
        var tree = $('#toc').jstree(true);
        
        if (typeof tree.get_node === 'function') {
        
            var node = tree.get_node( tree.get_selected()[0]);

            if (node.type.indexOf('folder') != -1) {
                tree.edit(node.id);
            }
        } else {
            error('Проект не загружен');
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
    
    gui.welcome = function(){                
        
        $('#dlgWelcome').dialog({
            modal       : true,
            sizeable    : false,
            width       : 800,
            height      : 600,
            buttons: {
              Ок: function() {
                $( this ).dialog( "close" );
              }
            }
        });
        $('#dlgWelcome').tabs();
    };        

    ////////////////////////////////////////////////////////////////////////////
    //                          CONTROLS & EVENTS
    ////////////////////////////////////////////////////////////////////////////
    $('#btnSaveAll').click(project.save);

    $('#btnSaveDoc').click(project.export);

    $('#btnOpenProject').click(project.open);

    $('#dlgImportTXT #sEncoding').change(function(e){
        project.encoding = $(this).val();
        project.importTXT(project.imported, project.encoding);
    });

    /**
     * Begins new paragraph creation
     * Determine target, then call paragraph.create({...})
     */
    $('#btnNewParagraph').click(paragraph.new);    

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

    $('#btnFlow').click(gui.createFlow);

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

    $('#btnSearch').click(function(){
        var editor = ace.edit( block.id );
        editor.execCommand("find");
    });

    $('#btnSearchReplace').click(function(){
        //var id = $('#desk .ui-tabs-active a').attr('href').replace('#','');
        var editor = ace.edit( block.id );
        editor.execCommand("replace");
    });

    $('#btnShowInvisibles').click(block.showInvisibles);

    $('#btnUseWrapMode').click(function(){
        $('.ace_editor').each(function(){
            var editor = ace.edit( $(this).attr('id') );

            if ( editor.getSession().getUseWrapMode() )  {
                editor.getSession().setUseWrapMode(false);
            } else {
                editor.getSession().setUseWrapMode(true);
            }
        });
    });

    $('#btnRaiseBlock').click(function(){
        block.move('up');
    });

    $('#btnDownBlock').click(function(){
        block.move('down');
    });

    $('#btnInjectParagraph').click(function(){

    });
    
    $('#btnTranslate').click(block.translate);
    
    $('#btnMaximize').click(gui.maximize);

    /**
     * Topmost Menubar
     */           
    
    menu = {
        items: {
            mnuProject : {
                label: 'Проект',
                submenu: {
                    mnuProjectNew: {
                        label   : 'Новый проект',
                        icon    : 'img/32/report_add.png',
                        action  : project.wizard
                    },
                    mnuProjectOpen: {
                        label   :'Открыть',                        
                        icon    : 'img/32/folder_blue.png',
                        hotkey  : 'Alt+O',
                        action  : project.open
                    },
                    mnuProjectRename: {
                        label   :'Переименовать',
                        icon    : 'img/32/report_edit.png',
                        action  : project.rename
                    },
                    mnuProjectSave: {
                        label   : 'Сохранить в файл',
                        icon    : 'img/32/report_save.png',
                        hotkey  : 'Alt+S',
                        action  : project.save                        
                    },
                    _1: 'separator',
                    mnuProjectImportFile: {
                        label   :'Импортировать',
                        icon    : 'img/32/education.png',
                        action  : project.import
                    },
                    mnuProjectExportFile: {
                        label   : 'Экспортировать',
                        icon    : 'img/32/report_word.png',
						action  : project.export
                    },
                    _2: 'separator',                    
                    mnuProjectRepo: {
                        label	: 'Облако книг-игр',
                        icon	: 'img/32/network_cloud.png',
                        submenu	: {
                            mnuProjectRepoLoad: {
                                label   : 'Загрузить',
                                icon    : 'img/32/download_cloud.png',
                                action  : project.importRepo
                            },
                            mnuProjectRepoSave: {
                                label   : 'Сохранить',
                                icon    : 'img/32/save_cloud.png',
                                action  : project.saveRepo
                            },
                            mnuProjectRepoPublish: {
                                label   : 'Опубликовать',
                                icon    : 'img/32/upload_for_cloud.png',
                                action  : project.exportRepo
                            },
                            _1: 'separator',
                            mnuProjectRepoModerApprove: {
                                label   : 'Одобрить',
                                icon    : 'img/32/thumb_up.png',
                                group   : 'repoModer',
                                action  : project.moderApprove
                            },
                            mnuProjectRepoModerReject: {
                                label   : 'Отклонить',
                                icon    : 'img/32/thumb_down.png',
                                group   : 'repoModer',
                                action  : project.moderReject
                            },
                            mnuProjectRepoModerBan: {
                                label   : 'Запретить',
                                icon    : 'img/32/hand_stop.png',
                                group   : 'repoModer',
                                action  : project.moderBan
                            }
                        }
                    },
                    _3: 'separator',
                    mnuProjectOptions: {
                        label   : 'Настройки',
                        icon    : 'img/32/book_gear.png',
                        action  : project.options
                    },
                    mnuProjectRun: {
                        label:'Запустить',
                        icon: 'img/32/run.png',
                        action: project.run
                    }
                }
            },
            mnuParagraph: {
                label: 'Параграф',
                submenu: {
                    mnuParagraphNew: {
                        label: 'Создать',
                        icon: 'img/32/page_add.png',
                        hotkey: 'Alt+N', // N = 78
                        action: paragraph.new                        
                    },                    
                    mnuParagraphRename: {
                        label   : 'Переименовать',
                        hotkey  : 'F2',
                        icon    : 'img/32/page_edit.png',
                        action  : paragraph.rename
                    },
                    mnuParagraphCopy: {
                        label: 'Скопировать',
                        icon: 'img/32/page_copy.png',
                    },
                    mnuParagraphPaste: {
                        label: 'Вставить',
                        icon: 'img/32/page_paste.png'
                    },
                    mnuParagraphClose: {
                        label: 'Закрыть',
                        icon: 'img/32/page_red.png',
                        submenu: {
                            mnuParagraphCloseThis: {
                                label: 'Закрыть текущий',
                                action: function(){
                                    paragraph.close();
                                }
                            },
                            mnuParagraphCloseOther: {
                                label: 'Закрыть другие',
                                action: function(){
                                    paragraph.close('other');
                                }
                            },
                            mnuParagraphCloseAll: {
                                label: 'Закрыть все',
                                action: function(){
                                    paragraph.close('all');
                                }
                            }
                        }
                    },
                    mnuParagraphDelete: {
                        label   : 'Удалить',
                        icon    : 'img/32/page_delete.png',
                        action  : paragraph.delete
                    },
                    _1: 'separator',
                    mnuParagraphRaise: {
                        label   : 'Поднять',
                        icon    : 'img/32/move_up.png',
                        action  : function(){
                            paragraph.move('up');
                        }
                    },
                    mnuParagraphLower: {
                        label   : 'Опустить',
                        icon    : 'img/32/move_down.png',
                        action  : function(){
                            paragraph.move('down');
                        }
                    },
                    mnuParagraphJump: {
                        label   : 'Перейти',
                        icon    : 'img/32/page_go.png',
                        hotkey  : 'Alt+G',
                        action  : paragraph.go
                    },
                    mnuParagraphShuffle : {
                        label   : 'Перемешать параграфы',
                        icon    : 'img/32/shuffle.png',
                        action  : paragraph.shuffle
                    },
                    mnuParagraphRun:{
                        label: 'Запустить',
                        icon: 'img/32/debugging.png',
                    },                    
                }
            },
            mnuBlock: {
                label: 'Блок',
                submenu: {                                             
                    mnuBlockAdd: {
                        label:'Создать',
                        icon: 'img/32/script_add.png',
                        submenu: {
                            mnuBlockAddText: {
                                label   : 'Добавить текст',
                                icon    : 'img/32/script_globe.png',
                                action  : function(){ block.create('text'); }
                            },
                            mnuBlockAddAction: {
                                label   : 'Добавить действие',
                                icon    : 'img/32/script_lightning.png',
                                action  : function(){ block.create('action'); }
                            },
                            mnuBlockAddScript: {
                                label   : 'Добавить скрипт',
                                icon    : 'img/32/script_gear.png',
                                action  : function(){ block.create('script'); }
                            },
                            mnuBlockAddHandler: {
                                label   : 'Добавить обработчик',
                                icon    : 'img/32/script_error.png',
                                action  : function(){ block.create('handler'); }
                            }
                        }
                    },
                    mnuBlockRename: {
                        label   : 'Переименовать',
                        icon    : 'img/32/script_edit.png',
                        //hotkey  : 'Ctrl+F2',
                        action  : block.rename
                    },
                    mnuBlockCopy: {
                        label   : 'Копировать',
                        icon    : 'img/32/bug_report.png'
                    },
                    mnuBlockPaste: {
                        label   : 'Вставить',
                        icon    : 'img/32/paste_plain.png'
                    },
                    mnuBlockDelete: {
                        label   : 'Удалить',
                        icon    : 'img/32/script_delete.png',
                        action  : block.delete
                    },
                    _0: 'separator',
                    mnuBlockRaise: {
                        label   : 'Поднять',
                        icon    : 'img/32/arrow_up.png',
                        action  : function(){ block.move('up'); }
                    },
                    mnuBlockLower: {
                        label   : 'Опустить',
                        icon    : 'img/32/arrow_down.png',
                        action  : function(){ block.move('down'); }
                    },                     
                    _1: 'separator',
                    mnuBlockLeft: {
                        label   : 'Отступ влево',
                        icon    : 'img/32/text_indent_remove.png',
                        action  : block.outdent
                    },
                    mnuBlockRight: {
                        label   : 'Отступ вправо',
                        icon    : 'img/32/text_indent.png',
                        action  : block.indent
                    },
                    mnuBlockSpecial: {
                        label   : 'Включить спецсимволы',
                        icon    : 'img/32/pilcrow.png',
                        action  : block.showInvisibles
                    },
                    mnuBlockTranslate:{
                        label: 'Автоперевод',
                        icon: 'img/32/change_language.png',
                        hotkey: 'Alt+T',
                        action: block.translate
                    }
                }
            },
            mnuFolder: {
                label: 'Каталог',
                submenu: {
                    mnuFolderNew:{
                        label   : 'Создать каталог',
                        icon    : 'img/32/folder_add.png',
                        action  : gui.createFolder
                    },
                    mnuFolderRename:{
                        label   : 'Переименовать',
                        icon    : 'img/32/folder_edit.png',
                        action  : gui.renameFolder
                    },
                    mnuFolderIcon:{
                        label   : 'Сменить иконку',
                        icon    : 'img/32/folder_palette.png',          
                        action  : gui.changeFolderIcon
                    },
                    mnuFolderDelete: {
                        label: 'Удалить',
                        icon: 'img/32/folder_delete.png',
                    } ,
                    _1: 'separator',
                    mnuFolderLanguage: {
                        label: 'Индикация языка',
                        icon: 'img/32/flag_rus.png',
                    },
                    mnuFolderLinks: {
                        label: 'Идникация связности',
                        icon: 'img/32/icon-page-yellow.png', 
                    }
                    
                }
            },
            mnuTools: {
                label: 'Инструменты',
                submenu: {
                    mnuToolsSearch : {
                        label   : 'Поиск',
                        icon    : 'img/32/find.png',
                    },
                    mnuToolsReplace : {
                        label   : 'Поиск с заменой',
                        icon    : 'img/32/text_replace.png'
                    },                    
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
                    /*
                    mnuToolsFullscreen: {
                        label   :  'Полноэкранный режим',
                        
                        action  : gui.fullscreen
                    },*/
                    mnuToolsGraph: {
                        label   : 'Дерево параграфов',
                        icon    : 'img/32/chart_organisation.png'
                    },                    
                    mnuToolsStats : {
                        label   : 'Статистика',
                        icon    : 'img/32/chart.png'
                    }
                }
            },
            mnuHelp: {
                label: 'Справка',                
                submenu: {
                    mnuHelpWelcome: {
                        label   : 'Добро пожаловать!',
                        icon    : 'img/32/hand.png',
                        action  : gui.welcome
                    },
                    mnuHelpContent: {
                        label   : 'Содержание',    
                        icon    : 'img/32/manual_icon.png',
                        action  : gui.help
                    },
                    mnuHelpForum: {
                        label: 'Форум обсуждения',     
                        icon: 'img/32/user_comment.png',
                        action: function(){                     
                            window.open('http://quest-book.ru/forum/post/82441');
                        }
                    },
                    _1: 'separator',
                    mnuHelpAbout: {
                        label   : 'О программе',    
                        icon    : 'img/32/Button-White-Help-icon.png',
                        action  : gui.about                        
                    }
                }
            }
        }
    };        
    
    $('#menubar').menubar(menu);    
    $('#menubar .repoModer').hide();
    //$('#menubar #mnuProjectRepo').hide();
    
    
    $('#mnuAutolink').menu({
        select: function(e, ui){
            var link = gui.autolinkMenuTarget;
            
            if (link != null) {
                block.store( block.create({
                    tag     : 'action',
                    body    : link,                    
                    logicGO : link
                }) ); 
                
                block.removeLinks();
            } else {
                // no link targeted
            }
        }
    });
    
    // CTRL & block autolinks  
    keys.down[17] = function(){ block.addLinks(); };
    keys.up[17]   = function(){ block.removeLinks(); };
    $(window).resize(function(){ 
        gui.fixTabs();        
        block.removeLinks();
    });
                            
    document.getElementById('openProject').addEventListener('change', project.read, false);    
    
    window.onerror = error;
    
    $(window).on('beforeunload', function(e) {
        return 'Несохраненные данные будут потеряны, покинуть страницу?';
    });
    
    ////////////////////////////////////////////////////////////////////////////
    //                                  STARTUP
    ////////////////////////////////////////////////////////////////////////////
    
    // overwrite jsIQ function
    jsIQ.loadBook = function(url, callback, onerror){
        var self = this;
        self.msg('jsIQ.loadBook: ', 3);                        
        
        var data = '<?xml version="1.0" encoding="UTF-8"?>'+$('#data-source').html().replace( new RegExp('&lt;!','g'), '<!').replace( new RegExp(']]&gt;','g'), ']]>');        
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
                    if (!raw || raw == '')		{
                                    return;
                    }

                    $(document.body).prepend('<style id="atril-style-'+name+'">'+raw+'</style>');
                });
                
                if (typeof callback == 'function'){
                    callback();
                }

            });
    };
    
    $('#dlgLoading #progress').progressbar({
        value: false
    });
    
    $('title').html('Каптал ' + $('.version').html() );
    
    log('Готов к работе');
    
    cfg.requestURL = window.location.href.split('/');
    if ( cfg.requestURL.indexOf('#game') > 0 ) {
        repo.game.get( cfg.requestURL[ cfg.requestURL.indexOf('#game') + 1 ] );
    }
    
    if (cfg.showWelcome) { gui.welcome(); }
});
