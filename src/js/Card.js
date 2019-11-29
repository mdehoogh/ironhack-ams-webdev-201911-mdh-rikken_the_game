/**
 * definition of a playing Card
 */
String.prototype.capitalize=function(){
    return (this.length>0?this[0].toUpperCase()+this.slice(1):this);
}

const CARD_SUITES=["diamond","club","heart","spade"];
const CARD_NAMES=["two","three","four","five","six","seven","eight","nine","ten","jack","queen","king","ace"];

class Card{

    constructor(cardSuiteIndex,cardNameIndex){
        this.cardSuiteIndex=cardSuiteIndex;
        this.cardNameIndex=cardNameIndex;
    }
    toString(){
        return CARD_NAMES[this.cardNameIndex].capitalize()+" of "+CARD_SUITES[this.cardSuiteIndex]+"s";
    }
    
    compareTo(card){return this.value-card.value;}

    get rank(){return cardNameIndex;}
    get suite(){return this.cardSuiteIndex;}

}