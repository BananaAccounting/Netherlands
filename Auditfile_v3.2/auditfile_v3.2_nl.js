// Copyright [2015] [Banana.ch SA - Lugano Switzerland]
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
// @id = ch.banana.nl.app.auditfile
// @api = 1.0
// @pubdate = 2018-07-13
// @publisher = Banana.ch SA
// @description = XML Financial Auditfile (v3.2)
// @description.nl = XML Auditfile Financieel (v3.2)
// @task = app.command
// @doctype = 100.*;110.*
// @encoding = utf-8
// @docproperties = 
// @outputformat = none
// @inputdataform = none
// @timeout = -1
// @includejs = 


/*
*	SUMMARY
*   =======
*
*	This BananaApp creates an XML file containing Banana Accounting data.
*   The structure of the file and its content follows the Auditfile v3.2 for Netherland specifications.
*
*/


var ERROR_STRING_MIN_LENGTH = false;
var ERROR_STRING_MAX_LENGTH = false;
var ERROR_VALUE_NOT_ALLOWED = false;

var param = {};


/* Function that loads some parameters */
function loadParam(startDate, endDate) {
    param = {
        "startDate" : startDate,
        "endDate" : endDate,
    };
}

/* Main function */
function exec() {

	Banana.document.clearMessages();

    //Check the version of Banana. If < than 9.0.3 the script does not start
    var requiredVersion = '9.0.3';
    if (Banana.compareVersion && Banana.compareVersion(Banana.application.version, requiredVersion) >= 0) {

    	var isTest = false;

		// Opend a dialog. User must choose a period
        var dateform = null;
        if (options && options.useLastSettings) {
            dateform = getScriptSettings();
        } else {
            dateform = settingsDialog();
        }
        if (!dateform) {
            return;
        }

        /* 1) Load parameters */
        loadParam(dateform.selectionStartDate, dateform.selectionEndDate);

        /* 2) Create the xml document */
        var isTest = false;
        createXml(Banana.document, dateform.selectionStartDate, dateform.selectionEndDate, isTest);
    }
    else {
		Banana.document.addMessage('Banana Accounting ' + requiredVersion + ' is required.');	
    }
}

/* Creates the XML document */
function createXml(banDoc, startDate, endDate, isTest) {

    var xmlDocument = Banana.Xml.newDocument("auditfile");

    var auditfile = addSchemaAndNamespaces(xmlDocument);
    var header = addHeader(auditfile, banDoc, startDate, endDate);
    var company = addCompany(auditfile, banDoc, startDate, endDate);
    var customersSuppliers = addCustomersSuppliers(company, banDoc, startDate, endDate);
    var generalLedger = addGeneralLedger(company, banDoc, startDate, endDate);
    var vatCodes = addVatCodes(company, banDoc, startDate, endDate);
    var periods = addPeriods(company, banDoc, startDate, endDate);
    // DO WE USE IT ???
    //var openingBalance = addOpeningBalance(company, banDoc, startDate, endDate);
    var transactions = addTransactions(company, banDoc, startDate, endDate);

    var output = Banana.Xml.save(xmlDocument);
    //banDoc.addMessage(output);

    if (!isTest) {

		//Check errors and stop script execution if errors occurs
		if (ERROR_STRING_MIN_LENGTH || ERROR_STRING_MAX_LENGTH || ERROR_VALUE_NOT_ALLOWED) {
		    return;
		}

	    saveData(output);
	}

	return output;
}

/* Initialize the xml schema */
function initSchemarefs() {
    param.schemaRefs = [
        'http://www.auditfiles.nl/XAF/3.2'
    ];
}

/* Initialize the xml namespaces */
function initNamespaces() {
    param.namespaces = [
        {
          'namespace' : 'http://www.auditfiles.nl/XAF/3.2',
          'prefix' : 'xmlns'
        },
        {
          'namespace' : 'http://www.w3.org/2001/XMLSchema-instance',
          'prefix' : 'xmlns:xsi'
        }
    ];
}



/********************************
*
*	XML document creation
*
********************************/

/* Function that adds xml schema and namespaces */
function addSchemaAndNamespaces(xml) {

    var auditfile = xml.addElement("auditfile");
    //initSchemarefs();
    initNamespaces();

    var attrsSchemaLocation = '';
    for (var i in param.schemaRefs) {
        var schema = param.schemaRefs[i];
        if (schema.length > 0) {
            attrsSchemaLocation += schema;
        }
    }
    if (attrsSchemaLocation.length > 0) {
        auditfile.setAttribute("xsi:schemaLocation", attrsSchemaLocation);
    }

    for (var i in param.namespaces) {
        var prefix = param.namespaces[i]['prefix'];
        var namespace = param.namespaces[i]['namespace'];
        auditfile.setAttribute(prefix, namespace);
    }
    return auditfile;
}

/* Function that creates the <header> element of the xml file */
function addHeader(xml, banDoc, startDate, endDate) {

	/*
		<header>
			<fiscalYear>2016</fiscalYear>
			<startDate>2016-01-01</startDate>
			<endDate>2016-12-31</endDate>
			<curCode>EUR</curCode>
			<dateCreated>2017-09-01</dateCreated>
			<softwareDesc>Boekhoudsoftware</softwareDesc>
			<softwareVersion>V10.2.1</softwareVersion>
		</header>
	*/

    var fiscalYear = Banana.Converter.toDate(startDate).getFullYear();
    var curCode = banDoc.info("AccountingDataBase", "BasicCurrency");
    var date = new Date();
	var day = '';
	var month = '';
	var year = date.getFullYear();
	var dateCreated = '';
	var softwareDesc = 'Banana Accounting';
	var softwareVersion = banDoc.info("Base","ProgramVersion");

    day = date.getDate().toString();
    if (day.length < 2) {
        day = "0" + day;
    }
    month = (date.getMonth() + 1).toString();
    if (month.length < 2) {
        month = "0" + month;
    }
	dateCreated = year + '-' + month + '-' + day; // YYYY-MM-DD

	checkStringLength(fiscalYear, 4, 9, false);
	checkStringLength(startDate, 10, 16, false);
	checkStringLength(endDate, 10, 16, false);
	checkStringLength(curCode, 3, 3, false);
	checkStringLength(dateCreated, 10, 16, false);
	checkStringLength(softwareDesc, 0, 50, false);
	checkStringLength(softwareVersion, 0, 20, false);

	var headerNode = xml.addElement('header');
	var fiscalYearNode = headerNode.addElement('fiscalYear').addTextNode(fiscalYear);
	var startDateNode = headerNode.addElement('startDate').addTextNode(startDate);
	var endDateNode = headerNode.addElement('endDate').addTextNode(endDate);
	var curCodeNode = headerNode.addElement('curCode').addTextNode(curCode);
	var dateCreatedNode = headerNode.addElement('dateCreated').addTextNode(dateCreated);
	var softwareDescNode = headerNode.addElement('softwareDesc').addTextNode(softwareDesc);
	var softwareVersionNode = headerNode.addElement('softwareVersion').addTextNode(softwareVersion);

    return headerNode;
}

/* Function that creates the <company> element of the xml file */
function addCompany(xml, banDoc, startDate, endDate) {
	/*
		<company>
			<companyIdent>ID123456</companyIdent>
			<companyName>Voorbeeldbedrijf</companyName>
			<taxRegistrationCountry>NL</taxRegistrationCountry>
			<taxRegIdent>String</taxRegIdent>
			<streetAddress>
				<streetname>Straatnaam</streetname>
				<number>15</number>
				<numberExtension>A</numberExtension>
				<property>1e etage</property>
				<city>Rommeldam</city>
				<postalCode>5555FF</postalCode>
				<region>String</region>
				<country>NL</country>
			</streetAddress>
			<postalAddress>
				<streetname>Postbus 45</streetname>
				<number/>
				<numberExtension/>
				<property/>
				<city>Rommeldam</city>
				<postalCode>5555AA</postalCode>
				<region>String</region>
				<country>NL</country>
			</postalAddress>
		
			...
	
		<company>
	*/

	var companyIdent = ''; // take from dialog?
	var companyName = '';
	var taxRegistrationCountry = 'NL'; // take from dialog?
	var taxRegIdent = '';
	var streetname = '';
	var number = '';
	var numberExtension = '';
	var property = '';
	var city = '';
	var postalCode = '';
	var region = '';
	var country = '';

	companyName = banDoc.info("AccountingDataBase", "Company");
	taxRegIdent = banDoc.info("AccountingDataBase","VatNumber");
    streetname = banDoc.info("AccountingDataBase", "Address1");
    postalstreetname = banDoc.info("AccountingDataBase", "Address2");
    city = banDoc.info("AccountingDataBase", "City");
    postalCode = banDoc.info("AccountingDataBase", "Zip");
    region = banDoc.info("AccountingDataBase", "State");
    country = banDoc.info("AccountingDataBase", "Country");

    checkStringLength(companyIdent, 0, 35, false);
    checkStringLength(companyName, 0, 255, false);
    checkStringLength(taxRegistrationCountry, 2, 2, false);
    checkStringLength(taxRegIdent, 0, 30, false);
    checkStringLength(streetname, 0, 100, false);
    checkStringLength(property, 0, 50, false);
    checkStringLength(city, 0, 50, false);
    checkStringLength(postalCode, 0, 10, false);
    checkStringLength(region, 0, 50, false);
    checkStringLength(country, 0, 2, false);

    var companyNode = xml.addElement('company');
    
    var companyIdentNode = companyNode.addElement('companyIdent').addTextNode(companyIdent);
    var companyNameNode = companyNode.addElement('companyName').addTextNode(companyName);
    var taxRegistrationCountryNode = companyNode.addElement('taxRegistrationCountry').addTextNode(taxRegistrationCountry);
    var taxRegIdentNode = companyNode.addElement('taxRegIdent').addTextNode(taxRegIdent);

    var streetAddressNode = companyNode.addElement('streetAddress');
    var streetnameNode = streetAddressNode.addElement('streetname').addTextNode(streetname);
    var numberNode = streetAddressNode.addElement('number').addTextNode(number);
    var numberExtensionNode = streetAddressNode.addElement('numberExtension').addTextNode(numberExtension);
    var propertyNode = streetAddressNode.addElement('property').addTextNode(property);
    var cityNode = streetAddressNode.addElement('city').addTextNode(city);
    var postalCodeNode = streetAddressNode.addElement('postalCode').addTextNode(postalCode);
    var regionNode = streetAddressNode.addElement('region').addTextNode(region);
    var countryNode = streetAddressNode.addElement('country').addTextNode(country);

    var postalAddressNode = companyNode.addElement('postalAddress');
    var streetnameNode = postalAddressNode.addElement('streetname').addTextNode(streetname);
    var numberNode = postalAddressNode.addElement('number').addTextNode(number);
    var numberExtensionNode = postalAddressNode.addElement('numberExtension').addTextNode(numberExtension);
    var propertyNode = postalAddressNode.addElement('property').addTextNode(property);
    var cityNode = postalAddressNode.addElement('city').addTextNode(city);
    var postalCodeNode = postalAddressNode.addElement('postalCode').addTextNode(postalCode);
    var regionNode = postalAddressNode.addElement('region').addTextNode(region);
    var countryNode = postalAddressNode.addElement('country').addTextNode(country);

    return companyNode;
}

