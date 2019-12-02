/**
 * 
 */

class DeckOfCards extends CardHolder{

    constructor(){
        super();
        // tell each card that I'm holding it
        for(let cardSuiteIndex=0;cardSuiteIndex<CARD_SUITES.length;cardSuiteIndex++)
            for(let cardNameIndex=0;cardNameIndex<CARD_NAMES.length;cardNameIndex++)
                new HoldableCard(cardSuiteIndex,cardNameIndex,this);
        console.log("Cards held by '"+this.toString()+"': "+this.getTextRepresentation()+".");
    }

    shuffle(){
        // how about taking a random one out and pushing it????
        // BUG FIX: oops, I think I should not push the splice itself BUT the first element of the splice!!!!
        let numberOfSwaps=this._cards.length*3;
        while(--numberOfSwaps>=0){
            this._cards.push(this._cards.splice(Math.floor(Math.random()*this._cards.length),1)[0]);
        }
        console.log("Cards shuffled!");
        console.log("Cards: \n"+this._cards.join("\n"));
    }

    toString(){return "Deck of cards";}

}