
function setInfo(info){
    document.getElementById('info').innerHTML=info;
}
function clearInfo(){
    document.getElementById('info').innerHTML="";
}

String.prototype.capitalize=function(){return(this.length>0?this[0].toUpperCase()+this.substring(1):"");}

const PAGES=["page-rules","page-settings","page-setup-game","page-bidding","page-initiate-playing","page-playing"];

var currentPage; // the current page

var rikkenTheGame=null; // the game (engine) in charge of managing playing the game

var currentPlayer=null;
function bidButtonClicked(event){
    let bid=parseInt(event.currentTarget.id.substring(4));
    console.log("Gekozen bod: ",bid);
    currentPlayer.setBid(bid); // the value of the button is the made bid
}
var bidderCardsElement=document.getElementById("bidder-cards");
function toggleBidderCards(event){
    if(event.currentTarget.value.length>0){
        event.currentTarget.innerHTML="Verberg kaarten";
        bidderCardsElement.innerHTML=event.currentTarget.value;
        event.currentTarget.value="";
    }else{
        event.currentTarget.innerHTML="Toon kaarten";
        event.currentTarget.value=bidderCardsElement.innerHTML;
        bidderCardsElement.innerHTML="";
    }
}
class OnlinePlayer extends Player{
    constructor(name){
        super(name);
    }
    // make a bid is called with 
    makeABid(playersBids,possibleBids){
        currentPlayer=this; // remember the current player
        console.log("Possible bids player '"+this.name+"' could make: ",possibleBids);
        //setInfo("Maak een keuze uit een van de mogelijke biedingen.");
        document.getElementById("bidder").innerHTML=this.name;
        bidderCardsElement.innerHTML="";
        document.getElementById("toggle-bidder-cards").value=this.getTextRepresentation("<br>");
        document.getElementById("toggle-bidder-cards").innerHTML="Toon kaarten";
        // only show the buttons
        for(let bidButton of document.getElementById("bid").querySelectorAll("input[type=button]")){
            bidButton.style.display=(possibleBids.indexOf(parseInt(bidButton.id.substring(4)))>=0?"initial":"none");
        }
        // show the player bids in the body of the bids table
        let bidTable=document.getElementById("bids-table").querySelector("tbody");
        for(let bid=0;bid<playersBids.length;bid++){
            bidTable.children[bid].children[1].innerHTML=rikkenTheGame.getPlayerName(bid).capitalize();
            bidTable.children[bid].children[1].innerHTML=playersBids[bid].join(" ");
        }
    }
    playACard(){
        alert("Player '"+this.name+"' should play a card!");
    }
}

class OnlineRikkenTheGameEventListener extends RikkenTheGameEventListener{
    stateChanged(rikkenTheGame){
        switch(rikkenTheGame.state){
            case IDLE:
                setInfo("Een spel is aangemaakt.");
                break;
            case DEALING:
                setInfo("De kaarten worden geschud en gedeeld.");
                break;
            case BIDDING:
                setPage("page-bidding");
                break;
            case INITIATE_PLAYING:
                setPage("page-initiate-playing");
                break;
            case PLAYING:
                setPage("page-playing");
                break;
        }
        console.log("ONLINE >>> The state of rikkenTheGame changed to '"+rikkenTheGame.state+"'.");
    }
    chooseTrumpSuite(){

    }
    choosePartnerSuite(){

    }
}
var onlineRikkenTheGameEventListener=new OnlineRikkenTheGameEventListener();

function setPage(newPage){
    currentPage=newPage;
    console.log("Current page: '"+currentPage+"' - Requested page: '"+newPage+"'.");
    // NOTE not changing currentPage to page until we have done what we needed to do
    PAGES.forEach(function(_page){
        let showPage=(_page===currentPage);
        console.log((showPage?"Showing ":"Hiding ")+" '"+_page+"'.");
        let pageElement=document.getElementById(_page);
        if(pageElement){
            pageElement.style.visibility=(showPage?"visible":"hidden");
            if(showPage){
                switch(PAGES.indexOf(_page)){
                    case 0:
                        {
                            setInfo("Stel de spelregels in.");
                        }
                        break;
                    case 1:
                        {
                            setInfo("Kies de speelwijze.");
                        }
                        break;
                    case 2:
                        {
                            setInfo("Vul de namen van de spelers in. Een spelernaam is voldoende.");
                        }
                        break;
                    case 3:
                        {
                            setInfo("Wacht om de beurt op een verzoek tot het doen van een bod.");
                            // did the players change? then we create a new rikkenTheGame
                        }
                    break;
                    case 4:
                        {
                            setInfo("Wacht op het verzoek tot het opgeven van de troefkleur en/of de aas/heer.");
                        }
                        break;
                    case 5:
                        {
                            setInfo("Wacht op het verzoek tot het (bij)spelen van een kaart.");
                        }
                        break;
                }
            }    
        }else
            alert("BUG: Unknown page '"+_page+"' requested!");
    });
}
function nextPage(event){
    let pageIndex=PAGES.indexOf(currentPage);
    setPage(PAGES[(pageIndex+1)%PAGES.length]);
}
function cancelPage(event){
    // go one page back
    let pageIndex=PAGES.indexOf(currentPage);
    setPage(PAGES[(pageIndex+PAGES.length-1)%PAGES.length]);
}
/**
 * to be called when the new-players button is clicked, to start a new game with a new set of players
 */
function newPlayers(){
    let players=[];
    let noPlayerNames=true;
    // iterate over all player input fields
    for(playerNameInput of document.getElementsByClassName("player-name-input")){
        if(playerNameInput.value.length>0){
            noPlayerNames=false;
            players.push(new OnlinePlayer(playerNameInput.value));
        }else
        if(players.length<4)
            players.push(null);
    }
    if(noPlayerNames){
        setInfo("Geen spelernamen opgegeven. Heb tenminste een spelernaam nodig!");
        return;
    }
    // try to create a game
    rikkenTheGame=null;
    try{
        rikkenTheGame=new RikkenTheGame(players,onlineRikkenTheGameEventListener);
        rikkenTheGame.start();
    }catch(error){
        setInfo("De volgende fout is opgetreden: "+error);
    }
}

window.onload=function(){
    // allow clearing the info by clicking it!!
    document.getElementById('info').onclick=clearInfo;
    // attach nextPage and cancelPage to any of the buttons in page-button-groups
    let pageButtonGroups=document.getElementsByClassName("page-button-group");
    for(let pageButtonGroup of pageButtonGroups){
        let pageButtons=pageButtonGroup.getElementsByTagName("button");
        for(let pageButton of pageButtons){
            if(pageButton.classList.contains("next"))pageButton.onclick=nextPage;else
            if(pageButton.classList.contains("cancel"))pageButton.onclick=cancelPage;else
            if(pageButton.classList.contains("new-players"))pageButton.onclick=newPlayers;
        };
    };
    // attach an onclick event handler for all bid buttons
    for(let bidButton of document.getElementById("bid").querySelectorAll("input[type=button]"))
        bidButton.onclick=bidButtonClicked;
    document.getElementById("toggle-bidder-cards").onclick=toggleBidderCards;
    this.setPage(PAGES[0]);
};