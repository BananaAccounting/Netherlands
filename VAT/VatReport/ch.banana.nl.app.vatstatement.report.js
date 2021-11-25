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
// @description.en =  VAT Statement [BETA]
// @description.nl = VAT  Statement [BETA]
// @doctype = *.*
// @outputformat = none
// @inputdataform = none
// @task = app.command
// @inputdatasource = none
// @timeout = -1
// @includejs=ch.banana.nl.app.js

/*
*   SUMMARY
*
*   This Exstension creates a VAT delcaration report for Netherland.
*
*   specifics:
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

    /**
     * Defines the table structure
     * @param {*} report 
     * @returns 
     */
    function getStatementTable(report,startDate,endDate) {
        var tableBalance = report.addTable('statementTable');
        tableBalance.getCaption().addText("Omzetbelasting, Aangifteperiode: "+Banana.Converter.toLocaleDateFormat(startDate)+"/"+Banana.Converter.toLocaleDateFormat(endDate));
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
    function getReportHeader(report,docInfo){
        var headerParagraph = report.getHeader().addSection();
        headerParagraph.addParagraph(docInfo.company, "styleNormalHeader styleCompanyName");
        headerParagraph.addParagraph(docInfo.address, "styleNormalHeader");
        headerParagraph.addParagraph(docInfo.zip+", "+docInfo.city, "styleNormalHeader");
        headerParagraph.addParagraph(docInfo.vatNumber, "styleNormalHeader");
        headerParagraph.addParagraph("", "");
        headerParagraph.addParagraph("", "");
        headerParagraph.addParagraph("", "");

    }

/**
 * Creates the report
 * @returns 
 */
function createVatStatementReport(periodsData,docInfo,startDate,endDate){

    var results=periodsData;
    //create the report
    var report = Banana.Report.newReport('VAT Statement Report');
    getReportHeader(report,docInfo);

    //add the table
    var statementTable = getStatementTable(report,startDate,endDate);

    for(var key1 in results[0].rubricsData){

        //add title row
        var tableRow = statementTable.addRow("");
        var rubTitle="\n"+results[0].rubricsData[key1].description+"\n";
        tableRow.addCell(rubTitle, results[0].rubricsData[key1].style,3);

        for(var key2 in results[0].rubricsData[key1].groups){

            //add the group fields
            var tableRow = statementTable.addRow("");
            var grDescr=results[0].rubricsData[key1].groups[key2].description;
            tableRow.addCell(grDescr,"");

            if(results[0].rubricsData[key1].groups[key2].gr!="9"){
                for(var i=0; i<results.length;i++){
                    //add Omzet amounts
                    if(results[i].rubricsData[key1].groups[key2].hasOmzet){
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatTaxable,"",false),"styleAmount styleAmount_decl");
                    }else{
                        tableRow.addCell("","styleAmount");
                    }   

                    if(results[i].rubricsData[key1].groups[key2].hasOmzetBelasting){
                    //add Omzetbelasting amounts
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatPosted,"",false),"styleAmount styleAmount_decl");
                    }else{
                        tableRow.addCell("","styleAmount");
                    }

                }
            }else{//add total amounts
                for(var i=0; i<results.length;i++){
                    tableRow.addCell("","styleAmount");//Omzet is epmty
                    var decimals="2"
                    if(results[0].rubricsData[key1].groups[key2].code=="9a")
                        decimals="0";
                    tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatAmount,decimals,false),"styleAmount styleAmount_decl");

                }
            }
        }
    }

    return report;

}
    /**
     * get  an array with the periods
     * @param {*} refDate a reference date
     * @returns 
     */
     function getPeriods(startDate,endDate){
        var periods=[];
        //first quarter
        var p1={}
        p1.startDate=startDate;
        p1.endDate=endDate;
        p1.description=Banana.Converter.toLocaleDateFormat(p1.endDate);
        periods.push(p1);

        return periods;


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

    var startDate=Banana.document.startPeriod();
    var endDate=Banana.document.endPeriod();

    var vatReport= new VatReport(Banana.document,startDate,endDate);

    if(!vatReport.verifyBananaVersion())
        return "@Cancel";

    vatReport.verifyifHasGr1();
    var periods=getPeriods(startDate,endDate);
    var periodsData=vatReport.getPeriodsData(periods);
    var docInfo=vatReport.getDocumentInfo();
    var report = createVatStatementReport(periodsData,docInfo,startDate,endDate);
    var stylesheet = vatReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}