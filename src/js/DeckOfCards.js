/**
 * 
 */

class DeckOfCards extends CardHolder{

    constructor(){
        super();
        // tell each card that I'm holding it
        for(let cardSuiteIndex=0;cardSuiteIndex<CARD_SUITES.length;cardSuiteIndex++)
            for(let cardNameIndex=0;cardNameIndex<CARD_NAMES.length;cardNameIndex++)
                new HoldableCard(cardSuiteIndex,cardNameIndex).holder=this;
    }

    getFirstCard(){if(this._cards.length>0)return this._cards[0];}

    shuffle(){
        // how about taking a random one out and pushing it????
        let numberOfSwaps=this._cards.length*3;
        while(--numberOfSwaps>=0){
            this._cards.push(this._cards.splice(Math.floor(Math.random()*this._cards.length),1));
        }
        console.log("Cards shuffled!");
        console.log("Cards: \n"+this._cards.join("\n"));
    }

}