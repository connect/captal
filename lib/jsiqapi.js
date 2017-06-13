/////////////////////////////////////////////////////////////
//
//  jsIQ: common
//

function isValid(v)	{
	if (v == undefined || v===null)	{
		return false;
	}
	return true;
}

function makeUnclickable(elem){
	$(elem).unbind('click')
		.removeAttr('onclick href do go')
		.addClass('unclickable')
		.click(function() {return false;});
}

function str_apost(str, k)	{
	if (k)	{
		return '"' + str + '"';
	}
	return "'" + str + "'";
}

function jsiq_obj2attr(obj)
{
	if (typeof(obj) != 'object')	{
		return '';
	}
	var res = '';
	for (var i in obj)	{
		if (typeof obj[i] === 'object')		{
			res += ' ' + i + '= {' + arguments.callee(obj[i]) + '}';
		}
		else
			res += ' ' + i + '="' + obj[i] + '"';
	}
	return $.trim(res);
}

// случ число от min до max
function rnd(min, max)
{
	return Math.round(Math.random()*(max-min))+min;
}

// кинуть count кубиков с dice гранями, каждому кубику добавить mod1, а сумме - mod2
// если передать массив (res) то ф-ия вернћт список со всеми выпавшими значениями
function customDice(dice, count, mod1, mod2, res) 
{
	// значения по умолчанию
	if (!res || res === undefined)
	{
		res = new Array();
	}
	if (!dice || dice === undefined)
	{
		dice = 6;
	}
	if (count == undefined)
	{
		count = 1;
	}
	if (!mod1 || mod1 === undefined)
	{
		mod1 = 0;
	}
	if (!mod2 || mod2 === undefined)
	{
		mod2 = 0;
	}

	var total=0;
	//res.clear();
	for(var i=0; i < count; i++)
	{
		var tt=rnd(1,dice)+Number(mod1);
		total+=tt;
		res.push(tt);
	}
	total += mod2;

	return total;
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
	     for (var i = (start || 0), j = this.length; i < j; i++) {
	         if (this[i] === obj) { return i; }
	     }
	     return -1;
	};
};


/*function xmlToString(xmlData) {

    var xmlString = undefined;
    
    if (!xmlData){
    	return xmlString;
    }
    
    //xmlData = xmlData[0].firstChild;

    if (window.ActiveXObject){
        xmlString = xmlData[0].xml;
    }

    if (xmlString === undefined)
    {
        var oSerializer = new XMLSerializer();
        xmlString = '';
        xmlData = xmlData[0];
        for (var n = 0; n < xmlData.childNodes.length; n++){        	
        	xmlString += oSerializer.serializeToString(xmlData.childNodes[n]);
        }
    }

    return xmlString;
}*/

function Args2Arr(args){
	return Array.prototype.slice.call(args,0);
}

var decodeHtml = (function(){
    var txt = document.createElement("textarea");
    return function decodeHtml(html){
        txt.innerHTML = html;
        return txt.value;
    }
})();

function getNodeContentUnHtml(node){
    return decodeHtml($(node[0].firstChild).text());
}/***//////////////////////////////////////////////////////////////
//
//  jsIQ: core
//

