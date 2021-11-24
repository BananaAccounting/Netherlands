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
// @pubdate = 2021-11-18
// @publisher = Banana.ch SA
// @description.en = Netherlands VAT Declaration [BETA]
// @description.nl = Netherlands VAT  Declaration [BETA]
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
*   In the Dutch VAT return it is possible to round down the amounts of VAT due and round up the recoverable VAT
*   -The vatCurrentBalance/vatCurrentBalances API is used to calculate the vat. of the properties it returns we use "vatPosted" as it is already net of non-deductible vat.
*   -BTW=VAT
*/

/**
 * REPORT STRUCTURE
 * 
 * Title: BTW REPORT 01-01-2021/31-12-2021
 * 
 * 3 Columns table: from Rubriek1 to Rubriek 4
 * 
 *              Group description                           Sales           VAT     
 * 
 * |1a. Leveringen/diensten belast met hoog tarief      | 250'000    |   52'200
 * |1b. Leveringen/diensten belast met laag tarief      | 866'000    |   77'940
 * |1c. Leveringen/diensten belast met overige tarieven |  16'700    |       -
 * |...                                                 |            |
 * |...                                                 |            |
 * 
 * 2 Columns Table: from rubriek 5
 * 
 *  *              Group description                                      VAT     
 * 
 * |5a. Verschuldigde omzetbelasting (rubrieken 1 t/m 4)|                130'140
 * |5b. Voorbelasting                                   |                16'000
 * |Eindtotaal                                          |                114'140             
 * 
 * 
 */


 var BTWDeclarationReport = class BTWDeclarationReport {

    constructor(banDoc,startDate,endDate){
        this.banDoc=banDoc;
        this.startDate=startDate;
        this.endDate=endDate;

        //errors
        this.VATCODE_WITHOUT_GR1 = "VATCODE_WITHOUT_GR1";
    }

    /**
     * Defines the table structure
     * @param {*} report 
     * @returns 
     */
    getDeclarationTable(report) {
        var tableBalance = report.addTable('declarationTable');
        tableBalance.getCaption().addText("Omzetbelasting, Aangifteperiode: "+Banana.Converter.toLocaleDateFormat(this.startDate)+"/"+Banana.Converter.toLocaleDateFormat(this.endDate));
        //columns
        tableBalance.addColumn("c1").setStyleAttributes("width:60%");
        tableBalance.addColumn("c2").setStyleAttributes("width:20%");
        tableBalance.addColumn("c3").setStyleAttributes("width:20%");

        return tableBalance;
    }

    /**
     * Defines the header structure
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
     * Defines an object with information on vat code groupings.
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


        //NINTH      * Group 9 does not exists in the vat declaration form, we created it olny for store totals (report total, accounting total and difference between those two)

        //9a
        btwGrList.ninthA={};
        btwGrList.ninthA.gr="9";
        btwGrList.ninthA.code="9a";
        btwGrList.ninthA.vatCodes="";
        btwGrList.ninthA.description="Eindtotaal";
        btwGrList.ninthA.hasOmzet=false;
        btwGrList.ninthA.hasOmzetBelasting=false;

        //9b
        btwGrList.ninthB={};
        btwGrList.ninthB.gr="9";
        btwGrList.ninthB.code="9b";
        btwGrList.ninthB.vatCodes="";
        btwGrList.ninthB.description="Eindtotaal(Accounting)";
        btwGrList.ninthB.hasOmzet=false;
        btwGrList.ninthB.hasOmzetBelasting=false;

        //9c
        btwGrList.ninthC={};
        btwGrList.ninthC.gr="9";
        btwGrList.ninthC.code="9c";
        btwGrList.ninthC.vatCodes="";
        btwGrList.ninthC.description="Rounding difference";
        btwGrList.ninthC.hasOmzet=false;
        btwGrList.ninthC.hasOmzetBelasting=false;


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
     * Creates the report
     * @returns 
     */
    createBtwDeclarationReport(){

        var results=this.getVatGrData();
        var rubric="";
        //create the report
        var report = Banana.Report.newReport('BTW declaration Report');
        this.getReportHeader(report);

        //add the table
        var declarationTable = this.getDeclarationTable(report);


        //I go through all the elements and print the values
        for(var row in results){

            var group=results[row];

            //each time the group (the rubriek) change, i add the the rubriek title
            if(rubric!==group.gr){
                //empty row
                var tableRow = declarationTable.addRow("");
                tableRow.addCell("", "",3);

                //title row
                var rubTitle=this.getRubriekTitle(group.gr);
                var tableRow = declarationTable.addRow("");
                tableRow.addCell(rubTitle, "styleRubriekTitle",3);

                //columns header row
                var tableRow = declarationTable.addRow("");
                tableRow.addCell("", "");
                tableRow.addCell("Omzet", "");
                tableRow.addCell("Omzetbelasting", "");

            }
                //add the group fields
                var tableRow = declarationTable.addRow("");
                tableRow.addCell(group.description,"");

                if(group.gr!="9"){
                    //add Omzet amounts
                    if(group.hasOmzet){
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(group.vatBalance_formatted.vatTaxable,"",false),"styleAmount styleAmount_decl");
                    }else{
                        tableRow.addCell("","styleAmount");
                    }   

                    if(group.hasOmzetBelasting){
                    //add Omzetbelasting amounts
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(group.vatBalance_formatted.vatPosted,"",false),"styleAmount styleAmount_decl");
                    }else{
                        tableRow.addCell("","styleAmount");
                    }

                }else{//add total amounts
                    tableRow.addCell("","styleAmount");//Omzet is epmty
                    var decimals="2"
                    if(group.code=="9a")
                        decimals="0";
                    tableRow.addCell(Banana.Converter.toLocaleNumberFormat(group.vatBalance.vatAmount,decimals,false),"styleAmount styleAmount_decl");
                }

            rubric=group.gr;

        }

        return report;

    }

    /**
     * Calculate and adds to the object the properties vatAmount and vatTaxable.
     * @param {*} isVat 
     * @returns 
     */
    getVatGrData(){

        var periodData=this.setBtwGrList();

        //calculate vatAmounts
        this.getVatGrData_GetVatAmount(periodData);
        //format the amounts
        this.getVatGrData_formatAmounts(periodData);
        //5a
        this.getVatGrData_CalcVatDue(periodData);
        // 9 calc endtotals
        this.getVatGrData_CalcVatTotal(periodData);

        return periodData;
    }

    /**
     * Calculate the vatBalance for each group
     * @param {*} btwGrList 
     */
    getVatGrData_GetVatAmount(btwGrList){
        for (var gr in btwGrList){
            var vatCodes=btwGrList[gr].vatCodes;
            var vatBalance=this.banDoc.vatCurrentBalance(vatCodes,this.startDate,this.endDate);
            btwGrList[gr].vatBalance=vatBalance;
        }
    }

        /**
     * Format all the amounts before the calculations, beacuse for them i need the right amounts
     * @param {*} btwGrList 
     */
    getVatGrData_formatAmounts(btwGrList){
        for (var gr in btwGrList){
            var group=btwGrList[gr];
            //format the amounts for the report, I format all values for rubrics 1 to 5 and put them in a new propertie. i do this for each property returned by currentBalance.
            btwGrList[gr].vatBalance_formatted={};
            if(group.code!=="5b"){
                btwGrList[gr].vatBalance_formatted.vatPosted=Math.trunc(Banana.SDecimal.abs(group.vatBalance.vatPosted));
                btwGrList[gr].vatBalance_formatted.vatAmount=Math.trunc(Banana.SDecimal.abs(group.vatBalance.vatAmount));
                btwGrList[gr].vatBalance_formatted.vatTaxable=Math.trunc(Banana.SDecimal.abs(group.vatBalance.vatTaxable));
            }else{
                btwGrList[gr].vatBalance_formatted.vatPosted=Math.ceil(Banana.SDecimal.abs(group.vatBalance.vatPosted));
                btwGrList[gr].vatBalance_formatted.vatAmount=Math.ceil(Banana.SDecimal.abs(group.vatBalance.vatAmount));
                btwGrList[gr].vatBalance_formatted.vatTaxable=Math.ceil(Banana.SDecimal.abs(group.vatBalance.vatTaxable));
            }
        }

    }

    /* Get the total of the VAT Due (rubriek 1-4) for each quarter
    * The total is calculated by adding up the amounts of the groups to which the VAT due codes belong.
    * @param {*} vatGrData object with groups data.
    */
    getVatGrData_CalcVatDue(btwGrList){
       var vatDue="";
       //calculate the vat due value, i need only the formatted one
       for (var gr in btwGrList){
           if(btwGrList[gr].gr!="5"){
               vatDue=Banana.SDecimal.add(vatDue,btwGrList[gr].vatBalance_formatted.vatPosted);
           }
       }
       //add the value to the property
       btwGrList.fifthA.vatBalance_formatted.vatPosted=vatDue;
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
    getVatGrData_CalcVatTotal(btwGrList){

        //report total 5b
        // 5a-5b assigned to group 9a
        btwGrList.ninthA.vatBalance.vatAmount=Banana.SDecimal.subtract(btwGrList.fifthA.vatBalance_formatted.vatPosted,btwGrList.fifthB.vatBalance_formatted.vatPosted);

        //accounting total
        var vatCurrBal=this.banDoc.vatCurrentBalance("*",this.startDate,this.endDate);
        btwGrList.ninthB.vatBalance.vatAmount=Banana.SDecimal.abs(vatCurrBal.vatPosted);

        //difference
        btwGrList.ninthC.vatBalance.vatAmount=Banana.SDecimal.subtract(btwGrList.ninthB.vatBalance.vatAmount,btwGrList.ninthA.vatBalance.vatAmount);
        
    }

    verifyifHasGr1(){
        var codes=[];
        var table = this.banDoc.table("VatCodes");
        if (!table)
            return codes;
            
        //VERIFICARE ANCHE I CODICI NON UTILIZZATI

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
            var msg = this.getErrorMessage(this.ID_ERR_VERSION_NOTSUPPORTED,"en","");
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

 function getPeriodSettings(param) {

	//The formeters of the period that we need
	var scriptform = {
		"selectionStartDate": "",
		"selectionEndDate": "",
		"selectionChecked": "false"
	};

	//Read script settings
	var data = Banana.document.getScriptSettings();

	//Check if there are previously saved settings and read them
	if (data.length > 0) {
		try {
			var readSettings = JSON.parse(data);

			//We check if "readSettings" is not null, then we fill the formeters with the values just read
			if (readSettings) {
				scriptform = readSettings;
			}
		} catch (e) {}
	}

	//We take the accounting "starting date" and "ending date" from the document. These will be used as default dates
	var docStartDate = Banana.document.startPeriod();
	var docEndDate = Banana.document.endPeriod();

	//A dialog window is opened asking the user to insert the desired period. By default is the accounting period
	var selectedDates = Banana.Ui.getPeriod(param.reportName, docStartDate, docEndDate,
			scriptform.selectionStartDate, scriptform.selectionEndDate, scriptform.selectionChecked);

	//We take the values entered by the user and save them as "new default" values.
	//This because the next time the script will be executed, the dialog window will contains the new values.
	if (selectedDates) {
		scriptform["selectionStartDate"] = selectedDates.startDate;
		scriptform["selectionEndDate"] = selectedDates.endDate;
		scriptform["selectionChecked"] = selectedDates.hasSelection;

		//Save script settings
		var formToString = JSON.stringify(scriptform);
		var value = Banana.document.setScriptSettings(formToString);
	} else {
		//User clicked cancel
		return;
	}
	return scriptform;
}

 function exec(inData, options) {

    var dateForm = getPeriodSettings("Select Date");
   
    if (!dateForm) {
       return;
    }

    if (!Banana.document)
        return "@Cancel";

    var btwDeclarationReport= new BTWDeclarationReport(Banana.document,dateForm.selectionStartDate, dateForm.selectionEndDate);

    if(!btwDeclarationReport.verifyBananaVersion()){
        return "@Cancel";
    }

    btwDeclarationReport.verifyifHasGr1();
    var report = btwDeclarationReport.createBtwDeclarationReport();
    var stylesheet = btwDeclarationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}