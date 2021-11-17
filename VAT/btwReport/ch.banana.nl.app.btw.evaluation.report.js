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
 *                                                               31.03.2021                 30.06.2021              ...same structurefor each quarter 
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
        tableBalance.addColumn("c1").setStyleAttributes("width:50%");
        tableBalance.addColumn("c2").setStyleAttributes("width:12%");
        tableBalance.addColumn("c3").setStyleAttributes("width:12%");
        tableBalance.addColumn("c4").setStyleAttributes("width:12%");
        tableBalance.addColumn("c5").setStyleAttributes("width:12%");
        tableBalance.addColumn("c6").setStyleAttributes("width:12%");
        tableBalance.addColumn("c7").setStyleAttributes("width:12%");
        tableBalance.addColumn("c8").setStyleAttributes("width:12%");
        tableBalance.addColumn("c9").setStyleAttributes("width:12%");
        tableBalance.addColumn("c8").setStyleAttributes("width:12%");
        tableBalance.addColumn("c9").setStyleAttributes("width:12%");

        return tableBalance;
    }

    getReportHeader(report){
        var documentInfo=this.getDocumentInfo();
        var headerParagraph = report.getHeader().addSection();
        headerParagraph.addParagraph(documentInfo.company, "styleNormalHeader styleCompanyName");
        headerParagraph.addParagraph(documentInfo.address, "styleNormalHeader");
        headerParagraph.addParagraph(documentInfo.zip+", "+documentInfo.city, "styleNormalHeader");
        headerParagraph.addParagraph(documentInfo.vatNumber, "styleNormalHeader");
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
        btwGrList.firstA.vatCodes="V21";
        btwGrList.firstA.description="1a. Leveringen/diensten belast met hoog tarief";
        btwGrList.firstA.hasOmzet=true;
        btwGrList.firstA.hasOmzetBelasting=true;

        //1b
        btwGrList.firstB={};
        btwGrList.firstB.gr="1";
        btwGrList.firstB.code="1b";
        btwGrList.firstB.vatCodes="V9";
        btwGrList.firstB.description="1b. Leveringen/diensten belast met laag tarief";
        btwGrList.firstB.hasOmzet=true;
        btwGrList.firstB.hasOmzetBelasting=true;

        //1c
        btwGrList.firstC={};
        btwGrList.firstC.gr="1";
        btwGrList.firstC.code="1c";
        btwGrList.firstC.vatCodes="VOT";
        btwGrList.firstC.description="1c. Leveringen/diensten belast met overige tarieven, behalve 0%";
        btwGrList.firstC.hasOmzet=true;
        btwGrList.firstC.hasOmzetBelasting=true;

        //1d
        btwGrList.firstD={};
        btwGrList.firstD.gr="1";
        btwGrList.firstD.code="1d";
        btwGrList.firstD.vatCodes="PG21;PG9;PG27;PG15";
        btwGrList.firstD.description="1d. Privégebruik";
        btwGrList.firstD.hasOmzet=true;
        btwGrList.firstD.hasOmzetBelasting=true;

        //1e
        btwGrList.firstE={};
        btwGrList.firstE.gr="1";
        btwGrList.firstE.code="1e";
        btwGrList.firstE.vatCodes="V0";
        btwGrList.firstE.description="1e. Leveringen/diensten belast met 0% of niet bij u belast";
        btwGrList.firstE.hasOmzet=true;
        btwGrList.firstE.hasOmzetBelasting=false;

        //SECOND "RUBRIEK"
        //2a
        btwGrList.secondA={};
        btwGrList.secondA.gr="2";
        btwGrList.secondA.code="2a";
        btwGrList.secondA.vatCodes="VR21;VR9";
        btwGrList.secondA.description="2a. Leveringen/diensten waarbij de omzetbelasting naar u is verlegd";
        btwGrList.secondA.hasOmzet=true;
        btwGrList.secondA.hasOmzetBelasting=true;

        //THIRD "RUBRIEK"

        //3a
        btwGrList.thirdA={};
        btwGrList.thirdA.gr="3";
        btwGrList.thirdA.code="3a";
        btwGrList.thirdA.vatCodes="VX";
        btwGrList.thirdA.description="3a. Leveringen naar landen buiten de EU (uitvoer)";
        btwGrList.thirdA.hasOmzet=true;
        btwGrList.thirdA.hasOmzetBelasting=false;

        //3b
        btwGrList.thirdB={};
        btwGrList.thirdB.gr="3";
        btwGrList.thirdB.code="3b";
        btwGrList.thirdB.vatCodes="VEU";
        btwGrList.thirdB.description="3b. Leveringen naar of diensten in landen binnen de EU";
        btwGrList.thirdB.hasOmzet=true;
        btwGrList.thirdB.hasOmzetBelasting=false;

        //3c
        btwGrList.thirdC={};
        btwGrList.thirdC.gr="3";
        btwGrList.thirdC.code="3c";
        btwGrList.thirdC.vatCodes="VEUI";
        btwGrList.thirdC.description="3c. Installatie/ afstandsverkopen binnen de EU";
        btwGrList.thirdC.hasOmzet=true;
        btwGrList.thirdC.hasOmzetBelasting=false;


        //FOURTH "RUBRIEK"

        //4a
        btwGrList.fourthA={};
        btwGrList.fourthA.gr="4";
        btwGrList.fourthA.code="4a";
        btwGrList.fourthA.vatCodes="VIX21;VIX9";
        btwGrList.fourthA.description="4a. Leveringen/diensten uit landen buiten de EU";
        btwGrList.fourthA.hasOmzet=true;
        btwGrList.fourthA.hasOmzetBelasting=true;

        //4b
        btwGrList.fourthB={};
        btwGrList.fourthB.gr="4";
        btwGrList.fourthB.code="4b";
        btwGrList.fourthB.vatCodes="ICP21;ICP9";
        btwGrList.fourthB.description="4b. Leveringen/diensten uit landen binnen de EU";
        btwGrList.fourthB.hasOmzet=true;
        btwGrList.fourthB.hasOmzetBelasting=true;


        //FIFTH "RUBRIEK"

        //5a
        btwGrList.fifthA={};
        btwGrList.fifthA.gr="5";
        btwGrList.fifthA.code="5a";
        //5a is the sum of the rubriek 1-4, so does not have any code.
        btwGrList.fifthA.vatCodes="";
        btwGrList.fifthA.description="5a. Verschuldigde omzetbelasting (rubrieken 1t/m 4)";
        btwGrList.fifthA.hasOmzet=false;
        btwGrList.fifthA.hasOmzetBelasting=true;

        //5b
        btwGrList.fifthB={};
        btwGrList.fifthB.gr="5";
        btwGrList.fifthB.code="5b";
        btwGrList.fifthB.vatCodes="IG21;IG9;IG0;IGV;D21-2;D9-2";
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
    getRubricTitle(rubriek){
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
        if(value && value!=" ")
            reportAmount=Math.trunc(Banana.SDecimal.abs(value));

        return reportAmount;
    }

    /**
     * Return the value taken from the accounting without sign
     */
    getAccountingAmount(value){

        if(value && value!=" ")
            return Banana.SDecimal.abs(value);
        else
            return value;

    }

    /**
     * Format and returns an array with the returns the final date of each quarter, alrea
     */
    getQuarters(){
        var quarters=[];

        //get the current year
        var date = new Date();
        var currentYear = date.getFullYear();

        var q1=currentYear+"0331";
        q1=Banana.Converter.toLocaleDateFormat(q1);
        quarters.push(q1);

        var q2=currentYear+"0630";
        q2=Banana.Converter.toLocaleDateFormat(q2)
        quarters.push(q2);

        var q3=currentYear+"0930";
        q3=Banana.Converter.toLocaleDateFormat(q3)
        quarters.push(q3);

        var q4=currentYear+"1231";
        q4=Banana.Converter.toLocaleDateFormat(q4)
        quarters.push(q4);

        //last column (annual)
        quarters.push("Jaarlijks");

        return quarters;

    }

    createBtwDeclarationReport(){

        var vatGrData=this.getVatGrData();
        var vatDeductible=this.getTotalVatDeductible();//deductible vat
        var vatPosted=this.getVatPosted();//VatAmount - VatNotDeductible
        var reportAmount="";
        var rubric="";
        var quarters=this.getQuarters();

        //create the report
        var report = Banana.Report.newReport('BTW declaration Report');
        this.getReportHeader(report);

        //add the table
        var reportTable = this.getReportTable(report);

        //I go through all the elements and print the values
        for(var key in vatGrData){

            //Banana.console.debug(JSON.stringify(vatGrData[key]));
           
            var group=vatGrData[key];

            //if change group we add rubriek description
            if(group.gr!==rubric){

                //title row
                var rubTitle=this.getRubricTitle(group.gr);
                var tableRow = reportTable.addRow("");
                tableRow.addCell(rubTitle, "styleRubriekTitle",11);

                //quarter indication
                var tableRow = reportTable.addRow("");
                tableRow.addCell("");
                for(var i=0; i<quarters.length;i++){
                    tableRow.addCell(quarters[i], "styleQuarters",2);
                }

                //columns header row
                var tableRow = reportTable.addRow("");
                tableRow.addCell("", "");
                for(var i=0; i<quarters.length;i++){
                    if(group.gr=="5")
                        tableRow.addCell("", "");
                    else
                        tableRow.addCell("Omzet", "");
                        
                    tableRow.addCell("Omzetbelasting", "");
                }

            }
                //add groups
                var tableRow = reportTable.addRow("");
                //add the description
                tableRow.addCell(group.description,"");
                if(group.code!="5a"){
                    //recupero gli importi: VAT e Imponibile
                    var vatValue=group.vatValues.toString();
                    var vatValueList=vatValue.split(";");
                    var taxableValue=group.vatTaxable.toString();
                    var TaxableValuelist=taxableValue.split(";")
                    for(var i=0; i<vatValueList.length-1;i++){
                        //add Omzet amounts
                        if(group.hasOmzet){
                            reportAmount=this.getReportAmount(TaxableValuelist[i])
                            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(reportAmount,"",false),"styleAmount");
                        }else{
                            tableRow.addCell("");
                        }
                        if(group.hasOmzetBelasting){
                        //add Omzetbelasting amounts
                            reportAmount=this.getReportAmount(vatValueList[i])
                            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(reportAmount,"",false),"styleAmount");
                        }else{
                            tableRow.addCell("");
                        }
                    }
                } else{//add the sum of rubriek 1 to 4 in the group 5a.
                    for(var i=0; i<vatDeductible.length;i++){
                        tableRow.addCell("","");
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(vatDeductible[i].report,"",false), "styleAmount");
                    }
                }


                rubric=group.gr;


        }

        //add the total
        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",11);
        //total row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Eindtotaal", "");
        for(var i=0;i<vatPosted.length;i++){
            tableRow.addCell("","");
            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(vatPosted[i].report,"",false), "styleAmount");
        }

        /*//add the accounting value and the rounding difference
        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",13);
        //Accounting value row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Accounting Value", "");
        for(var i=0;i<vatPosted.length;i++){
            tableRow.addCell("","");
            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(vatPosted[i].accounting,"",false), "styleAmount");
            tableRow.addCell(" | ","");
        }
        //Rounding difference row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rounding difference", "");
        for(var i=0;i<vatPosted.length;i++){
            tableRow.addCell("","");
            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(vatPosted[i].difference,"",false), "styleAmount");
            tableRow.addCell(" | ","");
        }*/



        return report;

    }

    /**
     * Adds to the object the property vatValues ord vatTaxable which contains a string with the quarterly values of the VAT amounts/tabxable calculated for each group divided by ';'.
     * @param {*} isVat 
     * @returns 
     */
    getVatGrData(){

        var btwGrList=this.setBtwGrList();

        for (var gr in btwGrList){

            var formattedCodes=this.setParamCodes(btwGrList[gr].vatCodes);
            btwGrList[gr].vatValues="";
            btwGrList[gr].vatTaxable="";

            //get quarters balance
            var vatCurrBal=this.banDoc.vatCurrentBalances(formattedCodes,'Q');

            //salvo i i valori calcolati in una stringa separata da ';'
            for(var i=0; i<vatCurrBal.length;i++){

                btwGrList[gr].vatValues+=vatCurrBal[i].vatAmount+";";
                if(btwGrList[gr].code!=="5b")//for 5b there is no taxable amount 
                    btwGrList[gr].vatTaxable+=vatCurrBal[i].vatTaxable+";";

            }

            //get complete year balance
            var vatCurrBal=this.banDoc.vatCurrentBalance(formattedCodes);
            btwGrList[gr].vatValues+=vatCurrBal.vatAmount+";";
            if(btwGrList[gr].code!=="5b")//for 5b there is no taxable amount 
                btwGrList[gr].vatTaxable+=vatCurrBal.vatTaxable+";";

            

        }
        return btwGrList;
    }

    /**
     * Get the total of the VAT vatDeductible.
     * 5a-5b
     * @param {*} vatGrData object with groups data 
     * @param {*} rubricsSums array with rubrics sums
     */

     getTotalVatDeductible(){

        var vatDeductible=[];


        //calculate quarters
        var vatCurrBal=this.banDoc.vatCurrentBalances("*","Q","","",onlyVatDeductible);

        for(var i=0; i<vatCurrBal.length;i++){
            var vatDeductibleAmounts={};
            vatDeductibleAmounts.report=this.getReportAmount(vatCurrBal[i].vatAmount);
            vatDeductibleAmounts.accounting=this.getAccountingAmount(vatCurrBal[i].vatAmount);

            vatDeductible.push(vatDeductibleAmounts);

        }

        //calculate year
        var vatCurrBal=this.banDoc.vatCurrentBalance("*","","",onlyVatDeductible);
        var vatDeductibleAmounts={};
        vatDeductibleAmounts.report=this.getReportAmount(vatCurrBal.vatAmount);
        vatDeductibleAmounts.accounting=this.getAccountingAmount(vatCurrBal.vatAmount);
        vatDeductible.push(vatDeductibleAmounts);

        return vatDeductible;
    }

    /**
     * Get the total of the VAT posted: VatAmount - VatNotDeductible.
     * @param {*} vatGrData object with groups data 
     * @returns an array with the results
     */
     getVatPosted(){
        var vatPosted=[];

        //calculate quarters
        var vatCurrBal=this.banDoc.vatCurrentBalances("*","Q");


        for(var i=0; i<vatCurrBal.length;i++){
            var vatPostedAmounts={};
            vatPostedAmounts.report=this.getReportAmount(vatCurrBal[i].vatPosted);
            vatPostedAmounts.accounting=this.getAccountingAmount(vatCurrBal[i].vatPosted);
            vatPostedAmounts.difference=Banana.SDecimal.subtract(vatPosted.accounting,vatPostedAmounts.accounting);

            vatPosted.push(vatPostedAmounts);

        }

        //calculate year
        var vatCurrBal=this.banDoc.vatCurrentBalance("*");
        var vatPostedAmounts={};
        vatPostedAmounts.report=this.getReportAmount(vatCurrBal.vatPosted);
        vatPostedAmounts.accounting=this.getAccountingAmount(vatCurrBal.vatPosted);
        Banana.console.debug( vatPostedAmounts.report);
        vatPostedAmounts.difference=Banana.SDecimal.subtract(vatPostedAmounts.accounting,vatPostedAmounts.report);

        vatPosted.push(vatPostedAmounts);

        return vatPosted;
    }

    

    /**
     * This method sets the string that will be passed to the vatCurrentBalance() function. 
     * The string is constructed on the basis of the gr1 parameter, 
     * all codes in the codes array that have the property gr1Code=gr1 are inserted into the string,
     * which is then formatted to match the structure expected by the current balance function.
     */
    setParamCodes(codes){

        var  formCodes="";
        if(codes)
        formCodes=codes.replace(/[;]/g, '|');

        return formCodes;
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

    verifyifHasGr1(){
        var codes=[];
        var table = this.banDoc.table("VatCodes");
        if (!table)
            return codes;

        for (var i = 0; i < table.rowCount; i++) {
            var tRow = table.row(i);
            var vatCode = tRow.value("VatCode");
            var gr1Code= tRow.value("Gr1");

            if(vatCode && !gr1Code){
                //error message: Warning code 'XYZ' without Gr1.
                var msg =this.getErrorMessage(this.VATCODE_WITHOUT_GR1,"en",vatCode);
                this.banDoc.addMessage(msg,this.VATCODE_WITHOUT_GR1);
            }
        }
        return true;
    }

    getDocumentInfo(){
        var documentInfo = {};
        documentInfo.company ="";
        documentInfo.address ="";
        documentInfo.zip ="";
        documentInfo.city ="";
        documentInfo.vatNumber="";


        if (this.banDoc) {
            if(this.banDoc.info("AccountingDataBase", "Company"));
                documentInfo.company = this.banDoc.info("AccountingDataBase", "Company");
            if(this.banDoc.info("AccountingDataBase", "Address1"))
                documentInfo.address = this.banDoc.info("AccountingDataBase", "Address1");
            if(this.banDoc.info("AccountingDataBase", "Zip"))
                documentInfo.zip = this.banDoc.info("AccountingDataBase", "Zip");
            if(this.banDoc.info("AccountingDataBase", "City"))
                documentInfo.city = this.banDoc.info("AccountingDataBase", "City");
            if(this.banDoc.info("AccountingDataBase", "VatNumber"))
                documentInfo.vatNumber = this.banDoc.info("AccountingDataBase", "VatNumber");
        }

        return documentInfo;
    }

    /**
     * Takes a date and return a JS date object
     */
    getJsDate(date){

        var jsDate=Banana.Converter.toDate(date);

        return jsDate;

    }

    getReportStyle() {
        var textCSS = "";
        var file = Banana.IO.getLocalFile("file:script/ch.banana.nl.app.btw.evaluation.report.css");
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

  /**
  * This function is called from the vatCurrentBalance, if a vat code is of type Deductible, the value is taken in the calculation.
  * @param {*} row 
  * @param {*} rowNr 
  * @param {*} table 
  * @returns 
  */
   function onlyVatDeductible( row, rowNr, table){
    switch(row.value('VatCode')){
        case "IG21":
        case"IG9":
        case"IG0":
        case"IGV":
        case"D21-2":
        case"D9-2":
        return false;
    }

    return true;
}

 function exec(inData, options) {


    if (!Banana.document)
        return "@Cancel";

    var btwEvaluationReport= new BTWEvaluationReport(Banana.document);
    btwEvaluationReport.verifyifHasGr1();
    var report = btwEvaluationReport.createBtwDeclarationReport();
    var stylesheet = btwEvaluationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}