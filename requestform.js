'use strict';
//------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------- ON WINDOW LOAD  -----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', ready);

//  get data
const url = 'https://jsonplaceholder.typicode.com/todos/1';

function ready() {
    fetch(url)
        .then(res => res.json())
        .then(res => JSON.stringify(res))
        .then(res => localStorage.setItem('declarant', res))
        .catch(error => console.error('Error:', error));
}

let formData = localStorage.getItem('declarant');
let urlCard = '/Servuces/CartService.asmx/GetRequestApplicationData';

// select option data
let urlObj = {
    'data-districts': '/Services/CartService.asmx/GetRegions', // Район - Земельна ділянка
    'data-categories': '/Services/CartService.asmx/GetLandCategories', // Категорія земель - Земельна ділянка
    'data-cv': '/Services/CartService.asmx/GetCV', // Цільове з класифікатору - Земельна ділянка
    'data-doctype-1': '/Services/CartService.asmx/GetCodocTypes?dcId=1', // Тип - Суб'єкти(Фізична)
    'data-doctype-2': '/Services/CartService.asmx/GetCodocTypes?dcId=2', // Тип документа - Суб'єкти(Юдична)
    'data-doctype-4': '/Services/CartService.asmx/GetCodocTypes?dcId=4', // Тип - Речові права
    'data-doctype-7': '/Services/CartService.asmx/GetCodocTypes?dcId=7', // Тип - Оренда
    'data-ownership': '/Services/CartService.asmx/GetClassifier?clId=1', // Вид права - Земельна ділянка
};

async function* getDataTypes() {
    for (let [key, value] of Object.entries(urlObj)) {
        let response = await fetcher(value);
        let json = await response.json();

        yield {
            key,
            value: json
        };
    }
}

async function initDataTypes(callback) {
    for await (const obj of getDataTypes()) {
        let nameSession = sessionStorage[obj.key];

        if (!nameSession) {
            sessionStorage[obj.key] = JSON.stringify(obj.value);
        }
    }

    callback();
}
//------------------------------------------------------------------------------------------------------------------------------------------
const isRequired = true;
let isReadonly = false; // all fields are readonly
const isChecked = true;
let formWasChanged = false;
const regDex = '/\d[0-9]]+,/';

//------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------- MODAL ----------------------------------------------------------------------
const modal = document.querySelector("#modal-card");
const modalOverlay = document.querySelector("#modal-card-overlay");
const closeButton = document.querySelector("#modal-card-close");

const modalConfirm = document.querySelector("#modal-confirm");
const modalConfirmOverlay = document.querySelector("#modal-confirm-overlay");
const modalConfirmCloseButton = document.querySelector('#modal-confirm-close');
const modalConfirmYes = document.querySelector('#modal-confirm-yes');
const modalConfirmNo = document.querySelector('#modal-confirm-no');

const form = document.querySelector('.form');
form.addEventListener('submit', submitForm);

modalOverlay.addEventListener('click', showDialogModal);
closeButton.addEventListener('click', showDialogModal);

function escCloseModal(e) {
    if (e.key === "Escape") {
        showDialogModal();
    }
}

function enterCloseConfirmModal(e) {
    if (e.key === "Enter") {
        closeModals();
    }
}

modalConfirmCloseButton.addEventListener('click', closeConfirmModal);
modalConfirmNo.addEventListener('click', closeConfirmModal);
modalConfirmOverlay.addEventListener('click', closeConfirmModal);
modalConfirmYes.addEventListener('click', closeModals);

createDialog(modal, 'confirm');
createDialog(modal, 'alert');
// createAlert(modal);

// default incoming data
let incomingData = {
    "readOnly": false,
    "typeId": null,
    "number": null,
    "registrationDate": null,
    "state": 1,
    "hasRent": false,
    "objects": [{
        "info": {
            "id": null,
            "cad_number_value": null,
            "zone": null,
            "section": null,
            "number": null,
            "district": null,
            "address": null,
            "address_optional": null,
            "category": null,
            "assignment_old": null,
            "assignment": null,
            "area": null,
            "dzk_series": null,
            "dzk_number": null,
            "dzk_date": null,
            "drrp_series": null,
            "drrp_number": null,
            "drrp_date": null,
            "ownership": null,
            "rent_term": null
        },
        "subjects": [],
        "propertyRights": [],
        "rent": {
            "id": null,
            "rent_type": null,
            "cost": null,
            "cost_condition": null,
            "number": null,
            "number_old": null,
            "subject": null,
            "date": null,
            "date_old": null,
            "created": null,
            "from_date": null,
            "to_date": null,
            "month": null
        }
    }]
}


function showModal() {
    ShowLoader(false, false);
    document.addEventListener("keydown", escCloseModal);
    initDataTypes(function () {

        modal.classList.toggle('active');
        modalOverlay.classList.toggle('active');

        fetcher('/Services/CartService.asmx/GetRequestApplicationData')
            .then(res => res.json())
            .then(res => {
                incomingData["hasRent"] = res.hasRent;
                incomingData["readOnly"] = res.readOnly;
                const buttonDownloadXML = createInputFile('download-xml', 'Завантажити із XML');
                if (!incomingData["readOnly"]) form.append(buttonDownloadXML);
                if (res.objects.length) {
                    setIncomingData(res);
                } else setIncomingData(incomingData);
                HideLoader();
            });
    });
}

function showDialogModal() {
    if (formWasChanged) {
        modalConfirm.classList.add('active');
        modalConfirmOverlay.classList.add('active');

        document.addEventListener("keydown", enterCloseConfirmModal);
    } else closeModals();
}

function closeConfirmModal() {
    modalConfirm.classList.remove('active');
    modalConfirmOverlay.classList.remove('active');

    document.removeEventListener("keydown", enterCloseConfirmModal);
}

function closeModals() {
    modalConfirm.classList.remove('active');
    modalConfirmOverlay.classList.remove('active');
    modal.classList.toggle('active');
    modalOverlay.classList.toggle('active');

    formWasChanged = false;
    resetForm();
    document.removeEventListener("keydown", escCloseModal);
    document.removeEventListener("keydown", enterCloseConfirmModal);
}

function resetForm() {
    const form = document.querySelector('.form');
    form.innerHTML = '';
};

function setIncomingData(data) {
    console.log('incoming data', data);
    let hasCardRent = data["hasRent"];
    let isReadonly = data["readOnly"];

    data["objects"].forEach(fieldData => {
        addFieldBlockContainer(fieldData, hasCardRent, isReadonly);
    });
}
//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------- TABS -----------------------------------------------------------------------
function createTab(dataFieldIndex, dataTab, num, text, isActive = false) {
    const tab = createElem('li', ['tab']);
    tab.setAttribute('data-field-index', dataFieldIndex);
    tab.setAttribute('data-tab', dataTab);

    if (isActive) {
        tab.classList.add('active-tab');
    }

    tab.innerHTML = `
        <button data-field-index="${dataFieldIndex}" data-tab="${dataTab}" type="button" class="button">${num}</button>
        <p class="paragraph">${text}</p>
    `;

    tab.addEventListener('click', handleTabButton);


    return tab;
}

function createTabs(dataFieldIndex = 1, hasCardRent) {
    const tabsList = createElem('ul', ['tabs']);
    tabsList.setAttribute('data-field-index', dataFieldIndex);

    const firstTab = createTab(dataFieldIndex, 1, 1, 'Земельна ділянка', true);
    const secondTab = createTab(dataFieldIndex, 2, 2, "Суб'єкти");
    const thirdTab = createTab(dataFieldIndex, 3, 3, 'Речові права');
    const fourthTab = createTab(dataFieldIndex, 4, 4, 'Оренда');

    // field index (Земельна ділянка №)
    firstTab.setAttribute('data-field-index', dataFieldIndex);
    secondTab.setAttribute('data-field-index', dataFieldIndex);
    thirdTab.setAttribute('data-field-index', dataFieldIndex);
    fourthTab.setAttribute('data-field-index', dataFieldIndex);

    if (hasCardRent === 'true' || hasCardRent === true) tabsList.append(firstTab, secondTab, thirdTab, fourthTab);
    else tabsList.append(firstTab, secondTab, thirdTab);

    return tabsList;
};

function handleTabButton(e) {
    e.preventDefault();
    const targetIndexField = e.target.getAttribute('data-field-index');
    const targetIndexTab = e.target.getAttribute('data-tab');
    changeTabContent(targetIndexField, targetIndexTab);
    changeActiveTab(targetIndexField, targetIndexTab);
}

function changeTabContent(targetIndexField, targetIndex) {
    const formContent = Array.from(document.querySelectorAll('.tab-content'));
    const filteredFormContent = formContent.filter(el => el.getAttribute('data-field-index') == targetIndexField);

    // choose active tab by field-index && tab-index
    filteredFormContent.forEach(el => {
        el.classList.remove('active-tab');
        if (targetIndex == el.getAttribute('data-tab')) el.classList.add('active-tab');
    })
}

function changeActiveTab(targetIndexField, targetIndex) {
    const tabButtons = Array.from(document.querySelectorAll('.tab button'));

    const filteredTabButtons = tabButtons.filter(el => el.getAttribute('data-field-index') == targetIndexField);
    filteredTabButtons.forEach(el => {
        el.parentNode.classList.remove('active-tab');
        if (targetIndex == el.getAttribute('data-tab')) el.parentNode.classList.add('active-tab');
    });
}
//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------- NAV BUTTONS -------------------------------------------------------------------
function createButtonFieldShow(index) {
    const button = createElem('button', ['field-show', 'button'], `Земельна ділянка #${index}`, index);
    button.setAttribute('data-field-index', index);
    button.setAttribute('type', 'button');
    return button;
}

function handleButtonNext(e) {
    const elem = e.target;

    const index = Number(elem.getAttribute('data-tab')) + 1;
    const targetIndexField = elem.getAttribute('data-field-index');

    changeTabContent(targetIndexField, index);
    changeActiveTab(targetIndexField, index);
}

function handleButtonBack(e) {
    const elem = e.target;

    const index = Number(elem.getAttribute("data-tab")) - 1;
    const targetIndexField = elem.getAttribute('data-field-index');

    changeTabContent(targetIndexField, index);
    changeActiveTab(targetIndexField, index);
}