var jsIQ = new (function jsIQ(){
	this.v = '2.1.1';
	this.ready = false;
	this.article_state = null;
	//this.book = null;
	this.containers = {
		text: null,
		actions: null,
		title: null,
		charsheet: null
	};
	this.cfg = {};
	this.getCfg = function(name, def)	{
		var res = this.cfg[name];
		if (res == undefined)	return def;
		return res;
	};
	this.current_article = null;
	this.sound = null;
	this.log_level = 3;
	this.log_to = 'console';		// 'console' or FUNCTION

	this.event_handlers = {};
	this.scripts = {}; // global book scripts

    var self = this;

	// console
	setTimeout(function(){
		$(document.body).append('<div id="console" style="position:fixed;top:0;left:0;width:97%;height:50%;border:1px solid yellow;background:#444444;overflow:auto;display:none;padding:10px;z-index:10000;color:white">������� Atril v'+self.v+'<br></div>');
		$(document).bind('keydown', function (evt){
            if ((evt.which === 96 || evt.which === 192) && evt.ctrlKey) {	$('#console').stop(true).slideToggle();	} return true; } );
	}, 30);

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Process management
	//
	var processList = [];
	this.addProcess = function(process){
		//if (processList.length > 16)
		//	return false;
		processList.push(process);
		return true;
	};
	this.removeProcess = function(process){
		var p = processList.indexOf(process);
		if (p > -1){
			processList.splice(p, 1);
		} else
			jsIQ.msg('jsIQ.removeProcess: process not found', 2);
	};
	this.getProcessList = function(){
		return processList;
	};

	//  END: Process management
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	this.msg = function(msg, level)	{ // level: 1 - critical error, 2 - error, 3 - notice
		if (!isValid(level)) {
			level = 3;
		}
		var now = (new Date());
		now = now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds() + '.' + now.getMilliseconds();
		if (level <= this.log_level)
		{
			if (this.log_to == 'console')	{
				$('#console').append((['[?]', '[!!!]','[!]','[ ]'])[level] + ' ' + now + ' ' + msg + '<br>');
			}
			else{
				this.log_to(now, msg, level);
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	//  Article management
	//
	var book = $();
	this.addArticle = function( article ) {
		var csCntr = this.containers.charsheet;
		function parseCharsheet(nodes){
				if (!csCntr || !nodes.length)	{
					return;
				}
				var html = '';
				nodes.find('text').each(function(){
					html +=	getNodeContentUnHtml($(this));
				});
				csCntr.html( html );
		}
		if (book == null || book.length === 0)		{
			// init book
			book = $('book', article);
			var charsheets = book.find('#charsheet').remove();
			parseCharsheet(charsheets);
			if (book.length === 0)	{
				self.triggerError(true,'jsIQ.addArticle','book element not found', {
					data: article
				});
			}                        
			return;
		}
		//book = book.append( $('article', article) );
		$('article', article).each(function(){
			var a = this;
			var id = $(this).attr('id');
			if (id == 'charsheet')	{
				parseCharsheet(article);
				return;
			}
			if ($('article#' + id, book).length === 0){
				book.append( a );
			}
		});
	};

	this.unloadArticle = function( article ) {
		if (book == null || book.length === 0)		{
			return false;
		}
		var r = book.find('article#' + article).detach();
		return (r > 0);
	};

	this.getArticle = function( id ) {
            
		if (!book)	{
			self.triggerError(true,'jsIQ.getArticle','book not created', {
				id: id
			});
			return $();
		}
		return book.find('article#' + id + ':eq(0)');	// hack to show first element only
	};

	// debug only
	/*this.getBook = function (){
		return book;
	}*/

    //  END: Article management
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	var self = this;

	/// PRIVATE!
	//var globals = {};
	var globals = {};
	this.reCreateGlobals = function() {
		globals = {};
	};
	//this.globs = globals; // debug

	this.setGlobals = function(glob){
		globals = glob;
	};

	function getGlobs() {
		return globals;
	}

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Script Environment Class (hided)
    //
    function ScriptEnv(name,params,parent,process){
        this.name = name;
        this.parent = parent;
        this.vars = getGlobs;
        this.created = new Date();
        this.process = process ? process : (parent ? (parent.process ? parent.process : null) : null);
        this.params = params ? params : (parent ? (parent.params ? parent.params : {}) : null);
        this.from = parent ? (parent.from ? parent.from : undefined) : undefined;
        return this;
    }

    /**
     * Fill ENV params from arrays
     * @param names
     * @param values
     */
    ScriptEnv.prototype.fillParams = function(names, values){
        this.params = {};
        for (var i = 0; i < names.length; i++){
            this.params[names[i]] = values[i];
        }
    }

    ScriptEnv.prototype.getTrace = function(res){
        var doreturn = false;
        if (!res){
            res = [];
            doreturn = true;
        }
        var params = jsiq_obj2attr(this.params);
        res.push(this.name + ': ' + (this.process ? ('@' + this.process + ', ') : '') + 'params: ' + (params != '' ? params : 'n/a'));
        if (this.parent){
            this.parent.getTrace(res);
        }

        if (doreturn)
            return res.join('\n');

        return undefined;
    }

    // externally visible factory function
    this.createEnv = function(name,params,parent,process){
		return new ScriptEnv(name,params,parent,process);
	};

    //  END: Script Environment Class
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //  Script management and execution
    //
	this.runGlobal = function(script, env){
		if (typeof (script) !== 'function')		{
			this.triggerError(false, 'jsIQ.runGlobal', 'script not a function', {script: script, env: env}); // sync
			return null;
		}
        if (!env){
            env = this.createEnv('jsIQ.runGlobal');
        }
		//var args = [env];
		//for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
		try{
			return script.apply(self, [env]);
		}
		catch (e){
			this.triggerError(false, 'jsIQ.runGlobal', 'script run error', {message: e.message, script: script, exception: e, env: env});
		}
		return null;
	};


	this.addScript = function(name, script) {
		if ( this.scripts[name] && !script ){
			delete this.scripts[name];
			return;
		}
		if ( $.trim(name) === '') return;
		if ( typeof script != 'function') {
			this.triggerError(false, 'jsIQ.addScript', 'not a script passed', {});
			return;
		}

		var self = this;

		this.scripts[name] = (function globalscript() { // executed in jsIQ scope
			var a = self.current_article;
			if (!a) return;
			return a.runLocal( script ).apply( self, arguments);
		});
	};

	//  END: Script management and execution
	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/*
	 *  Event triggering (process!!!)
	 *  event: String - name
	 *  params: Object - process params
	 *  flow: Function - continue process
	 */
	this.triggerEvent = function(event, params, flow){
		if (self.log_level > 1)
			this.msg('jsIQ: event "'+event+'"', 4);
		var flowing = true;
		function continueFlow(params){
			if (params)		{
				params.cancel = true;
			}
			if (flowing)		{
				flowing = false;
				if (flow){
					try{
						flow.apply(self, [params]);
					} catch(e){
						self.triggerError(true, 'jsIQ.triggerEvent.queue', 'flow continue error', {message: e.messge, handler: event, exception: e});
					}
				}
			}
		}

		if ( typeof (this.event_handlers[event]) != 'object')	{
			/*if (flow)	{
				this.continueFlow();
			}*/
			continueFlow();
			return;
		}
		var handlers = 	this.event_handlers[event].slice(0);	// clone handlers list
		if (handlers.length === 0)	{
			/*if (flow)	{
				this.continueFlow();
			}*/
			continueFlow();
			return;
		}
		if (!params)	{
			params = {};
		}else
			params = jQuery.extend({}, params); // clone params

		delete params.cancel;

		if (params.process){
			params.parent = params.process;
			delete params.process;
			delete params.name;
		}

		params.event = event;
		params.queue = handlers;
		if (!params.name)
			params.name = event; // default name

		var process = new (function process(queue){
			var s = this;
			var name = 'noname';
			this.started = new Date();
			if (!self.addProcess(this)){
				params.cancel = true;
			}

			this.name = function(newname){
				if ( '' != $.trim(newname) ) {
					name = newname;
				}
				if (params.parent){
					return params.parent.name() + '/' + name;
				}
				return name;
			};

			this.steps = function(){
				return queue.length;
			};

			this.run = function(){
				if (true != params.cancel && queue.length > 0)		{
					var handler = queue.shift();

					if (handler)		{
						this.execute(handler);
						return;
					}
				}

				this.continueFlow();
			};

			this.next = function(){
				//if (queue.length == 0)
				//	this.continueFlow();
				if (true == params.dosync)
						s.run();
				else
					self.callback(function(){
						if (params.cancel != true)	{
							s.run();
						}
					}, 10);
			};

			this.continueFlow = function(){
				if (!flowing) return;
				self.removeProcess(s);
				if (self.log_level > 1){	// debug only
					var timeSpent = (new Date()).valueOf() - this.started.valueOf();
					self.msg('"'+this.name()+'" finished in ' + timeSpent + 'ms');
				}
				continueFlow( params );
			};

			this.execute = function(handler){
				try{
					handler.apply(self, [params, globals, s]); // !== true && params.cancel != true
					//self.msg(event + ' return');
				}
				catch(e){
					self.triggerError(false, 'jsIQ.triggerEvent.queue', 'handler execute error: ' + e.message, {message: e.message, handler: event, process: this.name(), params: params, exception: e, exception: e });
				}
				if (true == params.cancel)	{
					queue = [];	// not needed, at least free mem
					//self.removeProcess(s);
					this.continueFlow();
					return;
				}
			};

			this.name(params.name);
			return this;

		})(handlers); //factory

		if (process){
			params.process = process;

			setTimeout(function(){
				var p = params;
				process.run.call(process);
			}, 5);
		};

		//this.msg('jsIQ: event "'+event+'" END', 3);
	};
	/// END PRIVATE

})();

/*
 *  Error triggering
 */
jsIQ.triggerError = function(iscritical, from, msg, data, flow){
	this.msg(from + ': ' + msg, iscritical ? 1 : 2);
	
	var self = this;
	setTimeout(function(){
		self.triggerEvent('jsiq_error', {
			from: from,
			message: msg,
			iscritical: iscritical,
			data: data,
			flow: flow
		});
	}, 5);
};


jsIQ.addEventHandler = function(eventName, func){
	if (!this.event_handlers[eventName])	{
		this.event_handlers[eventName] = [];
	}
	this.event_handlers[eventName].push(func);
};

jsIQ.removeEventHandler = function(eventName, handler){
	if (handler == 'all')	{
		this.event_handlers[eventName] = [];
		return;
	}
	if (typeof (this.event_handlers[eventName]) != 'array')	{
		return;
	}
	var handlers = this.event_handlers[eventName];
	for (var i = 0; handlers.length; i++)	{
		if (handlers[i] == handler)	{
			this.event_handlers[eventName].splice(i, 1);
			return;
		}
	}
};

jsIQ.loadBook = function(url, callback, onerror) {
	/*
	jsIQ.loadBook: STEP 1
	*/
	var self = this;
	jsIQ.msg('jsIQ.loadBook: ' + url, 3);
	$.ajax({
		url: url,
		method: 'get',
		dataType: 'xml',
		success: function(data){
			self.msg('jsIQ.loadBook.success', 3);
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
							
				if (typeof callback == 'function')
					callback(); //.apply(self);
				//self.initDone();
			});
		},
		error: function(p1, textStatus, desc){
			if (onerror){
				onerror(p1, textStatus, desc);
				return;
			}
			self.triggerError(true, 'jsIQ.loadBook', 'error loading book', {url: url, status: textStatus, desc: desc});
		}
	});
};

////////////////////////////////////////////////////
//
//	jsIQ init
//

jsIQ.init = function(book)	{
	/*
	jsIQ.init: STEP 1
	*/

	var self = this;

	this.containers.text = $();
	this.containers.actions = $();
	this.containers.title = $();
	this.containers.char_list = $();

	this.triggerEvent('jsiq_init_start', { self: this }, function(params){
		/*
		jsIQ.init: STEP 2
		*/

		// МАКРОСЫ
		/*function gotoarticle_replacer()
		{
			return '<a href="#" onclick="run_encoded(\'' + jsIQ.encode(jsIQ.parser.getScriptForGoto(arguments[1])) + '\');return false;">'+arguments[2]+'</a>';
		}

		function gotoscript_replacer()
		{
			return '<a href="#" onclick="run_encoded(\'' + jsIQ.encode(arguments[1]) + '\');return false;">'+arguments[2]+'</a>';
		}

		self.macros = {"GOTO\\[\\[([0-9]+),\"([0-9a-z A-Z,.а-я;\\(\\)!А-Я\"=/\\(\\);']+)\"\\]\\]":gotoarticle_replacer, "GOTO\\[\\[\"([0-9a-z A-Z,.а-я;\\(\\)!А-Я\"=/\\(\\);\?><\:']+)\",\"([0-9a-z A-Z,.а-я!А-Я\"'=\\(\\)/]+)\"\\]\\]":gotoscript_replacer};
		*/
		if (!isValid(book))	{
			//self.msg('jsIQ: Не указан ресурс для загрузки книги', 1);
			self.triggerError(true, 'jsIQ.init', 'no book url specified', {});
			return;
		}
		self.loadBook(book, function(){
			self.initDone();
		});

		// предзагрузка изображений
		/*this.addPlugin('imagePreloader v'+this.imagePreloader.v, function()
		{
			jsIQ.imagePreloader.preload();
		});

		// поехали инициализировать плагины
		this.plugins.next();*/

	});	//jsiq_init_start

};

jsIQ.initDone = function() {
	this.ready = true;
	jsIQ.msg('jsIQ инициализирован успешно');
	this.triggerEvent('jsiq_init_done', { self: this }, function(params){
		// override this!
	});
};

jsIQ.callback = function(f, time){
	var self = this;
	if (!time)
		time = 40;
	setTimeout(function(){
		f.apply(self);
	}, time);
};

jsIQ.config = function(name, value) {
	if (value === undefined){
		return $.cookie(name);
	}
	$.cookie(name, value, {expires: 30});
};
/***//////////////////////////////////////////////////////////////
//
//  jsIQ: action
//

jsIQ.createAction = function(node){
	var self = this;	
	var action = new (function(){
		var a = this;
		this.text = null;
		this.goto = null;
		this.script = null;
		this.link = null;
		this.style = '';
		this.clicks = 0;
		//this.args = [a];
		this.checkif = null;
		this.ifnot = null;
		this.node = $(node);
		
		this.click = function(){
			// action click, what to do?
			a.clicks++;
			//var start = (new Date()).valueOf();

			self.triggerEvent('on_action_click', {action: a, dosync: false}, function(params){			
				if (a.script){
					//var args = [a.script].concat(a.args);
					var env = self.createEnv('ActionClick/' + a.script );
					env.from = a;                                                                                       // ENV.FROM
					if ( self.articleScriptQuery( a.script, env ) == false ){	// cancel click event
						self.renderArticle();
						return false;
					}
				}
				if (a.goto){
					self.showArticle(a.goto);
				}
                return false;
			});
			
			if (!a.goto){
				self.callback(function(){
					self.renderArticle();
				});
			}else{
				makeUnclickable(a.link);	// avoid double click
			}
			
			return false;
			
		};
		
		this.render = function() {
			var actionContainer;
			var updated = false;
			if (!this.link){
				actionContainer = $('<div></div>').addClass('actionContainer');
				this.link = actionContainer;
				updated = true;
			}
			else
				actionContainer = this.link;

			
			if (this.checkif) {
                var env = self.createEnv('Action.render',{});
                env.from = a;
				if ( !self.articleScriptQuery(this.checkif, env) ) {
					if (actionContainer.is('.Visible'))
						actionContainer.removeClass('Visible');
					actionContainer.addClass('nonVisible').empty();
					self.triggerEvent('on_action_render', {action: a, container: actionContainer, check: 'if', dosync: true});
					return actionContainer;
				}
			}
			if (this.ifnot) {
                var env = self.createEnv('Action.render',{});
                env.from = a;
				if ( self.articleScript(this.ifnot, null, env) ) {
					if (actionContainer.is('.Visible'))
						actionContainer.removeClass('Visible');
					actionContainer.addClass('nonVisible').empty();
					self.triggerEvent('on_action_render', {action: a, container: actionContainer, check: 'ifnot', dosync: true});
					return actionContainer;
				}
			}

			if (actionContainer.is('.nonVisible')) {
				actionContainer.removeClass('nonVisible');
				updated = true;
			}

			actionContainer.addClass('Visible');
				
			if ( actionContainer.empty() ){	//is(':empty')			
				var actionC = $('<a href="#"></a>');
				if (this.style)
					actionC.addClass(this.style);
				if (this.id)
					actionC.attr('id', this.id);				
				$( actionC ).click(function(){					
					return a.click();
				});
				
				actionC.append( this.text );
				
				actionContainer.append( actionC );
				actionContainer.click(function(){					
					a.click();
					return false;
				});
				updated = true;
			}			
			
			if (updated)
				self.triggerEvent('on_action_render', {action: a, container: actionContainer, dosync: true});
			return actionContainer;		
		};
		
		this.init = function(){
			this.text = getNodeContentUnHtml(this.node); //xmlToString( this.node ); //( this.node.contents() ).html();
			//this.node.text();
			this.goto = this.node.attr('goto') || this.node.attr('go');
			this.script = this.node.attr('do');
			this.style = this.node.attr('class');
			this.id = this.node.attr('id');
			/*if ($.trim(this.node.attr('args'))){
				this.args = this.node.attr('args').split(',');
				this.args.unshift(a);
			}*/
			this.checkif = this.node.attr('if');
			this.ifnot = this.node.attr('ifnot');
		};
		
		this.init();		
		return this;		
	})();
	if (!node || $(node).length == 0)
		return action;
	
	return action;
};

/*jsIQ.parse_macros = function (str)
{
	str += '';
	for (var i in this.macros)
	{
		//alert(i.replace(/nstr/g, nstr));
		str = str.replace(new RegExp(i,'g'), this.macros[i]);
	}
	return str;
};*/

jsIQ.makeLinkActionable = function ( a ) {
	var self = this;
	a = $(a);
	
	if (a.attr('do') || a.attr('go') || a.attr('goto')) {
		a.attr('href', '#');
		var todo = a.attr('do');
		var togo = a.attr('go') || a.attr('goto');

		function clickLink() {
			//var link = $(this);
			var env = self.createEnv('ActionClick/clickLink');
      env.from = {	link: a	};
			if (todo) {
				if ( self.articleScriptQuery( todo, env )  == false ){
					self.renderArticle();
					return false;
				}
			}
			
			if ( togo ) {
				self.showArticle( togo, env );
				return false;		
			}
			
			self.renderArticle();
			return false;		
		};

		a.removeAttr('do');
		a.removeAttr('go').removeAttr('goto');

		a.unbind('click').click( clickLink );
		
	};
};
/***//////////////////////////////////////////////////////////////
//
//  jsIQ: Script stuff
//

jsIQ.parser = {
	prepareScript: function(s) {
	// нормализация html-строки
		var replace = {'&gt;':'>','&lt;':'<','&amp;':'&','&nbsp;':' '};
		for (var i in replace)	{
			while (s.search(i) > 0)	{
				s = s.replace(new RegExp(i, 'g'), replace[i]);
			}
		}

		return s;
	},
	parseScriptQuery: function(query){
		var params = {};
		//var script = null;
		var str = query.text;
		
		var s = str.indexOf('?');
		if ( s === -1 ) {
            query.script = query.text;
            query.params = {};
            return false;
        }
		
		var script = str.substr(0, s);
		str = str.substr(s + 1);
		
		var q = str.split(';');
		for (var i = 0; i < q.length; i++){
			var p = q[i].split('=');
			if (p[0] && p[1])
				params[p[0]] = p[1];
		}
		
		query.script = script;
		query.params = params;
		
		return true;
	},
	/*parseScriptParameters: function (str) {
		if (typeof str != 'string') return str;
		
		var s = str.indexOf('?');
		if ( s == -1 ) return [str];
		
		var res = [ str.substr(0, s) ];
		str = str.substr(s + 1);
		res = res.concat ( str.split(';') );
		return res;
	},*/
	wrapScript: function(scriptname, script_text, article)   //, args
	{
		var self = jsIQ;
		if (jQuery.trim(script_text) == '')	{
			return null;
		}
		
		/*var in_args = 'arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9';
	
		if (typeof args == 'string') {
			// define in-args names
			in_args = args;
		}*/
	
		function r(name, params, env){
			//var nargs = Array.prototype.slice.call(args,0);
			//nargs.unshift(name);
			return jsIQ.articleScript( name, params, env );
		}
	
		function getBinds(){
            var binds = ['var triggerError=function(m,p){p.env=env;jsIQ.triggerError(false,selfname,m,p)}'];
            if (article)
            if (article.localbinds != null){
                return article.localbinds;
            }
			for (var name in self.scripts)		{
				if ( !self.scripts.hasOwnProperty(name) || name === '' || !name )		{
					continue;
				}
				//if ( script_text.indexOf( name ) > -1 )
				binds.push('var ' + name + '=function(p){return r(\''+name+'\',p,env);}');
			}
            if (!article){
                return binds.join(';');
            }
            var localscripts = article.scripts;
			if (localscripts)		{
				var scripts = localscripts;
				for (var name in scripts)		{
					if ( !scripts.hasOwnProperty(name) || name == '' || !name )		{
						continue;
					}
					//if ( script_text.indexOf( name ) > -1 )
                    if ((['onload','preload','unload']).indexOf(name) !== -1) continue;
					binds.push('var ' + name + '=function(p){return r(\''+name+'\',p,env);}');
				}
			}

            return (article.localbinds = binds.join(';'));
		}

		var res = null;
		var text = '(function() {' +
            'return function '+scriptname+'(env, vars){\n' +  //, ' + in_args + '
            'vars = env.vars();var arg = env.params;var selfname=\''+scriptname+'\';var local=this;\n' + getBinds() + '\n' +
            'try{' + script_text + '\n' + //jsIQ.parser.prepareScript()
            '}catch(e){' +
            '   jsIQ.triggerError(false, \'Script\', \'Error executing script "'+scriptname+'"\', {name: \''+scriptname+'\', article: jsIQ.current_article ? jsIQ.current_article.title : \'n/a\', exception: e, env: env });' +
            '}}' +
            '})()';
		try	{
			//res = eval(prepareScript(script_text));
			res = eval(text);
		}
		catch (e)
		{
			/*
            jsiq_msg('Ошибка выполнения скрипта: ' + e.message + ', текст скрипта: <pre style="border:1px dashed red">' + $.trim(script_text) + '</pre>');
            if (jsIQ.crashreport)
            {
                jsIQ.crashreport('Ошибка выполнения скрипта: ' + e.message + ', текст скрипта: <pre style="border:1px dashed red">' + $.trim(script_text) + '</pre>');
            }
            else
                alert('Ошибка выполнения обработчика, см. лог');*/
			//this.msg('jsIQ.wrapScript error: ' + e.message + '\n[' + text + ']', 2);
			jsIQ.triggerError(false, 'jsIQ.wrapScript', 'script parse error' , {
				exception: e,
				name: scriptname,
				script: script_text
			}, true);
			return null;
		}
		return res;
	}
};


jsIQ.articleScript = function(scriptline, extargs, parentEnv){
    if (!extargs){
        return jsIQ.articleScriptQuery(scriptline, parentEnv);
    }
    return jsIQ.articleScriptWithParams(scriptline, extargs, parentEnv);

	/*if ( !this.current_article || !scriptline )	{
		return null;
	}
	var result = null;
	var scripts = scriptline.split('|');
	for (var s = 0; s < scripts.length; s++){
		var scriptname = scripts[s];
		var params;

        var query = {text: scripts[s], params:null};
        this.parser.parseScriptQuery(query);

        if (query.scriptname && query.params){
			scriptname = query.scriptname;
            params = query.params;
		}else{
            params = extargs;
        }

		var script = this.current_article.scripts[scriptname];
		if (!script) {
			script = this.scripts[scriptname];
		}
		if (!script) {
			// return local var == true
			script = this.getLocalChecker(scriptname);
		}
		if (script)		{
            var env = this.createEnv('jsIQ.articleScript/' + scriptname, params, parentEnv);

			try{
				var res = this.runGlobal.apply( this, [script, env] );
				if (result == null){
					result = res;
				}else
					result = result && res;
			}
			catch(e){
				this.triggerError(false,'jsIQ.articleScript','script error',{message: e.message, script: scriptname});
			}
		}
	}
	return result;*/
};

/**
 * Execute script in existing environment
 * 
 * @param Env env
 * @param String scriptname
 */
jsIQ.articleScriptInEnv = function(env, scriptname){
	if ( !this.current_article || !scriptname || !env)	{
		/*if (!this.current_article)	{
			jsIQ.msg('!this.current_article for ' + scriptname, 2);
		}
		if (!scriptname)	{
			jsIQ.msg('!scriptname', 2);
		}
		if (!env)	{
			jsIQ.msg('!env for ' + scriptname, 2);
		}*/
		return null;
	}
	var result = null;

	var script = this.current_article.scripts[scriptname];
	if (!script) {
		script = this.scripts[scriptname];
	}
	if (!script) {
		// return local var === true
		script = this.current_article.getLocalChecker(scriptname);
	}

	try {
		result = this.runGlobal(script, env);
	} catch(e) {
		this.triggerError(false, 'jsIQ.articleScriptInEnv', 'script error', {
			message : e.message,
			env : env,
			script : scriptname
		});
	}

	return result;
};

/**
 * Execute script in new environment
 */
jsIQ.articleScriptWithParams = function(scriptname, params, parentEnv){
    if ( !this.current_article || !scriptname)	{
			/*if (!this.current_article)	{
				jsIQ.msg('!this.current_article for ' + scriptname, 2);
			}
			if (!scriptname)	{
				jsIQ.msg('!scriptname', 2);
			}
			if (!env)	{
				jsIQ.msg('!env for ' + scriptname, 2);
			}*/
			return null;
    }
    var result = null;

    var env = this.createEnv('jsIQ.articleScriptWithParams/' + scriptname, params, parentEnv);

    var res = jsIQ.articleScriptInEnv(env, scriptname);
    if (res) {
        if (result === null) {
            result = res;
        } else
            result = result && res;
    }

    return result;
};

/**
 * Script query in new, common, env
 * @param String query
 */
jsIQ.articleScriptQuery = function(queryStr, parentEnv){
	if ( !this.current_article || !queryStr )	{
		/*if (!this.current_article)	{
			jsIQ.msg('!this.current_article for ' + scriptname, 2);
		}
		if (!scriptname)	{
			jsIQ.msg('!scriptname', 2);
		}
		if (!env)	{
			jsIQ.msg('!env for ' + scriptname, 2);
		}*/
		return null;
	}
	var result = null;
	
	//var commonEnv = this.createEnv('articleScriptQuery/' + queryStr, null, );	// common
	
	var scripts = queryStr.split('|');
	for (var s = 0; s < scripts.length; s++){
		var query = {text: scripts[s], params:null};
		this.parser.parseScriptQuery(query);
		if (!query.script || !query.params) {
			jsIQ.msg('script: !query.script || !query.params for' + scripts[s], 2);
			continue;
		}

		var env = this.createEnv('jsIQ.articleScriptQuery/' + query.script, query.params, parentEnv);	// child env

		var res = jsIQ.articleScriptInEnv(env, query.script);		//this.runGlobal.apply(this, args);
		if (res) {
			if (result === null) {
				result = res;
			} else
				result = result && res;
		}
	}
	return result;
};/***//////////////////////////////////////////////////////////////
//
//  jsIQ: article
//

jsIQ.createArticle = function(n)
{
	var self = this;
	var node = this.getArticle( n );
	
	var texts = [];
	var scripts = {};
	var actions = [];
	var imgs = [];
	var musics = [];	

	$(node).children('text').each(function(){
		var t = $(this);
		texts.push( self.createText( t ) );
	});

	$(node).children('img').each(function(){
		var t = $(this);
		imgs.push({
			name: t.attr('name'),
			src: jQuery.trim( t.text() ),
			node: t
		});
	});

	$(node).children('music').each(function(){
		musics.push( jQuery.trim( $(this).text() ) );
	});

	//scripts: part 1 - get names list
	$(node).children('script').each(function(){
		var t = $(this);
		var type = t.attr('type');
		if ( $.trim(t.attr('isglobal')).toUpperCase() == 'TRUE' ){
			self.scripts[type] = function(){ };
			return;
		}
		if (type != '')	{
			scripts[type] = function(){ };
		}
	});

	$(node).find('action').each(function(){
		actions.push( self.createAction( this ) );
	});

    //
	// Article object
    //
	var article = new (function article() {
		//var self = this;
		this.title = n;
		this.text = [];
		this.actions = [];
		this.scripts = {};
		this.imgs = [];
		this.music = [];
		this.linked_vars = [];

		this.text = texts;
		this.scripts = scripts;
		this.actions = actions;
		this.imgs = imgs;
		this.music = musics;

        this.localbinds = null; // cache of shortcuts to script functions

		this.createLocals = function(){
			return {};	// locals
		};

		var locals = this.createLocals();
		
		/*this.getLocals = function(){
			return locals;
		}*/

		this.runLocal = function(script){
			if (typeof script != 'function'){
				jsIQ.triggerError(false, 'jsIQ.createArticle.runLocal', 'not a script passed', {});
				return null;
			}
			return (function localscript(env){
				try{
					return script.apply(locals, [env]);
				}
				catch(e){
					jsIQ.triggerError(false,'jsIQ.createArticle.runLocal', 'script error', {message: e.message, exception: e, script: script.toSource()});
				}
			});
		};

        // fast local value check wrapper
        this.getLocalChecker = function(name) {
            return this.runLocal(function(env){
                return (this[name] == true);
            })
        }

        this.appendArticle = function(node){
            node = $(node);
            if (node.length == 0) return false;
            var article = this;
            //var self = jsIQ;
            this.localbinds = null; // cache of shortcuts to script functions

            $(node).children('text').each(function(){
                var t = $(this);
                article.text.push( self.createText( t ) );
            });

            $(node).children('img').each(function(){
                var t = $(this);
                article.imgs.push({
                    name: t.attr('name'),
                    src: jQuery.trim( t.text() ),
                    node: t
                });
            });

            $(node).children('music').each(function(){
                article.musics.push( jQuery.trim( $(this).text() ) );
            });

            //scripts: part 1 - get names list
            $(node).children('script').each(function(){
                var t = $(this);
                var type = t.attr('type');
                if ( $.trim(t.attr('isglobal')).toUpperCase() == 'TRUE' ){
                    self.scripts[type] = function(){ };
                    return;
                }
                if (type != '' && !article.scripts[type])	{   // NO overwrite of old scripts!
                    article.scripts[type] = function(){ };
                }
            });

            $(node).find('action').each(function(){
                article.actions.push( self.createAction( this ) );
            });

            //scripts: part 2 - parse scripts
            $(node).children('script').each(function(){
                var t = $(this);
                var type = t.attr('type');
                var raw = self.parser.wrapScript(type, getNodeContentUnHtml(t), article);   //, t.attr('args')  //t.text()
                if (!raw)		{
                    return;
                }
                if ( $.trim(t.attr('isglobal')).toUpperCase() == 'TRUE' ){
                    self.addScript( type, raw );
                    return;
                }
                var script = article.runLocal( raw );
                if (type == '')	{
                    // execute now
                    self.runGlobal( script() );
                }
                else if (!article.scripts[type]){      // NO overwrite of old scripts!
                    article.scripts[type] = script;
                }
            });

            self.triggerEvent('on_append_article', { dosync: true, article: article, node: node });
        }

    })();

    //scripts: part 2 - parse scripts
    $(node).children('script').each(function(){
        var t = $(this);
        var type = t.attr('type');
        var raw = self.parser.wrapScript(type, t.text(), article);   //, t.attr('args')
        if (!raw)		{
            return;
        }
        if ( $.trim(t.attr('isglobal')).toUpperCase() == 'TRUE' ){
            self.addScript( type, raw );
            return;
        }
        var script = article.runLocal( raw );
        if (type == '')	{
            // execute now
            self.runGlobal( script() );
        }
        else{
            scripts[type] = script;
        }
    });
	
	this.triggerEvent('on_create_article', { dosync: true, article:article, node: node });
	
	this.msg('jsIQ: Параграф "'+n+'" создан');
	return article;
};

jsIQ.createText = function ( node ) {
	if (!node || $(node).length == 0)
		return null;
		
	var self = this;	
	var text = new (function(){
		var t = this;
		this.text = null;
		this.link = null;
		this.style = '';
		this.checkif = null;
		this.ifnot = null;
		this.node = $(node);
		
		this.render = function() {
			var textContainer;
			var updated = false;
			if (!this.link){
				textContainer = $('<div></div>').addClass('textContainer');
				this.link = textContainer;
				updated = true;
			}
			else
				textContainer = this.link;
				
			if (this.checkif){
				if ( !self.articleScriptQuery(this.checkif) ) {
					textContainer.addClass('nonVisible');
					textContainer.empty();
					return textContainer;
				}
			} 
			if (this.ifnot){
				if ( self.articleScriptQuery(this.ifnot) ){
					textContainer.addClass('nonVisible');
					textContainer.empty();
					return textContainer;
				}
			}
				
			if (textContainer.is('.nonVisible')) {
				textContainer.removeClass('nonVisible');
				updated = true;
			}
				
			if (textContainer.is(':empty')){			
				/*var txtC = $('<span></span>');
				if (this.style)
					txtC.addClass(this.style);
				if (this.id)
					txtC.attr('id', this.id);				
				//txtC.html( this.text );
				txtC.append( this.text );
				textContainer.append( txtC );*/
				if (this.style)
					textContainer.addClass(this.style);
				if (this.id)
					textContainer.attr('id', this.id);				
				textContainer.append( this.text );
				updated = true;
			};
			
			if (updated)
				self.triggerEvent('on_text_render', {text: t, container: textContainer, dosync: true});
			return textContainer;
		};
		
		this.init = function(){
			this.text = getNodeContentUnHtml(node); // xmlToString( this.node ); /// ( this.node.contents() ).html(); //( $('<div></div>').html(  this.node.contents() ) ).html();
//			this.text = this.node.contents();
			this.style = this.node.attr('class');
			this.id = this.node.attr('id');
			this.checkif = this.node.attr('if');
			this.ifnot = this.node.attr('ifnot');
		};
		
		this.init();		
		return this;		
	})();
	
	return text;
};

jsIQ.articleExists = function(n)	{
	return (this.getArticle(n).length > 0);
};


jsIQ.renderArticle = function( params, callback )	{
	/*
	 * [!!!] STANDART ARTICLE RENDERER [!!!]
	*/

	// hack: skip double rendering(?)
	if (this.rendering !== true) {
	
		if (!params)
			params = {
				article: this.current_article,
                                title: this.current_article.title
			};
			
		if (!params.article) return;

		this.rendering = true;
		jsIQ.msg('Start render:' + params.article.title);
	
		var texts = params.article.text;
		var c = this.containers.text;
		for (var i = 0; i < texts.length; i++){
			if (!texts[i].link){
				c.append( texts[i].render() );
			}
			else
				texts[i].render();
		};
		params.text = c;
		
		//this.updateValues( params.article );
		
		var actions = params.article.actions;
		var a = this.containers.actions;
		for (var i = 0; i < actions.length; i++){
			if (!actions[i].link){
				a.append( actions[i].render() );
			}
			else
				actions[i].render();
		};
		
		this.triggerEvent('on_render_article', params, function(params) {
	                                
			if (params.title) 
				this.containers.title.html( params.title );

            /*if (this.containers.charsheet)
			if (this.containers.charsheet.length > 0)
				this.triggerEvent('on_text_render', { container: this.containers.charsheet });*/

            this.triggerEvent('update_charsheet');
	
			if (params.article.imgs.length > 0)
				this.triggerEvent('on_render_images', { images: params.article.imgs });		
	
			// continue flow
			delete this.rendering;
			if (callback) {
				callback.apply(this);
			}
		});
	} else	{
		if (callback) {
			callback.apply(this);
		}
		/*setTimeout(function(){
			jsIQ.renderArticle(params);
		}, 75);
		jsIQ.msg('Render queued...');*/
		/*this.callback(function(){
			jsIQ.msg('Re-render');
			jsIQ.renderArticle( params, callback );
		});*/
	}
};

jsIQ.showArticle = function(n, nounload)	{
    var self = this;
    var last = this.current_article;
    var started = new Date();

	if (!this.ready)
	{
		this.triggerError(true, 'jsIQ', 'not initialized', {
			article: n,
			last: (last ? last.title : null)
		});
		return;
	}

	// STEP 1

	if (nounload !== true)		{
		this.triggerEvent('before_article_unload', {current: (last ? last.title : null), next: n, dosync: true}, function(params){

			if (params.current)		{
				this.triggerEvent('on_article_unload', {current: params.current.title, next: n, process: params.process}, function(){
					self.showArticle(n, true);
				}); // on_article_unload
			}
			else this.callback(function(){
				self.showArticle(n, true);
			});

		}); // before_article_unload
		return;
	}

	this.current_article = null;
	this.containers.text.empty();
	this.containers.actions.empty();
	this.containers.title.html( '' );

	// STEP 2
	
	// ищем нужный параграф
	if ( !this.articleExists(n) ) {
		/*this.triggerEvent('on_article_not_found', {last: (last ? last.title : null), next: n}, function(){
            self.msg('jsIQ: Критическая ошибка - параграф НЕ найден', 1);
        });*/
		this.triggerError(true, 'jsIQ.showArticle', 'article not found', {
			article: n,
			nounload: nounload,
			last: (last ? last.title : null)
		});
		return;
	}

	var article = this.createArticle( n );		

	this.article_state = 'creating';

	jsIQ.current_article = article;

	this.triggerEvent('on_article_preload', {article: article}, function(params){
		/*
		jsIQ.showArticle: STEP 3
		*/
		var params = {
			article: article,
			text: '',
			actions: $(),
			title: '',
			process: params.process
		};
		/*for (var i=0; i < article.actions.length; i++)			{
			params.actions = params.actions.add( article.actions[i].render() );
		}*/

		this.triggerEvent('before_render_article', params, function(params){
			/*
			render
			*/
			
			try{
			
			this.renderArticle( params , function(){
				/*params.text = this.containers.text;
				params.actions = this.containers.actions;
				params.title = this.containers.title;
	
				this.triggerEvent('on_render_article', params, function (params){*/
					//
					// after render
					//
					this.article_state = 'visible';
	
					this.triggerEvent('on_article_onload', {article: self.current_article, last: (last ? last.title : null)}, function(){
						//
						// jsIQ.showArticle: STEP 4
						//

						this.triggerEvent('after_article_loaded', {article: self.current_article, last: (last ? last.title : null)}, function(){
							//
							// jsIQ.showArticle: STEP 5
							//
							
							if (self.log_level > 1){	// debug only
								var timeSpent = (new Date()).valueOf() - started.valueOf();
								this.msg('jsIQ: article complete in ' + timeSpent + 'ms', 2);
							}
							
	
						}); // STEP 5
	
					}); // STEP 4
	
	
				//}); //on_render_article
				
			}); //renderArticle
			
			}
			catch(e){
				this.triggerError(true, 'jsIQ.showArticle','render error', {message: e.message, exception: e});
				return;
			}

		}); //before_render_article

	}); // STEP 3

};

jsIQ.appendArticle = function(n, callback){
    var self = this;
    var last = this.current_article;

    if (!this.ready || !this.current_article)
    {
        this.triggerError(true, 'jsIQ', 'not initialized', {
            article: n,
            last: (last ? last.title : null)
        });
        if (typeof callback === 'function'){
            callback(false);
        }
        return;
    }

    // ищем нужный параграф
    var node = this.getArticle( n );
    if ( node.length === 0 ) {
        this.triggerError(true, 'jsIQ.appendArticle', 'article not found', {
            article: n,
            nounload: true,
            callback: callback,
            last: (last ? last.title : null)
        });
        if (typeof callback == 'function'){
            callback(false);
        }
        return;
    }

    this.current_article.appendArticle( node );

	if (typeof callback === 'function'){
		callback(true);
	}

	setTimeout(function(){            
		jsIQ.renderArticle();
	}, 100);
};/***//////////////////////////////////////////////////////////////
//
//  jsIQ: STANDART HANDLERS
//

jsIQ.addEventHandler('jsiq_error', function(params, vars, process){
	// std error handler
	var msg = params.from + ': ' + params.message + '\n';

	if (params.data.exception){
		var e = params.data.exception;
		delete params.data.exception;
        if (e){
            var eTxt = ['Message: ' + e.message];
            if (e.category)
                eTxt.push('Category: ' + e.category);
            if (e.colNumber)
                eTxt.push('colNumber: ' + e.colNumber);
            if (e.lineNo)
                eTxt.push('cat: ' + e.lineNo);
            if (e.source)
                eTxt.push('cat: ' + e.source);

            msg += eTxt.join(',') + '\n';
        }
	}

    if (params.data.env){
        var e = params.data.env;
        delete params.data.env;

        if (e){
            msg += 'TRACE:\n' + e.getTrace() + '\n';
        }
    }

	var data = [];
	for (var i in params.data){
		data.push( i + '=' + params.data[i]);
	}
	msg += '\n' + data.join(',');
	
	var pList = this.getProcessList();
	var pNames = [];
	for (var i = 0; i < pList.length; i++){
		var process = pList[i];
		//if (pList.hasOwnProperty(process))
		pNames.push(process.name() + '['+ process.steps() +']');
	}
	msg += '\nprocesses: ' + pList.length + ' ('+ pNames.join(', ') +')';

	/*if (params.from == 'jsIQ.wrapScript')	{
		msg += '\nScript error: ' + params.data.message + '\nScript: ' + params.data.script;
	}*/
	
	if (console)
		if (typeof console.log == 'function')
			console.log (msg);

	alert(msg);
});


jsIQ.addEventHandler('on_text_render', function(params, vars, process){
	/*
	PARSE LINKED VARS, SYNCED!
	*/
	var link_list = {};

	params.container.find('.linked').each(function(){
		var link = $(this);
		var name = $.trim( link.attr('name') );
		if (name != '')	{
			link_list[name] = link;
		}
	});
	this.updateValuesByList(link_list, vars);

	process.next();
});

jsIQ.addEventHandler('on_render_article', function(params, vars, process){
	/*
	MAKE HYPERLINKS ACTIONABLE
	*/
	var article = params.article;
	var self = this;
	var c = params.text;

	/*function clickLink() {
		var a = $(this);	

		if (a.attr('do')) {
			self.articleScript(a.attr('do'));
		}
		if ( link.attr('go') || link.attr('goto') ) {
			self.showArticle( link.attr('go') || link.attr('goto') );
		}

		return false;
	}


	c.find('a').each(function(){
		var link = $(this);
		if ( link.attr('do') || link.attr('go') || link.attr('goto') ){
			link.attr('href','#');
			$(link).unbind('click').click(clickLink);
		} 
	});*/
	
	
	c.find('a').each(function(){
		self.makeLinkActionable(this); 
	});
	
	process.next();
});

jsIQ.addEventHandler('on_article_preload', function(params, vars, process){
	this.articleScript('preload');

	process.next();
});

jsIQ.addEventHandler('on_article_onload', function(params, vars, process){
	/*
	DEFAULT EVENT HANDLER
	*/

	//self.CharacterListUpdateFunc();
	window.scroll(0,0);

	(function initSpoilers(context)
	{
		var context = context || 'body';
		$('div.spoiler-head', $(context)).click(function() {
			var code = $(this).next('div.spoiler-body').find('textarea').text(); 
			if(code) $(this).next('div.spoiler-body').html(code);
			$(this).toggleClass('unfolded');
			$(this).next('div.spoiler-body').slideToggle('fast');
		});
	})( this.containers.text );

	this.articleScript('onload');
	process.next();

});

jsIQ.addEventHandler('before_article_unload', function(params, vars, process){
	/*
	DEFAULT EVENT HANDLER
	*/
	/*
	params:
	current = num of cur article
	next = new num of article
	*/

	//unclickable
	this.containers.text.find('a').each(function()	{
		makeUnclickable(this);
	});

	this.containers.actions.find('a').each(function()	{
		makeUnclickable(this);
	});

	//this.continueFlow();
	process.next();
});

jsIQ.addEventHandler('on_article_unload', function(params, vars, process){
	/*
	DEFAULT EVENT HANDLER
	*/
	/*
	params:
	current = num of cur article
	next = new num of article
	*/

	// если звук доступен - проиграть щелчок
	/*
	move to sound plugin
	if (self.sound)
		if (self.sound.sounds['article_goto_sound'] != '')
	{
		self.sound.playSound ( self.sound.sounds['article_goto_sound'] );
	}*/

	this.articleScript('unload');

	//this.continueFlow();
	process.next();
});

jsIQ.addEventHandler('preload_images', function(params, vars, process){
	var list = params.images;
	var total = list.length;
	var done = 0, errors = 0;
	var map = {};
	if (!params.maxerrors)
		maxerrors = 0;
			
	
	function onComplete(){
		if (errors > params.maxerrors)
			params.success = false;
		else
			params.success = true;
		params.map = map;
		params.errors = errors;			
		process.next();
	}
	function onLoad(img, src){
		done++;
		map[src] = img;
		if (done >= total)
			onComplete();
	}
	function onError(){
		done++; errors++;
		if (done >= total)
			onComplete();
	}
	
	var absPath = this.getCfg('absolutepath','');
	
	for (var i = 0; i < total; i++){
		var img = $('<img>');
		(function(i,src){
			i.bind('load', function(){
				onLoad(i, src);
			});
			i.bind('error', onError);
			i.attr('src', src);
		})(img, ((params.doabsolute) ? absPath: '') + list[i]);
	}
});

jsIQ.addEventHandler('before_article_unload', function(params, vars, process){
	/*
	 * Flush linked cache
	 */
	this.linked_cache = {};
	process.next();
});

jsIQ.addEventHandler('update_charsheet', function(params, vars, process)	{
    if (this.containers.charsheet)
        if (this.containers.charsheet.length > 0)
            this.triggerEvent('on_text_render', { container: this.containers.charsheet });

    process.next();
});
/***//////////////////////////////////////////////////////////////
//
//  jsIQ: Linked values stuff
//

jsIQ.linked_vars = {};

/*
 * Add value to linked list
 */
jsIQ.linkValue = function(id, value){
	if (undefined == value)
		value = id;
	this.linked_vars[id] = value;
};

jsIQ.unlinkValue = function(id){
	delete this.linked_vars[id];
};

/*
 * Connect values to links
 */
jsIQ.updateValues = function(article, vars){
	function setValue(val, e){
		if (e.is('input,select')){
			e.val(val);
			return;
		}
		e.html(val);
	}
	var links = article.linked_vars;
	for (var link in links){
		var c = links[link];
		var val = null;
		if (typeof this.linked_vars[link] == 'function'){
			val = this.runGlobal( this.linked_vars[link] );
		}
		else {
			if (vars && vars[link]){
				val = vars[link];
			}else{
				val = this.current_article.runLocal( function() {
					return this[link];
				});
				if (!val)
					val = this.runGlobal ( function(vars) { return vars[link]; });
			}
		}
		if (val)
			setValue(val, c);
	}
};

jsIQ.updateValuesByList = function(linked_list, vars){
	function setValue(val, e){
		if (e.is('input,select')){
			e.val(val);
			return;
		}
		e.html(val);
	}
	var links = linked_list;
	for (var link in links){
		if ( !links.hasOwnProperty(link) ) continue;
		var c = links[link];
		var val = null;
		if (typeof this.linked_cache[link] == 'function'){
			setValue( this.runGlobal( this.linked_cache[link] ) , c);
			continue;
		}
		else
		if (typeof this.linked_vars[link] == 'function'){
			setValue( this.runGlobal( this.linked_vars[link] ) , c);
			continue;
		}
		else {
			if (vars){
				var t = vars[link];
				if ( !( undefined == t || null == t ) ) {
					setValue( t , c);
					continue;
				}
			}
			else{
				var t = function(vars) {
					return vars[link];
				};
				val = this.runGlobal(t);
				if ( !( undefined == val || null == val ) ) {
					this.linked_cache[link] = t;
					setValue( val , c);
				}
			}
			if ( undefined == val || null == val ) {
				// get local value
				if (!this.current_article){
					this.msg('jsIQ.updateValuesByList, error on "'+link+'" value: this.current_article is NULL', 2);
					return;
				}
				var t = this.current_article.runLocal(function() {
					return this[link];
				});
				val = t();
				if ( !( undefined == val || null == val ) ) {
					this.linked_cache[link] = t;
					setValue(val, c);
				}
			}
			
		}
		//if ( !( undefined == val || null == val ) )
		//	setValue(val, c);
	}
};

/*
 * Delete value link
 */
/*jsIQ.removeValueLink = function(link){
	var p = article.linked_vars.indexOf(link);
	if (p == -1)
		return;
	jsIQ.linked_vars.splice(p, 1);
}*/
/***//////////////////////////////////////////////////////////////
//
//  jsIQ: shortcuts
//

function go(n){
	if (n == undefined) return;
	setTimeout(function(){
		jsIQ.showArticle(n);
	}, 5);
}

var go_to = go;

function gosub(n){
	if (n == undefined) return;
	setTimeout(function(){
		jsIQ.appendArticle(n);
	}, 5);
}

/*
 * execute article script
 */
function run(scriptname, params, env){
	if (!scriptname) return;
	return jsIQ.articleScript( scriptname, params, env);
};

jsIQ.preloadImages = function (list, onload, onerror){
	if (!onerror) onerror = onload;
	this.triggerEvent('preload_images', {images: list}, function(params){
		if (params.success){
			if (onload)			
				onload.apply(this, [params]);
			return;
		}
		onerror.apply(this);
	});
};

function showValue(name, val){
	this.linked_cache[name] = function(){
		return val;
	};
	jsIQ.updateValuesByList([name]);
	
};

/*function render(params, callback){
	jsIQ.renderArticle(params, callback); 
};*/

function sound_load_tracks(tracks, callback, updatecallback){
	jsIQ.triggerEvent('sound_tracks_load', {
		list: tracks,
		callback: updatecallback
	}, callback);
}

function sound_load_tracks_background(tracks, callback){
	jsIQ.triggerEvent('sound_tracks_loadbackground', {
		list: tracks
	}, callback);
}

function sound_play_tracks(list, isappend, callback){
	jsIQ.triggerEvent('sound_play_tracks', {
		playlist: list,
		norestart: isappend
	}, callback);
}

function sound_set_volume(value, callback){
	var p = {};
	if (value === true){
		p.stephigh = true;
	}else if (value === false) {
		p.steplow = true;
	}else
		p.volume = value;
		
	jsIQ.triggerEvent('sound_volume', p, callback);
}

function getCurArticleTitle(){
    if (!jsIQ.current_article){
        return '';
    }
    return jsIQ.current_article.title;
}