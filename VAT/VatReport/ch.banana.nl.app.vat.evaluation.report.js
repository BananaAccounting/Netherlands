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
// @pubdate = 2021-11-18
// @publisher = Banana.ch SA
// @description.en = Netherlands VAT Evaluation [BETA]
// @description.nl = Netherlands VAT Evaluation [BETA]
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
*   -The vatCurrentBalance/vatCurrentBalances API is used to calculate the vat. of the properties it returns we use "vatPosted" as it is already net of non-deductible vat.
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

    constructor(banDoc,startDate,endDate){
        this.banDoc=banDoc;
        this.startDate=startDate;
        this.endDate=endDate;

        //errors
        this.VATCODE_WITHOUT_GR1 = "VATCODE_WITHOUT_GR1";
    }

    /**
     * Defines and return the table structure
     * @param {*} report 
     * @returns 
     */
    getEvaluationTable(report) {
        var tableBalance = report.addTable('evaluationTable');
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

    /**
     * Defines and return the header
     * @param {*} report 
     */
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
     * Defines the structure of the groups  
     */
    setBtwGrList(){
        var btwGrList={};

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
        btwGrList.firstD.vatCodes="PG21|PG9|PG27|PG15";
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
        btwGrList.secondA.vatCodes="VR21|VR9";
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
        btwGrList.fourthA.vatCodes="VIX21|VIX9";
        btwGrList.fourthA.description="4a. Leveringen/diensten uit landen buiten de EU";
        btwGrList.fourthA.hasOmzet=true;
        btwGrList.fourthA.hasOmzetBelasting=true;

        //4b
        btwGrList.fourthB={};
        btwGrList.fourthB.gr="4";
        btwGrList.fourthB.code="4b";
        btwGrList.fourthB.vatCodes="ICP21|ICP9";
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
        btwGrList.fifthB.vatCodes="IG21|IG9|IG0|IGV|D21-2|D9-2";
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

    createBtwEvaluationReport(){

        var results=this.getVatGrData();
        var reportAmount="";
        var rubric="";

        //create the report
        var report = Banana.Report.newReport('BTW evaluation Report');
        this.getReportHeader(report);

        //add the table
        var evaluationTable = this.getEvaluationTable(report);

        //quarter indication
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("");
        for(var i=0; i<results.length;i++){
            tableRow.addCell(results[i].period.description, "styleQuarters",2);
        }
        //titles row
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("", "");
        for(var i=0; i<results.length;i++){
            tableRow.addCell("Omzet", "styleColumnTitles");
            tableRow.addCell("Omzetbelasting", "styleColumnTitles");
        }

        //I go through all the elements and print the values
        for(var key in results[0].btwGrList){

           
            var group=results[0].btwGrList[key];

            //if change group we add rubriek description
            if(group.gr!==rubric){
                //emptyrow
                var tableRow = evaluationTable.addRow("");
                tableRow.addCell("", "styleRubriekTitle",11);
                //title row
                var rubTitle=this.getRubricTitle(group.gr);
                var tableRow = evaluationTable.addRow("");
                tableRow.addCell(rubTitle, "styleRubriekTitle",11);

            }
                //add groups
                var tableRow = evaluationTable.addRow("");
                //add the description
                tableRow.addCell(group.description,"");
                if(group.code!="5a"){
                    for(var i=0; i<results.length;i++){
                        //add Omzet amounts
                        if(group.hasOmzet){
                            reportAmount=this.getReportAmount(results[i].btwGrList[key].vatBalance.vatTaxable);
                            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(reportAmount,"",false),"styleAmount");
                        }else{
                            tableRow.addCell("");
                        }
                        if(group.hasOmzetBelasting){
                        //add Omzetbelasting amounts
                            reportAmount=this.getReportAmount(results[i].btwGrList[key].vatBalance.vatPosted);
                            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(reportAmount,"",false),"styleAmount");
                        }else{
                            tableRow.addCell("");
                        }
                    }
                } else{//add the sum of rubriek 1 to 4 in the group 5a.
                    for(var i=0; i<results.length;i++){
                        tableRow.addCell("","");
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].vatDue,"",false), "styleAmount");
                    }
                }


                rubric=group.gr;


        }

        //add the total
        //empty row
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("", "",11);
        //total row
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("Eindtotaal", "styleRubriekTitle");
        for(var i=0; i<results.length;i++){
            tableRow.addCell("","");
            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].vatTotal.report,"",false), "styleAmount");
        }
        //add the accounting value and the rounding difference
        //empty row
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("", "",11);
        //Accounting value row
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("Eindtotaal(accounting value)", "styleRubriekTitle");
        for(var i=0;i<results.length;i++){
            tableRow.addCell("","");
            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].vatTotal.accounting,"2",false), "styleAmount");
        }
        //Rounding difference row
        var tableRow = evaluationTable.addRow("");
        tableRow.addCell("Rounding difference", "");
        for(var i=0;i<results.length;i++){
            tableRow.addCell("","");
            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].vatTotal.difference,"2",false), "styleAmount");
        }

        return report;

    }


    getEvaluationPeriods(){
        var periods=[];

        //get the current year
        var currentYear = this.startDate.substring(0,4);

        //first quarter
        var q1={}
        q1.startDate=currentYear+"-01-01";
        q1.endDate=currentYear+"-03-31";
        q1.description=Banana.Converter.toLocaleDateFormat(q1.endDate);
        periods.push(q1);

        //second quarter
        var q2={}
        q2.startDate=currentYear+"-04-01";
        q2.endDate=currentYear+"-06-30";
        q2.description=Banana.Converter.toLocaleDateFormat(q2.endDate);
        periods.push(q2);

        //third quarter
        var q3={}
        q3.startDate=currentYear+"-07-01";
        q3.endDate=currentYear+"-09-30";
        q3.description=Banana.Converter.toLocaleDateFormat(q3.endDate);
        periods.push(q3);

        //fourth quarter
        var q4={}
        q4.startDate=currentYear+"-10-01";
        q4.endDate=currentYear+"-12-31";
        q4.description=Banana.Converter.toLocaleDateFormat(q4.endDate);
        periods.push(q4);

        //full year
        var q5={}
        q5.startDate=currentYear+"-01-01";
        q5.endDate=currentYear+"-12-31";
        q5.description="Jaarlijks";
        periods.push(q5);

        return periods;


    }

    /**
     * Get the vat data for each period
     * @param {*} isVat 
     * @returns 
     */
    getVatGrData(){

        //get the periods
       var periods=[];
       periods=this.getEvaluationPeriods();
       var results = [];

        for (var p = 0; p <periods.length ; p++){
            var btwGrList=this.setBtwGrList();
            this.getVatGrData_GetVatAmount(btwGrList,periods[p]);
            var vatDue=this.getVatGrData_CalcVatDue(btwGrList);
            var vatTotal=this.getVatGrData_CalcVatTotal(btwGrList,vatDue,periods[p]);

            var data={}
            data.period=periods[p];
            data.btwGrList=btwGrList;
            data.vatDue=vatDue;
            data.vatTotal=vatTotal;

            results.push(data);
        }
        //Banana.Ui.showText(JSON.stringify(results));
        return results;
    }

    /**
     * Calculate the vatBalance for each group
     * @param {*} btwGrList 
     */
    getVatGrData_GetVatAmount(btwGrList,p){
        for (var gr in btwGrList){
            var vatCodes=btwGrList[gr].vatCodes;
            var vatBalance=this.banDoc.vatCurrentBalance(vatCodes,p.startDate, p.endDate);
            btwGrList[gr].vatBalance=vatBalance;
            Banana.console.debug(vatBalance.vatPosted+" / "+p.startDate+" "+p.endDate);
        }
    }

    /**
     * Get the total of the VAT Due (rubriek 1-4) for each quarter
     * The total is calculated by adding up the amounts of the groups to which the VAT due codes belong.
     * @param {*} vatGrData object with groups data.
     */
    getVatGrData_CalcVatDue(btwGrList){
        var vatDue="";
        for (var gr in btwGrList){
            if(btwGrList[gr].gr!="5"){
                vatDue=Banana.SDecimal.add(vatDue,this.getReportAmount(btwGrList[gr].vatBalance.vatPosted));
            }
        }
        return vatDue;
    }

        /**
     * Get the total of the VAT: Vat Due-Vat deductible, and the difference between the report amount and the accounting amount
     * Vat Total Report: result taken by subtracting the calculated Vat due and the vat deductible calculated for the group 5b.
     * Vat Total Accounting: total calculated with the vatCurrentBalance.
     * Vat difference: the difference between the amount trunc calculated for the report and the accounting amount
     * @param {*} btwGrList object with groups data 
     * @param {*} vatDue array with the calculated vat due for each quarter
     * @returns an array with the results
     */
    getVatGrData_CalcVatTotal(btwGrList,vatDue,period){

        var total={};

        //report total
        var vatDeductible=this.getReportAmount(btwGrList.fifthB.vatBalance.vatPosted.toString());
        total.report=Banana.SDecimal.subtract(vatDue,vatDeductible);

        //accounting total
        var vatCurrBal=this.banDoc.vatCurrentBalance("*",period.startDate,period.endDate);
        total.accounting=this.getAccountingAmount(vatCurrBal.vatPosted);

        //difference
        total.difference=this.getAccountingAmount(Banana.SDecimal.subtract(total.accounting,total.report));

        return total;
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

    /**
     * return the document info
     * @returns 
     */
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

    /**
     * Defines the style for the report
     * @returns 
     */
    getReportStyle() {
        var textCSS = "";
        var file = Banana.IO.getLocalFile("file:script/ch.banana.nl.app.vat.report.css");
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

    /**
     * @description checks the type of error that has occurred and returns a message.
     * @Param {*} errorId: the error identification
     * @Param {*} lang: the language
     * @returns empty
     */
    getErrorMessage(errorId, lang,vatCode) {
        if (!lang)
            lang = 'en';
        switch (errorId) {
            case this.VATCODE_WITHOUT_GR1:
                return "The following VAT code: "+ vatCode +" does not have a Gr1 assigned, check in your VAT codes Table";
            case this.ID_ERR_EXPERIMENTAL_REQUIRED:
                return "The Experimental version is required";
            case this.ID_ERR_LICENSE_NOTVALID:
                return "This extension requires Banana Accounting+ Advanced";
            case this.ID_ERR_VERSION_NOTSUPPORTED:
                if (lang == 'it')
                    return "Lo script non funziona con la vostra attuale versione di Banana Contabilità.\nVersione minimina richiesta: %1.\nPer aggiornare o per maggiori informazioni cliccare su Aiuto";
                else if (lang == 'fr')
                    return "Ce script ne s'exécute pas avec votre version actuelle de Banana Comptabilité.\nVersion minimale requise: %1.\nPour mettre à jour ou pour plus d'informations, cliquez sur Aide";
                else if (lang == 'de')
                    return "Das Skript wird mit Ihrer aktuellen Version von Banana Buchhaltung nicht ausgeführt.\nMindestversion erforderlich: %1.\nKlicken Sie auf Hilfe, um zu aktualisieren oder weitere Informationen zu bekommen";
                else
                    return "This script does not run with your current version of Banana Accounting.\nMinimum version required: %1.\nTo update or for more information click on Help";
        }
        return '';
    }
    
    isBananaAdvanced() {
        // Starting from version 10.0.7 it is possible to read the property Banana.application.license.isWithinMaxRowLimits 
        // to check if all application functionalities are permitted
        // the version Advanced returns isWithinMaxRowLimits always false
        // other versions return isWithinMaxRowLimits true if the limit of transactions number has not been reached

        if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, "10.0.7") >= 0) {
            var license = Banana.application.license;
            if (license.licenseType === "advanced" || license.isWithinMaxFreeLines) {
                return true;
            }
        }

        return false;
    }
    
    bananaRequiredVersion(requiredVersion, expmVersion) {
        /**
         * Check Banana version
         */
        if (expmVersion) {
            requiredVersion = requiredVersion + "." + expmVersion;
        }
        if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, requiredVersion) >= 0) {
            return true;
        }
        return false;
    }
    
    /**
     * @description checks the software version, only works with the latest version: 10.0.7, if the version is not the latest
     * shows an error message
     */
    verifyBananaVersion() {
        if (!this.banDoc)
            return false;

        var BAN_VERSION_MIN = "10.0.7";
        var BAN_DEV_VERSION_MIN = "";
        var CURR_VERSION = this.bananaRequiredVersion(BAN_VERSION_MIN, BAN_DEV_VERSION_MIN);
        var CURR_LICENSE = this.isBananaAdvanced();

        if (!CURR_VERSION) {
            var msg = this.getErrorMessage(this.ID_ERR_VERSION_NOTSUPPORTED, "en","");
            msg = msg.replace("%1", BAN_VERSION_MIN);
            this.banDoc.addMessage(msg, this.ID_ERR_VERSION_NOTSUPPORTED);
            return false;
        }

        if (!CURR_LICENSE) {
            var msg = this.getErrorMessage(this.ID_ERR_LICENSE_NOTVALID, "en","");
            this.banDoc.addMessage(msg, this.ID_ERR_LICENSE_NOTVALID);
            return false;
        }
        return true;
    }
 }

 function exec(inData, options) {


    if (!Banana.document)
        return "@Cancel";

    var startDate=Banana.document.startPeriod();
    var endDate=Banana.document.startPeriod();

    var btwEvaluationReport= new BTWEvaluationReport(Banana.document,startDate,endDate);


    if(!btwEvaluationReport.verifyBananaVersion())
        return "@Cancel";

    btwEvaluationReport.verifyifHasGr1();
    var report = btwEvaluationReport.createBtwEvaluationReport();
    var stylesheet = btwEvaluationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}