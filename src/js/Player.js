/**
 * a placeholder for a player
 */
class Player extends CardHolder{

    constructor(name){
        super();
        this.name=name;
    }

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

    toString(){return this.name;}

}