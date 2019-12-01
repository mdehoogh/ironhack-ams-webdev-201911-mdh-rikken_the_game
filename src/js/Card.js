/**
 * definition of a playing Card
 */
String.prototype.capitalize=function(){
    return (this.length>0?this[0].toUpperCase()+this.slice(1):this);
}

const CARD_SUITES=["diamond","club","heart","spade"];
const CARD_NAMES=["two","three","four","five","six","seven","eight","nine","ten","jack","queen","king","ace"];

const RANK_TWO=0,RANK_THREE=1,RANK_FOUR=2,RANK_FIVE=3,RANK_SIX=4,RANK_SEVEN=5,RANK_EIGHT=6,RANK_NINE=7,RANK_TEN=8,RANK_JACK=9,RANK_QUEEN=10,RANK_KING=11,RANK_ACE=12;


class Card{

    constructor(cardSuiteIndex,cardNameIndex){
        this._cardSuiteIndex=cardSuiteIndex;
        this._cardNameIndex=cardNameIndex;
    }
    toString(){
        return CARD_NAMES[this._cardNameIndex].capitalize()+" of "+CARD_SUITES[this._cardSuiteIndex]+"s";
    }
    
    get rank(){return this._cardNameIndex;}
    get suite(){return this._cardSuiteIndex;}

}