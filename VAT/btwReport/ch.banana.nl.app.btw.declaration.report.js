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

    constructor(banDoc,startDate,endDate){
        this.banDoc=banDoc;
        this.startDate=startDate;
        this.endDate=endDate;
        this.rubSum="";
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

    getFormattedAmount(value){
        var amount=Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.abs(value),"",false);

        return amount;

    }

    createBtwDeclarationReport(){

        let codesData=this.getCodesData();
        var startDate=this.startDate;
        var endDate=this.endDate;
        //create the report
        var report = Banana.Report.newReport('BTW declaration Report');
        this.getReportHeader(report);

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
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1a. Leveringen/diensten belast met hoog tarief", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"1a");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"1a");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =Math.trunc(vatCurrBal.vatAmount);
        //increment the totals
        this.rubSum_trunc=Banana.SDecimal.add(this.rubSum,amount);
        amount=this.getFormattedAmount(amount);
        tableRow.addCell(amount, "styleAmount");

        //1b. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1b. Leveringen/diensten belast met laag tarief", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"1b");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"1b");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");

        //1c. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1c. Leveringen/diensten belast met overige tarieven, behalve 0%", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"1c");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"1c");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");

        //1d. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1d. Privégebruik", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"1c");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"1d");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");

        //1e. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("1e. Leveringen/diensten belast met 0% of niet bij u belast", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"1e");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"1d");
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");

        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //RUBRIEK 2
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Rubriek 2: Verleggingsregelingen", "styleRubriekTitle",3);

        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "");
        tableRow.addCell("Omzet", "");
        tableRow.addCell("Omzetbelasting", "");

        //2a. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("2a. Leveringen/diensten waarbij de omzetbelasting naar u is verlegd", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"2a");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"2a");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");

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
        var tableRow = reportTable.addRow("");
        tableRow.addCell("3a. Leveringen naar landen buiten de EU (uitvoer)", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"3a");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        tableRow.addCell("", "");

        //3b. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("3b. Leveringen naar of diensten in landen binnen de EU", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"3b");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        tableRow.addCell("", "");

        //3c. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("3c. Installatie/ afstandsverkopen binnen de EU", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"3c");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        tableRow.addCell("", "");


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
        var tableRow = reportTable.addRow("");
        tableRow.addCell("4a. Leveringen/diensten uit landen buiten de EU", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"4a");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"4a");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");

        //4b. Line
        var tableRow = reportTable.addRow("");
        tableRow.addCell("4b. Leveringen/diensten uit landen binnen de EU", "");
        //Omzet
        var grTaxAmount=this.getAmountForGr1(codesData,"4b");
        tableRow.addCell(grTaxAmount, "styleAmount");
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"4b");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        var amount =this.getFormattedAmount(vatCurrBal.vatAmount);
        this.rubSum=Banana.SDecimal.add(this.rubSum,amount);
        tableRow.addCell(amount, "styleAmount");


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
        tableRow.addCell("", "");
        var amount =this.getFormattedAmount(this.rubSum);
        tableRow.addCell(amount, "styleAmount");

        //5b Line
        //Omzetbelasting
        var grVatAmount=this.setParamCodes(codesData,"5b");
        var tableRow = reportTable.addRow("");
        tableRow.addCell("5b. Voorbelasting", "");
        tableRow.addCell("", "");
        var vatCurrBal=this.banDoc.vatCurrentBalance(grVatAmount,startDate,endDate);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(Banana.SDecimal.abs(vatCurrBal.vatAmount),"",false), "styleAmount");
        


        //empty row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("", "",3);

        //total row
        var tableRow = reportTable.addRow("");
        tableRow.addCell("Eindtotaal", "");
        tableRow.addCell("", "");
        var sheetTotal=Banana.SDecimal.subtract(Banana.SDecimal.abs(this.rubSum),vatCurrBal.vatAmount);
        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(sheetTotal,"",false), "styleAmount");


        //rounding difference


        //accounting amount


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

            if (vatCode && gr1Code) {
  
                btwCode.vatCode=vatCode;
                btwCode.gr1Code=gr1Code;

                codes.push(btwCode);
                //Banana.console.debug(JSON.stringify(btwCode));
            }
        }

        return codes;
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
    var report = btwDeclarationReport.createBtwDeclarationReport();
    var stylesheet = btwDeclarationReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}