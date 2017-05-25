/**
 * Word 2003 XML Document creator
 * 
 * @author connect
 */

var WordXML = function(){
    
    var self         = this,
        model        = [],
        xmlHeader    = '',
        xmlParagraph = { 
            header: '<wx:sub-section>', 
            footer: '</wx:sub-section>'
        };
        
    var xmlFooter = function(){
        
        var xml   = '<w:sectPr wsp:rsidR="00F5599D" wsp:rsidSect="006A2C22">\
                        <w:pgSz w:w="12240" w:h="15840"/>\
                        <w:pgMar w:top="1134" w:right="850" w:bottom="1134" w:left="1701" w:header="708" w:footer="708" w:gutter="0"/>\
                        <w:cols w:space="708"/>\
                        <w:docGrid w:line-pitch="360"/>\
                    </w:sectPr>\
                </wx:sect>\
            </w:body>\
            </w:wordDocument>';
        
        return xml;
    };
    
    self.addAction = function(actionText, actionLink){
        
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
                    </w:p>',
            current = model.length-1;
        
        model[current].actions.push(xml);
    };
    
    self.createDocument = function(bookTitle, author){
        
        xmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\
                    <?mso-application progid="Word.Document"?>\
                    <w:wordDocument \
                        xmlns:aml="http://schemas.microsoft.com/aml/2001/core" \
                        xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" \
                        xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" \
                        xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" \
                        xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" \
                        xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" \
                        xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" \
                        xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" \
                        xmlns:dt="uuid:C2F41010-65B3-11d1-A29F-00AA00C14882" \
                        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" \
                        xmlns:o="urn:schemas-microsoft-com:office:office" \
                        xmlns:v="urn:schemas-microsoft-com:vml" \
                        xmlns:w10="urn:schemas-microsoft-com:office:word" \
                        xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml" \
                        xmlns:wx="http://schemas.microsoft.com/office/word/2003/auxHint" \
                        xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" \
                        xmlns:wsp="http://schemas.microsoft.com/office/word/2003/wordml/sp2" \
                        xmlns:sl="http://schemas.microsoft.com/schemaLibrary/2003/core" \
                        w:macrosPresent="no" \
                        w:embeddedObjPresent="no" \
                        w:ocxPresent="no" \
                        xml:space="preserve">\
                    <w:ignoreSubtree w:val="http://schemas.microsoft.com/office/word/2003/wordml/sp2"/>\
                    <o:DocumentProperties>\
                        <o:Author></o:Author>\
                        <o:LastAuthor></o:LastAuthor>\
                        <o:Revision>0</o:Revision>\
                        <o:TotalTime>0</o:TotalTime>\
                        <o:Created>0</o:Created>\
                        <o:LastSaved>0</o:LastSaved>\
                        <o:Pages>0</o:Pages>\
                        <o:Words>0</o:Words>\
                        <o:Characters>0</o:Characters>\
                        <o:Lines>0</o:Lines>\
                        <o:Paragraphs>0</o:Paragraphs>\
                        <o:CharactersWithSpaces>0</o:CharactersWithSpaces>\
                        <o:Version>0</o:Version>\
                    </o:DocumentProperties>\
                    <w:fonts>\
                        <w:defaultFonts w:ascii="Calibri" w:fareast="Calibri" w:h-ansi="Calibri" w:cs="Times New Roman"/>\
                        <w:font w:name="Times New Roman">\
                            <w:panose-1 w:val="02020603050405020304"/>\
                            <w:charset w:val="CC"/>\
                            <w:family w:val="Roman"/>\
                            <w:pitch w:val="variable"/>\
                            <w:sig w:usb-0="E0002AFF" w:usb-1="C0007841" w:usb-2="00000009" w:usb-3="00000000" w:csb-0="000001FF" w:csb-1="00000000"/>\
                        </w:font>\
                        <w:font w:name="Arial">\
                            <w:panose-1 w:val="020B0604020202020204"/>\
                            <w:charset w:val="CC"/>\
                            <w:family w:val="Swiss"/>\
                            <w:pitch w:val="variable"/>\
                            <w:sig w:usb-0="E0002AFF" w:usb-1="C0007843" w:usb-2="00000009" w:usb-3="00000000" w:csb-0="000001FF" w:csb-1="00000000"/>\
                        </w:font>\
                        <w:font w:name="Cambria Math">\
                            <w:panose-1 w:val="02040503050406030204"/>\
                            <w:charset w:val="CC"/>\
                            <w:family w:val="Roman"/>\
                            <w:pitch w:val="variable"/>\
                            <w:sig w:usb-0="E00002FF" w:usb-1="420024FF" w:usb-2="00000000" w:usb-3="00000000" w:csb-0="0000019F" w:csb-1="00000000"/>\
                        </w:font>\
                        <w:font w:name="Calibri">\
                            <w:panose-1 w:val="020F0502020204030204"/>\
                            <w:charset w:val="CC"/>\
                            <w:family w:val="Swiss"/>\
                            <w:pitch w:val="variable"/>\
                            <w:sig w:usb-0="E00002FF" w:usb-1="4000ACFF" w:usb-2="00000001" w:usb-3="00000000" w:csb-0="0000019F" w:csb-1="00000000"/>\
                        </w:font>\
                    </w:fonts>\
                    <w:styles>\
                        <w:versionOfBuiltInStylenames w:val="7"/>\
                        <w:latentStyles w:defLockedState="off" w:latentStyleCount="374">\
                            <w:lsdException w:name="Normal"/>\
                            <w:lsdException w:name="heading 1"/>\
                            <w:lsdException w:name="heading 2"/>\
                            <w:lsdException w:name="heading 3"/>\
                            <w:lsdException w:name="heading 4"/>\
                            <w:lsdException w:name="heading 5"/>\
                            <w:lsdException w:name="heading 6"/>\
                            <w:lsdException w:name="heading 7"/>\
                            <w:lsdException w:name="heading 8"/>\
                            <w:lsdException w:name="heading 9"/>\
                            <w:lsdException w:name="caption"/>\
                            <w:lsdException w:name="Title"/>\
                            <w:lsdException w:name="Subtitle"/>\
                            <w:lsdException w:name="Strong"/>\
                            <w:lsdException w:name="Emphasis"/>\
                            <w:lsdException w:name="Normal Table"/>\
                            <w:lsdException w:name="Table Simple 1"/>\
                            <w:lsdException w:name="Table Simple 2"/>\
                            <w:lsdException w:name="Table Simple 3"/>\
                            <w:lsdException w:name="Table Classic 1"/>\
                            <w:lsdException w:name="Table Classic 2"/>\
                            <w:lsdException w:name="Table Classic 3"/>\
                            <w:lsdException w:name="Table Classic 4"/>\
                            <w:lsdException w:name="Table Colorful 1"/>\
                            <w:lsdException w:name="Table Colorful 2"/>\
                            <w:lsdException w:name="Table Colorful 3"/>\
                            <w:lsdException w:name="Table Columns 1"/>\
                            <w:lsdException w:name="Table Columns 2"/>\
                            <w:lsdException w:name="Table Columns 3"/>\
                            <w:lsdException w:name="Table Columns 4"/>\
                            <w:lsdException w:name="Table Columns 5"/>\
                            <w:lsdException w:name="Table Grid 1"/>\
                            <w:lsdException w:name="Table Grid 2"/>\
                            <w:lsdException w:name="Table Grid 3"/>\
                            <w:lsdException w:name="Table Grid 4"/>\
                            <w:lsdException w:name="Table Grid 5"/>\
                            <w:lsdException w:name="Table Grid 6"/>\
                            <w:lsdException w:name="Table Grid 7"/>\
                            <w:lsdException w:name="Table Grid 8"/>\
                            <w:lsdException w:name="Table List 1"/>\
                            <w:lsdException w:name="Table List 2"/>\
                            <w:lsdException w:name="Table List 3"/>\
                            <w:lsdException w:name="Table List 4"/>\
                            <w:lsdException w:name="Table List 5"/>\
                            <w:lsdException w:name="Table List 6"/>\
                            <w:lsdException w:name="Table List 7"/>\
                            <w:lsdException w:name="Table List 8"/>\
                            <w:lsdException w:name="Table 3D effects 1"/>\
                            <w:lsdException w:name="Table 3D effects 2"/>\
                            <w:lsdException w:name="Table 3D effects 3"/>\
                            <w:lsdException w:name="Table Contemporary"/>\
                            <w:lsdException w:name="Table Elegant"/>\
                            <w:lsdException w:name="Table Professional"/>\
                            <w:lsdException w:name="Table Subtle 1"/>\
                            <w:lsdException w:name="Table Subtle 2"/>\
                            <w:lsdException w:name="Table Web 1"/>\
                            <w:lsdException w:name="Table Web 2"/>\
                            <w:lsdException w:name="Table Web 3"/>\
                            <w:lsdException w:name="Table Theme"/>\
                            <w:lsdException w:name="No Spacing"/>\
                            <w:lsdException w:name="Light Shading"/>\
                            <w:lsdException w:name="Light List"/>\
                            <w:lsdException w:name="Light Grid"/>\
                            <w:lsdException w:name="Medium Shading 1"/>\
                            <w:lsdException w:name="Medium Shading 2"/>\
                            <w:lsdException w:name="Medium List 1"/>\
                            <w:lsdException w:name="Medium List 2"/>\
                            <w:lsdException w:name="Medium Grid 1"/>\
                            <w:lsdException w:name="Medium Grid 2"/>\
                            <w:lsdException w:name="Medium Grid 3"/>\
                            <w:lsdException w:name="Dark List"/>\
                            <w:lsdException w:name="Colorful Shading"/>\
                            <w:lsdException w:name="Colorful List"/>\
                            <w:lsdException w:name="Colorful Grid"/>\
                            <w:lsdException w:name="Light Shading Accent 1"/>\
                            <w:lsdException w:name="Light List Accent 1"/>\
                            <w:lsdException w:name="Light Grid Accent 1"/>\
                            <w:lsdException w:name="Medium Shading 1 Accent 1"/>\
                            <w:lsdException w:name="Medium Shading 2 Accent 1"/>\
                            <w:lsdException w:name="Medium List 1 Accent 1"/>\
                            <w:lsdException w:name="List Paragraph"/>\
                            <w:lsdException w:name="Quote"/>\
                            <w:lsdException w:name="Intense Quote"/>\
                            <w:lsdException w:name="Medium List 2 Accent 1"/>\
                            <w:lsdException w:name="Medium Grid 1 Accent 1"/>\
                            <w:lsdException w:name="Medium Grid 2 Accent 1"/>\
                            <w:lsdException w:name="Medium Grid 3 Accent 1"/>\
                            <w:lsdException w:name="Dark List Accent 1"/>\
                            <w:lsdException w:name="Colorful Shading Accent 1"/>\
                            <w:lsdException w:name="Colorful List Accent 1"/>\
                            <w:lsdException w:name="Colorful Grid Accent 1"/>\
                            <w:lsdException w:name="Light Shading Accent 2"/>\
                            <w:lsdException w:name="Light List Accent 2"/>\
                            <w:lsdException w:name="Light Grid Accent 2"/>\
                            <w:lsdException w:name="Medium Shading 1 Accent 2"/>\
                            <w:lsdException w:name="Medium Shading 2 Accent 2"/>\
                            <w:lsdException w:name="Medium List 1 Accent 2"/>\
                            <w:lsdException w:name="Medium List 2 Accent 2"/>\
                            <w:lsdException w:name="Medium Grid 1 Accent 2"/>\
                            <w:lsdException w:name="Medium Grid 2 Accent 2"/>\
                            <w:lsdException w:name="Medium Grid 3 Accent 2"/>\
                            <w:lsdException w:name="Dark List Accent 2"/>\
                            <w:lsdException w:name="Colorful Shading Accent 2"/>\
                            <w:lsdException w:name="Colorful List Accent 2"/>\
                            <w:lsdException w:name="Colorful Grid Accent 2"/>\
                            <w:lsdException w:name="Light Shading Accent 3"/>\
                            <w:lsdException w:name="Light List Accent 3"/>\
                            <w:lsdException w:name="Light Grid Accent 3"/>\
                            <w:lsdException w:name="Medium Shading 1 Accent 3"/>\
                            <w:lsdException w:name="Medium Shading 2 Accent 3"/>\
                            <w:lsdException w:name="Medium List 1 Accent 3"/>\
                            <w:lsdException w:name="Medium List 2 Accent 3"/>\
                            <w:lsdException w:name="Medium Grid 1 Accent 3"/>\
                            <w:lsdException w:name="Medium Grid 2 Accent 3"/>\
                            <w:lsdException w:name="Medium Grid 3 Accent 3"/>\
                            <w:lsdException w:name="Dark List Accent 3"/>\
                            <w:lsdException w:name="Colorful Shading Accent 3"/>\
                            <w:lsdException w:name="Colorful List Accent 3"/>\
                            <w:lsdException w:name="Colorful Grid Accent 3"/>\
                            <w:lsdException w:name="Light Shading Accent 4"/>\
                            <w:lsdException w:name="Light List Accent 4"/>\
                            <w:lsdException w:name="Light Grid Accent 4"/>\
                            <w:lsdException w:name="Medium Shading 1 Accent 4"/>\
                            <w:lsdException w:name="Medium Shading 2 Accent 4"/>\
                            <w:lsdException w:name="Medium List 1 Accent 4"/>\
                            <w:lsdException w:name="Medium List 2 Accent 4"/>\
                            <w:lsdException w:name="Medium Grid 1 Accent 4"/>\
                            <w:lsdException w:name="Medium Grid 2 Accent 4"/>\
                            <w:lsdException w:name="Medium Grid 3 Accent 4"/>\
                            <w:lsdException w:name="Dark List Accent 4"/>\
                            <w:lsdException w:name="Colorful Shading Accent 4"/>\
                            <w:lsdException w:name="Colorful List Accent 4"/>\
                            <w:lsdException w:name="Colorful Grid Accent 4"/>\
                            <w:lsdException w:name="Light Shading Accent 5"/>\
                            <w:lsdException w:name="Light List Accent 5"/>\
                            <w:lsdException w:name="Light Grid Accent 5"/>\
                            <w:lsdException w:name="Medium Shading 1 Accent 5"/>\
                            <w:lsdException w:name="Medium Shading 2 Accent 5"/>\
                            <w:lsdException w:name="Medium List 1 Accent 5"/>\
                            <w:lsdException w:name="Medium List 2 Accent 5"/>\
                            <w:lsdException w:name="Medium Grid 1 Accent 5"/>\
                            <w:lsdException w:name="Medium Grid 2 Accent 5"/>\
                            <w:lsdException w:name="Medium Grid 3 Accent 5"/>\
                            <w:lsdException w:name="Dark List Accent 5"/>\
                            <w:lsdException w:name="Colorful Shading Accent 5"/>\
                            <w:lsdException w:name="Colorful List Accent 5"/>\
                            <w:lsdException w:name="Colorful Grid Accent 5"/>\
                            <w:lsdException w:name="Light Shading Accent 6"/>\
                            <w:lsdException w:name="Light List Accent 6"/>\
                            <w:lsdException w:name="Light Grid Accent 6"/>\
                            <w:lsdException w:name="Medium Shading 1 Accent 6"/>\
                            <w:lsdException w:name="Medium Shading 2 Accent 6"/>\
                            <w:lsdException w:name="Medium List 1 Accent 6"/>\
                            <w:lsdException w:name="Medium List 2 Accent 6"/>\
                            <w:lsdException w:name="Medium Grid 1 Accent 6"/>\
                            <w:lsdException w:name="Medium Grid 2 Accent 6"/>\
                            <w:lsdException w:name="Medium Grid 3 Accent 6"/>\
                            <w:lsdException w:name="Dark List Accent 6"/>\
                            <w:lsdException w:name="Colorful Shading Accent 6"/>\
                            <w:lsdException w:name="Colorful List Accent 6"/>\
                            <w:lsdException w:name="Colorful Grid Accent 6"/>\
                            <w:lsdException w:name="Subtle Emphasis"/>\
                            <w:lsdException w:name="Intense Emphasis"/>\
                            <w:lsdException w:name="Subtle Reference"/>\
                            <w:lsdException w:name="Intense Reference"/>\
                            <w:lsdException w:name="Book Title"/>\
                            <w:lsdException w:name="TOC Heading"/>\
                        </w:latentStyles>\
                        <w:style w:type="paragraph" w:default="on" w:styleId="Normal">\
                            <w:name w:val="Normal"/>\
                            <w:rsid w:val="00B45EC0"/>\
                            <w:pPr>\
                                <w:spacing w:after="200" w:line="276" w:line-rule="auto"/>\
                            </w:pPr>\
                            <w:rPr>\
                                <w:rFonts w:ascii="Arial" w:h-ansi="Arial"/>\
                                <wx:font wx:val="Arial"/>\
                                <w:sz w:val="22"/>\
                                <w:sz-cs w:val="22"/>\
                                <w:lang w:val="EN-US" w:fareast="EN-US" w:bidi="AR-SA"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="paragraph" w:styleId="Heading1">\
                            <w:name w:val="heading 1"/>\
                            <w:aliases w:val="Paragraph Number"/>\
                            <wx:uiName wx:val="Heading 1"/>\
                            <w:basedOn w:val="Normal"/>\
                            <w:next w:val="Normal"/>\
                            <w:link w:val="Heading1Char"/>\
                            <w:rsid w:val="00B45EC0"/>\
                            <w:pPr>\
                                <w:keepNext/>\
                                <w:keepLines/>\
                                <w:spacing w:before="240" w:after="0"/>\
                                <w:outlineLvl w:val="0"/>\
                            </w:pPr>\
                            <w:rPr>\
                                <w:rFonts w:fareast="Times New Roman"/>\
                                <wx:font wx:val="Arial"/>\
                                <w:b/>\
                                <w:sz w:val="28"/>\
                                <w:sz-cs w:val="32"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:default="on" w:styleId="DefaultParagraphFont">\
                            <w:name w:val="Default Paragraph Font"/>\
                        </w:style>\
                        <w:style w:type="table" w:default="on" w:styleId="TableNormal">\
                            <w:name w:val="Normal Table"/>\
                            <wx:uiName wx:val="Table Normal"/>\
                            <w:rPr>\
                                <wx:font wx:val="Calibri"/>\
                                <w:lang w:val="RU" w:fareast="RU" w:bidi="AR-SA"/>\
                            </w:rPr>\
                            <w:tblPr>\
                                <w:tblInd w:w="0" w:type="dxa"/>\
                                <w:tblCellMar>\
                                    <w:top w:w="0" w:type="dxa"/>\
                                    <w:left w:w="108" w:type="dxa"/>\
                                    <w:bottom w:w="0" w:type="dxa"/>\
                                    <w:right w:w="108" w:type="dxa"/>\
                                </w:tblCellMar>\
                            </w:tblPr>\
                        </w:style>\
                        <w:style w:type="list" w:default="on" w:styleId="NoList">\
                            <w:name w:val="No List"/>\
                        </w:style>\
                        <w:style w:type="paragraph" w:styleId="Title">\
                            <w:name w:val="Title"/>\
                            <w:aliases w:val="Questbook Title"/>\
                            <w:basedOn w:val="Normal"/>\
                            <w:next w:val="Normal"/>\
                            <w:link w:val="TitleChar"/>\
                            <w:rsid w:val="007314A7"/>\
                            <w:pPr>\
                                <w:spacing w:after="0" w:line="240" w:line-rule="auto"/>\
                                <w:contextualSpacing/>\
                            </w:pPr>\
                            <w:rPr>\
                            <w:rFonts w:ascii="Times New Roman" w:fareast="Times New Roman" w:h-ansi="Times New Roman"/>\
                            <wx:font wx:val="Times New Roman"/>\
                            <w:spacing w:val="-10"/>\
                            <w:kern w:val="28"/>\
                            <w:sz w:val="56"/>\
                            <w:sz-cs w:val="56"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="TitleChar">\
                            <w:name w:val="Title Char"/>\
                            <w:aliases w:val="Questbook Title Char"/>\
                            <w:link w:val="Title"/>\
                            <w:rsid w:val="007314A7"/>\
                            <w:rPr>\
                                <w:rFonts w:ascii="Times New Roman" w:fareast="Times New Roman" w:h-ansi="Times New Roman"/>\
                                <w:spacing w:val="-10"/>\
                                <w:kern w:val="28"/>\
                                <w:sz w:val="56"/>\
                                <w:sz-cs w:val="56"/>\
                                <w:lang w:val="EN-US" w:fareast="EN-US"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="Heading1Char">\
                            <w:name w:val="Heading 1 Char"/>\
                            <w:aliases w:val="Paragraph Number Char"/>\
                            <w:link w:val="Heading1"/>\
                            <w:rsid w:val="00B45EC0"/>\
                            <w:rPr>\
                                <w:rFonts w:ascii="Arial" w:fareast="Times New Roman" w:h-ansi="Arial"/>\
                                <w:b/>\
                                <w:sz w:val="28"/>\
                                <w:sz-cs w:val="32"/>\
                                <w:lang w:val="EN-US" w:fareast="EN-US"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="Emphasis">\
                            <w:name w:val="Emphasis"/>\
                            <w:aliases w:val="Action Text"/>\
                            <w:rsid w:val="007314A7"/>\
                            <w:rPr>\
                                <w:rFonts w:ascii="Arial" w:h-ansi="Arial"/>\
                                <w:i w:val="off"/>\
                                <w:i-cs w:val="off"/>\
                                <w:color w:val="auto"/>\
                                <w:sz w:val="20"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="Strong">\
                            <w:name w:val="Strong"/>\
                            <w:aliases w:val="Action Number"/>\
                            <w:rsid w:val="00B45EC0"/>\
                            <w:rPr>\
                            <w:rFonts w:ascii="Arial" w:h-ansi="Arial"/>\
                            <w:b/>\
                            <w:b-cs/>\
                            <w:color w:val="0563C1"/>\
                            <w:sz w:val="20"/>\
                            <w:u w:val="single"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="paragraph" w:styleId="Subtitle">\
                            <w:name w:val="Subtitle"/>\
                            <w:aliases w:val="Author"/>\
                            <w:basedOn w:val="Normal"/>\
                            <w:next w:val="Normal"/>\
                            <w:link w:val="SubtitleChar"/>\
                            <w:rsid w:val="007314A7"/>\
                            <w:pPr>\
                            <w:listPr>\
                            <w:ilvl w:val="1"/>\
                            </w:listPr>\
                            <w:spacing w:after="160"/>\
                            </w:pPr>\
                            <w:rPr>\
                            <w:rFonts w:fareast="Times New Roman"/>\
                            <wx:font wx:val="Arial"/>\
                            <w:color w:val="5A5A5A"/>\
                            <w:spacing w:val="15"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="SubtitleChar">\
                            <w:name w:val="Subtitle Char"/>\
                            <w:aliases w:val="Author Char"/>\
                            <w:link w:val="Subtitle"/>\
                            <w:rsid w:val="007314A7"/>\
                            <w:rPr>\
                            <w:rFonts w:ascii="Arial" w:fareast="Times New Roman" w:h-ansi="Arial"/>\
                            <w:color w:val="5A5A5A"/>\
                            <w:spacing w:val="15"/>\
                            <w:sz w:val="22"/>\
                            <w:sz-cs w:val="22"/>\
                            <w:lang w:val="EN-US" w:fareast="EN-US"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="IntenseEmphasis">\
                            <w:name w:val="Intense Emphasis"/>\
                            <w:rsid w:val="007314A7"/>\
                            <w:rPr>\
                            <w:i/>\
                            <w:i-cs/>\
                            <w:color w:val="5B9BD5"/>\
                            </w:rPr>\
                        </w:style>\
                        <w:style w:type="character" w:styleId="Hyperlink">\
                            <w:name w:val="Hyperlink"/>\
                            <w:rsid w:val="00B45EC0"/>\
                            <w:rPr>\
                                <w:color w:val="0563C1"/>\
                                <w:u w:val="single"/>\
                            </w:rPr>\
                        </w:style>\
                    </w:styles>\
                    <w:shapeDefaults>\
                        <o:shapedefaults v:ext="edit" spidmax="1026"/>\
                        <o:shapelayout v:ext="edit">\
                            <o:idmap v:ext="edit" data="1"/>\
                        </o:shapelayout>\
                    </w:shapeDefaults>\
                    <w:docPr>\
                        <w:view w:val="print"/>\
                        <w:zoom w:percent="120"/>\
                        <w:doNotEmbedSystemFonts/>\
                        <w:proofState w:spelling="clean" w:grammar="clean"/>\
                        <w:stylePaneFormatFilter w:val="1021"/>\
                        <w:defaultTabStop w:val="720"/>\
                        <w:punctuationKerning/>\
                        <w:characterSpacingControl w:val="DontCompress"/>\
                        <w:optimizeForBrowser/>\
                        <w:allowPNG/>\
                        <w:validateAgainstSchema/>\
                        <w:saveInvalidXML w:val="off"/>\
                        <w:ignoreMixedContent w:val="off"/>\
                        <w:alwaysShowPlaceholderText w:val="off"/>\
                        <w:compat>\
                            <w:breakWrappedTables/>\
                            <w:snapToGridInCell/>\
                            <w:wrapTextWithPunct/>\
                            <w:useAsianBreakRules/>\
                            <w:dontGrowAutofit/>\
                        </w:compat>\
                        <wsp:rsids>\
                            <wsp:rsidRoot wsp:val="00F5599D"/>\
                            <wsp:rsid wsp:val="00215EBF"/>\
                            <wsp:rsid wsp:val="006A2C22"/>\
                            <wsp:rsid wsp:val="007314A7"/>\
                            <wsp:rsid wsp:val="008A4A32"/>\
                            <wsp:rsid wsp:val="00B45EC0"/>\
                            <wsp:rsid wsp:val="00F5599D"/>\
                        </wsp:rsids>\
                    </w:docPr>\
                    <w:body>\
                        <wx:sect>\
                            <w:p wsp:rsidR="00215EBF" wsp:rsidRDefault="00F5599D" wsp:rsidP="007314A7">\
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
    };
    
    self.addParagraph = function(parID){
        
        model.push({
            
            header  :  '<w:p wsp:rsidR="00F5599D" wsp:rsidRDefault="00F5599D" wsp:rsidP="00F5599D">\
                            <w:pPr>\
                            <w:pStyle w:val="Heading1"/>\
                            </w:pPr>\
                            <w:proofErr w:type="spellStart"/>\
                            <w:r>\
                            <w:t>\
                            '+parID+'</w:t>\
                            </w:r>\
                            <w:proofErr w:type="spellEnd"/>\
                        </w:p>',
            texts   : [],
            actions : []            
        });
    };
    
    self.addText = function(paragraphText){
        
        var xml   = '<w:p wsp:rsidR="00F5599D" wsp:rsidRDefault="00F5599D">\
                        <w:proofErr w:type="spellStart"/>\
                        <w:r>\
                            <w:t>'+ paragraphText +'</w:t>\
                        </w:r>\
                        <w:proofErr w:type="spellEnd"/>\
                    </w:p>',
            current = model.length-1;
        
        model[current].texts.push(xml);
    };
       
    self.buildDocument = function(){
        
        var doc = [ xmlHeader ];
        
        for (var i in model){

            var tpar = model[i],
                j;
        
            doc.push(xmlParagraph.header);
            doc.push(tpar.header);
            
            for (j in tpar.texts){
                
                doc.push( tpar.texts[j] );
            }
            
            for (j in tpar.actions){
                
                doc.push( tpar.actions[j] );
            }
            
            doc.push(xmlParagraph.footer);
        }
        
        doc.push( xmlFooter() );
                
        return doc.join('');
    };    
};

WordXML = new WordXML();

/*
WordXML.createDocument('My Book', 'connect');

WordXML.addParagraph(0);
WordXML.addText('zero paragraph');
WordXML.addAction('goto 1', 1);

WordXML.addParagraph(1);
WordXML.addText('first paragraph');
WordXML.addAction('goto 2', 2);

WordXML.addParagraph(2);
WordXML.addText('second paragraph');
WordXML.addAction('goto 0', 0);

doc = WordXML.buildDocment();

*/