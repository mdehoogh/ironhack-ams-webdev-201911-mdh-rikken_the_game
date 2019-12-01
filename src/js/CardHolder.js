/**
 * defines someone that holds a given card
 */
class CardHolder{
    constructor(){
        this._cards=[];
    }
    removeCard(card){
        this._cards.splice(this._cards.indexOf(card),1);
    }
    addCard(card){
        this._cards.push(card);
    }
    getNumberOfCardsWithRank(rank){
        let numberOfCardsWithRank=0;
        let card=this._cards.length;while(--card>=0&&numberOfCardsWithRank<4)if(this._cards[card].rank===rank)numberOfCardsWithRank++;
        // replacing: this._cards.forEach((card)=>{if(card.rank===rank)numberOfCardsWithRank++;});
        return numberOfCardsWithRank;
    }
}

/**
 * a card with a card holder is held
 */
class HoldableCard extends Card{

    set holder(holder){
        if(this._holder)this._holder.removeCard(this);
        this._holder=holder;
        if(this._holder)this._holder.addCard(this);
    }

    constructor(cardSuiteIndex,cardNameIndex,holder){
        super(cardSuiteIndex,cardNameIndex);
        this._holder=null;
        this.holder=holder;
    }


}