/* Function that creates the <customersSuppliers> element of the xml file */
function addCustomersSuppliers(xml, banDoc, startDate, endDate) {

	var customersGroup = banDoc.info('AccountingDataBase','CustomersGroup');
	var suppliersGroup = banDoc.info('AccountingDataBase','SuppliersGroup');
	var mapGroup = {};
	loadMapGroup(banDoc, mapGroup);

	var customersSuppliers = xml.addElement('customersSuppliers');

	//Creates customers element
	if (customersGroup) {
		var customersList = createCustomersList(banDoc, mapGroup, customersGroup);
	}

	//Create suppliers element
	if (suppliersGroup) {
		var suppliersList = createSuppliersList(banDoc, mapGroup, suppliersGroup);
	}

	var customersSuppliersList = customersList.concat(suppliersList);
	createCustomersSuppliers(customersSuppliers, customersSuppliersList);

	return customersSuppliers;
}

/* Function that creates the <generalLedger> element of the xml file */
function addGeneralLedger(xml, banDoc, startDate, endDate) {

	/*
	<generalLedger>
		<ledgerAccount>
			<accID>String</accID>
			<accDesc>String</accDesc>
			<accTp>B</accTp>
			<leadCode>String</leadCode>
			<leadDescription>String</leadDescription>
			<leadReference>String</leadReference>
			<leadCrossRef>String</leadCrossRef>
			<taxonomy>
				<taxoRef>String</taxoRef>
				<entryPoint>
					<entryPointRef>String</entryPointRef>
					<conceptRef>String</conceptRef>
					<domainMember>
						<domainMemberRef>String</domainMemberRef>
					</domainMember>
				</entryPoint>
			</taxonomy>
			<changeInfo>
				<userID>String</userID>
				<changeDateTime>2001-12-17T09:30:47-05:00</changeDateTime>
				<changeDescription>String</changeDescription>
			</changeInfo>
			<glAccountHistory>
				<glAccount>
					<accID>String</accID>
					<accDesc>String</accDesc>
					<accTp>B</accTp>
					<leadCode>String</leadCode>
					<leadDescription>String</leadDescription>
					<leadReference>String</leadReference>
					<leadCrossRef>String</leadCrossRef>
					<changeInfo>
						<userID>String</userID>
						<changeDateTime>2001-12-17T09:30:47-05:00</changeDateTime>
						<changeDescription>String</changeDescription>
					</changeInfo>
				</glAccount>
			</glAccountHistory>
		</ledgerAccount>
		<basics>
			<basic>
				<basicType>02</basicType>
				<basicID>String</basicID>
				<basicDesc>String</basicDesc>
			</basic>
		</basics>
	</generalLedger>
	*/

	var accID = '';
	var accDesc = '';
	var accTp = ''; //B=Balance; M=Mixed; P=Profit and Loss
	var leadCode = ''; // Gr ??
	var leadDescription = ''; //Description ??
	var leadReference = '';
	var leadCrossRef = '';
	var taxoRef = '';
	var entryPointRef = '';
	var conceptRef = '';
	var domainMemberRef = '';
	var userID = '';
	var changeDateTime = '';
	var changeDescription = '';
	var basicType = '';
	var basicID = '';
	var basicDesc = '';

	var generalLedgerNode = xml.addElement('generalLedger');

    //Accounts table
    var accLen = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < accLen; i++) {
		var tRow = banDoc.table('Accounts').row(i);
		
		//Check the first character of the account number
		if (tRow.value('Account') && 
			tRow.value('Account').substring(0,1) !== '.' &&
			tRow.value('Account').substring(0,1) !== ',' && 
			tRow.value('Account').substring(0,1) !== ';' &&
			tRow.value('Account').substring(0,1) !== ':') 
		{

	        accID = tRow.value('Account');
	    	accDesc = tRow.value('Description');
	    	
	    	//accTp
	    	if (tRow.value('BClass') === '1' || tRow.value('BClass') === '2') {
	    		accTp = 'B';
	    	} else if (tRow.value('BClass') === '3' || tRow.value('BClass') === '4') {
	    		accTp = 'P';
	    	} else {
	    		accTp = 'M'; //?
	    	}

	    	/* basicType:
				02	Cost codes / Cost ID
				03	Product codes / Product ID
				04	Project codes / Project ID
				05	Article Group codes / Article Group ID
				12	Journal codes / Journal ID
				14	Quantity codes / Quantity ID
				23	Relationship codes / Relationship ID
				29	Source codes / Source ID
				30	User codes / User ID
			*/

			checkStringLength(accID, 1, 35, false);
			checkStringLength(accDesc, 1, 255, false);
			checkStringLength(accTp, 1, 2, false);
			checkStringLength(leadCode, 0, 999, false);
			checkStringLength(leadDescription, 0, 999, false);
			checkStringLength(leadReference, 0, 999, false);
			checkStringLength(leadCrossRef, 0, 999, false);
			checkStringLength(taxoRef, 0, 9999, false);
			checkStringLength(entryPointRef, 0, 9999, false);
			checkStringLength(conceptRef, 0, 9999, false);
			checkStringLength(domainMemberRef, 0, 9999, false);
			checkStringLength(userID, 0, 35, false);
			checkStringLength(changeDateTime, 0, 24, false);
			checkStringLength(changeDescription, 0, 999, false);
			checkStringLength(basicType, 0, 2, false);
			checkStringLength(basicID, 0, 35, false);
			checkStringLength(basicDesc, 0, 9999, false);

			var ledgerAccountNode = generalLedgerNode.addElement('ledgerAccount');
			var accIDNode = ledgerAccountNode.addElement('accID').addTextNode(accID);
			var accDescNode = ledgerAccountNode.addElement('accDesc').addTextNode(accDesc);
			var accTpNode = ledgerAccountNode.addElement('accTp').addTextNode(accTp);
			var leadCodeNode = ledgerAccountNode.addElement('leadCode').addTextNode(leadCode);
			var leadDescriptionNode = ledgerAccountNode.addElement('leadDescription').addTextNode(leadDescription);
			var leadReferenceNode = ledgerAccountNode.addElement('leadReference').addTextNode(leadReference);
			var leadCrossRefNode = ledgerAccountNode.addElement('leadCrossRef').addTextNode(leadCrossRef);

			// //taxonomy element: we don't know exactly what to insert here. Can we do not use it?
			// var taxonomyNode = ledgerAccountNode.addElement('taxonomy');
			// var taxoRefNode = taxonomyNode.addElement('taxoRef').addTextNode(taxoRef);
			// var entryPointNode = taxonomyNode.addElement('entryPoint');
			// var entryPointRefNode = entryPointNode.addElement('entryPointRef').addTextNode(entryPointRef);
			// var conceptRefNode = entryPointNode.addElement('conceptRef').addTextNode(conceptRef);
			// var domainMemberNode = entryPointNode.addElement('domainMember');
			// var domainMemberRefNode = domainMemberNode.addElement('domainMemberRef').addTextNode(domainMemberRef);

			// //changeInfo element: we don't know exactly what to insert here. Can we do not use it?
			// var changeInfoNode = ledgerAccountNode.addElement('changeInfo');
			// var userIDNode = changeInfoNode.addElement('userID').addTextNode(userID);
			// var changeDateTimeNode = changeInfoNode.addElement('changeDateTime').addTextNode(changeDateTime);
			// var changeDescriptionNode = changeInfoNode.addElement('changeDescription').addTextNode(changeDescription);

			// //glAccountHistory element: we don't know exactly what to insert here. Can we do not use it?
			// var glAccountHistoryNode = ledgerAccountNode.addElement('glAccountHistory');

			// //basics element: we don't know exactly what to insert here. Can we do not use it?
			// var basicsNode = generalLedgerNode.addElement('basics');
			// var basicNode = basicsNode.addElement('basic');
			// var basicTypeNode = basicNode.addElement('basicType').addTextNode(basicType);
			// var basicIDNode = basicNode.addElement('basicID').addTextNode(basicID);
			// var basicDescNode = basicNode.addElement('basicDesc').addTextNode(basicDesc);
		}  
	}

	//Check table Categories to take income/expenses accounts
	if (banDoc.table('Categories')) {
		var catLen = banDoc.table('Categories').rowCount;
		
		for (var i = 0; i < catLen; i++) {
			var tRow = banDoc.table('Categories').row(i);

			//Check the first character of the account number
			if (tRow.value('Category') && 
				tRow.value('Category').substring(0,1) !== '.' &&
				tRow.value('Category').substring(0,1) !== ',' && 
				tRow.value('Category').substring(0,1) !== ';' &&
				tRow.value('Category').substring(0,1) !== ':') 
			{

				accID = tRow.value('Category');
		    	accDesc = tRow.value('Description');
		    	accTp = 'P';
		    	leadCode = tRow.value('Gr');
		    	leadDescription = tRow.value('Description');

		    	/* basicType:
					02	Cost codes / Cost ID
					03	Product codes / Product ID
					04	Project codes / Project ID
					05	Article Group codes / Article Group ID
					12	Journal codes / Journal ID
					14	Quantity codes / Quantity ID
					23	Relationship codes / Relationship ID
					29	Source codes / Source ID
					30	User codes / User ID
				*/
			
				checkStringLength(accID, 1, 35, false);
				checkStringLength(accDesc, 1, 255, false);
				checkStringLength(accTp, 1, 2, false);
				checkStringLength(leadCode, 0, 999, false);
				checkStringLength(leadDescription, 0, 999, false);
				checkStringLength(leadReference, 0, 999, false);
				checkStringLength(leadCrossRef, 0, 999, false);
				checkStringLength(taxoRef, 0, 9999, false);
				checkStringLength(entryPointRef, 0, 9999, false);
				checkStringLength(conceptRef, 0, 9999, false);
				checkStringLength(domainMemberRef, 0, 9999, false);
				checkStringLength(userID, 0, 35, false);
				checkStringLength(changeDateTime, 0, 24, false);
				checkStringLength(changeDescription, 0, 999, false);
				checkStringLength(basicType, 0, 2, false);
				checkStringLength(basicID, 0, 35, false);
				checkStringLength(basicDesc, 0, 9999, false);

				var ledgerAccountNode = generalLedgerNode.addElement('ledgerAccount');
				var accIDNode = ledgerAccountNode.addElement('accID').addTextNode(accID);
				var accDescNode = ledgerAccountNode.addElement('accDesc').addTextNode(accDesc);
				var accTpNode = ledgerAccountNode.addElement('accTp').addTextNode(accTp);
				var leadCodeNode = ledgerAccountNode.addElement('leadCode').addTextNode(leadCode);
				var leadDescriptionNode = ledgerAccountNode.addElement('leadDescription').addTextNode(leadDescription);
				var leadReferenceNode = ledgerAccountNode.addElement('leadReference').addTextNode(leadReference);
				var leadCrossRefNode = ledgerAccountNode.addElement('leadCrossRef').addTextNode(leadCrossRef);

				// //taxonomy element: we don't know exactly what to insert here. Can we do not use it?
				// var taxonomyNode = ledgerAccountNode.addElement('taxonomy');
				// var taxoRefNode = taxonomyNode.addElement('taxoRef').addTextNode(taxoRef);
				// var entryPointNode = taxonomyNode.addElement('entryPoint');
				// var entryPointRefNode = entryPointNode.addElement('entryPointRef').addTextNode(entryPointRef);
				// var conceptRefNode = entryPointNode.addElement('conceptRef').addTextNode(conceptRef);
				// var domainMemberNode = entryPointNode.addElement('domainMember');
				// var domainMemberRefNode = domainMemberNode.addElement('domainMemberRef').addTextNode(domainMemberRef);

				// //changeInfo element: we don't know exactly what to insert here. Can we do not use it?
				// var changeInfoNode = ledgerAccountNode.addElement('changeInfo');
				// var userIDNode = changeInfoNode.addElement('userID').addTextNode(userID);
				// var changeDateTimeNode = changeInfoNode.addElement('changeDateTime').addTextNode(changeDateTime);
				// var changeDescriptionNode = changeInfoNode.addElement('changeDescription').addTextNode(changeDescription);			

				// //glAccountHistory element: we don't know exactly what to insert here. Can we do not use it?
				// var glAccountHistoryNode = ledgerAccountNode.addElement('glAccountHistory');

				// //basics element: we don't know exactly what to insert here. Can we do not use it?
				// var basicsNode = generalLedgerNode.addElement('basics');
				// var basicNode = basicsNode.addElement('basic');
				// var basicTypeNode = basicNode.addElement('basicType').addTextNode(basicType);
				// var basicIDNode = basicNode.addElement('basicID').addTextNode(basicID);
				// var basicDescNode = basicNode.addElement('basicDesc').addTextNode(basicDesc);
			}
		}
	}

	return generalLedgerNode;	
}

