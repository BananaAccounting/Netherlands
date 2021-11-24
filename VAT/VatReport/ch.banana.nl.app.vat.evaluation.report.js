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
*   -In the Dutch VAT return it is possible to round down the amounts of VAT due and round up the recoverable VAT
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

        //FIRST "RUBRIC"
        btwGrList[1]={};
        btwGrList[1].description="Rubriek 1: Prestaties binnenland";
        btwGrList[1].style="styleRubriekTitle";
        btwGrList[1].isGroup = true;
        btwGrList[1].groups = this.setBtwGrList_firstRubric();

        //SECOND "RUBRIC"
        btwGrList[2]={};
        btwGrList[2].description="Rubriek 2: Verleggingsregelingen";
        btwGrList[2].style="styleRubriekTitle";
        btwGrList[2].isGroup = true;
        btwGrList[2].groups=this.setBtwGrList_secondRubric();

        //THIRD "RUBRIC"
        btwGrList[3]={};
        btwGrList[3].description="Rubriek 3: Prestaties naar of in het buitenland";
        btwGrList[3].style="styleRubriekTitle";
        btwGrList[3].isGroup = true;
        btwGrList[3].groups=this.setBtwGrList_thirdRubric();

        //FOURTH "RUBRIC"
        btwGrList[4]={};
        btwGrList[4].description="Rubriek 4: Prestaties vanuit het buitenland aan u verricht";
        btwGrList[4].style="styleRubriekTitle";
        btwGrList[4].groups=this.setBtwGrList_fourthRubric();

        //FIFTH "RUBRIEK"
        btwGrList[5]={};
        btwGrList[5].description="Rubriek 5: Voorbelasting, kleineondernemersregeling en eindtotaal";
        btwGrList[5].style="styleRubriekTitle";
        btwGrList[5].isGroup = true;
        btwGrList[5].groups=this.setBtwGrList_fifthRubric();

        //NINTH  * Group 9 does not exists in the vat declaration form, we created it olny for store totals (report total, accounting total and difference between those two)
        btwGrList[9]={};
        btwGrList[9].description="Total section";
        btwGrList[9].style="styleRubriekTitle";
        btwGrList[9].isGroup = true;
        btwGrList[5].groups=this.setBtwGrList_ninthRubric();

        
        Banana.Ui.showText(JSON.stringify(btwGrList));

        return btwGrList;

    }

    setBtwGrList_firstRubric(){

        var groups=[];
        var btwGrList={};
        //1a
        btwGrList['1a']={};
        btwGrList['1a'].gr="1";
        btwGrList['1a'].multiply=-1;
        btwGrList['1a'].code="1a";
        btwGrList['1a'].vatCodes="V21";
        btwGrList['1a'].description="1a. Leveringen/diensten belast met hoog tarief";
        btwGrList['1a'].hasOmzet=true;
        btwGrList['1a'].hasOmzetBelasting=true;

        groups.push(btwGrList);


        //1b
        btwGrList['1b']={};
        btwGrList['1b'].gr="1";
        btwGrList['1b'].multiply=-1;
        btwGrList['1b'].code="1b";
        btwGrList['1b'].vatCodes="V9";
        btwGrList['1b'].description="1b. Leveringen/diensten belast met laag tarief";
        btwGrList['1b'].hasOmzet=true;
        btwGrList['1b'].hasOmzetBelasting=true;
        groups.push(btwGrList);

        //1c
        btwGrList['1c']={};
        btwGrList['1c'].gr="1";
        btwGrList['1c'].multiply=-1;
        btwGrList['1c'].code="1c";
        btwGrList['1c'].vatCodes="VOT";
        btwGrList['1c'].description="1c. Leveringen/diensten belast met overige tarieven, behalve 0%";
        btwGrList['1c'].hasOmzet=true;
        btwGrList['1c'].hasOmzetBelasting=true;
        groups.push(btwGrList);

        //1d
        btwGrList['1d']={};
        btwGrList['1d'].gr="1";
        btwGrList['1d'].multiply=-1;
        btwGrList['1d'].code="1d";
        btwGrList['1d'].vatCodes="PG21|PG9|PG27|PG15";
        btwGrList['1d'].description="1d. Privégebruik";
        btwGrList['1d'].hasOmzet=true;
        btwGrList['1d'].hasOmzetBelasting=true;
        groups.push(btwGrList);

        //1e
        btwGrList['1e']={};
        btwGrList['1e'].gr="1";
        btwGrList['1e'].multiply=-1;
        btwGrList['1e'].code="1e";
        btwGrList['1e'].vatCodes="V0";
        btwGrList['1e'].description="1e. Leveringen/diensten belast met 0% of niet bij u belast";
        btwGrList['1e'].hasOmzet=true;
        btwGrList['1e'].hasOmzetBelasting=false;
        groups.push(btwGrList);

        return groups;
    }


    setBtwGrList_secondRubric(){
        var groups=[];
        var btwGrList={};
        //2a
        btwGrList['2a']={};
        btwGrList['2a'].gr="2";
        btwGrList['2a'].multiply=-1;
        btwGrList['2a'].code="2a";
        btwGrList['2a'].vatCodes="VR21|VR9";
        btwGrList['2a'].description="2a. Leveringen/diensten waarbij de omzetbelasting naar u is verlegd";
        btwGrList['2a'].hasOmzet=true;
        btwGrList['2a'].hasOmzetBelasting=true;

        groups.push(btwGrList);

        return groups;
    }

    setBtwGrList_thirdRubric(){

        var groups=[];
        var btwGrList={};
        //3a
        btwGrList['3a']={};
        btwGrList['3a'].gr="3";
        btwGrList['3a'].multiply=-1;
        btwGrList['3a'].code="3a";
        btwGrList['3a'].vatCodes="VX";
        btwGrList['3a'].description="3a. Leveringen naar landen buiten de EU (uitvoer)";
        btwGrList['3a'].hasOmzet=true;
        btwGrList['3a'].hasOmzetBelasting=false;

        groups.push(btwGrList);

        //3b
        btwGrList['3b']={};
        btwGrList['3b'].gr="3";
        btwGrList['3b'].multiply=-1;
        btwGrList['3b'].code="3b";
        btwGrList['3b'].vatCodes="VEU";
        btwGrList['3b'].description="3b. Leveringen naar of diensten in landen binnen de EU";
        btwGrList['3b'].hasOmzet=true;
        btwGrList['3b'].hasOmzetBelasting=false;

        groups.push(btwGrList);

        //3c
        btwGrList['3c']={};
        btwGrList['3c'].gr="3";
        btwGrList['3b'].multiply=-1;
        btwGrList['3c'].code="3c";
        btwGrList['3c'].vatCodes="VEUI";
        btwGrList['3c'].description="3c. Installatie/ afstandsverkopen binnen de EU";
        btwGrList['3c'].hasOmzet=true;
        btwGrList['3c'].hasOmzetBelasting=false;

        groups.push(btwGrList);

        return groups;
    }



    setBtwGrList_fourthRubric(){
        var groups=[];
        var btwGrList={};
        //4a
        btwGrList['4a']={};
        btwGrList['4a'].gr="4";
        btwGrList['4a'].multiply=-1;
        btwGrList['4a'].code="4a";
        btwGrList['4a'].vatCodes="VIX21|VIX9";
        btwGrList['4a'].description="4a. Leveringen/diensten uit landen buiten de EU";
        btwGrList['4a'].hasOmzet=true;
        btwGrList['4a'].hasOmzetBelasting=true;

        groups.push(btwGrList);

        //4b
        btwGrList['4b']={};
        btwGrList['4b'].gr="4";
        btwGrList['4b'].multiply=-1;
        btwGrList['4b'].code="4b";
        btwGrList['4b'].vatCodes="ICP21|ICP9";
        btwGrList['4b'].description="4b. Leveringen/diensten uit landen binnen de EU";
        btwGrList['4b'].hasOmzet=true;
        btwGrList['4b'].hasOmzetBelasting=true;

        groups.push(btwGrList);

        return groups;
    }



    setBtwGrList_fifthRubric(){

        var groups=[];
        var btwGrList={};

        //5a
        btwGrList['5a']={};
        btwGrList['5a'].gr="5";
        btwGrList['5a'].multiply=-1;
        btwGrList['5a'].code="5a";
        btwGrList['5a'].vatCodes="";
        btwGrList['5a'].description="5a. Verschuldigde omzetbelasting (rubrieken 1t/m 4)";
        btwGrList['5a'].hasOmzet=false;
        btwGrList['5a'].hasOmzetBelasting=true;

        groups.push(btwGrList);

        //5b
        btwGrList['5b']={};
        btwGrList['5b'].gr="5";
        btwGrList['5b'].multiply=-1;
        btwGrList['5b'].code="5b";
        btwGrList['5b'].vatCodes="IG21|IG9|IG0|IGV|D21-2|D9-2";
        btwGrList['5b'].description="5b. Voorbelasting";
        btwGrList['5b'].hasOmzet=false;
        btwGrList['5b'].hasOmzetBelasting=true;

        groups.push(btwGrList);

        return groups;
    }

    setBtwGrList_ninthRubric(){

        var groups=[];
        var btwGrList={};


        //9a
        btwGrList['9a']={};
        btwGrList['9a'].gr="9";
        btwGrList['9a'].multiply=-1;
        btwGrList['9a'].code="9a";
        btwGrList['9a'].vatCodes="";
        btwGrList['9a'].description="Eindtotaal";
        btwGrList['9a'].hasOmzet=false;
        btwGrList['9a'].hasOmzetBelasting=false;

        groups.push(btwGrList);

        //9b
        btwGrList['9b']={};
        btwGrList['9b'].gr="9";
        btwGrList['9b'].multiply=-1;
        btwGrList['9b'].code="9b";
        btwGrList['9b'].vatCodes="";
        btwGrList['9b'].description="Eindtotaal(Accounting)";
        btwGrList['9b'].hasOmzet=false;
        btwGrList['9b'].hasOmzetBelasting=false;

        groups.push(btwGrList);

        //9c
        btwGrList['9c']={};
        btwGrList['9c'].gr="9";
        btwGrList['9c'].multiply=-1;
        btwGrList['9c'].code="9c";
        btwGrList['9c'].vatCodes="";
        btwGrList['9c'].description="Rounding difference";
        btwGrList['9c'].hasOmzet=false;
        btwGrList['9c'].hasOmzetBelasting=false;

        groups.push(btwGrList);

        return groups;
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

    createBtwEvaluationReport(){

        var results=this.getPeriodsData();
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
                //add the group fields
                var tableRow = evaluationTable.addRow("");
                tableRow.addCell(group.description,"");

                if(group.gr!="9"){
                    for(var i=0; i<results.length;i++){
                        //add Omzet amounts
                        if(group.hasOmzet){
                            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].btwGrList[key].vatBalance_formatted.vatTaxable,"",false),"styleAmount");
                        }else{
                            tableRow.addCell("","styleAmount");
                        }   

                        if(group.hasOmzetBelasting){
                        //add Omzetbelasting amounts
                            tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].btwGrList[key].vatBalance_formatted.vatPosted,"",false),"styleAmount");
                        }else{
                            tableRow.addCell("","styleAmount");
                        }

                    }
                }else{//add total amounts
                    for(var i=0; i<results.length;i++){
                        tableRow.addCell("","styleAmount");//Omzet is epmty
                        var decimals="2"
                        if(group.code=="9a")
                            decimals="0";
                        tableRow.addCell(Banana.Converter.toLocaleNumberFormat(results[i].btwGrList[key].vatBalance.vatAmount,decimals,false),"styleAmount");

                    }
                }

                rubric=group.gr;
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
     getPeriodsData(){

        //get the periods
       var periods=this.getEvaluationPeriods();
       var periodsData = [];

        for (var p = 0; p <periods.length ; p++){
            var periodData={}
            periodData.btwGrList=this.setBtwGrList();
            periodData.period=periods[p];
            this.getVatGrData_GetVatAmount(periodData.btwGrList,periodData.period);
            //format the amounts
            this.getVatGrData_formatAmounts(periodData.btwGrList);
            //5a
            this.getVatGrData_CalcVatDue(periodData.btwGrList);
            // 9 calc endtotals
            this.getVatGrData_CalcVatTotal(periodData.btwGrList,periodData.period);

            periodsData.push(periodData);
        }

        return periodsData;
    }

    /**
     * Calculate the vatBalance for each group
     * @param {*} btwGrList 
     */
    getVatGrData_GetVatAmount(btwGrList,p){
        for (var gr in btwGrList){
            var vatCodes=btwGrList[gr].vatCodes;
            var vatBalance=this.banDoc.vatCurrentBalance(vatCodes,p.startDate, p.endDate);
            vatBalance.vatPosted *= btwGrList[gr].multiply;
            vatBalance.vatTaxable *= btwGrList[gr].multiply;
            btwGrList[gr].vatBalance=vatBalance;
        }
    }

    /**
     * Get the total of the VAT Due (rubriek 1-4) for each quarter
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
    getVatGrData_CalcVatTotal(btwGrList,period){

        //report total 5b
        // 5a-5b assigned to group 9a
        btwGrList.ninthA.vatBalance.vatAmount=Banana.SDecimal.subtract(btwGrList.fifthA.vatBalance_formatted.vatPosted,btwGrList.fifthB.vatBalance_formatted.vatPosted);

        //accounting total
        var vatCurrBal=this.banDoc.vatCurrentBalance("*",period.startDate,period.endDate);
        btwGrList.ninthB.vatBalance.vatAmount=Banana.SDecimal.abs(vatCurrBal.vatPosted);

        //difference
        btwGrList.ninthC.vatBalance.vatAmount=Banana.SDecimal.subtract(btwGrList.ninthB.vatBalance.vatAmount,btwGrList.ninthA.vatBalance.vatAmount);

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
                btwGrList[gr].vatBalance_formatted.vatTaxable=Math.trunc(Banana.SDecimal.abs(group.vatBalance.vatTaxable));
            }else{
                btwGrList[gr].vatBalance_formatted.vatPosted=Math.ceil(Banana.SDecimal.abs(group.vatBalance.vatPosted));
                btwGrList[gr].vatBalance_formatted.vatAmount=Math.ceil(Banana.SDecimal.abs(group.vatBalance.vatAmount));
                btwGrList[gr].vatBalance_formatted.vatTaxable=Math.ceil(Banana.SDecimal.abs(group.vatBalance.vatTaxable));
            }
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