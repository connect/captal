/**
 * CAPTAL
 * 
 * @description Keyboard events
 * @author connect <kod.connect@gmail.com>
 */
    
keys = {            
    state: {},
    down: {},
    up: {}        
};

$(document)
    .bind('keydown',function(e){
        //console.log('keydown: '+e.which);        
        if (keys.state[e.which] != true) {
            keys.state[e.which] = true;
            if (typeof keys.down[e.which] == 'function') {
                keys.down[e.which](e);
                //e.preventDefault();
                //return false;
            }
        }        
        
        if (cfg.debug) {
            
            if (e.which == 16) {
                $('#shift').show();
            } else if (e.which == 17) {
                $('#ctrl').show();
            } else if (e.which == 18) {
                $('#alt').show();
            }
        }
    })
    .bind('keyup',function(e){        
        if (keys.state[e.which]) {
            keys.state[e.which] = false;
            if (typeof keys.up[e.which] == 'function') {
                keys.up[e.which](e);
                //e.preventDefault();
                //return false;
            }
        }
        if (cfg.debug) {
            
            if (e.which == 16) {
                $('#shift').hide();
            } else if (e.which == 17) {
                $('#ctrl').hide();
            } else if (e.which == 18) {
                $('#alt').hide();
            }
        }
    });
    
// if window lost focus, reset state    
$(window)
    .bind('focusout',function(e){
        
        for (var i in keys.state) {
            
            keys.state[i] = false;
            $('#alt').hide();
            $('#ctrl').hide();
            $('#shift').hide();
        }
});    

/**
 * Creates event listener
 * 
 * @param {string} hotkey
 * @param {function} callback
 * @returns {undefined}
 */
keys.addHotkey = function(hotkey, callback){
    var i;
    
    hotkey = hotkey
                .toUpperCase()
                .split('+');

    for (i in hotkey){        
        
        if (typeof hotkey[i] === 'string' || hotkey[i] instanceof String){
            
            hotkey[i] = hotkey[i]
                        .replace('ALT',     18)
                        .replace('CTRL',    17)
                        .replace('SHIFT',   16)
                        .replace('UP',      40)
                        .replace('DOWN',    38)
                        .replace('LEFT',    37)
                        .replace('RIGHT',   39);
                
            
            if (hotkey[i].length == 1) {
                // try to convert char button to keycode ('A' charcode == 'a' keycode)
                hotkey[i] = hotkey[i].charCodeAt(0); 
                
            } else if (hotkey[i].indexOf('F') == 0 && hotkey[i].length > 0 && hotkey[i].length <= 3) {
                // F1 .. F12 keys, 112 .. 123
                hotkey[i] = parseInt(hotkey[i].match(/\d+/)) + 111;
            }
        }             
        //if (Number(arr[i]) === arr[i] && arr[i] % 1 === 0 ) {
    }
    
    keys.down[ hotkey.pop() ] = function(){        
        if (hotkey.length > 0) {
            for (i in hotkey) {
                if ( !keys.state[ hotkey[i] ]) return;
            }
        }
        callback();
    };
};