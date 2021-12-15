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
// @id = ch.banana.nl.vat.js
// @api = 1.0
// @pubdate = 2021-11-18
// @publisher = Banana.ch SA
// @description.en = VAT Annual Overview
// @description.nl = Jaarlijks BTW rapport
// @outputformat = none
// @inputdataform = none
// @task = app.command
// @doctype = 100.110;110.110;130.110;100.130
// @inputdatasource = none
// @timeout = -1
// @includejs=ch.banana.nl.app.vat.js

/*
*   SUMMARY
*
*   This Exstension creates a VAT delcaration report for Netherland.
*
*   specifics:
*   -In the Dutch VAT return it is possible to round down the amounts of VAT due and round up the recoverable VAT
*   -Divde the year in quarters
*   -The vatCurrentBalance/vatCurrentBalances API is used to calculate the vat. of the properties it returns we use "vatPosted" as it is already net of non-deductible vat.
*/

/**
 * REPORT STRUCTURE
 * 
 * Title: VAT REPORT 01-01-2021/31-12-2021
 * 
 * 3 Columns table: from Rubriek1 to Rubriek 4
 * 
 * 
 * 
 *                                                               31.03.2021                 30.06.2021              ...same structure for each quarter 
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

    /**
     * Defines and return the table structure
     * @param {*} report 
     * @returns 
     */
    function getOverviewTable(report,startDate,endDate) {
        var tableBalance = report.addTable('overviewTable');
        tableBalance.getCaption().addText("Omzetbelasting, Aangifteperiode: "+Banana.Converter.toLocaleDateFormat(startDate)+" - "+Banana.Converter.toLocaleDateFormat(endDate));
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

   
    function createVatOverviewReport(periodsData,docInfo,startDate,endDate){
        var results=periodsData;

        //create the report
        var report = Banana.Report.newReport('BTW Nederland');
        getReportHeader(report,docInfo);

        //add the table
        var overviewTable = getOverviewTable(report,startDate,endDate);

        //quarter indication
        var tableRow = overviewTable.addRow("");
        tableRow.addCell("");
        for(var i=0; i<results.length;i++){
            tableRow.addCell(results[i].period.description, "styleQuarters",2);
        }
        //titles row
        var tableRow = overviewTable.addRow("");
        tableRow.addCell("", "");
        for(var i=0; i<results.length;i++){
            tableRow.addCell("Omzet", "styleColumnTitles");
            tableRow.addCell("Omzetbelasting", "styleColumnTitles");
        }

        for(var key1 in results[0].rubricsData){

                //add title row
                var tableRow = overviewTable.addRow("");
                var rubTitle=results[0].rubricsData[key1].description;
                tableRow.addCell(rubTitle, results[0].rubricsData[key1].style,11);

                for(var key2 in results[0].rubricsData[key1].groups){

                    //add the group fields
                    var tableRow = overviewTable.addRow("");
                    tableRow.addCell(results[0].rubricsData[key1].groups[key2].description,results[0].rubricsData[key1].groups[key2].descriptionStyle);

                    if(results[0].rubricsData[key1].groups[key2].gr!="9"){
                        for(var i=0; i<results.length;i++){
                            //add Omzet amounts
                            if(results[i].rubricsData[key1].groups[key2].hasOmzet){
                                tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatTaxable,"",false),results[i].rubricsData[key1].groups[key2].amountStyle);
                            }else{
                                tableRow.addCell("");
                            }   

                            if(results[i].rubricsData[key1].groups[key2].hasOmzetBelasting){
                            //add Omzetbelasting amounts
                                tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatPosted,"",false),results[i].rubricsData[key1].groups[key2].amountStyle);
                            }else{
                                tableRow.addCell("");
                            }

                        }
                    }else{//add total amounts
                        var decimals="2"
                        if(results[0].rubricsData[key1].groups[key2].code=="9a"){
                            decimals="0";
                            for(var i=0; i<results.length;i++){
                                tableRow.addCell("");//Omzet is epmty
                                tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatAmount,decimals,false),results[i].rubricsData[key1].groups[key2].amountStyle);

                            }
                            var tableRow = overviewTable.addRow("");
                            tableRow.addCell("Controle sectie","styleTotals",11);//Omzet is epmty
                        }else{
                            for(var i=0; i<results.length;i++){
                                tableRow.addCell("");//Omzet is epmty
                                tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].rubricsData[key1].groups[key2].vatBalance.vatAmount,decimals,false),results[i].rubricsData[key1].groups[key2].amountStyle);

                            }
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
    function getYearPeriods(refDate){
        var periods=[];

        //get the current year
        //if the accounting is cover several years, takes the periods of the first year
        var currentYear = refDate.substring(0,4);

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

 function exec(inData, options) {


    if (!Banana.document)
        return "@Cancel";

    var startDate=Banana.document.startPeriod();
    var endDate=Banana.document.endPeriod();

    var reportType="periods";
    var vatReport= new VatReport(Banana.document,reportType);

    if(!vatReport.verifyBananaVersion())
        return "@Cancel";

    var periods=getYearPeriods(startDate);
    var periodsData=vatReport.getPeriodsData(periods);
    var docInfo=vatReport.getDocumentInfo();
    var report = createVatOverviewReport(periodsData,docInfo,startDate,endDate);
    var stylesheet = vatReport.getReportStyle();
    Banana.Report.preview(report,stylesheet);
}