function createButtonsNavBlock(dataFieldIndex, tabIndex, hasCardRent = false, isReadonly = false) {
    const formButtonsNavBlock = createElem('div', ['form__buttons-nav']);

    const formButtonsNavBlockLeft = createElem('div', ['form__buttons-nav--left']);
    const formButtonsNavBlockRight = createElem('div', ['form__buttons-nav--right']);

    const buttonBack = createNavButton('nav-button--blue', '&larr; Назад', dataFieldIndex, tabIndex);
    const buttonNext = createNavButton('nav-button--blue', 'Далі &rarr;', dataFieldIndex, tabIndex);
    const buttonSubmit = createNavButton('nav-button--blue', 'Відправити', dataFieldIndex, tabIndex);
    const buttonAddField = createNavButton('nav-button--green', 'Додати нову ділянку', dataFieldIndex, tabIndex);
    const buttonCopyField = createNavButton('nav-button--green', 'Копіювати ділянку', dataFieldIndex, tabIndex);

    buttonBack.setAttribute('data-field-index', dataFieldIndex);
    buttonBack.setAttribute('data-tab', tabIndex);
    buttonNext.setAttribute('data-field-index', dataFieldIndex);
    buttonNext.setAttribute('data-tab', tabIndex);

    buttonSubmit.type = 'submit';

    buttonBack.addEventListener('click', handleButtonBack);
    buttonNext.addEventListener('click', handleButtonNext);
    buttonAddField.addEventListener('click', handleAddFieldBlockContainer);
    buttonCopyField.addEventListener('click', copyFieldBlockContainer);

    if (tabIndex == 1) formButtonsNavBlockRight.append(buttonNext);
    if (tabIndex == 2) {
        formButtonsNavBlockLeft.append(buttonBack);
        formButtonsNavBlockRight.append(buttonNext);
    }
    if (tabIndex == 3) {
        if (typeof hasCardRent === "boolean") {
            if (hasCardRent === false) {
                formButtonsNavBlockLeft.append(buttonBack);
                if (!isReadonly) formButtonsNavBlockRight.append(buttonCopyField, buttonAddField, buttonSubmit);
            } else {
                formButtonsNavBlockLeft.append(buttonBack);
                formButtonsNavBlockRight.append(buttonNext);
            }
        } else if (typeof hasCardRent === "string") {
            if (hasCardRent === 'false') {
                formButtonsNavBlockLeft.append(buttonBack);
                if (!isReadonly) formButtonsNavBlockRight.append(buttonCopyField, buttonAddField, buttonSubmit);
            } else {
                formButtonsNavBlockLeft.append(buttonBack);
                formButtonsNavBlockRight.append(buttonNext);
            }
        }

    }
    if (tabIndex == 4) {
        formButtonsNavBlockLeft.append(buttonBack);
        formButtonsNavBlockRight.append(buttonCopyField, buttonAddField, buttonSubmit);
    }

    formButtonsNavBlock.append(formButtonsNavBlockLeft, formButtonsNavBlockRight);
    return formButtonsNavBlock;
}
//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------- LAND FIELD BLOCK -----------------------------------------------------------------
function handleAddFieldBlockContainer() {
    const data = {
        "info": {
            "id": null,
            "cad_number_value": null,
            "zone": null,
            "section": null,
            "number": null,
            "district": null,
            "address": null,
            "address_optional": null,
            "category": null,
            "assignment_old": null,
            "assignment": null,
            "area": null,
            "dzk_series": null,
            "dzk_number": null,
            "dzk_date": null,
            "drrp_series": null,
            "drrp_number": null,
            "drrp_date": null,
            "ownership": null,
            "rent_term": null
        },
        "subjects": [],
        "propertyRights": [],
        "rent": {
            "id": null,
            "type": null,
            "cost": null,
            "cost_condition": null,
            "number": null,
            "number_old": null,
            "subject": null,
            "date": null,
            "date_old": null,
            "created": null,
            "from_date": null,
            "to_date": null,
            "month": null
        }
    };

    addFieldBlockContainer(data);
}

function addFieldBlockContainer(data, hasCardRent, isReadonly = false) {
    console.log('/////..........data', data);

    const arrFieldBlockContainer = document.querySelectorAll('.form__land-block-container');

    const lastFieldBlockContainer = arrFieldBlockContainer[arrFieldBlockContainer.length - 1];
    if (lastFieldBlockContainer) hasCardRent = lastFieldBlockContainer.getAttribute('data-rent'); // if last block has rent


    const landFieldBlockContainer = createElem('div', ['form__land-block-container']);

    let dataFieldIndex = 1;

    if (!lastFieldBlockContainer) {
        dataFieldIndex = 1;
    } else if (arrFieldBlockContainer.length > 0) {
        const lastIndex = Number.parseInt(lastFieldBlockContainer.getAttribute('data-field-index'));
        dataFieldIndex = lastIndex + 1;
        if (!hasCardRent) hasCardRent = lastFieldBlockContainer.getAttribute('data-rent');
    }

    landFieldBlockContainer.setAttribute('data-rent', hasCardRent);

    landFieldBlockContainer.setAttribute('data-field-index', dataFieldIndex);

    // button close
    const buttonClose = createButtonClose('btn-close--field', removeParentElement);

    // button show
    const buttonFieldShow = createButtonFieldShow(dataFieldIndex);
    buttonFieldShow.addEventListener('click', showFieldBlock);

    // content    
    const landFieldBlock = createFieldBlock(data, dataFieldIndex, hasCardRent, isReadonly);

    if (dataFieldIndex > 1 && !isReadonly) landFieldBlockContainer.insertAdjacentElement('afterbegin', buttonClose);
    landFieldBlockContainer.append(buttonFieldShow, landFieldBlock);

    form.append(landFieldBlockContainer);
    if (dataFieldIndex > 1) window.scrollTo({
        top: 500000,
        left: 0,
        behavior: 'smooth'
    });

    changeCadNum(); // show cadastral number on input change

    checkIsFormChanged();
}

function copyFieldBlockContainer(e) {
    // todo: fiiiiiix these makaroni, please
    console.log('eeetttooo button', e.target.parentNode.parentNode.parentNode.parentNode.parentNode);
    const field = e.target.parentNode.parentNode.parentNode.parentNode.parentNode;
    const data = getData(field, true);

    console.log('a eto ta samaya data', data);
    let hasCardRent = data["hasRent"];
    let isReadonly = data["readOnly"];

    data["objects"].forEach(fieldData => {
        addFieldBlockContainer(fieldData, hasCardRent, isReadonly);
    });
}

function showFieldBlock(e) {
    e.preventDefault();
    const landFieldBlock = e.target.nextSibling;
    landFieldBlock.classList.toggle('active');
}