/* Function that creates the <vatCodes> element of the xml file */
function addVatCodes(xml, banDoc, startDate, endDate) {

	/*
	<vatCodes>
		<vatCode>
			<vatID>String</vatID>
			<vatDesc>String</vatDesc>
			<vatToPayAccID>String</vatToPayAccID>
			<vatToClaimAccID>String</vatToClaimAccID>
		</vatCode>
	</vatCodes>
	*/

    var vatID = '';
    var vatDesc = '';
    var vatToPayAccID = ''; //Conto creditore in cui è contabilizzata l'IVA da versare
    var vatToClaimAccID = ''; //Conto creditore sul quale è contabilizzata l'IVA da riscuotere

    //If the table VatCodes exists we take the values
    if (banDoc.table("VatCodes")) {

	    //Add vatCodes element to the xml document
		var vatCodesNode = xml.addElement('vatCodes');

	    var vatCodesTable = banDoc.table("VatCodes");
	    for (var i = 0; i < vatCodesTable.rowCount; i++) {
	        var tRow = vatCodesTable.row(i);

	        if (tRow.value("VatCode")) {
		        vatID = tRow.value("VatCode");
		        vatDesc = tRow.value("Description");
		        vatToPayAccID = tRow.value("VatAccount"); //??
		        vatToClaimAccID = tRow.value("VatAccount"); //??

				checkStringLength(vatID, 1, 35, false);
				checkStringLength(vatDesc, 1, 100, false);
				checkStringLength(vatToPayAccID, 0, 35, false);
				checkStringLength(vatToClaimAccID, 0, 35, false);

				var vatCodeNode = vatCodesNode.addElement('vatCode');
				var vatIDNode = vatCodeNode.addElement('vatID').addTextNode(vatID);
				var vatDescNode = vatCodeNode.addElement('vatDesc').addTextNode(vatDesc);
				var vatToPayAccIDNode = vatCodeNode.addElement('vatToPayAccID').addTextNode(vatToPayAccID);
				var vatToClaimAccIDNode = vatCodeNode.addElement('vatToClaimAccID').addTextNode(vatToClaimAccID);

	    	}
	    }
	}

    return vatCodesNode;
}

/* Function that creates the <periods> element of the xml file */
function addPeriods(xml, banDoc, startDate, endDate) {
	/*
	<periods>
		<period>
			<periodNumber>1</periodNumber>
			<periodDesc>String</periodDesc>
			<startDatePeriod>1967-08-13</startDatePeriod>
			<startTimePeriod>14:20:00-05:00</startTimePeriod>
			<endDatePeriod>1967-08-13</endDatePeriod>
			<endTimePeriod>14:20:00-05:00</endTimePeriod>
		</period>
	</periods>
	*/

	var periodNumber = '1'; //??
	var periodDesc = 'van ' + startDate + ' tot ' + endDate;
	var startDatePeriod = startDate;
	var startTimePeriod = '00:00:00'; //00:00:00-00:00
	var endDatePeriod = endDate;
	var endTimePeriod = '23:59:59'; //23:59:59-00:00

	checkStringLength(periodNumber, 1, 3, false);
	checkStringLength(periodDesc, 0, 50, false);
	checkStringLength(startDatePeriod, 1, 16, false);
	checkStringLength(startTimePeriod, 0, 14, false);
	checkStringLength(endDatePeriod, 1, 16, false);
	checkStringLength(endTimePeriod, 0, 14, false);

	var periodsNode = xml.addElement('periods');
	var periodNode = periodsNode.addElement('period');
	var periodNumberNode = periodNode.addElement('periodNumber').addTextNode(periodNumber);
	var periodDescNode = periodNode.addElement('periodDesc').addTextNode(periodDesc);
	var startDatePeriodNode = periodNode.addElement('startDatePeriod').addTextNode(startDatePeriod);
	var startTimePeriodNode = periodNode.addElement('startTimePeriod').addTextNode(startTimePeriod);
	var endDatePeriodNode = periodNode.addElement('endDatePeriod').addTextNode(endDatePeriod);
	var endTimePeriodNode = periodNode.addElement('endTimePeriod').addTextNode(endTimePeriod);

	return periodsNode;
}

