/**
 * jQuery horizontal menu bar plugin 
 *
 * @author connect
 */
(function($){

    var container;
    var active = false;

    var methods = {

        init: function( options ){
            var i;
            var item, parent; 
            
            container = '#'+this.attr('id');
            this.html(''); // clear container 
            
            /** 
             * Add item to root menu
             * @param {html} parent
             * @param {object} item
             * @returns {html}
             */
            var addItem = function(parent, item){
                return $('<div />')
                        .attr('id', item.id)
                        .addClass('item')
						.addClass( item.group != undefined ? item.group : '')
                        .html(item.label)
                        .bind('click', 
                            (typeof item.action === 'function') ? item.action : function(){}
                        )
                        .appendTo( parent );
            };
            
            var addSubmenu = function(parent, menu){
                var item;
                var tparent;

                parent = $('<div />')
                        .attr('id', $(parent).attr('id')+'-submenu')
                        .addClass('submenu')
                        .bind('click', function(e){
                            $(parent).menubar('show',e);
                            e.stopPropagation();
                        })
                        .appendTo(parent);
                
                for (var i in menu) {
                    item = menu[i];
                    item.id = i;
                    
                    if (typeof item.submenu == 'object' ) {
                        // has submenu                        
                        item.action = function(e){                            
                            $(parent).menubar('show',e);  
                            e.stopPropagation();
                        };                              
                        tparent = addSubitem(parent, item);                        
                        addSubmenu(tparent, item.submenu );                    
                    } else {
                        addSubitem(parent, item);
                    }
                }
            };
            
            var addSubitem = function(parent, item) {
                var icon = (item.icon === undefined) ? '<i></i>' : '<img src="'+item.icon+'">';
                var hotkey = (item.hotkey != undefined) ? '<span class="hotkey">'+item.hotkey+'</span>' : '';
                var res;
                var arr = [];
                var i;
                
                if ( item == 'separator') {
                    res = $('<div />')
                            .addClass('separator')
                            .appendTo(parent);
                } else {
                    res = $('<div />')
                            .attr('id', item.id)
                            .addClass('subitem')
							.addClass( item.group != undefined ? item.group : '')
                            .addClass( 
                                (typeof item.submenu === 'object') ? 'submenu-parent' : ''
                            )
                            .html(icon+'<span class="separator">&nbsp;</span>'+ item.label + hotkey)                            
                            .appendTo(parent);
                    
                    if (typeof item.action === 'function') {
                        res.bind('click',function(e){
                            item.action(e);
                            $(container).menubar('hide');
                            e.stopPropagation();
                        });
                        
                        // create hotkey
                        if (item.hotkey) {                                                        
                            // push event listener          
                            keys.addHotkey(item.hotkey, item.action);                                                                                    
                        }
                    } else {
                        res.addClass('disabled');
                    }
                }
                
                
                
                return res;
            };            
                                

            // create capture layer
            $('<div />')
                .attr('id','captor')
                .bind('click',function(e){$(container).menubar('hide',e);})
                //.bind('mouseover',function(e){ $(container).menubar('hide',e);})
                .insertBefore(container);   
        
            // process menu items recursevly
            for (i in options.items) {
                item = options.items[i];
                item.id = i;                
                
                if ( typeof item.submenu == 'object' ) {// has submenu
                    item.action = function(e){                        
                        $(container).menubar('show',e);                                                    
                    };                             
                    parent = addItem(container, item);                    
                    addSubmenu(parent, item.submenu );                                        
                } else {
                    addItem(container, item);
                }
            }  
            
            // add mousemove handler
            $(container).bind('mouseover',function(e){
                
                if ( $(e.target).attr('id') == undefined ) return;
                
                // ignore if nothing selected, caller is container, caller is submenu
                if (
                        $(this).find('.selected').length == 0 ||
                        $(e.target).attr('id') == $(this).attr('id') || 
                        $(e.target).attr('id').indexOf('-submenu') > 0 
                    ) { return; }
                                
                // popup submenu if active
                if ( $(e.target).find('.submenu').length > 0 ) {
                    
                    $().menubar( 'show', e );
                    
                } else {
                    // hide other submenu
                    var parentID       = $(e.target.parentNode).attr('id');
                    var submenuOpened  = $(container).find('.submenu-parent .submenu.selected');
                    
                    if (parentID != undefined && parentID != submenuOpened.attr('id')) {
                        
                        submenuOpened.hide();
                    }
                }               
                
                e.stopPropagation();
            });              
        },
        show: function(e){
            var o = $(e.target).find('.submenu:first');
            var id = $(e.target).attr('id');
            var parent = e.target.parentElement;            

            // was hidden => show & hide other
            if (o.css('display') == 'none') {
                
                $(container)
                    .find('.selected')
                        .removeClass('selected');
                
                $(container)
                        .find('.submenu')                            
                            .hide();
                    
                o.show( 'fold', {}, 100 )
                        .addClass('selected');     
                
                $(parent).show(); // keep parent visible
                            
            
                $(container) // reselect top menu item wis submenu opened
                    .find('.item:has(.selected)')
                        .addClass('selected');
            
                $('#captor').show();                
            } else {
                //$(container).menubar('hide');
            }
        },
        hide: function(e){              
            $(container)
                    .find('.selected')
                    .removeClass('selected');
            
            $(container)
                    .find('.submenu')                        
                        .hide();
            $('#captor').hide();
        },
        container: function(e){
            return container;
        }
    };

    $.fn.menubar = function( method ){ 

        if (methods[method]) {
            return methods[method].apply( this, Array.prototype.slice.call(arguments, 1 ));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('There is no such method "'+method+'" in jQuery.menubar');
        }                                                                                                
    };                                        

}(jQuery));