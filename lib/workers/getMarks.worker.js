onmessage = function(e){
    
    var text    = e.data.text,
        num     = e.data.num,
        marks   = e.data.marks,
        unknown = true,
        prevCh, nextCh,
        prefix, affix,
        left, right;
        
    
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

                // if right character is space
                if (nextCh == 32){
                    // thats single marker
                    //affix = right[1];
                    affix = '';
                } else {
                    // get everithing up to space
                    affix = right[0];
                }

                // trim right tab chars
                affix = affix.replace(/\t+$/, '');

                // markers can't contain numbers
                if (prefix.match(/\d+/) == null && affix.match(/\d+/) == null) {

                    unknown = true;

                    for (var i in marks){

                       if (marks[i].prefix == prefix && marks[i].affix == affix) {

                            marks[i].freq++;
                            unknown = false;
                            break;
                        }
                    }

                    if ( unknown ) {
                        // new one, store it
                        marks.push({ freq: 1, prefix: prefix, affix: affix });                        
                    }                                                       
                }
            }                    
        }                
        // move selector to next position
        pos = text.indexOf(num,pos+1); 
    }
    
    postMessage(marks);
};