let buttonSide;
let selected = getData('selected');
let rate;
update_text();
modalButtons();



function modalButtons() {
    let modalSelect = document.getElementById('list');

    for (const [alias, currency] of Object.entries(labels)) {
        const buttons = document.createElement('BUTTON');
        buttons.innerHTML = `<b>${alias}</b>  ---  ${currency}`;
        buttons.className = "listButton";
        buttons.setAttribute('data-bs-dismiss', 'modal');
        buttons.addEventListener('click', () => { selectedCurrency(alias); });
        modalSelect.appendChild(buttons);
    }
}

function switchButton() {
    selected.reverse();
    update_text();
}

function update_text() {
    storeData('selected', selected);
    rate = calculateRate();
    document.getElementById('left').innerHTML = selected[0];
    document.getElementById('right').innerHTML = selected[1];
    document.getElementById('fullNames').innerHTML = `${labels[selected[0]]} - ${labels[selected[1]]}`;
    document.getElementById('rateButton').innerHTML = `1 ${selected[0]} = ${rate.toFixed(3)} ${selected[1]}`;
}

function updateValues(value) {
    document.getElementById('valueInput').innerHTML = `<b>${value}</b> <sub><h6>&nbsp; ${selected[0]}</h6></sub>`;
    document.getElementById('outputValue').innerHTML = `<b>${(value * rate).toFixed(2)}</b><sub><h3>&nbsp; ${selected[1]}</h3></sub>`;

}

function pressedButton(side) {
    buttonSide = side;
}

function selectedCurrency(alias) {
    selected[buttonSide] = alias;
    update_text();
}

function calculateRate() {
    return (getData(selected[1]) / getData(selected[0]));
}

function lastUpdate() {
    toast(`last update ${getData('date')}`);
}

function toast(args) {
    window.plugins.toast.showWithOptions(
        {
            message: args,
            duration: "short",
            position: "bottom",
            addPixelsY: -140,
            styling: {
                opacity: 0.75,
                backgroundColor: '#32393d',
                textColor: '#e2eaef',
                textSize: 18,
                cornerRadius: 16,
                horizontalPadding: 5,
                verticalPadding: 0
            }
        },
    );
}