function createFieldBlock(data = {}, dataFieldIndex = 1, hasCardRent, isReadonly = false) {
    const dataInfo = data.info; // first tab data (Земельна ділянка)
    const dataSubjects = data.subjects; // second tab data (Суб'єкти)
    const dataRights = data.propertyRights; // third tab data (Речові права)
    const dataRent = data.rent; // fourth tab data (Оренда)

    const landFieldBlock = createElem('div', ['form__land-block', 'active']);
    landFieldBlock.setAttribute('data-field-index', dataFieldIndex);

    // tabs list 
    const tabsList = createTabs(dataFieldIndex, hasCardRent);

    // tabs content 
    const firstTabContent = createFirstTabContent(dataInfo, dataFieldIndex, hasCardRent, isReadonly); // first tab content (Земельна ділянка)
    const secondTabContent = createSecondTabContent(dataSubjects, dataFieldIndex, hasCardRent, isReadonly); // second tab content (Суб'єкти)
    const thirdTabContent = createThirdTabContent(dataRights, dataFieldIndex, hasCardRent, isReadonly); // third tab content (Речові права)

    if (hasCardRent) {
        const fourthTabContent = createFourthTabContent(dataRent, dataFieldIndex, hasCardRent, isReadonly); // fourth tab content (Оренда)
        landFieldBlock.append(tabsList, firstTabContent, secondTabContent, thirdTabContent, fourthTabContent);
    } else landFieldBlock.append(tabsList, firstTabContent, secondTabContent, thirdTabContent);

    return landFieldBlock;
}
//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------- PAGES ----------------------------------------------------------------------
function createFirstTabContent(data = {}, idField = 1, hasCardRent = false, isReadonly = false) {
    let index = 1;
    const tabIndex = 1;
    const tabContent = createElem('div', ['tab-content', 'active-tab']);
    const formContent = createElem('ul', ['form__content']);

    tabContent.setAttribute('data-tab', tabIndex);
    tabContent.setAttribute('data-field-index', idField);

    let numRadioLabel, codeRadioLabel, cadNumberParagraphText;

    if (data['cad_number_value'] == 1) {
        numRadioLabel = createRadioLabel('Кадастровий Номер', 'num', `cad_number_value-${idField}`, 'data-cad-num', idField, index, isChecked, isReadonly);
        codeRadioLabel = createRadioLabel('Обліковий Код', 'code', `cad_number_value-${idField}`, 'data-cad-num', idField, index, false, isReadonly);
        cadNumberParagraphText = 'Кадастровий Номер:';
    } else {
        numRadioLabel = createRadioLabel('Кадастровий Номер', 'num', `cad_number_value-${idField}`, 'data-cad-num', idField, index, false, isReadonly);
        codeRadioLabel = createRadioLabel('Обліковий Код', 'code', `cad_number_value-${idField}`, 'data-cad-num', idField, index, isChecked, isReadonly);
        cadNumberParagraphText = 'Обліковий Код:';
    }

    numRadioLabel.addEventListener('click', changeCadastralNum);
    codeRadioLabel.addEventListener('click', changeCadastralNum);

    const cadastralNum = createElem('p', ['paragraph', 'cadastral-num', 'form__field'], '8000000000:');
    cadastralNum.setAttribute('data-field-index', idField);

    // hidden input 
    const idInput = createHiddenInput(`info-id-${idField}`, data["id"]);

    // select (options) data
    const optionsDisrict = JSON.parse(sessionStorage['data-districts']); // select options data (Район - Земельна ділянка)
    const optionsCategories = JSON.parse(sessionStorage['data-categories']); // select options data (Категорія земель - Земельна ділянка)
    const optionsOwnership = JSON.parse(sessionStorage['data-ownership']); // select options data (Вид права - Земельна ділянка)
    const optionsCV = JSON.parse(sessionStorage['data-cv']); // select options data (Цільове з класифікатору - Земельна ділянка)

    // second row (show cadastrel number)
    const cadNumField = createElem('p', ['form__field', 'cad-num-field'], '', null, idField);
    const cadNumCad = createElem('span', ['span-cad'], '8000000000', null, idField);
    const cadNumZone = createElem('span', ['span-cad'], data["zone"], null, idField);
    const cadNumSection = createElem('span', ['span-cad'], data["section"], null, idField);
    const cadNumNum = createElem('span', ['span-cad'], data["number"], null, idField);

    if (Number(data['cad_number_value']) !== 1) {
        cadNumCad.classList.add('invisible');
        cadastralNum.classList.add('invisible');
    }

    const cadNumberParagraph = createElem('p', ['form__field', 'cad-num-text'], cadNumberParagraphText, null, idField);

    cadNumZone.setAttribute('data-event', 'get-zone');
    cadNumSection.setAttribute('data-event', 'get-section');
    cadNumNum.setAttribute('data-event', 'get-num');

    if (Number(data['cad_number_value']) === 1) cadNumField.append(cadNumCad, ':', cadNumZone, ':', cadNumSection, ':', cadNumNum);
    else cadNumField.append(cadNumCad, '', cadNumZone, ':', cadNumSection, ':', cadNumNum);

    // select (ownership) 
    const ownership = createSelect(`ownership-${idField}`, optionsOwnership, 'Вид права', isReadonly, data['ownership']);
    ownership.setAttribute('data-field-index', idField);
    ownership.addEventListener('input', changeSelectOwnership);

    // Строк оренди (visible / invisible)
    const rentTermInput = createTextInput(`rent_term-${idField}`, 'Строк оренди', isReadonly, data['rent_term']);
    if (Number(data['ownership']) !== 2) rentTermInput.classList.add('invisible');
    rentTermInput.setAttribute('data-field-index', idField);




    const firstRow = createFormRow('li', [
        createRadioField(
            [numRadioLabel, codeRadioLabel],
            '', // todo: fix
            isRequired
        ),
        cadastralNum, // 8000000000:
        createInputOnChange(`zone-${idField}`, 'Зона', 'get-zone', idField, isReadonly, data["zone"], 2, true),
        createInputOnChange(`section-${idField}`, 'Квартал', 'get-section', idField, isReadonly, data["section"], 3, true),
        createInputOnChange(`number-${idField}`, 'Номер', 'get-num', idField, isReadonly, data["number"], 4, false)
    ]);

    const secondRow = createFormRow('li', [
        cadNumberParagraph,
        cadNumField
    ]);

    const thirdRow = createFormRow('li', [
        createSelect(`district-${idField}`, optionsDisrict, 'Район', isReadonly, data['district']),
        createTextInput(`address-${idField}`, 'Адреса', isReadonly, data['address'])
    ]);

    const fourthRow = createFormRow('li', [
        createTextInput(`address_optional-${idField}`, 'Довільна адреса (опціонально)', isReadonly, data['address_optional'])
    ]);

    const fifthRow = createFormRow('li', [
        createSelect(`category-${idField}`, optionsCategories, 'Категорія земель', isReadonly, data['category']),
        ownership, // Вид права
        rentTermInput // Строк оренди
    ]);

    const sixthRow = createFormRow('li', [
        createTextInput(`assignment_old-${idField}`, 'Вид використання', isReadonly, data['assignment_old']),
        createSelect(`assignment-${idField}`, optionsCV, 'Цільове з класифікатору', isReadonly, data['assignment']),
        createTextInput(`area-${idField}`, 'Площа', isReadonly, data['area'], /^-?\d*[,.]?\d*$/)
    ]);

    const seventhRow = createFormRow('li', [
        createDisabledInput(`dzk-${idField}`, 'Витяг з ДЗК'),
        createTextInput(`dzk_series-${idField}`, 'Серія', isReadonly, data['dzk_series']),
        createTextInput(`dzk_number-${idField}`, 'Номер', isReadonly, data['dzk_number']),
        createDateInput(`dzk_date-${idField}`, 'Дата видачі', isReadonly, data['dzk_date']),
    ]);

    const eighthRow = createFormRow('li', [
        createDisabledInput(`drrp-${idField}`, 'Витяг з ДРРП'),
        createTextInput(`drrp_series-${idField}`, 'Серія', isReadonly, data['drrp_series']),
        createTextInput(`drrp_number-${idField}`, 'Номер', isReadonly, data['drrp_number']),
        createDateInput(`drrp_date-${idField}`, 'Дата видачі', isReadonly, data['drrp_date']),
    ]);

    const buttonsNavBlock = createButtonsNavBlock(idField, tabIndex, hasCardRent);

    formContent.append(firstRow, secondRow, thirdRow, fourthRow, fifthRow, sixthRow, seventhRow, eighthRow, idInput);
    tabContent.append(formContent, buttonsNavBlock);

    return tabContent;
}

function createSecondTabContent(data = [], idField, hasCardRent = false, isReadonly = false) {
    let index = 1;
    const tabIndex = 2;
    const tabContent = createElem('div', ['tab-content']);
    const subjectPage = createElem('div', ['form__content', 'subjects-page', 'form__block'], '', '1');
    subjectPage.setAttribute('data-field-index', idField);

    const buttonAddSubject = createButtonAdd(['add-subject', 'btn-add'], "Додати суб'єкт +", idField);

    const buttonAddBlock = createFormRow('div', [
        // createButtonAdd(['add-subject', 'btn-add'], "Додати суб'єкт +", idField)
        buttonAddSubject
    ]);
    const buttonsNavBlock = createButtonsNavBlock(idField, tabIndex, hasCardRent);
    tabContent.setAttribute('data-tab', '2');
    tabContent.setAttribute('data-field-index', idField);
    buttonAddSubject.addEventListener('click', handleAddSubject);

    if (isReadonly) tabContent.append(subjectPage, buttonsNavBlock);
    else tabContent.append(subjectPage, buttonAddBlock, buttonsNavBlock);

    if (data.length === 0) addSubject(data, idField, index, isReadonly, subjectPage);
    else data.forEach((dataEl, index) => {
        index++;
        addSubject(dataEl, idField, index, isReadonly, subjectPage)
    });

    return tabContent;
}

function createThirdTabContent(data = [], idField = 1, hasCardRent = false, isReadonly = false) {
    const tabIndex = 3;
    let index = 1;

    const tabContent = createElem('div', ['tab-content']);
    const rightsPage = createElem('div', ['form__content', 'rights-page', 'form__block'], '', '2');

    const buttonAddRights = createButtonAdd(['add-rights-btn', 'btn-add'], 'Додати речове право +', idField);

    const buttonAddBlock = createFormRow('div', [buttonAddRights]);
    const buttonsNavBlock = createButtonsNavBlock(idField, tabIndex, hasCardRent, isReadonly);

    buttonAddBlock.setAttribute('data-field-index', idField);

    tabContent.setAttribute('data-tab', '3');
    tabContent.setAttribute('data-field-index', idField);
    buttonAddRights.addEventListener('click', handleAddRights);

    if (isReadonly) tabContent.append(rightsPage, buttonsNavBlock);
    else tabContent.append(rightsPage, buttonAddBlock, buttonsNavBlock);

    if (data.length === 0) addRights(data, idField, index, isReadonly, rightsPage);
    else data.forEach((dataEl, index) => {
        index++;
        addRights(dataEl, idField, index, isReadonly, rightsPage)
    });

    return tabContent;
}

function createFourthTabContent(data = {}, idField = 1, hasCardRent = false, isReadonly = false) {
    const tabIndex = 4;

    if (!data) {
        data = {
            "id": null,
            "rent_type": null,
            "cost": null,
            "cost_condition": null,
            "number": null,
            "number_old": null,
            "subject": null,
            "date": null,
            "date_old": null,
            "created": null,
            "from_date": null,
            "to_date": null,
            "month": null
        };
    }

    // hidden input 
    const idInput = createHiddenInput(`rent-id-${idField}`, data["id"]);

    const tabContent = createElem('div', ['tab-content']);
    const formContent = createElem('ul', ['form__content']);

    tabContent.setAttribute('data-tab', '4');
    tabContent.setAttribute('data-field-index', idField);

    const optionsDoctype7 = JSON.parse(sessionStorage['data-doctype-7']); // select options data (Тип - Оренда)

    const fromDateInput = createDateInput(`from_date-${idField}`, 'З', isReadonly, data['from_date']);
    const toDateInput = createDateInput(`to_date-${idField}`, 'По', isReadonly, data['to_date']);
    const monthInput = createTextInput(`month-${idField}`, 'Місяців', true, data['month']);

    fromDateInput.setAttribute('data-field-index', idField);
    toDateInput.setAttribute('data-field-index', idField);
    monthInput.setAttribute('data-field-index', idField);

    console.log('-.-.-..- fromDateInput', fromDateInput);
    // fromDateInput.addEventListener('input', changeInputMonthValue);
    // toDateInput.addEventListener('input', changeInputMonthValue);

    const firstRow = createFormRow('li', [
        createSelect(`rent_type-${idField}`, optionsDoctype7, 'Тип', isReadonly, data['rent_type'])
    ]);

    const secondRow = createFormRow('li', [
        createTextInput(`created-${idField}`, 'Реєстратор', isReadonly, data['created']),
        createTextInput(`rent_number-${idField}`, 'Номер', isReadonly, data['number']),
        createDateInput(`rent_date-${idField}`, 'Дата', isReadonly, data['date'])
    ]);

    const thirdRow = createFormRow('li', [
        createTextInput(`rent_subject-${idField}`, 'Тема', isReadonly, data['subject'])
    ]);

    const dataCost = data['cost'] ? data['cost'].toString().replace(',', '.') : data['cost'];
    const dataCostCondition = data['cost_condition'] ? data['cost_condition'].toString().replace(',', '.') : data['cost_condition'];

    const fourthRow = createFormRow('li', [
        createTextInput(`cost-${idField}`, 'Орендна плата', isReadonly, dataCost, /^-?\d*[,.]?\d*$/),
        createTextInput(`cost_condition-${idField}`, 'Орендна плата за умовою', isReadonly, dataCostCondition, /^-?\d*[,.]?\d*$/)
    ]);

    const fifthRow = createFormRow('li', [
        fromDateInput, // З
        toDateInput, // По
        monthInput // Місяців
    ]);

    const sixthRow = createFormRow('li', [
        createTextInput(`number_old-${idField}`, 'Минулий номер', isReadonly, data['number_old']),
        createDateInput(`date_old-${idField}`, 'Минула дата', isReadonly, data['date_old'])
    ]);

    const buttonsNavBlock = createButtonsNavBlock(idField, tabIndex, hasCardRent, isReadonly);

    formContent.append(firstRow, secondRow, thirdRow, fourthRow, fifthRow, sixthRow, idInput);
    tabContent.append(formContent, buttonsNavBlock);

    return tabContent;
}
//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------- LAND FIELD (FIRST) PAGE ------------------------------------------------------------
// show cadastral number on input change
function changeCadNum() {
    const form = document.querySelector('.form');
    const inputs = form.querySelectorAll('input');
    const spanCad = form.querySelectorAll('.span-cad');

    inputs.forEach(input => {
        const inputData = input.getAttribute('data-event');
        const inputDataField = input.getAttribute('data-field-index');
        spanCad.forEach(span => {
            const spanData = span.getAttribute('data-event');
            const spanDataFieldIndex = span.getAttribute('data-field-index');
            if (spanData == inputData && spanDataFieldIndex == inputDataField) {

                input.oninput = function () {
                    if (spanData == 'get-num') span.textContent = input.value;
                    else span.textContent = input.value;
                }

            }
        })
    })
}

