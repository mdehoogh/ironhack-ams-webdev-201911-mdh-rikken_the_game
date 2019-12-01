/**
 * a placeholder for a player
 */

/**
 * a Player can make a bid, or play a card
 */
class PlayerEventListener{
    bidMade(){}
    cardPlayed(){}
}

// the base class of all Player instances
// would be defined abstract in classical OO
class Player extends CardHolder{

    addEventListener(playerEventListener){
        if(playerEventListener&&playerEventListener instanceof PlayerEventListener)
            this._eventListeners.push(playerEventListener);
        console.log("Player '"+this.name+"' event listeners: "+this._eventListeners+".");
    }

    constructor(name,playerEventListener){
        super();
        this.name=name;
        if(playerEventListener&&!(playerEventListener instanceof PlayerEventListener))
            throw new Error("Player event listener of wrong type.");
        this._eventListeners=[];
        this._bid=-1; // the last bid of this player
        this.addEventListener(playerEventListener);
    }

    get bid(){return this._bid;}
    
    addCard(card){
        super.addCard(card);
        console.log("Player '"+this+"' received card '"+card+"'.");
    }

    _getCardsOfSuite(cardSuite,whenNotFoundCard){
        return this.cards.filter((card)=>{return(card.suite==cardSuite);});
    }

    // can be asked to play a card of a given card suite (or any card if cardSuite is undefined)
    contributeToTrick(trick) {
        if(this._cards.length==0)throw new Error("No cards left to play!");
        let cardsOfSuite=this._getCardsOfSuite(cardSuite);
        let card=(cardsOfSuite&&cardsOfSuite.length>0?cardsOfSuite[0]:this._cards[0]);
        card.holder=trick; // move the card to the trick
    }

    // to signal having made a bid
    bidMade(){if(this._eventListeners)this._eventListeners.forEach((eventListener)=>{eventListener.bidMade();});}

    // to signal having played a card
    cardPlayed(){if(this._eventListeners)this._eventListeners.forEach((eventListener)=>{eventListener.cardPlayed();});}
    
    // can be asked to make a bid passing in the highest bid so far
    // NOTE this would be an 'abstract' method in classical OO
    makeABid(playerbids){
        // assumes that this player has made a bid before, or that this is the first bid
        // this default implementation assumes to be running in a browser so we can use prompt()
        // all other available bids should be better than the last bid by any other player
        let highestBidSoFar=BID_PAS;
        if(playerbids){
            console.log("Player bids:",playerbids);
            for(let player=0;player<playerbids.length;player++)
                if(playerbids[player].length>0&&playerbids[player][0]>highestBidSoFar)
                    highestBidSoFar=playerbids[player][0];
        }
        console.log("Highest bid so far: '"+BID_NAMES[highestBidSoFar]+"'.");
        // if the highest possible bid is not a bid all can play (at the same time), can't be bid again
        if(BIDS_ALL_CAN_PLAY.indexOf(BID_NAMES[highestBidSoFar])<0)highestBidSoFar++;
        let possibleBidNames=BID_NAMES.slice(highestBidSoFar);
        possibleBidNames.unshift(BID_NAMES[BID_PAS]); // user can always 'pas'
        console.log("Possible bids: ",possibleBidNames);
        this._bid=-1;
        while(this._bid<0){
            let bidname=prompt("@"+this.name+" What is your bid (options: '"+possibleBidNames.join("', '")+"')?",possibleBidNames[0]);
            this._bid=BID_NAMES.indexOf(bidname);
        }
        this.bidMade();
    }

    // can be asked to play a card and add it to the given trick
    // NOTE this would be an 'abstract' method in classical OO
    playACard(trick){
    }

    toString(){return this.name;}

}