/* Function that creates the <openingBalance> element of the xml file */
// WE DON'T USE IT. THIS ELEMENT IS EMPTY.
function addOpeningBalance(xml, banDoc, startDate, endDate) {
	/*
	<openingBalance>
		<opBalDate>1967-08-13</opBalDate>
		<opBalDesc>String</opBalDesc>
		<linesCount>1</linesCount>
		<totalDebit>3.14</totalDebit>
		<totalCredit>3.14</totalCredit>
		<obLine>
			<nr>String</nr>
			<accID>String</accID>
			<amnt>3.14</amnt>
			<amntTp>C</amntTp>
		</obLine>
		<obSubledgers>
			<obSubledger>
				<sbType>CS</sbType>
				<sbDesc>String</sbDesc>
				<linesCount>1</linesCount>
				<totalDebit>3.14</totalDebit>
				<totalCredit>3.14</totalCredit>
				<obSbLine>
					<nr>String</nr>
					<obLineNr>String</obLineNr>
					<desc>String</desc>
					<amnt>3.14</amnt>
					<amntTp>C</amntTp>
					<docRef>String</docRef>
					<recRef>String</recRef>
					<matchKeyID>String</matchKeyID>
					<custSupID>String</custSupID>
					<invRef>String</invRef>
					<invPurSalTp>P</invPurSalTp>
					<invTp>C</invTp>
					<invDt>1967-08-13</invDt>
					<invDueDt>1967-08-13</invDueDt>
					<mutTp>I</mutTp>
					<costID>String</costID>
					<prodID>String</prodID>
					<projID>String</projID>
					<artGrpID>String</artGrpID>
					<qntityID>String</qntityID>
					<qntity>1</qntity>
				</obSbLine>
			</obSubledger>
		</obSubledgers>
	</openingBalance>
	*/

	var opBalDate = '';
	var opBalDesc = '';
	var linesCount = '';
	var totalDebit = '';
	var totalCredit = '';
	var nr = '';
	var accID = '';
	var amnt = '';
	var amntTp = '';
	var sbType = '';
	var sbDesc = '';
	var obLineNr = '';
	var desc = '';
	var docRef = '';
	var recRef = '';
	var matchKeyID = '';
	var custSupID = '';
	var invRef = '';
	var invPurSalTp = '';
	var invTp = '';
	var invDt = '';
	var invDueDt = '';
	var mutTp = '';
	var costID = '';
	var prodID = '';
	var projID = '';
	var artGrpID = '';
	var qntityID = '';
	var qntity = '';

	var openingBalanceNode = xml.addElement('openingBalance');
	var opBalDateNode = openingBalanceNode.addElement('opBalDate').addTextNode(opBalDate);
	var opBalDescNode = openingBalanceNode.addElement('opBalDesc').addTextNode(opBalDesc);
	var linesCountNode = openingBalanceNode.addElement('linesCount').addTextNode(linesCount);
	var totalDebitNode = openingBalanceNode.addElement('totalDebit').addTextNode(totalDebit);
	var totalCreditNode = openingBalanceNode.addElement('totalCredit').addTextNode(totalCredit);
	
	var obLineNode = openingBalanceNode.addElement('obLine');
	var nrNode = obLineNode.addElement('nr').addTextNode(nr);
	var accIDNode = obLineNode.addElement('accID').addTextNode(accID);
	var amntNode = obLineNode.addElement('amnt').addTextNode(amnt);
	var amntTpNode = obLineNode.addElement('amntTp').addTextNode(amntTp);

	var obSubledgersNode = openingBalanceNode.addElement('obSubledgers');
	var obSubledgerNode = obSubledgersNode.addElement('obSubledger');
	var sbTypeNode = obSubledgerNode.addElement('sbType').addTextNode(sbType);
	var sbDescNode = obSubledgerNode.addElement('sbDesc').addTextNode(sbDesc);
	var linesCountNode = obSubledgerNode.addElement('linesCount').addTextNode(linesCount);
	var totalDebitNode = obSubledgerNode.addElement('totalDebit').addTextNode(totalDebit);
	var totalCreditNode = obSubledgerNode.addElement('totalCredit').addTextNode(totalCredit);
	var obSbLineNode = obSubledgerNode.addElement('obSbLine');
	var nrNode = obSbLineNode.addElement('nr').addTextNode(nr);
	var obLineNrNode = obSbLineNode.addElement('obLineNr').addTextNode(obLineNr);
	var descNode = obSbLineNode.addElement('desc').addTextNode(desc);
	var amntNode = obSbLineNode.addElement('amnt').addTextNode(amnt);
	var amntTpNode = obSbLineNode.addElement('amntTp').addTextNode(amntTp);
	var docRefNode = obSbLineNode.addElement('docRef').addTextNode(docRef);
	var recRefNode = obSbLineNode.addElement('recRef').addTextNode(recRef);
	var matchKeyIDNode = obSbLineNode.addElement('matchKeyID').addTextNode(matchKeyID);
	var custSupIDNode = obSbLineNode.addElement('custSupID').addTextNode(custSupID);
	var invRefNode = obSbLineNode.addElement('invRef').addTextNode(invRef);
	var invPurSalTpNode = obSbLineNode.addElement('invPurSalTpinvPurSalTp').addTextNode(invPurSalTp);
	var invTpNode = obSbLineNode.addElement('invTp').addTextNode(invTp);
	var invDtNode = obSbLineNode.addElement('invDt').addTextNode(invDt);
	var invDueDtNode = obSbLineNode.addElement('invDueDt').addTextNode(invDueDt);
	var mutTpNode = obSbLineNode.addElement('mutTpmutTp').addTextNode(mutTp);
	var costIDcostIDNode = obSbLineNode.addElement('costID').addTextNode(costID);
	var prodIDNode = obSbLineNode.addElement('prodID').addTextNode(prodID);
	var projIDNode = obSbLineNode.addElement('projID').addTextNode(projID);
	var artGrpIDNode = obSbLineNode.addElement('artGrpID').addTextNode(artGrpID);
	var qntityIDNode = obSbLineNode.addElement('qntityID').addTextNode(qntityID);
	var qntityNode = obSbLineNode.addElement('qntity').addTextNode(qntity);

	return openingBalanceNode;
}

/* Function that creates the <transactions> element of the xml file */
function addTransactions(xml, banDoc, startDate, endDate) {

	/*
	<linesCount>1</linesCount>
	<totalDebit>3.14</totalDebit>
	<totalCredit>3.14</totalCredit>
	*/

	var linesCount = ''; //numero righe registrazioni
	var totalDebit = ''; //totale debit registrazioni
	var totalCredit = ''; //totale credit registrazioni

	linesCount = getTotalRowsTransactions(banDoc, startDate, endDate);
	totalDebit = getTotalDebitTransactions(banDoc, startDate, endDate);
	totalCredit = getTotalCreditTransactions(banDoc, startDate, endDate);

	checkStringLength(linesCount, 1, 10, false);

	var transactionsNode = xml.addElement('transactions');
	var linesCountNode = transactionsNode.addElement('linesCount').addTextNode(linesCount);
	var totalDebit = transactionsNode.addElement('totalDebit').addTextNode(totalDebit);
	var totalCredit = transactionsNode.addElement('totalCredit').addTextNode(totalCredit);
			
	//Add journal element
	var journal = addJournal(transactionsNode, banDoc, startDate, endDate);

	// DO WE USE IT ???
	//Add subledgers element
	//var subledgers = addSubledgers(transactionsNode, banDoc, startDate, endDate);
	
	return transactionsNode;
}


/********************************
	CUSTOMERS/SUPPLIERS functions
********************************/
/* The function creates an array of group values for the given group */
function loadMapGroup(banDoc, mapGroup) {
	var len = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {
		var tRow = banDoc.table('Accounts').row(i);
		if (tRow.value('Group')) {
			//mapGroup[tRow.value('Group')].parent = tRow.value('Gr');
			mapGroup[tRow.value('Group')] = {'parent' : tRow.value('Gr')}
		}
	}
}

/* Function that checks the belonging of the groups */
function groupBelongToGroup(mapGroup, current, find, start) {

	if (!start) {
		start = current;
	}

	if (!current) {
		return false;
	}

	if (!find) {
		return false;
	}

	if (mapGroup[current].parent === find) {
		return true;
	}

	if (mapGroup[current].parent === start) {
		return false;
	}

	return groupBelongToGroup(mapGroup, mapGroup[current].parent, find, start);
}

/* Function that creates the customers list */
function createCustomersList(banDoc, mapGroup, customersGroup) {
	
	var list = [];

	var len = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {		
		var tRow = banDoc.table('Accounts').row(i);

		if (tRow.value('Gr') === customersGroup || groupBelongToGroup(mapGroup, tRow.value('Gr'), customersGroup)) {

			var customersList = {};

		    if (tRow.value('OrganisationName')) {
		    	var companyName = tRow.value('OrganisationName');
		    } else {
		    	var companyName = '';
		    }

		    if (tRow.value('FirstName') && tRow.value('FamilyName')) {
				var contact = tRow.value('FirstName') + ' ' + tRow.value('FamilyName');
			} else{
				var contact = '';
			}

			customersList.custSupID = tRow.value('Account');
			customersList.custSupName = companyName;
			customersList.contactPerson = contact;
		    customersList.telephone = tRow.value('PhoneMain');
		    customersList.fax = tRow.value('Fax');
		    customersList.eMail = tRow.value('EmailWork');
		    customersList.website = tRow.value('Website');
		    customersList.commerceNr = ''; //Dialog?
		    customersList.taxRegistrationCountry = tRow.value('CountryCode'); //?? Dialog?
		    customersList.taxRegIdent = ''; //Dialog?
		    customersList.relationshipID = tRow.value('VatNumber'); //We take the Vat Number??
		    customersList.custSupTp = 'C'; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
		    customersList.custSupGrpID = '';

			if (tRow.value('CreditLimit')) {
				customersList.custCreditLimit = tRow.value('CreditLimit'); //??? importo limite del debitore
			}
			
			// //supplierLimit element: we don't know exactly what to insert here. Can we do not use it?
			// customersList.supplierLimit = ''; //??? importo limite del creditore

		    customersList.streetname = tRow.value('Street');
		    customersList.number = '';
		    customersList.numberExtension = '';
	        customersList.property = '';
	        customersList.city = tRow.value('Locality');
	        customersList.postalCode = tRow.value('PostalCode');
	        customersList.region = tRow.value('Region');
	        customersList.country = tRow.value('CountryCode');
	        
	        if (tRow.value('BankIban')) {
				customersList.bankAccNr = tRow.value('BankIban'); //Bank account number
				customersList.bankIdCd = '';
			}

			// //changeInfo element: we don't know exactly what to insert here. Can we do not use it?			
			// customersList.userID = userID;
			// customersList.changeDateTime = changeDateTime;
			// customersList.changeDescription = changeDescription;
			
			list.push(customersList);
		}
	}

	return list;
}