// for radio button
function changeCadastralNum(e) {
    const value = e.target.value;
    const arrCadastralNum = document.querySelectorAll('.cadastral-num');
    const targetFieldIndex = e.target.getAttribute('data-field-index');
    const arrCadNumText = document.querySelectorAll('.cad-num-text');
    const arrCadNumField = document.querySelectorAll('.cad-num-field');

    Array.from(arrCadastralNum).forEach(el => {
        const elIdField = el.getAttribute('data-field-index');

        if (targetFieldIndex === elIdField) {
            if (value === 'num') el.classList.remove('invisible');
            if (value === 'code') el.classList.add('invisible');
        }
    });

    Array.from(arrCadNumText).forEach(el => {
        const elIdField = el.getAttribute('data-field-index');

        if (targetFieldIndex === elIdField) {
            if (value === 'num') el.textContent = "Кадастровий Номер:";
            if (value === 'code') el.textContent = "Обліковий Код:";
        }
    });

    Array.from(arrCadNumField).forEach(el => {
        const elIdField = el.getAttribute('data-field-index');
        const cadNum = el.querySelector('.span-cad');
        const text = cadNum.nextSibling;

        if (targetFieldIndex === elIdField) {
            if (value === 'num') {
                cadNum.classList.remove('invisible');
                text.textContent = ":";
            }
            if (value === 'code') {
                cadNum.classList.add('invisible');
                text.textContent = "";
            }
        }
    });
}

// change select (Вид права) to show input (Строк оренди)
// if (Вид права == Право оренди землі) input is visible
function changeSelectOwnership(e) {
    const targetFieldIndex = e.target.parentNode.getAttribute('data-field-index');
    const arrRentTermInput = document.querySelectorAll('input[name*=rent_term]');

    arrRentTermInput.forEach(rentTermInput => {
        const optionRentValue = e.target.options[e.target.selectedIndex].value;

        if (rentTermInput.parentNode.getAttribute('data-field-index') === targetFieldIndex) {
            if (optionRentValue == 2) rentTermInput.parentNode.classList.remove('invisible');
            else rentTermInput.parentNode.classList.add('invisible');
        }
    });
}
//------------------------------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------------------------------------------------
//----------------------------------------------------- SUBJECTS (SECOND) PAGE -------------------------------------------------------------
function createSubject(data = {}, idField = 1, index = 1, isReadonly = false) {
    if (Array.isArray(data)) return;
    if (Object.getOwnPropertyNames(data).length === 0) {
        data = {
            "id": null,
            "type": 1, // Фізична(0), Юридична(1), Фоп(2)

            // Дані фізичної особи
            "fiz": {
                "name": null, // Ім'я
                "surname": null, // Прізвище
                "patronymic": null, // По батькові
                "physical_doc_type": null, // Тип
                "physical_doc_series": null, // Серія
                "physical_doc_number": null, // Номер
                "physical_pin": null, // Ідентифікаційний код
                "address": null, // Адреса
            },

            // Дані юридичної особи
            "yur": {
                "legal_name": null, // Назва юридичної особи
                "legal_number": null, // Код юридичної особи
                "legal_doc_type": null, // Тип документа
                "legal_doc_number": null, // Номер документа
                "legal_doc_date": null, // Дата видачі
                "address": null, // Адреса
            },

            // Дані СПД ФОП
            "fop": {
                "fop_name": null, // Назва
                "fop_pin": null, // Код ІНН
                "address": null, // Адреса
                "fop_doc_type": null, // Тип
                "fop_doc_series": null, // Серія
                "fop_doc_number": null, // Номер
            }
        };
    };

    // hidden input 
    const idInput = createHiddenInput(`subject-id-${idField}`, data["id"]);

    const subjectBlock = createElem('div', ['form__content', 'subject-page__block'], '', index);
    const buttonClose = createButtonClose('btn-close', removeParentElement);
    const buttonCopySubject = createButtonAdd(['add-subject', 'btn-add'], "Копіювати суб'єкт +", idField);
    buttonCopySubject.addEventListener('click', copySubject);

    let subject;

    let legalRadioButton, phRadioButton, fopRadioButton;

    // todo: fiiiiiiiiiiiiixxxxx, pleeeeeeeeaaaaaaaaaaaasssssssssseeeeeee
    const subjectIndividual = createSubjectIndividual(data, idField, index, isReadonly);
    const subjectLegal = createSubjectLegal(data, idField, index, isReadonly);
    const subjectFop = createSubjectFop(data, idField, index, isReadonly);
    subjectIndividual.dataset.subject = 'individual';
    subjectLegal.dataset.subject = 'legal';
    subjectFop.dataset.subject = 'fop';

    if (Number(data['type']) == 0) {
        subject = createSubjectIndividual(data, idField, index, isReadonly);
        subjectLegal.classList.add('displayNone');
        subjectFop.classList.add('displayNone');
        legalRadioButton = createRadioLabel('Юридична', 'isLegal', `type_subject-${idField}-${index}`, 'change-person', idField, index, false, isReadonly);
        phRadioButton = createRadioLabel('Фізична', 'isPhysical', `type_subject-${idField}-${index}`, 'change-person', idField, index, isChecked, isReadonly);
        fopRadioButton = createRadioLabel('СПД ФОП', 'isFop', `type_subject-${idField}-${index}`, 'change-person', idField, index, false, isReadonly);
    } else if (Number(data['type']) == 1) {
        subject = createSubjectLegal(data, idField, index, isReadonly);
        subjectIndividual.classList.add('displayNone');
        subjectFop.classList.add('displayNone');
        legalRadioButton = createRadioLabel('Юридична', 'isLegal', `type_subject-${idField}-${index}`, 'change-person', idField, index, isChecked, isReadonly);
        phRadioButton = createRadioLabel('Фізична', 'isPhysical', `type_subject-${idField}-${index}`, 'change-person', idField, index, false, isReadonly);
        fopRadioButton = createRadioLabel('СПД ФОП', 'isFop', `type_subject-${idField}-${index}`, 'change-person', idField, index, false, isReadonly);
    } else {
        subject = createSubjectFop(data, idField, index, isReadonly);
        subjectIndividual.classList.add('displayNone');
        subjectLegal.classList.add('displayNone');
        legalRadioButton = createRadioLabel('Юридична', 'isLegal', `type_subject-${idField}-${index}`, 'change-person', idField, index, false, isReadonly);
        phRadioButton = createRadioLabel('Фізична', 'isPhysical', `type_subject-${idField}-${index}`, 'change-person', idField, index, false, isReadonly);
        fopRadioButton = createRadioLabel('СПД ФОП', 'isFop', `type_subject-${idField}-${index}`, 'change-person', idField, index, isChecked, isReadonly);
    }

    legalRadioButton.addEventListener('change', changePerson);
    phRadioButton.addEventListener('change', changePerson);
    fopRadioButton.addEventListener('change', changePerson);

    const radioField = createRadioField( // first row
        [legalRadioButton, phRadioButton, fopRadioButton],
        'Особа',
        isRequired
    );



    subjectBlock.setAttribute('data-field-index', idField);
    subjectBlock.setAttribute('data-index', index);

    if (isReadonly) subjectBlock.append(radioField, subject, idInput);
    else subjectBlock.append(buttonClose, radioField, subjectIndividual, subjectLegal, subjectFop, buttonCopySubject, idInput);

    return subjectBlock;
}

function copySubject(e) {
    const subjectContainer = e.target.parentNode.parentNode;
    const targetIndexField = subjectContainer.getAttribute('data-field-index');
    const targetIndex = Number(subjectContainer.lastElementChild.getAttribute('data-index')) + 1;
    const data = getDataSubject(e.target.parentNode, true);

    const subjectBlock = addSubject(data, targetIndexField, targetIndex, false, subjectContainer);

    subjectBlock.scrollIntoView({
        behavior: 'smooth'
    });
}

function handleAddSubject(e) {
    //const result = showDialog('text');
    //console.log('confirm result', result); 

    const targetFieldIndex = e.target.getAttribute('data-field-index');
    const subjectPage = e.target.parentNode.previousElementSibling;

    const index = subjectPage.childNodes.length + 1;
    const subjectBlock = addSubject({}, targetFieldIndex, index, false, subjectPage);

    subjectBlock.scrollIntoView({
        behavior: 'smooth'
    });
}

