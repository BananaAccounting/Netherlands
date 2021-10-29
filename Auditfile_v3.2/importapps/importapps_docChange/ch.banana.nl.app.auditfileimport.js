// Copyright [2018] [Banana.ch SA - Lugano Switzerland]
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
//
// @id = ch.banana.nl.app.auditfileimporttransactions.js
// @api = 1.0
// @pubdate = 2021-10-29
// @publisher = Banana.ch SA
// @description = Import audit file Netherlands
// @doctype = *
// @encoding = utf-8
// @task = import.file
// @inputfilefilter = *.xml
// @inputencoding = utf-8
// @inputfilefilter = XML files (*.xml);;All files (*.*)

/*
 *   SUMMARY
 *
 *   Import the transactions and the accounts taken from the xml file.
 */

/**
 * function called from converter
 */
function setup() {}


/**
 * 
 * @param {*} banDocument the current Banana file
 */
var NlAuditFilesImport = class NlAuditFilesImport {
    constructor(banDocument) {
        this.version = '1.0';
        this.isAdvanced = true; //this.isBananaAdvanced();
        this.banDocument = banDocument;
        this.transNr = "";
        this.vatTransactionsList = [];

        //array dei patches
        this.jsonDocArray = [];

        //errors
        this.ID_ERR_LICENSE_NOTVALID = "ID_ERR_LICENSE_NOTVALID";
        this.ID_ERR_VERSION_NOTSUPPORTED = "ID_ERR_VERSION_NOTSUPPORTED";

    }

    /**
     * The createJsonDocument() method takes the data from the xml file and transforms it 
     * into json format in order to be imported into the table Records
     * @param {*} inData 
     */
    createJsonDocument(inData) {

        var jsonDoc = this.createJsonDocument_Init();
        var lang = this.getLang();
        var headerNode="";
        var companyNode="";

        for (var srcFileName in inData) {

            //seleziona singolo file xml
            var xmlFile = Banana.Xml.parse(inData[srcFileName]);
            if (!xmlFile)
                continue;

            var xmlRoot = xmlFile.firstChildElement('auditfile');
            if (!xmlRoot)
                continue;
            if(xmlRoot.hasChildElements('header'))
                headerNode = xmlRoot.firstChildElement('header');
            if(xmlRoot.hasChildElements('company'))
                companyNode = xmlRoot.firstChildElement('company');

            var openingBalanceList = this.loadOpeningBalances(companyNode);

            var customersSuppliersList = [];
            if (companyNode && companyNode.hasChildElements('customersSuppliers')) {
                var customersSuppliersNode = companyNode.firstChildElement('customersSuppliers');
                if (customersSuppliersNode.hasChildElements('customerSupplier')) {
                    var customerSupplierNode = customersSuppliersNode.firstChildElement('customerSupplier'); // First customerSupplier
                    customersSuppliersList = this.getCustomerSuppliers(customerSupplierNode);
                }
            }
            /*********************************************************************
             * ADD THE FILE PROPERTIES
             *********************************************************************/
            this.createJsonDocument_AddFileProperties(jsonDoc, srcFileName, headerNode, companyNode);
            /*********************************************************************
             * ADD THE ACCOUNTS
             *********************************************************************/
            this.createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, customersSuppliersList, openingBalanceList);

            /*********************************************************************
             * ADD THE COSTUMERS/SUPPLIERS
             *********************************************************************/
            if (customersSuppliersList.length > 0)
                this.createJsonDocument_AddCostumersSuppliers(jsonDoc, srcFileName, customerSupplierNode, customersSuppliersList);

            /*********************************************************************
             * ADD THE TRANSACTIONS
             *********************************************************************/
            this.createJsonDocument_AddTransactions(jsonDoc, xmlRoot, companyNode, srcFileName);
            // se non è la versione, avverto che l'importazione delle registrazioni è limitata a 100 righe
            //Banana.console.debug("is Advanced: "+this.isAdvanced);
            if (!this.isAdvanced) {
                var msg = this.getErrorMessage(this.ID_ERR_LICENSE_NOTVALID, lang);
                this.banDocument.addMessage(msg, this.ID_ERR_LICENSE_NOTVALID);
            }

            /*********************************************************************
             * ADD THE SUBLEDGERS ELEMENTS
             *********************************************************************/
            //add the vat codes, solo se è presente la tabella vat
            var table = this.banDocument.table("VatCodes");
            if (table)
                this.createJsonDocument_AddVatCodes(jsonDoc, srcFileName, companyNode);

        }

        this.jsonDocArray.push(jsonDoc);

    }


    /**
     * Creates the document change object for the vat table
     * @param {*} jsonDoc initialized jsonDoc structure
     * @param {*} srcFileName file name
     * @param {*} companyNode xml company node
     */
    createJsonDocument_AddVatCodes(jsonDoc, srcFileName, companyNode) {
        var rows = [];
        var vatCodesNode = "";
        var vatNode = "";
        var vatToPayAccId = "";
        var vatToClaimAccId = "";
        var vatPerc = "";
        var vatAmtType = "";
        var vatTransList = this.vatTransactionsList;

        vatCodesNode = companyNode.firstChildElement('vatCodes');
        vatNode = vatCodesNode.firstChildElement('vatCode');

        while (vatNode) {

            var vatId = "";
            var vatCodeDescription = "";


            vatId = vatNode.firstChildElement('vatID').text;
            vatCodeDescription = vatNode.firstChildElement('vatDesc').text;
            if (vatNode.hasChildElements('vatToPayAccID'))
                vatToPayAccId = vatNode.firstChildElement('vatToPayAccID').text;
            if (vatNode.hasChildElements('vatToClaimAccID'))
                vatToClaimAccId = vatNode.firstChildElement('vatToClaimAccID').text;

            for (var i = 0; i < vatTransList.length; i++) {
                if (vatTransList[i].split("_____")[0] === vatId) {
                    vatPerc = vatTransList[i].split("_____")[1];
                    vatAmtType = vatTransList[i].split("_____")[2];
                }
            }


            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["VatCode"] = vatId;
            row.fields["Description"] = vatCodeDescription;
            row.fields["VatRate"] = vatPerc;
            row.fields["AmountType"] = vatAmtType;

            rows.push(row);

            vatNode = vatNode.nextSiblingElement('vatCode');
        }

        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "VatCodes";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        // Banana.Ui.showText(JSON.stringify(dataUnitFilePorperties));

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);

    }

    /**
     * Set the field we want to modify in the file properties
     * @returns the list of the file properties fields i want to modify/add
     */
    setFileInfoFields() {
        var propertyFields = [];

        propertyFields[0] = "HeaderLeft";
        propertyFields[1] = "HeaderRight";
        propertyFields[2] = "OpeningDate";
        propertyFields[3] = "ClosureDate";
        propertyFields[4] = "BasicCurrency";
        propertyFields[5] = "Company";
        propertyFields[6] = "Address1";
        propertyFields[7] = "City";
        propertyFields[8] = "Zip";
        propertyFields[9] = "State";
        propertyFields[10] = "CountryCode";
        propertyFields[11] = "FiscalNumber";


        return propertyFields;

    }

    /**
     * 
     * @param {*} companyNode the xml company node
     * @returns the values i want to put in the file properties fields
     */
    getCompanyInfo(headerNode, companyNode) {

        var companyInfos = [];
        var startDate = "";
        var endDate = "";
        var basicCurrency = "";

        var streetAddressNode
        var companyName = "";
        var companyIdentification = "";
        var companyStreetName = "";
        var companyStreetAddressCity = "";
        var companyStreetAddresspostalCode = "";
        var companyStreetAddressRegion = "";
        var companyStreetAddressCountry = "";
        var companyStreetAddressTaxReg = "";


        //take the information from the node: header
        if(headerNode){
            if(headerNode.hasChildElements('startDate'))
                startDate = headerNode.firstChildElement('startDate').text;
            startDate = startDate.replace(/-/g, "");
            if(headerNode.hasChildElements('endDate'))
                endDate = headerNode.firstChildElement('endDate').text;
            endDate = endDate.replace(/-/g, "");
            if(headerNode.hasChildElements('curCode'))
                basicCurrency = headerNode.firstChildElement('curCode').text;
        }


        //take the information from node: company
        if(companyNode){
            if(companyNode.hasChildElements('companyName'))
                companyName = companyNode.firstChildElement('companyName').text;
            if (companyNode.hasChildElements('companyIdent'))
                companyIdentification = companyNode.firstChildElement('companyIdent').text;
            if (companyNode.hasChildElements('streetAddress'))
                streetAddressNode = companyNode.firstChildElement('streetAddress')
            companyStreetName = streetAddressNode.firstChildElement('streetname').text;
            if (streetAddressNode.hasChildElements('city'))
                companyStreetAddressCity = streetAddressNode.firstChildElement('city').text;
            if (streetAddressNode.hasChildElements('postalCode'))
                companyStreetAddresspostalCode = streetAddressNode.firstChildElement('postalCode').text;
            if (streetAddressNode.hasChildElements('region'))
                companyStreetAddressRegion = streetAddressNode.firstChildElement('region').text;
            if (streetAddressNode.hasChildElements('country'))
                companyStreetAddressCountry = streetAddressNode.firstChildElement('country').text;
            if (companyNode.hasChildElements('taxRegIdent'))
                companyStreetAddressTaxReg = companyNode.firstChildElement('taxRegIdent').text;
        }



        companyInfos[0] = companyName + " " + companyIdentification;
        companyInfos[1] = companyStreetName + ", " + companyStreetAddresspostalCode + " " + companyStreetAddressCity + "," + companyStreetAddressRegion;
        companyInfos[2] = startDate;
        companyInfos[3] = endDate;
        companyInfos[4] = basicCurrency;
        companyInfos[5] = companyName;
        companyInfos[6] = companyStreetName;
        companyInfos[7] = companyStreetAddressCity;
        companyInfos[8] = companyStreetAddresspostalCode;
        companyInfos[9] = companyStreetAddressRegion;
        companyInfos[10] = companyStreetAddressCountry;
        companyInfos[11] = companyStreetAddressTaxReg;


        return companyInfos;
    }

    /**
     * Creates the document change object for the file properties
     * @param {*} jsonDoc initialized jsonDoc structure
     * @param {*} srcFileName file name
     * @param {*} companyNode xml company node
     * @param {*} headerNode xml header node
     */

    createJsonDocument_AddFileProperties(jsonDoc, srcFileName, headerNode, companyNode) {

        var rows = [];

        var fileInfoFields = this.setFileInfoFields();
        var companyInfos = this.getCompanyInfo(headerNode, companyNode);

        for (var i = 0; i < fileInfoFields.length; i++) {
            var sectionXml = "";
            if (i <= 1)
                sectionXml = "Base";
            else
                sectionXml = "AccountingDataBase";

            var row = {};
            row.operation = {};
            row.operation.name = "modify";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["SectionXml"] = sectionXml;
            row.fields["IdXml"] = fileInfoFields[i];
            row.fields["ValueXml"] = companyInfos[i];

            rows.push(row);
        }

        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "FileInfo";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);


    }

    /**
     * Creates the document change object for the account table
     * @param {*} jsonDoc initialized jsonDoc structure
     * @param {*} srcFileName file name
     * @param {*} companyNode xml company node
     * @param {*} customersSuppliersList xml header node
     * @param {*} openingBalanceList list of the opening balances
     */
    createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, customersSuppliersList, openingBalanceList) {

        var rows = [];
        var generalLedgerNode = "";
        var ledgerAccountNode = "";
        var sectionsDelimitercounter=0;
        var firstLoop=true;
        var _gr="";
        var _bClass="";
        var _accType="";
        var _grDescription="";

        if(companyNode){
            generalLedgerNode = companyNode.firstChildElement('generalLedger');
            ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount');

            while (ledgerAccountNode) {

                var accountNumber = "";
                var accountDescription = "";
                var accType = "";
                var gr = "";
                var bClass = "";
                var totalGr = "";
                var opening = "";
                var grDescription = "";

                accountNumber = ledgerAccountNode.firstChildElement('accID').text;
                if (ledgerAccountNode.hasChildElements('leadDescription'))

                    grDescription = ledgerAccountNode.firstChildElement('leadDescription').text;
                if (accountDescription = ledgerAccountNode.hasChildElements('accDesc'))
                    accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;

                if (ledgerAccountNode.hasChildElements('accTp'))
                    accType = ledgerAccountNode.firstChildElement('accTp').text;

                if (ledgerAccountNode.hasChildElements('leadCode'))
                    gr = ledgerAccountNode.firstChildElement('leadCode').text;
                else
                    gr = this.setGrByAccount(accountNumber);

                if (ledgerAccountNode.hasChildElements('leadReference'))
                    bClass = ledgerAccountNode.firstChildElement('leadReference').text;
                else
                    bClass = this.setBclassByAccount(gr, accType);

                if (ledgerAccountNode.hasChildElements('leadCrossRef'))
                    totalGr = ledgerAccountNode.firstChildElement('leadCrossRef').text;

                //We take all the accounts that are not customers or suppliers
                //because we want all the normal accounts at the beginning,
                //and customers/suppliers at the end.
                if (customersSuppliersList.indexOf(accountNumber) < 0) {
                    //if the next element has the same leadcode(gr) than the previous, i create a normal row
                    //otherwise, i create a grouping row.Same for the section(Bclass).

                    if (_gr != gr && !firstLoop) {
                        //carried over groups
                        var grCarriedOver = this.setGroupCarriedOver(_gr);
                        var grCarrOverRows = this.setGroupRow_carriedOver(grCarriedOver, _gr);
                        rows.push(grCarrOverRows.row);

                        //normal groups
                        var grRows = this.setGroupRow(_gr,_bClass, _accType,_grDescription);
                        rows.push(grRows.row);
                        rows.push(grRows.emptyRow);
                    }

                    if (_bClass != bClass) {
                        /**
                         * with this control I make sure that I do not add a section total at the beginning of the chart of accounts (which would correspond to empty lines), 
                         * since at the first loop the previous blcass is always different from the current one.
                         * The setSectionRow() method build a row for the total of the section.
                         * The setSectionDelimiterRow build a row for the begin of the section.
                         */

                        if(sectionsDelimitercounter !=0 && !firstLoop){
                            var secRows = this.setSectionRow(accType, _accType,_bClass);
                            rows.push(secRows.row);
                            rows.push(secRows.emptyRow);
                        }

                        //Basically this condition happen in the first loop, so when we starts with the balance accounts and
                        // when it comes the first profit and loss account.
                        //when it happen, it is added a a title that delimits the Base Sections: Balance, Profit and Loss (Costumers and suppliers and Cost centers are not considered here)
                        if(_accType!=accType){
                            var secRows = this.setBaseSectionDelimiterRow(accType);
                            rows.push(secRows.row);
                            rows.push(secRows.emptyRow);
                        }

                        var secRows = this.setSectionDelimiterRow(bClass,accType);
                        rows.push(secRows.row);
                        rows.push(secRows.emptyRow);

                        //set back the counter to 0 because the bclass is changed.
                        sectionsDelimitercounter=0;
                    }

                    //Take the "account___amount___amounttype" of each opening balance
                    for (var i = 0; i < openingBalanceList.length; i++) {
                        if (openingBalanceList[i].split("_____")[0] === accountNumber) {
                            var amnt = openingBalanceList[i].split("_____")[1];
                            var amntTp = openingBalanceList[i].split("_____")[2];
                            if (amntTp === "D") {
                                opening = amnt;
                            } else if (amntTp === "C") {
                                opening = Banana.SDecimal.invert(amnt);
                            }
                        }
                    }


                    var row = {};
                    row.operation = {};
                    row.operation.name = "add";
                    row.operation.srcFileName = srcFileName;
                    row.fields = {};
                    row.fields["Account"] = accountNumber;
                    row.fields["Description"] = accountDescription;
                    row.fields["BClass"] = bClass;
                    row.fields["Gr"] = gr;
                    row.fields["Opening"] = opening;


                    rows.push(row);

                    //se il gruppo è diverso da quello precedente, allora inserisco una voce di raggruppamento
                    //row=createJsonDocument_AddGrLine(gr)

                    _gr = gr;
                    _grDescription = grDescription;
                    _accType = accType;
                    _bClass = bClass;
                    firstLoop=false;

                    sectionsDelimitercounter++;
                }

                ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount');
            }

            //last group
            var grRows = this.setGroupRow(_gr,_bClass, _accType,_grDescription);
            rows.push(grRows.row);
            rows.push(grRows.emptyRow);
            //last section
            var secRows = this.setSectionRow(accType,_accType,_bClass);
            rows.push(secRows.row);
            rows.push(secRows.emptyRow);

            //add the profit and loss result row
            var totCeRow = this.setTotCeRow();
            rows.push(totCeRow.row);
            rows.push(totCeRow.emptyRow);

            //add the balance result row
            var balanceDiff = this.setBalanceDiffRow();
            rows.push(balanceDiff.row);
            rows.push(balanceDiff.emptyRow);
        }


        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "Accounts";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        // Banana.Ui.showText(JSON.stringify(dataUnitFilePorperties));

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);


    }

    /**
     * Add the row that define the begin of the base section: Balance, Profit and Loss, Customers and suppliers, Cost centers.
     * @param {*} bClass 
     * @param {*} accType 
     * @returns 
     */
    setBaseSectionDelimiterRow(accType){
        //section
        var sectionDelimiterRows = {};
        sectionDelimiterRows.row = {};
        sectionDelimiterRows.row.operation = {};
        sectionDelimiterRows.row.operation.name = "add";
        sectionDelimiterRows.row.fields = {};
        sectionDelimiterRows.row.fields["Section"] = "*";
        sectionDelimiterRows.row.fields["Description"] = this.setBaseSectionDescription(accType);
        sectionDelimiterRows.emptyRow = this.getEmptyRow();

        return sectionDelimiterRows;
    }

    /**
     * Add the row that define the begin of the section
     * Section ref: Assets=1, Liabilities=2, Costs=3, Revenues=4
     * @param {*} bClass 
     * @param {*} accType 
     * @returns the section delemiter row
     */
    setSectionDelimiterRow(bClass,accType){
        //section
        //costumers and suppliers sections are 1 and 2, for the delimiter of section we want to have 01 and 02
        if(accType=="C" || accType=="S"){
            bClass="0"+bClass;
        }
        var sectionDelimiterRows = {};
        sectionDelimiterRows.row = {};
        sectionDelimiterRows.row.operation = {};
        sectionDelimiterRows.row.operation.name = "add";
        sectionDelimiterRows.row.fields = {};
        sectionDelimiterRows.row.fields["Section"] = bClass
        //get the description but take only the word after the space.
        //example TOTAL AKTIVA--> AKTIVA
        let descr=this.setSectionDescription(bClass,accType);
        let startPos=descr.indexOf(" ");
        descr=descr.substr(startPos);
        sectionDelimiterRows.row.fields["Description"] = descr;
        sectionDelimiterRows.emptyRow = this.getEmptyRow();

        return sectionDelimiterRows;
    }

    /**
     * Creates a row for totalize the balance
     * @returns the row object
     */
    setBalanceDiffRow() {
        var balanceRows = {};
        balanceRows.row = {};
        balanceRows.row.operation = {};
        balanceRows.row.operation.name = "add";
        balanceRows.row.fields = {};
        balanceRows.row.fields["Group"] = "00";
        balanceRows.row.fields["Description"] = "Verschil moet = 0 (lege cel) zijn";
        balanceRows.emptyRow = this.getEmptyRow();

        return balanceRows;
    }

    /**
     * Creates a row for the annual result (Profit and loss)
     * @returns the row object
     */
    setTotCeRow() {
        var ceRows = {};
        ceRows.row = {};
        ceRows.row.operation = {};
        ceRows.row.operation.name = "add";
        ceRows.row.fields = {};
        ceRows.row.fields["Group"] = "02";
        ceRows.row.fields["Description"] = "Winst (-) verlies (+) van winst- en verliesrekening";
        ceRows.row.fields["Gr"] = "0511";
        ceRows.emptyRow = this.getEmptyRow();

        return ceRows;
    }

    /* TEMPORARY METHOD, TO BE REVIEWED WHEN WE HAVE A COUPLE OF DIFFERENT AUDIT FILES  
    sets the group in which the annual result, customers and suppliers are to be reported in the balance sheet.
    -if the group is 1E, before the group total I add another group to account for the customers
    -if the group is 2A, before the group total I add another group to account for the annual profit or loss
    -if the group is 2C, before the group total I add another group to account for suppliers.
    */
    setGroupCarriedOver(gr) {
        var grCarriedOver = {};
        switch (gr) {
            case "1E":
                grCarriedOver.gr = "10"
                grCarriedOver.description = "Klanten Register";
                return grCarriedOver;
            case "2A":
                grCarriedOver.gr = "0511"
                grCarriedOver.description = "Winst of verlies lopend jaar";
                return grCarriedOver;
            case "2C":
                grCarriedOver.gr = "20"
                grCarriedOver.description = "Leveranciers register";
                return grCarriedOver;
            default:
                return null;
        }
    }

    /**
     * Creates the row for the carried over groups
     * @param {*} grCarriedOver grCarriedOver object
     * @param {*} grCode
     * @returns 
     */
    setGroupRow_carriedOver(grCarriedOver, grCode) {
        var grRows = {};
        if (grCarriedOver != null) {
            grRows.row = {};
            grRows.row.operation = {};
            grRows.row.operation.name = "add";
            grRows.row.fields = {};
            grRows.row.fields["Group"] = grCarriedOver.gr;
            grRows.row.fields["Description"] = grCarriedOver.description;
            grRows.row.fields["Gr"] = grCode;
        }
        return grRows;
    }

    /**
     * Creates a gr row
     * @param {*} grCode
     * @param {*} bClass 
     * @param {*} accType 
     * @param {*} descr 
     * @returns 
     */
    setGroupRow(grCode,bClass,accType,descr) {
        var grRows = {};
        grRows.row = {};
        grRows.row.operation = {};
        grRows.row.operation.name = "add";
        grRows.row.fields = {};
        grRows.row.fields["Group"] = grCode;
        grRows.row.fields["Description"] = descr;
        grRows.row.fields["Gr"] = this.setGroupTotal(bClass, accType);
        grRows.emptyRow = this.getEmptyRow();

        return grRows;
    }

    /**
     * creates a line for the total of the section
     * @param {*} currentAccType 
     * @param {*} previsousAccType 
     * @param {*} bClass 
     * @returns 
     */
    setSectionRow(currentAccType, previsousAccType,bClass) {
        var secRows = {};
        secRows.row = {};
        secRows.row.operation = {};
        secRows.row.operation.name = "add";
        secRows.row.fields = {};
        secRows.row.fields["Group"] = this.setGroupTotal(bClass, currentAccType);
        secRows.row.fields["Description"] = this.setSectionDescription(bClass, currentAccType);
        secRows.row.fields["Gr"] = this.setSectionGr(previsousAccType);
        //create an empty row to append after the total row
        secRows.emptyRow = this.getEmptyRow();
        return secRows;
    }

    /**
     * Returns the gr of the section total line
     * @param {*} previsousAccType 
     * @returns 
     */
    setSectionGr(previsousAccType) {
        var sectionTotal = "";
        if (previsousAccType == "B") {
            sectionTotal = "00";
            return sectionTotal;
        } else if (previsousAccType == "P") {
            sectionTotal = "02";
            return sectionTotal;
        } else if (previsousAccType == "C") {
            sectionTotal = "10";
            return sectionTotal;
        } else if (previsousAccType == "S") {
            sectionTotal = "20";
            return sectionTotal;
        } else {
            return sectionTotal;
        }
    }

    /**
     * returns the gr of the group total line according zo bclass and account type
     * @param {*} bClass 
     * @param {*} accType 
     * @returns 
     */
    setGroupTotal(bClass, accType) {
        var groupTotal = "";
        if (accType == "B" || accType == "P") {
            switch (bClass) {
                case "1":
                    groupTotal = "1I"
                    return groupTotal;
                case "2":
                    groupTotal = "2E"
                    return groupTotal;
                case "3":
                    groupTotal = "3G"
                    return groupTotal;
                case "4":
                    groupTotal = "4D"
                    return groupTotal;
                default:
                    return groupTotal;
            }
        } else {
            switch (bClass) {
                case "1":
                    groupTotal = "DEB"
                    return groupTotal;
                case "2":
                    groupTotal = "CRE"
                    return groupTotal;
                default:
                    return groupTotal;
            }
        }
    }

    /**
     * returns the section description according to bclass and account type 
     * @param {*} bClass 
     * @param {*} accType 
     * @returns 
     */
    setSectionDescription(bClass, accType) {
        var descr = "";
        //Banana.console.debug(accType);
        if (accType == "B" || accType == "P") {
            switch (bClass) {
                case "1":
                    descr = "TOTALE ACTIVA"
                    return descr;
                case "2":
                    descr = "TOTALE PASSIVA"
                    return descr;
                case "3":
                    descr = "TOTALE LASTEN"
                    return descr;
                case "4":
                    descr = "TOTALE BATEN"
                    return descr;
                default:
                    return descr;
            }
        } else {
            switch (bClass) {
                case "1":
                    descr = "Total Klanten"
                    return descr;
                case "2":
                    descr = "Total Leveranciers"
                    return descr;
                default:
                    return descr;
            }

        }

    }
    /**
     * Returns the description of the basic section, based on the account type 
     * @param {*} accType 
     * @returns 
     */
    setBaseSectionDescription(accType) {
        var descr = "";
            switch (accType) {
                case "B":
                    descr = "BALANCE"
                    return descr;
                case "P":
                    descr = "WINST- EN VERLIESREKENING"
                    return descr;
                case "S":
                case "C":
                    descr = "KLANTEN EN LEVERANCIERS"
                    return descr;
                default:
                    return descr;
            }
    }

    /**
     * Return an empty rows, used as space between the other rows.
     * @returns 
     */
    getEmptyRow() {
        var emptyRow = {};
        emptyRow.operation = {};
        emptyRow.operation.name = "add";
        emptyRow.fields = {};

        return emptyRow;
    }

    /**
     * Creates the document change object for the customers and suppliers in the account table.
     * @param {*} jsonDoc 
     * @param {*} srcFileName 
     * @param {*} customerSupplierNode 
     * @param {*} customersSuppliersList 
     */
    createJsonDocument_AddCostumersSuppliers(jsonDoc, srcFileName, customerSupplierNode, customersSuppliersList) {

        //creates the row that indicates
        //fare in modo che vengano divisi i clienti con i fornitori nel piano dei conti

        var rows = [];;
        var sectionsDelimitercounter="";
        var _bClass="";
        var _customerSupplierType="";
        var firstLoop=true;

        while (customerSupplierNode) { // For each customerSupplierNode

            var accountNumber = "";
            var accountDescription = "";
            var gr = "";
            var bClass = ""; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
            var accountOpening = "";
            var nameprefix = "";
            var firstname = "";
            var familyname = "";
            var street = "";
            var zip = "";
            var locality = "";
            var countryCode = "";
            var phoneMain = "";
            var fax = "";
            var email = "";
            var website = "";
            var bankiban = "";

            if (customerSupplierNode.firstChildElement('custSupID'))
                var accountNumber = customerSupplierNode.firstChildElement('custSupID').text;
            if (customerSupplierNode.firstChildElement('custSupName'))
                var accountDescription = customerSupplierNode.firstChildElement('custSupName').text;

            //Take the "account___description" of each customer/supplier
            for (var i = 0; i < customersSuppliersList.length; i++) {
                if (customersSuppliersList[i].split("_____")[0] === accountNumber) {
                    if (customersSuppliersList[i].split("_____")[1]) {
                        accountDescription = customersSuppliersList[i].split("_____")[1];
                    }
                }
            }

            if (customerSupplierNode.hasChildElements('custSupTp')) {
                var customerSupplierType = customerSupplierNode.firstChildElement('custSupTp').text;
                bClass = this.setBclassByAccount(accountNumber, customerSupplierType);
                gr = this.setCSGrByBclass(bClass);
            }

            if (customerSupplierNode.hasChildElements('contact')) {
                var str = customerSupplierNode.firstChildElement('contact').text;
                var res = str.split(" ");
                firstname = res[0];
                for (var i = 1; i < res.length; i++) {
                    familyname += res[i] + " ";
                }
            }

            if (customerSupplierNode.hasChildElements('telephone')) {
                phoneMain = customerSupplierNode.firstChildElement('telephone').text;
            }
            if (customerSupplierNode.hasChildElements('fax')) {
                fax = customerSupplierNode.firstChildElement('fax').text;
            }
            if (customerSupplierNode.hasChildElements('eMail')) {
                email = customerSupplierNode.firstChildElement('eMail').text;
            }
            if (customerSupplierNode.hasChildElements('website')) {
                website = customerSupplierNode.firstChildElement('website').text;
            }

            if (customerSupplierNode.hasChildElements('streetAddress')) {
                var streetAddressNode = customerSupplierNode.firstChildElement('streetAddress');
                if (streetAddressNode.hasChildElements('streetname')) {
                    street = streetAddressNode.firstChildElement('streetname').text;
                }
                if (streetAddressNode.hasChildElements('postalCode')) {
                    zip = streetAddressNode.firstChildElement('postalCode').text;
                }
                if (streetAddressNode.hasChildElements('city')) {
                    locality = streetAddressNode.firstChildElement('city').text;
                }
                if (streetAddressNode.hasChildElements('country')) {
                    countryCode = streetAddressNode.firstChildElement('country').text;
                }
            }

            if (customerSupplierNode.hasChildElements('bankAccount')) {
                var bankAccountNode = customerSupplierNode.firstChildElement('bankAccount');
                if (bankAccountNode.hasChildElements('bankAccNr')) {
                    bankiban = bankAccountNode.firstChildElement('bankAccNr').text;
                }
            }

            //Create the base section delimiter only at the beginning
            if(firstLoop){
                var secRows = this.setBaseSectionDelimiterRow(customerSupplierType);
                rows.push(secRows.row);
                rows.push(secRows.emptyRow);
            }

            if (_bClass != bClass) {
                if(sectionsDelimitercounter!=0){
                    var secRows = this.setSectionRow(customerSupplierType, _customerSupplierType,_bClass);
                    rows.push(secRows.row);
                    rows.push(secRows.emptyRow);
                }


                var secRows = this.setSectionDelimiterRow(bClass,customerSupplierType);
                rows.push(secRows.row);
                rows.push(secRows.emptyRow);

                //set back the counter to 0 because the bclass is changed.
                sectionsDelimitercounter=0;
            }

            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["Account"] = accountNumber;
            row.fields["Description"] = accountDescription;
            row.fields["BClass"] = bClass;
            row.fields["Gr"] = gr;
            row.fields["Opening"] = accountOpening;
            row.fields["NamePrefix"] = nameprefix;
            row.fields["FirstName"] = firstname;
            row.fields["FamilyName"] = familyname;
            row.fields["Street"] = street;
            row.fields["PostalCode"] = zip;
            row.fields["Locality"] = locality;
            row.fields["CountryCode"] = countryCode;
            row.fields["PhoneMain"] = phoneMain;
            row.fields["Fax"] = fax;
            row.fields["EmailWork"] = email;
            row.fields["Website"] = website;
            row.fields["BankIban"] = bankiban;

            rows.push(row);

            _bClass = bClass;
            _customerSupplierType = customerSupplierType;
            sectionsDelimitercounter++
            firstLoop=false;

            customerSupplierNode = customerSupplierNode.nextSiblingElement('customerSupplier'); // Next customerSupplier
        }

        //add the last section(queste sezioni finali vengono aggiunte quando i conti nel tag xml finiscono, ho le info dell'ultima riga salvate e uso quelle per definire il gruppo e la sezioni finali)
        var secRows = this.setSectionRow(customerSupplierType, _customerSupplierType,_bClass);
        rows.push(secRows.row);
        rows.push(secRows.emptyRow);

        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "Accounts";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);


    }

    /**
     * Get a list of all the customers and suppliers accounts
     * @param {*} customerSupplierNode 
     * @returns 
     */
    getCustomerSuppliers(customerSupplierNode) {
        var customersSuppliersList = [];
        while (customerSupplierNode) { // For each customerSupplierNode
            var accountNumber = customerSupplierNode.firstChildElement('custSupID').text;
            customersSuppliersList.push(accountNumber); //Add the account to the list
            customerSupplierNode = customerSupplierNode.nextSiblingElement('customerSupplier'); // Next customerSupplier
        }
        //Removing duplicates
        for (var i = 0; i < customersSuppliersList.length; i++) {
            for (var x = i + 1; x < customersSuppliersList.length; x++) {
                if (customersSuppliersList[x] === customersSuppliersList[i]) {
                    customersSuppliersList.splice(x, 1);
                    --x;
                }
            }
        }
        return customersSuppliersList;
    }