/* Function that creates the suppliers list */
function createSuppliersList(banDoc, mapGroup, suppliersGroup) {

	var list = [];
	
	var len = banDoc.table('Accounts').rowCount;
	for (var i = 0; i < len; i++) {
		var tRow = banDoc.table('Accounts').row(i);
		
		if (tRow.value('Gr') === suppliersGroup || groupBelongToGroup(mapGroup, tRow.value('Gr'), suppliersGroup)) {
		    
			var suppliersList = {};

		    if (tRow.value('OrganisationName')) {
		    	var companyName = tRow.value('OrganisationName');
		    } else {
		    	var companyName = '';
		    }

		    if (tRow.value('FirstName') && tRow.value('FamilyName')) {
				var contact = tRow.value('FirstName') + ' ' + tRow.value('FamilyName');
			} else{
				var contact = '';
			}

			suppliersList.custSupID = tRow.value('Account');
			suppliersList.custSupName = companyName;
			suppliersList.contactPerson = contact;
		    suppliersList.telephone = tRow.value('PhoneMain');
		    suppliersList.fax = tRow.value('Fax');
		    suppliersList.eMail = tRow.value('EmailWork');
		    suppliersList.website = tRow.value('Website');
		    suppliersList.commerceNr = ''; //Dialog?
		    suppliersList.taxRegistrationCountry = tRow.value('CountryCode'); //?? Dialog?
		    suppliersList.taxRegIdent = ''; //Dialog?
		    suppliersList.relationshipID = tRow.value('VatNumber'); //We take the Vat Number??
		    suppliersList.custSupTp = 'S'; //C (customer), S (supplier), B (both customer and supplier), O (Other, no customer or supplier)
		    suppliersList.custSupGrpID = '';

			if (tRow.value('CreditLimit')) {
				suppliersList.custCreditLimit = tRow.value('CreditLimit'); //??? importo limite del debitore
			}
			
			// //supplierLimit element: we don't know exactly what to insert here. Can we do not use it?
			// suppliersList.supplierLimit = ''; //??? importo limite del creditore

		    suppliersList.streetname = tRow.value('Street');
		    suppliersList.number = '';
		    suppliersList.numberExtension = '';
	        suppliersList.property = '';
	        suppliersList.city = tRow.value('Locality');
	        suppliersList.postalCode = tRow.value('PostalCode');
	        suppliersList.region = tRow.value('Region');
	        suppliersList.country = tRow.value('CountryCode');
	        
	        if (tRow.value('BankIban')) {
				suppliersList.bankAccNr = tRow.value('BankIban'); //Bank account number
				suppliersList.bankIdCd = '';
			}

			// //changeInfo element: we don't know exactly what to insert here. Can we do not use it?			
			// suppliersList.userID = userID;
			// suppliersList.changeDateTime = changeDateTime;
			// suppliersList.changeDescription = changeDescription;
		
			list.push(suppliersList);
		}
	}	
	return list;
}

/* Function thata crates all the customerSupplier elements */
function createCustomersSuppliers(xml, customersSuppliersList) {
	/*
	<customersSuppliers>
		<customerSupplier>
			<custSupID>Debiteur123</custSupID>
			<custSupName>VoorbeeldDebiteur</custSupName>
			<contact>Contactpersoon</contact>
			<telephone>+31 88 888111888</telephone>
			<fax>+31 88 88822888</fax>
			<eMail>info@voobeelden.info</eMail>
			<website>http://www.voorbeelden.info</website>
			<commerceNr>String</commerceNr>
			<taxRegistrationCountry>AD</taxRegistrationCountry>
			<taxRegIdent>String</taxRegIdent>
			<relationshipID>String</relationshipID>
			<custSupTp>B</custSupTp>
			<custSupGrpID>String</custSupGrpID>
			<custCreditLimit>3.14</custCreditLimit>
			<supplierLimit>3.14</supplierLimit>
			<streetAddress>
				<streetname>String</streetname>
				<number>String</number>
				<numberExtension>String</numberExtension>
				<property>String</property>
				<city>String</city>
				<postalCode>String</postalCode>
				<region>String</region>
				<country>AD</country>
			</streetAddress>
			<postalAddress>
				<streetname>String</streetname>
				<number>String</number>
				<numberExtension>String</numberExtension>
				<property>String</property>
				<city>String</city>
				<postalCode>String</postalCode>
				<region>String</region>
				<country>AD</country>
			</postalAddress>
			<bankAccount>
				<bankAccNr>String</bankAccNr>
				<bankIdCd>String</bankIdCd>
			</bankAccount>
			<changeInfo>
				<userID>String</userID>
				<changeDateTime>2001-12-17T09:30:47-05:00</changeDateTime>
				<changeDescription>String</changeDescription>
			</changeInfo>
			<customerSupplierHistory/>
		</customerSupplier>
	</customersSuppliers>
	*/
	var customerSupplierNode;
	
	for (var i = 0; i < customersSuppliersList.length; i++) {

		// Banana.document.addMessage(JSON.stringify(customersSuppliersList[i], "", ""));

		checkStringLength(customersSuppliersList[i].custSupID, 1, 35, false);
		checkStringLength(customersSuppliersList[i].custSupName, 0, 50, false);
		checkStringLength(customersSuppliersList[i].contactPerson, 0, 50, false);
		checkStringLength(customersSuppliersList[i].telephone, 0, 30 ,false);
		checkStringLength(customersSuppliersList[i].fax, 0, 30, false);
		checkStringLength(customersSuppliersList[i].eMail, 0, 255, false);
		checkStringLength(customersSuppliersList[i].website, 0, 255, false);
		checkStringLength(customersSuppliersList[i].commerceNr, 0, 100, false);
		checkStringLength(customersSuppliersList[i].taxRegistrationCountry, 0, 2, false);
		checkStringLength(customersSuppliersList[i].taxRegIdent, 0, 30, false);
		checkStringLength(customersSuppliersList[i].relationshipID, 0, 35, false);
		checkStringLength(customersSuppliersList[i].custSupTp, 0, 1, false);
		checkStringLength(customersSuppliersList[i].custSupGrpID, 0, 35, false);
		checkStringLength(customersSuppliersList[i].streetname, 0, 100, false);
		checkStringLength(customersSuppliersList[i].property, 0, 50, false);
		checkStringLength(customersSuppliersList[i].city, 0, 50, false);
		checkStringLength(customersSuppliersList[i].postalCode, 0, 10, false);
		checkStringLength(customersSuppliersList[i].region, 0, 50, false);
		checkStringLength(customersSuppliersList[i].country, 0, 2, false);

        customerSupplierNode = xml.addElement('customerSupplier');
		
		var custSupIDNode = customerSupplierNode.addElement('custSupID').addTextNode(customersSuppliersList[i].custSupID);
		var custSupNameNode = customerSupplierNode.addElement('custSupName').addTextNode(customersSuppliersList[i].custSupName);
		var contactNode = customerSupplierNode.addElement('contact').addTextNode(customersSuppliersList[i].contactPerson);
		var telephoneNode = customerSupplierNode.addElement('telephone').addTextNode(customersSuppliersList[i].telephone);
		var faxNode = customerSupplierNode.addElement('fax').addTextNode(customersSuppliersList[i].fax);
		var eMailNode = customerSupplierNode.addElement('eMail').addTextNode(customersSuppliersList[i].eMail);
		var websiteNode = customerSupplierNode.addElement('website').addTextNode(customersSuppliersList[i].website);
		var commerceNrNode = customerSupplierNode.addElement('commerceNr').addTextNode(customersSuppliersList[i].commerceNr);
		var taxRegistrationCountryNode = customerSupplierNode.addElement('taxRegistrationCountry').addTextNode(customersSuppliersList[i].taxRegistrationCountry);
		var taxRegIdentNode = customerSupplierNode.addElement('taxRegIdent').addTextNode(customersSuppliersList[i].taxRegIdent);
		var relationshipIDNode = customerSupplierNode.addElement('relationshipID').addTextNode(customersSuppliersList[i].relationshipID);
		var custSupTpNode = customerSupplierNode.addElement('custSupTp').addTextNode(customersSuppliersList[i].custSupTp);
		var custSupGrpIDNode = customerSupplierNode.addElement('custSupGrpID').addTextNode(customersSuppliersList[i].custSupGrpID);
		
		if (customersSuppliersList[i].custCreditLimit) {
        	checkStringLength(customersSuppliersList[i].custCreditLimit, 0, 20, false);
			var custCreditLimitNode = customerSupplierNode.addElement('custCreditLimit').addTextNode(customersSuppliersList[i].custCreditLimit);
		}

		// //supplierLimit element: we don't know exactly what to insert here. Can we do not use it?
		// checkStringLength(customersSuppliersList[i].supplierLimit, 0, 20, false);
		// var supplierLimitNode = customerSupplierNode.addElement('supplierLimit').addTextNode(customersSuppliersList[i].supplierLimit);

		var streedAddressNode = customerSupplierNode.addElement('streetAddress');
		var addressNode = streedAddressNode.addElement('streetname').addTextNode(customersSuppliersList[i].streetname);
		var numberNode = streedAddressNode.addElement('number').addTextNode(customersSuppliersList[i].number);
		var numberExtensionNode = streedAddressNode.addElement('numberExtension').addTextNode(customersSuppliersList[i].numberExtension);
		var propertyNode = streedAddressNode.addElement('property').addTextNode(customersSuppliersList[i].property);
		var cityNode = streedAddressNode.addElement('city').addTextNode(customersSuppliersList[i].city);
		var postalCodeNode = streedAddressNode.addElement('postalCode').addTextNode(customersSuppliersList[i].postalCode);
		var regionNode = streedAddressNode.addElement('region').addTextNode(customersSuppliersList[i].region);
		var countryNode = streedAddressNode.addElement('country').addTextNode(customersSuppliersList[i].country);

		var postalAddressNode = customerSupplierNode.addElement('postalAddress');
		var addressNode = postalAddressNode.addElement('streetname').addTextNode(customersSuppliersList[i].streetname);
		var numberNode = postalAddressNode.addElement('number').addTextNode(customersSuppliersList[i].number);
		var numberExtensionNode = postalAddressNode.addElement('numberExtension').addTextNode(customersSuppliersList[i].numberExtension);
		var propertyNode = postalAddressNode.addElement('property').addTextNode(customersSuppliersList[i].property);
		var cityNode = postalAddressNode.addElement('city').addTextNode(customersSuppliersList[i].city);
		var postalCodeNode = postalAddressNode.addElement('postalCode').addTextNode(customersSuppliersList[i].postalCode);
		var regionNode = postalAddressNode.addElement('region').addTextNode(customersSuppliersList[i].region);
		var countryNode = postalAddressNode.addElement('country').addTextNode(customersSuppliersList[i].country);

		if (customersSuppliersList[i].bankAccNr) {
			checkStringLength(customersSuppliersList[i].bankAccNr, 1, 35, false);
	    	checkStringLength(customersSuppliersList[i].bankIdCd, 0, 35, false);
	    	checkStringLength(customersSuppliersList[i].bankIdCd, 0, 999, false);
			var bankAccountNode = customerSupplierNode.addElement('bankAccount');
			var bankAccNrNode = bankAccountNode.addElement('bankAccNr').addTextNode(customersSuppliersList[i].bankAccNr);
			var bankIdCdNode = bankAccountNode.addElement('bankIdCd').addTextNode(customersSuppliersList[i].bankIdCd);
		}

		// //changeInfo element: we don't know exactly what to insert here. Can we do not use it?	
		// var changeInfoNode = customerSupplierNode.addElement('changeInfo');
		// var userIDNode = changeInfoNode.addElement('userID').addTextNode(customersSuppliersList[i].userID);
		// var changeDateTimeNode = changeInfoNode.addElement('changeDateTime').addTextNode(customersSuppliersList[i].changeDateTime);
		// var changeDescriptionNode = changeInfoNode.addElement('changeDescription').addTextNode(customersSuppliersList[i].changeDescription);

		// //customerSupplierHistory element: we don't know exactly what to insert here. Can we do not use it?
		// var customerSupplierHistoryNode = customerSupplierNode.addElement('customerSupplierHistory');
	}

	return customerSupplierNode;
}