function addSubject(data = {}, idField = 1, index = 1, isReadonly = false, subjectPage) {
    let newIndex;
    const arrSubjectsPage = Array.from(document.querySelectorAll('.subjects-page')); // container
    const arrSubjectsBlock = Array.from(document.querySelectorAll('.subjects-page__block')); // block
    const lastSubjectsBlock = arrSubjectsPage.lastElementChild;

    if (index) {
        newIndex = index;
    } else if (arrSubjectsBlock.length > 0) {
        const lastIndex = Number.parseInt(lastSubjectsBlock.getAttribute('data-index'));
        newIndex = lastIndex + 1;
    } else if (!lastSubjectsBlock) {
        newIndex = 1;
    }

    const subjectBlock = createSubject(data, idField, newIndex, isReadonly);

    if (subjectBlock) subjectPage.insertAdjacentElement("beforeEnd", subjectBlock);

    return subjectBlock;
}

function createSubjectLegal(data = {}, idField, index, isReadonly = false) {
    if (Object.getOwnPropertyNames(data).length === 0 || data.length === 0) {
        data = {
            "id": null,
            "type": 1, // Фізична(0), Юридична(1), Фоп(2)

            // Дані фізичної особи
            "fiz": {
                "name": null, // Ім'я
                "surname": null, // Прізвище
                "patronymic": null, // По батькові
                "physical_doc_type": null, // Тип
                "physical_doc_series": null, // Серія
                "physical_doc_number": null, // Номер
                "physical_pin": null, // Ідентифікаційний код
                "address": null // Адреса
            },

            // Дані юридичної особи
            "yur": {
                "legal_name": null, // Назва юридичної особи
                "legal_number": null, // Код юридичної особи
                "legal_doc_type": null, // Тип документа
                "legal_doc_number": null, // Номер документа
                "legal_doc_date": null, // Дата видачі
                "address": null // Адреса
            },

            // Дані СПД ФОП
            "fop": {
                "fop_name": null, // Назва
                "fop_pin": null, // Код ІНН
                "address": null, // Адреса
                "fop_doc_type": null, // Тип
                "fop_doc_series": null, // Серія
                "fop_doc_number": null, // Номер
            }
        };
    }

    const formContent = createElem('ul', ['form__content', 'person-content']);
    const optionsDoctype2 = JSON.parse(sessionStorage['data-doctype-2']); // select options data (Тип документа - Суб'єкти(Юдична))

    const firstRow = createFormRow('li', [
        createElem('h2', ['form__title', 'h2'], 'Дані юридичної особи')
    ]);

    const secondRow = createFormRow('li', [
        createTextInput(`legal_name-${idField}-${index}`, 'Назва юридичної особи', isReadonly, data.yur['legal_name']),
        createTextInput(`legal_number-${idField}-${index}`, 'Код юридичної особи', isReadonly, data.yur['legal_number'])
    ]);

    const thirdRow = createFormRow('li', [
        createTextInput(`address_yur-${idField}-${index}`, 'Aдреса', isReadonly, data.yur["address"]), // todo: cha+nge
    ]);

    const legalDocDate = createDateInput(`legal_doc_date-${idField}-${index}`, 'Дата видачі', isReadonly, data.yur['legal_doc_date']);

    const fourthRow = createFormRow('li', [
        createSelect(`legal_doc_type-${idField}-${index}`, optionsDoctype2, 'Тип документа', isReadonly, data.yur['legal_doc_type']),
        createTextInput(`legal_doc_number-${idField}-${index}`, 'Номер', isReadonly, data.yur['legal_doc_number']),
        legalDocDate
    ]);

    formContent.append(firstRow, secondRow, thirdRow, fourthRow);

    return formContent;
}

function createSubjectIndividual(data = {}, idField, index, isReadonly = false) {
    if (Object.getOwnPropertyNames(data).length === 0 || data.length === 0) {
        data = {
            "id": null,
            "type": 0, // Фізична(0), Юридична(1), Фоп(2)

            // Дані фізичної особи
            "fiz": {
                "name": null, // Ім'я
                "surname": null, // Прізвище
                "patronymic": null, // По батькові
                "physical_doc_type": null, // Тип
                "physical_doc_series": null, // Серія
                "physical_doc_number": null, // Номер
                "physical_pin": null, // Ідентифікаційний код
                "address": null // Адреса
            },

            // Дані юридичної особи
            "yur": {
                "legal_name": null, // Назва юридичної особи
                "legal_number": null, // Код юридичної особи
                "legal_doc_type": null, // Тип документа
                "legal_doc_number": null, // Номер документа
                "legal_doc_date": null, // Дата видачі
                "address": null // Адреса
            },

            // Дані СПД ФОП
            "fop": {
                "fop_name": null, // Назва
                "fop_pin": null, // Код ІНН
                "address": null, // Адреса
                "fop_doc_type": null, // Тип
                "fop_doc_series": null, // Серія
                "fop_doc_number": null, // Номер
            }
        };
    };

    const formContent = createElem('ul', ['form__content', 'person-content']);
    const optionsDoctype1 = JSON.parse(sessionStorage['data-doctype-1']); // select option data (Тип - Суб'єкти(Фізична))

    const firstRow = createFormRow('li', [
        createElem('h2', ['form__title', 'h2'], 'Дані фізичної особи')
    ]);

    const secondRow = createFormRow('li', [
        createTextInput(`fiz_surname-${idField}-${index}`, 'Прізвище', isReadonly, data.fiz['surname']),
        createTextInput(`fiz_name-${idField}-${index}`, "Ім'я", isReadonly, data.fiz['name']),
        createTextInput(`fiz_patronymic-${idField}-${index}`, 'По батькові', isReadonly, data.fiz['patronymic']),
    ]);

    const thirdRow = createFormRow('li', [
        createTextInput(`address_fiz-${idField}-${index}`, 'Aдреса', isReadonly, data.fiz['address']),
    ]);

    const fourthRow = createFormRow('li', [
        createSelect(`physical_doc_type-${idField}-${index}`, optionsDoctype1, 'Тип', isReadonly, data.fiz['physical_doc_type']),
        createTextInput(`physical_doc_series-${idField}-${index}`, 'Серія', isReadonly, data.fiz['physical_doc_series']),
        createTextInput(`physical_doc_number-${idField}-${index}`, 'Номер', isReadonly, data.fiz['physical_doc_number']),
        createTextInput(`physical_pin-${idField}-${index}`, 'Ідентифікаційний код', isReadonly, data.fiz['physical_pin'])
    ]);

    formContent.append(firstRow, secondRow, thirdRow, fourthRow);

    return formContent;
}

function createSubjectFop(data = {}, idField, index, isReadonly = false) {
    if (Object.getOwnPropertyNames(data).length === 0 || data.length === 0) {
        data = {
            "id": null,
            "type": 2, // Фізична(0), Юридична(1), Фоп(2)

            // Дані фізичної особи
            "fiz": {
                "name": null, // Ім'я
                "surname": null, // Прізвище
                "patronymic": null, // По батькові
                "physical_doc_type": null, // Тип
                "physical_doc_series": null, // Серія
                "physical_doc_number": null, // Номер
                "physical_pin": null, // Ідентифікаційний код
                "address": null // Адреса
            },

            // Дані юридичної особи
            "yur": {
                "legal_name": null, // Назва юридичної особи
                "legal_number": null, // Код юридичної особи
                "legal_doc_type": null, // Тип документа
                "legal_doc_number": null, // Номер документа
                "legal_doc_date": null, // Дата видачі
                "address": null // Адреса
            },

            // Дані СПД ФОП
            "fop": {
                "fop_name": null, // Назва
                "fop_pin": null, // Код ІНН
                "address": null, // Адреса
                "fop_doc_type": null, // Тип
                "fop_doc_series": null, // Серія
                "fop_doc_number": null, // Номер
            }
        };
    };

    const formContent = createElem('ul', ['form__content', 'person-content']);
    const optionsDoctype1 = JSON.parse(sessionStorage['data-doctype-1']); // select option data (Тип - Суб'єкти(Фізична))

    const firstRow = createFormRow('li', [
        createElem('h2', ['form__title', 'h2'], 'Дані СПД ФОП')
    ]);

    const secondRow = createFormRow('li', [
        createTextInput(`fop_name-${idField}-${index}`, 'Назва', isReadonly, data.fop['fop_name']),
        createTextInput(`fop_pin-${idField}-${index}`, 'Код ІНН', isReadonly, data.fop['fop_pin'])
    ]);

    const thirdRow = createFormRow('li', [
        createTextInput(`address_fop-${idField}-${index}`, 'Aдреса', isReadonly, data.fop['address']),
    ]);

    const fourthRow = createFormRow('li', [
        createSelect(`fop_doc_type-${idField}-${index}`, optionsDoctype1, 'Тип', isReadonly, data.fop['fop_doc_type']),
        createTextInput(`fop_doc_series-${idField}-${index}`, 'Серія', isReadonly, data.fop['fop_doc_series']),
        createTextInput(`fop_doc_number-${idField}-${index}`, 'Номер', isReadonly, data.fop['fop_doc_number']),
    ]);

    formContent.append(firstRow, secondRow, thirdRow, fourthRow);

    return formContent;
}

// change content on radio button change (Юридична / Фізична / ФОП)
function changePerson(e) {
    const value = e.target.value;
    const subjectPageBlock = document.querySelectorAll('.subject-page__block');
    const targetFieldIndex = e.target.getAttribute('data-field-index');
    const targetIndex = e.target.getAttribute('data-index');

    Array.from(subjectPageBlock).forEach(el => {
        const elIdField = el.getAttribute('data-field-index');
        const elIndex = el.getAttribute('data-index');

        if (targetFieldIndex === elIdField && targetIndex === elIndex) {
            const subjectIndividual = el.querySelector('[data-subject="individual"]');
            const subjectLegal = el.querySelector('[data-subject="legal"]');
            const subjectFop = el.querySelector('[data-subject="fop"]');

            if (subjectLegal) subjectLegal.classList.add('displayNone');
            if (subjectIndividual) subjectIndividual.classList.add('displayNone');
            if (subjectFop) subjectFop.classList.add('displayNone');

            if (value === 'isPhysical') subjectIndividual.classList.remove('displayNone');
            if (value === 'isLegal') subjectLegal.classList.remove('displayNone');
            if (value === 'isFop') subjectFop.classList.remove('displayNone');
        }
    });
}
//------------------------------------------------------------------------------------------------------------------------------------------

