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
// @id = ch.banana.nl.app.btw.evaluation.report.js
// @api = 1.0
// @pubdate = 2021-11-10
// @publisher = Banana.ch SA
// @description.en = BTW Evaluation NL [BETA]
// @description.nl = BTW Evaluatie NL [BETA]
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
*   -All amounts should be without decimals and rounded down, for this reason it is necessary to indicate the accounting amount and the rounding difference.
*   -Divde the year in quarters
*/

/**
 * REPORT STRUCTURE
 * 
 * Title: BTW REPORT 01-01-2021/31-12-2021
 * 
 * 3 Columns table: from Rubriek1 to Rubriek 4
 * 
 * 
 * 
 *                                                               31.03.2021                 30.06.2021              ...for each quarter 
 * 
 *              Group description                            Sales        VAT           Sales         VAT
 * 
 * |1a. Leveringen/diensten belast met hoog tarief      | 250'000    |   52'200        500'000      104'400
 * |1b. Leveringen/diensten belast met laag tarief      | 866'000    |   77'940        230'000       13'200
 * |1c. Leveringen/diensten belast met overige tarieven |  16'700    |     -            20'000          -
 * |...                                                 |            |
 * |...                                                 |            |
 * 
 * 
 *  *              Group description                                       VAT                          VAT  
 * 
 * |5a. Verschuldigde omzetbelasting (rubrieken 1 t/m 4)|                130'140                       117'600
 * |5b. Voorbelasting                                   |                16'000                        5400
 * |Eindtotaal                                          |                114'140                       112'200
 * 
 * 
 */


 var BTWEvaluationReport = class BTWEvaluationReport {

    constructor(banDoc){
        this.banDoc=banDoc;
        this.startDate=this.banDoc.startPeriod();
        this.endDate=this.banDoc.endPeriod();

        //errors
        this.VATCODE_WITHOUT_GR1 = "VATCODE_WITHOUT_GR1";
    }

    getReportTable(report) {
        var tableBalance = report.addTable('reportTable');
        tableBalance.getCaption().addText("Omzetbelasting, Aangifteperiode: "+Banana.Converter.toLocaleDateFormat(this.startDate)+"/"+Banana.Converter.toLocaleDateFormat(this.endDate));
        //columns
        tableBalance.addColumn("c1").setStyleAttributes("width:60%");

        return tableBalance;
    }

    getReportHeader(report){
        var documentInfo=this.getDocumentInfo();
        var headerParagraph = report.getHeader().addSection();
        headerParagraph.addParagraph(documentInfo.company, "styleNormalHeader styleCompanyName");
        headerParagraph.addParagraph(documentInfo.address, "styleNormalHeader");
        headerParagraph.addParagraph(documentInfo.zip+", "+documentInfo.city, "styleNormalHeader");
        headerParagraph.addParagraph("", "");
        headerParagraph.addParagraph("", "");
        headerParagraph.addParagraph("", "");

    }

    /**
     * Defines an object with information on vat code groupings.
     */
    setBtwGrList(){
        var btwGrList={};

        //se cambia gr, chiamo un metodo che a dipendenza del gruppo mi mette la descrizione.

        //FIRST RUBRIEK

        //1a
        btwGrList.firstA={};
        btwGrList.firstA.gr="1";
        btwGrList.firstA.code="1a";
        btwGrList.firstA.description="1a. Leveringen/diensten belast met hoog tarief";
        btwGrList.firstA.hasOmzet=true;
        btwGrList.firstA.hasOmzetBelasting=true;

        //1b
        btwGrList.firstB={};
        btwGrList.firstB.gr="1";
        btwGrList.firstB.code="1b";
        btwGrList.firstB.description="1b. Leveringen/diensten belast met laag tarief";
        btwGrList.firstB.hasOmzet=true;
        btwGrList.firstB.hasOmzetBelasting=true;

        //1c
        btwGrList.firstC={};
        btwGrList.firstC.gr="1";
        btwGrList.firstC.code="1c";
        btwGrList.firstC.description="1c. Leveringen/diensten belast met overige tarieven, behalve 0%";
        btwGrList.firstC.hasOmzet=true;
        btwGrList.firstC.hasOmzetBelasting=true;

        //1d
        btwGrList.firstD={};
        btwGrList.firstD.gr="1";
        btwGrList.firstD.code="1d";
        btwGrList.firstD.description="1d. Privégebruik";
        btwGrList.firstD.hasOmzet=true;
        btwGrList.firstD.hasOmzetBelasting=true;

        //1e
        btwGrList.firstE={};
        btwGrList.firstE.gr="1";
        btwGrList.firstE.code="1e";
        btwGrList.firstE.description="1e. Leveringen/diensten belast met 0% of niet bij u belast";
        btwGrList.firstE.hasOmzet=true;
        btwGrList.firstE.hasOmzetBelasting=true;

        //SECOND "RUBRIEK"
        //2a
        btwGrList.secondA={};
        btwGrList.secondA.gr="2";
        btwGrList.secondA.code="2a";
        btwGrList.secondA.description="2a. Leveringen/diensten waarbij de omzetbelasting naar u is verlegd";
        btwGrList.secondA.hasOmzet=true;
        btwGrList.secondA.hasOmzetBelasting=true;

        //THIRD "RUBRIEK"

        //3a
        btwGrList.thirdA={};
        btwGrList.thirdA.gr="3";
        btwGrList.thirdA.code="3a";
        btwGrList.thirdA.description="3a. Leveringen naar landen buiten de EU (uitvoer)";
        btwGrList.thirdA.hasOmzet=true;
        btwGrList.thirdA.hasOmzetBelasting=false;

        //3b
        btwGrList.thirdB={};
        btwGrList.thirdB.gr="3";
        btwGrList.thirdB.code="3b";
        btwGrList.thirdB.description="3b. Leveringen naar of diensten in landen binnen de EU";
        btwGrList.thirdB.hasOmzet=true;
        btwGrList.thirdB.hasOmzetBelasting=false;

        //3c
        btwGrList.thirdC={};
        btwGrList.thirdC.gr="3";
        btwGrList.thirdC.code="3c";
        btwGrList.thirdC.description="3c. Installatie/ afstandsverkopen binnen de EU";
        btwGrList.thirdC.hasOmzet=true;
        btwGrList.thirdC.hasOmzetBelasting=false;


        //FOURTH "RUBRIEK"

        //4a
        btwGrList.fourthA={};
        btwGrList.fourthA.gr="4";
        btwGrList.fourthA.code="4a";
        btwGrList.fourthA.description="4a. Leveringen/diensten uit landen buiten de EU";
        btwGrList.fourthA.hasOmzet=true;
        btwGrList.fourthA.hasOmzetBelasting=true;

        //4b
        btwGrList.fourthB={};
        btwGrList.fourthB.gr="4";
        btwGrList.fourthB.code="4b";
        btwGrList.fourthB.description="4b. Leveringen/diensten uit landen binnen de EU";
        btwGrList.fourthB.hasOmzet=true;
        btwGrList.fourthB.hasOmzetBelasting=true;


        //FIFTH "RUBRIEK"

        //5a
        btwGrList.fifthA={};
        btwGrList.fifthA.gr="5";
        btwGrList.fifthA.code="5a";
        btwGrList.fifthA.description="5a. Verschuldigde omzetbelasting (rubrieken 1t/m 4)";
        btwGrList.fifthA.hasOmzet=false;
        btwGrList.fifthA.hasOmzetBelasting=true;

        //5b
        btwGrList.fifthB={};
        btwGrList.fifthB.gr="5";
        btwGrList.fifthB.code="5b";
        btwGrList.fifthB.description="5b. Voorbelasting";
        btwGrList.fifthB.hasOmzet=false;
        btwGrList.fifthB.hasOmzetBelasting=true;


        return btwGrList;
    }

    /**
     * Returns the rubriek description
     * @param {*} rubriek 
     * @returns 
     */
    getRubriekTitle(rubriek){
        var rubTitle="";

        switch(rubriek){
            case "1":
                rubTitle= "Rubriek 1: Prestaties binnenland", "styleRubriekTitle"
                return rubTitle;
            case "2":
                rubTitle= "Rubriek 2: Verleggingsregelingen", "styleRubriekTitle"
                return rubTitle;
            case "3":
                rubTitle= "Rubriek 3: Prestaties naar of in het buitenland"
                return rubTitle;
            case "4":
                rubTitle= "Rubriek 4: Prestaties vanuit het buitenland aan u verricht", "styleRubriekTitle"
                return rubTitle;
            case "5":
                rubTitle= "Rubriek 5: Voorbelasting, kleineondernemersregeling en eindtotaal", "styleRubriekTitle"
                return rubTitle;
        }

        return rubTitle

    }

    /**
     * Trunc the value as we want to see the amount in the report roundend down without decimals
     * @param {*} value 
     * @returns 
     */
    getReportAmount(value){
        
        var reportAmount="";

        reportAmount=Math.trunc(Banana.SDecimal.abs(value));

        return reportAmount;
    }

    /**
     * Return the value taken from the accounting without sign
     */
    getAccountingAmount(value){

        return Banana.SDecimal.abs(value);

    }

    createBtwDeclarationReport(){

        var btwGrList=this.setBtwGrList();
        let codesData=this.getCodesData();
        var startDate=this.startDate;
        var endDate=this.endDate;
        var rubriek="";
        var rubSum_accounting=""; //accounting value
        var rubSum_report=""; //report value
        var reportTotal="";
        var accountingTotal="";
        var startDate=this.startDate;
        var endDate=this.endDate;

        //create the report
        var report = Banana.Report.newReport('BTW declaration Report');
        this.getReportHeader(report);

        //add the table
        var reportTable = this.getReportTable(report);

        //I go through all the elements and print the values
        for(var row in btwGrList){

            var element=btwGrList[row];

            //each time the group (the rubriek) change, i add the the rubriek title
            if(rubriek!==element.gr){
                //empty row
                var tableRow = reportTable.addRow("");
                tableRow.addCell("", "",9);

                //title row
                var rubTitle=this.getRubriekTitle(element.gr);
                var tableRow = reportTable.addRow("");
                tableRow.addCell(rubTitle, "styleRubriekTitle",8);

                //period row //set an array with the periods
                var tableRow = reportTable.addRow("");
                tableRow.addCell("", "");
                for(var i=0;i<4;i++){
                    tableRow.addCell("31.03.2021", "");
                }

                //columns header row
                var tableRow = reportTable.addRow("");
                tableRow.addCell("", "");
                for(var i=0;i<4;i++){
                    tableRow.addCell("Omzet", "");
                    tableRow.addCell("Omzetbelasting", "");
                }

            }

            var tableRow = reportTable.addRow("");
            tableRow.addCell(element.description,"");

            //Omzet
            if(element.hasOmzet){
                var grTaxAmount=this.getAmountForGr1(codesData,element.code);
                tableRow.addCell(grTaxAmount, "styleAmount");

                if(element.hasOmzet && !element.hasOmzetBelasting ){
                    //add an empty cell
                    tableRow.addCell("", "");
                }
            }

            //Omzetbelasting
            if(element.hasOmzetBelasting){
                if(element.hasOmzetBelasting && !element.hasOmzet){
                    //add an empty cell
                    tableRow.addCell("", "");
                }

                if(element.code!="5a"){

                    var grVatAmount=this.setParamCodes(codesData,element.code);
                    var vatCurrBal=this.banDoc.vatCurrentBalances(grVatAmount,"Q",startDate,endDate);
                    for(var i=0;i<vatCurrBal.length;i++){
                        Banana.console.debug(vatCurrBal[i].vatAmount);
                        var repAmount=this.getReportAmount(vatCurrBal[i].vatAmount);
                        var accAmount=this.getAccountingAmount(vatCurrBal[i].vatAmount);
                        if(element.code!=="5b"){// 5b not to sum in the total
                            rubSum_report=Banana.SDecimal.add(rubSum_report,repAmount);
                            rubSum_accounting=Banana.SDecimal.add(rubSum_accounting,accAmount);
                        }
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(repAmount,"",false), "styleAmount");
                    }

                }else{
                    tableRow.addCell(Banana.Converter.toLocaleNumberFormat(rubSum_report,"",false), "styleAmount");
                }

            }

            rubriek=element.gr;

        }

        //add the total
        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //total row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Eindtotaal", "");
        tableRow.addCell("", "");
        reportTotal=Banana.SDecimal.subtract(rubSum_report,repAmount);
        accountingTotal=Banana.SDecimal.subtract(rubSum_accounting,accAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(reportTotal,"",false), "styleAmount");


        //accounting amount
        var accAmountParagraph=report.addParagraph();
        //check the accounting amount
        accAmountParagraph.addText("Accounting end total: "+Banana.Converter.toLocaleNumberFormat(accountingTotal,"2",false),"styleFinalParagraphs");

        //rounding difference
        var roundingDifference=Banana.SDecimal.subtract(accountingTotal,reportTotal);
        var roundDiffParagraph=report.addParagraph();
        roundDiffParagraph.addText("Rounding difference: "+roundingDifference,"styleFinalParagraphs");


        return report;

    }

    /**
     * This method sets the string that will be passed to the vatCurrentBalance() function. 
     * The string is constructed on the basis of the gr1 parameter, 
     * all codes in the codes array that have the property gr1Code=gr1 are inserted into the string,
     * which is then formatted to match the structure expected by the current balance function.
     */
    setParamCodes(codesData, gr1){
        var  paramCodes="";

        for( var row in codesData ){
            let code=codesData[row];
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

    getAmountForGr1(codesData,gr1){
        var gr1Amount="";
        for(var key in codesData ){
            if(codesData[key].gr1Code==gr1){
                gr1Amount=Banana.SDecimal.add(gr1Amount,codesData[key].taxableAmount);
            }
        }
        return Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.roundNearest(gr1Amount,'0.00'),0,false);
    }

    /**
     * Retrieves from the vat codes table all the vat codes together with their associated gr1 group and saves everything in an object.
     * @returns 
     */
    getBtwCodes(){
        var codes=[];
        var table = this.banDoc.table("VatCodes");
        if (!table)
            return codes;

        for (var i = 0; i < table.rowCount; i++) {
            var btwCode={};
            var tRow = table.row(i);
            var vatCode = tRow.value("VatCode");
            var gr1Code= tRow.value("Gr1");

            if(vatCode && ! gr1Code){
                //error message: Warning code 'XYZ' without Gr1.
                var msg =this.getErrorMessage(this.VATCODE_WITHOUT_GR1,"en",vatCode);
                this.banDoc.addMessage(msg,this.VATCODE_WITHOUT_GR1);
            }

            if (vatCode && gr1Code) {
  
                btwCode.vatCode=vatCode;
                btwCode.gr1Code=gr1Code;

                codes.push(btwCode);
                //Banana.console.debug(JSON.stringify(btwCode));
            }
        }

        return codes;
    }

    /**
     * returns the error message
     * @param {*} errorId 
     * @param {*} lang 
     * @returns 
     */
    getErrorMessage(errorId, lang,vatCode) {
        if (!lang)
            lang = 'en';
        switch (errorId) {
            case this.VATCODE_WITHOUT_GR1:
                return "The following VAT code: "+ vatCode +" does not have a Gr1 assigned, check in your VAT codes Table";
            default:
                return '';
        }
    }

    getDocumentInfo(){
        var documentInfo = {};
        documentInfo.company ="";
        documentInfo.address ="";
        documentInfo.zip ="";
        documentInfo.city ="";


        if (this.banDoc) {
            if(this.banDoc.info("AccountingDataBase", "Company"));
                documentInfo.company = this.banDoc.info("AccountingDataBase", "Company");
            if(this.banDoc.info("AccountingDataBase", "Address1"))
                documentInfo.address = this.banDoc.info("AccountingDataBase", "Address1");
            if(this.banDoc.info("AccountingDataBase", "Zip"))
                documentInfo.zip = this.banDoc.info("AccountingDataBase", "Zip");
            if(this.banDoc.info("AccountingDataBase", "City"))
                documentInfo.city = this.banDoc.info("AccountingDataBase", "City");
        }

        return documentInfo;
    }

    /**
     * Retrieves from the transactions table  all the rows with a BTW code and a taxable amounts.
     * in a second time creates and object that extend 'codes' by summing the taxable amount for each code.
     */
    getTransactionsRows(){
        //fare in modo di salvare i dati in un array suddiviso per il periodo
        var transData=[];
        var from=this.getJsDate(this.startDate);
        var to=this.getJsDate(this.endDate);

        var table = this.banDoc.table("Transactions");
        if (!table)
            return transData;

        for (var i = 0; i < table.rowCount; i++) {
            var transRow={};
            var tRow = table.row(i);
            var vatCode = tRow.value("VatCode");
            var vatTaxable= tRow.value("VatTaxable");
            var trDate=tRow.value("Date");

            if (vatCode && vatTaxable && trDate) {
                trDate=this.getJsDate(trDate);
                if(trDate>from && trDate<to){
                    transRow.vatCode=vatCode;
                    transRow.vatTaxable=vatTaxable;
                    transData.push(transRow);
                }
            }
        }
        
        return transData;
                    
    }

    /**
     * Takes a date and return a JS date object
     */
    getJsDate(date){

        var jsDate=Banana.Converter.toDate(date);

        return jsDate;

    }

    /**
     * Cerca nei dati salvati dalle registrazioni, tutte le righe con il codice iva corrispondente a quello passato come parametro, 
     * se il codice corrisponde somma l'importo di iva tassabile in una variabile.
     * 
     */
    getVatTaxableAmounts(vatCode){
        var trRows=this.getTransactionsRows();
        var taxableAmount="";
        if(!trRows)
            return taxableAmount;

        for(var key in trRows){
            //Banana.console.debug("prova");
            var row=trRows[key];
            if(row.vatCode==vatCode){
                taxableAmount=Banana.SDecimal.add(taxableAmount,row.vatTaxable);
            }
        }

        return taxableAmount;
    }

    /**
     * Aggiunge un nuovo campo agli oggetti dentro codes: l'oggetto Amount che contiene il totale di iva tassabile per calcolato per ogni codice iva.
     */
    getCodesData(){
        var codesData=this.getBtwCodes();
        for(var row in codesData){
            codesData[row].taxableAmount=this.getVatTaxableAmounts(codesData[row].vatCode);
        }
        return codesData;

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

    var btwEvaluationReport= new BTWEvaluationReport(Banana.document);
    var report = btwEvaluationReport.createBtwDeclarationReport();
    var stylesheet = btwEvaluationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}