/************************* 
	TRANSACTIONS functions
*************************/
/* Function that gets the total rows used for the transactions */
function getTotalRowsTransactions(banDoc, startDate, endDate) {
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var len = journal.rowCount;
	var rows = 0;
	var tmpGroup;
	var newTransaction = 'unknown';

	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//Transactions between the defined period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {
			
			//The row doesn't belongs to any previous transaction
			//In this case we have to create a new transaction with all the lines belonging to it
			if (tmpGroup != tRow.value('JContraAccountGroup')) {

				
				//If the current JContraAccountGroup is different from the previous, then begins a new transaction
				newTransaction = 'true';
							
				//Increase the transaction's counter every time a there is a new <transaction> element
				rows++;

				//Everytime there is a new transaction, we save the new JContraAccountGroup value.
				//We will use it to determine if the next row belongs to the same transaction or not.
				tmpGroup = tRow.value('JContraAccountGroup');
			}

			//The row belongs to the same (previous) transaction
			else if (tmpGroup == tRow.value('JContraAccountGroup')) {
				//We set the value of the variable to false, to indicate that the transaction <element> could be created:
				//this only if the JContraAccountGroup value of the next row is different from the current one
				newTransaction = 'false';
			}
		}
	}
	return rows;
}

/* Function that retrieves the total debit amount of the transactions */
function getTotalDebitTransactions(banDoc, startDate, endDate) {
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var len = journal.rowCount;
	var totDebit ='';

	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//Transactions between the defined period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {
			
            // Debit
            if (Banana.SDecimal.sign(tRow.value('JAmount')) > 0 ) {
                totDebit = Banana.SDecimal.add(totDebit, tRow.value('JDebitAmount'), {'decimals':2});
            }
		}
	}

	//var totDebit = banDoc.table("Totals").findRowByValue("Group","3").value("Balance");
	return totDebit;
}

/* Function that retrieves the total credit amount of the transactions */
function getTotalCreditTransactions(banDoc, startDate, endDate) {
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var len = journal.rowCount;
	var totCredit = '';

	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//Transactions between the defined period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {
			
            // Credit
            if (Banana.SDecimal.sign(tRow.value('JAmount')) < 0 ) {
                totCredit = Banana.SDecimal.add(totCredit, tRow.value('JCreditAmount'), {'decimals':2});
            }
		}
	}

	//var totCredit = banDoc.table("Totals").findRowByValue("Group","4").value("Balance");
	return totCredit;
}

/* Function that creates the journal xml element */
function addJournal(transactionsNode, banDoc, startDate, endDate) {
	/*
	<journal>
		<jrnID>String</jrnID>
		<desc>String</desc>
		<jrnTp>B</jrnTp>
		<offsetAccID>String</offsetAccID>
		<bankAccNr>String</bankAccNr>
		<transaction>
			<nr>String</nr>
			<desc>String</desc>
			<periodNumber>1</periodNumber>
			<trDt>1967-08-13</trDt>
			<amnt>3.14</amnt>
			<amntTp>C</amntTp>
			<sourceID>String</sourceID>
			<userID>String</userID>
			<trLine>
				<nr>String</nr>
				<accID>String</accID>
				<docRef>String</docRef>
				<effDate>1967-08-13</effDate>
				<desc>String</desc>
				<amnt>3.14</amnt>
				<amntTp>C</amntTp>
				<recRef>String</recRef>
				<matchKeyID>String</matchKeyID>
				<custSupID>String</custSupID>
				<invRef>String</invRef>
				<orderRef>String</orderRef>
				<receivingDocRef>String</receivingDocRef>
				<shipDocRef>String</shipDocRef>
				<costID>String</costID>
				<prodID>String</prodID>
				<projID>String</projID>
				<artGrpID>String</artGrpID>
				<workCostArrRef>String</workCostArrRef>
				<qntityID>String</qntityID>
				<qntity>1</qntity>
				<bankAccNr>String</bankAccNr>
				<bankIdCd>String</bankIdCd>
				<vat>
					<vatID>String</vatID>
					<vatPerc>0</vatPerc>
					<vatAmnt>3.1</vatAmnt>
					<vatAmntTp>C</vatAmntTp>
				</vat>
				<currency>
					<curCode>AED</curCode>
					<curAmnt>3.14</curAmnt>
				</currency>
			</trLine>
		</transaction>
	</journal>
	*/

	var jrnID = '1';
	var desc = 'Journal 1';
	var jrnTp = 'Z';  //????
	//jrnTp: B=Bank; C=Cash; G=Goods (received/sent); M=Memo/Daybook; O=Opening Balance; P=Purchases; S=Sales; T=Production; Y=Payroll; Z=Other
	var offsetAccID = ''; //String
	var bankAccNr = ''; //String

	checkStringLength(jrnID, 1, 35, false);
	checkStringLength(desc, 1, 9999, false);
	checkStringLength(jrnTp, 0, 2, false);
	checkStringLength(offsetAccID, 0, 35, false);
	checkStringLength(bankAccNr, 0, 35, false);


	/* Create journal element */
	var journalNode = transactionsNode.addElement('journal');
	var jrnIDNode = journalNode.addElement('jrnID').addTextNode(jrnID);
	var descNode = journalNode.addElement('desc').addTextNode(desc);
	var jrnTpNode = journalNode.addElement('jrnTp').addTextNode(jrnTp);
	var offsetAccIDNode = journalNode.addElement('offsetAccID').addTextNode(offsetAccID);
	var bankAccNrNode = journalNode.addElement('bankAccNr').addTextNode(bankAccNr);

	/* Create transaction element */
	var journal = banDoc.journal(banDoc.ORIGINTYPE_CURRENT, banDoc.ACCOUNTTYPE_NORMAL);
	var transactionNode = '';
	var trLineNode = '';
	var tmpTransactionGroup = '';
	var len = journal.rowCount;
	var transactionCreated = false;

	//Read each row of the table
	for (var i = 0; i < len; i++) {
		var tRow = journal.row(i);

		//From the journal we take only transactions rows between the period
		if (tRow.value('JOperationType') == banDoc.OPERATIONTYPE_TRANSACTION && tRow.value('JDate') >= startDate && tRow.value('JDate') <= endDate) {

			//The row doesn't belongs to any previous transaction
			//In this case we have to create a new transaction with all the lines belonging to it
			if (tmpTransactionGroup !== tRow.value('JContraAccountGroup')) {

				//transaction element has not been created yet, so we create it
				if (!transactionCreated) {

					var nr = ''; //string => JRowOrigin? Doc?
					var desc = ''; //string
					var periodNumber = ''; //number
					var trDt = ''; //transaction date
					var amnt = ''; //transaction amount: JAmount??
					var amntTp = ''; //transaction amount type (debit / credit)
					var sourceID = ''; // string
					var userID = ''; //string

					//Get values
					nr = tRow.value('JRowOrigin');
					desc = tRow.value('JDescription');
					periodNumber = '1'; //??
					trDt = tRow.value('JDate');
					amnt = tRow.value('JAmount');
					if (Banana.SDecimal.sign(amnt) > 0) {
						amntTp = 'D'; //debit
					} else if (Banana.SDecimal.sign(amnt) < 0) {
						amntTp = 'C'; //credit
					}
					sourceID = ''; //This kind of information doesn't exists in Banana, so we let a blank space
					userID = '';  //This kind of information doesn't exists in Banana, so we let a blank space

					checkStringLength(nr, 1, 35, false);
					checkStringLength(desc, 0, 9999, false);
					checkStringLength(periodNumber, 1, 3, false);
					checkStringLength(trDt, 1, 16, false);
					checkStringLength(amntTp, 0, 1, false);
					checkStringLength(sourceID, 0, 35, false);
					checkStringLength(userID, 0, 35, false);

					transactionNode = journalNode.addElement('transaction');
					var nrNode = transactionNode.addElement('nr').addTextNode(nr);
					var descNode = transactionNode.addElement('desc').addTextNode(desc);
					var periodNumberNode = transactionNode.addElement('periodNumber').addTextNode(periodNumber); 
					var trDtNode = transactionNode.addElement('trDt').addTextNode(trDt);
					var amntNode = transactionNode.addElement('amnt').addTextNode(amnt); 
					var amntTpNode = transactionNode.addElement('amntTp').addTextNode(amntTp);
					var sourceIDNode = transactionNode.addElement('sourceID').addTextNode(sourceID);
					var userIDNode = transactionNode.addElement('userID').addTextNode(userID);

					//Reset value of the lines text
					trLineNode = '';

					//transaction element now has been created
					transactionCreated = true;
				}

				//Everytime there is a new transaction, we save the new JContraAccountGroup value.
				//We will use it to determine if the next row belongs to the same transaction or not.
				tmpTransactionGroup = tRow.value('JContraAccountGroup');
			}

			//The row belongs to the same (previous) transaction
			else if (tmpTransactionGroup === tRow.value('JContraAccountGroup')) {
				//We set the value of the variable to false, to indicate that the transaction <element> could be created:
				//this only if the JContraAccountGroup value of the next row is different from the current one
				transactionCreated = false;
			}

			//In every case, independently from the 'If...Else Statements', for each transactions rows we create the <trLine> element
			trLineNode = createTransactionLine(tRow, transactionNode, banDoc, startDate, endDate);
		}
	}

	//return the journal element
	return journalNode;
}

