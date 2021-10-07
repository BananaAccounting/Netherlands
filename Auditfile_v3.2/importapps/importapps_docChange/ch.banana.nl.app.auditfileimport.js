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
// @pubdate = 2021-10-07
// @publisher = Banana.ch SA
// @description = Import audit file Netherlands
// @doctype = *
// @encoding = utf-8
// @task = import.rows
// @outputformat = tablewithheaders
// @inputdatasource = openfiledialog
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
        this.isAdvanced=isBananaAdvanced();
        this.banDocument = banDocument;
        this.lead = {};
        this.bClass = "";
        this.transNr = "";
        this.accountType="";
        this.vatTransactionsList=[];

        //array dei patches
        this.jsonDocArray = [];

        //errors
        this.ID_ERR_LICENSE_NOTVALID = "ID_ERR_LICENSE_NOTVALID";
        this.ID_ERR_VERSION_NOTSUPPORTED="ID_ERR_VERSION_NOTSUPPORTED";

    }

    /**
     * Il metodo createJsonDocument() riprende i dati dal file xml e li trasforma
     * in formato json per essere importati nella tabella Registrazioni
     * @param {*} inData 
     */
    createJsonDocument(inData) {

        var jsonDoc = this.createJsonDocument_Init();

        for (var srcFileName in inData) {

            //seleziona singolo file xml
            var xmlFile = Banana.Xml.parse(inData[srcFileName]);
            if (!xmlFile)
                continue;

            var xmlRoot = xmlFile.firstChildElement('auditfile');
            if (!xmlRoot)
                continue;

            var headerNode=xmlRoot.firstChildElement('header');
            var companyNode = xmlRoot.firstChildElement('company');

            var openingBalanceList = this.loadOpeningBalances(companyNode);

            var customersSuppliersList = [];
            if (companyNode.hasChildElements('customersSuppliers')) {
                var customersSuppliersNode = companyNode.firstChildElement('customersSuppliers');
                if (customersSuppliersNode.hasChildElements('customerSupplier')) {
                    var customerSupplierNode = customersSuppliersNode.firstChildElement('customerSupplier'); // First customerSupplier
                    customersSuppliersList = this.getCustomerSuppliers(customerSupplierNode);
                }
            }
            /*********************************************************************
             * ADD THE FILE PROPERTIES
             *********************************************************************/
            this.createJsonDocument_AddFileProperties(jsonDoc, srcFileName,headerNode,companyNode);
            /*********************************************************************
             * ADD THE ACCOUNTS
             *********************************************************************/
            this.createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, customersSuppliersList, openingBalanceList);

            /*********************************************************************
             * ADD THE COSTUMERS/SUPPLIERS
             *********************************************************************/
            if (customersSuppliersList.length > 0)
                this.createJsonDocument_AddCostumersSuppliers(jsonDoc,srcFileName,customerSupplierNode, customersSuppliersList);

            /*********************************************************************
             * ADD THE TRANSACTIONS
             *********************************************************************/
                this.createJsonDocument_AddTransactions(jsonDoc, xmlRoot, companyNode, srcFileName);
                // se non è la versione, avverto che l'importazione delle registrazioni è limitata a 100 righe
                if(!this.isAdvanced){
                    var msg = getErrorMessage(this.ID_ERR_LICENSE_NOTVALID, lang);
                    this.banDocument.addMessage(msg, this.ID_ERR_LICENSE_NOTVALID);
                }

            /*********************************************************************
             * ADD THE SUBLEDGERS ELEMENTS
             *********************************************************************/
                //add the vat codes, solo se è presente la tabella vat
                var table=this.banDocument.table("VatCodes");
                if(table)
                 this.createJsonDocument_AddVatCodes(jsonDoc, srcFileName, companyNode);

        }

        this.jsonDocArray.push(jsonDoc);

    }

    createJsonDocument_AddVatCodes(jsonDoc, srcFileName, companyNode){
        var rows = [];
        var vatCodesNode = "";
        var vatNode = "";
        var vatToPayAccId="";
        var vatToClaimAccId="";
        var vatPerc="";
        var vatAmtType="";
        var vatTransList=this.vatTransactionsList;

        vatCodesNode = companyNode.firstChildElement('vatCodes');
        vatNode = vatCodesNode.firstChildElement('vatCode');

        while (vatNode) {

            var vatId = "";
            var vatCodeDescription = "";


            vatId = vatNode.firstChildElement('vatID').text;
            vatCodeDescription = vatNode.firstChildElement('vatDesc').text;
            if(vatNode.hasChildElements('vatToPayAccID'))
                vatToPayAccId=vatNode.firstChildElement('vatToPayAccID').text;
            if(vatNode.hasChildElements('vatToClaimAccID'))
                vatToClaimAccId=vatNode.firstChildElement('vatToClaimAccID').text;

            for(var i=0;i<vatTransList.length;i++){
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
     * 
     * @returns the list of the file properties fields i want to modify/add
     */
    getFileInfoFields() {
            var propertyFields = [];

            propertyFields[0] = "HeaderLeft";
            propertyFields[1] = "HeaderRight";
            propertyFields[2] = "OpeningDate";
            propertyFields[3] = "ClosureDate";
            propertyFields[4] = "BasicCurrency";
            propertyFields[5] = "Company";
            propertyFields[6] = "Address1";
            propertyFields[7] = "City";
            propertyFields[8] = "State";
            propertyFields[9] = "CountryCode";
            propertyFields[10] = "FiscalNumber";


            return propertyFields;

        }
        /**
         * 
         * @param {*} companyNode the xml company node
         * @returns the values i want to put in the file properties fields
         */
    getCompanyInfo(headerNode,companyNode) {

        var companyInfos = [];
        var startDate="";
        var endDate="";
        var basicCurrency="";

        var streetAddressNode
        var companyName = "";
        var companyIdentification="";
        var companyStreetName = "";
        var companyStreetAddressCity = "";
        var companyStreetAddressRegion = "";
        var companyStreetAddressCountry = "";
        var companyStreetAddressTaxReg="";


        //take the information from the node: header
        startDate=headerNode.firstChildElement('startDate').text;
        startDate=startDate.replace(/-/g, "");
        endDate=headerNode.firstChildElement('endDate').text;
        endDate=endDate.replace(/-/g, "");
        basicCurrency=headerNode.firstChildElement('curCode').text;


        //take the information from node: company
        companyName = companyNode.firstChildElement('companyName').text;
        if (companyNode.hasChildElements('companyIdent'))
            companyIdentification = companyNode.firstChildElement('companyIdent').text;
        if(companyNode.hasChildElements('streetAddress'))
            streetAddressNode=companyNode.firstChildElement('streetAddress')
            companyStreetName = streetAddressNode.firstChildElement('streetname').text;
        if (streetAddressNode.hasChildElements('city'))
            companyStreetAddressCity = streetAddressNode.firstChildElement('city').text;
        if (streetAddressNode.hasChildElements('region'))
            companyStreetAddressRegion = streetAddressNode.firstChildElement('region').text;
        if (streetAddressNode.hasChildElements('country'))
        companyStreetAddressCountry = streetAddressNode.firstChildElement('country').text;
        if (companyNode.hasChildElements('taxRegIdent'))
        companyStreetAddressTaxReg = companyNode.firstChildElement('taxRegIdent').text;
        


        companyInfos[0] = companyName+" "+companyIdentification;
        companyInfos[1] = companyStreetName+", "+companyStreetAddressCity+","+companyStreetAddressRegion;
        companyInfos[2] = startDate;
        companyInfos[3] = endDate;
        companyInfos[4] = basicCurrency;
        companyInfos[5] = companyName;
        companyInfos[6] = companyStreetName;
        companyInfos[7] = companyStreetAddressCity;
        companyInfos[8] = companyStreetAddressRegion;
        companyInfos[9] = companyStreetAddressCountry;
        companyInfos[10] = companyStreetAddressTaxReg;
        

        return companyInfos;
    }

    createJsonDocument_AddFileProperties(jsonDoc, srcFileName,headerNode, companyNode) {

        var rows = [];

        var fileInfoFields = this.getFileInfoFields();
        var companyInfos = this.getCompanyInfo(headerNode,companyNode);

        for (var i = 0; i < fileInfoFields.length; i++) {
            var sectionXml="";
            if(i<=1)
                sectionXml="Base";
            else
                sectionXml="AccountingDataBase";

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

    createJsonDocument_AddAccounts(jsonDoc, srcFileName, companyNode, customersSuppliersList, openingBalanceList) {

        var rows = [];
        var generalLedgerNode = "";
        var ledgerAccountNode = "";

        generalLedgerNode = companyNode.firstChildElement('generalLedger');
        ledgerAccountNode = generalLedgerNode.firstChildElement('ledgerAccount');

        while (ledgerAccountNode) {

            var accountNumber = "";
            var accountDescription = "";
            var accType = "";
            var gr = "";
            var bclass = "";
            var totalGr = "";
            var opening = "";
            var grDescription = "";

            accountNumber = ledgerAccountNode.firstChildElement('accID').text;
            if(ledgerAccountNode.hasChildElements('leadDescription'))

                grDescription = ledgerAccountNode.firstChildElement('leadDescription').text;
            if(accountDescription = ledgerAccountNode.hasChildElements('accDesc'))    
                accountDescription = ledgerAccountNode.firstChildElement('accDesc').text;

            if(ledgerAccountNode.hasChildElements('accTp'))    
                accType = ledgerAccountNode.firstChildElement('accTp').text;

            if (ledgerAccountNode.hasChildElements('leadCode'))
                gr = ledgerAccountNode.firstChildElement('leadCode').text;
            else
                gr = this.setGrByAccount(accountNumber);

            if (ledgerAccountNode.hasChildElements('leadReference'))
                bclass = ledgerAccountNode.firstChildElement('leadReference').text;
            else
                bclass = this.setBclassByAccount(gr, accType);

            if (ledgerAccountNode.hasChildElements('leadCrossRef'))
                totalGr = ledgerAccountNode.firstChildElement('leadCrossRef').text;

            //We take all the accounts that are not customers or suppliers
            //because we want all the normal accounts at the beginning,
            //and customers/suppliers at the end.
            if (customersSuppliersList.indexOf(accountNumber) < 0) {
                //if the next element has the same leadcode(gr) than the previous, i create a normal row
                //otherwise, i create a grouping row.Same for the section(Bclass).
                if (this.lead.code != gr) {
                    //carried over groups
                    var grCarriedOver=this.getGroupCarriedOver(this.lead.code);
                    var grCarrOverRows = this.getGroupRow_carriedOver(grCarriedOver, this.lead.code);
                    rows.push(grCarrOverRows.row);

                    //normal groups
                    var grRows = this.getGroupRow(this.lead.code, accType);
                    rows.push(grRows.row);
                    rows.push(grRows.emptyRow);
                }
                if (this.bClass != bclass) {
                    var secRows = this.getSectionRow(accType,this.accountType);
                    rows.push(secRows.row);
                    rows.push(secRows.emptyRow);
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
                row.fields["BClass"] = bclass;
                row.fields["Gr"] = gr;
                row.fields["Opening"] = opening;


                rows.push(row);

                //se il gruppo è diverso da quello precedente, allora inserisco una voce di raggruppamento
                //row=createJsonDocument_AddGrLine(gr)

                this.lead.code = gr;
                this.lead.description = grDescription;
                this.accountType=accType;
                this.bClass = bclass;
            }

            ledgerAccountNode = ledgerAccountNode.nextSiblingElement('ledgerAccount');
        }

        //alla fine aggiungo ancora il raggruppamento e la sezione finale riprendendo gli ultimi elementi salvati
        //last group
        var grRows = this.getGroupRow(this.lead.code, accType);
        rows.push(grRows.row);
        rows.push(grRows.emptyRow);
        //last section
        var secRows = this.getSectionRow(accType,this.accountType)
        rows.push(secRows.row);
        rows.push(secRows.emptyRow);

        //aggiungo il totale del CE (utile o perdita)
        var totCeRow=this.getTotCeRow();
        rows.push(totCeRow.row);
        rows.push(totCeRow.emptyRow);

        //aggiungo la differenza del Bilancio (dovrebbe essere zero)
        var balanceDiff=this.getBalanceDiff();
        rows.push(balanceDiff.row);
        rows.push(balanceDiff.emptyRow);


        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "Accounts";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        // Banana.Ui.showText(JSON.stringify(dataUnitFilePorperties));

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);


    }

    getBalanceDiff(){
        var balanceRows = {};
        balanceRows.row = {};
        balanceRows.row.operation = {};
        balanceRows.row.operation.name = "add";
        balanceRows.row.fields = {};
        balanceRows.row.fields["Group"] = "00";
        balanceRows.row.fields["Description"] = "Verschil moet = 0 (lege cel) zijn";
        balanceRows.emptyRow=this.getEmpty

        return balanceRows;
    }
    getTotCeRow(){
        var ceRows = {};
        ceRows.row = {};
        ceRows.row.operation = {};
        ceRows.row.operation.name = "add";
        ceRows.row.fields = {};
        ceRows.row.fields["Group"] = "02";
        ceRows.row.fields["Description"] = "Winst (-) verlies (+) van winst- en verliesrekening";
        ceRows.row.fields["Gr"] = "0511";
        ceRows.emptyRow=this.getEmpty

        return ceRows;
    }

    /* METODO MOMENTANEO, DA RIVEDERE QUANDO SAREMO IN POSSESSO DI UN PAIO DI AUDIT FILES DIVERSI   
    -se il gruppo e 1E, prima del totale gruppo aggiungo un altro gruppo per contabilizzare i clienti
    -se il gruppo é 2 A, prima del totale gruppo aggiungo un altro gruppo per contabilizzare l'utile o la perdita annuale
    -se il gruppo è 2C, prima del totale del gruppo aggiungo un altro gruppo per contabilizzare i fornitori.
    */
    getGroupCarriedOver(){
        var grCarriedOver={};
        switch(this.lead.code){
            case "1E":
                grCarriedOver.gr="10"
                grCarriedOver.description="Klanten Register";
                return grCarriedOver;
            case "2A":
                grCarriedOver.gr="0511"
                grCarriedOver.description="Leveranciers register";
                return grCarriedOver;
            case "2C":
                grCarriedOver.gr="20"
                grCarriedOver.description="Winst of verlies lopend jaar"
                return grCarriedOver;
            default:
                return null;
        }
    }
   getGroupRow_carriedOver(grCarriedOver,grCode) {
        var grRows = {};
        if(grCarriedOver!=null){
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


    getGroupRow(grCode, accType) {
        var grRows = {};
        grRows.row = {};
        grRows.row.operation = {};
        grRows.row.operation.name = "add";
        grRows.row.fields = {};
        grRows.row.fields["Group"] = grCode;
        grRows.row.fields["Description"] = this.lead.description;
        grRows.row.fields["Gr"] = this.getGroupTotal(this.bClass, accType);
        grRows.emptyRow = this.getEmptyRow();

        return grRows;
    }

    getSectionRow(currentAccType,previsousAccType) {
        var secRows = {};
        secRows.row = {};
        secRows.row.operation = {};
        secRows.row.operation.name = "add";
        secRows.row.fields = {};
        secRows.row.fields["Group"] = this.getGroupTotal(this.bClass, currentAccType);
        secRows.row.fields["Description"] = this.getSectionDescription(this.bClass,currentAccType);
        secRows.row.fields["Gr"]=this.getSectionGr(previsousAccType);
        //create an empty row to append after the total row
        secRows.emptyRow = this.getEmptyRow();
        return secRows;
    }

    getSectionGr(previsousAccType){
        var sectionTotal = "";
        if (previsousAccType == "B") {
            sectionTotal="00";
            return sectionTotal;
        }else if(previsousAccType=="P"){
            sectionTotal="02";
            return sectionTotal;
        }else if(previsousAccType=="C"){
            sectionTotal="10";
            return sectionTotal;
        }else if(previsousAccType=="S"){
            sectionTotal="20";
            return sectionTotal;
        }else{
            return sectionTotal;
        }
    }


    getGroupTotal(bclass, accType) {
        var groupTotal = "";
        if (accType == "B" || accType == "P") {
            switch (bclass) {
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
            switch (bclass) {
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
    getSectionDescription(bclass,accType) {
        var descr = "";
        //Banana.console.debug(accType);
        if (accType == "B" || accType == "P") {
            switch (bclass) {
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
        }else{
            switch (bclass) {
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
    getEmptyRow() {
        var emptyRow = {};
        emptyRow.operation = {};
        emptyRow.operation.name = "add";
        emptyRow.fields = {};

        return emptyRow;
    }

    createJsonDocument_AddCostumersSuppliers(jsonDoc, srcFileName, customerSupplierNode, customersSuppliersList) {

        //creates the row that indicates
        //fare in modo che vengano divisi i clienti con i fornitori nel piano dei conti

        var rows = [];
        //svuoto la variabile già utilizzata per i conti del bilancio e conto economico
        this.bClass="";
        this.accountType="";

        while (customerSupplierNode) { // For each customerSupplierNode

            var accountNumber = "";
            var accountDescription = "";
            var gr = "";
            var bclass = ""; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
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

            if(customerSupplierNode.firstChildElement('custSupID'))
                var accountNumber = customerSupplierNode.firstChildElement('custSupID').text;
            if(customerSupplierNode.firstChildElement('custSupName'))
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
                bclass = this.setBclassByAccount(accountNumber,customerSupplierType);
                gr=this.setCSGrByBclass(bclass);
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

            if (this.bClass != bclass) {
                var secRows = this.getSectionRow(customerSupplierType,this.accountType);
                rows.push(secRows.row);
                rows.push(secRows.emptyRow);
            }

            var row = {};
            row.operation = {};
            row.operation.name = "add";
            row.operation.srcFileName = srcFileName;
            row.fields = {};
            row.fields["Account"] = accountNumber;
            row.fields["Description"] = accountDescription;
            row.fields["BClass"] = bclass;
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

            this.bClass=bclass;
            this.accountType=customerSupplierType;

            customerSupplierNode = customerSupplierNode.nextSiblingElement('customerSupplier'); // Next customerSupplier
        }

        //add the last section(queste sezioni finali vengono aggiunte quando i conti nel tag xml finiscono, ho le info dell'ultima riga salvate e uso quelle per definire il gruppo e la sezioni finali)
        var secRows = this.getSectionRow(customerSupplierType,this.accountType);
        rows.push(secRows.row);
        rows.push(secRows.emptyRow);

        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "Accounts";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);


    }

    // Get a list of all the customers and suppliers accounts
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

    setCSGrByBclass(bClass){
        var gr="";
        switch(bClass){
            case "1":
                gr="DEB"
                return gr;
            case "2":
                gr="CRE"
                return gr;
            default:
                return gr;
        }
    }


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
                    var trLineVatId="";
                    var trLineVatPerc="";
                    var trLineVatPerc="";
                    var trLineVatAmt="";
                    var trLineVatAmtTp="";

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
                        var trLineVat= trLineNode.firstChildElement('vat');
                        trLineVatId=trLineVat.firstChildElement('vatID').text;
                        trLineVatPerc=trLineVat.firstChildElement('vatPerc').text;
                        trLineVatAmt=trLineVat.firstChildElement('vatAmnt').text;
                        trLineVatAmtTp=trLineVat.firstChildElement('vatAmntTp').text;
                        //save the values i will put in the Vat Codes table.
                        this.vatTransactionsList.push(trLineVatId+"_____"+trLineVatPerc+"_____"+trLineVatAmtTp);
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
                    row.fields["VatCode"] = "["+trLineVatId+"]";



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
            rows.slice(0,100);
        }

        var dataUnitFilePorperties = {};
        dataUnitFilePorperties.nameXml = "Transactions";
        dataUnitFilePorperties.data = {};
        dataUnitFilePorperties.data.rowLists = [];
        dataUnitFilePorperties.data.rowLists.push({ "rows": rows });

        jsonDoc.document.dataUnits.push(dataUnitFilePorperties);
    }

    loadOpeningBalances(companyNode) {

        var openingBalanceList = [];

        if (companyNode.hasChildElements('openingBalance')) {
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

    setGrByAccount(account) {
        var gr = "";
        switch (account) {
            case "lol":
                return gr;
        }
        //...
    }

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

        var bclass = "";
        if (accType === "B") {
            if (gr.substr(0, 1) == "1")
                bclass = "1";
            else
                bclass = "2";
        } else if (accType === "P") {
            if (gr.substr(0, 1) == "3")
                bclass = "3";
            else
                bclass = "4";
        } else if (accType === "C") {
            bclass = "1";
        } else if (accType === "S") {
            bclass = "2";
        }
        return bclass;
    }

    createJsonDocument_Init() {

        var jsonDoc = {};
        jsonDoc.document = {};
        jsonDoc.document.dataUnitsfileVersion = "1.0.0";
        jsonDoc.document.dataUnits = [];

        jsonDoc.creator = {};
        var d = new Date();
        var datestring = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
        var timestring = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        jsonDoc.creator.executionDate = Banana.Converter.toInternalDateFormat(datestring, "yyyymmdd");
        jsonDoc.creator.executionTime = Banana.Converter.toInternalTimeFormat(timestring, "hh:mm");
        jsonDoc.creator.name = Banana.script.getParamValue('id');
        jsonDoc.creator.version = "1.0";

        return jsonDoc;

    }

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
}

function getErrorMessage(errorId) {
    if (!lang)
        lang = 'en';
    switch (errorId) {
        case this.ID_ERR_LICENSE_NOTVALID:
            return "This extension requires Banana Accounting+ Advanced, the import of Transactions is limited to 100 Rows";
        case this.ID_ERR_VERSION_NOTSUPPORTED:
            return "This script does not run with your current version of Banana Accounting.\nMinimum version required: %1.\nTo update or for more information click on Help";
    }
    return '';
}

function isBananaAdvanced() {
    // Starting from version 10.0.7 it is possible to read the property Banana.application.license.isWithinMaxRowLimits 
    // to check if all application functionalities are permitted
    // the version Advanced returns isWithinMaxRowLimits always false
    // other versions return isWithinMaxRowLimits true if the limit of transactions number has not been reached

    if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, "10.0.9") >= 0) {
        var license = Banana.application.license;
        if (license.licenseType === "advanced" || license.isWithinMaxFreeLines) {
            return true;
        }
    }

    return false;
}

function bananaRequiredVersion(requiredVersion, expmVersion) {
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

function verifyBananaVersion() {
    if (!Banana.document)
        return false;

    var lang = this.getLang();

    var ban_version_min = "10.0.9";
    var ban_dev_version_min = "";
    var curr_version = bananaRequiredVersion(ban_version_min, ban_dev_version_min);

    if (!curr_version) {
        var msg = this.getErrorMessage(this.ID_ERR_VERSION_NOTSUPPORTED, lang);
        msg = msg.replace("%1", BAN_VERSION_MIN);
        Banana.document.addMessage(msg, this.ID_ERR_VERSION_NOTSUPPORTED);
        return false;
    }
    return true;
}

function getLang() {
    var lang = 'en';
    if (this.banDocument)
        lang = this.banDocument.locale;
    else if (Banana.application.locale)
        lang = Banana.application.locale;
    if (lang.length > 2)
        lang = lang.substr(0, 2);
    return lang;
}


function exec(inData) {

    if (!Banana.document || inData.length <= 0 || !verifyBananaVersion())
        return "@Cancel";

    var jsonData = {};
    try {
        jsonData = JSON.parse(inData);
    } catch (e) {
        jsonData[0] = inData;
    }

    if (!jsonData)
        return "@Cancel";

    var nlAuditFilesImport = new NlAuditFilesImport(Banana.document);

    nlAuditFilesImport.createJsonDocument(jsonData);

    var jsonDoc = { "format": "documentChange", "error": "" };
    jsonDoc["data"] = nlAuditFilesImport.jsonDocArray;

    return jsonDoc;

}