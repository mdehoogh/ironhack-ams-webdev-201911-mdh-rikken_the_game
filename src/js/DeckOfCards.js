/**
 * 
 */

class DeckOfCards extends CardHolder{

    _shuffle(){
        // how about taking a random one out and pushing it????
        // BUG FIX: oops, I think I should not push the splice itself BUT the first element of the splice!!!!
        let numberOfSwaps=this._cards.length*3;
        while(--numberOfSwaps>=0)this._cards.push(this._cards.splice(Math.floor(Math.random()*this._cards.length),1)[0]);
        console.log("Deck of cards: \n"+this._cards.join("\n"));
    }

    shuffle(count,from,to){
        console.log("Shuffling the deck of "+this.numberOfCards+" cards.");
        while(--count>=0){
            let topop=to+Math.floor(to-from);
            console.log("Number of card to pop in shuffling: "+topop+".");
            while(--topop>=0)this._cards.unshift(this._cards.pop());
        }
        console.log("Deck of cards shuffled!");
        console.log("Cards held by '"+this.toString()+"': "+this.getTextRepresentation()+".");
    }

    constructor(){
        super();
        // tell each card that I'm holding it
        for(let suiteIndex=0;suiteIndex<SUITE_NAMES.length;suiteIndex++)
            for(let rankIndex=0;rankIndex<RANK_NAMES.length;rankIndex++)
                new HoldableCard(suiteIndex,rankIndex,this);
        // let's do an initial shuffle
        this._shuffle(); // replacing: this.shuffle(4,13,39);
    }

    toString(){return "Deck of cards";}

}