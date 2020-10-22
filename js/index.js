let selectNationsElement = document.getElementById('selectNations');
selectNationsElement.addEventListener('change', getShipList);

let shipList = {};

let shipOneElement = document.getElementById('shipOne');
let shipTwoElement = document.getElementById('shipTwo');
let calculateButton = document.getElementById('calculate');
calculateButton.addEventListener('click', checkValidInfo);

xhr("https://api.worldofwarships.eu/wows/encyclopedia/info/?application_id=2b95ef97df7b230ce7c6b2507d4cc0b7&language=fr&fields=ship_nations", fillNationList);

function xhr(url, callback){
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Typical action to be performed when the document is ready:
            callback(xhttp.responseText);
        }
    };
    xhttp.open("GET", url , true);
    xhttp.send();
}

function fillNationList(response){
    let responseParsed = JSON.parse(response);
    let nations = responseParsed.data.ship_nations;
    for(nation in nations){
        let option = document.createElement('option');
        option.innerHTML = nations[nation];
        option.value = nation;
        selectNationsElement.appendChild(option);
    }
}

function getShipList(e){
    let nationSelected = e.currentTarget.value;
    let url = "https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=2b95ef97df7b230ce7c6b2507d4cc0b7&nation="+nationSelected+"&language=fr";
    xhr(url, fillShipList);
}

function fillShipList(response){
    emptyShipList();
    let responseParsed = JSON.parse(response);
    let meta = responseParsed.meta;
    let data = responseParsed.data;
    
    shipList = {};
    
    for(ship in data){
        let shipInfo = data[ship];
        if(shipInfo.is_premium == 0 && shipInfo.is_special == 0){
            shipList[ship] = shipInfo;
            let option = document.createElement('option');
            option.innerHTML = shipInfo.name;
            option.value = ship;
            option.setAttribute('data-tier', shipInfo.tier);
            optionTwo = option.cloneNode(true);
            shipOneElement.appendChild(option);
            shipTwoElement.appendChild(optionTwo);
        }
    }
    console.log(shipList);
    
    shipOneElement.value = 0;
    shipTwoElement.value = 0;
}

function emptyShipList(){
    shipOneElement.innerHTML = "";
    shipTwoElement.innerHTML = "";
    let opt = document.createElement('option');
    opt.innerHTML = "Sélectionner un navire";
    opt.disabled = true;
    opt.selected = true;
    opt.value = 0;
    optTwo = opt.cloneNode(true);
    shipOneElement.appendChild(opt);
    shipTwoElement.appendChild(optTwo);
}

function checkValidInfo(e){
    e.preventDefault();
    e.stopPropagation();
    
    let shipOneOptionSelected = shipOneElement.options[shipOneElement.selectedIndex];
    let shipTwoOptionSelected = shipTwoElement.options[shipTwoElement.selectedIndex];
    
    if(shipOneOptionSelected.value != 0 && shipTwoOptionSelected.value != 0){
        if(parseInt(shipOneOptionSelected.getAttribute('data-tier')) < parseInt(shipTwoOptionSelected.getAttribute('data-tier'))){
            let arrayShipList = [];
            let arrayStart = [shipOneOptionSelected.value];
            arrayShipList.push(arrayStart);
            getAllShipPath(arrayShipList, checkIfShipInPath);
            
            function checkIfShipInPath(listPath){
                foundValidPath = false;
                for(let k = 0; k < listPath.length; k++){
                    let path = listPath[k];
                    if(path.includes(shipOneOptionSelected.value) && path.includes(shipTwoOptionSelected.value)){
                        calculateXpValue(path, shipOneOptionSelected.value, shipTwoOptionSelected.value);
                        foundValidPath = true;
                    }
                }
                if(foundValidPath == false){
                    alert('Aucune chemin valide entre ces deux navires');
                }
            };
        }else{
            alert('Merci de sélectionner un navire 1 de tier inférieur au navire 2');
        }
    }else{
        alert('Merci de sélectionner deux navires');
    }
}

function getAllShipPath(arrayShips, callback){
    let newArrayShips = [];
    let haveNextShip = false;
    for(let i = 0; i < arrayShips.length; i++){
        let arrayShip = arrayShips[i];
        let nextShipList = shipList[arrayShip[arrayShip.length-1]].next_ships;
        if(Object.keys(nextShipList).length === 0 && nextShipList.constructor === Object){
            newArrayShips.push(arrayShip);
        }else{
            haveNextShip = true;
            for(ship in nextShipList){
                let newArrayShip = [...arrayShip];
                newArrayShip.push(ship);
                newArrayShips.push(newArrayShip);
            }
        }
    }
    if(!haveNextShip){
        callback(arrayShips);
    }else{
        getAllShipPath(newArrayShips,callback);    
    }    
};

function calculateXpValue(path, shipIdOne, shipIdTwo){    
    listShipId = path.slice(path.indexOf(shipIdOne),path.indexOf(shipIdTwo)+1);
    let xpCount = 0;
    for(let k = 0; k < listShipId.length; k++){
        let shipInfo = shipList[listShipId[k]];
        if(k == 0){
            for(let ship in shipList){
                for(let nextShip in shipList[ship].next_ships){
                    console.log(nextShip);
                    console.log(shipList[ship].next_ships[nextShip]);
                    if(nextShip == listShipId[k]){
                        console.log(true);
                        xpCount+= shipList[ship].next_ships[nextShip]
                    }
                }
            }
        }        
        for(let nextShip in shipInfo.next_ships){
            if(listShipId.includes(nextShip)){
                xpCount+= shipInfo.next_ships[nextShip];
            }
        }
        for(let modulesId in shipInfo.modules_tree){
            let module = shipInfo.modules_tree[modulesId];
            if(module.next_ships != null){
                for(let nextShip in module.next_ships){
                    let shipIdToCompare = module.next_ships[nextShip];
                    for(let k = 0; k < listShipId.length; k++){
                        if(shipIdToCompare == listShipId[k]){
                            xpCount+= module.price_xp;
                        }
                    }
                }
            }
        }
    }
    alert(xpCount);
}