//------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------- RIGHTS (THIRD) PAGE --------------------------------------------------------------
function createRights(data = {}, idField = 1, index = 1, isReadonly = false) {
    if (Array.isArray(data)) return;
    const rightsBlock = createElem('div', ['form__content', 'rights-page__block'], '', index, idField);
    const buttonClose = createButtonClose('btn-close', removeParentElement);
    const rights = createElem('ul', ['form__content']);

    const optionsDoctype4 = JSON.parse(sessionStorage['data-doctype-4']); // select options data (Тип - Речові права)

    // hidden input 
    const idInput = createHiddenInput(`rights-id-${idField}`, data["id"]);

    const firstRow = createFormRow('li', [
        createElem('h2', ['form__title', 'h2'], 'Речові права на майно')
    ]);

    const secondRow = createFormRow('li', [
        createSelect(`type-${idField}`, optionsDoctype4, 'Тип', isReadonly, data['type'])
    ]);

    const thirdRow = createFormRow('li', [
        createTextInput(`index_number-${idField}`, 'Індексний номер витягу', isReadonly, data["index_number"]),
        createTextInput(`entity_number-${idField}`, 'Номер запису права', isReadonly, data["entity_number"]),
        createDateInput(`register_date-${idField}`, 'Дата реєстрації', isReadonly, data["register_date"]),
    ]);

    const fourthRow = createFormRow('li', [
        createElem('h2', ['form__title', 'h2'], 'Підстава винекнення речового права (тільки майно)')
    ]);

    const fifthRow = createFormRow('li', [
        createTextInput(`stuff_type-${idField}`, 'Вид', isReadonly, data["stuff_type"]),
        createTextInput(`stuff_number-${idField}`, 'Номер', isReadonly, data["stuff_number"]),
        createTextInput(`stuff_other-${idField}`, 'Інше', isReadonly, data["stuff_other"]),
    ]);

    const sixthRow = createFormRow('li', [
        createTextArea(`other-${idField}`, 'Додатковий документ', isReadonly, data["other"])
    ]);

    const buttonCopyRights = createButtonAdd(['btn-add'], "Копіювати речове право +", idField);
    buttonCopyRights.addEventListener('click', copyRights);

    if (isReadonly) rights.append(firstRow, secondRow, thirdRow, fourthRow, fifthRow, sixthRow, idInput);
    else rights.append(firstRow, secondRow, thirdRow, fourthRow, fifthRow, sixthRow, buttonCopyRights, idInput);

    if (isReadonly) rightsBlock.append(rights);
    else rightsBlock.append(buttonClose, rights);

    return rightsBlock;
}

function copyRights(e) {
    const rightsContainer = e.target.parentNode.parentNode.parentNode;
    const targetIndexField = rightsContainer.getAttribute('data-field-index');
    const targetIndex = Number(rightsContainer.lastElementChild.getAttribute('data-index')) + 1;
    const data = getDataRights(rightsContainer, true);

    const rightsBlock = addRights(data, targetIndexField, targetIndex, false, rightsContainer);

    rightsBlock.scrollIntoView({
        behavior: 'smooth'
    });
}

function handleAddRights(e) {
    const targetFieldIndex = e.target.getAttribute('data-field-index');
    const rightsPage = e.target.parentNode.previousElementSibling;
    const index = rightsPage.childNodes.length + 1;

    const rightsBlock = addRights({}, targetFieldIndex, index, false, rightsPage);

    rightsBlock.scrollIntoView({
        behavior: 'smooth'
    });
}

function addRights(data = {}, idField = 1, index, isReadonly = false, rightsPage) {
    let newIndex;

    const arrRightsPage = Array.from(document.querySelectorAll('.rights-page')); // container
    const arrRightsBlock = Array.from(document.querySelectorAll('.rights-page__block')); // block

    const lastRightsBlock = arrRightsPage.lastElementChild;

    if (index) {
        newIndex = index;
    } else if (arrRightsBlock.length > 0) {
        const lastIndex = Number.parseInt(lastRightsBlock.getAttribute('data-index'));
        newIndex = lastIndex + 1;
    } else if (!lastRightsBlock) {
        newIndex = 1;
    }

    const rightsBlock = createRights(data, idField, newIndex, isReadonly);

    if (rightsBlock) rightsPage.insertAdjacentElement("beforeEnd", rightsBlock);

    return rightsBlock;
}
//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------- RENT (FOURTH) PAGE --------------------------------------------------------------
function changeInputMonthValue(e) {
    const targetFieldIndex = e.target.parentNode.getAttribute('data-field-index');

    const arrFromDateInput = Array.from(document.querySelectorAll("input[name*='from_date']"));
    const arrToDateInput = Array.from(document.querySelectorAll("input[name*='to_date']"));
    const arrMonthInput = Array.from(document.querySelectorAll("input[name*='month-']"));

    const fromDateValue = arrFromDateInput.find(input => input.parentNode.getAttribute('data-field-index') === targetFieldIndex).value;
    const toDateValue = arrToDateInput.find(input => input.parentNode.getAttribute('data-field-index') === targetFieldIndex).value;
    const monthInput = arrMonthInput.find(input => input.parentNode.getAttribute('data-field-index') === targetFieldIndex);
    const monthDiff = getMonthDiff(new Date(
        fromDateValue.split('.')[2],
        fromDateValue.split('.')[1],
        fromDateValue.split('.')[0]), new Date(
        toDateValue.split('.')[2],
        toDateValue.split('.')[1],
        toDateValue.split('.')[0]));
    if (monthDiff > 0) monthInput.value = monthDiff;
    else monthInput.value = 0;
}

function getMonthDiff(d1, d2) {
    var months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth() + 1;
    months += d2.getMonth();

    let isNextYearAndLessEqualDate = (d1.getFullYear() < d2.getFullYear() && d1.getDate() <= d2.getDate());
    let isCurrentYearAndLessMonthAndLessEqualDate = (d1.getFullYear() == d2.getFullYear() && d1.getMonth() < d2.getMonth() && d1.getDate() <= d2.getDate());

    if (isNextYearAndLessEqualDate || isCurrentYearAndLessMonthAndLessEqualDate) months += 1;

    return months <= 0 ? 0 : months;
}

//------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------- GENERAL FUNCTIONS ----------------------------------------------------------------
//  create elements
function createElem(elemName, className = [], text, dataIndex, dataFieldIndex) {
    const element = document.createElement(elemName);
    element.textContent = text;

    className.forEach(elemClass => {
        element.classList.add(elemClass);
    });

    if (dataIndex) element.setAttribute('data-index', dataIndex);
    if (dataFieldIndex) element.setAttribute('data-field-index', dataFieldIndex);
    return element;
}

function createNavButton(btnClass, text, dataFieldIndex, dataTab) {
    const navButton = document.createElement('button');
    navButton.type = 'button';
    navButton.classList.add('nav-button');
    navButton.classList.add(btnClass);
    navButton.classList.add('button');
    navButton.innerHTML = text;
    navButton.setAttribute('data-field-index', dataFieldIndex);
    navButton.setAttribute('data-tab', dataTab);
    return navButton;
}

function createButton(btnClass, text, type = 'button') {
    const button = document.createElement('button');
    button.type = type;
    button.classList.add(btnClass);
    button.classList.add('button');
    button.textContent = text;
    return button;
}

function createButtonAdd(className = [], text, dataFieldIndex = 1) {
    const button = document.createElement('button');
    button.textContent = text;
    button.type = 'button';
    button.setAttribute('data-field-index', dataFieldIndex);

    className.forEach(elemClass => {
        button.classList.add(elemClass);
    });
    button.classList.add('button');

    return button;
}

function createButtonClose(btnClass, callbackRemove) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add(btnClass);
    button.classList.add('button');
    button.addEventListener('click', callbackRemove);

    return button;
}

function createTextInput(name = '', labelText, isReadonly = false, value, pattern) {
    const formField = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');

    formField.classList.add('form__field');
    label.classList.add('label');
    input.classList.add('input');

    label.setAttribute('for', name);
    input.setAttribute('type', 'text');
    input.setAttribute('name', name);
    if (value == null || value == "") input.setAttribute('value', '');
    else if (value) input.setAttribute('value', value);

    if (isReadonly) input.readOnly = true;


    if (pattern) setInputFilter(input, value => pattern.test(value))

    label.textContent = labelText;

    formField.append(label, input);
    return formField;
}

function createTextArea(name = '', labelText, isReadonly = false, value) {
    const formField = document.createElement('div');
    const label = document.createElement('label');
    const textarea = document.createElement('textarea');

    formField.classList.add('form__field');
    label.classList.add('label');
    textarea.classList.add('textarea');

    label.setAttribute('for', name);
    textarea.setAttribute('name', name);
    if (value == null || value == "") textarea.value = '';
    else if (value) textarea.value = value;

    if (isReadonly) textarea.readOnly = true;

    label.textContent = labelText;

    formField.append(label, textarea);
    return formField;
}

function createDateInput(name = '', labelText, isReadonly = false, value) {
    const formField = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');

    formField.classList.add('form__field');
    label.classList.add('label');
    input.classList.add('input');
    label.setAttribute('for', name);
    input.setAttribute('name', name);
    input.dataset.provide = "datepicker";
    if (value) {
        const dateValue = value.split('T')[0];
        const dd = dateValue.split('-')[2];
        const mm = dateValue.split('-')[1];
        const yy = dateValue.split('-')[0];
        input.setAttribute('value', `${dd}.${mm}.${yy}`);
    }

    const validationText = document.createElement('p');
    validationText.textContent = 'Введіть дату з 1753 року по сьогднішню';
    validationText.classList.add('invalideInputText');

    $(input).on("change", function (e) {
        const timeNow = new Date().toJSON().slice(0,10).replace(/-/g,'/');
        const targetDate = new Date(convertDate(e.target.value, 'yyyy/mm/dd'));
        const nowDate = new Date(timeNow);
        const validYear = e.target.value.split('.')[2];

        if (targetDate > nowDate || validYear < 1753) {
            e.target.classList.add('invalideInput');
            e.target.parentNode.append(validationText);
            e.target.parentNode.classList.add('invalideInputContainer');
        } else {
            e.target.classList.remove('invalideInput');
            validationText.remove();
            e.target.parentNode.classList.remove('invalideInputContainer');
        }
    });

    if (name.includes('from_date') || name.includes('to_date')) {
        $(input).on("change", changeInputMonthValue);
    }

    if (isReadonly) {
        input.readOnly = true;
    }

    label.textContent = labelText;

    formField.append(label, input);
    return formField;
}

