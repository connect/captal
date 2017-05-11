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
    .on('keydown',function(e){

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
    .on('keyup',function(e){        
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
    .on('focusout', function(e){

        $('#alt').hide();
        $('#ctrl').hide();
        $('#shift').hide();
    })
    .on('mousemove', function (e) {
        
        // trying an alternative way to catch system keys state
        if (!e) e = window.event;
        
        keys.state[16] = e.shiftKey ? true : false;
        keys.state[17] = e.ctrlKey  ? true : false;
        keys.state[18] = e.altKey   ? true : false;
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
                        //.replace('ALT',     18)
                        //.replace('CTRL',    17)
                        //.replace('SHIFT',   16)
                        .replace('UP',      40)
                        .replace('DOWN',    38)
                        .replace('LEFT',    37)
                        .replace('RIGHT',   39)
                        .replace('ENTER',   13)
                        .replace('DEL',     46)
                        .replace('INS',     45);
               
                
            
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
    
    keys.down[ hotkey.pop() ] = function(e){
        
        if (hotkey.length > 0) {
            
            for (var i in hotkey) {
                
                if (    !(hotkey[i] == 'ALT'  && e.altKey) && 
                        !(hotkey[i] == 'CTRL' && e.ctrlKey) &&
                        !(hotkey[i] == 'SHIFT' && e.shiftKey)
                    ) {
                    
                    return;
                }
                
                /*
                if ( !keys.state[ hotkey[i] ]) {
                    
                    
                    //console.log('keys.state['+hotkey[i]+'] == '+keys.state[ hotkey[i] ])
                    return;
                }*/
            }
        }
        //console.log('callback');
        callback(e);
    };
};