/* Function that creates the trLine xml element */
function createTransactionLine(tRow, transactionNode, banDoc, startDate, endDate) {
	
	/*
	<trLine>
		<nr>String</nr>
		<accID>String</accID>
		<docRef>String</docRef>
		<effDate>1967-08-13</effDate>
		<desc>String</desc>
		<amnt>3.14</amnt>
		<amntTp>C</amntTp>
		<recRef>String</recRef>
		<matchKeyID>String</matchKeyID>
		<custSupID>String</custSupID>
		<invRef>String</invRef>
		<orderRef>String</orderRef>
		<receivingDocRef>String</receivingDocRef>
		<shipDocRef>String</shipDocRef>
		<costID>String</costID>
		<prodID>String</prodID>
		<projID>String</projID>
		<artGrpID>String</artGrpID>
		<workCostArrRef>String</workCostArrRef>
		<qntityID>String</qntityID>
		<qntity>1</qntity>
		<bankAccNr>String</bankAccNr>
		<bankIdCd>String</bankIdCd>
		<vat>
			<vatID>String</vatID>
			<vatPerc>0</vatPerc>
			<vatAmnt>3.1</vatAmnt>
			<vatAmntTp>C</vatAmntTp>
		</vat>
		<currency>
			<curCode>AED</curCode>
			<curAmnt>3.14</curAmnt>
		</currency>
	</trLine>
	*/

	var nr = tRow.value('JRowOrigin'); //string
	var accID = tRow.value('JAccount'); //string
	var docRef = tRow.value('Doc'); //string
	var effDate = tRow.value('JDate'); //We use the date of the transaction
	var desc = tRow.value('JAccountDescription'); //string
	var amnt = ''; //amount
	var amntTp = ''; //string
	var recRef = ''; //string
	var matchKeyID = ''; //string
	var custSupID = ''; //string
	var invRef = tRow.value('DocInvoice'); //string
	var orderRef = ''; //string
	var receivingDocRef = ''; //string
	var shipDocRef = ''; //string
	var costID = ''; //string
	var prodID = ''; //string
	var projID = ''; //string
	var artGrpID = ''; //string
	var workCostArrRef = ''; //string
	var qntityID = ''; //string
	var qntity = ''; //number => tRow.value('Quantity')?
	var bankAccNr = ''; //string
	var bankIdCd = ''; //string
	var vatID = ''; //string
	var vatPerc = ''; //number
	var vatAmnt = ''; //amount
	var vatAmntTp = ''; //string
	var curCode = ''; //string
	var curAmnt = ''; //amount

 	//Get values trLine element
 	if (tRow.value('Cc1')) {
 		costID = tRow.value('Cc1');
 	} else if (tRow.value('Cc2')) {
		costID = tRow.value('Cc2');
 	} else if (tRow.value('Cc3')) {
		costID = tRow.value('Cc3');
 	}

 	amnt = tRow.value('JAmount');
    if (Banana.SDecimal.sign(amnt) > 0) {
		amntTp = 'D';
    } else if (Banana.SDecimal.sign(amnt) < 0) {
    	amntTp = 'C';
    }

    // Quantity ???
    if (tRow.value('Quantity')) {
    	qntity = tRow.value('Quantity');
    }

    //Get values vat element
    if (tRow.value('VatCode')) {

	    vatID = tRow.value('VatCode');

		if (tRow.value('VatRate')) {
			vatPerc = Banana.SDecimal.abs(tRow.value('VatRate')); //positive value (type xsd: Decimal8)
		} else {
			vatPerc = '0.00'; //vatPerc must be a double: if the value does not exists we have to set to 0.00
		}

		if (tRow.value('VatPosted')) {
			vatAmnt = tRow.value('VatPosted');
		} else {
			vatAmnt = '0.00'; //vatAmnt must be a decimal: if the value does not exists we have to set to 0.00
		}

		//vatAmntTp must be D/C (debit/credit): if the vatAmnt is 0, we set the value of vatAmntTp to D (debit)
		if (Banana.SDecimal.sign(vatAmnt) >= 0) {
			vatAmntTp = 'D'; //debit
		} else if (Banana.SDecimal.sign(vatAmnt) < 0) {
			vatAmntTp = 'C'; //credit
		}
	}

	// //currency element not in basic currency: Can we do not use it?
	// curCode = tRow.value('JTransactionCurrency');
	// curAmnt = tRow.value('JAmountTransactionCurrency');
	

	//If the transaction line has an Amount, then we retrieve the data
	if (amnt) {

		checkStringLength(nr, 1, 35, false);
		checkStringLength(accID, 1, 35, false);
		checkStringLength(docRef, 1, 255, false);
		checkStringLength(effDate, 10, 16, false);
		checkStringLength(desc, 0, 9999, false);
		checkStringLength(amnt, 0, 20, false);
		checkStringLength(amntTp, 0, 1, false);
		checkStringLength(recRef, 0, 255, false);
		checkStringLength(matchKeyID, 0, 35, false);
		checkStringLength(custSupID, 0, 35, false);
		checkStringLength(invRef, 0, 255, false);
		checkStringLength(orderRef, 0, 255, false);
		checkStringLength(receivingDocRef, 0, 255, false);
		checkStringLength(shipDocRef, 0, 255, false);
		checkStringLength(costID, 0 , 35, false);
		checkStringLength(prodID, 0, 35, false);
		checkStringLength(projID, 0, 35, false);
		checkStringLength(artGrpID, 0, 35, false);
		checkStringLength(workCostArrRef, 0, 255, false);
		checkStringLength(qntityID, 0, 35, false);
		checkStringLength(bankAccNr, 0, 35, false);
		checkStringLength(bankIdCd, 0, 35, false);
		checkStringLength(vatID, 0, 35, false);
		checkStringLength(vatPerc, 0, 8, false);
		checkStringLength(vatAmnt, 0, 20, false);
		checkStringLength(vatAmntTp, 0, 1, false);
		checkStringLength(curCode, 0, 3, false);
		checkStringLength(curAmnt, 0, 20, false);

		var trLineNode = transactionNode.addElement('trLine');
		
		var nrNode = trLineNode.addElement('nr').addTextNode(nr);
		var accIDNode = trLineNode.addElement('accID').addTextNode(accID);
		var docRefNode = trLineNode.addElement('docRef').addTextNode(docRef);
		var effDateNode = trLineNode.addElement('effDate').addTextNode(effDate);
		var descNode = trLineNode.addElement('desc').addTextNode(desc);
		var amntNode = trLineNode.addElement('amnt').addTextNode(amnt);
		var amntTpNode = trLineNode.addElement('amntTp').addTextNode(amntTp);
		var recRefNode = trLineNode.addElement('recRef').addTextNode(recRef);
		var matchKeyIDNode = trLineNode.addElement('matchKeyID').addTextNode(matchKeyID);
		var custSupIDNode = trLineNode.addElement('custSupID').addTextNode(custSupID);
		var invRefNode = trLineNode.addElement('invRef').addTextNode(invRef);
		var orderRefNode = trLineNode.addElement('orderRef').addTextNode(orderRef);
		var receivingDocRefNode = trLineNode.addElement('receivingDocRef').addTextNode(receivingDocRef);
		var shipDocRefNode = trLineNode.addElement('shipDocRef').addTextNode(shipDocRef);
		var costIDNode = trLineNode.addElement('costID').addTextNode(costID);
		var prodIDNode = trLineNode.addElement('prodID').addTextNode(prodID);
		var projIDNode = trLineNode.addElement('projID').addTextNode(projID);
		var artGrpIDNode = trLineNode.addElement('artGrpID').addTextNode(artGrpID);
		var workCostArrRefNode = trLineNode.addElement('workCostArrRef').addTextNode(workCostArrRef);
		var qntityIDNode = trLineNode.addElement('qntityID').addTextNode(qntityID);
		
		if (qntity) {
			checkStringLength(qntity, 0, 10, false);
			var qntityNode = trLineNode.addElement('qntity').addTextNode(qntity);
		}

		var bankAccNrNode = trLineNode.addElement('bankAccNr').addTextNode(bankAccNr);
		var bankIdCdNode = trLineNode.addElement('bankIdCd').addTextNode(bankIdCd);

		//vat element only if there is a vat code (vatID) on the transaction
		if (vatID) {
			var vatNode = trLineNode.addElement('vat');
			var vatIDNode = vatNode.addElement('vatID').addTextNode(vatID);
			var vatPercNode = vatNode.addElement('vatPerc').addTextNode(vatPerc);
			var vatAmntNode = vatNode.addElement('vatAmnt').addTextNode(vatAmnt);
			var vatAmntTpNode = vatNode.addElement('vatAmntTp').addTextNode(vatAmntTp);
		}

		// //currency element when not in basic currency: we don't know exactly what to insert here. Can we do not use it?
		// var currencyNode = trLineNode.addElement('currency');
		// var curCodeNode = currencyNode.addElement('curCode').addTextNode(curCode);
		// var curAmntNode = currencyNode.addElement('curAmnt').addTextNode(curAmnt);

	}
	
	//return trLine element
	return trLineNode;
}