/**
 * set the group for the customers and suppliers according to class.
 * @param {*} bClass 
 * @returns 
 */
    setCSGrByBclass(bClass) {
        var gr = "";
        switch (bClass) {
            case "1":
                gr = "DEB"
                return gr;
            case "2":
                gr = "CRE"
                return gr;
            default:
                return gr;
        }
    }

    //to define
    setGrByAccount(account) {
        var gr = "";
        switch (account) {
            case "prova":
                return gr;
        }
        //...
    }

    /**
     * Creates the document change object for the transactions table
     * @param {*} jsonDoc 
     * @param {*} srcFileName 
     * @param {*} companyNode 
     */
    createJsonDocument_AddTransactions(jsonDoc, srcFileName, companyNode) {

        var rows = [];

        var transactionsNode = companyNode.firstChildElement('transactions');
        var journalNode = transactionsNode.firstChildElement('journal');

        while (journalNode) {

            var transactionNode = journalNode.firstChildElement('transaction'); // First transaction
            while (transactionNode) {
                var nr = "";
                var desc = "";
                var trDt = "";

                if (transactionNode.hasChildElements('nr')) {
                    nr = transactionNode.firstChildElement('nr').text;
                }
                if (transactionNode.hasChildElements('desc')) {
                    desc = transactionNode.firstChildElement('desc').text;
                }
                if (transactionNode.hasChildElements('trDt')) {
                    trDt = transactionNode.firstChildElement('trDt').text;
                }
                //Banana.console.log("NEW TRANSACTION: " + nr + "; " + desc + "; " + trDt);

                var trLineNode = transactionNode.firstChildElement('trLine');
                while (trLineNode) {

                    var trLineNr = "";
                    var transactionDescription = "";
                    var trLineAccID = "";
                    var trLineDocRef = "";
                    var trLineEffDate = "";
                    var trLineDesc = "";
                    var trLineAmnt = "";
                    var trLineAmntTp = "";
                    var trLineVatId = "";
                    var trLineVatPerc = "";
                    var trLineVatPerc = "";
                    var trLineVatAmt = "";
                    var trLineVatAmtTp = "";

                    if (trLineNode.hasChildElements('nr')) {
                        trLineNr = trLineNode.firstChildElement('nr').text;
                    }
                    if (trLineNode.hasChildElements('accID')) {
                        trLineAccID = trLineNode.firstChildElement('accID').text;
                    }
                    if (trLineNode.hasChildElements('docRef')) {
                        trLineDocRef = trLineNode.firstChildElement('docRef').text;
                    }
                    if (trLineNode.hasChildElements('effDate')) {
                        trLineEffDate = trLineNode.firstChildElement('effDate').text;
                    }
                    if (trLineNode.hasChildElements('desc')) {
                        trLineDesc = trLineNode.firstChildElement('desc').text;
                    }
                    if (trLineNode.hasChildElements('amnt')) {
                        trLineAmnt = trLineNode.firstChildElement('amnt').text;
                    }
                    if (trLineNode.hasChildElements('amntTp')) {
                        trLineAmntTp = trLineNode.firstChildElement('amntTp').text;
                    }

                    //row VAT 
                    if (trLineNode.hasChildElements('vat')) {
                        var trLineVat = trLineNode.firstChildElement('vat');
                        trLineVatId = trLineVat.firstChildElement('vatID').text;
                        trLineVatPerc = trLineVat.firstChildElement('vatPerc').text;
                        trLineVatAmt = trLineVat.firstChildElement('vatAmnt').text;
                        trLineVatAmtTp = trLineVat.firstChildElement('vatAmntTp').text;
                        //save the values i will put in the Vat Codes table.
                        this.vatTransactionsList.push(trLineVatId + "_____" + trLineVatPerc + "_____" + trLineVatAmtTp);
                        if (trLineVatId)
                            trLineVatId = "[" + trLineVatId + "]";
                    }

                    // Description of the transaction
                    if (desc) {
                        transactionDescription = desc + ", " + trLineDesc;
                    } else {
                        transactionDescription = trLineDesc;
                    }

                    // Account and ContraAccount of the transaction
                    if (trLineAmntTp === "D") {
                        var transactionDebitAccount = trLineAccID;
                        var transactionCreditAccount = "";
                    } else if (trLineAmntTp === "C") {
                        var transactionDebitAccount = "";
                        var transactionCreditAccount = trLineAccID;
                    }

                    //add an empty row every new block of transactions
                    if (this.transNr !== nr) {
                        var emptyRow = this.getEmptyRow();
                        rows.push(emptyRow);
                    }

                    var row = {};
                    row.operation = {};
                    row.operation.name = "add";
                    row.operation.srcFileName = srcFileName;
                    row.fields = {};
                    row.fields["Date"] = trLineEffDate;
                    row.fields["Doc"] = nr;
                    row.fields["Description"] = transactionDescription;
                    row.fields["AccountDebit"] = transactionDebitAccount;
                    row.fields["AccountCredit"] = transactionCreditAccount;
                    row.fields["Amount"] = Banana.SDecimal.abs(trLineAmnt);
                    row.fields["VatCode"] = trLineVatId;



                    rows.push(row);

                    this.transNr = nr;

                    trLineNode = trLineNode.nextSiblingElement('trLine'); // Next trLine
                } //trLineNode


                transactionNode = transactionNode.nextSiblingElement('transaction'); // Next transaction
            } // transactionNode

            journalNode = journalNode.nextSiblingElement('journal'); // Next journal

        } //journalNode


        //se non è la versione advanced,limito le registrazioni importate a 100 righe
        if (!this.isAdvanced) {
            rows = rows.slice(0, 100);
        }

        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "Transactions";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);
    }

    /**
     * Saves and returns a list with the opening balances
     * @param {*} companyNode 
     * @returns 
     */
    loadOpeningBalances(companyNode) {

        var openingBalanceList = [];
            if (companyNode && companyNode.hasChildElements('openingBalance')) {
                var openingBalanceNode = companyNode.firstChildElement('openingBalance');

                if (openingBalanceNode.hasChildElements('obLine')) {
                    var obLineNode = openingBalanceNode.firstChildElement('obLine');

                    while (obLineNode) { // For each openingBalance

                        if (obLineNode.hasChildElements('accID')) {
                            var accID = obLineNode.firstChildElement('accID').text;
                        }
                        if (obLineNode.hasChildElements('amnt')) {
                            var amnt = obLineNode.firstChildElement('amnt').text;
                        }
                        if (obLineNode.hasChildElements('amntTp')) {
                            var amntTp = obLineNode.firstChildElement('amntTp').text;
                        }

                        openingBalanceList.push(accID + "_____" + amnt + "_____" + amntTp);
                        obLineNode = obLineNode.nextSiblingElement('obLine'); // Next obLine
                    }
                }
        }
        return openingBalanceList;
    }

    /**
     * Set bClass according to account type 
     * @param {*} gr 
     * @param {*} accType 
     * @returns 
     */
    setBclassByAccount(gr, accType) {
        /* from xml file:
        
        Accounts:
            B=balance => BClass 1 or 2
            P=profit/loss => BClass 3 or 4
    
        Customers / Suppliers:
            C=customer
            S=supplier
            B=both customer and supplier
            O=Other, no customer or supplier
        */

        var bClass = "";
        if (accType === "B") {
            if (gr.substr(0, 1) == "1")
                bClass = "1";
            else
                bClass = "2";
        } else if (accType === "P") {
            if (gr.substr(0, 1) == "3")
                bClass = "3";
            else
                bClass = "4";
        } else if (accType === "C") {
                bClass = "1";
        } else if (accType === "S") {
                bClass = "2";
        }
        return bClass;
    }

    /**
     * initialises the structure for document change.
     * @returns 
     */
    createJsonDocument_Init() {

        var jsonDoc = {};
        jsonDoc.document = {};
        jsonDoc.document.dataUnitsfileVersion = "1.0.0";
        jsonDoc.document.dataUnits = [];

        jsonDoc.creator = {};
        var d = new Date();
        var datestring = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        var timestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        //jsonDoc.creator.executionDate = Banana.Converter.toInternalDateFormat(datestring, "yyyymmdd");
        //jsonDoc.creator.executionTime = Banana.Converter.toInternalTimeFormat(timestring, "hh:mm");
        jsonDoc.creator.name = Banana.script.getParamValue('id');
        jsonDoc.creator.version = "1.0";

        return jsonDoc;

    }

    /**
     * Returns information to the accounting file.
     */
    getAccountingInfo() {
        this.accountingInfo = {};
        this.accountingInfo.isDoubleEntry = false;
        this.accountingInfo.isIncomeExpenses = false;
        this.accountingInfo.isCashBook = false;
        this.accountingInfo.multiCurrency = false;
        this.accountingInfo.withVat = false;
        this.accountingInfo.vatAccount = "";
        this.accountingInfo.customersGroup = "";
        this.accountingInfo.suppliersGroup = "";

        if (this.banDocument) {
            var fileGroup = this.banDocument.info("Base", "FileTypeGroup");
            var fileNumber = this.banDocument.info("Base", "FileTypeNumber");
            var fileVersion = this.banDocument.info("Base", "FileTypeVersion");

            if (fileGroup == "100")
                this.accountingInfo.isDoubleEntry = true;
            else if (fileGroup == "110")
                this.accountingInfo.isIncomeExpenses = true;
            else if (fileGroup == "130")
                this.accountingInfo.isCashBook = true;

            if (fileNumber == "110") {
                this.accountingInfo.withVat = true;
            }
            if (fileNumber == "120") {
                this.accountingInfo.multiCurrency = true;
            }
            if (fileNumber == "130") {
                this.accountingInfo.multiCurrency = true;
                this.accountingInfo.withVat = true;
            }

            if (this.banDocument.info("AccountingDataBase", "VatAccount"))
                this.accountingInfo.vatAccount = this.banDocument.info("AccountingDataBase", "VatAccount");

            if (this.banDocument.info("AccountingDataBase", "CustomersGroup"))
                this.accountingInfo.customersGroup = this.banDocument.info("AccountingDataBase", "CustomersGroup");
            if (this.banDocument.info("AccountingDataBase", "SuppliersGroup"))
                this.accountingInfo.suppliersGroup = this.banDocument.info("AccountingDataBase", "SuppliersGroup");
        }
    }

    /**
     * returns the error message
     * @param {*} errorId 
     * @param {*} lang 
     * @returns 
     */
    getErrorMessage(errorId, lang) {
        if (!lang)
            lang = 'en';
        switch (errorId) {
            case this.ID_ERR_LICENSE_NOTVALID:
                // Banana.console.debug("advanced message: "+errorId);
                return "This extension requires Banana Accounting+ Advanced, the import of Transactions is limited to 100 Rows";
            case this.ID_ERR_VERSION_NOTSUPPORTED:
                return "This script does not run with your current version of Banana Accounting.\nMinimum version required: %1.\nTo update or for more information click on Help";
            default:
                return '';
        }
    }

    /**
     * check Banana's licence
     * @returns 
     */
    isBananaAdvanced() {
        // Starting from version 10.0.7 it is possible to read the property Banana.application.license.isWithinMaxRowLimits 
        // to check if all application functionalities are permitted
        // the version Advanced returns isWithinMaxRowLimits always false
        // other versions return isWithinMaxRowLimits true if the limit of transactions number has not been reached

        if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, "10.0.9") >= 0) {
            var license = Banana.application.license;
            //Banana.console.debug(license.licenseType);
            //tolgo il license.isWithinMaxFreeLines perchè siccome il file inizialmente e vuoto mi darà sempre true.
            if (license.licenseType === "advanced") {
                return true;
            }
        }
        return false;
    }

    /**
     * check Banana's version
     * @returns 
     */
    verifyBananaVersion() {
        if (!Banana.document)
            return false;

        var lang = this.getLang();

        //Banana+ is required
        var requiredVersion = "10.0.9";
        if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, requiredVersion) < 0) {
            var msg = this.getErrorMessage(this.ID_ERR_VERSION_NOTSUPPORTED, lang);
            msg = msg.replace("%1", requiredVersion);
            this.banDocument.addMessage(msg, this.ID_ERR_VERSION_NOTSUPPORTED);
            return false;
        }
        return true;
    }

    /**
     * returns the language code
     * @returns 
     */
    getLang() {
        var lang = 'en';
        if (this.banDocument)
            lang = this.banDocument.locale;
        else if (Banana.application.locale)
            lang = Banana.application.locale;
        if (lang.length > 2)
            lang = lang.substr(0, 2);
        return lang;
    }
}


function exec(inData) {

    if (!Banana.document || inData.length <= 0) {
        return "@Cancel";
    }

    Banana.application.clearMessages();
    var nlAuditFilesImport = new NlAuditFilesImport(Banana.document);

    if (!nlAuditFilesImport.verifyBananaVersion()) {
        return "@Cancel";
    }

    var jsonData = {};
    try {
        jsonData = JSON.parse(inData);
    } catch (e) {
        jsonData[0] = inData;
    }

    if (!jsonData)
        return "@Cancel";

    nlAuditFilesImport.createJsonDocument(jsonData);

    var jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = nlAuditFilesImport.jsonDocArray;

    return jsonDoc;

}