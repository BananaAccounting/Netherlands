// Copyright [2021] [Banana.ch SA - Lugano Switzerland]
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// @id = ch.banana.nl.app.btw.declaration.report.js
// @api = 1.0
// @pubdate = 2021-11-05
// @publisher = Banana.ch SA
// @description.en = BTW Declaration NL [BETA]
// @description.nl = BTW Verklaring NL [BETA]
// @doctype = *.*
// @outputformat = none
// @inputdataform = none
// @task = app.command
// @inputdatasource = none
// @timeout = -1

/*
*   SUMMARY
*
*   This Exstension creates a VAT delcaration report for Netherland.
*
*   specific:
*   -All amounts should be without decimals and rounded down
*   -User should decide the period
*/

/**
 * REPORT STRUCTURE
 * 
 * Title: BTW REPORT 01-01-2021/31-12-2021
 * 
 * 3 Columns table: from Rubriek1 to Rubriek 4
 * 
 *              Group description                            Sales           VAT     
 * 
 * |1a. Leveringen/diensten belast met hoog tarief      | 250'000.00    |   52'200.00
 * |1b. Leveringen/diensten belast met laag tarief      | 866'000.00    |   77'940.00
 * |1c. Leveringen/diensten belast met overige tarieven |  16'700.00    |       -
 * |...                                                 |               |
 * |...                                                 |               |
 * 
 * 2 Columns Table: from rubriek 5
 * 
 *  *              Group description                                           VAT     
 * 
 * |5a. Verschuldigde omzetbelasting (rubrieken 1 t/m 4)|                     130'140.00
 * |5b. Voorbelasting                                   |                     77'940.00
 * |Eindtotaal                                          |                     52'200.00             
 * 
 * 
 */


 var BTWDeclarationReport = class BTWDeclarationReport {

    constructor(banDoc){
        this.banDoc=banDoc;
        this.rubSum="";
    }

    getReportTable(report) {
        var tableBalance = report.addTable('reportTable');
        tableBalance.getCaption().addText("BTW Report 01.01.2021/31.12.2021", "");
        //columns
        tableBalance.addColumn("c1").setStyleAttributes("width:60%");
        tableBalance.addColumn("c2").setStyleAttributes("width:20%");
        tableBalance.addColumn("c3").setStyleAttributes("width:20%");

        return tableBalance;
    }

    printReport(){

        let codes=this.getBtwCodes();
        //create the report
        var report = Banana.Report.newReport('BTW declaration Report');

        //add the table
        var reportTable = this.getReportTable(report);

        //RUBRIEK1 1
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rubriek 1: Prestaties binnenland", "styleRubriekTitle",3);

        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "");
        tableRow.addCell("Omzet", "");
        tableRow.addCell("Omzetbelasting", "");

        //1a. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"1a");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1a. Leveringen/diensten belast met hoog tarief", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //1b. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"1b");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1b. Leveringen/diensten belast met laag tarief", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //1c. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"1c");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1c. Leveringen/diensten belast met overige tarieven, behalve 0%", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //1d. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"1d");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1d. Privégebruik", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //1e. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"1d");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1e. Leveringen/diensten belast met 0% of niet bij u belast", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //RUBRIEK 2
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rubriek 2: Verleggingsregellingen", "styleRubriekTitle",3);

        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "");
        tableRow.addCell("Omzet", "");
        tableRow.addCell("Omzetbelasting", "");

        //2a. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"2a");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("2a. Leveringen/diensten waarbij de omzetbelasting naas u is vergled", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //RUBRIEK 3
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rubriek 3: Prestaties naar of in het buitenland", "styleRubriekTitle",3);

        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "");
        tableRow.addCell("Omzet", "");
        tableRow.addCell("Omzetbelasting", "");

        //3a. Line
        //Omzet
        //Omzetbelasting
        var tableRow = reportTable.addRow("");
        tableRow.addCell("3a. Leveringen naar landen buiten de EU (uitvoer)", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell("", "styleAmount");

        //3b. Line
        //Omzet
        //Omzetbelasting
        var tableRow = reportTable.addRow("");
        tableRow.addCell("3b. Leveringen naar of diensten in landen binnen de EU", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell("", "styleAmount");

        //3c. Line
        //Omzet
        //Omzetbelasting
        var tableRow = reportTable.addRow("");
        tableRow.addCell("3c. Installatie/ afstandsverkopen binnen de EU", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell("", "styleAmount");


        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //RUBRIEK 4
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rubriek 4: Prestaties vanuit het buitenland aan u verricht", "styleRubriekTitle",3);

        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "");
        tableRow.addCell("Omzet", "");
        tableRow.addCell("Omzetbelasting", "");

        //4a. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"4a");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("4a. Leveringen/diensten uit landen buiten de EU", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");

        //4b. Line
        //Omzet
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"4b");
        var vatCurrBal=this.banDoc.vatCurrentBalance(lineParam);
        var tableRow = reportTable.addRow("");
        tableRow.addCell("4b. Leveringen/diensten uit landen binnen de EU", "");
        tableRow.addCell("", "styleAmount");
        this.rubSum=Banana.SDecimal.add(this.rubSum,vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(vatCurrBal.vatAmount,'0.00'),0,true), "styleAmount");


        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //RUBRIEK 5
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rubriek 5: Voorbelasting, kleineondernemersregeling en eindtotaal", "styleRubriekTitle",3);

        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "");
        tableRow.addCell("", "");
        tableRow.addCell("Omzetbelasting", "");

        //5a. Line
        //Omzetbelasting
        var tableRow = reportTable.addRow("");
        tableRow.addCell("5a. Verschuldigde omzetbelasting (rubrieken 1t/m 4)", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(this.rubSum,'0.00'),0,true), "styleAmount");

        //5b Line (chiedere cosa e)
        //Omzetbelasting
        var lineParam=this.setParamCodes(codes,"4a");
        var tableRow = reportTable.addRow("");
        tableRow.addCell("5b. Voorbelasting", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell("", "styleAmount");


        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);


        //total row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Eindtotaal", "");
        tableRow.addCell("", "styleAmount");
        tableRow.addCell("", "styleAmount");


        return report;

    }

    /**
     * This method sets the string that will be passed to the vatCurrentBalance() function. 
     * The string is constructed on the basis of the gr1 parameter, 
     * all codes in the codes array that have the property gr1Code=gr1 are inserted into the string,
     * which is then formatted to match the structure expected by the current balance function.
     */
    setParamCodes(vatCodes, gr1){
        var  paramCodes="";

        for( var row in vatCodes ){
            let code=vatCodes[row];
            if(code.gr1Code==gr1)
                paramCodes+=code.vatCode+"|";
        }

        //in case the string ends with a '|' i cut off the last char.
        var strLen=paramCodes.length;
        if(paramCodes.substr(strLen-1)=="|"){
            var slicePos=strLen-1
            paramCodes=paramCodes.substr(0,slicePos);
        }
        return paramCodes;
    }

    /**
     * Retrieves from the vat codes table all the vat codes together with their associated gr1 group and saves everything in an object.
     * @returns 
     */
    getBtwCodes(){
        var codes=[];
        var table = this.banDoc.table("VatCodes");
        if (!table)
            return btwCode;

        for (var i = 0; i < table.rowCount; i++) {
            var btwCode={};
            var tRow = table.row(i);
            var vatCode = tRow.value("VatCode");
            var gr1Code= tRow.value("Gr1");

            if (vatCode && gr1Code) {
  
                btwCode.vatCode=vatCode;
                btwCode.gr1Code=gr1Code;

                codes.push(btwCode);
                //Banana.console.debug(JSON.stringify(btwCode));
            }
        }

        return codes;
    }

    getReportStyle() {
        var textCSS = "";
        var file = Banana.IO.getLocalFile("file:script/ch.banana.nl.app.btw.declaration.report.css");
        var fileContent = file.read();
        if (!file.errorString) {
            Banana.IO.openPath(fileContent);
            //Banana.console.log(fileContent);
            textCSS = fileContent;
        } else {
            Banana.console.log(file.errorString);
        }

        var stylesheet = Banana.Report.newStyleSheet();
        // Parse the CSS text
        stylesheet.parse(textCSS);

        return stylesheet;
    }
 }

 function exec(inData, options) {

    if (!Banana.document)
        return "@Cancel";

    var btwDeclarationReport= new BTWDeclarationReport(Banana.document);
    var report = btwDeclarationReport.printReport();
    var stylesheet = btwDeclarationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}