function createDisabledInput(name = '', text) {
    const formField = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');

    formField.classList.add('form__field');
    label.classList.add('label');
    input.classList.add('input');
    input.classList.add('input-disabled');

    label.setAttribute('for', name);
    input.setAttribute('type', type);
    input.setAttribute('name', name);

    input.disabled = true;
    input.value = text;

    label.textContent = '';


    formField.append(label, input);
    return formField;
}

function createInputOnChange(name = '', labelText, dataEvent, dataFieldIndex, isReadonly = false, value = null, maxLength, autofocus = false) {
    const formField = document.createElement('div');
    const label = document.createElement('label');
    const input = document.createElement('input');

    formField.classList.add('form__field');
    label.classList.add('label');
    input.classList.add('input');

    label.setAttribute('for', name);
    input.setAttribute('type', 'text');
    input.setAttribute('name', name);
    input.setAttribute('data-event', dataEvent);
    input.setAttribute('data-field-index', dataFieldIndex);
    if (value) input.setAttribute('value', value);

    if (maxLength) input.setAttribute('maxlength', maxLength);

    if (isReadonly) {
        input.readOnly = true;
    }

    label.textContent = labelText;

    if (autofocus) {
        input.addEventListener('input', () => {
            if (input.value.length === maxLength) input.parentNode.nextSibling.querySelector('input').focus();
        });
    }

    formField.append(label, input);
    return formField;
}

function createSelect(name = '', options = [], labelText, isReadonly = false, value) {
    const formField = document.createElement('div');
    const label = document.createElement('label');
    const select = document.createElement('select');

    formField.classList.add('form__field');
    label.classList.add('label');
    select.classList.add('select');

    label.setAttribute('for', name);
    select.setAttribute('name', name);

    if (isReadonly) {
        select.disabled = true;
    }

    label.textContent = labelText;

    Array.from(options).forEach(value => {
        const option = document.createElement('option');
        option.textContent = value.VAL;
        option.setAttribute('value', value.ID);
        select.append(option);
    });

    if (value) {
        select.value = value;
    }
    formField.append(label, select);

    return formField;
}

function createRadioField(radioButtons = [], title) {
    const formField = document.createElement('div');
    const radioTitle = document.createElement('p');

    formField.classList.add('form__field');
    radioTitle.classList.add('radio-title');

    radioTitle.textContent = title;

    formField.append(radioTitle);
    radioButtons.forEach(el => {
        formField.append(el);
    });

    return formField;
}

function createRadioLabel(labelText, value, name, dataEvent = '', idField = 1, index = 1, isChecked = false, isReadonly = false) {
    const radioLabel = document.createElement('label');
    const radio = document.createElement('input');

    radioLabel.classList.add('label--radio');

    if (isChecked) radio.checked = true;
    if (isReadonly) radio.setAttribute('disabled', true);

    radio.setAttribute('type', 'radio');
    radio.setAttribute('value', value);
    radio.setAttribute('name', name);
    radio.setAttribute('data-event', dataEvent);
    radio.setAttribute('data-field-index', idField);
    radio.setAttribute('data-index', index);

    radioLabel.append(radio, labelText);

    return radioLabel;
}

function createFormRow(element, children = []) {
    const row = document.createElement(element);

    row.classList.add('form__row');
    children.forEach(el => {
        row.append(el);
    });

    return row;
}

function createHiddenInput(name = '', value) {
    const input = document.createElement('input');

    input.classList.add('input');

    input.setAttribute('type', 'hidden');
    input.setAttribute('name', name);
    if (value == null || value == "") input.setAttribute('value', '');
    else if (value) input.setAttribute('value', value);

    return input;
}

function createInputFile(name = '', labelText = 'Оберіть файл') {
    const formFile = document.createElement('form');
    const label = document.createElement('label');
    const input = document.createElement('input');

    formFile.classList.add('form-file');
    formFile.id = 'form-xml';
    label.classList.add('label');
    input.classList.add('input');

    input.setAttribute('name', name);
    label.setAttribute('for', name);
    input.setAttribute('type', 'file');
    input.setAttribute("multiple", "");
    input.setAttribute("accept", ".xml");

    label.textContent = labelText;

    input.addEventListener('change', downloadFromXML);

    formFile.append(label, input);
    return formFile;
}

function createAlert(elem) {
    const container = document.createElement('div');
    const message = document.createElement('p');
    const buttonsBlock = document.createElement('div');
    const buttonYes = document.createElement('button');
    const buttonNo = document.createElement('button');

    // container.classList.add('modal-confirm');
    container.classList.add('confirm-alert', 'alert');
    container.classList.add('displayNone');
    buttonsBlock.classList.add('modal-confirm__buttons');
    buttonYes.classList.add('btn-yes');
    buttonNo.classList.add('btn-no');
    // message.textContent = text;
    buttonYes.textContent = 'ОК';

    buttonYes.addEventListener('click', () => {
        container.classList.add('displayNone');
        return true;
    });

    buttonsBlock.append(buttonYes);
    container.append(message, buttonsBlock);

    console.log('modal', modal);

    elem.append(container);
}

function showAlert(text) {
    const alert = document.querySelector('.alert');
    console.log('eto alert', alert);
    alert.querySelector('p').textContent = text;
    alert.classList.remove('displayNone');
}

function createDialog(elem, type) {
    const container = document.createElement('div');
    const message = document.createElement('p');
    const buttonsBlock = document.createElement('div');
    const buttonYes = document.createElement('button');
    const buttonNo = document.createElement('button');

    


    // container.classList.add('modal-confirm');
    container.classList.add('confirm-alert', 'confirm');
    container.classList.add('displayNone');
    buttonsBlock.classList.add('modal-confirm__buttons');
    buttonYes.classList.add('btn-yes');
    buttonNo.classList.add('btn-no');
    // message.textContent = text;
    buttonYes.textContent = 'Так';
    buttonNo.textContent = 'Ні';

    buttonYes.addEventListener('click', () => {
        container.classList.add('displayNone');
        return true;
    });
    buttonNo.addEventListener('click', () => {
        container.classList.add('displayNone');
        return false;
    });


    if(type === 'alert') {
        container.id = 'alert-dialog';
        buttonsBlock.append(buttonYes);
    } else if(type === 'confirm') {
        container.id = 'confirm-dialog';
        buttonsBlock.append(buttonYes, buttonNo);
    }

    
    container.append(message, buttonsBlock);

    console.log('modal', modal);

    elem.append(container);
}

async function showDialog(text, callbackYes, callbackNo) {
    modalConfirmOverlay.classList.add('active');
    let result;
    const confirm = modal.querySelector('#confirm-dialog');
    console.log('etttooo confirm', confirm);
    confirm.querySelector('p').textContent = text;
    confirm.classList.remove('displayNone');
    const buttonYes = confirm.querySelector('.btn-yes');
    const buttonNo = confirm.querySelector('.btn-no');

    buttonYes.addEventListener('click', () => {
        result = true;
        modalConfirmOverlay.classList.remove('active');
        // callbackYes();

    });
    buttonNo.addEventListener('click', () => {
        result = false;
        modalConfirm.classList.remove('active');
    });

    console.log('reeeee', result);

    return result;
}

//  remove elements 
function removeParentElement(e) {
    const target = e.target;
    const parent = target.parentElement;
    let result = confirm('Ви впевнені, що хочете видалити?');
    if (result) parent.remove();
}

function removeParentOfParentElement(e) {
    const target = e.target;
    const parent = target.parentElement;
    const parentOfParent = parent.parentElement;
    parentOfParent.remove();
}

//  regular
function setInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            }
        });
    });
}

// set on change event listener
function checkIsFormChanged() {
    const inputArr = document.querySelectorAll('input');
    const selectArr = document.querySelectorAll('select');
    const radioArr = document.querySelectorAll('radio');
    const textareaArr = document.querySelectorAll('textarea');
    setEventListener(inputArr);
    setEventListener(selectArr);
    setEventListener(radioArr);
    setEventListener(textareaArr);
}

function setEventListener(element) {
    element.forEach(el => {
        el.addEventListener('input', () => {
            formWasChanged = true;
        });
    })
}

// download data from XML 
async function downloadFromXML() {
    let result = confirm('Ви впевнені, що хочете завантажити із XML?');
    if (!result) return;
    const formFile = document.querySelector('#form-xml');
    const formFileInput = formFile.querySelector('input');
    const landBlockArr = document.querySelectorAll('.form__land-block-container');

    const resultArr = [];
    console.log(formFileInput.files);

    for (let el of formFileInput.files) {
        resultArr.push(await getFileReaderResult(el));
    }

    fetcher('/Services/CartService.asmx/GetRequestApplicationDataFromXML', {
            method: "POST",
            body: JSON.stringify({
                data: JSON.stringify(resultArr)
            }),
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            }
        })
        .then(r => r.text())
        .then(r => r.replace('{"d":null}', ""))
        .then(r => JSON.parse(r))
        .then(r => {
            if (r.NameErrors && r.NameErrors.length > 0) {
                let message = "Не валідні XML документи:\n";
                for (let error of r.NameErrors) {
                    message += "\n" + error;
                }
                alert(message);
            }
            console.log('resssss', r.Card);
            console.log('--===-', r.Card['objects'].length);
            if (r.Card['objects'].length > 0) {
                landBlockArr.forEach(el => {
                    el.remove();
                });
                r.Card.hasRent = incomingData.hasRent;
                setIncomingData(r.Card);
            }
        });
}

async function getFileReaderResult(el) {
    let fileReader = new FileReader();
    fileReader.readAsText(el);
    return await new Promise((resolve) => {
        fileReader.onload = () => {
            resolve({
                name: el.name,
                text: fileReader.result
            });
        }
    })
}

