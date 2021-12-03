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

/*
*   SUMMARY
*
*   this module defines class and methods used to calculate and print vat reports
*/


 var VatReport = class VatReport {

    constructor(banDoc,reportType){
        this.banDoc=banDoc;
        this.reportType=reportType;

        //errors
        this.VATCODE_WITHOUT_GR1 = "VATCODE_WITHOUT_GR1";
    }

    /**
     * Defines the structure of the groups  
     */
     setRubricsData(){
        var rubricsData={};

        //FIRST "RUBRIC"
        rubricsData[1]={};
        rubricsData[1].description='Rubriek 1: Prestaties binnenland';
        rubricsData[1].style="styleTotals styleRubriekTitle";
        rubricsData[1].isGroup = true;
        rubricsData[1].groups = this.setRubricsData_firstRubric();

        //SECOND "RUBRIC"
        rubricsData[2]={};
        rubricsData[2].description="Rubriek 2: Verleggingsregelingen";
        rubricsData[2].style="styleTotals styleRubriekTitle";
        rubricsData[2].isGroup = true;
        rubricsData[2].groups=this.setRubricsData_secondRubric();

        //THIRD "RUBRIC"
        rubricsData[3]={};
        rubricsData[3].description="Rubriek 3: Prestaties naar of in het buitenland";
        rubricsData[3].style="styleTotals styleRubriekTitle";
        rubricsData[3].isGroup = true;
        rubricsData[3].groups=this.setRubricsData_thirdRubric();

        //FOURTH "RUBRIC"
        rubricsData[4]={};
        rubricsData[4].description="Rubriek 4: Prestaties vanuit het buitenland aan u verricht";
        rubricsData[4].style="styleTotals styleRubriekTitle";
        rubricsData[4].groups=this.setRubricsData_fourthRubric();

        //FIFTH "RUBRIC"
        rubricsData[5]={};
        rubricsData[5].description="Rubriek 5: Voorbelasting, kleineondernemersregeling en eindtotaal";
        rubricsData[5].style="styleTotals styleRubriekTitle";
        rubricsData[5].isGroup = true;
        rubricsData[5].groups=this.setRubricsData_fifthRubric();

        //NINTH  * Rubric 9 does not exists in the vat declaration form, we created it olny for store totals (report total, accounting total and difference between those two)
        rubricsData[9]={};
        rubricsData[9].description="";
        rubricsData[9].style="styleTotals styleRubriekTitle";
        rubricsData[9].isGroup = true;
        rubricsData[9].groups=this.setRubricsData_ninthRubric();
    

        return rubricsData;

    }

    setRubricsData_firstRubric(){

        var rubricsData_group={};

        //1a
        rubricsData_group['1a']={};
        rubricsData_group['1a'].gr="1";
        rubricsData_group['1a'].multiply=-1;
        rubricsData_group['1a'].code="1a";
        rubricsData_group['1a'].description="1a. Leveringen/diensten belast met hoog tarief";
        rubricsData_group['1a'].hasOmzet=true;
        rubricsData_group['1a'].hasOmzetBelasting=true;
        rubricsData_group['1a'].descriptionStyle="";




        //1b
        rubricsData_group['1b']={};
        rubricsData_group['1b'].gr="1";
        rubricsData_group['1b'].multiply=-1;
        rubricsData_group['1b'].code="1b";
        rubricsData_group['1b'].description="1b. Leveringen/diensten belast met laag tarief";
        rubricsData_group['1b'].hasOmzet=true;
        rubricsData_group['1b'].hasOmzetBelasting=true;
        rubricsData_group['1b'].descriptionStyle="";


        //1c
        rubricsData_group['1c']={};
        rubricsData_group['1c'].gr="1";
        rubricsData_group['1c'].multiply=-1;
        rubricsData_group['1c'].code="1c";
        rubricsData_group['1c'].description="1c. Leveringen/diensten belast met overige tarieven, behalve 0%";
        rubricsData_group['1c'].hasOmzet=true;
        rubricsData_group['1c'].hasOmzetBelasting=true;
        rubricsData_group['1c'].descriptionStyle="";


        //1d
        rubricsData_group['1d']={};
        rubricsData_group['1d'].gr="1";
        rubricsData_group['1d'].multiply=-1;
        rubricsData_group['1d'].code="1d";
        rubricsData_group['1d'].description="1d. Privégebruik";
        rubricsData_group['1d'].hasOmzet=true;
        rubricsData_group['1d'].hasOmzetBelasting=true;
        rubricsData_group['1d'].descriptionStyle="";

        //1e
        rubricsData_group['1e']={};
        rubricsData_group['1e'].gr="1";
        rubricsData_group['1e'].multiply=-1;
        rubricsData_group['1e'].code="1e";
        rubricsData_group['1e'].description="1e. Leveringen/diensten belast met 0% of niet bij u belast";
        rubricsData_group['1e'].hasOmzet=true;
        rubricsData_group['1e'].hasOmzetBelasting=false;
        rubricsData_group['1e'].descriptionStyle="";


        return rubricsData_group;
    }


    setRubricsData_secondRubric(){
        var rubricsData_group={};
        //2a
        rubricsData_group['2a']={};
        rubricsData_group['2a'].gr="2";
        rubricsData_group['2a'].multiply=-1;
        rubricsData_group['2a'].code="2a";
        rubricsData_group['2a'].description="2a. Leveringen/diensten waarbij de omzetbelasting naar u is verlegd";
        rubricsData_group['2a'].hasOmzet=true;
        rubricsData_group['2a'].hasOmzetBelasting=true;
        rubricsData_group['2a'].descriptionStyle="";


        return rubricsData_group;
    }

    setRubricsData_thirdRubric(){

        var rubricsData_group={};
        //3a
        rubricsData_group['3a']={};
        rubricsData_group['3a'].gr="3";
        rubricsData_group['3a'].multiply=-1;
        rubricsData_group['3a'].code="3a";
        rubricsData_group['3a'].description="3a. Leveringen naar landen buiten de EU (uitvoer)";
        rubricsData_group['3a'].hasOmzet=true;
        rubricsData_group['3a'].hasOmzetBelasting=false;
        rubricsData_group['3a'].descriptionStyle="";


        //3b
        rubricsData_group['3b']={};
        rubricsData_group['3b'].gr="3";
        rubricsData_group['3b'].multiply=-1;
        rubricsData_group['3b'].code="3b";
        rubricsData_group['3b'].description="3b. Leveringen naar of diensten in landen binnen de EU";
        rubricsData_group['3b'].hasOmzet=true;
        rubricsData_group['3b'].hasOmzetBelasting=false;
        rubricsData_group['3b'].descriptionStyle="";


        //3c
        rubricsData_group['3c']={};
        rubricsData_group['3c'].gr="3";
        rubricsData_group['3b'].multiply=-1;
        rubricsData_group['3c'].code="3c";
        rubricsData_group['3c'].description="3c. Installatie/ afstandsverkopen binnen de EU";
        rubricsData_group['3c'].hasOmzet=true;
        rubricsData_group['3c'].hasOmzetBelasting=false;
        rubricsData_group['3c'].descriptionStyle="";


        return rubricsData_group;
    }



    setRubricsData_fourthRubric(){

        var rubricsData_group={};
        //4a
        rubricsData_group['4a']={};
        rubricsData_group['4a'].gr="4";
        rubricsData_group['4a'].multiply=-1;
        rubricsData_group['4a'].code="4a";
        rubricsData_group['4a'].description="4a. Leveringen/diensten uit landen buiten de EU";
        rubricsData_group['4a'].hasOmzet=true;
        rubricsData_group['4a'].hasOmzetBelasting=true;
        rubricsData_group['4a'].descriptionStyle="";


        //4b
        rubricsData_group['4b']={};
        rubricsData_group['4b'].gr="4";
        rubricsData_group['4b'].multiply=-1;
        rubricsData_group['4b'].code="4b";
        rubricsData_group['4b'].description="4b. Leveringen/diensten uit landen binnen de EU";
        rubricsData_group['4b'].hasOmzet=true;
        rubricsData_group['4b'].hasOmzetBelasting=true;
        rubricsData_group['4b'].descriptionStyle="";


        return rubricsData_group;
    }



    setRubricsData_fifthRubric(){

        var rubricsData_group={};

        //5a
        rubricsData_group['5a']={};
        rubricsData_group['5a'].gr="5";
        rubricsData_group['5a'].multiply=-1;
        rubricsData_group['5a'].code="5a";
        rubricsData_group['5a'].description="5a. Verschuldigde omzetbelasting (rubrieken 1t/m 4)";
        rubricsData_group['5a'].hasOmzet=false;
        rubricsData_group['5a'].hasOmzetBelasting=true;
        rubricsData_group['5a'].descriptionStyle="";


        //5b
        rubricsData_group['5b']={};
        rubricsData_group['5b'].gr="5";
        rubricsData_group['5b'].multiply=-1;
        rubricsData_group['5b'].code="5b";
        rubricsData_group['5b'].description="5b. Voorbelasting";
        rubricsData_group['5b'].hasOmzet=false;
        rubricsData_group['5b'].hasOmzetBelasting=true;
        rubricsData_group['5b'].descriptionStyle="";


        return rubricsData_group;
    }

    setRubricsData_ninthRubric(){

        var rubricsData_group={};


        //9a
        rubricsData_group['9a']={};
        rubricsData_group['9a'].gr="9";
        rubricsData_group['9a'].multiply=-1;
        rubricsData_group['9a'].code="9a";
        rubricsData_group['9a'].description="Eindtotaal";
        rubricsData_group['9a'].hasOmzet=false;
        rubricsData_group['9a'].hasOmzetBelasting=false;
        rubricsData_group['9a'].descriptionStyle="styleTotals styleRubriekTitle";


        //9b
        rubricsData_group['9b']={};
        rubricsData_group['9b'].gr="9";
        rubricsData_group['9b'].multiply=-1;
        rubricsData_group['9b'].code="9b";
        rubricsData_group['9b'].description="Eindtotaal(Boekhouding)";
        rubricsData_group['9b'].hasOmzet=false;
        rubricsData_group['9b'].hasOmzetBelasting=false;
        rubricsData_group['9b'].descriptionStyle="";

        //9c
        rubricsData_group['9c']={};
        rubricsData_group['9c'].gr="9";
        rubricsData_group['9c'].multiply=-1;
        rubricsData_group['9c'].code="9c";
        rubricsData_group['9c'].description="Afrondingsverschil";
        rubricsData_group['9c'].hasOmzet=false;
        rubricsData_group['9c'].hasOmzetBelasting=false;
        rubricsData_group['9c'].descriptionStyle="";


        return rubricsData_group;
    }

    /**
     * set the style for the amounts
     * @param {*} reportType
     * @returns 
     */
    setAmountStyle(reportType){
        var amountStyle="";
        if(reportType=="statement"){
            amountStyle="styleAmount styleAmount_statement"
        }else{
            amountStyle="styleAmount";
        }

        return amountStyle;
    }

    /**
     * Get the vat data for each period
     * @param {*} periods -->years
     * @returns 
     */
     getPeriodsData(periods){
       
       var periodsData = [];
       var vatDataList=this.loadVatData();

        for (var p = 0; p <periods.length ; p++){
            var periodData={};
            periodData.rubricsData=this.setRubricsData();
            periodData.period=periods[p];
            //get vat codes for each group
            this.getVatCodes(periodData.rubricsData,vatDataList);
            //calculate the amounts
            this.getPeriodsData_GetVatAmount(periodData.rubricsData,periodData.period);
            //round the amounts
            this.getPeriodsData_roundAmounts(periodData.rubricsData);
            //set the 5a
            this.getPeriodsData_CalcVatDue(periodData.rubricsData);
            // 9 calc endtotals
            this.getPeriodsData_CalcVatTotal(periodData.rubricsData,periodData.period);

            this.getAmountStyle(periodData.rubricsData)

            periodsData.push(periodData);
        }
        //Banana.Ui.showText(JSON.stringify(periodsData));

        return periodsData;
    }

    /**
     * load the vat data from the vat table
     * @returns 
     */
    loadVatData(){
        var vatDataList=[];
        var table=this.banDoc.table('VatCodes');
        for (var i = 0; i < table.rowCount; i++) {
            var vatData={};
            var tRow = table.row(i);
            vatData.vatCode=tRow.value("VatCode");
            vatData.gr1=tRow.value("Gr1");
            if(vatData.vatCode){
                if(vatData.vatCode && vatData.gr1){
                    vatDataList.push(vatData);
                }
                else{
                    //error message: Warning code 'XYZ' without Gr1.
                    var msg =this.getErrorMessage(this.VATCODE_WITHOUT_GR1,"en",vatData.vatCode);
                    this.banDoc.addMessage(msg,this.VATCODE_WITHOUT_GR1);
                }
            }
            
        }
    
        return vatDataList;
    
    }

    /**
     * returns the vat codes belonging to that group 
     * @param {*} gr1 
     */
    setVatCodes(vatDataList,gr1){
        var vatCodes="";
        for (var row in vatDataList ){
            let element=vatDataList[row]
            if(element.gr1==gr1){
                vatCodes+=element.vatCode+"|"
            }
        }
        //slice the last char "|" because we dont need it
        vatCodes=vatCodes.slice(0,-1);
        return vatCodes;
    }

    getVatCodes(rubricsData,vatDataList){
        for (var key1 in rubricsData){
            for(var key2 in rubricsData[key1].groups){
                var codes=this.setVatCodes(vatDataList,rubricsData[key1].groups[key2].code);
                rubricsData[key1].groups[key2].vatCodes=codes;
            }
        }
    }

    /**
     * Calculate the vatBalance for each group
     * @param {*} rubricsData 
     */
     getPeriodsData_GetVatAmount(rubricsData,p){
        for (var key1 in rubricsData){
            for(var key2 in rubricsData[key1].groups){
                var vatCodes=rubricsData[key1].groups[key2].vatCodes;
                var vatBalance=this.banDoc.vatCurrentBalance(vatCodes,p.startDate, p.endDate);
                if(rubricsData[key1].groups[key2].gr!="5"){//da sistemare
                    vatBalance.vatPosted *= rubricsData[key1].groups[key2].multiply;
                    vatBalance.vatTaxable *= rubricsData[key1].groups[key2].multiply;
                }
                rubricsData[key1].groups[key2].vatBalance=vatBalance;
            }
        }
    }

    /**
     * Get the total of the VAT Due (rubriek 1-4) for each quarter
     * The total is calculated by adding up the amounts of the groups to which the VAT due codes belong.
     * @param {*} vatGrData object with groups data.
     */
     getPeriodsData_CalcVatDue(rubricsData){
        var vatDue="";
        for (var key1 in rubricsData){
            for(var key2 in rubricsData[key1].groups){
                if(rubricsData[key1].groups[key2].gr!=="5"){
                    if(vatDue,rubricsData[key1].groups[key2].vatBalance.vatPosted){
                        vatDue=Banana.SDecimal.add(vatDue,rubricsData[key1].groups[key2].vatBalance.vatPosted);
                    }
                }
            }
        }

        rubricsData[5].groups['5a'].vatBalance.vatPosted=vatDue;
    }

    /**
     * Get the total of the VAT: Vat Due-Vat deductible, and the difference between the report amount and the accounting amount
     * Vat Total Report: result taken by subtracting the calculated Vat due and the vat deductible calculated for the group 5b.
     * Vat Total Accounting: total calculated with the vatCurrentBalance.
     * Vat difference: the difference between the amount trunc calculated for the report and the accounting amount
     * @param {*} rubricsData object with groups data 
     * @param {*} vatDue array with the calculated vat due for each quarter
     * @returns an array with the results
     */
     getPeriodsData_CalcVatTotal(rubricsData,period){

        //report total 5b
        // 5a-5b assigned to group 9a
        rubricsData[9].groups["9a"].vatBalance.vatAmount=Banana.SDecimal.subtract(rubricsData[5].groups['5a'].vatBalance.vatPosted,rubricsData[5].groups['5b'].vatBalance.vatPosted);

        //accounting total
        var vatCurrBal=this.banDoc.vatCurrentBalance("*",period.startDate,period.endDate);
        rubricsData[9].groups["9b"].vatBalance.vatAmount=Banana.SDecimal.multiply(vatCurrBal.vatPosted,rubricsData[9].groups["9b"].multiply);

        //difference
        rubricsData[9].groups["9c"].vatBalance.vatAmount=Banana.SDecimal.subtract(rubricsData[9].groups["9b"].vatBalance.vatAmount,rubricsData[9].groups["9a"].vatBalance.vatAmount);

    }

    /**
     * Trunc the vat due amounts and round up to the nearest whole number the recoverable vat amounts
     * @param {*} rubricsData 
     */
     getPeriodsData_roundAmounts(rubricsData){
        for (var key1 in rubricsData){
            for(var key2 in rubricsData[key1].groups){
                if(rubricsData[key1].groups[key2].code!=="5b"){
                    rubricsData[key1].groups[key2].vatBalance.vatPosted=Math.trunc(rubricsData[key1].groups[key2].vatBalance.vatPosted);
                    rubricsData[key1].groups[key2].vatBalance.vatTaxable=Math.trunc(rubricsData[key1].groups[key2].vatBalance.vatTaxable);
                }else{
                    rubricsData[key1].groups[key2].vatBalance.vatPosted=Math.ceil(rubricsData[key1].groups[key2].vatBalance.vatPosted);
                    rubricsData[key1].groups[key2].vatBalance.vatAmount=Math.ceil(rubricsData[key1].groups[key2].vatBalance.vatAmount);
                    rubricsData[key1].groups[key2].vatBalance.vatTaxable=Math.ceil(rubricsData[key1].groups[key2].vatBalance.vatTaxable);
                }
            }
        }

    }

    getAmountStyle(rubricsData){
        for (var key1 in rubricsData){
            for(var key2 in rubricsData[key1].groups){
                rubricsData[key1].groups[key2].amountStyle=this.setAmountStyle(this.reportType);
            }
        }
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