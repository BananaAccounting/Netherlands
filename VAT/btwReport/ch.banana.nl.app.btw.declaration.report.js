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
*   -All amounts should be without decimals and rounded down, for this reason it is necessary to indicate the accounting amount and the rounding difference.
*   -User should decide the period
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

    getReportTable(report) {
        var tableBalance = report.addTable('reportTable');
        tableBalance.getCaption().addText("Omzetbelasting, Aangifteperiode: "+Banana.Converter.toLocaleDateFormat(this.startDate)+"/"+Banana.Converter.toLocaleDateFormat(this.endDate));
        //columns
        tableBalance.addColumn("c1").setStyleAttributes("width:60%");
        tableBalance.addColumn("c2").setStyleAttributes("width:20%");
        tableBalance.addColumn("c3").setStyleAttributes("width:20%");

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

        var vatGrData=this.getVatGrData();
        var vatDeductible=this.getTotalVatDeductible();//deductible vat
        var vatPosted=this.getVatPosted();//VatAmount - VatNotDeductible
        var rubric="";
        //create the report
        var report = Banana.Report.newReport('BTW declaration Report');
        this.getReportHeader(report);

        //add the table
        var reportTable = this.getReportTable(report);


        //I go through all the elements and print the values
        for(var row in vatGrData){

            var group=vatGrData[row];

            //each time the group (the rubriek) change, i add the the rubriek title
            if(rubric!==group.gr){
                //empty row
                var tableRow = reportTable.addRow("");
                tableRow.addCell("", "",3);

                //title row
                var rubTitle=this.getRubriekTitle(group.gr);
                var tableRow = reportTable.addRow("");
                tableRow.addCell(rubTitle, "styleRubriekTitle",3);

                //columns header row
                var tableRow = reportTable.addRow("");
                tableRow.addCell("", "");
                tableRow.addCell("Omzet", "");
                tableRow.addCell("Omzetbelasting", "");

            }

            //add groups
            var tableRow = reportTable.addRow("");
            //add the description
            tableRow.addCell(group.description,"");
            if(group.code!="5a"){
                //add Omzet amounts
                if(group.hasOmzet){
                    tableRow.addCell(Banana.Converter.toLocaleNumberFormat(group.vatTaxable,"",false),"styleAmount");
                }else{
                    tableRow.addCell("");
                }
                if(group.hasOmzetBelasting){
                    //add Omzetbelasting amounts
                    tableRow.addCell(Banana.Converter.toLocaleNumberFormat(group.vatAmount,"",false),"styleAmount");
                }else{
                    tableRow.addCell("");
                }
            } else{//add the sum of rubriek 1 to 4 in the group 5a.
                tableRow.addCell("","");
                tableRow.addCell(Banana.Converter.toLocaleNumberFormat(vatDeductible.report,"0",false), "styleAmount");
            }

            rubric=group.gr;

        }

        //add the total
        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //total row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Eindtotaal", "");
        tableRow.addCell("", "");
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(vatPosted.report,"",false), "styleAmount");

        
        //accounting amount
        var accAmountParagraph=report.addParagraph();
        //check the accounting amount
        accAmountParagraph.addText("Accounting end total: "+Banana.Converter.toLocaleNumberFormat(vatPosted.accounting,"2",false),"styleFinalParagraphs");

        //rounding difference
        var roundDiffParagraph=report.addParagraph();
        roundDiffParagraph.addText("Rounding difference: "+vatPosted.difference,"styleFinalParagraphs");


        return report;

    }

    /**
     * Adds to the object the property vatAmount ord vatTaxable which contains a string with the quarterly values of the VAT amounts/tabxable calculated for each group divided by ';'.
     * @param {*} isVat 
     * @returns 
     */
    getVatGrData(){

        var btwGrList=this.setBtwGrList();

        for (var gr in btwGrList){

            var formattedCodes=this.setParamCodes(btwGrList[gr].vatCodes);

            var vatCurrBal=this.banDoc.vatCurrentBalance(formattedCodes,this.startDate,this.endDate);

            //save the vat (amount with decimals for the accounting and trunc down for the report)
            btwGrList[gr].vatAmount=this.getReportAmount(vatCurrBal.vatAmount);

            //for 5b there is no taxable amount 
            if(btwGrList[gr].code!=="5b")
                btwGrList[gr].vatTaxable=this.getReportAmount(vatCurrBal.vatTaxable);

        }
        return btwGrList;
    }

    /**
     * Get the total of the VAT deductible.
     * 5a-5b
     * @param {*} vatGrData object with groups data 
     * @param {*} rubricsSums array with rubrics sums
     */

    getTotalVatDeductible(){
        var vatDeductible={};

        var vatCurrBal=this.banDoc.vatCurrentBalance("*",this.startDate,this.endDate,onlyVatDeductible);

        vatDeductible.report=this.getReportAmount(vatCurrBal.vatAmount);
        vatDeductible.accounting=this.getAccountingAmount(vatCurrBal.vatAmount);

        return vatDeductible;
    }

    /**
     * Get the total of the VAT posted: VatAmount - VatNotDeductible.
     * @param {*} vatGrData object with groups data 
     * @returns an array with the results
     */
    getVatPosted(){
        var vatPosted={};

        var vatCurrBal=this.banDoc.vatCurrentBalance("*",this.startDate,this.endDate);

        vatPosted.report=this.getReportAmount(vatCurrBal.vatPosted);
        vatPosted.accounting=this.getAccountingAmount(vatCurrBal.vatPosted);
        vatPosted.difference=Banana.SDecimal.subtract(vatPosted.accounting,vatPosted.report);

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
     * Takes a date and return a JS date object
     */
    getJsDate(date){

        var jsDate=Banana.Converter.toDate(date);

        return jsDate;

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

 /**
  * This function is called from the vatCurrentBalance, if a vat code is of type deductible vat, the value is taken in the calculation.
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
    btwDeclarationReport.verifyifHasGr1();
    var report = btwDeclarationReport.createBtwDeclarationReport();
    var stylesheet = btwDeclarationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}