// DO WE USE IT ???
function addSubledgers(transactionsNode, banDoc, startDate, endDate) {

	/*
	<subledgers>
		<subledger>
			<sbType>CS</sbType>
			<sbDesc>String</sbDesc>
			<linesCount>1</linesCount>
			<totalDebit>3.14</totalDebit>
			<totalCredit>3.14</totalCredit>
			<sbLine>
				...
			</sbLine>
		</subledger>
	</subledgers>
	*/

	var sbType = '';
	var sbDesc = '';
	var linesCount = '';
	var totalDebit = '';
	var totalCredit = '';

	//Check functions here...


	var subledgersNode = transactionsNode.addElement('subledgers');
	var subledgerNode = subledgersNode.addElement('subledger');

	var sbTypeNode = subledgerNode.addElement('sbType').addTextNode(sbType);
	var sbDescNode = subledgerNode.addElement('sbDesc').addTextNode(sbDesc);
	var linesCountNode = subledgerNode.addElement('linesCount').addTextNode(linesCount);
	var totalDebitNode = subledgerNode.addElement('totalDebit').addTextNode(totalDebit);
	var totalCreditNode = subledgerNode.addElement('totalCredit').addTextNode(totalCredit);


	//Add <sbLine> elements here....
	//createSubledgerLine(tRow, transactionNode, banDoc, startDate, endDate);


	//return subledgers element
	return subledgersNode;
}

// DO WE USE IT ???
function createSubledgerLine(tRow, transactionNode, banDoc, startDate, endDate) {

	/*
	<sbLine>
		<nr>String</nr>
		<jrnID>String</jrnID>
		<trNr>String</trNr>
		<trLineNr>String</trLineNr>
		<desc>String</desc>
		<amnt>3.14</amnt>
		<amntTp>C</amntTp>
		<docRef>String</docRef>
		<recRef>String</recRef>
		<matchKeyID>String</matchKeyID>
		<custSupID>String</custSupID>
		<invRef>String</invRef>
		<invPurSalTp>P</invPurSalTp>
		<invTp>C</invTp>
		<invDt>1967-08-13</invDt>
		<invDueDt>1967-08-13</invDueDt>
		<mutTp>I</mutTp>
		<costID>String</costID>
		<prodID>String</prodID>
		<projID>String</projID>
		<artGrpID>String</artGrpID>
		<qntityID>String</qntityID>
		<qntity>1</qntity>
		<vat>
			<vatID>String</vatID>
			<vatPerc>0</vatPerc>
			<vatAmnt>3.14</vatAmnt>
			<vatAmntTp>C</vatAmntTp>
		</vat>
		<currency>
			<curCode>AED</curCode>
			<curAmnt>3.14</curAmnt>
		</currency>
	</sbLine>
	*/


	var nr = '';
	var jrnID = '';
	var trNr = '';
	var trLineNr = '';
	var desc = '';
	var amnt = '';
	var amntTp = '';
	var docRef = '';
	var recRef = '';
	var matchKeyID = '';
	var custSupID = '';
	var invRef = '';
	var invPurSalTp = '';
	var invTp = '';
	var invDt = '';
	var invDueDt = '';
	var mutTp = '';
	var costID = '';
	var prodID = '';
	var projID = '';
	var artGrpID = '';
	var qntityID = '';
	var qntity = '';
	var vatID = '';
	var vatPerc = '';
	var vatAmnt = '';
	var vatAmntTp = '';
	var curCode = '';
	var curAmnt = '';

	var sbLineNode = transactionNode.addElement('sbLine');
	var nrNode = sbLineNode.addElement('nr').addTextNode(nr);
	var jrnIDNode = sbLineNode.addElement('jrnID').addTextNode(jrnID);
	var trNrNode = sbLineNode.addElement('trNr').addTextNode(trNr);
	var trLineNrNode = sbLineNode.addElement('trLineNr').addTextNode(trLineNr);
	var descNode = sbLineNode.addElement('desc').addTextNode(desc);
	var amntNode = sbLineNode.addElement('amnt').addTextNode(amnt);
	var amntTpNode = sbLineNode.addElement('amntTp').addTextNode(amntTp);
	var docRefNode = sbLineNode.addElement('docRef').addTextNode(docRef);
	var recRefNode = sbLineNode.addElement('recRef').addTextNode(recRef);
	var matchKeyIDNode = sbLineNode.addElement('matchKeyID').addTextNode(matchKeyID);
	var custSupIDNode = sbLineNode.addElement('custSupID').addTextNode(custSupID);
	var invRefNode = sbLineNode.addElement('invRef').addTextNode(invRef);
	var invPurSalTpNode = sbLineNode.addElement('invPurSalTp').addTextNode(invPurSalTp);
	var invTpNode = sbLineNode.addElement('invTp').addTextNode(invTp);
	var invDtNode = sbLineNode.addElement('invDt').addTextNode(invDt);
	var invDueDt = sbLineNode.addElement('invDueDt').addTextNode(invDueDt);
	var mutTpNode = sbLineNode.addElement('mutTp').addTextNode(mutTp);
	var costIDNode = sbLineNode.addElement('costID').addTextNode(costID);
	var prodIDNode = sbLineNode.addElement('prodID').addTextNode(prodID);
	var projIDNode = sbLineNode.addElement('projID').addTextNode(projID);
	var artGrpIDNode = sbLineNode.addElement('artGrpID').addTextNode(artGrpID);
	var qntityIDNode = sbLineNode.addElement('qntityID').addTextNode(qntityID);
	var qntityNode = sbLineNode.addElement('qntity').addTextNode(qntity);

	var vatNode = sbLineNode.addElement('vat');
	var vatIDNode = vatNode.addElement('vatID').addTextNode(vatID);
	var vatPercNode = vatNode.addElement('vatPerc').addTextNode(vatPerc);
	var vatAmntNode = vatNode.addElement('vatAmnt').addTextNode(vatAmnt);
	var vatAmntTpNode = vatNode.addElement('vatAmntTp').addTextNode(vatAmntTp);

	var currencyNode = sbLineNode.addElement('currency');
	var curCodeNode = currencyNode.addElement('curCode').addTextNode(curCode);
	var curAmntNode = currencyNode.addElement('curAmnt').addTextNode(curAmnt);

	// . . . minOccurs=0 => potrei lasciare via tutto
}


/************************* 
	OTHER functions
*************************/
/* This function allows to check the length of an xml elment value.
   If the value is too long or too short, the script execution is stopped and the xml document is not created. */
function checkStringLength(value, minLength, maxLength, isTest) {
   	if (value.length > maxLength) {
	    ERROR_STRING_MAX_LENGTH = true;
	    if (!isTest) {
	    	Banana.document.addMessage('ERROR_STRING_MAX_LENGTH');
	    }
	}
	if (value.length < minLength) {
		ERROR_STRING_MIN_LENGTH = true;
	    if (!isTest) {
	    	Banana.document.addMessage('ERROR_STRING_MIN_LENGTH');
	    }
	}
}

/* Create the name of the xml file using startDate and endDate (ex. "auditfile_nl_20180101_20180131.xml") */
function createFileName() {
    
    var fileName = "auditfile_nl_";
    var currentDateString = "";
    var startDate = "";
    var yearStartDate = "";
    var monthStartDate = "";
    var dayStartDate = "";
    var endDate = "";
    var yearEndDate = "";
    var monthEndDate = "";
    var dayEndDate = "";

    //Start date string
    startDate = Banana.Converter.toDate(param.startDate.match(/\d/g).join(""));
    yearStartDate = startDate.getFullYear().toString();
    monthStartDate = (startDate.getMonth()+1).toString();
    if (monthStartDate.length < 2) {
        monthStartDate = "0"+monthStartDate;
    }
    dayStartDate = startDate.getDate().toString();
    if (dayStartDate.length < 2) {
        dayStartDate = "0"+dayStartDate;
    }

    //End date string
    endDate = Banana.Converter.toDate(param.endDate.match(/\d/g).join(""));
    yearEndDate = endDate.getFullYear().toString();
    monthEndDate = (endDate.getMonth()+1).toString();
    if (monthEndDate.length < 2) {
        monthEndDate = "0"+monthEndDate;
    }
    dayEndDate = endDate.getDate().toString();
    if (dayEndDate.length < 2) {
        dayEndDate = "0"+dayEndDate;
    }

    //Final date string
    currentDateString = yearStartDate+monthStartDate+dayStartDate+"_"+yearEndDate+monthEndDate+dayEndDate; 
    
    //Return the xml file name
    fileName += currentDateString;
    return fileName;
}

/* Save the xml file */
function saveData(output) {

    var fileName = createFileName();
    fileName = Banana.IO.getSaveFileName("Save as", fileName, "XML file (*.xml);;All files (*)");

    if (fileName.length) {
        var file = Banana.IO.getLocalFile(fileName);
        file.codecName = "UTF-8";
        file.write(output);
        if (file.errorString) {
            Banana.Ui.showInformation("Write error", file.errorString);
        }
        else {
            Banana.IO.openUrl(fileName);
        }
    }
}

/* Get previously saved settings */
function getScriptSettings() {
   var data = Banana.document.getScriptSettings();
   //Check if there are previously saved settings and read them
   if (data.length > 0) {
       try {
           var readSettings = JSON.parse(data);
           //We check if "readSettings" is not null, then we fill the formeters with the values just read
           if (readSettings) {
               return readSettings;
           }
       } catch (e) {
       }
   }

   return {
      "selectionStartDate": "",
      "selectionEndDate": "",
      "selectionChecked": "false"
   }
}

/* The main purpose of this function is to allow the user to enter the accounting period desired and saving it for the next time the script is run
   Every time the user runs of the script he has the possibility to change the date of the accounting period */
function settingsDialog() {
    
    //The formeters of the period that we need
    var scriptform = getScriptSettings();
    
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
        return null;
    }
    return scriptform;
}