// todo: change type
function convertDate(dateValue, type) {
    const dd = dateValue.split('.')[0];
    const mm = dateValue.split('.')[1];
    const yy = dateValue.split('.')[2];

    if(type === 'yyyy/mm/dd') return `${yy}/${mm}/${dd}`;

    return `${yy}-${mm}-${dd}`;
}
//------------------------------------------------------------------------------------------------------------------------------------------



//------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------- SUBMIT FORM -------------------------------------------------------------------
function checkInputValue(block, name, oneWord = false) {
    const element = block.querySelector(name);
    if (!element) return null;
    else {
        if (oneWord) return element.value.split(' ').join('');
        return element.value;
    }
}

function checkRadioValue(block, name) {
    const elements = Array.from(block.querySelectorAll(name));
    if (!elements) return null;
    else return elements.find(el => el.checked).value;
}

function checkSelectValue(block, name) {
    const element = block.querySelector(name);
    if (!element) return null;
    else return element.options[element.selectedIndex].value;
}

function checkInputDate(block, name) {
    const dateValue = checkInputValue(block, name);
    if (!dateValue) return null;
    return convertDate(dateValue);
}

function getDataSubject(block, toCopy = false) {
    console.log('vot eto block', block);

    const subject = {
        "id": (toCopy ? null : checkInputValue(block, "input[name*='subject-id-']")),
        "type": checkRadioValue(block, "input[name*='type_subject-']") === "isPhysical" ? 0 : (checkRadioValue(block, "input[name*='type_subject-']") === "isLegal") ? 1 : 2, // Юридична / Фізична

        // Дані фізичної особи
        "fiz": {
            "name": checkInputValue(block, "input[name*='fiz_name-']", true), // Ім'я
            "surname": checkInputValue(block, "input[name*='fiz_surname-']", true), // Прізвище
            "patronymic": checkInputValue(block, "input[name*='fiz_patronymic-']", true), // По батькові
            "physical_doc_type": checkSelectValue(block, "select[name*='physical_doc_type-']"), // Тип
            "physical_doc_series": checkInputValue(block, "input[name*='physical_doc_series-']"), // Серія
            "physical_doc_number": checkInputValue(block, "input[name*='physical_doc_number-']"), // Номер
            "physical_pin": checkInputValue(block, "input[name*='physical_pin']"), // Ідентифікаційний код
            "address": checkInputValue(block, "input[name*='address_fiz-']"), // Адреса
        },

        // Дані юридичної особи
        "yur": {
            "legal_name": checkInputValue(block, "input[name*='legal_name-']"), // Назва юридичної особи
            "legal_number": checkInputValue(block, "input[name*='legal_number-']"), // Код юридичної особи
            "legal_doc_type": checkSelectValue(block, "select[name*='legal_doc_type-']"), // Тип документа
            "legal_doc_number": checkInputValue(block, "input[name*='legal_doc_number-']"), // Номер документа
            "legal_doc_date": checkInputDate(block, "input[name*='legal_doc_date-']"), // Дата видачі
            "address": checkInputValue(block, "input[name*='address_yur-']"), // Адреса
        },

        // Дані СПД ФОП
        "fop": {
            "fop_name": checkInputValue(block, "input[name*='fop_name-']"), // Назва
            "fop_pin": checkInputValue(block, "input[name*='fop_pin-']"), // Код ІНН
            "address": checkInputValue(block, "input[name*='address_fop-']"), // Адреса
            "fop_doc_type": checkSelectValue(block, "select[name*='fop_doc_type-']"), // Тип
            "fop_doc_series": checkInputValue(block, "input[name*='fop_doc_series-']"), // Серія
            "fop_doc_number": checkInputValue(block, "input[name*='fop_doc_number-']"), // Номер
        }
    }
    console.log('subject', subject);

    return subject;

}

function getDataRights(block, toCopy = false) {
    console.log('------- - - ------ -- - - - -- --- - -tuut field', block);

    const rightsEl = {
        "id": (toCopy ? null : checkInputValue(block, "input[name*='rights-id-']")),
        "type": checkSelectValue(block, "select[name*='type-']"), // Тип
        "index_number": checkInputValue(block, "input[name*='index_number-']"), // Індексний номер витягу
        "entity_number": checkInputValue(block, "input[name*='entity_number-']"), // Номер запису права
        "register_date": checkInputDate(block, "input[name*='register_date-']"), // Дата реєстрації

        //Підстава виникнення речового права (тільки майно)
        "stuff_type": checkInputValue(block, "input[name*='stuff_type-']"), // Вид
        "stuff_number": checkInputValue(block, "input[name*='stuff_number-']"), // Номер
        "stuff_other": checkInputValue(block, "input[name*='stuff_other-']"), //Інше
        "other": checkInputValue(block, "textarea[name*='other-']") // Додатковий документ
    };

    return rightsEl;
}

function getData(field, toCopy = false) {
    let formFields;
    if (field) formFields = [field];
    else formFields = Array.from(document.querySelectorAll('.form__land-block'));

    console.log('eettto field', formFields);

    const objects = [];
    formFields.forEach(field => {
        // Суб'єкти
        const subjectBlocks = Array.from(field.querySelectorAll('.subject-page__block'));
        const subjects = [];
        console.log('fiiiieeeeeld', field);
        if (subjectBlocks.length > 0) {
            subjectBlocks.forEach(block => {
                const subject = getDataSubject(block, toCopy);
                subjects.push(subject);
            });
        }

        // Речові права
        const rightsBlocks = Array.from(field.querySelectorAll('.rights-page__block'));
        const rights = [];
        if (rightsBlocks.length > 0) {
            rightsBlocks.forEach(block => {
                const rightsEl = getDataRights(block, toCopy);

                rights.push(rightsEl);
            });
        }

        const object = {
            // Земельна ділянка
            "info": {
                "id": (toCopy ? null : checkInputValue(field, "input[name*='info-id-']")),
                "cad_number_value": checkRadioValue(field, "input[name*='cad_number_value-']") === "num" ? 1 : 2, // Кадастровий Номер (1)/ Обліковий Код(2) 
                "zone": checkInputValue(field, "input[name*='zone-']"), // Зона
                "section": checkInputValue(field, "input[name*='section-']"), // Квартал
                "number": checkInputValue(field, "input[name*='number-']"), // Номер 
                "district": checkSelectValue(field, "select[name*='district-']"), // Район
                "address": checkInputValue(field, "input[name*='address-']"), // Адреса
                "address_optional": checkInputValue(field, "input[name*='address_optional-']"), // Довільна адреса (опціонально)
                "category": checkSelectValue(field, "select[name*='category-']"), // Категорія земель
                "assignment_old": checkInputValue(field, "input[name*='assignment_old-']"), // Цільове
                "assignment": checkSelectValue(field, "select[name*='assignment-']"), // Цільове з класифікатору
                "area": checkInputValue(field, "input[name*='area-']"), // Площа

                // Витяг з ДЗК
                "dzk_series": checkInputValue(field, "input[name*='dzk_series-']"), // Серія
                "dzk_number": checkInputValue(field, "input[name*='dzk_number-']"), // Номер
                "dzk_date": checkInputDate(field, "input[name*='dzk_date-']"), // Дата видачі

                // Витяг з ДРРП
                "drrp_series": checkInputValue(field, "input[name*='drrp_series-']"), // Серія
                "drrp_number": checkInputValue(field, "input[name*='drrp_number-']"), // Номер
                "drrp_date": checkInputDate(field, "input[name*='drrp_date-']"), // Дата видачі

                "ownership": checkSelectValue(field, "select[name*='ownership-']"), // Вид права
                "rent_term": checkInputValue(field, "input[name*='rent_term-']") // Строк оренди
            },

            // Суб'єкти
            "subjects": subjects,

            // Речові права
            "propertyRights": rights,

            // Оренда
            "rent": {
                "id": (toCopy ? null : checkInputValue(field, "input[name*='rent-id-']")),
                "rent_type": checkSelectValue(field, "select[name*='rent_type-']"), // Тип
                "cost": checkInputValue(field, "input[name*='cost-']") ? checkInputValue(field, "input[name*='cost-']").replace(',', '.') : checkInputValue(field, "input[name*='cost-']"), // Орендна плата
                "cost_condition": checkInputValue(field, "input[name*='cost_condition-']") ? checkInputValue(field, "input[name*='cost_condition-']").replace(',', '.') : checkInputValue(field, "input[name*='cost_condition-']"), // Орендна плата за умовою
                "number": checkInputValue(field, "input[name*='rent_number-']"), // Номер
                "number_old": checkInputValue(field, "input[name*='number_old-']"), // Минулий номер
                "subject": checkInputValue(field, "input[name*='rent_subject-']"), // Тема
                "date": checkInputDate(field, "input[name*='rent_date-']"), // Дата
                "date_old": checkInputDate(field, "input[name*='date_old-']"), // Минула дата
                "created": checkInputValue(field, "input[name*='created-']"), // Реєстратор
                "from_date": checkInputDate(field, "input[name*='from_date-']"), // З
                "to_date": checkInputDate(field, "input[name*='to_date-']"), // По
                "month": checkInputValue(field, "input[name*='month-']") // Місяців
            }
        }
        objects.push(object);
    });
    console.log('fiiiieeeeld', field);
    const data = {
        "readOnly": incomingData["readOnly"],
        // "typeId": incomingData["typeId"],
        // "number": incomingData["number"],
        "registrationDate": incomingData["registrationDate"],
        "state": incomingData["state"],
        "hasRent": incomingData["hasRent"],
        "objects": objects,
    }
    console.log('-----------type', data["typeId"]);

    return data;
}

function submitForm(e) {
    e.preventDefault();

    //todo: fix it !


    const data = getData();

    console.log('submit data', data);
    postData('/Services/CartService.asmx/PostRequestApplicationData', data);
}

function postData(url, data) {
    fetcher(url, {
            method: 'POST',
            body: JSON.stringify({
                'data': JSON.stringify(data)
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if (res.ok) {
                alert('Дані збережено');
                closeModals();
            } else alert('Введіть коректні дані');
        })
        .catch(error => console.error('Error:', error));
}