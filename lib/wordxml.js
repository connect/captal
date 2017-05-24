/**
 * Word 2003 XML Document creator
 * 
 * @author connect
 */

var WordXML = function(o){
    
    var self = this,
        xmlHeader  = '',
        xmlBody    = [],
        xmlFooter  = '';
    
    self.addAction = function( actionText, actionLink){
        
        var xml  = '<w:p wsp:rsidR="00F5599D" wsp:rsidRDefault="00F5599D">\
                        <w:proofErr w:type="spellStart"/>\
                        <w:r wsp:rsidRPr="00F5599D">\
                            <w:rPr>\
                                <w:rStyle w:val="Emphasis"/>\
                            </w:rPr>\
                            <w:t>'+ actionText +'</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellEnd"/>\
                        <w:r>\
                            <w:t> (</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellStart"/>\
                        <w:r wsp:rsidRPr="00F5599D">\
                            <w:rPr>\
                                <w:rStyle w:val="Strong"/>\
                            </w:rPr>\
                            <w:t>'+ actionLink +'</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellEnd"/>\
                        <w:r>\
                            <w:t>)</w:t>\
                        </w:r>\
                    </w:p>';
        
        return xml;
    };
    
    self.addHeader = function(bookTitle, author){
        
        var xml   = '<w:p wsp:rsidR="00215EBF" wsp:rsidRDefault="00F5599D" wsp:rsidP="007314A7">\
                        <w:pPr>\
                            <w:pStyle w:val="Title"/>\
                        </w:pPr>\
                        <w:proofErr w:type="spellStart"/>\
                        <w:r wsp:rsidRPr="007314A7">\
                            <w:t>'+ bookTitle +'</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellEnd"/>\
                    </w:p>\
                    <w:p wsp:rsidR="00F5599D" wsp:rsidRDefault="00F5599D" wsp:rsidP="00F5599D">\
                        <w:pPr>\
                        <w:pStyle w:val="Subtitle"/>\
                        </w:pPr>\
                        <w:r>\
                            <w:t>'+ author +'</w:t>\
                        </w:r>\
                    </w:p>';
        
        return xml;
    };
    
    self.addParagraph = function( xmlParagraphNum, xmlParagraphText, xmlActions ){
        
        xmlBody.push()
        
        var xml   = '<wx:sub-section>'+
                        xmlParagraphNum +
                        xmlParagraphText +
                        xmlActions +
                    '</wx:sub-section>';
            
        return xml;
    };
    
    self.addParagraphNum = function(parID){
        
        var xml   = '<w:p wsp:rsidR="00F5599D" wsp:rsidRDefault="00F5599D" wsp:rsidP="00F5599D">\
                        <w:pPr>\
                            <w:pStyle w:val="Heading1"/>\
                        </w:pPr>\
                        <w:proofErr w:type="spellStart"/>\
                        <w:r>\
                            <w:t>'+ parID +'</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellEnd"/>\
                    </w:p>';
        
        return xml;
    };
    
    self.addParagraphText = function(paragraphText){
        
        var xml   = '<w:p wsp:rsidR="00F5599D" wsp:rsidRDefault="00F5599D">\
                        <w:proofErr w:type="spellStart"/>\
                        <w:r>\
                            <w:t>'+ paragraphText +'</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellEnd"/>\
                    </w:p>';
        
        return xml;
    };
    
    self.build = function(){
        
        var xml = '';
                
        return xml;
    };    
};


WordXML.create( bookTitle, author );
WordXML.addParagraph(parID);
WordXML.addText( paragraphText );
WordXML.addAction( actionText, actionLink);
WordXML.build();
